CREATE TABLE public.report_subscriptions (
  sync_key text PRIMARY KEY,
  recipients text[] NOT NULL DEFAULT '{}',
  students jsonb NOT NULL DEFAULT '[]'::jsonb,
  attendance jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.report_subscriptions TO service_role;
ALTER TABLE public.report_subscriptions ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.report_subscriptions IS 'Teacher emails and a copy of attendance used for automatic report emails.';
ALTER TABLE public.report_subscriptions ADD COLUMN daily_recipients text[];