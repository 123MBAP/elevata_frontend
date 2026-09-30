import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import ElevataLogo from '../images/elevata_logo.png';
import { Building, LogOut } from 'lucide-react';

const Navigationbar: React.FC = () => {
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
        <header className="sticky top-0 z-50 border-b border-[#2d3b4e] bg-[#1a2536] text-slate-200 shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-14">
                    {/* Left: Elevata Logo, Brand name & Active Business Name */}
                    <div className="flex items-center gap-3">
                        <Link to={user?.role === 'ADMIN' ? '/admin/users' : user?.role === 'FINANCIAL_INSTITUTION' ? '/banker' : '/'} className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-[#0284c7] to-[#38bdf8] p-1 shadow-sm">
                                <img src={ElevataLogo} alt="Elevata Logo" className="h-6 w-6 object-contain" />
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="font-heading text-base font-extrabold tracking-wider text-white">
                                    ELEVATA
                                </span>
                            </div>
                        </Link>

                        {/* Active Business Name Badge (No Dropdown) */}
                        <div className="flex items-center gap-1.5 rounded-md border border-[#364962] bg-[#243346] px-2.5 py-1 text-xs font-semibold text-slate-200 ml-2">
                            <Building className="h-3.5 w-3.5 shrink-0 text-[#38bdf8]" />
                            <span className="truncate max-w-[160px] sm:max-w-[240px]">{businessName}</span>
                        </div>
                    </div>

                    {/* Right: Profile Link & Sign Out Button (No Dropdowns) */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        <Link
                            to="/profile"
                            title="Business Profile"
                            className="flex items-center gap-2 rounded-full p-1 transition hover:bg-white/10 focus:outline-none cursor-pointer"
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
            </div>
        </header>
    );
};

export default Navigationbar;