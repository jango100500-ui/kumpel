import React, { useState, useRef, useEffect } from 'react';
import { useOrientation } from '@/mechanics/useOrientation';
import { JellyButton } from '@/uis/JellyButton';
import { CardStyle, generateTransferLink } from '@/mechanics/bankStore';

interface TransferScreenProps {
  onBack: () => void;
  activeStyle: CardStyle;
  balance: number;
  currentBgImage: string;
}

export const TransferScreen: React.FC<TransferScreenProps> = ({
  onBack,
  activeStyle,
  balance,
  currentBgImage,
}) => {
  const tilt = useOrientation(22);
  const [amount, setAmount] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const onlyDigits = e.target.value.replace(/\D/g, '');
    if (onlyDigits.length <= 7) {
      setAmount(onlyDigits);
    }
  };

  const handleTransfer = async () => {
    const num = parseInt(amount, 10);
    if (!num || num <= 0) return;

    const link = generateTransferLink(num);
    const textToShare = `Перевод на сумму ${num}₽ от пользователя. Получите в приложении Kumpel в течение суток с момента отправки —> ${link}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Перевод Kumpel',
          text: textToShare,
        });
        onBack();
      } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(textToShare);
        alert(`Ссылка скопирована в буфер обмена!\n\n${textToShare}`);
        onBack();
      } catch {
        alert(textToShare);
        onBack();
      }
    }
  };

  return (
    <div className="relative w-full h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col justify-between select-none">
      <div
        className="absolute top-0 left-[-50px] right-[-50px] bottom-0 bg-cover bg-center pointer-events-none will-change-transform"
        style={{
          backgroundImage: `url(${currentBgImage})`,
          transform: `translate3d(${tilt.x}px, ${tilt.y}px, 0) scale(1.12)`,
        }}
      />

      <div className="relative z-10 w-full px-5 pt-3 pb-3 flex flex-col items-center flex-1">
        <div className="w-full flex justify-between items-center mb-2.5">
          <JellyButton
            type="button"
            onClick={onBack}
            flashColor="bg-white/15"
            className="w-11 h-11 rounded-full bg-black/10 border border-white/[0.16] backdrop-blur-md flex items-center justify-center"
          >
            <svg
              className="w-5 h-5 text-white pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </JellyButton>
        </div>

        <div className="relative w-full max-w-[340px] aspect-[1.75/1] rounded-[24px] p-5 flex flex-col justify-between shadow-lg bg-black/10 border border-white/[0.16] backdrop-blur-md overflow-hidden">
          <div className="w-full flex items-center gap-3">
            <div
              className={`w-12 aspect-[1.75/1] rounded-[6px] p-1 flex justify-between items-start shadow-sm border border-white/20 flex-shrink-0 ${activeStyle.bgClass}`}
            >
              <div className="w-2 h-1 rounded-full bg-white/40" />
              <div className="w-2 h-1.5 rounded-[1px] bg-gradient-to-br from-[#D1D1D6] to-[#8E8E93]" />
            </div>

            <div className="flex flex-col">
              <span className="text-white text-[16px] font-bold tracking-tight leading-none mb-1">
                {balance}₽
              </span>
              <span className="text-white/70 text-[12px] font-medium leading-none">
                Введите сумму перевода
              </span>
            </div>
          </div>

          <div className="w-full flex items-center justify-center my-auto">
            <div className="relative flex items-center justify-center">
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={amount}
                onChange={handleAmountChange}
                placeholder="100"
                className="bg-transparent text-white text-[38px] font-bold tracking-tight text-right outline-none w-[170px] placeholder:text-white/30 caret-white"
              />
              <span className="text-white text-[38px] font-bold tracking-tight ml-1 pointer-events-none select-none">
                ₽
              </span>
            </div>
          </div>

          <div className="w-full" />
        </div>

        <div className="w-full max-w-[340px] mt-4">
          <JellyButton
            type="button"
            onClick={handleTransfer}
            flashColor="bg-black/10"
            className="w-full h-12 rounded-full flex items-center justify-center font-semibold text-[16px] shadow-sm transition-colors duration-300"
            style={{
              backgroundColor: activeStyle.accentColor,
              color: activeStyle.id === 'vanilla' ? '#19181F' : '#FFFFFF',
            }}
          >
            Перевести
          </JellyButton>
        </div>
      </div>
    </div>
  );
};
