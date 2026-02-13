import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClientProposalCard } from '@/components/client/ClientProposalCard';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Users, Store, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface SentQuote {
  id: string;
  vendor_id: string;
  event_date: string;
  pax_count: number;
  description: string | null;
  status: string;
  created_at: string;
  proposed_value: number | null;
  proposal_message: string | null;
  proposed_at: string | null;
  contract_url: string | null;
  client_response: string | null;
  client_responded_at: string | null;
  vendor_business_name?: string;
}

interface VendorSentQuotesSectionProps {
  userId: string;
}

export function VendorSentQuotesSection({ userId }: VendorSentQuotesSectionProps) {
  const [sentQuotes, setSentQuotes] = useState<SentQuote[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSentQuotes = async () => {
    // Fetch quotes where this vendor is the buyer (client_id)
    const { data: quotesData } = await supabase
      .from('quotes')
      .select('*')
      .eq('client_id', userId)
      .order('created_at', { ascending: false });

    if (!quotesData || quotesData.length === 0) {
      setSentQuotes([]);
      setLoading(false);
      return;
    }

    // Fetch vendor business names for the target vendors
    const vendorIds = [...new Set(quotesData.map(q => q.vendor_id))];
    const { data: vendorsData } = await supabase
      .from('vendors')
      .select('profile_id, business_name')
      .in('profile_id', vendorIds);

    const vendorMap = new Map(
      (vendorsData || []).map(v => [v.profile_id, v.business_name])
    );

    const enriched: SentQuote[] = quotesData.map(q => ({
      ...q,
      vendor_business_name: vendorMap.get(q.vendor_id) || 'Fornecedor',
    }));

    setSentQuotes(enriched);
    setLoading(false);
  };

  useEffect(() => {
    fetchSentQuotes();
  }, [userId]);

  if (loading) return null;
  if (sentQuotes.length === 0) return null;

  return (
    <div className="mt-8">
      <h2 className="mb-4 font-display text-2xl font-semibold">
        Minhas Cotações (como comprador)
      </h2>

      <div className="space-y-4">
        {sentQuotes.map((quote) => {
          const hasProposal = !!quote.proposed_at;

          return (
            <Card key={quote.id} className="overflow-hidden bg-gradient-card">
              <CardContent className="p-6 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Store className="h-4 w-4 text-primary" />
                      <span className="font-semibold">{quote.vendor_business_name}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(quote.event_date), "dd 'de' MMMM", { locale: ptBR })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {quote.pax_count} pessoas
                      </span>
                    </div>
                    {quote.description && (
                      <p className="text-sm text-muted-foreground">{quote.description}</p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {!hasProposal && (
                      <Badge variant="secondary" className="text-xs">
                        <Clock className="mr-1 h-3 w-3" />
                        Aguardando proposta
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      Enviada em {format(new Date(quote.created_at), 'dd/MM/yyyy')}
                    </span>
                  </div>
                </div>

                {/* Show proposal card if vendor has sent a proposal */}
                {hasProposal && quote.proposed_value != null && (
                  <ClientProposalCard
                    quoteId={quote.id}
                    vendorName={quote.vendor_business_name || 'Fornecedor'}
                    proposedValue={quote.proposed_value}
                    proposalMessage={quote.proposal_message}
                    proposedAt={quote.proposed_at!}
                    contractUrl={quote.contract_url}
                    clientResponse={quote.client_response}
                    clientRespondedAt={quote.client_responded_at}
                    onSuccess={fetchSentQuotes}
                  />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
