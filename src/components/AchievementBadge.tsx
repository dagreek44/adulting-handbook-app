import BadgeIcon from './BadgeIcon';

interface AchievementBadgeProps {
  name: string;
  description: string;
  category: 'starter' | 'completion' | 'streak';
  icon: string;
  maxProgress: number;
  progress: number;
  isUnlocked: boolean;
  unlockedAt?: string | null;
}

const AchievementBadge = ({ 
  name, 
  description, 
  category,
  icon,
  maxProgress,
  progress,
  isUnlocked,
  unlockedAt
}: AchievementBadgeProps) => {
  const getColor = () => {
    if (!isUnlocked) return 'bg-muted text-muted-foreground';
    switch (category) {
      case 'starter': return 'bg-gradient-to-br from-sage to-sage-light text-primary-foreground';
      case 'completion': return 'bg-gradient-to-br from-coral to-orange-400 text-primary-foreground';
      case 'streak': return 'bg-gradient-to-br from-blue-soft to-blue-400 text-primary-foreground';
      default: return 'bg-sage text-primary-foreground';
    }
  };

  const getCategoryLabel = () => {
    switch (category) {
      case 'starter': return 'Starter';
      case 'completion': return 'Completion';
      case 'streak': return 'Streak';
      default: return '';
    }
  };

  const progressPercent = Math.min((progress / maxProgress) * 100, 100);

  return (
    <div className={`p-4 rounded-xl ${getColor()} ${isUnlocked ? 'shadow-lg' : 'shadow-md'} transition-all duration-300`}>
      <div className="flex items-center justify-between mb-2">
        <BadgeIcon icon={icon} className="w-6 h-6" isUnlocked={isUnlocked} />
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${isUnlocked ? 'bg-white/20' : 'bg-background/20'}`}>
          {getCategoryLabel()}
        </span>
      </div>
      
      <h3 className={`font-bold mb-1 ${isUnlocked ? '' : 'opacity-60'}`}>
        {name}
      </h3>
      <p className={`text-sm ${isUnlocked ? 'opacity-90' : 'opacity-50'}`}>
        {description}
      </p>
      
      {!isUnlocked && (
        <div className="mt-3">
          <div className="bg-background/20 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-foreground/60 h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-xs mt-1 opacity-70">
            {progress}/{maxProgress} ({Math.round(progressPercent)}%)
          </p>
        </div>
      )}
      
      {isUnlocked && (
        <div className="mt-2 text-xs font-medium opacity-90 flex items-center gap-1">
          <span>🎉</span>
          <span>Unlocked{unlockedAt ? ` on ${new Date(unlockedAt).toLocaleDateString()}` : '!'}</span>
        </div>
      )}
    </div>
  );
};

export default AchievementBadge;
