import React, { useState, useEffect } from 'react';
import { AuthScreen } from './AuthScreen';
import { MainScreen } from './MainScreen';
import { ExchangeScreen } from './ExchangeScreen';
import { TransferScreen } from './TransferScreen';
import { RequestScreen } from './RequestScreen';
import { TabBar } from '@/uis/TabBar';
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
  const [currentScreen, setCurrentScreen] = useState<'auth' | 'main' | 'exchange' | 'transfer' | 'request'>('auth');
  const [activeTab, setActiveTab] = useState<'main' | 'exchange'>('main');
  
  const [savedStyleId, setSavedStyleId] = useState('classic');
  const [savedBgId, setSavedBgId] = useState('classic');
  const [balance, setBalance] = useState(getStoredBalance());
  
  const [savedTheme, setSavedTheme] = useState<ThemeMode>(getStoredTheme());
  const [previewTheme, setPreviewTheme] = useState<ThemeMode | null>(null);

  const activeStyle = cardStyles.find((s) => s.id === savedStyleId) || cardStyles[0];
  const activeBg = backgroundOptions.find((b) => b.id === savedBgId) || backgroundOptions[0];

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

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, []);

  const sendNotification = (message: string) => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          new Notification('Kumpel Bank', {
            body: message,
            icon: '/logo.png',
            badge: '/logo.png',
          });
        } catch {
          if (navigator.serviceWorker && navigator.serviceWorker.ready) {
            navigator.serviceWorker.ready.then((reg) => {
              reg.showNotification('Kumpel Bank', {
                body: message,
                icon: '/logo.png',
                badge: '/logo.png',
              });
            });
          }
        }
      } else if (Notification.permission === 'default') {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            new Notification('Kumpel Bank', {
              body: message,
              icon: '/logo.png',
              badge: '/logo.png',
            });
          }
        });
      }
    }
  };

  useEffect(() => {
    const claimResult = processClaimLink();
    if (claimResult) {
      if (claimResult.success && claimResult.amount) {
        setBalance(getStoredBalance());
        sendNotification(`Поздравляем! Перевод на ${claimResult.amount}₽ успешно выполнен!`);
      }
    }
  }, []);

  const handleSignIn = () => {
    setCurrentScreen('main');
    setActiveTab('main');
  };

  const handleTabChange = (tab: 'main' | 'exchange') => {
    setActiveTab(tab);
    setCurrentScreen(tab);
  };

  const handleOpenTransfer = () => {
    setCurrentScreen('transfer');
  };

  const handleOpenRequest = () => {
    setCurrentScreen('request');
  };

  const handleBackToMain = () => {
    setCurrentScreen(activeTab);
  };

  const handleTransferSuccess = (transferredAmount: number) => {
    setTimeout(() => {
      sendNotification(`Поздравляем! Перевод на ${transferredAmount}₽ успешно выполнен!`);
    }, 300);
  };

  const isTabBarVisible = currentScreen === 'main' || currentScreen === 'exchange';

  // Функция для расчета "плоской" анимации листания страниц
  const getScreenStyle = (screenName: string): React.CSSProperties => {
    const order = { auth: 0, main: 1, exchange: 2, transfer: 3, request: 4 };
    const currentIndex = order[currentScreen as keyof typeof order];
    const thisIndex = order[screenName as keyof typeof order];
    
    let translateX = '0%';
    if (thisIndex < currentIndex) translateX = '-100%';
    else if (thisIndex > currentIndex) translateX = '100%';

    return {
      transform: `translateX(${translateX})`,
      transition: 'transform 450ms cubic-bezier(0.32, 0.72, 0, 1)',
      pointerEvents: currentScreen === screenName ? 'auto' : 'none',
    };
  };

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden select-none bg-[#5491D0]">
      
      {/* Auth */}
      <div
        className="absolute inset-0 w-full h-full will-change-transform"
        style={getScreenStyle('auth')}
      >
        <AuthScreen onSignIn={handleSignIn} />
      </div>

      {/* Main (Wallet) */}
      <div
        className="absolute inset-0 w-full h-full will-change-transform"
        style={getScreenStyle('main')}
      >
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
        />
      </div>

      {/* Exchange */}
      <div
        className="absolute inset-0 w-full h-full will-change-transform"
        style={getScreenStyle('exchange')}
      >
        <ExchangeScreen 
          currentBgImage={activeBg.image}
        />
      </div>

      {/* Transfer */}
      <div
        className="absolute inset-0 w-full h-full will-change-transform"
        style={getScreenStyle('transfer')}
      >
        <TransferScreen
          isActive={currentScreen === 'transfer'}
          onBack={handleBackToMain}
          onSuccess={handleTransferSuccess}
          activeStyle={activeStyle}
          balance={balance}
          currentBgImage={activeBg.image}
        />
      </div>

      {/* Request */}
      <div
        className="absolute inset-0 w-full h-full will-change-transform"
        style={getScreenStyle('request')}
      >
        <RequestScreen
          isActive={currentScreen === 'request'}
          onBack={handleBackToMain}
          activeStyle={activeStyle}
          currentBgImage={activeBg.image}
        />
      </div>

      {/* Gradual Blur & TabBar */}
      <div 
        className="fixed bottom-0 inset-x-0 z-[50] flex flex-col justify-end pointer-events-none transition-transform duration-500"
        style={{
          transform: isTabBarVisible ? 'translateY(0)' : 'translateY(100%)',
        }}
      >
        <div 
          className="absolute bottom-0 inset-x-0 h-[120px] backdrop-blur-[12px] -z-10"
          style={{
            WebkitMaskImage: 'linear-gradient(to top, black 50%, transparent 100%)',
            maskImage: 'linear-gradient(to top, black 50%, transparent 100%)'
          }}
        />
        <div className="w-full pb-6 pt-10 pointer-events-auto">
          <TabBar activeTab={activeTab} onChange={handleTabChange} savedTheme={previewTheme || savedTheme} />
        </div>
      </div>
    </div>
  );
};
