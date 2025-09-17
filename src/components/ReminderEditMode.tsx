
import { useState, useEffect } from 'react';
import { Trash2, ToggleLeft, ToggleRight, X, Pencil, Save, Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { SupabaseReminder, FamilyMember } from '@/hooks/useSupabaseData';
import { GlobalReminder, useReminders } from '@/contexts/ReminderContext';
import ExpandableCategoryTree from './ExpandableCategoryTree';

interface ReminderEditModeProps {
  isEditMode: boolean;
  onExitEdit: () => void;
  allReminders: SupabaseReminder[];
  globalReminders: GlobalReminder[];
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
  globalReminders,
  familyMembers,
  supabaseOperations
}: ReminderEditModeProps) => {
  const { userTasks } = useReminders();
  
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
    console.log('ReminderEditMode: globalReminders =', globalReminders);
    console.log('ReminderEditMode: allReminders length =', allReminders.length);
    console.log('ReminderEditMode: globalReminders length =', globalReminders.length);
  }, [isEditMode, allReminders, globalReminders]);

  // Get reminder IDs that are already enabled for this user from userTasks
  const enabledReminderIds = userTasks
    .filter(task => task.reminder_id) // Only tasks that come from global reminders
    .map(task => task.reminder_id!)
    .filter(Boolean);

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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card p-4 rounded-xl shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">Edit Reminders</h3>
          <Button
            onClick={onExitEdit}
            variant="ghost"
            size="sm"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* Expandable Category Tree for Available Reminders */}
      {globalReminders.length === 0 ? (
        <div className="bg-card p-6 rounded-xl shadow-sm border text-center py-8">
          <p className="text-muted-foreground">No global reminders available to add.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Debug: Check console logs for data loading issues.
          </p>
        </div>
      ) : (
        <ExpandableCategoryTree 
          reminders={globalReminders}
          enabledReminderIds={enabledReminderIds}
          onToggleReminder={toggleReminder}
        />
      )}

      {/* Enabled User Tasks List for Editing */}
      <div className="bg-card p-6 rounded-xl shadow-sm border">
        <h3 className="text-xl font-bold mb-4">Your Active Reminders</h3>
        <p className="text-muted-foreground text-sm mb-6">
          Edit, disable, or delete your currently active reminders.
        </p>

        {allReminders.filter(r => r.enabled).length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No active reminders yet.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Enable reminders from the categories above to see them here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {allReminders
              .filter(reminder => reminder.enabled)
              .map((reminder) => (
                <div key={reminder.id} className="flex flex-col gap-2 bg-muted/20 p-4 rounded-lg border">
                  {(editId === reminder.id) ? (
                    <>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Reminder title"
                          value={editReminder.title}
                          onChange={e => setEditReminder(r => ({ ...r, title: e.target.value }))}
                          className="w-full p-2 border border-input rounded-lg bg-background"
                        />
                        <Button
                          onClick={saveEdit}
                          size="sm"
                          variant="default"
                        >
                          <Save className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => setEditId(null)}
                          size="sm"
                          variant="ghost"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <textarea
                        placeholder="Description (optional)"
                        value={editReminder.description}
                        onChange={e => setEditReminder(r => ({ ...r, description: e.target.value }))}
                        className="w-full p-2 border border-input rounded-lg bg-background h-16 resize-none"
                      />
                      <div className="flex gap-2">
                        <select
                          value={editReminder.frequency}
                          onChange={e => setEditReminder(r => ({ ...r, frequency: e.target.value }))}
                          className="w-40 p-2 border border-input rounded-lg bg-background"
                        >
                          {frequencies.map(f => (
                            <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>
                          ))}
                        </select>
                      </div>
                      
                      {/* Date Picker for Edit */}
                      <div>
                        <label className="block text-xs font-semibold text-foreground mb-1">Due Date (optional)</label>
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
                        <label className="block text-xs font-semibold text-foreground mb-1">Assign to</label>
                        <div className="flex flex-wrap gap-2">
                          {familyMembers.map(member => (
                            <label key={member.id} className="flex items-center space-x-1 bg-muted px-2 py-1 rounded">
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
                          <h4 className="font-medium text-foreground">{reminder.title}</h4>
                          {reminder.assignedToNames && reminder.assignedToNames.length > 0 && (
                            <span className="text-xs text-primary font-semibold ml-2">
                              {reminder.assignedToNames.join(', ')}
                            </span>
                          )}
                          {reminder.isPastDue && (
                            <span className="text-xs text-destructive font-semibold bg-destructive/10 px-2 py-1 rounded">
                              Past Due
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{reminder.frequency}</p>
                        {reminder.due_date && (
                          <p className="text-xs text-muted-foreground">Due: {format(new Date(reminder.due_date), "MMM d, yyyy")}</p>
                        )}
                        {reminder.description && (
                          <p className="text-xs text-foreground mt-1">{reminder.description}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={() => toggleReminder(reminder.id, reminder.enabled)}
                          variant="ghost"
                          size="sm"
                        >
                          {reminder.enabled ? <ToggleRight className="w-6 h-6 text-primary" /> : <ToggleLeft className="w-6 h-6 text-muted-foreground" />}
                        </Button>
                        {reminder.is_custom && (
                          <>
                            <Button
                              onClick={() => startEdit(reminder)}
                              variant="ghost"
                              size="sm"
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => deleteReminder(reminder.id)}
                              variant="ghost"
                              size="sm"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
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
        <div className="mt-6 p-3 bg-muted rounded text-xs text-muted-foreground">
          <strong>Debug Info:</strong> 
          {allReminders.length} total reminders loaded |
          {allReminders.filter(r => r.enabled).length} enabled |
          {allReminders.filter(r => r.is_custom).length} custom |
          {allReminders.filter(r => !r.is_custom).length} global
        </div>
      </div>
    </div>
  );
};

export default ReminderEditMode;
