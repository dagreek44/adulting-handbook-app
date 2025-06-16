
import { useState } from 'react';
import { Plus, Trash2, ToggleLeft, ToggleRight, X, Pencil, Save } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { SupabaseReminder } from '@/hooks/useSupabaseData';

interface FamilyMember {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Member';
}

interface ReminderEditModeProps {
  isEditMode: boolean;
  onExitEdit: () => void;
  reminders: SupabaseReminder[];
  onUpdateReminders: (reminders: SupabaseReminder[]) => void;
  familyMembers: FamilyMember[];
  supabaseOperations: {
    addReminder: (reminder: Partial<SupabaseReminder>) => Promise<void>;
    updateReminder: (id: string, updates: Partial<SupabaseReminder>) => Promise<void>;
    deleteReminder: (id: string) => Promise<void>;
  };
}

const frequencies = [
  "weekly",
  "monthly",
  "quarterly",
  "seasonally",
  "yearly"
];

const ReminderEditMode = ({
  isEditMode,
  onExitEdit,
  reminders,
  onUpdateReminders,
  familyMembers,
  supabaseOperations
}: ReminderEditModeProps) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [newReminder, setNewReminder] = useState<Partial<SupabaseReminder>>({
    title: '',
    description: '',
    frequency: 'monthly',
    due_date: null,
    assignees: []
  });
  const [editReminder, setEditReminder] = useState<Partial<SupabaseReminder>>({
    title: '',
    description: '',
    frequency: 'monthly',
    due_date: null,
    assignees: []
  });

  const toggleReminder = async (id: string) => {
    const reminder = reminders.find(r => r.id === id);
    if (reminder) {
      await supabaseOperations.updateReminder(id, { enabled: !reminder.enabled });
    }
  };

  const deleteReminder = async (id: string) => {
    await supabaseOperations.deleteReminder(id);
  };

  const addCustomReminder = async () => {
    if (!newReminder.title?.trim()) return;

    const customReminder: Partial<SupabaseReminder> = {
      title: newReminder.title || "",
      description: newReminder.description || "",
      frequency: newReminder.frequency || "monthly",
      enabled: true,
      is_custom: true,
      due_date: newReminder.due_date ? format(new Date(newReminder.due_date), 'yyyy-MM-dd') : null,
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
    setShowAddForm(false);
  };

  const startEdit = (reminder: SupabaseReminder) => {
    setEditId(reminder.id);
    setEditReminder({ ...reminder });
  };

  const saveEdit = async () => {
    if (!editReminder.title?.trim() || !editId) return;
    
    const updates = {
      ...editReminder,
      due_date: editReminder.due_date ? format(new Date(editReminder.due_date), 'yyyy-MM-dd') : null
    };
    
    await supabaseOperations.updateReminder(editId, updates);
    setEditId(null);
    setEditReminder({ title: '', description: '', frequency: 'monthly', due_date: null, assignees: [] });
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
                    {reminder.assignees && reminder.assignees.length > 0 && (
                      <span className="text-xs text-sage font-semibold ml-2">
                        {reminder.assignees.map(id => familyMembers.find(m => m.id === id)?.name).filter(Boolean).join(', ')}
                      </span>
                    )}
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
                    onClick={() => toggleReminder(reminder.id)}
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
