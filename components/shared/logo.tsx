import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  iconClassName?: string;
  showText?: boolean;
  textClassName?: string;
}

export function Logo({
  className,
  iconClassName,
  showText = true,
  textClassName,
}: LogoProps) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div
        className={cn(
          'relative flex h-9 w-9 items-center justify-center rounded-xl gradient-ocean shadow-soft',
          iconClassName
        )}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-5 w-5 text-white"
          aria-hidden="true"
        >
          <path
            d="M12 2C12 2 7 6 7 11C7 14 9 16 12 16C15 16 17 14 17 11C17 6 12 2 12 2Z"
            fill="currentColor"
            fillOpacity="0.9"
          />
          <path
            d="M3 18C3 18 6 16 9 18C12 20 12 20 15 18C18 16 21 18 21 18"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M3 21C3 21 6 19 9 21C12 23 12 23 15 21C18 19 21 21 21 21"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            fillOpacity="0.6"
          />
        </svg>
      </div>
      {showText && (
        <span
          className={cn(
            'font-display text-lg font-semibold tracking-tight',
            textClassName
          )}
        >
          CarbonRush
          <span className="text-primary ml-1">AI</span>
        </span>
      )}
    </div>
  );
}
