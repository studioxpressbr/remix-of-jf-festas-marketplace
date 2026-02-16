import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Target, Clock, Send, Lock, BarChart3 } from 'lucide-react';
import { formatBRL } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface LeadAccess {
  id: string;
  payment_status: string;
  deal_closed: boolean;
  deal_value: number | null;
  deal_closed_at: string | null;
  created_at?: string;
}

interface Quote {
  id: string;
  client_id: string;
  event_date: string;
  pax_count: number;
  description: string | null;
  status: string;
  created_at: string;
  proposed_value: number | null;
  proposed_at: string | null;
  proposal_message: string | null;
  contract_url: string | null;
  client_response: string | null;
  client_responded_at: string | null;
  profiles: {
    full_name: string;
    whatsapp: string | null;
    email: string | null;
  } | null;
  leads_access: LeadAccess[] | null;
}

interface CreditTransaction {
  id: string;
  amount: number;
  balance_after: number;
  transaction_type: string;
  description: string | null;
  created_at: string;
}

interface AdvancedReportsSectionProps {
  quotes: Quote[];
  creditHistory: CreditTransaction[];
  vendorType: 'mei' | 'empresarial';
}

export function AdvancedReportsSection({ quotes, creditHistory, vendorType }: AdvancedReportsSectionProps) {
  const navigate = useNavigate();

  const metrics = useMemo(() => {
    // All unlocked leads
    const unlockedLeads = quotes.flatMap(q =>
      (q.leads_access || []).filter(la => la.payment_status === 'paid')
    );

    // Closed deals
    const closedDeals = quotes.filter(q =>
      q.leads_access?.some(la => la.deal_closed) ||
      q.client_response === 'accepted'
    );

    // 1. Conversion rate
    const conversionRate = unlockedLeads.length > 0
      ? (closedDeals.length / unlockedLeads.length) * 100
      : 0;

    // 2. ROI
    const totalRevenue = closedDeals.reduce((sum, q) => {
      const la = q.leads_access?.find(l => l.deal_closed);
      return sum + (la?.deal_value ?? q.proposed_value ?? 0);
    }, 0);
    const creditCost = unlockedLeads.length * 2;
    const roi = creditCost > 0 ? totalRevenue / creditCost : 0;

    // 3. Average closing time (days)
    const closingTimes: number[] = [];
    for (const q of closedDeals) {
      const la = q.leads_access?.find(l => l.deal_closed);
      if (la?.deal_closed_at && la.created_at) {
        const diff = (new Date(la.deal_closed_at).getTime() - new Date(la.created_at).getTime()) / (1000 * 60 * 60 * 24);
        closingTimes.push(diff);
      } else if (q.client_responded_at && q.created_at) {
        const diff = (new Date(q.client_responded_at).getTime() - new Date(q.created_at).getTime()) / (1000 * 60 * 60 * 24);
        closingTimes.push(diff);
      }
    }
    const avgClosingTime = closingTimes.length > 0
      ? closingTimes.reduce((a, b) => a + b, 0) / closingTimes.length
      : 0;

    // 4. Proposal acceptance rate
    const proposedQuotes = quotes.filter(q => q.proposed_at);
    const acceptedQuotes = proposedQuotes.filter(q => q.client_response === 'accepted');
    const acceptanceRate = proposedQuotes.length > 0
      ? (acceptedQuotes.length / proposedQuotes.length) * 100
      : 0;

    // 5. Monthly chart data (last 6 months)
    const now = new Date();
    const chartData = Array.from({ length: 6 }, (_, i) => {
      const monthDate = subMonths(now, 5 - i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      const label = format(monthDate, 'MMM', { locale: ptBR });

      const count = closedDeals.filter(q => {
        const la = q.leads_access?.find(l => l.deal_closed);
        const dateStr = la?.deal_closed_at ?? q.client_responded_at;
        if (!dateStr) return false;
        const d = new Date(dateStr);
        return d >= monthStart && d <= monthEnd;
      }).length;

      return { month: label.charAt(0).toUpperCase() + label.slice(1), negocios: count };
    });

    return { conversionRate, roi, avgClosingTime, acceptanceRate, chartData };
  }, [quotes]);

  // MEI upsell card
  if (vendorType !== 'empresarial') {
    return (
      <div className="mb-8">
        <h2 className="mb-4 font-display text-lg font-semibold flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Relatórios Avançados
        </h2>
        <Card className="relative overflow-hidden border-2 border-dashed border-muted-foreground/20">
          <CardContent className="py-8">
            {/* Blurred preview */}
            <div className="pointer-events-none select-none blur-sm opacity-50">
              <div className="grid gap-4 sm:grid-cols-2 mb-6">
                {['Taxa de Conversão: 45%', 'ROI de Créditos: 3.2x', 'Tempo Médio: 5.3 dias', 'Propostas Aceitas: 62%'].map(text => (
                  <div key={text} className="rounded-lg border bg-card p-4">
                    <p className="text-sm text-muted-foreground">{text}</p>
                  </div>
                ))}
              </div>
              <div className="h-40 rounded-lg bg-muted" />
            </div>
            {/* Overlay CTA */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 backdrop-blur-[2px]">
              <Lock className="mb-3 h-8 w-8 text-muted-foreground" />
              <p className="mb-1 font-display text-lg font-semibold">Exclusivo para o Plano Empresarial</p>
              <p className="mb-4 text-sm text-muted-foreground max-w-md text-center">
                Acompanhe taxa de conversão, ROI, tempo de fechamento e muito mais.
              </p>
              <Button onClick={() => navigate('/precos')} className="bg-gradient-coral shadow-coral">
                Fazer Upgrade
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h2 className="mb-4 font-display text-lg font-semibold flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-primary" />
        Relatórios Avançados
        <Badge variant="secondary" className="ml-1 text-xs">Empresarial</Badge>
      </h2>

      {/* Metrics grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card className="bg-gradient-card">
          <CardContent className="p-5 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Target className="h-4 w-4" />
              <span className="text-xs font-medium">Taxa de Conversão</span>
            </div>
            <p className="text-2xl font-semibold">{metrics.conversionRate.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">leads → negócios</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card">
          <CardContent className="p-5 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-medium">ROI de Créditos</span>
            </div>
            <p className="text-2xl font-semibold">{metrics.roi.toFixed(1)}x</p>
            <p className="text-xs text-muted-foreground">retorno / investimento</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card">
          <CardContent className="p-5 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-xs font-medium">Tempo Médio</span>
            </div>
            <p className="text-2xl font-semibold">{metrics.avgClosingTime.toFixed(1)} dias</p>
            <p className="text-xs text-muted-foreground">para fechar negócio</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card">
          <CardContent className="p-5 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Send className="h-4 w-4" />
              <span className="text-xs font-medium">Propostas Aceitas</span>
            </div>
            <p className="text-2xl font-semibold">{metrics.acceptanceRate.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">aceitas / enviadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Bar chart */}
      <Card className="bg-gradient-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Negócios Fechados — Últimos 6 Meses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs fill-muted-foreground" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} className="text-xs fill-muted-foreground" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(value: number) => [`${value} negócio${value !== 1 ? 's' : ''}`, 'Fechados']}
                />
                <Bar dataKey="negocios" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
