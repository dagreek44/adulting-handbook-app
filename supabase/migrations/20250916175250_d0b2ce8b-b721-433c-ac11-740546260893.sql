-- Add new reminder categories beyond household
-- Finance & Legal reminders
INSERT INTO public.reminders (title, description, frequency, difficulty, estimated_time, estimated_budget, main_category, subcategory, is_custom) VALUES
('Review bank statements & credit card statements', 'Check for errors, fraud, and track spending patterns', 'monthly', 'Easy', '30 min', '$0', 'Finance & Legal', 'Banking', false),
('Set up / review auto-payments for recurring bills', 'Ensure bills are paid on time and amounts are correct', 'quarterly', 'Medium', '1 hour', '$0', 'Finance & Legal', 'Banking', false),
('File taxes & gather documents', 'Prepare and file annual tax returns', 'yearly', 'Hard', '8 hours', '$200-500', 'Finance & Legal', 'Tax & Legal', false),
('Review/renew insurance policies', 'Review home, auto, health insurance coverage and rates', 'yearly', 'Medium', '2 hours', '$0', 'Finance & Legal', 'Insurance', false),
('Check beneficiaries on retirement accounts', 'Verify and update beneficiaries on investment accounts', 'yearly', 'Easy', '1 hour', '$0', 'Finance & Legal', 'Tax & Legal', false),
('Budget quarterly review', 'Re-assess income, expenses, and savings goals', 'quarterly', 'Medium', '2 hours', '$0', 'Finance & Legal', 'Budgeting & Goals', false),
('Set / review financial goals', 'Establish and review annual financial objectives', 'yearly', 'Medium', '2 hours', '$0', 'Finance & Legal', 'Budgeting & Goals', false),
('Organize important documents', 'Update and store will, power of attorney, ID documents', 'yearly', 'Medium', '3 hours', '$0', 'Finance & Legal', 'Tax & Legal', false),

-- Health & Self-care reminders  
('Annual doctor checkup', 'Schedule and attend yearly physical examination', 'yearly', 'Easy', '2 hours', '$50-200', 'Health & Self-care', 'Medical', false),
('Annual dentist checkup', 'Schedule and attend dental cleaning and examination', 'yearly', 'Easy', '1 hour', '$100-300', 'Health & Self-care', 'Dental & Vision', false),
('Eye exam & prescription update', 'Check vision and update prescription if needed', 'yearly', 'Easy', '1 hour', '$100-200', 'Health & Self-care', 'Dental & Vision', false),
('Vaccinations & flu shots', 'Stay current on recommended vaccinations', 'yearly', 'Easy', '30 min', '$50-100', 'Health & Self-care', 'Medical', false),
('Skin check for moles', 'Self-examination or dermatologist visit for skin health', 'yearly', 'Easy', '30 min', '$150-300', 'Health & Self-care', 'Medical', false),
('Mental health check-in', 'Schedule therapy appointment or mental health assessment', 'quarterly', 'Medium', '1 hour', '$100-200', 'Health & Self-care', 'Mental Health', false),
('Review prescription refills', 'Check medication supplies and refill as needed', 'monthly', 'Easy', '15 min', '$20-100', 'Health & Self-care', 'Medical', false),
('Health insurance review', 'Check deductible status and claims annually', 'yearly', 'Medium', '1 hour', '$0', 'Health & Self-care', 'Insurance', false),

