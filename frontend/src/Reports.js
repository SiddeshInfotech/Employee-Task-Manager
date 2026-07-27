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

  const taskDataWeekly = [
    { name: 'Mon', completed: 65, pending: 35 },
    { name: 'Tue', completed: 72, pending: 42 },
    { name: 'Wed', completed: 58, pending: 38 },
    { name: 'Thu', completed: 68, pending: 32 },
    { name: 'Fri', completed: 62, pending: 48 },
    { name: 'Sat', completed: 75, pending: 65 },
    { name: 'Sun', completed: 82, pending: 58 },
  ];

  const [pieData, setPieData] = useState([
    { name: 'Completed', value: 65, color: '#3b82f6' },
    { name: 'Pending', value: 35, color: '#f97316' },
  ]);

  const employeeData = [
    { name: 'John', performance: 92 },
    { name: 'Emma', performance: 85 },
    { name: 'Alex', performance: 78 },
    { name: 'Sophia', performance: 70 },
    { name: 'Mark', performance: 65 },
  ];

  const [priorityData, setPriorityData] = useState([
    { name: 'High', value: 40, color: '#EF4444' },
    { name: 'Medium', value: 35, color: '#F59E0B' },
    { name: 'Low', value: 25, color: '#10B981' },
  ]);

  const fetchReportData = async () => {
    try {
      const summaryRes = await api.get('/dashboard/summary');
      if (summaryRes.data) {
        const compl = summaryRes.data.completed_tasks || 65;
        const pend = summaryRes.data.pending_tasks || 35;
        setPieData([
          { name: 'Completed', value: compl, color: '#3b82f6' },
          { name: 'Pending', value: pend, color: '#f97316' },
        ]);
      }

      const tasksRes = await api.get('/tasks/');
      if (tasksRes.data && tasksRes.data.length > 0) {
        let highCount = 0, medCount = 0, lowCount = 0;
        tasksRes.data.forEach(t => {
          const p = t.priority?.toLowerCase() || '';
          if (p === 'high') highCount++;
          else if (p === 'medium') medCount++;
          else lowCount++;
        });

        setPriorityData([
          { name: 'High', value: highCount || 40, color: '#EF4444' },
          { name: 'Medium', value: medCount || 35, color: '#F59E0B' },
          { name: 'Low', value: lowCount || 25, color: '#10B981' },
        ]);
      }
    } catch (err) {
      console.error('Failed to load live data for reports dashboard, using defaults.', err);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, []);

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
        ["Completed Tasks", pieData[0].value],
        ["Pending Tasks", pieData[1].value],
        ["High Priority", priorityData[0].value],
        ["Medium Priority", priorityData[1].value],
        ["Low Priority", priorityData[2].value],
      ],
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [["Employee", "Performance"]],
      body: employeeData.map((emp) => [
        emp.name,
        `${emp.performance}%`,
      ]),
    });

    doc.save("Employee_Report.pdf");

    showToast("PDF Exported Successfully!");
  };

  const handleGenerateReport = () => {
    const reportData = {
      department,
      dateRange,
      completedTasks: pieData[0].value,
      pendingTasks: pieData[1].value,
      priorityDistribution: priorityData,
      employeePerformance: employeeData,
    };

    console.log("Generated Report:", reportData);

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
                <BarChart data={employeeData} layout="vertical">
                  <XAxis type="number" stroke="#94a3b8" fontSize={10} />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={50} />
                  <Tooltip />
                  <Bar dataKey="performance" fill="#3b82f6" radius={[0, 4, 4, 0]} />
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