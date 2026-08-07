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

  const role = (localStorage.getItem('role') || 'employee').toLowerCase();
  const username = (localStorage.getItem('username') || '').toLowerCase();
  const userId = localStorage.getItem('userId') || localStorage.getItem('user_id') || localStorage.getItem('employee_id');
  const isAdmin = role === 'admin';
  const currentUserName = localStorage.getItem('username') || 'Me';

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

  const isTaskCompleted = (t) => {
    const sid = Number(t.status_id);
    if (sid === 3) return true;
    const s = String(t.status || '').toLowerCase().trim();
    return s === 'completed' || s === 'complete' || s === 'done' || s === '3';
  };

  // Used only to filter localStorage tasks — API already scopes by employee
  const isLocalTaskForCurrentUser = (t) => {
    if (isAdmin) return true;
    const myName = String(localStorage.getItem('username') || '').toLowerCase().trim();
    const myId = String(
      userId ||
      localStorage.getItem('userId') ||
      localStorage.getItem('user_id') ||
      localStorage.getItem('employee_id') || ''
    ).toLowerCase().trim();

    const empIdStr = t.employee_id !== undefined && t.employee_id !== null
      ? String(t.employee_id).toLowerCase().trim()
      : '';
    const tEmpId2 = String(t.assigned_to_id || '').toLowerCase().trim();
    const assignedToStr = String(
      t.assigned_to || t.assignee || t.employee_name || t.username || ''
    ).toLowerCase().trim();

    if (myId && (empIdStr === myId || tEmpId2 === myId)) return true;
    if (myName && assignedToStr &&
      (assignedToStr.includes(myName) || myName.includes(assignedToStr))) return true;

    // Include only if no assignee fields at all (unassigned local tasks)
    if (!t.employee_id && !t.assigned_to && !t.assignee && !t.assigned_to_id) return true;

    return false;
  };

  const fetchReportData = async () => {
    try {
      // API already returns only this employee's tasks (backend scopes by employee_id)
      let apiTasks = [];
      try {
        const tasksRes = await api.get('/tasks/?skip=0&limit=100');
        if (tasksRes.data && Array.isArray(tasksRes.data)) {
          apiTasks = tasksRes.data;
        }
      } catch (err) {
        console.warn('API tasks unavailable:', err.message);
      }

      let allTasks = apiTasks;
      let allUsers = [];
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
        console.warn('API users unavailable:', err.message);
      }

      // Admin: can filter by department. Employee: allTasks already scoped.
      let filteredTasks = allTasks;
      if (department !== 'All' && isAdmin) {
        filteredTasks = filteredTasks.filter(t => {
          const tDept = t.department || t.dept;
          if (tDept) return tDept.toLowerCase() === department.toLowerCase();
          const emp = allUsers.find(u =>
            String(u.id) === String(t.employee_id) || u.name === t.employee_name
          );
          return emp && emp.dept && emp.dept.toLowerCase() === department.toLowerCase();
        });
      }

      // Date range filter — use created_at if available; include tasks with no date;
      // allow both past AND future tasks within the window (tasks assigned now may be due in future)
      if (dateRange) {
        const now = new Date();
        let daysCutoff = 30;
        if (dateRange === 'Last 7 Days') daysCutoff = 7;
        else if (dateRange === 'This Quarter') daysCutoff = 90;
        const cutoffMs = daysCutoff * 24 * 60 * 60 * 1000;
        filteredTasks = filteredTasks.filter(t => {
          // If no date info at all, always include
          const dateStr = t.created_at || t.due_date;
          if (!dateStr) return true;
          const tDate = new Date(dateStr).getTime();
          if (isNaN(tDate)) return true;
          // Include tasks created/due within [now - cutoff, now + cutoff]
          return Math.abs(now.getTime() - tDate) <= cutoffMs;
        });
      }

      let completedCount = 0;
      let pendingCount = 0;
      filteredTasks.forEach(t => {
        if (isTaskCompleted(t)) completedCount++;
        else pendingCount++;
      });

      setPieData([
        { name: 'Completed', value: completedCount, color: '#3b82f6' },
        { name: 'Pending', value: pendingCount, color: '#f97316' },
      ]);

      let highCount = 0, medCount = 0, lowCount = 0;
      filteredTasks.forEach(t => {
        const pId = Number(t.priority_id);
        const pStr = String(t.priority || t.priority_name || '').toLowerCase().trim();
        const isHigh = pId === 1 || pStr === 'high' || pStr === '1';
        const isMed = pId === 2 || pStr === 'medium' || pStr === 'med' || pStr === '2';
        if (isHigh) highCount++;
        else if (isMed) medCount++;
        else lowCount++;
      });

      setPriorityData([
        { name: 'High', value: highCount, color: '#EF4444' },
        { name: 'Medium', value: medCount, color: '#F59E0B' },
        { name: 'Low', value: lowCount, color: '#10B981' },
      ]);

      // Employee Performance
      if (isAdmin) {
        let empPerfList = [];
        if (allUsers.length > 0) {
          empPerfList = allUsers.map(emp => {
            const empTasks = filteredTasks.filter(t => {
              const tEmpId = String(t.employee_id || t.assigned_to_id || '').toLowerCase();
              const tEmpName = String(t.employee_name || t.assigned_to || t.username || '').toLowerCase();
              const eName = (emp.name || '').toLowerCase();
              return tEmpId === String(emp.id).toLowerCase() || (eName && tEmpName.includes(eName));
            });
            const assigned = empTasks.length;
            const completedEmp = empTasks.filter(t => isTaskCompleted(t)).length;
            const perf = assigned > 0 ? Math.round((completedEmp / assigned) * 100) : 0;
            return { name: emp.name || 'Employee', performance: perf, actualPerf: perf };
          });
        } else {
          // Fallback: derive employee list from task data when users API is unavailable
          const empMap = {};
          filteredTasks.forEach(t => {
            const empName = t.employee_name || t.assigned_to || t.username || t.assignee || 'Unknown';
            if (!empMap[empName]) empMap[empName] = { assigned: 0, completed: 0 };
            empMap[empName].assigned++;
            if (isTaskCompleted(t)) empMap[empName].completed++;
          });
          empPerfList = Object.entries(empMap).map(([name, counts]) => {
            const perf = counts.assigned > 0 ? Math.round((counts.completed / counts.assigned) * 100) : 0;
            return { name, performance: perf, actualPerf: perf };
          });
          // If still empty (no tasks at all), show current admin with 0
          if (empPerfList.length === 0) {
            empPerfList = [{ name: currentUserName || 'Admin', performance: 0, actualPerf: 0 }];
          }
        }
        setEmployeeData(empPerfList);
      } else {
        // Employee: only their own performance
        const assigned = filteredTasks.length;
        const completedEmp = filteredTasks.filter(t => isTaskCompleted(t)).length;
        const perf = assigned > 0 ? Math.round((completedEmp / assigned) * 100) : 0;
        setEmployeeData([{ name: currentUserName || 'My Performance', performance: perf, actualPerf: perf }]);
      }

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

  useEffect(() => { fetchReportData(); }, [department, dateRange]);

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(isAdmin ? "Employee Task Tracker Report - All" : "My Personal Task Report", 20, 20);
    doc.setFontSize(12);
    doc.text('User: ' + currentUserName + ' (' + role + ')', 20, 30);
    doc.text('Department: ' + (isAdmin ? department : 'My Department'), 20, 40);
    doc.text('Date Range: ' + dateRange, 20, 50);
    autoTable(doc, {
      startY: 60,
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
      body: employeeData.length > 0 ? employeeData.map((emp) => [emp.name, emp.performance + '%']) : [["No data", "0%"]],
    });
    doc.save(isAdmin ? "All_Employee_Report.pdf" : "My_Personal_Report.pdf");
    showToast("PDF Exported Successfully!");
  };

  const handleGenerateReport = () => {
    fetchReportData();
    showToast(isAdmin ? "Full report generated!" : "Your personal report generated!");
  };

  return (
    <div className="min-h-screen text-slate-100 flex flex-col font-sans bg-transparent">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12 flex flex-col gap-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#0f172a]/60 border border-slate-800 p-6 rounded-2xl backdrop-blur-md shadow-xl w-full">
          <div>
            <h2 className="text-3xl font-bold text-white">{isAdmin ? t("reportAndAnalysis") : "My Personal Report"}</h2>
            <p className="text-sm text-slate-300 mt-1">{isAdmin ? t("reviewTaskAnalytics") : 'Hello ' + currentUserName + ', here is your performance overview'}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {isAdmin && (
              <select value={department} onChange={(e) => setDepartment(e.target.value)} className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none">
                <option value="All">{t("allDepartments")}</option>
                <option value="IT">IT</option>
                <option value="Marketing">Marketing</option>
                <option value="Design">Design</option>
              </select>
            )}
            <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none">
              <option value="Last 30 Days">{t("last30Days")}</option>
              <option value="Last 7 Days">{t("last7Days")}</option>
              <option value="This Quarter">{t("thisQuarter")}</option>
            </select>
            <button onClick={handleGenerateReport} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-all">
              {t("filter")}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">
          <div className="lg:col-span-4 bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-md">
            <h4 className="font-bold text-xs text-slate-300 uppercase tracking-wider mb-4">{t("taskCompletionWeekly")}</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={taskDataWeekly}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" fontSize={10} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, color: '#f8fafc' }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Line type="monotone" dataKey="completed" stroke="#3b82f6" strokeWidth={2.5} name={t("completed")} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="pending" stroke="#f97316" strokeWidth={2.5} name={t("pending")} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-4 bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-md flex flex-col justify-between">
            <h4 className="font-bold text-xs text-slate-300 uppercase tracking-wider mb-4">{t("pendingVsCompleted")}</h4>
            <div className="h-48 flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={68} paddingAngle={4}>
                    {pieData.map((entry, index) => (
                      <Cell key={'cell-' + index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, color: '#f8fafc' }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-4 bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-md">
            <h4 className="font-bold text-xs text-slate-300 uppercase tracking-wider mb-4">{isAdmin ? t("employeePerformance") : "My Performance"}</h4>
            <div className="h-64">
              {employeeData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-400 text-xs">No performance data available</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={employeeData} layout="vertical" margin={{ left: 10, right: 30, top: 5, bottom: 5 }}>
                    <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" fontSize={10} tickFormatter={(v) => v + '%'} />
                    <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={isAdmin ? 80 : 90} />
                    <Tooltip formatter={(value, name, props) => [`${props.payload.actualPerf}%`, 'Performance']} contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, color: '#f8fafc' }} />
                    <Bar dataKey="performance" fill={isAdmin ? "#3b82f6" : "#10b981"} radius={[0, 4, 4, 0]} minPointSize={3} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="lg:col-span-4 bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-md">
            <h4 className="font-bold text-xs text-slate-300 uppercase tracking-wider mb-4">{t("priorityDistribution")}</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityData}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" fontSize={10} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, color: '#f8fafc' }} />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                    {priorityData.map((entry, index) => (
                      <Cell key={'cell-' + index} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-8 bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-md flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-sm text-slate-200">{isAdmin ? t("analyticalOverview") : "My Work Summary"}</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {isAdmin ? t("analyticalDescription") : 'You have completed ' + (pieData[0]?.value || 0) + ' tasks and have ' + (pieData[1]?.value || 0) + ' tasks pending. Completion rate is ' + (employeeData[0]?.actualPerf || 0) + '%.'}
              </p>
            </div>
            <div className="flex gap-4 mt-6">
              <button onClick={handleGenerateReport} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all shadow">
                {t("generateReport")}
              </button>
              <button onClick={handleExportPDF} className="flex-1 py-3 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white font-bold rounded-xl text-xs transition-all shadow">
                {t("exportPDF")}
              </button>
            </div>
          </div>
        </div>
      </main>
      <footer className="w-full bg-[#090d16] border-t border-slate-900 py-8 px-6 text-center text-xs text-slate-500 mt-auto">
        <p className="mb-2">{t("footerText")}</p>
      </footer>
    </div>
  );
}

export default Reports;