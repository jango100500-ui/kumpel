import React, { useState } from 'react';
import { AuthScreen } from './AuthScreen';
import { MainScreen } from './MainScreen';

export const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<'auth' | 'main'>('auth');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleSignIn = () => {
    setIsTransitioning(true);
    setCurrentScreen('main');
  };

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-black select-none">
      <div
        className="absolute inset-0 w-full h-full will-change-transform pointer-events-none"
        style={{
          transform: isTransitioning ? 'translateX(-30%)' : 'translateX(0%)',
          transition: 'transform 450ms cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        <AuthScreen onSignIn={handleSignIn} />
      </div>

      <div
        className="absolute inset-0 w-full h-full will-change-transform shadow-[-16px_0_35px_rgba(0,0,0,0.25)]"
        style={{
          transform: currentScreen === 'main' ? 'translateX(0%)' : 'translateX(100%)',
          transition: 'transform 450ms cubic-bezier(0.32, 0.72, 0, 1)',
          pointerEvents: currentScreen === 'main' ? 'auto' : 'none',
        }}
      >
        <MainScreen />
      </div>
    </div>
  );
};
