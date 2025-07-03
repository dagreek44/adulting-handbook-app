
import { List, CalendarDays } from 'lucide-react';

interface ReminderViewToggleProps {
  reminderViewMode: 'list' | 'calendar';
  setReminderViewMode: (mode: 'list' | 'calendar') => void;
}

const ReminderViewToggle = ({ 
  reminderViewMode, 
  setReminderViewMode 
}: ReminderViewToggleProps) => {
  return (
    <div className="flex bg-white p-1 rounded-lg shadow-md">
      <button
        onClick={() => setReminderViewMode('list')}
        className={`flex items-center flex-1 py-2 px-4 rounded-md transition-colors ${
          reminderViewMode === 'list' 
            ? 'bg-sage text-white' 
            : 'text-gray-600 hover:text-gray-800'
        }`}
      >
        <List className="w-4 h-4 mr-2" />
        List View
      </button>
      <button
        onClick={() => setReminderViewMode('calendar')}
        className={`flex items-center flex-1 py-2 px-4 rounded-md transition-colors ${
          reminderViewMode === 'calendar' 
            ? 'bg-sage text-white' 
            : 'text-gray-600 hover:text-gray-800'
        }`}
      >
        <CalendarDays className="w-4 h-4 mr-2" />
        Calendar View
      </button>
    </div>
  );
};

export default ReminderViewToggle;
