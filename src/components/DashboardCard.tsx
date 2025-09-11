
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface DashboardCardProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  color: string;
  onClick: () => void;
  badge?: number;
}

const DashboardCard = ({ title, subtitle, icon: Icon, color, onClick, badge }: DashboardCardProps) => {
  return (
    <div 
      onClick={onClick}
      className={`${color} p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-[1.02] relative`}
    >
      {badge && (
        <div className="absolute -top-2 -right-2 bg-coral text-primary-foreground text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-bounce-in">
          {badge}
        </div>
      )}
      <div className="flex items-center justify-between mb-3">
        <Icon className="w-8 h-8 text-primary-foreground" />
      </div>
      <h3 className="text-primary-foreground font-bold text-lg mb-1">{title}</h3>
      <p className="text-primary-foreground/80 text-sm">{subtitle}</p>
    </div>
  );
};

export default DashboardCard;
