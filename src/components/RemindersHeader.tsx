
import { Edit } from 'lucide-react';
import SharedHeader from './SharedHeader';

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
  const editButton = (
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
  );

  return (
    <SharedHeader
      title="Reminders"
      setIsFamilyModalOpen={setIsFamilyModalOpen}
      rightContent={editButton}
    />
  );
};

export default RemindersHeader;
