import React from 'react';
import { useLocalization } from '@/mechanics/localization';
import { useOrientation } from '@/mechanics/useOrientation';

export const AuthScreen: React.FC = () => {
  const loc = useLocalization();
  const tilt = useOrientation(18);

  return (
    <div className="relative w-full h-full min-h-[100dvh] overflow-hidden flex flex-col justify-between select-none">
      <div
        className="absolute inset-[-40px] bg-cover bg-center pointer-events-none transition-transform duration-75 ease-out"
        style={{
          backgroundImage: 'url(/background.png)',
          transform: `translate3d(${tilt.x}px, ${tilt.y}px, 0) scale(1.1)`,
        }}
      />

      <div className="relative z-10 flex-1" />

      <div className="relative z-10 w-full px-7 pb-10 flex flex-col items-center">
        <div className="w-full max-w-[340px] flex flex-col items-center text-center">
          <h1 className="text-white text-[32px] font-semibold tracking-tight leading-tight">
            {loc.welcomeTitle}
          </h1>
          <p className="text-white/75 text-[17px] font-normal mt-1 mb-8">
            {loc.welcomeSubtitle}
          </p>

          <button
            type="button"
            className="w-full h-14 bg-white text-black text-[17px] font-semibold rounded-full shadow-lg active:scale-[0.98] transition-transform duration-150 flex items-center justify-center"
          >
            {loc.signIn}
          </button>

          <div className="w-full flex items-center justify-center my-5">
            <div className="h-[0.5px] bg-white/25 flex-1" />
            <span className="px-3 text-white/50 text-[13px] font-medium tracking-wide">
              {loc.or}
            </span>
            <div className="h-[0.5px] bg-white/25 flex-1" />
          </div>

          <div className="w-full grid grid-cols-3 gap-3">
            <button
              type="button"
              className="h-14 rounded-full bg-white/15 border border-white/25 backdrop-blur-md flex items-center justify-center active:scale-95 transition-transform duration-150"
            >
              <img
                src="/google.png"
                alt="Google"
                className="w-6 h-6 object-contain opacity-75 pointer-events-none"
              />
            </button>

            <button
              type="button"
              className="h-14 rounded-full bg-white/15 border border-white/25 backdrop-blur-md flex items-center justify-center active:scale-95 transition-transform duration-150"
            >
              <img
                src="/apple.png"
                alt="Apple"
                className="w-6 h-6 object-contain opacity-75 pointer-events-none"
              />
            </button>

            <button
              type="button"
              className="h-14 rounded-full bg-white/15 border border-white/25 backdrop-blur-md flex items-center justify-center active:scale-95 transition-transform duration-150"
            >
              <img
                src="/post.png"
                alt="Post"
                className="w-6 h-6 object-contain opacity-75 pointer-events-none"
              />
            </button>
          </div>

          <p className="mt-8 text-white/60 text-[12px] leading-relaxed text-center">
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
