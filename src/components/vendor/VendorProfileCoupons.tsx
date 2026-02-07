import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tag, Calendar, Banknote, Loader2 } from 'lucide-react';

interface Coupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  expires_at: string;
  min_order_value: number | null;
}

interface VendorProfileCouponsProps {
  vendorId: string;
}

export function VendorProfileCoupons({ vendorId }: VendorProfileCouponsProps) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCoupons = async () => {
      const { data, error } = await supabase
        .from('coupons')
        .select('id, code, discount_type, discount_value, expires_at, min_order_value')
        .eq('vendor_id', vendorId)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (!error && data) {
        setCoupons(data);
      }
      setLoading(false);
    };

    fetchCoupons();
  }, [vendorId]);

  const formatDiscount = (type: string, value: number) => {
    if (type === 'percentage') {
      return `${value}% OFF`;
    }
    return `R$ ${value.toFixed(2)} OFF`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (coupons.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-semibold">
        <Tag className="h-5 w-5 text-primary" />
        Cupons de Desconto
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {coupons.map((coupon) => (
          <div
            key={coupon.id}
            className="relative overflow-hidden rounded-xl border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 p-4"
          >
            {/* Decorative circles */}
            <div className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-background" />
            <div className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-background" />

            <div className="text-center">
              <Badge 
                variant="secondary" 
                className="mb-3 font-mono text-lg tracking-wider"
              >
                {coupon.code}
              </Badge>
              
              <p className="text-2xl font-bold text-primary">
                {formatDiscount(coupon.discount_type, coupon.discount_value)}
              </p>
              
              <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                <p className="flex items-center justify-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  Válido até{' '}
                  {format(new Date(coupon.expires_at), "dd 'de' MMMM", {
                    locale: ptBR,
                  })}
                </p>
                
                {coupon.min_order_value && (
                  <p className="flex items-center justify-center gap-1.5">
                    <Banknote className="h-4 w-4" />
                    Pedido mínimo: R$ {coupon.min_order_value.toFixed(2)}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
