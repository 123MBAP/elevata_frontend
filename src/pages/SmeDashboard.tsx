import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { formatRWF } from '../lib/mockData';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
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

/** Elevata standard palette — keep chart/UI accents to this set only */
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

  let healthScore        = activeSme.healthScore;
  let currentBalance     = activeSme.currentBalance;
  let healthTrend        = activeSme.healthTrend;
  let healthTrendPercent = activeSme.healthTrendPercent;

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

  const chartData = activeSme.monthlyData.map((item, idx) => {
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
    if (!q) return activeSme.inventoryItems;
    return activeSme.inventoryItems.filter((item) =>
      [item.name, item.status, item.category, String(item.stockLevel)].join(' ').toLowerCase().includes(q)
    );
  }, [activeSme.inventoryItems, q]);

  const filteredAlerts = useMemo(() => {
    if (!q) return activeSme.riskAlerts;
    return activeSme.riskAlerts.filter((alert) =>
      [alert.text, alert.type].join(' ').toLowerCase().includes(q)
    );
  }, [activeSme.riskAlerts, q]);

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
            {activeSme.id ? activeSme.name : 'Dashboard'}
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
              <h3 className="text-base font-bold text-slate-950">Financial pulse</h3>
              <div className="flex w-full rounded-xl bg-slate-100 p-1 sm:w-auto">
                <button
                  onClick={() => setChartView('performance')}
                  className={`h-8 flex-1 rounded-lg px-3 text-xs font-bold transition sm:flex-none ${
                    chartView === 'performance' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Performance
                </button>
                <button
                  onClick={() => setChartView('cashflow')}
                  className={`h-8 flex-1 rounded-lg px-3 text-xs font-bold transition sm:flex-none ${
                    chartView === 'cashflow' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Cash flow
                </button>
              </div>
            </div>
            <div className="h-[220px] w-full sm:h-[280px]">
              {chartData.length === 0 ? (
                <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
                  No data
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.line} />
                    <XAxis dataKey="month" tick={{ fill: COLORS.slate, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: COLORS.slate, fontSize: 11 }} axisLine={false} tickLine={false} width={56} />
                    <Tooltip
                      formatter={(value: number) => formatRWF(value)}
                      contentStyle={{
                        borderRadius: 12,
                        border: `1px solid ${COLORS.line}`,
                        boxShadow: '0 8px 24px rgba(15,23,42,0.08)'
                      }}
                    />
                    <ReferenceLine y={0} stroke={COLORS.line} />
                    <Bar
                      dataKey={chartView === 'performance' ? 'Revenue' : 'Inflow'}
                      name={chartView === 'performance' ? 'Revenue' : 'Cash inflow'}
                      fill={COLORS.primary}
                      radius={[6, 6, 0, 0]}
                      maxBarSize={22}
                    />
                    <Bar
                      dataKey={chartView === 'performance' ? 'Expenses' : 'Outflow'}
                      name={chartView === 'performance' ? 'Expenses' : 'Cash outflow'}
                      fill={COLORS.secondary}
                      radius={[6, 6, 0, 0]}
                      maxBarSize={22}
                    />
                    <Line
                      type="monotone"
                      dataKey={chartView === 'performance' ? 'Profit' : 'NetCash'}
                      name={chartView === 'performance' ? 'Net profit' : 'Net cash flow'}
                      stroke={COLORS.ink}
                      strokeWidth={2}
                      dot={{ r: 2.5, fill: '#fff', stroke: COLORS.ink, strokeWidth: 2 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
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
              <p className="mt-1 text-xl font-bold text-slate-950">{formatRWF(activeSme.borrowingCapacity)}</p>
            </div>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500">Health score</span>
                <span className="font-bold" style={{ color: scoreColor(healthScore) }}>{healthScore}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500">Loan status</span>
                <span className="font-bold text-slate-900">{activeSme.loanDetails.status}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500">Outstanding</span>
                <span className="truncate font-bold text-slate-900">{formatRWF(activeSme.loanDetails.outstandingAmount)}</span>
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
