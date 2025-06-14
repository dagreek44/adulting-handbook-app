import { useState } from 'react';
import { Plus, Trash2, ToggleLeft, ToggleRight, X, Pencil, Save } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";

interface FamilyMember {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Member';
}

interface Reminder {
  id: string;
  title: string;
  description: string;
  frequency: string;
  enabled: boolean;
  isCustom?: boolean;
  date?: Date | null;
  assignees?: string[]; // array of family member ids
}

interface ReminderEditModeProps {
  isEditMode: boolean;
  onExitEdit: () => void;
  reminders: Reminder[];
  onUpdateReminders: (reminders: Reminder[]) => void;
  familyMembers: FamilyMember[];
}

const frequencies = [
  "weekly",
  "monthly",
  "quarterly",
  "seasonally",
  "yearly"
];

// PATCH: allow assigning family members to all reminders, not just custom ones

const ReminderEditMode = ({
  isEditMode,
  onExitEdit,
  reminders,
  onUpdateReminders,
  familyMembers
}: ReminderEditModeProps) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [newReminder, setNewReminder] = useState<Partial<Reminder>>({
    title: '',
    description: '',
    frequency: 'monthly',
    date: null,
    assignees: []
  });
  const [editReminder, setEditReminder] = useState<Partial<Reminder>>({
    title: '',
    description: '',
    frequency: 'monthly',
    date: null,
    assignees: []
  });

  const toggleReminder = (id: string) => {
    const updatedReminders = reminders.map(reminder =>
      reminder.id === id ? { ...reminder, enabled: !reminder.enabled } : reminder
    );
    onUpdateReminders(updatedReminders);
  };

  const deleteReminder = (id: string) => {
    const updatedReminders = reminders.filter(reminder => reminder.id !== id);
    onUpdateReminders(updatedReminders);
  };

  const addCustomReminder = () => {
    if (!newReminder.title?.trim()) return;

    const customReminder: Reminder = {
      id: Date.now().toString(),
      title: newReminder.title || "",
      description: newReminder.description || "",
      frequency: newReminder.frequency || "monthly",
      enabled: true,
      isCustom: true,
      date: newReminder.date || null,
      assignees: newReminder.assignees || []
    };

    onUpdateReminders([...reminders, customReminder]);
    setNewReminder({ title: '', description: '', frequency: 'monthly', date: null, assignees: [] });
    setShowAddForm(false);
  };

  const startEdit = (reminder: Reminder) => {
    setEditId(reminder.id);
    setEditReminder({ ...reminder });
  };

  const saveEdit = () => {
    if (!editReminder.title?.trim()) return;
    onUpdateReminders(reminders.map(reminder =>
      reminder.id === editId ? { ...reminder, ...editReminder } : reminder
    ));
    setEditId(null);
    setEditReminder({ title: '', description: '', frequency: 'monthly', date: null, assignees: [] });
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

      <div className="space-y-3 mb-4">
        {reminders.map((reminder) => (
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
                  {/* Datepicker */}
                  <div className="flex items-center gap-1">
                    <Calendar
                      mode="single"
                      selected={editReminder.date || undefined}
                      onSelect={date => setEditReminder(r => ({ ...r, date }))}
                      className="rounded-md border p-2 pointer-events-auto min-w-[180px]"
                    />
                    {editReminder.date &&
                      <span className="text-xs text-gray-600 ml-2 mt-2">
                        {format(editReminder.date, "MMM d, yyyy")}
                      </span>
                    }
                  </div>
                </div>
                {/* Assignee Select: show for ALL reminders, not just custom */}
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
                    {reminder.assignees && reminder.assignees.length > 0 && (
                      <span className="text-xs text-sage font-semibold ml-2">
                        {reminder.assignees.map(id => familyMembers.find(m => m.id === id)?.name).filter(Boolean).join(', ')}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{reminder.frequency}</p>
                  {reminder.date && (
                    <p className="text-xs text-gray-500">Due: {format(reminder.date, "MMM d, yyyy")}</p>
                  )}
                  {reminder.description && (
                    <p className="text-xs text-gray-700 mt-1">{reminder.description}</p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleReminder(reminder.id)}
                    className={`transition-colors ${reminder.enabled ? 'text-sage' : 'text-gray-400'}`}
                  >
                    {reminder.enabled ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                  </button>
                  {reminder.isCustom && (
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

      {/* Add custom reminder form */}
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
          {/* Datepicker */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Due date</label>
            <Calendar
              mode="single"
              selected={newReminder.date || undefined}
              onSelect={date => setNewReminder({ ...newReminder, date })}
              className="rounded-md border p-2 pointer-events-auto min-w-[180px]"
            />
            {newReminder.date &&
              <span className="text-xs text-gray-600 ml-2">{format(newReminder.date, "MMM d, yyyy")}</span>
            }
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

export default ReminderEditMode;
