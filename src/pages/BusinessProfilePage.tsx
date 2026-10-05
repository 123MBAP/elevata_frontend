import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Cpu,
  Coins,
  Users,
  Target,
  Save,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  ShieldCheck,
  TrendingUp,
  Edit3,
  X,
  Layers,
  PieChart,
  MessageSquare,
  Search,
  FileText,
  Activity,
  Check,
  Bell,
  Briefcase,
  MapPin,
  DollarSign,
  HelpCircle,
  Sparkles,
  ExternalLink,
  Phone,
  Mail,
  Compass
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';
import { formatRWF } from '../lib/mockData';
import { Card } from '../assets/components/ui/card';
import { Input } from '../assets/components/ui/input';

export interface EquipmentItem {
  id: string;
  name: string;
  category: string;
  value: number;
  condition: string;
}

export type ProfileTab = 'general' | 'equipment' | 'balance' | 'workforce' | 'strategy';

export const EQUIPMENT_CATEGORIES = [
  'Technology & Computers',
  'Storage & Refrigeration',
  'Logistics & Transport',
  'Power & Backup Energy',
  'Manufacturing & Tools',
  'Office Furniture & Fixtures',
  'Agriculture & Processing',
  'Other Assets'
];

export const EQUIPMENT_CONDITIONS = [
  'Operational (Excellent)',
  'Operational (Good)',
  'Needs Maintenance',
  'Standby / Backup',
  'Decommissioned'
];

