import * as React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  showValue?: boolean;
  reviewCount?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

const textSizeClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

export function StarRating({
  rating,
  showValue = true,
  reviewCount,
  size = 'md',
  className,
}: StarRatingProps) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  if (rating === 0 && reviewCount === 0) {
    return (
      <div className={cn('flex items-center gap-1', className)}>
        <div className="flex">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={cn(sizeClasses[size], 'text-muted-foreground/40')}
            />
          ))}
        </div>
        <span className={cn(textSizeClasses[size], 'text-muted-foreground')}>
          Sem avaliações
        </span>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="flex">
        {/* Full stars */}
        {[...Array(fullStars)].map((_, i) => (
          <Star
            key={`full-${i}`}
            className={cn(sizeClasses[size], 'fill-amber-400 text-amber-400')}
          />
        ))}
        {/* Half star */}
        {hasHalfStar && (
          <div className="relative">
            <Star className={cn(sizeClasses[size], 'text-muted-foreground/40')} />
            <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
              <Star className={cn(sizeClasses[size], 'fill-amber-400 text-amber-400')} />
            </div>
          </div>
        )}
        {/* Empty stars */}
        {[...Array(emptyStars)].map((_, i) => (
          <Star
            key={`empty-${i}`}
            className={cn(sizeClasses[size], 'text-muted-foreground/40')}
          />
        ))}
      </div>
      {showValue && (
        <span className={cn(textSizeClasses[size], 'font-medium text-foreground')}>
          {rating.toFixed(1)}
        </span>
      )}
      {reviewCount !== undefined && reviewCount > 0 && (
        <span className={cn(textSizeClasses[size], 'text-muted-foreground')}>
          ({reviewCount})
        </span>
      )}
    </div>
  );
}
