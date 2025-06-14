
import { useState } from 'react';
import { X, Clock, Wrench, ShoppingCart, Play, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';

interface Tool {
  name: string;
  required: boolean;
  amazonUrl?: string;
}

interface Supply {
  name: string;
  amazonUrl: string;
  estimatedCost: string;
}

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: {
    title: string;
    description: string;
    estimatedTime: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    dueDate: string;
    videoUrl?: string;
    instructions: string[];
    tools: Tool[];
    supplies: Supply[];
  } | null;
  onComplete: () => void;
}

const TaskDetailModal = ({ isOpen, onClose, task, onComplete }: TaskDetailModalProps) => {
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Don't render anything if task is null
  if (!task) {
    return null;
  }

  // Default arrays to empty so .map doesn't throw
  const instructions = task.instructions ?? [];
  const tools = task.tools ?? [];
  const supplies = task.supplies ?? [];

  const toggleStep = (index: number) => {
    setCompletedSteps(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const handleComplete = () => {
    onComplete();
    onClose();
  };

  const difficultyColors = {
    Easy: 'bg-green-100 text-green-800',
    Medium: 'bg-yellow-100 text-yellow-800',
    Hard: 'bg-red-100 text-red-800'
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-800">{task.title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Task Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center text-gray-500">
                <Clock className="w-4 h-4 mr-1" />
                <span className="text-sm">{task.estimatedTime}</span>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${difficultyColors[task.difficulty]}`}>
                {task.difficulty}
              </span>
            </div>
            <span className="text-sm text-gray-500">{task.dueDate}</span>
          </div>

          <p className="text-gray-600">{task.description}</p>

          {/* Video Section */}
          {task.videoUrl && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                <Play className="w-5 h-5 mr-2 text-red-500" />
                How-to Video
              </h3>
              <div className="bg-gray-200 rounded-lg p-8 text-center">
                <Play className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-600 text-sm">Video tutorial placeholder</p>
                <p className="text-xs text-gray-500 mt-1">{task.videoUrl}</p>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">Step-by-Step Instructions</h3>
            <div className="space-y-2">
              {instructions.map((instruction, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <button
                    onClick={() => toggleStep(index)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                      completedSteps.includes(index)
                        ? 'bg-sage border-sage text-white'
                        : 'border-gray-300 hover:border-sage'
                    }`}
                  >
                    {completedSteps.includes(index) && <Check className="w-4 h-4" />}
                  </button>
                  <p className={`text-sm ${completedSteps.includes(index) ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                    {instruction}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Tools Needed */}
          {tools.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                <Wrench className="w-5 h-5 mr-2 text-sage" />
                Tools Needed
              </h3>
              <div className="space-y-2">
                {tools.map((tool, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <span className={`text-sm ${tool.required ? 'font-medium' : 'text-gray-600'}`}>
                      {tool.name} {tool.required && '*'}
                    </span>
                    {tool.amazonUrl && (
                      <button
                        onClick={() => window.open(tool.amazonUrl, '_blank')}
                        className="text-xs bg-orange-500 text-white px-2 py-1 rounded hover:bg-orange-600"
                      >
                        Buy
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Supplies to Buy */}
          {supplies.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                <ShoppingCart className="w-5 h-5 mr-2 text-coral" />
                Supplies Needed
              </h3>
              <div className="space-y-2">
                {supplies.map((supply, index) => (
                  <div key={index} className="flex items-center justify-between bg-coral/10 p-3 rounded-lg">
                    <div>
                      <span className="text-sm font-medium">{supply.name}</span>
                      <p className="text-xs text-gray-600">{supply.estimatedCost}</p>
                    </div>
                    <button
                      onClick={() => window.open(supply.amazonUrl, '_blank')}
                      className="bg-orange-500 text-white px-3 py-1 rounded text-sm hover:bg-orange-600 flex items-center"
                    >
                      <ShoppingCart className="w-4 h-4 mr-1" />
                      Amazon
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Complete Task Button */}
          <button
            onClick={handleComplete}
            className="w-full bg-sage text-white py-3 rounded-lg font-medium hover:bg-sage/90 transition-colors"
          >
            Mark as Complete
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetailModal;

