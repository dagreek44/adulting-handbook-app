
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Clock, DollarSign, Calendar, Play, CheckCircle2, X, ExternalLink } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  estimatedTime: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  estimatedBudget: string;
  dueDate: string;
  videoUrl?: string;
  instructions?: string[];
  tools?: any[];
  supplies?: any[];
  isGlobalReminder?: boolean;
}

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onComplete: () => void;
}

const TaskDetailModal = ({ isOpen, onClose, task, onComplete }: TaskDetailModalProps) => {
  if (!task) return null;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const generateAmazonSearchUrl = (itemName: string) => {
    const searchQuery = encodeURIComponent(itemName);
    return `https://www.amazon.com/s?k=${searchQuery}&ref=nb_sb_noss`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-gray-800 pr-8">
              {task.title}
            </DialogTitle>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-gray-600">{task.description}</p>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="w-4 h-4 mr-2" />
              <span>{task.estimatedTime}</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <DollarSign className="w-4 h-4 mr-2" />
              <span>{task.estimatedBudget}</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="w-4 h-4 mr-2" />
              <span>{task.dueDate}</span>
            </div>
            <div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(task.difficulty)}`}>
                {task.difficulty}
              </span>
            </div>
          </div>

          {task.videoUrl && (
            <div>
              <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                <Play className="w-4 h-4 mr-2" />
                Tutorial Video
              </h4>
              <div className="bg-gray-100 p-3 rounded-lg">
                <a 
                  href={task.videoUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline text-sm"
                >
                  Watch Tutorial
                </a>
              </div>
            </div>
          )}

          {task.instructions && task.instructions.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Instructions</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                {task.instructions.map((instruction, index) => (
                  <li key={index}>{instruction}</li>
                ))}
              </ol>
            </div>
          )}

          {task.tools && task.tools.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Tools Needed</h4>
              <ul className="space-y-2">
                {task.tools.map((tool, index) => {
                  const toolName = typeof tool === 'string' ? tool : tool.name || 'Tool';
                  return (
                    <li key={index} className="flex items-center justify-between text-sm text-gray-600">
                      <span>{toolName}</span>
                      {task.isGlobalReminder && (
                        <a
                          href={generateAmazonSearchUrl(toolName)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-blue-600 hover:text-blue-800 text-xs"
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Shop
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {task.supplies && task.supplies.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Supplies Needed</h4>
              <ul className="space-y-2">
                {task.supplies.map((supply, index) => {
                  const supplyName = typeof supply === 'string' ? supply : supply.name || 'Supply';
                  return (
                    <li key={index} className="flex items-center justify-between text-sm text-gray-600">
                      <span>{supplyName}</span>
                      {task.isGlobalReminder && (
                        <a
                          href={generateAmazonSearchUrl(supplyName)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-blue-600 hover:text-blue-800 text-xs"
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Shop
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <Button
              onClick={onComplete}
              className="flex-1 bg-sage text-white hover:bg-sage/90"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Mark Complete
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetailModal;
