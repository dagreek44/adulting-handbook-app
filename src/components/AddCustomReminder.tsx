
import { useState } from 'react';
import { Plus, Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { SupabaseReminder, FamilyMember } from '@/hooks/useSupabaseData';
import { supabase } from '@/integrations/supabase/client';

interface AddCustomReminderProps {
  familyMembers: FamilyMember[];
  supabaseOperations: {
    addReminder: (reminder: Partial<SupabaseReminder>) => Promise<void>;
    addUserTask: (userId: string, task: any) => Promise<void>;
  };
}

const frequencies = [
  "once",
  "weekly",
  "monthly",
  "quarterly",
  "seasonally",
  "yearly"
];

const AddCustomReminder = ({ familyMembers, supabaseOperations }: AddCustomReminderProps) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newReminder, setNewReminder] = useState<Partial<SupabaseReminder>>({
    title: '',
    description: '',
    frequency: 'once',
    due_date: null,
    assignees: []
  });
  const [selectedDate, setSelectedDate] = useState<Date>();

  const addCustomReminder = async () => {
    if (!newReminder.title?.trim() || !selectedDate) return;

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Convert frequency to days for user_tasks table
      const getFrequencyDays = (freq: string) => {
        switch (freq) {
          case 'weekly': return 7;
          case 'monthly': return 30;
          case 'quarterly': return 90;
          case 'seasonally': return 90;
          case 'yearly': return 365;
          default: return 0; // 'once'
        }
      };

      // Determine who to assign the task to
      const assignees = newReminder.assignees || [];
      
      // If assignees are selected, find their profile_ids from family members
      // Otherwise default to the current user
      const assigneeProfileIds = assignees.length > 0 
        ? familyMembers
            .filter(m => assignees.includes(m.id))
            .map(m => m.profile_id)
            .filter(Boolean) as string[]
        : [user.id];

      // Create a task for each assignee
      for (const assigneeId of assigneeProfileIds) {
        const customTask = {
          title: newReminder.title || "",
          description: newReminder.description || "",
          frequency_days: getFrequencyDays(newReminder.frequency || "once"),
          frequency: newReminder.frequency || "once",
          difficulty: 'Easy',
          estimated_time: '30 min',
          estimated_budget: '$10-20',
          instructions: [],
          tools: [],
          supplies: [],
          due_date: selectedDate.toISOString().split('T')[0],
        };

        await supabaseOperations.addUserTask(assigneeId, customTask);
      }
      
      setNewReminder({ title: '', description: '', frequency: 'once', due_date: null, assignees: [] });
      setSelectedDate(undefined);
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding custom reminder:', error);
    }
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-md">
      {showAddForm ? (
        <div className="bg-sage/10 p-4 rounded-lg space-y-3">
          <input
            type="text"
            placeholder="Reminder title"
            value={newReminder.title}
            onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-lg"
          />
          <textarea
            placeholder="Description (optional)"
            value={newReminder.description}
            onChange={(e) => setNewReminder({ ...newReminder, description: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-lg h-20 resize-none"
          />
          <select
            value={newReminder.frequency}
            onChange={e => setNewReminder({ ...newReminder, frequency: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-lg"
          >
            {frequencies.map(f => (
              <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>
            ))}
          </select>
          
          {/* Date Picker - now mandatory */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Due Date *</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground border-red-300"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date *</span>}
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

          {/* Assignee select */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Assign to</label>
            <div className="flex flex-wrap gap-2">
              {familyMembers.map(member => (
                <label key={member.id} className="flex items-center space-x-1 bg-gray-100 px-2 py-1 rounded">
                  <input
                    type="checkbox"
                    checked={!!(newReminder.assignees || []).includes(member.id)}
                    onChange={e => {
                      const current = newReminder.assignees || [];
                      setNewReminder({
                        ...newReminder,
                        assignees: e.target.checked
                          ? [...current, member.id]
                          : current.filter(id => id !== member.id)
                      });
                    }}
                  />
                  <span className="text-xs">{member.name}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={addCustomReminder}
              disabled={!newReminder.title?.trim() || !selectedDate}
              className="bg-sage text-white px-4 py-2 rounded-lg hover:bg-sage/90 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Add Reminder
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full bg-sage text-white py-3 rounded-lg font-medium hover:bg-sage/90 transition-colors flex items-center justify-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Custom Reminder
        </button>
      )}
    </div>
  );
};

export default AddCustomReminder;
