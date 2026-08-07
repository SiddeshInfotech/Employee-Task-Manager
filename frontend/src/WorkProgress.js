import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp, CheckCircle2, Clock, PlayCircle, Activity, ChevronRight, RefreshCw, User
} from 'lucide-react';
import Navbar from './Navbar';
import api from './axios';
import './WorkProgress.css';

/* ─── helpers ───────────────────────────────────────────── */
const nowStr = () =>
  new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata', hour12: true,
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

/* status_id → label, progress%, colour, statusType */
const resolveStatus = (t) => {
  const sid = Number(t.status_id);
  const sraw = String(t.status || '').toLowerCase().trim().replace(/[\s\-_]+/g, '');
  if (sid === 3 || sraw === 'completed' || sraw === 'done') {
    return { label: 'Completed', type: 'completed', progress: 100, color: '#10b981' };
  }
  if (sid === 2 || sraw === 'inprogress') {
    return { label: 'Working (In Progress)', type: 'working', progress: 50, color: '#3b82f6' };
  }
  return { label: 'Remaining (Yet to Start)', type: 'remaining', progress: 0, color: '#f59e0b' };
};

const barColor = (p) => {
  if (p === 100) return '#10b981';
  if (p >= 50)   return '#3b82f6';
  return '#6366f1';
};

/* ─── Donut Ring ────────────────────────────────────────── */
function DonutRing({ percent }) {
  const r = 54, C = 2 * Math.PI * r, offset = C - (percent / 100) * C;
  return (
    <svg width="140" height="140" viewBox="0 0 140 140" className="wp-donut">
      <circle cx="70" cy="70" r={r} fill="none" stroke="#1e293b" strokeWidth="12" />
      <circle cx="70" cy="70" r={r} fill="none" stroke="url(#pg)" strokeWidth="12"
        strokeLinecap="round" strokeDasharray={C} strokeDashoffset={offset}
        transform="rotate(-90 70 70)" className="wp-donut-bar" />
      <defs>
        <linearGradient id="pg" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      <text x="70" y="65" textAnchor="middle" fill="#f8fafc" fontSize="22" fontWeight="800">{percent}%</text>
      <text x="70" y="82" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="600">Completed</text>
    </svg>
  );
}

