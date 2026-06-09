-- 1. Admin role enum + user_roles table
CREATE TYPE public.app_role AS ENUM ('admin', 'scanner');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 2. SECURITY DEFINER role check (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 3. Atomic slot-burn for door scanner.
-- Returns the updated ticket row (or empty when slug is unknown / fully used).
CREATE OR REPLACE FUNCTION public.burn_ticket_slot(_qr_slug text)
RETURNS TABLE (
  ticket_id uuid,
  order_id uuid,
  slots_total int,
  slots_used int,
  is_fully_used boolean,
  buyer_name text,
  tier order_status,  -- placeholder; replaced below
  order_paid boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _t public.tickets%ROWTYPE;
  _o public.orders%ROWTYPE;
BEGIN
  -- Lock the ticket row
  SELECT * INTO _t FROM public.tickets WHERE qr_slug = _qr_slug FOR UPDATE;
  IF NOT FOUND THEN RETURN; END IF;

  SELECT * INTO _o FROM public.orders WHERE id = _t.order_id;
  IF _o.status <> 'SUCCESSFUL' THEN
    -- Order not paid: return row with order_paid=false, no burn
    ticket_id := _t.id;
    order_id := _t.order_id;
    slots_total := _t.slots_total;
    slots_used := _t.slots_used;
    is_fully_used := _t.is_fully_used;
    buyer_name := _o.buyer_name;
    tier := _o.status;
    order_paid := false;
    RETURN NEXT;
    RETURN;
  END IF;

  IF _t.is_fully_used THEN
    ticket_id := _t.id;
    order_id := _t.order_id;
    slots_total := _t.slots_total;
    slots_used := _t.slots_used;
    is_fully_used := true;
    buyer_name := _o.buyer_name;
    tier := _o.status;
    order_paid := true;
    RETURN NEXT;
    RETURN;
  END IF;

  UPDATE public.tickets
  SET slots_used = slots_used + 1,
      is_fully_used = (slots_used + 1 >= slots_total),
      first_scan_at = COALESCE(first_scan_at, now()),
      last_scan_at = now()
  WHERE id = _t.id
  RETURNING * INTO _t;

  ticket_id := _t.id;
  order_id := _t.order_id;
  slots_total := _t.slots_total;
  slots_used := _t.slots_used;
  is_fully_used := _t.is_fully_used;
  buyer_name := _o.buyer_name;
  tier := _o.status;
  order_paid := true;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.burn_ticket_slot(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.burn_ticket_slot(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;