import { useMemo, useState, type FormEvent } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Search, Sparkles, Building, ChevronDown, Check, LogOut, X } from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { smes, selectedSmeId, setSelectedSmeId, activeSme } = useApp();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSmeDropdown, setShowSmeDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [headerSearch, setHeaderSearch] = useState('');
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  const isBankerPath = location.pathname === '/banker' || location.pathname.startsWith('/banker');

  const filteredSmes = useMemo(() => {
    const q = headerSearch.trim().toLowerCase();
    if (!q) return smes;
    return smes.filter((sme) =>
      [sme.name, sme.sector, sme.ownerName].join(' ').toLowerCase().includes(q)
    );
  }, [smes, headerSearch]);

  const onSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    const q = headerSearch.trim().toLowerCase();
    if (!q) return;

    if (user?.role !== 'FINANCIAL_INSTITUTION') {
      const match = smes.find((sme) =>
        [sme.name, sme.sector, sme.ownerName].join(' ').toLowerCase().includes(q)
      );
      if (match) {
        setSelectedSmeId(match.id);
        setShowSmeDropdown(false);
        setShowMobileSearch(false);
        return;
      }
      navigate('/');
      return;
    }

    navigate('/banker/applications');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="flex items-center justify-between gap-2 px-3 py-2.5 sm:px-4 sm:py-3">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <button
            onClick={onMenuClick}
            className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 hover:text-[#0f766e] md:hidden"
            aria-label="Open menu"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {user?.role !== 'FINANCIAL_INSTITUTION' ? (
            <div className="relative min-w-0">
              <button
                onClick={() => setShowSmeDropdown(!showSmeDropdown)}
                className="flex max-w-[160px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none sm:max-w-none sm:px-3"
              >
                <Building className="h-3.5 w-3.5 shrink-0 text-[#0f766e]" />
                <span className="truncate">{activeSme.name}</span>
                <ChevronDown className="h-3 w-3 shrink-0 text-slate-400" />
              </button>

              {showSmeDropdown && (
                <>
                  <div className="fixed inset-0 z-45" onClick={() => setShowSmeDropdown(false)} />
                  <div className="absolute left-0 z-50 mt-1.5 w-64 rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl sm:w-72">
                    <div className="border-b border-slate-100 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Select active SME
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {smes.map((sme) => (
                        <button
                          key={sme.id}
                          onClick={() => {
                            setSelectedSmeId(sme.id);
                            setShowSmeDropdown(false);
                          }}
                          className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs transition hover:bg-slate-50 ${
                            sme.id === selectedSmeId ? 'bg-slate-50 font-bold text-[#0f766e]' : 'text-slate-700'
                          }`}
                        >
                          <div className="min-w-0">
                            <span className="block truncate font-medium">{sme.name}</span>
                            <span className="text-[10px] font-normal text-slate-400">
                              {sme.sector} • Score: {sme.healthScore}
                            </span>
                          </div>
                          {sme.id === selectedSmeId && <Check className="h-3.5 w-3.5 shrink-0 text-[#0f766e]" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex max-w-[180px] items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-700 sm:max-w-none sm:px-3">
              <Building className="h-3.5 w-3.5 shrink-0 text-slate-500" />
              <span className="truncate">{user.financialInstitution?.institutionName || 'Credit Institution'}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3">
          <span
            className={`hidden rounded-full border px-2.5 py-0.5 text-[10px] font-semibold tracking-wide sm:inline-block ${
              isBankerPath || user?.role === 'FINANCIAL_INSTITUTION'
                ? 'border-slate-200 bg-slate-50 text-slate-700'
                : 'border-teal-100 bg-teal-50 text-teal-800'
            }`}
          >
            {user?.role === 'ADMIN'
              ? 'Elevata Admin'
              : user?.role === 'FINANCIAL_INSTITUTION'
              ? 'Credit Banker'
              : 'SME Business Owner'}
          </span>

          {/* Desktop / tablet search */}
          <form onSubmit={onSearchSubmit} className="relative hidden md:block w-44 lg:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={headerSearch}
              onChange={(e) => {
                setHeaderSearch(e.target.value);
                if (user?.role !== 'FINANCIAL_INSTITUTION' && e.target.value.trim()) {
                  setShowSmeDropdown(true);
                }
              }}
              onFocus={() => {
                if (user?.role !== 'FINANCIAL_INSTITUTION' && headerSearch.trim()) {
                  setShowSmeDropdown(true);
                }
              }}
              placeholder={user?.role === 'FINANCIAL_INSTITUTION' ? 'Search applications…' : 'Search SME…'}
              className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 transition focus:border-[#0f766e] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#0f766e]/10"
            />
            {user?.role !== 'FINANCIAL_INSTITUTION' && headerSearch.trim() && showSmeDropdown && filteredSmes.length > 0 && (
              <div className="absolute right-0 top-full z-50 mt-1.5 w-full min-w-[240px] overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
                {filteredSmes.slice(0, 6).map((sme) => (
                  <button
                    key={sme.id}
                    type="button"
                    onClick={() => {
                      setSelectedSmeId(sme.id);
                      setHeaderSearch(sme.name);
                      setShowSmeDropdown(false);
                    }}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-xs hover:bg-slate-50"
                  >
                    <span className="truncate font-medium text-slate-800">{sme.name}</span>
                    <span className="ml-2 shrink-0 text-[10px] text-slate-400">{sme.sector}</span>
                  </button>
                ))}
              </div>
            )}
          </form>

          <button
            type="button"
            onClick={() => setShowMobileSearch((v) => !v)}
            className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 hover:text-[#0f766e] md:hidden"
            aria-label="Toggle search"
          >
            <Search className="h-5 w-5" />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 hover:text-[#0f766e] focus:outline-none"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {activeSme.riskAlerts.length > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                </span>
              )}
            </button>

            {showNotifications && (
              <>
                <div className="fixed inset-0 z-45" onClick={() => setShowNotifications(false)} />
                <div className="absolute right-0 z-50 mt-2 w-[min(20rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl">
                  <div className="border-b border-slate-100 bg-slate-50 px-4 py-2">
                    <h3 className="flex items-center text-xs font-bold text-slate-800">
                      <Sparkles className="mr-1.5 h-3.5 w-3.5 text-[#0f766e]" /> AI Engine Alerts
                    </h3>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                    {activeSme.riskAlerts.length > 0 ? (
                      activeSme.riskAlerts.map((alert) => (
                        <div key={alert.id} className="p-3 transition hover:bg-slate-50/50">
                          <div className="flex gap-2">
                            <span
                              className={`mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full ${
                                alert.type === 'danger'
                                  ? 'bg-red-500'
                                  : alert.type === 'warning'
                                  ? 'bg-amber-500'
                                  : 'bg-[#0f766e]'
                              }`}
                            />
                            <p className="text-[11px] leading-relaxed text-slate-600">{alert.text}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-xs text-slate-400">No active alerts.</div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="hidden h-5 w-px bg-slate-200 sm:block" />

          <div className="relative">
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center gap-2 rounded-lg p-1.5 transition hover:bg-slate-50 focus:outline-none"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0f766e] text-xs font-bold text-white shadow-inner">
                {user?.role === 'ADMIN'
                  ? 'AD'
                  : user?.role === 'FINANCIAL_INSTITUTION'
                  ? (user?.financialInstitution?.representativeName || 'FI').split(' ').map((n) => n[0]).slice(0, 2).join('')
                  : (user?.business?.ownerName || 'BO').split(' ').map((n) => n[0]).slice(0, 2).join('')}
              </div>
              <div className="hidden text-left md:block">
                <span className="font-heading block text-[11px] font-bold leading-tight text-slate-800">
                  {user?.role === 'ADMIN'
                    ? 'Administrator'
                    : user?.role === 'FINANCIAL_INSTITUTION'
                    ? (user?.financialInstitution?.representativeName || 'Credit Banker')
                    : (user?.business?.ownerName || 'Business Owner')}
                </span>
                <span className="block text-[9px] leading-none text-slate-400">{user?.email}</span>
              </div>
              <ChevronDown className="hidden h-3.5 w-3.5 text-slate-400 md:block" />
            </button>

            {showProfileDropdown && (
              <>
                <div className="fixed inset-0 z-45" onClick={() => setShowProfileDropdown(false)} />
                <div className="absolute right-0 z-50 mt-2 w-48 rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl">
                  <div className="border-b border-slate-100 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Session Controls
                  </div>
                  <div className="px-3 py-2 text-xs text-slate-700">
                    <span className="block font-bold">Role:</span>
                    <span className="font-semibold text-[#0f766e]">{user?.role}</span>
                  </div>
                  <button
                    onClick={() => {
                      setShowProfileDropdown(false);
                      window.location.href = '/profile';
                    }}
                    className="flex w-full items-center gap-2 border-t border-slate-100 px-3 py-2 text-left text-xs text-slate-700 transition hover:bg-slate-50"
                  >
                    <Building className="h-3.5 w-3.5 text-[#0f766e]" />
                    {user?.role === 'FINANCIAL_INSTITUTION' ? 'Institution Profile' : 'Business Profile'}
                  </button>
                  <button
                    onClick={async () => {
                      setShowProfileDropdown(false);
                      await logout();
                    }}
                    className="mt-1 flex w-full items-center gap-2 border-t border-slate-100 px-3 py-2 text-left text-xs text-red-600 transition hover:bg-red-50"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile search bar */}
      {showMobileSearch && (
        <form onSubmit={onSearchSubmit} className="border-t border-slate-100 px-3 py-2 md:hidden">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              autoFocus
              type="search"
              value={headerSearch}
              onChange={(e) => setHeaderSearch(e.target.value)}
              placeholder={user?.role === 'FINANCIAL_INSTITUTION' ? 'Search applications…' : 'Search SME…'}
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-9 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#0f766e] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#0f766e]/10"
            />
            <button
              type="button"
              onClick={() => {
                setHeaderSearch('');
                setShowMobileSearch(false);
              }}
              className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200"
              aria-label="Close search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          {user?.role !== 'FINANCIAL_INSTITUTION' && headerSearch.trim() && filteredSmes.length > 0 && (
            <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white">
              {filteredSmes.slice(0, 5).map((sme) => (
                <button
                  key={sme.id}
                  type="button"
                  onClick={() => {
                    setSelectedSmeId(sme.id);
                    setHeaderSearch(sme.name);
                    setShowMobileSearch(false);
                  }}
                  className="flex w-full items-center justify-between border-b border-slate-50 px-3 py-2.5 text-left text-xs last:border-0 hover:bg-slate-50"
                >
                  <span className="font-medium text-slate-800">{sme.name}</span>
                  <span className="text-[10px] text-slate-400">{sme.sector}</span>
                </button>
              ))}
            </div>
          )}
        </form>
      )}
    </header>
  );
}
