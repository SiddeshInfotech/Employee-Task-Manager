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
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/team" element={<TeamMembers />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/due-date" element={<DueDate />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/my-task" element={<MyTask />} />
          <Route path="/priority" element={<Priority />} />
          <Route path="/task-status" element={<TaskStatus />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/create-task" element={<CreateTask />} />
          <Route path="/tasks/:id" element={<TaskDetail />} />
          <Route path="/manage-users" element={<ManageUsers />} />
          <Route path="/add-member" element={<AddMember />} />
          <Route path="*" element={<WildcardRedirect />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;