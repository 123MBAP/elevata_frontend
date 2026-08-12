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
    <div className="relative flex min-h-dvh w-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,_#f7f9fc_0%,_#eef3f9_45%,_#e8eef7_100%)] p-3 font-sans sm:p-4">
      {/* Light Overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.65),rgba(255,255,255,0.1))]" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-[420px] rounded-[24px] border border-[#e3eaf4] bg-white px-6 py-7 shadow-[0_24px_60px_rgba(15,23,42,0.08)] sm:px-8 sm:py-8"
      >
        {/* Brand Logo and Title */}
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Elevata" className="h-10 w-10 object-contain" />
            <span className="text-[1.8rem] font-extrabold tracking-[-0.04em] text-[#101828]">
              Elevata
            </span>
          </div>
          <h2 className="mt-6 text-[1.25rem] font-extrabold tracking-[-0.02em] text-[#101828]">
            Reset Password
          </h2>
          <p className="text-[0.9rem] text-[#64748b] mt-1 leading-relaxed max-w-[320px]">
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
                className="mb-5 flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <div>
                  <span className="font-semibold">Reset Error</span>
                  <p className="mt-0.5 text-red-600">{error}</p>
                </div>
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-5 flex items-start gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
              >
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <div>
                  <span className="font-semibold">Notification</span>
                  <p className="mt-0.5 text-emerald-700">{success}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form Wizard */}
          {step === 1 ? (
            <form onSubmit={handleRequestCode} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="email" className="block text-[0.85rem] font-extrabold uppercase tracking-[0.02em] text-[#111827]">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="office@elevata.com"
                    className="w-full rounded-lg border border-[#2f3a4a] bg-[#eaf2ff] pl-10 pr-4 py-3 text-[1rem] text-[#111827] outline-none transition-[border-color,box-shadow,background-color] placeholder:text-[#6b7280] focus:border-[#1d4ed8] focus:bg-[#edf4ff] focus:shadow-[0_0_0_4px_rgba(37,99,235,0.15)]"
                  />
                  <Mail className="absolute left-3 top-3.5 h-5 w-5 text-[#94a3b8]" />
                </div>
              </div>

              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={loading || !email}
                className="flex h-12 w-full items-center justify-center rounded-full bg-[#0f74e7] text-[1rem] font-extrabold text-white shadow-[0_16px_30px_rgba(15,116,231,0.28)] transition-colors hover:bg-[#0d67cf] disabled:cursor-not-allowed disabled:opacity-60"
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
                <label htmlFor="code" className="block text-[0.85rem] font-extrabold uppercase tracking-[0.02em] text-[#111827]">
                  6-Digit Reset Code
                </label>
                <div className="relative">
                  <input
                    id="code"
                    type="text"
                    required
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    className="w-full rounded-lg border border-[#2f3a4a] bg-[#eaf2ff] pl-10 pr-4 py-3 text-[1rem] text-[#111827] outline-none transition-[border-color,box-shadow,background-color] placeholder:text-[#6b7280] focus:border-[#1d4ed8] focus:bg-[#edf4ff] focus:shadow-[0_0_0_4px_rgba(37,99,235,0.15)]"
                  />
                  <Key className="absolute left-3 top-3.5 h-5 w-5 text-[#94a3b8]" />
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1">
                <label htmlFor="newPassword" className="block text-[0.85rem] font-extrabold uppercase tracking-[0.02em] text-[#111827]">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-[#2f3a4a] bg-[#eaf2ff] pl-4 pr-10 py-3 text-[1rem] text-[#111827] outline-none transition-[border-color,box-shadow,background-color] placeholder:text-[#6b7280] focus:border-[#1d4ed8] focus:bg-[#edf4ff] focus:shadow-[0_0_0_4px_rgba(37,99,235,0.15)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-[#94a3b8] transition-colors hover:text-[#475569]"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="space-y-1">
                <label htmlFor="confirmPassword" className="block text-[0.85rem] font-extrabold uppercase tracking-[0.02em] text-[#111827]">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-[#2f3a4a] bg-[#eaf2ff] pl-4 pr-10 py-3 text-[1rem] text-[#111827] outline-none transition-[border-color,box-shadow,background-color] placeholder:text-[#6b7280] focus:border-[#1d4ed8] focus:bg-[#edf4ff] focus:shadow-[0_0_0_4px_rgba(37,99,235,0.15)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-[#94a3b8] transition-colors hover:text-[#475569]"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={loading || !code || !newPassword || !confirmPassword}
                className="flex h-12 w-full items-center justify-center rounded-full bg-[#0f74e7] text-[1rem] font-extrabold text-white shadow-[0_16px_30px_rgba(15,116,231,0.28)] transition-colors hover:bg-[#0d67cf] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  'Reset Password'
                )}
              </motion.button>

              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setSuccess(null);
                  setStep(1);
                }}
                className="flex items-center justify-center gap-1 w-full text-sm font-semibold text-[#64748b] hover:text-[#475569] transition-colors pt-2"
              >
                <ArrowLeft className="h-4 w-4" /> Request code again
              </button>
            </form>
          )}

          <div className="flex items-center gap-4 py-3 text-center text-[#94a3b8] mt-2">
            <span className="h-px flex-1 bg-[#d9e2ef]" />
            <span className="text-sm font-medium">or</span>
            <span className="h-px flex-1 bg-[#d9e2ef]" />
          </div>

          <div className="text-center text-[0.98rem] text-[#64748b]">
            <Link to="/login" className="font-bold text-[#1670d8] hover:underline flex items-center justify-center gap-1.5">
              <ArrowLeft className="h-4 w-4" /> Back to Sign In
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
