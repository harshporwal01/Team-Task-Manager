import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { 
  CheckCircle2, 
  Clock, 
  Users, 
  AlertTriangle, 
  Calendar,
  Layers,
  ArrowUpRight,
  RefreshCw
} from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/dashboard/');
      setStats(response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <Sidebar>
        <div className="flex h-[calc(100vh-120px)] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
        </div>
      </Sidebar>
    );
  }

  if (error) {
    return (
      <Sidebar>
        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button 
            onClick={fetchStats}
            className="flex items-center text-sm font-semibold hover:underline"
          >
            <RefreshCw className="mr-1.5 h-4 w-4" /> Try Again
          </button>
        </div>
      </Sidebar>
    );
  }

  const {
    total_tasks,
    tasks_by_status,
    overdue_tasks,
    tasks_per_user,
    recently_updated_tasks
  } = stats;

  const doneCount = tasks_by_status?.['Done'] || 0;
  const completionPercentage = total_tasks > 0 ? Math.round((doneCount / total_tasks) * 100) : 0;

  return (
    <Sidebar>
      {/* Upper header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Overview</h1>
          <p className="text-slate-500 mt-1">Real-time team performance and project statistics</p>
        </div>
        <button
          onClick={fetchStats}
          className="flex items-center px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-xl shadow-sm transition-all active:scale-95"
        >
          <RefreshCw className="mr-2 h-4 w-4 text-slate-500" />
          Refresh
        </button>
      </div>

      {/* Grid of Metric Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {/* Card 1: Total Tasks */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between transition-transform hover:-translate-y-0.5 duration-200">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Tasks</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{total_tasks}</h3>
            <span className="text-xs text-indigo-500 font-medium flex items-center mt-1">
              Active in workspace
            </span>
          </div>
          <div className="h-12 w-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <Layers className="h-6 w-6" />
          </div>
        </div>

        {/* Card 2: Tasks by Status */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between transition-transform hover:-translate-y-0.5 duration-200">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">In Progress</p>
            <h3 className="text-2xl font-bold text-amber-600 mt-1">{tasks_by_status?.['In Progress'] || 0}</h3>
            <span className="text-xs text-slate-500 font-medium flex items-center mt-1">
              To Do: {tasks_by_status?.['To Do'] || 0}
            </span>
          </div>
          <div className="h-12 w-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <Clock className="h-6 w-6" />
          </div>
        </div>

        {/* Card 3: Completed Tasks */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between transition-transform hover:-translate-y-0.5 duration-200">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Completed</p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">{doneCount}</h3>
            <span className="text-xs text-emerald-600 font-semibold flex items-center mt-1">
              {completionPercentage}% completion rate
            </span>
          </div>
          <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>

        {/* Card 4: Overdue Tasks */}
        <div className={`p-6 rounded-2xl border shadow-sm flex items-center justify-between transition-transform hover:-translate-y-0.5 duration-200 ${
          overdue_tasks > 0 
            ? 'bg-red-50/55 border-red-100 text-red-900' 
            : 'bg-white border-slate-100 text-slate-900'
        }`}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Overdue Tasks</p>
            <h3 className={`text-2xl font-bold mt-1 ${overdue_tasks > 0 ? 'text-red-600' : 'text-slate-900'}`}>{overdue_tasks}</h3>
            <span className={`text-xs font-medium flex items-center mt-1 ${overdue_tasks > 0 ? 'text-red-500' : 'text-slate-500'}`}>
              Requires attention
            </span>
          </div>
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
            overdue_tasks > 0 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-slate-50 text-slate-500'
          }`}>
            <AlertTriangle className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Main dashboard content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        
        {/* Left/Middle: Interactive Stats charts & metrics */}
        <div className="lg:col-span-2 space-y-8">
          {/* Progress circle box */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center justify-between">
            <div className="mb-6 sm:mb-0 space-y-2">
              <h4 className="text-lg font-bold text-slate-800">Sprint Completion</h4>
              <p className="text-sm text-slate-500 max-w-sm">
                This shows the percentage of tasks marked as 'Done' in all projects you collaborate on.
              </p>
              <div className="flex space-x-4 pt-2">
                <div className="flex items-center text-xs text-slate-500">
                  <div className="h-3 w-3 bg-emerald-500 rounded-full mr-1.5"></div> Done ({doneCount})
                </div>
                <div className="flex items-center text-xs text-slate-500">
                  <div className="h-3 w-3 bg-indigo-500 rounded-full mr-1.5"></div> Remaining ({total_tasks - doneCount})
                </div>
              </div>
            </div>
            {/* Circular SVG progress wheel */}
            <div className="relative h-32 w-32 flex items-center justify-center flex-shrink-0">
              <svg className="absolute w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="52"
                  strokeWidth="8"
                  stroke="#f1f5f9"
                  fill="transparent"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="52"
                  strokeWidth="8"
                  stroke="#10b981"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 52}
                  strokeDashoffset={2 * Math.PI * 52 * (1 - completionPercentage / 100)}
                  strokeLinecap="round"
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <span className="text-2xl font-extrabold text-slate-800">{completionPercentage}%</span>
            </div>
          </div>

          {/* Recently updated tasks */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h4 className="text-lg font-bold text-slate-800">Recently Updated Tasks</h4>
              <span className="text-xs text-slate-400">Latest activity</span>
            </div>
            
            {recently_updated_tasks && recently_updated_tasks.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                      <th className="px-6 py-3.5">Task</th>
                      <th className="px-6 py-3.5">Project</th>
                      <th className="px-6 py-3.5">Assignee</th>
                      <th className="px-6 py-3.5">Priority</th>
                      <th className="px-6 py-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {recently_updated_tasks.map((task) => (
                      <tr key={task.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-800 truncate max-w-xs">{task.title}</p>
                          {task.due_date && (
                            <span className="flex items-center text-xs text-slate-400 mt-1">
                              <Calendar className="h-3 w-3 mr-1" />
                              {new Date(task.due_date).toLocaleDateString()}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-medium">{task.project_title}</td>
                        <td className="px-6 py-4">
                          {task.assigned_to_name ? (
                            <div className="flex items-center">
                              <div className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-600 font-bold text-xs flex items-center justify-center mr-2">
                                {task.assigned_to_name[0].toUpperCase()}
                              </div>
                              <span className="text-slate-700 truncate max-w-[120px]">{task.assigned_to_name}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-md ${
                            task.priority === 'High' 
                              ? 'bg-red-50 text-red-700' 
                              : task.priority === 'Medium' 
                                ? 'bg-amber-50 text-amber-700' 
                                : 'bg-blue-50 text-blue-700'
                          }`}>
                            {task.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            task.status === 'Done' 
                              ? 'bg-emerald-50 text-emerald-700' 
                              : task.status === 'In Progress' 
                                ? 'bg-amber-50 text-amber-700' 
                                : 'bg-slate-100 text-slate-600'
                          }`}>
                            {task.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400">
                No recent task activity found.
              </div>
            )}
          </div>
        </div>

        {/* Right side: Tasks per user list */}
        <div className="space-y-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h4 className="text-lg font-bold text-slate-800 mb-5 flex items-center">
              <Users className="h-5 w-5 text-slate-500 mr-2" />
              Task Load Distribution
            </h4>
            
            {tasks_per_user && tasks_per_user.length > 0 ? (
              <div className="space-y-4">
                {tasks_per_user.map((userStats) => (
                  <div key={userStats.user_id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl transition-all">
                    <div className="flex items-center min-w-0">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow-sm mr-3 flex-shrink-0">
                        {userStats.user_name ? userStats.user_name[0].toUpperCase() : 'U'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{userStats.user_name}</p>
                        <p className="text-xs text-slate-400 truncate">{userStats.user_email}</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center justify-center px-3 py-1 text-xs font-bold text-indigo-600 bg-indigo-50 rounded-full">
                      {userStats.count} {userStats.count === 1 ? 'task' : 'tasks'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 text-sm">
                No tasks assigned to users yet.
              </div>
            )}
          </div>
        </div>

      </div>
    </Sidebar>
  );
};

export default Dashboard;
