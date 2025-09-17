-- Update comprehensive reminder data with estimated budgets, instructions, video URLs, and other details
-- Based on 2024-2025 research data for realistic costs and information

-- HVAC reminders
UPDATE reminders SET 
  estimated_budget = '$150-300', 
  estimated_time = '2-3 hours',
  instructions = ARRAY[
    'Turn off power to HVAC system at circuit breaker',
    'Remove access panels carefully',
    'Inspect and clean evaporator and condenser coils',
    'Check refrigerant lines for leaks or damage',
    'Clean or replace air filter',
    'Test system operation and airflow',
    'Replace access panels and restore power'
  ],
  video_url = 'https://www.youtube.com/watch?v=F7d4Ay2bKPE',
  supplies = jsonb_build_array('HVAC coil cleaner', 'New air filter', 'Cleaning cloths', 'Flashlight'),
  tools = jsonb_build_array('Screwdriver set', 'Vacuum cleaner', 'Garden hose', 'Safety glasses')
WHERE title ILIKE '%hvac%service%';

UPDATE reminders SET 
  estimated_budget = '$25-50', 
  estimated_time = '15 minutes',
  instructions = ARRAY[
    'Locate your HVAC system air filter',
    'Check filter size printed on the frame',
    'Remove old filter carefully to avoid spreading dust',
    'Insert new filter with airflow arrow pointing toward unit',
    'Ensure filter fits snugly in the slot'
  ],
  video_url = 'https://www.youtube.com/watch?v=hXpiqj-w4Zg',
  supplies = jsonb_build_array('Replacement air filter (correct size)', 'Trash bag'),
  tools = jsonb_build_array('None required')
WHERE title ILIKE '%air%filter%';

-- Appliance reminders
UPDATE reminders SET 
  estimated_budget = '$0-15', 
  estimated_time = '45 minutes',
  instructions = ARRAY[
    'Remove all food items and shelves',
    'Mix baking soda with warm water for cleaning solution',
    'Wipe down all interior surfaces and shelves',
    'Clean door seals and gaskets thoroughly',
    'Vacuum coils at the back or bottom',
    'Replace items and check expiration dates'
  ],
  video_url = 'https://www.youtube.com/watch?v=68f_jnxlNYg',
  supplies = jsonb_build_array('Baking soda', 'Dish soap', 'Microfiber cloths', 'All-purpose cleaner'),
  tools = jsonb_build_array('Vacuum cleaner', 'Cleaning cloths', 'Bucket')
WHERE title ILIKE '%refrigerator%clean%' OR title ILIKE '%fridge%clean%';

-- Plumbing reminders  
UPDATE reminders SET 
  estimated_budget = '$0-25', 
  estimated_time = '30 minutes',
  instructions = ARRAY[
    'Turn off water supply to the area being inspected',
    'Check under sinks for signs of moisture or drips',
    'Inspect visible pipes for corrosion or damage',
    'Test faucets and toilets for proper operation',
    'Look for water stains on walls or ceilings',
    'Check water pressure in showers and sinks'
  ],
  video_url = 'https://www.youtube.com/watch?v=VuVnqRMoKQs',
  supplies = jsonb_build_array('Flashlight', 'Towels', 'Notepad for tracking issues'),
  tools = jsonb_build_array('Flashlight', 'Wrench set', 'Pliers')
WHERE title ILIKE '%plumb%' AND title ILIKE '%check%';

-- Finance & Legal reminders
UPDATE reminders SET 
  estimated_budget = '$0-50', 
  estimated_time = '1-2 hours',
  instructions = ARRAY[
    'Gather all bank statements for the month',
    'Review each transaction for accuracy',
    'Compare credit card statements with receipts',
    'Look for unauthorized or suspicious charges',
    'Check for recurring subscriptions you may have forgotten',
    'Note any fees or interest charges',
    'Contact bank for any discrepancies found'
  ],
  video_url = 'https://www.youtube.com/watch?v=YjbGtK6D6NI',
  supplies = jsonb_build_array('Recent receipts', 'Highlighter', 'Calculator', 'Filing folders'),
  tools = jsonb_build_array('Computer or smartphone', 'Printer (optional)')
WHERE title ILIKE '%bank%statement%' OR title ILIKE '%credit%card%statement%';

