
import { House, Wrench, Flame } from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Navigation = ({ activeTab, onTabChange }: NavigationProps) => {
  const tabs = [
    { id: 'home', label: 'Home', icon: House },
    { id: 'reminders', label: 'Reminders', icon: Wrench },
    { id: 'contractors', label: 'Contractors', icon: Flame },
  ];

  return (
    <div className="bg-white border-t border-gray-200 px-4 py-2">
      <div className="flex justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              data-tour={tab.id === 'reminders' ? 'reminders-tab' : undefined}
              className={`flex flex-col items-center py-2 px-4 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'bg-sage text-white' 
                  : 'text-gray-500 hover:text-sage'
              }`}
            >
              <Icon className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Navigation;
