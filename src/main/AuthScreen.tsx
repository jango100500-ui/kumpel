import React from 'react';
import { useLocalization } from '@/mechanics/localization';
import { useOrientation } from '@/mechanics/useOrientation';
import { JellyButton } from '@/uis/JellyButton';

interface AuthScreenProps {
  onSignIn: () => void;
  currentBgImage: string;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onSignIn, currentBgImage }) => {
  const loc = useLocalization();
  const tilt = useOrientation(22);

  return (
    <div className="relative w-full h-full min-h-[100dvh] overflow-hidden flex flex-col justify-between select-none bg-transparent">
      <div
        className="absolute inset-[-50px] bg-cover bg-center pointer-events-none will-change-transform transition-opacity duration-300"
        style={{
          backgroundImage: `url(${currentBgImage})`,
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
            onClick={onSignIn}
            flashColor="bg-white/20"
            className="w-full h-12 bg-white/25 border border-white/40 backdrop-blur-md text-white text-[16px] font-semibold rounded-full flex items-center justify-center shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
          >
            {loc.signIn}
          </JellyButton>

          <div className="w-full flex items-center justify-center my-4">
            <div className="h-[0.5px] bg-white/60 flex-1" />
            <span className="px-3 text-white/60 text-[13px] font-medium tracking-wide">
              {loc.or}
            </span>
            <div className="h-[0.5px] bg-white/60 flex-1" />
          </div>

          <div className="w-full grid grid-cols-3 gap-2.5">
            <JellyButton
              type="button"
              flashColor="bg-white/15"
              className="h-12 rounded-full bg-black/10 border border-white/[0.16] backdrop-blur-md flex items-center justify-center"
            >
              <img
                src="/google.png"
                alt="Google"
                className="w-5 h-5 object-contain brightness-0 invert opacity-75 pointer-events-none"
              />
            </JellyButton>

            <JellyButton
              type="button"
              flashColor="bg-white/15"
              className="h-12 rounded-full bg-black/10 border border-white/[0.16] backdrop-blur-md flex items-center justify-center"
            >
              <img
                src="/apple.png"
                alt="Apple"
                className="w-5 h-5 object-contain brightness-0 invert opacity-75 pointer-events-none"
              />
            </JellyButton>

            <JellyButton
              type="button"
              flashColor="bg-white/15"
              className="h-12 rounded-full bg-black/10 border border-white/[0.16] backdrop-blur-md flex items-center justify-center"
            >
              <img
                src="/telegram.png"
                alt="Telegram"
                className="w-5 h-5 object-contain brightness-0 invert opacity-75 pointer-events-none"
              />
            </JellyButton>
          </div>

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
