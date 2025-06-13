
import { useState } from 'react';
import { Plus, Trash2, ToggleLeft, ToggleRight, X } from 'lucide-react';

interface Reminder {
  id: string;
  title: string;
  description: string;
  frequency: string;
  enabled: boolean;
  isCustom?: boolean;
}

interface ReminderEditModeProps {
  isEditMode: boolean;
  onExitEdit: () => void;
  reminders: Reminder[];
  onUpdateReminders: (reminders: Reminder[]) => void;
}

const ReminderEditMode = ({ isEditMode, onExitEdit, reminders, onUpdateReminders }: ReminderEditModeProps) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newReminder, setNewReminder] = useState({
    title: '',
    description: '',
    frequency: 'monthly'
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
    if (!newReminder.title.trim()) return;
    
    const customReminder: Reminder = {
      id: Date.now().toString(),
      title: newReminder.title,
      description: newReminder.description,
      frequency: newReminder.frequency,
      enabled: true,
      isCustom: true
    };
    
    onUpdateReminders([...reminders, customReminder]);
    setNewReminder({ title: '', description: '', frequency: 'monthly' });
    setShowAddForm(false);
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
          <div key={reminder.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
            <div className="flex-1">
              <h4 className="font-medium text-gray-800">{reminder.title}</h4>
              <p className="text-sm text-gray-600">{reminder.frequency}</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => toggleReminder(reminder.id)}
                className={`transition-colors ${reminder.enabled ? 'text-sage' : 'text-gray-400'}`}
              >
                {reminder.enabled ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
              </button>
              {reminder.isCustom && (
                <button
                  onClick={() => deleteReminder(reminder.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

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
            onChange={(e) => setNewReminder({ ...newReminder, frequency: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-lg"
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="seasonally">Seasonally</option>
            <option value="yearly">Yearly</option>
          </select>
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
