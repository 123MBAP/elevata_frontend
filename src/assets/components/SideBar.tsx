import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import logo from '../images/elevata_logo.png';
import {
  LayoutDashboard,
  BrainCircuit,
  Building2,
  RotateCcw,
  Package,
  ShoppingBag,
  FileBarChart,
  Cpu,
  Target,
  Sparkles,
  FileText
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
      if (e.key === 'Escape') {
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

  const isActive = (path: string) => {
    return location.pathname === path
      ? 'bg-emerald-50 text-emerald-700 font-bold border-l-4 border-emerald-500 rounded-r-lg'
      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-l-4 border-transparent transition duration-150';
  };

  const smeLinks = [
    { path: '/', label: 'SME Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { path: '/inventory', label: 'Inventory Catalog', icon: <Package className="w-4 h-4" /> },
    { path: '/sales', label: 'Record Sales', icon: <ShoppingBag className="w-4 h-4" /> },
    { path: '/expenses', label: 'Expenses', icon: <FileBarChart className="w-4 h-4" /> },
    { path: '/opportunity-hub', label: 'Opportunity Hub', icon: <Target className="w-4 h-4" /> },
    { path: '/loan-workspace', label: 'Loan Decision Workspace', icon: <BrainCircuit className="w-4 h-4" /> },
    { path: '/reports', label: 'Financial Reports', icon: <FileBarChart className="w-4 h-4" /> }
  ];

  const aiLinks = [
   // { path: '/advisor', label: 'Loan Decision Workspace', icon: <BrainCircuit className="w-4 h-4" /> },
    { path: '/tech-advisor', label: 'Tech Upgrade Advisor', icon: <Cpu className="w-4 h-4" /> },
    // { path: '/business-advisor', label: 'Startup Planner', icon: <Lightbulb className="w-4 h-4" /> }
  ];

  const bankerLinks = [
    { path: '/banker', label: 'Bank Officer Panel', icon: <Building2 className="w-4 h-4" /> },
    { path: '/banker/publisher', label: 'Opportunity Publisher', icon: <Sparkles className="w-4 h-4" /> },
    { path: '/banker/applications', label: 'Applications', icon: <FileText className="w-4 h-4" /> },
    { path: '/banker/monitoring', label: 'SMEs Monitoring', icon: <LayoutDashboard className="w-4 h-4" /> }
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-white text-slate-800 flex-col fixed h-full z-35 border-r border-gray-200">
        {/* Logo Section */}
        <div className="p-5 border-b border-gray-200 bg-white">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 flex items-center justify-center">
              <img src={logo} alt="Elevata Logo" className="w-4.5 h-4.5" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 tracking-tight leading-none font-heading">Elevata</h1>
              <p className="text-[9px] text-slate-500 mt-1 font-semibold tracking-wider uppercase"> Elevating SME Growth Through Intelligent Finance</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-4 overflow-y-auto mt-2">
          {/* SME Segment */}
          <div>
            <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-3">SME Workspace</h3>
            <div className="space-y-1">
              {smeLinks.map((link) => (
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

          {/* AI Segment */}
          <div>
            <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-3">Advisory & Planning</h3>
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

          {/* Banker Segment */}
          {(user?.role === 'ADMIN' || user?.role === 'FINANCIAL_INSTITUTION') && (
            <div>
              <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-3">Credit Institution</h3>
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
        <div className="p-4 border-t border-gray-200 space-y-3">
          {/* Active SME Overview Widget */}
          <div className="p-3 bg-slate-50 border border-gray-200 rounded-xl space-y-2">
            <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold uppercase tracking-wider">
              <span>Active Subject</span>
              <span className={`w-2 h-2 rounded-full ${
                activeSme.healthScore >= 80 ? 'bg-emerald-500' : activeSme.healthScore >= 60 ? 'bg-amber-500' : 'bg-rose-500'
              }`} />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block leading-tight">{activeSme.name}</span>
              <span className="text-[9px] text-slate-500 font-semibold block mt-0.5">{activeSme.sector} • Score: {activeSme.healthScore}</span>
            </div>
          </div>

          {/* Reset button */}
          <button
            onClick={resetAll}
            className="flex items-center justify-center space-x-2 w-full py-2 bg-white hover:bg-slate-50 border border-gray-200 text-slate-600 hover:text-slate-900 rounded-xl text-xs font-bold transition duration-150"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Simulations</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      <div
        className={`md:hidden fixed inset-0 z-50 bg-black transition-all duration-300 ${
          isOpen ? 'bg-opacity-50 visible' : 'bg-opacity-0 invisible'
        }`}
        onClick={onClose}
      >
        <aside
          className={`bg-white w-64 h-full text-slate-800 transform transition-transform duration-300 ease-in-out border-r border-gray-200 ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Mobile Header */}
          <div className="flex justify-between items-center p-5 border-b border-gray-200 bg-white">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <img src={logo} alt="Elevata Logo" className="w-4.5 h-4.5" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-slate-900 leading-none font-heading">Elevata</h1>
                <p className="text-[8px] text-slate-500 mt-1 uppercase font-semibold">Financial Intelligence</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-500 p-1 rounded-full hover:bg-slate-100 transition"
              aria-label="Close menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Mobile Navigation */}
          <nav className="p-4 space-y-4 overflow-y-auto h-[calc(100%-180px)]">
            {/* SME Segment */}
            <div>
              <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 px-3">SME Workspace</h3>
              <div className="space-y-1">
                {smeLinks.map((link) => (
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

            {/* AI Segment */}
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
          <div className="p-4 border-t border-gray-200 space-y-3 bg-slate-50">
            <button
              onClick={() => {
                resetAll();
                onClose();
              }}
              className="flex items-center justify-center space-x-2 w-full py-2 bg-white hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-bold border border-gray-200 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Simulations</span>
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}
