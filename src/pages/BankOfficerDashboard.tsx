import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatRWF } from '../lib/mockData';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  Legend
} from 'recharts';
import {
  Building2,
  Users,
  DollarSign,
  AlertTriangle,
  Zap,
  Search,
  Eye,
  XCircle,
  FileSearch,
  Check,
  Shield,
  Briefcase,
  TrendingUp,
  Activity,
  CheckCircle,
  Clock,
  Filter,
  ArrowRight,
  Phone,
  Mail
} from 'lucide-react';
import { Card, CardContent } from '../assets/components/ui/card';

export type BankerTab = 'portfolio' | 'pipeline' | 'monitoring' | 'sectoral';

export default function BankOfficerDashboard() {
  const {
    smes,
    selectedSmeId,
    setSelectedSmeId
  } = useApp();

  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<BankerTab>('portfolio');
  const [searchTerm, setSearchTerm] = useState('');
  const [sectorFilter, setSectorFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'danger' | 'warning' | 'info'; text: string } | null>(null);

  const showToast = (type: 'success' | 'danger' | 'warning' | 'info', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4500);
  };

  const portfolioStats = useMemo(() => {
    const totalSMEs = smes.length;
    const totalOutstandingLoans = smes.reduce((acc, curr) => acc + (curr.loanDetails?.outstandingAmount || 0), 0);
    const totalBorrowingCapacity = smes.reduce((acc, curr) => acc + (curr.borrowingCapacity || 0), 0);
    const highRiskSMEs = smes.filter(sme => sme.healthScore < 60).length;
    const loanReadySMEs = smes.filter(sme => sme.healthScore >= 80).length;
    const mediumRiskSMEs = smes.filter(sme => sme.healthScore >= 60 && sme.healthScore < 80).length;
    return { totalSMEs, totalOutstandingLoans, totalBorrowingCapacity, highRiskSMEs, loanReadySMEs, mediumRiskSMEs };
  }, [smes]);

  const filteredSmes = useMemo(() => {
    return smes.filter(sme => {
      const matchesSearch =
        sme.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sme.sector.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sme.ownerName && sme.ownerName.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesSector = sectorFilter === 'all' || sme.sector === sectorFilter;

      let matchesRisk = true;
      if (riskFilter === 'high') matchesRisk = sme.healthScore < 60;
      else if (riskFilter === 'medium') matchesRisk = sme.healthScore >= 60 && sme.healthScore < 80;
      else if (riskFilter === 'loan_ready') matchesRisk = sme.healthScore >= 80;

      return matchesSearch && matchesSector && matchesRisk;
    });
  }, [smes, searchTerm, sectorFilter, riskFilter]);

  const highlightedSme = useMemo(() =>
    smes.find(sme => sme.id === selectedSmeId) || smes[0] || null,
    [smes, selectedSmeId]);

  const sectorChartData = useMemo(() => {
    const sectorMap = new Map<string, { name: string; count: number; totalCapacity: number; avgHealth: number; totalScore: number }>();
    smes.forEach(sme => {
      const s = sme.sector || 'General';
      if (!sectorMap.has(s)) {
        sectorMap.set(s, { name: s, count: 0, totalCapacity: 0, avgHealth: 0, totalScore: 0 });
      }
      const entry = sectorMap.get(s)!;
      entry.count += 1;
      entry.totalCapacity += (sme.borrowingCapacity || 0);
      entry.totalScore += sme.healthScore;
      entry.avgHealth = Math.round(entry.totalScore / entry.count);
    });
    return Array.from(sectorMap.values());
  }, [smes]);

  const handleApplications = () => navigate('/banker/applications');
  const handleAudit = () => {
    showToast('info', `Field-audit assignment requested for ${highlightedSme?.name || 'SME'}. Inspection task logged.`);
  };
  const handleMonitor = () => navigate('/dashboard');

  const scoreColor = (s: number) =>
    s >= 80 ? '#059669' : s >= 60 ? '#D97706' : '#DC2626';

  const scoreBg = (s: number) =>
    s >= 80
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : s >= 60
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-red-50 text-red-700 border-red-200';

  const toastStyles: Record<string, string> = {
    success: 'bg-[#2998d6] text-white',
    danger:  'bg-red-600 text-white',
    warning: 'bg-amber-500 text-white',
    info:    'bg-[#2998d6] text-white',
  };

  const tabsConfig = [
    { id: 'portfolio' as BankerTab, label: 'Active SME Portfolio', icon: <Users className="w-4 h-4" />, count: smes.length, color: 'text-emerald-600' },
    { id: 'pipeline' as BankerTab, label: 'Credit Capacity Pipeline', icon: <Briefcase className="w-4 h-4" />, count: portfolioStats.loanReadySMEs, color: 'text-blue-600' },
    { id: 'monitoring' as BankerTab, label: 'Risk Surveillance & Alerts', icon: <AlertTriangle className="w-4 h-4" />, count: portfolioStats.highRiskSMEs, color: 'text-amber-600' },
    { id: 'sectoral' as BankerTab, label: 'Sectoral Intelligence', icon: <Building2 className="w-4 h-4" />, count: sectorChartData.length, color: 'text-purple-600' }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Toast */}
      {toastMessage && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${toastStyles[toastMessage.type]}`}>
          {toastMessage.type === 'success' && <Check className="w-4 h-4 shrink-0" />}
          {toastMessage.type === 'danger'  && <XCircle className="w-4 h-4 shrink-0" />}
          {toastMessage.type === 'warning' && <AlertTriangle className="w-4 h-4 shrink-0" />}
          {toastMessage.type === 'info'    && <Eye className="w-4 h-4 shrink-0" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. TOP HEADER & WORKSPACE ACTIONS BAR */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1 border-b border-[#e2e8f0]">
        <div>
          <h1 className="text-xl sm:text-2xl font-normal text-[#1e293b] font-heading">
            Institutional Portfolio &amp; SME Risk Intelligence
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time credit monitoring, automated risk scoring, and targeted lending matchmaker for financial partners.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleApplications}
            className="accounting-btn-primary"
          >
            <FileSearch className="w-3.5 h-3.5" />
            <span>Review Applications</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/opportunities')}
            className="accounting-btn-secondary"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Publish Opportunity</span>
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
          {/* Top 3 Solid Cyan Select Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label className="accounting-label">Target Industry Sector</label>
              <select
                value={sectorFilter}
                onChange={(e) => setSectorFilter(e.target.value)}
                className="accounting-select w-full"
              >
                <option value="all">All SME Sectors ({smes.length})</option>
                <option value="Retail">Retail &amp; Commerce</option>
                <option value="Agriculture">Agribusiness &amp; Farming</option>
                <option value="Logistics">Transport &amp; Logistics</option>
                <option value="Technology">Technology &amp; Fintech</option>
              </select>
            </div>

            <div>
              <label className="accounting-label">Risk Rating Classification</label>
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="accounting-select w-full"
              >
                <option value="all">All Risk Classes ({smes.length})</option>
                <option value="loan_ready">Pre-Approved / Loan Ready (Score ≥ 80)</option>
                <option value="medium">Medium Risk / Monitoring (60-79)</option>
                <option value="high">High Risk / Audit Required (&lt; 60)</option>
              </select>
            </div>

            <div>
              <label className="accounting-label">Underwriting Surveillance Mode</label>
              <select
                value="Continuous"
                className="accounting-select w-full opacity-85 cursor-not-allowed"
                disabled
              >
                <option value="Continuous">Elevata Continuous Monitoring (Live)</option>
                <option value="Quarterly">Quarterly Batch Audit</option>
              </select>
            </div>
          </div>

          {/* Quick Search & Total Summary Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 pb-2 border-b border-[#e2e8f0]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700">
                Displaying <strong className="text-[#2998d6]">{filteredSmes.length}</strong> of {smes.length} SME borrowers
              </span>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by SME business name, sector, or owner..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="accounting-input w-full pl-8 text-xs"
              />
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 3. PORTFOLIO EXECUTIVE METRIC CARDS */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="accounting-card p-4 border-[#cbd5e1]">
              <span className="accounting-label uppercase tracking-wider text-slate-500 font-bold">Total Monitored SMEs</span>
              <div className="mt-1 text-xl sm:text-2xl font-bold font-mono text-slate-900">
                {portfolioStats.totalSMEs}
              </div>
              <div className="mt-1 text-[11px] text-slate-500 flex items-center gap-1">
                <span className="text-emerald-600 font-semibold">{portfolioStats.loanReadySMEs} Loan Ready</span> · Active portfolio
              </div>
            </div>

            <div className="accounting-card p-4 border-[#cbd5e1]">
              <span className="accounting-label uppercase tracking-wider text-slate-500 font-bold">Active Loan Exposure</span>
              <div className="mt-1 text-xl sm:text-2xl font-bold font-mono text-[#2998d6]">
                {formatRWF(portfolioStats.totalOutstandingLoans)}
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                Total outstanding credit principal
              </div>
            </div>

            <div className="accounting-card p-4 border-[#cbd5e1]">
              <span className="accounting-label uppercase tracking-wider text-slate-500 font-bold">Aggregate Borrowing Capacity</span>
              <div className="mt-1 text-xl sm:text-2xl font-bold font-mono text-emerald-700">
                {formatRWF(portfolioStats.totalBorrowingCapacity)}
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                Pre-qualified lending room for deployment
              </div>
            </div>

            <div className="accounting-card p-4 border-[#cbd5e1]">
              <span className="accounting-label uppercase tracking-wider text-slate-500 font-bold">High Risk Alert Watchlist</span>
              <div className={`mt-1 text-xl sm:text-2xl font-bold font-mono ${portfolioStats.highRiskSMEs > 0 ? 'text-rose-700' : 'text-slate-900'}`}>
                {portfolioStats.highRiskSMEs}
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                {portfolioStats.highRiskSMEs > 0 ? 'Requires immediate underwriting audit' : 'All monitored SMEs within safe limits'}
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 4. SPLIT GRID: RISK SCORING LEDGER + INSPECTION DECISION PANEL */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left 2 Cols: Risk Scoring Ledger Table */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <label className="accounting-label font-bold text-slate-800 text-sm">
                  Borrower Risk Scoring Ledger (Click SME to Inspect &amp; Act)
                </label>
              </div>

              <div className="overflow-x-auto border border-[#cbd5e1] rounded-[4px] bg-white">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#f1f5f9] text-[#475569] font-bold border-b border-[#cbd5e1] text-[11px] uppercase tracking-wider">
                      <th className="py-2.5 px-3">SME Business &amp; Sector</th>
                      <th className="py-2.5 px-3">Health Score</th>
                      <th className="py-2.5 px-3">Credit Rating</th>
                      <th className="py-2.5 px-3 text-right">Borrowing Capacity</th>
                      <th className="py-2.5 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e2e8f0] bg-white">
                    {filteredSmes.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          No SME businesses match the criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredSmes.map((sme) => {
                        const isSelected = highlightedSme?.id === sme.id;
                        return (
                          <tr
                            key={sme.id}
                            onClick={() => setSelectedSmeId(sme.id)}
                            className={`cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-sky-50/80 font-medium'
                                : 'hover:bg-slate-50/80'
                            }`}
                          >
                            <td className="py-2.5 px-3">
                              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                                <span>{sme.name}</span>
                                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#2998d6]" />}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {sme.sector} · {sme.ownerName || 'Business Owner'}
                              </div>
                            </td>

                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-xs" style={{ color: scoreColor(sme.healthScore) }}>
                                  {sme.healthScore}/100
                                </span>
                                <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                  <div
                                    className="h-full rounded-full transition-all"
                                    style={{ width: `${sme.healthScore}%`, backgroundColor: scoreColor(sme.healthScore) }}
                                  />
                                </div>
                              </div>
                            </td>

                            <td className="py-2.5 px-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${scoreBg(sme.healthScore)}`}>
                                {sme.healthScore >= 80 ? 'Pre-Approved (Safe)' : sme.healthScore >= 60 ? 'Medium Risk' : 'High Risk'}
                              </span>
                            </td>

                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                              {formatRWF(sme.borrowingCapacity || 0)}
                            </td>

                            <td className="py-2.5 px-3 text-center">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedSmeId(sme.id);
                                }}
                                className="px-2 py-1 rounded-[3px] bg-slate-100 hover:bg-[#2998d6] hover:text-white text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
                              >
                                Inspect
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right 1 Col: Institutional Underwriting & Decision Panel */}
            <div className="lg:col-span-1">
              {highlightedSme ? (
                <div className="accounting-card p-5 border-[#cbd5e1] space-y-4">
                  <div className="pb-3 border-b border-[#e2e8f0]">
                    <span className="accounting-label uppercase tracking-wider text-slate-400 font-bold text-[10px]">
                      Underwriting &amp; Decision Hub
                    </span>
                    <h3 className="text-base font-bold text-slate-900 truncate mt-0.5">
                      {highlightedSme.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Sector: <strong className="text-slate-700">{highlightedSme.sector}</strong> · Health: <strong style={{ color: scoreColor(highlightedSme.healthScore) }}>{highlightedSme.healthScore}/100</strong>
                    </p>
                  </div>

                  {/* Operational Metrics Sub-Box */}
                  <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[4px] p-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Borrowing Capacity:</span>
                      <span className="font-mono font-bold text-emerald-700">{formatRWF(highlightedSme.borrowingCapacity)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Operating Balance:</span>
                      <span className="font-mono font-bold text-slate-800">{formatRWF(highlightedSme.currentBalance)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Active Debt Outstanding:</span>
                      <span className="font-mono font-semibold text-rose-700">{formatRWF(highlightedSme.loanDetails?.outstandingAmount || 0)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Contact / Email:</span>
                      <span className="text-slate-700 font-medium truncate max-w-[140px]">{highlightedSme.email || 'Registered Contact'}</span>
                    </div>
                  </div>

                  {/* Underwriter Action Buttons */}
                  <div className="space-y-2 pt-1">
                    <button
                      type="button"
                      onClick={handleApplications}
                      className="accounting-btn-primary w-full"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Review Financing Applications</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleMonitor}
                      className="accounting-btn-secondary w-full"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Monitor Financial Statements</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleAudit}
                      className="accounting-btn-secondary w-full hover:bg-slate-50"
                    >
                      <FileSearch className="w-3.5 h-3.5 text-[#2998d6]" />
                      <span>Request Verification Audit</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="accounting-card p-6 border-[#cbd5e1] text-center text-slate-400 text-xs">
                  Select an SME from the portfolio table to view risk metrics and underwriter actions.
                </div>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 5. SECTOR DISTRIBUTION & BENCHMARK CHART */}
          {/* ========================================================================= */}
          <div className="accounting-card p-4 sm:p-5 border-[#cbd5e1]">
            <div className="flex items-center justify-between gap-2 mb-4 pb-2 border-b border-[#e2e8f0]">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#2998d6]" />
                <h3 className="text-sm font-bold text-slate-800">
                  Sectoral Credit Capacity &amp; Average Health Score Distribution
                </h3>
              </div>
            </div>

            <div className="h-60 sm:h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sectorChartData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />
                  <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} tickFormatter={(val) => `${(val / 1000000).toFixed(0)}M`} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} domain={[0, 100]} />
                  <Tooltip
                    formatter={(value: any, name: string) => [
                      name === 'totalCapacity' ? formatRWF(Number(value)) : `${value}/100`,
                      name === 'totalCapacity' ? 'Total Borrowing Capacity' : 'Average Health Score'
                    ]}
                    contentStyle={{ borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12 }}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="totalCapacity" name="Total Borrowing Capacity (FRW)" fill="#2998d6" radius={[2, 2, 0, 0]} />
                  <Bar yAxisId="right" dataKey="avgHealth" name="Avg Health Score" fill="#10b981" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}