import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useSpring } from 'framer-motion';
import { Layers } from 'lucide-react';
import Lottie from 'lottie-react';

// Animation variants
const fadeUp = { hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0 } };
const fadeIn = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
const scaleIn = { hidden: { opacity: 0, scale: 0.85 }, visible: { opacity: 1, scale: 1 } };
const staggerContainer = { hidden: {}, visible: { transition: { staggerChildren: 0.12 } } };

// Fetches Lottie JSON from URL and renders with lottie-react (no web component / no CDN script)
function LottieAnim({ src, width = 160, height = 160, style = {} }) {
  const [animData, setAnimData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch(src)
      .then(r => r.json())
      .then(data => { if (!cancelled) setAnimData(data); })
      .catch(() => { });
    return () => { cancelled = true; };
  }, [src]);

  if (!animData) return <div style={{ width, height, ...style }} />;
  return (
    <Lottie
      animationData={animData}
      loop
      autoplay
      style={{ width, height, ...style }}
    />
  );
}

// Animated counting number component
function CountUp({ end, delay = 0, color = 'text-white' }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const timeout = setTimeout(() => {
      const duration = 900;
      const steps = 30;
      const increment = end / steps;
      let current = 0;
      const interval = setInterval(() => {
        current += increment;
        if (current >= end) { setVal(end); clearInterval(interval); }
        else setVal(Math.floor(current));
      }, duration / steps);
      return () => clearInterval(interval);
    }, delay * 1000);
    return () => clearTimeout(timeout);
  }, [end, delay]);
  return <div className={`text-sm font-bold ${color}`}>{val}</div>;
}

// Floating particle component
function Particle({ x, y, size, delay, color }) {
  return (
    <motion.div
      style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, width: size, height: size, borderRadius: '50%', background: color, filter: 'blur(1px)' }}
      animate={{ y: [0, -30, 0], opacity: [0, 0.6, 0], scale: [0.5, 1, 0.5] }}
      transition={{ repeat: Infinity, duration: 3 + delay, delay, ease: 'easeInOut' }}
    />
  );
}

// Animated large stat number
function BigCount({ end, suffix = '', delay = 0 }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const [started, setStarted] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting && !started) { setStarted(true); } }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [started]);
  useEffect(() => {
    if (!started) return;
    const t = setTimeout(() => {
      let cur = 0; const steps = 40; const inc = end / steps;
      const iv = setInterval(() => { cur += inc; if (cur >= end) { setVal(end); clearInterval(iv); } else setVal(Math.floor(cur)); }, 1200 / steps);
      return () => clearInterval(iv);
    }, delay * 1000);
    return () => clearTimeout(t);
  }, [started, end, delay]);
  return <span ref={ref}>{val}{suffix}</span>;
}

