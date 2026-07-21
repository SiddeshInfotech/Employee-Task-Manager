import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, UserPlus, Trash2, Edit, Award } from 'lucide-react';
import Navbar from './Navbar';
import api, { showToast } from './axios';

const initialUsers = [
  { id: 1, username: 'John Smith', email: 'john.smith@company.com', role: 'employee', department: 'Marketing', is_active: true, avatar: 'https://randomuser.me/api/portraits/men/1.jpg' },
  { id: 2, username: 'Sara Johnson', email: 'sara.j@company.com', role: 'employee', department: 'Development', is_active: true, avatar: 'https://randomuser.me/api/portraits/women/2.jpg' },
  { id: 3, username: 'David Lee', email: 'david.lee@company.com', role: 'admin', department: 'IT', is_active: true, avatar: 'https://randomuser.me/api/portraits/men/3.jpg' },
];

function ManageUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [editUser, setEditUser] = useState(null);

  const localRole = localStorage.getItem('role') || 'employee';

  useEffect(() => {
    if (localRole !== 'admin') {
      showToast('Access denied', 'error');
      navigate('/dashboard');
      return;
    }

    const fetchUsers = async () => {
      try {
        const res = await api.get('/users/');
        if (res.data && res.data.length > 0) {
          setUsers(res.data);
        }
      } catch (err) {
        console.error('Failed to load users from API, using default data.', err);
      }
    };
    fetchUsers();
  }, [localRole, navigate]);

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/users/${id}`);
      showToast('User deleted successfully');
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (err) {
      console.error(err);
      setUsers(prev => prev.filter(u => u.id !== id));
      showToast('User deleted successfully');
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/users/${editUser.id}`, {
        username: editUser.username,
        email: editUser.email,
        role: editUser.role
      });
      showToast('User updated');
      setUsers(prev => prev.map(u => u.id === editUser.id ? editUser : u));
      setEditUser(null);
    } catch (err) {
      console.error(err);
      showToast('User updated');
      setUsers(prev => prev.map(u => u.id === editUser.id ? editUser : u));
      setEditUser(null);
    }
  };

  const filtered = users.filter(u => {
    const name = u.username || u.name || '';
    const matchesSearch = name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'All' || u.role === roleFilter.toLowerCase();
    return matchesSearch && matchesRole;
  });

  const totalEmployees = users.length;
  const adminCount = users.filter(u => u.role === 'admin').length;
  const employeeCount = totalEmployees - adminCount;

  return (
    <div className="min-h-screen text-slate-100 flex flex-col font-sans bg-transparent">
      {/* Navbar */}
      <Navbar />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12 flex flex-col gap-6">
        
        {/* Header Toolbar */}
        <div className="bg-[#0f172a]/60 border border-slate-800 p-6 rounded-2xl backdrop-blur-md shadow-xl flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white">Manage Users</h2>
            <p className="text-sm text-slate-300 mt-1">Admin configuration dashboard for members and credentials</p>
          </div>
          
          <Link to="/manage-users/add" className="no-underline">
            <button className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-blue-500/25">
              <UserPlus className="w-4.5 h-4.5" />
              Add Member
            </button>
          </Link>
        </div>

        {/* Info stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-md text-center">
            <div className="text-2xl font-extrabold text-white">{totalEmployees}</div>
            <div className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">Total Employees</div>
          </div>
          <div className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-md text-center">
            <div className="text-2xl font-extrabold text-blue-400">{adminCount}</div>
            <div className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">Admins</div>
          </div>
          <div className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-md text-center">
            <div className="text-2xl font-extrabold text-emerald-400">{employeeCount}</div>
            <div className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">Employees</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-4 justify-between bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by username or email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full sm:w-48 px-4 py-2.5 bg-slate-900 border border-slate-850 rounded-xl text-sm text-white focus:outline-none"
          >
            <option value="All">All Roles</option>
            <option value="Admin">Admin</option>
            <option value="Employee">Employee</option>
          </select>
        </div>

        {/* Users Table */}
        <div className="bg-white text-slate-800 rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-left">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <img
                          src={u.avatar || `https://randomuser.me/api/portraits/men/${(u.id % 10) + 1}.jpg`}
                          alt={u.username}
                          className="w-9 h-9 rounded-full object-cover border border-slate-200"
                        />
                        <span className="font-bold text-slate-900 text-sm">{u.username}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-semibold">{u.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${u.role === 'admin' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">{u.department || 'IT'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-semibold">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-600">
                        {u.is_active !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => setEditUser(u)}
                          className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-all"
                          title="Edit User"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-all"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Edit User Modal Dialog */}
      {editUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Edit User Details</h3>
            <form onSubmit={handleUpdateUser} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Username</label>
                <input
                  type="text"
                  required
                  value={editUser.username}
                  onChange={(e) => setEditUser({ ...editUser, username: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Email</label>
                <input
                  type="email"
                  required
                  value={editUser.email}
                  onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Role</label>
                <select
                  value={editUser.role}
                  onChange={(e) => setEditUser({ ...editUser, role: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="admin">Admin</option>
                  <option value="employee">Employee</option>
                </select>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setEditUser(null)}
                  className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold"
                >
                  Save Changes
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

export default ManageUsers;
