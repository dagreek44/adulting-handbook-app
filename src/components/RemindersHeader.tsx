
import { Users, Edit } from 'lucide-react';

interface RemindersHeaderProps {
  isEditMode: boolean;
  setIsEditMode: (mode: boolean) => void;
  setIsFamilyModalOpen: (open: boolean) => void;
}

const RemindersHeader = ({ 
  isEditMode, 
  setIsEditMode, 
  setIsFamilyModalOpen 
}: RemindersHeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      <h2 className="text-2xl font-bold text-gray-800">Reminders</h2>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setIsFamilyModalOpen(true)}
          className="flex items-center px-3 py-2 bg-blue-soft text-white rounded-lg hover:bg-blue-400 transition-colors"
        >
          <Users className="w-4 h-4 mr-2" />
          Family
        </button>
        <button
          onClick={() => setIsEditMode(!isEditMode)}
          className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
            isEditMode 
              ? 'bg-sage text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Edit className="w-4 h-4 mr-2" />
          {isEditMode ? 'Done' : 'Edit'}
        </button>
      </div>
    </div>
  );
};

export default RemindersHeader;
