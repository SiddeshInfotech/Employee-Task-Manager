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
    assigned_to_id: '',
    status_id: 1,
    priority_id: 1
  });

  const statuses = [
    { id: 1, name: 'Pending' },
    { id: 2, name: 'In Progress' },
    { id: 3, name: 'Completed' }
  ];

  const priorities = [
    { id: 1, name: 'High' },
    { id: 2, name: 'Medium' },
    { id: 3, name: 'Low' }
  ];
  const [users, setUsers] = useState([]);
  const role = localStorage.getItem('role') || 'employee';

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/employees/');
        let employeeList = (res.data || []).map(emp => ({
          id: emp.employee_id,
          employee_id: emp.employee_id,
          username: `${emp.first_name} ${emp.last_name}`.trim() || `Employee #${emp.employee_id}`,
          email: emp.email || ''
        }));

        const localMembers = JSON.parse(localStorage.getItem('myNewMembers') || '[]');
        const localUsers = JSON.parse(localStorage.getItem('myNewUsers') || '[]');

        const combined = [...employeeList];
        [...localMembers, ...localUsers].forEach(lm => {
          if (lm) {
            const empId = lm.employee_id || (lm.id && Number(lm.id) <= 2147483647 ? lm.id : null);
            const matchedDbEmp = employeeList.find(e => e.email && lm.email && e.email.toLowerCase() === lm.email.toLowerCase());
            const finalId = empId || (matchedDbEmp ? matchedDbEmp.employee_id : (lm.id && Number(lm.id) <= 2147483647 ? lm.id : null));
            if (finalId && !combined.some(u => String(u.id) === String(finalId))) {
              combined.push({
                id: finalId,
                employee_id: finalId,
                username: lm.name || lm.username || `Employee #${finalId}`,
                email: lm.email || ''
              });
            }
          }
        });

        setUsers(combined);
      } catch (err) {
        console.error('Failed to load employees for task assignment', err);
        const localMembers = JSON.parse(localStorage.getItem('myNewMembers') || '[]');
        const localUsers = JSON.parse(localStorage.getItem('myNewUsers') || '[]');
        setUsers([...localMembers, ...localUsers]);
      }
    };

    fetchUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formattedDueDate = taskForm.due_date ? taskForm.due_date.split('T')[0] : null;
    const currentEmployeeId = localStorage.getItem('employee_id') || null;
    let assignedEmpId = taskForm.assigned_to_id ? Number(taskForm.assigned_to_id) : (currentEmployeeId ? Number(currentEmployeeId) : null);

    const assignedUserObj = users.find(u => String(u.id) === String(taskForm.assigned_to_id) || String(u.employee_id) === String(taskForm.assigned_to_id));
    if (assignedUserObj) {
      if (assignedUserObj.employee_id) {
        assignedEmpId = Number(assignedUserObj.employee_id);
      } else if (assignedUserObj.id && Number(assignedUserObj.id) <= 2147483647) {
        assignedEmpId = Number(assignedUserObj.id);
      }
    }
    if (assignedEmpId && assignedEmpId > 2147483647) {
      assignedEmpId = currentEmployeeId && Number(currentEmployeeId) <= 2147483647 ? Number(currentEmployeeId) : null;
    }

    const assignedName = assignedUserObj ? (assignedUserObj.username || assignedUserObj.name) : (localStorage.getItem('username') || 'Employee');

    const payload = {
      task_title: taskForm.title,
      task_description: taskForm.description,
      employee_id: assignedEmpId,
      assigned_to: assignedName,
      status_id: Number(taskForm.status_id),
      priority_id: Number(taskForm.priority_id),
      due_date: formattedDueDate
    };

    const localTaskItem = {
      id: Date.now(),
      task_id: Date.now(),
      task_title: taskForm.title,
      title: taskForm.title,
      task: taskForm.title,
      task_description: taskForm.description,
      employee_id: assignedEmpId,
      assigned_to: assignedName,
      assignee: assignedName,
      status_id: Number(taskForm.status_id),
      status: statuses.find(s => s.id === Number(taskForm.status_id))?.name || 'Pending',
      priority_id: Number(taskForm.priority_id),
      priority: priorities.find(p => p.id === Number(taskForm.priority_id))?.name || 'High',
      due_date: formattedDueDate || new Date().toISOString().split('T')[0]
    };
    try {
      console.log("TASK PAYLOAD:", payload);
      const res = await api.post('/tasks/', payload);
      if (res && res.data) {
        // Use the real task_id from the API response
        localTaskItem.id = res.data.task_id;
        localTaskItem.task_id = res.data.task_id;
      }
    } catch (err) {
      console.error("Task creation failed via API, saving locally:", err);
    } finally {
      // Always save locally so the task appears in the UI immediately
      const existing = JSON.parse(localStorage.getItem('myNewTasks') || '[]');
      localStorage.setItem('myNewTasks', JSON.stringify([...existing, localTaskItem]));
      navigate('/my-task');
    }
  };
  const handleReset = () => {
    setTaskForm({
      title: '',
      description: '',
      due_date: '',
      assigned_to_id: '',
      status_id: 1,
      priority_id: 1
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
            <ArrowLeft className="w-4 h-4" /> Back to Tasks
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

              {/* Assign To Employee */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Assign To Employee</label>
                <select
                  value={taskForm.assigned_to_id}
                  onChange={(e) => setTaskForm({ ...taskForm, assigned_to_id: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none text-black bg-white"
                  style={{ color: "#000", backgroundColor: "#fff" }}
                >
                  <option value="" style={{ color: "#000", backgroundColor: "#fff" }}>Assign to Myself / Select Employee...</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id} style={{ color: "#000", backgroundColor: "#fff" }}>
                      {u.username || u.name || `Employee #${u.id}`} {u.email ? `(${u.email})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
              {/* Task Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Task Status</label>
                <select
                  value={taskForm.status_id}
                  onChange={(e) => setTaskForm({ ...taskForm, status_id: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none text-black bg-white"
                  style={{ color: "#000", backgroundColor: "#fff" }}
                >
                  {statuses.map(s => (
                    <option key={s.id} value={s.id} style={{ color: "#000", backgroundColor: "#fff" }}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Priority</label>
                <select
                  value={taskForm.priority_id}
                  onChange={(e) => setTaskForm({ ...taskForm, priority_id: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none text-black bg-white"
                  style={{ color: "#000", backgroundColor: "#fff" }}
                >
                  {priorities.map(p => (
                    <option key={p.id} value={p.id} style={{ color: "#000", backgroundColor: "#fff" }}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
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