import { cn } from '../lib/utils';
import brandMark from '../assets/generated-icons/brand-mark.png';

interface BrandMarkProps {
  className?: string;
}

export function BrandMark({ className }: BrandMarkProps): JSX.Element {
  return (
    <img
      src={brandMark}
      alt=""
      aria-hidden="true"
      draggable={false}
      className={cn('select-none object-contain', className)}
    />
  );
}
