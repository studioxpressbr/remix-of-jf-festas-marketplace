import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VendorReviewClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quoteId: string;
  clientId: string;
  clientName: string;
  vendorId: string;
  eventDate: string;
  onSuccess: () => void;
}

export function VendorReviewClientModal({
  open,
  onOpenChange,
  quoteId,
  clientId,
  clientName,
  vendorId,
  eventDate,
  onSuccess,
}: VendorReviewClientModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast({
        title: 'Selecione uma avaliação',
        description: 'Clique nas estrelas para avaliar o cliente.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('reviews').insert({
        quote_id: quoteId,
        reviewer_id: vendorId,
        target_id: clientId,
        rating,
        comment: comment.trim() || null,
        event_date: eventDate,
      });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: 'Já avaliado',
            description: 'Você já avaliou este cliente para esta cotação.',
            variant: 'destructive',
          });
        } else {
          throw error;
        }
        return;
      }

      toast({
        title: 'Avaliação enviada! ⭐',
        description: 'Obrigado pelo feedback.',
      });

      setRating(0);
      setComment('');
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast({
        title: 'Erro ao enviar',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Avaliar Cliente</DialogTitle>
          <DialogDescription>
            Como foi sua experiência com{' '}
            <span className="font-medium">{clientName}</span>?
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Avaliação</Label>
            <div className="flex items-center justify-center gap-1 py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="p-1 transition-transform hover:scale-110"
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                >
                  <Star
                    className={cn(
                      'h-8 w-8 transition-colors',
                      (hoveredRating || rating) >= star
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-muted-foreground/40'
                    )}
                  />
                </button>
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground">
              {rating === 0
                ? 'Clique para avaliar'
                : rating === 1
                ? 'Muito ruim'
                : rating === 2
                ? 'Ruim'
                : rating === 3
                ? 'Regular'
                : rating === 4
                ? 'Bom'
                : 'Excelente'}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Comentário (opcional)</Label>
            <Textarea
              id="comment"
              placeholder="Descreva sua experiência com este cliente..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={500}
              rows={3}
            />
            <p className="text-right text-xs text-muted-foreground">
              {comment.length}/500
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || rating === 0}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar Avaliação'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
