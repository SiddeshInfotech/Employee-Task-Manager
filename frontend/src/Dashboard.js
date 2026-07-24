import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, Cell, PieChart, Pie } from 'recharts';
import { Bell, Mail, Search, LogOut, LayoutDashboard, CheckSquare, BarChart3, Users, Settings, Plus, UserPlus, FileText, ArrowRight } from 'lucide-react';
import api, { showToast } from './axios';

function Dashboard() {
  const navigate = useNavigate();
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

  const username = localStorage.getItem('username') || 'John';
  const role = localStorage.getItem('role') || 'employee';

  useEffect(() => {
    // GET /dashboard/summary Bearer mount
    const fetchSummary = async () => {
      try {
        const res = await api.get('/dashboard/summary');
        if (res.data) {
          setSummary(res.data);
        }
      } catch (err) {
        console.error('Error fetching summary, using defaults.', err);
      }
    };

    const fetchUsers = async () => {
      if (role === 'admin') {
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
  }, [role]);

  const handleAddTask = async (e) => {
    e.preventDefault();
    try {
      const formattedDueDate = taskForm.due_date ? taskForm.due_date.split('T')[0] : null;
      const assignedEmpId = taskForm.assigned_to_id ? Number(taskForm.assigned_to_id) : null;

      const payload = {
        task_title: taskForm.title,
        task_description: taskForm.description,
        employee_id: assignedEmpId,
        due_date: formattedDueDate,
        title: taskForm.title,
        description: taskForm.description,
        status: taskForm.status,
        priority: taskForm.priority,
        assigned_to_id: assignedEmpId
      };

      await api.post('/tasks/', payload);
      showToast('Task added successfully!');
      setTaskForm({ title: '', description: '', status: 'pending', priority: 'high', due_date: '', assigned_to_id: '' });
      setShowAddTaskModal(false);
      // Refresh summary
      const res = await api.get('/dashboard/summary');
      if (res.data) setSummary(res.data);
    } catch (err) {
      console.error("Dashboard Add Task Error:", err);
      let errMsg = 'Failed to create task';
      if (err.response?.data?.detail) {
        if (typeof err.response.data.detail === 'string') {
          errMsg = err.response.data.detail;
        } else if (Array.isArray(err.response.data.detail)) {
          errMsg = err.response.data.detail.map(e => `${e.loc?.slice(-1)[0] || 'field'}: ${e.msg}`).join(', ');
        }
      }
      showToast(errMsg, 'error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    showToast('Logged out successfully.');
    navigate('/login');
  };

  // Mock data for charts matching the dashboard style
  const barChartData = [
    { name: 'Completed', value: summary.completed_tasks, color: '#2563eb' },
    { name: 'Pending', value: summary.pending_tasks, color: '#f59e0b' },
    { name: 'Overdue', value: summary.overdue_tasks, color: '#ef4444' },
    { name: 'In Progress', value: summary.in_progress_tasks || 25, color: '#10b981' }
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
    { name: 'High', value: 45, color: '#ef4444' },
    { name: 'Medium', value: 30, color: '#f59e0b' },
    { name: 'Low', value: 25, color: '#10b981' }
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
      <aside className="w-64 bg-[#b5893d] text-slate-900 flex flex-col justify-between flex-shrink-0 border-r border-[#967131] shadow-2xl">
        <div>
          {/* Sidebar User Header */}
          <div className="p-6 border-b border-[#967131] flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
              {username.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="font-bold text-slate-950 text-base leading-tight">{username}</h3>
              <p className="text-[11px] text-slate-800 font-semibold tracking-wider uppercase">Active Session</p>
            </div>
          </div>

          {/* Nav links */}
          <nav className="p-4 flex flex-col gap-1">
            <Link
              to="/dashboard"
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900/10 hover:bg-slate-900/20 text-slate-950 font-bold transition-all text-sm no-underline"
            >
              <LayoutDashboard className="w-4 h-4 text-slate-900" />
              Dashboard
            </Link>
            <Link
              to="/my-task"
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-900/15 text-slate-950 font-semibold transition-all text-sm no-underline"
            >
              <CheckSquare className="w-4 h-4 text-slate-900" />
              Task
            </Link>
            {role === 'admin' && (
              <Link
                to="/reports"
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-900/15 text-slate-950 font-semibold transition-all text-sm no-underline"
              >
                <BarChart3 className="w-4 h-4 text-slate-900" />
                Report
              </Link>
            )}
            <Link
              to="/team"
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-900/15 text-slate-950 font-semibold transition-all text-sm no-underline"
            >
              <Users className="w-4 h-4 text-slate-900" />
              Team
            </Link>
            <Link
              to="/settings"
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-900/15 text-slate-950 font-semibold transition-all text-sm no-underline"
            >
              <Settings className="w-4 h-4 text-slate-900" />
              Setting
            </Link>
            {role === 'admin' && (
              <Link
                to="/manage-users"
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-900/15 text-slate-950 font-semibold transition-all text-sm no-underline"
              >
                <Users className="w-4 h-4 text-slate-900" />
                Manage Users
              </Link>
            )}
          </nav>
        </div>

        {/* Sidebar Footer */}
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
        <header className="px-8 py-5 bg-[#0f172a]/60 border-b border-slate-800/80 backdrop-blur-md flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Welcome, {username}!</h2>

          <div className="flex items-center gap-4">
            {/* Header controls matching image 2 */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-9 pr-4 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 w-48"
              />
            </div>
            <button className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 hover:text-white transition-all relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-500"></span>
            </button>
            <button className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 hover:text-white transition-all">
              <Mail className="w-4 h-4" />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-rose-400 hover:bg-rose-950/20 transition-all"
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
            <div className="bg-[#10b981] text-white p-5 rounded-2xl shadow-xl flex flex-col justify-between min-h-[110px] hover:scale-102 transition-all">
              <span className="text-xs font-bold uppercase tracking-wider opacity-85">Total Task</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-3xl font-extrabold">{summary.total_tasks}</span>
                <span className="text-xs font-semibold bg-white/20 px-2 py-0.5 rounded-full">Global</span>
              </div>
            </div>

            {/* Stat Card 2 - Pending Tasks */}
            <div className="bg-[#f59e0b] text-white p-5 rounded-2xl shadow-xl flex flex-col justify-between min-h-[110px] hover:scale-102 transition-all">
              <span className="text-xs font-bold uppercase tracking-wider opacity-85">Pending Task</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-3xl font-extrabold">{summary.pending_tasks}</span>
                <span className="text-xs font-semibold bg-white/20 px-2 py-0.5 rounded-full">To-Do</span>
              </div>
            </div>

            {/* Stat Card 3 - Completed Tasks */}
            <div className="bg-[#2563eb] text-white p-5 rounded-2xl shadow-xl flex flex-col justify-between min-h-[110px] hover:scale-102 transition-all">
              <span className="text-xs font-bold uppercase tracking-wider opacity-85">Completed Task</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-3xl font-extrabold">{summary.completed_tasks}</span>
                <span className="text-xs font-semibold bg-white/20 px-2 py-0.5 rounded-full">Verified</span>
              </div>
            </div>

            {/* Stat Card 4 - Overdue Tasks */}
            <div className="bg-[#ef4444] text-white p-5 rounded-2xl shadow-xl flex flex-col justify-between min-h-[110px] hover:scale-102 transition-all">
              <span className="text-xs font-bold uppercase tracking-wider opacity-85">Overdue Task</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-3xl font-extrabold">{summary.overdue_tasks}</span>
                <span className="text-xs font-semibold bg-white/20 px-2 py-0.5 rounded-full">Urgent</span>
              </div>
            </div>
          </div>

          {/* Quick Info Grid (4 Charts + Logs) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Chart 1: Task Progress (Bar Chart) */}
            <div className="lg:col-span-6 bg-[#0f172a]/40 backdrop-blur-md border border-slate-800 p-5 rounded-2xl">
              <h4 className="font-bold text-sm text-slate-300 mb-4 uppercase tracking-wider">Task Progress</h4>
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

            {/* Chart 2: Weekly Overview (Line Chart) */}
            <div className="lg:col-span-6 bg-[#0f172a]/40 backdrop-blur-md border border-slate-800 p-5 rounded-2xl">
              <h4 className="font-bold text-sm text-slate-300 mb-4 uppercase tracking-wider">Weekly Overview</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, color: '#f8fafc' }} />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                    <Line type="monotone" dataKey="completed" stroke="#2563eb" strokeWidth={3} name="Completed" activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="created" stroke="#f59e0b" strokeWidth={3} name="Created" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: Priority Overview (Pie Chart) */}
            <div className="lg:col-span-4 bg-[#0f172a]/40 backdrop-blur-md border border-slate-800 p-5 rounded-2xl flex flex-col">
              <h4 className="font-bold text-sm text-slate-300 mb-4 uppercase tracking-wider">Priority Distribution</h4>
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
            <div className="lg:col-span-4 bg-[#0f172a]/40 backdrop-blur-md border border-slate-800 p-5 rounded-2xl">
              <h4 className="font-bold text-sm text-slate-300 mb-4 uppercase tracking-wider">Department Workload</h4>
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
            <div className="lg:col-span-4 bg-[#0f172a]/40 backdrop-blur-md border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-sm text-slate-300 mb-3 uppercase tracking-wider">Quick Navigation</h4>
                <p className="text-xs text-slate-400 mb-4">Jump directly to task pipelines or team status pages.</p>
              </div>
              <div className="flex flex-col gap-2">
                {role === "admin" && (
                  <Link
                    to="/manage-users"
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 transition-all text-xs font-semibold no-underline text-white"
                  >
                    Manage Employees
                    <ArrowRight className="w-4 h-4 text-blue-500" />
                  </Link>
                )}
                <Link to="/my-task" className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-850 transition-all text-xs font-semibold no-underline text-white">
                  Manage Tasks <ArrowRight className="w-4 h-4 text-emerald-500" />
                </Link>
              </div>
            </div>

            {/* Recent Activities List */}
            <div className="lg:col-span-6 bg-[#0f172a]/40 backdrop-blur-md border border-slate-800 p-5 rounded-2xl">
              <h4 className="font-bold text-sm text-slate-300 mb-4 uppercase tracking-wider">Recent Activities</h4>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                  <div>
                    <p className="text-xs font-semibold text-white">Ram completed <span className="text-blue-400">"design mockup"</span></p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Marketing Department</p>
                  </div>
                  <span className="text-[10px] text-slate-400">10 mins ago</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                  <div>
                    <p className="text-xs font-semibold text-white">Sita added a new task <span className="text-amber-400">"Update Docs"</span></p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Development Department</p>
                  </div>
                  <span className="text-[10px] text-slate-400">30 mins ago</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-white">Ashu commented on <span className="text-emerald-400">"Client Meeting"</span></p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Design Department</p>
                  </div>
                  <span className="text-[10px] text-slate-400">1 hr ago</span>
                </div>
              </div>
            </div>

            {/* Upcoming Deadlines */}
            <div className="lg:col-span-6 bg-[#0f172a]/40 backdrop-blur-md border border-slate-800 p-5 rounded-2xl">
              <h4 className="font-bold text-sm text-slate-300 mb-4 uppercase tracking-wider">Upcoming Deadlines</h4>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                  <div>
                    <p className="text-xs font-semibold text-white">Website Update</p>
                    <p className="text-[10px] text-slate-400">Critical release deadline</p>
                  </div>
                  <span className="text-xs font-bold text-amber-500">Due: Apr 25</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                  <div>
                    <p className="text-xs font-semibold text-white">Team Meeting</p>
                    <p className="text-[10px] text-slate-400">Monthly coordination</p>
                  </div>
                  <span className="text-xs font-bold text-amber-500">Due: Apr 27</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-white">Report Submission</p>
                    <p className="text-[10px] text-slate-400">Q2 financial reports</p>
                  </div>
                  <span className="text-xs font-bold text-amber-500">Due: Apr 28</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Row Buttons */}
          <div className="flex flex-wrap gap-4 mt-4">
            {role === 'admin' && (
              <button
                onClick={() => setShowAddTaskModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-[#2563eb] hover:bg-blue-700 text-white rounded-xl font-semibold"
              >
                <Plus className="w-5 h-5" />
                Add Task
              </button>
            )}

            {role === 'admin' && (
              <Link to="/team" className="no-underline">
                <button className="flex items-center gap-2 px-6 py-3 bg-[#10b981] hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/10 transition-all hover:scale-102">
                  <UserPlus className="w-5 h-5" />
                  Add Employee
                </button>
              </Link>
            )}

            {role === 'admin' && (
              <Link to="/reports" className="no-underline">
                <button className="flex items-center gap-2 px-6 py-3 bg-[#f59e0b] hover:bg-amber-600 text-white rounded-xl font-semibold shadow-lg shadow-amber-500/10 transition-all hover:scale-102">
                  <FileText className="w-5 h-5" />
                  Generate Report
                </button>
              </Link>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="w-full bg-[#090d16] border-t border-slate-900 py-8 px-6 text-center text-xs text-slate-500 mt-auto">
          <p className="mb-2">© 2026 Employee Task Tracker System | All Rights Reserved</p>
          <p><span className="text-slate-400 font-semibold"></span></p>
        </footer>
      </div>

      {/* Add Task Modal */}
      {showAddTaskModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Create New Task</h3>

            <form onSubmit={handleAddTask} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Implement Swagger Docs"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Description</label>
                <textarea
                  required
                  placeholder="e.g. Write JSON schema"
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 h-24"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Status</label>
                  <select
                    value={taskForm.status}
                    onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Due Date</label>
                <input
                  type="datetime-local"
                  required
                  value={taskForm.due_date ? taskForm.due_date.slice(0, 16) : ''}
                  onChange={(e) => setTaskForm({ ...taskForm, due_date: new Date(e.target.value).toISOString() })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              {role === 'admin' && users.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Assign To User</label>
                  <select
                    value={taskForm.assigned_to_id}
                    onChange={(e) => setTaskForm({ ...taskForm, assigned_to_id: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select Employee...</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.username}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowAddTaskModal(false)}
                  className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold"
                >
                  Create Task
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
