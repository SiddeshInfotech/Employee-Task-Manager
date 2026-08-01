import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Plus, Trash2, Eye, Upload, Image as ImageIcon } from 'lucide-react';
import Navbar from './Navbar';
import api, { showToast } from './axios';

function TeamMembers() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [members, setMembers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
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

  const computeMemberTaskCounts = (memberName, memberId, allTasksList) => {
    if (!allTasksList || allTasksList.length === 0) return { assigned: 0, completed: 0 };
    const mName = (memberName || '').toLowerCase().trim();
    const mIdStr = memberId !== undefined && memberId !== null ? String(memberId) : '';

    let assignedCount = 0;
    let completedCount = 0;

    allTasksList.forEach(t => {
      const empIdStr = t.employee_id !== undefined && t.employee_id !== null ? String(t.employee_id) : (t.user_id !== undefined && t.user_id !== null ? String(t.user_id) : '');
      const assignedToStr = (t.assigned_to || t.assignee || t.employee_name || t.username || t.createdBy || '').toLowerCase().trim();
      const taskUsername = (t.username || '').toLowerCase().trim();

      const isMatch = (
        (mIdStr !== '' && empIdStr !== '' && empIdStr === mIdStr) ||
        (mName !== '' && assignedToStr.length > 0 && (assignedToStr.includes(mName) || mName.includes(assignedToStr))) ||
        (mName !== '' && taskUsername.length > 0 && taskUsername === mName)
      );

      if (isMatch) {
        assignedCount++;
        const sid = (t.status_id !== undefined && t.status_id !== null) ? Number(t.status_id) : null;
        const statusStr = String(t.status || '').toLowerCase().trim().replace(/[\s\-_]+/g, '');
        if (sid === 3 || statusStr === 'completed' || statusStr === 'done' || statusStr === '3') {
          completedCount++;
        }
      }
    });

    return { assigned: assignedCount, completed: completedCount };
  };

  useEffect(() => {
    const fetchUsersAndTasks = async () => {
      // 1. Collect all tasks across API and local storage
      const localNewTasks = JSON.parse(localStorage.getItem('myNewTasks') || '[]');
      const localTasks = JSON.parse(localStorage.getItem('myTasks') || '[]');
      const generalTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
      let apiTasks = [];

      try {
        const taskRes = await api.get('/tasks/?skip=0&limit=200');
        if (taskRes.data && Array.isArray(taskRes.data)) {
          apiTasks = taskRes.data;
        }
      } catch (err) {
        console.warn('API /tasks endpoint unavailable in TeamMembers:', err?.message);
      }

      const taskMap = new Map();
      [...apiTasks, ...localNewTasks, ...localTasks, ...generalTasks].forEach(t => {
        const id = String(t.task_id || t.id || `${t.title || t.task || 'task'}_${t.assigned_to || t.employee_id || ''}`);
        if (!taskMap.has(id)) {
          taskMap.set(id, t);
        }
      });
      const allTasks = Array.from(taskMap.values());

      // 2. Collect all members added by admin or returned by API
      const localNewMembers = JSON.parse(localStorage.getItem('myNewMembers') || '[]');
      const localNewUsers = JSON.parse(localStorage.getItem('myNewUsers') || '[]');

      const allLocal = [...localNewMembers, ...localNewUsers].map(m => ({
        id: m.id || Date.now(),
        name: m.name || m.username,
        dept: m.dept || m.department || 'Development',
        status: m.status || 'Active',
        avatar: m.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name || m.username)}`
      }));

      let rawMembers = [];

      try {
        const res = await api.get('/users/');
        if (res.data && res.data.length > 0) {
          const apiMembers = res.data.map((u, i) => ({
            id: u.id || u.user_id,
            name: u.username,
            dept: u.department || 'Development',
            status: u.is_active !== false ? 'Active' : 'Inactive',
            avatar: u.avatar || `https://randomuser.me/api/portraits/${i % 2 === 0 ? 'men' : 'women'}/${(i % 10) + 1}.jpg`
          }));
          const apiNames = new Set(apiMembers.map(m => m.name.toLowerCase()));
          const filteredLocal = allLocal.filter(m => !apiNames.has(m.name.toLowerCase()));
          rawMembers = [...apiMembers, ...filteredLocal];
        }
      } catch (err) {
        console.warn('Backend /users endpoint error, using local members:', err?.message);
      }

      if (rawMembers.length === 0) {
        rawMembers = allLocal;
      }

      // 3. Compute dynamic assigned and completed task counts
      const finalMembers = rawMembers.map(m => {
        const counts = computeMemberTaskCounts(m.name, m.id, allTasks);
        return {
          ...m,
          assigned: counts.assigned,
          completed: counts.completed
        };
      });

      setMembers(finalMembers);
    };

    fetchUsersAndTasks();
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

    try {
      await api.post('/auth/register', {
        username: newMemberForm.username,
        email: newMemberForm.email,
        password: newMemberForm.password,
        role: newMemberForm.role === 'admin' ? 'Admin' : 'Employee'
      });
      showToast('Member Added Successfully!');
    } catch (err) {
      console.error('ADD MEMBER ERROR:', err.response?.data || err.message);
      showToast(err.response?.data?.detail || 'Member Added!', 'info');
    }

    const oldLocal = JSON.parse(localStorage.getItem('myNewMembers') || '[]');
    localStorage.setItem('myNewMembers', JSON.stringify([...oldLocal, newMemberObj]));

    setMembers(prev => [...prev, newMemberObj]);
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
  };

  const handleDeleteMember = async (memberId) => {
    if (role !== 'admin') {
      showToast('Deletions are only authorized for Admin accounts.', 'error');
      return;
    }
    setMembers(prev => prev.filter(m => m.id !== memberId));
    const oldLocal = JSON.parse(localStorage.getItem('myNewMembers') || '[]');
    const updatedLocal = oldLocal.filter(m => m.id !== memberId);
    localStorage.setItem('myNewMembers', JSON.stringify(updatedLocal));
    showToast('Member deleted successfully.');
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Active': return 'bg-emerald-500 text-white';
      case 'On Leave': return 'bg-amber-500 text-white';
      default: return 'bg-rose-500 text-white';
    }
  };

  const filteredMembers = members.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen text-slate-100 flex flex-col font-sans bg-transparent">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12 flex flex-col gap-6">
        <div className="bg-[#0f172a]/60 border border-slate-800 p-6 rounded-2xl backdrop-blur-md shadow-xl">
          <h2 className="text-3xl font-bold text-white">Team Members Page.</h2>
          <p className="text-sm text-slate-300 mt-1">Manage your team member and their progress.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 justify-between bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-400" />
            <input type="text" placeholder="Search member" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500" />
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button onClick={() => showToast('Filters are configured dynamically.')} className="flex items-center gap-2 px-5 py-2.5 bg-white text-slate-800 font-semibold rounded-xl text-sm w-full sm:w-auto justify-center"><Filter className="w-4 h-4" /> Filter</button>
            {role === 'admin' && (
              <button onClick={() => navigate('/add-member')} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm w-full sm:w-auto justify-center shadow-lg"><Plus className="w-4.5 h-4.5" /> + Add Member</button>
            )}
          </div>
        </div>


        <div className="bg-white text-slate-800 rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead><tr className="bg-slate-50 border-b border-slate-100 text-left"><th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Employee Name</th><th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Department</th><th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">Assigned</th><th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">Completed</th><th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">Status</th><th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">Action</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50/80">
                    <td className="px-6 py-4 whitespace-nowrap"><div className="flex items-center gap-3"><img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-full object-cover border-2 border-slate-200 shadow-sm" /><span className="font-bold text-slate-900 text-sm">{member.name}</span></div></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-semibold">{member.dept}</td>
                    <td className="px-6 py-4 text-center font-bold">{member.assigned}</td>
                    <td className="px-6 py-4 text-center font-bold">{member.completed}</td>
                    <td className="px-6 py-4 text-center"><span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusStyle(member.status)}`}>{member.status}</span></td>
                    <td className="px-6 py-4 text-center"><div className="flex items-center justify-center gap-3"><button
                      onClick={() => {
                        navigate('/profile', { state: { member } });
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-bold"
                    >
                      <Eye className="w-3.5 h-3.5" /> View Profile
                    </button>{role === 'admin' && (<button onClick={() => handleDeleteMember(member.id)} className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg"><Trash2 className="w-4 h-4" /></button>)}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* ADD MODAL WITH PHOTO */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Add Team Member</h3>
            <form onSubmit={handleAddMember} className="flex flex-col gap-4">

              {/* PHOTO UPLOAD */}
              <div className="flex flex-col items-center gap-3">
                <div className="w-24 h-24 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden">
                  {avatarPreview ? <img src={avatarPreview} alt="preview" className="w-full h-full object-cover" /> : <ImageIcon className="w-8 h-8 text-slate-400" />}
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
      <footer className="w-full bg-[#090d16] border-t border-slate-900 py-8 px-6 text-center text-xs text-slate-500 mt-auto">© 2026 Employee Task Tracker System | All Rights Reserved</footer>
    </div>
  );
}

export default TeamMembers;
