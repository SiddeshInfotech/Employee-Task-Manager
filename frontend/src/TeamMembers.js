import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Plus, Trash2, Eye, Upload, Image as ImageIcon, Pencil } from 'lucide-react';
import Navbar from './Navbar';
import api, { showToast } from './axios';
import './TeamMembersAnimations.css';

function TeamMembers() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [members, setMembers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [filterDept, setFilterDept] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [newMemberForm, setNewMemberForm] = useState({
    username: '',
    email: '',
    password: '',
    phone: '',
    role: 'employee',
    department: 'Development',
    avatar: ''
  });

  const role = localStorage.getItem('role') || 'employee';
  const isAdmin = role.toLowerCase() === 'admin';

  // Guard: redirect non-admin users away from this page immediately
  useEffect(() => {
    if (!isAdmin) {
      showToast('Access denied. Admins only.', 'error');
      navigate('/dashboard', { replace: true });
    }
  }, []);

  // Fetch all members from the database
  const fetchUsers = async () => {
    try {
      let res;
      try {
        res = await api.get('/employees/');
      } catch {
        res = await api.get('/users/');
      }
      
      let allTasks = [];
      try {
        const tasksRes = await api.get('/tasks/?skip=0&limit=1000');
        allTasks = tasksRes.data || [];
      } catch (e) {
        console.log('Could not fetch tasks for count:', e);
      }
      
      const getTaskCounts = (empId, empName) => {
        let assigned = 0;
        let completed = 0;
        const seenTaskIds = new Set();
        
        allTasks.forEach(t => {
          const taskId = String(t.task_id || t.id || Math.random());
          if (seenTaskIds.has(taskId)) return;
          seenTaskIds.add(taskId);
          
          const tEmpId = t.employee_id != null ? String(t.employee_id) : '';
          const tUserId = t.user_id != null ? String(t.user_id) : '';
          const matchesId = empId && (tEmpId === String(empId) || tUserId === String(empId));
          
          if (matchesId) {
            assigned++;
            const statusId = t.status_id ? Number(t.status_id) : null;
            if (statusId === 3) completed++;
          }
        });
        return { assigned, completed };
      };

      if (res.data && res.data.length > 0) {
        const apiMembers = res.data.map((u, i) => {
          const empId = u.employee_id || u.id || u.user_id;
          const empName = u.username || `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'Employee';
          const counts = getTaskCounts(empId, empName);
          
          return {
            id: empId,
            employee_id: u.employee_id,
            name: empName,
            email: u.email || '',
            phone: u.phone || '',
            designation: u.designation || '',
            role: u.role || 'employee',
            dept: u.department || u.dept || 'Development',
            assigned: counts.assigned,
            completed: counts.completed,
            status: u.is_active !== false ? 'Active' : 'Inactive',
            avatar: u.avatar || u.profile_photo || `https://randomuser.me/api/portraits/${i % 2 === 0 ? 'men' : 'women'}/${(i % 10) + 1}.jpg`
          };
        });
        setMembers(apiMembers);
        return;
      }
    } catch (err) {
      console.log('Backend members endpoint unavailable.', err?.message);
    }
    setMembers([]);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // PHOTO UPLOAD LOGIC
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
        setNewMemberForm({ ...newMemberForm, avatar: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();

    const newMemberObj = {
      id: Date.now(),
      name: newMemberForm.username,
      email: newMemberForm.email,
      phone: newMemberForm.phone,
      designation: '',
      dept: newMemberForm.department || 'Development',
      assigned: 0,
      completed: 0,
      status: 'Active',
      avatar: newMemberForm.avatar || avatarPreview || `https://randomuser.me/api/portraits/men/${(members.length % 10) + 1}.jpg`
    };
    console.log("NEW MEMBER DATA:", newMemberObj);

    const nameParts = (newMemberForm.username || 'New Employee').trim().split(' ');
    const firstName = nameParts[0] || 'Employee';
    const lastName = nameParts.slice(1).join(' ') || 'User';

    const empPayload = {
      first_name: firstName,
      last_name: lastName,
      email: newMemberForm.email || `${firstName.toLowerCase()}@company.com`,
      phone: newMemberForm.phone || '1234567890',
      department: newMemberForm.department || 'Development',
      designation: newMemberForm.role === 'admin' ? 'Manager' : 'Developer'
    };

    try {
      await api.post('/employees/', empPayload);
      showToast('Employee added to database successfully!');
    } catch (err) {
      console.warn('POST /employees/ failed, trying /auth/register fallback:', err);
      try {
        await api.post('/auth/register', {
          username: newMemberForm.username,
          email: newMemberForm.email,
          password: newMemberForm.password || 'password123',
          role: newMemberForm.role === 'admin' ? 'Admin' : 'Employee'
        });
        showToast('Member registered successfully!');
      } catch (authErr) {
        console.error('ADD MEMBER ERROR:', authErr.response?.data || authErr.message);
      }
    }

    setShowAddModal(false);
    setAvatarPreview(null);
    setNewMemberForm({
      username: '',
      email: '',
      password: '',
      phone: '',
      role: 'employee',
      department: 'Development',
      avatar: ''
    });

    // Refresh from database
    fetchUsers();
  };

  const handleDeleteMember = async (memberId) => {
    if (role !== 'admin') {
      showToast('Deletions are only authorized for Admin accounts.', 'error');
      return;
    }

    const memberToDelete = members.find(m => m.id === memberId);
    const dbId = memberToDelete?.employee_id || memberToDelete?.id;

    setMembers(prev => prev.filter(m => m.id !== memberId));
    const oldLocal = JSON.parse(localStorage.getItem('myNewMembers') || '[]');
    const updatedLocal = oldLocal.filter(m => m.id !== memberId);
    localStorage.setItem('myNewMembers', JSON.stringify(updatedLocal));

    if (dbId) {
      try {
        await api.delete(`/employees/${dbId}`);
        showToast('Member deleted successfully.');
      } catch (err) {
        console.warn('API delete failed (member may be local-only):', err);
        showToast('Member deleted successfully.');
      }
    } else {
      showToast('Member deleted successfully.');
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Active': return 'bg-emerald-500 text-white';
      case 'On Leave': return 'bg-amber-500 text-white';
      default: return 'bg-rose-500 text-white';
    }
  };

  const activeFilterCount = (filterDept !== 'All' ? 1 : 0) + (filterStatus !== 'All' ? 1 : 0);

  const filteredMembers = members.filter(m => {
    const matchName = m.name.toLowerCase().includes(search.toLowerCase());
    const matchDept = filterDept === 'All' || m.dept === filterDept;
    const matchStatus = filterStatus === 'All' || m.status === filterStatus;
    return matchName && matchDept && matchStatus;
  });

  return (
    <div className="min-h-screen text-slate-100 flex flex-col font-sans bg-transparent">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12 flex flex-col gap-6">
        <div className="tm-header-card bg-[#0f172a]/60 border border-slate-800 p-6 rounded-2xl backdrop-blur-md shadow-xl">
          <h2 className="text-3xl font-bold text-white">Team Members Page.</h2>
          <p className="text-sm text-slate-300 mt-1">Manage your team member and their progress.</p>
        </div>

        <div className="tm-toolbar flex flex-col sm:flex-row items-center gap-4 justify-between bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-400" />
            <input type="text" placeholder="Search member" value={search} onChange={(e) => setSearch(e.target.value)} className="tm-search-input w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500" />
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => setShowFilter(prev => !prev)}
              className={`tm-btn-filter flex items-center gap-2 px-5 py-2.5 font-semibold rounded-xl text-sm w-full sm:w-auto justify-center transition-colors ${showFilter ? 'bg-slate-800 text-white' : 'bg-white text-slate-800'
                }`}
            >
              <Filter className="w-4 h-4" />
              Filter
              {activeFilterCount > 0 && (
                <span className="ml-1 w-5 h-5 flex items-center justify-center bg-blue-600 text-white text-xs rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </button>
            {role === 'admin' && (
              <button onClick={() => navigate('/add-member')} className="tm-btn-add-member flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm w-full sm:w-auto justify-center shadow-lg"><Plus className="w-4.5 h-4.5" /> + Add Member</button>
            )}
          </div>
        </div>

        {/* ── FILTER PANEL ── */}
        {showFilter && (
          <div className="tm-modal-box bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-5 flex flex-col sm:flex-row gap-4 items-end flex-wrap">
            {/* Department */}
            <div className="flex flex-col gap-1.5 w-full sm:w-auto">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Department</label>
              <select
                value={filterDept}
                onChange={e => setFilterDept(e.target.value)}
                className="px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="All">All Departments</option>
                <option value="Development">Development</option>
                <option value="Design">Design</option>
                <option value="Marketing">Marketing</option>
                <option value="HR">HR</option>
                <option value="Support">Support</option>
              </select>
            </div>
            {/* Status */}
            <div className="flex flex-col gap-1.5 w-full sm:w-auto">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Status</label>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="On Leave">On Leave</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            {/* Clear button — only when filters are active */}
            {activeFilterCount > 0 && (
              <button
                onClick={() => { setFilterDept('All'); setFilterStatus('All'); }}
                className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                Clear Filters
              </button>
            )}
            {/* Result count */}
            <span className="ml-auto text-xs text-slate-400 self-center">
              {filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''} found
            </span>
          </div>
        )}

        <div className="tm-table-wrapper bg-white text-slate-800 rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead><tr className="bg-slate-50 border-b border-slate-100 text-left"><th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Employee Name</th><th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Department</th><th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">Assigned</th><th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">Completed</th><th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">Status</th><th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">Action</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMembers.map((member) => (
                  <tr key={member.id} className="tm-table-row hover:bg-slate-50/80">
                    <td className="px-6 py-4 whitespace-nowrap"><div className="flex items-center gap-3"><img src={member.avatar} alt={member.name} className="tm-avatar w-10 h-10 rounded-full object-cover border-2 border-slate-200 shadow-sm" /><div className="flex flex-col"><span className="font-bold text-slate-900 text-sm">{member.name}</span>{member.email && <span className="text-xs text-slate-500 font-medium">{member.email}</span>}</div></div></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-semibold">{member.dept}</td>
                    <td className="px-6 py-4 text-center font-bold">{member.assigned}</td>
                    <td className="px-6 py-4 text-center font-bold">{member.completed}</td>
                    <td className="px-6 py-4 text-center"><span className={`tm-status-badge px-3 py-1 rounded-full text-xs font-bold ${getStatusStyle(member.status)}`}>{member.status}</span></td>
                    <td className="px-6 py-4 text-center"><div className="flex items-center justify-center gap-3"><button
                      onClick={() => {
                        navigate('/profile', { state: { member } });
                      }}
                      className="tm-btn-view flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-bold"
                    >
                      <Eye className="w-3.5 h-3.5" /> View Profile
                    </button>{role === 'admin' && (<><button onClick={() => navigate('/profile', { state: { member, edit: true } })} className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg transition-all" title="Edit Profile"><Pencil className="w-4 h-4" /></button><button onClick={() => handleDeleteMember(member.id)} className="tm-btn-delete p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg"><Trash2 className="w-4 h-4" /></button></>)}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* ADD MODAL WITH PHOTO */}
      {showAddModal && (
        <div className="tm-modal-overlay fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="tm-modal-box bg-white text-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Add Team Member</h3>
            <form onSubmit={handleAddMember} className="flex flex-col gap-4">

              {/* PHOTO UPLOAD */}
              <div className="flex flex-col items-center gap-3">
                <div className="w-24 h-24 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="preview" className="w-full h-full object-cover" />
                  ) : newMemberForm.username.trim() ? (
                    <span className="text-3xl font-bold text-slate-400">
                      {newMemberForm.username.trim().split(/\s+/).map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                    </span>
                  ) : (
                    <ImageIcon className="w-8 h-8 text-slate-400" />
                  )}
                </div>
                <label className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-black">
                  <Upload className="w-4 h-4" /> Upload Photo
                  <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                </label>
              </div>

              <div><label className="block text-xs font-semibold text-slate-600 uppercase mb-2">Username</label><input type="text" required value={newMemberForm.username} onChange={(e) => setNewMemberForm({ ...newMemberForm, username: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:border-blue-500 focus:outline-none" placeholder="Enter username" /></div>
              <div><label className="block text-xs font-semibold text-slate-600 uppercase mb-2">Email</label><input type="email" required value={newMemberForm.email} onChange={(e) => setNewMemberForm({ ...newMemberForm, email: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-blue-500" placeholder="Enter email" /></div>
              <div><label className="block text-xs font-semibold text-slate-600 uppercase mb-2">Password</label><input type="password" required value={newMemberForm.password} onChange={(e) => setNewMemberForm({ ...newMemberForm, password: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-blue-500" placeholder="Enter password" /></div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">
                  Phone
                </label>

                <input
                  type="text"
                  value={newMemberForm.phone}
                  onChange={(e) =>
                    setNewMemberForm({
                      ...newMemberForm,
                      phone: e.target.value
                    })
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-blue-500"
                  placeholder="Enter phone number"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-semibold text-slate-600 uppercase mb-2">Department</label><select value={newMemberForm.department} onChange={(e) => setNewMemberForm({ ...newMemberForm, department: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-black focus:outline-none focus:border-blue-500" style={{ color: "#000", backgroundColor: "#fff" }}><option style={{ color: "#000", backgroundColor: "#fff" }} value="Marketing">Marketing</option><option style={{ color: "#000", backgroundColor: "#fff" }} value="Development">Development</option><option style={{ color: "#000", backgroundColor: "#fff" }} value="Design">Design</option><option style={{ color: "#000", backgroundColor: "#fff" }} value="HR">HR</option><option style={{ color: "#000", backgroundColor: "#fff" }} value="Support">Support</option></select></div>
                <div><label className="block text-xs font-semibold text-slate-600 uppercase mb-2">Role</label><select value={newMemberForm.role} onChange={(e) => setNewMemberForm({ ...newMemberForm, role: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-black focus:outline-none focus:border-blue-500" style={{ color: "#000", backgroundColor: "#fff" }}><option style={{ color: "#000", backgroundColor: "#fff" }} value="employee">Employee</option><option style={{ color: "#000", backgroundColor: "#fff" }} value="admin">Admin</option></select></div>
              </div>
              <div className="flex gap-3 mt-2"><button type="button" onClick={() => { setShowAddModal(false); setAvatarPreview(null); }} className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold">Cancel</button><button type="submit" className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold">Submit</button></div>
            </form>
          </div>
        </div>
      )}
      <footer className="tm-footer w-full bg-[#090d16] border-t border-slate-900 py-8 px-6 text-center text-xs text-slate-500 mt-auto">© 2026 Employee Task Tracker System | All Rights Reserved</footer>
    </div>
  );
}

export default TeamMembers;