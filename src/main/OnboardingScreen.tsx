import React, { useState, useRef, useEffect } from 'react';
import { useOrientation } from '@/mechanics/useOrientation';
import { JellyButton } from '@/uis/JellyButton';

interface OnboardingScreenProps {
  onComplete: (profile: { name: string; username: string; avatar: string | null }) => void;
}

const RANDOM_NAMES = [
  'Oliver', 'Julian', 'Adrian', 'Felix', 'Jasper', 'Arthur',
  'Leo', 'Ethan', 'Lucas', 'Dorian', 'Liam', 'Elena',
  'Stella', 'Maya', 'Nora', 'Clara', 'Victor', 'Oscar'
];

const PLACEHOLDERS = ['Твое имя здесь', 'Введите имя'];

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const tilt = useOrientation(22);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [placeholder, setPlaceholder] = useState(PLACEHOLDERS[0]);
  const [isAnimatingName, setIsAnimatingName] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const randomPh = PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)];
    setPlaceholder(randomPh);
  }, []);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^a-zA-Z]/g, '');
    setName(raw);
    if (!username || username === name.toLowerCase()) {
      setUsername(raw.toLowerCase());
    }
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
    setUsername(raw);
  };

  const handleRandomName = () => {
    const available = RANDOM_NAMES.filter((n) => n !== name);
    const chosen = available[Math.floor(Math.random() * available.length)];
    setName(chosen);
    setUsername(chosen.toLowerCase());

    setIsAnimatingName(true);
    setTimeout(() => setIsAnimatingName(false), 450);

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(15);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setAvatar(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    const finalName = name.trim() || 'Kumpel';
    const finalUsername = username.trim() || finalName.toLowerCase();
    onComplete({
      name: finalName,
      username: finalUsername,
      avatar,
    });
  };

  return (
    <div className="relative w-full h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col justify-between select-none bg-transparent">
      <div
        className="absolute top-0 left-[-50px] right-[-50px] bottom-0 bg-cover bg-center pointer-events-none will-change-transform transition-opacity duration-200"
        style={{
          backgroundImage: 'url(/question1.png)',
          transform: `translate3d(${tilt.x}px, ${tilt.y}px, 0) scale(1.12)`,
        }}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="relative z-10 w-full px-7 pt-16 pb-8 flex flex-col items-center justify-between flex-1 overflow-y-auto scroll-y-touch">
        <div className="w-full max-w-[340px] flex flex-col items-center text-center">
          
          <div
            onClick={handleAvatarClick}
            className="w-24 h-24 rounded-full relative p-1 bg-black/20 border border-white/[0.2] backdrop-blur-md flex items-center justify-center cursor-pointer shadow-lg active:scale-95 transition-transform mb-5 overflow-hidden"
          >
            {avatar ? (
              <img
                src={avatar}
                alt="Avatar"
                className="w-full h-full object-cover rounded-full pointer-events-none"
              />
            ) : (
              <div className="w-full h-full rounded-full flex items-center justify-center bg-white/10 animate-pulse transition-opacity duration-500">
                <img
                  src="/add.png"
                  alt="Add Photo"
                  className="w-7 h-7 object-contain brightness-0 invert opacity-80 pointer-events-none"
                />
              </div>
            )}
          </div>

          <h1 className="text-white text-[22px] font-bold tracking-tight leading-snug mb-6">
            Давайте познакомимся!<br />Как Вас зовут?
          </h1>

          <div className="w-full flex flex-col gap-1.5 mb-4">
            <div className="w-full h-12 rounded-full bg-black/15 border border-white/[0.2] backdrop-blur-md flex items-center px-4 justify-between shadow-inner">
              <div className="flex-1 flex items-center overflow-hidden">
                {isAnimatingName ? (
                  <span className="inline-flex items-center text-white font-semibold text-[15px] tracking-tight">
                    {name.split('').map((char, index) => (
                      <span
                        key={`${char}-${index}`}
                        className="inline-block"
                        style={{
                          animation: `jelly-pop 0.36s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 22}ms both`,
                        }}
                      >
                        {char}
                      </span>
                    ))}
                  </span>
                ) : (
                  <input
                    type="text"
                    value={name}
                    onChange={handleNameChange}
                    placeholder={placeholder}
                    className="w-full bg-transparent text-white font-semibold text-[15px] outline-none placeholder:text-white/40 caret-white"
                  />
                )}
              </div>

              <button
                type="button"
                onClick={handleRandomName}
                className="w-8 h-8 rounded-full bg-white/15 active:scale-90 transition-all flex items-center justify-center flex-shrink-0 ml-2"
              >
                <img
                  src="/name.png"
                  alt="Random Name"
                  className="w-4 h-4 object-contain brightness-0 invert opacity-90 pointer-events-none"
                />
              </button>
            </div>
            <p className="text-white/60 text-[11px] font-medium text-left px-3">
              Только латинские буквы
            </p>
          </div>

          <div className="w-full flex flex-col gap-1.5">
            <div className="w-full h-12 rounded-full bg-black/15 border border-white/[0.2] backdrop-blur-md flex items-center px-4 shadow-inner">
              <span className="text-white/60 font-semibold text-[15px] mr-0.5 select-none">
                @
              </span>
              <input
                type="text"
                value={username}
                onChange={handleUsernameChange}
                placeholder="username"
                className="w-full bg-transparent text-white font-semibold text-[15px] outline-none placeholder:text-white/40 caret-white"
              />
            </div>
            <p className="text-white/60 text-[11px] font-medium text-left px-3">
              Юзернейм нельзя будет изменить
            </p>
          </div>
        </div>

        <div className="w-full max-w-[340px] mt-8">
          <JellyButton
            type="button"
            onClick={handleSubmit}
            flashColor="bg-black/10"
            className="w-full h-12 bg-white text-black text-[16px] font-semibold rounded-full flex items-center justify-center shadow-md active:scale-98 transition-all"
          >
            Погрузиться в мир Kumpel
          </JellyButton>
        </div>
      </div>
    </div>
  );
};
