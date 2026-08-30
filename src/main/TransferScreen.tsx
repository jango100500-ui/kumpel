import React, { useState, useRef, useEffect } from 'react';
import { JellyButton } from '@/uis/JellyButton';
import { CardStyle } from '@/mechanics/bankStore';
import { api } from '@/mechanics/api';

interface TransferScreenProps {
  isActive: boolean;
  onBack: () => void;
  onSuccess: (amount: number) => void;
  activeStyle: CardStyle;
  balance: number;
  token: string | null;
}

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
          className="h-full bg-black dark:bg-white flex-shrink-0"
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
  token,
}) => {
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [errorText, setErrorText] = useState<string | null>(null);
  const [receiptMeta, setReceiptMeta] = useState({ number: '000000', date: '', time: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
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
        }
      }, 460);

      return () => clearTimeout(focusTimer);
    } else {
      inputRef.current?.blur();
      const clearTimer = setTimeout(() => {
        setAmount('');
        setRecipient('');
        setErrorText(null);
        setIsSubmitting(false);
      }, 400);
      return () => clearTimeout(clearTimer);
    }
  }, [isActive]);

  const getMaxAllowed = (bal: number) => {
    let max = bal;
    if (bal > 75) {
      let maxWithComm = Math.floor(bal / 1.05);
      while (maxWithComm + Math.ceil(maxWithComm * 0.05) > bal) {
        maxWithComm--;
      }
      max = Math.max(75, maxWithComm);
    }
    return Math.min(max, 9999);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorText(null);
    const raw = e.target.value.replace(/\D/g, '');
    if (raw === '') {
      setAmount('');
      return;
    }

    let num = parseInt(raw, 10);
    const maxAllowed = getMaxAllowed(balance);
    
    if (num > maxAllowed) num = maxAllowed;

    setAmount(num.toString());
  };

  const handleAmountBlur = () => {
    if (amount === '') return;
    let num = parseInt(amount, 10);
    const maxAllowed = getMaxAllowed(balance);
    
    if (num > maxAllowed) num = maxAllowed;
    if (num < 10 && maxAllowed >= 10) num = 10;
    
    setAmount(num.toString());
  };

  const handleRecipientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^a-zA-Z0-9_]/g, '');
    setRecipient(val);
  };

  const calculatedCommission = () => {
    const num = parseInt(amount, 10);
    if (isNaN(num) || num <= 75) return 0;
    return Math.ceil(num * 0.05);
  };

  const handleIssueCheck = async () => {
    const num = parseInt(amount, 10);

    if (!num || isNaN(num) || num < 10) {
      setErrorText('Минимальная сумма — 10 ₭');
      return;
    }

    if (!recipient.trim()) {
      setErrorText('Введите имя получателя');
      return;
    }

    if (!token) {
      setErrorText('Ошибка авторизации');
      return;
    }

    const totalNeeded = num + calculatedCommission();
    if (totalNeeded > balance) {
      setErrorText(`Недостаточно средств (нужно ${totalNeeded} ₭ с комиссией)`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.transfer({
        token,
        recipient: recipient.trim(),
        amount: num,
      });

      if (res.success) {
        onBack();
        onSuccess(num);
      } else {
        setErrorText(res.error || 'Ошибка при переводе');
      }
    } catch {
      setErrorText('Сервер недоступен, попробуйте позже');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAmountValid = () => {
    const num = parseInt(amount, 10);
    const total = num + calculatedCommission();
    return !isNaN(num) && num >= 10 && num <= 9999 && total <= balance && recipient.trim().length > 0;
  };

  return (
    <div className="relative w-full h-full overflow-hidden flex flex-col justify-between select-none bg-transparent">
      <div 
        className="relative z-10 w-full px-5 pb-6 flex flex-col items-center justify-between flex-1 overflow-y-auto scroll-y-touch"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 48px)' }}
      >
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

        <div className="w-full max-w-[340px] flex flex-col items-center mt-1 mb-auto">
          <div className="relative w-full bg-[#FFFFFF] dark:bg-[#1C1C1E] rounded-t-[24px] shadow-2xl p-5 flex flex-col">
            <div className="flex flex-col items-center border-b border-dashed border-black/20 dark:border-white/20 pb-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-[#E33125] flex items-center justify-center mb-1.5 shadow-sm p-2">
                <img
                  src="/logo.png"
                  alt="Logo"
                  className="w-full h-full object-contain brightness-0 invert pointer-events-none"
                />
              </div>
              <span className="text-black dark:text-white text-[17px] font-bold tracking-tight uppercase">KUMPEL BANK</span>
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
                  <span className="text-black dark:text-white text-[13px] font-semibold tracking-tight leading-tight">
                    Сумма перевода
                  </span>
                  <span className="text-[10px] text-[#8E8E93] font-medium leading-tight">
                    от 10 до 9999 ₭ за один раз
                  </span>
                </div>
                <div className="flex items-center justify-end bg-black/[0.08] dark:bg-white/[0.12] border border-black/[0.12] dark:border-white/[0.12] backdrop-blur-md px-3 py-1.5 rounded-full w-[130px] shadow-inner">
                  <input
                    ref={inputRef}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={amount}
                    onChange={handleAmountChange}
                    onBlur={handleAmountBlur}
                    placeholder="0"
                    className="w-full bg-transparent text-right font-bold text-[17px] text-black dark:text-white outline-none placeholder:text-black/30 dark:placeholder:text-white/30 caret-[#E33125]"
                  />
                  <span className="text-[15px] font-bold text-black dark:text-white ml-1 select-none pointer-events-none">
                    ₭
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-col">
                  <span className="text-black dark:text-white text-[13px] font-semibold tracking-tight leading-tight">
                    Получатель
                  </span>
                  <span className="text-[10px] text-[#8E8E93] font-medium leading-tight">
                    имя получателя
                  </span>
                </div>
                <div className="flex items-center justify-end bg-black/[0.08] dark:bg-white/[0.12] border border-black/[0.12] dark:border-white/[0.12] backdrop-blur-md px-3 py-1.5 rounded-full w-[130px] shadow-inner">
                  <span className="text-[13px] font-semibold text-[#8E8E93] mr-0.5 select-none pointer-events-none">
                    @
                  </span>
                  <input
                    type="text"
                    value={recipient}
                    onChange={handleRecipientChange}
                    placeholder="username"
                    className="w-full bg-transparent text-left font-semibold text-[13px] text-black dark:text-white outline-none placeholder:text-black/30 dark:placeholder:text-white/30 caret-[#E33125]"
                  />
                </div>
              </div>
            </div>

            {errorText && (
              <p className="text-[#E33125] text-[11px] font-semibold text-center mt-2">
                {errorText}
              </p>
            )}

            <div className="border-t border-dashed border-black/20 dark:border-white/20 mt-3 pt-3 flex flex-col items-center">
              <div className="w-full flex items-center justify-between text-[11px] text-[#8E8E93] font-medium mb-2">
                <span>Комиссия за перевод</span>
                <span className="font-semibold text-black dark:text-white">
                  {calculatedCommission()} ₭ ({parseInt(amount, 10) > 75 ? '5%' : '0%'})
                </span>
              </div>

              <BarcodePattern />

              <span className="text-[9px] font-mono tracking-widest text-[#8E8E93] mt-1">
                KMPL-{receiptMeta.number}-TX
              </span>
            </div>
          </div>

          <div
            className="w-full h-3.5 bg-[#FFFFFF] dark:bg-[#1C1C1E] shadow-2xl relative"
            style={{
              clipPath:
                'polygon(0% 0%, 4% 100%, 8% 0%, 12% 100%, 16% 0%, 20% 100%, 24% 0%, 28% 100%, 32% 0%, 36% 100%, 40% 0%, 44% 100%, 48% 0%, 52% 100%, 56% 0%, 60% 100%, 64% 0%, 68% 100%, 72% 0%, 76% 100%, 80% 0%, 84% 100%, 88% 0%, 92% 100%, 96% 0%, 100% 100%, 100% 0%)',
            }}
          />
        </div>

        <div className="w-full max-w-[340px] mt-2">
          <JellyButton
            type="button"
            onClick={handleIssueCheck}
            flashColor={isAmountValid() ? 'bg-black/10' : 'bg-white/10'}
            className={`w-full h-12 rounded-full flex items-center justify-center font-semibold text-[16px] backdrop-blur-md border transition-all duration-300 ${
              isAmountValid() && !isSubmitting
                ? 'border-white/20 shadow-md'
                : 'bg-black/15 border-white/[0.16] text-white/50 shadow-none pointer-events-none'
            }`}
            style={{
              backgroundColor: isAmountValid() ? activeStyle.accentColor : undefined,
              color: isAmountValid()
                ? activeStyle.id === 'vanilla'
                  ? '#19181F'
                  : '#FFFFFF'
                : undefined,
            }}
          >
            {isSubmitting ? 'Выписываем чек...' : 'Выписать чек'}
          </JellyButton>
        </div>
      </div>
    </div>
  );
};
