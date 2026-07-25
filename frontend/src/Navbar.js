import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Bell, LogOut, Menu, X, CheckCheck, Layers } from 'lucide-react';
import api, { showToast } from './axios';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role') || 'employee';
  const username = localStorage.getItem('username') || 'User';

  // Poll notifications every 30 seconds
  useEffect(() => {
    if (!token) return;

    const fetchNotifications = async () => {
      try {
        const res = await api.get('/notifications/');
        if (res.data && Array.isArray(res.data)) {
          const mapped = res.data.map((n, idx) => ({
            id: n.notification_id || idx,
            title: 'System Alert',
            description: n.message || 'Notification received',
            date: n.notification_date
          }));
          setNotifications(mapped);
          setUnreadCount(mapped.length);
        }
      } catch (err) {
        console.error('Failed to fetch notifications', err);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);

    return () => clearInterval(interval);
  }, [token]);

  // Click outside handler for dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    showToast('Logged out successfully.');
    navigate('/login');
  };

  const handleNotificationClick = (notifId) => {
    setNotifications(prev => prev.filter(n => n.id !== notifId));
    setUnreadCount(prev => Math.max(0, prev - 1));
    showToast('Notification marked as read');
  };

  const handleReadAll = () => {
    setNotifications([]);
    setUnreadCount(0);
    showToast('All notifications marked as read');
  };

  const handleAvatarClick = () => {
    navigate('/profile');
  };

  if (!token) return null; // Don't show navbar on login/landing if not authenticated

  const menuItems = [
    { name: 'Home', path: '/' },
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'My Task', path: '/my-task' },
    { name: 'Priority', path: '/priority' },
    { name: 'Task Status', path: '/task-status' },
    { name: 'Due Date', path: '/due-date' },
    { name: 'Team Members', path: '/team' },
    ...(role === 'admin' ? [{ name: 'Reports', path: '/reports' }] : []),
    ...(role === 'admin' ? [{ name: 'Manage Users', path: '/manage-users' }] : []),
    { name: 'Settings', path: '/settings' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-[#0f172a] border-b border-slate-800 px-6 py-4 flex items-center justify-between text-slate-100 shadow-xl">
      {/* Brand Logo */}
      <div className="flex items-center gap-3">
        <Link to="/dashboard" className="flex items-center gap-3 no-underline text-white">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Employee Task Tracker
            </h1>
          </div>
        </Link>
      </div>

      {/* Desktop Menu links */}
      <div className="hidden lg:flex items-center gap-6 text-sm font-medium">
        {menuItems.map(item => (
          <Link
            key={item.name}
            to={item.path}
            className={`no-underline hover:text-blue-400 transition-colors ${location.pathname === item.path ? 'text-blue-500 font-bold border-b-2 border-blue-500 pb-1' : 'text-slate-300'
              }`}
          >
            {item.name}
          </Link>
        ))}
      </div>

      {/* Actions (Notifications + Profile + Logout) */}
      <div className="flex items-center gap-4 relative">
        {/* Bell Icon & Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => navigate('/notifications')}
            className="relative p-2 rounded-xl bg-slate-900 border border-slate-850 hover:bg-slate-800 transition-all text-slate-300 hover:text-white"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center border-2 border-[#0f172a]">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown list */}
          {showNotifDropdown && (
            <div className="absolute right-0 mt-3 w-80 rounded-2xl bg-white border border-slate-100 shadow-2xl text-slate-800 overflow-hidden z-50">
              <div className="bg-slate-50 px-4 py-3 flex items-center justify-between border-b border-slate-100">
                <span className="font-bold text-slate-900 text-sm">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleReadAll}
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-center py-8 text-xs text-slate-400">No new notifications</p>
                ) : (
                  notifications.map(notif => (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif.id)}
                      className="px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-0 cursor-pointer transition-all"
                    >
                      <p className="text-xs font-semibold text-slate-800">{notif.title || 'New Notification'}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{notif.description || notif.message || 'Details...'}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar */}
        <button
          onClick={handleAvatarClick}
          className="flex items-center gap-2 p-1.5 pr-3 rounded-xl bg-slate-900 border border-slate-850 hover:bg-slate-800 transition-all"
        >
          <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-xs">
            {username.slice(0, 2).toUpperCase()}
          </div>
          <span className="hidden sm:inline text-xs font-semibold text-slate-300 hover:text-white">
            {username}
          </span>
        </button>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="p-2 rounded-xl bg-slate-900 border border-slate-850 hover:bg-rose-950/20 hover:border-rose-900/30 text-slate-400 hover:text-rose-400 transition-all"
          title="Logout"
        >
          <LogOut className="w-5 h-5" />
        </button>

        {/* Mobile menu trigger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl bg-slate-900 lg:hidden border border-slate-850 text-slate-400 hover:text-white"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="absolute top-16 left-0 right-0 bg-[#0f172a] border-b border-slate-800 p-4 flex flex-col gap-3 lg:hidden z-50">
          {menuItems.map(item => (
            <Link
              key={item.name}
              to={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`no-underline hover:text-blue-400 py-2 px-3 rounded-lg transition-colors text-sm font-semibold ${location.pathname === item.path ? 'bg-blue-600 text-white' : 'text-slate-300'
                }`}
            >
              {item.name}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}

export default Navbar;
