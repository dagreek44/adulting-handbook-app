
import { CheckCircle2, Trophy, Calendar } from 'lucide-react';
import { CompletedTask } from '@/hooks/useSupabaseData';
import { format } from 'date-fns';

interface CompletedTasksViewProps {
  completedTasks: CompletedTask[];
}

const CompletedTasksView = ({ completedTasks }: CompletedTasksViewProps) => {
  if (completedTasks.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">Recently Completed Tasks</h2>
        <div className="bg-white p-8 rounded-xl shadow-md text-center">
          <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No completed tasks yet</h3>
          <p className="text-gray-500">Complete some tasks to see them here!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Recently Completed Tasks</h2>
      <div className="bg-white p-4 rounded-xl shadow-md">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <Trophy className="w-6 h-6 mr-2 text-sage" />
          Recent Achievements
        </h3>
        <div className="space-y-4">
          {completedTasks.map((task) => (
            <div
              key={task.id}
              className="bg-green-50 p-4 rounded-xl border-l-4 border-l-green-500"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800 mb-1 flex items-center">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mr-2" />
                    {task.title}
                  </h4>
                  <p className="text-gray-600 text-sm mb-2">{task.description}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {task.difficulty}
                  </span>
                  <span className="text-xs text-gray-500">{task.estimated_time}</span>
                  {task.estimated_budget && (
                    <span className="text-xs text-gray-500">{task.estimated_budget}</span>
                  )}
                </div>
                <div className="flex items-center text-gray-500">
                  <Calendar className="w-4 h-4 mr-1" />
                  <span className="text-xs">
                    Completed {format(new Date(task.completed_date), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CompletedTasksView;
