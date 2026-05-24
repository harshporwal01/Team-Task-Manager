import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  Plus, 
  Trash2, 
  Calendar, 
  Clock, 
  X, 
  UserPlus, 
  AlertCircle,
  Edit2,
  CheckCircle,
  Filter,
  Search,
  UserCheck
} from 'lucide-react';

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterAssignee, setFilterAssignee] = useState('All');

  // Task Modal states
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskPriority, setTaskPriority] = useState('Medium');
  const [taskStatus, setTaskStatus] = useState('To Do');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskError, setTaskError] = useState('');
  const [savingTask, setSavingTask] = useState(false);

  // Add Member Modal states
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState('Member');
  const [memberError, setMemberError] = useState('');
  const [addingMember, setAddingMember] = useState(false);

  const fetchProjectDetails = async () => {
    try {
      const projRes = await api.get(`/projects/${id}/`);
      setProject(projRes.data);
      
      const tasksRes = await api.get(`/tasks/?project=${id}`);
      setTasks(tasksRes.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch project details. Verify you are a member.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectDetails();
  }, [id]);

  const isAdmin = project?.role === 'Admin';

  const handleDeleteProject = async () => {
    if (!window.confirm('Are you absolutely sure you want to delete this project? All tasks will be permanently removed.')) {
      return;
    }
    try {
      await api.delete(`/projects/${id}/`);
      navigate('/projects');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete project.');
    }
  };

  // Drag and Drop implementation
  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;

    // Find task
    const task = tasks.find(t => t.id === parseInt(taskId));
    if (!task) return;

    // If it's already in the same status, do nothing
    if (task.status === targetStatus) return;

    // Permissions check: Members can only update tasks assigned to them
    if (!isAdmin && task.assigned_to !== currentUser.id) {
      alert("You can only move tasks that are assigned to you.");
      return;
    }

    try {
      // Optimistic Update
      setTasks(prevTasks => prevTasks.map(t => t.id === task.id ? { ...t, status: targetStatus } : t));
      
      await api.patch(`/tasks/${task.id}/status/`, { status: targetStatus });
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || 'Failed to update task status.');
      // Revert on error
      fetchProjectDetails();
    }
  };

  // Open Task Modal for Create
  const openCreateTaskModal = () => {
    setEditingTask(null);
    setTaskTitle('');
    setTaskDesc('');
    setTaskDueDate('');
    setTaskPriority('Medium');
    setTaskStatus('To Do');
    setTaskAssignee('');
    setTaskError('');
    setIsTaskModalOpen(true);
  };

  // Open Task Modal for Edit
  const openEditTaskModal = (task) => {
    setEditingTask(task);
    setTaskTitle(task.title);
    setTaskDesc(task.description || '');
    setTaskDueDate(task.due_date ? task.due_date.substring(0, 16) : '');
    setTaskPriority(task.priority);
    setTaskStatus(task.status);
    setTaskAssignee(task.assigned_to || '');
    setTaskError('');
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    setTaskError('');

    if (!taskTitle.trim()) {
      setTaskError('Task title is required.');
      return;
    }

    setSavingTask(true);
    const taskData = {
      project: parseInt(id),
      title: taskTitle,
      description: taskDesc,
      due_date: taskDueDate || null,
      priority: taskPriority,
      status: taskStatus,
      assigned_to: taskAssignee ? parseInt(taskAssignee) : null
    };

    try {
      if (editingTask) {
        // Update task
        let response;
        if (isAdmin) {
          response = await api.put(`/tasks/${editingTask.id}/`, taskData);
        } else {
          // Member can only patch status
          response = await api.patch(`/tasks/${editingTask.id}/status/`, { status: taskStatus });
        }
        setTasks(prevTasks => prevTasks.map(t => t.id === editingTask.id ? response.data : t));
      } else {
        // Create task (Admin only)
        const response = await api.post('/tasks/', taskData);
        setTasks([response.data, ...tasks]);
      }
      setIsTaskModalOpen(false);
    } catch (err) {
      console.error(err);
      setTaskError(err.response?.data?.detail || 'Failed to save task.');
    } finally {
      setSavingTask(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}/`);
      setTasks(prevTasks => prevTasks.filter(t => t.id !== taskId));
      setIsTaskModalOpen(false);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete task.');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setMemberError('');

    if (!memberEmail.trim()) {
      setMemberError('Email address is required.');
      return;
    }

    setAddingMember(true);
    try {
      const response = await api.post(`/projects/${id}/members/`, {
        email: memberEmail,
        role: memberRole
      });
      // Update local members list
      setProject(prevProj => ({
        ...prevProj,
        members: [...prevProj.members, response.data.member]
      }));
      setMemberEmail('');
      setIsMemberModalOpen(false);
    } catch (err) {
      console.error(err);
      if (err.response?.data?.email) {
        setMemberError(err.response.data.email[0]);
      } else {
        setMemberError(err.response?.data?.detail || 'Failed to add member.');
      }
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this collaborator from the project?')) return;
    try {
      await api.delete(`/projects/${id}/members/${userId}/`);
      // Update local members list
      setProject(prevProj => ({
        ...prevProj,
        members: prevProj.members.filter(m => m.user_id !== userId)
      }));
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to remove member.');
    }
  };

  // Filter tasks based on filters
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesPriority = filterPriority === 'All' || task.priority === filterPriority;
    const matchesAssignee = filterAssignee === 'All' || 
                            (filterAssignee === 'Unassigned' && !task.assigned_to) || 
                            (task.assigned_to === parseInt(filterAssignee));
    return matchesSearch && matchesPriority && matchesAssignee;
  });

  const getTasksByStatus = (statusName) => {
    return filteredTasks.filter(t => t.status === statusName);
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

  if (error) {
    return (
      <Sidebar>
        <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700">
          {error}
        </div>
      </Sidebar>
    );
  }

  const columns = ['To Do', 'In Progress', 'Done'];

  return (
    <Sidebar>
      {/* Project Banner Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm mb-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between space-y-4 md:space-y-0">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-md ${
                project.role === 'Admin' ? 'bg-indigo-550 bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-700'
              }`}>
                {project.role}
              </span>
              <span className="text-xs text-slate-400">Created by {project.created_by_name}</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{project.title}</h1>
            <p className="text-slate-500 text-sm max-w-2xl">{project.description || 'No description provided.'}</p>
          </div>

          <div className="flex items-center space-x-3 flex-shrink-0">
            {isAdmin && (
              <button
                onClick={handleDeleteProject}
                className="flex items-center px-4 py-2.5 bg-red-50 border border-red-100 hover:bg-red-100 text-red-700 text-sm font-semibold rounded-xl transition-all"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Project
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter and Collaborators Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Filters */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1 relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-3 text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none text-sm transition-all"
            />
          </div>

          <div className="flex items-center space-x-3">
            <div className="relative">
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="block rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-3 pr-8 text-slate-700 text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="All">All Priorities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <div className="relative">
              <select
                value={filterAssignee}
                onChange={(e) => setFilterAssignee(e.target.value)}
                className="block rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-3 pr-8 text-slate-700 text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="All">All Assignees</option>
                <option value="Unassigned">Unassigned</option>
                {project.members.map(m => (
                  <option key={m.user_id} value={m.user_id}>{m.user_name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Collaborators Headcount Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">Collaborators</h4>
              <p className="text-xs text-slate-400">{project.members.length} team members added</p>
            </div>
          </div>
          <button
            onClick={() => setIsMemberModalOpen(true)}
            className="flex items-center px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-bold rounded-xl transition-all"
          >
            <UserPlus className="mr-1.5 h-3.5 w-3.5" />
            Manage
          </button>
        </div>
      </div>

      {/* Kanban Board Container */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {columns.map((columnStatus) => {
          const columnTasks = getTasksByStatus(columnStatus);
          return (
            <div
              key={columnStatus}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, columnStatus)}
              className="bg-slate-100/70 border border-slate-200/50 rounded-2xl p-4 min-h-[500px] flex flex-col"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4 px-1.5">
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-slate-800 text-sm">{columnStatus}</h3>
                  <span className="inline-flex items-center justify-center h-5 px-1.5 text-xs font-bold text-slate-500 bg-slate-200/70 rounded-md">
                    {columnTasks.length}
                  </span>
                </div>
                {columnStatus === 'To Do' && isAdmin && (
                  <button
                    onClick={openCreateTaskModal}
                    className="p-1 hover:bg-slate-200 text-slate-500 hover:text-indigo-600 rounded-lg transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Tasks List */}
              <div className="space-y-3.5 flex-1 overflow-y-auto max-h-[600px] pr-1">
                {columnTasks.map((task) => {
                  const isAssignedToMe = task.assigned_to === currentUser.id;
                  const canEdit = isAdmin || isAssignedToMe;

                  return (
                    <div
                      key={task.id}
                      draggable={isAdmin || isAssignedToMe}
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onClick={() => openEditTaskModal(task)}
                      className={`bg-white p-4.5 rounded-xl border border-slate-100 shadow-sm cursor-pointer hover:shadow-md hover:border-indigo-100 transition-all select-none p-4 relative ${
                        isAdmin || isAssignedToMe ? 'active:cursor-grabbing' : 'opacity-90'
                      }`}
                    >
                      {/* Priority dot & Edit mark */}
                      <div className="flex justify-between items-center mb-2.5">
                        <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider ${
                          task.priority === 'High' 
                            ? 'bg-red-50 text-red-700' 
                            : task.priority === 'Medium' 
                              ? 'bg-amber-50 text-amber-700' 
                              : 'bg-blue-50 text-blue-700'
                        }`}>
                          {task.priority}
                        </span>
                        {canEdit && (
                          <Edit2 className="h-3 w-3 text-slate-400 group-hover:text-slate-600" />
                        )}
                      </div>

                      <h4 className="font-bold text-slate-800 text-sm leading-snug line-clamp-2">{task.title}</h4>
                      {task.description && (
                        <p className="text-slate-400 text-xs mt-1.5 line-clamp-2">{task.description}</p>
                      )}

                      {/* Task footer: Due date & User avatar */}
                      <div className="mt-4 pt-3.5 border-t border-slate-50 flex items-center justify-between text-slate-400 text-[11px] font-medium">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          <span className={
                            task.due_date && new Date(task.due_date) < new Date() && task.status !== 'Done'
                              ? 'text-red-500 font-semibold'
                              : ''
                          }>
                            {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
                          </span>
                        </div>

                        {task.assigned_to_name ? (
                          <div 
                            title={`Assigned to ${task.assigned_to_name}`} 
                            className="h-6 w-6 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white font-bold text-[10px] flex items-center justify-center shadow-sm"
                          >
                            {task.assigned_to_name[0].toUpperCase()}
                          </div>
                        ) : (
                          <span className="italic text-[10px] text-slate-350">Unassigned</span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {columnTasks.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50/20 text-xs">
                    No tasks here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Creation & Edit Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 animate-scale-in">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">
                {editingTask ? 'Task Details' : 'Create Task'}
              </h3>
              <button
                onClick={() => setIsTaskModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveTask}>
              <div className="p-6 space-y-4">
                {taskError && (
                  <div className="flex items-start bg-red-50 text-red-700 p-3.5 rounded-xl text-sm border border-red-100">
                    <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 text-red-500" />
                    <span>{taskError}</span>
                  </div>
                )}

                {/* Title */}
                <div className="space-y-1.5">
                  <label htmlFor="task-title" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Task Title *
                  </label>
                  <input
                    id="task-title"
                    type="text"
                    required
                    disabled={editingTask && !isAdmin}
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="Task details summary..."
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 px-4 text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label htmlFor="task-desc" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Description
                  </label>
                  <textarea
                    id="task-desc"
                    rows="3"
                    disabled={editingTask && !isAdmin}
                    value={taskDesc}
                    onChange={(e) => setTaskDesc(e.target.value)}
                    placeholder="Task description details..."
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 px-4 text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all resize-none disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>

                {/* Meta details inputs */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Due Date */}
                  <div className="space-y-1.5">
                    <label htmlFor="task-due" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Due Date
                    </label>
                    <input
                      id="task-due"
                      type="datetime-local"
                      disabled={editingTask && !isAdmin}
                      value={taskDueDate}
                      onChange={(e) => setTaskDueDate(e.target.value)}
                      className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 px-3 text-slate-700 focus:border-indigo-500 focus:bg-white focus:outline-none text-sm transition-all disabled:bg-slate-100 disabled:text-slate-500"
                    />
                  </div>

                  {/* Priority */}
                  <div className="space-y-1.5">
                    <label htmlFor="task-pri" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Priority
                    </label>
                    <select
                      id="task-pri"
                      disabled={editingTask && !isAdmin}
                      value={taskPriority}
                      onChange={(e) => setTaskPriority(e.target.value)}
                      className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 px-3 text-slate-700 focus:border-indigo-500 focus:bg-white focus:outline-none text-sm transition-all disabled:bg-slate-100 disabled:text-slate-500"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Assignee */}
                  <div className="space-y-1.5">
                    <label htmlFor="task-ass" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Assigned To
                    </label>
                    <select
                      id="task-ass"
                      disabled={editingTask && !isAdmin}
                      value={taskAssignee}
                      onChange={(e) => setTaskAssignee(e.target.value)}
                      className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 px-3 text-slate-700 focus:border-indigo-500 focus:bg-white focus:outline-none text-sm transition-all disabled:bg-slate-100 disabled:text-slate-500"
                    >
                      <option value="">Unassigned</option>
                      {project.members.map(m => (
                        <option key={m.user_id} value={m.user_id}>{m.user_name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Status */}
                  <div className="space-y-1.5">
                    <label htmlFor="task-sta" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Task Status
                    </label>
                    <select
                      id="task-sta"
                      value={taskStatus}
                      onChange={(e) => setTaskStatus(e.target.value)}
                      className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 px-3 text-slate-700 focus:border-indigo-500 focus:bg-white focus:outline-none text-sm transition-all"
                    >
                      <option value="To Do">To Do</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Done">Done</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Actions footer */}
              <div className="px-6 py-4 bg-slate-50 flex items-center justify-between border-t border-slate-100">
                <div>
                  {editingTask && isAdmin && (
                    <button
                      type="button"
                      onClick={() => handleDeleteTask(editingTask.id)}
                      className="flex items-center text-sm font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 py-2 px-3 rounded-xl transition-all"
                    >
                      <Trash2 className="mr-1.5 h-4 w-4" />
                      Delete Task
                    </button>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsTaskModalOpen(false)}
                    className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100/80 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingTask}
                    className="flex items-center justify-center px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-all"
                  >
                    {savingTask ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member Management overlay / modal */}
      {isMemberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 animate-scale-in">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 flex items-center">
                <Users className="h-5 w-5 mr-2 text-indigo-500" />
                Collaborators List
              </h3>
              <button
                onClick={() => setIsMemberModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Add member form (Admin only) */}
              {isAdmin ? (
                <form onSubmit={handleAddMember} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Add Team Member</h4>
                  {memberError && (
                    <div className="flex items-start bg-red-50 text-red-700 p-3 rounded-xl text-xs border border-red-100">
                      <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0 text-red-500" />
                      <span>{memberError}</span>
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="email"
                      required
                      value={memberEmail}
                      onChange={(e) => setMemberEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 px-3.5 text-slate-800 placeholder-slate-450 focus:border-indigo-500 focus:outline-none text-sm transition-all"
                    />
                    <select
                      value={memberRole}
                      onChange={(e) => setMemberRole(e.target.value)}
                      className="rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-slate-700 text-sm focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Member">Member</option>
                      <option value="Admin">Admin</option>
                    </select>
                    <button
                      type="submit"
                      disabled={addingMember}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition-all shadow-sm flex items-center justify-center"
                    >
                      {addingMember ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      ) : (
                        'Add'
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="bg-slate-50 p-4.5 rounded-2xl text-xs text-slate-500 border border-slate-100">
                  Only project admins can add or remove members.
                </div>
              )}

              {/* Members listing */}
              <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                {project.members.map((member) => (
                  <div key={member.user_id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl transition-all">
                    <div className="flex items-center min-w-0">
                      <div className="h-9 w-9 rounded-full bg-indigo-100 text-indigo-600 font-bold text-sm flex items-center justify-center mr-3 flex-shrink-0">
                        {member.user_name[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{member.user_name}</p>
                        <p className="text-xs text-slate-400 truncate">{member.user_email}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3.5">
                      <span className={`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-md ${
                        member.role === 'Admin' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {member.role}
                      </span>
                      {isAdmin && member.user_email !== project.created_by_email && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(member.user_id)}
                          className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded-lg transition-all"
                          title="Remove collaborator"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </Sidebar>
  );
};

export default ProjectDetails;
