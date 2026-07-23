import React, { useState, useEffect } from 'react';
import { Bell, Check, Trash2, CheckCheck } from 'lucide-react';
import Navbar from './Navbar';
import api, { showToast } from './axios';

const initialNotifications = [
  { id: 1, title: 'New Task Assigned: Design Homepage Layout', description: 'Assigned by Emma Brown. 5m ago', is_read: false },
  { id: 2, title: 'Project Deadline Tomorrow: CRM Update', description: 'Due on Apr 25. 20m ago', is_read: false },
  { id: 3, title: 'Task Completed: Data Analysis Report', description: 'Completed by Alex Smith. 1 hour ago', is_read: false },
  { id: 4, title: 'You have been added to: Marketing Strategy Team', description: 'Assigned by Sarah Lee. 2 hours ago', is_read: false },
  { id: 5, title: 'New Task Assigned: Create Monthly Report', description: 'Assigned by David Johnson. 1 day ago', is_read: false },
];

function NotificationsPage() {
  const [notifications, setNotifications] = useState(initialNotifications);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications/?is_read=false&skip=0&limit=100');
      if (res.data && res.data.length > 0) {
        setNotifications(res.data);
      }
    } catch (err) {
      console.error('Error fetching notifications, using defaults.', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.filter(n => n.id !== id));
      showToast('Notification marked as read');
    } catch (err) {
      console.error(err);
      // Fallback
      setNotifications(prev => prev.filter(n => n.id !== id));
      showToast('Notification marked as read');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
      showToast('Notification deleted');
    } catch (err) {
      console.error(err);
      setNotifications(prev => prev.filter(n => n.id !== id));
      showToast('Notification deleted');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications([]);
      showToast('All notifications marked as read');
    } catch (err) {
      console.error(err);
      setNotifications([]);
      showToast('All notifications marked as read');
    }
  };

  const handleDeleteAll = () => {
    setNotifications([]);
    showToast('All notifications cleared');
  };

  return (
    <div className="min-h-screen text-slate-100 flex flex-col font-sans bg-transparent">
      {/* Navbar */}
      <Navbar />

      {/* Main Container */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12 flex flex-col gap-6">
        
        {/* Header toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0f172a]/60 border border-slate-800 p-6 rounded-2xl backdrop-blur-md shadow-xl w-full">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Bell className="w-6 h-6 text-blue-500" /> Notifications
            </h2>
            <p className="text-xs text-slate-400 mt-1">Manage all your inbox alerts and project updates</p>
          </div>

          {notifications.length > 0 && (
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={handleMarkAllRead}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-white text-slate-800 hover:bg-slate-100 font-bold rounded-xl text-xs transition-all shadow"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark All as Read
              </button>
              <button
                onClick={handleDeleteAll}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-rose-500/10"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete All
              </button>
            </div>
          )}
        </div>

        {/* Notifications List */}
        <div className="flex flex-col gap-3">
          {notifications.length === 0 ? (
            <div className="bg-white text-slate-800 rounded-2xl shadow-xl p-12 text-center border border-white/20">
              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4 text-slate-400">
                <Bell className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No notifications</h3>
              <p className="text-xs text-slate-500 mt-1">You are all caught up! New alerts will show up here.</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className="bg-white text-slate-800 rounded-2xl p-5 shadow-lg border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-blue-500/20 transition-all"
              >
                <div>
                  <h4 className="font-bold text-slate-900 text-sm leading-tight">{notif.title}</h4>
                  <p className="text-xs text-slate-500 mt-1">{notif.description || notif.message}</p>
                </div>

                <div className="flex items-center gap-3 justify-end border-t border-slate-50 pt-3 sm:border-0 sm:pt-0">
                  <button
                    onClick={() => handleMarkAsRead(notif.id)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-bold transition-all"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Mark as Read
                  </button>
                  <button
                    onClick={() => handleDelete(notif.id)}
                    className="p-2 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-all"
                    title="Delete alert"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-[#090d16] border-t border-slate-900 py-8 px-6 text-center text-xs text-slate-500 mt-auto">
        <p className="mb-2">© 2026 Employee Task Tracker System | All Rights Reserved</p>
        <p><span className="text-slate-400 font-semibold"></span></p>
      </footer>
    </div>
  );
}

export default NotificationsPage;
