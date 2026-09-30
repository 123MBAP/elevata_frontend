import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import {
  LogOut
} from 'lucide-react';
import ElevataLogo from '../images/elevata_logo.png';

interface HeaderProps {
  onMenuClick: () => void;
  onToggleCollapse?: () => void;
  isCollapsed?: boolean;
}

export default function Header({ onMenuClick, onToggleCollapse, isCollapsed }: HeaderProps) {
  const { activeSme } = useApp();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const businessName = user?.role === 'ADMIN'
    ? 'Elevata Platform Admin'
    : user?.role === 'FINANCIAL_INSTITUTION'
    ? (user.financialInstitution?.institutionName || 'Credit Institution')
    : (activeSme.name || user?.business?.businessName || 'Business Entity');

  const userInitials = user?.role === 'ADMIN'
    ? 'AD'
    : user?.role === 'FINANCIAL_INSTITUTION'
    ? (user?.financialInstitution?.representativeName || 'FI').split(' ').map((n) => n[0]).slice(0, 2).join('')
    : (user?.business?.ownerName || 'BO').split(' ').map((n) => n[0]).slice(0, 2).join('');

  return (
    <header className="sticky top-0 z-40 border-b border-[#2d3b4e] bg-[#1a2536] text-slate-200 shadow-md">
      <div className="relative flex h-14 items-center justify-between gap-2 px-3 sm:px-4">
        {/* Left Section: Menu Toggle & Brand Logo */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <button
            onClick={() => {
              if (window.innerWidth >= 768 && onToggleCollapse) {
                onToggleCollapse();
              } else {
                onMenuClick();
              }
            }}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-300 transition hover:bg-white/10 hover:text-white cursor-pointer"
            aria-label="Toggle navigation menu"
            title={isCollapsed ? "Expand navigation drawer" : "Collapse navigation drawer"}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Logo & Brand Name */}
          <div
            onClick={() => navigate(user?.role === 'ADMIN' ? '/admin/users' : user?.role === 'FINANCIAL_INSTITUTION' ? '/banker' : '/')}
            className="flex items-center gap-2 cursor-pointer select-none group"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-[#0284c7] to-[#38bdf8] p-1 shadow-sm">
              <img src={ElevataLogo} alt="Elevata" className="h-6 w-6 object-contain" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-heading text-base font-extrabold tracking-wider !text-white">
                ELEVATA
              </span>
            </div>
          </div>

        </div>

        {/* Active Business Name */}
        <div className="pointer-events-none absolute left-1/2 max-w-[42%] -translate-x-1/2 truncate text-center text-xs font-semibold text-slate-200 sm:max-w-[48%]">
          {businessName}
        </div>

        {/* Right Section: Profile & Sign Out (No dropdowns) */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/profile"
            title="View Business Profile"
            className="flex items-center gap-2 rounded-full p-1 transition hover:bg-white/10 focus:outline-none"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0284c7] text-white text-[11px] font-bold ring-2 ring-white/20">
              {userInitials}
            </div>
            <span className="hidden md:inline text-xs font-semibold text-slate-300 hover:text-white truncate max-w-[120px]">
              {user?.role === 'ADMIN'
                ? 'Admin'
                : user?.role === 'FINANCIAL_INSTITUTION'
                ? (user?.financialInstitution?.representativeName || 'Banker')
                : (user?.business?.ownerName || 'Profile')}
            </span>
          </Link>

          <button
            onClick={async () => {
              await logout();
            }}
            title="Sign Out"
            className="flex items-center justify-center h-8 w-8 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
