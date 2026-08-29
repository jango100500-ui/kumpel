import React, { useState, useEffect } from 'react';
import { AuthScreen } from './AuthScreen';
import { AuthCodeScreen } from './AuthCodeScreen';
import { OnboardingScreen } from './OnboardingScreen';
import { MainScreen } from './MainScreen';
import { ExchangeScreen } from './ExchangeScreen';
import { TransferScreen } from './TransferScreen';
import { RequestScreen } from './RequestScreen';
import { TabBar } from '@/uis/TabBar';
import { useOrientation } from '@/mechanics/useOrientation';
import { api } from '@/mechanics/api';
import { cardStyles, backgroundOptions, getStoredTheme, setStoredTheme, ThemeMode } from '@/mechanics/bankStore';

export const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<'auth'|'auth_code'|'onboarding'|'main'|'exchange'|'transfer'|'request'>('auth');
  const [activeTab, setActiveTab] = useState<'main' | 'exchange'>('main');
  
  const [savedStyleId, setSavedStyleId] = useState('classic');
  const [savedBgId, setSavedBgId] = useState('classic');
  const [isEditMode, setIsEditMode] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const [token, setToken] = useState<string | null>(localStorage.getItem('kumpel_token'));
  const [profile, setProfile] = useState({ name: 'Kumpel', username: 'user', avatar: null as string | null });
  const [balance, setBalance] = useState(0);
  const [marketData, setMarketData] = useState({ rate: 1.0, history: [] as any[] });
  const [transactions, setTransactions] = useState<any[]>([]);
  
  const [savedTheme, setSavedTheme] = useState<ThemeMode>(getStoredTheme());
  const [previewTheme, setPreviewTheme] = useState<ThemeMode | null>(null);
  const [qrToPay, setQrToPay] = useState<{ token: string, amount: number, name: string, username: string } | null>(null);

  const activeStyle = cardStyles.find((s) => s.id === savedStyleId) || cardStyles[0];
  const activeBg = backgroundOptions.find((b) => b.id === savedBgId) || backgroundOptions[0];
  const tilt = useOrientation(22);

  const loadData = async (t: string) => {
    const res = await api.syncUser(t);
    if (!res.error) {
      setProfile(res.profile);
      setBalance(res.balance);
      setMarketData({ rate: res.rate, history: res.market_history });
      setTransactions(res.transactions);
      setCurrentScreen('main');
    }
  };

  useEffect(() => {
    if (token) loadData(token);
    
    // Перехват QR-кода
    const params = new URLSearchParams(window.location.search);
    const payToken = params.get('pay');
    if (payToken) {
      window.history.replaceState({}, document.title, window.location.pathname);
      api.getQRInfo(payToken).then(res => {
        if (res.success) setQrToPay({ token: payToken, ...res });
        else alert('QR-код уже использован или недействителен');
      });
    }
  }, [token]);

  useEffect(() => {
    const applyTheme = () => {
      document.documentElement.classList.remove('dark');
      if (previewTheme === 'dark' || savedTheme === 'dark' || ((previewTheme === 'system' || savedTheme === 'system') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
      }
    };
    applyTheme();
  }, [savedTheme, previewTheme]);

  const handleVerifyCode = async (code: string) => {
    const res = await api.verifyAuth(code);
    if (res.success) {
      localStorage.setItem('kumpel_token', res.token);
      setToken(res.token);
      if (res.is_new) setCurrentScreen('onboarding');
      else loadData(res.token);
    } else {
      alert(res.error);
    }
  };

  const handleOnboardingComplete = async (data: any) => {
    await api.setupUser({ token, ...data });
    setProfile(data);
    setCurrentScreen('main');
  };

  const handleConfirmPay = async () => {
    if (!qrToPay || !token) return;
    const res = await api.payQR({ token, qr_token: qrToPay.token });
    if (res.success) {
      setSuccessToast(`Счет на ${qrToPay.amount}₭ оплачен!`);
      setQrToPay(null);
      loadData(token);
    } else {
      alert(res.error);
      setQrToPay(null);
    }
  };

  const isTabBarVisible = (currentScreen === 'main' || currentScreen === 'exchange') && !isEditMode;
  const flowScreen = (currentScreen === 'main' || currentScreen === 'exchange') ? 'mainFlow' : currentScreen;

  const getScreenStyle = (screenName: string): React.CSSProperties => {
    const order = { auth: 0, auth_code: 1, onboarding: 2, mainFlow: 3, transfer: 4, request: 5 };
    const cur = order[flowScreen as keyof typeof order], ths = order[screenName as keyof typeof order];
    return {
      transform: `translateX(${ths < cur ? '-30%' : ths > cur ? '100%' : '0%'})`,
      transition: 'transform 450ms cubic-bezier(0.32, 0.72, 0, 1)',
      pointerEvents: flowScreen === screenName ? 'auto' : 'none',
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
        <div className="absolute top-5 inset-x-0 z-[60] flex justify-center px-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="w-full max-w-[340px] bg-white/90 dark:bg-[#1C1C1E]/90 border border-black/10 dark:border-white/10 backdrop-blur-xl rounded-[20px] p-4 shadow-xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#34C759] flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5 text-white stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </div>
            <span className="text-black dark:text-white text-[14px] font-semibold tracking-tight">{successToast}</span>
          </div>
        </div>
      )}

      {qrToPay && (
        <div className="absolute inset-0 z-[70] bg-black/40 backdrop-blur-sm flex items-center justify-center px-5">
          <div className="w-full max-w-[320px] bg-white dark:bg-[#1C1C1E] rounded-[28px] p-6 flex flex-col items-center text-center shadow-2xl animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 bg-[#E33125] rounded-full flex items-center justify-center mb-4">
              <img src="/logo.png" className="w-8 h-8 brightness-0 invert" />
            </div>
            <h3 className="text-black dark:text-white text-[20px] font-bold mb-2">Оплата по QR</h3>
            <p className="text-[#8E8E93] text-[14px] mb-6">Перевести <b className="text-black dark:text-white">{qrToPay.amount} ₭</b> пользователю @{qrToPay.username}?</p>
            <div className="w-full flex gap-3">
              <button onClick={() => setQrToPay(null)} className="flex-1 h-12 rounded-full bg-black/5 dark:bg-white/10 text-black dark:text-white font-semibold">Отмена</button>
              <button onClick={handleConfirmPay} className="flex-1 h-12 rounded-full bg-[#34C759] text-white font-semibold shadow-md">Оплатить</button>
            </div>
          </div>
        </div>
      )}

      <div className="absolute inset-0 w-full h-full overflow-hidden will-change-transform z-10" style={getScreenStyle('auth')}>
        <AuthScreen onSignIn={() => setCurrentScreen('onboarding')} onTelegramAuth={() => setCurrentScreen('auth_code')} />
      </div>

      <div className="absolute inset-0 w-full h-full overflow-hidden will-change-transform z-20" style={getScreenStyle('auth_code')}>
        <AuthCodeScreen onBack={() => setCurrentScreen('auth')} onVerify={handleVerifyCode} />
      </div>

      <div className="absolute inset-0 w-full h-full overflow-hidden will-change-transform z-10" style={getScreenStyle('onboarding')}>
        <OnboardingScreen onComplete={handleOnboardingComplete} />
      </div>

      <div className="absolute inset-0 w-full h-full overflow-hidden will-change-transform z-10" style={getScreenStyle('mainFlow')}>
        <div className="absolute top-[-50px] left-[-50px] right-[-50px] bottom-[-50px] bg-cover bg-center transition-opacity duration-200" style={{ backgroundImage: `url(${activeBg.image})`, transform: `translate3d(${tilt.x}px, ${tilt.y}px, 0) scale(1.12)` }} />
        <div className="absolute inset-0 w-full h-full z-10" style={{ transform: `translateX(${activeTab === 'main' ? '0%' : '-100%'})`, transition: 'transform 450ms' }}>
          <MainScreen
            onOpenTransfer={() => setCurrentScreen('transfer')} onOpenRequest={() => setCurrentScreen('request')}
            savedStyleId={savedStyleId} setSavedStyleId={setSavedStyleId} savedBgId={savedBgId} setSavedBgId={setSavedBgId}
            savedTheme={savedTheme} setSavedTheme={(t) => { setSavedTheme(t); setStoredTheme(t); }} setPreviewTheme={setPreviewTheme}
            balance={balance} transactions={transactions} isEditMode={isEditMode} setIsEditMode={setIsEditMode} profile={profile}
          />
        </div>
        <div className="absolute inset-0 w-full h-full z-10" style={{ transform: `translateX(${activeTab === 'exchange' ? '0%' : '100%'})`, transition: 'transform 450ms' }}>
          <ExchangeScreen marketData={marketData} />
        </div>
      </div>

      <div className="absolute inset-0 w-full h-full overflow-hidden will-change-transform z-[40]" style={getScreenStyle('transfer')}>
        <TransferScreen isActive={currentScreen === 'transfer'} onBack={() => setCurrentScreen(activeTab)} onSuccess={(amt) => { setSuccessToast(`Перевод на ${amt}₭ выполнен!`); loadData(token!); }} activeStyle={activeStyle} balance={balance} currentBgImage={activeBg.image} token={token} />
      </div>

      <div className="absolute inset-0 w-full h-full overflow-hidden will-change-transform z-[40]" style={getScreenStyle('request')}>
        <RequestScreen isActive={currentScreen === 'request'} onBack={() => setCurrentScreen(activeTab)} activeStyle={activeStyle} currentBgImage={activeBg.image} token={token} />
      </div>

      <div className="fixed bottom-0 inset-x-0 z-[50] flex flex-col justify-end transition-transform duration-500" style={{ transform: isTabBarVisible ? 'translateY(0)' : 'translateY(100%)' }}>
        <div className="absolute bottom-0 inset-x-0 h-[120px] backdrop-blur-[16px] -z-10" style={{ WebkitMaskImage: 'linear-gradient(to top, black 50%, transparent 100%)' }} />
        <div className="w-full pb-6 pt-10"><TabBar activeTab={activeTab} onChange={setActiveTab} /></div>
      </div>
    </div>
  );
};
