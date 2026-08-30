import React, { useState } from 'react';
import { useLocalization } from '@/mechanics/localization';
import { useOrientation } from '@/mechanics/useOrientation';
import { JellyButton } from '@/uis/JellyButton';
import { api } from '@/mechanics/api';

interface AuthScreenProps {
  onNext: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onNext }) => {
  const loc = useLocalization();
  const tilt = useOrientation(22);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const code = await api.requestAuthCode();
      const message = `Код проверки для входа в Kumpel — ${code}. Этот код будет активен в течение следующих двух минут.`;
      
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('Kumpel Bank', { body: message, icon: '/logo.png' });
      } else {
        alert(message);
      }
      onNext();
    } catch {
      alert('Ошибка соединения с базой данных');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestPush = () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      Notification.requestPermission().then(() => handleLogin());
    } else {
      handleLogin();
    }
  };

  return (
    <div className="relative w-full h-full min-h-[100dvh] overflow-hidden flex flex-col justify-between select-none bg-transparent">
      <div
        className="absolute inset-[-50px] bg-cover bg-center pointer-events-none will-change-transform"
        style={{
          backgroundImage: 'url(/background.png)',
          transform: `translate3d(${tilt.x}px, ${tilt.y}px, 0) scale(1.12)`,
        }}
      />

      <div className="relative z-10 flex-1" />

      <div className="relative z-10 w-full px-7 pb-10 flex flex-col items-center">
        <div className="w-full max-w-[320px] flex flex-col items-center text-center">
          <h1 className="text-white text-[24px] font-semibold tracking-tight leading-tight">
            {loc.welcomeTitle}
          </h1>
          <h2 className="text-white/75 text-[24px] font-semibold tracking-tight leading-tight mt-1 mb-8">
            {loc.welcomeSubtitle}
          </h2>

          <JellyButton
            type="button"
            onClick={handleRequestPush}
            flashColor="bg-black/10"
            className="w-full h-12 bg-white text-black text-[16px] font-semibold rounded-full flex items-center justify-center shadow-none"
          >
            {isLoading ? 'Генерация кода...' : 'Войти через код'}
          </JellyButton>

          <p className="mt-7 text-white/60 text-[12px] leading-relaxed text-center">
            {loc.termsPrefix}{' '}
            <span className="underline underline-offset-2 text-white/80 cursor-pointer">
              {loc.termsLink}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};
