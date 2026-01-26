import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import VendorProfile from "./pages/VendorProfile";
import VendorDashboard from "./pages/VendorDashboard";
import VendorOnboarding from "./pages/VendorOnboarding";
import Buscar from "./pages/Buscar";
import Termos from "./pages/Termos";
import CategoryPage from "./pages/CategoryPage";
import PagamentoSucesso from "./pages/PagamentoSucesso";
import LeadDesbloqueado from "./pages/LeadDesbloqueado";
import Precos from "./pages/Precos";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/vendor/:id" element={<VendorProfile />} />
          <Route path="/dashboard" element={<VendorDashboard />} />
          <Route path="/cadastro-fornecedor" element={<VendorOnboarding />} />
          <Route path="/buscar" element={<Buscar />} />
          <Route path="/termos" element={<Termos />} />
          <Route path="/precos" element={<Precos />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/categoria/:slug" element={<CategoryPage />} />
          <Route path="/pagamento-sucesso" element={<PagamentoSucesso />} />
          <Route path="/lead-desbloqueado" element={<LeadDesbloqueado />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
