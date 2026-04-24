import { useState } from 'react';

interface LogoBrandProps {
  size?: 'sm' | 'md';
  className?: string;
}

const sizeClasses = {
  sm: 'w-32 h-32',
  md: 'w-40 h-40',
  lg: 'w-64 h-64',
  xl: 'w-80 h-80',
};

export default function LogoBrand({ size = 'sm', className = '' }: LogoBrandProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div
        className={`${sizeClasses[size]} bg-guarawatch-accent rounded-full flex items-center justify-center ${className}`}
        aria-hidden="true"
      >
        🔥
      </div>
    );
  }

  return (
    <img
      src="/images/guarawatch-logo.png"
      alt="Símbolo do GuaráWatch"
      className={`${sizeClasses[size]} object-contain ${className}`}
      onError={() => setHasError(true)}
    />
  );
}