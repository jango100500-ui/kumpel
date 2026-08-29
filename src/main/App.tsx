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
import {
  cardStyles,
  backgroundOptions,
  getStoredBalance,
  processClaimLink,
  getStoredTheme,
  setStoredTheme,
  ThemeMode,
} from '@/mechanics/bankStore';

export const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<'auth' | 'auth_code' | 'onboarding' | 'main' | 'exchange' | 'transfer' | 'request'>('auth');
  const [activeTab, setActiveTab] = useState<'main' | 'exchange'>('main');
  
  const [savedStyleId, setSavedStyleId] = useState('classic');
  const [savedBgId, setSavedBgId] = useState('classic');
  const [balance, setBalance] = useState(getStoredBalance());
  const [isEditMode, setIsEditMode] = useState(false);
  
  const [profile, setProfile] = useState<{
    name: string;
    username: string;
    avatar: string | null;
  }>({
    name: 'Kumpel',
    username: 'username',
    avatar: null,
  });

  const [savedTheme, setSavedTheme] = useState<ThemeMode>(getStoredTheme());
  const [previewTheme, setPreviewTheme] = useState<ThemeMode | null>(null);

  const activeStyle = cardStyles.find((s) => s.id === savedStyleId) || cardStyles[0];
  const activeBg = backgroundOptions.find((b) => b.id === savedBgId) || backgroundOptions[0];

  const tilt = useOrientation(22);
  const [currentBgImage, setCurrentBgImage] = useState(activeBg.image);
  const [bgOpacity, setBgOpacity] = useState(1);

  useEffect(() => {
    if (activeBg.image !== currentBgImage) {
      setBgOpacity(0);
      const timeout = setTimeout(() => {
        setCurrentBgImage(activeBg.image);
        setBgOpacity(1);
      }, 160);
      return () => clearTimeout(timeout);
    }
  }, [activeBg.image, currentBgImage]);

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
    // ... логика нотификаций из прошлых ответов
  };

  const handleSignIn = () => {
    setCurrentScreen('onboarding');
  };

  const handleTelegramAuth = () => {
    setCurrentScreen('auth_code');
  };

  const handleVerifyCode = (code: string) => {
    // В будущем тут будет реальный API запрос
    console.log('Verifying code:', code);
    setCurrentScreen('onboarding');
  };

  const handleOnboardingComplete = (data: { name: string; username: string; avatar: string | null }) => {
    setProfile(data);
    setCurrentScreen('main');
    setActiveTab('main');
  };

  const handleTabChange = (tab: 'main' | 'exchange') => {
    setActiveTab(tab);
    setCurrentScreen(tab);
  };

  const handleOpenTransfer = () => setCurrentScreen('transfer');
  const handleOpenRequest = () => setCurrentScreen('request');
  const handleBackToMain = () => setCurrentScreen(activeTab);
  const handleBackToAuth = () => setCurrentScreen('auth');

  const handleTransferSuccess = (transferredAmount: number) => {
    setTimeout(() => {
      sendNotification(`Поздравляем! Перевод на ${transferredAmount}₭ успешно выполнен!`);
    }, 300);
  };

  const isTabBarVisible = (currentScreen === 'main' || currentScreen === 'exchange') && !isEditMode;
  const flowScreen = (currentScreen === 'main' || currentScreen === 'exchange') ? 'mainFlow' : currentScreen;

  const getScreenStyle = (screenName: string): React.CSSProperties => {
    const order = { auth: 0, auth_code: 1, onboarding: 2, mainFlow: 3, transfer: 4, request: 5 };
    const currentIndex = order[flowScreen as keyof typeof order];
    const thisIndex = order[screenName as keyof typeof order];
    
    let translateX = '0%';
    if (thisIndex < currentIndex) translateX = '-30%';
    else if (thisIndex > currentIndex) translateX = '100%';

    return {
      transform: `translateX(${translateX})`,
      transition: 'transform 450ms cubic-bezier(0.32, 0.72, 0, 1)',
      pointerEvents: flowScreen === screenName ? 'auto' : 'none',
    };
  };

  const getTabStyle = (tabName: 'main' | 'exchange'): React.CSSProperties => {
    let translateX = '0%';
    if (activeTab === 'main' && tabName === 'exchange') translateX = '100%';
    if (activeTab === 'exchange' && tabName === 'main') translateX = '-100%';

    return {
      transform: `translateX(${translateX})`,
      transition: 'transform 450ms cubic-bezier(0.32, 0.72, 0, 1)',
      pointerEvents: activeTab === tabName && flowScreen === 'mainFlow' ? 'auto' : 'none',
    };
  };

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden select-none bg-[#5491D0]">
      
      <div className="absolute inset-0 w-full h-full overflow-hidden will-change-transform z-10" style={getScreenStyle('auth')}>
        <AuthScreen onSignIn={handleSignIn} onTelegramAuth={handleTelegramAuth} />
      </div>

      <div className="absolute inset-0 w-full h-full overflow-hidden will-change-transform z-20" style={getScreenStyle('auth_code')}>
        <AuthCodeScreen onBack={handleBackToAuth} onVerify={handleVerifyCode} />
      </div>

      <div className="absolute inset-0 w-full h-full overflow-hidden will-change-transform z-10" style={getScreenStyle('onboarding')}>
        <OnboardingScreen onComplete={handleOnboardingComplete} />
      </div>

      <div className="absolute inset-0 w-full h-full overflow-hidden will-change-transform z-10" style={getScreenStyle('mainFlow')}>
        <div
          className="absolute top-[-50px] left-[-50px] right-[-50px] bottom-[-50px] bg-cover bg-center pointer-events-none will-change-transform transition-opacity duration-200 ease-in-out z-0"
          style={{
            backgroundImage: `url(${currentBgImage})`,
            opacity: bgOpacity,
            transform: `translate3d(${tilt.x}px, ${tilt.y}px, 0) scale(1.12)`,
          }}
        />

        <div className="absolute inset-0 w-full h-full will-change-transform z-10" style={getTabStyle('main')}>
          <MainScreen
            onOpenTransfer={handleOpenTransfer}
            onOpenRequest={handleOpenRequest}
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
            isEditMode={isEditMode}
            setIsEditMode={setIsEditMode}
            profile={profile}
          />
        </div>

        <div className="absolute inset-0 w-full h-full will-change-transform z-10" style={getTabStyle('exchange')}>
          <ExchangeScreen currentBgImage={activeBg.image} />
        </div>
      </div>

      <div className="absolute inset-0 w-full h-full overflow-hidden will-change-transform z-[40]" style={getScreenStyle('transfer')}>
        <TransferScreen isActive={currentScreen === 'transfer'} onBack={handleBackToMain} onSuccess={handleTransferSuccess} activeStyle={activeStyle} balance={balance} currentBgImage={activeBg.image} />
      </div>

      <div className="absolute inset-0 w-full h-full overflow-hidden will-change-transform z-[40]" style={getScreenStyle('request')}>
        <RequestScreen isActive={currentScreen === 'request'} onBack={handleBackToMain} activeStyle={activeStyle} currentBgImage={activeBg.image} />
      </div>

      <div className="fixed bottom-0 inset-x-0 z-[50] flex flex-col justify-end pointer-events-none transition-transform duration-500" style={{ transform: isTabBarVisible ? 'translateY(0)' : 'translateY(100%)' }}>
        <div className="w-full pb-6 pt-10 pointer-events-auto">
          <TabBar activeTab={activeTab} onChange={handleTabChange} />
        </div>
      </div>
    </div>
  );
};
