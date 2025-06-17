
import React, { useState } from "react";
import { SupabaseReminder } from '@/hooks/useSupabaseData';
import ContractorServiceSelection from './ContractorServiceSelection';

const ContractorOption = ({
  label,
  description,
  color,
  onClick,
}: {
  label: string;
  description: string;
  color: string;
  onClick: () => void;
}) => (
  <button 
    onClick={onClick}
    className={`w-full p-4 rounded-xl text-left bg-gradient-to-r ${color} shadow-lg mb-4 transition-all hover:scale-105`}
  >
    <div className="font-bold text-lg text-white">{label}</div>
    <div className="text-white/90 text-sm mt-2">{description}</div>
  </button>
);

interface ContractorsViewProps {
  reminders?: SupabaseReminder[];
}

const ContractorsView = ({ reminders = [] }: ContractorsViewProps) => {
  const [selectedService, setSelectedService] = useState<string | null>(null);

  const handleServiceSelect = (serviceType: string) => {
    setSelectedService(serviceType);
  };

  const handleBack = () => {
    setSelectedService(null);
  };

  if (selectedService) {
    return (
      <ContractorServiceSelection
        serviceType={selectedService}
        reminders={reminders}
        onBack={handleBack}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl shadow-md">
        <h3 className="text-xl font-bold text-gray-800 mb-6">How can we help?</h3>
        <ContractorOption
          label="Monthly Reminders"
          description="Let a pro take care of your recurring monthly tasks."
          color="from-blue-soft to-blue-400"
          onClick={() => handleServiceSelect('monthly')}
        />
        <ContractorOption
          label="Quarterly Reminders"
          description="Invite a contractor to handle seasonal check-ups."
          color="from-sage to-sage-light"
          onClick={() => handleServiceSelect('quarterly')}
        />
        <ContractorOption
          label="Yearly Reminders"
          description="Book an annual service for major home systems."
          color="from-coral to-orange-400"
          onClick={() => handleServiceSelect('yearly')}
        />
      </div>

      <div className="bg-gradient-to-br from-sage to-sage-light p-4 rounded-xl text-white">
        <h3 className="text-lg font-bold mb-2">Need a Custom Quote?</h3>
        <p className="text-sm mb-4 opacity-90">
          Post your project details and get multiple bids from verified contractors.
        </p>
        <button 
          onClick={() => window.open('/post-job', '_blank')}
          className="bg-white text-sage py-2 px-4 rounded-lg font-medium hover:bg-gray-100 transition-colors"
        >
          Request a Quote
        </button>
      </div>
    </div>
  );
};

export default ContractorsView;
