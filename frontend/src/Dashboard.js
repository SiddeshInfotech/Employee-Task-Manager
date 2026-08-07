import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, Cell, PieChart, Pie } from 'recharts';
import { Bell, Mail, Search, LogOut, LayoutDashboard, CheckSquare, BarChart3, Users, Settings, Plus, UserPlus, FileText, ArrowRight, TrendingUp } from 'lucide-react';
import api, { showToast } from './axios';
import { useTranslation } from 'react-i18next';
import './DashboardAnimations.css';

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

  const [users, setUsers] = useState([]);

  const username = localStorage.getItem('username') || 'John';
  const role = localStorage.getItem('role') || 'employee';
  const isAdmin = role.toLowerCase() === 'admin';

  useEffect(() => {
    const fetchSummary = async () => {
      // Helper status classifiers (work on both numeric status_id and string status)
      const isDone = (t) =>
        Number(t.status_id) === 3 ||
        ['completed', 'complete', 'done'].includes(String(t.status || '').toLowerCase().trim());
      const isPending = (t) =>
        Number(t.status_id) === 1 ||
        ['pending', 'to-do', 'todo'].includes(String(t.status || '').toLowerCase().trim());
      const isInProgress = (t) =>
        Number(t.status_id) === 2 ||
        ['in_progress', 'inprogress', 'in progress'].includes(String(t.status || '').toLowerCase().trim());
      const isOverdue = (t) => {
        if (isDone(t)) return false;
        const due = t.due_date || t.dueDate;
        return due && new Date(due) < new Date();
      };

      try {
        // Primary source: /tasks/ is already scoped to the logged-in employee by the backend.
        const tasksRes = await api.get('/tasks/?skip=0&limit=200');
        if (tasksRes.data && Array.isArray(tasksRes.data)) {
          const allTasks = tasksRes.data;

          // Fetch unread notification count separately (best-effort)
          let unread = 0;
          try {
            const summaryRes = await api.get('/dashboard/summary');
            if (summaryRes.data) unread = summaryRes.data.unread_notifications || 0;
          } catch (_) { }

          setSummary({
            total_tasks: allTasks.length,
            completed_tasks: allTasks.filter(isDone).length,
            pending_tasks: allTasks.filter(isPending).length,
            in_progress_tasks: allTasks.filter(isInProgress).length,
            overdue_tasks: allTasks.filter(isOverdue).length,
            unread_notifications: unread
          });
        }
      } catch (err) {
        console.warn('Tasks API unavailable:', err);
      }
    };

    const fetchUsers = async () => {
      if (isAdmin) {
        try {
          const res = await api.get('/users/');
          if (res.data) setUsers(res.data);
        } catch (err) {
          console.error('Error fetching users', err);
        }
      }
    };

    fetchSummary();
    fetchUsers();
  }, []);



  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    localStorage.removeItem('employee_id');
    localStorage.removeItem('user_id');
    showToast('Logged out successfully.');
    navigate('/login');
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
    <div className="flex min-h-screen bg-transparent text-slate-100 font-sans">
      {/* Sidebar - Gold Theme from Image 2 */}
      <aside className="db-sidebar w-64 bg-[#b5893d] text-slate-900 flex flex-col justify-between flex-shrink-0 border-r border-[#967131] shadow-2xl">
        <div>
          {/* Sidebar User Header */}
          <div className="p-6 border-b border-[#967131] flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
              {username.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="font-bold text-slate-950 text-base leading-tight">{username}</h3>
              <p className="text-[11px] text-slate-800 font-semibold tracking-wider uppercase"> {t("activeSession")}</p>
            </div>
          </div>

          <nav className="p-4 flex flex-col gap-1">
            <Link
              to="/dashboard"
              className="db-nav-item flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900/10 hover:bg-slate-900/20 text-slate-950 font-bold transition-all text-sm no-underline"
            >
              <LayoutDashboard className="w-4 h-4 text-slate-900" />
              {t("dashboard")}
            </Link>
            {isAdmin && (
              <Link
                to="/team"
                className="db-nav-item flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-900/15 text-slate-950 font-semibold transition-all text-sm no-underline"
              >
                <Users className="w-4 h-4 text-slate-900" />
                {t("team")}
              </Link>
            )}
            <Link
              to="/my-task"
              className="db-nav-item flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-900/15 text-slate-950 font-semibold transition-all text-sm no-underline"
            >
              <CheckSquare className="w-4 h-4 text-slate-900" />
              {t("task")}
            </Link>
            {isAdmin && (
              <Link
                to="/reports"
                className="db-nav-item flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-900/15 text-slate-950 font-semibold transition-all text-sm no-underline"
              >
                <BarChart3 className="w-4 h-4 text-slate-900" />
                {t("report")}
              </Link>
            )}

            <Link
              to="/work-progress"
              className="db-nav-item flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-900/15 text-slate-950 font-semibold transition-all text-sm no-underline"
            >
              <TrendingUp className="w-4 h-4 text-slate-900" />
              Work Progress
            </Link>
            <Link
              to="/settings"
              className="db-nav-item flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-900/15 text-slate-950 font-semibold transition-all text-sm no-underline"
            >
              <Settings className="w-4 h-4 text-slate-900" />
              {t("settings")}
            </Link>
          </nav>
        </div>

        <div className="p-6 border-t border-[#967131] flex items-center gap-3 bg-slate-950/10">
          <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
            {role[0].toUpperCase()}
          </div>
          <div>
            <h4 className="font-bold text-slate-950 text-xs">{username}</h4>
            <p className="text-[10px] text-slate-900 font-bold uppercase tracking-wider">{role}</p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Header toolbar */}
        <header className="db-header px-8 py-5 bg-[#0f172a]/60 border-b border-slate-800/80 backdrop-blur-md flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">
            {t("welcome")}, {username}!
          </h2>

          <div className="flex items-center gap-4">
            {/* Header controls matching image 2 */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder={t("search")}
                className="pl-9 pr-4 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 w-48"
              />
            </div>
            <button className="db-header-btn p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 hover:text-white transition-all relative">
              <Bell className="w-4 h-4" />
              <span className="db-notification-dot absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-500"></span>
            </button>
            <button className="db-header-btn p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 hover:text-white transition-all">
              <Mail className="w-4 h-4" />
            </button>
            <button
              onClick={handleLogout}
              className="db-header-btn p-2 bg-slate-900 border border-slate-800 rounded-xl text-rose-400 hover:bg-rose-950/20 transition-all"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Dashboard Grid Content */}
        <main className="p-8 flex flex-col gap-6 max-w-7xl w-full mx-auto">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Stat Card 1 - Total Tasks */}
            <div className="db-stat-card bg-[#10b981] text-white p-5 rounded-2xl shadow-xl flex flex-col justify-between min-h-[110px]">
              <span className="text-xs font-bold uppercase tracking-wider opacity-85">{t("totalTask")}</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="db-stat-number text-3xl font-extrabold">{summary.total_tasks}</span>
                <span className="text-xs font-semibold bg-white/20 px-2 py-0.5 rounded-full"> {t("global")}</span>
              </div>
            </div>

            {/* Stat Card 2 - Pending Tasks */}
            <div className="db-stat-card bg-[#f59e0b] text-white p-5 rounded-2xl shadow-xl flex flex-col justify-between min-h-[110px]">
              <span className="text-xs font-bold uppercase tracking-wider opacity-85">{t("pendingTask")}</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="db-stat-number text-3xl font-extrabold">{summary.pending_tasks}</span>
                <span className="text-xs font-semibold bg-white/20 px-2 py-0.5 rounded-full"> {t("todo")}</span>
              </div>
            </div>

            {/* Stat Card 3 - Completed Tasks */}
            <div className="db-stat-card bg-[#2563eb] text-white p-5 rounded-2xl shadow-xl flex flex-col justify-between min-h-[110px]">
              <span className="text-xs font-bold uppercase tracking-wider opacity-85">{t("completedTask")}</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="db-stat-number text-3xl font-extrabold">{summary.completed_tasks}</span>
                <span className="text-xs font-semibold bg-white/20 px-2 py-0.5 rounded-full"> {t("verified")}</span>
              </div>
            </div>

            {/* Stat Card 4 - Overdue Tasks */}
            <div className="db-stat-card bg-[#ef4444] text-white p-5 rounded-2xl shadow-xl flex flex-col justify-between min-h-[110px]">
              <span className="text-xs font-bold uppercase tracking-wider opacity-85">{t("overdueTask")}</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="db-stat-number text-3xl font-extrabold">{summary.overdue_tasks}</span>
                <span className="text-xs font-semibold bg-white/20 px-2 py-0.5 rounded-full"> {t("urgent")}</span>
              </div>
            </div>
          </div>

          {/* Quick Info Grid (4 Charts + Logs) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Chart 1: Task Progress (Bar Chart) */}
            <div className="db-chart-panel lg:col-span-6 bg-[#0f172a]/40 backdrop-blur-md border border-slate-800 p-5 rounded-2xl">
              <h4 className="font-bold text-sm text-slate-300 mb-4 uppercase tracking-wider">{t("taskProgress")}</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, color: '#f8fafc' }} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {barChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Chart 2: Weekly Overview (Line Chart) */}
          <div className="db-chart-panel lg:col-span-6 bg-[#0f172a]/40 backdrop-blur-md border border-slate-800 p-5 rounded-2xl">
            <h4 className="font-bold text-sm text-slate-300 mb-4 uppercase tracking-wider">{t("weeklyOverview")}</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, color: '#f8fafc' }} />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                  <Line type="monotone" dataKey="completed" stroke="#2563eb" strokeWidth={3} name={t("completed")} activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="created" stroke="#f59e0b" strokeWidth={3} name={t("created")} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: Priority Overview (Pie Chart) */}
          <div className="db-chart-panel lg:col-span-4 bg-[#0f172a]/40 backdrop-blur-md border border-slate-800 p-5 rounded-2xl flex flex-col">
            <h4 className="font-bold text-sm text-slate-300 mb-4 uppercase tracking-wider">{t("priorityDistribution")}</h4>
            <div className="h-48 flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={priorityData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5}>
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, color: '#f8fafc' }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 4: Tasks by Department (Bar Chart) */}
          <div className="db-chart-panel lg:col-span-4 bg-[#0f172a]/40 backdrop-blur-md border border-slate-800 p-5 rounded-2xl">
            <h4 className="font-bold text-sm text-slate-300 mb-4 uppercase tracking-wider">{t("departmentWorkload")}</h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={10} />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={70} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, color: '#f8fafc' }} />
                  <Bar dataKey="tasks" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="db-quick-nav-panel lg:col-span-4 bg-[#0f172a]/40 backdrop-blur-md border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-sm text-slate-300 mb-3 uppercase tracking-wider">{t("quickNavigation")}</h4>
              <p className="text-xs text-slate-400 mb-4">{t("jumpDirectly")}</p>
            </div>
            <div className="flex flex-col gap-2">
              {role === "admin" && (
                <Link
                  to="/manage-users"
                  className="db-quick-link flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 transition-all text-xs font-semibold no-underline text-white"
                >
                  {t("manageEmployees")}
                  <ArrowRight className="w-4 h-4 text-blue-500" />
                </Link>
              )}
              <Link to="/my-task" className="db-quick-link flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-850 transition-all text-xs font-semibold no-underline text-white">
                {t("manageTasks")} <ArrowRight className="w-4 h-4 text-emerald-500" />
              </Link>
            </div>
          </div>

          {/* Recent Activities List */}
          <div className="db-activity-panel lg:col-span-6 bg-[#0f172a]/40 backdrop-blur-md border border-slate-800 p-5 rounded-2xl">
            <h4 className="font-bold text-sm text-slate-300 mb-4 uppercase tracking-wider">
              {t("recentActivities")}
            </h4>
            <div className="flex flex-col gap-4">
              <div className="db-activity-item flex items-center justify-between border-b border-slate-800/60 pb-3">
                <div>
                  <p className="text-xs font-semibold text-white">
                    {t("ramCompleted")} <span className="text-blue-400">"design mockup"</span>
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {t("marketingDepartment")}
                  </p>
                  <span className="text-[10px] text-slate-400">
                    {t("tenMinsAgo")}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                  <div>
                    <p className="text-xs font-semibold text-white">
                      {t("sitaAddedTask")} <span className="text-amber-400">"Update Docs"</span>
                    </p>

                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {t("developmentDepartment")}
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {t("thirtyMinsAgo")}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-white">
                      {t("ashuCommented")} <span className="text-emerald-400">"Client Meeting"</span>
                    </p>

                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {t("designDepartment")}
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {t("oneHourAgo")}
                  </span>
                </div>
              </div>
            </div>

            {/* Upcoming Deadlines */}
            <div className="lg:col-span-6 bg-[#0f172a]/40 backdrop-blur-md border border-slate-800 p-5 rounded-2xl">
              <h4 className="font-bold text-sm text-slate-300 mb-4 uppercase tracking-wider"> {t("upcomingDeadlines")}</h4>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                  <div>
                    <p className="text-xs font-semibold text-white">{t("websiteUpdate")}</p>
                    <p className="text-[10px] text-slate-400">{t("criticalReleaseDeadline")}</p>
                  </div>
                  <span className="text-xs font-bold text-amber-500"> {t("due")}: Apr 25</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                  <div>
                    <p className="text-xs font-semibold text-white">{t("teamMeeting")}</p>
                    <p className="text-[10px] text-slate-400">{t("monthlyCoordination")}</p>
                  </div>
                  <span className="text-xs font-bold text-amber-500">{t("due")}: Apr 27</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-white">{t("reportSubmission")}</p>
                    <p className="text-[10px] text-slate-400">{t("q2FinancialReports")}</p>
                  </div>
                  <span className="text-xs font-bold text-amber-500">{t("due")}: Apr 28</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Work Progress Widget ─────────────────────────── */}
          <div className="db-chart-panel bg-[#0f172a]/40 backdrop-blur-md border border-slate-800 p-5 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-sm text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                Work Progress
              </h4>
              <Link to="/work-progress" className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-semibold transition-colors no-underline">
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Mini donut */}
              <div className="flex-shrink-0 flex flex-col items-center">
                {(() => {
                  const total = summary.total_tasks || 0;
                  const done = summary.completed_tasks || 0;
                  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                  const r = 36, C = 2 * Math.PI * r, offset = C - (pct / 100) * C;
                  return (
                    <svg width="90" height="90" viewBox="0 0 90 90">
                      <circle cx="45" cy="45" r={r} fill="none" stroke="#1e293b" strokeWidth="9"/>
                      <circle cx="45" cy="45" r={r} fill="none" stroke="url(#dbGrad)" strokeWidth="9"
                        strokeLinecap="round" strokeDasharray={C} strokeDashoffset={offset}
                        transform="rotate(-90 45 45)" style={{ transition: 'stroke-dashoffset 0.8s ease' }}/>
                      <defs>
                        <linearGradient id="dbGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#6366f1"/>
                          <stop offset="100%" stopColor="#3b82f6"/>
                        </linearGradient>
                      </defs>
                      <text x="45" y="41" textAnchor="middle" fill="#f8fafc" fontSize="15" fontWeight="800">{pct}%</text>
                      <text x="45" y="54" textAnchor="middle" fill="#94a3b8" fontSize="7" fontWeight="600">Done</text>
                    </svg>
                  );
                })()}
              </div>
              {/* Stats row */}
              <div className="flex flex-wrap gap-3 flex-1">
                {[
                  { label: 'Total', val: summary.total_tasks || 0, color: '#6366f1' },
                  { label: 'In Progress', val: summary.in_progress_tasks || 0, color: '#3b82f6' },
                  { label: 'Completed', val: summary.completed_tasks || 0, color: '#10b981' },
                  { label: 'Pending', val: summary.pending_tasks || 0, color: '#f59e0b' },
                ].map((s) => (
                  <div key={s.label} className="flex-1 min-w-[80px] rounded-xl p-3 text-center"
                    style={{ background: `${s.color}18`, border: `1px solid ${s.color}40` }}>
                    <div className="text-lg font-extrabold" style={{ color: s.color }}>{s.val}</div>
                    <div className="text-[10px] text-slate-400 font-semibold mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Row Buttons */}
          <div className="flex flex-wrap gap-4 mt-4">
            {isAdmin && (
              <Link to="/create-task" className="no-underline">
                <button className="db-action-btn flex items-center gap-2 px-6 py-3 bg-[#2563eb] hover:bg-blue-700 text-white rounded-xl font-semibold">
                  <Plus className="w-5 h-5" />
                  {t("addTask")}
                </button>
              </Link>
            )}

            {isAdmin && (
              <Link to="/team" className="no-underline">
                <button className="db-action-btn flex items-center gap-2 px-6 py-3 bg-[#10b981] hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/10">
                  <UserPlus className="w-5 h-5" />
                  {t("addEmployee")}
                </button>
              </Link>
            )}

            {isAdmin && (
              <Link to="/reports" className="no-underline">
                <button className="db-action-btn flex items-center gap-2 px-6 py-3 bg-[#f59e0b] hover:bg-amber-600 text-white rounded-xl font-semibold shadow-lg shadow-amber-500/10">
                  <FileText className="w-5 h-5" />
                  {t("generateReport")}
                </button>
              </Link>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="db-footer w-full bg-[#090d16] border-t border-slate-900 py-8 px-6 text-center text-xs text-slate-500 mt-auto">
          <p className="mb-2">
            {t("footerText")}
          </p>
          <p><span className="text-slate-400 font-semibold"></span></p>
        </footer>
      </div>


    </div>
  );
}

export default Dashboard;