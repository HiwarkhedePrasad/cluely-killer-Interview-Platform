// Setup script for the Recruitment Screening Platform
// Run this with: node setup-recruiter.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_DIR = __dirname;
const RECRUITER_DIR = path.join(BASE_DIR, 'recruiter');

// Directories to create
const directories = [
  'recruiter',
  'recruiter/src',
  'recruiter/src/components',
  'recruiter/src/pages',
  'recruiter/src/lib',
  'supabase',
  'supabase/migrations',
  'supabase/functions',
  'supabase/functions/send-interview-email'
];

// Create directories
directories.forEach(dir => {
  const fullPath = path.join(BASE_DIR, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`Created: ${dir}`);
  } else {
    console.log(`Exists: ${dir}`);
  }
});

// Files to create in recruiter directory
const recruiterFiles = {
  'package.json': `{
  "name": "recruiter-portal",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.45.0",
    "lucide-react": "^0.575.0",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "react-router-dom": "^7.6.1"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.1.7",
    "@vitejs/plugin-react": "^4.6.0",
    "tailwindcss": "^4.1.7",
    "vite": "^7.0.4"
  }
}`,
  
  'vite.config.js': `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5174,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});`,

  'index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Recruiter Portal - AI Interview Platform</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`,

  '.env.example': `# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional: Edge Functions URL (defaults to Supabase URL)
VITE_SUPABASE_FUNCTIONS_URL=https://your-project.supabase.co/functions/v1`,

  'tailwind.config.js': `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        surface: {
          base: '#0a0a0a',
          raised: '#111111',
          overlay: '#1a1a1a',
        },
        border: {
          subtle: '#1f1f1f',
          default: '#2a2a2a',
          strong: '#3a3a3a',
        },
        accent: {
          DEFAULT: '#6366f1',
          hover: '#4f46e5',
        }
      }
    },
  },
  plugins: [],
}`,

  'postcss.config.js': `// PostCSS config not needed - using @tailwindcss/vite plugin instead
export default {
  plugins: {}
}`
};

// Create recruiter files
Object.entries(recruiterFiles).forEach(([filename, content]) => {
  const fullPath = path.join(RECRUITER_DIR, filename);
  fs.writeFileSync(fullPath, content);
  console.log(`Created: recruiter/${filename}`);
});

