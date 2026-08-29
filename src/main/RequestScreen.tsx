import React, { useState, useEffect, useRef } from 'react';
import { useOrientation } from '@/mechanics/useOrientation';
import { JellyButton } from '@/uis/JellyButton';
import { CardStyle } from '@/mechanics/bankStore';

interface RequestScreenProps {
  isActive: boolean;
  onBack: () => void;
  activeStyle: CardStyle;
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
    <div className="relative w-44 h-44 bg-white dark:bg-[#1C1C1E] p-2 rounded-2xl flex items-center justify-center shadow-sm border border-black/5 dark:border-white/10">
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
                className="fill-black dark:fill-white"
              />
            ) : null
          )
        )}
      </svg>
    </div>
  );
};

const JellyAnimatedText: React.FC<{ text: string }> = ({ text }) => {
  return (
    <span className="inline-flex items-center text-[14px] font-bold tracking-tight uppercase text-black dark:text-white overflow-hidden h-[18px]">
      {text.split('').map((char, index) => (
        <span
          key={`${text}-${index}-${char}`}
          className="inline-block"
          style={{
            animation: `jelly-pop 0.36s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 22}ms both`,
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </span>
  );
};

export const RequestScreen: React.FC<RequestScreenProps> = ({
  isActive,
  onBack,
  activeStyle,
  currentBgImage,
}) => {
  const tilt = useOrientation(22);
  const [isLoading, setIsLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (isActive) {
      setIsLoading(true);
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setIsLoading(true);
      setAmount('');
      setIsCopied(false);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    }
  }, [isActive]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (raw === '') {
      setAmount('');
      return;
    }

    let num = parseInt(raw, 10);
    if (num > 9999) num = 9999;

    setAmount(num.toString());
  };

  const handleShareQR = async () => {
    const num = parseInt(amount, 10);
    const text = num && num > 0
      ? `Переведите мне ${num} ₽ в приложении Kumpel Bank!`
      : 'Переведите мне средства в приложении Kumpel Bank!';

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Kumpel Bank QR',
          text: text,
        });
      } catch {}
    } else {
      handleCopy();
    }
  };

  const handleCopy = async () => {
    const num = parseInt(amount, 10);
    const text = num && num > 0
      ? `Переведите мне ${num} ₽ в приложении Kumpel Bank!`
      : 'Переведите мне средства в приложении Kumpel Bank!';

    try {
      await navigator.clipboard.writeText(text);
    } catch {}

    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    setIsCopied(true);
    copyTimeoutRef.current = setTimeout(() => {
      setIsCopied(false);
    }, 3000);
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

        <div className="w-full max-w-[340px] flex flex-col items-center gap-2.5 mt-1 mb-auto">
          {isLoading ? (
            <div className="w-full flex flex-col gap-2.5 animate-pulse">
              <div className="w-full bg-white/70 dark:bg-[#1C1C1E]/70 backdrop-blur-md rounded-[26px] shadow-2xl p-5 flex flex-col items-center">
                <div className="w-44 h-44 rounded-2xl bg-black/10 dark:bg-white/10 mb-4" />
                <div className="w-48 h-5 rounded-full bg-black/10 dark:bg-white/10 mb-2" />
                <div className="w-56 h-3 rounded-full bg-black/10 dark:bg-white/10" />
              </div>
              <div className="w-full bg-white/70 dark:bg-[#1C1C1E]/70 backdrop-blur-md rounded-[22px] shadow-xl p-4 flex flex-col gap-3">
                <div className="w-full h-8 rounded-full bg-black/10 dark:bg-white/10" />
                <div className="w-full h-4 rounded-full bg-black/10 dark:bg-white/10" />
              </div>
            </div>
          ) : (
            <div className="w-full flex flex-col gap-2.5 transition-all duration-300 animate-in fade-in">
              <div className="w-full bg-white dark:bg-[#1C1C1E] rounded-[26px] shadow-2xl p-5 flex flex-col items-center text-center">
                <div className="flex items-center gap-2 mb-3.5 h-6">
                  <div className="w-6 h-6 rounded-full bg-[#E33125] flex items-center justify-center p-1 shadow-sm flex-shrink-0">
                    <img
                      src="/logo.png"
                      alt="Logo"
                      className="w-full h-full object-contain brightness-0 invert pointer-events-none"
                    />
                  </div>
                  <JellyAnimatedText text={isCopied ? 'QR-код Скопирован!' : 'KUMPEL BANK'} />
                </div>

                <div className="mb-3.5">
                  <QRCodeSVG />
                </div>

                <h3 className="text-black dark:text-white text-[15px] font-bold tracking-tight leading-snug mb-1">
                  Отсканируйте для перевода по QR-коду
                </h3>

                <p className="text-[#8E8E93] text-[11px] font-normal leading-relaxed px-1">
                  Покажите этот код отправителю для мгновенного зачисления средств на ваш счет без комиссии
                </p>
              </div>

              <div className="w-full bg-white dark:bg-[#1C1C1E] rounded-[22px] shadow-xl p-4 flex flex-col gap-3 text-black">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="text-black dark:text-white text-[13px] font-semibold tracking-tight leading-tight">
                      Сумма
                    </span>
                    <span className="text-[10px] text-[#8E8E93] font-medium leading-tight">
                      от 10 до 9999₽ за один раз
                    </span>
                  </div>
                  <div className="flex items-center justify-end bg-black/[0.08] dark:bg-white/[0.12] border border-black/[0.12] dark:border-white/[0.12] backdrop-blur-md px-3 py-1.5 rounded-full w-[120px] shadow-inner">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={amount}
                      onChange={handleAmountChange}
                      placeholder="0"
                      className="w-full bg-transparent text-right font-bold text-[17px] text-black dark:text-white outline-none placeholder:text-black/30 dark:placeholder:text-white/30 caret-[#E33125]"
                    />
                    <span className="text-[15px] font-bold text-black dark:text-white ml-1 select-none pointer-events-none">
                      ₽
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[12px] font-medium text-[#8E8E93]">
                  <span>Комиссия</span>
                  <span className="font-semibold text-black dark:text-white">0%</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="w-full max-w-[340px] flex items-center gap-2.5 mt-2">
          <JellyButton
            type="button"
            onClick={handleShareQR}
            flashColor="bg-black/10"
            className="flex-1 h-12 rounded-full flex items-center justify-center font-semibold text-[16px] shadow-md border border-white/20 transition-all duration-300"
            style={{
              backgroundColor: activeStyle.accentColor,
              color: activeStyle.id === 'vanilla' ? '#19181F' : '#FFFFFF',
            }}
          >
            Поделиться QR-кодом
          </JellyButton>

          <JellyButton
            type="button"
            onClick={handleCopy}
            flashColor="bg-black/10"
            className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 shadow-md border border-white/20 transition-all duration-300"
            style={{
              backgroundColor: activeStyle.accentColor,
            }}
          >
            <img
              src="/copy.png"
              alt="Copy"
              className={`w-5 h-5 object-contain pointer-events-none ${
                activeStyle.id === 'vanilla' ? 'brightness-0' : 'brightness-0 invert'
              }`}
            />
          </JellyButton>
        </div>
      </div>
    </div>
  );
};
