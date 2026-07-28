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

  const role = (localStorage.getItem('role') || 'employee').toLowerCase();
  const username = (localStorage.getItem('username') || '').toLowerCase();
  const userId = localStorage.getItem('userId') || localStorage.getItem('user_id') || localStorage.getItem('employee_id');

  const isTaskForCurrentUser = (t) => {
    if (role === 'admin') return true;
    const empIdStr = t.employee_id !== undefined && t.employee_id !== null ? String(t.employee_id) : '';
    const assignedToStr = (t.assigned_to || t.assignee || t.employee_name || t.username || '').toLowerCase();
    return (
      (userId && empIdStr === String(userId)) ||
      (username && assignedToStr.length > 0 && (assignedToStr.includes(username) || username.includes(assignedToStr)))
    );
  };

  const groupTasks = (taskList) => {
    const statusReverseMap = { 1: 'pending', 2: 'inprogress', 3: 'completed', 4: 'onhold' };
    const grouped = { pending: [], inProgress: [], completed: [], onHold: [] };

    taskList.forEach(t => {
      if (!isTaskForCurrentUser(t)) return;

      let statusKey = 'pending';
      const sid = (t.status_id !== undefined && t.status_id !== null) ? Number(t.status_id) : null;

      if (sid !== null && !isNaN(sid) && statusReverseMap[sid]) {
        statusKey = statusReverseMap[sid];
      } else if (t.status) {
        const rawStatus = String(t.status).toLowerCase().trim().replace(/[\s\-_]+/g, '');
        if (rawStatus === '4' || rawStatus === 'onhold' || rawStatus === 'hold') statusKey = 'onhold';
        else if (rawStatus === '3' || rawStatus === 'completed' || rawStatus === 'done') statusKey = 'completed';
        else if (rawStatus === '2' || rawStatus === 'inprogress' || rawStatus === 'progress') statusKey = 'inprogress';
        else if (rawStatus === '1' || rawStatus === 'pending') statusKey = 'pending';
        else statusKey = rawStatus;
      }

      const statusDisplay =
        statusKey === 'inprogress' ? 'In Progress'
          : statusKey === 'onhold' ? 'On Hold'
            : statusKey.charAt(0).toUpperCase() + statusKey.slice(1);

      const item = {
        id: t.task_id || t.id,
        name: t.task_title || t.title || t.task || 'Untitled Task',
        due: t.due_date ? new Date(t.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No Date',
        status: statusDisplay
      };

      if (statusKey === 'pending') grouped.pending.push(item);
      else if (statusKey === 'inprogress') grouped.inProgress.push(item);
      else if (statusKey === 'completed') grouped.completed.push(item);
      else grouped.onHold.push(item);
    });

    return grouped;
  };

  const fetchTasks = async () => {
    const localTasks = JSON.parse(localStorage.getItem('myNewTasks') || '[]');

    try {
      const res = await api.get('/tasks/?skip=0&limit=100');
      const apiData = (res.data && res.data.length > 0) ? res.data : [];
      const apiIds = new Set(apiData.map(t => String(t.task_id || t.id)));
      const extraLocal = localTasks.filter(lt => !apiIds.has(String(lt.id || lt.task_id)));
      const merged = [...apiData, ...extraLocal];
      setTasks(groupTasks(merged));
    } catch (err) {
      console.warn("API unavailable, loading from localStorage:", err);
      setTasks(groupTasks(localTasks));
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleUpdateStatus = async () => {
    // Collect all tasks across all status groups
    const allTasks = [
      ...tasks.pending,
      ...tasks.inProgress,
      ...tasks.completed,
      ...tasks.onHold
    ];

    if (allTasks.length === 0) {
      showToast('No tasks available to update', 'error');
      return;
    }

    // Show task names so user can identify which to update
    const taskList = allTasks.map((tk, idx) => `${idx + 1}. ${tk.name} [${tk.status}]`).join('\n');
    const taskInput = prompt(`Enter task name to update status:\n\n${taskList}`);
    if (!taskInput) return;

    const matchedTask = allTasks.find(tk =>
      tk.name.toLowerCase().includes(taskInput.toLowerCase()) ||
      taskInput.toLowerCase().includes(tk.name.toLowerCase())
    );

    if (!matchedTask) {
      showToast('Task not found. Please enter a valid task name.', 'error');
      return;
    }

    const newStatus = prompt(`Update status for "${matchedTask.name}":\nEnter: pending, in_progress, completed, or on_hold`);
    if (!newStatus) return;

    const statusMap = {
      '1': 1, 'pending': 1, 'todo': 1,
      '2': 2, 'in_progress': 2, 'inprogress': 2, 'in progress': 2, 'progress': 2,
      '3': 3, 'completed': 3, 'complete': 3, 'done': 3,
      '4': 4, 'on_hold': 4, 'onhold': 4, 'on hold': 4, 'hold': 4
    };

    const cleanInput = newStatus.toLowerCase().trim().replace(/[\s\-_]+/g, '');
    const statusId = statusMap[cleanInput] || statusMap[newStatus.toLowerCase().trim()];

    if (!statusId) {
      showToast('Invalid status. Enter: pending, in_progress, completed, or on_hold', 'error');
      return;
    }

    const statusStrMap = { 1: 'pending', 2: 'in_progress', 3: 'completed', 4: 'on_hold' };
    const statusStr = statusStrMap[statusId];
    const taskId = matchedTask.id;

    // Always update localStorage (match by id OR name)
    const localTasks = JSON.parse(localStorage.getItem('myNewTasks') || '[]');
    const updatedLocal = localTasks.map(lt => {
      const ltId = String(lt.id || lt.task_id);
      const ltName = (lt.task_title || lt.title || lt.task || '').toLowerCase();
      if (ltId === String(taskId) || ltName === matchedTask.name.toLowerCase()) {
        return { ...lt, status: statusStr, status_id: statusId };
      }
      return lt;
    });
    localStorage.setItem('myNewTasks', JSON.stringify(updatedLocal));

    // Attempt API update silently
    try {
      await api.put(`/tasks/${taskId}`, { status_id: statusId });
    } catch (err) {
      console.warn("API update failed (task may be local-only):", err);
    }

    showToast(`Status updated to "${statusStr}" for "${matchedTask.name}"`);
    await fetchTasks();
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