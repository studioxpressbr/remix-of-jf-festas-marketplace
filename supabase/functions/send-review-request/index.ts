import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Find eligible quotes: deal closed, event passed, no review yet, no email sent yet
    const { data: eligibleLeads, error: queryError } = await supabase
      .from("leads_access")
      .select(
        `
        id,
        quote_id,
        vendor_id,
        deal_value,
        quotes!leads_access_quote_id_fkey (
          id,
          event_date,
          client_id,
          vendor_id,
          profiles!quotes_client_id_fkey (
            full_name,
            email
          )
        )
      `
      )
      .eq("deal_closed", true)
      .is("review_requested_at", null);

    if (queryError) {
      console.error("Query error:", queryError);
      throw queryError;
    }

    if (!eligibleLeads || eligibleLeads.length === 0) {
      return new Response(
        JSON.stringify({ message: "No eligible leads found", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let sentCount = 0;

    for (const lead of eligibleLeads) {
      const quote = lead.quotes as any;
      if (!quote) continue;

      // Check event date has passed
      const eventDate = new Date(quote.event_date);
      if (eventDate >= today) continue;

      // Check no review exists yet
      const { data: existingReview } = await supabase
        .from("reviews")
        .select("id")
        .eq("quote_id", quote.id)
        .eq("reviewer_id", quote.client_id)
        .maybeSingle();

      if (existingReview) {
        // Already reviewed, mark as done
        await supabase
          .from("leads_access")
          .update({ review_requested_at: new Date().toISOString() })
          .eq("id", lead.id);
        continue;
      }

      const clientProfile = quote.profiles;
      if (!clientProfile?.email) continue;

      // Get vendor name
      const { data: vendorData } = await supabase
        .from("vendors")
        .select("business_name")
        .eq("profile_id", quote.vendor_id)
        .maybeSingle();

      const vendorName = vendorData?.business_name || "o fornecedor";
      const clientName = clientProfile.full_name?.split(" ")[0] || "Cliente";

      // Send email via Resend
      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "JF Festas <onboarding@resend.dev>",
          to: [clientProfile.email],
          subject: `Como foi sua experiência com ${vendorName}? Avalie agora! ⭐`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #333;">Olá, ${clientName}! 👋</h2>
              <p style="color: #555; font-size: 16px;">
                Seu evento já passou e gostaríamos de saber como foi sua experiência com 
                <strong>${vendorName}</strong>.
              </p>
              <p style="color: #555; font-size: 16px;">
                Sua avaliação ajuda outros clientes a encontrarem os melhores fornecedores 
                e também ajuda os fornecedores a melhorarem seus serviços.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${supabaseUrl.replace('.supabase.co', '.lovable.app')}/minha-conta" 
                   style="background-color: #e8927c; color: white; padding: 12px 30px; 
                          text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold;">
                  Avaliar Fornecedor ⭐
                </a>
              </div>
              <p style="color: #999; font-size: 13px;">
                JF Festas — Conectando você aos melhores fornecedores de festas
              </p>
            </div>
          `,
        }),
      });

      if (emailRes.ok) {
        // Mark as sent
        await supabase
          .from("leads_access")
          .update({ review_requested_at: new Date().toISOString() })
          .eq("id", lead.id);
        sentCount++;
        console.log(`Review request sent to ${clientProfile.email} for vendor ${vendorName}`);
      } else {
        const errBody = await emailRes.text();
        console.error(`Failed to send email to ${clientProfile.email}:`, errBody);
      }
    }

    return new Response(
      JSON.stringify({ message: "Review requests processed", sent: sentCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-review-request:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
