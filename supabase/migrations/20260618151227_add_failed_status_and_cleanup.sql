-- Mark interviews where the bot was dispatched but never produced a transcript as Failed.
-- These are sessions where status is stuck at 'In Progress' with no transcript content,
-- meaning the Recall.ai bot never joined or never spoke.
UPDATE interviews
SET status = 'Failed'
WHERE status = 'In Progress'
  AND (transcript IS NULL OR transcript = 'null'::jsonb OR transcript = '[]'::jsonb);
