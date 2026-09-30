import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { formatRWF, MonthlyFinancial, InventoryItem, LoanDetails } from '../lib/mockData';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LabelList,
  ReferenceLine,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Info,
  DollarSign,
  Activity,
  Warehouse,
  BadgeAlert,
  ArrowRight,
  RefreshCw,
  Plus,
  CalendarDays,
  Search,
  Package,
  X,
  ShoppingBag,
  Truck,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle,
  FileText,
  Briefcase
} from 'lucide-react';
import { Card, CardContent } from '../assets/components/ui/card';

export type SmeDashboardTab = 'executive' | 'cashflow' | 'inventory' | 'financing' | 'radar';

const formatCompactRWF = (value: number): string => {
  if (value === 0) return '0 FRW';
  const abs = Math.abs(value);
  if (abs >= 1000000) {
    const val = value / 1000000;
    return `${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)}M FRW`;
  }
  if (abs >= 1000) {
    return `${Math.round(value / 1000)}k FRW`;
  }
  return `${Math.round(value)} FRW`;
};

const DEFAULT_MONTHLY_DATA: MonthlyFinancial[] = [
  { month: 'Oct', revenue: 3850000, expenses: 2600000, inflow: 4100000, outflow: 2500000 },
  { month: 'Nov', revenue: 4200000, expenses: 2850000, inflow: 4350000, outflow: 2800000 },
  { month: 'Dec', revenue: 5400000, expenses: 3400000, inflow: 5600000, outflow: 3300000 },
  { month: 'Jan', revenue: 4100000, expenses: 2750000, inflow: 4050000, outflow: 2900000 },
  { month: 'Feb', revenue: 4650000, expenses: 2900000, inflow: 4800000, outflow: 2750000 },
  { month: 'Mar', revenue: 5200000, expenses: 3100000, inflow: 5350000, outflow: 3050000 }
];

