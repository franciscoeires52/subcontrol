import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export function LoadingSpinner({ size = 'md', text, className = '' }: LoadingSpinnerProps) {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
  };

  return (
    <div className={`flex items-center justify-center gap-2.5 text-zinc-400 ${className}`}>
      <Loader2 className={`${sizeMap[size]} animate-spin text-indigo-400`} />
      {text && <span className="text-sm font-medium text-zinc-300">{text}</span>}
    </div>
  );
}
