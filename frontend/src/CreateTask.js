import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import Navbar from './Navbar';
import api, { showToast } from './axios';

function CreateTask() {
  const navigate = useNavigate();
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    due_date: '',
    assigned_to_id: ''
  });
  const [users, setUsers] = useState([]);
  const role = localStorage.getItem('role') || 'employee';

  useEffect(() => {
    if (role !== 'admin') {
      showToast('Only admins can create tasks');
      navigate('/my-task');
      return;
    }

    const fetchUsers = async () => {
      try {
        const res = await api.get('/users/');
        if (res.data) setUsers(res.data);
      } catch (err) {
        console.error('Failed to load users for task assignment', err);
      }
    };

    fetchUsers();
  }, [role, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Format payload to match backend schema (task_title, task_description, employee_id, due_date)
    const formattedDueDate = taskForm.due_date ? taskForm.due_date.split('T')[0] : null;
    const assignedEmpId = taskForm.assigned_to_id ? Number(taskForm.assigned_to_id) : null;


    const payload = {
      task_title: taskForm.title,
      task_description: taskForm.description,
      employee_id: assignedEmpId,

      // Default values
      status_id: 1,      // Pending
      priority_id: 1,    // High

      due_date: formattedDueDate
    };

    console.log("Submitting Create Task Payload:", payload);

    try {
      const res = await api.post('/tasks/', payload);
      console.log("Create Task API Response:", res.data);

      showToast('Task created successfully');
      navigate('/my-task');
    } catch (err) {
      console.error("Create Task API Error:", err);
      console.log("Error Response Data:", err.response?.data);
      console.log("Error Status:", err.response?.status);

      let errMsg = 'Failed to create task';
      if (err.response?.data?.detail) {
        if (typeof err.response.data.detail === 'string') {
          errMsg = err.response.data.detail;
        } else if (Array.isArray(err.response.data.detail)) {
          errMsg = err.response.data.detail.map(e => `${e.loc?.slice(-1)[0] || 'field'}: ${e.msg}`).join(', ');
        } else {
          errMsg = JSON.stringify(err.response.data.detail);
        }
      } else if (err.message) {
        errMsg = err.message;
      }

      showToast(errMsg, 'error');
    }
  };

  const handleReset = () => {
    setTaskForm({
      title: '',
      description: '',
      due_date: '',
      assigned_to_id: ''
    });
  };

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
        </div>

        {/* Create Task Form glass card */}
        <div className="bg-white text-slate-800 rounded-3xl shadow-2xl border border-white/20 p-8">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-slate-900">Create New Task</h3>
            <p className="text-xs text-slate-500 mt-1">Configure details, deadlines, and priorities for the new workload</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Task Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Task Title</label>
              <input
                type="text"
                required
                placeholder="Enter task title"
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Task Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Task Description</label>
              <textarea
                required
                placeholder="Enter task details and specifications"
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 h-24"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">


              {/* Due date picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Due Date</label>
                <input
                  type="datetime-local"
                  required
                  value={taskForm.due_date}
                  onChange={(e) =>
                    setTaskForm({
                      ...taskForm,
                      due_date: e.target.value
                    })
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
                />
              </div>

              {/* Assign To (Only shown if Admin) */}
              {role === 'admin' && users.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Assign To</label>
                  <select
                    value={taskForm.assigned_to_id}
                    onChange={(e) => setTaskForm({ ...taskForm, assigned_to_id: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
                  >
                    <option value="">Select Employee...</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.username}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Reset / Submit Actions */}
            <div className="flex gap-4 mt-6">
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 py-3.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-all"
              >
                Reset
              </button>
              <button
                type="submit"
                className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Create Task
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-[#090d16] border-t border-slate-900 py-8 px-6 text-center text-xs text-slate-500 mt-auto">
        <p className="mb-2">© 2026 Employee Task Tracker System | All Rights Reserved</p>
        <p> <span className="text-slate-400 font-semibold"></span></p>
      </footer>
    </div>
  );
}

export default CreateTask;
