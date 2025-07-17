import { Users } from 'lucide-react';

interface SharedHeaderProps {
  title: string;
  setIsFamilyModalOpen: (open: boolean) => void;
  rightContent?: React.ReactNode;
}

const SharedHeader = ({ 
  title, 
  setIsFamilyModalOpen,
  rightContent 
}: SharedHeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setIsFamilyModalOpen(true)}
          className="flex items-center px-3 py-2 bg-blue-soft text-white rounded-lg hover:bg-blue-400 transition-colors"
        >
          <Users className="w-4 h-4 mr-2" />
          Family
        </button>
        {rightContent}
      </div>
    </div>
  );
};

export default SharedHeader;