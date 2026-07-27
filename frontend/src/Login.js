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
    <div className="min-h-screen flex flex-col font-sans bg-transparent">
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/85 border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <Link to="/" className="flex items-center gap-3 no-underline">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center"><ShieldCheck className="w-5 h-5 text-white" /></div>
          <h1 className="text-lg font-bold text-slate-900">Employee Task Tracker</h1>
        </Link>
        <button onClick={() => setIsLogin(!isLogin)} className="px-5 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 text-sm font-medium">{isLogin ? 'Register' : 'Login'}</button>
      </header>

      <main className="flex-1 flex lg:flex-row w-full">
        <div className="hidden lg:flex w-1/2">
          <div className="w-full h-full bg-white/75 p-12 flex flex-col justify-center">
            <h2 className="text-4xl font-extrabold text-slate-900 mb-3">Welcome Back! <br /><span className="text-blue-600">Let's Get Things Done.</span></h2>
            <p className="text-slate-600 mb-8 text-sm">Login to your account and continue managing your tasks, team and deadlines.</p>
            <div className="space-y-4">
              <div className="flex gap-3"><div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center"><CheckCircle className="w-4 h-4 text-blue-600" /></div><div><p className="font-bold text-slate-900 text-sm">Task Management</p><p className="text-xs text-slate-500">Create and track tasks</p></div></div>
              <div className="flex gap-3"><div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center"><CheckCircle className="w-4 h-4 text-green-600" /></div><div><p className="font-bold text-slate-900 text-sm">Team Collaboration</p><p className="text-xs text-slate-500">Work together seamlessly</p></div></div>
            </div>
          </div>
        </div>


        <div className="w-full lg:w-1/2 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-[90%] max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 p-8">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-3">{isLogin ? <LogIn className="w-6 h-6 text-blue-600" /> : <UserPlus className="w-6 h-6 text-blue-600" />}</div>
              <h3 className="text-2xl font-bold text-slate-900">{isLogin ? 'Login to Your Account' : 'Create New Account'}</h3>
              <p className="text-xs text-slate-500 mt-1">{isLogin ? 'Enter your credentials' : 'Join today'}</p>
            </div>

            <form onSubmit={isLogin ? handleLogin : handleRegister} className="flex flex-col gap-4">
              {!isLogin && (
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">
                    Employee ID
                  </label>
                  <input
                    type="number"
                    required
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    placeholder="Enter Employee ID"
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-blue-500" />
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">
                  Username
                </label>

                <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter Username"
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900" />
              </div>

              {!isLogin && (
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">Email Address</label>
                  <div className="relative"><Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" /><input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter email" className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-blue-500" /></div>
                </div>
              )}
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">Password</label>
                <div className="relative"><Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                  <input type={showPassword ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" className="w-full pl-10 pr-10 py-3 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-blue-500" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-xs text-slate-500">{showPassword ? 'Hide' : 'Show'}</button></div>
              </div>
              {!isLogin && (
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">Role</label>
                  <select value={role} onChange={e => setRole(e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                    <option value="employee" className="text-slate-900 bg-white">
                      Employee
                    </option>

                    <option value="admin" className="text-slate-900 bg-white">
                      Admin
                    </option>
                  </select>
                </div>
              )}

              {isLogin && (
                <div className="flex items-center justify-between text-xs mt-1">
                  <label className="flex items-center gap-2 text-slate-600">
                    <input type="checkbox" className="rounded" /> Remember Me</label>
                  <Link to="/forgot-password" className="font-semibold text-blue-600">Forget Password ?</Link>
                </div>
              )}

              <button type="submit" disabled={loading} className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl mt-2 shadow-md flex items-center justify-center gap-2">
                {loading ? 'Please wait...' : isLogin ? 'Login' : 'Register'} <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-6 text-center">
              <button onClick={() => setIsLogin(!isLogin)} className="text-sm px-4 py-2 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 transition">
                {isLogin ? (
                  <><span className="text-slate-600">Don't have an account? </span><span className="font-semibold text-blue-600">Register here</span></>
                ) : (
                  <><span className="text-slate-600">Already have an account? </span><span className="font-semibold text-blue-600">Login here</span></>
                )}
              </button>
            </div>

          </motion.div>
        </div>
      </main>

      <footer className="w-full bg-white/80 backdrop-blur border-t border-slate-200 py-4 text-center text-xs text-slate-500">© 2026 Employee Task Tracker<span className="font-semibold text-slate-900"></span></footer>
    </div>
  );
}

export default Login;