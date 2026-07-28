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

  const groupByPriority = (taskList) => {
    const statusReverseMap = { 1: 'Pending', 2: 'In Progress', 3: 'Completed' };
    const priorityReverseMap = { 1: 'high', 2: 'medium', 3: 'low' };
    const grouped = { high: [], medium: [], low: [] };

    taskList.forEach(t => {
      if (!isTaskForCurrentUser(t)) return;
      const statusText = typeof t.status_id === 'number' ? (statusReverseMap[t.status_id] || 'Pending') : (t.status || 'Pending');
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

  const handleUpdatePriority = async () => {
    // Collect all tasks across all priority groups
    const allTasks = [...tasks.high, ...tasks.medium, ...tasks.low];

    if (allTasks.length === 0) {
      showToast('No tasks available to update', 'error');
      return;
    }

    // Build list of task names for the user to choose from
    const taskList = allTasks.map((tk, idx) => `${idx + 1}. ${tk.name}`).join('\n');
    const taskInput = prompt(`Enter task name to update priority:\n\n${taskList}`);
    if (!taskInput) return;

    const matchedTask = allTasks.find(tk =>
      tk.name.toLowerCase().includes(taskInput.toLowerCase()) ||
      taskInput.toLowerCase().includes(tk.name.toLowerCase())
    );

    if (!matchedTask) {
      showToast('Task not found. Please enter a valid task name.', 'error');
      return;
    }

    const newPriority = prompt(`Update priority for "${matchedTask.name}":\nEnter: high, medium, or low`);
    if (!newPriority || !['high', 'medium', 'low'].includes(newPriority.toLowerCase())) {
      showToast(t("invalidPriority") || 'Invalid priority. Enter high, medium, or low.', 'error');
      return;
    }

    const priorityMap = { high: 1, medium: 2, low: 3 };
    const priorityKey = newPriority.toLowerCase();
    const taskId = matchedTask.id;

    // Always update localStorage (match by id OR name)
    const localTasks = JSON.parse(localStorage.getItem('myNewTasks') || '[]');
    const updatedLocal = localTasks.map(lt => {
      const ltId = String(lt.id || lt.task_id);
      const ltName = (lt.task_title || lt.title || lt.task || '').toLowerCase();
      if (ltId === String(taskId) || ltName === matchedTask.name.toLowerCase()) {
        return { ...lt, priority: priorityKey, priority_id: priorityMap[priorityKey] };
      }
      return lt;
    });
    localStorage.setItem('myNewTasks', JSON.stringify(updatedLocal));

    // Attempt API update silently
    try {
      await api.put(`/tasks/${taskId}`, { priority_id: priorityMap[priorityKey] });
    } catch (err) {
      console.warn("API update failed (task may be local-only):", err);
    }

    showToast(`Priority updated to "${priorityKey}" for "${matchedTask.name}"`);
    await fetchTasks();
  };

  const getStatusColor = (s) => {
    switch (s) {
      case 'Completed':
        return 'text-emerald-500 bg-emerald-50';
      case 'In Progress':
        return 'text-amber-500 bg-amber-50';
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
            <div className="bg-slate-900/40 border border-slate-850 p-4 rounded-2xl backdrop-blur-md">
              <div className="bg-rose-500 text-white font-bold text-sm px-4 py-2.5 rounded-xl text-center mb-4 shadow">
                {t("highPriorityTasks")} ({tasks.high.length})
              </div>
              <div className="flex flex-col gap-3">
                {tasks.high.map((tItem) => (
                  <div key={tItem.id} className="bg-white text-slate-800 p-4 rounded-xl shadow-md border border-slate-100">
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
            <div className="bg-slate-900/40 border border-slate-850 p-4 rounded-2xl backdrop-blur-md">
              <div className="bg-amber-500 text-white font-bold text-sm px-4 py-2.5 rounded-xl text-center mb-4 shadow">
                {t("mediumPriorityTasks")} ({tasks.medium.length})
              </div>
              <div className="flex flex-col gap-3">
                {tasks.medium.map((tItem) => (
                  <div key={tItem.id} className="bg-white text-slate-800 p-4 rounded-xl shadow-md border border-slate-100">
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
            <div className="bg-slate-900/40 border border-slate-850 p-4 rounded-2xl backdrop-blur-md">
              <div className="bg-emerald-500 text-white font-bold text-sm px-4 py-2.5 rounded-xl text-center mb-4 shadow">
                {t("lowPriorityTasks")} ({tasks.low.length})
              </div>
              <div className="flex flex-col gap-3">
                {tasks.low.map((tItem) => (
                  <div key={tItem.id} className="bg-white text-slate-800 p-4 rounded-xl shadow-md border border-slate-100">
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

        {/* Update Button */}
        {role === 'admin' && (
          <div className="flex justify-center mt-8">
            <button
              onClick={handleUpdatePriority}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-blue-500/25"
            >
              {t("updatePriority")}
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

export default Priority;