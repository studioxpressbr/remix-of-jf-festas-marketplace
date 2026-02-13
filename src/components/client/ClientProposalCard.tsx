import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DollarSign, FileText, Download, CheckCircle, XCircle, Loader2, MessageSquare } from 'lucide-react';

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
            ? `Você aceitou a proposta de R$ ${proposedValue.toFixed(2)} de ${vendorName}.`
            : `Você recusou a proposta de ${vendorName}.`,
      });

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
            R$ {proposedValue.toFixed(2)}
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
        <a
          href={contractUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <FileText className="h-4 w-4" />
          <Download className="h-3 w-3" />
          Baixar contrato
        </a>
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
