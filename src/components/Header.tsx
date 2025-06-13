
import { useState } from 'react';
import { House, Wrench, Flame } from 'lucide-react';

const Header = () => {
  const [adultingLevel] = useState(3);
  const [adultingProgress] = useState(65);

  return (
    <div className="bg-gradient-to-r from-sage to-sage-light p-6 rounded-b-3xl shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Adulting</h1>
          <p className="text-white/90 text-sm italic">Because life doesn't come with a manual.</p>
        </div>
        <div className="text-right">
          <div className="text-white/90 text-xs uppercase tracking-wide mb-1">Level {adultingLevel}</div>
          <div className="text-2xl">🏆</div>
        </div>
      </div>
      
      <div className="bg-white/20 rounded-full p-1 mb-4">
        <div className="bg-white rounded-full p-2 flex items-center justify-between">
          <span className="text-sage font-semibold text-sm">Adulting Progress</span>
          <span className="text-sage font-bold">{adultingProgress}%</span>
        </div>
      </div>
      
      <div className="bg-white/10 rounded-full h-3 overflow-hidden">
        <div 
          className="bg-coral h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${adultingProgress}%` }}
        />
      </div>
    </div>
  );
};

export default Header;
