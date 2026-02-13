import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'npm:resend@2.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface NotifyRequest {
  quoteId: string;
  response: 'accepted' | 'rejected';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: NotifyRequest = await req.json();
    const { quoteId, response } = body;

    if (!quoteId || !response || !['accepted', 'rejected'].includes(response)) {
      return new Response(
        JSON.stringify({ error: 'quoteId e response (accepted/rejected) são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch quote and validate client ownership
    const { data: quote, error: quoteError } = await supabaseAdmin
      .from('quotes')
      .select('id, client_id, vendor_id, proposed_value')
      .eq('id', quoteId)
      .single();

    if (quoteError || !quote) {
      return new Response(
        JSON.stringify({ error: 'Cotação não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (quote.client_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Você não é o cliente desta cotação' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch client and vendor profiles
    const { data: clientProfile } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    const { data: vendorProfile } = await supabaseAdmin
      .from('profiles')
      .select('full_name, email')
      .eq('id', quote.vendor_id)
      .single();

    const clientName = clientProfile?.full_name || 'Cliente';
    const proposedValue = quote.proposed_value
      ? Number(quote.proposed_value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      : 'N/A';

    const isAccepted = response === 'accepted';
    const subject = isAccepted ? '✅ Proposta aceita!' : '❌ Proposta recusada';
    const content = isAccepted
      ? `${clientName} aceitou sua proposta de ${proposedValue}. O negócio foi fechado automaticamente!`
      : `${clientName} recusou sua proposta de ${proposedValue}. Você pode enviar uma nova proposta ou entrar em contato.`;

    // Insert internal notification
    await supabaseAdmin.from('user_messages').insert({
      recipient_id: quote.vendor_id,
      sender_id: user.id,
      subject,
      content,
      is_read: false,
    });

    // Send email via Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (resendApiKey && vendorProfile?.email) {
      try {
        const resend = new Resend(resendApiKey);
        const dashboardUrl = 'https://jffestas.lovable.app/vendor/dashboard';

        const emailHtml = `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
        <tr><td style="background:linear-gradient(135deg,${isAccepted ? '#22c55e' : '#ef4444'} 0%,${isAccepted ? '#16a34a' : '#dc2626'} 100%);padding:32px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;">${isAccepted ? '🎉 Proposta Aceita!' : '📋 Proposta Recusada'}</h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:16px;">${clientName} respondeu à sua proposta</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 24px;color:#374151;font-size:16px;line-height:1.6;">
            Olá, <strong>${vendorProfile.full_name || 'Fornecedor'}</strong>!
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:${isAccepted ? '#dcfce7' : '#fee2e2'};border-radius:8px;padding:20px;margin-bottom:24px;">
            <tr><td style="padding:16px;">
              <p style="margin:0;color:${isAccepted ? '#166534' : '#991b1b'};font-size:16px;line-height:1.6;">
                <strong>${clientName}</strong> ${isAccepted ? 'aceitou' : 'recusou'} sua proposta de <strong>${proposedValue}</strong>.
              </p>
              ${isAccepted ? '<p style="margin:12px 0 0;color:#166534;font-size:14px;">O negócio foi fechado automaticamente no seu painel!</p>' : '<p style="margin:12px 0 0;color:#991b1b;font-size:14px;">Você pode entrar em contato ou enviar uma nova proposta.</p>'}
            </td></tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="padding:16px 0;">
              <a href="${dashboardUrl}" style="display:inline-block;background:linear-gradient(135deg,#f97316 0%,#ea580c 100%);color:#ffffff;text-decoration:none;padding:16px 32px;border-radius:8px;font-weight:600;font-size:16px;box-shadow:0 4px 14px rgba(249,115,22,0.4);">
                Ver no Painel
              </a>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
          <p style="margin:0;color:#9ca3af;font-size:12px;">Este e-mail foi enviado automaticamente pelo JF Festas.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

        await resend.emails.send({
          from: 'JF Festas <onboarding@resend.dev>',
          to: [vendorProfile.email],
          subject: `${isAccepted ? '✅' : '❌'} ${clientName} ${isAccepted ? 'aceitou' : 'recusou'} sua proposta`,
          html: emailHtml,
        });
      } catch (emailError) {
        console.error('Error sending email:', emailError);
        // Don't fail the request if email fails
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error in notify-proposal-response:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
