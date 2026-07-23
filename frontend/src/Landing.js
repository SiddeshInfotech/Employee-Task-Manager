import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Play, CheckCircle, Clock, AlertTriangle, Users, BarChart3, Shield, Award, Layers, ListTodo, Timer, FileBarChart } from 'lucide-react';

function Landing() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const handleDashboardClick = () => {
    if (token) navigate('/dashboard');
    else navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#0f1115] text-white overflow-x-hidden">
      {/* BG Image Overlay - 1st Photo Sarkha */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f1115]/80 via-[#0f1115]/90 to-[#0f1115]"></div>
      </div>

      {/* Header - Black */}
      <header className="relative z-50 sticky top-0 backdrop-blur-xl bg-black/60 border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-lg font-bold text-white">Employee Task Tracker</h1>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-white/70">
          <a href="#home" className="text-white border-b-2 border-blue-600 pb-1">Home</a>
          <a href="#features" className="hover:text-white transition">Features</a>
          <a href="#about" className="hover:text-white transition">About Us</a>
          <a href="#" className="hover:text-white transition">How It Works</a>
          <a href="#contact" className="hover:text-white transition">Contact</a>
        </nav>
        <button onClick={() => navigate('/login')} className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium flex items-center gap-2">
          <span className="text-xs">👤</span> Login
        </button>
      </header>

      {/* Hero - 1st Photo Sarkha */}
      <main className="relative z-10 max-w-7xl mx-auto w-full px-6 py-20 flex flex-col lg:flex-row items-center gap-12">
        <div className="flex-1">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h2 className="text-5xl lg:text-6xl font-extrabold leading-[1.1] mb-6">
              Manage Tasks.<br />
              <span className="text-blue-500">Boost Productivity.</span><br />
              Achieve More.
            </h2>
            <p className="text-white/60 max-w-lg mb-8 text-sm leading-relaxed">
              Employee Task Tracker helps you organize tasks, manage your team, set priorities and track progress in one place.
            </p>
          </motion.div>

          <div className="flex gap-4">
            <button onClick={() => navigate('/login')} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm flex items-center gap-2">
              🚀 Get Started
            </button>
            <button onClick={handleDashboardClick} className="px-6 py-3 bg-transparent border border-white/20 hover:bg-white/10 text-white rounded-lg font-semibold text-sm flex items-center gap-2">
              ▶ View Dashboard
            </button>
          </div>
        </div>

        {/* Laptop Mockup - 1st Photo Sarkha */}
        <div className="flex-1 w-full max-w-[600px]">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} className="relative">
            <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[#1a1d24] p-2">
              <div className="bg-[#0f1115] rounded-xl overflow-hidden aspect-[16/10] border border-white/5">
                <div className="bg-[#1e222b] px-4 py-3 flex items-center justify-between border-b border-white/5">
                  <span className="text-xs font-bold">Dashboard</span>
                  <span className="text-[10px] text-white/40">Welcome back, John!</span>
                </div>
                <div className="p-4 grid grid-cols-4 gap-2">
                  <div className="bg-[#252a35] p-3 rounded-lg text-center"><div className="text-[10px] text-white/50">Total</div><div className="font-bold text-blue-400">120</div></div>
                  <div className="bg-[#252a35] p-3 rounded-lg text-center"><div className="text-[10px] text-white/50">Completed</div><div className="font-bold text-green-400">96</div></div>
                  <div className="bg-[#252a35] p-3 rounded-lg text-center"><div className="text-[10px] text-white/50">Pending</div><div className="font-bold text-orange-400">18</div></div>
                  <div className="bg-[#252a35] p-3 rounded-lg text-center"><div className="text-[10px] text-white/50">Overdue</div><div className="font-bold text-red-400">6</div></div>
                </div>
                <div className="px-4 pb-4">
                  <div className="bg-[#252a35] p-3 rounded-lg h-24 flex items-end justify-around">
                    <div className="w-1/5 bg-blue-600/50 h-[60%] rounded-t"></div>
                    <div className="w-1/5 bg-blue-500 h-[90%] rounded-t"></div>
                    <div className="w-1/5 bg-blue-400 h-[40%] rounded-t"></div>
                    <div className="w-1/5 bg-blue-300 h-[70%] rounded-t"></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="h-3 bg-[#2a2e38] mx-12 rounded-b-xl"></div>
            <div className="h-1 bg-[#3a3e4a] mx-32 rounded-b-lg"></div>
          </motion.div>
        </div>
      </main>

      {/* Stats - Dark Cards - 1st Photo Sarkha */}
      <section className="relative z-10 max-w-7xl mx-auto w-full px-6 pb-12">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4 flex items-center gap-3"><div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">📋</div><div><div className="text-xs text-white/50">Total Tasks</div><div className="font-bold">120</div><div className="text-[10px] text-white/30">Tasks assigned</div></div></div>
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4 flex items-center gap-3"><div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">✓</div><div><div className="text-xs text-white/50">Completed</div><div className="font-bold">96</div><div className="text-[10px] text-white/30">Tasks completed</div></div></div>
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4 flex items-center gap-3"><div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">⏱</div><div><div className="text-xs text-white/50">Pending</div><div className="font-bold">18</div><div className="text-[10px] text-white/30">Tasks pending</div></div></div>
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4 flex items-center gap-3"><div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">⚠</div><div><div className="text-xs text-white/50">Overdue</div><div className="font-bold">6</div><div className="text-[10px] text-white/30">Tasks overdue</div></div></div>
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4 flex items-center gap-3"><div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">👥</div><div><div className="text-xs text-white/50">Team Members</div><div className="font-bold">25</div><div className="text-[10px] text-white/30">Active members</div></div></div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto w-full px-6 py-16">
        <h2 className="text-center text-2xl font-bold mb-10">Our Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/5 border border-white/10 p-6 rounded-xl"><div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mb-4 text-xs">📋</div><h3 className="font-bold text-sm mb-2">Task Management</h3><p className="text-xs text-white/50">Create, assign and track tasks efficiently in real-time.</p></div>
          <div className="bg-white/5 border border-white/10 p-6 rounded-xl"><div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center mb-4 text-xs">🏆</div><h3 className="font-bold text-sm mb-2">Priority Management</h3><p className="text-xs text-white/50">Set task priorities to focus on what matters most.</p></div>
          <div className="bg-white/5 border border-white/10 p-6 rounded-xl"><div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mb-4 text-xs">⏰</div><h3 className="font-bold text-sm mb-2">Due Date Reminder</h3><p className="text-xs text-white/50">Set clear timelines and track remaining days.</p></div>
          <div className="bg-white/5 border border-white/10 p-6 rounded-xl"><div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center mb-4 text-xs">👥</div><h3 className="font-bold text-sm mb-2">Team Management</h3><p className="text-xs text-white/50">Manage your team and monitor their progress.</p></div>
          <div className="bg-white/5 border border-white/10 p-6 rounded-xl"><div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mb-4 text-xs">📊</div><h3 className="font-bold text-sm mb-2">Reports & Analytics</h3><p className="text-xs text-white/50">Visualize team performance with analytics.</p></div>
          <div className="bg-white/5 border border-white/10 p-6 rounded-xl"><div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mb-4 text-xs">🛡</div><h3 className="font-bold text-sm mb-2">Role-Based Control</h3><p className="text-xs text-white/50">Secure access with role based permissions.</p></div>
        </div>
      </section>

      <footer className="relative z-10 w-full border-t border-white/10 py-6 text-center text-[10px] text-white/30">
        © 2026 Employee Task Tracker System | All Rights Reserved | Developed by Riddhi Vijay More
      </footer>
    </div>
  );
}

export default Landing;