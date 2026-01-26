import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  console.log(`[VERIFY-PAYMENT] ${step}`, details ? JSON.stringify(details) : '');
};

serve(async (req) => {
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

    const { sessionId, quoteId } = await req.json();
    if (!sessionId) throw new Error("Session ID is required");
    logStep("Verifying payment", { sessionId, quoteId });

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
        message: "Payment not completed" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // If this is a lead unlock payment
    if (session.metadata?.type === "lead_unlock" && quoteId) {
      // Check if lead access already exists
      const { data: existingAccess } = await supabaseClient
        .from('leads_access')
        .select('id')
        .eq('quote_id', quoteId)
        .eq('vendor_id', user.id)
        .maybeSingle();

      if (!existingAccess) {
        // Create lead access record
        const { error: insertError } = await supabaseClient
          .from('leads_access')
          .insert({
            quote_id: quoteId,
            vendor_id: user.id,
            payment_status: 'paid',
            transaction_id: session.payment_intent as string,
            unlocked_at: new Date().toISOString(),
          });

        if (insertError) {
          logStep("Error inserting lead access", { error: insertError.message });
          throw new Error(`Failed to record lead access: ${insertError.message}`);
        }

        logStep("Lead access granted", { quoteId, vendorId: user.id });
      } else {
        logStep("Lead access already exists", { quoteId });
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Payment verified successfully" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
