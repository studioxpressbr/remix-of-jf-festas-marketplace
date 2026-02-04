import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MessageRequest {
  recipientId?: string;
  recipientIds?: string[];
  allVendors?: boolean;
  allClients?: boolean;
  subject: string;
  content: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Verify admin role using user's token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with user's token to verify admin role
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

    // Check if user is admin
    const { data: isAdmin } = await supabaseUser.rpc('has_admin_role', {
      _user_id: user.id,
      _role: 'admin',
    });

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Acesso negado. Apenas administradores podem enviar mensagens.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body: MessageRequest = await req.json();
    const { recipientId, recipientIds, allVendors, allClients, subject, content } = body;

    if (!subject || !content) {
      return new Response(
        JSON.stringify({ error: 'Assunto e conteúdo são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create admin client for operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    let recipients: string[] = [];

    if (recipientId) {
      recipients = [recipientId];
    } else if (recipientIds && recipientIds.length > 0) {
      recipients = recipientIds;
    } else if (allVendors || allClients) {
      // Build query based on target audience
      let query = supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('is_active', true);

      if (allVendors && !allClients) {
        query = query.eq('role', 'vendor');
      } else if (allClients && !allVendors) {
        query = query.eq('role', 'client');
      }
      // If both are true, select all users

      const { data: profiles, error } = await query;
      if (error) throw error;
      recipients = profiles?.map(p => p.id) || [];
    }

    if (recipients.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Nenhum destinatário selecionado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert messages for all recipients
    const messages = recipients.map(rid => ({
      recipient_id: rid,
      sender_id: user.id,
      subject,
      content,
      is_read: false,
    }));

    const { error: insertError, data: insertedMessages } = await supabaseAdmin
      .from('user_messages')
      .insert(messages)
      .select();

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({
        success: true,
        message: `Mensagem enviada para ${recipients.length} usuário(s)`,
        count: recipients.length,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
