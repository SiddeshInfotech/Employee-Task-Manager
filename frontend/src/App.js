import React, { useEffect, useState } from 'react';
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
import AddMember from './AddMember';
import WorkProgress from './WorkProgress';
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

  const [theme, setTheme] = useState("Original");

  useEffect(() => {
    const savedSettings = localStorage.getItem("appSettings");
    const currentTheme = savedSettings ? (JSON.parse(savedSettings).theme || "Original") : "Original";
    setTheme(currentTheme);

    document.documentElement.classList.remove("dark", "light", "original");
    if (currentTheme === "Dark" || currentTheme === "Glass") {
      document.documentElement.classList.add("dark");
    } else if (currentTheme === "Light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.add("original");
    }
  }, []);
  return (
    <BrowserRouter>
      <div className="app-bg min-h-screen flex flex-col">
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
          <Route path="/add-member" element={<ProtectedRoute><AddMember /></ProtectedRoute>} />
          <Route path="/work-progress" element={<ProtectedRoute><WorkProgress /></ProtectedRoute>} />
          <Route path="*" element={<WildcardRedirect />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;