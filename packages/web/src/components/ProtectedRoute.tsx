import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { clsx } from 'clsx';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const { isDark } = useTheme();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className={clsx(
        'min-h-screen flex items-center justify-center',
        isDark ? 'bg-slate-900' : 'bg-gray-100'
      )}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          <span className={clsx(
            'text-sm',
            isDark ? 'text-gray-400' : 'text-gray-600'
          )}>
            Loading...
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
