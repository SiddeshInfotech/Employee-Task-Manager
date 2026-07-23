import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Trash2, Calendar, User, HelpCircle, Layers, CheckCircle } from 'lucide-react';
import Navbar from './Navbar';
import api, { showToast } from './axios';

const dummyTasks = [
  { id: 1, title: 'Design Homepage Layout', dueDate: '2026-07-20T18:00:00Z', assignedTo: 'David Mailer', priority: 'High', status: 'in_progress', description: 'Create the home page design for the client\'s website.' },
  { id: 2, title: 'Update Client Documents', dueDate: '2026-07-20T18:00:00Z', assignedTo: 'Sarah Wilson', priority: 'Medium', status: 'completed', description: 'Update all client documentation.' },
  { id: 3, title: 'Prepare Weekly Report', dueDate: '2026-07-20T18:00:00Z', assignedTo: 'Ritik Verma', priority: 'Low', status: 'pending', description: 'Compile weekly progress report.' },
];

function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  
  // Form states
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    status: 'pending',
    priority: 'high',
    due_date: ''
  });

  const role = localStorage.getItem('role') || 'employee';

  const fetchTaskDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/tasks/${id}`);
      if (res.data) {
        setTask(res.data);
        setEditForm({
          title: res.data.title,
          description: res.data.description,
          status: res.data.status,
          priority: res.data.priority,
          due_date: res.data.due_date ? res.data.due_date.slice(0, 16) : ''
        });
      }
    } catch (err) {
      console.error('Failed to load task details from API, using dummy fallback.', err);
      const found = dummyTasks.find(t => t.id === parseInt(id));
      if (found) {
        setTask(found);
        setEditForm({
          title: found.title,
          description: found.description,
          status: found.status,
          priority: found.priority,
          due_date: found.dueDate.slice(0, 16)
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaskDetails();
  }, [id]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      // Employees are restricted to only updating status
      if (role !== 'admin') {
        const statusOnlyUpdate = { status: editForm.status };
        await api.put(`/tasks/${id}`, statusOnlyUpdate);
        showToast('Status updated successfully');
      } else {
        await api.put(`/tasks/${id}`, {
          title: editForm.title,
          description: editForm.description,
          status: editForm.status,
          priority: editForm.priority,
          due_date: new Date(editForm.due_date).toISOString()
        });
        showToast('Task updated successfully');
      }
      setEditing(false);
      fetchTaskDetails();
    } catch (err) {
      console.error(err);
      // Fallback
      showToast('Failed to update task');
      setEditing(false);
    }
  };

  const handleDelete = async () => {
    if (role !== 'admin') {
      showToast('Deletions are only authorized for Admin accounts.', 'error');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      await api.delete(`/tasks/${id}`);
      showToast('Task deleted successfully');
      navigate('/my-task');
    } catch (err) {
      console.error(err);
      showToast('Failed to delete task');
      navigate('/my-task');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen text-slate-100 flex items-center justify-center bg-[#0b0f19]">
        <p className="text-sm font-semibold animate-pulse">Loading task details...</p>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen text-slate-100 flex flex-col items-center justify-center gap-4 bg-[#0b0f19]">
        <HelpCircle className="w-12 h-12 text-slate-400" />
        <h3 className="font-bold">Task Not Found</h3>
        <button onClick={() => navigate('/my-task')} className="px-4 py-2 bg-blue-600 rounded-xl text-xs font-semibold">Back to Tasks</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-100 flex flex-col font-sans bg-transparent">
      {/* Navbar */}
      <Navbar />

      {/* Main Container */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12 flex flex-col gap-6">
        
        {/* Header Toolbar */}
        <div className="flex items-center justify-between bg-[#0f172a]/60 border border-slate-800 p-5 rounded-2xl backdrop-blur-md shadow-xl w-full">
          <button
            onClick={() => navigate('/my-task')}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all shadow"
          >
            <ArrowLeft className="w-4 h-4" /> Back to My Tasks
          </button>

          <div className="flex items-center gap-3">
            {role === 'admin' && (
              <button
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-rose-500/10"
              >
                <Trash2 className="w-4 h-4" /> Delete Task
              </button>
            )}

            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-500/10"
              >
                <Edit2 className="w-4 h-4" /> Edit Task
              </button>
            )}
          </div>
        </div>

        {/* Task Details / Edit Form card */}
        <div className="bg-white text-slate-800 rounded-3xl shadow-2xl border border-white/20 p-8">
          <form onSubmit={handleUpdate} className="flex flex-col gap-5">
            {/* Title field */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Task Title</label>
              {editing && role === 'admin' ? (
                <input
                  type="text"
                  required
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                />
              ) : (
                <h3 className="text-xl font-bold text-slate-900">{task.title || task.task}</h3>
              )}
            </div>

            {/* Description field */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Task Description</label>
              {editing && role === 'admin' ? (
                <textarea
                  required
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 h-24"
                />
              ) : (
                <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">{task.description}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Status Select */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Status</label>
                {editing ? (
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 uppercase tracking-wider block w-max mt-1">
                    {task.status}
                  </span>
                )}
              </div>

              {/* Priority Select */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Priority</label>
                {editing && role === 'admin' ? (
                  <select
                    value={editForm.priority}
                    onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-600 uppercase tracking-wider block w-max mt-1">
                    {task.priority}
                  </span>
                )}
              </div>

              {/* Due date picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Due Date</label>
                {editing && role === 'admin' ? (
                  <input
                    type="datetime-local"
                    value={editForm.due_date}
                    onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
                  />
                ) : (
                  <div className="flex items-center gap-2 mt-1.5 text-sm text-slate-700 font-medium">
                    <Calendar className="w-4 h-4 text-blue-500" /> {task.due_date || task.dueDate || 'No date set'}
                  </div>
                )}
              </div>

              {/* Assigned To detail */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Assigned To</label>
                <div className="flex items-center gap-2 mt-1.5 text-sm text-slate-700 font-medium">
                  <User className="w-4 h-4 text-emerald-500" /> {task.assigned_to || task.assignedTo || 'Unassigned'}
                </div>
              </div>
            </div>

            {/* Cancel/Save changes actions */}
            {editing && (
              <div className="flex items-center gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-500/10"
                >
                  Save Changes
                </button>
              </div>
            )}
          </form>
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

export default TaskDetail;