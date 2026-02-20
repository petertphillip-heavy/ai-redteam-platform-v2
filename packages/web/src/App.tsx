import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { Database, Play, AlertTriangle, FileText, BarChart3, FolderOpen, Sun, Moon, LogOut, User, Users } from 'lucide-react';
import { clsx } from 'clsx';
import { useTheme } from './contexts/ThemeContext';
import { useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LazyLoad, lazyWithRetry } from './components/LazyLoad';

// Eager loaded pages (auth pages - needed immediately)
import Login from './pages/Login';
import Register from './pages/Register';

// Lazy loaded pages (loaded on demand for better initial load performance)
const Dashboard = lazyWithRetry(() => import('./pages/Dashboard'));
const Payloads = lazyWithRetry(() => import('./pages/Payloads'));
const Projects = lazyWithRetry(() => import('./pages/Projects'));
const Tests = lazyWithRetry(() => import('./pages/Tests'));
const Findings = lazyWithRetry(() => import('./pages/Findings'));
const Reports = lazyWithRetry(() => import('./pages/Reports'));
const Analytics = lazyWithRetry(() => import('./pages/Analytics'));
const UsersPage = lazyWithRetry(() => import('./pages/Users'));

function SkipToMainContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-indigo-600 focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-white"
    >
      Skip to main content
    </a>
  );
}

function NavLink({ to, icon: Icon, children }: { to: string; icon: React.ElementType; children: React.ReactNode }) {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));

  return (
    <Link
      to={to}
      aria-current={isActive ? 'page' : undefined}
      className={clsx(
        'flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-slate-900',
        isActive
          ? 'bg-indigo-600 text-white'
          : 'text-gray-300 hover:text-white hover:bg-slate-700'
      )}
    >
      <Icon className="w-4 h-4" aria-hidden="true" />
      <span className="text-sm font-medium">{children}</span>
    </Link>
  );
}

function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-slate-900"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-pressed={isDark}
    >
      {isDark ? (
        <Sun className="w-5 h-5" aria-hidden="true" />
      ) : (
        <Moon className="w-5 h-5" aria-hidden="true" />
      )}
    </button>
  );
}

function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-700/50">
        <User className="w-4 h-4 text-gray-400" aria-hidden="true" />
        <span className="text-sm text-gray-300">{user?.name || user?.email}</span>
        <span
          className={clsx(
            'text-xs px-1.5 py-0.5 rounded',
            user?.role === 'ADMIN' ? 'bg-indigo-500/20 text-indigo-400' :
            user?.role === 'USER' ? 'bg-green-500/20 text-green-400' :
            'bg-gray-500/20 text-gray-400'
          )}
          aria-label={`Role: ${user?.role}`}
        >
          {user?.role}
        </span>
      </div>
      <button
        onClick={handleLogout}
        className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-slate-900"
        aria-label="Sign out"
        title="Sign out"
      >
        <LogOut className="w-5 h-5" aria-hidden="true" />
      </button>
    </div>
  );
}

function AuthenticatedApp() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className={clsx('min-h-screen transition-colors duration-200', isDark ? 'dark bg-slate-900' : 'bg-gray-100')}>
      <SkipToMainContent />

      {/* Navigation */}
      <nav
        className="bg-slate-900 text-white sticky top-0 z-40 border-b border-slate-700"
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link
              to="/"
              className="flex items-center gap-3 hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-slate-900 rounded-lg"
              aria-label="AI Red Team by TrilogyWorks - Home"
            >
              <img
                src="/Trilogyworks_logo_light.png"
                alt=""
                className="h-8 w-auto"
                aria-hidden="true"
              />
              <div className="flex flex-col">
                <span className="font-bold text-lg leading-tight">AI Red Team</span>
                <span className="text-xs text-gray-400 leading-tight">by TrilogyWorks</span>
              </div>
            </Link>
            <div className="flex items-center gap-1" role="menubar">
              <NavLink to="/" icon={BarChart3}>Dashboard</NavLink>
              <NavLink to="/payloads" icon={Database}>Payloads</NavLink>
              <NavLink to="/projects" icon={FolderOpen}>Projects</NavLink>
              <NavLink to="/tests" icon={Play}>Tests</NavLink>
              <NavLink to="/findings" icon={AlertTriangle}>Findings</NavLink>
              <NavLink to="/reports" icon={FileText}>Reports</NavLink>
              <NavLink to="/analytics" icon={BarChart3}>Analytics</NavLink>
              {isAdmin && <NavLink to="/users" icon={Users}>Users</NavLink>}
              <div className="ml-2 pl-2 border-l border-slate-700 flex items-center gap-1">
                <ThemeToggle />
                <UserMenu />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main id="main-content" className="min-h-[calc(100vh-4rem)]" role="main" tabIndex={-1}>
        <Routes>
          <Route path="/" element={
            <LazyLoad loadingMessage="Loading dashboard...">
              <Dashboard />
            </LazyLoad>
          } />
          <Route path="/payloads" element={
            <LazyLoad loadingMessage="Loading payloads...">
              <Payloads />
            </LazyLoad>
          } />
          <Route path="/projects" element={
            <LazyLoad loadingMessage="Loading projects...">
              <Projects />
            </LazyLoad>
          } />
          <Route path="/projects/:id" element={
            <LazyLoad loadingMessage="Loading project...">
              <Projects />
            </LazyLoad>
          } />
          <Route path="/tests" element={
            <LazyLoad loadingMessage="Loading tests...">
              <Tests />
            </LazyLoad>
          } />
          <Route path="/tests/new" element={
            <LazyLoad loadingMessage="Loading test form...">
              <Tests />
            </LazyLoad>
          } />
          <Route path="/tests/:id" element={
            <LazyLoad loadingMessage="Loading test...">
              <Tests />
            </LazyLoad>
          } />
          <Route path="/findings" element={
            <LazyLoad loadingMessage="Loading findings...">
              <Findings />
            </LazyLoad>
          } />
          <Route path="/findings/:id" element={
            <LazyLoad loadingMessage="Loading finding...">
              <Findings />
            </LazyLoad>
          } />
          <Route path="/reports" element={
            <LazyLoad loadingMessage="Loading reports...">
              <Reports />
            </LazyLoad>
          } />
          <Route path="/reports/:id" element={
            <LazyLoad loadingMessage="Loading report...">
              <Reports />
            </LazyLoad>
          } />
          <Route path="/analytics" element={
            <LazyLoad loadingMessage="Loading analytics...">
              <Analytics />
            </LazyLoad>
          } />
          {isAdmin && (
            <Route path="/users" element={
              <LazyLoad loadingMessage="Loading users...">
                <UsersPage />
              </LazyLoad>
            } />
          )}
        </Routes>
      </main>

      {/* Footer */}
      <footer
        className={clsx(
          'border-t py-4 transition-colors',
          isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
        )}
        role="contentinfo"
      >
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-2">
          <img
            src={isDark ? "/Trilogyworks_logo_light.png" : "/Trilogyworks_logo_dark.png"}
            alt=""
            className="h-5 w-auto opacity-60"
            aria-hidden="true"
          />
          <span className={clsx('text-sm', isDark ? 'text-gray-400' : 'text-gray-500')}>
            AI Red Team Platform - Security Testing for AI Systems
          </span>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected routes */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <ErrorBoundary>
              <AuthenticatedApp />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
