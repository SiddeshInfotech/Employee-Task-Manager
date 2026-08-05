import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Trash2, Eye, Pencil } from 'lucide-react';
import Navbar from './Navbar';
import api, { showToast } from './axios';
import { useTranslation } from 'react-i18next';

function MyTask() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [sortByDueDate, setSortByDueDate] = useState(false);

  const role = (localStorage.getItem('role') || 'employee').toLowerCase();
  const username = (localStorage.getItem('username') || '').toLowerCase();
  const userId = localStorage.getItem('userId') || localStorage.getItem('user_id') || localStorage.getItem('employee_id');

  const mapTask = (t) => {
    const statusReverseMap = { 1: 'Pending', 2: 'In Progress', 3: 'Completed', 4: 'On Hold' };
    const sid = (t.status_id !== undefined && t.status_id !== null) ? Number(t.status_id) : null;
    let statusDisplay = 'Pending';
    if (sid !== null && !isNaN(sid) && statusReverseMap[sid]) {
      statusDisplay = statusReverseMap[sid];
    } else if (t.status) {
      const raw = String(t.status).toLowerCase().trim().replace(/[\s\-_]+/g, '');
      if (raw === '4' || raw === 'onhold' || raw === 'hold') statusDisplay = 'On Hold';
      else if (raw === '3' || raw === 'completed' || raw === 'done') statusDisplay = 'Completed';
      else if (raw === '2' || raw === 'inprogress' || raw === 'progress') statusDisplay = 'In Progress';
      else if (raw === '1' || raw === 'pending') statusDisplay = 'Pending';
      else statusDisplay = String(t.status).charAt(0).toUpperCase() + String(t.status).slice(1);
    }

    const priorityStr = typeof t.priority === 'string'
      ? t.priority
      : (t.priority_id === 1 ? 'High' : t.priority_id === 2 ? 'Medium' : 'Low');

    const priorityDisplay = priorityStr.charAt(0).toUpperCase() + priorityStr.slice(1);


    // Calculate progress according to priority
    const pLower = priorityStr.toLowerCase();
    let progressVal = 20;
    if (pLower === 'high' || t.priority_id === 1) {
      progressVal = 90;
    } else if (pLower === 'medium' || t.priority_id === 2) {
      progressVal = 50;
    } else if (pLower === 'low' || t.priority_id === 3) {
      progressVal = 20;
    }

    if (statusDisplay.toLowerCase() === 'completed' || t.status_id === 3) {
      progressVal = 100;
    }


    return {
      id: t.task_id || t.id,
      task: t.task_title || t.title || t.task || 'Untitled Task',
      due: t.due_date ? new Date(t.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No Due Date',
      status: statusDisplay,
      priority: priorityDisplay,
      progress: progressVal,
      assignee: t.assigned_to || t.assignee || (t.employee_id ? `Employee #${t.employee_id}` : 'Unassigned'),
      email: t.email || t.employee_email || ''
    };
  };


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
    if (username && assignedToStr.length > 0) {
      return assignedToStr.includes(username) || username.includes(assignedToStr);
    }
    
    return false;
  };

  const fetchTasks = async () => {
    const localTasks = JSON.parse(localStorage.getItem('myNewTasks') || '[]');
    let uMap = {};
    try {
      const uRes = await api.get('/users/');
      if (uRes.data) {
        uRes.data.forEach(u => { uMap[String(u.id || u.user_id || u.employee_id)] = u.email; });
      }
    } catch (e) {}

    const localMembers = JSON.parse(localStorage.getItem('myNewMembers') || '[]');
    const localUsers = JSON.parse(localStorage.getItem('myNewUsers') || '[]');
    [...localMembers, ...localUsers].forEach(u => {
      if (u && u.id && u.email) uMap[String(u.id)] = u.email;
    });

    try {
      const res = await api.get('/tasks/?skip=0&limit=100');
      if (res.data) {
        let taskData = res.data;

        if (role !== 'admin') {
          taskData = taskData.filter(isTaskForCurrentUser);
        }

        // Merge local tasks (avoid duplicates by id and title)
        const apiIds = new Set(taskData.map(t => String(t.task_id || t.id)));
        const apiTitles = new Set(taskData.map(t => String(t.task_title || t.title || t.task || t.name || '').toLowerCase().trim()));
        
        const filteredLocal = localTasks.filter(lt => {
          const hasId = apiIds.has(String(lt.id || lt.task_id));
          const hasTitle = apiTitles.has(String(lt.task_title || lt.title || lt.task || lt.name || '').toLowerCase().trim());
          if (hasId || hasTitle) return false;
          return isTaskForCurrentUser(lt);
        });

        const merged = [...taskData, ...filteredLocal].map(t => ({...t, email: t.email || uMap[String(t.employee_id)] || ''}));
        setTasks(merged.map(mapTask));
      }

    } catch (err) {
      console.warn("API unavailable, loading from localStorage:", err);
      const filteredLocal = localTasks.filter(isTaskForCurrentUser).map(t => ({...t, email: t.email || uMap[String(t.employee_id)] || ''}));
      setTasks(filteredLocal.map(mapTask));
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleDeleteTask = async (id) => {
    if (role !== 'admin') {
      showToast(t("adminDeleteOnly"), 'error');
      return;
    }

    // Find task title so we can remove by title too (handles mismatched IDs)
    const deletedTask = tasks.find(t => String(t.id) === String(id));
    const deletedTitle = (deletedTask?.task || '').toLowerCase().trim();

    // Remove from all localStorage keys by both ID and title
    const removeFromCache = (key) => {
      const cached = JSON.parse(localStorage.getItem(key) || '[]');
      const updated = cached.filter(lt => {
        const ltId = String(lt.id || lt.task_id);
        const ltTitle = String(lt.task_title || lt.title || lt.task || lt.name || '').toLowerCase().trim();
        if (ltId === String(id)) return false;
        if (deletedTitle && ltTitle === deletedTitle) return false;
        return true;
      });
      localStorage.setItem(key, JSON.stringify(updated));
    };
    removeFromCache('myNewTasks');
    removeFromCache('myTasks');
    removeFromCache('tasks');

    // Attempt API delete silently (don't block on failure)
    try {
      await api.delete(`/tasks/${id}`);
    } catch (err) {
      console.warn("API delete failed (task may be local-only):", err);
    }

    showToast('Task deleted successfully');
    fetchTasks();
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-100 text-emerald-600';
      case 'In Progress':
        return 'bg-amber-100 text-amber-600';
      default:
        return 'bg-blue-100 text-blue-600';
    }
  };

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'High':
        return 'bg-rose-500 text-white';
      case 'Medium':
        return 'bg-amber-500 text-white';
      default:
        return 'bg-emerald-500 text-white';
    }
  };

  // Filter & Sort Logic
  let filtered = tasks.filter(t => {
    const taskName = (t.task || '').toLowerCase();
    const taskStatus = (t.status || 'Pending').toLowerCase().replace(' ', '_');
    const taskPriority = (t.priority || 'Low').toLowerCase();

    const matchesSearch = taskName.includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || taskStatus === statusFilter.toLowerCase().replace(' ', '_');
    const matchesPriority = priorityFilter === 'All' || taskPriority === priorityFilter.toLowerCase();
    return matchesSearch && matchesStatus && matchesPriority;
  });

  if (sortByDueDate) {
    filtered.sort((a, b) => new Date(a.due) - new Date(b.due));
  }

  return (
    <div className="min-h-screen text-slate-100 flex flex-col font-sans bg-transparent">
      {/* Navbar */}
      <Navbar />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12 flex flex-col gap-6">

        {/* Header Title Card */}
        <div className="bg-[#0f172a]/60 border border-slate-800 p-6 rounded-2xl backdrop-blur-md shadow-xl flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white">
              {t("myTask")}
            </h2>

            <p className="text-sm text-slate-300 mt-1">
              {t("manageTrackTasks")}
            </p>
          </div>

          {role === 'admin' && (
            <button
              onClick={() => navigate('/create-task')}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-blue-500/25"
            >
              <Plus className="w-4.5 h-4.5" />
              {t("createTask")}
            </button>
          )}
        </div>

        {/* Filters Panel */}
        <div className="flex flex-col md:flex-row items-center gap-4 justify-between bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md">
          {/* Search box */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-400" />
            <input
              type="text"
              placeholder={t("searchTask")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Filter selects */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Status Select */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:outline-none"
            >
              <option value="All">{t("allStatus")}</option>
              <option value="Pending">{t("pending")}</option>
              <option value="In Progress">{t("inProgress")}</option>
              <option value="Completed">{t("completed")}</option>
            </select>

            {/* Priority Select */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:outline-none"
            >
              <option value="All">{t("allPriority")}</option>
              <option value="High">{t("high")}</option>
              <option value="Medium">{t("medium")}</option>
              <option value="Low">{t("low")}</option>
            </select>

            {/* Sort checkbox */}
            <button
              onClick={() => setSortByDueDate(!sortByDueDate)}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${sortByDueDate ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
                }`}
            >
              {t("sortDueDate")}
            </button>
          </div>
        </div>

        {/* Tasks Table */}
        <div className="bg-white text-slate-800 rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <p className="font-semibold text-lg">
                {t("noTasksFound")}
              </p>

              <p className="text-xs text-slate-400 mt-1">
                {t("tryDifferentSearch")}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-left">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t("task")}</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t("dueDate")}</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t("status")}</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t("priority")}</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t("progress")}</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">{t("action")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((task) => (
                    <tr key={task.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-950 text-sm">{task.task}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {t("assignedTo")}: {task.assignee}
                        </div>
                        {task.email && (
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            Email: {task.email}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-semibold">{task.due}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusStyle(task.status)}`}>
                          {task.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getPriorityStyle(task.priority)}`}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap w-48">
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div className="bg-blue-600 h-full rounded-full" style={{ width: `${task.progress}%` }}></div>
                          </div>
                          <span className="text-xs font-bold text-slate-700">{task.progress}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => navigate(`/tasks/${task.id}`)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-bold transition-all"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            {t("viewDetail")}
                          </button>

                          <button
                            onClick={() => navigate(`/tasks/${task.id}`, { state: { edit: true } })}
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-all"
                            title="Edit Task"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          {role === 'admin' && (
                            <>
                              <button
                                onClick={() => navigate(`/tasks/${task.id}`, { state: { edit: true } })}
                                className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg transition-all"
                                title="Edit Task"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-all"
                                title={t("deleteTask")}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-[#090d16] border-t border-slate-900 py-8 px-6 text-center text-xs text-slate-500 mt-auto">
        <p className="mb-2">
          {t("footerText")}
        </p>
        <p><span className="text-slate-400 font-semibold"></span></p>
      </footer>
    </div>
  );
}

export default MyTask;