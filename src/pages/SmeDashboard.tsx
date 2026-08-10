import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { formatRWF } from '../lib/mockData';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
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
  RefreshCw
} from 'lucide-react';
import { Card, CardContent } from '../assets/components/ui/card';

export default function SmeDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === 'FINANCIAL_INSTITUTION') {
      navigate('/banker', { replace: true });
    }
  }, [user, navigate]);

  const { activeSme, scenarios, resetAll } = useApp();

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
    return { month: item.month, Revenue: revenue, Expenses: expenses, Inflow: inflow, Outflow: outflow };
  });

  const currentMonthData = chartData[chartData.length - 1];
  const monthlyInflow    = currentMonthData.Inflow;
  const monthlyOutflow   = currentMonthData.Outflow;
  const netCashFlow      = monthlyInflow - monthlyOutflow;

  const scoreColor = (s: number) =>
    s >= 80 ? '#059669' : s >= 60 ? '#D97706' : '#DC2626';

  const scoreBadgeClass = (s: number) =>
    s >= 80
      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
      : s >= 60
      ? 'bg-amber-50 text-amber-700 border border-amber-200'
      : 'bg-red-50 text-red-700 border border-red-200';



  return (
    <div className="space-y-5 bg-gray-50 min-h-screen p-5">

      {/* ── Scenario banner ── */}
      {(scenarios.salesDrop || scenarios.expenseIncrease || scenarios.loanDelay) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-2.5 w-2.5 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
            <div>
              <p className="text-sm font-semibold text-amber-900">
                What-If Scenarios Active
              </p>
              <p className="text-xs text-amber-700 mt-0.5 font-medium">
                Showing simulated impacts: {scenarios.salesDrop && '[-20% Sales Drop] '}{scenarios.expenseIncrease && '[+15% Expense Increase] '}{scenarios.loanDelay && '[Loan Delay]'}
              </p>
            </div>
          </div>
          <button
            onClick={resetAll}
            className="flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-lg border border-amber-200 text-xs font-semibold text-amber-800 bg-white hover:bg-amber-50 hover:border-amber-300 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Projections</span>
          </button>
        </div>
      )}

      {/* ── Top 3 cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Business health */}
        <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md hover:bg-slate-50/20 transition duration-150">
          <CardContent className="p-6 flex flex-col justify-between h-full">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider font-heading">Business Health</h3>
                <p className="text-[10px] text-gray-400 mt-0.5">AI-Powered Risk Profile</p>
              </div>
              <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded ${scoreBadgeClass(healthScore)}`}>
                {healthScore >= 80 ? 'Stable' : healthScore >= 60 ? 'Caution' : 'High Risk'}
              </span>
            </div>

            <div className="flex items-center gap-6 my-2">
              {/* Radial ring */}
              <div className="relative flex items-center justify-center shrink-0">
                <svg className="w-24 h-24 -rotate-90" aria-hidden="true">
                  <circle cx="48" cy="48" r="40" stroke="#E5E7EB" strokeWidth="8" fill="transparent" />
                  <circle
                    cx="48" cy="48" r="40"
                    stroke={scoreColor(healthScore)}
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 40}
                    strokeDashoffset={((100 - healthScore) / 100) * (2 * Math.PI * 40)}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-bold text-slate-800 font-mono">{healthScore}</span>
                  <span className="text-[10px] text-gray-400 font-medium font-mono">/ 100</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  {healthTrend === 'up'
                    ? <TrendingUp  className="w-4 h-4 text-emerald-500" />
                    : healthTrend === 'down'
                    ? <TrendingDown className="w-4 h-4 text-red-500" />
                    : <span className="w-2 h-0.5 bg-gray-400 rounded inline-block" />}
                  <span className={`text-sm font-semibold ${
                    healthTrend === 'up' ? 'text-emerald-600' : healthTrend === 'down' ? 'text-red-600' : 'text-gray-500'
                  }`}>
                    {healthTrendPercent}%{' '}
                    {healthTrend === 'up' ? 'increase' : healthTrend === 'down' ? 'decrease' : 'stable'}
                  </span>
                </div>
                <p className="text-xs text-gray-400">vs last quarter</p>
              </div>
            </div>

            <div className="mt-auto pt-3 border-t border-gray-100 flex justify-between text-xs text-gray-500">
              <span>Industry avg: 71/100</span>
              <span className="font-semibold text-gray-700">Top 15% in sector</span>
            </div>
          </CardContent>
        </Card>

        {/* Cash reserves */}
        <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md hover:bg-slate-50/20 transition duration-150">
          <CardContent className="p-6 flex flex-col justify-between h-full">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider font-heading">Cash Reserves</h3>
                <p className="text-[10px] text-gray-400 mt-0.5">Live Account Balance</p>
              </div>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>

            <div className="my-2">
              <span className="text-2xl font-semibold text-gray-900 tracking-tight block">
                {formatRWF(currentBalance)}
              </span>
              <div className="flex items-center gap-2 mt-2">
                <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
                  netCashFlow >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                }`}>
                  {netCashFlow >= 0 ? '+' : ''}{formatRWF(netCashFlow)} net flow
                </span>
                <span className="text-xs text-gray-400">this month</span>
              </div>
            </div>

            <div className="mt-auto pt-3 border-t border-gray-100 grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-gray-400 block mb-0.5">Monthly inflow</span>
                <span className="font-semibold text-emerald-600">{formatRWF(monthlyInflow)}</span>
              </div>
              <div>
                <span className="text-gray-400 block mb-0.5">Monthly outflow</span>
                <span className="font-semibold text-red-600">{formatRWF(monthlyOutflow)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Credit capability */}
        <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md hover:bg-slate-50/20 transition duration-150">
          <CardContent className="p-6 flex flex-col justify-between h-full">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider font-heading">Credit Capability</h3>
                <p className="text-[10px] text-gray-400 mt-0.5">AI-Calculated Pre-Approval</p>
              </div>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <Activity className="w-4 h-4" />
              </div>
            </div>

            <div className="my-2">
              <span className="text-2xl font-bold text-slate-900 tracking-tight block font-mono">
                {formatRWF(activeSme.borrowingCapacity)}
              </span>
              <div className="flex items-center space-x-2 mt-2">
                <span className={`w-2 h-2 rounded-full ${activeSme.riskRating === 'Low' ? 'bg-emerald-500' : activeSme.riskRating === 'Medium' ? 'bg-amber-500' : 'bg-rose-500'}`}></span>
                <span className="text-[10px] text-gray-500 font-semibold">{activeSme.riskRating} Borrowing Risk</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-mono">
              <span className="text-gray-500 font-sans">Active Debt:</span>
              <span className="font-semibold text-slate-800">
                {activeSme.loanDetails.status === 'Active'
                  ? `${formatRWF(activeSme.loanDetails.outstandingAmount)}`
                  : 'None'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Mid: chart + inventory ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Revenue vs Expenses chart */}
        <div className="lg:col-span-2">
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-heading">Revenue vs Operational Expenses</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Monthly history and trend (FRW)</p>
                </div>
                <div className="flex items-center space-x-4 text-xs font-semibold text-gray-500">
                  <div className="flex items-center">
                    <span className="w-3 h-3 bg-emerald-500 rounded mr-1.5"></span>
                    <span>Revenue</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-3 h-3 bg-slate-300 rounded mr-1.5"></span>
                    <span>Expenses</span>
                  </div>
                </div>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: 'monospace' }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: 'monospace' }}
                      tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`}
                    />
                    <Tooltip
                      formatter={(value: any) => [formatRWF(value), '']}
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        border: 'none',
                        borderRadius: '6px',
                        color: '#F9FAFB',
                        fontSize: '11px',
                        fontFamily: 'monospace'
                      }}
                    />
                    <Bar dataKey="Revenue" fill="#10B981" radius={[2, 2, 0, 0]} barSize={20} />
                    <Bar dataKey="Expenses" fill="#94A3B8" radius={[2, 2, 0, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Inventory status */}
        <Card className="bg-white border border-gray-200 shadow-sm flex flex-col justify-between">
          <CardContent className="p-6 h-full flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
                <h3 className="text-sm font-bold text-slate-900 font-heading">Inventory Status</h3>
                <span className="p-1 bg-emerald-50 text-emerald-600 rounded">
                  <Warehouse className="w-4 h-4" />
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-4">Stock alert levels and days of runway</p>

              <div className="space-y-3.5">
                {activeSme.inventoryItems.map((item) => (
                  <div key={item.id} className="p-3 border border-gray-100 rounded-xl hover:bg-slate-50/50 transition">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-semibold text-slate-800 block truncate max-w-[150px]">
                        {item.name}
                      </span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                        item.status === 'Low Stock'
                          ? 'bg-rose-50 text-rose-600 border-rose-100'
                          : item.status === 'Overstock'
                          ? 'bg-amber-50 text-amber-600 border-amber-100'
                          : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                      }`}>
                        {item.status}
                      </span>
                    </div>

                    <div className="flex justify-between items-center mt-2 text-[10px] text-gray-500 font-mono">
                      <span className="font-sans">Stock: {item.stockLevel} units</span>
                      <span className="font-semibold text-slate-700">
                        {item.daysRemaining} days remaining
                      </span>
                    </div>

                    <div className="w-full bg-gray-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          item.status === 'Low Stock'
                            ? 'bg-red-500'
                            : item.status === 'Overstock'
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, (item.stockLevel / (item.reorderPoint * 2)) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 font-medium">Reorder Recommendation</span>
                <span className="text-emerald-600 font-bold hover:underline flex items-center cursor-pointer">
                  Generate PO <ArrowRight className="w-3 h-3 ml-1" />
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── AI Risk alerts ── */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3 mb-4 pb-3 border-b border-gray-100">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <BadgeAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-heading">AI-Generated Financial Risk Alerts</h3>
              <p className="text-xs text-slate-500 mt-0.5">Real-time alerts processed from cashflow, ledger, and market trends</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
            {activeSme.riskAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3.5 rounded-xl border flex gap-3 ${
                  alert.type === 'danger'
                    ? 'bg-rose-50/50 border-rose-200 text-rose-800'
                    : alert.type === 'warning'
                    ? 'bg-amber-50/50 border-amber-200 text-amber-800'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                {alert.type === 'danger' && <AlertTriangle className="w-4.5 h-4.5 text-red-500 flex-shrink-0 mt-0.5" />}
                {alert.type === 'warning' && <AlertTriangle className="w-4.5 h-4.5 text-amber-500 flex-shrink-0 mt-0.5" />}
                {alert.type === 'info' && <Info className="w-4.5 h-4.5 text-blue-500 flex-shrink-0 mt-0.5" />}
                <p className="text-[11px] leading-relaxed font-medium">{alert.text}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}