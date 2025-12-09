import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Clock, DollarSign, Calendar, Play, CheckCircle2, ExternalLink, Users, CalendarDays, CalendarPlus } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { CalendarSyncService } from '@/services/CalendarSyncService';
import { toast } from 'sonner';

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
  user_id?: string;
}

interface FamilyMember {
  id: string;
  profile_id?: string;
  name: string;
  email: string;
  role: string;
}

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onComplete: () => void;
  familyMembers?: FamilyMember[];
  onReassign?: (taskId: string, newUserId: string) => Promise<void>;
  onUpdateDueDate?: (taskId: string, newDate: Date) => Promise<void>;
}

const TaskDetailModal = ({ isOpen, onClose, task, onComplete, familyMembers = [], onReassign, onUpdateDueDate }: TaskDetailModalProps) => {
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isReassigning, setIsReassigning] = useState(false);
  const [isUpdatingDate, setIsUpdatingDate] = useState(false);

  // Sync state when task changes or modal opens
  useEffect(() => {
    if (task && isOpen) {
      setSelectedAssignee(task.user_id || '');
      setSelectedDate(task.dueDate && task.dueDate !== 'Not set' ? new Date(task.dueDate) : undefined);
    }
  }, [task, isOpen]);

  if (!task) return null;

  const handleReassign = async () => {
    if (!onReassign || !selectedAssignee || selectedAssignee === task.user_id) return;
    
    setIsReassigning(true);
    try {
      await onReassign(task.id, selectedAssignee);
      onClose();
    } catch (error) {
      console.error('Failed to reassign task:', error);
    } finally {
      setIsReassigning(false);
    }
  };

  const handleUpdateDueDate = async () => {
    if (!onUpdateDueDate || !selectedDate) return;
    
    setIsUpdatingDate(true);
    try {
      await onUpdateDueDate(task.id, selectedDate);
      onClose();
    } catch (error) {
      console.error('Failed to update due date:', error);
    } finally {
      setIsUpdatingDate(false);
    }
  };

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
            <DialogTitle className="text-xl font-bold text-gray-800">
              {task.title}
            </DialogTitle>
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

          {/* Assign/Reassign Task Section */}
          {familyMembers.length > 0 && onReassign && (
            <div className="border-t pt-4">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                <Users className="w-4 h-4 mr-2" />
                Assigned To
              </h4>
              <RadioGroup value={selectedAssignee} onValueChange={setSelectedAssignee}>
                {familyMembers.map((member) => (
                  <div key={member.profile_id || member.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={member.profile_id || member.id} id={member.profile_id || member.id} />
                    <Label htmlFor={member.profile_id || member.id} className="cursor-pointer">
                      {member.name} ({member.role})
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              {selectedAssignee !== task.user_id && (
                <Button
                  onClick={handleReassign}
                  disabled={isReassigning}
                  className="mt-3 w-full"
                  variant="outline"
                >
                  {isReassigning ? 'Reassigning...' : 'Reassign Task'}
                </Button>
              )}
            </div>
          )}

          {/* Update Due Date Section */}
          {onUpdateDueDate && (
            <div className="border-t pt-4">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                <CalendarDays className="w-4 h-4 mr-2" />
                Update Due Date
              </h4>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {selectedDate && selectedDate.toDateString() !== new Date(task.dueDate).toDateString() && (
                <Button
                  onClick={handleUpdateDueDate}
                  disabled={isUpdatingDate}
                  className="mt-3 w-full"
                  variant="outline"
                >
                  {isUpdatingDate ? 'Updating...' : 'Update Due Date'}
                </Button>
              )}
            </div>
          )}

          {/* Calendar Sync Section */}
          <div className="border-t pt-4">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
              <CalendarPlus className="w-4 h-4 mr-2" />
              Sync to Calendar
            </h4>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={async () => {
                  const dueDate = task.dueDate && task.dueDate !== 'Not set' 
                    ? new Date(task.dueDate) 
                    : new Date();
                  const success = await CalendarSyncService.addToCalendar(
                    task.id,
                    task.title,
                    task.description,
                    dueDate,
                    true // Use Google Calendar
                  );
                  if (success) {
                    toast.success('Opening Google Calendar...');
                  }
                }}
              >
                Google Calendar
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={async () => {
                  const dueDate = task.dueDate && task.dueDate !== 'Not set' 
                    ? new Date(task.dueDate) 
                    : new Date();
                  const success = await CalendarSyncService.addToCalendar(
                    task.id,
                    task.title,
                    task.description,
                    dueDate,
                    false // Download ICS file
                  );
                  if (success) {
                    toast.success('Calendar file downloaded!');
                  }
                }}
              >
                Download .ics
              </Button>
            </div>
          </div>

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
