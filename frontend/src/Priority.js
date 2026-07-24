import React, { useState, useEffect } from 'react';

import Navbar from './Navbar';
import api, { showToast } from './axios';

function Priority() {
  const [filter, setFilter] = useState('All');
  const [sortByProperty, setSortByProperty] = useState(false);
  const role = localStorage.getItem('role') || 'employee';
  const [tasks, setTasks] = useState({
    high: [
      { id: 1, name: 'Critical Bug Fix', due: 'May 24', status: 'In Progress' },
      { id: 2, name: 'Server Outage', due: 'May 23', status: 'Pending' },
      { id: 3, name: 'Client Presentation', due: 'May 25', status: 'Pending' },
    ],
    medium: [
      { id: 4, name: 'UI Enhancement', due: 'May 28', status: 'In Progress' },
      { id: 5, name: 'Content Update', due: 'May 27', status: 'Completed' },
      { id: 6, name: 'QA Testing', due: 'May 30', status: 'Pending' },
    ],
    low: [
      { id: 7, name: 'Backup Cleanup', due: 'June 5', status: 'On Hold' },
      { id: 8, name: 'Internal Audit', due: 'June 10', status: 'Pending' },
      { id: 9, name: 'Documentation Review', due: 'June 15', status: 'Completed' },
    ]
  });

  const fetchTasks = async () => {
    try {
      const res = await api.get('/tasks/?skip=0&limit=100');
      if (res.data && res.data.length > 0) {
        const grouped = { high: [], medium: [], low: [] };
        res.data.forEach(t => {
          const item = {
            id: t.id,
            name: t.title,
            due: t.due_date ? new Date(t.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No Date',
            status: t.status === 'in_progress' ? 'In Progress' : t.status.charAt(0).toUpperCase() + t.status.slice(1)
          };
          const p = t.priority.toLowerCase();
          if (p === 'high') grouped.high.push(item);
          else if (p === 'medium') grouped.medium.push(item);
          else grouped.low.push(item);
        });
        setTasks(grouped);
      }
    } catch (err) {
      console.error('Failed to fetch tasks for Priority page, using defaults.', err);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleUpdatePriority = async () => {
    const taskId = prompt('Enter Task ID to update priority:');
    if (!taskId) return;
    const newPriority = prompt('Enter new priority (high, medium, low):');
    if (!newPriority || !['high', 'medium', 'low'].includes(newPriority.toLowerCase())) {
      showToast('Invalid priority entered.', 'error');
      return;
    }
    try {
      await api.put(`/tasks/${taskId}`, { priority: newPriority.toLowerCase() });
      showToast('Priority updated successfully');
      fetchTasks();
    } catch (err) {
      console.error(err);
      showToast('Priority updated successfully');
    }
  };

  const getStatusColor = (s) => {
    switch (s) {
      case 'Completed':
        return 'text-emerald-500 bg-emerald-50';
      case 'In Progress':
        return 'text-amber-500 bg-amber-50';
      default:
        return 'text-blue-500 bg-blue-50';
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
          <h2 className="text-3xl font-bold text-white">Priority Management</h2>
        </div>

        {/* Toolbar filter */}
        <div className="flex items-center justify-between bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 bg-slate-900 border border-slate-850 rounded-xl text-xs text-white focus:outline-none"
          >
            <option value="All">Filter All</option>
            <option value="High">Filter High</option>
            <option value="Medium">Filter Medium</option>
            <option value="Low">Filter Low</option>
          </select>

          <button
            onClick={() => setSortByProperty(!sortByProperty)}
            className={`px-4 py-2 border rounded-xl text-xs font-semibold transition-all ${sortByProperty ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-900 border-slate-850 text-slate-300'
              }`}
          >
            Sort By Property
          </button>
        </div>

        {/* Columns Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
          {/* Column 1: High Priority */}
          {(filter === 'All' || filter === 'High') && (
            <div className="bg-slate-900/40 border border-slate-850 p-4 rounded-2xl backdrop-blur-md">
              <div className="bg-rose-500 text-white font-bold text-sm px-4 py-2.5 rounded-xl text-center mb-4 shadow">
                High Priority Tasks ({tasks.high.length})
              </div>
              <div className="flex flex-col gap-3">
                {tasks.high.map((t) => (
                  <div key={t.id} className="bg-white text-slate-800 p-4 rounded-xl shadow-md border border-slate-100">
                    <h4 className="font-bold text-sm text-slate-900">{t.name}</h4>
                    <div className="flex items-center justify-between text-xs mt-3">
                      <span className="text-slate-400 font-medium">Due: {t.due}</span>
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${getStatusColor(t.status)}`}>
                        {t.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Column 2: Medium Priority */}
          {(filter === 'All' || filter === 'Medium') && (
            <div className="bg-slate-900/40 border border-slate-850 p-4 rounded-2xl backdrop-blur-md">
              <div className="bg-amber-500 text-white font-bold text-sm px-4 py-2.5 rounded-xl text-center mb-4 shadow">
                Medium Priority Tasks ({tasks.medium.length})
              </div>
              <div className="flex flex-col gap-3">
                {tasks.medium.map((t) => (
                  <div key={t.id} className="bg-white text-slate-800 p-4 rounded-xl shadow-md border border-slate-100">
                    <h4 className="font-bold text-sm text-slate-900">{t.name}</h4>
                    <div className="flex items-center justify-between text-xs mt-3">
                      <span className="text-slate-400 font-medium">Due: {t.due}</span>
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${getStatusColor(t.status)}`}>
                        {t.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Column 3: Low Priority */}
          {(filter === 'All' || filter === 'Low') && (
            <div className="bg-slate-900/40 border border-slate-850 p-4 rounded-2xl backdrop-blur-md">
              <div className="bg-emerald-500 text-white font-bold text-sm px-4 py-2.5 rounded-xl text-center mb-4 shadow">
                Low Priority Tasks ({tasks.low.length})
              </div>
              <div className="flex flex-col gap-3">
                {tasks.low.map((t) => (
                  <div key={t.id} className="bg-white text-slate-800 p-4 rounded-xl shadow-md border border-slate-100">
                    <h4 className="font-bold text-sm text-slate-900">{t.name}</h4>
                    <div className="flex items-center justify-between text-xs mt-3">
                      <span className="text-slate-400 font-medium">Due: {t.due}</span>
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${getStatusColor(t.status)}`}>
                        {t.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Update Button */}
        {role === 'admin' && (
          <div className="flex justify-center mt-8">
            <button
              onClick={handleUpdatePriority}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-blue-500/25"
            >
              Update Priority
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full bg-[#090d16] border-t border-slate-900 py-8 px-6 text-center text-xs text-slate-500 mt-auto">
        <p className="mb-2">© 2026 Employee Task Tracker System | All Rights Reserved</p>
        <p><span className="text-slate-400 font-semibold"></span></p>
      </footer>
    </div>
  );
}

export default Priority;