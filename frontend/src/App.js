import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './Landing';
import Login from './Login';
import Dashboard from './Dashboard';
import TeamMembers from './TeamMembers';
import Settings from './Settings';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';
import DueDate from './DueDate';
import NotificationsPage from './NotificationsPage';
import Profile from './Profile';
import MyTask from './MyTask';
import Priority from './Priority';
import TaskStatus from './TaskStatus';
import Reports from './Reports';
import CreateTask from './CreateTask';
import TaskDetail from './TaskDetail';
import ManageUsers from './ManageUsers';
import AddMember from './AddMember';
import './App.css';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
};

const WildcardRedirect = () => {
  const token = localStorage.getItem('token');
  return token ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <div 
        className="min-h-screen flex flex-col"
        style={{
          backgroundImage: `linear-gradient(rgba(15,23,42,0.75), rgba(15,23,42,0.85)), url('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1920&q=80')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/team" element={<ProtectedRoute><TeamMembers /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/due-date" element={<ProtectedRoute><DueDate /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/my-task" element={<ProtectedRoute><MyTask /></ProtectedRoute>} />
          <Route path="/priority" element={<ProtectedRoute><Priority /></ProtectedRoute>} />
          <Route path="/task-status" element={<ProtectedRoute><TaskStatus /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          <Route path="/create-task" element={<ProtectedRoute><CreateTask /></ProtectedRoute>} />
          <Route path="/tasks/:id" element={<ProtectedRoute><TaskDetail /></ProtectedRoute>} />
          <Route path="/manage-users" element={<ProtectedRoute><ManageUsers /></ProtectedRoute>} />
          <Route path="/add-member" element={<ProtectedRoute><AddMember /></ProtectedRoute>} />
          <Route path="*" element={<WildcardRedirect />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;