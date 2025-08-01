
import { Plus, Check } from 'lucide-react';

interface GlobalReminder {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  estimated_time: string;
  estimated_budget: string;
  frequency_days: number;
}

interface GlobalRemindersSelectorProps {
  globalReminders: GlobalReminder[];
  enabledTaskIds: (string | null)[];
  onEnableReminder: (reminder: GlobalReminder) => void;
}

const GlobalRemindersSelector = ({ 
  globalReminders, 
  enabledTaskIds, 
  onEnableReminder 
}: GlobalRemindersSelectorProps) => {
  const isReminderEnabled = (reminderId: string) => {
    return enabledTaskIds.includes(reminderId);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFrequencyText = (days: number) => {
    if (days <= 7) return 'Weekly';
    if (days <= 30) return 'Monthly';
    if (days <= 90) return 'Quarterly';
    if (days <= 180) return 'Bi-annually';
    return 'Yearly';
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-md">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Available Reminders</h3>
      <p className="text-gray-600 text-sm mb-4">
        Select from these built-in reminders to add to your task list:
      </p>
      
      <div className="space-y-3">
        {globalReminders.map((reminder) => {
          const enabled = isReminderEnabled(reminder.id);
          
          return (
            <div
              key={reminder.id}
              className={`p-4 rounded-lg border transition-all ${
                enabled 
                  ? 'border-green-200 bg-green-50' 
                  : 'border-gray-200 bg-white hover:border-sage'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-gray-800">{reminder.title}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(reminder.difficulty)}`}>
                      {reminder.difficulty}
                    </span>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {getFrequencyText(reminder.frequency_days)}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-2">{reminder.description}</p>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>⏱️ {reminder.estimated_time}</span>
                    {reminder.estimated_budget && (
                      <span>💰 {reminder.estimated_budget}</span>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={() => !enabled && onEnableReminder(reminder)}
                  disabled={enabled}
                  className={`flex items-center px-3 py-2 rounded-lg font-medium transition-colors ${
                    enabled
                      ? 'bg-green-100 text-green-700 cursor-not-allowed'
                      : 'bg-sage text-white hover:bg-sage/90'
                  }`}
                >
                  {enabled ? (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      Added
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GlobalRemindersSelector;
