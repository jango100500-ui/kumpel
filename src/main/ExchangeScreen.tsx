import React from 'react';
import { useOrientation } from '@/mechanics/useOrientation';

interface ExchangeScreenProps {
  currentBgImage: string;
}

export const ExchangeScreen: React.FC<ExchangeScreenProps> = ({
  currentBgImage,
}) => {
  const tilt = useOrientation(22);

  return (
    <div className="relative w-full h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col items-center justify-center select-none bg-transparent">
      <div
        className="absolute top-0 left-[-50px] right-[-50px] bottom-0 bg-cover bg-center pointer-events-none will-change-transform transition-opacity duration-200 ease-in-out"
        style={{
          backgroundImage: `url(${currentBgImage})`,
          transform: `translate3d(${tilt.x}px, ${tilt.y}px, 0) scale(1.12)`,
        }}
      />

      <div className="relative z-10 w-full max-w-[340px] px-5 flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-[24px] bg-white/20 dark:bg-black/20 backdrop-blur-md border border-white/30 dark:border-white/10 shadow-xl flex items-center justify-center mb-6">
          <img 
            src="/birge.png" 
            alt="Birge" 
            className="w-10 h-10 object-contain brightness-0 dark:invert opacity-80" 
          />
        </div>
        <h2 className="text-white text-[24px] font-bold tracking-tight mb-2">
          Биржа в разработке
        </h2>
        <p className="text-white/70 text-[14px] font-medium leading-relaxed">
          Скоро здесь появится возможность торговать активами, следить за рынком и управлять портфелем.
        </p>
      </div>
    </div>
  );
};