// Source files
const srcFiles = {
  'src/main.jsx': `import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);`,

  'src/index.css': `@import "tailwindcss";

:root {
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: var(--font-sans);
  background-color: #0a0a0a;
  color: #e5e5e5;
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}

input, textarea, select, button {
  font-family: inherit;
}

::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #333;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #444;
}`,

  'src/App.jsx': `import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Jobs from './pages/Jobs';
import JobDetail from './pages/JobDetail';
import Candidates from './pages/Candidates';
import Interviews from './pages/Interviews';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-base">
        <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="jobs" element={<Jobs />} />
          <Route path="jobs/:id" element={<JobDetail />} />
          <Route path="candidates" element={<Candidates />} />
          <Route path="interviews" element={<Interviews />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}`,

  'src/lib/supabase.js': `import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabaseFunctionsUrl = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL || supabaseUrl + '/functions/v1';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const functionsUrl = supabaseFunctionsUrl;

export default supabase;`,

  'src/lib/AuthContext.jsx': `import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabase';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signUp = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);`,

  'src/components/Layout.jsx': `import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Briefcase, Users, MessageSquare, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/jobs', icon: Briefcase, label: 'Jobs' },
  { to: '/candidates', icon: Users, label: 'Candidates' },
  { to: '/interviews', icon: MessageSquare, label: 'Interviews' },
];

export default function Layout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-surface-base">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border-default flex flex-col">
        <div className="p-4 border-b border-border-default">
          <h1 className="text-lg font-semibold text-white flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-accent" />
            Recruiter Portal
          </h1>
        </div>
        
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                \`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors \${
                  isActive
                    ? 'bg-accent/10 text-accent'
                    : 'text-neutral-400 hover:text-white hover:bg-surface-raised'
                }\`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        
        <div className="p-3 border-t border-border-default space-y-1">
          <div className="px-3 py-2 text-xs text-neutral-500 truncate">
            {user?.email}
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-neutral-400 hover:text-white hover:bg-surface-raised w-full transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>
      
      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}`,

  'src/pages/Login.jsx': `import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        await signUp(email, password);
        setError('Check your email for a confirmation link.');
      } else {
        await signIn(email, password);
        navigate('/');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-base p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/10 mb-4">
            <Briefcase className="w-8 h-8 text-accent" />
          </div>
          <h1 className="text-2xl font-bold text-white">Recruiter Portal</h1>
          <p className="text-neutral-400 mt-2">AI-Powered Interview Platform</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface-raised border border-border-default rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </h2>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-3">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-surface-base border border-border-default rounded-lg text-white placeholder:text-neutral-500 focus:border-accent focus:outline-none transition-colors"
              />
            </div>
            
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                minLength={6}
                className="w-full pl-10 pr-4 py-2.5 bg-surface-base border border-border-default rounded-lg text-white placeholder:text-neutral-500 focus:border-accent focus:outline-none transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors"
          >
            {loading ? 'Loading...' : (isSignUp ? 'Create Account' : 'Sign In')}
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="text-center text-sm">
            <span className="text-neutral-400">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            </span>{' '}
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-accent hover:underline"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}`,

  'src/pages/Dashboard.jsx': `import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Users, MessageSquare, TrendingUp, ArrowRight, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    totalCandidates: 0,
    completedInterviews: 0,
    pendingInterviews: 0
  });
  const [recentInterviews, setRecentInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      // Get job counts
      const { count: totalJobs } = await supabase.from('jobs').select('*', { count: 'exact', head: true });
      const { count: activeJobs } = await supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('is_active', true);
      
      // Get candidate count
      const { count: totalCandidates } = await supabase.from('candidates').select('*', { count: 'exact', head: true });
      
      // Get interview counts
      const { count: completedInterviews } = await supabase.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'completed');
      const { count: pendingInterviews } = await supabase.from('applications').select('*', { count: 'exact', head: true }).in('status', ['pending', 'invited']);

      setStats({
        totalJobs: totalJobs || 0,
        activeJobs: activeJobs || 0,
        totalCandidates: totalCandidates || 0,
        completedInterviews: completedInterviews || 0,
        pendingInterviews: pendingInterviews || 0
      });

      // Get recent interviews with details
      const { data: recent } = await supabase
        .from('applications')
        .select(\`
          *,
          job:jobs(title),
          candidate:candidates(name, email),
          interview:interviews(overall_score, ai_recommendation)
        \`)
        .order('updated_at', { ascending: false })
        .limit(5);

      setRecentInterviews(recent || []);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  }

  const statCards = [
    { label: 'Active Jobs', value: stats.activeJobs, icon: Briefcase, color: 'text-blue-400', link: '/jobs' },
    { label: 'Candidates', value: stats.totalCandidates, icon: Users, color: 'text-green-400', link: '/candidates' },
    { label: 'Completed', value: stats.completedInterviews, icon: CheckCircle2, color: 'text-emerald-400', link: '/interviews' },
    { label: 'Pending', value: stats.pendingInterviews, icon: Clock, color: 'text-yellow-400', link: '/interviews' },
  ];

  const getStatusBadge = (status) => {
    const styles = {
      completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      started: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      invited: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
      pending: 'bg-neutral-500/10 text-neutral-400 border-neutral-500/30',
      expired: 'bg-red-500/10 text-red-400 border-red-500/30'
    };
    return styles[status] || styles.pending;
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-neutral-400 mt-1">Overview of your recruitment pipeline</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon, color, link }) => (
          <Link
            key={label}
            to={link}
            className="bg-surface-raised border border-border-default rounded-xl p-5 hover:border-border-strong transition-colors group"
          >
            <div className="flex items-center justify-between mb-3">
              <Icon className={\`w-5 h-5 \${color}\`} />
              <ArrowRight className="w-4 h-4 text-neutral-600 group-hover:text-neutral-400 transition-colors" />
            </div>
            <div className="text-3xl font-bold text-white">{value}</div>
            <div className="text-sm text-neutral-400 mt-1">{label}</div>
          </Link>
        ))}
      </div>

      {/* Recent Interviews */}
      <div className="bg-surface-raised border border-border-default rounded-xl">
        <div className="px-5 py-4 border-b border-border-default flex items-center justify-between">
          <h2 className="font-semibold text-white">Recent Interviews</h2>
          <Link to="/interviews" className="text-sm text-accent hover:underline flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        
        {recentInterviews.length === 0 ? (
          <div className="p-8 text-center text-neutral-500">
            No interviews yet. Start by creating a job and inviting candidates.
          </div>
        ) : (
          <div className="divide-y divide-border-subtle">
            {recentInterviews.map((app) => (
              <div key={app.id} className="px-5 py-4 flex items-center justify-between">
                <div>
                  <div className="font-medium text-white">{app.candidate?.name}</div>
                  <div className="text-sm text-neutral-400">{app.job?.title}</div>
                </div>
                <div className="flex items-center gap-3">
                  {app.interview?.[0]?.overall_score && (
                    <div className="text-sm font-mono text-neutral-300">
                      {app.interview[0].overall_score}/10
                    </div>
                  )}
                  <span className={\`px-2.5 py-1 text-xs font-medium rounded-full border \${getStatusBadge(app.status)}\`}>
                    {app.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}`,

  'src/pages/Jobs.jsx': `import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Briefcase, Users, MoreHorizontal, Edit, Trash2, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadJobs();
  }, []);

  async function loadJobs() {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select(\`
          *,
          applications:applications(count)
        \`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (err) {
      console.error('Failed to load jobs:', err);
    } finally {
      setLoading(false);
    }
  }

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(search.toLowerCase()) ||
    job.company?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Jobs</h1>
          <p className="text-neutral-400 mt-1">Manage job postings and requirements</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent-hover rounded-lg text-white font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Job
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search jobs..."
          className="w-full max-w-md pl-10 pr-4 py-2.5 bg-surface-raised border border-border-default rounded-lg text-white placeholder:text-neutral-500 focus:border-accent focus:outline-none"
        />
      </div>

      {/* Jobs Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="text-center py-12 text-neutral-500">
          {search ? 'No jobs match your search.' : 'No jobs yet. Create your first job posting.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              className="bg-surface-raised border border-border-default rounded-xl p-5 hover:border-border-strong transition-colors cursor-pointer"
              onClick={() => navigate(\`/jobs/\${job.id}\`)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <Briefcase className="w-5 h-5 text-accent" />
                </div>
                <span className={\`px-2 py-1 text-xs font-medium rounded-full \${
                  job.is_active 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-neutral-500/10 text-neutral-400 border border-neutral-500/30'
                }\`}>
                  {job.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <h3 className="font-semibold text-white mb-1">{job.title}</h3>
              {job.company && <p className="text-sm text-neutral-400 mb-3">{job.company}</p>}
              
              <div className="flex items-center gap-4 text-sm text-neutral-500">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {job.applications?.[0]?.count || 0} candidates
                </span>
                <span>{job.experience_level}</span>
              </div>
              
              {job.required_skills?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {job.required_skills.slice(0, 3).map((skill, i) => (
                    <span key={i} className="px-2 py-0.5 bg-surface-base text-xs text-neutral-400 rounded">
                      {skill}
                    </span>
                  ))}
                  {job.required_skills.length > 3 && (
                    <span className="px-2 py-0.5 text-xs text-neutral-500">
                      +{job.required_skills.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Job Modal */}
      {showCreateModal && (
        <CreateJobModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            loadJobs();
          }}
        />
      )}
    </div>
  );
}

function CreateJobModal({ onClose, onCreated }) {
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    description: '',
    requirements: '',
    required_skills: '',
    experience_level: 'any',
    min_years_experience: 0,
    is_active: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error: insertError } = await supabase.from('jobs').insert({
        ...formData,
        required_skills: formData.required_skills.split(',').map(s => s.trim()).filter(Boolean),
        recruiter_id: user.id
      });

      if (insertError) throw insertError;
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-surface-raised border border-border-default rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-border-default flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Create Job</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white">×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5">Job Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2.5 bg-surface-base border border-border-default rounded-lg text-white focus:border-accent focus:outline-none"
              placeholder="e.g., Senior Frontend Developer"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5">Company</label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className="w-full px-3 py-2.5 bg-surface-base border border-border-default rounded-lg text-white focus:border-accent focus:outline-none"
              placeholder="e.g., Acme Corp"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2.5 bg-surface-base border border-border-default rounded-lg text-white focus:border-accent focus:outline-none resize-none"
              placeholder="Job description..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5">Requirements</label>
            <textarea
              value={formData.requirements}
              onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
              rows={3}
              className="w-full px-3 py-2.5 bg-surface-base border border-border-default rounded-lg text-white focus:border-accent focus:outline-none resize-none"
              placeholder="Job requirements and qualifications..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5">Required Skills (comma-separated)</label>
            <input
              type="text"
              value={formData.required_skills}
              onChange={(e) => setFormData({ ...formData, required_skills: e.target.value })}
              className="w-full px-3 py-2.5 bg-surface-base border border-border-default rounded-lg text-white focus:border-accent focus:outline-none"
              placeholder="React, TypeScript, Node.js"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">Experience Level</label>
              <select
                value={formData.experience_level}
                onChange={(e) => setFormData({ ...formData, experience_level: e.target.value })}
                className="w-full px-3 py-2.5 bg-surface-base border border-border-default rounded-lg text-white focus:border-accent focus:outline-none"
              >
                <option value="any">Any</option>
                <option value="junior">Junior</option>
                <option value="mid">Mid-Level</option>
                <option value="senior">Senior</option>
                <option value="lead">Lead</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">Min Years</label>
              <input
                type="number"
                min={0}
                value={formData.min_years_experience}
                onChange={(e) => setFormData({ ...formData, min_years_experience: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2.5 bg-surface-base border border-border-default rounded-lg text-white focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="rounded border-border-default bg-surface-base"
            />
            <label htmlFor="is_active" className="text-sm text-neutral-300">Active (accepting applications)</label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-border-default rounded-lg text-neutral-300 hover:text-white hover:border-border-strong transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-accent hover:bg-accent-hover disabled:opacity-50 rounded-lg text-white font-medium transition-colors"
            >
              {loading ? 'Creating...' : 'Create Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}`,

  'src/pages/JobDetail.jsx': `import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Send, Users, Clock, CheckCircle2, XCircle, Mail } from 'lucide-react';
import { supabase, functionsUrl } from '../lib/supabase';

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    loadJob();
    loadApplications();
    loadCandidates();
  }, [id]);

  async function loadJob() {
    const { data } = await supabase.from('jobs').select('*').eq('id', id).single();
    setJob(data);
    setLoading(false);
  }

  async function loadApplications() {
    const { data } = await supabase
      .from('applications')
      .select(\`*, candidate:candidates(*), interview:interviews(*)\`)
      .eq('job_id', id)
      .order('created_at', { ascending: false });
    setApplications(data || []);
  }

  async function loadCandidates() {
    const { data } = await supabase.from('candidates').select('*').order('name');
    setCandidates(data || []);
  }

  const getStatusBadge = (status) => {
    const styles = {
      completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      started: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      invited: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
      pending: 'bg-neutral-500/10 text-neutral-400 border-neutral-500/30',
      expired: 'bg-red-500/10 text-red-400 border-red-500/30'
    };
    return styles[status] || styles.pending;
  };

  const getRecommendationColor = (rec) => {
    const colors = {
      strong_yes: 'text-emerald-400',
      yes: 'text-green-400',
      maybe: 'text-yellow-400',
      no: 'text-orange-400',
      strong_no: 'text-red-400'
    };
    return colors[rec] || 'text-neutral-400';
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-8 text-center text-neutral-500">
        Job not found.
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/jobs')}
          className="flex items-center gap-2 text-neutral-400 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Jobs
        </button>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{job.title}</h1>
            {job.company && <p className="text-neutral-400 mt-1">{job.company}</p>}
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent-hover rounded-lg text-white font-medium transition-colors"
          >
            <Send className="w-4 h-4" />
            Invite Candidate
          </button>
        </div>
      </div>

      {/* Job Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-surface-raised border border-border-default rounded-xl p-6">
          <h2 className="font-semibold text-white mb-4">Job Details</h2>
          
          {job.description && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-neutral-400 mb-2">Description</h3>
              <p className="text-neutral-300 whitespace-pre-wrap">{job.description}</p>
            </div>
          )}
          
          {job.requirements && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-neutral-400 mb-2">Requirements</h3>
              <p className="text-neutral-300 whitespace-pre-wrap">{job.requirements}</p>
            </div>
          )}
          
          {job.required_skills?.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-neutral-400 mb-2">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {job.required_skills.map((skill, i) => (
                  <span key={i} className="px-3 py-1 bg-accent/10 text-accent text-sm rounded-lg">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-surface-raised border border-border-default rounded-xl p-6">
          <h2 className="font-semibold text-white mb-4">Stats</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">Total Candidates</span>
              <span className="font-semibold text-white">{applications.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">Completed</span>
              <span className="font-semibold text-emerald-400">
                {applications.filter(a => a.status === 'completed').length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">Pending</span>
              <span className="font-semibold text-yellow-400">
                {applications.filter(a => ['pending', 'invited'].includes(a.status)).length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">Experience Level</span>
              <span className="font-medium text-white capitalize">{job.experience_level}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Applications */}
      <div className="bg-surface-raised border border-border-default rounded-xl">
        <div className="px-6 py-4 border-b border-border-default">
          <h2 className="font-semibold text-white">Candidates ({applications.length})</h2>
        </div>
        
        {applications.length === 0 ? (
          <div className="p-8 text-center text-neutral-500">
            No candidates yet. Invite candidates to start screening.
          </div>
        ) : (
          <div className="divide-y divide-border-subtle">
            {applications.map((app) => (
              <div key={app.id} className="px-6 py-4 flex items-center justify-between hover:bg-surface-overlay/50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-semibold">
                    {app.candidate?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-white">{app.candidate?.name}</div>
                    <div className="text-sm text-neutral-400">{app.candidate?.email}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <code className="px-2 py-1 bg-surface-base text-xs font-mono text-neutral-400 rounded">
                    {app.interview_code}
                  </code>
                  
                  {app.interview?.[0] && (
                    <div className="text-right">
                      <div className="font-mono text-white">{app.interview[0].overall_score}/10</div>
                      <div className={\`text-xs capitalize \${getRecommendationColor(app.interview[0].ai_recommendation)}\`}>
                        {app.interview[0].ai_recommendation?.replace('_', ' ')}
                      </div>
                    </div>
                  )}
                  
                  <span className={\`px-2.5 py-1 text-xs font-medium rounded-full border \${getStatusBadge(app.status)}\`}>
                    {app.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <InviteModal
          jobId={id}
          candidates={candidates}
          existingApplications={applications}
          onClose={() => setShowInviteModal(false)}
          onInvited={() => {
            setShowInviteModal(false);
            loadApplications();
          }}
        />
      )}
    </div>
  );
}

function InviteModal({ jobId, candidates, existingApplications, onClose, onInvited }) {
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filter out already invited candidates
  const existingCandidateIds = new Set(existingApplications.map(a => a.candidate_id));
  const availableCandidates = candidates.filter(c => !existingCandidateIds.has(c.id));

  const handleInvite = async () => {
    if (!selectedCandidate) return;
    setLoading(true);
    setError('');

    try {
      // Generate code
      const code = Array.from({ length: 6 }, () => 
        'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.charAt(Math.floor(Math.random() * 36))
      ).join('');

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Create application
      const { data: app, error: insertError } = await supabase
        .from('applications')
        .insert({
          job_id: jobId,
          candidate_id: selectedCandidate,
          interview_code: code,
          status: 'invited',
          invited_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString()
        })
        .select('*, candidate:candidates(*), job:jobs(*)')
        .single();

      if (insertError) throw insertError;

      // Send email via Edge Function
      try {
        await fetch(\`\${functionsUrl}/send-interview-email\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: app.candidate.email,
            candidateName: app.candidate.name,
            jobTitle: app.job.title,
            companyName: app.job.company,
            interviewCode: code,
            expiresAt: expiresAt.toISOString()
          })
        });
      } catch (emailErr) {
        console.error('Email failed:', emailErr);
      }

      onInvited();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-surface-raised border border-border-default rounded-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-border-default flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Invite Candidate</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white">×</button>
        </div>
        
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {availableCandidates.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-neutral-400 mb-4">All candidates have been invited to this job.</p>
              <Link
                to="/candidates"
                className="text-accent hover:underline"
              >
                Add more candidates →
              </Link>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5">Select Candidate</label>
                <select
                  value={selectedCandidate}
                  onChange={(e) => setSelectedCandidate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-surface-base border border-border-default rounded-lg text-white focus:border-accent focus:outline-none"
                >
                  <option value="">Choose a candidate...</option>
                  {availableCandidates.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                  ))}
                </select>
              </div>

              <div className="bg-surface-base rounded-lg p-4 flex items-start gap-3">
                <Mail className="w-5 h-5 text-accent mt-0.5" />
                <div className="text-sm text-neutral-400">
                  An email with the interview code and instructions will be sent to the candidate.
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 border border-border-default rounded-lg text-neutral-300 hover:text-white hover:border-border-strong transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInvite}
                  disabled={loading || !selectedCandidate}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent-hover disabled:opacity-50 rounded-lg text-white font-medium transition-colors"
                >
                  <Send className="w-4 h-4" />
                  {loading ? 'Sending...' : 'Send Invite'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}`,

  'src/pages/Candidates.jsx': `import React, { useState, useEffect } from 'react';
import { Plus, Search, Upload, FileText, X, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import * as pdfjsLib from 'pdfjs-dist';

// PDF.js worker (same as main app)
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

async function extractTextFromFile(file) {
  if (file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf')) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map(item => item.str).join(' ');
        fullText += pageText + '\\n';
      }
      return fullText.trim();
    } catch (err) {
      console.error('PDF parsing failed:', err);
      return await file.text();
    }
  }
  return await file.text();
}

export default function Candidates() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadCandidates();
  }, []);

  async function loadCandidates() {
    try {
      const { data } = await supabase
        .from('candidates')
        .select(\`*, applications:applications(count)\`)
        .order('created_at', { ascending: false });
      setCandidates(data || []);
    } catch (err) {
      console.error('Failed to load candidates:', err);
    } finally {
      setLoading(false);
    }
  }

  const filteredCandidates = candidates.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Candidates</h1>
          <p className="text-neutral-400 mt-1">Manage your candidate pool</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent-hover rounded-lg text-white font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Candidate
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search candidates..."
          className="w-full max-w-md pl-10 pr-4 py-2.5 bg-surface-raised border border-border-default rounded-lg text-white placeholder:text-neutral-500 focus:border-accent focus:outline-none"
        />
      </div>

      {/* Candidates Table */}
      <div className="bg-surface-raised border border-border-default rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
          </div>
        ) : filteredCandidates.length === 0 ? (
          <div className="p-8 text-center text-neutral-500">
            {search ? 'No candidates match your search.' : 'No candidates yet. Add your first candidate.'}
          </div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-border-default">
              <tr className="text-left text-sm text-neutral-400">
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Email</th>
                <th className="px-6 py-3 font-medium">Resume</th>
                <th className="px-6 py-3 font-medium">Applications</th>
                <th className="px-6 py-3 font-medium">Added</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filteredCandidates.map((c) => (
                <tr key={c.id} className="hover:bg-surface-overlay/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent font-semibold text-sm">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-white">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-neutral-400">{c.email}</td>
                  <td className="px-6 py-4">
                    {c.resume_text ? (
                      <span className="flex items-center gap-1 text-emerald-400 text-sm">
                        <FileText className="w-3.5 h-3.5" />
                        Uploaded
                      </span>
                    ) : (
                      <span className="text-neutral-500 text-sm">None</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-neutral-400">{c.applications?.[0]?.count || 0}</td>
                  <td className="px-6 py-4 text-neutral-500 text-sm">
                    {new Date(c.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAddModal && (
        <AddCandidateModal
          onClose={() => setShowAddModal(false)}
          onAdded={() => {
            setShowAddModal(false);
            loadCandidates();
          }}
        />
      )}
    </div>
  );
}

function AddCandidateModal({ onClose, onAdded }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    resume_text: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await extractTextFromFile(file);
    setFormData({ ...formData, resume_text: text });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error: insertError } = await supabase.from('candidates').insert({
        ...formData,
        recruiter_id: user.id
      });

      if (insertError) throw insertError;
      onAdded();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-surface-raised border border-border-default rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-border-default flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Add Candidate</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white">×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2.5 bg-surface-base border border-border-default rounded-lg text-white focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2.5 bg-surface-base border border-border-default rounded-lg text-white focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2.5 bg-surface-base border border-border-default rounded-lg text-white focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5">Resume</label>
            <div className="flex gap-2">
              <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-dashed border-border-default rounded-lg text-neutral-400 hover:text-white hover:border-border-strong cursor-pointer transition-colors">
                <Upload className="w-4 h-4" />
                {formData.resume_text ? 'Replace file' : 'Upload PDF or TXT'}
                <input
                  type="file"
                  accept=".pdf,.txt,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              {formData.resume_text && (
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, resume_text: '' })}
                  className="px-3 text-neutral-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {formData.resume_text && (
              <div className="mt-2 text-sm text-emerald-400 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                Resume loaded ({formData.resume_text.length} chars)
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2.5 bg-surface-base border border-border-default rounded-lg text-white focus:border-accent focus:outline-none resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-border-default rounded-lg text-neutral-300 hover:text-white hover:border-border-strong transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-accent hover:bg-accent-hover disabled:opacity-50 rounded-lg text-white font-medium transition-colors"
            >
              {loading ? 'Adding...' : 'Add Candidate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}`,

  'src/pages/Interviews.jsx': `import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, MessageSquare, ChevronDown, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Interviews() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadApplications();
  }, []);

  async function loadApplications() {
    try {
      const { data } = await supabase
        .from('applications')
        .select(\`
          *,
          job:jobs(id, title, company),
          candidate:candidates(name, email),
          interview:interviews(*)
        \`)
        .order('updated_at', { ascending: false });
      setApplications(data || []);
    } catch (err) {
      console.error('Failed to load applications:', err);
    } finally {
      setLoading(false);
    }
  }

  const filteredApplications = applications.filter(app => {
    const matchesSearch = 
      app.candidate?.name?.toLowerCase().includes(search.toLowerCase()) ||
      app.job?.title?.toLowerCase().includes(search.toLowerCase()) ||
      app.interview_code?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    const styles = {
      completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      started: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      invited: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
      pending: 'bg-neutral-500/10 text-neutral-400 border-neutral-500/30',
      expired: 'bg-red-500/10 text-red-400 border-red-500/30'
    };
    return styles[status] || styles.pending;
  };

  const getRecommendationBadge = (rec) => {
    const styles = {
      strong_yes: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      yes: 'bg-green-500/10 text-green-400 border-green-500/30',
      maybe: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
      no: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
      strong_no: 'bg-red-500/10 text-red-400 border-red-500/30'
    };
    return styles[rec] || '';
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Interviews</h1>
        <p className="text-neutral-400 mt-1">Track all candidate interviews and results</p>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, job, or code..."
            className="w-full pl-10 pr-4 py-2.5 bg-surface-raised border border-border-default rounded-lg text-white placeholder:text-neutral-500 focus:border-accent focus:outline-none"
          />
        </div>
        
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none px-4 py-2.5 pr-10 bg-surface-raised border border-border-default rounded-lg text-white focus:border-accent focus:outline-none cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="started">In Progress</option>
            <option value="invited">Invited</option>
            <option value="pending">Pending</option>
            <option value="expired">Expired</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
        </div>
      </div>

      {/* Interviews List */}
      <div className="bg-surface-raised border border-border-default rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="p-8 text-center text-neutral-500">
            {search || statusFilter !== 'all' 
              ? 'No interviews match your filters.' 
              : 'No interviews yet.'}
          </div>
        ) : (
          <div className="divide-y divide-border-subtle">
            {filteredApplications.map((app) => {
              const interview = app.interview?.[0];
              
              return (
                <div key={app.id} className="p-5 hover:bg-surface-overlay/50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-semibold">
                        {app.candidate?.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div>
                        <div className="font-medium text-white">{app.candidate?.name}</div>
                        <div className="text-sm text-neutral-400">{app.candidate?.email}</div>
                        <Link 
                          to={\`/jobs/\${app.job?.id}\`}
                          className="text-sm text-accent hover:underline mt-1 inline-flex items-center gap-1"
                        >
                          {app.job?.title}
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center gap-3 mb-2">
                        <code className="px-2 py-1 bg-surface-base text-xs font-mono text-neutral-400 rounded">
                          {app.interview_code}
                        </code>
                        <span className={\`px-2.5 py-1 text-xs font-medium rounded-full border \${getStatusBadge(app.status)}\`}>
                          {app.status}
                        </span>
                      </div>
                      
                      {interview && (
                        <div className="flex items-center gap-3 justify-end">
                          <div className="text-2xl font-mono font-bold text-white">
                            {interview.overall_score}<span className="text-neutral-500 text-sm">/10</span>
                          </div>
                          {interview.ai_recommendation && (
                            <span className={\`px-2.5 py-1 text-xs font-medium rounded-full border capitalize \${getRecommendationBadge(interview.ai_recommendation)}\`}>
                              {interview.ai_recommendation.replace('_', ' ')}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {interview && (
                    <div className="mt-4 pt-4 border-t border-border-subtle">
                      <div className="grid grid-cols-3 gap-4 mb-3">
                        <div>
                          <div className="text-xs text-neutral-500 mb-1">Technical</div>
                          <div className="font-mono text-white">{interview.technical_score}/10</div>
                        </div>
                        <div>
                          <div className="text-xs text-neutral-500 mb-1">Communication</div>
                          <div className="font-mono text-white">{interview.communication_score}/10</div>
                        </div>
                        <div>
                          <div className="text-xs text-neutral-500 mb-1">Duration</div>
                          <div className="font-mono text-white">{interview.duration_minutes || '—'} min</div>
                        </div>
                      </div>
                      
                      {interview.ai_summary && (
                        <p className="text-sm text-neutral-400 line-clamp-2">
                          {interview.ai_summary}
                        </p>
                      )}
                      
                      {interview.strengths?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {interview.strengths.slice(0, 3).map((s, i) => (
                            <span key={i} className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-xs rounded">
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}`
};

// Create src files
Object.entries(srcFiles).forEach(([filepath, content]) => {
  const fullPath = path.join(RECRUITER_DIR, filepath);
  const dir = path.dirname(fullPath);
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(fullPath, content);
  console.log(`Created: recruiter/${filepath}`);
});

console.log('\n✓ Recruiter portal setup complete!');
console.log('\nNext steps:');
console.log('1. cd recruiter');
console.log('2. npm install (or pnpm install)');
console.log('3. Copy .env.example to .env and add your Supabase credentials');
console.log('4. npm run dev');
