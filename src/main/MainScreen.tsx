import React from 'react';
import { useOrientation } from '@/mechanics/useOrientation';
import { JellyButton } from '@/uis/JellyButton';

export const MainScreen: React.FC = () => {
  const tilt = useOrientation(22);

  return (
    <div className="relative w-full h-full min-h-[100dvh] overflow-hidden flex flex-col bg-[#3F84C8] select-none">
      <div
        className="absolute top-0 left-[-50px] right-[-50px] bottom-0 bg-cover bg-center pointer-events-none will-change-transform"
        style={{
          backgroundImage: 'url(/background2.png)',
          transform: `translate3d(${tilt.x}px, ${tilt.y}px, 0) scale(1.12)`,
        }}
      />

      <div className="relative z-10 w-full px-5 pt-3 pb-4 flex flex-col items-center">
        <div className="w-full flex justify-end mb-3">
          <JellyButton
            type="button"
            flashColor="bg-white/15"
            className="w-11 h-11 rounded-full bg-black/10 border border-white/[0.16] backdrop-blur-md flex items-center justify-center"
          >
            <img
              src="/edit.png"
              alt="Edit"
              className="w-5 h-5 object-contain brightness-0 invert opacity-75 pointer-events-none"
            />
          </JellyButton>
        </div>

        <div className="relative w-full max-w-[340px] aspect-[1.75/1] bg-[#E33125] rounded-[24px] p-5 flex flex-col justify-between overflow-hidden shadow-lg">
          <div className="w-full flex justify-start items-start">
            <span className="text-[#19181F] text-[17px] font-semibold tracking-wide">
              Kumpel
            </span>
          </div>

          <div className="w-full flex justify-between items-end">
            <div className="flex flex-col">
              <span className="text-[#19181F] text-[28px] font-bold tracking-tight leading-none mb-1">
                500₽
              </span>
              <span className="text-[#19181F] text-[15px] font-medium tracking-widest opacity-80">
                ***5678
              </span>
            </div>
            <img
              src="/logo.png"
              alt="Bank Logo"
              className="w-10 h-10 object-contain brightness-0 opacity-90 pointer-events-none"
            />
          </div>
        </div>

        <div className="w-full max-w-[340px] flex gap-3 mt-4">
          <JellyButton
            type="button"
            flashColor="bg-white/15"
            className="flex-1 h-12 rounded-full bg-black/10 border border-white/[0.16] backdrop-blur-md flex items-center justify-center gap-2"
          >
            <img
              src="/share.png"
              alt="Share"
              className="w-4 h-4 object-contain brightness-0 invert opacity-75 pointer-events-none"
            />
            <span className="text-white/90 text-[15px] font-medium tracking-wide">
              Перевод
            </span>
          </JellyButton>

          <JellyButton
            type="button"
            flashColor="bg-white/15"
            className="flex-1 h-12 rounded-full bg-black/10 border border-white/[0.16] backdrop-blur-md flex items-center justify-center"
          >
            <span className="text-white/90 text-[15px] font-medium tracking-wide">
              7д 0ч 0м
            </span>
          </JellyButton>
        </div>
      </div>

      <div className="relative z-10 w-full flex-1 bg-white" />
    </div>
  );
};
