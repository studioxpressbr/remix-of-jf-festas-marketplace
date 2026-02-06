import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'npm:resend@2.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface NotifyRequest {
  quoteId: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY não configurada');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Verify user is authenticated
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

    // Parse request body
    const body: NotifyRequest = await req.json();
    const { quoteId } = body;

    if (!quoteId) {
      return new Response(
        JSON.stringify({ error: 'quoteId é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create admin client for data retrieval
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get quote data with client info
    const { data: quote, error: quoteError } = await supabaseAdmin
      .from('quotes')
      .select(`
        id,
        event_date,
        pax_count,
        description,
        vendor_id,
        client:profiles!quotes_client_id_fkey(full_name, whatsapp, email)
      `)
      .eq('id', quoteId)
      .single();

    if (quoteError || !quote) {
      console.error('Quote fetch error:', quoteError);
      return new Response(
        JSON.stringify({ error: 'Cotação não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get vendor email
    const { data: vendorProfile, error: vendorError } = await supabaseAdmin
      .from('profiles')
      .select('email, full_name')
      .eq('id', quote.vendor_id)
      .single();

    if (vendorError || !vendorProfile?.email) {
      console.error('Vendor fetch error:', vendorError);
      return new Response(
        JSON.stringify({ error: 'E-mail do fornecedor não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format date
    const eventDate = new Date(quote.event_date);
    const formattedDate = eventDate.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Build email HTML
    const clientInfo = quote.client as { full_name: string; whatsapp: string | null; email: string | null };
    const dashboardUrl = 'https://jffestas.lovable.app/vendor/dashboard';

    const emailHtml = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nova Cotação Recebida</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 32px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">🎉 Nova Cotação!</h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Você recebeu uma nova solicitação</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                Olá, <strong>${vendorProfile.full_name || 'Fornecedor'}</strong>!
              </p>
              
              <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                <strong>${clientInfo.full_name}</strong> está interessado nos seus serviços e enviou uma cotação:
              </p>
              
              <!-- Quote Details Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef3c7; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <tr>
                  <td>
                    <table width="100%" cellpadding="8" cellspacing="0">
                      <tr>
                        <td style="color: #92400e; font-weight: 600; width: 140px;">📅 Data do Evento:</td>
                        <td style="color: #78350f;">${formattedDate}</td>
                      </tr>
                      <tr>
                        <td style="color: #92400e; font-weight: 600;">👥 Nº de Pessoas:</td>
                        <td style="color: #78350f;">${quote.pax_count} pessoas</td>
                      </tr>
                      ${quote.description ? `
                      <tr>
                        <td style="color: #92400e; font-weight: 600; vertical-align: top;">📝 Detalhes:</td>
                        <td style="color: #78350f;">${quote.description}</td>
                      </tr>
                      ` : ''}
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 16px 0;">
                    <a href="${dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(249, 115, 22, 0.4);">
                      Ver Cotação no Painel
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 24px 0 0; color: #6b7280; font-size: 14px; text-align: center;">
                Acesse seu painel para desbloquear o contato do cliente e fechar negócio!
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                Este e-mail foi enviado automaticamente pelo JF Festas.<br>
                Você recebeu porque está cadastrado como fornecedor.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // Send email via Resend
    const resend = new Resend(resendApiKey);
    
    const emailResponse = await resend.emails.send({
      from: 'JF Festas <onboarding@resend.dev>',
      to: [vendorProfile.email],
      subject: `🎉 Nova cotação de ${clientInfo.full_name}!`,
      html: emailHtml,
    });

    console.log('Email sent successfully:', emailResponse);

    return new Response(
      JSON.stringify({ success: true, messageId: emailResponse.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error in notify-vendor-quote:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
