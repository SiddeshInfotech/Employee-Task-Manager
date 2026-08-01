import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import Navbar from './Navbar';
import api, { showToast } from './axios';

function Priority() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState('All');
  const [sortByProperty, setSortByProperty] = useState(false);
  const role = (localStorage.getItem('role') || 'employee').toLowerCase();
  const username = (localStorage.getItem('username') || '').toLowerCase();
  const userId = localStorage.getItem('userId') || localStorage.getItem('user_id') || localStorage.getItem('employee_id');

  const [tasks, setTasks] = useState({
    high: [],
    medium: [],
    low: []
  });

  const isTaskForCurrentUser = (t) => {
    if (role === 'admin') return true;
    const empIdStr = t.employee_id !== undefined && t.employee_id !== null ? String(t.employee_id) : '';
    const assignedToStr = (t.assigned_to || t.assignee || t.employee_name || t.username || t.createdBy || '').toLowerCase();
    const taskUsername = (t.username || '').toLowerCase();
    return (
      (userId && empIdStr !== '' && empIdStr === String(userId)) ||
      (username && assignedToStr.length > 0 && (assignedToStr.includes(username) || username.includes(assignedToStr))) ||
      (username && taskUsername.length > 0 && taskUsername === username)
    );
  };

  const getTaskStatusDisplay = (t) => {
    const statusReverseMap = { 1: 'Pending', 2: 'In Progress', 3: 'Completed', 4: 'On Hold' };
    const sid = (t.status_id !== undefined && t.status_id !== null) ? Number(t.status_id) : null;
    if (sid !== null && !isNaN(sid) && statusReverseMap[sid]) {
      return statusReverseMap[sid];
    }
    if (t.status) {
      const raw = String(t.status).toLowerCase().trim().replace(/[\s\-_]+/g, '');
      if (raw === '4' || raw === 'onhold' || raw === 'hold') return 'On Hold';
      if (raw === '3' || raw === 'completed' || raw === 'done') return 'Completed';
      if (raw === '2' || raw === 'inprogress' || raw === 'progress') return 'In Progress';
      if (raw === '1' || raw === 'pending') return 'Pending';
      return String(t.status).charAt(0).toUpperCase() + String(t.status).slice(1);
    }
    return 'Pending';
  };

  const groupByPriority = (taskList) => {
    const priorityReverseMap = { 1: 'high', 2: 'medium', 3: 'low' };
    const grouped = { high: [], medium: [], low: [] };

    taskList.forEach(t => {
      if (!isTaskForCurrentUser(t)) return;
      const statusText = getTaskStatusDisplay(t);
      const item = {
        id: t.task_id || t.id,
        name: t.task_title || t.title || t.task || 'Untitled Task',
        due: t.due_date ? new Date(t.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No Date',
        status: statusText
      };
      const p = (typeof t.priority_id === 'number' ? (priorityReverseMap[t.priority_id] || 'low') : (t.priority || 'low')).toLowerCase();
      if (p === 'high') grouped.high.push(item);
      else if (p === 'medium') grouped.medium.push(item);
      else grouped.low.push(item);
    });

    return grouped;
  };

  const fetchTasks = async () => {
    const localTasks = JSON.parse(localStorage.getItem('myNewTasks') || '[]');

    try {
      const res = await api.get('/tasks/?skip=0&limit=100');
      let apiData = (res.data && res.data.length > 0) ? res.data : [];
      // Filter API tasks for employees
      if (role !== 'admin') {
        apiData = apiData.filter(isTaskForCurrentUser);
      }
      const apiIds = new Set(apiData.map(t => String(t.task_id || t.id)));
      // Filter local tasks for this user and remove duplicates
      const extraLocal = localTasks
        .filter(lt => isTaskForCurrentUser(lt))
        .filter(lt => !apiIds.has(String(lt.id || lt.task_id)));
      const merged = [...apiData, ...extraLocal];
      setTasks(groupByPriority(merged));
    } catch (err) {
      console.warn('API unavailable, loading from localStorage:', err);
      setTasks(groupByPriority(localTasks.filter(isTaskForCurrentUser)));
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleDropPriority = async (taskId, targetPriority) => {
    if (role !== 'admin') {
      showToast('Only admins can change task priority', 'error');
      return;
    }

    const priorityMap = { high: 1, medium: 2, low: 3 };
    const priorityId = priorityMap[targetPriority];

    // Find task in current tasks state
    let targetTask = null;
    ['high', 'medium', 'low'].forEach(p => {
      const found = tasks[p].find(t => String(t.id) === String(taskId));
      if (found) targetTask = found;
    });

    if (!targetTask) return;

    // Optimistically update local state
    setTasks(prev => {
      const updated = { high: [], medium: [], low: [] };
      ['high', 'medium', 'low'].forEach(p => {
        updated[p] = prev[p].filter(t => String(t.id) !== String(taskId));
      });
      const updatedItem = { ...targetTask, priority: targetPriority };
      updated[targetPriority].push(updatedItem);
      return updated;
    });

    // Update localStorage
    const localTasks = JSON.parse(localStorage.getItem('myNewTasks') || '[]');
    const updatedLocal = localTasks.map(lt => {
      const ltId = String(lt.id || lt.task_id);
      const ltName = (lt.task_title || lt.title || lt.task || '').toLowerCase();
      if (ltId === String(taskId) || (targetTask.name && ltName === targetTask.name.toLowerCase())) {
        return { ...lt, priority: targetPriority, priority_id: priorityId };
      }
      return lt;
    });
    localStorage.setItem('myNewTasks', JSON.stringify(updatedLocal));

    // Attempt API update silently
    try {
      await api.put(`/tasks/${taskId}`, { priority_id: priorityId });
    } catch (err) {
      console.warn("API update failed (task may be local-only):", err);
    }

    showToast(`Priority updated to "${targetPriority}" for "${targetTask.name}"`);
  };

  const getStatusColor = (s) => {
    switch (s) {
      case 'Completed':
        return 'text-emerald-500 bg-emerald-50';
      case 'In Progress':
        return 'text-amber-500 bg-amber-50';
      case 'On Hold':
        return 'text-slate-600 bg-slate-100';
      default:
        return 'text-blue-500 bg-blue-50';
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
          <h2 className="text-3xl font-bold text-white">{t("priorityManagement")}</h2>
        </div>

        {/* Toolbar filter */}
        <div className="flex items-center justify-between bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 bg-slate-900 border border-slate-850 rounded-xl text-xs text-white focus:outline-none"
          >
            <option value="All">{t("filterAll")}</option>
            <option value="High">{t("filterHigh")}</option>
            <option value="Medium">{t("filterMedium")}</option>
            <option value="Low">{t("filterLow")}</option>
          </select>

          <button
            onClick={() => setSortByProperty(!sortByProperty)}
            className={`px-4 py-2 border rounded-xl text-xs font-semibold transition-all ${sortByProperty ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-900 border-slate-850 text-slate-300'
              }`}
          >
            {t("sortByProperty")}
          </button>
        </div>

        {/* Columns Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
          {/* Column 1: High Priority */}
          {(filter === 'All' || filter === 'High') && (
            <div
              onDragOver={(e) => {
                if (role !== 'admin') return;
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (role !== 'admin') {
                  showToast('Only admins can change task priority', 'error');
                  return;
                }
                const taskId = e.dataTransfer.getData('text/plain');
                if (taskId) handleDropPriority(taskId, 'high');
              }}
              className="bg-slate-900/40 border border-slate-850 p-4 rounded-2xl backdrop-blur-md flex flex-col min-h-[300px]"
            >
              <div className="bg-rose-500 text-white font-bold text-sm px-4 py-2.5 rounded-xl text-center mb-4 shadow">
                {t("highPriorityTasks")} ({tasks.high.length})
              </div>
              <div className="flex flex-col gap-3 flex-1">
                {tasks.high.map((tItem) => (
                  <div
                    key={tItem.id}
                    draggable={role === 'admin'}
                    onDragStart={(e) => {
                      if (role !== 'admin') return;
                      e.dataTransfer.setData('text/plain', String(tItem.id));
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    className={`bg-white text-slate-800 p-4 rounded-xl shadow-md border border-slate-100 transition-all ${
                      role === 'admin' ? 'cursor-grab active:cursor-grabbing hover:shadow-lg' : 'cursor-default'
                    }`}
                  >
                    <h4 className="font-bold text-sm text-slate-900">{tItem.name}</h4>
                    <div className="flex items-center justify-between text-xs mt-3">
                      <span className="text-slate-400 font-medium">{t("dueDate")}: {tItem.due}</span>
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${getStatusColor(tItem.status)}`}>
                        {tItem.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Column 2: Medium Priority */}
          {(filter === 'All' || filter === 'Medium') && (
            <div
              onDragOver={(e) => {
                if (role !== 'admin') return;
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (role !== 'admin') {
                  showToast('Only admins can change task priority', 'error');
                  return;
                }
                const taskId = e.dataTransfer.getData('text/plain');
                if (taskId) handleDropPriority(taskId, 'medium');
              }}
              className="bg-slate-900/40 border border-slate-850 p-4 rounded-2xl backdrop-blur-md flex flex-col min-h-[300px]"
            >
              <div className="bg-amber-500 text-white font-bold text-sm px-4 py-2.5 rounded-xl text-center mb-4 shadow">
                {t("mediumPriorityTasks")} ({tasks.medium.length})
              </div>
              <div className="flex flex-col gap-3 flex-1">
                {tasks.medium.map((tItem) => (
                  <div
                    key={tItem.id}
                    draggable={role === 'admin'}
                    onDragStart={(e) => {
                      if (role !== 'admin') return;
                      e.dataTransfer.setData('text/plain', String(tItem.id));
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    className={`bg-white text-slate-800 p-4 rounded-xl shadow-md border border-slate-100 transition-all ${
                      role === 'admin' ? 'cursor-grab active:cursor-grabbing hover:shadow-lg' : 'cursor-default'
                    }`}
                  >
                    <h4 className="font-bold text-sm text-slate-900">{tItem.name}</h4>
                    <div className="flex items-center justify-between text-xs mt-3">
                      <span className="text-slate-400 font-medium">{t("dueDate")}: {tItem.due}</span>
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${getStatusColor(tItem.status)}`}>
                        {tItem.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Column 3: Low Priority */}
          {(filter === 'All' || filter === 'Low') && (
            <div
              onDragOver={(e) => {
                if (role !== 'admin') return;
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (role !== 'admin') {
                  showToast('Only admins can change task priority', 'error');
                  return;
                }
                const taskId = e.dataTransfer.getData('text/plain');
                if (taskId) handleDropPriority(taskId, 'low');
              }}
              className="bg-slate-900/40 border border-slate-850 p-4 rounded-2xl backdrop-blur-md flex flex-col min-h-[300px]"
            >
              <div className="bg-emerald-500 text-white font-bold text-sm px-4 py-2.5 rounded-xl text-center mb-4 shadow">
                {t("lowPriorityTasks")} ({tasks.low.length})
              </div>
              <div className="flex flex-col gap-3 flex-1">
                {tasks.low.map((tItem) => (
                  <div
                    key={tItem.id}
                    draggable={role === 'admin'}
                    onDragStart={(e) => {
                      if (role !== 'admin') return;
                      e.dataTransfer.setData('text/plain', String(tItem.id));
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    className={`bg-white text-slate-800 p-4 rounded-xl shadow-md border border-slate-100 transition-all ${
                      role === 'admin' ? 'cursor-grab active:cursor-grabbing hover:shadow-lg' : 'cursor-default'
                    }`}
                  >
                    <h4 className="font-bold text-sm text-slate-900">{tItem.name}</h4>
                    <div className="flex items-center justify-between text-xs mt-3">
                      <span className="text-slate-400 font-medium">{t("dueDate")}: {tItem.due}</span>
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${getStatusColor(tItem.status)}`}>
                        {tItem.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-[#090d16] border-t border-slate-900 py-8 px-6 text-center text-xs text-slate-500 mt-auto">
        <p className="mb-2">{t("footerText")}</p>
        <p><span className="text-slate-400 font-semibold"></span></p>
      </footer>
    </div>
  );
}

export default Priority;