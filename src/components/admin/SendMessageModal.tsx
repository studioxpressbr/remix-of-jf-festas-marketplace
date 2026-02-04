import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Send, Loader2, Users, Store, UserCheck } from 'lucide-react';

interface MessageTemplate {
  id: string;
  title: string;
  content: string;
  shortcut: string;
}

interface SendMessageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetUser?: {
    id: string;
    full_name: string;
    role: 'vendor' | 'client';
  } | null;
  onSuccess: () => void;
}

export function SendMessageModal({
  open,
  onOpenChange,
  targetUser,
  onSuccess,
}: SendMessageModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [allVendors, setAllVendors] = useState(false);
  const [allClients, setAllClients] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  useEffect(() => {
    if (open) {
      fetchTemplates();
    }
  }, [open]);

  const fetchTemplates = async () => {
    const { data } = await supabase
      .from('admin_message_templates')
      .select('*')
      .order('shortcut');
    
    if (data) {
      setTemplates(data);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSubject(template.title);
      setContent(template.content);
    }
  };

  const handleSubmit = async () => {
    if (!subject.trim() || !content.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha o assunto e a mensagem.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const body: Record<string, unknown> = {
        subject,
        content,
      };

      if (allVendors || allClients) {
        body.allVendors = allVendors;
        body.allClients = allClients;
      } else if (targetUser) {
        body.recipientId = targetUser.id;
      }

      const { data, error } = await supabase.functions.invoke('send-user-message', {
        body,
      });

      if (error) throw error;

      toast({
        title: 'Mensagem enviada!',
        description: data.message,
      });

      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar a mensagem. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setSubject('');
    setContent('');
    setAllVendors(false);
    setAllClients(false);
    setSelectedTemplate('');
  };

  const hasRecipient = targetUser || allVendors || allClients;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            Enviar Mensagem
          </DialogTitle>
          <DialogDescription>
            Envie uma notificação interna para usuários da plataforma.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Recipient selection */}
          <div className="space-y-3">
            <Label>Destinatário</Label>

            {targetUser && !allVendors && !allClients && (
              <div className="rounded-lg border bg-muted/30 p-3">
                <div className="flex items-center gap-2">
                  {targetUser.role === 'vendor' ? (
                    <Store className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                  )}
                  <p className="font-medium">{targetUser.full_name}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {targetUser.role === 'vendor' ? 'Fornecedor' : 'Cliente'}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="all-vendors"
                  checked={allVendors}
                  onCheckedChange={(checked) => setAllVendors(checked === true)}
                />
                <label
                  htmlFor="all-vendors"
                  className="flex items-center gap-2 text-sm font-medium leading-none"
                >
                  <Store className="h-4 w-4 text-muted-foreground" />
                  Todos os fornecedores
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="all-clients"
                  checked={allClients}
                  onCheckedChange={(checked) => setAllClients(checked === true)}
                />
                <label
                  htmlFor="all-clients"
                  className="flex items-center gap-2 text-sm font-medium leading-none"
                >
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                  Todos os clientes
                </label>
              </div>
            </div>
          </div>

          {/* Template selector */}
          {templates.length > 0 && (
            <div className="space-y-2">
              <Label>Usar template</Label>
              <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um template..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.shortcut}: {template.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Assunto</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Título da mensagem"
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Mensagem</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Conteúdo da mensagem..."
              rows={5}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !hasRecipient || !subject.trim() || !content.trim()}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Enviar Mensagem
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
