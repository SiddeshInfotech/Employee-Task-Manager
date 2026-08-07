import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Edit2, Trash2, Calendar, User, HelpCircle, Layers, CheckCircle } from 'lucide-react';
import Navbar from './Navbar';
import api, { showToast } from './axios';



function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(location.state?.edit || false);

  const [employees, setEmployees] = useState([]);

  // Form states
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    due_date: '',
    employee_id: ''
  });

  const role = localStorage.getItem('role') || 'employee';

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await api.get('/employees/');
        if (res.data && Array.isArray(res.data)) {
          setEmployees(res.data);
        }
      } catch (err) {
        console.warn('Could not fetch employees list:', err);
      }
    };
    fetchEmployees();
  }, []);

  const fetchTaskDetails = async () => {
    setLoading(true);
    const statusReverseMap = { 1: 'pending', 2: 'in_progress', 3: 'completed', 4: 'on_hold' };
    const priorityReverseMap = { 1: 'high', 2: 'medium', 3: 'low' };

    try {
      const res = await api.get(`/tasks/${id}`);
      if (res.data) {
        const mappedTask = {
          ...res.data,
          title: res.data.task_title || res.data.title || 'Untitled Task',
          description: res.data.task_description || res.data.description || '',
          status: typeof res.data.status_id === 'number' ? (statusReverseMap[res.data.status_id] || 'pending') : (res.data.status || 'pending'),
          priority: typeof res.data.priority_id === 'number' ? (priorityReverseMap[res.data.priority_id] || 'medium') : (res.data.priority || 'medium')
        };
        setTask(mappedTask);
        setEditForm({
          title: mappedTask.title,
          description: mappedTask.description,
          status: mappedTask.status,
          priority: mappedTask.priority,
          due_date: res.data.due_date ? String(res.data.due_date).slice(0, 10) : '',
          employee_id: res.data.employee_id || ''
        });
      }
    } catch (err) {
      console.warn('API unavailable:', err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (location.state?.edit) {
      setEditing(true);
    }
    fetchTaskDetails();
  }, [id, location.state]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    const statusMap = { pending: 1, in_progress: 2, completed: 3, on_hold: 4 };
    const priorityMap = { high: 1, medium: 2, low: 3 };
    const isAdmin = role.toLowerCase() === 'admin';

    const progressMap = { 1: 0, 2: 50, 3: 100, 4: 0 };
    const statusId = statusMap[editForm.status] || 1;

    // Employee: can only update status (and progress auto-derives from status)
    const statusUpdate = {
      status_id: statusId,
      progress: progressMap[statusId] ?? 0
    };

    // Admin: full update — fields must match TaskUpdate schema
    const fullUpdate = {
      task_title: editForm.title,
      task_description: editForm.description,
      status_id: statusId,
      priority_id: editForm.priority ? (priorityMap[editForm.priority] || 2) : undefined,
      due_date: editForm.due_date ? editForm.due_date.split('T')[0] : null,
      employee_id: editForm.employee_id ? Number(editForm.employee_id) : undefined,
      progress: progressMap[statusId] ?? 0
    };
    // Remove undefined keys so they're excluded from PUT body
    Object.keys(fullUpdate).forEach(k => fullUpdate[k] === undefined && delete fullUpdate[k]);

    try {
      if (!isAdmin) {
        await api.put(`/tasks/${id}`, statusUpdate);
        showToast('Task status updated successfully');
      } else {
        await api.put(`/tasks/${id}`, fullUpdate);
        showToast('Task updated & reassigned successfully');
      }
    } catch (err) {
      console.warn('API update failed:', err.response?.data || err.message);
      showToast('Failed to update task. Please try again.', 'error');
    }

    setEditing(false);
    fetchTaskDetails();
  };

  const handleDelete = async () => {
    if (role !== 'admin') {
      showToast('Deletions are only authorized for Admin accounts.', 'error');
      return;
    }

    try {
      await api.delete(`/tasks/${id}`);
      showToast('Task deleted successfully');
      navigate('/my-task');
    } catch (err) {
      console.warn('API delete failed:', err.response?.data || err.message);
      showToast('Failed to delete task. Please try again.', 'error');
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
                    <option value="on_hold">On Hold</option>
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

              {/* Assigned To detail / Reassign dropdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Assigned To</label>
                {editing && role === 'admin' ? (
                  <select
                    value={editForm.employee_id}
                    onChange={(e) => setEditForm({ ...editForm, employee_id: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
                  >
                    <option value="">Select / Reassign Employee...</option>
                    {employees.map((emp) => (
                      <option key={emp.employee_id} value={emp.employee_id}>
                        {emp.first_name} {emp.last_name} {emp.email ? `(${emp.email})` : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="flex items-center gap-2 mt-1.5 text-sm text-slate-700 font-medium">
                    <User className="w-4 h-4 text-emerald-500" /> {task.assigned_to || task.assignedTo || 'Unassigned'}
                  </div>
                )}
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