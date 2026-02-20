import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, AlertCircle, Eye, EyeOff, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { clsx } from 'clsx';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const passwordRequirements = [
    { met: password.length >= 8, text: 'At least 8 characters' },
  ];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    try {
      await register({ email, password, name: name || undefined });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={clsx(
      'min-h-screen flex items-center justify-center px-4 py-8',
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
            Create your account
          </h1>
          <p className={clsx(
            'mt-2 text-sm',
            isDark ? 'text-gray-400' : 'text-gray-600'
          )}>
            Start testing AI systems for vulnerabilities
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
              htmlFor="name"
              className={clsx(
                'block text-sm font-medium mb-1',
                isDark ? 'text-gray-300' : 'text-gray-700'
              )}
            >
              Full name <span className="text-gray-500">(optional)</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              className={clsx(
                'w-full px-3 py-2 rounded-lg border transition-colors',
                isDark
                  ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-400 focus:border-indigo-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-indigo-500',
                'focus:outline-none focus:ring-2 focus:ring-indigo-500/20'
              )}
              placeholder="John Doe"
            />
          </div>

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
                autoComplete="new-password"
                className={clsx(
                  'w-full px-3 py-2 pr-10 rounded-lg border transition-colors',
                  isDark
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-400 focus:border-indigo-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-indigo-500',
                  'focus:outline-none focus:ring-2 focus:ring-indigo-500/20'
                )}
                placeholder="Create a password"
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
            <div className="mt-2 space-y-1">
              {passwordRequirements.map((req, i) => (
                <div
                  key={i}
                  className={clsx(
                    'flex items-center gap-1.5 text-xs',
                    req.met ? 'text-green-500' : isDark ? 'text-gray-500' : 'text-gray-400'
                  )}
                >
                  <Check className={clsx('w-3 h-3', req.met ? 'opacity-100' : 'opacity-30')} />
                  {req.text}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className={clsx(
                'block text-sm font-medium mb-1',
                isDark ? 'text-gray-300' : 'text-gray-700'
              )}
            >
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              className={clsx(
                'w-full px-3 py-2 rounded-lg border transition-colors',
                isDark
                  ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-400 focus:border-indigo-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-indigo-500',
                'focus:outline-none focus:ring-2 focus:ring-indigo-500/20',
                confirmPassword && password !== confirmPassword && 'border-red-500'
              )}
              placeholder="Confirm your password"
            />
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
                <UserPlus className="w-4 h-4" />
                Create account
              </>
            )}
          </button>
        </form>

        <div className={clsx(
          'mt-6 text-center text-sm',
          isDark ? 'text-gray-400' : 'text-gray-600'
        )}>
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-indigo-500 hover:text-indigo-400 font-medium"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
