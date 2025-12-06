import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { GlobalReminder } from '@/contexts/ReminderContext';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface ExpandableCategoryTreeProps {
  reminders: GlobalReminder[];
  enabledReminderIds: string[];
  onToggleReminder: (reminderId: string, enabled: boolean) => void;
  customReminders?: any[];
}

const ExpandableCategoryTree = ({
  reminders,
  enabledReminderIds,
  onToggleReminder,
  customReminders = []
}: ExpandableCategoryTreeProps) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedSubcategories, setExpandedSubcategories] = useState<Set<string>>(new Set());

  // Group reminders by main category and subcategory
  const groupedReminders = reminders.reduce((acc, reminder) => {
    const mainCategory = reminder.main_category || 'Household';
    const subcategory = reminder.subcategory || 'General';
    
    if (!acc[mainCategory]) {
      acc[mainCategory] = {};
    }
    if (!acc[mainCategory][subcategory]) {
      acc[mainCategory][subcategory] = [];
    }
    
    acc[mainCategory][subcategory].push(reminder);
    return acc;
  }, {} as Record<string, Record<string, GlobalReminder[]>>);

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
      // Also collapse all subcategories when collapsing main category
      const subcateoriesToCollapse = Object.keys(groupedReminders[category] || {})
        .map(sub => `${category}:${sub}`);
      subcateoriesToCollapse.forEach(subKey => {
        const newSubExpanded = new Set(expandedSubcategories);
        newSubExpanded.delete(subKey);
        setExpandedSubcategories(newSubExpanded);
      });
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const toggleSubcategory = (category: string, subcategory: string) => {
    const key = `${category}:${subcategory}`;
    const newExpanded = new Set(expandedSubcategories);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedSubcategories(newExpanded);
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

  const isReminderEnabled = (reminderId: string) => {
    return enabledReminderIds.includes(reminderId);
  };

  // Helper to check if this is the smoke detector reminder
  const isSmokeDetectorReminder = (title: string) => {
    return title.toLowerCase().includes('smoke detector');
  };

  return (
    <div className="bg-card p-6 rounded-xl shadow-sm border">
      <h3 className="text-base font-bold mb-2 break-words">Available Reminders by Category</h3>
      <p className="text-muted-foreground text-sm mb-6">
        Expand categories and subcategories to view and enable specific reminders. Checked items are already enabled.
      </p>

      <div className="space-y-2">
        {Object.entries(groupedReminders).map(([mainCategory, subcategories]) => {
          const categoryExpanded = expandedCategories.has(mainCategory);
          const totalReminders = Object.values(subcategories).flat().length;
          const enabledReminders = Object.values(subcategories).flat().filter(r => isReminderEnabled(r.id)).length;

          return (
            <div key={mainCategory} className="border rounded-lg" data-tour={`category-${mainCategory}`}>
              <Collapsible
                open={categoryExpanded}
                onOpenChange={() => toggleCategory(mainCategory)}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-start p-4 h-auto hover:bg-muted/50"
                    data-tour={`category-${mainCategory}`}
                  >
                    {categoryExpanded ? (
                      <ChevronDown className="w-5 h-5 mr-3" />
                    ) : (
                      <ChevronRight className="w-5 h-5 mr-3" />
                    )}
                    <div className="flex items-center justify-between w-full min-w-0">
                      <span className="font-semibold text-base truncate pr-2">{mainCategory}</span>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Badge variant="secondary" className="text-xs">
                          {enabledReminders}/{totalReminders}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {Object.keys(subcategories).length} sub
                        </Badge>
                      </div>
                    </div>
                  </Button>
                </CollapsibleTrigger>

                <CollapsibleContent className="px-4 pb-4">
                  <div className="ml-8 space-y-2">
                    {Object.entries(subcategories).map(([subcategory, remindersList]) => {
                      const subKey = `${mainCategory}:${subcategory}`;
                      const subExpanded = expandedSubcategories.has(subKey);
                      const subEnabledCount = remindersList.filter(r => isReminderEnabled(r.id)).length;

                      return (
                        <div key={subcategory} className="border rounded-md bg-muted/20" data-tour={`subcategory-${subcategory}`}>
                          <Collapsible
                            open={subExpanded}
                            onOpenChange={() => toggleSubcategory(mainCategory, subcategory)}
                          >
                            <CollapsibleTrigger asChild>
                              <Button
                                variant="ghost"
                                className="w-full justify-start p-3 h-auto hover:bg-muted/50"
                                data-tour={`subcategory-${subcategory}`}
                              >
                                {subExpanded ? (
                                  <ChevronDown className="w-4 h-4 mr-2" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 mr-2" />
                                )}
                                <div className="flex items-center justify-between w-full min-w-0">
                                  <span className="font-medium text-sm truncate pr-2">{subcategory}</span>
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <Badge variant="secondary" className="text-xs">
                                      {subEnabledCount}/{remindersList.length}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      {remindersList.length}
                                    </Badge>
                                  </div>
                                </div>
                              </Button>
                            </CollapsibleTrigger>

                            <CollapsibleContent className="px-3 pb-3">
                              <div className="ml-6 space-y-3">
                                {remindersList.map((reminder) => {
                                  const enabled = isReminderEnabled(reminder.id);
                                  
                                  return (
                                     <div
                                       key={reminder.id}
                                       data-tour={isSmokeDetectorReminder(reminder.title) ? 'reminder-smoke-detectors' : undefined}
                                       className={`p-4 rounded-lg border flex items-start gap-3 transition-all ${
                                         enabled
                                           ? 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20' 
                                           : 'border-border bg-card hover:border-primary/20 hover:shadow-sm'
                                       }`}
                                     >
                                       <Checkbox
                                         checked={enabled}
                                         onCheckedChange={(checked) => onToggleReminder(reminder.id, !!checked)}
                                         className="mt-1"
                                       />
                                       
                                        <div className="flex-1 min-w-0">
                                          <div className="flex flex-wrap items-center gap-1 mb-2">
                                            <h5 className="font-semibold text-foreground text-sm break-words">{reminder.title}</h5>
                                            <Badge className={`text-xs flex-shrink-0 ${getDifficultyColor(reminder.difficulty)}`}>
                                              {reminder.difficulty}
                                            </Badge>
                                            <Badge variant="secondary" className="text-xs flex-shrink-0">
                                              {reminder.frequency_days}d
                                            </Badge>
                                          </div>
                                          
                                          <p className="text-muted-foreground text-xs mb-2 break-words">{reminder.description}</p>
                                          
                                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                            <span className="flex-shrink-0">⏱️ {reminder.estimated_time}</span>
                                            {reminder.estimated_budget && reminder.estimated_budget !== '$0' && (
                                              <span className="flex-shrink-0">💰 {reminder.estimated_budget}</span>
                                            )}
                                          </div>
                                        </div>
                                     </div>
                                  );
                                })}
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        </div>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          );
        })}

        {/* Custom Reminders Section */}
        {customReminders.length > 0 && (
          <div className="border rounded-lg">
            <Collapsible
              open={expandedCategories.has('Custom Reminders')}
              onOpenChange={() => toggleCategory('Custom Reminders')}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start p-4 h-auto hover:bg-muted/50"
                >
                  {expandedCategories.has('Custom Reminders') ? (
                    <ChevronDown className="w-5 h-5 mr-3" />
                  ) : (
                    <ChevronRight className="w-5 h-5 mr-3" />
                  )}
                  <div className="flex items-center justify-between w-full min-w-0">
                    <span className="font-semibold text-base truncate pr-2">Custom Reminders</span>
                    <Badge variant="secondary" className="text-xs">
                      {customReminders.length}
                    </Badge>
                  </div>
                </Button>
              </CollapsibleTrigger>

              <CollapsibleContent className="px-4 pb-4">
                <div className="ml-8 space-y-3">
                  {customReminders.map((reminder) => (
                    <div
                      key={reminder.id}
                      className="p-4 rounded-lg border border-primary/20 bg-primary/5 flex items-start gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1 mb-2">
                          <h5 className="font-semibold text-foreground text-sm break-words">{reminder.title}</h5>
                          <Badge className={`text-xs flex-shrink-0 ${getDifficultyColor(reminder.difficulty || 'Easy')}`}>
                            {reminder.difficulty || 'Easy'}
                          </Badge>
                          <Badge variant="outline" className="text-xs flex-shrink-0 bg-primary/10">
                            Custom
                          </Badge>
                        </div>
                        
                        {reminder.description && (
                          <p className="text-muted-foreground text-xs mb-2 break-words">{reminder.description}</p>
                        )}
                        
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className="flex-shrink-0">⏱️ {reminder.estimated_time || '30 min'}</span>
                          {reminder.due_date && (
                            <span className="flex-shrink-0">📅 Due: {reminder.due_date}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpandableCategoryTree;