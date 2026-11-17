import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Check, Eye, EyeOff, Mail, Lock } from 'lucide-react';
import logo from '../assets/images/elevata_logo.png';
import { apiRequest } from '../lib/api';
import { fetchCategories, invalidateCategoryCache, isKnownCategory, type BusinessCategory } from '../lib/categoryTemplate';
import CategoryPicker from '../assets/components/CategoryPicker';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState(() => localStorage.getItem('elevata_remember_email') || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem('elevata_remember_email'));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Shown after login when the business has no category, or one that is no longer offered.
  const [categoryStep, setCategoryStep] = useState<{ categories: BusinessCategory[]; current: string } | null>(null);
  const [chosenType, setChosenType] = useState('');
  const [savingCategory, setSavingCategory] = useState(false);

  const goHome = (role?: string) => {
    if (role === 'ADMIN') navigate('/admin/users');
    else if (role === 'FINANCIAL_INSTITUTION') navigate('/banker');
    else navigate('/');
  };

  /** Returns true when the business must pick a category before continuing. */
  const needsCategory = async () => {
    try {
      const [me, categories] = await Promise.all([apiRequest('/business/me'), fetchCategories()]);
      const current = String(me?.data?.business?.businessType || '');
      if (categories.length && !isKnownCategory(current, categories)) {
        setCategoryStep({ categories, current });
        setChosenType('');
        return true;
      }
    } catch {
      // Never block sign-in because this check failed.
    }
    return false;
  };

  const handleSaveCategory = async () => {
    if (!chosenType) {
      setError('Please choose what kind of business you run.');
      return;
    }
    setError(null);
    setSavingCategory(true);
    try {
      await apiRequest('/business/profile', { method: 'PUT', body: JSON.stringify({ businessType: chosenType }) });
      invalidateCategoryCache();
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your business category.');
    } finally {
      setSavingCategory(false);
    }
  };

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
      if (loggedUser?.role === 'BUSINESS' && (await needsCategory())) return;
      goHome(loggedUser?.role);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-shell relative flex min-h-dvh w-screen items-center justify-center overflow-hidden p-3 font-sans sm:p-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.4),transparent_40%)]" />

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="login-glass relative z-10 w-full max-w-[340px] px-5 py-6 sm:px-6 sm:py-7"
      >
        <div className="mb-5 flex flex-col items-center text-center">
          <div className="mb-2.5 flex h-14 w-14 items-center justify-center rounded-full border border-white/25 bg-white/10 shadow-[0_0_0_5px_rgba(255,255,255,0.05)]">
            <img src={logo} alt="Elevata" className="h-8 w-8 object-contain" />
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.38em] text-white/75">Elevata</p>
          <h1 className="mt-1.5 text-[1.15rem] font-light tracking-[0.22em] text-white">{categoryStep ? 'YOUR BUSINESS' : 'USER LOGIN'}</h1>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mb-4 flex items-start gap-2 rounded-lg border border-red-200/35 bg-red-500/15 px-2.5 py-2 text-[12px] text-red-50"
            >
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <div>
                <span className="font-semibold">{categoryStep ? 'Something went wrong' : 'Sign in failed'}</span>
                <p className="mt-0.5 text-[11px] text-red-100/90">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {categoryStep ? (
          <div className="space-y-4">
            <p className="text-[12px] leading-relaxed text-white/80">
              {categoryStep.current
                ? `Your business is registered as “${categoryStep.current}”, which is no longer in the category list. `
                : 'Your business has no category yet. '}
              Choose the one that fits best so Elevata can set up your sales, expenses and reports for it.
            </p>
            <CategoryPicker categories={categoryStep.categories} value={chosenType} onChange={setChosenType} />
            <motion.button
              whileTap={{ scale: 0.99 }}
              type="button"
              onClick={handleSaveCategory}
              disabled={savingCategory || !chosenType}
              className="flex h-10 w-full items-center justify-center rounded-sm bg-[#0b1c24] text-[12px] font-extrabold tracking-[0.24em] text-white shadow-[0_8px_20px_rgba(8,20,28,0.32)] transition hover:bg-[#07141a] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingCategory ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : 'CONTINUE'}
            </motion.button>
            <button type="button" onClick={() => goHome('BUSINESS')} className="w-full text-center text-[12px] text-white/70 hover:text-white">
              Decide later
            </button>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="login-field">
            <Mail className="login-field-icon" />
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email ID"
              autoComplete="email"
            />
          </div>

          <div className="login-field">
            <Lock className="login-field-icon" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-0 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-white/70 transition hover:text-white"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>

          <div className="flex items-center justify-between pt-0.5 text-[12px]">
            <label
              className="flex cursor-pointer select-none items-center gap-2 text-white/85"
              onClick={() => setRememberMe(!rememberMe)}
            >
              <div
                className={`flex h-3.5 w-3.5 items-center justify-center rounded-[2px] border transition ${
                  rememberMe ? 'border-white bg-white text-[#1d4d57]' : 'border-white/50 bg-transparent'
                }`}
              >
                {rememberMe && <Check className="h-2.5 w-2.5 stroke-[3]" />}
              </div>
              Remember me
            </label>

            <Link to="/forgot-password" className="font-medium text-white/80 transition hover:text-white">
              Forgot Password?
            </Link>
          </div>

          <motion.button
            whileTap={{ scale: 0.99 }}
            type="submit"
            disabled={loading}
            className="mt-1 flex h-10 w-full items-center justify-center rounded-sm bg-[#0b1c24] text-[12px] font-extrabold tracking-[0.24em] text-white shadow-[0_8px_20px_rgba(8,20,28,0.32)] transition hover:bg-[#07141a] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              'LOGIN'
            )}
          </motion.button>

          <p className="pt-1 text-center text-[12px] text-white/70">
            Don&apos;t have account?{' '}
            <Link to="/register" className="font-semibold text-white hover:underline">
              Register
            </Link>
          </p>

          <div className="pt-3 border-t border-white/10 flex items-center justify-center gap-3 text-[11px] text-white/50">
            <Link to="/terms" className="hover:text-white/80 transition-colors">
              Terms & Conditions
            </Link>
            <span>•</span>
            <Link to="/privacy" className="hover:text-white/80 transition-colors">
              Privacy Policy
            </Link>
          </div>
        </form>
        )}
      </motion.div>
    </div>
  );
}
