import { Search, Filter, MapPin, Tag, Star, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useIsMobile } from '@/hooks/use-mobile';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  slug: string;
  emoji: string | null;
}

interface SearchFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  selectedNeighborhood: string;
  setSelectedNeighborhood: (n: string) => void;
  hasCoupons: boolean;
  setHasCoupons: (v: boolean) => void;
  minRating: number;
  setMinRating: (r: number) => void;
  neighborhoods: string[];
  categories: Category[];
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  onSearch?: () => void;
}

export function SearchFilters({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  selectedNeighborhood,
  setSelectedNeighborhood,
  hasCoupons,
  setHasCoupons,
  minRating,
  setMinRating,
  neighborhoods,
  categories,
  onClearFilters,
  hasActiveFilters,
  onSearch,
}: SearchFiltersProps) {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(!isMobile);

  const filterContent = (
    <div className="space-y-6">
      {/* Search Input */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <Search className="h-4 w-4" />
          Buscar
        </Label>
        <Input
          type="text"
          placeholder="Nome, descrição..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && onSearch) {
              onSearch();
            }
          }}
        />
      </div>

      {/* Category Select */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <Tag className="h-4 w-4" />
          Categoria
        </Label>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Todas as categorias" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.slug}>
                {cat.emoji} {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Neighborhood Select */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <MapPin className="h-4 w-4" />
          Bairro
        </Label>
        <Select value={selectedNeighborhood} onValueChange={setSelectedNeighborhood}>
          <SelectTrigger>
            <SelectValue placeholder="Todos os bairros" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os bairros</SelectItem>
            {neighborhoods.map((neighborhood) => (
              <SelectItem key={neighborhood} value={neighborhood}>
                {neighborhood}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Coupons Checkbox */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="coupons"
          checked={hasCoupons}
          onCheckedChange={(checked) => setHasCoupons(checked === true)}
        />
        <Label
          htmlFor="coupons"
          className="flex cursor-pointer items-center gap-2 text-sm font-medium"
        >
          🎟️ Apenas com cupons
        </Label>
      </div>

      {/* Rating Slider */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <Star className="h-4 w-4" />
          Avaliação mínima: {minRating > 0 ? `${minRating} ⭐` : 'Qualquer'}
        </Label>
        <Slider
          value={[minRating]}
          onValueChange={(values) => setMinRating(values[0])}
          max={5}
          min={0}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Qualquer</span>
          <span>5 ⭐</span>
        </div>
      </div>

      {/* Search Button */}
      {onSearch && (
        <Button
          onClick={onSearch}
          className="w-full bg-primary"
        >
          <Search className="mr-2 h-4 w-4" />
          Buscar
        </Button>
      )}

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button
          variant="outline"
          onClick={onClearFilters}
          className="w-full"
        >
          <X className="mr-2 h-4 w-4" />
          Limpar filtros
        </Button>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-6">
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <span className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtros
              {hasActiveFilters && (
                <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                  Ativos
                </span>
              )}
            </span>
            <span className="text-xs text-muted-foreground">
              {isOpen ? 'Ocultar' : 'Mostrar'}
            </span>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4 rounded-lg border bg-card p-4">
          {filterContent}
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <aside className="sticky top-4 h-fit w-72 shrink-0 rounded-lg border bg-card p-4 shadow-soft">
      <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold">
        <Filter className="h-5 w-5" />
        Filtros
      </h2>
      {filterContent}
    </aside>
  );
}
