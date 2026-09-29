import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, Mail, Key, ArrowLeft, ArrowRight, Eye, EyeOff } from 'lucide-react';
import logo from '../assets/images/elevata_logo.png';
import { apiRequest } from '../lib/api';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  // Wizard states
  const [step, setStep] = useState(1); // 1 = Request Code, 2 = Verify & Reset
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status states
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await apiRequest('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
      setSuccess('A 6-digit password reset code has been sent to your email address.');
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset code. Please check the email address.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (code.length !== 6) {
      setError('Please enter a valid 6-digit reset code.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    // Password strength check
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    if (!strongPasswordRegex.test(newPassword)) {
      setError('Password must be at least 8 characters and contain 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.');
      return;
    }

    setLoading(true);

    try {
      await apiRequest('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, code, newPassword })
      });
      setSuccess('Your password has been reset successfully. Redirecting you to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err: any) {
      setError(err.message || 'Reset failed. Please check your verification code and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-shell relative flex min-h-dvh w-screen items-center justify-center overflow-hidden p-3 font-sans sm:p-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.35),transparent_42%)]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="login-glass relative z-10 w-full max-w-[340px] px-5 py-6 sm:px-6 sm:py-7"
      >
        {/* Brand Logo and Title */}
        <div className="flex flex-col items-center text-center">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full border border-white/25 bg-white/10">
            <img src={logo} alt="Elevata" className="h-10 w-10 object-contain" />
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.42em] text-white/80">Elevata</p>
          <h2 className="mt-3 text-[1.35rem] font-light tracking-[0.18em] text-white">
            RESET PASSWORD
          </h2>
          <p className="mt-2 max-w-[320px] text-sm leading-relaxed text-white/70">
            {step === 1
              ? "Enter your email address to receive a 6-digit verification code."
              : `Enter the code sent to ${email} and your new password.`}
          </p>
        </div>

        <div className="mx-auto mt-6 w-full">
          {/* Notifications */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-5 flex items-start gap-2.5 rounded-2xl border border-red-200/30 bg-red-500/15 px-4 py-3 text-sm text-red-50"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <div>
                  <span className="font-semibold">Reset Error</span>
                  <p className="mt-0.5 text-red-100/90">{error}</p>
                </div>
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-5 flex items-start gap-2.5 rounded-2xl border border-emerald-200/30 bg-emerald-500/15 px-4 py-3 text-sm text-emerald-50"
              >
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <div>
                  <span className="font-semibold">Notification</span>
                  <p className="mt-0.5 text-emerald-100/90">{success}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form Wizard */}
          {step === 1 ? (
            <form onSubmit={handleRequestCode} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="email" className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
                  Email Address
                </label>
                <div className="login-field">
                  <Mail className="login-field-icon" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="office@elevata.com"
                  />
                </div>
              </div>

              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={loading || !email}
                className="flex h-12 w-full items-center justify-center rounded-sm bg-[#0b1c24] text-[13px] font-extrabold tracking-[0.18em] text-white shadow-[0_10px_24px_rgba(8,20,28,0.35)] transition hover:bg-[#07141a] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    Send Reset Code <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </motion.button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              {/* Verification Code */}
              <div className="space-y-1">
                <label htmlFor="code" className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
                  6-Digit Reset Code
                </label>
                <div className="login-field">
                  <Key className="login-field-icon" />
                  <input
                    id="code"
                    type="text"
                    required
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="newPassword" className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
                  New Password
                </label>
                <div className="login-field no-icon">
                  <input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center px-1 text-white/70 transition hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="confirmPassword" className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
                  Confirm New Password
                </label>
                <div className="login-field no-icon">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 flex items-center px-1 text-white/70 transition hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={loading || !code || !newPassword || !confirmPassword}
                className="flex h-12 w-full items-center justify-center rounded-sm bg-[#0b1c24] text-[13px] font-extrabold tracking-[0.18em] text-white shadow-[0_10px_24px_rgba(8,20,28,0.35)] transition hover:bg-[#07141a] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  'RESET PASSWORD'
                )}
              </motion.button>

              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setSuccess(null);
                  setStep(1);
                }}
                className="flex w-full items-center justify-center gap-1 pt-2 text-sm font-semibold text-white/70 transition hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" /> Request code again
              </button>
            </form>
          )}

          <div className="mt-2 flex items-center gap-4 py-3 text-center text-white/50">
            <span className="h-px flex-1 bg-white/20" />
            <span className="text-sm font-medium">or</span>
            <span className="h-px flex-1 bg-white/20" />
          </div>

          <div className="text-center text-[0.98rem] text-white/70">
            <Link to="/login" className="flex items-center justify-center gap-1.5 font-bold text-white hover:underline">
              <ArrowLeft className="h-4 w-4" /> Back to Sign In
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
