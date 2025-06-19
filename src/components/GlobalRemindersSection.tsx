
import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, X, Plus } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from '@/integrations/supabase/client';
import { FamilyMember, GlobalReminder } from '@/hooks/useSupabaseData';

interface GlobalRemindersSectionProps {
  familyMembers: FamilyMember[];
  enableGlobalReminder?: (globalReminderId: string, dueDate?: string) => Promise<void>;
  onClose: () => void;
}

const GlobalRemindersSection = ({ familyMembers, enableGlobalReminder, onClose }: GlobalRemindersSectionProps) => {
  const [globalReminders, setGlobalReminders] = useState<GlobalReminder[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedReminder, setSelectedReminder] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchGlobalReminders = async () => {
      const { data, error } = await supabase
        .from('global_reminders')
        .select('*')
        .order('title', { ascending: true });

      if (error) {
        console.error('Error fetching global reminders:', error);
        return;
      }

      // Convert the data to match our GlobalReminder interface
      const convertedReminders: GlobalReminder[] = (data || []).map(row => ({
        id: row.id,
        title: row.title,
        description: row.description || '',
        frequency: row.frequency,
        difficulty: row.difficulty || 'Easy',
        estimated_time: row.estimated_time || '30 min',
        estimated_budget: row.estimated_budget || '',
        video_url: row.video_url,
        instructions: row.instructions || [],
        tools: Array.isArray(row.tools) ? row.tools : [],
        supplies: Array.isArray(row.supplies) ? row.supplies : [],
        created_at: row.created_at,
        updated_at: row.updated_at
      }));

      setGlobalReminders(convertedReminders);
    };

    fetchGlobalReminders();
  }, []);

  const handleEnableReminder = async (reminderId: string) => {
    if (!enableGlobalReminder) return;
    
    setLoading(true);
    try {
      const dueDate = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined;
      await enableGlobalReminder(reminderId, dueDate);
      onClose();
    } catch (error) {
      console.error('Error enabling reminder:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800">Standard Reminders</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="space-y-4">
        {globalReminders.map((reminder) => (
          <div
            key={reminder.id}
            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800">{reminder.title}</h4>
                <p className="text-sm text-gray-600 mb-2">{reminder.description}</p>
                <div className="flex items-center space-x-3 text-xs text-gray-500">
                  <span className="px-2 py-1 rounded-full bg-gray-100">
                    {reminder.difficulty}
                  </span>
                  <span>{reminder.estimated_time}</span>
                  <span>{reminder.frequency}</span>
                  {reminder.estimated_budget && (
                    <span>{reminder.estimated_budget}</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center space-x-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "MMM d") : "Set due date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <button
                onClick={() => handleEnableReminder(reminder.id)}
                disabled={loading}
                className="bg-sage text-white px-4 py-2 rounded-lg hover:bg-sage/90 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
              >
                <Plus className="w-4 h-4 mr-1" />
                Enable
              </button>
            </div>
          </div>
        ))}
        
        {globalReminders.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No standard reminders available.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobalRemindersSection;
