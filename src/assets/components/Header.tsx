import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useLocation } from 'react-router-dom';
import { Bell, Search, Sparkles, Building, ChevronDown, Check } from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { smes, selectedSmeId, setSelectedSmeId, activeSme } = useApp();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSmeDropdown, setShowSmeDropdown] = useState(false);

  // Determine current role based on path
  const isBankerPath = location.pathname === '/banker';

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm px-4 py-3 flex items-center justify-between">
      {/* Left: Mobile hamburger menu & SME Select Dropdown */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-emerald-600 transition"
          aria-label="Open menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Global SME Switcher dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowSmeDropdown(!showSmeDropdown)}
            className="flex items-center space-x-2 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-gray-50 hover:border-gray-300 transition focus:outline-none"
          >
            <Building className="w-3.5 h-3.5 text-emerald-600" />
            <span className="truncate max-w-[120px] sm:max-w-none">{activeSme.name}</span>
            <ChevronDown className="w-3 h-3 text-gray-400" />
          </button>

          {showSmeDropdown && (
            <>
              <div className="fixed inset-0 z-45" onClick={() => setShowSmeDropdown(false)} />
              <div className="absolute left-0 mt-1.5 w-60 bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 z-50 animate-in fade-in-50 slide-in-from-top-1 duration-150">
                <div className="px-3 py-1 border-b border-gray-100 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  Select Active SME Simulation
                </div>
                {smes.map((sme) => (
                  <button
                    key={sme.id}
                    onClick={() => {
                      setSelectedSmeId(sme.id);
                      setShowSmeDropdown(false);
                    }}
                    className={`flex items-center justify-between w-full px-3 py-2 text-xs text-left hover:bg-slate-50 transition ${
                      sme.id === selectedSmeId ? 'bg-slate-50 text-emerald-600 font-bold' : 'text-slate-700'
                    }`}
                  >
                    <div>
                      <span className="block font-medium">{sme.name}</span>
                      <span className="text-[10px] text-gray-400 font-normal">{sme.sector} • Score: {sme.healthScore}</span>
                    </div>
                    {sme.id === selectedSmeId && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Center/Right: Role indicator badge, Notifications, and Search */}
      <div className="flex items-center space-x-4">
        {/* Dynamic Role Badge */}
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide hidden sm:inline-block border ${
          isBankerPath
            ? 'bg-slate-50 text-slate-700 border-slate-200'
            : 'bg-emerald-50 text-emerald-700 border-emerald-100'
        }`}>
          {isBankerPath ? 'Bank Credit Officer' : 'SME Business Owner'}
        </span>

        {/* Search Input (desktop) */}
        <div className="relative hidden lg:block w-64">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search accounts..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-gray-600 hover:text-emerald-600 hover:bg-gray-50 rounded-lg transition relative focus:outline-none"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {activeSme.riskAlerts.length > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            )}
          </button>

          {showNotifications && (
            <>
              <div className="fixed inset-0 z-45" onClick={() => setShowNotifications(false)} />
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 z-50 overflow-hidden animate-in fade-in-50 slide-in-from-top-1 duration-150">
                <div className="px-4 py-2 border-b border-gray-100 bg-slate-50">
                  <h3 className="text-xs font-bold text-slate-800 flex items-center">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 mr-1.5" /> AI Engine Alerts
                  </h3>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                  {activeSme.riskAlerts.length > 0 ? (
                    activeSme.riskAlerts.map((alert) => (
                      <div key={alert.id} className="p-3 hover:bg-gray-50/50 transition">
                        <div className="flex gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                            alert.type === 'danger' ? 'bg-red-500' : alert.type === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'
                          }`} />
                          <p className="text-[11px] text-gray-600 leading-relaxed">{alert.text}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-gray-400">
                      No active alerts.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Divider */}
        <div className="h-5 w-px bg-gray-200 hidden sm:block"></div>

        {/* Mini profile snippet */}
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
            {activeSme.ownerName.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="text-left hidden md:block">
            <span className="text-[11px] font-bold text-slate-800 block leading-tight">{activeSme.ownerName}</span>
            <span className="text-[9px] text-gray-400 block leading-none">{activeSme.email}</span>
          </div>
        </div>
      </div>
    </header>
  );
}