/* ─── Main Component ────────────────────────────────────── */
function WorkProgress() {
  const role     = (localStorage.getItem('role')     || 'employee').toLowerCase();
  const username = (localStorage.getItem('username') || '').toLowerCase();
  const isAdmin  = role === 'admin';

  const [tasks,       setTasks]       = useState([]);
  const [filter,      setFilter]      = useState('All');
  const [empFilter,   setEmpFilter]   = useState('All');
  const [lastUpdated, setLastUpdated] = useState(nowStr());
  const [loading,     setLoading]     = useState(true);

  /* ── fetch & map tasks ── */
  const buildTasks = useCallback(async () => {
    setLoading(true);
    let apiTasks = [];
    try {
      const res = await api.get('/tasks/?skip=0&limit=500');
      if (res.data && Array.isArray(res.data)) apiTasks = res.data;
    } catch (_) {}

    if (!isAdmin) {
      const empId  = localStorage.getItem('employee_id');
      const userId = localStorage.getItem('userId') || localStorage.getItem('user_id');

      const isForMe = (t) => {
        const eStr = String(t.employee_id != null ? t.employee_id : '');
        const uStr = String(t.user_id    != null ? t.user_id    : '');
        if (empId  && eStr === String(empId))  return true;
        if (userId && (eStr === String(userId) || uStr === String(userId))) return true;
        const assignee = (t.assigned_to || t.assignee || t.employee_name || '').toLowerCase();
        if (username && assignee && (assignee.includes(username) || username.includes(assignee))) return true;
        return false;
      };

      apiTasks = apiTasks.filter(isForMe);
    }

    const mapped = apiTasks.map((t) => {
      const id    = String(t.task_id || t.id || Math.random());
      const title = t.task_title || t.title || t.task || t.name || 'Untitled';
      const { label, type, progress, color } = resolveStatus(t);

      const empName = t.employee_name
        || (t.employee ? `${t.employee.first_name || ''} ${t.employee.last_name || ''}`.trim() : '')
        || (t.assigned_to || t.assignee || '');

      const rawDue = t.due_date || t.dueDate || null;
      const dueDateObj = rawDue ? new Date(rawDue) : null;
      const dueDateStr = dueDateObj && !isNaN(dueDateObj.getTime())
        ? dueDateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : 'No date';

      const isOverdue = dueDateObj && !isNaN(dueDateObj.getTime()) && dueDateObj < new Date() && progress < 100;

      const upd = t.updated_at || t.due_date || null;
      const updatedStr = upd
        ? new Date(upd).toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata', hour12: true,
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
          })
        : '-';

      return { id, title, label, type, progress, color, empName, dueDateStr, isOverdue, updatedStr };
    });

    setTasks(mapped);
    setLoading(false);
    setLastUpdated(nowStr());
  }, [isAdmin, username]);

  useEffect(() => { buildTasks(); }, [buildTasks]);

  /* ── derived stats ── */
  const total      = tasks.length;
  const completed  = tasks.filter((t) => t.type === 'completed').length;
  const working    = tasks.filter((t) => t.type === 'working').length;
  const remaining  = tasks.filter((t) => t.type === 'remaining').length;
  const overall    = total > 0 ? Math.round((completed / total) * 100) : 0;

  const empList = isAdmin
    ? ['All', ...Array.from(new Set(tasks.map((t) => t.empName || 'Unknown').filter(Boolean)))]
    : [];

  const overdueCount = tasks.filter((t) => t.isOverdue).length;

  /* ── filtering ── */
  const filtered = tasks.filter((t) => {
    const passStatus =
      filter === 'All' ? true :
      filter === 'Working'   ? (t.type === 'working') :
      filter === 'Completed' ? (t.type === 'completed') :
      filter === 'Remaining' ? (t.type === 'remaining') :
      filter === 'Overdue'   ? t.isOverdue : true;

    const passEmp = !isAdmin || empFilter === 'All' || t.empName === empFilter;
    return passStatus && passEmp;
  });

  const motivMsg = () => {
    if (overall === 100) return 'All tasks done! Great work! 🎉';
    if (overall >= 75)   return "You're almost there! 🔥 Keep pushing!";
    if (overall >= 50)   return 'You are doing great! 🚀 Keep going!';
    if (overall >= 25)   return 'Good start! Keep the momentum going! 💪';
    return "Let's get started! You can do it! 🌟";
  };

  const filterTabs = ['All', 'Working', 'Completed', 'Remaining', 'Overdue'];

  const statCards = [
    { label: 'Total Tasks',      sub: 'All assigned tasks',  value: total,     icon: <Activity      className="w-5 h-5" />, c: '#6366f1', bg: 'rgba(99,102,241,0.12)',  b: 'rgba(99,102,241,0.3)',  delay: '0.10s' },
    { label: 'Working',          sub: 'Currently working',   value: working,   icon: <PlayCircle    className="w-5 h-5" />, c: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  b: 'rgba(59,130,246,0.3)',  delay: '0.15s' },
    { label: 'Completed',        sub: 'Tasks finished',      value: completed, icon: <CheckCircle2  className="w-5 h-5" />, c: '#10b981', bg: 'rgba(16,185,129,0.12)', b: 'rgba(16,185,129,0.3)', delay: '0.20s' },
    { label: 'Remaining',        sub: 'Tasks pending',       value: remaining, icon: <Clock         className="w-5 h-5" />, c: '#f59e0b', bg: 'rgba(245,158,11,0.12)', b: 'rgba(245,158,11,0.3)', delay: '0.25s' },
    { label: 'Overall Progress', sub: 'All tasks progress',  value: `${overall}%`, icon: <TrendingUp className="w-5 h-5" />, c: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', b: 'rgba(139,92,246,0.3)', delay: '0.30s' },
  ];

  return (
    <div className="min-h-screen bg-transparent text-slate-100 font-sans">
      <Navbar />
      <main className="px-4 md:px-8 pb-12 max-w-7xl mx-auto">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-6 wp-fadein">
          <Link to="/dashboard" className="hover:text-white transition-colors no-underline text-slate-400">
            Dashboard
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-200 font-semibold">Work Progress</span>
        </div>

        {/* Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 wp-fadein" style={{ animationDelay: '0.05s' }}>
          <div>
            <h1 className="text-2xl font-extrabold text-white flex items-center gap-3 m-0">
              <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-white" />
              </span>
              Work Progress
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              {isAdmin
                ? 'Live view of all employees task progress (Working vs Remaining)'
                : 'Track what is working and what is remaining for your tasks'}
            </p>
          </div>
          <button
            onClick={buildTasks}
            className="wp-refresh-btn flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-all self-start"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'wp-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="wp-stat-card wp-fadein rounded-2xl p-4 flex items-center gap-3"
              style={{ background: card.bg, border: `1px solid ${card.b}`, animationDelay: card.delay }}
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: card.bg, color: card.c, border: `1px solid ${card.b}` }}>
                {card.icon}
              </div>
              <div className="min-w-0">
                <div className="text-xl font-extrabold leading-none" style={{ color: card.c }}>{card.value}</div>
                <div className="text-[11px] font-bold text-slate-300 mt-0.5 leading-tight">{card.label}</div>
                <div className="text-[10px] text-slate-500 leading-tight">{card.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left: Overall Progress & Work Status Breakdown */}
          <div className="lg:col-span-4">
            <div className="wp-card wp-fadein rounded-2xl p-6" style={{ animationDelay: '0.35s' }}>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-5">Overall Progress</h2>
              <div className="flex flex-col items-center gap-4">
                <DonutRing percent={overall} />
                <div className="text-center px-2">
                  <p className="font-bold text-white text-sm">{motivMsg()}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {isAdmin
                      ? <><span className="text-blue-400 font-bold">{completed}</span> of <span className="text-blue-400 font-bold">{total}</span> tasks completed across all employees.</>
                      : <>You have completed <span className="text-blue-400 font-bold">{overall}%</span> of your total tasks.</>}
                  </p>
                </div>
                <div className="w-full">
                  <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                    <span>Overall Progress</span>
                    <span className="font-bold text-white">{overall}%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full wp-bar-animate"
                      style={{ width: `${overall}%`, background: 'linear-gradient(90deg,#6366f1,#3b82f6)' }} />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2">Last synced: {lastUpdated}</p>
                </div>

                {/* Working vs Remaining Breakdown */}
                <div className="w-full flex flex-col gap-2.5 pt-3 border-t border-slate-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Work Status Summary</span>
                  
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <div className="flex items-center gap-2">
                      <PlayCircle className="w-4 h-4 text-blue-400" />
                      <div>
                        <p className="text-xs font-bold text-blue-300">Currently Working On</p>
                        <p className="text-[10px] text-slate-400">Tasks in active progress</p>
                      </div>
                    </div>
                    <span className="text-sm font-extrabold text-blue-400">{working}</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-400" />
                      <div>
                        <p className="text-xs font-bold text-amber-300">Remaining Tasks</p>
                        <p className="text-[10px] text-slate-400">Tasks yet to start</p>
                      </div>
                    </div>
                    <span className="text-sm font-extrabold text-amber-400">{remaining}</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <div>
                        <p className="text-xs font-bold text-emerald-300">Completed Tasks</p>
                        <p className="text-[10px] text-slate-400">Finished tasks</p>
                      </div>
                    </div>
                    <span className="text-sm font-extrabold text-emerald-400">{completed}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Task Table */}
          <div className="lg:col-span-8">
            <div className="wp-card wp-fadein rounded-2xl p-6" style={{ animationDelay: '0.45s' }}>

              {/* Header: title + filter tabs + admin emp dropdown */}
              <div className="flex flex-col gap-3 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Task Progress Details</h2>
                  {isAdmin && empList.length > 1 && (
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <select
                        value={empFilter}
                        onChange={(e) => setEmpFilter(e.target.value)}
                        className="wp-select text-xs font-bold"
                      >
                        {empList.map((e) => (
                          <option key={e} value={e}>{e === 'All' ? 'All Employees' : e}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Status filter tabs */}
                <div className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800 flex-wrap">
                  {filterTabs.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setFilter(tab)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                        filter === tab
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status banner indicator */}
              <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl bg-slate-800/40 border border-slate-700/50">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse flex-shrink-0" />
                <p className="text-[11px] text-slate-300 font-medium">
                  Showing <b>{working}</b> tasks currently working on, <b>{remaining}</b> tasks remaining, and <b>{completed}</b> completed.
                </p>
              </div>

              {loading ? (
                <div className="flex items-center justify-center h-48 gap-3 text-slate-400">
                  <RefreshCw className="w-5 h-5 wp-spin" />
                  <span className="text-sm">Loading tasks from database…</span>
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-slate-500 gap-2">
                  <CheckCircle2 className="w-10 h-10 opacity-30" />
                  <p className="text-sm font-semibold">No tasks found in this category</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  {/* Table Header */}
                  <div
                    className="grid text-[11px] font-bold uppercase tracking-wider text-slate-500 pb-3 border-b border-slate-800 mb-2 px-2"
                    style={{ gridTemplateColumns: isAdmin ? '2.5fr 1.5fr 1.8fr 2.7fr 1.5fr' : '3fr 2fr 3fr 2fr', minWidth: isAdmin ? '700px' : '550px' }}
                  >
                    <span>Task Title</span>
                    {isAdmin && <span>Employee</span>}
                    <span>Work Status</span>
                    <span>Progress</span>
                    <span className="text-right">Last Updated</span>
                  </div>

                  {/* Table Rows */}
                  <div className="flex flex-col gap-0.5" style={{ minWidth: isAdmin ? '700px' : '550px' }}>
                    {filtered.map((task, idx) => {
                      const bc = barColor(task.progress);
                      return (
                        <div
                          key={task.id}
                          className="grid items-center px-2 py-3 rounded-xl hover:bg-slate-800/40 transition-all wp-row wp-fadein"
                          style={{
                            gridTemplateColumns: isAdmin ? '2.5fr 1.5fr 1.8fr 2.7fr 1.5fr' : '3fr 2fr 3fr 2fr',
                            animationDelay: `${0.04 * idx}s`,
                          }}
                        >
                          {/* Task title */}
                          <p className="text-xs font-semibold text-slate-200 truncate pr-3">{task.title}</p>

                          {/* Employee name (admin only) */}
                          {isAdmin && (
                            <p className="text-xs text-slate-400 truncate pr-2">
                              {task.empName || <span className="italic opacity-50">—</span>}
                            </p>
                          )}

                          {/* Status badge */}
                          <div className="flex flex-col gap-1 items-start">
                            <span
                              className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap"
                              style={{
                                background: `${task.color}22`,
                                color: task.color,
                                border: `1px solid ${task.color}55`,
                              }}
                            >
                              {task.label}
                            </span>
                            {task.isOverdue && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 uppercase tracking-wider">
                                Overdue
                              </span>
                            )}
                          </div>

                          {/* Progress bar */}
                          <div className="pr-4">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2.5 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-700"
                                  style={{ width: `${task.progress}%`, background: bc }}
                                />
                              </div>
                              <span className="text-[11px] font-bold text-slate-300 w-8 text-right flex-shrink-0">
                                {task.progress}%
                              </span>
                            </div>
                          </div>

                          {/* Due Date & Last updated */}
                          <div className="text-right">
                            <p className={`text-[11px] font-semibold ${task.isOverdue ? 'text-rose-400' : 'text-slate-300'}`}>
                              Due: {task.dueDateStr}
                            </p>
                            <p className="text-[10px] text-slate-500 leading-relaxed mt-0.5">Updated: {task.updatedStr}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default WorkProgress;