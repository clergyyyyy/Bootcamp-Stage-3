'use client';

import { useState } from 'react';

type ButtonProps = {
  variant?: 'primary' | 'secondary' | 'gray';
  disabled?: boolean;
  selected?: boolean;
  children: React.ReactNode;
};

export default function Button({ variant = 'primary', disabled, children }: ButtonProps) {
  const [selected, setSelected] = useState(false);

  const base = 'px-4 py-2 rounded font-medium transition duration-200 transform hover:scale-105';
  let style = '';

  if (disabled) {
    style = 'bg-disabled text-white cursor-not-allowed opacity-50';
  } else if (variant === 'primary') {
    style = selected
    ? 'bg-primary text-white'
    : 'bg-primary/70 text-white hover:bg-primary/100';
  } else if (variant === 'secondary') {
    style = selected
      ? 'bg-secondary text-white'
      : 'bg-secondary/30 text-secondary hover:bg-secondary hover:text-white';
  }

  const interactive = !disabled ? 'active:scale-100' : '';

  return (
    <button
      className={`${base} ${style} ${interactive}`}
      disabled={disabled}
      onClick={() => {
        if (!disabled) setSelected(!selected);
      }}
    >
      {children}
    </button>
  );
}
