import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  User, 
  Mail, 
  Calendar, 
  Layers, 
  CheckSquare, 
  Clock, 
  AlertTriangle,
  FolderOpen
} from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAssignedTasks = async () => {
    if (!user) return;
    try {
      const response = await api.get(`/tasks/?assigned_to=${user.id}`);
      setAssignedTasks(response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch assigned tasks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedTasks();
  }, [user]);

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      // Optimistic Update
      setAssignedTasks(prevTasks =>
        prevTasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t)
      );
      
      await api.patch(`/tasks/${taskId}/status/`, { status: newStatus });
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || 'Failed to update task status.');
      fetchAssignedTasks(); // Revert
    }
  };

  if (loading) {
    return (
      <Sidebar>
        <div className="flex h-[calc(100vh-120px)] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
        </div>
      </Sidebar>
    );
  }

  // Group metrics
  const todoTasks = assignedTasks.filter(t => t.status === 'To Do');
  const progressTasks = assignedTasks.filter(t => t.status === 'In Progress');
  const doneTasks = assignedTasks.filter(t => t.status === 'Done');

  // Overdue count
  const overdueCount = assignedTasks.filter(t => 
    t.due_date && new Date(t.due_date) < new Date() && t.status !== 'Done'
  ).length;

  return (
    <Sidebar>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Profile</h1>
        <p className="text-slate-500 mt-1">Manage your account and track your assigned work</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left side: Profile details card */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col items-center text-center">
            {/* Huge Avatar */}
            <div className="h-24 w-24 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white text-3xl shadow-md mb-4 ring-4 ring-indigo-50">
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            
            <h2 className="text-xl font-bold text-slate-800">{user?.name}</h2>
            <p className="text-slate-400 text-sm">{user?.email}</p>

            <div className="w-full mt-6 space-y-4 text-left border-t border-slate-50 pt-5 text-sm">
              <div className="flex items-center text-slate-600">
                <Mail className="h-4.5 w-4.5 text-slate-400 mr-3" />
                <span>{user?.email}</span>
              </div>
              <div className="flex items-center text-slate-600">
                <Calendar className="h-4.5 w-4.5 text-slate-400 mr-3" />
                <span>Joined {new Date(user?.date_joined).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics stats */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">My Task Stats</h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-xs text-slate-400 font-semibold uppercase">Assigned</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{assignedTasks.length}</p>
              </div>
              <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
                <p className="text-xs text-slate-400 font-semibold uppercase">Completed</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{doneTasks.length}</p>
              </div>
              <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100">
                <p className="text-xs text-slate-400 font-semibold uppercase">In Progress</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">{progressTasks.length}</p>
              </div>
              <div className={`p-4 rounded-2xl border ${
                overdueCount > 0 ? 'bg-red-50/50 border-red-100' : 'bg-slate-50 border-slate-100'
              }`}>
                <p className="text-xs text-slate-400 font-semibold uppercase">Overdue</p>
                <p className={`text-2xl font-bold mt-1 ${overdueCount > 0 ? 'text-red-600' : 'text-slate-800'}`}>{overdueCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side: List of assigned tasks */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden min-h-[500px]">
            <div className="px-6 py-5 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 flex items-center">
                <CheckSquare className="h-5 w-5 text-indigo-500 mr-2" />
                Tasks Assigned to Me
              </h3>
              <p className="text-xs text-slate-400 mt-1">Directly update status for tasks assigned to you</p>
            </div>

            {error && (
              <div className="m-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                {error}
              </div>
            )}

            {assignedTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400 h-[400px]">
                <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 mb-3">
                  <CheckSquare className="h-6 w-6 text-slate-400" />
                </div>
                <p className="font-semibold text-slate-700">No tasks assigned</p>
                <p className="text-xs text-slate-450 mt-1">When tasks are assigned to you within projects, they'll show up here.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {assignedTasks.map((task) => {
                  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'Done';
                  return (
                    <div key={task.id} className="p-6 hover:bg-slate-50/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center space-x-2.5">
                          <span className={`inline-flex px-2 py-0.5 text-[9px] font-bold rounded-md uppercase tracking-wider ${
                            task.priority === 'High' 
                              ? 'bg-red-50 text-red-700' 
                              : task.priority === 'Medium' 
                                ? 'bg-amber-50 text-amber-700' 
                                : 'bg-blue-50 text-blue-700'
                          }`}>
                            {task.priority}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold flex items-center">
                            <FolderOpen className="h-3 w-3 mr-1" />
                            {task.project_title}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-800 text-sm truncate max-w-md">{task.title}</h4>
                        {task.description && (
                          <p className="text-slate-450 text-xs truncate max-w-md">{task.description}</p>
                        )}
                        {task.due_date && (
                          <div className="flex items-center text-xs text-slate-450 mt-1">
                            <Clock className={`h-3.5 w-3.5 mr-1.5 ${isOverdue ? 'text-red-500' : 'text-slate-400'}`} />
                            <span className={isOverdue ? 'text-red-500 font-semibold' : ''}>
                              Due {new Date(task.due_date).toLocaleDateString()} {isOverdue && '(Overdue)'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Status select editor */}
                      <div className="flex-shrink-0">
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value)}
                          className={`block rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer ${
                            task.status === 'Done'
                              ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
                              : task.status === 'In Progress'
                                ? 'text-amber-700 bg-amber-50 border-amber-100'
                                : 'text-slate-600 bg-slate-50'
                          }`}
                        >
                          <option value="To Do">To Do</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Done">Done</option>
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </Sidebar>
  );
};

export default Profile;
