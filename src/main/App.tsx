import React, { useState, useEffect } from 'react';
import { AuthScreen } from './AuthScreen';
import { AuthCodeScreen } from './AuthCodeScreen';
import { OnboardingScreen } from './OnboardingScreen';
import { MainScreen } from './MainScreen';
import { ExchangeScreen } from './ExchangeScreen';
import { TransferScreen } from './TransferScreen';
import { RequestScreen } from './RequestScreen';
import { TabBar } from '@/uis/TabBar';
import { api } from '@/mechanics/api';
import {
  cardStyles,
  backgroundOptions,
  getStoredTheme,
  setStoredTheme,
  ThemeMode,
} from '@/mechanics/bankStore';

export const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<'auth' | 'auth_code' | 'onboarding' | 'main' | 'exchange' | 'transfer' | 'request'>('auth');
  const [activeTab, setActiveTab] = useState<'main' | 'exchange'>('main');

  const [savedStyleId, setSavedStyleId] = useState('classic');
  const [savedBgId, setSavedBgId] = useState('classic');
  const [isEditMode, setIsEditMode] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const [token, setToken] = useState<string | null>(() => localStorage.getItem('kumpel_token'));
  const [profile, setProfile] = useState<{
    name: string;
    username: string;
    avatar: string | null;
  }>({
    name: 'Kumpel',
    username: 'user',
    avatar: null,
  });

  const [initialData, setInitialData] = useState<{ name: string; username: string }>({
    name: '',
    username: '',
  });

  const [balance, setBalance] = useState(0);
  const [marketData, setMarketData] = useState<{
    rate: number;
    history: Array<{ date: string; rate: number }>;
  }>({
    rate: 1.0,
    history: [],
  });

  const [transactions, setTransactions] = useState<Array<{
    id: string;
    name: string;
    type: string;
    amount: string;
    isPositive: boolean;
    date: string;
  }>>([]);

  const [savedTheme, setSavedTheme] = useState<ThemeMode>(getStoredTheme());
  const [previewTheme, setPreviewTheme] = useState<ThemeMode | null>(null);

  const [qrToPay, setQrToPay] = useState<{
    token: string;
    amount: number;
    name: string;
    username: string;
  } | null>(null);

  const activeStyle = cardStyles.find((s) => s.id === savedStyleId) || cardStyles[0];
  const activeBg = backgroundOptions.find((b) => b.id === savedBgId) || backgroundOptions[0];

  const loadData = async (userToken: string) => {
    try {
      const res = await api.syncUser(userToken);
      if (!res.error) {
        setProfile(res.profile!);
        setBalance(res.balance!);
        setMarketData({
          rate: res.rate!,
          history: res.market_history!,
        });
        setTransactions(res.transactions!);
        setCurrentScreen('main');
      }
    } catch {}
  };

  useEffect(() => {
    if (token) {
      loadData(token);
    }

    const params = new URLSearchParams(window.location.search);
    const payToken = params.get('pay');
    if (payToken) {
      window.history.replaceState({}, document.title, window.location.pathname);
      api.getQRInfo(payToken).then((res) => {
        if (res.success && res.amount && res.name && res.username) {
          setQrToPay({
            token: payToken,
            amount: res.amount,
            name: res.name,
            username: res.username,
          });
        } else {
          alert('QR-код уже использован или недействителен');
        }
      });
    }
  }, [token]);

  useEffect(() => {
    const activeTheme = previewTheme || savedTheme;
    const root = window.document.documentElement;

    const applyTheme = () => {
      root.classList.remove('dark');
      if (activeTheme === 'dark') {
        root.classList.add('dark');
      } else if (activeTheme === 'system') {
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          root.classList.add('dark');
        }
      }
    };

    applyTheme();

    if (activeTheme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => applyTheme();
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [savedTheme, previewTheme]);

  const sendNotification = (message: string) => {
    setSuccessToast(message);
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          new Notification('Kumpel Bank', {
            body: message,
            icon: '/logo.png',
            badge: '/logo.png',
          });
        } catch {}
      }
    }
  };

  const handleVerifyCode = async (code: string) => {
    try {
      const res = await api.verifyAuth(code);
      if (res.success && res.token) {
        localStorage.setItem('kumpel_token', res.token);
        setToken(res.token);
        if (res.is_new) {
          setInitialData({
            name: res.initial_name || '',
            username: res.initial_username || '',
          });
          setCurrentScreen('onboarding');
        } else {
          await loadData(res.token);
        }
      } else {
        alert(res.error || 'Неверный код. Запросите код в боте.');
      }
    } catch {
      alert('Ошибка при авторизации (нет доступа к серверу)');
    }
  };

  const handleOnboardingComplete = async (data: { name: string; username: string; avatar: string | null }) => {
    if (!token) return;
    try {
      await api.setupUser({ token, ...data });
      setProfile(data);
      setCurrentScreen('main');
      setActiveTab('main');
      await loadData(token);
    } catch {
      setCurrentScreen('main');
    }
  };

  const handleConfirmPay = async () => {
    if (!qrToPay || !token) return;
    try {
      const res = await api.payQR({ token, qr_token: qrToPay.token });
      if (res.success) {
        sendNotification(`Счет на ${qrToPay.amount}₭ успешно оплачен!`);
        setQrToPay(null);
        await loadData(token);
      } else {
        alert(res.error || 'Не удалось оплатить счет');
        setQrToPay(null);
      }
    } catch {
      alert('Ошибка при оплате счета');
      setQrToPay(null);
    }
  };

  const isTabBarVisible = (currentScreen === 'main' || currentScreen === 'exchange') && !isEditMode;

  const getScreenStyle = (screenName: string): React.CSSProperties => {
    const order = { auth: 0, auth_code: 1, onboarding: 2, main: 3, exchange: 4, transfer: 5, request: 6 };
    const cur = order[currentScreen as keyof typeof order];
    const ths = order[screenName as keyof typeof order];
    const isActive = currentScreen === screenName;
    const isAdjacent = Math.abs(cur - ths) <= 1;

    return {
      transform: `translateX(${ths < cur ? '-100%' : ths > cur ? '100%' : '0%'})`,
      transition: 'transform 450ms cubic-bezier(0.32, 0.72, 0, 1)',
      pointerEvents: isActive ? 'auto' : 'none',
      display: isAdjacent ? 'block' : 'none',
    };
  };

  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => setSuccessToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [successToast]);

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden select-none bg-[#5491D0]">
      {successToast && (
        <div className="absolute top-5 inset-x-0 z-[60] flex justify-center px-4 animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-none">
          <div className="w-full max-w-[340px] bg-white/90 dark:bg-[#1C1C1E]/90 border border-black/10 dark:border-white/10 backdrop-blur-xl rounded-[20px] p-4 shadow-xl flex items-center gap-3 pointer-events-auto">
            <div className="w-9 h-9 rounded-full bg-[#34C759] flex items-center justify-center shadow-sm flex-shrink-0">
              <svg className="w-5 h-5 text-white stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-black dark:text-white text-[14px] font-semibold tracking-tight leading-tight">
              {successToast}
            </span>
          </div>
        </div>
      )}

      {qrToPay && (
        <div className="absolute inset-0 z-[70] bg-black/50 backdrop-blur-md flex items-center justify-center px-5 animate-in fade-in duration-200">
          <div className="w-full max-w-[320px] bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/10 rounded-[28px] p-6 flex flex-col items-center text-center shadow-2xl">
            <div className="w-14 h-14 bg-[#E33125] rounded-full flex items-center justify-center mb-3 shadow-md">
              <img src="/logo.png" alt="Logo" className="w-7 h-7 object-contain brightness-0 invert" />
            </div>
            <h3 className="text-black dark:text-white text-[19px] font-bold tracking-tight mb-1">
              Оплата по QR
            </h3>
            <p className="text-[#8E8E93] text-[13px] font-medium leading-snug mb-5">
              Перевести <span className="text-black dark:text-white font-bold">{qrToPay.amount} ₭</span> пользователю @{qrToPay.username}?
            </p>
            <div className="w-full flex gap-2.5">
              <button
                type="button"
                onClick={() => setQrToPay(null)}
                className="flex-1 h-12 rounded-full bg-black/5 dark:bg-white/10 text-black dark:text-white font-semibold text-[15px] active:scale-95 transition-all"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleConfirmPay}
                className="flex-1 h-12 rounded-full bg-[#34C759] text-white font-semibold text-[15px] shadow-md active:scale-95 transition-all"
              >
                Оплатить
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="absolute inset-0 w-full h-full overflow-hidden will-change-transform z-10" style={getScreenStyle('auth')}>
        <AuthScreen onTelegramAuth={() => setCurrentScreen('auth_code')} />
      </div>

      <div className="absolute inset-0 w-full h-full overflow-hidden will-change-transform z-20" style={getScreenStyle('auth_code')}>
        <AuthCodeScreen
          isActive={currentScreen === 'auth_code'}
          onBack={() => setCurrentScreen('auth')}
          onVerify={handleVerifyCode}
        />
      </div>

      <div className="absolute inset-0 w-full h-full overflow-hidden will-change-transform z-10" style={getScreenStyle('onboarding')}>
        <OnboardingScreen
          initialName={initialData.name}
          initialUsername={initialData.username}
          onComplete={handleOnboardingComplete}
        />
      </div>

      <div className="absolute inset-0 w-full h-full overflow-hidden will-change-transform z-10" style={getScreenStyle('main')}>
        <MainScreen
          onOpenTransfer={() => setCurrentScreen('transfer')}
          onOpenRequest={() => setCurrentScreen('request')}
          savedStyleId={savedStyleId}
          setSavedStyleId={setSavedStyleId}
          savedBgId={savedBgId}
          setSavedBgId={setSavedBgId}
          savedTheme={savedTheme}
          setSavedTheme={(t) => {
            setSavedTheme(t);
            setStoredTheme(t);
          }}
          setPreviewTheme={setPreviewTheme}
          balance={balance}
          transactions={transactions}
          isEditMode={isEditMode}
          setIsEditMode={setIsEditMode}
          profile={profile}
        />
      </div>

      <div className="absolute inset-0 w-full h-full overflow-hidden will-change-transform z-10" style={getScreenStyle('exchange')}>
        <ExchangeScreen
          marketData={marketData}
          currentBgImage={activeBg.image}
        />
      </div>

      <div className="absolute inset-0 w-full h-full overflow-hidden will-change-transform z-[40]" style={getScreenStyle('transfer')}>
        <TransferScreen
          isActive={currentScreen === 'transfer'}
          onBack={() => setCurrentScreen(activeTab)}
          onSuccess={(amt) => {
            sendNotification(`Перевод на ${amt} ₭ выполнен!`);
            if (token) loadData(token);
          }}
          activeStyle={activeStyle}
          balance={balance}
          currentBgImage={activeBg.image}
          token={token}
        />
      </div>

      <div className="absolute inset-0 w-full h-full overflow-hidden will-change-transform z-[40]" style={getScreenStyle('request')}>
        <RequestScreen
          isActive={currentScreen === 'request'}
          onBack={() => setCurrentScreen(activeTab)}
          activeStyle={activeStyle}
          currentBgImage={activeBg.image}
          token={token}
        />
      </div>

      <div
        className="fixed bottom-0 inset-x-0 z-[50] flex flex-col justify-end pointer-events-none transition-transform duration-500"
        style={{
          transform: isTabBarVisible ? 'translateY(0)' : 'translateY(100%)',
        }}
      >
        <div
          className="absolute bottom-0 inset-x-0 h-[120px] backdrop-blur-[16px] -z-10 transition-opacity duration-500"
          style={{
            WebkitMaskImage: 'linear-gradient(to top, black 50%, transparent 100%)',
            maskImage: 'linear-gradient(to top, black 50%, transparent 100%)',
            opacity: isTabBarVisible ? 1 : 0,
          }}
        />
        <div className="w-full pb-6 pt-10 pointer-events-auto">
          <TabBar activeTab={activeTab} onChange={(tab) => { setActiveTab(tab); setCurrentScreen(tab); }} />
        </div>
      </div>
    </div>
  );
};
