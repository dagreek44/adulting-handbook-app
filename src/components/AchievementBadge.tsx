
import { Trophy, Star, Wrench } from 'lucide-react';

interface AchievementBadgeProps {
  title: string;
  description: string;
  level: number;
  isUnlocked: boolean;
  category: 'diy' | 'contractor' | 'maintenance';
  progress?: number;
}

const AchievementBadge = ({ 
  title, 
  description, 
  level, 
  isUnlocked, 
  category,
  progress = 0 
}: AchievementBadgeProps) => {
  const getIcon = () => {
    switch (category) {
      case 'diy': return Wrench;
      case 'contractor': return Star;
      case 'maintenance': return Trophy;
      default: return Trophy;
    }
  };

  const getColor = () => {
    if (!isUnlocked) return 'bg-gray-200 text-gray-400';
    switch (category) {
      case 'diy': return 'bg-gradient-to-br from-sage to-sage-light text-white';
      case 'contractor': return 'bg-gradient-to-br from-coral to-orange-400 text-white';
      case 'maintenance': return 'bg-gradient-to-br from-blue-soft to-blue-400 text-white';
      default: return 'bg-sage text-white';
    }
  };

  const Icon = getIcon();

  return (
    <div className={`p-4 rounded-xl ${getColor()} ${isUnlocked ? 'shadow-lg' : 'shadow-md'} transition-all duration-300`}>
      <div className="flex items-center justify-between mb-2">
        <Icon className={`w-6 h-6 ${isUnlocked ? '' : 'opacity-50'}`} />
        <span className={`text-sm font-bold ${isUnlocked ? '' : 'opacity-50'}`}>
          Level {level}
        </span>
      </div>
      
      <h3 className={`font-bold mb-1 ${isUnlocked ? '' : 'opacity-50'}`}>
        {title}
      </h3>
      <p className={`text-sm opacity-90 ${isUnlocked ? '' : 'opacity-40'}`}>
        {description}
      </p>
      
      {!isUnlocked && progress > 0 && (
        <div className="mt-3">
          <div className="bg-white/20 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-white h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs mt-1 opacity-70">{progress}% complete</p>
        </div>
      )}
      
      {isUnlocked && (
        <div className="mt-2 text-xs font-medium opacity-90">
          🎉 Unlocked!
        </div>
      )}
    </div>
  );
};

export default AchievementBadge;
