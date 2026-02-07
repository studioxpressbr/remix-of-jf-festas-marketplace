import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { VendorCouponModal } from './VendorCouponModal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Trash2, Tag, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Coupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  expires_at: string;
  max_uses: number | null;
  current_uses: number;
  is_active: boolean;
  min_order_value: number | null;
}

interface VendorCouponsSectionProps {
  vendorId: string;
}

export function VendorCouponsSection({ vendorId }: VendorCouponsSectionProps) {
  const { toast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCoupons = async () => {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('vendor_id', vendorId)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (!error && data) {
      setCoupons(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCoupons();
  }, [vendorId]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);

    try {
      const { error } = await supabase
        .from('coupons')
        .update({ is_active: false })
        .eq('id', deleteId);

      if (error) throw error;

      toast({
        title: 'Cupom excluído',
        description: 'O cupom foi desativado com sucesso.',
      });

      setCoupons((prev) => prev.filter((c) => c.id !== deleteId));
    } catch (error) {
      toast({
        title: 'Erro ao excluir',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const formatDiscount = (type: string, value: number) => {
    if (type === 'percentage') {
      return `${value}%`;
    }
    return `R$ ${value.toFixed(2)}`;
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Tag className="h-5 w-5" />
            Meus Cupons
          </CardTitle>
          <Button size="sm" onClick={() => setModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Cupom
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : coupons.length === 0 ? (
            <div className="py-8 text-center">
              <span className="mb-2 block text-3xl">🎟️</span>
              <p className="text-sm text-muted-foreground">
                Nenhum cupom ativo no momento
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Crie cupons para atrair mais clientes
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {coupons.map((coupon) => (
                <div
                  key={coupon.id}
                  className="flex items-center justify-between rounded-lg border bg-muted/30 p-3"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="font-mono">
                      {coupon.code}
                    </Badge>
                    <span className="font-medium text-primary">
                      {formatDiscount(coupon.discount_type, coupon.discount_value)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Expira:{' '}
                      {format(new Date(coupon.expires_at), 'dd/MM', {
                        locale: ptBR,
                      })}
                    </span>
                    {coupon.max_uses && (
                      <span className="text-xs text-muted-foreground">
                        ({coupon.current_uses}/{coupon.max_uses} usos)
                      </span>
                    )}
                    {coupon.min_order_value && (
                      <span className="text-xs text-muted-foreground">
                        | Mín: R$ {coupon.min_order_value.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setDeleteId(coupon.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <p className="mt-2 text-xs text-muted-foreground">
                💡 Cupons expiram automaticamente em 7 dias após a criação.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <VendorCouponModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        vendorId={vendorId}
        onSuccess={fetchCoupons}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cupom?</AlertDialogTitle>
            <AlertDialogDescription>
              O cupom será desativado e não poderá mais ser utilizado pelos
              clientes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                'Excluir'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
