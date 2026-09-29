import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import logo from '../images/elevata_logo.png';
import {
  LayoutDashboard,
  Building2,
  RotateCcw,
  Package,
  ShoppingBag,
  FileBarChart,
  Target,
  FileText,
  Users,
  Briefcase,
  Bot,
  Layers,
  Megaphone,
  Landmark,
  Activity,
  Truck,
  ArrowDownLeft,
  ArrowUpRight,
  Star,
  GraduationCap
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const { activeSme, resetAll } = useApp();
  const { user } = useAuth();

  // Close sidebar on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const isActivitiesRoute =
    location.pathname === '/activities' ||
    location.pathname === '/business-activities' ||
    location.pathname === '/sales' ||
    location.pathname === '/expenses';

  const getActiveActivitySubtab = () => {
    if (!isActivitiesRoute) return null;
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get('tab');
    if (tab) {
      if (tab === 'expenses') return 'cash_out';
      return tab;
    }
    if (location.pathname === '/sales') return 'sales';
    if (location.pathname === '/expenses') return 'cash_out';
    return 'sales';
  };

  const currentActivitySubtab = getActiveActivitySubtab();

  const activitySubtabs = [
    { id: 'sales', label: 'Sales', path: '/activities?tab=sales', icon: <ShoppingBag className="w-3.5 h-3.5" /> },
    { id: 'purchases', label: 'Purchases', path: '/activities?tab=purchases', icon: <Truck className="w-3.5 h-3.5" /> },
    { id: 'cash_in', label: 'Cash In', path: '/activities?tab=cash_in', icon: <ArrowDownLeft className="w-3.5 h-3.5" /> },
    { id: 'cash_out', label: 'Cash Out', path: '/activities?tab=cash_out', icon: <ArrowUpRight className="w-3.5 h-3.5" /> },
    { id: 'other', label: 'Other Activities', path: '/activities?tab=other', icon: <Star className="w-3.5 h-3.5" /> }
  ];

  const isActive = (path: string) => {
    const isMatch = location.pathname === path || (path === '/activities' && isActivitiesRoute);
    return isMatch
      ? 'bg-white/10 text-white font-bold rounded-xl'
      : 'text-slate-400 hover:bg-white/5 hover:text-white transition duration-150';
  };

  const adminLinks = [
    { path: '/admin/users', label: 'User Approvals', icon: <Users className="w-4 h-4" /> },
    { path: '/admin/categories', label: 'Business Categories', icon: <Layers className="w-4 h-4" /> }
  ];

  const smeLinks = [
    { path: '/', label: 'SME Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { path: '/profile', label: 'Business Profile', icon: <Briefcase className="w-4 h-4" /> },
    //{ path: '/inventory', label: 'Inventory Catalog', icon: <Package className="w-4 h-4" /> },
    { path: '/activities', label: 'Business Activities', icon: <Activity className="w-4 h-4" /> },
    { path: '/opportunity-hub', label: 'Opportunity Hub', icon: <Target className="w-4 h-4" /> },
    { path: '/trainings', label: 'Virtual Academy', icon: <GraduationCap className="w-4 h-4" /> },
    { path: '/reports', label: 'Financial Reports', icon: <FileBarChart className="w-4 h-4" /> }
  ];

  const aiLinks = [
    { path: '/ai-bot', label: 'Elevata AI Copilot', icon: <Bot className="w-4 h-4" /> },

  ];

  const bankerLinks = [
    { path: '/profile', label: 'Institution Profile', icon: <Building2 className="w-4 h-4" /> },
    { path: '/ai-bot', label: 'AI Banker Copilot', icon: <Bot className="w-4 h-4" /> },
    { path: '/banker', label: 'Bank Officer Panel', icon: <Landmark className="w-4 h-4" /> },
    { path: '/banker/publisher', label: 'Opportunity Publisher', icon: <Megaphone className="w-4 h-4" /> },
    { path: '/banker/trainings', label: 'Training Manager', icon: <GraduationCap className="w-4 h-4" /> },
    { path: '/banker/applications', label: 'Applications', icon: <FileText className="w-4 h-4" /> },
    { path: '/banker/monitoring', label: 'SMEs Monitoring', icon: <LayoutDashboard className="w-4 h-4" /> }
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="z-35 hidden md:flex h-full w-64 flex-col fixed bg-[#0f1724] text-slate-300">
        {/* Logo Section */}
        <div className="border-b border-white/10 bg-[#0f1724] p-5">
          <div className="flex items-center space-x-3">
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-white">
              <img src={logo} alt="Elevata Logo" className="h-9 w-9 object-contain" />
            </div>
            <div>
              <h1 className="font-heading text-sm font-bold leading-none tracking-tight text-white">Elevata</h1>
              <p className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-slate-400">Intelligent Finance</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-4 overflow-y-auto mt-2">
          {/* SME Segment */}
          {user?.role !== 'FINANCIAL_INSTITUTION' && (
            <div>
              <h3 className="mb-2 px-3 text-[9px] font-bold uppercase tracking-widest text-slate-500">SME Workspace</h3>
              <div className="space-y-1">
                {smeLinks.map((link) => {
                  if (link.path === '/activities') {
                    return (
                      <div key={link.path} className="space-y-1">
                        <Link
                          to="/activities"
                          className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-150 ease-in-out text-xs font-semibold ${isActive(link.path)}`}
                        >
                          <div className="flex items-center space-x-3">
                            <span>{link.icon}</span>
                            <span>{link.label}</span>
                          </div>
                        </Link>

                        {/* Nested Subtabs inside Business Activities */}
                        <div className="my-1 ml-3 space-y-0.5 border-l-2 border-white/10 py-1 pl-3">
                          {activitySubtabs.map((sub) => {
                            const isSubActive = isActivitiesRoute && currentActivitySubtab === sub.id;
                            return (
                              <Link
                                key={sub.id}
                                to={sub.path}
                                className={`flex items-center space-x-2.5 rounded-lg px-2.5 py-1.5 text-[11px] transition-all duration-150 ${
                                  isSubActive
                                    ? 'bg-white/10 font-bold text-white'
                                    : 'font-medium text-slate-400 hover:bg-white/5 hover:text-white'
                                }`}
                              >
                                <span className={isSubActive ? 'text-white' : 'text-slate-500'}>{sub.icon}</span>
                                <span>{sub.label}</span>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-150 ease-in-out text-xs font-semibold ${isActive(link.path)}`}
                    >
                      <span>{link.icon}</span>
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* AI Segment */}
          {user?.role !== 'FINANCIAL_INSTITUTION' && (
            <div>
              <h3 className="mb-2 px-3 text-[9px] font-bold uppercase tracking-widest text-slate-500">Advisory & Planning</h3>
              <div className="space-y-1">
                {aiLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-150 ease-in-out text-xs font-semibold ${isActive(link.path)}`}
                  >
                    <span>{link.icon}</span>
                    <span>{link.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Admin Segment */}
          {user?.role === 'ADMIN' && (
            <div>
              <h3 className="mb-2 px-3 text-[9px] font-bold uppercase tracking-widest text-violet-300">Administration</h3>
              <div className="space-y-1">
                {adminLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-150 ease-in-out text-xs font-semibold ${isActive(link.path)}`}
                  >
                    <span>{link.icon}</span>
                    <span>{link.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Banker Segment */}
          {(user?.role === 'ADMIN' || user?.role === 'FINANCIAL_INSTITUTION') && (
            <div>
              <h3 className="mb-2 px-3 text-[9px] font-bold uppercase tracking-widest text-slate-500">Credit Institution</h3>
              <div className="space-y-1">
                {bankerLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-150 ease-in-out text-xs font-semibold ${isActive(link.path)}`}
                  >
                    <span>{link.icon}</span>
                    <span>{link.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </nav>

        {/* Sidebar Info & Reset */}
        {user?.role !== 'FINANCIAL_INSTITUTION' && (
          <div className="space-y-3 border-t border-white/10 p-4">
            {/* Active SME Overview Widget */}
            <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-slate-400">
                <span>Active Subject</span>
                <span className={`h-2 w-2 rounded-full ${
                  activeSme.healthScore >= 80 ? 'bg-emerald-500' : activeSme.healthScore >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                }`} />
              </div>
              <div>
                <span className="block text-xs font-bold leading-tight text-white">{activeSme.name}</span>
                <span className="mt-0.5 block text-[9px] font-semibold text-slate-400">{activeSme.sector} • Score: {activeSme.healthScore}</span>
              </div>
            </div>

            {/* Reset button */}
            <button
              onClick={resetAll}
              className="flex w-full items-center justify-center space-x-2 rounded-xl border border-white/10 bg-white/5 py-2 text-xs font-bold text-slate-200 transition duration-150 hover:bg-white/10 hover:text-white"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Simulations</span>
            </button>
          </div>
        )}
      </aside>

      {/* Mobile Sidebar Overlay */}
      <div
        className={`md:hidden fixed inset-0 z-50 bg-black transition-all duration-300 ${
          isOpen ? 'bg-opacity-50 visible' : 'bg-opacity-0 invisible'
        }`}
        onClick={onClose}
      >
        <aside
          className={`h-full w-64 transform bg-[#0f1724] text-slate-300 transition-transform duration-300 ease-in-out ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Mobile Header */}
          <div className="flex items-center justify-between border-b border-white/10 bg-[#0f1724] p-5">
            <div className="flex items-center space-x-3">
              <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-white">
                <img src={logo} alt="Elevata Logo" className="h-7 w-7 object-contain" />
              </div>
              <div>
                <h1 className="font-heading text-sm font-bold leading-none text-white">Elevata</h1>
                <p className="mt-1 text-[8px] font-semibold uppercase text-slate-400">Financial Intelligence</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-1 text-slate-400 transition hover:bg-white/10 hover:text-white"
              aria-label="Close menu"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Mobile Navigation */}
          <nav className="p-4 space-y-4 overflow-y-auto h-[calc(100%-180px)]">
            {/* SME Segment */}
            {user?.role !== 'FINANCIAL_INSTITUTION' && (
              <div>
                <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 px-3">SME Workspace</h3>
                <div className="space-y-1">
                  {smeLinks.map((link) => {
                    if (link.path === '/activities') {
                      return (
                        <div key={link.path} className="space-y-1">
                          <Link
                            to="/activities"
                            className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold ${isActive(link.path)}`}
                            onClick={onClose}
                          >
                            <span>{link.icon}</span>
                            <span>{link.label}</span>
                          </Link>

                          {/* Mobile Subtabs */}
                          <div className="my-1 ml-3 space-y-0.5 border-l-2 border-white/10 py-1 pl-3">
                            {activitySubtabs.map((sub) => {
                              const isSubActive = isActivitiesRoute && currentActivitySubtab === sub.id;
                              return (
                                <Link
                                  key={sub.id}
                                  to={sub.path}
                                  className={`flex items-center space-x-2.5 rounded-lg px-2 py-1.5 text-[11px] transition-all duration-150 ${
                                    isSubActive
                                      ? 'bg-white/10 font-bold text-white'
                                      : 'font-medium text-slate-400 hover:bg-white/5 hover:text-white'
                                  }`}
                                  onClick={onClose}
                                >
                                  <span className={isSubActive ? 'text-white' : 'text-slate-500'}>{sub.icon}</span>
                                  <span>{sub.label}</span>
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <Link
                        key={link.path}
                        to={link.path}
                        className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold ${isActive(link.path)}`}
                        onClick={onClose}
                      >
                        <span>{link.icon}</span>
                        <span>{link.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* AI Segment */}
            {user?.role !== 'FINANCIAL_INSTITUTION' && (
              <div>
                <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 px-3">Advisory & Planning</h3>
                <div className="space-y-1">
                  {aiLinks.map((link) => (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold ${isActive(link.path)}`}
                      onClick={onClose}
                    >
                      <span>{link.icon}</span>
                      <span>{link.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Admin Segment */}
            {user?.role === 'ADMIN' && (
              <div>
                <h3 className="mb-1.5 px-3 text-[9px] font-bold uppercase tracking-widest text-violet-300">Administration</h3>
                <div className="space-y-1">
                  {adminLinks.map((link) => (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold ${isActive(link.path)}`}
                      onClick={onClose}
                    >
                      <span>{link.icon}</span>
                      <span>{link.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Banker Segment */}
            {(user?.role === 'ADMIN' || user?.role === 'FINANCIAL_INSTITUTION') && (
              <div>
                <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 px-3">Credit Institution</h3>
                <div className="space-y-1">
                  {bankerLinks.map((link) => (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold ${isActive(link.path)}`}
                      onClick={onClose}
                    >
                      <span>{link.icon}</span>
                      <span>{link.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </nav>

          {/* Mobile Footer */}
          {user?.role !== 'FINANCIAL_INSTITUTION' && (
            <div className="space-y-3 border-t border-white/10 bg-[#0f1724] p-4">
              <button
                onClick={() => {
                  resetAll();
                  onClose();
                }}
                className="flex w-full items-center justify-center space-x-2 rounded-lg border border-white/10 bg-white/5 py-2 text-xs font-bold text-slate-200 transition hover:bg-white/10 hover:text-white"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset Simulations</span>
              </button>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
