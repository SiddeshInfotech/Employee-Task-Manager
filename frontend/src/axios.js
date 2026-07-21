import axios from 'axios';

// baseURL commented out to prevent backend network calls
// const baseURL = process.env.REACT_APP_API_URL || process.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

// Custom toast helper
export const showToast = (message, type = 'success') => {
  const containerId = 'custom-toast-container';
  let container = document.getElementById(containerId);
  if (!container) {
    container = document.createElement('div');
    container.id = containerId;
    container.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 99999; display: flex; flex-direction: column; gap: 10px; pointer-events: none;';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.style.cssText = `
    padding: 12px 24px;
    border-radius: 12px;
    background: ${type === 'success' ? 'rgba(16, 185, 129, 0.95)' : 'rgba(239, 68, 68, 0.95)'};
    color: white;
    font-weight: 500;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    pointer-events: auto;
    transition: all 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55);
    transform: translateX(100%);
    opacity: 0;
  `;
  toast.innerText = message;
  container.appendChild(toast);

  // Trigger animation
  setTimeout(() => {
    toast.style.transform = 'translateX(0)';
    toast.style.opacity = '1';
  }, 10);

  // Remove toast
  setTimeout(() => {
    toast.style.transform = 'translateX(100%)';
    toast.style.opacity = '0';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 4000);
};

// Initialize localStorage mock data if empty
const defaultUsers = [
  { id: 1, username: 'testemployee', email: 'employee@company.com', password: 'password123', role: 'employee', department: 'Marketing' },
  { id: 2, username: 'testadmin', email: 'admin@company.com', password: 'admin123', role: 'admin', department: 'IT' },
];

if (!localStorage.getItem('allUsers')) {
  localStorage.setItem('allUsers', JSON.stringify(defaultUsers));
}

const defaultTasks = [
  { id: 1, title: 'Design Homepage Layout', description: 'Create homepage layout', status: 'in_progress', priority: 'high', due_date: '2026-07-20T18:00:00Z', assigned_to: 'testemployee' },
  { id: 2, title: 'Update Client Documents', description: 'Modify client guidelines', status: 'completed', priority: 'medium', due_date: '2026-07-20T18:00:00Z', assigned_to: 'testemployee' },
  { id: 3, title: 'Prepare Weekly Report', description: 'Write JSON schema and explain endpoints', status: 'pending', priority: 'low', due_date: '2026-07-20T18:00:00Z', assigned_to: 'testadmin' },
];

if (!localStorage.getItem('tasks')) {
  localStorage.setItem('tasks', JSON.stringify(defaultTasks));
}

const defaultNotifications = [
  { id: 1, title: 'New Task Assigned: Design Homepage Layout', description: 'Assigned by Emma Brown. 5m ago', is_read: false },
  { id: 2, title: 'Project Deadline Tomorrow: CRM Update', description: 'Due on Apr 25. 20m ago', is_read: false },
  { id: 3, title: 'Task Completed: Data Analysis Report', description: 'Completed by Alex Smith. 1 hour ago', is_read: false },
  { id: 4, title: 'You have been added to: Marketing Strategy Team', description: 'Assigned by Sarah Lee. 2 hours ago', is_read: false },
  { id: 5, title: 'New Task Assigned: Create Monthly Report', description: 'Assigned by David Johnson. 1 day ago', is_read: false },
];

if (!localStorage.getItem('notifications')) {
  localStorage.setItem('notifications', JSON.stringify(defaultNotifications));
}

// Complete Frontend-only Mock API client
const api = {
  get: async (url) => {
    console.log(`Mock GET: ${url}`);
    if (url.includes('/dashboard/summary')) {
      const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
      const notifs = JSON.parse(localStorage.getItem('notifications') || '[]');
      const unreadNotifs = notifs.filter(n => !n.is_read).length;
      return {
        data: {
          total_tasks: tasks.length,
          pending_tasks: tasks.filter(t => t.status === 'pending').length,
          in_progress_tasks: tasks.filter(t => t.status === 'in_progress').length,
          completed_tasks: tasks.filter(t => t.status === 'completed').length,
          overdue_tasks: 3,
          unread_notifications: unreadNotifs
        }
      };
    }
    if (url.includes('/tasks/')) {
      const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
      const match = url.match(/\/tasks\/(\d+)/);
      if (match) {
        const id = parseInt(match[1]);
        const task = tasks.find(t => t.id === id);
        return { data: task || tasks[0] };
      }
      return { data: tasks };
    }
    if (url.includes('/notifications')) {
      const notifs = JSON.parse(localStorage.getItem('notifications') || '[]');
      if (url.includes('is_read=false')) {
        return { data: notifs.filter(n => !n.is_read) };
      }
      return { data: notifs };
    }
    if (url.includes('/users')) {
      const users = JSON.parse(localStorage.getItem('allUsers') || '[]');
      return { data: users };
    }
    return { data: [] };
  },

  post: async (url, payload) => {
    console.log(`Mock POST: ${url}`, payload);
    if (url.includes('/tasks')) {
      const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
      const newTask = {
        id: tasks.length + 1,
        title: payload.title,
        description: payload.description,
        status: payload.status,
        priority: payload.priority,
        due_date: payload.due_date,
        assigned_to: 'testemployee'
      };
      tasks.push(newTask);
      localStorage.setItem('tasks', JSON.stringify(tasks));
      return { data: newTask };
    }
    if (url.includes('/auth/register')) {
      let allUsers = JSON.parse(localStorage.getItem('allUsers') || '[]');
      if (allUsers.find(u => u.username === payload.username || u.email === payload.email)) {
        throw new Error('User already exists');
      }
      const newUser = {
        id: allUsers.length + 1,
        username: payload.username,
        email: payload.email,
        password: payload.password,
        role: payload.role || 'employee',
        department: payload.department || 'Development'
      };
      allUsers.push(newUser);
      localStorage.setItem('allUsers', JSON.stringify(allUsers));
      return { data: newUser };
    }
    if (url.includes('/auth/login')) {
      // payload could be FormData
      let username = '';
      let password = '';
      if (payload instanceof FormData) {
        username = payload.get('username');
        password = payload.get('password');
      } else {
        username = payload.username;
        password = payload.password;
      }
      const allUsers = JSON.parse(localStorage.getItem('allUsers') || '[]');
      const user = allUsers.find(u => u.username === username && u.password === password);
      if (user) {
        return {
          data: {
            access_token: 'mock_token_1234567890',
            token_type: 'bearer',
            role: user.role,
            username: user.username
          }
        };
      }
      throw { response: { data: { detail: 'Incorrect username or password' } } };
    }
    return { data: {} };
  },

  put: async (url, payload) => {
    console.log(`Mock PUT: ${url}`, payload);
    if (url.includes('/tasks/')) {
      const match = url.match(/\/tasks\/(\d+)/);
      if (match) {
        const id = parseInt(match[1]);
        const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        const index = tasks.findIndex(t => t.id === id);
        if (index !== -1) {
          tasks[index] = { ...tasks[index], ...payload };
          localStorage.setItem('tasks', JSON.stringify(tasks));
          return { data: tasks[index] };
        }
      }
    }
    return { data: {} };
  },

  patch: async (url, payload) => {
    console.log(`Mock PATCH: ${url}`);
    if (url.includes('/notifications/read-all')) {
      const notifs = JSON.parse(localStorage.getItem('notifications') || '[]');
      const updated = notifs.map(n => ({ ...n, is_read: true }));
      localStorage.setItem('notifications', JSON.stringify(updated));
      return { data: updated };
    }
    if (url.includes('/notifications/')) {
      const match = url.match(/\/notifications\/(\d+)\/read/);
      if (match) {
        const id = parseInt(match[1]);
        const notifs = JSON.parse(localStorage.getItem('notifications') || '[]');
        const updated = notifs.map(n => n.id === id ? { ...n, is_read: true } : n);
        localStorage.setItem('notifications', JSON.stringify(updated));
        return { data: {} };
      }
    }
    return { data: {} };
  },

  delete: async (url) => {
    console.log(`Mock DELETE: ${url}`);
    if (url.includes('/tasks/')) {
      const match = url.match(/\/tasks\/(\d+)/);
      if (match) {
        const id = parseInt(match[1]);
        const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        const filtered = tasks.filter(t => t.id !== id);
        localStorage.setItem('tasks', JSON.stringify(filtered));
        return { data: {} };
      }
    }
    if (url.includes('/users/')) {
      const match = url.match(/\/users\/(\d+)/);
      if (match) {
        const id = parseInt(match[1]);
        const users = JSON.parse(localStorage.getItem('allUsers') || '[]');
        const filtered = users.filter(u => u.id !== id);
        localStorage.setItem('allUsers', JSON.stringify(filtered));
        return { data: {} };
      }
    }
    return { data: {} };
  }
};

export default api;
