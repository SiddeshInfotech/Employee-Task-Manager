import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, Cell, PieChart, Pie } from 'recharts';
import { LayoutDashboard, CheckSquare, BarChart3, Users, Settings, Plus, UserPlus, FileText, ArrowRight, Activity, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import api, { showToast } from './axios';
import { useTranslation } from 'react-i18next';
import Navbar from './Navbar';

function Dashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [summary, setSummary] = useState({
    total_tasks: 120,
    pending_tasks: 35,
    in_progress_tasks: 25,
    completed_tasks: 80,
    unread_notifications: 3,
    overdue_tasks: 8
  });
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    status: 'pending',
    priority: 'high',
    due_date: '',
    assigned_to_id: ''
  });
  const [users, setUsers] = useState([]);

  const username = (localStorage.getItem('username') || 'John').toLowerCase();
  const rawUsername = localStorage.getItem('username') || 'John';
  const userId = localStorage.getItem('userId') || localStorage.getItem('user_id') || localStorage.getItem('employee_id');
  const role = (localStorage.getItem('role') || 'employee').toLowerCase();
  const isAdmin = role === 'admin';
  const [currentTasks, setCurrentTasks] = useState([]);

  const isTaskForCurrentUser = (t) => {
    if (isAdmin) return true;
    const empIdStr = t.employee_id !== undefined && t.employee_id !== null ? String(t.employee_id) : (t.user_id !== undefined && t.user_id !== null ? String(t.user_id) : '');
    const assignedToStr = (t.assigned_to || t.assignee || t.employee_name || t.username || t.createdBy || '').toLowerCase();
    const taskUsername = (t.username || '').toLowerCase();
    return (
      (userId && empIdStr !== '' && empIdStr === String(userId)) ||
      (username && assignedToStr.length > 0 && (assignedToStr.includes(username) || username.includes(assignedToStr))) ||
      (username && taskUsername.length > 0 && taskUsername === username)
    );
  };

  useEffect(() => {
    const fetchSummary = async () => {
      const localNewTasks = JSON.parse(localStorage.getItem('myNewTasks') || '[]');
      const localTasks = JSON.parse(localStorage.getItem('myTasks') || '[]');
      const generalTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
      let apiTasks = [];

      try {
        const res = await api.get('/tasks/?skip=0&limit=200');
        if (res.data && Array.isArray(res.data)) {
          apiTasks = res.data;
        }
      } catch (err) {
        console.warn('Dashboard /tasks API failed:', err?.message);
      }

      const taskMap = new Map();
      [...apiTasks, ...localNewTasks, ...localTasks, ...generalTasks].forEach(t => {
        const id = String(t.task_id || t.id || `${t.title || t.task || 'task'}_${t.assigned_to || t.employee_id || ''}`);
        if (!taskMap.has(id)) {
          taskMap.set(id, t);
        }
      });
      let mergedTasks = Array.from(taskMap.values());

      if (!isAdmin) {
        mergedTasks = mergedTasks.filter(isTaskForCurrentUser);
      }

      setCurrentTasks(mergedTasks);

      const isDone = (t) => Number(t.status_id) === 3 || String(t.status || '').toLowerCase() === 'completed' || String(t.status || '').toLowerCase() === 'done';
      const isPending = (t) => Number(t.status_id) === 1 || String(t.status || '').toLowerCase() === 'pending';
      const isInProgress = (t) => Number(t.status_id) === 2 || String(t.status || '').toLowerCase() === 'in_progress' || String(t.status || '').toLowerCase() === 'inprogress';
      const isOverdue = (t) => {
        if (isDone(t)) return false;
        const due = t.due_date || t.dueDate || t.due;
        return due && new Date(due) < new Date();
      };

      setSummary({
        total_tasks: mergedTasks.length,
        completed_tasks: mergedTasks.filter(isDone).length,
        pending_tasks: mergedTasks.filter(isPending).length,
        in_progress_tasks: mergedTasks.filter(isInProgress).length,
        overdue_tasks: mergedTasks.filter(isOverdue).length,
        unread_notifications: 0
      });
    };

    const fetchUsers = async () => {
      if (isAdmin) {
        // Load from localStorage (admin-added members)
        const localNewMembers = JSON.parse(localStorage.getItem('myNewMembers') || '[]');
        const localNewUsers = JSON.parse(localStorage.getItem('myNewUsers') || '[]');
        const localMembers = [...localNewMembers, ...localNewUsers].map(m => ({
          id: m.id || m.username,
          username: m.name || m.username
        }));

        try {
          const res = await api.get('/users/');
          if (res.data && res.data.length > 0) {
            const apiNames = new Set(res.data.map(u => (u.username || '').toLowerCase()));
            const extraLocal = localMembers.filter(m => !apiNames.has((m.username || '').toLowerCase()));
            setUsers([...res.data, ...extraLocal]);
          } else {
            setUsers(localMembers);
          }
        } catch (err) {
          console.warn('Error fetching users from API, using local members:', err);
          setUsers(localMembers);
        }
      }
    };

    fetchSummary();
    fetchUsers();
  }, []);

  const handleAddTask = async (e) => {
    e.preventDefault();

    const statusMap = { pending: 1, in_progress: 2, completed: 3 };
    const priorityMap = { high: 1, medium: 2, low: 3 };
    const formattedDueDate = taskForm.due_date ? taskForm.due_date.split('T')[0] : null;
    const assignedEmpId = taskForm.assigned_to_id ? Number(taskForm.assigned_to_id) : null;

    // Find assigned employee name
    const assignedUser = users.find(u => String(u.id) === String(taskForm.assigned_to_id));
    const assignedUsername = assignedUser ? (assignedUser.username || assignedUser.name || '') : '';

    const payload = {
      task_title: taskForm.title,
      task_description: taskForm.description,
      employee_id: assignedEmpId,
      status_id: statusMap[taskForm.status] || 1,
      priority_id: priorityMap[taskForm.priority] || 1,
      due_date: formattedDueDate
    };

    // Always save to localStorage so assigned employee can see the task
    const localTask = {
      id: Date.now(),
      task_id: Date.now(),
      task_title: taskForm.title,
      title: taskForm.title,
      task_description: taskForm.description,
      description: taskForm.description,
      status: taskForm.status,
      status_id: statusMap[taskForm.status] || 1,
      priority: taskForm.priority,
      priority_id: priorityMap[taskForm.priority] || 1,
      due_date: formattedDueDate,
      employee_id: assignedEmpId,
      assigned_to: assignedUsername,
      username: assignedUsername,
      createdAt: new Date().toISOString()
    };
    const existingTasks = JSON.parse(localStorage.getItem('myNewTasks') || '[]');
    localStorage.setItem('myNewTasks', JSON.stringify([...existingTasks, localTask]));

    try {
      await api.post('/tasks/', payload);
      showToast('Task added successfully!');
    } catch (err) {
      console.warn('API task save failed, saved locally:', err);
      showToast('Task saved locally!');
    }

    setTaskForm({ title: '', description: '', status: 'pending', priority: 'high', due_date: '', assigned_to_id: '' });
    setShowAddTaskModal(false);
  };

  // Bar chart data derived from real summary counts
  const barChartData = [
    { name: t("completed"), value: summary.completed_tasks || 0, color: '#2563eb' },
    { name: t("pending"), value: summary.pending_tasks || 0, color: '#f59e0b' },
    { name: t("overdue"), value: summary.overdue_tasks || 0, color: '#ef4444' },
    { name: t("inProgress"), value: summary.in_progress_tasks || 0, color: '#10b981' }
  ];

  const lineChartData = [
    { name: 'Mon', completed: 15, created: 20 },
    { name: 'Tue', completed: 25, created: 18 },
    { name: 'Wed', completed: 18, created: 22 },
    { name: 'Thu', completed: 30, created: 25 },
    { name: 'Fri', completed: 22, created: 28 },
    { name: 'Sat', completed: 35, created: 15 },
    { name: 'Sun', completed: 40, created: 10 }
  ];
  const priorityData = [
    { name: t("high"), value: 45, color: '#ef4444' },
    { name: t("medium"), value: 30, color: '#f59e0b' },
    { name: t("low"), value: 25, color: '#10b981' }
  ];

  const departmentData = [
    { name: 'Marketing', tasks: 12 },
    { name: 'Development', tasks: 28 },
    { name: 'Design', tasks: 15 },
    { name: 'HR', tasks: 8 },
    { name: 'Support', tasks: 18 }
  ];

  return (
    <div className="page-wrapper relative overflow-hidden font-sans">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/10 blur-[120px] pointer-events-none"></div>

      <Navbar />

      <div className="max-w-7xl mx-auto z-10 relative fade-up" style={{ animationDelay: '0.1s' }}>
        
        {/* Page Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">{t("welcome")}, <span className="gradient-text">{rawUsername}</span>!</h1>
            <p className="page-sub">Here is your daily workflow and project overview.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
             {isAdmin && (
              <button onClick={() => setShowAddTaskModal(true)} className="btn-primary">
                <Plus className="w-4 h-4" />
                {t("addTask")}
              </button>
            )}
            {isAdmin && (
              <Link to="/team">
                <button className="btn-ghost">
                  <UserPlus className="w-4 h-4" />
                  {t("addEmployee")}
                </button>
              </Link>
            )}
          </div>
        </div>

        {/* Dashboard Content Grid */}
        <div className="flex flex-col gap-6">
          
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="stat-card fade-up" style={{ animationDelay: '0.2s' }}>
              <div className="icon-box bg-blue-500/10 text-blue-400 border border-blue-500/20"><Activity className="w-5 h-5"/></div>
              <div className="number text-white">{summary.total_tasks}</div>
              <div className="label">{t("totalTask")} <span className="text-blue-400 font-semibold ml-1">{t("global")}</span></div>
            </div>

            <div className="stat-card fade-up" style={{ animationDelay: '0.3s' }}>
              <div className="icon-box bg-amber-500/10 text-amber-400 border border-amber-500/20"><Clock className="w-5 h-5"/></div>
              <div className="number text-white">{summary.pending_tasks}</div>
              <div className="label">{t("pendingTask")} <span className="text-amber-400 font-semibold ml-1">{t("todo")}</span></div>
            </div>

            <div className="stat-card fade-up" style={{ animationDelay: '0.4s' }}>
              <div className="icon-box bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><CheckCircle2 className="w-5 h-5"/></div>
              <div className="number text-white">{summary.completed_tasks}</div>
              <div className="label">{t("completedTask")} <span className="text-emerald-400 font-semibold ml-1">{t("verified")}</span></div>
            </div>

            <div className="stat-card fade-up" style={{ animationDelay: '0.5s' }}>
              <div className="icon-box bg-rose-500/10 text-rose-400 border border-rose-500/20"><AlertTriangle className="w-5 h-5"/></div>
              <div className="number text-white">{summary.overdue_tasks}</div>
              <div className="label">{t("overdueTask")} <span className="text-rose-400 font-semibold ml-1">{t("urgent")}</span></div>
            </div>
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-6 fade-up" style={{ animationDelay: '0.6s' }}>
              <h4 className="font-bold text-sm text-slate-200 mb-6 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-400"/> {t("taskProgress")}
              </h4>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} contentStyle={{ background: 'rgba(15,23,42,0.9)', backdropFilter:'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#f1f5f9', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={60}>
                      {barChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card p-6 fade-up" style={{ animationDelay: '0.7s' }}>
              <h4 className="font-bold text-sm text-slate-200 mb-6 flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-400"/> {t("weeklyOverview")}
              </h4>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.9)', backdropFilter:'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#f1f5f9', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }} />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 20 }} iconType="circle" />
                    <Line type="monotone" dataKey="completed" stroke="#2563eb" strokeWidth={3} dot={{ strokeWidth: 2, r: 4 }} activeDot={{ r: 6, strokeWidth: 0 }} name={t("completed")} />
                    <Line type="monotone" dataKey="created" stroke="#8b5cf6" strokeWidth={3} dot={{ strokeWidth: 2, r: 4 }} activeDot={{ r: 6, strokeWidth: 0 }} name={t("created")} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Secondary Stats Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="card p-6 fade-up" style={{ animationDelay: '0.8s' }}>
              <h4 className="font-bold text-sm text-slate-200 mb-6">{t("priorityDistribution")}</h4>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={priorityData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={5} stroke="none">
                      {priorityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.9)', backdropFilter:'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#f1f5f9' }} itemStyle={{ color: '#fff' }} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card p-6 fade-up" style={{ animationDelay: '0.9s' }}>
               <h4 className="font-bold text-sm text-slate-200 mb-6">{t("departmentWorkload")}</h4>
               <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={departmentData} layout="vertical" margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                    <XAxis type="number" stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.8)" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} contentStyle={{ background: 'rgba(15,23,42,0.9)', backdropFilter:'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#f1f5f9' }} />
                    <Bar dataKey="tasks" fill="#059669" radius={[0, 4, 4, 0]} maxBarSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card p-6 flex flex-col justify-between fade-up" style={{ animationDelay: '1.0s' }}>
              <div>
                <h4 className="font-bold text-sm text-slate-200 mb-2">{t("quickNavigation")}</h4>
                <p className="text-sm text-slate-400 mb-6">{t("jumpDirectly")}</p>
              </div>
              <div className="flex flex-col gap-3">
                {isAdmin && (
                  <Link to="/manage-users" className="flex items-center justify-between p-4 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.15)] transition-all text-sm font-semibold text-white group">
                    <span className="flex items-center gap-3"><Users className="w-4 h-4 text-blue-400"/> {t("manageEmployees")}</span>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors group-hover:translate-x-1" />
                  </Link>
                )}
                <Link to="/my-task" className="flex items-center justify-between p-4 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.15)] transition-all text-sm font-semibold text-white group">
                   <span className="flex items-center gap-3"><CheckSquare className="w-4 h-4 text-emerald-400"/> {t("manageTasks")}</span>
                   <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center text-sm text-slate-500 font-medium">
          <p>{t("footerText")}</p>
        </footer>
      </div>

      {/* Add Task Modal */}
      {showAddTaskModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 fade-up">
          <div className="glass-dark border border-[rgba(255,255,255,0.1)] rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
            <h3 className="text-xl font-bold text-white mb-6 tracking-tight">{t("createNewTask")}</h3>

            <form onSubmit={handleAddTask} className="flex flex-col gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t("title")}</label>
                <input
                  type="text"
                  required
                  placeholder={t("taskTitlePlaceholder")}
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t("description")}</label>
                <textarea
                  required
                  placeholder={t("taskDescriptionPlaceholder")}
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-500 h-28 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t("status")}</label>
                  <select
                    value={taskForm.status}
                    onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
                    className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-all appearance-none"
                  >
                    <option value="pending" className="bg-slate-900">{t("pending")}</option>
                    <option value="in_progress" className="bg-slate-900">{t("inProgress")}</option>
                    <option value="completed" className="bg-slate-900">{t("completed")}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t("priority")}</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                    className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-all appearance-none"
                  >
                    <option value="high" className="bg-slate-900">{t("high")}</option>
                    <option value="medium" className="bg-slate-900">{t("medium")}</option>
                    <option value="low" className="bg-slate-900">{t("low")}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t("dueDate")}</label>
                <input
                  type="datetime-local"
                  required
                  value={taskForm.due_date ? taskForm.due_date.slice(0, 16) : ''}
                  onChange={(e) => setTaskForm({ ...taskForm, due_date: new Date(e.target.value).toISOString() })}
                  className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-all"
                  style={{ colorScheme: 'dark' }}
                />
              </div>

              {isAdmin && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Assign To Employee</label>
                  <select
                    value={taskForm.assigned_to_id}
                    onChange={(e) => setTaskForm({ ...taskForm, assigned_to_id: e.target.value })}
                    className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-all appearance-none"
                  >
                    <option value="" className="bg-slate-900">
                      {users.length > 0 ? '— Select Employee —' : '— No employees added yet —'}
                    </option>
                    {users.map(u => (
                      <option key={u.id} value={u.id} className="bg-slate-900">{u.username || u.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddTaskModal(false)}
                  className="btn-ghost flex-1 justify-center"
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1 justify-center"
                >
                  {t("createTask")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;