export default function SmeDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      navigate('/admin/users', { replace: true });
    } else if (user?.role === 'FINANCIAL_INSTITUTION') {
      navigate('/banker', { replace: true });
    }
  }, [user, navigate]);

  const { activeSme, scenarios, products, opportunities } = useApp();
  const [activeTab, setActiveTab] = useState<SmeDashboardTab>('executive');
  const [inventorySearch, setInventorySearch] = useState('');

  // Fallback calculations for monthly data
  const monthlyData = useMemo(() => {
    if (activeSme.monthlyData && activeSme.monthlyData.length > 0) {
      return activeSme.monthlyData;
    }
    return DEFAULT_MONTHLY_DATA;
  }, [activeSme.monthlyData]);

  // Inventory items
  const inventoryList = useMemo(() => {
    if (products && products.length > 0) {
      return products.map(p => ({
        id: p.id,
        name: p.name,
        stockLevel: p.stockQuantity,
        unit: p.unit || 'pcs',
        status: p.status || 'In Stock',
        daysRemaining: Math.round(p.stockQuantity * 2),
        reorderPoint: p.reorderLevel || 5,
        unitPrice: p.unitPrice,
        costPrice: p.costPrice || p.unitPrice,
        category: p.category || 'General'
      }));
    }
    return activeSme.inventoryItems || [];
  }, [products, activeSme.inventoryItems]);

  const filteredInventory = useMemo(() => {
    if (!inventorySearch.trim()) return inventoryList;
    const q = inventorySearch.toLowerCase();
    return inventoryList.filter(i =>
      i.name.toLowerCase().includes(q) ||
      (i.category && i.category.toLowerCase().includes(q))
    );
  }, [inventoryList, inventorySearch]);

  const totalInventoryValue = useMemo(() => {
    return inventoryList.reduce((sum, item) => sum + (Number(item.unitPrice || 0) * Number(item.stockLevel || 0)), 0);
  }, [inventoryList]);

  const lowStockCount = useMemo(() => {
    return inventoryList.filter(i => i.status === 'Low Stock' || i.status === 'Out of Stock').length;
  }, [inventoryList]);

  // Calculate totals
  const currentMonth = monthlyData[monthlyData.length - 1] || { revenue: 0, expenses: 0, inflow: 0, outflow: 0 };
  const previousMonth = monthlyData[monthlyData.length - 2] || { revenue: 0, expenses: 0, inflow: 0, outflow: 0 };
  const revenueGrowth = previousMonth.revenue > 0 ? Math.round(((currentMonth.revenue - previousMonth.revenue) / previousMonth.revenue) * 100) : 0;
  const netMonthlyProfit = currentMonth.revenue - currentMonth.expenses;
  const netMargin = currentMonth.revenue > 0 ? Math.round((netMonthlyProfit / currentMonth.revenue) * 100) : 0;

  const tabsConfig = [
    { id: 'executive' as SmeDashboardTab, label: 'Executive Cockpit', icon: <Activity className="w-4 h-4" />, count: activeSme.healthScore, color: 'text-emerald-600' },
    { id: 'cashflow' as SmeDashboardTab, label: 'Cashflow & Runway', icon: <TrendingUp className="w-4 h-4" />, count: monthlyData.length, color: 'text-blue-600' },
    { id: 'inventory' as SmeDashboardTab, label: 'Stock & Catalog Health', icon: <Warehouse className="w-4 h-4" />, count: inventoryList.length, color: 'text-teal-600' },
    { id: 'financing' as SmeDashboardTab, label: 'Financing Capacity', icon: <Briefcase className="w-4 h-4" />, count: opportunities.length, color: 'text-purple-600' },
    { id: 'radar' as SmeDashboardTab, label: 'Risk Surveillance', icon: <AlertTriangle className="w-4 h-4" />, count: activeSme.riskAlerts?.length || 0, color: 'text-amber-600' }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & QUICK RECORD ACTIONS */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1 border-b border-[#e2e8f0]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-normal text-[#1e293b] font-heading">
              SME Financial Operations &amp; Intelligence
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Live Verified
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational cockpit for <span className="font-semibold text-slate-700">{activeSme.name}</span> ({activeSme.sector || 'Commercial Enterprise'}).
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => navigate('/activities?tab=sales')}
            className="accounting-btn-primary"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>New Sale</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/activities?tab=purchases')}
            className="accounting-btn-secondary"
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Restock Intake</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/reports')}
            className="accounting-btn-secondary hover:bg-slate-50"
          >
            <FileText className="w-3.5 h-3.5 text-[#2998d6]" />
            <span>Reports</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN FOLDER TABS BAR (Connected to Card Body) */}
      {/* ========================================================================= */}
      <div className="relative">
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
                {isActive && (
                  <span className="absolute top-0 left-0 right-0 h-[3px] bg-[#2998d6] rounded-t-[6px]" />
                )}

                <span className={`shrink-0 transition-transform group-hover:scale-110 ${isActive ? tab.color : 'text-slate-400 group-hover:text-slate-600'}`}>
                  {tab.icon}
                </span>

                <span className="tracking-tight">{tab.label}</span>

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
        <div className="accounting-card p-5 sm:p-7 relative z-0 border-[#cbd5e1] rounded-t-none space-y-6">
          {/* Top 3 Solid Cyan Select Quick Navigation Dropdowns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label className="accounting-label">Quick Journal Switcher</label>
              <select
                onChange={(e) => navigate(`/activities?tab=${e.target.value}`)}
                className="accounting-select w-full"
                defaultValue=""
              >
                <option value="" disabled>-- Jump to Business Activities Journal --</option>
                <option value="sales">Sales Journal &amp; Invoices</option>
                <option value="purchases">Purchases &amp; Supplier Intake</option>
                <option value="cash_in">Cash In Journal (Capital/Loans)</option>
                <option value="cash_out">Cash Out &amp; Operational Expenses</option>
                <option value="other">Milestones &amp; General Activities</option>
              </select>
            </div>

            <div>
              <label className="accounting-label">Financing Opportunities Engine</label>
              <select
                onChange={(e) => navigate(`/opportunities?category=${e.target.value}`)}
                className="accounting-select w-full"
                defaultValue=""
              >
                <option value="" disabled>-- Explore Matched Funding --</option>
                <option value="Loan">Working Capital Commercial Loans</option>
                <option value="Grant">Government &amp; NGO SME Grants</option>
                <option value="Training">Financial Literacy &amp; Virtual Training</option>
                <option value="Insurance">Business Asset &amp; Inventory Insurance</option>
              </select>
            </div>

            <div>
              <label className="accounting-label">Underwriting Health Status</label>
              <select
                value="Active"
                className="accounting-select w-full opacity-85 cursor-not-allowed"
                disabled
              >
                <option value="Active">Continuous Bank Surveillance Active</option>
              </select>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 3. EXECUTIVE FINANCIAL KPI METRIC CARDS */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="accounting-card p-4 border-[#cbd5e1]">
              <span className="accounting-label uppercase tracking-wider text-slate-500 font-bold">Monthly Turnover / Revenue</span>
              <div className="mt-1 text-xl sm:text-2xl font-bold font-mono text-emerald-700">
                {formatRWF(currentMonth.revenue)}
              </div>
              <div className="mt-1 text-[11px] text-slate-500 flex items-center gap-1">
                <span className={`font-semibold ${revenueGrowth >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {revenueGrowth >= 0 ? `+${revenueGrowth}%` : `${revenueGrowth}%`}
                </span>
                <span>vs previous period</span>
              </div>
            </div>

            <div className="accounting-card p-4 border-[#cbd5e1]">
              <span className="accounting-label uppercase tracking-wider text-slate-500 font-bold">Operating Cash Reserves</span>
              <div className="mt-1 text-xl sm:text-2xl font-bold font-mono text-[#2998d6]">
                {formatRWF(activeSme.currentBalance)}
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                Liquid cash across bank &amp; mobile drawers
              </div>
            </div>

            <div className="accounting-card p-4 border-[#cbd5e1]">
              <span className="accounting-label uppercase tracking-wider text-slate-500 font-bold">Financing Health Score</span>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-bold font-mono text-slate-900">
                  {activeSme.healthScore}/100
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {activeSme.healthScore >= 80 ? 'Pre-Approved' : activeSme.healthScore >= 60 ? 'Standard' : 'Needs Review'}
                </span>
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                Borrowing room: <strong className="text-emerald-700">{formatRWF(activeSme.borrowingCapacity)}</strong>
              </div>
            </div>

            <div className="accounting-card p-4 border-[#cbd5e1]">
              <span className="accounting-label uppercase tracking-wider text-slate-500 font-bold">Master Inventory Valuation</span>
              <div className="mt-1 text-xl sm:text-2xl font-bold font-mono text-purple-700">
                {formatRWF(totalInventoryValue)}
              </div>
              <div className="mt-1 text-[11px] text-slate-500 flex items-center gap-1">
                <span>{inventoryList.length} catalog items</span>
                {lowStockCount > 0 && (
                  <span className="text-amber-600 font-semibold">· {lowStockCount} low stock</span>
                )}
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 4. PERFORMANCE & CASHFLOW TRAJECTORY CHART */}
          {/* ========================================================================= */}
          <div className="accounting-card p-4 sm:p-5 border-[#cbd5e1]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-2 border-b border-[#e2e8f0]">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#2998d6]" />
                <h3 className="text-sm font-bold text-slate-800">
                  Monthly Financial Performance &amp; Cashflow Trajectory (FRW)
                </h3>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                  <span className="w-2.5 h-2.5 bg-[#2998d6] rounded-xs" /> Revenue
                </span>
                <span className="flex items-center gap-1 text-slate-500 font-semibold">
                  <span className="w-2.5 h-2.5 bg-slate-400 rounded-xs" /> Expenses
                </span>
                <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-xs" /> Net Cashflow
                </span>
              </div>
            </div>

            <div className="h-64 sm:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                    tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip
                    formatter={(val: any) => formatRWF(Number(val))}
                    contentStyle={{ borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12 }}
                  />
                  <Legend />
                  <Bar dataKey="revenue" name="Operating Revenue" fill="#2998d6" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="expenses" name="Operating Expenses" fill="#94a3b8" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="inflow" name="Total Inflow" fill="#10b981" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 5. INVENTORY & RISK SURVEILLANCE SPLIT SECTION */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left 2 Cols: Master Inventory Catalog & Stock Status */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="accounting-label font-bold text-slate-800 text-sm">
                  Inventory Stock Level &amp; Reorder Tracker
                </label>
                <div className="relative w-full sm:w-56">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search inventory items..."
                    value={inventorySearch}
                    onChange={(e) => setInventorySearch(e.target.value)}
                    className="accounting-input w-full pl-8 text-xs"
                  />
                </div>
              </div>

              <div className="overflow-x-auto border border-[#cbd5e1] rounded-[4px] bg-white">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#f1f5f9] text-[#475569] font-bold border-b border-[#cbd5e1] text-[11px] uppercase tracking-wider">
                      <th className="py-2.5 px-3">Product Name</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3 text-center">Available Stock</th>
                      <th className="py-2.5 px-3 text-right">Unit Price (FRW)</th>
                      <th className="py-2.5 px-3 text-center">Stock Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e2e8f0] bg-white">
                    {filteredInventory.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          No inventory items registered. Use the master catalog to create items.
                        </td>
                      </tr>
                    ) : (
                      filteredInventory.slice(0, 6).map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/70">
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            {item.name}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500">
                            {item.category || 'General'}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800">
                            {item.stockLevel} {item.unit}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                            {formatRWF(item.unitPrice || 0)}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                item.status === 'In Stock'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : item.status === 'Low Stock'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                            >
                              {item.status || 'In Stock'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right 1 Col: AI Advisory & Financial Risk Radar */}
            <div className="lg:col-span-1 space-y-4">
              <div className="accounting-card p-5 border-[#cbd5e1] space-y-4">
                <div className="pb-3 border-b border-[#e2e8f0]">
                  <span className="accounting-label uppercase tracking-wider text-slate-400 font-bold text-[10px]">
                    AI Risk Surveillance Radar
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">
                    Readiness &amp; Early Warnings
                  </h3>
                </div>

                <div className="space-y-2.5">
                  {(activeSme.riskAlerts || []).length > 0 ? (
                    activeSme.riskAlerts.slice(0, 3).map((alert, idx) => (
                      <div
                        key={alert.id || idx}
                        className={`p-3 rounded-[4px] border text-xs leading-relaxed ${
                          alert.type === 'danger'
                            ? 'bg-rose-50/80 border-rose-200 text-rose-800'
                            : alert.type === 'warning'
                            ? 'bg-amber-50/80 border-amber-200 text-amber-800'
                            : 'bg-sky-50/80 border-sky-200 text-sky-800'
                        }`}
                      >
                        <div className="font-bold flex items-center gap-1.5 mb-1">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>{alert.type === 'danger' ? 'High Risk Alert' : alert.type === 'warning' ? 'Attention Warning' : 'Operational Insight'}</span>
                        </div>
                        <p>{alert.text}</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-[4px] text-xs text-emerald-800 font-medium flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>All business indicators and tax compliance metrics are healthy.</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-[#e2e8f0]">
                  <button
                    type="button"
                    onClick={() => navigate('/bot')}
                    className="accounting-btn-primary w-full"
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>Ask Elevata Copilot Advisor</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
