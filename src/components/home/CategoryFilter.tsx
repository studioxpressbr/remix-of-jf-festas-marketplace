import { Link } from 'react-router-dom';
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
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">Categorias</h2>
        <Link 
          to="/buscar" 
          className="text-sm text-secondary hover:underline"
        >
          Ver todos →
        </Link>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={selected === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => onSelect(null)}
          className={cn(
            'rounded-full transition-all',
            selected === null && 'bg-gradient-orange shadow-orange'
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
              selected === cat.value && 'bg-gradient-orange shadow-orange'
            )}
          >
            {cat.emoji} {cat.label}
          </Button>
        ))}
      </div>
      
      {/* Category quick links */}
      <div className="mt-4 flex flex-wrap gap-2">
        {VENDOR_CATEGORIES.map((cat) => (
          <Link
            key={cat.value}
            to={`/categoria/${cat.value}`}
            className="text-xs text-muted-foreground hover:text-secondary hover:underline"
          >
            Ver só {cat.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
