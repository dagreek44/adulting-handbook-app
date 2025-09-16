import { useState } from 'react';
import { ChevronDown, ChevronRight, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';

interface CategoryFilterProps {
  categories: Record<string, string[]>; // main_category -> subcategories
  selectedCategories: Set<string>;
  onCategoryToggle: (category: string) => void;
  onClearFilters: () => void;
}

const CategoryFilter = ({
  categories,
  selectedCategories,
  onCategoryToggle,
  onClearFilters
}: CategoryFilterProps) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(Object.keys(categories))
  );

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const getSelectedCount = () => selectedCategories.size;

  return (
    <div className="bg-card p-6 rounded-xl shadow-sm border">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Filter className="w-5 h-5 text-primary" />
          <h3 className="text-xl font-semibold">Filter by Category</h3>
          {getSelectedCount() > 0 && (
            <Badge variant="secondary" className="ml-2">
              {getSelectedCount()} selected
            </Badge>
          )}
        </div>
        {getSelectedCount() > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            className="text-xs"
          >
            Clear All
          </Button>
        )}
      </div>
      
      <div className="mb-4 text-sm text-muted-foreground">
        Choose categories to filter reminders. Expand each category to select specific subcategories.
      </div>

      <div className="space-y-2">
        {Object.entries(categories).map(([mainCategory, subcategories]) => (
          <Collapsible
            key={mainCategory}
            open={expandedCategories.has(mainCategory)}
            onOpenChange={() => toggleCategory(mainCategory)}
          >
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start p-2 h-auto"
              >
                {expandedCategories.has(mainCategory) ? (
                  <ChevronDown className="w-4 h-4 mr-2" />
                ) : (
                  <ChevronRight className="w-4 h-4 mr-2" />
                )}
                <span className="font-medium">{mainCategory}</span>
                <Badge variant="outline" className="ml-auto">
                  {subcategories.length}
                </Badge>
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="pl-6 pt-1">
              <div className="space-y-1">
                {subcategories.map((subcategory) => {
                  const categoryKey = `${mainCategory}:${subcategory}`;
                  const isSelected = selectedCategories.has(categoryKey);
                  
                  return (
                    <Button
                      key={subcategory}
                      variant={isSelected ? "default" : "ghost"}
                      size="sm"
                      className={`w-full justify-start text-sm ${
                        isSelected 
                          ? 'bg-primary text-primary-foreground' 
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => onCategoryToggle(categoryKey)}
                    >
                      <div className={`w-3 h-3 rounded border mr-2 ${
                        isSelected 
                          ? 'bg-primary-foreground border-primary-foreground' 
                          : 'border-muted-foreground'
                      }`}>
                        {isSelected && (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                          </div>
                        )}
                      </div>
                      {subcategory}
                    </Button>
                  );
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>
    </div>
  );
};

export default CategoryFilter;