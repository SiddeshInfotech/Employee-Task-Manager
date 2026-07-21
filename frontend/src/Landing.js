import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Play, CheckCircle, Clock, AlertTriangle, Users, BarChart3, Shield, Award, Layers } from 'lucide-react';

function Landing() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const handleDashboardClick = () => {
    if (token) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-transparent">
      {/* Header - White Glass */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg">
            <Layers className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Employee Task Tracker
            </h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Organize. Track. Achieve.</p>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <a href="#home" className="hover:text-blue-600 transition-colors text-blue-600 font-bold">Home</a>
          <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
          <a href="#stats" className="hover:text-blue-600 transition-colors">Stats</a>
          <a href="#about" className="hover:text-blue-600 transition-colors">About Us</a>
          <a href="#contact" className="hover:text-blue-600 transition-colors">Contact</a>
        </nav>

        <button
          onClick={() => navigate('/login')}
          className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-all shadow-md"
        >
          Login
        </button>
      </header>

      {/* Hero - Light */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-16 flex flex-col lg:flex-row items-center gap-16">
        <div className="flex-1 text-center lg:text-left">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-none text-slate-900 mb-6">
              Manage Tasks. <br />
              Boost Productivity. <br />
              <span className="text-blue-600">Achieve More.</span>
            </h2>
            <p className="text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 mb-8">
              Employee Task Tracker helps you organize tasks, manage your team, set priorities, and track progress in real-time, all from one premium dashboard.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="flex flex-wrap justify-center lg:justify-start gap-4">
            <button onClick={() => navigate('/login')} className="flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-semibold shadow-xl hover:scale-[1.02] transition-all">
              Get Started <ArrowRight className="w-5 h-5" />
            </button>
            <button onClick={handleDashboardClick} className="flex items-center gap-2 px-8 py-4 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-2xl font-semibold hover:scale-[1.02] transition-all">
              <Play className="w-5 h-5 fill-current" /> View Dashboard
            </button>
          </motion.div>
        </div>

        <div className="flex-1 w-full max-w-2xl">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-2xl bg-white aspect-[16/10]">
            <div className="bg-slate-100 px-4 py-3 flex items-center justify-between border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-400 block"></span>
                <span className="w-3 h-3 rounded-full bg-yellow-400 block"></span>
                <span className="w-3 h-3 rounded-full bg-green-400 block"></span>
              </div>
              <span className="text-xs text-slate-500 font-mono">http://localhost:3001/dashboard</span>
              <div className="w-8"></div>
            </div>
            <div className="p-4 grid grid-cols-12 gap-3 h-full bg-slate-50">
              <div className="col-span-3 border-r pr-2 flex flex-col gap-2">
                <div className="h-6 w-full bg-blue-600 rounded-md mb-2"></div>
                <div className="h-5 w-4/5 bg-slate-200 rounded-md"></div>
                <div className="h-5 w-5/6 bg-slate-200 rounded-md"></div>
              </div>
              <div className="col-span-9 flex flex-col gap-3">
                <div className="grid grid-cols-4 gap-2">
                  <div className="bg-blue-50 border border-blue-100 p-2 rounded-lg text-center"><div className="text-[10px] text-blue-600">Total</div><div className="text-sm font-bold text-blue-700">120</div></div>
                  <div className="bg-green-50 border border-green-100 p-2 rounded-lg text-center"><div className="text-[10px] text-green-600">Completed</div><div className="text-sm font-bold text-green-700">96</div></div>
                  <div className="bg-orange-50 border border-orange-100 p-2 rounded-lg text-center"><div className="text-[10px] text-orange-600">Pending</div><div className="text-sm font-bold text-orange-700">18</div></div>
                  <div className="bg-red-50 border border-red-100 p-2 rounded-lg text-center"><div className="text-[10px] text-red-600">Overdue</div><div className="text-sm font-bold text-red-700">6</div></div>
                </div>
                <div className="bg-white border p-3 rounded-xl flex-1"><div className="h-3 w-1/4 bg-slate-200 rounded-md"></div><div className="flex items-end justify-between gap-2 h-20 px-4 pt-2"><div className="w-6 bg-blue-300 rounded-t h-[60%]"></div><div className="w-6 bg-green-300 rounded-t h-[90%]"></div><div className="w-6 bg-orange-300 rounded-t h-[40%]"></div></div></div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Stats - White Cards */}
      <section id="stats" className="w-full bg-white/60 backdrop-blur-md py-16 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all"><div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-4"><CheckCircle className="w-6 h-6 text-blue-600" /></div><div className="text-3xl font-extrabold text-slate-900">120</div><div className="text-sm font-semibold text-slate-600 mt-1">Total Tasks</div></div>
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all"><div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mb-4"><CheckCircle className="w-6 h-6 text-green-600" /></div><div className="text-3xl font-extrabold text-slate-900">96</div><div className="text-sm font-semibold text-slate-600 mt-1">Completed</div></div>
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all"><div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center mb-4"><Clock className="w-6 h-6 text-orange-600" /></div><div className="text-3xl font-extrabold text-slate-900">18</div><div className="text-sm font-semibold text-slate-600 mt-1">Pending</div></div>
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all"><div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center mb-4"><AlertTriangle className="w-6 h-6 text-red-600" /></div><div className="text-3xl font-extrabold text-slate-900">6</div><div className="text-sm font-semibold text-slate-600 mt-1">Overdue</div></div>
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all"><div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-4"><Users className="w-6 h-6 text-purple-600" /></div><div className="text-3xl font-extrabold text-slate-900">25</div><div className="text-sm font-semibold text-slate-600 mt-1">Team Members</div></div>
          </div>
        </div>
      </section>

      {/* Features - White */}
      <section id="features" className="max-w-7xl mx-auto w-full px-6 py-20 bg-transparent">
        <div className="text-center mb-16"><h2 className="text-3xl font-bold mb-4 text-slate-900">Our Key Features</h2><p className="text-slate-600 max-w-xl mx-auto">Get complete control over your team workflow and task progress with these advanced modules.</p></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-white/80 backdrop-blur border border-slate-200 p-8 rounded-2xl shadow-sm"><div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-6"><CheckCircle className="w-6 h-6 text-blue-600" /></div><h3 className="text-xl font-bold mb-3 text-slate-900">Task Management</h3><p className="text-slate-600 text-sm">Create, assign and track tasks efficiently in real-time.</p></div>
          <div className="bg-white/80 backdrop-blur border border-slate-200 p-8 rounded-2xl shadow-sm"><div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mb-6"><Award className="w-6 h-6 text-green-600" /></div><h3 className="text-xl font-bold mb-3 text-slate-900">Priority Management</h3><p className="text-slate-600 text-sm">Sort and manage priorities from high to low.</p></div>
          <div className="bg-white/80 backdrop-blur border border-slate-200 p-8 rounded-2xl shadow-sm"><div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center mb-6"><Clock className="w-6 h-6 text-orange-600" /></div><h3 className="text-xl font-bold mb-3 text-slate-900">Due Date Reminder</h3><p className="text-slate-600 text-sm">Set clear timelines and track remaining days.</p></div>
          <div className="bg-white/80 backdrop-blur border border-slate-200 p-8 rounded-2xl shadow-sm"><div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-6"><Users className="w-6 h-6 text-purple-600" /></div><h3 className="text-xl font-bold mb-3 text-slate-900">Team Collaboration</h3><p className="text-slate-600 text-sm">Full department groupings and tracking.</p></div>
          <div className="bg-white/80 backdrop-blur border border-slate-200 p-8 rounded-2xl shadow-sm"><div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center mb-6"><BarChart3 className="w-6 h-6 text-indigo-600" /></div><h3 className="text-xl font-bold mb-3 text-slate-900">Reports & Analytics</h3><p className="text-slate-600 text-sm">Visual representations of tasks completed.</p></div>
          <div className="bg-white/80 backdrop-blur border border-slate-200 p-8 rounded-2xl shadow-sm"><div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center mb-6"><Shield className="w-6 h-6 text-red-600" /></div><h3 className="text-xl font-bold mb-3 text-slate-900">Role-Based Control</h3><p className="text-slate-600 text-sm">Secure role-based permissions Admin vs Employee.</p></div>
        </div>
      </section>

      <footer className="w-full bg-white/80 backdrop-blur border-t border-slate-200 py-8 px-6 text-center text-xs text-slate-600 mt-auto">
        <p className="mb-2">© 2026 Employee Task Tracker System | All Rights Reserved</p>
        <p><span className="text-slate-900 font-semibold"></span></p>
      </footer>
    </div>
  );
}

export default Landing;