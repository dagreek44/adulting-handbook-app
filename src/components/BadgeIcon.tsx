import { 
  Rocket, 
  Compass, 
  Users, 
  Medal, 
  Award, 
  Star, 
  Crown, 
  Zap, 
  Flame, 
  Calendar, 
  Brain,
  Trophy
} from 'lucide-react';

interface BadgeIconProps {
  icon: string;
  className?: string;
  isUnlocked?: boolean;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  rocket: Rocket,
  compass: Compass,
  users: Users,
  medal: Medal,
  award: Award,
  star: Star,
  crown: Crown,
  zap: Zap,
  flame: Flame,
  calendar: Calendar,
  brain: Brain,
  trophy: Trophy
};

const BadgeIcon = ({ icon, className = '', isUnlocked = true }: BadgeIconProps) => {
  const IconComponent = iconMap[icon] || Trophy;
  
  return (
    <IconComponent 
      className={`${className} ${!isUnlocked ? 'opacity-50' : ''}`} 
    />
  );
};

export default BadgeIcon;
