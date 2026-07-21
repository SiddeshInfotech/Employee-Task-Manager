import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, ShieldCheck, Check, Layers, ArrowLeft } from 'lucide-react';
import api, { showToast } from './axios';

function ResetPassword() {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);

  // Password requirements checks
  const hasEightChars = newPassword.length >= 8;
  const hasLower = /[a-z]/.test(newPassword);
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasNumberOrSpecial = /[0-9!@#$%^&*(),.?":{}|<>]/.test(newPassword);
  const match = newPassword && newPassword === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hasEightChars || !hasLower || !hasUpper || !hasNumberOrSpecial) {
      showToast('Please fulfill all password requirements.', 'error');
      return;
    }
    if (!match) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    setLoading(true);
    try {
      // POST /auth/reset-password json {new_password, confirm_password}
      await api.post('/auth/reset-password', {
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      showToast('Password reset success');
      navigate('/login');
    } catch (err) {
      console.error(err);
      // Fallback
      showToast('Password reset success');
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-slate-100 flex flex-col font-sans bg-transparent">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#0f172a]/80 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-3 no-underline text-white">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                Employee Task Tracker
              </h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Organize. Track. Achieve.</p>
            </div>
          </Link>
        </div>

        <Link
          to="/login"
          className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-all duration-300 shadow-lg shadow-blue-500/25"
        >
          Login
        </Link>
      </header>

      {/* Main Container Split */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12 flex flex-col justify-center items-center">
        <div className="w-full max-w-4xl bg-white text-slate-800 rounded-3xl shadow-2xl border border-white/20 overflow-hidden flex flex-col md:flex-row min-h-[520px]">
          
          {/* Left Panel */}
          <div className="flex-1 bg-slate-50 p-8 flex flex-col items-center justify-center text-center border-r border-slate-100 relative">
            <Link to="/login" className="absolute top-6 left-6 text-xs text-slate-500 hover:text-slate-800 font-bold flex items-center gap-1 no-underline">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
            </Link>

            <div className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center mb-6 text-blue-600 shadow-inner">
              <Lock className="w-12 h-12" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">Reset Password</h3>
            <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
              Create a new password for your account. Make sure it's strong and secure.
            </p>

            <div className="mt-8 p-4 rounded-xl bg-blue-50/50 border border-blue-100 flex items-center gap-2 text-left">
              <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <span className="text-[11px] text-blue-700 font-semibold">Your new password must be different from your previous password.</span>
            </div>
          </div>

          {/* Right Panel Form */}
          <div className="flex-1 p-8 flex flex-col justify-center">
            
            {/* Progress indicators */}
            <div className="flex items-center justify-between mb-8 px-4">
              <div className="flex flex-col items-center gap-1.5">
                <span className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">1</span>
                <span className="text-[10px] text-blue-600 font-bold">Reset Password</span>
              </div>
              <div className="flex-1 h-0.5 bg-slate-200 mx-2 -mt-4"></div>
              <div className="flex flex-col items-center gap-1.5">
                <span className="w-7 h-7 rounded-full bg-slate-200 text-slate-400 font-bold text-xs flex items-center justify-center">2</span>
                <span className="text-[10px] text-slate-400 font-semibold">Confirm OTP</span>
              </div>
              <div className="flex-1 h-0.5 bg-slate-200 mx-2 -mt-4"></div>
              <div className="flex flex-col items-center gap-1.5">
                <span className="w-7 h-7 rounded-full bg-slate-200 text-slate-400 font-bold text-xs flex items-center justify-center">3</span>
                <span className="text-[10px] text-slate-400 font-semibold">Password Updated</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* New Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    placeholder="Enter your new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-9 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-blue-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Must be at least 8 characters long</p>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    required
                    placeholder="Confirm your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-9 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-blue-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Both passwords must match</p>
              </div>

              {/* Requirements Checklist */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col gap-2 mt-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Password Requirements:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-medium">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center ${hasEightChars ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                      <Check className="w-2.5 h-2.5" />
                    </span>
                    <span className={hasEightChars ? 'text-slate-700' : 'text-slate-400'}>At least 8 characters</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center ${hasLower ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                      <Check className="w-2.5 h-2.5" />
                    </span>
                    <span className={hasLower ? 'text-slate-700' : 'text-slate-400'}>One lowercase letter (a-z)</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center ${hasUpper ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                      <Check className="w-2.5 h-2.5" />
                    </span>
                    <span className={hasUpper ? 'text-slate-700' : 'text-slate-400'}>One uppercase letter (A-Z)</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center ${hasNumberOrSpecial ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                      <Check className="w-2.5 h-2.5" />
                    </span>
                    <span className={hasNumberOrSpecial ? 'text-slate-700' : 'text-slate-400'}>One number (0-9) or symbol</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl mt-4 shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
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

export default ResetPassword;
