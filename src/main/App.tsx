import React, { useState, useEffect } from 'react';
import { AuthScreen } from './AuthScreen';
import { MainScreen } from './MainScreen';
import { TransferScreen } from './TransferScreen';
import { RequestScreen } from './RequestScreen';
import {
  cardStyles,
  backgroundOptions,
  getStoredBalance,
  processClaimLink,
} from '@/mechanics/bankStore';

export const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<'auth' | 'main' | 'transfer' | 'request'>('auth');
  const [savedStyleId, setSavedStyleId] = useState('classic');
  const [savedBgId, setSavedBgId] = useState('classic');
  const [balance, setBalance] = useState(getStoredBalance());

  const activeStyle = cardStyles.find((s) => s.id === savedStyleId) || cardStyles[0];
  const activeBg = backgroundOptions.find((b) => b.id === savedBgId) || backgroundOptions[0];

  useEffect(() => {
    document.body.style.backgroundColor = activeBg.themeColor;
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', activeBg.themeColor);
    }
  }, [activeBg.themeColor]);

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
  };

  const handleOpenTransfer = () => {
    setCurrentScreen('transfer');
  };

  const handleOpenRequest = () => {
    setCurrentScreen('request');
  };

  const handleBackToMain = () => {
    setCurrentScreen('main');
  };

  const handleTransferSuccess = (transferredAmount: number) => {
    setTimeout(() => {
      sendNotification(`Поздравляем! Перевод на ${transferredAmount}₽ успешно выполнен!`);
    }, 300);
  };

  return (
    <div
      className="relative w-full h-[100dvh] overflow-hidden select-none transition-colors duration-500"
      style={{ backgroundColor: activeBg.themeColor }}
    >
      <div
        className="absolute inset-0 w-full h-full will-change-transform"
        style={{
          transform: currentScreen === 'auth' ? 'translateX(0%)' : 'translateX(-30%)',
          transition: 'transform 450ms cubic-bezier(0.32, 0.72, 0, 1)',
          pointerEvents: currentScreen === 'auth' ? 'auto' : 'none',
        }}
      >
        <AuthScreen onSignIn={handleSignIn} />
      </div>

      <div
        className="absolute inset-0 w-full h-full will-change-transform"
        style={{
          transform:
            currentScreen === 'auth'
              ? 'translateX(100%)'
              : currentScreen === 'main'
              ? 'translateX(0%)'
              : 'translateX(-30%)',
          transition: 'transform 450ms cubic-bezier(0.32, 0.72, 0, 1)',
          pointerEvents: currentScreen === 'main' ? 'auto' : 'none',
        }}
      >
        <MainScreen
          onOpenTransfer={handleOpenTransfer}
          onOpenRequest={handleOpenRequest}
          savedStyleId={savedStyleId}
          setSavedStyleId={setSavedStyleId}
          savedBgId={savedBgId}
          setSavedBgId={setSavedBgId}
          balance={balance}
        />
      </div>

      <div
        className="absolute inset-0 w-full h-full will-change-transform"
        style={{
          transform: currentScreen === 'transfer' ? 'translateX(0%)' : 'translateX(100%)',
          transition: 'transform 450ms cubic-bezier(0.32, 0.72, 0, 1)',
          pointerEvents: currentScreen === 'transfer' ? 'auto' : 'none',
        }}
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

      <div
        className="absolute inset-0 w-full h-full will-change-transform"
        style={{
          transform: currentScreen === 'request' ? 'translateX(0%)' : 'translateX(100%)',
          transition: 'transform 450ms cubic-bezier(0.32, 0.72, 0, 1)',
          pointerEvents: currentScreen === 'request' ? 'auto' : 'none',
        }}
      >
        <RequestScreen
          isActive={currentScreen === 'request'}
          onBack={handleBackToMain}
          activeStyle={activeStyle}
          currentBgImage={activeBg.image}
        />
      </div>
    </div>
  );
};
