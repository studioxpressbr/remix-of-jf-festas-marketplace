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
  console.log(`[BUY-LEAD-CREDIT] ${step}`, details ? JSON.stringify(details) : '');
};

// Price ID for lead credits
const LEAD_CREDIT_PRICE_ID = "price_1StuLVRDc1lDOFiCfmHwuIrg";

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
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { quoteId } = await req.json();
    if (!quoteId) throw new Error("Quote ID is required");
    logStep("Processing lead unlock", { quoteId });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    }

    // Use allowed origin for redirect URLs
    const redirectOrigin = origin && (origin.includes('lovable.app') || origin.includes('lovableproject.com'))
      ? origin
      : ALLOWED_ORIGINS[0];

    // Create one-time payment session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: LEAD_CREDIT_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${redirectOrigin}/lead-desbloqueado?session_id={CHECKOUT_SESSION_ID}&quote_id=${quoteId}`,
      cancel_url: `${redirectOrigin}/dashboard`,
      metadata: {
        user_id: user.id,
        quote_id: quoteId,
        type: "lead_unlock",
      },
    });

    logStep("Payment session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
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
