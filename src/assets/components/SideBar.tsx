import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import logo from '../images/elevata_logo.png';
import {
  RotateCcw,
  ShoppingBag,
  Truck,
  ArrowDownLeft,
  ArrowUpRight,
  Star,
  Phone,
  PieChart,
  Folder,
  MessageSquare,
  Share2,
  Mail,
  CheckSquare,
  Settings,
  Monitor,
  ChevronRight,
  ChevronLeft,
  X,
  Users,
  Layers,
  ShieldCheck
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed?: boolean;
  onCollapse?: () => void;
  onExpand?: () => void;
  onToggleCollapse?: () => void;
}

export default function Sidebar({
  isOpen,
  onClose,
  isCollapsed = true,
  onCollapse,
  onExpand,
  onToggleCollapse
}: SidebarProps) {
  const location = useLocation();
  const { activeSme, resetAll } = useApp();
  const { user } = useAuth();

  // Close sidebar on Escape key for mobile
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
    { id: 'sales', label: 'Sales Book', path: '/activities?tab=sales', icon: <ShoppingBag className="w-3.5 h-3.5" /> },
    { id: 'purchases', label: 'Purchases Book', path: '/activities?tab=purchases', icon: <Truck className="w-3.5 h-3.5" /> },
    { id: 'cash_in', label: 'Cash In Journal', path: '/activities?tab=cash_in', icon: <ArrowDownLeft className="w-3.5 h-3.5" /> },
    { id: 'cash_out', label: 'Cash Out & OPEX', path: '/activities?tab=cash_out', icon: <ArrowUpRight className="w-3.5 h-3.5" /> },
    { id: 'other', label: 'General Journal', path: '/activities?tab=other', icon: <Star className="w-3.5 h-3.5" /> }
  ];

  // Navigation Items modeled after the screenshot icon rail
  const smeNavItems = [
    {
      id: 'hotline',
      path: '/trainings',
      label: 'Virtual Training',
      tooltip: 'Live Training & Communications',
      icon: <Phone className="w-5 h-5" />,
      highlightTop: true
    },
    {
      id: 'dashboard',
      path: '/',
      label: 'SME Analytics Dashboard',
      tooltip: 'Analytics & Overview',
      icon: <PieChart className="w-5 h-5" />
    },
    {
      id: 'activities',
      path: '/activities',
      label: 'Business Activities & Ledger',
      tooltip: 'Accounting Books & Ledger',
      icon: <Folder className="w-5 h-5" />
    },
    {
      id: 'opportunities',
      path: '/opportunity-hub',
      label: 'Opportunity Hub',
      tooltip: 'Market Opportunities & Grants',
      icon: <Share2 className="w-5 h-5" />
    },
    {
      id: 'compliance',
      path: '/trainings',
      label: 'Compliance & Training',
      tooltip: 'Certifications & Training',
      icon: <CheckSquare className="w-5 h-5" />
    },
    {
    id: 'reports',
    path: '/reports',
    label: 'Financial Statements & Reports',
    tooltip: 'Statements & Audit Logs',
    icon: <Mail className="w-5 h-5" />
  },
    {
      id: 'copilot',
      path: '/ai-bot',
      label: 'Elevata AI Copilot',
      tooltip: 'AI Financial Advisor',
      icon: <MessageSquare className="w-5 h-5" />
    }
  ];

  const bankerNavItems = [
    {
      id: 'banker-training',
      path: '/banker/trainings',
      label: 'Training Manager & Sessions',
      tooltip: 'Banker Training Delivery',
      icon: <Phone className="w-5 h-5" />,
      highlightTop: true
    },
    {
      id: 'banker-panel',
      path: '/banker',
      label: 'Credit Institution Panel',
      tooltip: 'Banker Portfolio Overview',
      icon: <PieChart className="w-5 h-5" />
    },
    {
      id: 'applications',
      path: '/banker/applications',
      label: 'Credit Applications',
      tooltip: 'Loan & Grant Underwriting',
      icon: <Folder className="w-5 h-5" />
    },
    {
      id: 'publisher',
      path: '/banker/publisher',
      label: 'Publish Credit Opportunities',
      tooltip: 'Opportunity Management',
      icon: <Share2 className="w-5 h-5" />
    },
    {
      id: 'banker-copilot',
      path: '/ai-bot',
      label: 'AI Banker Copilot',
      tooltip: 'AI Credit Risk Evaluation',
      icon: <MessageSquare className="w-5 h-5" />
    },
    {
      id: 'monitoring',
      path: '/banker/monitoring',
      label: 'SME Monitoring Matrix',
      tooltip: 'Borrower Risk & Health',
      icon: <Monitor className="w-5 h-5" />
    }
  ];

  const adminNavItems = [
    {
      id: 'admin-users',
      path: '/admin/users',
      label: 'User & KYC Management',
      tooltip: 'Manage Users, SMEs & Institutions',
      icon: <Users className="w-5 h-5" />,
      highlightTop: true
    },
    {
      id: 'admin-categories',
      path: '/admin/categories',
      label: 'Business Sectors & Master Data',
      tooltip: 'Business Categories & Sectors',
      icon: <Layers className="w-5 h-5" />
    },
    {
      id: 'admin-banker-panel',
      path: '/banker',
      label: 'Credit Institutions Panel',
      tooltip: 'Institutional Portfolio & Pipelines',
      icon: <PieChart className="w-5 h-5" />
    },
    {
      id: 'admin-applications',
      path: '/banker/applications',
      label: 'Financing Applications',
      tooltip: 'Credit Applications Across Platform',
      icon: <Folder className="w-5 h-5" />
    },
    {
      id: 'admin-publisher',
      path: '/banker/publisher',
      label: 'Credit Opportunities',
      tooltip: 'Published Institutional Products',
      icon: <Share2 className="w-5 h-5" />
    },
    {
      id: 'admin-trainings',
      path: '/banker/trainings',
      label: 'Training Sessions & Manager',
      tooltip: 'Virtual Training Management',
      icon: <Phone className="w-5 h-5" />
    },
    {
      id: 'admin-monitoring',
      path: '/banker/monitoring',
      label: 'SME Monitoring Matrix',
      tooltip: 'Borrower Risk & Health',
      icon: <Monitor className="w-5 h-5" />
    },
    {
      id: 'admin-copilot',
      path: '/ai-bot',
      label: 'Elevata AI Platform Copilot',
      tooltip: 'AI Platform & Risk Assistant',
      icon: <MessageSquare className="w-5 h-5" />
    }
  ];

  const currentNavItems =
    user?.role === 'ADMIN'
      ? adminNavItems
      : user?.role === 'FINANCIAL_INSTITUTION'
      ? bankerNavItems
      : smeNavItems;

  const isItemActive = (path: string) => {
    if (path === '/activities') {
      return isActivitiesRoute;
    }
    if (path === '/') {
      return location.pathname === '/';
    }
    if (path === '/banker') {
      return location.pathname === '/banker';
    }
    if (path === '/admin/users') {
      return location.pathname === '/admin/users';
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <>
      {/* ========================================================================= */}
      {/* DESKTOP SIDEBAR (Icon Rail / Collapsible - matches screenshot) */}
      {/* ========================================================================= */}
      <aside
        onMouseEnter={() => {
          if (isCollapsed) onExpand?.();
        }}
        className={`z-35 hidden md:flex h-full flex-col fixed top-14 bottom-0 bg-[#1a2332] text-slate-300 border-r border-[#2a384c] transition-all duration-200 select-none ${
          isCollapsed ? 'w-[68px]' : 'w-64'
        }`}
      >
        {/* Main Icon Navigation Stack */}
        <nav className="flex-1 px-2.5 py-4 space-y-2 overflow-y-auto overflow-x-hidden">
          {currentNavItems.map((item) => {
            const active = isItemActive(item.path);

            return (
              <div key={item.id} className="relative group">
                <Link
                  to={item.path}
                  onClick={onCollapse}
                  className={`flex items-center gap-3.5 rounded-[6px] transition-all duration-150 ${
                    isCollapsed
                      ? 'h-11 w-11 justify-center mx-auto'
                      : 'h-10 px-3 justify-start'
                  } ${
                    active
                      ? 'bg-[#2998d6] text-white shadow-xs'
                      : 'text-slate-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className="shrink-0">{item.icon}</span>
                  {!isCollapsed && (
                    <span className="truncate text-xs font-semibold">{item.label}</span>
                  )}
                </Link>

                {/* Tooltip in collapsed mode */}
                {isCollapsed && (
                  <div className="pointer-events-none fixed left-[74px] z-50 hidden -translate-y-10 whitespace-nowrap rounded-md bg-[#0f1724] px-2.5 py-1.5 text-xs font-semibold text-white shadow-xl group-hover:block border border-[#2d3d52]">
                    <div className="flex items-center gap-1.5">
                      <span>{item.tooltip}</span>
                    </div>
                  </div>
                )}

                {/* Subtabs for Business Activities in expanded mode */}
                {!isCollapsed && item.id === 'activities' && isActivitiesRoute && (
                  <div className="my-1.5 ml-4 space-y-1 border-l-2 border-white/10 pl-3">
                    {activitySubtabs.map((sub) => {
                      const isSubActive = currentActivitySubtab === sub.id;
                      return (
                        <Link
                          key={sub.id}
                          to={sub.path}
                          onClick={onCollapse}
                          className={`flex items-center space-x-2 rounded-md px-2 py-1 text-[11px] transition-all ${
                            isSubActive
                              ? 'bg-[#2998d6]/20 font-bold text-[#38bdf8]'
                              : 'text-slate-400 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          <span>{sub.icon}</span>
                          <span>{sub.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Bottom Utility Controls (Settings, Reset, Collapse Toggle) */}
        <div className="border-t border-[#2a384c] p-2.5 space-y-1.5 bg-[#17202d]">
          {/* Settings / Profile */}
          <div className="relative group">
            <Link
              to="/profile"
              onClick={onCollapse}
              className={`flex items-center gap-3 rounded-[6px] text-slate-400 hover:bg-white/10 hover:text-white transition-all ${
                isCollapsed
                  ? 'h-10 w-11 justify-center mx-auto'
                  : 'h-9 px-3 justify-start'
              }`}
            >
              <Settings className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span className="text-xs font-semibold">Settings</span>}
            </Link>
            {isCollapsed && (
              <div className="pointer-events-none fixed left-[74px] z-50 hidden -translate-y-8 whitespace-nowrap rounded-md bg-[#0f1724] px-2.5 py-1.5 text-xs font-semibold text-white shadow-xl group-hover:block border border-[#2d3d52]">
                Enterprise Settings
              </div>
            )}
          </div>

          {/* Reset Simulations (SME mode only) */}
          {user?.role === 'BUSINESS' && (
            <div className="relative group">
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Reset all financial simulation records back to demo state?')) {
                    resetAll();
                  }
                }}
                className={`flex items-center gap-3 rounded-[6px] text-slate-400 hover:bg-white/10 hover:text-white transition-all cursor-pointer ${
                  isCollapsed
                    ? 'h-10 w-11 justify-center mx-auto'
                    : 'h-9 px-3 justify-start'
                }`}
              >
                <RotateCcw className="w-4 h-4 shrink-0" />
                {!isCollapsed && <span className="text-xs font-semibold">Reset Data</span>}
              </button>
              {isCollapsed && (
                <div className="pointer-events-none fixed left-[74px] z-50 hidden -translate-y-8 whitespace-nowrap rounded-md bg-[#0f1724] px-2.5 py-1.5 text-xs font-semibold text-white shadow-xl group-hover:block border border-[#2d3d52]">
                  Reset Simulations
                </div>
              )}
            </div>
          )}

          {/* Collapse / Expand Rail Toggle */}
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              title={isCollapsed ? 'Expand navigation drawer' : 'Collapse to icon rail'}
              className={`flex items-center gap-3 rounded-[6px] text-slate-400 hover:bg-white/10 hover:text-white transition-all cursor-pointer ${
                isCollapsed
                  ? 'h-10 w-11 justify-center mx-auto'
                  : 'h-9 px-3 justify-between w-full'
              }`}
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              ) : (
                <>
                  <span className="text-xs font-semibold text-slate-400">Collapse Rail</span>
                  <ChevronLeft className="w-4 h-4 text-slate-400" />
                </>
              )}
            </button>
          )}
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* MOBILE DRAWER SIDEBAR */}
      {/* ========================================================================= */}
      <div
        className={`fixed inset-0 z-50 transition-opacity duration-200 md:hidden ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />
        <aside
          className={`fixed inset-y-0 left-0 w-72 bg-[#1a2332] text-slate-300 shadow-2xl transition-transform duration-200 ease-in-out ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Mobile Header */}
          <div className="flex items-center justify-between border-b border-[#2d3b4e] bg-[#17202d] p-4">
            <div className="flex items-center space-x-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-[#0284c7] to-[#38bdf8] p-1">
                <img src={logo} alt="Elevata" className="h-6 w-6 object-contain" />
              </div>
              <div>
                <h1 className="font-heading text-sm font-bold text-white">ELEVATA 360</h1>
                <p className="text-[9px] font-semibold uppercase text-[#38bdf8]">Intelligent Accounting</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-md p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Mobile Navigation List */}
          <nav className="p-3 space-y-1.5 overflow-y-auto h-[calc(100%-140px)]">
            {currentNavItems.map((item) => {
              const active = isItemActive(item.path);

              return (
                <div key={item.id} className="space-y-1">
                  <Link
                    to={item.path}
                    onClick={onClose}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-md text-xs font-semibold transition-colors ${
                      active
                        ? 'bg-[#2998d6] text-white'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span className="shrink-0">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>

                  {/* Mobile Subtabs */}
                  {item.id === 'activities' && isActivitiesRoute && (
                    <div className="my-1 ml-4 space-y-1 border-l-2 border-white/10 pl-3">
                      {activitySubtabs.map((sub) => {
                        const isSubActive = currentActivitySubtab === sub.id;
                        return (
                          <Link
                            key={sub.id}
                            to={sub.path}
                            onClick={onClose}
                            className={`flex items-center space-x-2 rounded-md px-2.5 py-1.5 text-[11px] transition-colors ${
                              isSubActive
                                ? 'bg-[#2998d6]/20 font-bold text-[#38bdf8]'
                                : 'text-slate-400 hover:bg-white/5 hover:text-white'
                            }`}
                          >
                            <span>{sub.icon}</span>
                            <span>{sub.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Mobile Footer */}
          <div className="border-t border-[#2d3b4e] p-3 space-y-2 bg-[#17202d] text-xs">
            <Link
              to="/profile"
              onClick={onClose}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-slate-300 hover:bg-white/10"
            >
              <Settings className="w-4 h-4" />
              <span>Business Settings</span>
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}
