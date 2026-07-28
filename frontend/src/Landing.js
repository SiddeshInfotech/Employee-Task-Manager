import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Layers } from 'lucide-react';

// Reusable animation variants
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 }
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: { opacity: 1, scale: 1 }
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } }
};

function Landing() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const handleDashboardClick = () => {
    if (token) navigate('/dashboard');
    else navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#0f1115] text-white overflow-x-hidden">

      {/* BG Image Overlay */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f1115]/80 via-[#0f1115]/90 to-[#0f1115]"></div>
      </div>

      {/* Header */}
      <motion.header
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-50 sticky top-0 backdrop-blur-xl bg-black/60 border-b border-white/10 px-6 py-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ rotate: 15, scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center"
          >
            <Layers className="w-5 h-5 text-white" />
          </motion.div>
          <h1 className="text-lg font-bold text-white">Employee Task Tracker</h1>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-white/70">
          {['#home', '#features', '#about', '#how-it-works', '#contact'].map((href, i) => (
            <motion.a
              key={href}
              href={href}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i + 0.3 }}
              whileHover={{ color: '#ffffff', y: -2 }}
              className={`hover:text-white transition no-underline ${href === '#home' ? 'text-white border-b-2 border-blue-600 pb-1' : ''}`}
            >
              {['Home', 'Features', 'About Us', 'How It Works', 'Contact'][i]}
            </motion.a>
          ))}
        </nav>
        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => navigate('/login')}
          className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium flex items-center gap-2"
        >
          <span className="text-xs">👤</span> Login
        </motion.button>
      </motion.header>

      {/* Hero */}
      <main id="home" className="relative z-10 max-w-7xl mx-auto w-full px-6 py-20 flex flex-col lg:flex-row items-center gap-12">
        <div className="flex-1">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-5xl lg:text-6xl font-extrabold leading-[1.1] mb-6">
              Manage Tasks.<br />
              <motion.span
                className="text-blue-500"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                Boost Productivity.
              </motion.span><br />
              <motion.span
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
              >
                Achieve More.
              </motion.span>
            </h2>
            <motion.p
              className="text-white/60 max-w-lg mb-8 text-sm leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              Employee Task Tracker helps you organize tasks, manage your team, set priorities and track progress in one place.
            </motion.p>
          </motion.div>

          <motion.div
            className="flex gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.5 }}
          >
            <motion.button
              whileHover={{ scale: 1.06, boxShadow: '0 0 20px rgba(37,99,235,0.5)' }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate('/login')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm flex items-center gap-2"
            >
              🚀 Get Started
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.06, backgroundColor: 'rgba(255,255,255,0.1)' }}
              whileTap={{ scale: 0.96 }}
              onClick={handleDashboardClick}
              className="px-6 py-3 bg-transparent border border-white/20 hover:bg-white/10 text-white rounded-lg font-semibold text-sm flex items-center gap-2"
            >
              ▶ View Dashboard
            </motion.button>
          </motion.div>
        </div>

        {/* Laptop Mockup */}
        <div className="flex-1 w-full max-w-[600px]">
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            className="relative"
          >
            <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[#1a1d24] p-2">
              <div className="bg-[#0f1115] rounded-xl overflow-hidden aspect-[16/10] border border-white/5">
                <div className="bg-[#1e222b] px-4 py-3 flex items-center justify-between border-b border-white/5">
                  <span className="text-xs font-bold">Dashboard</span>
                  <span className="text-[10px] text-white/40">Welcome back, John!</span>
                </div>
                <div className="p-4 grid grid-cols-4 gap-2">
                  {[['Total','120','text-blue-400'],['Completed','96','text-green-400'],['Pending','18','text-orange-400'],['Overdue','6','text-red-400']].map(([label, val, color], i) => (
                    <motion.div
                      key={label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1 + i * 0.1 }}
                      className="bg-[#252a35] p-3 rounded-lg text-center"
                    >
                      <div className="text-[10px] text-white/50">{label}</div>
                      <div className={`font-bold ${color}`}>{val}</div>
                    </motion.div>
                  ))}
                </div>
                <div className="px-4 pb-4">
                  <div className="bg-[#252a35] p-3 rounded-lg h-24 flex items-end justify-around">
                    {[60,90,40,70].map((h, i) => (
                      <motion.div
                        key={i}
                        className={`w-1/5 rounded-t ${['bg-blue-600/50','bg-blue-500','bg-blue-400','bg-blue-300'][i]}`}
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        transition={{ delay: 1.2 + i * 0.1, duration: 0.5 }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="h-3 bg-[#2a2e38] mx-12 rounded-b-xl"></div>
            <div className="h-1 bg-[#3a3e4a] mx-32 rounded-b-lg"></div>
          </motion.div>
        </div>
      </main>

      {/* Stats Cards */}
      <section className="relative z-10 max-w-7xl mx-auto w-full px-6 pb-12">
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-5 gap-4"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          {[
            { icon: '📋', bg: 'bg-blue-600', rounded: 'rounded-lg', label: 'Total Tasks', val: '120', sub: 'Tasks assigned' },
            { icon: '✓',  bg: 'bg-green-600', rounded: 'rounded-full', label: 'Completed', val: '96', sub: 'Tasks completed' },
            { icon: '⏱', bg: 'bg-orange-500', rounded: 'rounded-full', label: 'Pending', val: '18', sub: 'Tasks pending' },
            { icon: '⚠', bg: 'bg-red-600', rounded: 'rounded-lg', label: 'Overdue', val: '6', sub: 'Tasks overdue' },
            { icon: '👥', bg: 'bg-purple-600', rounded: 'rounded-full', label: 'Team Members', val: '25', sub: 'Active members' },
          ].map(({ icon, bg, rounded, label, val, sub }) => (
            <motion.div
              key={label}
              variants={fadeUp}
              transition={{ duration: 0.5 }}
              whileHover={{ scale: 1.05, borderColor: 'rgba(255,255,255,0.25)' }}
              className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4 flex items-center gap-3 cursor-default"
            >
              <div className={`w-10 h-10 ${bg} ${rounded} flex items-center justify-center`}>{icon}</div>
              <div>
                <div className="text-xs text-white/50">{label}</div>
                <div className="font-bold">{val}</div>
                <div className="text-[10px] text-white/30">{sub}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto w-full px-6 py-16">
        <motion.h2
          className="text-center text-2xl font-bold mb-10"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          Our Key Features
        </motion.h2>
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {[
            { icon: '📋', bg: 'bg-blue-600',   title: 'Task Management',   desc: 'Create, assign and track tasks efficiently in real-time.' },
            { icon: '🏆', bg: 'bg-green-600',  title: 'Priority Management', desc: 'Set task priorities to focus on what matters most.' },
            { icon: '⏰', bg: 'bg-orange-500', title: 'Due Date Reminder',  desc: 'Set clear timelines and track remaining days.' },
            { icon: '👥', bg: 'bg-purple-600', title: 'Team Management',    desc: 'Manage your team and monitor their progress.' },
            { icon: '📊', bg: 'bg-blue-500',   title: 'Reports & Analytics', desc: 'Visualize team performance with analytics.' },
            { icon: '🛡', bg: 'bg-red-500',    title: 'Role-Based Control', desc: 'Secure access with role based permissions.' },
          ].map(({ icon, bg, title, desc }) => (
            <motion.div
              key={title}
              variants={fadeUp}
              transition={{ duration: 0.5 }}
              whileHover={{ scale: 1.04, backgroundColor: 'rgba(255,255,255,0.08)' }}
              className="bg-white/5 border border-white/10 p-6 rounded-xl cursor-default"
            >
              <div className={`w-8 h-8 ${bg} rounded-full flex items-center justify-center mb-4 text-xs`}>{icon}</div>
              <h3 className="font-bold text-sm mb-2">{title}</h3>
              <p className="text-xs text-white/50">{desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* About Us */}
      <section id="about" className="relative z-10 max-w-7xl mx-auto w-full px-6 py-16">
        <motion.div
          className="bg-white/5 border border-white/10 rounded-2xl p-8 lg:p-12"
          variants={scaleIn}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
        >
          <motion.h2
            className="text-2xl font-bold mb-6 text-center"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            About Us
          </motion.h2>
          <motion.p
            className="text-white/60 text-sm leading-relaxed max-w-3xl mx-auto text-center"
            variants={fadeIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            Employee Task Tracker is designed to streamline team collaboration and enhance productivity.
            Our mission is to provide an intuitive and powerful platform for managers and employees alike
            to organize tasks, set priorities, and track progress seamlessly.
            Built with modern web technologies, we ensure a fast, secure, and user-friendly experience.
          </motion.p>
        </motion.div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="relative z-10 max-w-7xl mx-auto w-full px-6 py-16">
        <motion.h2
          className="text-center text-2xl font-bold mb-10"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          How It Works
        </motion.h2>
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          {[
            { num: '1', color: 'bg-blue-600/20 text-blue-500',   title: 'Create & Assign',    desc: 'Admins create tasks, set priorities, and assign them to specific team members.' },
            { num: '2', color: 'bg-green-600/20 text-green-500', title: 'Track Progress',      desc: 'Employees update task statuses from Pending to In Progress and Completed.' },
            { num: '3', color: 'bg-purple-600/20 text-purple-500', title: 'Monitor & Analyze', desc: 'View real-time dashboards and generate reports to analyze team performance.' },
          ].map(({ num, color, title, desc }) => (
            <motion.div
              key={num}
              variants={fadeUp}
              transition={{ duration: 0.5 }}
              whileHover={{ scale: 1.04 }}
              className="text-center cursor-default"
            >
              <motion.div
                className={`w-16 h-16 ${color} rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold`}
                whileHover={{ rotate: 8, scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                {num}
              </motion.div>
              <h3 className="font-bold mb-2">{title}</h3>
              <p className="text-xs text-white/50">{desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Contact */}
      <section id="contact" className="relative z-10 max-w-7xl mx-auto w-full px-6 py-16">
        <motion.div
          className="bg-[#1a1d24] border border-white/10 rounded-2xl p-8 lg:p-12 text-center"
          variants={scaleIn}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
        >
          <motion.h2
            className="text-2xl font-bold mb-6"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Get in Touch
          </motion.h2>
          <motion.p
            className="text-white/60 text-sm mb-8"
            variants={fadeIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            Have questions or need support? We're here to help.
          </motion.p>
          <motion.div
            className="flex flex-col md:flex-row items-center justify-center gap-6"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {[
              { icon: '📧', color: 'text-blue-400',  text: 'support@tasktracker.com' },
              { icon: '📞', color: 'text-green-400', text: '+1 (555) 123-4567' },
            ].map(({ icon, color, text }) => (
              <motion.div
                key={text}
                variants={fadeUp}
                transition={{ duration: 0.5 }}
                whileHover={{ scale: 1.06 }}
                className="flex items-center gap-3 cursor-default"
              >
                <div className={`w-10 h-10 bg-white/5 rounded-full flex items-center justify-center ${color}`}>{icon}</div>
                <span className="text-sm font-medium">{text}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      <footer className="relative z-10 w-full border-t border-white/10 py-6 text-center text-[10px] text-white/30">
        © 2026 Employee Task Tracker System | All Rights Reserved | Developed by Riddhi Vijay More
      </footer>
    </div>
  );
}

export default Landing;