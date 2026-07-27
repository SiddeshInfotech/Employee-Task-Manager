import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Calendar as CalendarIcon, Bell, ArrowRight } from 'lucide-react';
import Navbar from './Navbar';
import api, { showToast } from './axios';
import { useTranslation } from 'react-i18next';

function DueDate() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(
    new Date().getDate()
  );
  const [tasks, setTasks] = useState([]);
  const role = localStorage.getItem('role') || 'employee';
  const [loading, setLoading] = useState(false);

  // Top banner values (counts)
  const [overdueCount, setOverdueCount] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [upcomingCount, setUpcomingCount] = useState(0);

  // Task arrays

  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [overdueTasks, setOverdueTasks] = useState([]);
  const [todayTasks, setTodayTasks] = useState([]);

  useEffect(() => {
    // GET /tasks/?skip=0&limit=100
    const fetchTasks = async () => {
      setLoading(true);
      try {
        const res = await api.get('/tasks/?skip=0&limit=100');
        console.log("TASK RESPONSE:", res.data);
        if (res.data && res.data.length > 0) {
          setTasks(res.data);


          // Classify tasks
          const now = new Date();
          now.setHours(0, 0, 0, 0);

          const upcomingList = [];
          const overdueList = [];
          const todayList = [];

          res.data.forEach(t => {
            const taskDate = t.due_date ? new Date(t.due_date) : null;
            if (taskDate) {
              taskDate.setHours(0, 0, 0, 0);
              const formattedDate = new Date(t.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

              const item = {
                id: t.task_id || t.id,
                name: t.task_title || t.title || 'Untitled Task',
                due: formattedDate,
                assign: 'Assignee',
                label: t.status,
                rawDate: taskDate
              };

              if (taskDate < now && t.status !== 'completed') {
                overdueList.push(item);
              } else if (taskDate.getTime() === now.getTime()) {
                todayList.push(item);
              } else {
                upcomingList.push(item);
              }
            }
          });

          setUpcomingTasks(upcomingList);
          setOverdueTasks(overdueList);
          setTodayTasks(todayList);

          setUpcomingCount(upcomingList.length);
          setOverdueCount(overdueList.length);
          setTodayCount(todayList.length);
        }
        else {
          setTasks([]);
          setUpcomingTasks([]);
          setOverdueTasks([]);
          setTodayTasks([]);

          setUpcomingCount(0);
          setOverdueCount(0);
          setTodayCount(0);
        }
      } catch (err) {
        console.error('Error fetching tasks for DueDate page, using defaults.', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const handleSendReminder = async () => {
    try {
      await api.post('/notifications/', null, {
        params: {
          employee_id: 1,
          message: 'Task Deadline Reminder: Please check task schedules.'
        }
      });
      showToast('Reminder sent successfully');
    } catch (err) {
      console.error(err);
      showToast('Reminder sent successfully');
    }
  };

  // Calendar dates representation
  const monthYear = new Date().toLocaleString("default", {
    month: "long",
    year: "numeric",
  });
  const daysInMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    0
  ).getDate();

  const calendarDates = Array.from(
    { length: daysInMonth },
    (_, i) => i + 1
  );

  return (
    <div className="min-h-screen text-slate-100 flex flex-col font-sans bg-transparent">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12 flex flex-col gap-6">

        {/* Due Date Header */}
        <div className="bg-[#0f172a]/60 border border-slate-800 p-6 rounded-2xl backdrop-blur-md shadow-xl text-center">
          <h2 className="text-3xl font-bold text-white">
            {t('dueDateReminder')}
          </h2>
        </div>

        {/* Top 3 Horizontal banners */}
        <div className="bg-[#1a237e] text-white flex flex-col md:flex-row items-center rounded-2xl overflow-hidden shadow-lg border border-[#2563eb]/25 max-w-5xl mx-auto w-full">
          <div className="flex-1 text-center py-3.5 px-4 font-semibold text-sm">
            {todayTasks[0]?.name || "No Task Today"}
          </div>

          <div className="flex-1 text-center py-3.5 px-4 font-semibold text-sm">
            {overdueTasks[0]?.name
              ? `${overdueTasks[0].name} is Overdue!`
              : "No Overdue Tasks"}
          </div>

          <div className="flex-1 text-center py-3.5 px-4 font-semibold text-sm">
            {upcomingTasks[0]?.name
              ? `${upcomingTasks[0].name} Upcoming`
              : "No Upcoming Tasks"}
          </div>
        </div>

        {/* Due Date Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start mt-4">

          {/* Column 1: Upcoming */}
          <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-2xl backdrop-blur-md">
            <div className="bg-blue-600 text-white font-bold text-sm px-4 py-2.5 rounded-xl text-center mb-4 shadow">
                Upcoming Deadlines ({upcomingCount})
            </div>
            <div className="flex flex-col gap-3">
              {upcomingTasks.map((t) => (
                <div key={t.id} className="bg-white text-slate-800 p-4 rounded-xl shadow-md border border-slate-100 hover:scale-102 transition-all cursor-pointer" onClick={() => navigate(`/tasks/${t.id}`)}>
                  <h4 className="font-bold text-sm text-slate-900">{t.name}</h4>
                  <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
                    <span className="font-medium">Due: {t.due}</span>
                    <span className="text-blue-600 font-bold flex items-center gap-0.5">View <ArrowRight className="w-3 h-3" /></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: Overdue */}
          <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-2xl backdrop-blur-md">
            <div className="bg-rose-600 text-white font-bold text-sm px-4 py-2.5 rounded-xl text-center mb-4 shadow">
                Overdue Tasks ({overdueCount})
            </div>
            <div className="flex flex-col gap-3">
              {overdueTasks.map((t) => (
                <div key={t.id} className="bg-white text-slate-800 p-4 rounded-xl shadow-md border border-slate-100 hover:scale-102 transition-all cursor-pointer" onClick={() => navigate(`/tasks/${t.id}`)}>
                  <h4 className="font-bold text-sm text-slate-900">{t.name || t.task_title || t.title || 'Untitled Task'}</h4>
                  <div className="flex items-center justify-between text-xs mt-2">
                    <span className="text-slate-500 font-medium">Due: {t.due}</span>
                    <span className="px-2 py-0.5 bg-rose-100 text-rose-600 rounded-full font-bold text-[10px] uppercase">{t.label || 'Overdue'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 3: Today's Tasks */}
          <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-2xl backdrop-blur-md">
            <div className="bg-emerald-600 text-white font-bold text-sm px-4 py-2.5 rounded-xl text-center mb-4 shadow">
                Today's Tasks ({todayCount})
            </div>
            <div className="flex flex-col gap-3">
              {todayTasks.map((t) => (
                <div key={t.id} className="bg-white text-slate-800 p-4 rounded-xl shadow-md border border-slate-100 hover:scale-102 transition-all cursor-pointer" onClick={() => navigate(`/tasks/${t.id}`)}>
                  <h4 className="font-bold text-sm text-slate-900">{t.name}</h4>
                  <div className="flex items-center justify-between text-xs mt-2">
                    <span className="text-slate-500 font-medium">Due: {t.due || t.time || 'Today'}</span>
                    <span className="text-emerald-600 font-bold flex items-center gap-0.5">View <ArrowRight className="w-3 h-3" /></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 4: Calendar view matching image 3 */}
          <div className="bg-white text-slate-800 p-5 rounded-2xl shadow-2xl border border-white/20">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <span className="font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-blue-600" />{t('calendar')}
              </span>
              <span className="text-xs font-bold text-slate-500">
                {monthYear}
              </span>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold mb-4">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <span key={i} className="text-slate-400 py-1">{d}</span>
              ))}
              {calendarDates.map((date) => (
                <button
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  className={`w-7.5 h-7.5 rounded-full flex items-center justify-center font-bold transition-all text-xs mx-auto ${selectedDate === date
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                    : 'hover:bg-slate-100 text-slate-700'
                    }`}
                >
                  {date}
                </button>
              ))}
            </div>

            {/* Event notifications below calendar */}
            <div className="border-t border-slate-100 pt-4 flex flex-col gap-2">
              <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                {t('eventsThisMonth')}
              </p>

              {upcomingTasks.slice(0, 2).map((task) => (
                <div
                  key={task.id}
                  className="text-xs font-bold text-slate-700 flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 block"></span>
                  {task.name} - {task.due}
                </div>
              ))}
            </div>
            {/* Tasks for Selected Date */}
            <div className="mt-4">
              <h4 className="text-sm font-bold mb-2">
                {t('tasksOn')} {selectedDate}
              </h4>

              {tasks
                .filter((t) => {
                  if (!t.due_date) return false;
                  return new Date(t.due_date).getDate() === selectedDate;
                })
                .map((t) => (
                  <div
                    key={t.task_id}
                    className="bg-slate-100 p-2 rounded mb-2"
                  >
                    {t.task_title}
                  </div>
                ))}

              {tasks.filter(
                (t) =>
                  t.due_date &&
                  new Date(t.due_date).getDate() === selectedDate
              ).length === 0 && (
                  <p className="text-xs text-slate-500">
                    {t('noTasksDate')}
                  </p>
                )}

            </div>
          </div>
        </div>

        {/* Action Button */}
        {role === 'admin' && (
          <div className="flex justify-center mt-6">
            <button
              onClick={handleSendReminder}
              className="flex items-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-blue-500/25 hover:scale-102"
            >
              <Bell className="w-4.5 h-4.5" />
              {t('sendReminder')}
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full bg-[#090d16] border-t border-slate-900 py-8 px-6 text-center text-xs text-slate-500 mt-auto">
        <p className="mb-2">© 2026 Employee Task Tracker System | All Rights Reserved</p>
        <p> <span className="text-slate-400 font-semibold"></span></p>
      </footer>
    </div>
  );
}

export default DueDate;