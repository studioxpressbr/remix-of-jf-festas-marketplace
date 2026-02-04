import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { Bell, Mail, MailOpen, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  subject: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export function NotificationBell() {
  const { user } = useAuthContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const fetchMessages = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_messages')
      .select('*')
      .eq('recipient_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (!error && data) {
      setMessages(data);
      setUnreadCount(data.filter(m => !m.is_read).length);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMessages();

    // Subscribe to new messages
    if (user) {
      const channel = supabase
        .channel('user-messages')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_messages',
            filter: `recipient_id=eq.${user.id}`,
          },
          () => {
            fetchMessages();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const markAsRead = async (messageId: string) => {
    await supabase
      .from('user_messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', messageId);

    setMessages(prev =>
      prev.map(m => (m.id === messageId ? { ...m, is_read: true } : m))
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    const unreadIds = messages.filter(m => !m.is_read).map(m => m.id);
    if (unreadIds.length === 0) return;

    await supabase
      .from('user_messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .in('id', unreadIds);

    setMessages(prev => prev.map(m => ({ ...m, is_read: true })));
    setUnreadCount(0);
  };

  if (!user) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h4 className="font-semibold">Notificações</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={markAllAsRead}
            >
              Marcar todas como lidas
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-96">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma notificação
            </div>
          ) : (
            <div className="divide-y">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'cursor-pointer p-4 transition-colors hover:bg-muted/50',
                    !message.is_read && 'bg-primary/5'
                  )}
                  onClick={() => !message.is_read && markAsRead(message.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {message.is_read ? (
                        <MailOpen className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Mail className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p
                        className={cn(
                          'text-sm',
                          !message.is_read && 'font-semibold'
                        )}
                      >
                        {message.subject}
                      </p>
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {message.content}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(message.created_at), "dd/MM 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
