-- Schedule daily check-due-reminders at 8 AM EST (1 PM UTC)
SELECT cron.schedule(
  'check-due-reminders-daily',
  '0 13 * * *',
  $$
  SELECT
    net.http_post(
        url:='https://dgwzmfgcuxtsrvcvahat.supabase.co/functions/v1/check-due-reminders',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnd3ptZmdjdXh0c3J2Y3ZhaGF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwMDM2NzIsImV4cCI6MjA2NTYxMjY3Mn0.nJ1QpeF8itnKLXr4Bfj63oB_lKxNR_TOSQmbPVQUuws"}'::jsonb,
        body:='{"time": "scheduled"}'::jsonb
    ) as request_id;
  $$
);