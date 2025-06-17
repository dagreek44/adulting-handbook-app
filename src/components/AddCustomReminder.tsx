
import { useState } from 'react';
import { Plus, Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { SupabaseReminder, FamilyMember } from '@/hooks/useSupabaseData';

interface AddCustomReminderProps {
  familyMembers: FamilyMember[];
  supabaseOperations: {
    addReminder: (reminder: Partial<SupabaseReminder>) => Promise<void>;
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
    frequency: 'monthly',
    due_date: null,
    assignees: []
  });
  const [selectedDate, setSelectedDate] = useState<Date>();

  const addCustomReminder = async () => {
    if (!newReminder.title?.trim()) return;

    const customReminder: Partial<SupabaseReminder> = {
      title: newReminder.title || "",
      description: newReminder.description || "",
      frequency: newReminder.frequency || "monthly",
      enabled: true,
      is_custom: true,
      due_date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null,
      assignees: newReminder.assignees || [],
      difficulty: 'Easy',
      estimated_time: '30 min',
      estimated_budget: '$10-20',
      instructions: [],
      tools: [],
      supplies: []
    };

    await supabaseOperations.addReminder(customReminder);
    setNewReminder({ title: '', description: '', frequency: 'monthly', due_date: null, assignees: [] });
    setSelectedDate(undefined);
    setShowAddForm(false);
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
          
          {/* Date Picker */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Due Date (optional)</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
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
              className="bg-sage text-white px-4 py-2 rounded-lg hover:bg-sage/90 transition-colors"
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
