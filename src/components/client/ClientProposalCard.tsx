import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DollarSign, FileText, Download, CheckCircle, XCircle, Loader2, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatBRL } from '@/lib/utils';

interface ClientProposalCardProps {
  quoteId: string;
  vendorName: string;
  proposedValue: number;
  proposalMessage: string | null;
  proposedAt: string;
  contractUrl: string | null;
  clientResponse: string | null;
  clientRespondedAt: string | null;
  onSuccess: () => void;
}

export function ClientProposalCard({
  quoteId,
  vendorName,
  proposedValue,
  proposalMessage,
  proposedAt,
  contractUrl,
  clientResponse,
  clientRespondedAt,
  onSuccess,
}: ClientProposalCardProps) {
  const [responding, setResponding] = useState<'accepted' | 'rejected' | null>(null);
  const [downloading, setDownloading] = useState(false);
  const { toast } = useToast();

  const handleRespond = async (response: 'accepted' | 'rejected') => {
    setResponding(response);
    try {
      // Update quote with client response
      const { error: quoteError } = await supabase
        .from('quotes')
        .update({
          client_response: response,
          client_responded_at: new Date().toISOString(),
          status: response === 'accepted' ? ('completed' as any) : ('proposed' as any),
        })
        .eq('id', quoteId);

      if (quoteError) throw quoteError;

      // If accepted, update leads_access to close the deal
      if (response === 'accepted') {
        const { error: leadError } = await supabase
          .from('leads_access')
          .update({
            deal_closed: true,
            deal_value: proposedValue,
            deal_closed_at: new Date().toISOString(),
          })
          .eq('quote_id', quoteId);

        if (leadError) {
          console.error('Error updating leads_access:', leadError);
        }
      }

      toast({
        title: response === 'accepted' ? 'Proposta aceita!' : 'Proposta recusada',
        description:
          response === 'accepted'
            ? `Você aceitou a proposta de ${formatBRL(proposedValue)} de ${vendorName}.`
            : `Você recusou a proposta de ${vendorName}.`,
      });

      // Notify vendor (internal message + email)
      try {
        await supabase.functions.invoke('notify-proposal-response', {
          body: { quoteId, response },
        });
      } catch (notifyError) {
        console.error('Error notifying vendor:', notifyError);
      }

      onSuccess();
    } catch (error) {
      console.error('Error responding to proposal:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível registrar sua resposta.',
        variant: 'destructive',
      });
    } finally {
      setResponding(null);
    }
  };

  const isPending = !clientResponse;

  return (
    <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          <span className="font-semibold text-lg">
            {formatBRL(proposedValue)}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          {format(new Date(proposedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
        </span>
      </div>

      {proposalMessage && (
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <MessageSquare className="h-4 w-4 mt-0.5 shrink-0" />
          <p>{proposalMessage}</p>
        </div>
      )}

      {contractUrl && (
        <Button
          variant="ghost"
          size="sm"
          disabled={downloading}
          onClick={async () => {
            setDownloading(true);
            try {
              const { data: sessionData } = await supabase.auth.getSession();
              const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/download-contract`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionData.session?.access_token}`,
                    'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                  },
                  body: JSON.stringify({ quoteId }),
                }
              );
              if (!response.ok) throw new Error('Download falhou');
              const blob = await response.blob();
              const contentDisposition = response.headers.get('Content-Disposition');
              const fileNameMatch = contentDisposition?.match(/filename="(.+)"/);
              const fileName = fileNameMatch?.[1] || 'contrato';
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = fileName;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            } catch (error) {
              console.error('Download error:', error);
              toast({
                title: 'Erro ao baixar contrato',
                description: 'Tente novamente.',
                variant: 'destructive',
              });
            } finally {
              setDownloading(false);
            }
          }}
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline p-0 h-auto"
        >
          <FileText className="h-4 w-4" />
          {downloading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
          {downloading ? 'Baixando...' : 'Baixar contrato'}
        </Button>
      )}

      {isPending ? (
        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            onClick={() => handleRespond('accepted')}
            disabled={responding !== null}
            className="flex-1"
          >
            {responding === 'accepted' ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 h-4 w-4" />
            )}
            Aceitar
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleRespond('rejected')}
            disabled={responding !== null}
            className="flex-1"
          >
            {responding === 'rejected' ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <XCircle className="mr-2 h-4 w-4" />
            )}
            Recusar
          </Button>
        </div>
      ) : (
        <Badge
          variant={clientResponse === 'accepted' ? 'default' : 'destructive'}
          className="mt-2"
        >
          {clientResponse === 'accepted' ? (
            <>
              <CheckCircle className="mr-1 h-3 w-3" />
              Aceita
            </>
          ) : (
            <>
              <XCircle className="mr-1 h-3 w-3" />
              Recusada
            </>
          )}
          {clientRespondedAt && (
            <span className="ml-1 text-xs opacity-75">
              em {format(new Date(clientRespondedAt), 'dd/MM/yyyy', { locale: ptBR })}
            </span>
          )}
        </Badge>
      )}
    </div>
  );
}
