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
  const [showNotion, setShowNotion] = useState(true);


  const role = (localStorage.getItem('role') || 'employee').toLowerCase();
  const username = (localStorage.getItem('username') || '').toLowerCase();
  const userId = localStorage.getItem('userId') || localStorage.getItem('user_id') || localStorage.getItem('employee_id');

  const isTaskForCurrentUser = (t) => {
    if (role === 'admin') return true;
    const empIdStr = t.employee_id !== undefined && t.employee_id !== null ? String(t.employee_id) : '';
    const currentEmpId = localStorage.getItem('employee_id');
    const currentUserId = localStorage.getItem('userId') || localStorage.getItem('user_id');
    if (currentEmpId && empIdStr !== '') {
      if (empIdStr === String(currentEmpId)) return true;
    }
    if (currentUserId) {
      if (empIdStr !== '' && empIdStr === String(currentUserId)) return true;
      const tUserId = t.user_id !== undefined && t.user_id !== null ? String(t.user_id) : '';
      if (tUserId !== '' && tUserId === String(currentUserId)) return true;
    }
    const assignedToStr = (t.assigned_to || t.assignee || t.employee_name || '').toLowerCase();
    if (username && assignedToStr.length > 0) return assignedToStr.includes(username) || username.includes(assignedToStr);
    return false;
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
      let apiData = (res.data && res.data.length > 0) ? res.data : [];
      // Filter API tasks for employees
      if (role !== 'admin') {
        apiData = apiData.filter(isTaskForCurrentUser);
      }
      const apiIds = new Set(apiData.map(t => String(t.task_id || t.id)));
      const apiTitles = new Set(apiData.map(t => String(t.task_title || t.title || t.task || t.name || '').toLowerCase().trim()));
      // Filter local tasks for this user and remove duplicates
      const extraLocal = localTasks
        .filter(lt => isTaskForCurrentUser(lt))
        .filter(lt => {
          const hasId = apiIds.has(String(lt.id || lt.task_id));
          const hasTitle = apiTitles.has(String(lt.task_title || lt.title || lt.task || lt.name || '').toLowerCase().trim());
          return !hasId && !hasTitle;
        });
      const merged = [...apiData, ...extraLocal];
      setTasks(groupTasks(merged));
    } catch (err) {
      console.warn("API unavailable, loading from localStorage:", err);
      setTasks(groupTasks(localTasks.filter(isTaskForCurrentUser)));
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleDropStatus = async (taskId, targetStatusKey) => {
    const statusIdMap = { pending: 1, inProgress: 2, completed: 3, onHold: 4 };
    const statusStrMap = { pending: 'pending', inProgress: 'in_progress', completed: 'completed', onHold: 'on_hold' };
    const statusDisplayMap = { pending: 'Pending', inProgress: 'In Progress', completed: 'Completed', onHold: 'On Hold' };

    const statusId = statusIdMap[targetStatusKey];
    const statusStr = statusStrMap[targetStatusKey];
    const statusDisplay = statusDisplayMap[targetStatusKey];

    // Find task in current tasks state
    let targetTask = null;
    ['pending', 'inProgress', 'completed', 'onHold'].forEach(key => {
      const found = tasks[key].find(t => String(t.id) === String(taskId));
      if (found) targetTask = found;
    });

    if (!targetTask) return;

    // Optimistically update local state
    setTasks(prev => {
      const updated = { pending: [], inProgress: [], completed: [], onHold: [] };
      ['pending', 'inProgress', 'completed', 'onHold'].forEach(key => {
        updated[key] = prev[key].filter(t => String(t.id) !== String(taskId));
      });
      const updatedItem = { ...targetTask, status: statusDisplay };
      updated[targetStatusKey].push(updatedItem);
      return updated;
    });

    // Update localStorage
    const localTasks = JSON.parse(localStorage.getItem('myNewTasks') || '[]');
    const updatedLocal = localTasks.map(lt => {
      const ltId = String(lt.id || lt.task_id);
      const ltName = (lt.task_title || lt.title || lt.task || '').toLowerCase();
      if (ltId === String(taskId) || (targetTask.name && ltName === targetTask.name.toLowerCase())) {
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

        {/* Employee Notification Banner */}
        {role !== 'admin' && showNotion && (
          <div className="bg-blue-900/40 border border-blue-500/50 p-4 rounded-xl flex items-center justify-between shadow-lg backdrop-blur-sm mt-2">
            <div className="flex items-center gap-4">
              <span className="text-2xl">🔔</span>
              <div>
                <h4 className="text-blue-100 font-bold text-base md:text-lg">Hello {username || 'Employee'}, here is your task summary:</h4>
                <p className="text-blue-200/80 text-sm mt-0.5">
                  You have <strong className="text-white">{tasks.pending.length}</strong> pending, <strong className="text-white">{tasks.inProgress.length}</strong> in progress, and <strong className="text-white">{tasks.onHold.length}</strong> on hold.
                </p>
              </div>
            </div>
            <button onClick={() => setShowNotion(false)} className="text-blue-300 hover:text-white font-bold text-2xl px-2 transition-colors">
              &times;
            </button>
          </div>
        )}



        {/* Columns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mt-4">
          {/* Column 1: Pending */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
            }}
            onDrop={(e) => {
              e.preventDefault();
              const taskId = e.dataTransfer.getData('text/plain');
              if (taskId) handleDropStatus(taskId, 'pending');
            }}
            className="bg-slate-900/40 border border-slate-850 p-4 rounded-2xl backdrop-blur-md flex flex-col min-h-[300px]"
          >
            <div className="bg-rose-600 text-white font-bold text-sm px-4 py-2.5 rounded-xl text-center mb-4 shadow">
              {t("pendingTasks")} ({tasks.pending.length})
            </div>
            <div className="flex flex-col gap-3 flex-1">
              {tasks.pending.map((item) => (
                <div
                  key={item.id}
                  draggable={true}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', String(item.id));
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  className="bg-white text-slate-800 p-4 rounded-xl shadow-md border border-slate-100 transition-all cursor-grab active:cursor-grabbing hover:shadow-lg"
                >
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
          <div
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
            }}
            onDrop={(e) => {
              e.preventDefault();
              const taskId = e.dataTransfer.getData('text/plain');
              if (taskId) handleDropStatus(taskId, 'inProgress');
            }}
            className="bg-slate-900/40 border border-slate-850 p-4 rounded-2xl backdrop-blur-md flex flex-col min-h-[300px]"
          >
            <div className="bg-amber-500 text-white font-bold text-sm px-4 py-2.5 rounded-xl text-center mb-4 shadow">
              {t("inProgressTasks")} ({tasks.inProgress.length})
            </div>
            <div className="flex flex-col gap-3 flex-1">
              {tasks.inProgress.map((item) => (
                <div
                  key={item.id}
                  draggable={true}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', String(item.id));
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  className="bg-white text-slate-800 p-4 rounded-xl shadow-md border border-slate-100 transition-all cursor-grab active:cursor-grabbing hover:shadow-lg"
                >
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
          <div
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
            }}
            onDrop={(e) => {
              e.preventDefault();
              const taskId = e.dataTransfer.getData('text/plain');
              if (taskId) handleDropStatus(taskId, 'completed');
            }}
            className="bg-slate-900/40 border border-slate-850 p-4 rounded-2xl backdrop-blur-md flex flex-col min-h-[300px]"
          >
            <div className="bg-emerald-600 text-white font-bold text-sm px-4 py-2.5 rounded-xl text-center mb-4 shadow">
              {t("completedTasks")} ({tasks.completed.length})
            </div>
            <div className="flex flex-col gap-3 flex-1">
              {tasks.completed.map((item) => (
                <div
                  key={item.id}
                  draggable={true}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', String(item.id));
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  className="bg-white text-slate-800 p-4 rounded-xl shadow-md border border-slate-100 transition-all cursor-grab active:cursor-grabbing hover:shadow-lg"
                >
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
          <div
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
            }}
            onDrop={(e) => {
              e.preventDefault();
              const taskId = e.dataTransfer.getData('text/plain');
              if (taskId) handleDropStatus(taskId, 'onHold');
            }}
            className="bg-slate-900/40 border border-slate-850 p-4 rounded-2xl backdrop-blur-md flex flex-col min-h-[300px]"
          >
            <div className="bg-slate-500 text-white font-bold text-sm px-4 py-2.5 rounded-xl text-center mb-4 shadow">
              {t("onHoldTasks")} ({tasks.onHold.length})
            </div>
            <div className="flex flex-col gap-3 flex-1">
              {tasks.onHold.map((item) => (
                <div
                  key={item.id}
                  draggable={true}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', String(item.id));
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  className="bg-white text-slate-800 p-4 rounded-xl shadow-md border border-slate-100 transition-all cursor-grab active:cursor-grabbing hover:shadow-lg"
                >
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