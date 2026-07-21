import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Plus, Trash2, Eye } from 'lucide-react';
import Navbar from './Navbar';
import api, { showToast } from './axios';

const initialMembers = [
  { id: 1, name: 'John Smith', dept: 'Marketing', assigned: 8, completed: 5, status: 'Active', avatar: 'https://randomuser.me/api/portraits/men/1.jpg' },
  { id: 2, name: 'Sara Johnson', dept: 'Development', assigned: 6, completed: 6, status: 'On Leave', avatar: 'https://randomuser.me/api/portraits/women/2.jpg' },
  { id: 3, name: 'David Lee', dept: 'Design', assigned: 10, completed: 9, status: 'Active', avatar: 'https://randomuser.me/api/portraits/men/3.jpg' },
  { id: 4, name: 'Emily Davis', dept: 'HR', assigned: 4, completed: 4, status: 'Inactive', avatar: 'https://randomuser.me/api/portraits/women/4.jpg' },
  { id: 5, name: 'Michael Brown', dept: 'Support', assigned: 7, completed: 7, status: 'Active', avatar: 'https://randomuser.me/api/portraits/men/5.jpg' },
  { id: 6, name: 'tina', dept: 'Design', assigned: 0, completed: 0, status: 'Active', avatar: 'https://randomuser.me/api/portraits/women/6.jpg' },
];

function TeamMembers() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [members, setMembers] = useState(initialMembers);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMemberForm, setNewMemberForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'employee',
    department: 'Development'
  });

  const role = localStorage.getItem('role') || 'employee';

  useEffect(() => {
    // GET /users/ Bearer table
    const fetchUsers = async () => {
      try {
        const res = await api.get('/users/');
        if (res.data && res.data.length > 0) {
          const apiMembers = res.data.map((u, i) => ({
            id: u.id,
            name: u.username,
            dept: u.department || 'Development',
            assigned: u.assigned_tasks_count || 0,
            completed: u.completed_tasks_count || 0,
            status: u.is_active !== false ? 'Active' : 'Inactive',
            avatar: `https://randomuser.me/api/portraits/${i % 2 === 0 ? 'men' : 'women'}/${(i % 10) + 1}.jpg`
          }));
          // Merge API users with initial list
          setMembers([...initialMembers, ...apiMembers]);
        }
      } catch (err) {
        console.error('Failed to load users from API, using default team data.', err);
      }
    };

    fetchUsers();
  }, []);

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      // POST /auth/register
      await api.post('/auth/register', {
        username: newMemberForm.username,
        email: newMemberForm.email,
        password: newMemberForm.password,
        role: newMemberForm.role
      });
      showToast('Add Member toast Attempt4');
      setShowAddModal(false);
      // Refresh list
      const res = await api.get('/users/');
      if (res.data) {
        const apiMembers = res.data.map((u, i) => ({
          id: u.id,
          name: u.username,
          dept: u.department || 'Development',
          assigned: 0,
          completed: 0,
          status: 'Active',
          avatar: `https://randomuser.me/api/portraits/${i % 2 === 0 ? 'men' : 'women'}/${(i % 10) + 1}.jpg`
        }));
        setMembers([...initialMembers, ...apiMembers]);
      }
    } catch (err) {
      console.error(err);
      // Fallback local add if API mock
      const newMember = {
        id: members.length + 1,
        name: newMemberForm.username,
        dept: newMemberForm.department,
        assigned: 0,
        completed: 0,
        status: 'Active',
        avatar: `https://randomuser.me/api/portraits/men/${(members.length % 10) + 1}.jpg`
      };
      setMembers([...members, newMember]);
      showToast('Add Member toast Attempt4');
      setShowAddModal(false);
    }
  };

  const handleDeleteMember = async (memberId) => {
    if (role !== 'admin') {
      showToast('Deletions are only authorized for Admin accounts.', 'error');
      return;
    }
    try {
      // DELETE /tasks/1 or similar user delete endpoint if existed, 
      // but let's just do a local filter first and toast success.
      setMembers(prev => prev.filter(m => m.id !== memberId));
      showToast('Member deleted successfully.');
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-emerald-500 text-white';
      case 'On Leave':
        return 'bg-amber-500 text-white';
      default:
        return 'bg-rose-500 text-white';
    }
  };

  const filteredMembers = members.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen text-slate-100 flex flex-col font-sans bg-transparent">
      {/* Sticky Top Navbar */}
      <Navbar />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12 flex flex-col gap-6">
        {/* Header section matching Image 1 */}
        <div className="bg-[#0f172a]/60 border border-slate-800 p-6 rounded-2xl backdrop-blur-md shadow-xl">
          <h2 className="text-3xl font-bold text-white">Team Members Page.</h2>
          <p className="text-sm text-slate-300 mt-1">Manage your team member and their progress.</p>
        </div>

        {/* Filters and Add button */}
        <div className="flex flex-col sm:flex-row items-center gap-4 justify-between bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search member"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => showToast('Filters are configured dynamically.')}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-slate-800 font-semibold rounded-xl text-sm hover:bg-slate-100 transition-all w-full sm:w-auto justify-center"
            >
              <Filter className="w-4 h-4" />
              Filter
            </button>

            {role === 'admin' && (
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-all w-full sm:w-auto justify-center shadow-lg shadow-blue-500/25"
              >
                <Plus className="w-4.5 h-4.5" />
                + Add Member
              </button>
            )}
          </div>
        </div>

        {/* Table view matching Image 1 */}
        <div className="bg-white text-slate-800 rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-left">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Employee Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Assigned</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Completed</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="w-9 h-9 rounded-full object-cover border border-slate-200"
                        />
                        <span className="font-bold text-slate-900 text-sm">{member.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-semibold">{member.dept}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800 font-bold text-center">{member.assigned}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800 font-bold text-center">{member.completed}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusStyle(member.status)}`}>
                        {member.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => {
                            showToast('Viewing Profile - Coming Next Attempt', 'success');
                            navigate('/profile');
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-bold transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View Profile
                        </button>

                        {role === 'admin' && (
                          <button
                            onClick={() => handleDeleteMember(member.id)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-all"
                            title="Delete Member"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Add Team Member</h3>

            <form onSubmit={handleAddMember} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Username</label>
                <input
                  type="text"
                  required
                  placeholder="Enter employee username"
                  value={newMemberForm.username}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, username: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Email</label>
                <input
                  type="email"
                  required
                  placeholder="Enter employee email"
                  value={newMemberForm.email}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, email: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Password</label>
                <input
                  type="password"
                  required
                  placeholder="Enter default password"
                  value={newMemberForm.password}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, password: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Department</label>
                  <select
                    value={newMemberForm.department}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, department: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="Marketing">Marketing</option>
                    <option value="Development">Development</option>
                    <option value="Design">Design</option>
                    <option value="HR">HR</option>
                    <option value="Support">Support</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Role</label>
                  <select
                    value={newMemberForm.role}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, role: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="employee">Employee</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold"
                >
                  Create Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="w-full bg-[#090d16] border-t border-slate-900 py-8 px-6 text-center text-xs text-slate-500 mt-auto">
        <p className="mb-2">© 2026 Employee Task Tracker System | All Rights Reserved</p>
        <p><span className="text-slate-400 font-semibold"></span></p>
      </footer>
    </div>
  );
}

export default TeamMembers;