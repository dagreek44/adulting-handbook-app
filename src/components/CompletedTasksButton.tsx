
import { CheckCircle2 } from 'lucide-react';

interface CompletedTasksButtonProps {
  onNavigateToCompleted: () => void;
}

const CompletedTasksButton = ({ onNavigateToCompleted }: CompletedTasksButtonProps) => {
  return (
    <button
      onClick={onNavigateToCompleted}
      className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center"
    >
      <CheckCircle2 className="w-5 h-5 mr-2" />
      View Recently Completed Tasks
    </button>
  );
};

export default CompletedTasksButton;
