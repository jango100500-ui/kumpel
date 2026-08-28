import React, { useState, useRef, useEffect } from 'react';
import { useOrientation } from '@/mechanics/useOrientation';
import { JellyButton } from '@/uis/JellyButton';
import { CardStyle } from '@/mechanics/bankStore';

interface TransferScreenProps {
  isActive: boolean;
  onBack: () => void;
  onSuccess: (amount: number) => void;
  activeStyle: CardStyle;
  balance: number;
  currentBgImage: string;
}

const hexToRgba = (hex: string, alpha: number) => {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const BarcodePattern: React.FC = () => {
  const bars = [
    2, 1, 3, 1, 1, 2, 4, 1, 2, 1, 3, 2, 1, 1, 4, 2, 1, 3, 1, 2,
    1, 4, 1, 2, 3, 1, 2, 1, 1, 3, 2, 4, 1, 1, 2, 3, 1, 2, 4, 1,
    2, 1, 3, 1, 2, 4, 1, 1, 3, 2, 1, 2, 4, 1, 3, 1, 2, 1, 1, 2
  ];

  return (
    <div className="w-full h-9 flex items-center justify-center gap-[2px] px-2 overflow-hidden">
      {bars.map((width, idx) => (
        <div
          key={idx}
          className="h-full bg-black flex-shrink-0"
          style={{ width: `${width}px` }}
        />
      ))}
    </div>
  );
};

export const TransferScreen: React.FC<TransferScreenProps> = ({
  isActive,
  onBack,
  onSuccess,
  activeStyle,
  balance,
  currentBgImage,
}) => {
  const tilt = useOrientation(22);
  const [isLoading, setIsLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [errorText, setErrorText] = useState<string | null>(null);
  const [receiptMeta, setReceiptMeta] = useState({ number: '000000', date: '', time: '' });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isActive) {
      setIsLoading(true);
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const randomNum = Math.floor(100000 + Math.random() * 900000).toString();

      setReceiptMeta({
        number: randomNum,
        date: `${day}.${month}.${year}`,
        time: `${hours}:${minutes}`,
      });

      const loadTimer = setTimeout(() => {
        setIsLoading(false);
      }, 320);

      const focusTimer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 480);

      return () => {
        clearTimeout(loadTimer);
        clearTimeout(focusTimer);
      };
    } else {
      inputRef.current?.blur();
      const clearTimer = setTimeout(() => {
        setAmount('');
        setRecipient('');
        setErrorText(null);
        setIsLoading(true);
      }, 400);
      return () => clearTimeout(clearTimer);
    }
  }, [isActive]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorText(null);
    const raw = e.target.value.replace(/\D/g, '');
    if (raw === '') {
      setAmount('');
      return;
    }

    let num = parseInt(raw, 10);
    if (num > 9999) num = 9999;
    if (num > balance) num = balance;

    setAmount(num.toString());
  };

  const handleRecipientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^a-zA-Z0-9_]/g, '');
    setRecipient(val);
  };

  const handleIssueCheck = () => {
    const num = parseInt(amount, 10);

    if (!num || isNaN(num) || num < 10) {
      setErrorText('Минимальная сумма — 10 ₽');
      return;
    }

    if (num > balance) {
      setErrorText('Недостаточно средств на балансе');
      return;
    }

    onBack();
    onSuccess(num);
  };

  const isAmountValid = () => {
    const num = parseInt(amount, 10);
    return !isNaN(num) && num >= 10 && num <= 9999 && num <= balance;
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

        <div className="w-full max-w-[340px] flex flex-col items-center mt-1 mb-auto min-h-[360px] justify-center">
          {isLoading ? (
            <div className="w-full flex flex-col items-center animate-pulse transition-opacity duration-300">
              <div className="w-full bg-white/70 backdrop-blur-md rounded-t-[24px] shadow-2xl p-5 flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-black/10 mb-2" />
                <div className="w-32 h-4 rounded-full bg-black/10 mb-1.5" />
                <div className="w-44 h-3 rounded-full bg-black/10 mb-4" />
                <div className="w-full h-[0.5px] bg-black/10 mb-4" />
                <div className="w-full h-11 rounded-full bg-black/10 mb-3" />
                <div className="w-full h-11 rounded-full bg-black/10 mb-4" />
                <div className="w-full h-[0.5px] bg-black/10 mb-3" />
                <div className="w-full h-8 rounded-lg bg-black/10" />
              </div>
              <div
                className="w-full h-3.5 bg-white/70 backdrop-blur-md shadow-2xl"
                style={{
                  clipPath:
                    'polygon(0% 0%, 4% 100%, 8% 0%, 12% 100%, 16% 0%, 20% 100%, 24% 0%, 28% 100%, 32% 0%, 36% 100%, 40% 0%, 44% 100%, 48% 0%, 52% 100%, 56% 0%, 60% 100%, 64% 0%, 68% 100%, 72% 0%, 76% 100%, 80% 0%, 84% 100%, 88% 0%, 92% 100%, 96% 0%, 100% 100%, 100% 0%)',
                }}
              />
            </div>
          ) : (
            <div className="w-full flex flex-col items-center transition-all duration-300 animate-in fade-in">
              <div className="relative w-full bg-[#FFFFFF] rounded-t-[24px] shadow-2xl p-5 text-black flex flex-col">
                <div className="flex flex-col items-center border-b border-dashed border-black/20 pb-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-[#E33125] flex items-center justify-center mb-1.5 shadow-sm p-2">
                    <img
                      src="/logo.png"
                      alt="Logo"
                      className="w-full h-full object-contain brightness-0 invert pointer-events-none"
                    />
                  </div>
                  <span className="text-[17px] font-bold tracking-tight uppercase">KUMPEL BANK</span>
                  <span className="text-[11px] font-semibold tracking-widest text-[#8E8E93] uppercase">
                    Электронный чек №{receiptMeta.number}
                  </span>
                  <div className="flex gap-3 text-[11px] text-[#8E8E93] mt-1 font-medium">
                    <span>{receiptMeta.date}</span>
                    <span>•</span>
                    <span>{receiptMeta.time}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3 py-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="text-[13px] font-semibold text-black tracking-tight leading-tight">
                        Сумма перевода
                      </span>
                      <span className="text-[10px] text-[#8E8E93] font-medium leading-tight">
                        от 10 до 9999₽ за один раз
                      </span>
                    </div>
                    <div className="flex items-center justify-end bg-black/[0.08] border border-black/[0.12] backdrop-blur-md px-3 py-1.5 rounded-full w-[130px] shadow-inner">
                      <input
                        ref={inputRef}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={amount}
                        onChange={handleAmountChange}
                        placeholder="0"
                        className="w-full bg-transparent text-right font-bold text-[17px] text-black outline-none placeholder:text-black/30 caret-[#E33125]"
                      />
                      <span className="text-[15px] font-bold text-black ml-1 select-none pointer-events-none">
                        ₽
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="text-[13px] font-semibold text-black tracking-tight leading-tight">
                        Получатель
                      </span>
                      <span className="text-[10px] text-[#8E8E93] font-medium leading-tight">
                        имя получателя
                      </span>
                    </div>
                    <div className="flex items-center justify-end bg-black/[0.08] border border-black/[0.12] backdrop-blur-md px-3 py-1.5 rounded-full w-[130px] shadow-inner">
                      <span className="text-[13px] font-semibold text-[#8E8E93] mr-0.5 select-none pointer-events-none">
                        @
                      </span>
                      <input
                        type="text"
                        value={recipient}
                        onChange={handleRecipientChange}
                        placeholder="username"
                        className="w-full bg-transparent text-left font-semibold text-[13px] text-black outline-none placeholder:text-black/30 caret-[#E33125]"
                      />
                    </div>
                  </div>
                </div>

                {errorText && (
                  <p className="text-[#E33125] text-[11px] font-semibold text-center mt-2">
                    {errorText}
                  </p>
                )}

                <div className="border-t border-dashed border-black/20 mt-3 pt-3 flex flex-col items-center">
                  <div className="w-full flex items-center justify-between text-[11px] text-[#8E8E93] font-medium mb-2">
                    <span>Комиссия за перевод</span>
                    <span className="font-semibold text-black">0 ₽ (0%)</span>
                  </div>

                  <BarcodePattern />

                  <span className="text-[9px] font-mono tracking-widest text-[#8E8E93] mt-1">
                    KMPL-{receiptMeta.number}-TX
                  </span>
                </div>
              </div>

              <div
                className="w-full h-3.5 bg-[#FFFFFF] shadow-2xl relative"
                style={{
                  clipPath:
                    'polygon(0% 0%, 4% 100%, 8% 0%, 12% 100%, 16% 0%, 20% 100%, 24% 0%, 28% 100%, 32% 0%, 36% 100%, 40% 0%, 44% 100%, 48% 0%, 52% 100%, 56% 0%, 60% 100%, 64% 0%, 68% 100%, 72% 0%, 76% 100%, 80% 0%, 84% 100%, 88% 0%, 92% 100%, 96% 0%, 100% 100%, 100% 0%)',
                }}
              />
            </div>
          )}
        </div>

        <div className="w-full max-w-[340px] mt-2">
          <JellyButton
            type="button"
            onClick={handleIssueCheck}
            flashColor="bg-white/20"
            className="w-full h-12 rounded-full flex items-center justify-center font-semibold text-[16px] backdrop-blur-md border border-white/30 shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all duration-300"
            style={{
              backgroundColor: isAmountValid()
                ? hexToRgba(activeStyle.accentColor, 0.78)
                : 'rgba(0, 0, 0, 0.12)',
              color: isAmountValid()
                ? activeStyle.id === 'vanilla'
                  ? '#19181F'
                  : '#FFFFFF'
                : 'rgba(255, 255, 255, 0.45)',
            }}
          >
            Выписать чек
          </JellyButton>
        </div>
      </div>
    </div>
  );
};
