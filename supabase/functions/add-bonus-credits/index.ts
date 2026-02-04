import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BonusRequest {
  vendorId?: string;
  all?: boolean;
  amount: 5 | 10;
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
        JSON.stringify({ error: 'Acesso negado. Apenas administradores podem adicionar créditos bônus.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body: BonusRequest = await req.json();
    const { vendorId, all, amount } = body;

    if (amount !== 5 && amount !== 10) {
      return new Response(
        JSON.stringify({ error: 'Quantidade deve ser 5 ou 10 créditos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!vendorId && !all) {
      return new Response(
        JSON.stringify({ error: 'Forneça vendorId ou all=true' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create admin client for operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate expiration date (10 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 10);

    let affectedVendors: string[] = [];

    if (all) {
      // Get all active vendors
      const { data: vendors, error: vendorsError } = await supabaseAdmin
        .from('vendors')
        .select('profile_id')
        .eq('is_approved', true);

      if (vendorsError) throw vendorsError;
      affectedVendors = vendors?.map(v => v.profile_id) || [];
    } else if (vendorId) {
      affectedVendors = [vendorId];
    }

    // Add bonus credits to each vendor
    const results = await Promise.all(
      affectedVendors.map(async (vid) => {
        // Get current balance
        const { data: currentBalance } = await supabaseAdmin
          .rpc('get_vendor_balance', { p_vendor_id: vid });

        const newBalance = (currentBalance || 0) + amount;

        // Insert bonus credit transaction
        const { error: insertError } = await supabaseAdmin
          .from('vendor_credits')
          .insert({
            vendor_id: vid,
            amount: amount,
            balance_after: newBalance,
            transaction_type: 'bonus',
            description: `Bônus de ${amount} créditos adicionado pelo admin`,
            expires_at: expiresAt.toISOString(),
          });

        if (insertError) {
          console.error(`Error adding bonus to ${vid}:`, insertError);
          return { vendorId: vid, success: false, error: insertError.message };
        }

        return { vendorId: vid, success: true, newBalance };
      })
    );

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({
        success: true,
        message: `${amount} créditos bônus adicionados a ${successCount} fornecedor(es)${failCount > 0 ? `, ${failCount} falha(s)` : ''}`,
        details: results,
        expiresAt: expiresAt.toISOString(),
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
