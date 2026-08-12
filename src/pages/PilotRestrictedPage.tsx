import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { LogOut, Mail } from 'lucide-react';
import logo from '../assets/images/elevata_logo.png';

export default function PilotRestrictedPage() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <div className="relative flex min-h-dvh w-screen items-center justify-center overflow-y-auto bg-[radial-gradient(circle_at_top,_#f7f9fc_0%,_#eef3f9_45%,_#e8eef7_100%)] p-3 font-sans sm:p-4">
      {/* Light Overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.65),rgba(255,255,255,0.1))]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-[480px] rounded-[24px] border border-[#e3eaf4] bg-white px-6 py-7 shadow-[0_24px_60px_rgba(15,23,42,0.08)] sm:px-8 sm:py-8 my-4"
      >
        {/* Logo and Brand Name */}
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Elevata" className="h-10 w-10 object-contain" />
            <span className="text-[1.8rem] font-extrabold tracking-[-0.04em] text-[#101828]">
              Elevata
            </span>
          </div>
        </div>

        {/* Message Content */}
        <div className="mt-6 text-center space-y-5">
          <h2 className="text-[1.25rem] font-extrabold tracking-[-0.02em] text-[#101828]">
            12-Month Pilot Registration
          </h2>

          <div className="h-px bg-[#e2e8f0]" />

          <p className="text-[0.95rem] leading-relaxed text-[#475569]">
            Thank you for registering. Elevata is currently being tested with selected SMEs and financial institutions as we refine the platform for wider deployment.
          </p>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-emerald-800 text-xs font-bold flex items-center justify-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            Your registration was successful.
          </div>

          <p className="text-[0.9rem] leading-relaxed text-[#64748b]">
            You will be notified by email (<strong>{user?.email}</strong>) when access becomes available.
          </p>

          <p className="text-[0.92rem] font-medium text-[#0f74e7]">
            Thank you for your interest in Elevata.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col gap-3 pt-5 border-t border-[#e2e8f0]">
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleLogout}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#0f74e7] text-[1rem] font-extrabold text-white shadow-[0_16px_30px_rgba(15,116,231,0.2)] transition-colors hover:bg-[#0d67cf]"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </motion.button>
          
          <a
            href="mailto:voltale360@gmail.com"
            className="flex h-11 items-center justify-center gap-2 px-5 text-sm font-bold border border-[#d9e2ef] hover:bg-[#f1f5f9] bg-transparent text-[#475569] rounded-full transition-colors"
          >
            <Mail className="h-4 w-4 text-[#64748b]" />
            Contact Support (voltale360@gmail.com)
          </a>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-[#94a3b8]">
          Elevata Platform &copy; 2026. Refining credit readiness.
        </div>
      </motion.div>
    </div>
  );
}
