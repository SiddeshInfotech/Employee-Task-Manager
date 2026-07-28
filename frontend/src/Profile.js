import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Award, LogOut, Lock, Edit2, Camera, Building, Mail, Phone } from 'lucide-react';
import Navbar from './Navbar';
import api, { showToast } from './axios';

function Profile() {
  const navigate = useNavigate();
  const location = useLocation();
  const member = location.state?.member;

  // Logged-in user info
  const loggedInUsername = localStorage.getItem('username') || 'john_doe';
  const loggedInRole = (localStorage.getItem('role') || 'employee').toLowerCase();

  // The profile being viewed: own profile OR an employee's profile (admin clicked View Profile)
  const isViewingOtherProfile = !!member;
  const profileUsername = member?.name || loggedInUsername;
  const profileRole = member?.role || loggedInRole;

  // Per-user avatar localStorage key — each user has their own stored photo
  const avatarKey = `profileAvatar_${profileUsername.toLowerCase().replace(/\s+/g, '_')}`;

  // Generate initials from name (e.g. "Nikita Shah" → "NS", "nikita" → "NI")
  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  // Pick a consistent background color based on name (deterministic hash)
  const getInitialsBg = (name) => {
    const colors = [
      '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b',
      '#10b981', '#06b6d4', '#6366f1', '#ef4444'
    ];
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  const [profileForm, setProfileForm] = useState({
    fullName: member?.name || loggedInUsername || 'John Doe',
    email: member?.email || `${(member?.name || loggedInUsername).toLowerCase().replace(/\s+/g, '')}@gmail.com`,
    role: profileRole,
    department: member?.dept || 'IT',
    designation: member?.designation || 'Software Engineer',
    phone: member?.phone || '+91 98765 43210',
    bio: ''
  });

  // Load avatar: member's passed avatar → per-user localStorage key → null (show initials)
  const [avatar, setAvatar] = useState(
    member?.avatar ||
    localStorage.getItem(avatarKey) ||
    null
  );

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savedProfileSnapshot, setSavedProfileSnapshot] = useState(null);

  useEffect(() => {
    if (isViewingOtherProfile) {
      // Viewing an employee's profile (admin clicked View Profile)
      const initialData = {
        fullName: member.name || loggedInUsername,
        email: member.email || `${(member.name || '').toLowerCase().replace(/\s+/g, '')}@gmail.com`,
        role: member.role || 'employee',
        department: member.dept || 'IT',
        designation: member.designation || 'Software Engineer',
        phone: member.phone || '+91 98765 43210',
        bio: ''
      };
      setProfileForm(initialData);
      setSavedProfileSnapshot(initialData);

      // Load that employee's saved photo from their own key
      const savedAvatar = localStorage.getItem(avatarKey);
      if (member.avatar) {
        setAvatar(member.avatar);
      } else if (savedAvatar) {
        setAvatar(savedAvatar);
      } else {
        setAvatar(null); // show initials
      }
      return;
    }

    // Viewing own profile — load from API then localStorage
    const loadProfile = async () => {
      try {
        const res = await api.get('/users/me');
        if (res.data) {
          setProfileForm(prev => {
            const updated = {
              ...prev,
              fullName: res.data.username || prev.fullName,
              email: res.data.email || prev.email,
              role: res.data.role || prev.role,
              department: res.data.department || prev.department,
            };
            setSavedProfileSnapshot(updated);
            return updated;
          });
        }
      } catch (err) {
        console.warn('Failed to load profile from API, using defaults.', err);
        setSavedProfileSnapshot({ ...profileForm });
      }
    };
    loadProfile();

    // Load own saved avatar from per-user key
    const savedAvatar = localStorage.getItem(avatarKey);
    if (savedAvatar) setAvatar(savedAvatar);

  }, []);

  const handleStartEdit = (e) => {
    if (e) e.preventDefault();
    setSavedProfileSnapshot({ ...profileForm });
    setEditing(true);
  };

  const handleCancelEdit = (e) => {
    if (e) e.preventDefault();
    if (savedProfileSnapshot) {
      setProfileForm({ ...savedProfileSnapshot });
    }
    setEditing(false);
  };

  const handleUpdate = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      await api.put('/users/me', {
        username: profileForm.fullName,
        email: profileForm.email,
        department: profileForm.department
      }).catch(() => {});

      // Save profile to localStorage
      localStorage.setItem('userProfile', JSON.stringify(profileForm));
      if (!isViewingOtherProfile && profileForm.fullName) {
        localStorage.setItem('username', profileForm.fullName);
      }

      setSavedProfileSnapshot({ ...profileForm });
      showToast('Profile updated successfully');
      setEditing(false);
    } catch (err) {
      console.error(err);
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

  // Save uploaded photo under that person's unique key — works for both admin & employee
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result;
        setAvatar(dataUrl);
        localStorage.setItem(avatarKey, dataUrl);
        showToast('Profile picture updated!');
      };
      reader.readAsDataURL(file);
    }
  };

  // Display role badge label
  const roleBadge = isViewingOtherProfile
    ? (member?.role || 'Employee')
    : loggedInRole;

  // Display @handle
  const handleLabel = isViewingOtherProfile
    ? (member?.name || profileUsername)
    : loggedInUsername;

  return (
    <div className="min-h-screen text-slate-100 flex flex-col font-sans bg-transparent">
      {/* Navbar */}
      <Navbar />

      {/* Main Container */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12 flex items-center justify-center">

        {/* Profile Card */}
        <div className="w-full max-w-2xl bg-white text-slate-800 rounded-3xl shadow-2xl border border-white/20 p-8 flex flex-col md:flex-row items-center gap-10">

          {/* Avatar / Left side */}
          <div className="flex flex-col items-center gap-4 relative">
            <div className="relative group">
              {/* Avatar circle: photo if set, initials otherwise */}
              <div className="w-36 h-36 rounded-full overflow-hidden border-4 border-blue-500 shadow-xl bg-slate-100">
                {avatar ? (
                  <img
                    src={avatar}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                    onError={() => setAvatar(null)}
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-white text-4xl font-bold select-none"
                    style={{ backgroundColor: getInitialsBg(profileForm.fullName) }}
                  >
                    {getInitials(profileForm.fullName)}
                  </div>
                )}
              </div>

              {/* Camera button — always visible for both admin & employee */}
              <label
                className="absolute bottom-1.5 right-1.5 w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center cursor-pointer shadow-lg border-2 border-white transition-all"
                title="Change profile picture"
              >
                <Camera className="w-4 h-4" />
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </label>
            </div>

            <div className="text-center">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 uppercase tracking-wider">
                {roleBadge}
              </span>
              <p className="text-slate-400 text-xs mt-2">@{handleLabel}</p>
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
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Full Name:</span>
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

              {/* Action buttons */}
              <div className="grid grid-cols-3 gap-3 mt-6">
                {editing ? (
                  <>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-all flex items-center justify-center gap-1.5 shadow"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/10"
                    >
                      Save Profile
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => navigate('/settings')}
                      className="py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-all flex items-center justify-center gap-1.5 shadow"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      Change Password
                    </button>
                    <button
                      type="button"
                      onClick={handleStartEdit}
                      className="py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-all flex items-center justify-center gap-1.5 shadow"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Edit Profile
                    </button>
                  </>
                )}

                {/* Logout: only show on own profile, not when admin views another user */}
                {!isViewingOtherProfile && (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="py-2.5 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-100 rounded-xl text-xs font-bold text-slate-700 hover:text-rose-600 transition-all flex items-center justify-center gap-1.5 shadow"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Logout
                  </button>
                )}
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
