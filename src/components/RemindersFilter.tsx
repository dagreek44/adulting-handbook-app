import { useState } from 'react';
import { Filter, ChevronDown, ChevronUp, X } from 'lucide-react';
import { FamilyMember } from '@/hooks/useSupabaseData';

interface RemindersFilterProps {
  categories: string[];
  familyMembers: FamilyMember[];
  selectedCategories: string[];
  selectedMembers: string[];
  onCategoryChange: (categories: string[]) => void;
  onMemberChange: (members: string[]) => void;
  onClearFilters: () => void;
}

const RemindersFilter = ({
  categories,
  familyMembers,
  selectedCategories,
  selectedMembers,
  onCategoryChange,
  onMemberChange,
  onClearFilters
}: RemindersFilterProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const hasActiveFilters = selectedCategories.length > 0 || selectedMembers.length > 0;

  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      onCategoryChange(selectedCategories.filter(c => c !== category));
    } else {
      onCategoryChange([...selectedCategories, category]);
    }
  };

  const toggleMember = (member: FamilyMember) => {
    // Use profile_id if available, otherwise fall back to id
    const memberId = member.profile_id || member.id;
    if (selectedMembers.includes(memberId)) {
      onMemberChange(selectedMembers.filter(m => m !== memberId));
    } else {
      onMemberChange([...selectedMembers, memberId]);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-sage" />
          <span className="font-medium text-gray-700">Filter Reminders</span>
          {hasActiveFilters && (
            <span className="bg-sage text-white text-xs px-2 py-0.5 rounded-full">
              {selectedCategories.length + selectedMembers.length}
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-100">
          {/* Clear filters button */}
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="mt-3 flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
            >
              <X className="w-3 h-3" />
              Clear all filters
            </button>
          )}

          {/* Categories filter */}
          {categories.length > 0 && (
            <div className="mt-3">
              <h4 className="text-sm font-semibold text-gray-600 mb-2">By Category</h4>
              <div className="flex flex-wrap gap-2">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => toggleCategory(category)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                      selectedCategories.includes(category)
                        ? 'bg-sage text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Family members filter */}
          {familyMembers.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-600 mb-2">By Family Member</h4>
              <div className="flex flex-wrap gap-2">
                {familyMembers.map(member => {
                  const memberId = member.profile_id || member.id;
                  return (
                    <button
                      key={memberId}
                      onClick={() => toggleMember(member)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                        selectedMembers.includes(memberId)
                          ? 'bg-sage text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {member.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RemindersFilter;
