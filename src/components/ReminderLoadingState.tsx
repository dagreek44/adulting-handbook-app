
import React from 'react';

interface ReminderLoadingStateProps {
  loading: boolean;
  reminders: any[];
  children: React.ReactNode;
}

const ReminderLoadingState: React.FC<ReminderLoadingStateProps> = ({
  loading,
  reminders,
  children
}) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage"></div>
        <span className="ml-3 text-gray-600">Loading reminders...</span>
      </div>
    );
  }

  if (reminders.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 mb-4">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
          </svg>
          <p className="text-lg font-medium text-gray-700 mb-2">No reminders yet!</p>
          <p className="text-gray-500">Add your first reminder to get started with home maintenance tracking.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ReminderLoadingState;
