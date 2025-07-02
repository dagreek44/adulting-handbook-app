
import { supabase } from '@/integrations/supabase/client';

// Mock data for testing
const mockReminders = [
  {
    id: '1',
    reminder_id: 'mock-1',
    completed_date: null,
    enabled: true,
    due_date: '2024-01-15',
    frequency: 'monthly',
    reminder_type: 'maintenance',
    created_at: '2024-01-01T00:00:00Z',
    title: 'Change Air Filter',
    description: 'Replace HVAC air filter for better air quality',
    difficulty: 'Easy',
    estimated_time: '15 min',
    estimated_budget: '$10-20',
    video_url: null,
    instructions: ['Turn off HVAC system', 'Remove old filter', 'Insert new filter', 'Turn system back on'],
    tools: ['Screwdriver'],
    supplies: ['Air filter'],
    assignees: ['Family'],
    is_custom: false,
    updated_at: '2024-01-01T00:00:00Z',
    isPastDue: false,
    assignedToNames: ['Family']
  },
  {
    id: '2',
    reminder_id: 'mock-2',
    completed_date: null,
    enabled: true,
    due_date: '2024-01-20',
    frequency: 'weekly',
    reminder_type: 'cleaning',
    created_at: '2024-01-01T00:00:00Z',
    title: 'Clean Gutters',
    description: 'Remove debris from house gutters',
    difficulty: 'Medium',
    estimated_time: '2 hours',
    estimated_budget: '$0',
    video_url: null,
    instructions: ['Set up ladder safely', 'Remove debris by hand', 'Flush with water', 'Check for damage'],
    tools: ['Ladder', 'Gloves', 'Garden hose'],
    supplies: ['Trash bags'],
    assignees: ['Family'],
    is_custom: false,
    updated_at: '2024-01-01T00:00:00Z',
    isPastDue: false,
    assignedToNames: ['Family']
  }
];

export const getReminders = async () => {
  return mockReminders;
};
