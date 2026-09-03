export interface CardStyle {
  id: string;
  name: string;
  bgClass: string;
  textClass: string;
  accentColor: string;
  isDarkLogo?: boolean;
}

export interface BackgroundOption {
  id: string;
  name: string;
  image: string;
  themeColor: string;
}

export interface WatermarkConfig {
  id: string | null;
  rotation: number;
  scale: number;
  x: number;
  y: number;
}

export type ThemeMode = 'light' | 'dark' | 'system';

export const cardStyles: CardStyle[] = [
  { id: 'classic', name: 'Классика', bgClass: 'bg-[#E33125]', textClass: 'text-[#19181F]', accentColor: '#E33125', isDarkLogo: true },
  { id: 'honey', name: 'Медовый', bgClass: 'bg-[#E5A93C]', textClass: 'text-[#19181F]', accentColor: '#E5A93C', isDarkLogo: true },
  { id: 'vanilla', name: 'Ванильный', bgClass: 'bg-[#F3E5AB]', textClass: 'text-[#19181F]', accentColor: '#D4C381', isDarkLogo: true },
  { id: 'coffee', name: 'Кофейный', bgClass: 'bg-[#4A3B32]', textClass: 'text-white', accentColor: '#4A3B32', isDarkLogo: false },
  { id: 'dark', name: 'Темный', bgClass: 'bg-[#1C1C1E]', textClass: 'text-white', accentColor: '#1C1C1E', isDarkLogo: false },
];

export const backgroundOptions: BackgroundOption[] = [
  { id: 'classic', name: 'Классика', image: '/background2.png', themeColor: '#5491D0' },
  { id: 'rain', name: 'Ливень', image: '/rain.png', themeColor: '#6C7D8D' },
  { id: 'rise', name: 'Рассвет', image: '/rise.png', themeColor: '#BD9490' },
];

const rawWatermarks = import.meta.glob('/public/*.PNG');
export const availableWatermarks = Object.keys(rawWatermarks)
  .map((path) => path.replace('/public/', ''))
  .sort();

export const getStoredStyleId = (): string => {
  if (typeof window === 'undefined') return 'classic';
  return localStorage.getItem('kumpel_styleId') || 'classic';
};

export const setStoredStyleId = (id: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('kumpel_styleId', id);
};

export const getStoredBgId = (): string => {
  if (typeof window === 'undefined') return 'classic';
  return localStorage.getItem('kumpel_bgId') || 'classic';
};

export const setStoredBgId = (id: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('kumpel_bgId', id);
};

export const getStoredWatermark = (): WatermarkConfig => {
  if (typeof window === 'undefined') return { id: null, rotation: 90, scale: 1, x: 0, y: 0 };
  const val = localStorage.getItem('kumpel_watermark');
  return val ? JSON.parse(val) : { id: null, rotation: 90, scale: 1, x: 0, y: 0 };
};

export const setStoredWatermark = (w: WatermarkConfig): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('kumpel_watermark', JSON.stringify(w));
};

export const getStoredTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'system';
  return (localStorage.getItem('kumpel_theme') as ThemeMode) || 'system';
};

export const setStoredTheme = (theme: ThemeMode): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('kumpel_theme', theme);
};

export const getStoredBalance = (): number => {
  if (typeof window === 'undefined') return 500;
  const val = localStorage.getItem('kumpel_balance');
  return val !== null ? parseFloat(val) : 500;
};

export const setStoredBalance = (balance: number): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('kumpel_balance', balance.toString());
};

export const generateTransferLink = (amount: number): string => {
  const token = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
  const data = {
    id: token,
    amount: amount,
    createdAt: Date.now(),
  };

  const payload = btoa(JSON.stringify(data));
  const activeTokens = JSON.parse(localStorage.getItem('kumpel_active_transfers') || '{}');
  activeTokens[token] = { amount, claimed: false };
  localStorage.setItem('kumpel_active_transfers', JSON.stringify(activeTokens));

  const url = new URL(window.location.origin);
  url.searchParams.set('claim', payload);
  return url.toString();
};

export const processClaimLink = (): { success: boolean; amount?: number; error?: string } | null => {
  if (typeof window === 'undefined') return null;

  const params = new URLSearchParams(window.location.search);
  const claimPayload = params.get('claim');

  if (!claimPayload) return null;

  try {
    const raw = atob(claimPayload);
    const data = JSON.parse(raw);

    if (!data || !data.id || !data.amount) {
      return { success: false, error: 'Ссылка недействительна!' };
    }

    const claimedTokens: string[] = JSON.parse(localStorage.getItem('kumpel_claimed_tokens') || '[]');
    if (claimedTokens.includes(data.id)) {
      return { success: false, error: 'Ссылка недействительна!' };
    }

    claimedTokens.push(data.id);
    localStorage.setItem('kumpel_claimed_tokens', JSON.stringify(claimedTokens));

    const currentBalance = getStoredBalance();
    const newBalance = currentBalance + Number(data.amount);
    setStoredBalance(newBalance);

    window.history.replaceState({}, document.title, window.location.pathname);

    return { success: true, amount: Number(data.amount) };
  } catch {
    return { success: false, error: 'Ссылка недействительна!' };
  }
};
