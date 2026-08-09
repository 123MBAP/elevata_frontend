import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import logo from '../assets/images/elevata_logo.png';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-dvh w-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,_#f7f9fc_0%,_#eef3f9_45%,_#e8eef7_100%)] p-3 font-sans sm:p-4">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.65),rgba(255,255,255,0.1))]" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-[420px] rounded-[24px] border border-[#e3eaf4] bg-white px-6 py-7 shadow-[0_24px_60px_rgba(15,23,42,0.08)] sm:px-8 sm:py-8"
      >
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Elevata" className="h-10 w-10 object-contain" />
            <span className="text-[1.8rem] font-extrabold tracking-[-0.04em] text-[#101828]">
              Elevata
            </span>
          </div>
        </div>

        <div className="mx-auto mt-6 w-full max-w-[540px]">
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-5 flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <div>
                  <span className="font-semibold">Authentication Error</span>
                  <p className="mt-0.5 text-red-600">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="email" className="block text-[0.85rem] font-extrabold uppercase tracking-[0.02em] text-[#111827]">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full rounded-lg border border-[#2f3a4a] bg-[#eaf2ff] px-4 py-3 text-[1rem] text-[#111827] outline-none transition-[border-color,box-shadow,background-color] placeholder:text-[#6b7280] focus:border-[#1d4ed8] focus:bg-[#edf4ff] focus:shadow-[0_0_0_4px_rgba(37,99,235,0.15)]"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="password" className="block text-[0.85rem] font-extrabold uppercase tracking-[0.02em] text-[#111827]">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-lg border border-[#2f3a4a] bg-[#eaf2ff] px-4 py-3 text-[1rem] text-[#111827] outline-none transition-[border-color,box-shadow,background-color] placeholder:text-[#6b7280] focus:border-[#1d4ed8] focus:bg-[#edf4ff] focus:shadow-[0_0_0_4px_rgba(37,99,235,0.15)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center px-5 text-[#94a3b8] transition-colors hover:text-[#475569]"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <Link to="/forgot-password" className="text-[0.98rem] font-bold text-[#1670d8] hover:underline">
                Forgot password?
              </Link>
            </div>

            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center rounded-full bg-[#0f74e7] text-[1rem] font-extrabold text-white shadow-[0_16px_30px_rgba(15,116,231,0.28)] transition-colors hover:bg-[#0d67cf] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                'Log In'
              )}
            </motion.button>

            <div className="flex items-center gap-4 py-3 text-center text-[#94a3b8]">
              <span className="h-px flex-1 bg-[#d9e2ef]" />
              <span className="text-sm font-medium">or</span>
              <span className="h-px flex-1 bg-[#d9e2ef]" />
            </div>

            <div className="text-center text-[0.98rem] text-[#64748b]">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="font-bold text-[#1670d8] hover:underline">
                Register 
              </Link>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}