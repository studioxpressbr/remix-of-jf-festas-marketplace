-- ============================================
-- Grupo 2: Gestão de Usuários - Soft Delete
-- ============================================

-- Add is_active column to profiles for soft-delete
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS deactivated_at timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS deactivated_by uuid;

-- ============================================
-- Grupo 3: Sistema de Créditos Bônus
-- ============================================

-- Add expires_at column to vendor_credits for bonus expiration
ALTER TABLE public.vendor_credits ADD COLUMN IF NOT EXISTS expires_at timestamptz;

-- Function to calculate vendor balance considering expired bonus credits
CREATE OR REPLACE FUNCTION public.get_vendor_available_balance(p_vendor_id uuid)
RETURNS integer
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance integer;
  v_expired_bonus integer;
BEGIN
  -- Get current balance from latest transaction
  SELECT COALESCE(balance_after, 0) INTO v_balance
  FROM public.vendor_credits
  WHERE vendor_id = p_vendor_id
  ORDER BY created_at DESC
  LIMIT 1;

  -- Calculate expired bonus credits that haven't been deducted yet
  SELECT COALESCE(SUM(amount), 0) INTO v_expired_bonus
  FROM public.vendor_credits
  WHERE vendor_id = p_vendor_id
    AND transaction_type = 'bonus'
    AND expires_at IS NOT NULL
    AND expires_at < now()
    AND NOT EXISTS (
      SELECT 1 FROM public.vendor_credits vc2
      WHERE vc2.vendor_id = p_vendor_id
        AND vc2.transaction_type = 'bonus_expiration'
        AND vc2.description LIKE '%' || public.vendor_credits.id::text || '%'
    );

  RETURN GREATEST(COALESCE(v_balance, 0) - COALESCE(v_expired_bonus, 0), 0);
END;
$$;

-- Function to get expiring bonus credits (within 10 days)
CREATE OR REPLACE FUNCTION public.get_expiring_bonus_credits(p_vendor_id uuid)
RETURNS TABLE(
  amount integer,
  expires_at timestamptz,
  days_remaining integer
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    vc.amount::integer,
    vc.expires_at,
    EXTRACT(DAY FROM (vc.expires_at - now()))::integer as days_remaining
  FROM public.vendor_credits vc
  WHERE vc.vendor_id = p_vendor_id
    AND vc.transaction_type = 'bonus'
    AND vc.expires_at IS NOT NULL
    AND vc.expires_at > now()
    AND NOT EXISTS (
      SELECT 1 FROM public.vendor_credits vc2
      WHERE vc2.vendor_id = p_vendor_id
        AND vc2.transaction_type = 'bonus_expiration'
        AND vc2.description LIKE '%' || vc.id::text || '%'
    )
  ORDER BY vc.expires_at ASC;
END;
$$;

-- ============================================
-- Grupo 4: Sistema de Mensagens Internas
-- ============================================

-- Table for admin message templates
CREATE TABLE IF NOT EXISTS public.admin_message_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  shortcut text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on admin_message_templates
ALTER TABLE public.admin_message_templates ENABLE ROW LEVEL SECURITY;

-- Only admins can manage templates
CREATE POLICY "Admins can manage message templates"
ON public.admin_message_templates
FOR ALL
USING (has_admin_role(auth.uid(), 'admin'::admin_role));

-- Table for user messages
CREATE TABLE IF NOT EXISTS public.user_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_id uuid,
  subject text NOT NULL,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_messages_recipient ON public.user_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_user_messages_unread ON public.user_messages(recipient_id) WHERE is_read = false;

-- Enable RLS on user_messages
ALTER TABLE public.user_messages ENABLE ROW LEVEL SECURITY;

-- Users can view their own messages
CREATE POLICY "Users can view their own messages"
ON public.user_messages
FOR SELECT
USING (auth.uid() = recipient_id);

-- Users can update (mark as read) their own messages
CREATE POLICY "Users can update their own messages"
ON public.user_messages
FOR UPDATE
USING (auth.uid() = recipient_id);

-- Admins can insert messages to anyone
CREATE POLICY "Admins can insert messages"
ON public.user_messages
FOR INSERT
WITH CHECK (has_admin_role(auth.uid(), 'admin'::admin_role));

-- Admins can view all messages
CREATE POLICY "Admins can view all messages"
ON public.user_messages
FOR SELECT
USING (has_admin_role(auth.uid(), 'admin'::admin_role));

-- Insert default message templates
INSERT INTO public.admin_message_templates (title, content, shortcut)
VALUES 
  ('Completar Cadastro', 'Olá! Notamos que seu cadastro está incompleto. Complete suas informações para aproveitar todos os recursos da plataforma.', '/lembrete1'),
  ('Plano Expirando', 'Seu plano está próximo da data de expiração. Renove agora para continuar aproveitando todos os benefícios.', '/lembrete2'),
  ('Responder Cotações', 'Você tem cotações pendentes! Responda rapidamente para não perder oportunidades de negócio.', '/lembrete3'),
  ('Atualizar Fotos', 'Fotos atualizadas ajudam a conquistar mais clientes. Que tal adicionar novas imagens ao seu perfil?', '/lembrete4'),
  ('Bônus de Créditos', 'Parabéns! Você ganhou créditos bônus. Use-os para liberar contatos de novos clientes.', '/lembrete5')
ON CONFLICT DO NOTHING;

-- Enable realtime for user_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_messages;