import React, { useState, useRef, useEffect } from 'react';
import { useOrientation } from '@/mechanics/useOrientation';
import { JellyButton } from '@/uis/JellyButton';

interface AuthCodeScreenProps {
  isActive: boolean;
  onBack: () => void;
  onVerify: (code: string) => Promise<void>;
}

export const AuthCodeScreen: React.FC<AuthCodeScreenProps> = ({ isActive, onBack, onVerify }) => {
  const tilt = useOrientation(22);
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isActive) {
      const timer = setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 460);
      return () => clearTimeout(timer);
    } else {
      inputRefs.current.forEach((el) => el?.blur());
      setCode(['', '', '', '', '', '']);
      setIsSubmitting(false);
    }
  }, [isActive]);

  const triggerVerification = async (codeArray: string[]) => {
    const fullCode = codeArray.join('');
    if (fullCode.length === 6 && !isSubmitting) {
      setIsSubmitting(true);
      try {
        await onVerify(fullCode);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (pasted.length > 0) {
      const newCode = ['', '', '', '', '', ''];
      for (let i = 0; i < pasted.length; i++) {
        newCode[i] = pasted[i];
      }
      setCode(newCode);
      const nextFocus = Math.min(pasted.length, 5);
      inputRefs.current[nextFocus]?.focus();
      if (pasted.length === 6) {
        triggerVerification(newCode);
      }
    }
  };

  const handleChange = (index: number, value: string) => {
    const val = value.replace(/[^0-9]/g, '');
    if (!val && value !== '') return;

    const newCode = [...code];
    newCode[index] = val.slice(-1);
    setCode(newCode);

    if (val && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newCode.every((c) => c.length === 1)) {
      triggerVerification(newCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = () => {
    triggerVerification(code);
  };

  const isComplete = code.every((char) => char.length === 1);

  return (
    <div className="relative w-full h-full min-h-[100dvh] overflow-hidden flex flex-col justify-between select-none bg-transparent">
      <div
        className="absolute inset-[-100px] bg-cover bg-center pointer-events-none will-change-transform"
        style={{
          backgroundImage: 'url(/question1.png)',
          transform: `translate3d(${tilt.x}px, ${tilt.y}px, 0) scale(1.25)`,
        }}
      />

      <div className="relative z-10 w-full px-5 pt-3 pb-8 flex flex-col items-center justify-between flex-1 overflow-y-auto scroll-y-touch">
        <div className="w-full flex justify-between items-center mb-6">
          <JellyButton
            type="button"
            onClick={onBack}
            flashColor="bg-white/15"
            className="w-11 h-11 rounded-full bg-black/10 border border-white/[0.16] backdrop-blur-md flex items-center justify-center shadow-sm"
          >
            <img
              src="/close.png"
              alt="Close"
              className="w-4 h-4 object-contain brightness-0 invert opacity-75 pointer-events-none"
            />
          </JellyButton>
        </div>

        <div className="w-full max-w-[340px] flex flex-col items-center text-center mt-4 mb-auto">
          <h2 className="text-white text-[24px] font-bold tracking-tight mb-8">
            Введите код
          </h2>

          <div className="flex gap-2 mb-6">
            {code.map((char, i) => (
              <input
                key={i}
                ref={(el) => (inputRefs.current[i] = el)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={char}
                onPaste={handlePaste}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="w-11 h-14 bg-black/20 border border-white/20 backdrop-blur-md rounded-[14px] text-center text-white text-[22px] font-bold outline-none focus:border-white/60 transition-colors shadow-inner"
              />
            ))}
          </div>

          <p className="text-white/70 text-[13px] font-medium leading-relaxed px-2">
            Проверьте уведомления. Код активен в течение 2 минут.
          </p>
        </div>

        <div className="w-full max-w-[340px] mt-8">
          <JellyButton
            type="button"
            onClick={handleSubmit}
            flashColor="bg-black/10"
            className={`w-full h-12 rounded-full flex items-center justify-center font-semibold text-[16px] shadow-md border border-white/20 transition-all duration-300 ${
              isComplete && !isSubmitting ? 'bg-white text-black' : 'bg-white/20 text-white/50 pointer-events-none'
            }`}
          >
            {isSubmitting ? 'Проверяем...' : 'Продолжить'}
          </JellyButton>
        </div>
      </div>
    </div>
  );
};
