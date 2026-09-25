import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Check, Eye, EyeOff } from 'lucide-react';
import logo from '../assets/images/elevata_logo.png';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState(() => localStorage.getItem('elevata_remember_email') || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem('elevata_remember_email'));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (rememberMe) {
      localStorage.setItem('elevata_remember_email', email);
    } else {
      localStorage.removeItem('elevata_remember_email');
    }

    try {
      const loggedUser = await login(email, password);
      if (loggedUser?.role === 'ADMIN') {
        navigate('/admin/users');
      } else if (loggedUser?.role === 'FINANCIAL_INSTITUTION') {
        navigate('/banker');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-dvh w-screen items-center justify-center bg-[#f3f2f0] p-4 font-sans sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-[400px] rounded-[10px] bg-white p-6 shadow-[0_4px_16px_rgba(0,0,0,0.08)] sm:p-8"
      >
        <div className="mb-6 flex flex-col items-center text-center">
          <Link to="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
            <img src={logo} alt="Elevata" className="h-9 w-9 object-contain" />
            <span className="text-[1.65rem] font-black tracking-tight text-[#0a66c2]">
              Elevata
            </span>
          </Link>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              <div>
                <span className="font-semibold">Sign in failed</span>
                <p className="mt-0.5 text-xs text-red-600">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-[14px] font-normal text-[#181818]">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 w-full rounded-[4px] border border-[#666666] bg-white px-3 text-[15px] text-[#181818] outline-none transition-colors placeholder:text-[#8c8c8c] focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-[14px] font-normal text-[#181818]">
              Password
            </label>
            <div className="relative flex items-center">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 w-full rounded-[4px] border border-[#666666] bg-white pl-3 pr-12 text-[15px] text-[#181818] outline-none transition-colors placeholder:text-[#8c8c8c] focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 flex h-8 w-8 items-center justify-center rounded-full text-[#5e5e5e] transition-colors hover:bg-[#eaf2ff] hover:text-[#0a66c2] focus:outline-none focus:ring-2 focus:ring-[#0a66c2]/30"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label
              className="flex cursor-pointer select-none items-center gap-2.5"
              onClick={() => setRememberMe(!rememberMe)}
            >
              <div
                className={`flex h-5 w-5 items-center justify-center rounded-[3px] transition-colors ${rememberMe ? 'bg-[#057642]' : 'border border-[#666666] bg-white'
                  }`}
              >
                {rememberMe && <Check className="h-3.5 w-3.5 stroke-[3] text-white" />}
              </div>
              <span className="text-[14px] text-[#181818]">Remember me</span>
            </label>

            <Link
              to="/forgot-password"
              className="text-[14px] font-semibold text-[#0a66c2] hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <motion.button
            whileTap={{ scale: 0.99 }}
            type="submit"
            disabled={loading}
            className="flex h-12 w-full items-center justify-center rounded-full bg-[#0a66c2] text-[16px] font-bold text-white transition-colors hover:bg-[#004182] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              'Login'
            )}
          </motion.button>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-[#e0e0e0]"></div>
            <span className="mx-4 flex-shrink text-[13px] text-[#717171]">or</span>
            <div className="flex-grow border-t border-[#e0e0e0]"></div>
          </div>

          <div className="text-center text-[14px] text-[#5e5e5e]">
            Don't have account?{' '}
            <Link to="/register" className="font-semibold text-[#0a66c2] hover:underline">
              Register
            </Link>
          </div>
        </form>
      </motion.div>
    </div>
  );
}