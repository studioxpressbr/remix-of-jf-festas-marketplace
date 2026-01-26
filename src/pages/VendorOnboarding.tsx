import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AuthProvider, useAuthContext } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ImageUpload } from '@/components/vendor/ImageUpload';
import { supabase } from '@/integrations/supabase/client';
import { VENDOR_CATEGORIES } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  ArrowLeft,
  ArrowRight,
  Store,
  Image as ImageIcon,
  FileCheck,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

const vendorFormSchema = z.object({
  business_name: z
    .string()
    .trim()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  category: z.enum(['confeitaria', 'doces', 'salgados', 'decoracao', 'outros'], {
    required_error: 'Selecione uma categoria',
  }),
  custom_category: z.string().optional(),
  description: z
    .string()
    .trim()
    .min(20, 'Descrição deve ter pelo menos 20 caracteres')
    .max(500, 'Descrição deve ter no máximo 500 caracteres'),
  neighborhood: z
    .string()
    .trim()
    .min(2, 'Bairro é obrigatório')
    .max(100, 'Bairro deve ter no máximo 100 caracteres'),
  images: z.array(z.string()).min(1, 'Adicione pelo menos 1 imagem'),
  terms_accepted: z.literal(true, {
    errorMap: () => ({ message: 'Você deve aceitar os termos' }),
  }),
});

type VendorFormData = z.infer<typeof vendorFormSchema>;

const STEPS = [
  { id: 1, title: 'Dados do negócio', icon: Store },
  { id: 2, title: 'Imagens', icon: ImageIcon },
  { id: 3, title: 'Revisão', icon: FileCheck },
];