-- Life Admin & Personal Development reminders
('Renew driver license / passport', 'Check expiration dates and renew as needed', 'yearly', 'Easy', '2 hours', '$50-200', 'Life Admin & Personal Development', 'Licenses & Documents', false),
('Voting registration check', 'Verify registration status before elections', 'yearly', 'Easy', '15 min', '$0', 'Life Admin & Personal Development', 'Civic Duties', false),
('Review subscriptions & streaming services', 'Cancel unused subscriptions and optimize spending', 'quarterly', 'Easy', '1 hour', '$0', 'Life Admin & Personal Development', 'Financial Management', false),
('Update resume / LinkedIn', 'Keep professional profiles current and relevant', 'yearly', 'Medium', '3 hours', '$0', 'Life Admin & Personal Development', 'Career Development', false),
('Set personal goals', 'Establish and review yearly personal objectives', 'yearly', 'Medium', '2 hours', '$0', 'Life Admin & Personal Development', 'Personal Growth', false),
('Car maintenance check', 'Oil change, tire rotation, and general maintenance', 'quarterly', 'Medium', '2 hours', '$100-300', 'Life Admin & Personal Development', 'Vehicle Care', false),
('Emergency kit check', 'Check flashlights, batteries, food/water supplies', 'yearly', 'Easy', '1 hour', '$50-100', 'Life Admin & Personal Development', 'Emergency Preparedness', false),
('Backup digital data', 'Review passwords and backup important files', 'quarterly', 'Medium', '2 hours', '$0', 'Life Admin & Personal Development', 'Technology', false),

-- Vehicle / Transportation reminders
('Vehicle oil change', 'Regular oil change based on mileage or time', 'quarterly', 'Easy', '1 hour', '$50-100', 'Vehicle / Transportation', 'Maintenance', false),
('Tire pressure & rotation check', 'Check tire pressure and rotate tires', 'quarterly', 'Easy', '30 min', '$50-100', 'Vehicle / Transportation', 'Maintenance', false),
('Car insurance & registration renewal', 'Renew car insurance and registration annually', 'yearly', 'Easy', '1 hour', '$500-1500', 'Vehicle / Transportation', 'Insurance & Registration', false),
('Check brakes & lights', 'Inspect brake pads and all vehicle lights', 'yearly', 'Medium', '1 hour', '$100-500', 'Vehicle / Transportation', 'Safety', false),
('Update emergency roadside contacts', 'Keep emergency contact list current in vehicle', 'yearly', 'Easy', '15 min', '$0', 'Vehicle / Transportation', 'Safety', false),
('Service windshield wipers', 'Clean or replace windshield wipers seasonally', 'yearly', 'Easy', '15 min', '$20-50', 'Vehicle / Transportation', 'Maintenance', false),

-- Family / Shared Responsibilities reminders
('Check shared bills & group expenses', 'Review and reconcile shared household expenses', 'monthly', 'Easy', '30 min', '$0', 'Family / Shared Responsibilities', 'Financial Planning', false),
('Schedule family health checkups', 'Coordinate health appointments for family members', 'yearly', 'Medium', '2 hours', '$200-500', 'Family / Shared Responsibilities', 'Health Management', false),
('Review household inventory', 'Update insurance inventory of tools and valuables', 'yearly', 'Medium', '3 hours', '$0', 'Family / Shared Responsibilities', 'Household Management', false),
('Plan holidays & travel', 'Book flights, hotels, and plan family trips', 'yearly', 'Medium', '4 hours', '$1000-5000', 'Family / Shared Responsibilities', 'Travel Planning', false),
('Update family emergency plans', 'Review and update emergency contact and evacuation plans', 'yearly', 'Medium', '2 hours', '$0', 'Family / Shared Responsibilities', 'Emergency Planning', false),
('Rotate household chores', 'Redistribute household tasks evenly among family', 'quarterly', 'Easy', '30 min', '$0', 'Family / Shared Responsibilities', 'Household Management', false);

-- Update existing household reminders to have better subcategories
UPDATE public.reminders SET 
  subcategory = 'Kitchen'
WHERE title ILIKE '%fridge%' OR title ILIKE '%freezer%';

UPDATE public.reminders SET 
  subcategory = 'Water Systems'  
WHERE title ILIKE '%water heater%' OR title ILIKE '%flush%';

UPDATE public.reminders SET 
  subcategory = 'Fire Safety'
WHERE title ILIKE '%dryer vent%' OR title ILIKE '%fire%';

UPDATE public.reminders SET 
  subcategory = 'Seasonal Maintenance'
WHERE title ILIKE '%winterize%' OR title ILIKE '%summerize%';

UPDATE public.reminders SET 
  subcategory = 'Pest Control'
WHERE title ILIKE '%pest%';

UPDATE public.reminders SET 
  subcategory = 'Structural'
WHERE title ILIKE '%chimney%';