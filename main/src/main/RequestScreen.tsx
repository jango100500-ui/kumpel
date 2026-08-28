import React, { useState, useEffect } from 'react';
import { useOrientation } from '@/mechanics/useOrientation';
import { JellyButton } from '@/uis/JellyButton';
import { CardStyle } from '@/mechanics/bankStore';

interface RequestScreenProps {
  isActive: boolean;
  onBack: () => void;
  activeStyle: CardStyle;
  balance: number;
  currentBgImage: string;
}

const QRCodeSVG: React.FC = () => {
  const qrMatrix = [
    [1,1,1,1,1,1,1,0,1,0,1,1,0,1,0,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,1,0,0,1,0,0,1,0,0,1,0,0,0,0,0,1],
    [1,0,1,1,1,0,1,0,1,0,1,1,0,1,0,1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1,0,0,1,1,0,1,0,0,1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1,0,1,1,0,1,0,1,0,1,0,1,1,1,0,1],
    [1,0,0,0,0,0,1,0,0,0,1,0,1,1,0,1,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,0,1,0,1,0,1,0,0,1,1,1,1,1,1,1],
    [0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0],
    [1,1,0,1,0,1,1,1,1,0,1,0,1,1,1,0,1,1,0,1,0,1],
    [0,1,1,0,1,0,0,1,0,1,0,1,0,0,1,1,0,0,1,1,1,0],
    [1,0,1,1,0,1,1,0,1,0,0,0,1,1,0,1,1,0,1,0,1,1],
    [0,1,0,0,1,0,0,1,0,0,0,0,0,1,0,0,1,1,0,1,0,0],
    [1,1,0,1,0,1,1,0,1,0,0,0,1,0,1,1,0,0,1,0,1,1],
    [0,0,1,0,1,0,0,1,0,1,0,1,0,1,0,0,1,1,0,1,0,0],
    [1,0,0,1,1,1,1,0,1,0,1,0,1,0,1,1,0,1,1,0,1,1],
    [0,0,0,0,0,0,0,0,1,1,0,1,0,0,0,1,0,0,0,1,0,0],
    [1,1,1,1,1,1,1,0,0,1,1,0,1,1,0,1,1,0,1,0,1,1],
    [1,0,0,0,0,0,1,0,1,0,0,1,0,0,1,0,0,1,1,1,0,0],
    [1,0,1,1,1,0,1,0,0,1,1,0,1,1,0,1,0,1,0,0,1,1],
    [1,0,1,1,1,0,1,0,1,0,0,1,0,0,1,1,1,0,1,1,0,0],
    [1,0,0,0,0,0,1,0,0,1,1,0,1,1,0,0,0,1,0,0,1,1],
    [1,1,1,1,1,1,1,0,1,0,1,1,0,1,0,1,1,0,1,1,0,1]
  ];

  return (
    <div className="relative w-48 h-48 bg-white p-2 rounded-2xl flex items-center justify-center shadow-sm border border-black/5">
      <svg viewBox="0 0 22 22" className="w-full h-full shape-rendering-crispEdges">
        {qrMatrix.map((row, rIdx) =>
          row.map((cell, cIdx) =>
            cell === 1 ? (
              <rect
                key={`${rIdx}-${cIdx}`}
                x={cIdx}
                y={rIdx}
                width="1"
                height="1"
                className="fill-black"
              />
            ) : null
          )
        )}
      </svg>
      <div className="absolute inset-0 m-auto w-10 h-10 bg-white rounded-xl shadow-md p-1.5 flex items-center justify-center border border-black/5">
        <img
          src="/logo.png"
          alt="Kumpel"
          className="w-full h-full object-contain brightness-0"
        />
      </div>
    </div>
  );
};

export const RequestScreen: React.FC<RequestScreenProps> = ({
  isActive,
  onBack,
  activeStyle,
  balance,
  currentBgImage,
}) => {
  const tilt = useOrientation(22);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isActive) {
      setIsLoading(true);
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setIsLoading(true);
    }
  }, [isActive]);

  const handleShareQR = async () => {
    const text = 'Переведите мне средства в приложении Kumpel Bank!';
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Kumpel Bank QR',
          text: text,
        });
      } catch {}
    } else {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('Kumpel Bank', {
          body: 'Данные для перевода скопированы!',
          icon: '/logo.png',
        });
      }
    }
  };

  return (
    <div className="relative w-full h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col justify-between select-none">
      <div
        className="absolute top-0 left-[-50px] right-[-50px] bottom-0 bg-cover bg-center pointer-events-none will-change-transform transition-opacity duration-200"
        style={{
          backgroundImage: `url(${currentBgImage})`,
          transform: `translate3d(${tilt.x}px, ${tilt.y}px, 0) scale(1.12)`,
        }}
      />

      <div className="relative z-10 w-full px-5 pt-3 pb-6 flex flex-col items-center justify-between flex-1 overflow-y-auto scroll-y-touch">
        <div className="w-full flex justify-between items-center mb-1">
          <JellyButton
            type="button"
            onClick={onBack}
            flashColor="bg-white/15"
            className="w-11 h-11 rounded-full bg-black/10 border border-white/[0.16] backdrop-blur-md flex items-center justify-center"
          >
            <img
              src="/close.png"
              alt="Close"
              className="w-4 h-4 object-contain brightness-0 invert opacity-75 pointer-events-none"
            />
          </JellyButton>
        </div>

        <div className="w-full max-w-[340px] flex flex-col items-center mt-1 mb-auto min-h-[380px] justify-center">
          {isLoading ? (
            <div className="w-full bg-white/70 backdrop-blur-md rounded-[28px] shadow-2xl p-6 flex flex-col items-center animate-pulse">
              <div className="w-48 h-48 rounded-2xl bg-black/10 mb-5" />
              <div className="w-48 h-5 rounded-full bg-black/10 mb-2" />
              <div className="w-56 h-3 rounded-full bg-black/10 mb-1" />
              <div className="w-40 h-3 rounded-full bg-black/10" />
            </div>
          ) : (
            <div className="w-full bg-white rounded-[28px] shadow-2xl p-6 flex flex-col items-center text-center transition-all duration-300 animate-in fade-in">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-full bg-[#E33125] flex items-center justify-center p-1 shadow-sm">
                  <img
                    src="/logo.png"
                    alt="Logo"
                    className="w-full h-full object-contain brightness-0 invert pointer-events-none"
                  />
                </div>
                <span className="text-[15px] font-bold tracking-tight uppercase text-black">
                  KUMPEL BANK
                </span>
              </div>

              <div className="mb-4">
                <QRCodeSVG />
              </div>

              <h3 className="text-black text-[16px] font-bold tracking-tight leading-snug mb-1.5">
                Отсканируйте для перевода по QR-коду
              </h3>

              <p className="text-[#8E8E93] text-[12px] font-normal leading-relaxed px-2">
                Покажите этот код отправителю для мгновенного зачисления средств на ваш счет без комиссии.
              </p>
            </div>
          )}
        </div>

        <div className="w-full max-w-[340px] mt-2">
          <JellyButton
            type="button"
            onClick={handleShareQR}
            flashColor="bg-black/10"
            className="w-full h-12 rounded-full flex items-center justify-center font-semibold text-[16px] shadow-md border border-white/20 transition-all duration-300"
            style={{
              backgroundColor: activeStyle.accentColor,
              color: activeStyle.id === 'vanilla' ? '#19181F' : '#FFFFFF',
            }}
          >
            Поделиться QR-кодом
          </JellyButton>
        </div>
      </div>
    </div>
  );
};
