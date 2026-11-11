import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';

interface ResilientImageProps {
  src: string;
  alt: string;
  className?: string;
  aspectClassName?: string;
  priority?: boolean;
}

export const ResilientImage: React.FC<ResilientImageProps> = ({
  src,
  alt,
  className = 'w-full h-full object-cover',
  aspectClassName = '',
  priority = false,
}) => {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-[#EBEAE4] text-[#0A0A0B] p-6 text-center select-none ${aspectClassName} ${className}`}
        role="img"
        aria-label={alt}
      >
        <Sparkles className="w-6 h-6 mb-2 text-[#6E6E73]" />
        <span className="font-display text-xs tracking-widest uppercase text-[#0A0A0B]">
          AURA ATELIER
        </span>
        <span className="text-xs text-[#6E6E73] mt-1 line-clamp-2 max-w-[20ch]">
          {alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      loading={priority ? 'eager' : 'lazy'}
      onError={() => setHasError(true)}
      className={`${aspectClassName} ${className}`}
    />
  );
};
