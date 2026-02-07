import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const ALLOWED_ORIGINS = [
  "https://jffestas.lovable.app",
  "https://id-preview--97dc209a-b9ca-4e21-a536-66376a89d53f.lovable.app",
];

const getCorsHeaders = (origin: string | null) => {
  const allowedOrigin = origin && (origin.includes('lovable.app') || origin.includes('lovableproject.com'))
    ? origin
    : ALLOWED_ORIGINS[0];
  
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  };
};

const logStep = (step: string, details?: unknown) => {
  console.log(`[VERIFY-CREDIT-PURCHASE] ${step}`, details ? JSON.stringify(details) : '');
};

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

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

    const { sessionId, quantity } = await req.json();
    if (!sessionId) throw new Error("Session ID is required");
    logStep("Verifying credit purchase", { sessionId, quantity });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Retrieve the session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    logStep("Session retrieved", { 
      status: session.status, 
      paymentStatus: session.payment_status,
      metadata: session.metadata 
    });

    if (session.payment_status !== "paid") {
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Pagamento não confirmado" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Check if credits were already added for this session
    const { data: existingCredit } = await supabaseClient
      .from('vendor_credits')
      .select('id')
      .eq('stripe_session_id', sessionId)
      .maybeSingle();

    if (existingCredit) {
      logStep("Credits already added for this session", { sessionId });
      
      // Get current balance
      const { data: lastCredit } = await supabaseClient
        .from('vendor_credits')
        .select('balance_after')
        .eq('vendor_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      return new Response(JSON.stringify({ 
        success: true, 
        message: "Créditos já adicionados",
        newBalance: lastCredit?.balance_after ?? 0
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Get current balance
    const { data: lastCredit } = await supabaseClient
      .from('vendor_credits')
      .select('balance_after')
      .eq('vendor_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const currentBalance = lastCredit?.balance_after ?? 0;
    const creditQuantity = parseInt(session.metadata?.quantity || quantity || '1', 10);
    const newBalance = currentBalance + creditQuantity;

    // Add credits
    const { error: insertError } = await supabaseClient
      .from('vendor_credits')
      .insert({
        vendor_id: user.id,
        amount: creditQuantity,
        balance_after: newBalance,
        transaction_type: 'purchase',
        description: `Compra de ${creditQuantity} crédito${creditQuantity > 1 ? 's' : ''}`,
        stripe_session_id: sessionId,
      });

    if (insertError) {
      logStep("Error inserting credit", { error: insertError.message });
      throw new Error(`Failed to add credits: ${insertError.message}`);
    }

    logStep("Credits added successfully", { quantity: creditQuantity, newBalance });

    return new Response(JSON.stringify({ 
      success: true, 
      message: `${creditQuantity} crédito${creditQuantity > 1 ? 's' : ''} adicionado${creditQuantity > 1 ? 's' : ''}!`,
      quantity: creditQuantity,
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
