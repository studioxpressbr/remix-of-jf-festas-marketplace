import { AuthProvider } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Link } from 'react-router-dom';

function TermosPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8 md:py-12">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-2 font-display text-3xl font-bold md:text-4xl">
            Termos e Condições
          </h1>
          <p className="mb-8 text-muted-foreground">
            Última atualização: Janeiro de 2025
          </p>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="font-display text-xl">1. Sobre o JF Festas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>
                O JF Festas é um marketplace que conecta fornecedores de serviços para festas 
                e eventos com clientes em Juiz de Fora e região. Nossa plataforma facilita 
                a descoberta e contratação de profissionais qualificados.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="font-display text-xl">2. Cadastro de Fornecedores</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>
                <strong>2.1.</strong> Fornecedores podem se cadastrar na plataforma mediante 
                pagamento de uma assinatura anual no valor de R$ 99,00 (noventa e nove reais).
              </p>
              <p>
                <strong>2.2.</strong> Toda nova publicação ou edição de perfil de fornecedor 
                passa por um processo de aprovação administrativa, com prazo de 24 a 48 horas úteis.
              </p>
              <p>
                <strong>2.3.</strong> A publicação do perfil só será efetivada após a 
                confirmação do pagamento da assinatura no Stripe.
              </p>
              <p>
                <strong>2.4.</strong> Fornecedores podem sugerir novas categorias de serviços, 
                sujeitas à aprovação da administração.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="font-display text-xl">3. Sistema de Leads</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>
                <strong>3.1.</strong> Quando um cliente envia uma solicitação de cotação, 
                os dados de contato permanecem ocultos para o fornecedor.
              </p>
              <p>
                <strong>3.2.</strong> Para visualizar os dados de contato do cliente, 
                o fornecedor deve adquirir um crédito de lead no valor de R$ 2,00 (dois reais).
              </p>
              <p>
                <strong>3.3.</strong> O pagamento do crédito de lead é processado via Stripe 
                e, após confirmação, os dados do cliente são liberados imediatamente.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="font-display text-xl">4. Cupons de Desconto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>
                <strong>4.1.</strong> Fornecedores podem criar cupons de desconto para 
                seus serviços, em valores fixos (R$) ou percentuais (%).
              </p>
              <p>
                <strong>4.2.</strong> Todos os cupons possuem validade máxima de 7 (sete) 
                dias a partir da data de criação.
              </p>
              <p>
                <strong>4.3.</strong> A utilização e validação dos cupons é de 
                responsabilidade do fornecedor junto ao cliente.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="font-display text-xl">5. Sistema de Avaliações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>
                <strong>5.1.</strong> Tanto o cliente quanto o fornecedor podem avaliar 
                um ao outro após a realização do evento.
              </p>
              <p>
                <strong>5.2.</strong> O prazo para realizar a avaliação é de 7 (sete) dias 
                após a data do evento informada na solicitação de cotação.
              </p>
              <p>
                <strong>5.3.</strong> As avaliações são públicas e visíveis no perfil 
                de cada usuário.
              </p>
              <p>
                <strong>5.4.</strong> Avaliações que contenham conteúdo ofensivo, 
                difamatório ou inadequado podem ser removidas pela administração.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="font-display text-xl">6. Responsabilidades</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>
                <strong>6.1.</strong> O JF Festas atua apenas como intermediador entre 
                fornecedores e clientes, não sendo responsável pela qualidade dos 
                serviços prestados ou produtos fornecidos.
              </p>
              <p>
                <strong>6.2.</strong> Negociações, acordos e pagamentos pelos serviços 
                contratados são realizados diretamente entre as partes.
              </p>
              <p>
                <strong>6.3.</strong> Recomendamos que todos os acordos sejam formalizados 
                por escrito entre fornecedor e cliente.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="font-display text-xl">7. Privacidade e Dados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>
                <strong>7.1.</strong> Os dados pessoais coletados são utilizados 
                exclusivamente para o funcionamento da plataforma.
              </p>
              <p>
                <strong>7.2.</strong> Dados de contato dos clientes só são compartilhados 
                com fornecedores mediante pagamento do crédito de lead.
              </p>
              <p>
                <strong>7.3.</strong> Não comercializamos dados pessoais com terceiros.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="font-display text-xl">8. Disposições Gerais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>
                <strong>8.1.</strong> O JF Festas reserva-se o direito de modificar estes 
                termos a qualquer momento, comunicando os usuários sobre alterações significativas.
              </p>
              <p>
                <strong>8.2.</strong> O uso continuado da plataforma após alterações 
                implica na aceitação dos novos termos.
              </p>
              <p>
                <strong>8.3.</strong> Casos omissos serão resolvidos pela administração 
                da plataforma, sempre buscando a melhor solução para todas as partes.
              </p>
            </CardContent>
          </Card>

          <Separator className="my-8" />

          <div className="text-center text-sm text-muted-foreground">
            <p>
              Dúvidas? Entre em contato conosco pelo{' '}
              <a 
                href="https://www.instagram.com/festasemjf/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-secondary hover:underline"
              >
                Instagram @festasemjf
              </a>
            </p>
            <p className="mt-4">
              <Link to="/" className="text-secondary hover:underline">
                ← Voltar para a página inicial
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function Termos() {
  return (
    <AuthProvider>
      <TermosPage />
    </AuthProvider>
  );
}
