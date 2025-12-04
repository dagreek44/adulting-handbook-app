-- Create user_badges table to track earned badges and progress
CREATE TABLE public.user_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  family_id UUID NOT NULL,
  badge_key TEXT NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0,
  max_progress INTEGER NOT NULL DEFAULT 1,
  is_unlocked BOOLEAN NOT NULL DEFAULT false,
  unlocked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_key)
);

-- Enable RLS
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own badges"
ON public.user_badges
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can view family badges"
ON public.user_badges
FOR SELECT
USING (family_id IN (SELECT family_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert their own badges"
ON public.user_badges
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own badges"
ON public.user_badges
FOR UPDATE
USING (user_id = auth.uid());

-- Create function to update badge progress
CREATE OR REPLACE FUNCTION public.update_badge_progress(
  p_user_id UUID,
  p_family_id UUID,
  p_badge_key TEXT,
  p_progress INTEGER,
  p_max_progress INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_unlocked BOOLEAN;
BEGIN
  v_is_unlocked := p_progress >= p_max_progress;
  
  INSERT INTO user_badges (user_id, family_id, badge_key, progress, max_progress, is_unlocked, unlocked_at)
  VALUES (
    p_user_id, 
    p_family_id, 
    p_badge_key, 
    p_progress, 
    p_max_progress, 
    v_is_unlocked,
    CASE WHEN v_is_unlocked THEN now() ELSE NULL END
  )
  ON CONFLICT (user_id, badge_key) 
  DO UPDATE SET 
    progress = EXCLUDED.progress,
    max_progress = EXCLUDED.max_progress,
    is_unlocked = EXCLUDED.is_unlocked,
    unlocked_at = CASE 
      WHEN EXCLUDED.is_unlocked AND user_badges.unlocked_at IS NULL THEN now() 
      ELSE user_badges.unlocked_at 
    END,
    updated_at = now();
END;
$$;