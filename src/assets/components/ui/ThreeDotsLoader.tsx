import React from 'react';

export interface ThreeDotsLoaderProps {
  /**
   * Dot size variant
   * @default 'md'
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /**
   * Tailwind background color class or hex string (e.g. 'bg-[#2998d6]', 'bg-emerald-600')
   * @default 'bg-[#2998d6]'
   */
  color?: string;
  /**
   * Optional helper label to show next to or below the bouncing dots
   */
  text?: string;
  /**
   * Layout position of the label relative to dots
   * @default 'right'
   */
  textPosition?: 'right' | 'bottom';
  /**
   * Additional wrapper class names
   */
  className?: string;
  /**
   * Center the loader vertically in a padded container/card
   * @default false
   */
  centered?: boolean;
  /**
   * Full viewport/container overlay with backdrop blur
   * @default false
   */
  overlay?: boolean;
}

const sizeClasses: Record<NonNullable<ThreeDotsLoaderProps['size']>, { dot: string; gap: string; text: string }> = {
  xs: { dot: 'w-1 h-1', gap: 'gap-1', text: 'text-[10px]' },
  sm: { dot: 'w-1.5 h-1.5', gap: 'gap-1.5', text: 'text-xs' },
  md: { dot: 'w-2 h-2', gap: 'gap-2', text: 'text-xs' },
  lg: { dot: 'w-2.5 h-2.5', gap: 'gap-2.5', text: 'text-sm' },
  xl: { dot: 'w-3 h-3', gap: 'gap-3', text: 'text-base' },
};

export const ThreeDotsLoader: React.FC<ThreeDotsLoaderProps> = ({
  size = 'md',
  color = 'bg-[#2998d6]',
  text,
  textPosition = 'right',
  className = '',
  centered = false,
  overlay = false,
}) => {
  const currentSize = sizeClasses[size] || sizeClasses.md;

  const dots = (
    <div className={`inline-flex items-center ${currentSize.gap}`} aria-label="Loading">
      <span
        className={`rounded-full animate-bounce shrink-0 ${currentSize.dot} ${color}`}
        style={{ animationDelay: '-0.32s', animationDuration: '0.8s' }}
      />
      <span
        className={`rounded-full animate-bounce shrink-0 ${currentSize.dot} ${color}`}
        style={{ animationDelay: '-0.16s', animationDuration: '0.8s' }}
      />
      <span
        className={`rounded-full animate-bounce shrink-0 ${currentSize.dot} ${color}`}
        style={{ animationDelay: '0s', animationDuration: '0.8s' }}
      />
    </div>
  );

  const content = (
    <div
      className={`inline-flex items-center ${
        textPosition === 'bottom' ? 'flex-col gap-2 text-center' : 'flex-row gap-2.5'
      } ${className}`}
    >
      {dots}
      {text && (
        <span className={`font-medium text-slate-600 tracking-normal ${currentSize.text}`}>
          {text}
        </span>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-xs p-4 animate-in fade-in duration-200">
        <div className="bg-white/95 border border-slate-200 shadow-xl rounded-xl px-5 py-4 flex items-center gap-3">
          {content}
        </div>
      </div>
    );
  }

  if (centered) {
    return (
      <div className="w-full py-10 flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
};

export default ThreeDotsLoader;
