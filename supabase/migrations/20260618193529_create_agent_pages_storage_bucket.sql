-- Create public storage bucket for agent HTML pages
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('agent-pages', 'agent-pages', true, 1048576)
ON CONFLICT (id) DO NOTHING;

-- Public read access (Recall.ai's Chrome loads these without auth)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'agent_pages_public_read'
  ) THEN
    EXECUTE 'CREATE POLICY agent_pages_public_read ON storage.objects
      FOR SELECT TO public
      USING (bucket_id = ''agent-pages'')';
  END IF;
END $$;

-- Service role write access (edge function uploads HTML files)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'agent_pages_service_insert'
  ) THEN
    EXECUTE 'CREATE POLICY agent_pages_service_insert ON storage.objects
      FOR INSERT TO service_role
      WITH CHECK (bucket_id = ''agent-pages'')';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'agent_pages_service_update'
  ) THEN
    EXECUTE 'CREATE POLICY agent_pages_service_update ON storage.objects
      FOR UPDATE TO service_role
      USING (bucket_id = ''agent-pages'')';
  END IF;
END $$;
