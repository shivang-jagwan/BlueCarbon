import { cn } from '@/lib/utils';
import Image from 'next/image';
import logoImg from '@/assests/logo.png';

interface LogoProps {
  className?: string;
  iconClassName?: string;
}

export function Logo({
  className,
  iconClassName,
}: LogoProps) {
  return (
    <div className={cn('flex items-center', className)}>
      <div
        className={cn(
          'relative flex items-center justify-start overflow-hidden',
          iconClassName
        )}
      >
        <Image 
          src={logoImg} 
          alt="Logo" 
          className="h-14 w-auto object-contain"
          priority
        />
      </div>
    </div>
  );
}
