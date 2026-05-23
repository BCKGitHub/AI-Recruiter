/*
  # Create interviews table

  1. New Tables
    - `interviews`
      - `id` (uuid, primary key)
      - `candidate_name` (text) — name of the candidate
      - `candidate_email` (text) — email of the candidate
      - `job_description` (text) — pasted job description
      - `resume` (text) — pasted resume text
      - `zoom_url` (text) — Zoom meeting URL
      - `recall_bot_id` (text, nullable) — Recall.ai bot ID returned after creation
      - `status` (text) — interview status: 'Scheduled', 'In Progress', 'Completed'
      - `transcript` (jsonb, nullable) — array of transcript messages [{role, content, timestamp}]
      - `assessment` (jsonb, nullable) — Claude-generated assessment object
      - `created_at` (timestamptz) — creation timestamp

  2. Security
    - Enable RLS on `interviews` table
    - Add policy for anonymous access (public recruiter tool, no auth required per spec)

  3. Notes
    - transcript stored as JSONB array for flexible message structure
    - assessment stored as JSONB for structured Claude output
    - status defaults to 'Scheduled'
*/

CREATE TABLE IF NOT EXISTS interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_name text NOT NULL DEFAULT '',
  candidate_email text NOT NULL DEFAULT '',
  job_description text NOT NULL DEFAULT '',
  resume text NOT NULL DEFAULT '',
  zoom_url text NOT NULL DEFAULT '',
  recall_bot_id text,
  status text NOT NULL DEFAULT 'Scheduled',
  transcript jsonb,
  assessment jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to interviews"
  ON interviews FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert of interviews"
  ON interviews FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public update of interviews"
  ON interviews FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);
