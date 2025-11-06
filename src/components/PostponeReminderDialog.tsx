import { useState } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface PostponeReminderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPostpone: (newDate: Date) => Promise<void>;
  reminderTitle: string;
  currentDueDate: string;
}

const PostponeReminderDialog = ({
  isOpen,
  onClose,
  onPostpone,
  reminderTitle,
  currentDueDate
}: PostponeReminderDialogProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePostpone = async () => {
    if (!selectedDate) return;

    setIsSubmitting(true);
    try {
      await onPostpone(selectedDate);
      onClose();
      setSelectedDate(undefined);
    } catch (error) {
      console.error('Failed to postpone reminder:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Postpone Reminder</DialogTitle>
          <DialogDescription>
            Choose a new due date for "{reminderTitle}"
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-4">
            Current due date: {format(new Date(currentDueDate), 'PPP')}
          </p>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : <span>Pick a new date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handlePostpone} 
            disabled={!selectedDate || isSubmitting}
          >
            {isSubmitting ? 'Postponing...' : 'Postpone'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PostponeReminderDialog;
