-- Add category and subcategory columns to reminders table
ALTER TABLE public.reminders 
ADD COLUMN main_category text DEFAULT 'Household',
ADD COLUMN subcategory text DEFAULT 'General';

-- Update existing reminders with appropriate categories based on their titles and descriptions
UPDATE public.reminders SET 
  main_category = 'Household',
  subcategory = CASE 
    WHEN title ILIKE '%furnace%' OR title ILIKE '%hvac%' OR title ILIKE '%filter%' OR title ILIKE '%heat%' OR title ILIKE '%air%' THEN 'HVAC'
    WHEN title ILIKE '%plumb%' OR title ILIKE '%water%' OR title ILIKE '%drain%' OR title ILIKE '%pipe%' OR title ILIKE '%faucet%' OR title ILIKE '%toilet%' THEN 'Plumbing'
    WHEN title ILIKE '%electrical%' OR title ILIKE '%electric%' OR title ILIKE '%wire%' OR title ILIKE '%outlet%' OR title ILIKE '%circuit%' OR title ILIKE '%smoke detector%' THEN 'Electrical'
    WHEN title ILIKE '%roof%' OR title ILIKE '%gutter%' OR title ILIKE '%siding%' OR title ILIKE '%exterior%' OR title ILIKE '%window%' OR title ILIKE '%door%' OR title ILIKE '%deck%' OR title ILIKE '%fence%' THEN 'Exterior'
    WHEN title ILIKE '%lawn%' OR title ILIKE '%garden%' OR title ILIKE '%landscape%' OR title ILIKE '%yard%' OR title ILIKE '%sprinkler%' OR title ILIKE '%outdoor%' THEN 'Landscaping'
    WHEN title ILIKE '%appliance%' OR title ILIKE '%refrigerator%' OR title ILIKE '%dishwasher%' OR title ILIKE '%washer%' OR title ILIKE '%dryer%' OR title ILIKE '%oven%' THEN 'Appliances'
    WHEN title ILIKE '%clean%' OR title ILIKE '%vacuum%' OR title ILIKE '%dust%' OR title ILIKE '%mop%' THEN 'Cleaning'
    WHEN title ILIKE '%security%' OR title ILIKE '%alarm%' OR title ILIKE '%lock%' OR title ILIKE '%safe%' THEN 'Security'
    ELSE 'General'
  END;

-- Create indexes for better performance when filtering by categories
CREATE INDEX idx_reminders_main_category ON public.reminders(main_category);
CREATE INDEX idx_reminders_subcategory ON public.reminders(subcategory);
CREATE INDEX idx_reminders_categories ON public.reminders(main_category, subcategory);