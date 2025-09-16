
import { Plus, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GlobalReminder } from '@/contexts/ReminderContext';

interface GlobalRemindersSelectorProps {
  globalReminders: GlobalReminder[];
  enabledTaskIds: (string | null)[];
  onEnableReminder: (reminder: GlobalReminder) => void;
  selectedCategories?: Set<string>;
}

const GlobalRemindersSelector = ({ 
  globalReminders, 
  enabledTaskIds, 
  onEnableReminder,
  selectedCategories = new Set()
}: GlobalRemindersSelectorProps) => {
  const isReminderEnabled = (reminderId: string) => {
    return enabledTaskIds.includes(reminderId);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'Hard': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getFrequencyText = (frequency: string) => {
    return frequency.charAt(0).toUpperCase() + frequency.slice(1);
  };

  // Filter reminders based on selected categories
  const filteredReminders = globalReminders.filter(reminder => {
    if (selectedCategories.size === 0) return true;
    
    const categoryKey = `${reminder.main_category || 'Household'}:${reminder.subcategory || 'General'}`;
    return selectedCategories.has(categoryKey);
  });

  // Group reminders by subcategory
  const groupedReminders = filteredReminders.reduce((acc, reminder) => {
    const subcategory = reminder.subcategory || 'General';
    if (!acc[subcategory]) {
      acc[subcategory] = [];
    }
    acc[subcategory].push(reminder);
    return acc;
  }, {} as Record<string, GlobalReminder[]>);

  return (
    <div className="bg-card p-6 rounded-xl shadow-sm border">
      <h3 className="text-2xl font-bold mb-2">Available Reminders</h3>
      <p className="text-muted-foreground text-sm mb-6">
        Select from these built-in reminders to add to your task list. Use the category filter above to narrow down your options.
      </p>
      
      {selectedCategories.size > 0 && filteredReminders.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">No reminders found for the selected categories.</p>
          <p className="text-sm">Try selecting different categories or clear your filters.</p>
        </div>
      )}
      
      <div className="space-y-8">
        {Object.entries(groupedReminders).map(([subcategory, reminders]) => (
          <div key={subcategory}>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xl font-semibold text-foreground">
                {subcategory}
              </h4>
              <Badge variant="outline" className="text-xs">
                {reminders.length} reminder{reminders.length !== 1 ? 's' : ''}
              </Badge>
            </div>
            <div className="grid gap-4">
              {reminders.map((reminder) => {
          const enabled = isReminderEnabled(reminder.id);
          
          return (
            <div
              key={reminder.id}
              className={`p-5 rounded-lg border transition-all ${
                enabled 
                  ? 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20' 
                  : 'border-border bg-card hover:border-primary/20 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h5 className="font-semibold text-foreground">{reminder.title}</h5>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(reminder.difficulty)}`}>
                      {reminder.difficulty}
                    </span>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {getFrequencyText('monthly')}
                    </span>
                  </div>
                  
                  <p className="text-muted-foreground text-sm mb-3">{reminder.description}</p>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>⏱️ {reminder.estimated_time}</span>
                    {reminder.estimated_budget && reminder.estimated_budget !== '$0' && (
                      <span>💰 {reminder.estimated_budget}</span>
                    )}
                  </div>
                </div>
                
                <Button
                  onClick={() => !enabled && onEnableReminder(reminder)}
                  disabled={enabled}
                  variant={enabled ? "secondary" : "default"}
                  size="sm"
                  className={enabled ? "cursor-not-allowed" : ""}
                >
                  {enabled ? (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      Added
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </>
                  )}
                </Button>
              </div>
            </div>
              );
            })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GlobalRemindersSelector;