export default function BusinessProfilePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isFI = user?.role === 'FINANCIAL_INSTITUTION';

  const [activeTab, setActiveTab] = useState<ProfileTab>('general');
  const [isEditing, setIsEditing] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAttentionBanner, setShowAttentionBanner] = useState(true);
  const [showLedgerView, setShowLedgerView] = useState(true);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3800);
  };

  // SME Profile State with smart defaults
  const [smeForm, setSmeForm] = useState({
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
    businessType: '',
    province: '',
    district: '',
    sector: '',
    cell: '',
    village: '',
    knownPlace: '',
    latitude: '',
    longitude: '',
    equipments: [] as EquipmentItem[],
    currentAssets: 0,
    fixedAssets: 0,
    shortTermLiabilities: 0,
    longTermLiabilities: 0,
    monthlyTurnover: 0,
    grossMarginPercentage: 0,
    fullTimeEmployees: 0,
    partTimeEmployees: 0,
    monthlyPayroll: 0,
    keyRoles: '',
    businessStage: 'Growth / Scaling (3+ yrs)',
    targetMarket: '',
    primaryProducts: '',
    operationalChallenges: '',
    strategicGoals: '',
    digitizationLevel: 'Medium (POS & Mobile Money enabled)'
  });

  // Financial Institution Form State
  const [fiForm, setFiForm] = useState({
    institutionName: '',
    representativeName: '',
    email: '',
    phone: '',
    category: 'Commercial Bank',
    operatingScope: 'National (Rwanda)',
    licenseNumber: '',
    website: ''
  });

  // Backup state for cancellation
  const [initialSmeData, setInitialSmeData] = useState<typeof smeForm | null>(null);
  const [initialFiData, setInitialFiData] = useState<typeof fiForm | null>(null);

  // Dynamic business categories from DB
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);

  // Fetch registered user, business details, and categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await apiRequest('/categories');
        if (res?.success && Array.isArray(res.data?.categories)) {
          const names = res.data.categories
            .map((category: { businessType?: string; cat_name?: string }) => category.businessType || category.cat_name)
            .filter(Boolean) as string[];
          setAvailableCategories(Array.from(new Set(names)));
        }
      } catch (error) {
        console.warn('Unable to load business categories:', error);
      }
    };
    loadCategories();

    const loadProfileData = async () => {
      try {
        if (isFI) {
          const res = await apiRequest('/users/profile');
          if (res.success && res.data && res.data.user) {
            const u = res.data.user;
            const fi = u.financialInstitution || {};
            const loadedFi = {
              institutionName: fi.institutionName || '',
              representativeName: fi.representativeName || '',
              email: u.email || '',
              phone: u.phone || '',
              category: fi.category || 'Commercial Bank',
              operatingScope: fi.operatingScope || 'National (Rwanda)',
              licenseNumber: fi.licenseNumber || '',
              website: fi.website || ''
            };
            setFiForm(loadedFi);
            setInitialFiData(loadedFi);
          }
        } else if (!isAdmin) {
          // SME user
          const res = await apiRequest('/business/me');
          if (res.success && res.data && res.data.business) {
            const b = res.data.business;
            const op = b.operational || {};

            const loadedSme = {
              businessName: b.businessName || '',
              ownerName: b.ownerName || '',
              email: user?.email || '',
              phone: user?.phone || '',
              businessType: b.businessType || '',
              province: b.province || '',
              district: b.district || '',
              sector: b.sector || '',
              cell: b.cell || '',
              village: b.village || '',
              knownPlace: b.knownPlace || '',
              latitude: b.latitude ? String(b.latitude) : '',
              longitude: b.longitude ? String(b.longitude) : '',
              equipments: Array.isArray(op.equipments) ? op.equipments : [],
              currentAssets: op.currentAssets ?? 0,
              fixedAssets: op.fixedAssets ?? 0,
              shortTermLiabilities: op.shortTermLiabilities ?? 0,
              longTermLiabilities: op.longTermLiabilities ?? 0,
              monthlyTurnover: op.monthlyTurnover ?? 0,
              grossMarginPercentage: op.grossMarginPercentage ?? 0,
              fullTimeEmployees: op.fullTimeEmployees ?? 0,
              partTimeEmployees: op.partTimeEmployees ?? 0,
              monthlyPayroll: op.monthlyPayroll ?? 0,
              keyRoles: op.roles ? (Array.isArray(op.roles) ? op.roles.join(', ') : op.roles) : '',
              businessStage: op.businessStage || 'Growth / Scaling (3+ yrs)',
              targetMarket: op.targetMarket || '',
              primaryProducts: op.primaryProducts || '',
              operationalChallenges: op.operationalChallenges || '',
              strategicGoals: op.strategicGoals || '',
              digitizationLevel: op.digitizationLevel || 'Medium (POS & Mobile Money enabled)'
            };

            setSmeForm(loadedSme);
            setInitialSmeData(loadedSme);
          }
        }
      } catch (error: unknown) {
        console.error('Failed to load profile details:', error);
      }
    };

    if (user) {
      loadProfileData();
    }
  }, [user, isFI, isAdmin]);

  // Derived financial calculations for SME
  const totalEquipmentsValue = smeForm.equipments.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
  const totalAssets = Number(smeForm.currentAssets || 0) + Number(smeForm.fixedAssets || 0);
  const totalLiabilities = Number(smeForm.shortTermLiabilities || 0) + Number(smeForm.longTermLiabilities || 0);
  const ownerCapital = totalAssets - totalLiabilities;
  const totalEmployees = Number(smeForm.fullTimeEmployees || 0) + Number(smeForm.partTimeEmployees || 0);

  // Equipment handlers
  const handleAddEquipment = () => {
    const newItem: EquipmentItem = {
      id: `eq_${Date.now()}`,
      name: '',
      category: 'Technology & Computers',
      value: 0,
      condition: 'Operational (Good)'
    };
    setSmeForm((prev) => ({
      ...prev,
      equipments: [...prev.equipments, newItem]
    }));
  };

  const handleRemoveEquipment = (id: string) => {
    setSmeForm((prev) => ({
      ...prev,
      equipments: prev.equipments.filter((item) => item.id !== id)
    }));
  };

  const handleEquipmentChange = (id: string, field: keyof EquipmentItem, value: any) => {
    setSmeForm((prev) => ({
      ...prev,
      equipments: prev.equipments.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleCancelEdit = () => {
    if (isFI && initialFiData) {
      setFiForm(initialFiData);
    } else if (initialSmeData) {
      setSmeForm(initialSmeData);
    }
    showToast('Changes discarded.');
  };

  // Submit profile updates
  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);

    try {
      if (isFI) {
        await apiRequest('/financial-institution/profile', {
          method: 'PUT',
          body: JSON.stringify(fiForm)
        });
        setInitialFiData({ ...fiForm });
        showToast('Financial Institution profile updated successfully!');
      } else {
        await apiRequest('/business/profile', {
          method: 'PUT',
          body: JSON.stringify({
            businessName: smeForm.businessName,
            ownerName: smeForm.ownerName,
            businessType: smeForm.businessType,
            phone: smeForm.phone,
            province: smeForm.province,
            district: smeForm.district,
            sector: smeForm.sector,
            cell: smeForm.cell,
            village: smeForm.village,
            knownPlace: smeForm.knownPlace,
            latitude: Number(smeForm.latitude) || 0,
            longitude: Number(smeForm.longitude) || 0,
            operational: {
              equipments: smeForm.equipments,
              totalEquipmentValue: totalEquipmentsValue,
              currentAssets: smeForm.currentAssets,
              fixedAssets: smeForm.fixedAssets,
              totalAssets,
              shortTermLiabilities: smeForm.shortTermLiabilities,
              longTermLiabilities: smeForm.longTermLiabilities,
              totalLiabilities,
              ownerCapital,
              monthlyTurnover: smeForm.monthlyTurnover,
              annualRevenue: Number(smeForm.monthlyTurnover) * 12,
              grossMarginPercentage: smeForm.grossMarginPercentage,
              fullTimeEmployees: smeForm.fullTimeEmployees,
              partTimeEmployees: smeForm.partTimeEmployees,
              totalEmployees,
              monthlyPayroll: smeForm.monthlyPayroll,
              roles: smeForm.keyRoles,
              businessStage: smeForm.businessStage,
              targetMarket: smeForm.targetMarket,
              primaryProducts: smeForm.primaryProducts,
              operationalChallenges: smeForm.operationalChallenges,
              strategicGoals: smeForm.strategicGoals,
              digitizationLevel: smeForm.digitizationLevel
            }
          })
        });
        setInitialSmeData({ ...smeForm });
        showToast('Business Profile & Financial Ledger saved successfully!');
      }
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Failed to save profile. Please check the fields and try again.';
      showToast(errMsg, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Tabs Configuration for Folder Bar
  const tabsConfig = [
    {
      id: 'general' as ProfileTab,
      label: 'General & Registry',
      icon: <Building2 className="w-4 h-4" />,
      count: smeForm.businessName ? 1 : 0,
      color: 'text-emerald-600'
    },
    {
      id: 'equipment' as ProfileTab,
      label: 'Machinery & Equipment',
      icon: <Cpu className="w-4 h-4" />,
      count: smeForm.equipments.length,
      color: 'text-blue-600'
    },
    {
      id: 'balance' as ProfileTab,
      label: 'Balance Sheet & Capital',
      icon: <Coins className="w-4 h-4" />,
      count: totalAssets > 0 ? 4 : 0,
      color: 'text-teal-600'
    },
    {
      id: 'workforce' as ProfileTab,
      label: 'Workforce & Payroll',
      icon: <Users className="w-4 h-4" />,
      count: totalEmployees,
      color: 'text-amber-600'
    },
    {
      id: 'strategy' as ProfileTab,
      label: 'Strategy & Intelligence',
      icon: <Target className="w-4 h-4" />,
      count: 5,
      color: 'text-purple-600'
    }
  ];

  // Ledger Search & Filter
  const [ledgerFilter, setLedgerFilter] = useState<'all' | 'assets' | 'liabilities' | 'equipments' | 'workforce'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Structured Audit Ledger Items
  const auditLedgerItems = [
    {
      id: 'prof-name',
      section: 'General Registry',
      category: 'Identity',
      type: 'assets',
      item: 'Enterprise Legal Name',
      value: smeForm.businessName || '—',
      amount: 0,
      status: smeForm.businessName ? 'Verified' : 'Pending',
      notes: `${smeForm.businessType || 'General Enterprise'} | Registered under ${smeForm.ownerName || 'Managing Director'}`
    },
    {
      id: 'prof-loc',
      section: 'General Registry',
      category: 'Location',
      type: 'assets',
      item: 'Operating Address',
      value: `${smeForm.district || 'Kigali'}, ${smeForm.province || 'Rwanda'}`,
      amount: 0,
      status: smeForm.district ? 'Verified' : 'Pending',
      notes: `${smeForm.sector} / ${smeForm.cell} / ${smeForm.village} | Landmark: ${smeForm.knownPlace || 'None'}`
    },
    {
      id: 'prof-ca',
      section: 'Balance Sheet',
      category: 'Current Assets',
      type: 'assets',
      item: 'Current Assets (Cash, Stock, Receivables)',
      value: 'Short-term Liquidity',
      amount: Number(smeForm.currentAssets || 0),
      status: 'Audited',
      notes: 'Available cash balance, current inventory, and active customer receivables'
    },
    {
      id: 'prof-fa',
      section: 'Balance Sheet',
      category: 'Fixed Assets',
      type: 'assets',
      item: 'Fixed Assets & Premises',
      value: 'Long-term Capital',
      amount: Number(smeForm.fixedAssets || 0),
      status: 'Audited',
      notes: 'Industrial equipment, machinery, motor vehicles, and physical infrastructure'
    },
    {
      id: 'prof-stl',
      section: 'Balance Sheet',
      category: 'Short-term Liabilities',
      type: 'liabilities',
      item: 'Short-term Liabilities (Trade Payables)',
      value: 'Short-term Obligations',
      amount: Number(smeForm.shortTermLiabilities || 0),
      status: 'Audited',
      notes: 'Supplier invoices due within 90 days, vendor credit lines, and unpaid utilities'
    },
    {
      id: 'prof-ltl',
      section: 'Balance Sheet',
      category: 'Long-term Liabilities',
      type: 'liabilities',
      item: 'Long-term Liabilities (Term Loans)',
      value: 'Debt Facilities',
      amount: Number(smeForm.longTermLiabilities || 0),
      status: 'Audited',
      notes: 'Commercial bank debt, equipment financing mortgages, and long-term credit lines'
    },
    {
      id: 'prof-turnover',
      section: 'Operating Performance',
      category: 'Revenue',
      type: 'assets',
      item: 'Monthly Operating Turnover',
      value: 'Gross Sales Velocity',
      amount: Number(smeForm.monthlyTurnover || 0),
      status: 'Audited',
      notes: `Annualized Projected Revenue: ${formatRWF(Number(smeForm.monthlyTurnover || 0) * 12)} (${smeForm.grossMarginPercentage}% Gross Margin)`
    },
    {
      id: 'prof-payroll',
      section: 'Workforce & Payroll',
      category: 'Operational Cost',
      type: 'workforce',
      item: 'Monthly Staff Payroll',
      value: `${totalEmployees} Personnel (${smeForm.fullTimeEmployees} Full-time, ${smeForm.partTimeEmployees} Casual)`,
      amount: Number(smeForm.monthlyPayroll || 0),
      status: 'Audited',
      notes: `Key Roles: ${smeForm.keyRoles || 'Operational Staff'}`
    },
    ...smeForm.equipments.map((eq, idx) => ({
      id: `eq-item-${eq.id || idx}`,
      section: 'Machinery & Equipment',
      category: eq.category || 'Machinery',
      type: 'equipments',
      item: eq.name || `Equipment #${idx + 1}`,
      value: eq.condition || 'Operational',
      amount: Number(eq.value || 0),
      status: 'Logged',
      notes: `Asset Category: ${eq.category} | Condition: ${eq.condition}`
    }))
  ];

  const filteredAuditItems = auditLedgerItems.filter((item) => {
    const matchesFilter = ledgerFilter === 'all' || item.type === ledgerFilter;
    const matchesSearch =
      item.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.section.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification Feedback */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-20 right-6 z-50 text-white text-xs px-4 py-3 rounded-xl shadow-xl flex items-center space-x-2 border ${
              toastMessage.type === 'error'
                ? 'bg-rose-700 border-rose-500'
                : 'bg-emerald-700 border-emerald-500'
            }`}
          >
            {toastMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-200 shrink-0" />
            ) : (
              <CheckCircle className="w-4 h-4 text-emerald-200 shrink-0" />
            )}
            <span className="font-medium">{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 1. TOP ATTENTION NOTIFICATION BANNER (Matching BusinessActivities) */}
      {/* ========================================================================= */}
      {showAttentionBanner && (
        <div className="flex items-center justify-between rounded-[4px] bg-[#ffa834] px-3.5 sm:px-4 py-2 text-white shadow-xs transition-all">
          <div className="flex items-center gap-2 sm:gap-2.5 text-xs sm:text-[13px] font-semibold select-none">
            <Bell className="w-4 h-4 shrink-0 text-white animate-pulse" />
            <span className="font-bold">Business Intelligence & Profile Management:</span>
            <span>
              {isAdmin
                ? 'Platform governance, KYC verification controls, category master, and institutional supervision.'
                : isFI
                ? 'Accreditation, underwriting guidelines, and regulatory profile active.'
                : 'Keep your operational machinery, balance sheet, and workforce parameters updated for instant bank credit scoring.'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowLedgerView(!showLedgerView)}
              title="Toggle Profile Audit Ledger"
              className="hidden sm:flex items-center justify-center h-7 px-2.5 rounded-[4px] bg-[#2998d6] hover:bg-[#1f85be] text-white text-xs font-bold transition-colors shadow-xs cursor-pointer gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{showLedgerView ? 'Hide Audit View' : 'Audit View'}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowAttentionBanner(false)}
              className="rounded-full p-1 text-white/80 hover:bg-white/20 hover:text-white transition-colors cursor-pointer"
              aria-label="Dismiss banner"
              title="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. ADMIN PROFILE VIEW & MANAGEMENT DASHBOARD */}
      {/* ========================================================================= */}
      {isAdmin ? (
        <div className="space-y-6">
          {/* Admin Quick Launch Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/admin/users"
              className="accounting-card p-5 hover:border-[#2998d6] hover:shadow-md transition group block bg-white"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-[4px] bg-sky-50 text-[#2998d6] flex items-center justify-center font-bold group-hover:bg-[#2998d6] group-hover:text-white transition">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-sky-600 uppercase tracking-wider bg-sky-50 px-2 py-0.5 rounded border border-sky-100 font-mono">
                  Primary
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#2998d6] transition">User & KYC Management</h3>
              <p className="text-xs text-slate-500 mt-1">Review registrations, verify documents, and activate platform accounts.</p>
            </Link>

            <Link
              to="/admin/categories"
              className="accounting-card p-5 hover:border-[#2998d6] hover:shadow-md transition group block bg-white"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-[4px] bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold group-hover:bg-indigo-600 group-hover:text-white transition">
                  <Layers className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 font-mono">
                  Taxonomy
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition">Business Sectors & Master</h3>
              <p className="text-xs text-slate-500 mt-1">Configure business types, activity categories, and opportunity tags.</p>
            </Link>

            <Link
              to="/banker"
              className="accounting-card p-5 hover:border-[#2998d6] hover:shadow-md transition group block bg-white"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-[4px] bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold group-hover:bg-emerald-600 group-hover:text-white transition">
                  <PieChart className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 font-mono">
                  Pipeline
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition">Credit Institution Panel</h3>
              <p className="text-xs text-slate-500 mt-1">Audit institutional lending portfolios and active financing applications.</p>
            </Link>

            <Link
              to="/ai-bot"
              className="accounting-card p-5 hover:border-[#2998d6] hover:shadow-md transition group block bg-white"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-[4px] bg-purple-50 text-purple-600 flex items-center justify-center font-bold group-hover:bg-purple-600 group-hover:text-white transition">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider bg-purple-50 px-2 py-0.5 rounded border border-purple-100 font-mono">
                  AI Copilot
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-purple-600 transition">Admin AI Intelligence</h3>
              <p className="text-xs text-slate-500 mt-1">Execute platform compliance checks and review ecosystem insights.</p>
            </Link>
          </div>

          {/* Admin Credentials & Capability Controls Card */}
          <div className="accounting-card p-5 sm:p-7 border-[#cbd5e1]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#e2e8f0]">
              <div>
                <h2 className="text-xl sm:text-2xl font-normal text-[#1e293b] font-heading flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#2998d6]" />
                  <span>System Administration Credentials & Governance</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Authorized administrative session parameters and enterprise capability controls.
                </p>
              </div>
              <span className="px-3 py-1 rounded-[4px] bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold font-mono self-start sm:self-auto flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                SUPERUSER ROLE
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <div>
                <label className="accounting-label">Official Administrator Email</label>
                <input
                  type="text"
                  value={user?.email || 'admin@elevata.com'}
                  readOnly
                  className="accounting-input w-full bg-slate-50 font-mono font-bold"
                />
              </div>

              <div>
                <label className="accounting-label">Contact Phone Number</label>
                <input
                  type="text"
                  value={user?.phone || '+250 780 000 000'}
                  readOnly
                  className="accounting-input w-full bg-slate-50 font-mono"
                />
              </div>

              <div>
                <label className="accounting-label">System Access Level</label>
                <input
                  type="text"
                  value="ROLE_ADMIN (Full Platform Governance & Underwriting Supervision)"
                  readOnly
                  className="accounting-input w-full bg-purple-50 text-purple-800 font-mono font-bold border-purple-200"
                />
              </div>

              <div>
                <label className="accounting-label">Account Security Status</label>
                <div className="accounting-input w-full bg-emerald-50 text-emerald-800 font-bold border-emerald-200 flex items-center gap-2 text-xs">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Active & Verified Enterprise Master Key</span>
                </div>
              </div>
            </div>

            {/* Platform Scope Checklist */}
            <div className="pt-5 mt-5 border-t border-[#e2e8f0]">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                Enabled Administrative Governance Scope
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                <div className="flex items-center gap-2 p-2 rounded bg-slate-50 border border-slate-200">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>SME & Financial Institution KYC Approvals & Verification</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded bg-slate-50 border border-slate-200">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Business Sector & Subsector Taxonomy Master Data CRUD</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded bg-slate-50 border border-slate-200">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Institutional Financing Opportunity & Grant Supervision</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded bg-slate-50 border border-slate-200">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Cross-Platform AI Financial Statement & Underwriting Audits</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : isFI ? (

        /* ========================================================================= */
        /* 3. FINANCIAL INSTITUTION PROFILE (Accounting Style) */
        /* ========================================================================= */
        <div className="space-y-6">
          <div className="accounting-card p-5 sm:p-7 border-[#cbd5e1]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#e2e8f0]">
              <div>
                <h2 className="text-xl sm:text-2xl font-normal text-[#1e293b] font-heading flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#2998d6]" />
                  <span>Financial Institution Accreditation & Profile</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Official registration credentials, underwriting scope, and regulatory license parameters.
                </p>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="accounting-btn-primary"
                >
                  <Check className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Save Institution Profile'}</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="accounting-label">
                    Institution Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={fiForm.institutionName}
                    onChange={(e) => setFiForm({ ...fiForm, institutionName: e.target.value })}
                    placeholder="e.g. Bank of Kigali Plc / Inkomoko MFI"
                    required
                    className="accounting-input w-full font-bold"
                  />
                </div>

                <div>
                  <label className="accounting-label">
                    Representative / Lead Officer Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={fiForm.representativeName}
                    onChange={(e) => setFiForm({ ...fiForm, representativeName: e.target.value })}
                    placeholder="e.g. Jean Damascene Hakizimana"
                    required
                    className="accounting-input w-full"
                  />
                </div>

                <div>
                  <label className="accounting-label">
                    Institution Category <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={fiForm.category}
                    onChange={(e) => setFiForm({ ...fiForm, category: e.target.value })}
                    className="accounting-select w-full"
                  >
                    <option value="Commercial Bank">Commercial Bank</option>
                    <option value="Microfinance Institution (MFI)">Microfinance Institution (MFI)</option>
                    <option value="SACCO / Credit Union">SACCO / Credit Union</option>
                    <option value="Development Bank">Development Bank</option>
                    <option value="Fintech & Alternative Lender">Fintech & Alternative Lender</option>
                  </select>
                </div>

                <div>
                  <label className="accounting-label">Operating Scope / Territory</label>
                  <select
                    value={fiForm.operatingScope}
                    onChange={(e) => setFiForm({ ...fiForm, operatingScope: e.target.value })}
                    className="accounting-select w-full"
                  >
                    <option value="National (Rwanda)">National (Rwanda)</option>
                    <option value="Regional (East Africa)">Regional (East Africa)</option>
                    <option value="Kigali Urban District">Kigali Urban District</option>
                    <option value="Rural Provinces">Rural Provinces</option>
                  </select>
                </div>

                <div>
                  <label className="accounting-label">Central Bank (BNR) License Number</label>
                  <input
                    type="text"
                    value={fiForm.licenseNumber}
                    onChange={(e) => setFiForm({ ...fiForm, licenseNumber: e.target.value })}
                    placeholder="e.g. BNR/MFI/LIC/2024-092"
                    className="accounting-input w-full font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="accounting-label">Official Website URL</label>
                  <input
                    type="text"
                    value={fiForm.website}
                    onChange={(e) => setFiForm({ ...fiForm, website: e.target.value })}
                    placeholder="https://www.institution.rw"
                    className="accounting-input w-full"
                  />
                </div>

                <div>
                  <label className="accounting-label">Official Registered Email</label>
                  <input
                    type="email"
                    value={fiForm.email}
                    onChange={(e) => setFiForm({ ...fiForm, email: e.target.value })}
                    placeholder="credit@institution.rw"
                    className="accounting-input w-full"
                  />
                </div>

                <div>
                  <label className="accounting-label">Institutional Contact Phone</label>
                  <input
                    type="text"
                    value={fiForm.phone}
                    onChange={(e) => setFiForm({ ...fiForm, phone: e.target.value })}
                    placeholder="+250 788 000 000"
                    className="accounting-input w-full font-mono"
                  />
                </div>

                <div>
                  <label className="accounting-label">Accreditation Status</label>
                  <div className="accounting-input w-full bg-emerald-50 text-emerald-800 font-bold border-emerald-200 flex items-center gap-2 text-xs">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Verified Lending Partner</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#e2e8f0]">
                <button
                  type="submit"
                  disabled={saving}
                  className="accounting-btn-primary"
                >
                  <Check className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Save Profile'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="accounting-btn-secondary"
                >
                  <X className="w-4 h-4" />
                  <span>Discard</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (

        /* ========================================================================= */
        /* 4. SME BUSINESS PROFILE (Full Redesign Matching BusinessActivities.tsx) */
        /* ========================================================================= */
        <div className="space-y-6">
          {/* Quick Metrics Bar (Top Snapshot Cards) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="accounting-card p-4 bg-white border-[#cbd5e1] hover:border-[#2998d6] transition shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[4px] bg-sky-50 text-[#2998d6] flex items-center justify-center font-bold shrink-0 border border-sky-100">
                  <Coins className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Total Asset Base</p>
                  <p className="text-sm sm:text-base font-bold text-slate-900 font-mono truncate">
                    {formatRWF(totalAssets)}
                  </p>
                </div>
              </div>
            </div>

            <div className="accounting-card p-4 bg-white border-[#cbd5e1] hover:border-[#2998d6] transition shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[4px] bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0 border border-emerald-100">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Owner Net Equity</p>
                  <p className="text-sm sm:text-base font-bold text-emerald-700 font-mono truncate">
                    {formatRWF(ownerCapital)}
                  </p>
                </div>
              </div>
            </div>

            <div className="accounting-card p-4 bg-white border-[#cbd5e1] hover:border-[#2998d6] transition shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[4px] bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0 border border-blue-100">
                  <Cpu className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Machinery Valuation</p>
                  <p className="text-sm sm:text-base font-bold text-slate-900 font-mono truncate">
                    {formatRWF(totalEquipmentsValue)}
                  </p>
                </div>
              </div>
            </div>

            <div className="accounting-card p-4 bg-white border-[#cbd5e1] hover:border-[#2998d6] transition shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[4px] bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0 border border-amber-100">
                  <Users className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Active Workforce</p>
                  <p className="text-sm sm:text-base font-bold text-slate-900 font-mono truncate">
                    {totalEmployees} Personnel
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* MAIN ACCOUNTING FOLDER TAB CARD CONTAINER */}
          <div className="relative">
            {/* EYE-CATCHING FOLDER TABS BAR (Connected Directly to Card Body) */}
            <div className="flex items-end overflow-x-auto scrollbar-none z-10 relative space-x-1 sm:space-x-1.5 -mb-[1px]">
              {tabsConfig.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`group relative flex items-center gap-2 sm:gap-2.5 px-4 sm:px-6 py-2.5 sm:py-3 rounded-t-[6px] text-xs sm:text-sm transition-all duration-150 cursor-pointer whitespace-nowrap select-none border-t border-x ${
                      isActive
                        ? 'bg-white text-slate-900 font-bold border-[#cbd5e1] border-b-white border-b-2 shadow-xs z-20 -mb-[1px] pt-3 sm:pt-3.5 pb-2.5 sm:pb-3 ring-0'
                        : 'bg-[#f1f5f9] hover:bg-[#e4eaf2] text-[#475569] font-medium border-[#cbd5e1] border-b-[#cbd5e1] hover:text-[#0f172a]'
                    }`}
                  >
                    {/* Active Indicator Accent Top Strip */}
                    {isActive && (
                      <span className="absolute top-0 left-0 right-0 h-[3px] bg-[#2998d6] rounded-t-[6px]" />
                    )}

                    <span className={`shrink-0 transition-transform group-hover:scale-110 ${isActive ? tab.color : 'text-slate-400 group-hover:text-slate-600'}`}>
                      {tab.icon}
                    </span>

                    <span className="tracking-tight">{tab.label}</span>

                    {/* Count Badge */}
                    <span
                      className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold transition-colors ${
                        isActive
                          ? 'bg-[#2998d6] text-white shadow-xs'
                          : 'bg-[#cbd5e1] text-[#334155] group-hover:bg-[#94a3b8] group-hover:text-white'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* MAIN WHITE CARD CONTAINER */}
            <div className="accounting-card p-5 sm:p-7 relative z-0 border-[#cbd5e1] rounded-t-none">
              {/* Card Header Title & Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#e2e8f0]">
                <div>
                  <h2 className="text-xl sm:text-2xl font-normal text-[#1e293b] font-heading">
                    {activeTab === 'general' && 'Enterprise Identity, Governance & Administrative Location'}
                    {activeTab === 'equipment' && 'Machinery, Operational Assets & Equipment Valuation'}
                    {activeTab === 'balance' && 'Balance Sheet, Asset Structure & Capitalization'}
                    {activeTab === 'workforce' && 'Human Capital, Organizational Roles & Monthly Payroll'}
                    {activeTab === 'strategy' && 'Business Strategy, Target Segments & AI Readiness'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {activeTab === 'general' && 'Manage legal registry parameters, contact intelligence, and geographical coordinates.'}
                    {activeTab === 'equipment' && 'Log tangible machinery, asset condition, and replacement valuation.'}
                    {activeTab === 'balance' && 'Maintain audited asset balances, term liabilities, and owner capital for underwriting.'}
                    {activeTab === 'workforce' && 'Track payroll commitments, permanent workforce, and key organizational roles.'}
                    {activeTab === 'strategy' && 'Articulate market positioning, digitization maturity, and expansion targets.'}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setShowLedgerView(!showLedgerView)}
                    className="accounting-btn-secondary"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>{showLedgerView ? 'Hide Audit Ledger' : 'View Audit Ledger'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveProfile()}
                    disabled={saving}
                    className="accounting-btn-primary"
                  >
                    <Check className="w-4 h-4" />
                    <span>{saving ? 'Saving...' : 'Save Profile'}</span>
                  </button>
                </div>
              </div>

              {/* Top 3 Solid Cyan Select Dropdowns (Matching BusinessActivities Layout) */}
              <div className="pt-3 pb-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mb-4">
                  <div>
                    <label className="accounting-label">Profile Intelligence Section</label>
                    <select
                      value={activeTab}
                      onChange={(e) => setActiveTab(e.target.value as ProfileTab)}
                      className="accounting-select w-full"
                    >
                      <option value="general">1. General & Location Registry</option>
                      <option value="equipment">2. Machinery & Equipment Assets</option>
                      <option value="balance">3. Balance Sheet & Capital Structure</option>
                      <option value="workforce">4. Workforce & Monthly Payroll</option>
                      <option value="strategy">5. Strategy & AI Categorization</option>
                    </select>
                  </div>

                  <div>
                    <label className="accounting-label">Business Sector / Classification</label>
                    <select
                      value={smeForm.businessType}
                      onChange={(e) => setSmeForm({ ...smeForm, businessType: e.target.value })}
                      className="accounting-select w-full"
                    >
                      <option value="">-- Select Registered Sector --</option>
                      {availableCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                      {smeForm.businessType && !availableCategories.includes(smeForm.businessType) && (
                        <option value={smeForm.businessType}>{smeForm.businessType}</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="accounting-label">KYC & Credit Verification Tier</label>
                    <select
                      value="Tier-1 (Verified SME Profile)"
                      className="accounting-select w-full opacity-90 cursor-default"
                      disabled
                    >
                      <option value="Tier-1 (Verified SME Profile)">Tier-1 Verified SME Account</option>
                      <option value="Underwriting Ready">Underwriting & Credit Ready</option>
                      <option value="Audit Cleared">Regulatory Audit Cleared</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* ===================================================================== */}
              {/* TAB 1: GENERAL & LOCATION FORM */}
              {/* ===================================================================== */}
              {activeTab === 'general' && (
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                    {/* Column 1: Identity */}
                    <div className="space-y-3">
                      <div>
                        <label className="accounting-label">
                          Enterprise Registered Name <span className="text-rose-600">*</span>
                        </label>
                        <input
                          type="text"
                          value={smeForm.businessName}
                          onChange={(e) => setSmeForm({ ...smeForm, businessName: e.target.value })}
                          placeholder="e.g. Kigali Grain Processors Ltd"
                          required
                          className="accounting-input w-full font-bold"
                        />
                      </div>

                      <div>
                        <label className="accounting-label">
                          Owner / Managing Director <span className="text-rose-600">*</span>
                        </label>
                        <input
                          type="text"
                          value={smeForm.ownerName}
                          onChange={(e) => setSmeForm({ ...smeForm, ownerName: e.target.value })}
                          placeholder="e.g. Patrick Mugabo"
                          required
                          className="accounting-input w-full"
                        />
                      </div>

                      <div>
                        <label className="accounting-label">Primary Sector Category</label>
                        <select
                          value={smeForm.businessType}
                          onChange={(e) => setSmeForm({ ...smeForm, businessType: e.target.value })}
                          className="accounting-select w-full"
                        >
                          <option value="">-- Choose Industry Sector --</option>
                          {availableCategories.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                          {smeForm.businessType && !availableCategories.includes(smeForm.businessType) && (
                            <option value={smeForm.businessType}>{smeForm.businessType}</option>
                          )}
                        </select>
                      </div>
                    </div>

                    {/* Column 2: Contact Details */}
                    <div className="space-y-3">
                      <div>
                        <label className="accounting-label">Official Registered Email</label>
                        <input
                          type="email"
                          value={smeForm.email}
                          readOnly
                          className="accounting-input w-full bg-slate-50 text-slate-600"
                        />
                      </div>

                      <div>
                        <label className="accounting-label">
                          Primary Contact Phone <span className="text-rose-600">*</span>
                        </label>
                        <input
                          type="text"
                          value={smeForm.phone}
                          onChange={(e) => setSmeForm({ ...smeForm, phone: e.target.value })}
                          placeholder="+250 788 123 456"
                          required
                          className="accounting-input w-full font-mono"
                        />
                      </div>

                      <div>
                        <label className="accounting-label">Province & District</label>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Province (e.g. Kigali)"
                            value={smeForm.province}
                            onChange={(e) => setSmeForm({ ...smeForm, province: e.target.value })}
                            className="accounting-input w-full"
                          />
                          <input
                            type="text"
                            placeholder="District (e.g. Nyarugenge)"
                            value={smeForm.district}
                            onChange={(e) => setSmeForm({ ...smeForm, district: e.target.value })}
                            className="accounting-input w-full"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Column 3: Local Administrative Units */}
                    <div className="space-y-3">
                      <div>
                        <label className="accounting-label">Sector, Cell, Village</label>
                        <div className="grid grid-cols-3 gap-2">
                          <input
                            type="text"
                            placeholder="Sector"
                            value={smeForm.sector}
                            onChange={(e) => setSmeForm({ ...smeForm, sector: e.target.value })}
                            className="accounting-input w-full"
                          />
                          <input
                            type="text"
                            placeholder="Cell"
                            value={smeForm.cell}
                            onChange={(e) => setSmeForm({ ...smeForm, cell: e.target.value })}
                            className="accounting-input w-full"
                          />
                          <input
                            type="text"
                            placeholder="Village"
                            value={smeForm.village}
                            onChange={(e) => setSmeForm({ ...smeForm, village: e.target.value })}
                            className="accounting-input w-full"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="accounting-label">Landmark / Known Place Location</label>
                        <input
                          type="text"
                          value={smeForm.knownPlace}
                          onChange={(e) => setSmeForm({ ...smeForm, knownPlace: e.target.value })}
                          placeholder="e.g. Near CHUK Hospital or Opposite Market Hub"
                          className="accounting-input w-full"
                        />
                      </div>

                      <div>
                        <label className="accounting-label">GPS Coordinates (Latitude, Longitude)</label>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Latitude (-1.9441)"
                            value={smeForm.latitude}
                            onChange={(e) => setSmeForm({ ...smeForm, latitude: e.target.value })}
                            className="accounting-input w-full font-mono text-xs"
                          />
                          <input
                            type="text"
                            placeholder="Longitude (30.0619)"
                            value={smeForm.longitude}
                            onChange={(e) => setSmeForm({ ...smeForm, longitude: e.target.value })}
                            className="accounting-input w-full font-mono text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Primary Products and Services Memo */}
                  <div className="pt-1">
                    <label className="accounting-label">Primary Product Offerings & Value Proposition</label>
                    <textarea
                      rows={2}
                      value={smeForm.primaryProducts}
                      onChange={(e) => setSmeForm({ ...smeForm, primaryProducts: e.target.value })}
                      placeholder="Outline your primary product lines, commercial services, distribution reach, or retail catalogs..."
                      className="accounting-textarea w-full"
                    />
                  </div>

                  {/* Bottom Actions Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-[#e2e8f0] gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 uppercase font-semibold">Registered Entity:</span>
                      <span className="text-sm font-bold text-slate-800">{smeForm.businessName || 'New Enterprise Profile'}</span>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        type="submit"
                        disabled={saving}
                        className="accounting-btn-primary"
                      >
                        <Check className="w-4 h-4" />
                        <span>{saving ? 'Saving...' : 'Save General Info'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="accounting-btn-secondary"
                      >
                        <X className="w-4 h-4" />
                        <span>Reset</span>
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* ===================================================================== */}
              {/* TAB 2: MACHINERY & EQUIPMENT LEDGER FORM */}
              {/* ===================================================================== */}
              {activeTab === 'equipment' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="accounting-label font-bold text-slate-800">
                        Operational Machinery, Tools & Tangible Assets Ledger
                      </label>
                      <p className="text-xs text-slate-500">
                        Total Asset Valuation: <strong className="text-slate-900 font-mono">{formatRWF(totalEquipmentsValue)}</strong> ({smeForm.equipments.length} units registered)
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddEquipment}
                      className="text-xs font-semibold text-[#0284c7] hover:text-[#0369a1] flex items-center gap-1 cursor-pointer bg-sky-50 px-3 py-1.5 rounded-[4px] border border-sky-200"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Equipment Line</span>
                    </button>
                  </div>

                  {/* Accounting Ledger Grid for Machinery */}
                  <div className="overflow-x-auto border border-[#cbd5e1] rounded-[4px] bg-white">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#f1f5f9] text-[#475569] font-bold border-b border-[#cbd5e1] text-[11px] uppercase tracking-wider">
                          <th className="py-2.5 px-3 w-10 text-center">#</th>
                          <th className="py-2.5 px-3 min-w-[220px]">Machine / Equipment Name</th>
                          <th className="py-2.5 px-3 w-48">Asset Category</th>
                          <th className="py-2.5 px-3 w-44">Operating Condition</th>
                          <th className="py-2.5 px-3 w-40 text-right">Estimated Value (FRW)</th>
                          <th className="py-2.5 px-3 w-14 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e2e8f0] bg-white">
                        {smeForm.equipments.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-slate-400">
                              <Cpu className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                              <p className="font-semibold text-xs text-slate-600">No machinery or operational assets added yet</p>
                              <p className="text-[11px] mt-0.5">Click "Add Equipment Line" above to record production tools, transport units, or computers.</p>
                            </td>
                          </tr>
                        ) : (
                          smeForm.equipments.map((eq, idx) => (
                            <tr key={eq.id} className="hover:bg-slate-50/70">
                              <td className="py-2 px-3 text-center font-mono text-slate-400 font-bold">{idx + 1}</td>
                              <td className="py-2 px-2">
                                <input
                                  type="text"
                                  value={eq.name}
                                  onChange={(e) => handleEquipmentChange(eq.id, 'name', e.target.value)}
                                  placeholder="e.g. Industrial Grain Milling Unit or Delivery Van"
                                  className="accounting-input w-full !h-8 !min-h-8 text-xs font-semibold"
                                />
                              </td>
                              <td className="py-2 px-2">
                                <select
                                  value={eq.category}
                                  onChange={(e) => handleEquipmentChange(eq.id, 'category', e.target.value)}
                                  className="accounting-select w-full !h-8 !min-h-8 text-xs"
                                >
                                  {EQUIPMENT_CATEGORIES.map((cat) => (
                                    <option key={cat} value={cat}>
                                      {cat}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="py-2 px-2">
                                <select
                                  value={eq.condition}
                                  onChange={(e) => handleEquipmentChange(eq.id, 'condition', e.target.value)}
                                  className="accounting-select w-full !h-8 !min-h-8 text-xs font-medium"
                                >
                                  {EQUIPMENT_CONDITIONS.map((cond) => (
                                    <option key={cond} value={cond}>
                                      {cond}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="py-2 px-2">
                                <input
                                  type="number"
                                  value={eq.value || ''}
                                  onChange={(e) => handleEquipmentChange(eq.id, 'value', Number(e.target.value) || 0)}
                                  placeholder="0"
                                  className="accounting-input w-full !h-8 !min-h-8 text-xs font-mono text-right font-bold"
                                />
                              </td>
                              <td className="py-2 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveEquipment(eq.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                                  title="Delete equipment row"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Bottom Total & Actions Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-[#e2e8f0] gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 uppercase font-semibold">Total Asset Valuation:</span>
                      <span className="text-lg font-bold font-mono text-blue-700">{formatRWF(totalEquipmentsValue)}</span>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => handleSaveProfile()}
                        disabled={saving}
                        className="accounting-btn-primary"
                      >
                        <Check className="w-4 h-4" />
                        <span>{saving ? 'Saving...' : 'Save Equipment Ledger'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="accounting-btn-secondary"
                      >
                        <X className="w-4 h-4" />
                        <span>Reset</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ===================================================================== */}
              {/* TAB 3: BALANCE SHEET & CAPITAL STRUCTURE */}
              {/* ===================================================================== */}
              {activeTab === 'balance' && (
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {/* ASSETS COLUMN */}
                    <div className="p-4 rounded-[4px] bg-slate-50/80 border border-[#cbd5e1] space-y-3">
                      <div className="flex items-center justify-between border-b border-[#cbd5e1] pb-2">
                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                          <Coins className="w-4 h-4 text-teal-600" />
                          <span>Asset Portfolio Structure</span>
                        </h3>
                        <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          Total: {formatRWF(totalAssets)}
                        </span>
                      </div>

                      <div>
                        <label className="accounting-label">
                          Current Assets (Cash + Inventory + Customer Receivables) <span className="text-rose-600">*</span>
                        </label>
                        <input
                          type="number"
                          value={smeForm.currentAssets || ''}
                          onChange={(e) => setSmeForm({ ...smeForm, currentAssets: Number(e.target.value) || 0 })}
                          placeholder="e.g. 15000000"
                          required
                          className="accounting-input w-full font-mono font-bold"
                        />
                        <p className="text-[11px] text-slate-400 mt-0.5">Short-term liquid reserves, warehouses inventory, and pending invoices.</p>
                      </div>

                      <div>
                        <label className="accounting-label">
                          Fixed Assets (Machinery + Vehicles + Real Estate Leases) <span className="text-rose-600">*</span>
                        </label>
                        <input
                          type="number"
                          value={smeForm.fixedAssets || ''}
                          onChange={(e) => setSmeForm({ ...smeForm, fixedAssets: Number(e.target.value) || 0 })}
                          placeholder="e.g. 35000000"
                          required
                          className="accounting-input w-full font-mono font-bold"
                        />
                        <p className="text-[11px] text-slate-400 mt-0.5">Tangible productive machinery, logistics assets, and facility improvements.</p>
                      </div>
                    </div>

                    {/* LIABILITIES COLUMN */}
                    <div className="p-4 rounded-[4px] bg-slate-50/80 border border-[#cbd5e1] space-y-3">
                      <div className="flex items-center justify-between border-b border-[#cbd5e1] pb-2">
                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-rose-600" />
                          <span>Liabilities & Debt Obligations</span>
                        </h3>
                        <span className="text-xs font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          Total: {formatRWF(totalLiabilities)}
                        </span>
                      </div>

                      <div>
                        <label className="accounting-label">
                          Short-term Liabilities (Trade Credit / Accounts Payable) <span className="text-rose-600">*</span>
                        </label>
                        <input
                          type="number"
                          value={smeForm.shortTermLiabilities || ''}
                          onChange={(e) => setSmeForm({ ...smeForm, shortTermLiabilities: Number(e.target.value) || 0 })}
                          placeholder="e.g. 4000000"
                          required
                          className="accounting-input w-full font-mono font-bold"
                        />
                        <p className="text-[11px] text-slate-400 mt-0.5">Supplier bills due in &lt;90 days, tax accruals, and immediate obligations.</p>
                      </div>

                      <div>
                        <label className="accounting-label">
                          Long-term Liabilities (Commercial Loans & Mortgages) <span className="text-rose-600">*</span>
                        </label>
                        <input
                          type="number"
                          value={smeForm.longTermLiabilities || ''}
                          onChange={(e) => setSmeForm({ ...smeForm, longTermLiabilities: Number(e.target.value) || 0 })}
                          placeholder="e.g. 12000000"
                          required
                          className="accounting-input w-full font-mono font-bold"
                        />
                        <p className="text-[11px] text-slate-400 mt-0.5">Bank loans, machinery lease facilities, and structured long-term debt.</p>
                      </div>
                    </div>
                  </div>

                  {/* Revenue Velocity & Gross Margins */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 pt-1">
                    <div className="p-3.5 rounded-[4px] bg-emerald-50/70 border border-emerald-200">
                      <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Calculated Owner Net Equity</p>
                      <p className="text-lg font-extrabold text-emerald-700 font-mono mt-0.5">{formatRWF(ownerCapital)}</p>
                      <p className="text-[11px] text-emerald-600">Total Asset Base minus Total Debt Obligations</p>
                    </div>

                    <div>
                      <label className="accounting-label">Monthly Operating Turnover (FRW)</label>
                      <input
                        type="number"
                        value={smeForm.monthlyTurnover || ''}
                        onChange={(e) => setSmeForm({ ...smeForm, monthlyTurnover: Number(e.target.value) || 0 })}
                        placeholder="e.g. 8500000"
                        className="accounting-input w-full font-mono font-bold text-slate-900"
                      />
                      <p className="text-[11px] text-slate-400 mt-0.5">Annualized Revenue: {formatRWF(Number(smeForm.monthlyTurnover || 0) * 12)}</p>
                    </div>

                    <div>
                      <label className="accounting-label">Gross Margin Percentage (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={smeForm.grossMarginPercentage || ''}
                        onChange={(e) => setSmeForm({ ...smeForm, grossMarginPercentage: Number(e.target.value) || 0 })}
                        placeholder="e.g. 28.5"
                        className="accounting-input w-full font-mono font-bold text-slate-900"
                      />
                      <p className="text-[11px] text-slate-400 mt-0.5">Estimated gross markup percentage after direct COGS</p>
                    </div>
                  </div>

                  {/* Bottom Actions Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-[#e2e8f0] gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 uppercase font-semibold">Net Equity Solvency:</span>
                      <span className="text-lg font-bold font-mono text-emerald-700">{formatRWF(ownerCapital)}</span>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        type="submit"
                        disabled={saving}
                        className="accounting-btn-primary"
                      >
                        <Check className="w-4 h-4" />
                        <span>{saving ? 'Saving...' : 'Save Balance Sheet'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="accounting-btn-secondary"
                      >
                        <X className="w-4 h-4" />
                        <span>Reset</span>
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* ===================================================================== */}
              {/* TAB 4: WORKFORCE & PAYROLL FORM */}
              {/* ===================================================================== */}
              {activeTab === 'workforce' && (
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                    <div>
                      <label className="accounting-label">
                        Full-Time Permanent Staff <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={smeForm.fullTimeEmployees || ''}
                        onChange={(e) => setSmeForm({ ...smeForm, fullTimeEmployees: Number(e.target.value) || 0 })}
                        placeholder="e.g. 8"
                        required
                        className="accounting-input w-full font-mono font-bold"
                      />
                      <p className="text-[11px] text-slate-400 mt-0.5">Contracted full-time operational employees</p>
                    </div>

                    <div>
                      <label className="accounting-label">
                        Part-Time & Casual Workers <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={smeForm.partTimeEmployees || ''}
                        onChange={(e) => setSmeForm({ ...smeForm, partTimeEmployees: Number(e.target.value) || 0 })}
                        placeholder="e.g. 4"
                        required
                        className="accounting-input w-full font-mono font-bold"
                      />
                      <p className="text-[11px] text-slate-400 mt-0.5">Seasonal, casual, or hourly labor staff</p>
                    </div>

                    <div>
                      <label className="accounting-label">
                        Total Monthly Payroll (FRW) <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={smeForm.monthlyPayroll || ''}
                        onChange={(e) => setSmeForm({ ...smeForm, monthlyPayroll: Number(e.target.value) || 0 })}
                        placeholder="e.g. 2400000"
                        required
                        className="accounting-input w-full font-mono font-bold text-amber-700"
                      />
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Avg. Cost: {totalEmployees > 0 ? formatRWF(Math.round(Number(smeForm.monthlyPayroll || 0) / totalEmployees)) : '—'} / person
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="accounting-label">Key Operational Roles & Responsibilities</label>
                    <textarea
                      rows={3}
                      value={smeForm.keyRoles}
                      onChange={(e) => setSmeForm({ ...smeForm, keyRoles: e.target.value })}
                      placeholder="e.g. Managing Director, Head Baker, Quality Control Officer, Logistics Coordinator, Sales Reps..."
                      className="accounting-textarea w-full"
                    />
                  </div>

                  {/* Bottom Actions Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-[#e2e8f0] gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 uppercase font-semibold">Total Monthly Payroll:</span>
                      <span className="text-lg font-bold font-mono text-amber-700">{formatRWF(Number(smeForm.monthlyPayroll || 0))}</span>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        type="submit"
                        disabled={saving}
                        className="accounting-btn-primary"
                      >
                        <Check className="w-4 h-4" />
                        <span>{saving ? 'Saving...' : 'Save Workforce Ledger'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="accounting-btn-secondary"
                      >
                        <X className="w-4 h-4" />
                        <span>Reset</span>
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* ===================================================================== */}
              {/* TAB 5: STRATEGY & AI CATEGORIZATION FORM */}
              {/* ===================================================================== */}
              {activeTab === 'strategy' && (
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="accounting-label">
                        Business Lifecycle Stage <span className="text-rose-600">*</span>
                      </label>
                      <select
                        value={smeForm.businessStage}
                        onChange={(e) => setSmeForm({ ...smeForm, businessStage: e.target.value })}
                        className="accounting-select w-full"
                      >
                        <option value="Seed / Startup (0-1 yr)">Seed / Startup (0-1 yr)</option>
                        <option value="Early Growth (1-3 yrs)">Early Growth (1-3 yrs)</option>
                        <option value="Growth / Scaling (3+ yrs)">Growth / Scaling (3+ yrs)</option>
                        <option value="Established / Mature">Established / Mature</option>
                      </select>
                    </div>

                    <div>
                      <label className="accounting-label">
                        Digitization & Technology Maturity <span className="text-rose-600">*</span>
                      </label>
                      <select
                        value={smeForm.digitizationLevel}
                        onChange={(e) => setSmeForm({ ...smeForm, digitizationLevel: e.target.value })}
                        className="accounting-select w-full"
                      >
                        <option value="Low (Manual Cash Registers)">Low (Manual Paper Registers)</option>
                        <option value="Medium (POS & Mobile Money enabled)">Medium (POS & Mobile Money enabled)</option>
                        <option value="High (Integrated ERP & E-Commerce)">High (Integrated ERP, Cloud & Digital POS)</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="accounting-label">Target Customer Segments & Market Reach</label>
                      <textarea
                        rows={2}
                        value={smeForm.targetMarket}
                        onChange={(e) => setSmeForm({ ...smeForm, targetMarket: e.target.value })}
                        placeholder="e.g. Urban retail bakeries in Kigali, institutional schools, and regional distributors in Western Province..."
                        className="accounting-textarea w-full"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="accounting-label">Primary Operational Bottlenecks & Challenges</label>
                      <textarea
                        rows={2}
                        value={smeForm.operationalChallenges}
                        onChange={(e) => setSmeForm({ ...smeForm, operationalChallenges: e.target.value })}
                        placeholder="e.g. Working capital constraints for bulk harvest purchasing, cold storage capacity, logistics fuel costs..."
                        className="accounting-textarea w-full"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="accounting-label">Strategic Growth Goals & Capital Deployment Roadmap</label>
                      <textarea
                        rows={2}
                        value={smeForm.strategicGoals}
                        onChange={(e) => setSmeForm({ ...smeForm, strategicGoals: e.target.value })}
                        placeholder="e.g. Expand daily milling throughput by 40%, acquire 2 additional distribution trikes, implement automated packaging..."
                        className="accounting-textarea w-full"
                      />
                    </div>
                  </div>

                  {/* Bottom Actions Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-[#e2e8f0] gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 uppercase font-semibold">Stage & Maturity:</span>
                      <span className="text-sm font-bold text-purple-700">{smeForm.businessStage}</span>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        type="submit"
                        disabled={saving}
                        className="accounting-btn-primary"
                      >
                        <Check className="w-4 h-4" />
                        <span>{saving ? 'Saving...' : 'Save Strategy & Categorization'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="accounting-btn-secondary"
                      >
                        <X className="w-4 h-4" />
                        <span>Reset</span>
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 5. CONSOLIDATED BUSINESS PROFILE AUDIT LEDGER (Matching BusinessActivities) */}
          {/* ========================================================================= */}
          {showLedgerView && (
            <Card className="bg-white border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-heading flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-600" />
                    <span>Consolidated Business Profile Audit & Financial Ledger</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Live balance sheet parameters, asset register, and operational audit trail for {smeForm.businessName || 'your enterprise'}.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search profile audit lines..."
                      className="pl-8 h-8 text-xs w-48 sm:w-60 bg-slate-50 border-slate-200 rounded-lg"
                    />
                  </div>

                  <select
                    value={ledgerFilter}
                    onChange={(e) => setLedgerFilter(e.target.value as any)}
                    className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 h-8 outline-none"
                  >
                    <option value="all">All Audit Items ({auditLedgerItems.length})</option>
                    <option value="assets">Assets & Performance</option>
                    <option value="liabilities">Liabilities & Debt</option>
                    <option value="equipments">Equipments ({smeForm.equipments.length})</option>
                    <option value="workforce">Workforce & Payroll</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 text-[10px] uppercase tracking-wider">
                      <th className="py-3 px-4">Section</th>
                      <th className="py-3 px-4">Classification</th>
                      <th className="py-3 px-4 min-w-[200px]">Parameter / Metric</th>
                      <th className="py-3 px-4 min-w-[220px]">Specification / Memo</th>
                      <th className="py-3 px-4 text-right">Valuation / Amount (FRW)</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredAuditItems.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          <Activity className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                          <p className="font-semibold text-xs text-slate-600">No profile metrics matching criteria</p>
                          <p className="text-[11px] mt-0.5">Use the forms above to update your business profile parameters.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredAuditItems.map((item) => {
                        const getBadge = () => {
                          switch (item.type) {
                            case 'assets':
                              return 'bg-emerald-50 text-emerald-700 border-emerald-200';
                            case 'liabilities':
                              return 'bg-rose-50 text-rose-700 border-rose-200';
                            case 'equipments':
                              return 'bg-blue-50 text-blue-700 border-blue-200';
                            case 'workforce':
                              return 'bg-amber-50 text-amber-700 border-amber-200';
                            default:
                              return 'bg-slate-50 text-slate-700 border-slate-200';
                          }
                        };

                        return (
                          <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getBadge()}`}>
                                {item.section}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-medium text-slate-600">
                              {item.category}
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-semibold text-slate-900">{item.item}</div>
                              <div className="text-[11px] text-slate-500 mt-0.5">{item.value}</div>
                            </td>
                            <td className="py-3 px-4 text-slate-500 text-[11px]">
                              {item.notes}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold whitespace-nowrap">
                              {item.amount > 0 ? (
                                <span className={item.type === 'liabilities' ? 'text-rose-600' : 'text-slate-800'}>
                                  {formatRWF(item.amount)}
                                </span>
                              ) : (
                                <span className="text-slate-400 font-normal">{item.value}</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                                {item.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
