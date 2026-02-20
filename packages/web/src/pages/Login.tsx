import { useState, FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogIn, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { clsx } from 'clsx';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={clsx(
      'min-h-screen flex items-center justify-center px-4',
      isDark ? 'bg-slate-900' : 'bg-gray-100'
    )}>
      <div className={clsx(
        'w-full max-w-md p-8 rounded-xl shadow-lg',
        isDark ? 'bg-slate-800' : 'bg-white'
      )}>
        <div className="text-center mb-8">
          <img
            src={isDark ? "/Trilogyworks_logo_light.png" : "/Trilogyworks_logo_dark.png"}
            alt="TrilogyWorks"
            className="h-10 mx-auto mb-4"
          />
          <h1 className={clsx(
            'text-2xl font-bold',
            isDark ? 'text-white' : 'text-gray-900'
          )}>
            Sign in to AI Red Team
          </h1>
          <p className={clsx(
            'mt-2 text-sm',
            isDark ? 'text-gray-400' : 'text-gray-600'
          )}>
            Security Testing Platform for AI Systems
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-500">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className={clsx(
                'block text-sm font-medium mb-1',
                isDark ? 'text-gray-300' : 'text-gray-700'
              )}
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className={clsx(
                'w-full px-3 py-2 rounded-lg border transition-colors',
                isDark
                  ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-400 focus:border-indigo-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-indigo-500',
                'focus:outline-none focus:ring-2 focus:ring-indigo-500/20'
              )}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className={clsx(
                'block text-sm font-medium mb-1',
                isDark ? 'text-gray-300' : 'text-gray-700'
              )}
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className={clsx(
                  'w-full px-3 py-2 pr-10 rounded-lg border transition-colors',
                  isDark
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-400 focus:border-indigo-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-indigo-500',
                  'focus:outline-none focus:ring-2 focus:ring-indigo-500/20'
                )}
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={clsx(
                  'absolute right-3 top-1/2 -translate-y-1/2',
                  isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                )}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={clsx(
              'w-full py-2.5 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2',
              'bg-indigo-600 hover:bg-indigo-700 text-white',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Sign in
              </>
            )}
          </button>
        </form>

        <div className={clsx(
          'mt-6 text-center text-sm',
          isDark ? 'text-gray-400' : 'text-gray-600'
        )}>
          Don't have an account?{' '}
          <Link
            to="/register"
            className="text-indigo-500 hover:text-indigo-400 font-medium"
          >
            Create one
          </Link>
        </div>

        <div className={clsx(
          'mt-8 pt-6 border-t text-center text-xs',
          isDark ? 'border-slate-700 text-gray-500' : 'border-gray-200 text-gray-400'
        )}>
          Demo credentials: admin@trilogyworks.com / admin123
        </div>
      </div>
    </div>
  );
}
