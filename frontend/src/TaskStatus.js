import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Navbar from './Navbar';
import api, { showToast } from './axios';

function TaskStatus() {
  const { t } = useTranslation();
  const [tasks, setTasks] = useState({
    pending: [],
    inProgress: [],
    completed: [],
    onHold: []
  });

  const role = localStorage.getItem('role') || 'employee';

  const fetchTasks = async () => {
    const statusReverseMap = { 1: 'pending', 2: 'inprogress', 3: 'completed', 4: 'onhold' };

    try {
      const res = await api.get('/tasks/?skip=0&limit=100');

      const grouped = {
        pending: [],
        inProgress: [],
        completed: [],
        onHold: []
      };

      if (res.data && res.data.length > 0) {
        res.data.forEach(t => {
          const statusKey =
            typeof t.status_id === 'number'
              ? (statusReverseMap[t.status_id] || 'pending')
              : (t.status || 'pending')
                .toLowerCase()
                .replace(' ', '')
                .replace('_', '');

          const statusDisplay =
            statusKey === 'inprogress'
              ? 'In Progress'
              : statusKey === 'onhold'
                ? 'On Hold'
                : statusKey.charAt(0).toUpperCase() + statusKey.slice(1);

          const item = {
            id: t.task_id || t.id,
            name: t.task_title || t.title || 'Untitled Task',
            due: t.due_date
              ? new Date(t.due_date).toLocaleDateString(
                'en-US',
                { month: 'short', day: 'numeric' }
              )
              : 'No Date',
            status: statusDisplay
          };

          if (statusKey === 'pending')
            grouped.pending.push(item);
          else if (statusKey === 'inprogress')
            grouped.inProgress.push(item);
          else if (statusKey === 'completed')
            grouped.completed.push(item);
          else
            grouped.onHold.push(item);
        });
      }

      setTasks(grouped);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleUpdateStatus = async () => {
    const taskId = prompt('Enter Task ID to update status:');
    if (!taskId) return;
    const newStatus = prompt('Enter new status (pending, in_progress, completed, on_hold):');
    if (!newStatus) return;

    const statusMap = { pending: 1, in_progress: 2, inprogress: 2, completed: 3, on_hold: 4, onhold: 4 };
    const formattedStatus = newStatus.toLowerCase().trim().replace(/\s+/g, '_');
    const statusId = statusMap[formattedStatus] || 1;

    try {
      await api.put(`/tasks/${taskId}`, { status_id: statusId });
      showToast('Status updated successfully');
      fetchTasks();
    } catch (err) {
      console.error(err);
      showToast('Failed to update status', 'error');
    }
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-100 text-emerald-600';
      case 'In Progress':
        return 'bg-amber-100 text-amber-600';
      case 'Pending':
        return 'bg-rose-100 text-rose-600';
      case 'On Hold':
        return 'bg-slate-100 text-slate-600';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="min-h-screen text-slate-100 flex flex-col font-sans bg-transparent">
      {/* Navbar */}
      <Navbar />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12 flex flex-col gap-6">

        {/* Header Title Card */}
        <div className="bg-[#0f172a]/60 border border-slate-800 p-6 rounded-2xl backdrop-blur-md shadow-xl text-center">
          <h2 className="text-3xl font-bold text-white">{t("taskStatusManagement")}</h2>
        </div>

        {/* Columns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mt-4">
          {/* Column 1: Pending */}
          <div className="bg-slate-900/40 border border-slate-850 p-4 rounded-2xl backdrop-blur-md">
            <div className="bg-rose-600 text-white font-bold text-sm px-4 py-2.5 rounded-xl text-center mb-4 shadow">
              {t("pendingTasks")} ({tasks.pending.length})
            </div>
            <div className="flex flex-col gap-3">
              {tasks.pending.map((item) => (
                <div key={item.id} className="bg-white text-slate-800 p-4 rounded-xl shadow-md border border-slate-100">
                  <h4 className="font-bold text-sm text-slate-900">{item.name}</h4>
                  <div className="flex items-center justify-between text-xs mt-3">
                    <span className="text-slate-400 font-medium">{t("due")}: {item.due}</span>
                    <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${getStatusBadgeStyle(item.status)}`}>
                      {item.status === 'Pending' ? t("pending") : item.status === 'In Progress' ? t("inProgress") : item.status === 'Completed' ? t("completed") : item.status === 'On Hold' ? t("onHold") : item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: In Progress */}
          <div className="bg-slate-900/40 border border-slate-850 p-4 rounded-2xl backdrop-blur-md">
            <div className="bg-amber-500 text-white font-bold text-sm px-4 py-2.5 rounded-xl text-center mb-4 shadow">
              {t("inProgressTasks")} ({tasks.inProgress.length})
            </div>
            <div className="flex flex-col gap-3">
              {tasks.inProgress.map((item) => (
                <div key={item.id} className="bg-white text-slate-800 p-4 rounded-xl shadow-md border border-slate-100">
                  <h4 className="font-bold text-sm text-slate-900">{item.name}</h4>
                  <div className="flex items-center justify-between text-xs mt-3">
                    <span className="text-slate-400 font-medium">{t("due")}: {item.due}</span>
                    <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${getStatusBadgeStyle(item.status)}`}>
                      {item.status === 'Pending' ? t("pending") : item.status === 'In Progress' ? t("inProgress") : item.status === 'Completed' ? t("completed") : item.status === 'On Hold' ? t("onHold") : item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 3: Completed */}
          <div className="bg-slate-900/40 border border-slate-850 p-4 rounded-2xl backdrop-blur-md">
            <div className="bg-emerald-600 text-white font-bold text-sm px-4 py-2.5 rounded-xl text-center mb-4 shadow">
              {t("completedTasks")} ({tasks.completed.length})
            </div>
            <div className="flex flex-col gap-3">
              {tasks.completed.map((item) => (
                <div key={item.id} className="bg-white text-slate-800 p-4 rounded-xl shadow-md border border-slate-100">
                  <h4 className="font-bold text-sm text-slate-900">{item.name}</h4>
                  <div className="flex items-center justify-between text-xs mt-3">
                    <span className="text-slate-400 font-medium">{t("due")}: {item.due}</span>
                    <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${getStatusBadgeStyle(item.status)}`}>
                      {item.status === 'Pending' ? t("pending") : item.status === 'In Progress' ? t("inProgress") : item.status === 'Completed' ? t("completed") : item.status === 'On Hold' ? t("onHold") : item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 4: On Hold */}
          <div className="bg-slate-900/40 border border-slate-850 p-4 rounded-2xl backdrop-blur-md">
            <div className="bg-slate-500 text-white font-bold text-sm px-4 py-2.5 rounded-xl text-center mb-4 shadow">
              {t("onHoldTasks")} ({tasks.onHold.length})
            </div>
            <div className="flex flex-col gap-3">
              {tasks.onHold.map((item) => (
                <div key={item.id} className="bg-white text-slate-800 p-4 rounded-xl shadow-md border border-slate-100">
                  <h4 className="font-bold text-sm text-slate-900">{item.name}</h4>
                  <div className="flex items-center justify-between text-xs mt-3">
                    <span className="text-slate-400 font-medium">{t("due")}: {item.due}</span>
                    <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${getStatusBadgeStyle(item.status)}`}>
                      {item.status === 'Pending' ? t("pending") : item.status === 'In Progress' ? t("inProgress") : item.status === 'Completed' ? t("completed") : item.status === 'On Hold' ? t("onHold") : item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Update button */}
        {/* Update button */}
        {role === 'admin' && (
          <div className="flex justify-center mt-8">
            <button
              onClick={handleUpdateStatus}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-blue-500/25"
            >
              {t("updateStatus")}
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full bg-[#090d16] border-t border-slate-900 py-8 px-6 text-center text-xs text-slate-500 mt-auto">
        <p className="mb-2">{t("footerText")}</p>
        <p><span className="text-slate-400 font-semibold"></span></p>
      </footer>
    </div>
  );
}

export default TaskStatus;