-- Create atomic function for credit usage to prevent race conditions
CREATE OR REPLACE FUNCTION public.use_credit_atomic(
  p_vendor_id uuid,
  p_quote_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_current_balance integer;
  v_new_balance integer;
BEGIN
  -- Lock the vendor's credits row to prevent concurrent modifications
  -- Get current balance with FOR UPDATE to lock
  SELECT COALESCE(
    (SELECT balance_after 
     FROM public.vendor_credits 
     WHERE vendor_id = p_vendor_id 
     ORDER BY created_at DESC 
     LIMIT 1
     FOR UPDATE),
    0
  ) INTO v_current_balance;

  -- Check if sufficient balance
  IF v_current_balance < 1 THEN
    RAISE EXCEPTION 'Saldo insuficiente. Compre créditos para liberar este contato.';
  END IF;

  -- Calculate new balance
  v_new_balance := v_current_balance - 1;

  -- Insert the deduction transaction
  INSERT INTO public.vendor_credits (
    vendor_id,
    amount,
    balance_after,
    transaction_type,
    description,
    quote_id
  ) VALUES (
    p_vendor_id,
    -1,
    v_new_balance,
    'lead_unlock',
    'Liberação de contato de cliente',
    p_quote_id
  );

  -- Grant lead access
  INSERT INTO public.leads_access (
    quote_id,
    vendor_id,
    payment_status,
    unlocked_at
  ) VALUES (
    p_quote_id,
    p_vendor_id,
    'paid',
    now()
  );

  RETURN jsonb_build_object('new_balance', v_new_balance);
END;
$$;

-- Add a constraint to prevent negative balances on future inserts
-- Using a trigger instead of CHECK constraint to allow flexibility
CREATE OR REPLACE FUNCTION public.check_credit_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.balance_after < 0 THEN
    RAISE EXCEPTION 'Balance cannot be negative';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_positive_balance ON public.vendor_credits;
CREATE TRIGGER enforce_positive_balance
  BEFORE INSERT OR UPDATE ON public.vendor_credits
  FOR EACH ROW
  EXECUTE FUNCTION public.check_credit_balance();