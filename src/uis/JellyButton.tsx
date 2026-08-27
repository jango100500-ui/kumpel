import React, { useState, useRef } from 'react';

interface JellyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  flashColor?: string;
}

interface Ripple {
  x: number;
  y: number;
  id: number;
}

export const JellyButton: React.FC<JellyButtonProps> = ({
  children,
  className = '',
  flashColor = 'bg-white/40',
  onClick,
  ...props
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    setIsPressed(true);

    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const newRipple = { x, y, id: Date.now() };

      setRipples((prev) => [...prev, newRipple]);

      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
      }, 400);
    }
  };

  const handlePointerUp = () => {
    setIsPressed(false);
  };

  return (
    <button
      ref={buttonRef}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onClick={onClick}
      className={`relative overflow-hidden select-none cursor-pointer ${
        isPressed ? 'jelly-active' : 'jelly-idle'
      } ${className}`}
      {...props}
    >
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className={`absolute rounded-full pointer-events-none animate-ripple ${flashColor}`}
          style={{
            left: `${ripple.x}px`,
            top: `${ripple.y}px`,
            width: '100px',
            height: '100px',
          }}
        />
      ))}
      {children}
    </button>
  );
};
