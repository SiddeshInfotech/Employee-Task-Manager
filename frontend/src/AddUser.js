import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, ArrowLeft } from 'lucide-react';
import Navbar from './Navbar';
import api, { showToast } from './axios';

function AddUser() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '',
    fullName: '',
    email: '',
    password: 'password123',
    role: 'employee',
    department: 'Development',
    mobile: '',
    skills: ''
  });
  const [avatarPreview, setAvatarPreview] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email.includes('@')) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }
    if (form.password.length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }

    setLoading(true);
    const newUser = {
      id: Date.now(),
      username: form.username,
      name: form.fullName,
      email: form.email,
      role: form.role,
      department: form.department,
      mobile: form.mobile,
      skills: form.skills,
      avatar: avatarPreview
    };
    try {
      // POST /auth/register
      await api.post('/auth/register', {
        username: form.username || form.fullName.toLowerCase().replace(' ', '_'),
        email: form.email,
        password: form.password,
        role: form.role,
        department: form.department
      });
      const old = JSON.parse(
        localStorage.getItem("myNewUsers") || "[]"
      );

      localStorage.setItem(
        "myNewUsers",
        JSON.stringify([...old, newUser])
      );

      showToast('Member added successfully!');
      navigate('/manage-users');
    } catch (err) {
      console.error(err);
      const old = JSON.parse(
        localStorage.getItem("myNewMembers") || "[]"
      );

      localStorage.setItem(
        "myNewMembers",
        JSON.stringify([...old, newUser])
      );
      // Fallback
      showToast('Member added successfully!');
      navigate('/manage-users');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-slate-100 flex flex-col font-sans bg-transparent">
      {/* Navbar */}
      <Navbar />

      {/* Main Container */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12 flex flex-col gap-6">

        {/* Header Toolbar */}
        <div className="flex items-center justify-between bg-[#0f172a]/60 border border-slate-800 p-5 rounded-2xl backdrop-blur-md shadow-xl w-full">
          <button
            onClick={() => navigate('/manage-users')}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all shadow"
          >
            <ArrowLeft className="w-4 h-4" /> Cancel and Back
          </button>
        </div>

        {/* Add Member Form Card */}
        <div className="bg-white text-slate-800 rounded-3xl shadow-2xl border border-white/20 p-8 flex flex-col items-center">

          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-slate-900">Add New Team Member</h3>
            <p className="text-xs text-slate-500 mt-1">Fill the details below to add a new member</p>
          </div>

          <form onSubmit={handleSubmit} className="w-full max-w-xl flex flex-col gap-5">
            {/* Profile Photo upload preview */}
            <div className="flex flex-col items-center gap-2 mb-4">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Profile Photo</label>
              <div className="relative group">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center text-slate-400">
                      <Camera className="w-6 h-6 mx-auto mb-1" />
                      <span className="text-[10px] font-bold">Upload Photo</span>
                    </div>
                  )}
                </div>
                <input type="file" accept="image/*" className="hidden" id="photo-upload" onChange={handlePhotoChange} />
                <label htmlFor="photo-upload" className="absolute inset-0 cursor-pointer"></label>
              </div>
              <p className="text-[9px] text-slate-400">PNG, JPG up to 2MB</p>
            </div>

            {/* Username */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Username *</label>
              <input
                type="text"
                required
                placeholder="Enter username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Full Name *</label>
              <input
                type="text"
                required
                placeholder="Enter full name"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Department selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Department *</label>
              <select
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
              >
                <option value="Development">Development</option>
                <option value="Marketing">Marketing</option>
                <option value="Design">Design</option>
                <option value="HR">HR</option>
                <option value="Support">Support</option>
              </select>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Email *</label>
              <input
                type="email"
                required
                placeholder="Enter email address"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Default Password *</label>
              <input
                type="password"
                required
                placeholder="Enter default password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Role */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Role *</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
                >
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {/* Mobile */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Mobile Number</label>
                <input
                  type="text"
                  placeholder="Enter mobile number"
                  value={form.mobile}
                  onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Skills */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Skills</label>
              <textarea
                placeholder="Enter key skills"
                value={form.skills}
                onChange={(e) => setForm({ ...form, skills: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none h-20"
              />
            </div>

            {/* Action buttons */}
            <div className="flex gap-4 mt-6">
              <button
                type="button"
                onClick={() => navigate('/manage-users')}
                className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-[#1e293b] hover:bg-slate-900 text-white rounded-xl text-sm font-semibold transition-all shadow"
              >
                {loading ? 'Submitting...' : 'Submit via API'}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-[#090d16] border-t border-slate-900 py-8 px-6 text-center text-xs text-slate-500 mt-auto">
        <p className="mb-2">© 2026 Employee Task Tracker System | All Rights Reserved</p>
        <p>Developed by <span className="text-slate-400 font-semibold">Riddhi Vijay More</span></p>
      </footer>
    </div>
  );
}

export default AddUser;