function OnboardingContent() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuthContext();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [existingVendor, setExistingVendor] = useState<boolean | null>(null);

  const form = useForm<VendorFormData>({
    resolver: zodResolver(vendorFormSchema),
    defaultValues: {
      business_name: '',
      category: undefined,
      custom_category: '',
      description: '',
      neighborhood: '',
      images: [],
      terms_accepted: undefined,
    },
    mode: 'onChange',
  });

  const watchCategory = form.watch('category');
  const watchImages = form.watch('images');

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate('/', { state: { openAuth: true } });
      return;
    }

    // Check if user already has a vendor profile
    async function checkExistingVendor() {
      const { data } = await supabase
        .from('vendors')
        .select('id, approval_status')
        .eq('profile_id', user!.id)
        .maybeSingle();

      if (data) {
        if (data.approval_status === 'pending') {
          setSubmitted(true);
        } else {
          navigate('/painel-fornecedor');
        }
        setExistingVendor(true);
      } else {
        setExistingVendor(false);
      }
    }

    checkExistingVendor();
  }, [user, authLoading, navigate]);

  const validateStep = async (step: number): Promise<boolean> => {
    let fieldsToValidate: (keyof VendorFormData)[] = [];

    switch (step) {
      case 1:
        fieldsToValidate = ['business_name', 'category', 'description', 'neighborhood'];
        if (watchCategory === 'outros') {
          fieldsToValidate.push('custom_category');
        }
        break;
      case 2:
        fieldsToValidate = ['images'];
        break;
      case 3:
        fieldsToValidate = ['terms_accepted'];
        break;
    }

    const result = await form.trigger(fieldsToValidate);
    return result;
  };

  const handleNext = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid && currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: VendorFormData) => {
    if (!user) return;

    setSubmitting(true);

    try {
      // Update profile role to vendor
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ role: 'vendor' })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Create vendor profile
      const { error: vendorError } = await supabase.from('vendors').insert({
        profile_id: user.id,
        business_name: data.business_name,
        category: data.category,
        custom_category: data.category === 'outros' ? data.custom_category : null,
        description: data.description,
        neighborhood: data.neighborhood,
        images: data.images,
        approval_status: 'pending',
        submitted_at: new Date().toISOString(),
      });

      if (vendorError) throw vendorError;

      // Record terms acceptance
      await supabase.from('terms_acceptance').insert({
        user_id: user.id,
        terms_version: '1.0',
      });

      setSubmitted(true);
      toast({
        title: 'Cadastro enviado!',
        description: 'Analisaremos seu perfil em até 48 horas.',
      });
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: 'Erro ao enviar',
        description: 'Ocorreu um erro. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || existingVendor === null) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-16">
          <Card className="mx-auto max-w-lg bg-gradient-card text-center">
            <CardContent className="py-12">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-sage">
                <CheckCircle className="h-10 w-10 text-sage-foreground" />
              </div>
              <h1 className="mb-2 font-display text-2xl font-bold">
                Cadastro Enviado!
              </h1>
              <p className="mb-6 text-muted-foreground">
                Seu perfil está em análise. Você receberá um email assim que for
                aprovado. O prazo é de 24 a 48 horas úteis.
              </p>
              <Button asChild>
                <Link to="/">Voltar para a página inicial</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <div className="mx-auto max-w-2xl">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {STEPS.map((step, index) => {
                const Icon = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;

                return (
                  <div key={step.id} className="flex flex-1 items-center">
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors',
                          isActive && 'border-primary bg-primary text-primary-foreground',
                          isCompleted && 'border-sage bg-sage text-sage-foreground',
                          !isActive && !isCompleted && 'border-border bg-muted'
                        )}
                      >
                        {isCompleted ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <Icon className="h-5 w-5" />
                        )}
                      </div>
                      <span
                        className={cn(
                          'mt-2 text-xs font-medium',
                          isActive ? 'text-primary' : 'text-muted-foreground'
                        )}
                      >
                        {step.title}
                      </span>
                    </div>
                    {index < STEPS.length - 1 && (
                      <div
                        className={cn(
                          'mx-4 h-0.5 flex-1',
                          isCompleted ? 'bg-sage' : 'bg-border'
                        )}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form */}
          <Card className="bg-gradient-card">
            <CardHeader>
              <CardTitle className="font-display">
                {currentStep === 1 && 'Informações do seu negócio'}
                {currentStep === 2 && 'Fotos do seu trabalho'}
                {currentStep === 3 && 'Revise e envie'}
              </CardTitle>
              <CardDescription>
                {currentStep === 1 && 'Conte-nos sobre o seu negócio de festas.'}
                {currentStep === 2 && 'Adicione fotos que mostrem a qualidade do seu trabalho.'}
                {currentStep === 3 && 'Verifique as informações antes de enviar.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Step 1: Business Info */}
                  {currentStep === 1 && (
                    <>
                      <FormField
                        control={form.control}
                        name="business_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome do negócio *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ex: Doces da Maria"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Categoria *</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                value={field.value}
                                className="grid grid-cols-2 gap-3 sm:grid-cols-3"
                              >
                                {VENDOR_CATEGORIES.map((cat) => (
                                  <Label
                                    key={cat.value}
                                    className={cn(
                                      'flex cursor-pointer items-center gap-2 rounded-lg border-2 p-3 transition-colors hover:bg-muted',
                                      field.value === cat.value
                                        ? 'border-primary bg-primary/10'
                                        : 'border-border'
                                    )}
                                  >
                                    <RadioGroupItem value={cat.value} />
                                    <span>{cat.emoji}</span>
                                    <span>{cat.label}</span>
                                  </Label>
                                ))}
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {watchCategory === 'outros' && (
                        <FormField
                          control={form.control}
                          name="custom_category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Qual é a sua categoria? *</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Ex: Buffet, Fotografia, etc."
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      <FormField
                        control={form.control}
                        name="neighborhood"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bairro de atuação *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ex: Centro, Zona Sul"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Descrição *</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Descreva seu negócio, produtos/serviços oferecidos, diferenciais..."
                                rows={4}
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              {field.value?.length || 0}/500 caracteres
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  {/* Step 2: Images */}
                  {currentStep === 2 && (
                    <FormField
                      control={form.control}
                      name="images"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fotos do seu trabalho *</FormLabel>
                          <FormControl>
                            <ImageUpload
                              images={field.value}
                              onChange={field.onChange}
                              maxImages={5}
                            />
                          </FormControl>
                          <FormDescription>
                            Adicione fotos de alta qualidade dos seus produtos ou
                            serviços. A primeira imagem será a capa do seu perfil.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Step 3: Review */}
                  {currentStep === 3 && (
                    <div className="space-y-6">
                      <div className="rounded-lg border border-border bg-muted/50 p-4">
                        <h3 className="mb-4 font-semibold">Resumo do cadastro</h3>
                        <dl className="space-y-3 text-sm">
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Nome</dt>
                            <dd className="font-medium">
                              {form.getValues('business_name')}
                            </dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Categoria</dt>
                            <dd className="font-medium">
                              {VENDOR_CATEGORIES.find(
                                (c) => c.value === form.getValues('category')
                              )?.label}
                              {form.getValues('category') === 'outros' &&
                                ` (${form.getValues('custom_category')})`}
                            </dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Bairro</dt>
                            <dd className="font-medium">
                              {form.getValues('neighborhood')}
                            </dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Imagens</dt>
                            <dd className="font-medium">
                              {watchImages.length} foto(s)
                            </dd>
                          </div>
                        </dl>
                      </div>

                      <div className="rounded-lg border border-border bg-muted/50 p-4">
                        <p className="text-sm">{form.getValues('description')}</p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {watchImages.map((url, index) => (
                          <img
                            key={url}
                            src={url}
                            alt={`Preview ${index + 1}`}
                            className="h-16 w-16 rounded-lg object-cover"
                          />
                        ))}
                      </div>

                      <FormField
                        control={form.control}
                        name="terms_accepted"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border border-border p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>
                                Aceito os{' '}
                                <Link
                                  to="/termos"
                                  target="_blank"
                                  className="text-primary underline"
                                >
                                  termos de uso
                                </Link>{' '}
                                e{' '}
                                <Link
                                  to="/termos"
                                  target="_blank"
                                  className="text-primary underline"
                                >
                                  política de privacidade
                                </Link>
                              </FormLabel>
                              <FormMessage />
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex justify-between pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBack}
                      disabled={currentStep === 1}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Voltar
                    </Button>

                    {currentStep < STEPS.length ? (
                      <Button type="button" onClick={handleNext}>
                        Próximo
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        disabled={submitting}
                        className="bg-gradient-coral shadow-coral"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          'Enviar cadastro'
                        )}
                      </Button>
                    )}
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default function VendorOnboarding() {
  return (
    <AuthProvider>
      <OnboardingContent />
    </AuthProvider>
  );
}
