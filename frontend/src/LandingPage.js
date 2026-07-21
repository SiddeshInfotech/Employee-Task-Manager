import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div className="bg-white min-h-screen font-sans">
      {/* Navbar */}
      <nav className="flex justify-between items-center px-10 py-4 shadow-sm">
        <h1 className="text-2xl font-bold text-blue-600">TaskFlow.</h1>
        <div className="flex gap-4">
          <Link to="/login" className="px-5 py-2 text-gray-700 font-semibold">Login</Link>
          <Link to="/register" className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">Get Started</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="text-center px-10 py-20">
        <h1 className="text-5xl font-extrabold text-gray-900 leading-tight">
          Manage Your Team's<br/> Tasks Like a <span className="text-blue-600">Pro</span>
        </h1>
        <p className="text-gray-500 mt-6 text-lg max-w-2xl mx-auto">
          A complete Task Management System for companies. Create, assign, track and complete tasks with your team.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link to="/register" className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold">Get Started Free</Link>
          <Link to="/login" className="px-8 py-3 bg-gray-100 text-gray-800 rounded-xl font-bold">View Demo</Link>
        </div>
        <div className="mt-12 border-8 border-gray-100 rounded-2xl overflow-hidden shadow-2xl max-w-4xl mx-auto">
          <img src="https://i.imgur.com/your-dashboard-screenshot.png" alt="Dashboard" className="w-full" />
          <p className="p-2 bg-gray-50 text-sm text-gray-400">Tithe tuza Dashboard cha screenshot tak!</p>
        </div>
      </div>

      {/* Features */}
      <div className="bg-gray-50 py-16 px-10">
        <h2 className="text-3xl font-bold text-center">Everything You Need</h2>
        <div className="grid grid-cols-3 gap-6 mt-10 max-w-5xl mx-auto">
          <div className="p-6 bg-white rounded-xl shadow">✅ <b>Task Assign</b><br/>Easily assign tasks to team members.</div>
          <div className="p-6 bg-white rounded-xl shadow">🚩 <b>Priority Control</b><br/>Set High, Medium, Low priority.</div>
          <div className="p-6 bg-white rounded-xl shadow">⏰ <b>Due Date Reminder</b><br/>Never miss a deadline again.</div>
          <div className="p-6 bg-white rounded-xl shadow">👥 <b>Team Management</b><br/>Manage your whole team.</div>
          <div className="p-6 bg-white rounded-xl shadow">📊 <b>Reports</b><br/>Track performance with graphs.</div>
          <div className="p-6 bg-white rounded-xl shadow">🔐 <b>Admin Panel</b><br/>Full control for Admin.</div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-6 text-gray-400 text-sm">
        © 2026 TaskFlow 
      </footer>
    </div>
  );
};

export default LandingPage;