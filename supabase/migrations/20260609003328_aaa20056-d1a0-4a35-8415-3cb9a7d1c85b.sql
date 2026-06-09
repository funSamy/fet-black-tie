
-- Enums
CREATE TYPE public.ticket_tier AS ENUM ('CLASSIC','CLASSIC_COUPLE','VIP','VIP_COUPLE','TABLE_OF_5');
CREATE TYPE public.order_status AS ENUM ('PENDING','SUCCESSFUL','FAILED','EXPIRED');
CREATE TYPE public.message_status AS ENUM ('PENDING','APPROVED','DELETED');

-- Orders
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  external_id TEXT NOT NULL UNIQUE,
  fapshi_trans_id TEXT UNIQUE,
  fapshi_payment_link TEXT,
  buyer_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  tier public.ticket_tier NOT NULL,
  amount INTEGER NOT NULL,
  paid_amount INTEGER,
  revenue INTEGER,
  status public.order_status NOT NULL DEFAULT 'PENDING',
  medium TEXT,
  payer_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_email ON public.orders(user_email);
CREATE INDEX idx_orders_created ON public.orders(created_at DESC);
GRANT SELECT ON public.orders TO anon;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
-- Anyone with the order id can read it (used by confirmation polling). No public insert/update — server fns use service_role.
CREATE POLICY "Public can read orders by id" ON public.orders FOR SELECT USING (true);

-- Tickets
CREATE TABLE public.tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  qr_slug TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  slots_total INTEGER NOT NULL,
  slots_used INTEGER NOT NULL DEFAULT 0,
  is_fully_used BOOLEAN NOT NULL DEFAULT false,
  first_scan_at TIMESTAMPTZ,
  last_scan_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_tickets_order ON public.tickets(order_id);
CREATE INDEX idx_tickets_qr ON public.tickets(qr_slug);
GRANT SELECT ON public.tickets TO anon;
GRANT ALL ON public.tickets TO service_role;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read tickets" ON public.tickets FOR SELECT USING (true);

-- Anonymous messages
CREATE TABLE public.anonymous_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  status public.message_status NOT NULL DEFAULT 'PENDING',
  display_name TEXT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_messages_status ON public.anonymous_messages(status);
CREATE INDEX idx_messages_created ON public.anonymous_messages(created_at DESC);
GRANT SELECT ON public.anonymous_messages TO anon;
GRANT ALL ON public.anonymous_messages TO service_role;
ALTER TABLE public.anonymous_messages ENABLE ROW LEVEL SECURITY;
-- Only approved messages are publicly readable
CREATE POLICY "Public can read approved messages" ON public.anonymous_messages FOR SELECT USING (status = 'APPROVED');

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
