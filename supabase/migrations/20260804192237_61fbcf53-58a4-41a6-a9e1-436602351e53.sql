CREATE TABLE public.pos_sync (
  sync_code TEXT NOT NULL,
  store_key TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  device_id TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (sync_code, store_key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pos_sync TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pos_sync TO authenticated;
GRANT ALL ON public.pos_sync TO service_role;

ALTER TABLE public.pos_sync ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone with the sync code can read" ON public.pos_sync FOR SELECT USING (true);
CREATE POLICY "Anyone with the sync code can insert" ON public.pos_sync FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone with the sync code can update" ON public.pos_sync FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone with the sync code can delete" ON public.pos_sync FOR DELETE USING (true);

ALTER TABLE public.pos_sync REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pos_sync;