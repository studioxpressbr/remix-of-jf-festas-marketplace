import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create user client to get authenticated user
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { quoteId } = await req.json();
    if (!quoteId) {
      return new Response(JSON.stringify({ error: 'quoteId é obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use service role to fetch quote data
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: quote, error: quoteError } = await supabaseAdmin
      .from('quotes')
      .select('client_id, vendor_id, contract_url')
      .eq('id', quoteId)
      .single();

    if (quoteError || !quote) {
      return new Response(JSON.stringify({ error: 'Proposta não encontrada' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate access: user must be client or vendor of this quote
    if (user.id !== quote.client_id && user.id !== quote.vendor_id) {
      return new Response(JSON.stringify({ error: 'Sem permissão' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!quote.contract_url) {
      return new Response(JSON.stringify({ error: 'Contrato não encontrado' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract file path from the public URL
    const url = new URL(quote.contract_url);
    const pathParts = url.pathname.split('/object/public/vendor-contracts/');
    const filePath = pathParts.length > 1 ? decodeURIComponent(pathParts[1]) : null;

    if (!filePath) {
      return new Response(JSON.stringify({ error: 'Caminho do arquivo inválido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Download file using service role
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from('vendor-contracts')
      .download(filePath);

    if (downloadError || !fileData) {
      console.error('Download error:', downloadError);
      return new Response(JSON.stringify({ error: 'Erro ao baixar arquivo' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Determine filename and content type
    const fileName = filePath.split('/').pop() || 'contrato';
    const ext = fileName.split('.').pop()?.toLowerCase();
    let contentType = 'application/octet-stream';
    if (ext === 'pdf') contentType = 'application/pdf';
    else if (ext === 'doc') contentType = 'application/msword';
    else if (ext === 'docx') contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    return new Response(fileData, {
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
