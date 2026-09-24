import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Shield, ShieldAlert } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<'operator' | 'admin'>('operator');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      login(username, role);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-slate-800 rounded-2xl shadow-xl border border-slate-700 p-8 space-y-8 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl"></div>

        <div className="relative text-center space-y-2">
          <div className="flex justify-center mb-6">
            <div className="p-3 bg-blue-500/10 rounded-xl">
              <Shield className="w-12 h-12 text-blue-400" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Prahari</h2>
          <p className="text-slate-400">Orbital Intelligence Platform</p>
        </div>

        <form onSubmit={handleLogin} className="relative space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Callsign / Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Enter your callsign..."
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-300">Access Level</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('operator')}
                className={`p-3 rounded-lg border flex flex-col items-center gap-2 transition-all ${
                  role === 'operator'
                    ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                    : 'bg-slate-900/30 border-slate-700 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <Shield className="w-5 h-5" />
                <span className="text-sm font-medium">Operator</span>
              </button>
              
              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`p-3 rounded-lg border flex flex-col items-center gap-2 transition-all ${
                  role === 'admin'
                    ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                    : 'bg-slate-900/30 border-slate-700 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <ShieldAlert className="w-5 h-5" />
                <span className="text-sm font-medium">Admin</span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-lg transition-colors shadow-lg shadow-blue-500/20"
          >
            Authenticate
          </button>
        </form>
      </div>
    </div>
  );
};
