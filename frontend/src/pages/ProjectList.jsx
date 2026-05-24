import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { 
  FolderPlus, 
  Folder, 
  Users, 
  CheckSquare, 
  Plus, 
  X, 
  AlertCircle,
  ChevronRight
} from 'lucide-react';

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Project Creation Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [modalError, setModalError] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchProjects = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/projects/');
      setProjects(response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch projects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setModalError('');

    if (!newTitle.trim()) {
      setModalError('Project title is required.');
      return;
    }

    setCreating(true);
    try {
      const response = await api.post('/projects/', {
        title: newTitle,
        description: newDescription
      });
      // Prepend the new project to the list
      setProjects([response.data, ...projects]);
      
      // Reset form
      setNewTitle('');
      setNewDescription('');
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      setModalError(err.response?.data?.detail || 'Failed to create project.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Sidebar>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Projects</h1>
          <p className="text-slate-500 mt-1">Manage and collaborate on team workspace boards</p>
        </div>
        <button
          onClick={() => setIsOpen => setIsModalOpen(true)}
          className="flex items-center justify-center px-4 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-indigo-500/10 hover:shadow-indigo-500/25 transition-all duration-150 active:scale-[0.98]"
        >
          <FolderPlus className="mr-2 h-4 w-4" />
          New Project
        </button>
      </div>

      {/* Main Grid View */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
          {error}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-100 shadow-sm text-center">
          <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 mb-4 border border-slate-100">
            <Folder className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No projects yet</h3>
          <p className="text-slate-500 text-sm max-w-sm mt-1">
            Create your first project board and add members to start collaborating on tasks.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-5 flex items-center px-4 py-2.5 bg-indigo-550 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition-all shadow-sm"
          >
            <Plus className="mr-2 h-4 w-4" /> Create Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="group block bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 p-6 transition-all duration-200"
            >
              <div className="flex justify-between items-start">
                <div className="h-11 w-11 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-200">
                  <Folder className="h-5 w-5" />
                </div>
                <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-md ${
                  project.role === 'Admin' 
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' 
                    : 'bg-slate-100 text-slate-700'
                }`}>
                  {project.role || 'Member'}
                </span>
              </div>

              <div className="mt-4">
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">{project.title}</h3>
                <p className="text-slate-500 text-sm mt-1 line-clamp-2 min-h-[40px]">{project.description || 'No description provided.'}</p>
              </div>

              <div className="mt-6 pt-5 border-t border-slate-50 flex items-center justify-between text-slate-400 text-xs font-medium">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center">
                    <Users className="h-4 w-4 mr-1.5 text-slate-400" />
                    {project.members_count}
                  </span>
                  <span className="flex items-center">
                    <CheckSquare className="h-4 w-4 mr-1.5 text-slate-400" />
                    {project.tasks_count}
                  </span>
                </div>
                <span className="flex items-center text-indigo-600 font-semibold group-hover:translate-x-0.5 transition-transform">
                  View Board
                  <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Project Creation Dialog / Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 animate-scale-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-55 border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">Create New Project</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateProject}>
              <div className="p-6 space-y-4">
                {modalError && (
                  <div className="flex items-start bg-red-50 text-red-700 p-3.5 rounded-xl text-sm border border-red-100">
                    <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 text-red-500" />
                    <span>{modalError}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label htmlFor="proj-title" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Project Title *
                  </label>
                  <input
                    id="proj-title"
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Website Redesign"
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 px-4 text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="proj-desc" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Description
                  </label>
                  <textarea
                    id="proj-desc"
                    rows="4"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Provide a summary of the project goals..."
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 px-4 text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all resize-none"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="px-6 py-4 bg-slate-50 flex items-center justify-end space-x-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100/80 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex items-center justify-center px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-all disabled:opacity-50"
                >
                  {creating ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  ) : (
                    'Create Project'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Sidebar>
  );
};

export default ProjectList;
