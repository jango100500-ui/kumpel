import React, { useState, useRef, useEffect } from 'react';
import { useOrientation } from '@/mechanics/useOrientation';
import { JellyButton } from '@/uis/JellyButton';
import { CardStyle } from '@/mechanics/bankStore';

interface TransferScreenProps {
  isActive: boolean;
  onBack: () => void;
  activeStyle: CardStyle;
  balance: number;
  currentBgImage: string;
}

const BARCODE_PATTERN = [
  2, 1, 1, 3, 1, 2, 4, 1, 1, 2, 3, 1, 1, 4, 2, 1, 2, 3, 1, 1,
  3, 2, 1, 1, 4, 1, 2, 1, 3, 1, 1, 2, 4, 1, 2, 1, 1, 3, 2, 1,
  1, 4, 1, 2, 3, 1, 2, 1, 1, 4, 2, 1, 3, 1, 1, 2, 1, 4, 2, 1
];

export const TransferScreen: React.FC<TransferScreenProps> = ({
  isActive,
  onBack,
  activeStyle,
  balance,
  currentBgImage,
}) => {
  const tilt = useOrientation(22);
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [errorText, setErrorText] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [receiptMeta, setReceiptMeta] = useState({ number: '000000', date: '', time: '' });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isActive) {
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

      const focusTimer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.click();
        }
      }, 100);

      return () => clearTimeout(focusTimer);
    } else {
      inputRef.current?.blur();
      const clearTimer = setTimeout(() => {
        setAmount('');
        setRecipient('');
        setErrorText(null);
        setSuccessMessage(null);
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

    setSuccessMessage(`Поздравляем! Перевод на ${num}₽ успешно выполнен!`);
    setTimeout(() => {
      onBack();
    }, 1600);
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

      <div className="relative z-10 w-full px-5 pt-3 pb-8 flex flex-col items-center justify-between flex-1 overflow-y-auto scroll-y-touch">
        <div className="w-full flex justify-between items-center mb-1 flex-shrink-0">
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

        <div className="w-full max-w-[340px] flex flex-col items-center my-auto -translate-y-4">
          <div className="relative w-full bg-[#FFFFFF] rounded-t-[24px] shadow-2xl p-5 text-black flex flex-col">
            <div className="flex flex-col items-center border-b border-dashed border-black/20 pb-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-[#E33125] flex items-center justify-center mb-1.5 shadow-sm p-2">
                <img
                  src="/logo.png"
                  alt="Bank Logo"
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
                <div className="flex flex-col flex-1">
                  <span className="text-[13px] font-semibold text-black tracking-tight leading-tight">
                    Сумма перевода
                  </span>
                  <span className="text-[10px] text-[#8E8E93] font-medium leading-tight mt-0.5">
                    от 10 до 9999₽ за один раз
                  </span>
                </div>
                <div className="flex items-center justify-end h-10 px-3 rounded-full bg-black/10 border border-white/[0.16] backdrop-blur-md w-[135px] shadow-inner">
                  <input
                    ref={inputRef}
                    autoFocus
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
                <div className="flex flex-col flex-1">
                  <span className="text-[13px] font-semibold text-black tracking-tight leading-tight">
                    Получатель
                  </span>
                  <span className="text-[10px] text-[#8E8E93] font-medium leading-tight mt-0.5">
                    имя получателя
                  </span>
                </div>
                <div className="flex items-center justify-end h-10 px-3 rounded-full bg-black/10 border border-white/[0.16] backdrop-blur-md w-[135px] shadow-inner">
                  <span className="text-[13px] font-semibold text-black/40 mr-0.5 select-none pointer-events-none">
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
              <div className="w-full flex items-center justify-between text-[11px] text-[#8E8E93] font-medium mb-2.5">
                <span>Комиссия за перевод</span>
                <span className="font-semibold text-black">0 ₽ (0%)</span>
              </div>

              <div className="w-full h-9 flex justify-center items-stretch gap-[1.5px] px-2 py-0.5 overflow-hidden">
                {BARCODE_PATTERN.map((w, index) => (
                  <div
                    key={index}
                    className="bg-black flex-shrink-0"
                    style={{ width: `${w}px` }}
                  />
                ))}
              </div>
              <span className="text-[10px] font-mono tracking-widest text-[#8E8E93] mt-1">
                KMPL-{receiptMeta.number}-TX
              </span>
            </div>
          </div>

          <div
            className="w-full h-3.5 bg-[#FFFFFF] shadow-2xl relative"
            style={{
              clipPath:
                'polygon(0% 0%, 5% 100%, 10% 0%, 15% 100%, 20% 0%, 25% 100%, 30% 0%, 35% 100%, 40% 0%, 45% 100%, 50% 0%, 55% 100%, 60% 0%, 65% 100%, 70% 0%, 75% 100%, 80% 0%, 85% 100%, 90% 0%, 95% 100%, 100% 0%)',
            }}
          />
        </div>

        <div className="w-full max-w-[340px] flex flex-col items-center flex-shrink-0">
          {successMessage && (
            <div className="w-full mb-3 px-4 py-3 rounded-2xl bg-black/40 border border-white/20 backdrop-blur-md text-white text-[13px] font-semibold text-center leading-tight shadow-lg transition-all animate-fade-in">
              {successMessage}
            </div>
          )}

          <JellyButton
            type="button"
            onClick={handleIssueCheck}
            disabled={Boolean(successMessage)}
            flashColor="bg-black/10"
            className="w-full h-12 rounded-full flex items-center justify-center font-semibold text-[16px] shadow-sm transition-all duration-300"
            style={{
              backgroundColor: activeStyle.accentColor,
              color: activeStyle.id === 'vanilla' ? '#19181F' : '#FFFFFF',
              opacity: isAmountValid() && !successMessage ? 1 : 0.6,
            }}
          >
            Выписать чек
          </JellyButton>
        </div>
      </div>
    </div>
  );
};
