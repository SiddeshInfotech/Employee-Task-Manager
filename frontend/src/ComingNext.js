import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layers, ArrowLeft } from 'lucide-react';
import Navbar from './Navbar';

function ComingNext() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="min-h-screen text-slate-100 flex flex-col font-sans bg-transparent">
      {/* Navbar if token exists */}
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center mb-6 text-blue-500 shadow-xl shadow-blue-500/5 animate-pulse">
          <Layers className="w-8 h-8" />
        </div>

        <h2 className="text-3xl font-extrabold text-white mb-2">
          Feature Coming Soon
        </h2>
        <p className="text-sm text-slate-400 mb-8">
          The page or feature for path <code className="text-blue-400 bg-slate-900 px-2 py-0.5 rounded font-mono text-xs">{location.pathname}</code> is currently being finalized.
        </p>

        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center gap-2 px-6 py-3 w-full bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white font-semibold rounded-xl text-sm transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </button>
      </main>

      {/* Footer */}
      <footer className="w-full bg-[#090d16] border-t border-slate-900 py-8 px-6 text-center text-xs text-slate-500 mt-auto">
        <p className="mb-2">© 2026 Employee Task Tracker System | All Rights Reserved</p>
        <p><span className="text-slate-400 font-semibold"></span></p>
      </footer>
    </div>
  );
}

export default ComingNext;
