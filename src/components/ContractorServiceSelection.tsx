
import { useState } from 'react';
import { ArrowLeft, Check, DollarSign } from 'lucide-react';
import { SupabaseReminder } from '@/hooks/useSupabaseData';

interface ContractorServiceSelectionProps {
  serviceType: string;
  reminders: SupabaseReminder[];
  onBack: () => void;
}

const ContractorServiceSelection = ({ serviceType, reminders, onBack }: ContractorServiceSelectionProps) => {
  const [selectedReminders, setSelectedReminders] = useState<string[]>([]);

  // Filter reminders based on service type
  const getRelevantReminders = () => {
    switch (serviceType) {
      case 'monthly':
        return reminders.filter(r => r.frequency === 'monthly');
      case 'quarterly':
        return reminders.filter(r => r.frequency === 'quarterly' || r.frequency === 'seasonally');
      case 'yearly':
        return reminders.filter(r => r.frequency === 'yearly');
      default:
        return reminders;
    }
  };

  const relevantReminders = getRelevantReminders();

  const toggleReminder = (reminderId: string) => {
    setSelectedReminders(prev =>
      prev.includes(reminderId)
        ? prev.filter(id => id !== reminderId)
        : [...prev, reminderId]
    );
  };

  // Calculate estimated price based on selected reminders
  const calculatePrice = () => {
    const basePrice = selectedReminders.length * 50;
    const serviceMultiplier = serviceType === 'yearly' ? 1.5 : serviceType === 'quarterly' ? 1.2 : 1;
    return Math.round(basePrice * serviceMultiplier);
  };

  const getServiceTitle = () => {
    switch (serviceType) {
      case 'monthly':
        return 'Monthly Service Package';
      case 'quarterly':
        return 'Quarterly Service Package';
      case 'yearly':
        return 'Annual Service Package';
      default:
        return 'Service Package';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl shadow-md">
        <div className="flex items-center mb-4">
          <button
            onClick={onBack}
            className="mr-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h3 className="text-xl font-bold text-gray-800">{getServiceTitle()}</h3>
        </div>

        <p className="text-gray-600 mb-6">
          Select the maintenance tasks you'd like our contractors to handle for you:
        </p>

        <div className="space-y-3 mb-6">
          {relevantReminders.map(reminder => (
            <div
              key={reminder.id}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                selectedReminders.includes(reminder.id)
                  ? 'border-sage bg-sage/10'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => toggleReminder(reminder.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <h4 className="font-semibold text-gray-800">{reminder.title}</h4>
                    {selectedReminders.includes(reminder.id) && (
                      <Check className="w-5 h-5 text-sage ml-2" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{reminder.description}</p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>⏱️ {reminder.estimated_time}</span>
                    <span>💪 {reminder.difficulty}</span>
                    <span>💰 {reminder.estimated_budget}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {relevantReminders.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No reminders found for this service type.</p>
            <p className="text-sm mt-2">You can add custom reminders that match this frequency.</p>
          </div>
        )}
      </div>

      {selectedReminders.length > 0 && (
        <div className="bg-gradient-to-br from-sage to-sage-light p-4 rounded-xl text-white">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-lg">Service Summary</h4>
            <div className="flex items-center">
              <DollarSign className="w-5 h-5 mr-1" />
              <span className="text-xl font-bold">{calculatePrice()}</span>
              <span className="text-sm ml-1">/{serviceType}</span>
            </div>
          </div>
          
          <p className="text-sm opacity-90 mb-4">
            {selectedReminders.length} task{selectedReminders.length !== 1 ? 's' : ''} selected
          </p>
          
          <div className="space-y-2">
            <button className="w-full bg-white text-sage py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors">
              Request Quote from Contractors
            </button>
            <button 
              onClick={onBack}
              className="w-full bg-white/20 text-white py-2 rounded-lg font-medium hover:bg-white/30 transition-colors"
            >
              Back to Services
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractorServiceSelection;
