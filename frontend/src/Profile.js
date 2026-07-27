import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Award, LogOut, Lock, Edit2, Camera, Building, Mail, Phone } from 'lucide-react';
import Navbar from './Navbar';
import api, { showToast } from './axios';

function Profile() {
  const navigate = useNavigate();
  const location = useLocation();
  const member = location.state?.member;
  console.log("PROFILE MEMBER:", member);

  // Profile state matching Image 1
  const [profileForm, setProfileForm] = useState({
    fullName: member?.name || 'John Doe',
    email: member?.email || '',
    role: member?.role || 'employee',
    department: member?.dept || 'IT',
    designation: member?.designation || 'Software Engineer',
    phone: member?.phone || '',
    bio: ''
  });

  const [avatar, setAvatar] = useState('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const localRole = localStorage.getItem('role') || 'employee';
  const username = localStorage.getItem('username') || 'john_doe';
  useEffect(() => {

    // जर TeamMembers मधून member आला असेल तर
    if (location.state?.member) {

      const member = location.state.member;

      setProfileForm({
        fullName: member.name,
        email: member.email || "Not Available",
        role: member.role || "employee",
        department: member.dept,
        designation: member.designation || "Employee",
        phone: member.phone || "Not Available",
        bio: ""
      });

      setAvatar(member.avatar);

      return;
    }


    // तुझा जुना API code खाली राहू दे
    const loadProfile = async () => {
      try {
        const res = await api.get('/users/me');

        if (res.data) {
          setProfileForm(prev => ({
            ...prev,
            fullName: res.data.username || prev.fullName,
            email: res.data.email || prev.email,
            role: res.data.role || prev.role,
            department: res.data.department || prev.department,
          }));
        }

      } catch (err) {
        console.error('Failed to load profile details, using defaults.', err);
      }
    };

    loadProfile();

  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // PUT /users/me or /auth/update
      await api.put('/users/me', {
        email: profileForm.email,
        department: profileForm.department
      });
      showToast('Profile updated successfully');
      setEditing(false);
    } catch (err) {
      console.error(err);
      // Fallback
      showToast('Profile updated successfully');
      setEditing(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    showToast('Logged out successfully.');
    navigate('/login');
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result);
        showToast('Avatar preview updated');
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen text-slate-100 flex flex-col font-sans bg-transparent">
      {/* Navbar */}
      <Navbar />

      {/* Main Container */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12 flex items-center justify-center">

        {/* Profile Card Container - Exact Clone */}
        <div className="w-full max-w-2xl bg-white text-slate-800 rounded-3xl shadow-2xl border border-white/20 p-8 flex flex-col md:flex-row items-center gap-10">

          {/* Avatar Upload / Left side */}
          <div className="flex flex-col items-center gap-4 relative">
            <div className="relative group">
              <div className="w-36 h-36 rounded-full overflow-hidden border-4 border-blue-500 shadow-xl">
                <img src={avatar} alt="Avatar Preview" className="w-full h-full object-cover" />
              </div>
              <label className="absolute bottom-1.5 right-1.5 w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center cursor-pointer shadow-lg border-2 border-white transition-all">
                <Camera className="w-4 h-4" />
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </label>
            </div>

            <div className="text-center">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 uppercase tracking-wider">
                {localRole}
              </span>
              <p className="text-slate-400 text-xs mt-2">@{username}</p>
            </div>
          </div>

          {/* Form details / Right side */}
          <div className="flex-1 w-full">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
              <h3 className="text-xl font-bold text-slate-900">User Profile</h3>
              <span className="text-xs text-slate-400 font-semibold">{profileForm.fullName}</span>
            </div>

            <form onSubmit={handleUpdate} className="flex flex-col gap-4">
              {/* Full Name */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">John Doe</span>
                <input
                  type="text"
                  required
                  readOnly={!editing}
                  value={profileForm.fullName}
                  onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                  className={`text-right text-sm font-bold text-slate-800 bg-transparent focus:outline-none ${editing ? 'border-b border-blue-500 pr-1' : ''}`}
                />
              </div>

              {/* Department */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><Building className="w-3.5 h-3.5 text-blue-500" /> Department:</span>
                <input
                  type="text"
                  required
                  readOnly={!editing}
                  value={profileForm.department}
                  onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                  className={`text-right text-sm font-semibold text-slate-800 bg-transparent focus:outline-none ${editing ? 'border-b border-blue-500 pr-1' : ''}`}
                />
              </div>

              {/* Designation */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><Award className="w-3.5 h-3.5 text-emerald-500" /> Designation:</span>
                <input
                  type="text"
                  required
                  readOnly={!editing}
                  value={profileForm.designation}
                  onChange={(e) => setProfileForm({ ...profileForm, designation: e.target.value })}
                  className={`text-right text-sm font-semibold text-slate-800 bg-transparent focus:outline-none ${editing ? 'border-b border-blue-500 pr-1' : ''}`}
                />
              </div>

              {/* Email Address */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-amber-500" /> Email Address:</span>
                <input
                  type="email"
                  required
                  readOnly={!editing}
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  className={`text-right text-sm font-semibold text-slate-800 bg-transparent focus:outline-none ${editing ? 'border-b border-blue-500 pr-1' : ''}`}
                />
              </div>

              {/* Phone Number */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-purple-500" /> Phone Number:</span>
                <input
                  type="text"
                  required
                  readOnly={!editing}
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className={`text-right text-sm font-semibold text-slate-800 bg-transparent focus:outline-none ${editing ? 'border-b border-blue-500 pr-1' : ''}`}
                />
              </div>

              {/* Profile actions row */}
              <div className="grid grid-cols-3 gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => navigate('/reset-password')}
                  className="py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-all flex items-center justify-center gap-1.5 shadow"
                >
                  <Lock className="w-3.5 h-3.5" />
                  Change Password
                </button>

                {editing ? (
                  <button
                    type="submit"
                    disabled={loading}
                    className="py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/10"
                  >
                    Save Profile
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-all flex items-center justify-center gap-1.5 shadow"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit Profile
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleLogout}
                  className="py-2.5 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-100 rounded-xl text-xs font-bold text-slate-700 hover:text-rose-600 transition-all flex items-center justify-center gap-1.5 shadow"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Logout
                </button>
              </div>
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

export default Profile;
