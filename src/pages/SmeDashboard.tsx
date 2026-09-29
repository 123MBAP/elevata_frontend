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
  Cell
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
  X
} from 'lucide-react';
import { Card, CardContent } from '../assets/components/ui/card';

/** Elevata standard palette & McKinsey-style comparison palette */
const COLORS = {
  ink: '#0f172a',
  slate: '#64748b',
  line: '#e2e8f0',
  soft: '#f8fafc',
  primary: '#0f766e',
  primarySoft: '#ccfbf1',
  secondary: '#94a3b8',
  ok: '#059669',
  warn: '#d97706',
  bad: '#dc2626'
};

const COMPARISON_COLORS = {
  series1: '#2563eb', // Blue
  series2: '#8e8d7d', // Khaki / Warm Gray
  series3: '#ba3c14'  // Rust / Terracotta
};

const formatCompactRWF = (value: number): string => {
  if (value === 0) return '0';
  const abs = Math.abs(value);
  if (abs >= 1000000) {
    const val = value / 1000000;
    return `${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)}M`;
  }
  if (abs >= 1000) {
    return `${Math.round(value / 1000)}k`;
  }
  return String(Math.round(value));
};

const renderBarTopLabel = (fillColor: string) => (props: any) => {
  const { x, y, width, value } = props;
  if (value === undefined || value === null) return null;
  return (
    <text
      x={x + width / 2}
      y={y - 5}
      fill={fillColor}
      textAnchor="middle"
      fontSize={10}
      fontWeight={700}
      className="select-none"
    >
      {formatCompactRWF(value)}
    </text>
  );
};

const DEFAULT_MONTHLY_DATA: MonthlyFinancial[] = [
  { month: 'Oct', revenue: 3850000, expenses: 2600000, inflow: 4100000, outflow: 2500000 },
  { month: 'Nov', revenue: 4200000, expenses: 2850000, inflow: 4350000, outflow: 2800000 },
  { month: 'Dec', revenue: 5400000, expenses: 3400000, inflow: 5600000, outflow: 3300000 },
  { month: 'Jan', revenue: 4100000, expenses: 2750000, inflow: 4050000, outflow: 2900000 },
  { month: 'Feb', revenue: 4650000, expenses: 2900000, inflow: 4800000, outflow: 2750000 },
  { month: 'Mar', revenue: 5200000, expenses: 3100000, inflow: 5350000, outflow: 3050000 }
];

const DEFAULT_INVENTORY_ITEMS: InventoryItem[] = [
  {
    id: 'def-inv-1',
    name: 'Basmati Rice Premium (25kg)',
    stockLevel: 45,
    unit: 'bag',
    status: 'In Stock',
    daysRemaining: 24,
    reorderPoint: 15,
    unitPrice: 38000,
    category: 'Grains & Staples'
  },
  {
    id: 'def-inv-2',
    name: 'Fortified Maize Flour (25kg)',
    stockLevel: 12,
    unit: 'bag',
    status: 'Low Stock',
    daysRemaining: 5,
    reorderPoint: 20,
    unitPrice: 22000,
    category: 'Grains & Staples'
  },
  {
    id: 'def-inv-3',
    name: 'Sunflower Cooking Oil (5L)',
    stockLevel: 68,
    unit: 'pcs',
    status: 'In Stock',
    daysRemaining: 32,
    reorderPoint: 20,
    unitPrice: 14500,
    category: 'Oils & Condiments'
  },
  {
    id: 'def-inv-4',
    name: 'Refined Sugar (50kg)',
    stockLevel: 8,
    unit: 'bag',
    status: 'Low Stock',
    daysRemaining: 3,
    reorderPoint: 15,
    unitPrice: 65000,
    category: 'Staples'
  },
  {
    id: 'def-inv-5',
    name: 'Mineral Water Packs (24x500ml)',
    stockLevel: 95,
    unit: 'box',
    status: 'In Stock',
    daysRemaining: 45,
    reorderPoint: 25,
    unitPrice: 7000,
    category: 'Beverages'
  }
];

const DEFAULT_RISK_ALERTS: { id: string; type: 'warning' | 'info' | 'danger'; text: string }[] = [
  {
    id: 'def-alt-1',
    type: 'warning',
    text: 'Maize flour and refined sugar stock below safety threshold (less than 5 days supply remaining).'
  },
  {
    id: 'def-alt-2',
    type: 'info',
    text: 'Working capital runway is healthy at 48 days. Eligible for seasonal pre-financing up to 15,000,000 FRW.'
  },
  {
    id: 'def-alt-3',
    type: 'warning',
    text: 'Upcoming quarterly tax filing declaration due in 12 days to maintain 100% compliance status.'
  }
];

