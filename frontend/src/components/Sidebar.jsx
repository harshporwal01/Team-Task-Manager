import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  FolderKanban, 
  UserCircle, 
  LogOut, 
  Menu, 
  X,
  Zap
} from 'lucide-react';

const Sidebar = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Projects', path: '/projects', icon: FolderKanban },
    { name: 'Profile', path: '/profile', icon: UserCircle },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64 sidebar-gradient text-slate-100 border-r border-indigo-950/20">
          {/* Logo */}
          <div className="flex items-center h-16 px-6 bg-indigo-950/40 border-b border-indigo-900/30">
            <Zap className="h-6 w-6 text-indigo-400 fill-indigo-400 mr-2" />
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">TaskManager</span>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group ${
                    isActive
                      ? 'bg-indigo-600/90 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'
                  }`
                }
              >
                <item.icon className="mr-3.5 h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-105" />
                {item.name}
              </NavLink>
            ))}
          </nav>

          {/* User Profile Card & Logout */}
          <div className="p-4 bg-indigo-950/30 border-t border-indigo-900/25">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center min-w-0">
                <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white shadow-sm flex-shrink-0">
                  {user?.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                <div className="ml-3 min-w-0">
                  <p className="text-sm font-semibold text-slate-100 truncate">{user?.name}</p>
                  <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2.5 text-sm font-medium text-red-200 hover:text-white bg-red-950/20 hover:bg-red-900/40 rounded-xl transition-colors duration-150 border border-red-900/20"
            >
              <LogOut className="mr-3 h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer and Header */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="flex md:hidden items-center justify-between h-16 px-4 bg-indigo-950 text-white flex-shrink-0 shadow-md">
          <div className="flex items-center">
            <Zap className="h-6 w-6 text-indigo-400 fill-indigo-400 mr-2" />
            <span className="text-lg font-bold">TaskManager</span>
          </div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 rounded-lg hover:bg-indigo-900 focus:outline-none transition-colors"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </header>

        {/* Mobile Drawer (Overlay and Menu) */}
        {isOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden bg-slate-900/60 backdrop-blur-sm transition-opacity">
            <div className="relative flex flex-col w-72 max-w-xs h-full sidebar-gradient text-slate-100 animate-slide-in shadow-2xl">
              <div className="flex items-center justify-between h-16 px-6 bg-indigo-950/40 border-b border-indigo-900/30">
                <div className="flex items-center">
                  <Zap className="h-5 w-5 text-indigo-400 fill-indigo-400 mr-2" />
                  <span className="text-lg font-bold">TaskManager</span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
                {navItems.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'
                      }`
                    }
                  >
                    <item.icon className="mr-3.5 h-5 w-5 flex-shrink-0" />
                    {item.name}
                  </NavLink>
                ))}
              </nav>

              <div className="p-4 bg-indigo-950/30 border-t border-indigo-900/25">
                <div className="flex items-center min-w-0 mb-4">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white">
                    {user?.name ? user.name[0].toUpperCase() : 'U'}
                  </div>
                  <div className="ml-3 min-w-0">
                    <p className="text-sm font-semibold text-slate-100 truncate">{user?.name}</p>
                    <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-2.5 text-sm font-medium text-red-200 hover:text-white bg-red-950/20 hover:bg-red-900/40 rounded-xl transition-colors border border-red-900/20"
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto relative focus:outline-none bg-slate-50/50">
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Sidebar;
