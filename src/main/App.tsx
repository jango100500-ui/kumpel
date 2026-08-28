import React, { useState, useEffect } from 'react';
import { AuthScreen } from './AuthScreen';
import { MainScreen } from './MainScreen';
import { TransferScreen } from './TransferScreen';
import {
  cardStyles,
  backgroundOptions,
  getStoredBalance,
  processClaimLink,
} from '@/mechanics/bankStore';

export const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<'auth' | 'main' | 'transfer'>('auth');
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
    const claimResult = processClaimLink();
    if (claimResult) {
      if (claimResult.success && claimResult.amount) {
        setBalance(getStoredBalance());
        alert(`🎉 Вам начислен перевод на сумму ${claimResult.amount}₽!`);
      } else if (!claimResult.success && claimResult.error) {
        alert(claimResult.error);
      }
    }
  }, []);

  const handleSignIn = () => {
    setCurrentScreen('main');
  };

  const handleOpenTransfer = () => {
    setCurrentScreen('transfer');
  };

  const handleBackFromTransfer = () => {
    setCurrentScreen('main');
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
        className="absolute inset-0 w-full h-full will-change-transform shadow-[-16px_0_35px_rgba(0,0,0,0.25)]"
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
          savedStyleId={savedStyleId}
          setSavedStyleId={setSavedStyleId}
          savedBgId={savedBgId}
          setSavedBgId={setSavedBgId}
          balance={balance}
        />
      </div>

      <div
        className="absolute inset-0 w-full h-full will-change-transform shadow-[-16px_0_35px_rgba(0,0,0,0.25)]"
        style={{
          transform: currentScreen === 'transfer' ? 'translateX(0%)' : 'translateX(100%)',
          transition: 'transform 450ms cubic-bezier(0.32, 0.72, 0, 1)',
          pointerEvents: currentScreen === 'transfer' ? 'auto' : 'none',
        }}
      >
        <TransferScreen
          isActive={currentScreen === 'transfer'}
          onBack={handleBackFromTransfer}
          activeStyle={activeStyle}
          balance={balance}
          currentBgImage={activeBg.image}
        />
      </div>
    </div>
  );
};
