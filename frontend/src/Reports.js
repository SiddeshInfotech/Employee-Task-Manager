import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Navbar from './Navbar';
import api, { showToast } from './axios';

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function Reports() {
  const { t } = useTranslation();
  const [department, setDepartment] = useState('All');
  const [dateRange, setDateRange] = useState('Last 30 Days');

  const [taskDataWeekly, setTaskDataWeekly] = useState([
    { name: 'Mon', completed: 0, pending: 0 },
    { name: 'Tue', completed: 0, pending: 0 },
    { name: 'Wed', completed: 0, pending: 0 },
    { name: 'Thu', completed: 0, pending: 0 },
    { name: 'Fri', completed: 0, pending: 0 },
    { name: 'Sat', completed: 0, pending: 0 },
    { name: 'Sun', completed: 0, pending: 0 },
  ]);

  const [pieData, setPieData] = useState([
    { name: 'Completed', value: 0, color: '#3b82f6' },
    { name: 'Pending', value: 0, color: '#f97316' },
  ]);

  const [employeeData, setEmployeeData] = useState([]);

  const [priorityData, setPriorityData] = useState([
    { name: 'High', value: 0, color: '#EF4444' },
    { name: 'Medium', value: 0, color: '#F59E0B' },
    { name: 'Low', value: 0, color: '#10B981' },
  ]);

  // Robust helper: check if a task is completed regardless of field type
  const isTaskCompleted = (t) => {
    if (Number(t.status_id) === 3) return true;
    const s = String(t.status || '').toLowerCase().trim();
    return s === 'completed' || s === 'complete' || s === 'done' || s === '3';
  };

  const fetchReportData = async () => {
    try {
      // Fetch tasks from API
      let allTasks = [];
      try {
        const tasksRes = await api.get('/tasks/?skip=0&limit=100');
        if (tasksRes.data && Array.isArray(tasksRes.data)) {
          allTasks = tasksRes.data;
        }
      } catch (err) {
        console.warn('API tasks unavailable for report:', err.message);
      }

      // Merge localStorage tasks (myNewTasks) — include tasks created offline
      const localTasks = JSON.parse(localStorage.getItem('myNewTasks') || '[]');
      const apiTaskIds = new Set(allTasks.map(t => String(t.task_id || t.id)));
      const extraLocalTasks = localTasks.filter(lt => !apiTaskIds.has(String(lt.id || lt.task_id)));
      allTasks = [...allTasks, ...extraLocalTasks];

      // Fetch users from API
      let allUsers = [];
      const localNewMembers = JSON.parse(localStorage.getItem('myNewMembers') || '[]');
      const localNewUsers = JSON.parse(localStorage.getItem('myNewUsers') || '[]');
      const localCombined = [...localNewMembers, ...localNewUsers];

      try {
        const usersRes = await api.get('/users/');
        if (usersRes.data && Array.isArray(usersRes.data)) {
          allUsers = usersRes.data.map(u => ({
            id: u.id || u.user_id || u.employee_id,
            name: u.username || u.name,
            dept: u.department || 'Development',
            assigned: u.assigned_tasks_count || 0,
            completed: u.completed_tasks_count || 0
          }));
        }
      } catch (err) {
        console.warn('API users unavailable for report:', err.message);
      }

      // Merge local users if not already present
      const existingUserNames = new Set(allUsers.map(u => u.name?.toLowerCase()));
      localCombined.forEach(m => {
        const name = m.name || m.username;
        if (name && !existingUserNames.has(name.toLowerCase())) {
          allUsers.push({
            id: m.id || Date.now(),
            name: name,
            dept: m.dept || m.department || 'Development',
            assigned: m.assigned || 0,
            completed: m.completed || 0
          });
        }
      });

      // Always seed demo users if allUsers is still empty (API failed & no local users)
      if (allUsers.length === 0) {
        allUsers = [
          { id: 'demo1', name: 'Alice', dept: 'Development', assigned: 5, completed: 4 },
          { id: 'demo2', name: 'Bob', dept: 'Design', assigned: 4, completed: 3 },
          { id: 'demo3', name: 'Charlie', dept: 'Marketing', assigned: 3, completed: 2 },
        ];
      }

      // If still no tasks, seed demo tasks that EXPLICITLY cover all 7 days of the week
      if (allTasks.length === 0) {
        // Find the most recent Mon–Sun dates going backward from today
        const today = new Date();
        const getLastWeekday = (targetDay) => {
          // targetDay: 0=Sun,1=Mon,...,6=Sat
          const d = new Date(today);
          const diff = (today.getDay() - targetDay + 7) % 7;
          d.setDate(today.getDate() - (diff === 0 ? 7 : diff));
          return d.toISOString();
        };

        allTasks = [
          // Monday — 1 completed, 1 pending
          { id: 'd1', task_title: 'Design UI', status_id: 3, status: 'completed', priority_id: 1, due_date: getLastWeekday(1), employee_id: 'demo1' },
          { id: 'd2', task_title: 'Fix Bugs', status_id: 1, status: 'pending', priority_id: 2, due_date: getLastWeekday(1), employee_id: 'demo2' },
          // Tuesday — 1 completed, 1 pending
          { id: 'd3', task_title: 'Code Review', status_id: 3, status: 'completed', priority_id: 1, due_date: getLastWeekday(2), employee_id: 'demo1' },
          { id: 'd4', task_title: 'Write Tests', status_id: 1, status: 'pending', priority_id: 2, due_date: getLastWeekday(2), employee_id: 'demo3' },
          // Wednesday — 2 completed
          { id: 'd5', task_title: 'Deploy App', status_id: 3, status: 'completed', priority_id: 2, due_date: getLastWeekday(3), employee_id: 'demo2' },
          { id: 'd6', task_title: 'Security Audit', status_id: 3, status: 'completed', priority_id: 1, due_date: getLastWeekday(3), employee_id: 'demo3' },
          // Thursday — 1 completed, 1 pending
          { id: 'd7', task_title: 'Write Docs', status_id: 3, status: 'completed', priority_id: 3, due_date: getLastWeekday(4), employee_id: 'demo1' },
          { id: 'd8', task_title: 'API Integration', status_id: 1, status: 'pending', priority_id: 2, due_date: getLastWeekday(4), employee_id: 'demo2' },
          // Friday — 1 completed, 1 pending
          { id: 'd9', task_title: 'Performance Tuning', status_id: 3, status: 'completed', priority_id: 3, due_date: getLastWeekday(5), employee_id: 'demo3' },
          { id: 'd10', task_title: 'Update DB', status_id: 1, status: 'pending', priority_id: 1, due_date: getLastWeekday(5), employee_id: 'demo1' },
          // Saturday — 1 pending
          { id: 'd11', task_title: 'Test Features', status_id: 2, status: 'inprogress', priority_id: 1, due_date: getLastWeekday(6), employee_id: 'demo2' },
          // Sunday — 1 completed
          { id: 'd12', task_title: 'Sprint Planning', status_id: 3, status: 'completed', priority_id: 2, due_date: getLastWeekday(0), employee_id: 'demo3' },
        ];
      }

      // Filter tasks by department
      let filteredTasks = allTasks;
      if (department !== 'All') {
        filteredTasks = allTasks.filter(t => {
          const tDept = t.department || t.dept;
          if (tDept) return tDept.toLowerCase() === department.toLowerCase();
          const emp = allUsers.find(u => String(u.id) === String(t.employee_id) || u.name === t.employee_name);
          return emp && emp.dept && emp.dept.toLowerCase() === department.toLowerCase();
        });
      }

      // Filter by date range
      if (dateRange) {
        const now = new Date();
        let daysCutoff = 30;
        if (dateRange === 'Last 7 Days') daysCutoff = 7;
        else if (dateRange === 'This Quarter') daysCutoff = 90;

        const cutoffTime = now.getTime() - (daysCutoff * 24 * 60 * 60 * 1000);
        filteredTasks = filteredTasks.filter(t => {
          if (!t.due_date && !t.created_at) return true;
          const tDate = new Date(t.due_date || t.created_at).getTime();
          return tDate >= cutoffTime;
        });
      }

      // Calculate Pie Data (Completed vs Pending)
      let completedCount = 0;
      let pendingCount = 0;
      filteredTasks.forEach(t => {
        if (isTaskCompleted(t)) completedCount++;
        else pendingCount++;
      });

      setPieData([
        { name: 'Completed', value: completedCount || 1, color: '#3b82f6' },
        { name: 'Pending', value: pendingCount || 1, color: '#f97316' },
      ]);

      // Calculate Priority Distribution (work-wise: based on actual task priority fields)
      let highCount = 0, medCount = 0, lowCount = 0;
      filteredTasks.forEach(t => {
        const pId = Number(t.priority_id);
        // Support string-based priority from localStorage tasks (e.g. "High", "high", "1")
        const pStr = String(t.priority || t.priority_name || '').toLowerCase().trim();
        const isHigh = pId === 1 || pStr === 'high' || pStr === '1';
        const isMed = pId === 2 || pStr === 'medium' || pStr === 'med' || pStr === '2';
        if (isHigh) highCount++;
        else if (isMed) medCount++;
        else lowCount++; // low, or anything else (on-hold, no priority, etc.)
      });

      // Show actual counts — 0 is valid and meaningful (no tasks of that priority)
      setPriorityData([
        { name: 'High', value: highCount, color: '#EF4444' },
        { name: 'Medium', value: medCount, color: '#F59E0B' },
        { name: 'Low', value: lowCount, color: '#10B981' },
      ]);

      // Calculate Employee Performance Data
      const empPerfList = allUsers.map(emp => {
        const empName = (emp.name || '').toLowerCase();
        // Broad matching: by ID OR by name (case-insensitive, partial)
        const empTasks = filteredTasks.filter(t => {
          const tEmpId = String(t.employee_id || t.assigned_to_id || '');
          const tEmpName = String(t.employee_name || t.assigned_to || t.username || '').toLowerCase();
          return (
            (tEmpId && String(emp.id) && tEmpId === String(emp.id)) ||
            (tEmpName && empName && (tEmpName.includes(empName) || empName.includes(tEmpName)))
          );
        });

        let assigned, completedEmp;

        if (empTasks.length > 0) {
          // Real task-to-user match found — use actual task counts
          assigned = empTasks.length;
          completedEmp = empTasks.filter(t => isTaskCompleted(t)).length;
        } else {
          // No task match — use stored counts from user record
          assigned = emp.assigned || 0;
          completedEmp = emp.completed || 0;
        }

        // If still no data at all, give a fallback so bar is visible
        if (assigned === 0 && completedEmp === 0) {
          assigned = 1;
          completedEmp = 0;
        }

        let perf = 0;
        if (assigned > 0) perf = Math.round((completedEmp / assigned) * 100);
        else if (completedEmp > 0) perf = 100;

        // Minimum 5% so the bar name label is always readable in the chart
        const displayPerf = perf > 0 ? perf : 5;

        return { name: emp.name || 'Employee', performance: displayPerf, actualPerf: perf };
      });
      setEmployeeData(empPerfList);

      // Calculate Weekly Tasks (Mon - Sun)
      const dayIndexMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const weeklyCounts = {
        Mon: { completed: 0, pending: 0 },
        Tue: { completed: 0, pending: 0 },
        Wed: { completed: 0, pending: 0 },
        Thu: { completed: 0, pending: 0 },
        Fri: { completed: 0, pending: 0 },
        Sat: { completed: 0, pending: 0 },
        Sun: { completed: 0, pending: 0 },
      };

      filteredTasks.forEach(t => {
        const dateStr = t.due_date || t.created_at;
        if (dateStr) {
          const d = new Date(dateStr);
          const dayName = dayIndexMap[d.getDay()];
          if (weeklyCounts[dayName]) {
            if (isTaskCompleted(t)) weeklyCounts[dayName].completed++;
            else weeklyCounts[dayName].pending++;
          }
        }
      });

      const weeklyArr = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => ({
        name: day,
        completed: weeklyCounts[day].completed,
        pending: weeklyCounts[day].pending
      }));
      setTaskDataWeekly(weeklyArr);

    } catch (err) {
      console.error('Error fetching report data:', err);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [department, dateRange]);

  const handleExportPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Employee Task Tracker Report", 20, 20);

    doc.setFontSize(12);
    doc.text(`Department: ${department}`, 20, 35);
    doc.text(`Date Range: ${dateRange}`, 20, 45);

    autoTable(doc, {
      startY: 55,
      head: [["Metric", "Value"]],
      body: [
        ["Completed Tasks", pieData[0]?.value || 0],
        ["Pending Tasks", pieData[1]?.value || 0],
        ["High Priority", priorityData[0]?.value || 0],
        ["Medium Priority", priorityData[1]?.value || 0],
        ["Low Priority", priorityData[2]?.value || 0],
      ],
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [["Employee", "Performance"]],
      body: employeeData.length > 0 ? employeeData.map((emp) => [
        emp.name,
        `${emp.performance}%`,
      ]) : [["No employee data", "0%"]],
    });

    doc.save("Employee_Report.pdf");

    showToast("PDF Exported Successfully!");
  };

  const handleGenerateReport = () => {
    fetchReportData();
    showToast("Report generated successfully!");
  };
  return (
    <div className="min-h-screen text-slate-100 flex flex-col font-sans bg-transparent">
      {/* Navbar */}
      <Navbar />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12 flex flex-col gap-6">

        {/* Header Toolbar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#0f172a]/60 border border-slate-800 p-6 rounded-2xl backdrop-blur-md shadow-xl w-full">
          <div>
            <h2 className="text-3xl font-bold text-white">{t("reportAndAnalysis")}</h2>
            <p className="text-sm text-slate-300 mt-1">{t("reviewTaskAnalytics")}</p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="px-4 py-2 bg-slate-900 border border-slate-850 rounded-xl text-xs text-white focus:outline-none"
            >
              <option value="All">{t("allDepartments")}</option>
              <option value="IT">IT</option>
              <option value="Marketing">Marketing</option>
              <option value="Design">Design</option>
            </select>

            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 bg-slate-900 border border-slate-850 rounded-xl text-xs text-white focus:outline-none"
            >
              <option value="Last 30 Days">{t("last30Days")}</option>
              <option value="Last 7 Days">{t("last7Days")}</option>
              <option value="This Quarter">{t("thisQuarter")}</option>
            </select>

            <button
              onClick={() => showToast('Applying filters...', 'success')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-750 text-white rounded-xl text-xs font-semibold transition-all"
            >
              {t("filter")}
            </button>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">

          {/* Line Chart: Task Completion */}
          <div className="lg:col-span-4 bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-md">
            <h4 className="font-bold text-xs text-slate-300 uppercase tracking-wider mb-4">{t("taskCompletionWeekly")}</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={taskDataWeekly}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" fontSize={10} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Line type="monotone" dataKey="completed" stroke="#3b82f6" strokeWidth={2} name={t("completed")} />
                  <Line type="monotone" dataKey="pending" stroke="#f97316" strokeWidth={2} name={t("pending")} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Doughnut Chart: Pending vs Completed */}
          <div className="lg:col-span-4 bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-md flex flex-col justify-between">
            <h4 className="font-bold text-xs text-slate-300 uppercase tracking-wider mb-4">{t("pendingVsCompleted")}</h4>
            <div className="h-48 flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={4}>
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Horizontal Bar Chart: Employee Performance */}
          <div className="lg:col-span-4 bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-md">
            <h4 className="font-bold text-xs text-slate-300 uppercase tracking-wider mb-4">{t("employeePerformance")}</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={employeeData} layout="vertical" margin={{ left: 0, right: 20 }}>
                  <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" fontSize={10} tickFormatter={(v) => `${v}%`} />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={55} />
                  <Tooltip formatter={(value, name, props) => [`${props.payload.actualPerf ?? value}%`, 'Performance']} />
                  <Bar dataKey="performance" fill="#3b82f6" radius={[0, 4, 4, 0]} minPointSize={4} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>


          {/* Vertical Bar Chart: Priority Distribution */}
          <div className="lg:col-span-4 bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-md">
            <h4 className="font-bold text-xs text-slate-300 uppercase tracking-wider mb-4">{t("priorityDistribution")}</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityData}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" fontSize={10} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Stats Card placeholder to fill mockup */}
          <div className="lg:col-span-8 bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-md flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-sm text-slate-200">{t("analyticalOverview")}</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {t("analyticalDescription")}
              </p>
            </div>
            <div className="flex gap-4 mt-6">
              <button
                onClick={handleGenerateReport}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all shadow"
              >
                {t("generateReport")}
              </button>
              <button
                onClick={handleExportPDF}
                className="flex-1 py-3 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white font-bold rounded-xl text-xs transition-all shadow"
              >
                {t("exportPDF")}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-[#090d16] border-t border-slate-900 py-8 px-6 text-center text-xs text-slate-500 mt-auto">
        <p className="mb-2">{t("footerText")}</p>
        <p> <span className="text-slate-400 font-semibold"></span></p>
      </footer>
    </div>
  );
}

export default Reports;