const DEFAULT_LOAN_DETAILS: LoanDetails = {
  status: 'Active',
  outstandingAmount: 2450000,
  monthlyInstallment: 320000,
  interestRate: 14.5,
  repaymentPeriodMonths: 12,
  purpose: 'Working Capital & Inventory Expansion'
};

export default function SmeDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === 'FINANCIAL_INSTITUTION') {
      navigate('/banker', { replace: true });
    }
  }, [user, navigate]);

  const { activeSme, scenarios, resetAll } = useApp();
  const [chartView, setChartView] = useState<'performance' | 'cashflow'>('performance');
  const [searchQuery, setSearchQuery] = useState('');

  // Fallback calculations when database has no records or zeroes
  const effectiveMonthlyData = useMemo(() => {
    return activeSme.monthlyData && activeSme.monthlyData.length > 0
      ? activeSme.monthlyData
      : DEFAULT_MONTHLY_DATA;
  }, [activeSme.monthlyData]);

  const effectiveInventory = useMemo(() => {
    return activeSme.inventoryItems && activeSme.inventoryItems.length > 0
      ? activeSme.inventoryItems
      : DEFAULT_INVENTORY_ITEMS;
  }, [activeSme.inventoryItems]);

  const effectiveAlerts = useMemo(() => {
    return activeSme.riskAlerts && activeSme.riskAlerts.length > 0
      ? activeSme.riskAlerts
      : DEFAULT_RISK_ALERTS;
  }, [activeSme.riskAlerts]);

  const effectiveLoanDetails = useMemo(() => {
    return (activeSme.loanDetails && activeSme.loanDetails.status && activeSme.loanDetails.status !== 'None' && activeSme.loanDetails.outstandingAmount > 0)
      ? activeSme.loanDetails
      : DEFAULT_LOAN_DETAILS;
  }, [activeSme.loanDetails]);

  const businessDisplayName =
    (activeSme.name && activeSme.name !== 'Complete your business profile' && activeSme.name.trim() !== '')
      ? activeSme.name
      : (user?.business?.businessName || user?.business?.ownerName || 'Akagera Trading Enterprises');

  const baseHealthScore = activeSme.healthScore > 0 ? activeSme.healthScore : 78;
  const baseBalance = activeSme.currentBalance > 0 ? activeSme.currentBalance : 4850000;
  const baseCapacity = activeSme.borrowingCapacity > 0 ? activeSme.borrowingCapacity : 15000000;
  const baseTrend = activeSme.healthTrend || 'up';
  const baseTrendPercent = activeSme.healthTrendPercent > 0 ? activeSme.healthTrendPercent : 8;

  let healthScore        = baseHealthScore;
  let currentBalance     = baseBalance;
  let healthTrend        = baseTrend;
  let healthTrendPercent = baseTrendPercent;

  if (scenarios.salesDrop) {
    healthScore        = Math.max(10, healthScore - 15);
    currentBalance     = Math.round(currentBalance * 0.8);
    healthTrend        = 'down';
    healthTrendPercent = healthTrendPercent + 12;
  }
  if (scenarios.expenseIncrease) {
    healthScore    = Math.max(10, healthScore - 8);
    currentBalance = Math.round(currentBalance * 0.9);
    if (!scenarios.salesDrop) {
      healthTrend        = 'down';
      healthTrendPercent = healthTrendPercent + 5;
    }
  }

  const chartData = effectiveMonthlyData.map((item, idx) => {
    let revenue  = item.revenue;
    let expenses = item.expenses;
    let inflow   = item.inflow;
    let outflow  = item.outflow;
    if (idx >= 4) {
      if (scenarios.salesDrop)      { revenue  = Math.round(revenue  * 0.80); inflow  = Math.round(inflow  * 0.80); }
      if (scenarios.expenseIncrease){ expenses = Math.round(expenses * 1.15); outflow = Math.round(outflow * 1.15); }
    }
    return {
      month: item.month,
      Revenue: revenue,
      Expenses: expenses,
      Profit: revenue - expenses,
      Inflow: inflow,
      Outflow: outflow,
      NetCash: inflow - outflow
    };
  });

  const currentMonthData = chartData[chartData.length - 1] ?? {
    Revenue: 0,
    Expenses: 0,
    Profit: 0,
    Inflow: 0,
    Outflow: 0,
    NetCash: 0
  };
  const monthlyInflow    = currentMonthData.Inflow;
  const monthlyOutflow   = currentMonthData.Outflow;
  const netCashFlow      = monthlyInflow - monthlyOutflow;
  const periodRevenue = chartData.reduce((sum, item) => sum + item.Revenue, 0);
  const periodProfit = periodRevenue - chartData.reduce((sum, item) => sum + item.Expenses, 0);
  const profitMargin = periodRevenue > 0 ? Math.round((periodProfit / periodRevenue) * 100) : 0;

  const scoreColor = (s: number) =>
    s >= 80 ? COLORS.ok : s >= 60 ? COLORS.warn : COLORS.bad;

  const scoreBadgeClass = (s: number) =>
    s >= 80
      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
      : s >= 60
      ? 'bg-amber-50 text-amber-700 border border-amber-100'
      : 'bg-red-50 text-red-700 border border-red-100';

  const today = new Intl.DateTimeFormat('en-RW', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(new Date());

  const cashMix = [
    { name: 'Inflow', value: Math.max(monthlyInflow, 0), color: COLORS.primary },
    { name: 'Outflow', value: Math.max(monthlyOutflow, 0), color: COLORS.secondary }
  ];
  const cashTotal = cashMix.reduce((sum, item) => sum + item.value, 0);
  const cashRunwayDays = monthlyOutflow > 0
    ? Math.max(0, Math.round((currentBalance / monthlyOutflow) * 30))
    : currentBalance > 0 ? 90 : 0;
  const runwayWidth = Math.max(8, Math.min(100, cashRunwayDays));

  const q = searchQuery.trim().toLowerCase();
  const filteredInventory = useMemo(() => {
    if (!q) return effectiveInventory;
    return effectiveInventory.filter((item) =>
      [item.name, item.status, item.category, String(item.stockLevel)].join(' ').toLowerCase().includes(q)
    );
  }, [effectiveInventory, q]);

  const filteredAlerts = useMemo(() => {
    if (!q) return effectiveAlerts;
    return effectiveAlerts.filter((alert) =>
      [alert.text, alert.type].join(' ').toLowerCase().includes(q)
    );
  }, [effectiveAlerts, q]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 sm:space-y-5">
      {/* Header */}
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            <CalendarDays className="h-3.5 w-3.5 text-[#0f766e]" />
            <span>{today}</span>
          </div>
          <h1 className="truncate text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
            {businessDisplayName}
          </h1>
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:w-auto">
          <div className="relative w-full sm:min-w-[240px] sm:flex-1 lg:w-72 lg:flex-none">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search…"
              aria-label="Search dashboard"
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-9 text-sm text-slate-800 shadow-sm placeholder:text-slate-400 focus:border-[#0f766e] focus:outline-none focus:ring-4 focus:ring-[#0f766e]/10"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/activities')}
              className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-[#0f172a] px-3 text-sm font-semibold text-white transition hover:bg-slate-800 sm:flex-none sm:px-4"
            >
              <Plus className="h-4 w-4" />
              <span className="whitespace-nowrap">Activity</span>
            </button>
            <button
              onClick={() => navigate('/reports')}
              className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:flex-none sm:px-4"
            >
              <span className="whitespace-nowrap">Reports</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {(scenarios.salesDrop || scenarios.expenseIncrease || scenarios.loanDelay) && (
        <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-3.5 sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-amber-900">
              {scenarios.salesDrop && 'Sales -20% '}
              {scenarios.expenseIncrease && 'Expenses +15% '}
              {scenarios.loanDelay && 'Loan delay'}
            </p>
          </div>
          <button
            onClick={resetAll}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-amber-200 bg-white px-3 text-xs font-semibold text-amber-800 transition hover:bg-amber-50"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reset
          </button>
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-sm sm:col-span-2 xl:col-span-1">
          <CardContent className="p-4 sm:p-5">
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Business health</p>
                <p className="mt-1 text-3xl font-bold tracking-tight text-slate-950">{healthScore}</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${scoreBadgeClass(healthScore)}`}>
                {healthScore >= 80 ? 'Stable' : healthScore >= 60 ? 'Caution' : 'High risk'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Trend</span>
              <span className={`inline-flex items-center gap-1 font-bold ${healthTrend === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
                {healthTrend === 'up' ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                {healthTrendPercent}%
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[#0f766e]"
                style={{ width: `${Math.min(100, Math.max(0, healthScore))}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <CardContent className="p-4 sm:p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Net cash (month)</p>
            <p className="mt-2 truncate text-2xl font-bold tracking-tight text-slate-950">{formatRWF(netCashFlow)}</p>
            <p className="mt-2 text-xs text-slate-500">Margin {profitMargin}%</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <CardContent className="p-4 sm:p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Available cash</p>
            <p className="mt-2 truncate text-2xl font-bold tracking-tight text-slate-950">{formatRWF(currentBalance)}</p>
            <p className="mt-2 text-xs text-slate-500">Runway {cashRunwayDays} days</p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-[#0f766e]" style={{ width: `${runwayWidth}%` }} />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <CardContent className="flex h-full flex-col justify-between p-4 sm:p-5">
            <div className="flex items-start justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Cash mix</p>
              <div className="h-16 w-16 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={cashTotal > 0 ? cashMix : [{ name: 'Empty', value: 1, color: COLORS.line }]}
                      dataKey="value"
                      innerRadius={18}
                      outerRadius={28}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {(cashTotal > 0 ? cashMix : [{ name: 'Empty', value: 1, color: COLORS.line }]).map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="mt-3 space-y-1.5 text-xs">
              <div className="flex justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-slate-500">
                  <span className="h-2 w-2 rounded-full bg-[#0f766e]" /> Inflow
                </span>
                <span className="font-semibold text-slate-800">{formatRWF(monthlyInflow)}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-slate-500">
                  <span className="h-2 w-2 rounded-full bg-slate-400" /> Outflow
                </span>
                <span className="font-semibold text-slate-800">{formatRWF(monthlyOutflow)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart + inventory */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3 lg:gap-4">
        <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-sm lg:col-span-2">
          <CardContent className="p-4 sm:p-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-950">Financial pulse</h3>
                {/* 3-Series Legend */}
                <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs">
                  <div className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: COMPARISON_COLORS.series1 }} />
                    <span>{chartView === 'performance' ? 'Revenue' : 'Cash Inflow'}</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: COMPARISON_COLORS.series2 }} />
                    <span>{chartView === 'performance' ? 'Expenses' : 'Cash Outflow'}</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: COMPARISON_COLORS.series3 }} />
                    <span>{chartView === 'performance' ? 'Net Profit' : 'Net Cash Flow'}</span>
                  </div>
                </div>
              </div>

              <div className="flex w-full rounded-xl bg-slate-100 p-1 sm:w-auto">
                <button
                  onClick={() => setChartView('performance')}
                  className={`h-8 flex-1 rounded-lg px-3 text-xs font-bold transition sm:flex-none ${
                    chartView === 'performance' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Performance
                </button>
                <button
                  onClick={() => setChartView('cashflow')}
                  className={`h-8 flex-1 rounded-lg px-3 text-xs font-bold transition sm:flex-none ${
                    chartView === 'cashflow' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Cash flow
                </button>
              </div>
            </div>

            <div className="h-[250px] w-full sm:h-[300px]">
              {chartData.length === 0 ? (
                <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
                  No data
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 6, left: 0, bottom: 0 }}
                    barGap={1.5}
                    barCategoryGap="18%"
                  >
                    <CartesianGrid strokeDasharray="0" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: '#334155', fontSize: 12, fontWeight: 600 }}
                      axisLine={{ stroke: '#e2e8f0' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(val: number) => formatCompactRWF(val)}
                      width={52}
                    />
                    <Tooltip
                      formatter={(value: number) => formatRWF(value)}
                      contentStyle={{
                        borderRadius: 12,
                        border: `1px solid ${COLORS.line}`,
                        boxShadow: '0 8px 24px rgba(15,23,42,0.08)'
                      }}
                    />
                    <ReferenceLine y={0} stroke="#cbd5e1" />
                    
                    {/* Bar 1: Blue */}
                    <Bar
                      dataKey={chartView === 'performance' ? 'Revenue' : 'Inflow'}
                      name={chartView === 'performance' ? 'Revenue' : 'Cash inflow'}
                      fill={COMPARISON_COLORS.series1}
                      radius={[2, 2, 0, 0]}
                    >
                      <LabelList
                        dataKey={chartView === 'performance' ? 'Revenue' : 'Inflow'}
                        content={renderBarTopLabel(COMPARISON_COLORS.series1)}
                      />
                    </Bar>

                    {/* Bar 2: Khaki / Warm Gray */}
                    <Bar
                      dataKey={chartView === 'performance' ? 'Expenses' : 'Outflow'}
                      name={chartView === 'performance' ? 'Expenses' : 'Cash outflow'}
                      fill={COMPARISON_COLORS.series2}
                      radius={[2, 2, 0, 0]}
                    >
                      <LabelList
                        dataKey={chartView === 'performance' ? 'Expenses' : 'Outflow'}
                        content={renderBarTopLabel(COMPARISON_COLORS.series2)}
                      />
                    </Bar>

                    {/* Bar 3: Rust / Terracotta */}
                    <Bar
                      dataKey={chartView === 'performance' ? 'Profit' : 'NetCash'}
                      name={chartView === 'performance' ? 'Net profit' : 'Net cash flow'}
                      fill={COMPARISON_COLORS.series3}
                      radius={[2, 2, 0, 0]}
                    >
                      <LabelList
                        dataKey={chartView === 'performance' ? 'Profit' : 'NetCash'}
                        content={renderBarTopLabel(COMPARISON_COLORS.series3)}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Footnote matching the screenshot style */}
            <div className="mt-2 text-[10px] text-slate-400">
              * Values in FRW · Filter: 6-Month Trailing Operations
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <CardContent className="p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-950">Inventory</h3>
              <Warehouse className="h-4 w-4 text-slate-400" />
            </div>
            <div className="max-h-[280px] space-y-2 overflow-y-auto pr-0.5 sm:max-h-[320px]">
              {filteredInventory.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
                  <Warehouse className="mx-auto h-7 w-7 text-slate-300" />
                  <p className="mt-2 text-xs font-semibold text-slate-700">
                    {q ? 'No results' : 'No inventory'}
                  </p>
                </div>
              )}
              {filteredInventory.map((item) => (
                <div key={item.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-slate-600 shadow-sm">
                    <Package className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{item.name}</p>
                    <p className="text-[11px] text-slate-500">{item.stockLevel} units · {item.daysRemaining}d</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    item.status === 'Low Stock' || item.status === 'Out of Stock'
                      ? 'bg-red-50 text-red-700'
                      : item.status === 'Overstock'
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts + credit */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3 lg:gap-4">
        <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-sm lg:col-span-2">
          <CardContent className="p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-xl bg-[#ccfbf1] p-2 text-[#0f766e]">
                <BadgeAlert className="h-4 w-4" />
              </div>
              <h3 className="text-base font-bold text-slate-950">Risk alerts</h3>
            </div>
            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
              {filteredAlerts.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center md:col-span-2">
                  <BadgeAlert className="mx-auto h-7 w-7 text-slate-300" />
                  <p className="mt-2 text-sm font-semibold text-slate-700">
                    {q ? 'No results' : 'No alerts'}
                  </p>
                </div>
              )}
              {filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`flex gap-3 rounded-xl border p-3.5 ${
                    alert.type === 'danger'
                      ? 'border-red-100 bg-red-50 text-red-800'
                      : alert.type === 'warning'
                      ? 'border-amber-100 bg-amber-50 text-amber-800'
                      : 'border-slate-100 bg-slate-50 text-slate-700'
                  }`}
                >
                  {alert.type === 'danger' && <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />}
                  {alert.type === 'warning' && <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />}
                  {alert.type === 'info' && <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#0f766e]" />}
                  <p className="text-xs font-medium leading-relaxed">{alert.text}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <CardContent className="space-y-4 p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-950">Credit snapshot</h3>
              <Activity className="h-4 w-4 text-slate-400" />
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-semibold text-slate-500">Borrowing capacity</p>
              <p className="mt-1 text-xl font-bold text-slate-950">{formatRWF(baseCapacity)}</p>
            </div>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500">Health score</span>
                <span className="font-bold" style={{ color: scoreColor(healthScore) }}>{healthScore}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500">Loan status</span>
                <span className="font-bold text-slate-900">{effectiveLoanDetails.status}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500">Outstanding</span>
                <span className="truncate font-bold text-slate-900">{formatRWF(effectiveLoanDetails.outstandingAmount)}</span>
              </div>
            </div>
            <button
              onClick={() => navigate('/opportunity-hub')}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#0f172a] text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <DollarSign className="h-4 w-4" />
              Financing
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
