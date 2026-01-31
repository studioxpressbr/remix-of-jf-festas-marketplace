import { Card, CardContent } from '@/components/ui/card';
import { Clock, CheckCircle, FileText, ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface VendorData {
  id: string;
  business_name: string;
  category: string;
  custom_category: string | null;
  description: string | null;
  neighborhood: string | null;
  images: string[] | null;
  approval_status: string;
  submitted_at: string | null;
  created_at: string;
}

interface PendingApprovalCardProps {
  vendor: VendorData;
}

export function PendingApprovalCard({ vendor }: PendingApprovalCardProps) {
  const categoryLabels: Record<string, string> = {
    confeitaria: 'Confeitaria',
    doces: 'Doces',
    salgados: 'Salgados',
    decoracao: 'Decoração',
    outros: 'Outros',
  };

  const statusConfig = {
    pending: {
      icon: Clock,
      label: 'Aguardando Aprovação',
      description: 'Seu cadastro está sendo analisado pela nossa equipe. Este processo pode levar até 48 horas.',
      bgClass: 'bg-amber-50 dark:bg-amber-950/20',
      borderClass: 'border-amber-300 dark:border-amber-700',
      iconClass: 'text-amber-600 dark:text-amber-400',
      badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    },
    rejected: {
      icon: Clock,
      label: 'Cadastro Rejeitado',
      description: 'Infelizmente seu cadastro não foi aprovado. Entre em contato conosco para mais informações.',
      bgClass: 'bg-red-50 dark:bg-red-950/20',
      borderClass: 'border-red-300 dark:border-red-700',
      iconClass: 'text-red-600 dark:text-red-400',
      badgeClass: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    },
    approved: {
      icon: CheckCircle,
      label: 'Cadastro Aprovado',
      description: 'Seu perfil foi aprovado! Agora você precisa ativar sua assinatura para aparecer na plataforma.',
      bgClass: 'bg-sage-light/30',
      borderClass: 'border-sage',
      iconClass: 'text-sage',
      badgeClass: 'bg-sage-light text-sage-foreground',
    },
  };

  const status = statusConfig[vendor.approval_status as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = status.icon;

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card className={`border-2 ${status.borderClass} ${status.bgClass}`}>
        <CardContent className="py-6">
          <div className="flex items-start gap-4">
            <div className={`rounded-full p-3 ${status.bgClass}`}>
              <StatusIcon className={`h-8 w-8 ${status.iconClass}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="font-display text-xl font-semibold">
                  {vendor.business_name}
                </h2>
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${status.badgeClass}`}>
                  {status.label}
                </span>
              </div>
              <p className="text-muted-foreground">
                {status.description}
              </p>
              {vendor.submitted_at && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Enviado em {format(new Date(vendor.submitted_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submitted Information Summary */}
      <Card className="bg-gradient-card">
        <CardContent className="py-6">
          <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            Informações Enviadas
          </h3>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Categoria</p>
              <p className="font-medium">
                {vendor.custom_category || categoryLabels[vendor.category] || vendor.category}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Bairro</p>
              <p className="font-medium">{vendor.neighborhood || 'Não informado'}</p>
            </div>
            
            <div className="sm:col-span-2">
              <p className="text-sm text-muted-foreground">Descrição</p>
              <p className="font-medium">{vendor.description || 'Não informado'}</p>
            </div>
          </div>

          {/* Images Preview */}
          {vendor.images && vendor.images.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                <ImageIcon className="h-4 w-4" />
                Fotos ({vendor.images.length})
              </p>
              <div className="flex gap-2 flex-wrap">
                {vendor.images.slice(0, 5).map((img, idx) => (
                  <div 
                    key={idx} 
                    className="w-16 h-16 rounded-lg overflow-hidden border border-border"
                  >
                    <img 
                      src={img} 
                      alt={`Foto ${idx + 1}`} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card className="bg-gradient-card">
        <CardContent className="py-6">
          <h3 className="font-display text-lg font-semibold mb-4">
            Próximos Passos
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sage text-xs font-bold text-white">
                1
              </div>
              <div>
                <p className="font-medium">Aprovação do Cadastro</p>
                <p className="text-sm text-muted-foreground">
                  Nossa equipe irá revisar suas informações em até 48 horas.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                2
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Ativação da Assinatura</p>
                <p className="text-sm text-muted-foreground">
                  Após aprovação, você poderá ativar sua assinatura.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                3
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Receber Cotações</p>
                <p className="text-sm text-muted-foreground">
                  Com a assinatura ativa, clientes poderão solicitar orçamentos.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
