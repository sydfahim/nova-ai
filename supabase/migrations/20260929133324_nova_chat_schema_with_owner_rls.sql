DO $$
BEGIN
  IF to_regclass('public.messages') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'messages'
         AND column_name = 'thread_id'
     ) THEN
    IF to_regclass('public.legacy_phase2_messages') IS NOT NULL THEN
      RAISE EXCEPTION 'Cannot preserve legacy messages: public.legacy_phase2_messages already exists';
    END IF;
    ALTER TABLE public.messages RENAME TO legacy_phase2_messages;
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New chat',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  parts JSONB NOT NULL DEFAULT '[]'::jsonb,
  client_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS messages_thread_created_idx
  ON public.messages (thread_id, created_at);
CREATE UNIQUE INDEX IF NOT EXISTS messages_thread_client_id_idx
  ON public.messages (thread_id, client_id)
  WHERE client_id IS NOT NULL;

ALTER TABLE public.threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.threads, public.messages FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.threads, public.messages TO authenticated;
GRANT ALL ON TABLE public.threads, public.messages TO service_role;

DROP POLICY IF EXISTS "Users manage own threads" ON public.threads;
CREATE POLICY "Users manage own threads"
  ON public.threads FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users manage own messages" ON public.messages;
DROP POLICY IF EXISTS "Users read own thread messages" ON public.messages;
DROP POLICY IF EXISTS "Users insert own thread messages" ON public.messages;
DROP POLICY IF EXISTS "Users update own thread messages" ON public.messages;
DROP POLICY IF EXISTS "Users delete own thread messages" ON public.messages;

CREATE POLICY "Users read own thread messages"
  ON public.messages FOR SELECT TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.threads
      WHERE threads.id = messages.thread_id
        AND threads.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users insert own thread messages"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.threads
      WHERE threads.id = messages.thread_id
        AND threads.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users update own thread messages"
  ON public.messages FOR UPDATE TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.threads
      WHERE threads.id = messages.thread_id
        AND threads.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.threads
      WHERE threads.id = messages.thread_id
        AND threads.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users delete own thread messages"
  ON public.messages FOR DELETE TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.threads
      WHERE threads.id = messages.thread_id
        AND threads.user_id = (SELECT auth.uid())
    )
  );

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_threads_updated_at ON public.threads;
CREATE TRIGGER update_threads_updated_at
  BEFORE UPDATE ON public.threads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
