import { Button } from '@/components/ui/button';
import { VENDOR_CATEGORIES } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface CategoryFilterProps {
  selected: string | null;
  onSelect: (category: string | null) => void;
}

export function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
  return (
    <div className="container py-6">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button
          variant={selected === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => onSelect(null)}
          className={cn(
            'rounded-full transition-all',
            selected === null && 'bg-gradient-coral shadow-coral'
          )}
        >
          ✨ Todos
        </Button>
        {VENDOR_CATEGORIES.map((cat) => (
          <Button
            key={cat.value}
            variant={selected === cat.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => onSelect(cat.value)}
            className={cn(
              'rounded-full transition-all',
              selected === cat.value && 'bg-gradient-coral shadow-coral'
            )}
          >
            {cat.emoji} {cat.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
