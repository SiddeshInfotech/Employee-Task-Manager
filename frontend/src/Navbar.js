import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Bell, LogOut, Menu, X, CheckCheck, Layers, LayoutDashboard, Home, Users, CheckSquare, AlertCircle, BarChart3, Calendar, Settings as SettingsIcon } from 'lucide-react';
import api, { showToast } from './axios';
import { useTranslation } from 'react-i18next';

function Navbar() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role') || 'employee';
  const username = localStorage.getItem('username') || 'User';

  const isAdmin = role.toLowerCase() === 'admin';

  const isNotifForCurrentUser = (n) => {
    if (isAdmin) return true;
    const username = (localStorage.getItem('username') || '').toLowerCase();
    const userId = localStorage.getItem('userId') || localStorage.getItem('user_id') || localStorage.getItem('employee_id');
    const empIdStr = n.employee_id !== undefined && n.employee_id !== null ? String(n.employee_id) : (n.user_id !== undefined && n.user_id !== null ? String(n.user_id) : '');
    const recipient = (n.recipient || n.username || n.employee_name || n.target_user || '').toLowerCase();
    const messageStr = (n.description || n.message || n.title || '').toLowerCase();

    if (userId && empIdStr !== '' && empIdStr === String(userId)) return true;
    if (username && recipient.length > 0 && (recipient.includes(username) || username.includes(recipient))) return true;
    if (username && messageStr.includes(username)) return true;
    if (!empIdStr && !recipient) return true;
    return false;
  };

  const isNotifDeleted = (notif, deletedSet) => {
    const idStr = String(notif.id || notif.notification_id || '');
    return idStr && deletedSet.has(idStr);
  };

  useEffect(() => {
    if (!token) return;

    const fetchNotifications = async () => {
      const deletedSet = new Set(JSON.parse(localStorage.getItem('deletedNotificationIds') || '[]').map(String));
      const localNotifs = JSON.parse(localStorage.getItem('myNotifications') || '[]');

      let fetched = [];
      try {
        const res = await api.get('/notifications/');
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          fetched = res.data.map((n, idx) => ({
            id: n.notification_id || n.id || idx + 100,
            employee_id: n.employee_id || n.user_id,
            recipient: n.recipient || n.employee_name,
            title: n.title || 'System Alert',
            description: n.message || n.description || 'Notification received',
            date: n.notification_date
          }));
        }
      } catch (err) {
        console.warn('Failed to fetch notifications from API:', err);
      }

      const seen = new Set();
      const combined = [];
      [...localNotifs, ...fetched].forEach(n => {
        const idKey = String(n.id || n.notification_id || `${n.title}_${n.description}`);
        if (!seen.has(idKey)) {
          seen.add(idKey);
          combined.push(n);
        }
      });

      if (combined.length === 0 && localStorage.getItem('allNotificationsCleared') !== 'true') {
        const defaults = [
          { id: 1, title: 'New Task Assigned: Design Homepage Layout', description: 'Assigned by Emma Brown. 5m ago' },
          { id: 2, title: 'Project Deadline Tomorrow: CRM Update', description: 'Due on Apr 25. 20m ago' },
          { id: 3, title: 'Task Completed: Data Analysis Report', description: 'Completed by Alex Smith. 1 hour ago' },
          { id: 4, title: 'You have been added to: Marketing Strategy Team', description: 'Assigned by Sarah Lee. 2 hours ago' },
          { id: 5, title: 'New Task Assigned: Create Monthly Report', description: 'Assigned by David Johnson. 1 day ago' },
        ];
        combined.push(...defaults);
      }

      const filtered = combined.filter(n => !isNotifDeleted(n, deletedSet) && isNotifForCurrentUser(n));
      setNotifications(filtered);
      setUnreadCount(filtered.length);
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);

    return () => clearInterval(interval);
  }, [token]);

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

  const markDeletedInStorage = (items) => {
    const deleted = JSON.parse(localStorage.getItem('deletedNotificationIds') || '[]');
    items.forEach(n => {
      const idStr = String(n.id || n.notification_id || '');
      const keyStr = `${n.title || ''}_${n.description || n.message || ''}`;
      if (idStr && !deleted.includes(idStr)) deleted.push(idStr);
      if (keyStr && !deleted.includes(keyStr)) deleted.push(keyStr);
    });
    localStorage.setItem('deletedNotificationIds', JSON.stringify(deleted));
  };

  const handleNotificationClick = async (notifId) => {
    const target = notifications.find(n => String(n.id) === String(notifId));
    if (target) markDeletedInStorage([target]);
    setNotifications(prev => prev.filter(n => String(n.id) !== String(notifId)));
    setUnreadCount(prev => Math.max(0, prev - 1));
    try {
      await api.delete(`/notifications/${notifId}`);
    } catch (err) {
      console.warn('API delete notification failed:', err);
    }
    showToast('Notification marked as read');
  };

  const handleReadAll = async () => {
    markDeletedInStorage(notifications);
    localStorage.setItem('allNotificationsCleared', 'true');
    setNotifications([]);
    setUnreadCount(0);
    try {
      await api.delete('/notifications/');
    } catch (err) {
      console.warn('API delete all notifications failed:', err);
    }
    showToast('All notifications marked as read');
  };

  const handleAvatarClick = () => {
    navigate('/profile');
  };

  if (!token) return null;

  const menuItems = [
    { name: 'Home', key: 'home', path: '/', icon: Home },
    { name: 'Dashboard', key: 'dashboard', path: '/dashboard', icon: LayoutDashboard },
    ...(isAdmin ? [{ name: 'Team Members', key: 'team', path: '/team', icon: Users }] : []),
    { name: 'My Task', key: 'myTask', path: '/my-task', icon: CheckSquare },
    { name: 'Priority', key: 'priority', path: '/priority', icon: AlertCircle },
    { name: 'Task Status', key: 'taskStatus', path: '/task-status', icon: BarChart3 },
    { name: 'Due Date', key: 'dueDate', path: '/due-date', icon: Calendar },
    ...(isAdmin ? [{ name: 'Reports', key: 'reports', path: '/reports', icon: BarChart3 }] : []),
    { name: 'Settings', key: 'settings', path: '/settings', icon: SettingsIcon },
  ];

  return (
    <div className="sticky top-4 z-50 px-4 md:px-8 mb-6">
      <nav className="glass-dark rounded-2xl px-6 py-3 flex items-center justify-between text-slate-100 shadow-2xl transition-all border border-[rgba(255,255,255,0.08)]">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="flex items-center gap-3 no-underline group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-purple-500/40 transition-all duration-300">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-black bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent m-0 leading-none tracking-tight">
                Nexus
              </h1>
              <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">Workspace</span>
            </div>
          </Link>
        </div>

        {/* Desktop Menu links */}
        <div className="hidden xl:flex items-center gap-2 bg-[rgba(255,255,255,0.03)] p-1 rounded-xl border border-[rgba(255,255,255,0.05)]">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={t(item.key)}
                to={item.path}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                  isActive 
                    ? 'bg-[rgba(255,255,255,0.1)] text-white shadow-sm' 
                    : 'text-slate-400 hover:text-white hover:bg-[rgba(255,255,255,0.05)]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                {t(item.key)}
              </Link>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 relative">
          {/* Bell Icon */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              className="relative p-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.1)] transition-all text-slate-300 hover:text-white"
            >
              <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'ping' : ''}`} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center shadow-lg shadow-rose-500/50 border-2 border-[#0d1117]">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifDropdown && (
              <div className="absolute right-0 mt-4 w-80 rounded-2xl glass-dark border border-[rgba(255,255,255,0.1)] shadow-2xl overflow-hidden z-50 fade-up">
                <div className="bg-[rgba(255,255,255,0.05)] px-4 py-3 flex items-center justify-between border-b border-[rgba(255,255,255,0.05)]">
                  <span className="font-bold text-white text-sm">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleReadAll}
                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold transition-colors"
                    >
                      <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-10 flex flex-col items-center justify-center gap-2 text-slate-500">
                      <CheckCheck className="w-8 h-8 opacity-50" />
                      <p className="text-xs font-medium">All caught up!</p>
                    </div>
                  ) : (
                    notifications.map(notif => (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif.id)}
                        className="px-4 py-3 hover:bg-[rgba(255,255,255,0.05)] border-b border-[rgba(255,255,255,0.05)] last:border-0 cursor-pointer transition-all flex gap-3 group"
                      >
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Bell className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold text-slate-200 group-hover:text-white transition-colors">{notif.title || 'System Alert'}</p>
                          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{notif.description || notif.message}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <Link to="/notifications" onClick={() => setShowNotifDropdown(false)} className="block px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-white bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.05)] transition-all">
                  View All Notifications
                </Link>
              </div>
            )}
          </div>

          {/* Profile Avatar */}
          <button
            onClick={handleAvatarClick}
            className="flex items-center gap-2 p-1.5 pr-3 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.1)] transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-xs shadow-md group-hover:shadow-purple-500/30 transition-all">
              {username.slice(0, 2).toUpperCase()}
            </div>
            <span className="hidden sm:block text-xs font-bold text-slate-300 group-hover:text-white transition-colors">
              {username}
            </span>
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="p-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] hover:bg-rose-500/20 hover:border-rose-500/40 hover:text-rose-400 text-slate-400 transition-all"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>

          {/* Mobile menu trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] xl:hidden border border-[rgba(255,255,255,0.08)] text-slate-400 hover:text-white transition-all"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="absolute top-20 left-4 right-4 glass-dark rounded-2xl border border-[rgba(255,255,255,0.1)] p-4 flex flex-col gap-2 xl:hidden z-50 shadow-2xl fade-up">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={t(item.key)}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 py-3 px-4 rounded-xl transition-all duration-300 text-sm font-bold ${
                  isActive 
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/25' 
                    : 'text-slate-300 hover:bg-[rgba(255,255,255,0.05)] hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                {t(item.key)}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Navbar;

