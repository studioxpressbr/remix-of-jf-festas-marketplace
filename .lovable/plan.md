

## Duas Funcionalidades: Carousel Hero + Endereco com Google Maps

**Custo estimado: 3 creditos**
- 1 credito: Carousel no hero da pagina Para Clientes
- 2 creditos: Campo de endereco completo + mini mapa no perfil do fornecedor (migracao DB + onboarding + edit modal + perfil publico + configuracao da API Key)

---

### 1. Carousel Rotatorio no Hero (ParaClientes.tsx)

Substituir o hero estatico por um carousel com 3 slides usando o componente Carousel/Embla ja existente no projeto, com autoplay.

Cada slide tera:
- Fundo colorido (mock) com gradientes festivos diferentes
- Titulo e subtitulo sobrepostos

Os 3 slides:
1. Gradiente coral/rosa — "Encontre os melhores fornecedores"
2. Gradiente dourado/champagne — "Cadastro gratuito, sem compromisso"
3. Gradiente verde/sage — "Promocoes exclusivas para voce"

Autoplay a cada 4 segundos com loop infinito.

---

### 2. Endereco Completo + Mini Mapa Google Maps

#### 2a. Migracao de Banco de Dados
- Adicionar coluna `address` (text, nullable) na tabela `vendors`
- Adicionar coluna `address` nas views `vendors_public` e `vendors_search`

#### 2b. Configuracao da API Key
- Solicitar a Google Maps API Key via ferramenta de secrets (para uso em edge function ou diretamente no frontend como chave publica)
- Como a API Key do Google Maps e uma chave **publica** (usada no frontend via iframe/embed), ela sera armazenada como variavel de ambiente VITE no codigo

#### 2c. Onboarding (VendorOnboarding.tsx)
- Adicionar campo "Endereco completo" no Step 1, abaixo do campo "Bairro"
- Validacao: minimo 10 caracteres, maximo 200
- Placeholder: "Ex: Rua Santos Dumont, 123 - Centro, Juiz de Fora - MG"

#### 2d. Modal de Edicao (VendorEditProfileModal.tsx)
- Adicionar campo "Endereco completo" abaixo do campo "Bairro"
- Mesma validacao do onboarding
- Incluir no submit e no reset do formulario

#### 2e. Perfil Publico (VendorProfile.tsx)
- Abaixo da secao "Sobre", adicionar um Card com:
  - Icone MapPin + titulo "Localizacao"
  - Endereco em texto
  - Iframe do Google Maps Embed API mostrando o endereco
  - URL: `https://www.google.com/maps/embed/v1/place?key=API_KEY&q=ENDERECO_ENCODED`
- O card so aparece se o fornecedor tiver endereco preenchido

---

### Detalhes Tecnicos

```text
Migracao SQL:
  ALTER TABLE vendors ADD COLUMN address text;
  -- Recriar views para incluir address

ParaClientes.tsx:
  import embla-carousel-autoplay
  import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel'
  
  const heroSlides = [
    { gradient: "from-coral/30 to-coral-light/20", title: "...", subtitle: "..." },
    { gradient: "from-champagne to-champagne/50", title: "...", subtitle: "..." },
    { gradient: "from-sage/30 to-sage/10", title: "...", subtitle: "..." },
  ]
  
  <Carousel plugins={[Autoplay({ delay: 4000 })]} opts={{ loop: true }}>

VendorOnboarding.tsx (schema):
  address: z.string().trim()
    .min(10, 'Endereco deve ter pelo menos 10 caracteres')
    .max(200, 'Endereco deve ter no maximo 200 caracteres')
    .or(z.literal(''))

VendorEditProfileModal.tsx:
  + address no schema, form, render e submit
  + vendorData.address no reset

VendorProfile.tsx:
  {vendor.address && (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Localizacao</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{vendor.address}</p>
        <iframe
          src={`https://www.google.com/maps/embed/v1/place?key=${MAPS_KEY}&q=${encodeURIComponent(vendor.address)}`}
          className="mt-3 h-48 w-full rounded-lg border-0"
          allowFullScreen
          loading="lazy"
        />
      </CardContent>
    </Card>
  )}

Google Maps API Key:
  Chave publica — armazenada como VITE_GOOGLE_MAPS_API_KEY no .env
  Usada diretamente no iframe embed (nao precisa de edge function)
```
