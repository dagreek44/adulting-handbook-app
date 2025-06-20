
import { useState, useEffect } from 'react';
import { Trash2, ToggleLeft, ToggleRight, X, Pencil, Save, Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { SupabaseReminder, FamilyMember } from '@/hooks/useSupabaseData';

interface ReminderEditModeProps {
  isEditMode: boolean;
  onExitEdit: () => void;
  allReminders: SupabaseReminder[];
  familyMembers: FamilyMember[];
  supabaseOperations: {
    addReminder: (reminder: Partial<SupabaseReminder>) => Promise<void>;
    updateReminder: (id: string, updates: Partial<SupabaseReminder>) => Promise<void>;
    deleteReminder: (id: string) => Promise<void>;
    toggleReminderEnabled: (id: string, enabled: boolean) => Promise<void>;
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

const ReminderEditMode = ({
  isEditMode,
  onExitEdit,
  allReminders,
  familyMembers,
  supabaseOperations
}: ReminderEditModeProps) => {
  const [editId, setEditId] = useState<string | null>(null);
  const [editReminder, setEditReminder] = useState<Partial<SupabaseReminder>>({
    title: '',
    description: '',
    frequency: 'monthly',
    due_date: null,
    assignees: []
  });
  const [editSelectedDate, setEditSelectedDate] = useState<Date>();

  // Debug logging
  useEffect(() => {
    console.log('ReminderEditMode: isEditMode =', isEditMode);
    console.log('ReminderEditMode: allReminders =', allReminders);
    console.log('ReminderEditMode: allReminders length =', allReminders.length);
  }, [isEditMode, allReminders]);

  const toggleReminder = async (id: string, currentEnabled: boolean) => {
    console.log('ReminderEditMode: Toggling reminder', id, 'from', currentEnabled, 'to', !currentEnabled);
    await supabaseOperations.toggleReminderEnabled(id, !currentEnabled);
  };

  const deleteReminder = async (id: string) => {
    console.log('ReminderEditMode: Deleting reminder', id);
    await supabaseOperations.deleteReminder(id);
  };

  const startEdit = (reminder: SupabaseReminder) => {
    console.log('ReminderEditMode: Starting edit for reminder', reminder.id);
    setEditId(reminder.id);
    setEditReminder({ ...reminder });
    if (reminder.due_date) {
      setEditSelectedDate(new Date(reminder.due_date));
    } else {
      setEditSelectedDate(undefined);
    }
  };

  const saveEdit = async () => {
    if (!editReminder.title?.trim() || !editId) return;
    
    console.log('ReminderEditMode: Saving edit for reminder', editId);
    const updates = {
      ...editReminder,
      due_date: editSelectedDate ? format(editSelectedDate, 'yyyy-MM-dd') : null
    };
    
    await supabaseOperations.updateReminder(editId, updates);
    setEditId(null);
    setEditReminder({ title: '', description: '', frequency: 'monthly', due_date: null, assignees: [] });
    setEditSelectedDate(undefined);
  };

  if (!isEditMode) return null;

  return (
    <div className="bg-white p-4 rounded-xl shadow-md mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-800">Edit Reminders</h3>
        <button
          onClick={onExitEdit}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {allReminders.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No reminders available to edit.</p>
          <p className="text-sm text-gray-400 mt-2">
            Debug: Check console logs for data loading issues.
          </p>
        </div>
      ) : (
        <div className="space-y-3 mb-4">
          {allReminders.map((reminder) => (
            <div key={reminder.id} className="flex flex-col gap-2 bg-gray-50 p-3 rounded-lg">
              {(editId === reminder.id) ? (
                <>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Reminder title"
                      value={editReminder.title}
                      onChange={e => setEditReminder(r => ({ ...r, title: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    />
                    <button
                      onClick={saveEdit}
                      className="text-sage hover:text-sage/90"
                    >
                      <Save className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setEditId(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <textarea
                    placeholder="Description (optional)"
                    value={editReminder.description}
                    onChange={e => setEditReminder(r => ({ ...r, description: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-lg h-16 resize-none mt-1"
                  />
                  <div className="flex gap-2 mt-1">
                    <select
                      value={editReminder.frequency}
                      onChange={e => setEditReminder(r => ({ ...r, frequency: e.target.value }))}
                      className="w-40 p-2 border border-gray-300 rounded-lg"
                    >
                      {frequencies.map(f => (
                        <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Date Picker for Edit */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Due Date (optional)</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !editSelectedDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {editSelectedDate ? format(editSelectedDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={editSelectedDate}
                          onSelect={setEditSelectedDate}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Assignee Select */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Assign to</label>
                    <div className="flex flex-wrap gap-2">
                      {familyMembers.map(member => (
                        <label key={member.id} className="flex items-center space-x-1 bg-gray-100 px-2 py-1 rounded">
                          <input
                            type="checkbox"
                            checked={!!(editReminder.assignees || []).includes(member.id)}
                            onChange={e => {
                              setEditReminder(r => {
                                const current = r.assignees || [];
                                return {
                                  ...r,
                                  assignees: e.target.checked
                                    ? [...current, member.id]
                                    : current.filter(id => id !== member.id)
                                }
                              });
                            }}
                          />
                          <span className="text-xs">{member.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-800">{reminder.title}</h4>
                      {reminder.assignedToNames && reminder.assignedToNames.length > 0 && (
                        <span className="text-xs text-sage font-semibold ml-2">
                          {reminder.assignedToNames.join(', ')}
                        </span>
                      )}
                      {reminder.isPastDue && (
                        <span className="text-xs text-red-500 font-semibold bg-red-100 px-2 py-1 rounded">
                          Past Due
                        </span>
                      )}
                      {/* Debug info */}
                      <span className="text-xs text-gray-400 ml-2">
                        {reminder.is_custom ? 'Custom' : 'Global'} | 
                        {reminder.enabled ? ' Enabled' : ' Disabled'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{reminder.frequency}</p>
                    {reminder.due_date && (
                      <p className="text-xs text-gray-500">Due: {format(new Date(reminder.due_date), "MMM d, yyyy")}</p>
                    )}
                    {reminder.description && (
                      <p className="text-xs text-gray-700 mt-1">{reminder.description}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleReminder(reminder.id, reminder.enabled)}
                      className={`transition-colors ${reminder.enabled ? 'text-sage' : 'text-gray-400'}`}
                    >
                      {reminder.enabled ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                    </button>
                    {reminder.is_custom && (
                      <>
                        <button
                          onClick={() => startEdit(reminder)}
                          className="text-sage hover:text-sage/90"
                          title="Edit"
                        >
                          <Pencil className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => deleteReminder(reminder.id)}
                          className="text-red-500 hover:text-red-700"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Debug information */}
      <div className="mt-4 p-2 bg-gray-100 rounded text-xs text-gray-600">
        <strong>Debug Info:</strong> 
        {allReminders.length} total reminders loaded |
        {allReminders.filter(r => r.enabled).length} enabled |
        {allReminders.filter(r => r.is_custom).length} custom |
        {allReminders.filter(r => !r.is_custom).length} global
      </div>
    </div>
  );
};

export default ReminderEditMode;
