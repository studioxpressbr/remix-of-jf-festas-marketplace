import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, X, FileText } from 'lucide-react';
import { formatBRL } from '@/lib/utils';

interface VendorProposalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quoteId: string;
  clientName: string;
  onSuccess: () => void;
}

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function VendorProposalModal({
  open,
  onOpenChange,
  quoteId,
  clientName,
  onSuccess,
}: VendorProposalModalProps) {
  const [value, setValue] = useState('');
  const [message, setMessage] = useState('');

  const formatMonetaryValue = (raw: string): string => {
    // Keep only digits and comma
    let cleaned = raw.replace(/[^\d,]/g, '');
    
    // Allow only one comma
    const parts = cleaned.split(',');
    if (parts.length > 2) {
      cleaned = parts[0] + ',' + parts.slice(1).join('');
    }
    
    let integerPart = parts[0] || '';
    const decimalPart = parts[1]?.substring(0, 2) ?? '';

    // Remove leading zeros
    integerPart = integerPart.replace(/^0+(?=\d)/, '');

    // Add thousand separators
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    if (parts.length > 1) {
      return `${integerPart},${decimalPart}`;
    }
    return integerPart;
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(formatMonetaryValue(e.target.value));
  };
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast({
        title: 'Tipo inválido',
        description: 'Apenas PDF, DOC e DOCX são aceitos.',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: 'Arquivo muito grande',
        description: 'O tamanho máximo é 10MB.',
        variant: 'destructive',
      });
      return;
    }

    setContractFile(file);
  };

  const handleSubmit = async () => {
    const numericValue = parseFloat(value.replace(/[^\d.,]/g, '').replace(',', '.'));
    if (!numericValue || numericValue <= 0) {
      toast({
        title: 'Valor inválido',
        description: 'Informe um valor positivo.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      let contractUrl: string | null = null;

      // Upload contract if provided
      if (contractFile) {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id;
        const ext = contractFile.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from('vendor-contracts')
          .upload(fileName, contractFile);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('vendor-contracts')
          .getPublicUrl(fileName);

        contractUrl = publicUrlData.publicUrl;
      }

      // Update the quote with proposal data
      const { error } = await supabase
        .from('quotes')
        .update({
          proposed_value: numericValue,
          proposal_message: message.trim() || null,
          proposed_at: new Date().toISOString(),
          contract_url: contractUrl,
          status: 'proposed' as any,
        })
        .eq('id', quoteId);

      if (error) throw error;

      toast({
        title: 'Proposta enviada!',
        description: `Proposta de ${formatBRL(numericValue)} enviada para ${clientName}.`,
      });

      onSuccess();
      onOpenChange(false);
      setValue('');
      setMessage('');
      setContractFile(null);
    } catch (error) {
      console.error('Error submitting proposal:', error);
      toast({
        title: 'Erro ao enviar proposta',
        description: 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md overflow-hidden">
        <DialogHeader>
          <DialogTitle>Enviar Proposta para {clientName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="proposal-value">Valor (R$) *</Label>
            <div className="relative w-full overflow-hidden">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
              <Input
                id="proposal-value"
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={value}
                onChange={handleValueChange}
                maxLength={20}
                className="pl-10 w-full"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="proposal-message">Mensagem (opcional)</Label>
            <Textarea
              id="proposal-message"
              placeholder="Descreva sua proposta..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={500}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">{message.length}/500</p>
          </div>

          <div className="space-y-2">
            <Label>Contrato (opcional)</Label>
            {contractFile ? (
              <div className="flex items-center gap-2 rounded-lg border p-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <span className="flex-1 truncate text-sm">{contractFile.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setContractFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                Anexar PDF ou DOC (máx. 10MB)
              </Button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              'Enviar Proposta'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
