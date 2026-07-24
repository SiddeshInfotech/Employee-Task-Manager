import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Trash2, Eye } from 'lucide-react';
import Navbar from './Navbar';
import api, { showToast } from './axios';

function MyTask() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [sortByDueDate, setSortByDueDate] = useState(false);

  const role = localStorage.getItem('role') || 'employee';

  const fetchTasks = async () => {
    try {
      const res = await api.get('/tasks/?skip=0&limit=100');
      if (res.data) {
        const mapped = res.data.map(t => ({
          id: t.task_id || t.id,
          task: t.task_title || t.title || 'Untitled Task',
          due: t.due_date ? new Date(t.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No Due Date',
          status: t.status
            ? (t.status === 'in_progress'
              ? 'In Progress'
              : t.status.charAt(0).toUpperCase() + t.status.slice(1))
            : 'Pending',

          priority: t.priority
            ? t.priority.charAt(0).toUpperCase() + t.priority.slice(1)
            : 'Low',
          progress: t.status === 'completed' ? 100 : t.status === 'in_progress' ? 60 : 20,
          assignee: t.assigned_to || t.employee_id || 'Assigned'
        }));
        setTasks(mapped);
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to fetch tasks", "error");
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleDeleteTask = async (id) => {
    if (role !== 'admin') {
      showToast('Deletions are only authorized for Admin accounts.', 'error');
      return;
    }
    try {
      await api.delete(`/tasks/${id}`);
      showToast('Task deleted successfully');
      fetchTasks();
    } catch (err) {
      console.error(err);
      showToast("Failed to delete task", "error");
    }
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
            <h2 className="text-3xl font-bold text-white">My Task</h2>
            <p className="text-sm text-slate-300 mt-1">Manage and track your assigned task pipelines</p>
          </div>

          {role === 'admin' && (
            <button
              onClick={() => navigate('/create-task')}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-blue-500/25"
            >
              <Plus className="w-4.5 h-4.5" />
              Create Task
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
              placeholder="Search Task"
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
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>

            {/* Priority Select */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:outline-none"
            >
              <option value="All">All Priority</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            {/* Sort checkbox */}
            <button
              onClick={() => setSortByDueDate(!sortByDueDate)}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${sortByDueDate ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
                }`}
            >
              Sort Due Date
            </button>
          </div>
        </div>

        {/* Tasks Table */}
        <div className="bg-white text-slate-800 rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <p className="font-semibold text-lg">No tasks found</p>
              <p className="text-xs text-slate-400 mt-1">Try relaxing filters or search terms</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-left">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Task</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Due Date</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Priority</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Progress</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((task) => (
                    <tr key={task.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-950 text-sm">{task.task}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Assigned to: {task.assignee}</div>
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
                            View Detail
                          </button>

                          {role === 'admin' && (
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-all"
                              title="Delete task"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
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
        <p className="mb-2">© 2026 Employee Task Tracker System | All Rights Reserved</p>
        <p><span className="text-slate-400 font-semibold"></span></p>
      </footer>
    </div>
  );
}

export default MyTask;