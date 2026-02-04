import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Pencil, Save, X, Loader2 } from 'lucide-react';

interface MessageTemplate {
  id: string;
  title: string;
  content: string;
  shortcut: string;
}

export function MessageTemplatesSection() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', content: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('admin_message_templates')
      .select('*')
      .order('shortcut');

    if (error) {
      console.error('Error fetching templates:', error);
    } else {
      setTemplates(data || []);
    }
    setLoading(false);
  };

  const handleEdit = (template: MessageTemplate) => {
    setEditingId(template.id);
    setEditForm({ title: template.title, content: template.content });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({ title: '', content: '' });
  };

  const handleSave = async (templateId: string) => {
    if (!editForm.title.trim() || !editForm.content.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha o título e o conteúdo.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from('admin_message_templates')
      .update({
        title: editForm.title,
        content: editForm.content,
        updated_at: new Date().toISOString(),
      })
      .eq('id', templateId);

    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o template.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Template salvo!',
        description: 'As alterações foram aplicadas.',
      });
      fetchTemplates();
      handleCancel();
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <Card className="bg-gradient-card">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Templates de Mensagem
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {templates.map((template) => (
          <div
            key={template.id}
            className="rounded-lg border bg-background p-4"
          >
            {editingId === template.id ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-muted px-2 py-1 font-mono text-xs">
                    {template.shortcut}
                  </span>
                  <Input
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    placeholder="Título"
                    className="flex-1"
                  />
                </div>
                <Textarea
                  value={editForm.content}
                  onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                  placeholder="Conteúdo da mensagem..."
                  rows={3}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={handleCancel}>
                    <X className="mr-1 h-3 w-3" />
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleSave(template.id)}
                    disabled={saving}
                    className="bg-sage hover:bg-sage/90"
                  >
                    {saving ? (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    ) : (
                      <Save className="mr-1 h-3 w-3" />
                    )}
                    Salvar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-muted px-2 py-1 font-mono text-xs">
                      {template.shortcut}
                    </span>
                    <span className="font-medium">{template.title}</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                    {template.content}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(template)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