UPDATE reminders SET 
  estimated_budget = '$300-2000', 
  estimated_time = '3-8 hours',
  instructions = ARRAY[
    'Gather all necessary tax documents (W-2s, 1099s, receipts)',
    'Choose between filing yourself or hiring a professional',
    'Select appropriate tax software or find a qualified preparer',
    'Organize deductions and ensure you have proper documentation',
    'Double-check all entries for accuracy',
    'File by the deadline or request an extension',
    'Keep copies of all documents for your records'
  ],
  video_url = 'https://www.youtube.com/watch?v=Va7YQj-m3i4',
  supplies = jsonb_build_array('Tax forms', 'Receipt organizer', 'Calculator', 'Filing system'),
  tools = jsonb_build_array('Computer', 'Scanner or smartphone app', 'Tax software')
WHERE title ILIKE '%tax%' AND title ILIKE '%file%';

UPDATE reminders SET 
  estimated_budget = '$0-200', 
  estimated_time = '2-4 hours',
  instructions = ARRAY[
    'Review current income and expenses from last quarter',
    'Calculate actual spending vs budgeted amounts',
    'Identify areas where spending exceeded budget',
    'Assess progress toward savings goals',
    'Adjust budget categories based on actual needs',
    'Set new financial goals for the next quarter',
    'Update automatic transfers to savings accounts'
  ],
  video_url = 'https://www.youtube.com/watch?v=sVKQn2R7MTk',
  supplies = jsonb_build_array('Financial statements', 'Budget spreadsheet', 'Calculator'),
  tools = jsonb_build_array('Computer or smartphone', 'Budgeting app or software')
WHERE title ILIKE '%budget%quarterly%';

-- Health & Self-care reminders
UPDATE reminders SET 
  estimated_budget = '$200-500', 
  estimated_time = '1-2 hours',
  instructions = ARRAY[
    'Schedule appointment 2-3 months in advance',
    'Prepare list of current medications and supplements',
    'Write down any health concerns or symptoms',
    'Bring insurance card and photo ID',
    'Fast if blood work is required (check with office)',
    'Discuss preventive screenings appropriate for your age',
    'Ask about recommended vaccines or boosters'
  ],
  video_url = 'https://www.youtube.com/watch?v=NW3s7NoWnlY',
  supplies = jsonb_build_array('Insurance card', 'Medication list', 'Health questions list'),
  tools = jsonb_build_array('Phone for scheduling', 'Calendar')
WHERE title ILIKE '%doctor%checkup%' OR title ILIKE '%annual%physical%';

UPDATE reminders SET 
  estimated_budget = '$150-400', 
  estimated_time = '1 hour',
  instructions = ARRAY[
    'Schedule cleaning and exam every 6 months',
    'Brush and floss thoroughly before appointment',
    'Bring list of any dental concerns or pain',
    'Inform dentist of any medications you take',
    'Discuss any changes in oral health routine',
    'Ask about recommended treatments or preventive care',
    'Schedule next appointment before leaving'
  ],
  video_url = 'https://www.youtube.com/watch?v=KaQUIkPHrqI',
  supplies = jsonb_build_array('Insurance card', 'Toothbrush', 'List of medications'),
  tools = jsonb_build_array('Phone for scheduling', 'Calendar')
WHERE title ILIKE '%dentist%checkup%' OR title ILIKE '%dental%cleaning%';

UPDATE reminders SET 
  estimated_budget = '$150-350', 
  estimated_time = '1 hour',
  instructions = ARRAY[
    'Schedule exam every 1-2 years or as recommended',
    'Bring current glasses or contacts to appointment',
    'List any vision changes or eye strain issues',
    'Prepare for pupil dilation (arrange transportation)',
    'Ask about protective eyewear for computer use',
    'Discuss family history of eye diseases',
    'Update prescription if needed'
  ],
  video_url = 'https://www.youtube.com/watch?v=vJsuWSE4-ks',
  supplies = jsonb_build_array('Current glasses/contacts', 'Insurance card', 'Sunglasses for after exam'),
  tools = jsonb_build_array('Phone for scheduling', 'Transportation arrangement')
WHERE title ILIKE '%eye%exam%';

-- Life Admin reminders
UPDATE reminders SET 
  estimated_budget = '$35-85', 
  estimated_time = '2-4 hours',
  instructions = ARRAY[
    'Check expiration date on current license',
    'Gather required documents (birth certificate, social security card)',
    'Complete application online if available in your state',
    'Schedule DMV appointment or visit in person',
    'Bring current license and required paperwork',
    'Pay renewal fee (check accepted payment methods)',
    'Take new photo if required'
  ],
  video_url = 'https://www.youtube.com/watch?v=hm6AmcJrqfE',
  supplies = jsonb_build_array('Birth certificate', 'Social security card', 'Proof of address'),
  tools = jsonb_build_array('Computer for online forms', 'Transportation to DMV')
