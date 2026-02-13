import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format, startOfMonth, endOfMonth, subMonths, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  CalendarIcon,
  DollarSign,
  TrendingUp,
  Hash,
  Gift,
  FileCheck,
  HandCoins,
} from 'lucide-react';

export interface ClosedDeal {
  vendor_id: string;
  vendor_name: string;
  vendor_email: string | null;
  deal_value: number | null;
  deal_closed_at: string | null;
  quote_id: string;
  client_response: string | null;
  proposed_value: number | null;
}

interface VendorRanking {
  vendor_id: string;
  vendor_name: string;
  deal_count: number;
  total_value: number;
  avg_ticket: number;
  proposal_deals: number;
}

interface DealsReportSectionProps {
  deals: ClosedDeal[];
  onBonusClick: (vendor: { id: string; full_name: string }) => void;
}

type PeriodPreset = 'this_month' | 'last_month' | 'last_90' | 'custom';

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function DealsReportSection({ deals, onBonusClick }: DealsReportSectionProps) {
  const [period, setPeriod] = useState<PeriodPreset>('this_month');
  const [customFrom, setCustomFrom] = useState<Date | undefined>(undefined);
  const [customTo, setCustomTo] = useState<Date | undefined>(undefined);

  const dateRange = useMemo(() => {
    const now = new Date();
    switch (period) {
      case 'this_month':
        return { from: startOfMonth(now), to: endOfMonth(now) };
      case 'last_month': {
        const last = subMonths(now, 1);
        return { from: startOfMonth(last), to: endOfMonth(last) };
      }
      case 'last_90':
        return { from: subDays(now, 90), to: now };
      case 'custom':
        return { from: customFrom, to: customTo };
    }
  }, [period, customFrom, customTo]);

  const filteredDeals = useMemo(() => {
    return deals.filter((d) => {
      if (!d.deal_closed_at) return false;
      const closedAt = new Date(d.deal_closed_at);
      if (dateRange.from && closedAt < dateRange.from) return false;
      if (dateRange.to) {
        const end = new Date(dateRange.to);
        end.setHours(23, 59, 59, 999);
        if (closedAt > end) return false;
      }
      return true;
    });
  }, [deals, dateRange]);

  const ranking: VendorRanking[] = useMemo(() => {
    const map = new Map<string, VendorRanking>();
    for (const deal of filteredDeals) {
      const existing = map.get(deal.vendor_id);
      const value = deal.deal_value ?? 0;
      const isProposal = deal.client_response === 'accepted' ? 1 : 0;
      if (existing) {
        existing.deal_count++;
        existing.total_value += value;
        existing.avg_ticket = existing.total_value / existing.deal_count;
        existing.proposal_deals += isProposal;
      } else {
        map.set(deal.vendor_id, {
          vendor_id: deal.vendor_id,
          vendor_name: deal.vendor_name,
          deal_count: 1,
          total_value: value,
          avg_ticket: value,
          proposal_deals: isProposal,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.total_value - a.total_value);
  }, [filteredDeals]);

  const totalDeals = filteredDeals.length;
  const totalValue = filteredDeals.reduce((s, d) => s + (d.deal_value ?? 0), 0);
  const avgTicket = totalDeals > 0 ? totalValue / totalDeals : 0;

  const presets: { key: PeriodPreset; label: string }[] = [
    { key: 'this_month', label: 'Este mês' },
    { key: 'last_month', label: 'Mês passado' },
    { key: 'last_90', label: 'Últimos 90 dias' },
    { key: 'custom', label: 'Personalizado' },
  ];

  return (
    <div className="space-y-6">
      {/* Period filters */}
      <div className="flex flex-wrap items-center gap-2">
        {presets.map((p) => (
          <Button
            key={p.key}
            size="sm"
            variant={period === p.key ? 'default' : 'outline'}
            onClick={() => setPeriod(p.key)}
            className={period === p.key ? 'bg-sage hover:bg-sage/90' : ''}
          >
            {p.label}
          </Button>
        ))}

        {period === 'custom' && (
          <>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    'w-36 justify-start text-left font-normal',
                    !customFrom && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {customFrom ? format(customFrom, 'dd/MM/yyyy') : 'Início'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={customFrom}
                  onSelect={setCustomFrom}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    'w-36 justify-start text-left font-normal',
                    !customTo && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {customTo ? format(customTo, 'dd/MM/yyyy') : 'Fim'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={customTo}
                  onSelect={setCustomTo}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-gradient-card">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sage-light">
              <Hash className="h-5 w-5 text-sage" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalDeals}</p>
              <p className="text-sm text-muted-foreground">Negócios fechados</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sage-light">
              <DollarSign className="h-5 w-5 text-sage" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
              <p className="text-sm text-muted-foreground">Valor total</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sage-light">
              <TrendingUp className="h-5 w-5 text-sage" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatCurrency(avgTicket)}</p>
              <p className="text-sm text-muted-foreground">Ticket médio</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ranking table */}
      <Card className="bg-gradient-card">
        <CardContent className="pt-6">
          {ranking.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              Nenhum negócio fechado neste período.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead className="text-center">Negócios</TableHead>
                  <TableHead className="text-right">Valor Total</TableHead>
                  <TableHead className="text-right">Ticket Médio</TableHead>
                  <TableHead className="text-center">Via Proposta</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ranking.map((v, i) => (
                  <TableRow key={v.vendor_id}>
                    <TableCell>
                      <Badge variant={i < 3 ? 'default' : 'secondary'} className={i < 3 ? 'bg-sage' : ''}>
                        {i + 1}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{v.vendor_name}</TableCell>
                    <TableCell className="text-center">{v.deal_count}</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(v.total_value)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(v.avg_ticket)}
                    </TableCell>
                    <TableCell className="text-center">
                      {v.proposal_deals > 0 ? (
                        <Badge variant="outline" className="text-xs gap-1">
                          <FileCheck className="h-3 w-3" />
                          {v.proposal_deals}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          onBonusClick({ id: v.vendor_id, full_name: v.vendor_name })
                        }
                      >
                        <Gift className="mr-1 h-3 w-3" />
                        Dar Bônus
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
