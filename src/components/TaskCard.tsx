
import { useState } from 'react';
import { Clock, CheckCircle2, ChevronRight, DollarSign, AlertTriangle, Users, CalendarClock } from 'lucide-react';
import { format } from 'date-fns';
import PostponeReminderDialog from './PostponeReminderDialog';
import { useAuth } from '@/contexts/AuthContext';

interface TaskCardProps {
  title: string;
  description: string;
  estimatedTime: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  dueDate: string;
  estimatedBudget?: string;
  isPastDue?: boolean;
  assignedToNames?: string[];
  isCompleted?: boolean;
  lastCompleted?: string | null;
  nextDue?: string;
  taskId?: string;
  onComplete: () => void;
  onPostpone?: (newDate: Date) => Promise<void>;
  onClick?: () => void;
}

const TaskCard = ({ 
  title, 
  description, 
  estimatedTime, 
  difficulty, 
  dueDate, 
  estimatedBudget,
  isPastDue = false,
  assignedToNames = ['Family'],
  isCompleted = false,
  lastCompleted,
  nextDue,
  taskId,
  onComplete,
  onPostpone,
  onClick 
}: TaskCardProps) => {
  const [completed, setCompleted] = useState(isCompleted);
  const [showPostponeDialog, setShowPostponeDialog] = useState(false);
  const { userProfile } = useAuth();
  
  // Check if user is a parent (can postpone)
  const isParent = userProfile?.family_id; // Simplified check, you may need to check role

  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCompleted(true);
    onComplete();
  };

  const handleCardClick = () => {
    if (onClick && !completed) {
      onClick();
    }
  };

  const handlePostpone = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowPostponeDialog(true);
  };

  const handlePostponeSubmit = async (newDate: Date) => {
    if (onPostpone) {
      await onPostpone(newDate);
      setShowPostponeDialog(false);
    }
  };

  const difficultyColors = {
    Easy: 'bg-green-100 text-green-800',
    Medium: 'bg-yellow-100 text-yellow-800',
    Hard: 'bg-red-100 text-red-800'
  };

  const getBorderColor = () => {
    if (completed) return 'border-l-green-500';
    if (isPastDue) return 'border-l-red-500';
    return 'border-l-sage';
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  const displayDueDate = nextDue || dueDate;

  return (
    <>
      <div 
        className={`bg-white p-4 rounded-xl shadow-md border-l-4 transition-all duration-300 ${getBorderColor()} ${
          completed 
            ? 'opacity-80' 
            : 'hover:shadow-lg cursor-pointer'
        }`}
        onClick={handleCardClick}
      >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`font-semibold text-lg ${completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
              {title}
            </h3>
            {isPastDue && !completed && (
              <div className="flex items-center text-red-500">
                <AlertTriangle className="w-4 h-4 mr-1" />
                <span className="text-xs font-medium">Past Due</span>
              </div>
            )}
          </div>
          {/* Assignment Display */}
          <div className="flex items-center text-xs text-gray-500 mb-2">
            <Users className="w-3 h-3 mr-1" />
            <span>Assigned to: {assignedToNames.join(', ')}</span>
          </div>

          {/* Last Completed Info */}
          {lastCompleted && (
            <div className="text-xs text-gray-500 mb-2">
              Last completed: {formatDate(lastCompleted)}
            </div>
          )}
        </div>
        <div className="flex items-center ml-3 space-x-2">
          {!completed && onClick && (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          )}
          {!completed && isParent && onPostpone && (
            <button
              onClick={handlePostpone}
              className="text-gray-400 hover:text-blue-500 hover:scale-110 transition-all duration-200"
              title="Postpone reminder"
            >
              <CalendarClock className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={handleComplete}
            disabled={completed}
            className={`transition-all duration-200 ${
              completed 
                ? 'text-green-500' 
                : 'text-gray-400 hover:text-sage hover:scale-110'
            }`}
          >
            <CheckCircle2 className="w-6 h-6" />
          </button>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center text-gray-500">
            <Clock className="w-4 h-4 mr-1" />
            <span className="text-sm">{estimatedTime}</span>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${difficultyColors[difficulty]}`}>
            {difficulty}
          </span>
          {estimatedBudget && (
            <div className="flex items-center text-gray-500">
              <DollarSign className="w-4 h-4 mr-1" />
              <span className="text-sm">{estimatedBudget}</span>
            </div>
          )}
        </div>
        <div className="text-right">
          <span className={`text-xs ${isPastDue && !completed ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
            Due: {formatDate(displayDueDate)}
          </span>
        </div>
      </div>
      </div>
      
      {showPostponeDialog && onPostpone && (
        <PostponeReminderDialog
          isOpen={showPostponeDialog}
          onClose={() => setShowPostponeDialog(false)}
          onPostpone={handlePostponeSubmit}
          reminderTitle={title}
          currentDueDate={displayDueDate}
        />
      )}
    </>
  );
};

export default TaskCard;
