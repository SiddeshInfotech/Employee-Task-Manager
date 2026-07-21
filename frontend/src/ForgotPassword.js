import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Mail, ArrowLeft, Layers } from 'lucide-react';
import api, { showToast } from './axios';

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      showToast('Reset link sent to email');
      setLoading(false);
      navigate('/reset-password');
    }, 600);
  };

  return (
    <div className="min-h-screen text-slate-100 flex flex-col font-sans bg-transparent">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#0f172a]/80 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <RouterLink to="/" className="flex items-center gap-3 no-underline text-white">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                Employee Task Tracker
              </h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Organize. Track. Achieve.</p>
            </div>
          </RouterLink>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <RouterLink to="/" className="hover:text-blue-500 transition-colors">Home</RouterLink>
          <RouterLink to="/dashboard" className="hover:text-blue-500 transition-colors">Dashboard</RouterLink>
          <RouterLink to="/team" className="hover:text-blue-500 transition-colors">Team Members</RouterLink>
        </nav>

        <RouterLink
          to="/login"
          className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-all duration-300 shadow-lg shadow-blue-500/25"
        >
          Login
        </RouterLink>
      </header>

      {/* Main Container Split */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-16 flex flex-col lg:flex-row items-center gap-12 justify-center">
        <div className="w-full max-w-4xl bg-white text-slate-800 rounded-3xl shadow-2xl border border-white/20 overflow-hidden flex flex-col md:flex-row min-h-[480px]">
          {/* Left panel representation */}
          <div className="flex-1 bg-slate-50 p-8 flex flex-col items-center justify-center text-center border-r border-slate-100">
            <div className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center mb-6 text-blue-600 shadow-inner">
              <Mail className="w-12 h-12" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">Forgot Password?</h3>
            <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
              Don't worry! It happens. Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          {/* Right panel form */}
          <div className="flex-1 p-10 flex flex-col justify-center">
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-slate-950">Forgot Password</h3>
              <p className="text-xs text-slate-400 mt-1">Enter your registered email address to receive a password reset link.</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-300 flex items-center justify-center gap-2"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            <div className="relative my-6 text-center">
              <span className="absolute inset-x-0 top-2.5 h-px bg-slate-100"></span>
              <span className="relative bg-white px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                OR
              </span>
            </div>

            <RouterLink
              to="/login"
              className="w-full py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 text-sm font-semibold flex items-center justify-center gap-2 transition-all no-underline"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </RouterLink>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-[#090d16] border-t border-slate-900 py-8 px-6 text-center text-xs text-slate-500 mt-auto">
        <p className="mb-2">© 2026 Employee Task Tracker System | All Rights Reserved</p>
        <p><span className="text-slate-400 font-semibold"></span></p>
      </footer>
    </div>
  );
}

export default ForgotPassword;
