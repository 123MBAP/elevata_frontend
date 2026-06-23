import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatRWF } from '../lib/mockData';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import {
  FileBarChart,
  Calendar,
  Download,
  Percent
} from 'lucide-react';
import { Card, CardContent } from '../assets/components/ui/card';
import { Button } from '../assets/components/ui/button';

export default function Reports() {
  const { activeSme } = useApp();
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');

  // Compute stats from active SME monthlyData
  const reportsData = activeSme.monthlyData.map(item => {
    const profit = item.revenue - item.expenses;
    const margin = item.revenue > 0 ? Math.round((profit / item.revenue) * 100) : 0;
    return {
      month: item.month,
      Revenue: item.revenue,
      Expenses: item.expenses,
      Profit: profit,
      Margin: margin
    };
  });

  const totalSales = reportsData.reduce((sum, item) => sum + item.Revenue, 0);
  const totalExpenses = reportsData.reduce((sum, item) => sum + item.Expenses, 0);
  const totalProfit = totalSales - totalExpenses;
  const averageMargin = reportsData.length > 0
    ? Math.round(reportsData.reduce((sum, item) => sum + item.Margin, 0) / reportsData.length)
    : 0;

  // Growth compared to previous period (last month vs second-to-last month)
  const lastIndex = reportsData.length - 1;
  const currentMonthProfit = lastIndex >= 0 ? reportsData[lastIndex].Profit : 0;
  const prevMonthProfit = lastIndex >= 1 ? reportsData[lastIndex - 1].Profit : 0;
  
  const profitGrowth = prevMonthProfit > 0
    ? (((currentMonthProfit - prevMonthProfit) / prevMonthProfit) * 100).toFixed(1)
    : '0.0';

  const handleExport = () => {
    alert(`Generating export files for ${activeSme.name} (${selectedPeriod} ledger statement)...`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 font-heading">Financial Reports & Performance Analytics</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Evaluate corporate cash flow statements, net operating income, and margins for <span className="text-emerald-600 font-bold">{activeSme.name}</span>.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative w-40">
            <Calendar className="absolute left-2.5 top-2 w-4 h-4 text-gray-400" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white text-slate-700"
            >
              <option value="weekly">Weekly Statements</option>
              <option value="monthly">Monthly Reports</option>
              <option value="quarterly">Quarterly Reports</option>
              <option value="yearly">Yearly Reports</option>
            </select>
          </div>
          <Button
            onClick={handleExport}
            className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center space-x-1.5 h-8.5 text-xs font-bold"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Statement</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white border border-gray-200 shadow-sm hover:shadow transition">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block font-heading">Total Sales</span>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                +11.8%
              </span>
            </div>
            <span className="text-lg font-bold text-slate-800 block truncate font-mono" title={formatRWF(totalSales)}>
              {formatRWF(totalSales)}
            </span>
            <span className="text-[10px] text-gray-400 mt-1 block">YTD Accumulation</span>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-sm hover:shadow transition">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block font-heading">Total Expenses</span>
              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                +6.2%
              </span>
            </div>
            <span className="text-lg font-bold text-slate-850 block truncate font-mono" title={formatRWF(totalExpenses)}>
              {formatRWF(totalExpenses)}
            </span>
            <span className="text-[10px] text-gray-400 mt-1 block">Operational Overheads</span>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-sm hover:shadow transition">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block font-heading">Net Operating Profit</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                Number(profitGrowth) >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
              }`}>
                {Number(profitGrowth) >= 0 ? '+' : ''}{profitGrowth}%
              </span>
            </div>
            <span className="text-lg font-bold text-slate-900 block truncate font-mono" title={formatRWF(totalProfit)}>
              {formatRWF(totalProfit)}
            </span>
            <span className="text-[10px] text-gray-400 mt-1 block">MoM Performance Net</span>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-sm hover:shadow transition">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block font-heading">Net Profit Margin</span>
              <span className="text-emerald-600 bg-emerald-50 p-1 rounded">
                <Percent className="w-3.5 h-3.5" />
              </span>
            </div>
            <span className="text-lg font-bold text-slate-800 block font-mono">
              {averageMargin}%
            </span>
            <span className="text-[10px] text-gray-400 mt-1 block">Average Profit Ratio</span>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales vs Expenses Trend */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-slate-800 flex items-center font-heading">
                <FileBarChart className="w-4.5 h-4.5 text-emerald-600 mr-2" /> Sales vs Operational Cost Trends
              </h3>
              <span className="text-[10px] text-gray-400">6-Month Trend</span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={reportsData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                    tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip
                    formatter={(value: any) => [formatRWF(value), '']}
                    contentStyle={{ fontSize: '11px', borderRadius: '6px', fontFamily: 'JetBrains Mono' }}
                  />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                  <Line type="monotone" dataKey="Revenue" stroke="#10B981" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Expenses" stroke="#94A3B8" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Profit Margin Analysis Area Chart */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-slate-800 flex items-center font-heading">
                <Percent className="w-4.5 h-4.5 text-emerald-500 mr-2" /> Net Margin Profitability
              </h3>
              <span className="text-[10px] text-gray-400">6-Month Rate (%)</span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={reportsData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMargin" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                    tickFormatter={(val) => `${val}%`}
                  />
                  <Tooltip
                    formatter={(value: any) => [`${value}%`, 'Net Margin']}
                    contentStyle={{ fontSize: '11px', borderRadius: '6px', fontFamily: 'JetBrains Mono' }}
                  />
                  <Area type="monotone" dataKey="Margin" stroke="#10B981" fillOpacity={1} fill="url(#colorMargin)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ledger Table */}
      <Card className="bg-white border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 pb-2">
          <h3 className="text-sm font-bold text-slate-800 font-heading">Monthly Cash Breakdown Statement</h3>
        </div>

        <div className="overflow-x-auto px-6">
          <table className="w-full text-left border-collapse text-xs mt-3">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                <th className="pb-3 font-semibold">Month</th>
                <th className="pb-3 font-semibold">Revenue Sales</th>
                <th className="pb-3 font-semibold">Overheads</th>
                <th className="pb-3 font-semibold">Net Profit</th>
                <th className="pb-3 font-semibold">Operating Margin</th>
                <th className="pb-3 font-semibold text-right">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {reportsData.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50 transition">
                  <td className="py-3.5 font-bold text-slate-800 font-heading">{item.month}</td>
                  <td className="py-3.5 font-semibold text-emerald-600 font-mono">{formatRWF(item.Revenue)}</td>
                  <td className="py-3.5 font-semibold text-rose-600 font-mono">{formatRWF(item.Expenses)}</td>
                  <td className="py-3.5 font-semibold text-slate-800 font-mono">{formatRWF(item.Profit)}</td>
                  <td className="py-3.5 font-bold text-slate-700 font-mono">{item.Margin}%</td>
                  <td className="py-3.5 text-right">
                    {idx > 0 ? (
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded font-bold text-[9px] border font-mono ${
                        item.Revenue > reportsData[idx - 1].Revenue ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'
                      }`}>
                        {item.Revenue > reportsData[idx - 1].Revenue ? '↗ ' : '↘ '}
                        {Math.abs(Math.round(((item.Revenue - reportsData[idx - 1].Revenue) / reportsData[idx - 1].Revenue) * 100))}%
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}