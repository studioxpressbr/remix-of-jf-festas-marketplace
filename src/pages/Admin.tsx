import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthProvider, useAuthContext } from '@/contexts/AuthContext';
import { useAdminRole } from '@/hooks/useAdminRole';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
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
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  Shield,
  Users,
  Store,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  UserCheck,
  AlertTriangle,
  Search,
  CalendarIcon,
  X,
  FileText,
  Coins,
} from 'lucide-react';

interface PendingVendor {
  id: string;
  business_name: string;
  category: string;
  description: string | null;
  neighborhood: string | null;
  created_at: string;
  submitted_at: string | null;
  profile_id: string;
  profiles: {
    full_name: string;
    email: string | null;
    whatsapp: string | null;
  } | null;
}

interface ProfileWithStats {
  id: string;
  full_name: string;
  email: string | null;
  whatsapp: string | null;
  role: 'vendor' | 'client';
  created_at: string;
  credits: number;
  quotes_requested: number;
  quotes_received: number;
}

function AdminContent() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthContext();
  const { isAdmin, loading: adminLoading } = useAdminRole();
  const { toast } = useToast();

  const [pendingVendors, setPendingVendors] = useState<PendingVendor[]>([]);
  const [allProfiles, setAllProfiles] = useState<ProfileWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  // Filter states
  const [emailFilter, setEmailFilter] = useState('');
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [minQuotes, setMinQuotes] = useState<number | ''>('');

  useEffect(() => {
    if (authLoading || adminLoading) return;

    if (!user || !isAdmin) {
      navigate('/');
      return;
    }

    fetchData();
  }, [user, isAdmin, authLoading, adminLoading, navigate]);

  async function fetchData() {
    setLoading(true);

    // Fetch pending vendors
    const { data: vendorsData } = await supabase
      .from('vendors')
      .select(`
        id,
        business_name,
        category,
        description,
        neighborhood,
        created_at,
        submitted_at,
        profile_id,
        profiles!vendors_profile_id_fkey(full_name, email, whatsapp)
      `)
      .eq('approval_status', 'pending')
      .order('submitted_at', { ascending: true });

    if (vendorsData) {
      setPendingVendors(vendorsData as unknown as PendingVendor[]);
    }

    // Fetch all profiles with stats
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesData) {
      // Fetch additional stats for each profile
      const profilesWithStats = await Promise.all(
        profilesData.map(async (profile) => {
          // Get credits (for vendors)
          let credits = 0;
          if (profile.role === 'vendor') {
            const { data: creditData } = await supabase
              .from('vendor_credits')
              .select('balance_after')
              .eq('vendor_id', profile.id)
              .order('created_at', { ascending: false })
              .limit(1);
            credits = creditData?.[0]?.balance_after || 0;
          }

          // Get quotes requested (as client)
          const { count: quotesRequested } = await supabase
            .from('quotes')
            .select('*', { count: 'exact', head: true })
            .eq('client_id', profile.id);

          // Get quotes received (as vendor)
          const { count: quotesReceived } = await supabase
            .from('quotes')
            .select('*', { count: 'exact', head: true })
            .eq('vendor_id', profile.id);

          return {
            ...profile,
            credits,
            quotes_requested: quotesRequested || 0,
            quotes_received: quotesReceived || 0,
          } as ProfileWithStats;
        })
      );

      setAllProfiles(profilesWithStats);
    }

    setLoading(false);
  }

  // Filtered profiles
  const filteredProfiles = useMemo(() => {
    return allProfiles.filter((profile) => {
      // Email filter
      if (emailFilter && !profile.email?.toLowerCase().includes(emailFilter.toLowerCase())) {
        return false;
      }

      // Date from filter
      if (dateFrom && new Date(profile.created_at) < dateFrom) {
        return false;
      }

      // Date to filter
      if (dateTo) {
        const endOfDay = new Date(dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        if (new Date(profile.created_at) > endOfDay) {
          return false;
        }
      }

      // Min quotes filter
      if (minQuotes !== '' && minQuotes > 0) {
        const totalQuotes = profile.quotes_requested + profile.quotes_received;
        if (totalQuotes < minQuotes) {
          return false;
        }
      }

      return true;
    });
  }, [allProfiles, emailFilter, dateFrom, dateTo, minQuotes]);

  const clearFilters = () => {
    setEmailFilter('');
    setDateFrom(undefined);
    setDateTo(undefined);
    setMinQuotes('');
  };

  const hasActiveFilters = emailFilter || dateFrom || dateTo || minQuotes !== '';

  async function handleApprove(vendorId: string) {
    setProcessing(vendorId);

    try {
      const { error } = await supabase
        .from('vendors')
        .update({
          approval_status: 'approved',
          is_approved: true,
          approved_at: new Date().toISOString(),
          approved_by: user!.id,
        })
        .eq('id', vendorId);

      if (error) throw error;

      toast({
        title: 'Fornecedor aprovado!',
        description: 'O fornecedor agora está visível na plataforma.',
      });

      // Refresh data
      fetchData();
    } catch (error: unknown) {
      toast({
        title: 'Erro ao aprovar',
        description: error instanceof Error ? error.message : 'Tente novamente',
        variant: 'destructive',
      });
    } finally {
      setProcessing(null);
    }
  }

  async function handleReject(vendorId: string) {
    setProcessing(vendorId);

    try {
      const { error } = await supabase
        .from('vendors')
        .update({
          approval_status: 'rejected',
          is_approved: false,
        })
        .eq('id', vendorId);

      if (error) throw error;

      toast({
        title: 'Fornecedor rejeitado',
        description: 'O cadastro foi marcado como rejeitado.',
      });

      // Refresh data
      fetchData();
    } catch (error: unknown) {
      toast({
        title: 'Erro ao rejeitar',
        description: error instanceof Error ? error.message : 'Tente novamente',
        variant: 'destructive',
      });
    } finally {
      setProcessing(null);
    }
  }

  if (authLoading || adminLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <Skeleton className="mb-8 h-12 w-64" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-12">
          <Card className="mx-auto max-w-md bg-gradient-card">
            <CardContent className="py-12 text-center">
              <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-coral" />
              <h2 className="font-display text-xl font-semibold">Acesso Negado</h2>
              <p className="mt-2 text-muted-foreground">
                Você não tem permissão para acessar esta página.
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const vendorCount = allProfiles.filter((p) => p.role === 'vendor').length;
  const clientCount = allProfiles.filter((p) => p.role === 'client').length;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-coral">
            <Shield className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">Painel Administrativo</h1>
            <p className="text-sm text-muted-foreground">
              Gerencie fornecedores e usuários da plataforma
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <Card className="bg-gradient-card">
            <CardContent className="flex items-center gap-4 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-coral-light">
                <Clock className="h-5 w-5 text-coral" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingVendors.length}</p>
                <p className="text-sm text-muted-foreground">Pendentes</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-card">
            <CardContent className="flex items-center gap-4 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sage-light">
                <Store className="h-5 w-5 text-sage" />
              </div>
              <div>
                <p className="text-2xl font-bold">{vendorCount}</p>
                <p className="text-sm text-muted-foreground">Fornecedores</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-card">
            <CardContent className="flex items-center gap-4 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-champagne">
                <Users className="h-5 w-5 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{clientCount}</p>
                <p className="text-sm text-muted-foreground">Clientes</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-4 w-4" />
              Aprovações Pendentes
              {pendingVendors.length > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {pendingVendors.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Usuários
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {pendingVendors.length === 0 ? (
              <Card className="bg-gradient-card">
                <CardContent className="py-12 text-center">
                  <CheckCircle className="mx-auto mb-4 h-12 w-12 text-sage" />
                  <h3 className="font-display text-lg font-semibold">Tudo em dia!</h3>
                  <p className="mt-2 text-muted-foreground">
                    Não há fornecedores aguardando aprovação.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-gradient-card">
                <CardHeader>
                  <CardTitle>Fornecedores Aguardando Aprovação</CardTitle>
                  <CardDescription>
                    Revise e aprove os cadastros de novos fornecedores
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Negócio</TableHead>
                        <TableHead>Proprietário</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Contato</TableHead>
                        <TableHead>Enviado em</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingVendors.map((vendor) => (
                        <TableRow key={vendor.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{vendor.business_name}</p>
                              {vendor.neighborhood && (
                                <p className="text-xs text-muted-foreground">
                                  {vendor.neighborhood}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {vendor.profiles?.full_name || 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{vendor.category}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {vendor.profiles?.whatsapp && (
                                <p>{vendor.profiles.whatsapp}</p>
                              )}
                              {vendor.profiles?.email && (
                                <p className="text-muted-foreground">{vendor.profiles.email}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {vendor.submitted_at
                              ? format(new Date(vendor.submitted_at), "dd/MM/yyyy", { locale: ptBR })
                              : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate(`/vendor/${vendor.profile_id}`)}
                              >
                                <Eye className="mr-1 h-3 w-3" />
                                Ver
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleReject(vendor.id)}
                                disabled={processing === vendor.id}
                              >
                                <XCircle className="mr-1 h-3 w-3" />
                                Rejeitar
                              </Button>
                              <Button
                                size="sm"
                                className="bg-sage hover:bg-sage/90"
                                onClick={() => handleApprove(vendor.id)}
                                disabled={processing === vendor.id}
                              >
                                <CheckCircle className="mr-1 h-3 w-3" />
                                Aprovar
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="users">
            <Card className="bg-gradient-card">
              <CardHeader>
                <CardTitle>Todos os Usuários</CardTitle>
                <CardDescription>
                  Lista de todos os usuários cadastrados na plataforma
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filters */}
                <div className="flex flex-wrap gap-3 rounded-lg border bg-muted/30 p-4">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por e-mail..."
                      value={emailFilter}
                      onChange={(e) => setEmailFilter(e.target.value)}
                      className="w-48"
                    />
                  </div>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-40 justify-start text-left font-normal",
                          !dateFrom && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateFrom ? format(dateFrom, "dd/MM/yyyy") : "Data início"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateFrom}
                        onSelect={setDateFrom}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-40 justify-start text-left font-normal",
                          !dateTo && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateTo ? format(dateTo, "dd/MM/yyyy") : "Data fim"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateTo}
                        onSelect={setDateTo}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>

                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      placeholder="Mín. cotações"
                      value={minQuotes}
                      onChange={(e) => setMinQuotes(e.target.value ? parseInt(e.target.value) : '')}
                      className="w-32"
                      min={0}
                    />
                  </div>

                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="text-muted-foreground"
                    >
                      <X className="mr-1 h-4 w-4" />
                      Limpar
                    </Button>
                  )}
                </div>

                {hasActiveFilters && (
                  <p className="text-sm text-muted-foreground">
                    Mostrando {filteredProfiles.length} de {allProfiles.length} usuários
                  </p>
                )}

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>E-mail</TableHead>
                      <TableHead>WhatsApp</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Cadastro</TableHead>
                      <TableHead className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Coins className="h-3.5 w-3.5" />
                          Créditos
                        </div>
                      </TableHead>
                      <TableHead className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <FileText className="h-3.5 w-3.5" />
                          Cotações
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProfiles.map((profile) => (
                      <TableRow key={profile.id}>
                        <TableCell className="font-medium">
                          {profile.role === 'vendor' ? (
                            <Button
                              variant="link"
                              className="h-auto p-0 text-primary"
                              onClick={() => navigate(`/vendor/${profile.id}`)}
                            >
                              {profile.full_name}
                            </Button>
                          ) : (
                            profile.full_name
                          )}
                        </TableCell>
                        <TableCell>{profile.email || '-'}</TableCell>
                        <TableCell>{profile.whatsapp || '-'}</TableCell>
                        <TableCell>
                          <Badge
                            variant={profile.role === 'vendor' ? 'default' : 'secondary'}
                          >
                            {profile.role === 'vendor' ? (
                              <>
                                <Store className="mr-1 h-3 w-3" />
                                Fornecedor
                              </>
                            ) : (
                              <>
                                <UserCheck className="mr-1 h-3 w-3" />
                                Cliente
                              </>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(profile.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-center">
                          {profile.role === 'vendor' ? (
                            <Badge variant="outline" className="font-mono">
                              {profile.credits}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            {profile.role === 'client' && profile.quotes_requested > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {profile.quotes_requested} pedidas
                              </Badge>
                            )}
                            {profile.role === 'vendor' && profile.quotes_received > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {profile.quotes_received} recebidas
                              </Badge>
                            )}
                            {((profile.role === 'client' && profile.quotes_requested === 0) ||
                              (profile.role === 'vendor' && profile.quotes_received === 0)) && (
                              <span className="text-muted-foreground">0</span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default function Admin() {
  return (
    <AuthProvider>
      <AdminContent />
    </AuthProvider>
  );
}
