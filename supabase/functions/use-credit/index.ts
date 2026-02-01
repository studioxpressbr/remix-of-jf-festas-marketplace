import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const ALLOWED_ORIGINS = [
  "https://jffestas.lovable.app",
  "https://id-preview--97dc209a-b9ca-4e21-a536-66376a89d53f.lovable.app",
];

const getCorsHeaders = (origin: string | null) => {
  const allowedOrigin = origin && ALLOWED_ORIGINS.some(allowed => origin.startsWith(allowed.replace('https://', 'https://')) || origin.includes('lovable.app'))
    ? origin
    : ALLOWED_ORIGINS[0];
  
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  };
};

const logStep = (step: string, details?: unknown) => {
  console.log(`[USE-CREDIT] ${step}`, details ? JSON.stringify(details) : '');
};

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    const { quoteId } = await req.json();
    if (!quoteId) throw new Error("Quote ID is required");
    logStep("Processing credit usage", { quoteId });

    // Check if already unlocked
    const { data: existingAccess } = await supabaseClient
      .from('leads_access')
      .select('id')
      .eq('quote_id', quoteId)
      .eq('vendor_id', user.id)
      .maybeSingle();

    if (existingAccess) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Lead já liberado" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Use atomic database function to prevent race conditions
    // This function will check balance, deduct credit, and return new balance atomically
    const { data: result, error: rpcError } = await supabaseClient.rpc('use_credit_atomic', {
      p_vendor_id: user.id,
      p_quote_id: quoteId
    });

    if (rpcError) {
      logStep("RPC error", { error: rpcError.message });
      
      // Check if it's an insufficient balance error
      if (rpcError.message.includes('insufficient') || rpcError.message.includes('Saldo insuficiente')) {
        return new Response(JSON.stringify({ 
          success: false, 
          message: "Saldo insuficiente. Compre créditos para liberar este contato.",
          needsCredits: true,
          currentBalance: 0
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
      
      throw new Error(`Failed to use credit: ${rpcError.message}`);
    }

    const newBalance = result?.new_balance ?? 0;
    logStep("Lead unlocked successfully", { quoteId, newBalance });

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Contato liberado com sucesso!",
      newBalance
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    const origin = req.headers.get("origin");
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" },
      status: 500,
    });
  }
});