WHERE title ILIKE '%driver%license%' OR title ILIKE '%passport%';

UPDATE reminders SET 
  estimated_budget = '$15-50', 
  estimated_time = '2 hours',
  instructions = ARRAY[
    'Review all current streaming and subscription services',
    'Check bank statements for recurring charges',
    'Evaluate usage of each service over past 3 months',
    'Cancel services you rarely use',
    'Consider downgrading plans if you use fewer features',
    'Look for annual payment discounts on kept services',
    'Set calendar reminder for next review'
  ],
  video_url = 'https://www.youtube.com/watch?v=4l8IBl-sdbs',
  supplies = jsonb_build_array('Bank statements', 'List of all subscriptions', 'Calculator'),
  tools = jsonb_build_array('Computer or smartphone', 'Access to all subscription accounts')
WHERE title ILIKE '%subscription%review%';

-- Vehicle maintenance reminders
UPDATE reminders SET 
  estimated_budget = '$50-120', 
  estimated_time = '30-60 minutes',
  instructions = ARRAY[
    'Check your vehicles manual for oil type and capacity',
    'Schedule service every 3,000-7,500 miles depending on oil type',
    'Drive to service center or prepare for DIY change',
    'Include oil filter replacement',
    'Check other fluids during service',
    'Reset oil life monitor if equipped',
    'Keep receipt for warranty purposes'
  ],
  video_url = 'https://www.youtube.com/watch?v=O1hF25Cowv8',
  supplies = jsonb_build_array('Correct oil type and amount', 'New oil filter', 'Drain pan (DIY)'),
  tools = jsonb_build_array('Wrench set', 'Funnel', 'Jack and stands (DIY)')
WHERE title ILIKE '%oil%change%';

UPDATE reminders SET 
  estimated_budget = '$80-200', 
  estimated_time = '1 hour',
  instructions = ARRAY[
    'Check tire pressure when tires are cold',
    'Inspect tires for uneven wear patterns',
    'Rotate tires according to manufacturers pattern',
    'Check alignment if steering pulls to one side',
    'Inspect tread depth with penny test',
    'Balance wheels if vibration is noticed',
    'Document tire rotation date and mileage'
  ],
  video_url = 'https://www.youtube.com/watch?v=btLMLvMzgb0',
  supplies = jsonb_build_array('Tire pressure gauge', 'Jack', 'Lug wrench'),
  tools = jsonb_build_array('Car jack', 'Lug wrench', 'Torque wrench')
WHERE title ILIKE '%tire%rotation%' OR title ILIKE '%tire%pressure%';

-- Family reminders
UPDATE reminders SET 
  estimated_budget = '$100-500', 
  estimated_time = '2-3 hours',
  instructions = ARRAY[
    'Review and split recurring household expenses',
    'Calculate each persons contribution to utilities',
    'Check shared credit card or account statements',
    'Discuss any large upcoming expenses',
    'Update budget based on income changes',
    'Set up or adjust automatic payments',
    'Plan for seasonal expense variations'
  ],
  video_url = 'https://www.youtube.com/watch?v=CdCBsCx9rtE',
  supplies = jsonb_build_array('Household bills', 'Calculator', 'Shared expense tracker'),
  tools = jsonb_build_array('Computer or smartphone', 'Banking app access')
WHERE title ILIKE '%shared%bill%' OR title ILIKE '%family%expense%';

-- Set due dates based on frequency patterns
UPDATE reminders SET due_date = CURRENT_DATE + INTERVAL '30 days' WHERE frequency = 'monthly' AND due_date IS NULL;
UPDATE reminders SET due_date = CURRENT_DATE + INTERVAL '90 days' WHERE frequency IN ('quarterly', 'seasonally') AND due_date IS NULL;
UPDATE reminders SET due_date = CURRENT_DATE + INTERVAL '365 days' WHERE frequency = 'yearly' AND due_date IS NULL;
UPDATE reminders SET due_date = CURRENT_DATE + INTERVAL '7 days' WHERE frequency = 'weekly' AND due_date IS NULL;