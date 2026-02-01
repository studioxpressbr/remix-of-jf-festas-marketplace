import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthProvider, useAuthContext } from '@/contexts/AuthContext';
import { useAdminRole } from '@/hooks/useAdminRole';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

interface Profile {
  id: string;
  full_name: string;
  email: string | null;
  whatsapp: string | null;
  role: 'vendor' | 'client';
  created_at: string;
}

function AdminContent() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthContext();
  const { isAdmin, loading: adminLoading } = useAdminRole();
  const { toast } = useToast();

  const [pendingVendors, setPendingVendors] = useState<PendingVendor[]>([]);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

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

    // Fetch all profiles
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesData) {
      setAllProfiles(profilesData as Profile[]);
    }

    setLoading(false);
  }

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
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>E-mail</TableHead>
                      <TableHead>WhatsApp</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Cadastro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allProfiles.map((profile) => (
                      <TableRow key={profile.id}>
                        <TableCell className="font-medium">
                          {profile.full_name}
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
