
import { useState } from 'react';
import { Plus, Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { SupabaseReminder, FamilyMember } from '@/hooks/useSupabaseData';
import { supabase } from '@/integrations/supabase/client';
import { useReminders } from '@/contexts/ReminderContext';
import { toast } from 'sonner';
import { PushNotificationService } from '@/services/PushNotificationService';

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
  const { refreshTasks } = useReminders();

  const addCustomReminder = async () => {
    if (!newReminder.title?.trim() || !selectedDate) return;

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get user's family_id and profile info
      const [userData, profileData] = await Promise.all([
        supabase.from('users').select('family_id').eq('id', user.id).single(),
        supabase.from('profiles').select('first_name, last_name').eq('id', user.id).single()
      ]);

      if (userData.error) throw userData.error;
      if (!userData.data?.family_id) throw new Error('No family found');

      const creatorName = profileData.data?.first_name 
        ? `${profileData.data.first_name} ${profileData.data.last_name || ''}`.trim()
        : user.email?.split('@')[0] || 'A family member';

      // Determine who to assign the task to
      const assignees = newReminder.assignees || [];
      
      // If assignees are selected, find their profile_ids from family members
      // Otherwise default to the current user
      let assigneeProfileIds: string[] = [];
      
      if (assignees.length > 0) {
        // Get profile_ids for selected family members
        assigneeProfileIds = familyMembers
          .filter(m => assignees.includes(m.id))
          .map(m => m.profile_id)
          .filter(Boolean) as string[];
      }
      
      // Default to current user if no valid assignees
      if (assigneeProfileIds.length === 0) {
        assigneeProfileIds = [user.id];
      }

      const dueDate = selectedDate.toISOString().split('T')[0];

      // Create a task for each assignee directly in user_tasks table
      for (const assigneeId of assigneeProfileIds) {
        const { data: insertedTask, error: insertError } = await supabase
          .from('user_tasks')
          .insert({
            user_id: assigneeId,
            family_id: userData.data.family_id,
            title: newReminder.title || "",
            description: newReminder.description || "",
            frequency: newReminder.frequency || "once",
            due_date: dueDate,
            difficulty: 'Easy',
            instructions: [],
            tools: [],
            supplies: [],
            is_custom: true,
            reminder_type: 'custom',
            enabled: true,
            status: 'pending'
          })
          .select('id')
          .single();

        if (insertError) {
          console.error('Error inserting task:', insertError);
          throw insertError;
        }

        // Send push notification if task is assigned to someone other than creator
        if (assigneeId !== user.id && insertedTask?.id) {
          console.log('AddCustomReminder: Sending push notification to', assigneeId);
          await PushNotificationService.notifyReminderCreated(
            assigneeId,
            creatorName,
            newReminder.title || 'New reminder',
            insertedTask.id
          );
        }
      }
      
      // Refresh tasks to show the new ones
      await refreshTasks();
      
      toast.success('Custom reminder added successfully!');
      setNewReminder({ title: '', description: '', frequency: 'once', due_date: null, assignees: [] });
      setSelectedDate(undefined);
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding custom reminder:', error);
      toast.error('Failed to add custom reminder');
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
