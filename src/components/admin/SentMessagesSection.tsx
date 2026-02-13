import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Send, Mail, MailOpen, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface SentMessage {
  id: string;
  subject: string;
  content: string;
  created_at: string;
  is_read: boolean;
  read_at: string | null;
  recipient_id: string;
  recipient_name: string;
  recipient_role: 'vendor' | 'client';
}

const PAGE_SIZE = 15;

export function SentMessagesSection() {
  const [messages, setMessages] = useState<SentMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<'all' | 'vendor' | 'client'>('all');
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchMessages();
  }, [roleFilter, page]);

  async function fetchMessages() {
    setLoading(true);

    // Get current user (admin)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get total count for pagination
    let countQuery = supabase
      .from('user_messages')
      .select('id', { count: 'exact', head: true })
      .eq('sender_id', user.id);

    const { count } = await countQuery;
    setTotalCount(count || 0);

    // Fetch messages with recipient info
    let query = supabase
      .from('user_messages')
      .select('id, subject, content, created_at, is_read, read_at, recipient_id')
      .eq('sender_id', user.id)
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    const { data: messagesData } = await query;

    if (!messagesData || messagesData.length === 0) {
      setMessages([]);
      setLoading(false);
      return;
    }

    // Fetch recipient profiles
    const recipientIds = [...new Set(messagesData.map(m => m.recipient_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .in('id', recipientIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    let mapped: SentMessage[] = messagesData.map(m => {
      const profile = profileMap.get(m.recipient_id);
      return {
        ...m,
        is_read: m.is_read ?? false,
        recipient_name: profile?.full_name || 'Usuário removido',
        recipient_role: (profile?.role as 'vendor' | 'client') || 'client',
      };
    });

    // Apply role filter client-side
    if (roleFilter !== 'all') {
      mapped = mapped.filter(m => m.recipient_role === roleFilter);
    }

    setMessages(mapped);
    setLoading(false);
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <Card className="bg-gradient-card">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Histórico de Mensagens Enviadas
            </CardTitle>
            <CardDescription>
              {totalCount} mensagem{totalCount !== 1 ? 's' : ''} enviada{totalCount !== 1 ? 's' : ''}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v as any); setPage(0); }}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="vendor">Fornecedores</SelectItem>
                <SelectItem value="client">Clientes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : messages.length === 0 ? (
          <div className="py-8 text-center">
            <Mail className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhuma mensagem enviada ainda.</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Destinatário</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Assunto</TableHead>
                  <TableHead>Enviada em</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages.map(msg => (
                  <TableRow key={msg.id}>
                    <TableCell className="font-medium">{msg.recipient_name}</TableCell>
                    <TableCell>
                      <Badge variant={msg.recipient_role === 'vendor' ? 'default' : 'secondary'}>
                        {msg.recipient_role === 'vendor' ? 'Fornecedor' : 'Cliente'}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{msg.subject}</TableCell>
                    <TableCell>
                      {format(new Date(msg.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-center">
                      {msg.is_read ? (
                        <Badge variant="outline" className="gap-1 border-sage text-sage">
                          <MailOpen className="h-3 w-3" />
                          Lida
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1">
                          <Mail className="h-3 w-3" />
                          Não lida
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Página {page + 1} de {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 0}
                    onClick={() => setPage(p => p - 1)}
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage(p => p + 1)}
                  >
                    Próxima
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
