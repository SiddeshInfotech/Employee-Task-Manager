import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, ArrowRight, UserPlus, CheckCircle, ShieldCheck } from 'lucide-react';
import api, { showToast } from './axios';

function Login() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('employee');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      console.log("[Login] Attempting login for username:", username);
      const params = new URLSearchParams();
      params.append('username', username);
      params.append('password', password);

      const res = await api.post('/auth/login', params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      console.log("[Login] Success response:", res.data);
      if (res.data?.access_token) {
        localStorage.setItem('token', res.data.access_token);
        localStorage.setItem('username', username);

        let userRole = res.data?.role;
        if (!userRole) {
          try {
            const payload = JSON.parse(atob(res.data.access_token.split('.')[1]));
            userRole = payload.role;
          } catch (err) {
            console.error("Failed to decode JWT payload:", err);
          }
        }
        const finalRole = (userRole || 'employee').toLowerCase();
        localStorage.setItem('role', finalRole);
        console.log("Role stored successfully in localStorage:", localStorage.getItem('role'));
        showToast('Login successful!', 'success');
        navigate('/dashboard');
      } else {
        showToast('Token not received from server', 'error');
      }
    } catch (err) {
      console.error("[Login] Error details:", err);
      let errorMsg = "Login failed";
      if (err.response?.data?.detail) {
        errorMsg = typeof err.response.data.detail === 'object'
          ? JSON.stringify(err.response.data.detail)
          : err.response.data.detail;
      } else if (err.response?.data) {
        errorMsg = typeof err.response.data === 'object'
          ? JSON.stringify(err.response.data)
          : err.response.data;
      } else if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        errorMsg = 'Network Error: Cannot connect to backend server at http://127.0.0.1:8001/api. Please ensure the backend server is running.';
      } else if (err.message) {
        errorMsg = err.message;
      }
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      console.log("[Register] Attempting registration for:", username, email, employeeId, role);
      const formattedRole = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
      await api.post('/auth/register', {
        username,
        email,
        employee_id: Number(employeeId),
        password,
        role: formattedRole
      });
      showToast('Registration successful!', 'success');

      // Auto Login
      const params = new URLSearchParams();
      params.append('username', username);
      params.append('password', password);

      const res = await api.post('/auth/login', params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      console.log("[Register] Auto login response:", res.data);

      if (res.data?.access_token) {
        localStorage.setItem('token', res.data.access_token);
        localStorage.setItem('username', username);

        let userRole = res.data?.role;
        if (!userRole) {
          try {
            const payload = JSON.parse(atob(res.data.access_token.split('.')[1]));
            userRole = payload.role;
          } catch (err) {
            console.error("Failed to decode JWT payload:", err);
          }
        }
        const finalRole = (userRole || role || 'employee').toLowerCase();
        localStorage.setItem('role', finalRole);
        console.log("Role stored successfully in localStorage after register:", localStorage.getItem('role'));
      } else {
        localStorage.setItem('role', role.toLowerCase());
      }
      navigate('/dashboard');

    } catch (err) {
      console.error("[Register] Error details:", err);
      let errorMsg = "Registration failed";
      if (err.response?.data?.detail) {
        errorMsg = typeof err.response.data.detail === 'object'
          ? JSON.stringify(err.response.data.detail)
          : err.response.data.detail;
      } else if (err.response?.data) {
        errorMsg = typeof err.response.data === 'object'
          ? JSON.stringify(err.response.data)
          : err.response.data;
      } else if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        errorMsg = 'Network Error: Cannot connect to backend server at http://127.0.0.1:8001/api. Please ensure the backend server is running.';
      } else if (err.message) {
        errorMsg = err.message;
      }
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper min-h-screen flex flex-col relative overflow-hidden font-sans">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/15 blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/15 blur-[150px] pointer-events-none"></div>

      <header className="sticky top-0 z-50 glass-dark border-b border-[rgba(255,255,255,0.05)] px-8 py-5 flex items-center justify-between shadow-2xl">
        <Link to="/" className="flex items-center gap-3 no-underline group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-all">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
             <h1 className="text-lg font-bold text-white tracking-tight leading-tight group-hover:text-blue-400 transition-colors">Nexus</h1>
             <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest leading-none">Workspace</p>
          </div>
        </Link>
        <button onClick={() => setIsLogin(!isLogin)} className="btn-ghost text-sm font-medium">
          {isLogin ? 'Register' : 'Login'}
        </button>
      </header>

      <main className="flex-1 flex lg:flex-row w-full max-w-7xl mx-auto items-center justify-center p-6 gap-12 relative z-10">
        
        {/* Left Hero Section (Hidden on Mobile) */}
        <div className="hidden lg:flex w-1/2 flex-col justify-center fade-up" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-5xl font-extrabold text-white mb-6 leading-tight tracking-tight">
            Welcome Back! <br />
            <span className="gradient-text">Let's Get Things Done.</span>
          </h2>
          <p className="text-slate-400 mb-10 text-lg max-w-md leading-relaxed">
            Login to your premium account and continue managing your tasks, team, and deadlines seamlessly.
          </p>
          
          <div className="space-y-6">
            <div className="flex items-center gap-5 bg-[rgba(255,255,255,0.02)] p-4 rounded-2xl border border-[rgba(255,255,255,0.05)] w-max pr-12 hover:bg-[rgba(255,255,255,0.05)] transition-all">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
                <CheckCircle className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="font-bold text-white text-base">Task Management</p>
                <p className="text-sm text-slate-400">Create, track, and master tasks</p>
              </div>
            </div>
            
            <div className="flex items-center gap-5 bg-[rgba(255,255,255,0.02)] p-4 rounded-2xl border border-[rgba(255,255,255,0.05)] w-max pr-12 hover:bg-[rgba(255,255,255,0.05)] transition-all">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
                <CheckCircle className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="font-bold text-white text-base">Team Collaboration</p>
                <p className="text-sm text-slate-400">Work together seamlessly</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Form Section */}
        <div className="w-full lg:w-1/2 flex items-center justify-center fade-up" style={{ animationDelay: '0.2s' }}>
          <div className="w-full max-w-md glass-dark rounded-3xl shadow-2xl border border-[rgba(255,255,255,0.08)] p-10 relative overflow-hidden">
            {/* Form Background Accent */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>

            <div className="text-center mb-8 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] flex items-center justify-center mx-auto mb-5 shadow-inner">
                {isLogin ? <LogIn className="w-7 h-7 text-blue-400" /> : <UserPlus className="w-7 h-7 text-blue-400" />}
              </div>
              <h3 className="text-2xl font-bold text-white tracking-tight">{isLogin ? 'Login to Your Account' : 'Create New Account'}</h3>
              <p className="text-sm text-slate-400 mt-2">{isLogin ? 'Enter your credentials to continue' : 'Join our workspace today'}</p>
            </div>

            <form onSubmit={isLogin ? handleLogin : handleRegister} className="flex flex-col gap-5 relative z-10">
              {!isLogin && (
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                    Employee ID
                  </label>
                  <input
                    type="number"
                    required
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    placeholder="e.g. 1001"
                    className="w-full px-5 py-3.5 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-600 shadow-inner" />
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                  Username
                </label>
                <input 
                  type="text" 
                  required 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  placeholder="Enter Username"
                  className="w-full px-5 py-3.5 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-600 shadow-inner" />
              </div>

              {!isLogin && (
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
                    <input 
                      type="email" 
                      required 
                      value={email} 
                      onChange={e => setEmail(e.target.value)} 
                      placeholder="Enter email" 
                      className="w-full pl-12 pr-5 py-3.5 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-600 shadow-inner" />
                  </div>
                </div>
              )}
              
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    required 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    placeholder="Enter password" 
                    className="w-full pl-12 pr-16 py-3.5 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-600 shadow-inner" />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    className="absolute right-4 top-3.5 text-xs font-bold text-slate-400 hover:text-white transition-colors uppercase tracking-wider">
                      {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Role</label>
                  <select 
                    value={role} 
                    onChange={e => setRole(e.target.value)} 
                    className="w-full px-5 py-3.5 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-xl text-sm text-white font-medium focus:outline-none focus:border-blue-500 transition-all appearance-none shadow-inner"
                  >
                    <option value="employee" className="bg-slate-900 text-white">Employee</option>
                    <option value="admin" className="bg-slate-900 text-white">Admin</option>
                  </select>
                </div>
              )}

              {isLogin && (
                <div className="flex items-center justify-between text-xs mt-2">
                  <label className="flex items-center gap-2 text-slate-400 cursor-pointer hover:text-slate-300 transition-colors">
                    <input type="checkbox" className="rounded border-slate-600 bg-transparent text-blue-600 focus:ring-blue-500/50" /> Remember Me
                  </label>
                  <Link to="/forgot-password" className="font-bold text-blue-400 hover:text-blue-300 transition-colors">Forget Password?</Link>
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading} 
                className="w-full py-4 btn-primary mt-4 flex items-center justify-center gap-2 text-sm uppercase tracking-widest shadow-xl shadow-blue-600/20"
              >
                {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Sign Up'} <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-8 text-center relative z-10 border-t border-[rgba(255,255,255,0.05)] pt-6">
              <button 
                onClick={() => setIsLogin(!isLogin)} 
                className="text-sm px-6 py-3 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-xl shadow-sm hover:bg-[rgba(255,255,255,0.06)] transition-all group w-full"
              >
                {isLogin ? (
                  <><span className="text-slate-400 group-hover:text-slate-300 transition-colors">Don't have an account? </span><span className="font-bold text-blue-400">Register here</span></>
                ) : (
                  <><span className="text-slate-400 group-hover:text-slate-300 transition-colors">Already have an account? </span><span className="font-bold text-blue-400">Login here</span></>
                )}
              </button>
            </div>

          </div>
        </div>
      </main>

      <footer className="w-full border-t border-[rgba(255,255,255,0.05)] py-6 text-center text-xs text-slate-500 relative z-10">
        © 2026 Nexus Workspace System | Engineered for Excellence
      </footer>
    </div>
  );
}

export default Login;