function Landing() {

  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  const [showTop, setShowTop] = useState(false);
  useEffect(() => {
    const h = () => setShowTop(window.scrollY > 400);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  // Random particles
  const particles = Array.from({ length: 18 }, (_, i) => ({
    x: Math.random() * 100, y: Math.random() * 100,
    size: Math.random() * 3 + 1, delay: Math.random() * 4,
    color: ['rgba(37,99,235,0.5)', 'rgba(139,92,246,0.5)', 'rgba(16,185,129,0.4)', 'rgba(248,113,113,0.4)'][i % 4]
  }));

  return (
    <>
      {/* Reading progress bar */}
      <motion.div style={{ scaleX, transformOrigin: 'left', position: 'fixed', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,#2563eb,#7c3aed,#10b981)', zIndex: 9999 }} />

      {/* Back to top button */}
      {showTop && (
        <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 9000, width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#2563eb,#7c3aed)', boxShadow: '0 0 20px rgba(37,99,235,0.5)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}
          whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}>
          ↑
        </motion.button>
      )}

      <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
      * { font-family: 'Inter', sans-serif; }
      @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
      .marquee-track { display: flex; width: max-content; animation: marquee 28s linear infinite; }
      .marquee-track:hover { animation-play-state: paused; }
      @keyframes marquee2 { 0% { transform: translateX(-50%); } 100% { transform: translateX(0); } }
      .marquee-track-rev { display: flex; width: max-content; animation: marquee2 32s linear infinite; }
      @keyframes bgShift { 0% { opacity: 0.6; } 100% { opacity: 1; } }
      @keyframes floatUp { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
      @keyframes spin360 { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
      .shimmer-btn { background-size: 200% auto; animation: shimmer 3s linear infinite; }
    `}</style>

      <div className="min-h-screen flex flex-col bg-[#080a0f] text-white overflow-x-hidden" style={{ fontFamily: "'Inter',sans-serif" }}>

        {/* Premium BG — animated gradient orbs + particles */}
        <div className="fixed inset-0 z-0 overflow-hidden">
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(37,99,235,0.18) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(139,92,246,0.12) 0%, transparent 60%), #080a0f' }} />
          <motion.div style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)', top: '-15%', left: '-10%', filter: 'blur(80px)' }}
            animate={{ x: [0, 60, 0], y: [0, 40, 0] }} transition={{ repeat: Infinity, duration: 14, ease: 'easeInOut' }} />
          <motion.div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)', bottom: '-10%', right: '-8%', filter: 'blur(80px)' }}
            animate={{ x: [0, -50, 0], y: [0, -30, 0] }} transition={{ repeat: Infinity, duration: 18, ease: 'easeInOut' }} />
          <motion.div style={{ position: 'absolute', width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)', top: '40%', left: '50%', filter: 'blur(60px)' }}
            animate={{ x: [0, 30, 0], y: [0, -40, 0] }} transition={{ repeat: Infinity, duration: 12, ease: 'easeInOut' }} />
          {/* floating particles */}
          {particles.map((p, i) => <Particle key={i} {...p} />)}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)', backgroundSize: '64px 64px', maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 0%, transparent 100%)' }} />
        </div>

        {/* Premium Header — glassmorphism */}
        <motion.header
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative z-50 sticky top-0 px-6 py-3 flex items-center justify-between"
          style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', background: 'rgba(8,10,15,0.75)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ rotate: 15, scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 300 }}
              style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)', boxShadow: '0 0 20px rgba(37,99,235,0.5)' }}
              className="w-8 h-8 rounded-xl flex items-center justify-center"
            >
              <Layers className="w-4 h-4 text-white" />
            </motion.div>
            <h1 style={{ background: 'linear-gradient(90deg,#60a5fa,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 800, fontSize: '1rem' }}>Employee Task Tracker</h1>
          </div>
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-white/60">
            {['#home', '#features', '#about', '#how-it-works', '#contact'].map((href, i) => (
              <motion.a key={href} href={href}
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i + 0.3 }}
                whileHover={{ color: '#ffffff', y: -2 }}
                className={`hover:text-white transition-all no-underline relative group`}
              >
                {['Home', 'Features', 'About Us', 'How It Works', 'Contact'][i]}
                <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-blue-500 group-hover:w-full transition-all duration-300" />
              </motion.a>
            ))}
          </nav>
          <motion.button
            whileHover={{ scale: 1.06, boxShadow: '0 0 20px rgba(37,99,235,0.5)' }}
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate('/login')}
            style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)' }}
            className="px-5 py-2 rounded-xl text-white text-sm font-semibold flex items-center gap-2 shadow-lg"
          >
            <span>👤</span> Login
          </motion.button>
        </motion.header>

        {/* Hero */}
        <main id="home" className="relative z-10 max-w-7xl mx-auto w-full px-6 py-20 flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1">
            {/* Badge */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.3)', color: '#93c5fd' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              New · Smart Task Management Platform
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
              <h2 className="text-5xl lg:text-6xl font-extrabold leading-[1.1] mb-6" style={{ letterSpacing: '-0.02em' }}>
                Manage Tasks.<br />
                <motion.span
                  style={{ background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #34d399 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundSize: '200% 200%' }}
                  animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                  transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
                >
                  Boost Productivity.
                </motion.span><br />
                <motion.span initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5, duration: 0.6 }}
                  className="text-white/90">Achieve More.
                </motion.span>
              </h2>
              <motion.p className="text-white/50 max-w-lg mb-8 text-base leading-relaxed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
                Employee Task Tracker helps you organize tasks, manage your team, set priorities and track progress — all in one beautiful dashboard.
              </motion.p>
            </motion.div>

            <motion.div className="flex flex-wrap gap-3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.5 }}>
              <motion.button
                whileHover={{ scale: 1.06, boxShadow: '0 0 30px rgba(37,99,235,0.6)' }}
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate('/login')}
                style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)', fontWeight: 700 }}
                className="px-7 py-3 rounded-xl text-white text-sm flex items-center gap-2 shadow-xl">
                🚀 Get Started Free
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.04, backgroundColor: 'rgba(255,255,255,0.08)' }}
                whileTap={{ scale: 0.96 }}
                className="px-7 py-3 rounded-xl text-white/80 text-sm font-semibold flex items-center gap-2"
                style={{ border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)' }}
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
                ✦ See Features
              </motion.button>
            </motion.div>

            {/* Social proof */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
              className="flex items-center gap-3 mt-8">
              <div className="flex -space-x-2">
                {['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'].map((c, i) => (
                  <div key={i} style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: '2px solid #080a0f', zIndex: 5 - i }} />
                ))}
              </div>
              <span className="text-[12px] text-white/40"><span className="text-white/70 font-semibold">2,000+</span> teams already using it</span>
            </motion.div>
          </div>

          {/* Animated Dashboard Mockup */}
          <div className="flex-1 w-full max-w-[600px]">
            <motion.div
              initial={{ opacity: 0, scale: 0.88, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
              className="relative"
            >
              <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[#1a1d24] p-2">
                <div className="bg-[#0f1115] rounded-xl overflow-hidden border border-white/5">

                  {/* Top bar */}
                  <div className="bg-[#1e222b] px-4 py-2.5 flex items-center justify-between border-b border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                      </div>
                      <span className="text-[10px] font-bold text-white/70 ml-1">Dashboard</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <motion.div
                        className="relative"
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                      >
                        <span className="text-[10px]">🔔</span>
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                      </motion.div>
                      <span className="text-[10px] text-white/40">Welcome, Admin!</span>
                    </div>
                  </div>

                  <div className="p-3 flex flex-col gap-2.5">

                    {/* Stat Cards row with counting animation */}
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: 'Total', end: 120, color: 'text-blue-400', bg: 'bg-blue-500/10', icon: '📋' },
                        { label: 'Done', end: 96, color: 'text-green-400', bg: 'bg-green-500/10', icon: '✅' },
                        { label: 'Pending', end: 18, color: 'text-orange-400', bg: 'bg-orange-500/10', icon: '⏳' },
                        { label: 'Overdue', end: 6, color: 'text-red-400', bg: 'bg-red-500/10', icon: '⚠️' },
                      ].map(({ label, end, color, bg, icon }, i) => (
                        <motion.div
                          key={label}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.8 + i * 0.12 }}
                          whileHover={{ scale: 1.07 }}
                          className={`${bg} border border-white/5 p-2 rounded-lg text-center`}
                        >
                          <div className="text-[9px] text-white/40 mb-0.5">{icon}</div>
                          <CountUp end={end} delay={1.0 + i * 0.12} color={color} />
                          <div className="text-[8px] text-white/40">{label}</div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Main content: chart + task list side by side */}
                    <div className="grid grid-cols-5 gap-2">

                      {/* Animated bar chart */}
                      <div className="col-span-3 bg-[#1e222b] border border-white/5 rounded-lg p-2.5">
                        <div className="text-[8px] text-white/30 mb-2">Weekly Progress</div>
                        <div className="flex items-end justify-around h-16 gap-1">
                          {[
                            { h: 55, color: 'bg-blue-600' },
                            { h: 80, color: 'bg-blue-500' },
                            { h: 45, color: 'bg-blue-400' },
                            { h: 90, color: 'bg-purple-500' },
                            { h: 65, color: 'bg-blue-400' },
                            { h: 75, color: 'bg-green-500' },
                            { h: 95, color: 'bg-green-400' },
                          ].map(({ h, color }, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                              <motion.div
                                className={`w-full ${color} rounded-sm`}
                                initial={{ height: 0 }}
                                animate={{ height: `${h}%` }}
                                transition={{ delay: 1.1 + i * 0.1, duration: 0.6, ease: 'easeOut' }}
                              />
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-around mt-1">
                          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                            <span key={i} className="text-[7px] text-white/20 flex-1 text-center">{d}</span>
                          ))}
                        </div>
                      </div>

                      {/* Live task feed */}
                      <div className="col-span-2 bg-[#1e222b] border border-white/5 rounded-lg p-2.5 flex flex-col gap-1.5">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[8px] text-white/30">Live Tasks</span>
                          <motion.span
                            className="w-1.5 h-1.5 rounded-full bg-green-400"
                            animate={{ opacity: [1, 0.3, 1] }}
                            transition={{ repeat: Infinity, duration: 1.2 }}
                          />
                        </div>
                        {[
                          { name: 'UI Design', status: 'Done', color: 'bg-green-500' },
                          { name: 'API Setup', status: 'Active', color: 'bg-blue-500' },
                          { name: 'QA Report', status: 'Pending', color: 'bg-orange-500' },
                          { name: 'Deploy', status: 'Hold', color: 'bg-slate-500' },
                        ].map(({ name, status, color }, i) => (
                          <motion.div
                            key={name}
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 1.2 + i * 0.15, duration: 0.4 }}
                            className="flex items-center gap-1.5"
                          >
                            <div className={`w-1 h-1 rounded-full ${color} flex-shrink-0`} />
                            <span className="text-[8px] text-white/60 truncate flex-1">{name}</span>
                            <span className={`text-[7px] px-1 py-0.5 rounded ${color} text-white/90 flex-shrink-0`}>{status}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Progress bars row */}
                    <div className="bg-[#1e222b] border border-white/5 rounded-lg p-2.5">
                      <div className="text-[8px] text-white/30 mb-2">Team Performance</div>
                      <div className="flex flex-col gap-1.5">
                        {[
                          { name: 'Design Team', pct: 82, color: 'bg-purple-500' },
                          { name: 'Dev Team', pct: 68, color: 'bg-blue-500' },
                          { name: 'QA Team', pct: 91, color: 'bg-green-500' },
                        ].map(({ name, pct, color }, i) => (
                          <div key={name} className="flex items-center gap-2">
                            <span className="text-[7px] text-white/40 w-14 flex-shrink-0">{name}</span>
                            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <motion.div
                                className={`h-full ${color} rounded-full`}
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ delay: 1.6 + i * 0.15, duration: 0.8, ease: 'easeOut' }}
                              />
                            </div>
                            <span className="text-[7px] text-white/30 w-5 text-right">{pct}%</span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>
              </div>
              <div className="h-3 bg-[#2a2e38] mx-12 rounded-b-xl" />
              <div className="h-1 bg-[#3a3e4a] mx-32 rounded-b-lg" />
            </motion.div>
          </div>
        </main>


        {/* ── Animated Feature Cards Strip ── */}
        <section className="relative z-10 max-w-7xl mx-auto w-full px-6 py-10">
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}
          >
            {/* Task Management – animated checklist */}
            <motion.div variants={scaleIn} transition={{ duration: 0.6 }}
              whileHover={{ scale: 1.04, boxShadow: '0 0 35px rgba(59,130,246,0.25)' }}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center gap-3 overflow-hidden relative">
              <div style={{ width: 120, height: 120, position: 'relative' }} className="flex items-center justify-center">
                <svg width="120" height="120" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="54" fill="none" stroke="#1e3a8a" strokeWidth="3" />
                  {[0, 1, 2, 3].map(i => (
                    <motion.rect key={i} x="28" y={32 + i * 16} width="64" height="8" rx="4" fill="#3b82f6"
                      initial={{ scaleX: 0, opacity: 0 }} whileInView={{ scaleX: 1, opacity: 1 }}
                      viewport={{ once: true }} transition={{ delay: 0.3 + i * 0.2, duration: 0.5 }}
                      style={{ transformOrigin: '28px center' }} />
                  ))}
                  <motion.circle cx="22" cy="36" r="6" fill="#22c55e"
                    initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.3, type: 'spring' }} />
                  <motion.polyline points="19,36 22,39 26,33" fill="none" stroke="white" strokeWidth="2"
                    initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ delay: 0.5, duration: 0.3 }} />
                  <motion.circle cx="22" cy="52" r="6" fill="#22c55e"
                    initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.5, type: 'spring' }} />
                  <motion.polyline points="19,52 22,55 26,49" fill="none" stroke="white" strokeWidth="2"
                    initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ delay: 0.7, duration: 0.3 }} />
                  <motion.circle cx="22" cy="68" r="6" fill="#f59e0b"
                    initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.7, type: 'spring' }} />
                  <motion.circle cx="22" cy="84" r="6" fill="#374151"
                    initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.9, type: 'spring' }} />
                  <motion.circle cx="60" cy="60" r="54" fill="none" stroke="#3b82f6" strokeWidth="3"
                    strokeDasharray="339" strokeLinecap="round"
                    initial={{ strokeDashoffset: 339 }} whileInView={{ strokeDashoffset: 80 }}
                    viewport={{ once: true }} transition={{ duration: 1.5, ease: 'easeInOut' }} />
                </svg>
              </div>
              <h3 className="font-bold text-sm text-center">Smart Task Management</h3>
              <p className="text-xs text-white/50 text-center">Create, assign and track tasks with ease from a single dashboard.</p>
            </motion.div>

            {/* Team Collaboration – animated people */}
            <motion.div variants={scaleIn} transition={{ duration: 0.6 }}
              whileHover={{ scale: 1.04, boxShadow: '0 0 35px rgba(139,92,246,0.25)' }}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center gap-3">
              <div style={{ width: 120, height: 120 }} className="flex items-center justify-center">
                <svg width="120" height="120" viewBox="0 0 120 120">
                  {/* Central person */}
                  <motion.circle cx="60" cy="42" r="14" fill="#8b5cf6"
                    animate={{ scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 2 }} />
                  <motion.path d="M40 80 Q60 65 80 80" fill="#8b5cf6" opacity="0.7"
                    animate={{ d: ['M40 80 Q60 65 80 80', 'M38 82 Q60 63 82 82', 'M40 80 Q60 65 80 80'] }} transition={{ repeat: Infinity, duration: 2 }} />
                  {/* Left person */}
                  <motion.circle cx="25" cy="50" r="10" fill="#3b82f6"
                    initial={{ x: -20, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }}
                    viewport={{ once: true }} transition={{ delay: 0.4, duration: 0.6 }} />
                  <motion.line x1="35" y1="50" x2="46" y2="47" stroke="#3b82f6" strokeWidth="2" strokeDasharray="15"
                    initial={{ strokeDashoffset: 15 }} whileInView={{ strokeDashoffset: 0 }}
                    viewport={{ once: true }} transition={{ delay: 0.8, duration: 0.5 }} />
                  {/* Right person */}
                  <motion.circle cx="95" cy="50" r="10" fill="#22c55e"
                    initial={{ x: 20, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }}
                    viewport={{ once: true }} transition={{ delay: 0.4, duration: 0.6 }} />
                  <motion.line x1="85" y1="50" x2="74" y2="47" stroke="#22c55e" strokeWidth="2" strokeDasharray="15"
                    initial={{ strokeDashoffset: 15 }} whileInView={{ strokeDashoffset: 0 }}
                    viewport={{ once: true }} transition={{ delay: 0.8, duration: 0.5 }} />
                  {/* Chat bubbles */}
                  {[0, 1, 2].map(i => (
                    <motion.circle key={i} cx={50 + i * 10} cy="100" r="3" fill="#8b5cf6"
                      animate={{ y: [0, -8, 0], opacity: [0.3, 1, 0.3] }}
                      transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }} />
                  ))}
                </svg>
              </div>
              <h3 className="font-bold text-sm text-center">Team Collaboration</h3>
              <p className="text-xs text-white/50 text-center">Connect your team and manage employee performance in real time.</p>
            </motion.div>

            {/* Analytics – animated bar chart */}
            <motion.div variants={scaleIn} transition={{ duration: 0.6 }}
              whileHover={{ scale: 1.04, boxShadow: '0 0 35px rgba(16,185,129,0.25)' }}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center gap-3">
              <div style={{ width: 120, height: 120 }} className="flex items-center justify-center">
                <svg width="120" height="120" viewBox="0 0 120 120">
                  <line x1="15" y1="100" x2="110" y2="100" stroke="#374151" strokeWidth="2" />
                  <line x1="15" y1="100" x2="15" y2="15" stroke="#374151" strokeWidth="2" />
                  {[[25, 80, '#3b82f6'], [40, 50, '#22c55e'], [55, 65, '#f59e0b'], [70, 35, '#8b5cf6'], [85, 55, '#ef4444'], [100, 25, '#06b6d4']].map(([x, h, c], i) => (
                    <motion.rect key={i} x={x - 6} y={100 - h} width="12" height={h} rx="3" fill={c}
                      initial={{ height: 0, y: 100 }} whileInView={{ height: h, y: 100 - h }}
                      viewport={{ once: true }} transition={{ delay: 0.2 + i * 0.1, duration: 0.6, ease: 'easeOut' }} />
                  ))}
                  {/* Trend line */}
                  <motion.polyline points="19,80 34,50 49,65 64,35 79,55 94,25"
                    fill="none" stroke="#60a5fa" strokeWidth="2" strokeDasharray="200"
                    initial={{ strokeDashoffset: 200 }} whileInView={{ strokeDashoffset: 0 }}
                    viewport={{ once: true }} transition={{ delay: 0.8, duration: 1 }} />
                  {/* Dots on trend */}
                  {[[19, 80], [34, 50], [49, 65], [64, 35], [79, 55], [94, 25]].map(([x, y], i) => (
                    <motion.circle key={i} cx={x} cy={y} r="3" fill="#60a5fa"
                      initial={{ scale: 0 }} whileInView={{ scale: 1 }}
                      viewport={{ once: true }} transition={{ delay: 0.9 + i * 0.1, type: 'spring' }} />
                  ))}
                </svg>
              </div>
              <h3 className="font-bold text-sm text-center">Reports & Analytics</h3>
              <p className="text-xs text-white/50 text-center">Visualize productivity trends with beautiful real-time charts.</p>
            </motion.div>
          </motion.div>
        </section>

        {/* ── Scrolling Marquee Ticker ── */}
        <section className="relative z-10 w-full py-5 overflow-hidden border-y border-white/5 bg-white/[0.02]">
          <div className="marquee-track">
            {[...Array(2)].map((_, gi) => (
              <div key={gi} className="flex items-center gap-10 px-6">
                {[
                  { icon: '📋', label: 'Task Management' },
                  { icon: '🏆', label: 'Priority Control' },
                  { icon: '👥', label: 'Team Sync' },
                  { icon: '📊', label: 'Analytics' },
                  { icon: '⏰', label: 'Due Reminders' },
                  { icon: '🛡', label: 'Role-Based Access' },
                  { icon: '🔔', label: 'Smart Notifications' },
                  { icon: '📈', label: 'Performance Reports' },
                  { icon: '⚡', label: 'Real-Time Updates' },
                  { icon: '🎯', label: 'Goal Tracking' },
                ].map(({ icon, label }) => (
                  <div key={label} className="flex items-center gap-2 whitespace-nowrap text-white/40 text-sm font-medium">
                    <span className="text-base">{icon}</span>
                    <span>{label}</span>
                    <span className="text-white/15 mx-2">◆</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* ── Trusted By Strip ── */}
        <section className="relative z-10 max-w-7xl mx-auto w-full px-6 py-12">
          <motion.p className="text-center text-[11px] font-semibold tracking-widest text-white/25 uppercase mb-8"
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            Trusted by teams at
          </motion.p>
          <motion.div className="flex flex-wrap items-center justify-center gap-8"
            variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}>
            {[
              { name: 'Accenture', icon: '🏢' },
              { name: 'TechCorp', icon: '💻' },
              { name: 'InnovateLab', icon: '🔬' },
              { name: 'BuildFast', icon: '⚡' },
              { name: 'DataFlow', icon: '📊' },
              { name: 'CloudSync', icon: '☁️' },
            ].map(({ name, icon }) => (
              <motion.div key={name} variants={fadeUp}
                whileHover={{ scale: 1.08, opacity: 1 }}
                className="flex items-center gap-2 cursor-default"
                style={{ opacity: 0.35, transition: 'opacity 0.2s' }}>
                <span className="text-xl">{icon}</span>
                <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em', color: 'white' }}>{name}</span>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* ── Animated Video Showcase Section ── */}
        <section className="relative z-10 max-w-7xl mx-auto w-full px-6 py-10">
          <motion.h2
            className="text-center text-2xl font-bold mb-3"
            variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.5 }}
          >
            See It In Action
          </motion.h2>
          <motion.p
            className="text-center text-white/50 text-sm mb-10"
            variants={fadeIn} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.15 }}
          >
            Smooth, real-time management at your fingertips
          </motion.p>
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}
          >
            {/* Card 1 – Task Board */}
            <motion.div
              variants={fadeUp} transition={{ duration: 0.6 }}
              whileHover={{ scale: 1.03, boxShadow: '0 0 40px rgba(37,99,235,0.3)' }}
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0f1115] cursor-default"
              style={{ minHeight: 260 }}
            >
              {/* animated gradient shimmer */}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(135deg, #1e3a8a33 0%, #1e1b4b55 50%, #0f172a 100%)',
                animation: 'bgShift 4s ease-in-out infinite alternate'
              }} />
              <div className="relative z-10 p-6 flex flex-col gap-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-blue-400 text-lg">📋</span>
                  <span className="font-bold text-sm">Task Board</span>
                  <span className="ml-auto text-[10px] text-white/30 bg-white/5 px-2 py-0.5 rounded-full">Live</span>
                </div>
                {[
                  { label: 'Design Homepage', status: 'In Progress', color: 'bg-amber-500', w: '65%' },
                  { label: 'Write API Docs', status: 'Pending', color: 'bg-blue-500', w: '30%' },
                  { label: 'QA Testing', status: 'Completed', color: 'bg-green-500', w: '100%' },
                ].map(({ label, status, color, w }, i) => (
                  <motion.div
                    key={label}
                    initial={{ x: -30, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + i * 0.15, duration: 0.5 }}
                    className="bg-white/5 border border-white/10 rounded-xl p-3"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium">{label}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full text-white ${color}`}>{status}</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full ${color} rounded-full`}
                        initial={{ width: 0 }}
                        whileInView={{ width: w }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5 + i * 0.15, duration: 0.8 }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Card 2 – Priority Matrix */}
            <motion.div
              variants={fadeUp} transition={{ duration: 0.6, delay: 0.1 }}
              whileHover={{ scale: 1.03, boxShadow: '0 0 40px rgba(139,92,246,0.3)' }}
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0f1115] cursor-default"
              style={{ minHeight: 260 }}
            >
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(135deg, #4c1d9533 0%, #1e1b4b55 50%, #0f172a 100%)',
                animation: 'bgShift 4s ease-in-out 1s infinite alternate'
              }} />
              <div className="relative z-10 p-6 flex flex-col gap-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-purple-400 text-lg">🏆</span>
                  <span className="font-bold text-sm">Priority Matrix</span>
                </div>
                {[
                  { label: 'High Priority', tasks: 8, color: 'bg-red-500', bar: '80%' },
                  { label: 'Medium Priority', tasks: 14, color: 'bg-amber-500', bar: '55%' },
                  { label: 'Low Priority', tasks: 22, color: 'bg-green-500', bar: '30%' },
                ].map(({ label, tasks, color, bar }, i) => (
                  <motion.div
                    key={label}
                    initial={{ x: 30, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + i * 0.15, duration: 0.5 }}
                    className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3"
                  >
                    <div className={`w-2 h-8 ${color} rounded-full flex-shrink-0`} />
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span>{label}</span>
                        <span className="text-white/40">{tasks} tasks</span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full ${color} rounded-full`}
                          initial={{ width: 0 }}
                          whileInView={{ width: bar }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.5 + i * 0.15, duration: 0.8 }}
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Card 3 – Team Activity */}
            <motion.div
              variants={fadeUp} transition={{ duration: 0.6, delay: 0.2 }}
              whileHover={{ scale: 1.03, boxShadow: '0 0 40px rgba(16,185,129,0.3)' }}
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0f1115] cursor-default"
              style={{ minHeight: 260 }}
            >
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(135deg, #06403533 0%, #052e1655 50%, #0f172a 100%)',
                animation: 'bgShift 4s ease-in-out 2s infinite alternate'
              }} />
              <div className="relative z-10 p-6 flex flex-col gap-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-green-400 text-lg">👥</span>
                  <span className="font-bold text-sm">Team Activity</span>
                  <span className="ml-auto w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                </div>
                {[
                  { name: 'Alice', action: 'Completed Design Review', time: '2m ago', avatar: '👩' },
                  { name: 'Bob', action: 'Started API Integration', time: '15m ago', avatar: '👨' },
                  { name: 'Charlie', action: 'Submitted QA Report', time: '1h ago', avatar: '🧑' },
                ].map(({ name, action, time, avatar }, i) => (
                  <motion.div
                    key={name}
                    initial={{ y: 20, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + i * 0.15, duration: 0.5 }}
                    className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm flex-shrink-0">{avatar}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold">{name}</div>
                      <div className="text-[10px] text-white/40 truncate">{action}</div>
                    </div>
                    <span className="text-[10px] text-white/30 flex-shrink-0">{time}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>

          {/* CSS keyframes for bgShift */}
          <style>{`
          @keyframes bgShift {
            0%   { opacity: 0.6; }
            100% { opacity: 1; }
          }
        `}</style>
        </section>


        {/* ── Premium Stats ── */}
        <section className="relative z-10 max-w-7xl mx-auto w-full px-6 pb-12">
          <motion.div className="grid grid-cols-2 lg:grid-cols-4 gap-6"
            variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}>
            {[
              { val: 2000, suffix: '+', label: 'Teams Active', sub: 'Across 30+ countries', icon: '👥', grad: 'linear-gradient(135deg,#1d4ed8,#3b82f6)' },
              { val: 50000, suffix: '+', label: 'Tasks Completed', sub: 'Every month on average', icon: '✅', grad: 'linear-gradient(135deg,#059669,#10b981)' },
              { val: 99, suffix: '%', label: 'Uptime SLA', sub: 'Enterprise-grade reliability', icon: '⚡', grad: 'linear-gradient(135deg,#d97706,#f59e0b)' },
              { val: 4.9, suffix: '★', label: 'User Rating', sub: 'Based on 1,200+ reviews', icon: '🏆', grad: 'linear-gradient(135deg,#7c3aed,#8b5cf6)' },
            ].map(({ val, suffix, label, sub, icon, grad }, i) => (
              <motion.div key={label} variants={fadeUp} transition={{ duration: 0.5 }}
                whileHover={{ scale: 1.04, boxShadow: '0 0 30px rgba(37,99,235,0.15)' }}
                className="relative rounded-2xl p-6 overflow-hidden cursor-default"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: grad }} />
                <div style={{ width: 40, height: 40, borderRadius: 12, background: grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, marginBottom: 12 }}>{icon}</div>
                <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1 }}>
                  <BigCount end={val} suffix={suffix} delay={i * 0.1} />
                </div>
                <div className="font-semibold text-sm mt-2">{label}</div>
                <div className="text-[11px] text-white/35 mt-0.5">{sub}</div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Features */}
        <section id="features" className="relative z-10 max-w-7xl mx-auto w-full px-6 py-16">
          <motion.div className="text-center mb-12" variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <span className="text-xs font-bold tracking-widest text-green-400 uppercase mb-3 block">Features</span>
            <h2 className="text-3xl font-extrabold">Everything your team needs</h2>
            <p className="text-white/40 text-sm mt-2 max-w-lg mx-auto">A complete toolkit to manage work, people, and performance — all in one place.</p>
          </motion.div>
          <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-5" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}>
            {[
              { icon: '📋', grad: 'linear-gradient(135deg,#1d4ed8,#3b82f6)', glow: 'rgba(59,130,246,0.2)', title: 'Task Management', desc: 'Create, assign and track tasks efficiently in real-time.' },
              { icon: '🏆', grad: 'linear-gradient(135deg,#059669,#10b981)', glow: 'rgba(16,185,129,0.2)', title: 'Priority Management', desc: 'Set task priorities to focus on what matters most.' },
              { icon: '⏰', grad: 'linear-gradient(135deg,#d97706,#f59e0b)', glow: 'rgba(245,158,11,0.2)', title: 'Due Date Reminders', desc: 'Set clear timelines and track remaining days effortlessly.' },
              { icon: '👥', grad: 'linear-gradient(135deg,#7c3aed,#8b5cf6)', glow: 'rgba(139,92,246,0.2)', title: 'Team Management', desc: 'Manage your team and monitor individual performance.' },
              { icon: '📊', grad: 'linear-gradient(135deg,#0e7490,#06b6d4)', glow: 'rgba(6,182,212,0.2)', title: 'Reports & Analytics', desc: 'Visualize team performance with beautiful analytics.' },
              { icon: '🛡', grad: 'linear-gradient(135deg,#be123c,#f43f5e)', glow: 'rgba(244,63,94,0.2)', title: 'Role-Based Control', desc: 'Secure, fine-grained access control for every team.' },
            ].map(({ icon, grad, glow, title, desc }) => (
              <motion.div key={title} variants={fadeUp} transition={{ duration: 0.5 }}
                whileHover={{ scale: 1.04, boxShadow: `0 0 35px ${glow}` }}
                className="relative rounded-2xl p-6 cursor-default overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${glow.replace('0.2', '0.6')},transparent)` }} />
                <div style={{ width: 44, height: 44, borderRadius: 14, background: grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 14, boxShadow: `0 4px 20px ${glow}` }}>{icon}</div>
                <h3 className="font-bold text-sm mb-2">{title}</h3>
                <p className="text-xs text-white/45 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* About Us */}
        <section id="about" className="relative z-10 max-w-7xl mx-auto w-full px-6 py-16">
          <motion.div className="relative rounded-3xl p-8 lg:p-12 overflow-hidden flex flex-col lg:flex-row items-center gap-10"
            variants={scaleIn} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.6 }}
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 80% at 100% 50%, rgba(37,99,235,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
            {/* Animated illustration */}
            <div className="flex-shrink-0 flex flex-col gap-3 items-center">
              <div style={{ width: 180, height: 180, borderRadius: 24, background: 'linear-gradient(135deg,rgba(37,99,235,0.15),rgba(139,92,246,0.15))', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80 }}>🏢</div>
              <div className="flex gap-3 mt-2">
                {[
                  { n: '2026', l: 'Founded' },
                  { n: '30+', l: 'Countries' },
                  { n: '99%', l: 'Uptime' },
                ].map(({ n, l }) => (
                  <div key={l} className="text-center">
                    <div style={{ fontSize: 16, fontWeight: 800, background: 'linear-gradient(135deg,#60a5fa,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{n}</div>
                    <div className="text-[10px] text-white/35">{l}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1">
              <span className="text-xs font-bold tracking-widest text-blue-400 uppercase mb-3 block">About Us</span>
              <motion.h2 className="text-3xl font-extrabold mb-4" variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.5 }}>Built for modern teams</motion.h2>
              <motion.p className="text-white/55 text-sm leading-relaxed mb-6" variants={fadeIn} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.2 }}>
                Employee Task Tracker is designed to streamline team collaboration and enhance productivity.
                Our mission is to provide an intuitive and powerful platform for managers and employees alike
                to organize tasks, set priorities, and track progress seamlessly.
                Built with modern web technologies, we ensure a fast, secure, and user-friendly experience.
              </motion.p>
              <div className="flex flex-wrap gap-2">
                {['⚡ Fast', '🔒 Secure', '🎯 Focused', '📱 Responsive', '🌐 Global'].map(t => (
                  <span key={t} style={{ padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>{t}</span>
                ))}
              </div>
            </div>
          </motion.div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="relative z-10 max-w-7xl mx-auto w-full px-6 py-16">
          <motion.div className="text-center mb-12" variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <span className="text-xs font-bold tracking-widest text-blue-400 uppercase mb-3 block">Process</span>
            <h2 className="text-3xl font-extrabold">How It Works</h2>
            <p className="text-white/40 text-sm mt-2">Three simple steps to full productivity</p>
          </motion.div>
          <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-8" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}>
            {[
              {
                num: '1', grad: 'linear-gradient(135deg,#1d4ed8,#2563eb)', glow: 'rgba(37,99,235,0.3)', title: 'Create & Assign', desc: 'Admins create tasks, set priorities, and assign them to specific team members.',
                icon: (<svg width="56" height="56" viewBox="0 0 56 56"><circle cx="28" cy="28" r="26" fill="rgba(37,99,235,0.15)" stroke="rgba(37,99,235,0.4)" strokeWidth="1.5" /><motion.rect x="14" y="18" width="28" height="6" rx="3" fill="#60a5fa" initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ delay: 0.3, duration: 0.5 }} style={{ transformOrigin: '14px center' }} /><motion.rect x="14" y="27" width="20" height="4" rx="2" fill="#93c5fd" opacity="0.7" initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ delay: 0.5, duration: 0.5 }} style={{ transformOrigin: '14px center' }} /><motion.circle cx="38" cy="36" r="8" fill="#2563eb" initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.7, type: 'spring' }} /><motion.polyline points="34,36 37,39 42,33" fill="none" stroke="white" strokeWidth="2" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ delay: 0.9, duration: 0.4 }} /></svg>)
              },
              {
                num: '2', grad: 'linear-gradient(135deg,#059669,#10b981)', glow: 'rgba(16,185,129,0.3)', title: 'Track Progress', desc: 'Employees update task statuses from Pending to In Progress and Completed.',
                icon: (<svg width="56" height="56" viewBox="0 0 56 56"><circle cx="28" cy="28" r="26" fill="rgba(16,185,129,0.15)" stroke="rgba(16,185,129,0.4)" strokeWidth="1.5" /><motion.circle cx="28" cy="28" r="16" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" /><motion.circle cx="28" cy="28" r="16" fill="none" stroke="#10b981" strokeWidth="4" strokeLinecap="round" strokeDasharray="100" initial={{ strokeDashoffset: 100 }} whileInView={{ strokeDashoffset: 28 }} viewport={{ once: true }} transition={{ delay: 0.4, duration: 1 }} /><text x="22" y="32" fill="white" fontSize="9" fontWeight="bold">72%</text></svg>)
              },
              {
                num: '3', grad: 'linear-gradient(135deg,#7c3aed,#8b5cf6)', glow: 'rgba(139,92,246,0.3)', title: 'Monitor & Analyze', desc: 'View real-time dashboards and generate reports to analyze team performance.',
                icon: (<svg width="56" height="56" viewBox="0 0 56 56"><circle cx="28" cy="28" r="26" fill="rgba(139,92,246,0.15)" stroke="rgba(139,92,246,0.4)" strokeWidth="1.5" />{[[14, 36, 6, '#8b5cf6'], [22, 28, 10, '#7c3aed'], [30, 32, 8, '#a78bfa'], [38, 22, 14, '#6d28d9']].map(([x, y, h, c], i) => (<motion.rect key={i} x={x} y={y} width="5" height={h} rx="2" fill={c} initial={{ height: 0, y: y + h }} whileInView={{ height: h, y: y }} viewport={{ once: true }} transition={{ delay: 0.2 + i * 0.15, duration: 0.5 }} />))}<motion.polyline points="17,36 25,28 33,32 41,22" fill="none" stroke="#c4b5fd" strokeWidth="1.5" strokeDasharray="60" initial={{ strokeDashoffset: 60 }} whileInView={{ strokeDashoffset: 0 }} viewport={{ once: true }} transition={{ delay: 0.8, duration: 0.8 }} /></svg>)
              },
            ].map(({ num, grad, glow, title, desc, icon }) => (
              <motion.div key={num} variants={fadeUp} transition={{ duration: 0.5 }}
                whileHover={{ scale: 1.04, boxShadow: `0 0 40px ${glow}` }}
                className="text-center cursor-default rounded-2xl p-8 flex flex-col items-center gap-4 relative overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: grad }} />
                <div className="flex items-center justify-center">{icon}</div>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14 }}>{num}</div>
                <h3 className="font-bold text-base">{title}</h3>
                <p className="text-xs text-white/45 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Pricing */}
        <section className="relative z-10 max-w-7xl mx-auto w-full px-6 py-16">
          <motion.div className="text-center mb-12" variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <span className="text-xs font-bold tracking-widest text-cyan-400 uppercase mb-3 block">Pricing</span>
            <h2 className="text-3xl font-extrabold">Simple, transparent pricing</h2>
            <p className="text-white/40 text-sm mt-2">Start free, scale as you grow</p>
          </motion.div>
          <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}>
            {[
              { name: 'Starter', price: 'Free', period: 'forever', color: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.3)', grad: 'linear-gradient(135deg,#1d4ed8,#3b82f6)', badge: '', features: ['Up to 5 team members', '10 active tasks', 'Basic analytics', 'Email support'] },
              { name: 'Pro', price: '₹999', period: '/month', color: 'rgba(139,92,246,0.15)', border: 'rgba(139,92,246,0.5)', grad: 'linear-gradient(135deg,#7c3aed,#8b5cf6)', badge: 'Most Popular', features: ['Up to 25 team members', 'Unlimited tasks', 'Advanced analytics', 'Priority support', 'Role-based access', 'Custom due reminders'] },
              { name: 'Enterprise', price: 'Custom', period: '', color: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)', grad: 'linear-gradient(135deg,#059669,#10b981)', badge: '', features: ['Unlimited members', 'Unlimited tasks', 'Full analytics suite', 'Dedicated manager', 'SSO & audit logs', 'SLA guarantee'] },
            ].map(({ name, price, period, color, border, grad, badge, features }, i) => (
              <motion.div key={name} variants={fadeUp} transition={{ duration: 0.5 }}
                whileHover={{ scale: 1.03, boxShadow: i === 1 ? '0 0 50px rgba(139,92,246,0.3)' : '0 0 30px rgba(255,255,255,0.06)' }}
                className="relative rounded-2xl p-7 flex flex-col gap-5 cursor-default overflow-hidden"
                style={{ background: color, border: `1px solid ${border}`, ...(i === 1 ? { transform: 'scale(1.03)' } : {}) }}>
                {badge && <div style={{ position: 'absolute', top: 14, right: 14, padding: '3px 10px', borderRadius: 999, background: grad, fontSize: 10, fontWeight: 700, color: 'white' }}>{badge}</div>}
                <div style={{ height: 2, background: grad, borderRadius: 999, marginBottom: 4 }} />
                <div>
                  <div className="font-bold text-base">{name}</div>
                  <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1, marginTop: 6 }}>{price}<span style={{ fontSize: 14, fontWeight: 500, opacity: 0.5 }}>{period}</span></div>
                </div>
                <ul className="flex flex-col gap-2 flex-1">
                  {features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-xs text-white/60">
                      <span style={{ width: 16, height: 16, borderRadius: '50%', background: grad, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, flexShrink: 0 }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <motion.button
                  whileHover={{ scale: 1.04, boxShadow: `0 0 20px ${border}` }} whileTap={{ scale: 0.96 }}
                  onClick={() => navigate('/login')}
                  style={{ background: grad, border: 'none', borderRadius: 12, padding: '10px 20px', color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                  {name === 'Enterprise' ? 'Contact Sales' : 'Get Started'}
                </motion.button>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Testimonials */}
        <section className="relative z-10 max-w-7xl mx-auto w-full px-6 py-16">
          <motion.div className="text-center mb-12" variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <span className="text-xs font-bold tracking-widest text-purple-400 uppercase mb-3 block">Testimonials</span>
            <h2 className="text-3xl font-extrabold">Loved by teams everywhere</h2>
          </motion.div>
          <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}>
            {[
              { name: 'Sarah M.', role: 'Project Manager', avatar: '👩‍💼', stars: 5, text: 'Employee Task Tracker completely transformed how our team manages work. The priority system is a game changer!' },
              { name: 'James K.', role: 'Team Lead', avatar: '👨‍💻', stars: 5, text: 'The real-time dashboard gives me instant visibility into every team member\'s progress. Absolutely love it.' },
              { name: 'Priya R.', role: 'HR Manager', avatar: '👩‍🔬', stars: 5, text: 'Onboarding new employees and tracking their tasks is now seamless. The role-based access is brilliant.' },
            ].map(({ name, role, avatar, stars, text }, i) => (
              <motion.div key={name} variants={fadeUp} transition={{ duration: 0.5 }}
                whileHover={{ scale: 1.03, boxShadow: '0 0 35px rgba(139,92,246,0.2)' }}
                className="rounded-2xl p-6 flex flex-col gap-4 cursor-default relative"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ position: 'absolute', top: -1, left: 24, right: 24, height: 1, background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.5), transparent)' }} />
                <div className="flex gap-1">{[...Array(stars)].map((_, j) => (<span key={j} className="text-yellow-400 text-xs">★</span>))}</div>
                <p className="text-white/60 text-sm leading-relaxed italic">"{text}"</p>
                <div className="flex items-center gap-3 mt-auto">
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#2563eb,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{avatar}</div>
                  <div>
                    <div className="font-semibold text-sm">{name}</div>
                    <div className="text-[11px] text-white/40">{role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* CTA Banner */}
        <section id="contact" className="relative z-10 max-w-7xl mx-auto w-full px-6 py-16">
          <motion.div
            variants={scaleIn} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.7 }}
            className="relative overflow-hidden rounded-3xl p-10 lg:p-16 text-center"
            style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.2) 0%, rgba(139,92,246,0.2) 50%, rgba(16,185,129,0.1) 100%)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            {/* orb inside CTA */}
            <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.25) 0%, transparent 70%)', top: '-30%', left: '-5%', filter: 'blur(60px)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', width: 250, height: 250, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)', bottom: '-20%', right: '-5%', filter: 'blur(50px)', pointerEvents: 'none' }} />
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
              <span className="text-xs font-bold tracking-widest text-blue-400 uppercase mb-4 block">Ready to get started?</span>
              <h2 className="text-3xl lg:text-4xl font-extrabold mb-4" style={{ letterSpacing: '-0.02em' }}>Start managing smarter today</h2>
              <p className="text-white/50 text-sm mb-8 max-w-md mx-auto">Join thousands of teams who use Employee Task Tracker to stay organized, on time, and ahead of the game.</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <motion.button
                  whileHover={{ scale: 1.06, boxShadow: '0 0 30px rgba(37,99,235,0.6)' }} whileTap={{ scale: 0.96 }}
                  onClick={() => navigate('/login')}
                  style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)', fontWeight: 700 }}
                  className="px-8 py-3.5 rounded-xl text-white text-sm shadow-xl flex items-center gap-2">
                  🚀 Get Started Free
                </motion.button>
                <div className="flex items-center gap-4 text-white/40 text-xs">
                  {['✓ No credit card', '✓ Free plan', '✓ Setup in 2 min'].map(t => (<span key={t}>{t}</span>))}
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Contact info */}
          <motion.div className="flex flex-col md:flex-row items-center justify-center gap-8 mt-10"
            variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            {[
              { icon: '📧', label: 'Email', text: 'support@tasktracker.com', color: '#60a5fa' },
              { icon: '📞', label: 'Phone', text: '+1 (555) 123-4567', color: '#34d399' },
              { icon: '💬', label: 'Chat', text: 'Live chat available', color: '#a78bfa' },
            ].map(({ icon, label, text, color }) => (
              <motion.div key={label} variants={fadeUp} whileHover={{ scale: 1.05 }}
                className="flex items-center gap-3 cursor-default">
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{icon}</div>
                <div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color }}>{text}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Premium Footer */}
        <footer className="relative z-10 w-full py-8 mt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div style={{ width: 24, height: 24, borderRadius: 6, background: 'linear-gradient(135deg,#2563eb,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Layers style={{ width: 12, height: 12, color: 'white' }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, background: 'linear-gradient(90deg,#60a5fa,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Employee Task Tracker</span>
            </div>
            <span className="text-[10px] text-white/25">© 2026 Employee Task Tracker System · All Rights Reserved</span>
            <div className="flex items-center gap-4">
              {['Privacy', 'Terms', 'Support'].map(l => (<span key={l} className="text-[10px] text-white/30 hover:text-white/60 cursor-pointer transition-colors">{l}</span>))}
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

export default Landing;