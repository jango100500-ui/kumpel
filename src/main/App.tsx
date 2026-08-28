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
  const [successToast, setSuccessToast] = useState<string | null>(null);

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
        setSuccessToast(`Поздравляем! Перевод на ${claimResult.amount}₽ успешно выполнен!`);
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

  const handleTransferSuccess = (transferredAmount: number) => {
    setTimeout(() => {
      setSuccessToast(`Поздравляем! Перевод на ${transferredAmount}₽ успешно выполнен!`);
    }, 300);
  };

  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => {
        setSuccessToast(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [successToast]);

  return (
    <div
      className="relative w-full h-[100dvh] overflow-hidden select-none transition-colors duration-500"
      style={{ backgroundColor: activeBg.themeColor }}
    >
      {successToast && (
        <div className="absolute top-5 inset-x-0 z-50 flex justify-center px-4 pointer-events-none animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="w-full max-w-[340px] bg-white/90 border border-black/10 backdrop-blur-xl rounded-[20px] p-4 shadow-[0_10px_30px_rgba(0,0,0,0.18)] flex items-center gap-3 pointer-events-auto">
            <div className="w-9 h-9 rounded-full bg-[#34C759] flex items-center justify-center flex-shrink-0 shadow-sm">
              <svg
                className="w-5 h-5 text-white stroke-[2.5]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex flex-col flex-1">
              <span className="text-black text-[14px] font-semibold tracking-tight leading-tight">
                {successToast}
              </span>
            </div>
          </div>
        </div>
      )}

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
          onSuccess={handleTransferSuccess}
          activeStyle={activeStyle}
          balance={balance}
          currentBgImage={activeBg.image}
        />
      </div>
    </div>
  );
};
