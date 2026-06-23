import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatRWF } from '../lib/mockData';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Sliders,
  Sparkles,
  PieChart as PieIcon,
  LineChart as LineIcon,
  HelpCircle,
  Building,
  Calendar
} from 'lucide-react';
import { Card, CardContent } from '../assets/components/ui/card';

export default function SmeAdvisor() {
  const {
    activeSme,
    scenarios,
    setScenarios,
    loanSimulation,
    setLoanSimulation
  } = useApp();

  // Calculations for Loan Simulation
  const monthlyRepayment = useMemo(() => {
    const P = loanSimulation.amount;
    const r = (loanSimulation.rate / 100) / 12;
    const n = loanSimulation.period;

    if (r === 0) return Math.round(P / n);
    // Standard amortization formula: M = P * [r(1+r)^n] / [(1+r)^n - 1]
    const monthly = P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    return Math.round(monthly);
  }, [loanSimulation]);

  // Projected Net Profit Impact
  // Let's assume investment yields 25% annual ROI, so monthly profit increase is:
  // (Amount * 0.25) / 12 minus monthly repayment interest portion
  const monthlyProfitBoost = useMemo(() => {
    const roiAnnual = 0.32; // 32% ROI on modern equipment/inventory expansion
    const boost = (loanSimulation.amount * roiAnnual) / 12;
    return Math.round(boost);
  }, [loanSimulation]);

  // Calculate Net Profit Impact
  const netProfitImpact = monthlyProfitBoost - (monthlyRepayment - (loanSimulation.amount / loanSimulation.period));

  // Determine Risk Level of Simulated Loan
  const simulatedRiskLevel = useMemo(() => {
    // Risk depends on Debt Service Coverage Ratio (DSCR)
    // DSCR = (Average Monthly Net Profit) / Monthly Repayment
    const avgMonthlyNetProfit = activeSme.monthlyData.reduce((acc, curr) => acc + (curr.revenue - curr.expenses), 0) / activeSme.monthlyData.length;
    const dscr = avgMonthlyNetProfit / monthlyRepayment;

    if (dscr > 2.0 && loanSimulation.amount <= activeSme.borrowingCapacity) return 'Low';
    if (dscr > 1.2 && loanSimulation.amount <= activeSme.borrowingCapacity * 1.3) return 'Medium';
    return 'High';
  }, [loanSimulation, activeSme, monthlyRepayment]);

  // Loan Usage allocation: Inventory, Operations, Equipment
  const usageAllocation = useMemo(() => {
    // Dynamic allocation based on SME sector
    if (activeSme.sector === 'Retail') {
      return [
        { name: 'Inventory', value: 50, color: '#10B981' },
        { name: 'Operations', value: 20, color: '#94A3B8' },
        { name: 'Equipment', value: 30, color: '#3B82F6' }
      ];
    }
    if (activeSme.sector === 'Agriculture') {
      return [
        { name: 'Inventory', value: 30, color: '#10B981' },
        { name: 'Operations', value: 25, color: '#94A3B8' },
        { name: 'Equipment', value: 45, color: '#3B82F6' }
      ];
    }
    if (activeSme.sector === 'Logistics') {
      return [
        { name: 'Inventory', value: 15, color: '#10B981' },
        { name: 'Operations', value: 25, color: '#94A3B8' },
        { name: 'Equipment', value: 60, color: '#3B82F6' }
      ];
    }
    // Technology
    return [
      { name: 'Inventory', value: 10, color: '#10B981' },
      { name: 'Operations', value: 60, color: '#94A3B8' },
      { name: 'Equipment', value: 30, color: '#3B82F6' }
    ];
  }, [activeSme]);

  // AI Recommendation Text
  const aiRecommendation = useMemo(() => {
    const limit = activeSme.borrowingCapacity;
    let timing = 'Next 30 Days (Pre-harvest cash squeeze)';
    let bank = 'Bank of Kigali (BK) - SME Expansion Loan';

    if (activeSme.sector === 'Technology') {
      timing = 'Quarter Q3 start (align with renewal cycle)';
      bank = 'I&M Bank - Tech SME Credit Line';
    } else if (activeSme.sector === 'Retail') {
      timing = 'End of September (prior to holiday shopping restocking)';
      bank = 'Equity Bank Rwanda - Retail working capital';
    } else if (activeSme.sector === 'Logistics') {
      timing = 'Immediate (re-finance older vehicle debt)';
      bank = 'BPR Bank Rwanda - Asset Financing Plan';
    }

    return {
      suggestedAmount: Math.round(limit * 0.95),
      timing,
      bank,
      reasoning: `Based on your average monthly net cash inflow of ${formatRWF(activeSme.currentBalance / 6)} and current debt leverage, a credit facility of ${formatRWF(limit * 0.95)} minimizes borrowing costs while providing 3.2x coverage for inventory restocking.`
    };
  }, [activeSme]);

  // 6-Month Profit Forecast Line Chart Data
  const forecastData = useMemo(() => {
    const data = [];
    const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Average historical performance
    const lastMonth = activeSme.monthlyData[activeSme.monthlyData.length - 1];
    let baseRevenue = lastMonth.revenue;
    let baseExpenses = lastMonth.expenses;

    for (let i = 0; i < 6; i++) {
      // Base growth: 2.2% MoM
      let monthRev = baseRevenue * Math.pow(1.022, i + 1);
      let monthExp = baseExpenses * Math.pow(1.015, i + 1);

      // Apply scenarios on Base
      if (scenarios.salesDrop) {
        monthRev = monthRev * 0.80; // 20% drop
      }
      if (scenarios.expenseIncrease) {
        monthExp = monthExp * 1.15; // 15% increase
      }

      const baseProfit = Math.round(monthRev - monthExp);

      // Simulated scenario (with loan)
      let simRev = monthRev;
      let simExp = monthExp;

      // Add loan repayment cost immediately
      simExp += monthlyRepayment;

      // Add positive ROI impact of loan
      // If loanDelay is active, the boost is delayed by 2 months (i.e. starts at index 2)
      const isDelayed = scenarios.loanDelay;
      if (!isDelayed || i >= 2) {
        // Boost builds up month-by-month (e.g. 50% month 1, 80% month 2, 100% month 3 onwards)
        const realizationFactor = i === 0 && !isDelayed ? 0.6 : i === 1 && !isDelayed ? 0.85 : 1.0;
        simRev += (monthlyProfitBoost * realizationFactor);
      }

      const simProfit = Math.round(simRev - simExp);

      data.push({
        month: months[i],
        'Base Profit': baseProfit,
        'Simulated Profit': simProfit
      });
    }

    return data;
  }, [activeSme, loanSimulation, monthlyRepayment, monthlyProfitBoost, scenarios]);

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Loan Simulator & Credit Planner</h2>
          <p className="text-xs text-gray-500 mt-0.5">Simulate investments, toggle what-if macro events, and evaluate cash runways.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Loan Simulation & Scenario Controls */}
        <div className="space-y-6 lg:col-span-1">
          {/* 1. Loan Simulation Tool */}
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center space-x-2.5 pb-2 border-b border-gray-100">
                <Sliders className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-800 font-heading">Loan Simulation Tool</h3>
              </div>

              {/* Slider for Loan Amount */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-550 font-semibold">Loan Amount (RWF)</span>
                  <span className="text-emerald-600 font-bold font-mono">{formatRWF(loanSimulation.amount)}</span>
                </div>
                <input
                  type="range"
                  min="1000000"
                  max="20000000"
                  step="500000"
                  value={loanSimulation.amount}
                  onChange={(e) => setLoanSimulation(prev => ({ ...prev, amount: Number(e.target.value) }))}
                  className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
                <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                  <span>1M RWF</span>
                  <span>10M RWF</span>
                  <span>20M RWF</span>
                </div>
              </div>

              {/* Period Selector */}
              <div className="space-y-2">
                <label className="text-xs text-gray-500 font-semibold block">Repayment Period</label>
                <div className="grid grid-cols-5 gap-1.5 font-mono">
                  {[6, 12, 18, 24, 36].map((m) => (
                    <button
                      key={m}
                      onClick={() => setLoanSimulation(prev => ({ ...prev, period: m }))}
                      className={`py-1.5 text-xs font-bold rounded-lg border transition ${
                        loanSimulation.period === m
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                          : 'border-gray-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {m}M
                    </button>
                  ))}
                </div>
              </div>

              {/* Fixed Interest Rate */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <label className="text-gray-500 font-semibold">Annual Interest Rate (%)</label>
                  <span className="text-slate-700 font-bold font-mono">{loanSimulation.rate}%</span>
                </div>
                <input
                  type="number"
                  min="5"
                  max="30"
                  value={loanSimulation.rate}
                  onChange={(e) => setLoanSimulation(prev => ({ ...prev, rate: Math.max(1, Number(e.target.value)) }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none font-mono"
                />
              </div>

              {/* Simulated Outputs */}
              <div className="bg-slate-50 rounded-xl p-4 space-y-3.5 border border-slate-200 font-mono">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-sans">Monthly Repayment:</span>
                  <span className="font-semibold text-slate-900">{formatRWF(monthlyRepayment)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-sans">Net Profit Boost:</span>
                  <span className="font-semibold text-emerald-600">+{formatRWF(monthlyProfitBoost)}/mo</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-sans">Monthly Net Impact:</span>
                  <span className={`font-semibold ${netProfitImpact >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {netProfitImpact >= 0 ? '+' : ''}{formatRWF(netProfitImpact)}/mo
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-sans">Simulated Risk Level:</span>
                  <span className={`px-2 py-0.5 rounded font-bold font-sans border ${
                    simulatedRiskLevel === 'Low'
                      ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                      : simulatedRiskLevel === 'Medium'
                      ? 'bg-amber-50 border-amber-100 text-amber-700'
                      : 'bg-rose-50 border-rose-100 text-rose-700'
                  }`}>
                    {simulatedRiskLevel}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 5. What-if Scenario Toggles */}
          <Card className="bg-white border border-gray-100 shadow-sm">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center space-x-2.5 pb-2 border-b border-gray-100">
                <HelpCircle className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-800">What-if Scenarios</h3>
              </div>

              <div className="space-y-3">
                {/* Sales Drop Toggle */}
                <div className="flex items-center justify-between p-3 rounded-lg border border-gray-50 hover:bg-gray-50/50 transition">
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">Sales Drop Scenario</span>
                    <span className="text-[10px] text-gray-400">Simulate -20% customer demand decline</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={scenarios.salesDrop}
                      onChange={(e) => setScenarios(prev => ({ ...prev, salesDrop: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>

                {/* Expense Increase Toggle */}
                <div className="flex items-center justify-between p-3 rounded-lg border border-gray-50 hover:bg-gray-50/50 transition">
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">Operating Costs Spike</span>
                    <span className="text-[10px] text-gray-400">Simulate +15% fuel/logistics surge</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={scenarios.expenseIncrease}
                      onChange={(e) => setScenarios(prev => ({ ...prev, expenseIncrease: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>

                {/* Loan Delay Toggle */}
                <div className="flex items-center justify-between p-3 rounded-lg border border-gray-50 hover:bg-gray-50/50 transition">
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">Disbursement Deferment</span>
                    <span className="text-[10px] text-gray-400">Simulate 60-day delay in capital boost</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={scenarios.loanDelay}
                      onChange={(e) => setScenarios(prev => ({ ...prev, loanDelay: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Projections, Breakdown & Recommendations */}
        <div className="space-y-6 lg:col-span-2">
          {/* 4. 3-6 Month Financial Forecast Chart */}
          <Card className="bg-white border border-gray-100 shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
                <div className="flex items-center space-x-2">
                  <LineIcon className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-800 font-heading">6-Month Net Profit Forecast Projections</h3>
                </div>
                <div className="flex items-center space-x-4 text-xs font-semibold text-gray-500">
                  <div className="flex items-center">
                    <span className="w-3 h-0.5 border-t-2 border-dashed border-gray-300 mr-2"></span>
                    <span>Base Trend</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-3 h-0.5 border-t-2 border-blue-500 mr-2"></span>
                    <span>Simulated (With Credit)</span>
                  </div>
                </div>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={forecastData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
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
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        border: 'none',
                        borderRadius: '6px',
                        color: '#F9FAFB',
                        fontSize: '11px',
                        fontFamily: 'JetBrains Mono'
                      }}
                    />
                    <Line type="monotone" dataKey="Base Profit" stroke="#94A3B8" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                    <Line type="monotone" dataKey="Simulated Profit" stroke="#3B82F6" strokeWidth={2.5} dot={{ strokeWidth: 1.5, r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 3. Loan Usage Breakdown */}
            <Card className="bg-white border border-gray-100 shadow-sm flex flex-col justify-between">
              <CardContent className="p-6 h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-2.5 pb-2 border-b border-gray-100 mb-4">
                    <PieIcon className="w-5 h-5 text-emerald-600" />
                    <h3 className="text-sm font-bold text-slate-800">Recommended Allocation</h3>
                  </div>

                  <div className="flex items-center justify-center h-44 my-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={usageAllocation}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {usageAllocation.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => [`${value}%`, 'Allocation']}
                          contentStyle={{ fontSize: '11px', borderRadius: '6px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="space-y-2.5 mt-2">
                  {usageAllocation.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <div className="flex items-center">
                        <span className="w-3 h-3 rounded-sm mr-2" style={{ backgroundColor: item.color }}></span>
                        <span className="text-gray-600 font-semibold">{item.name}</span>
                      </div>
                      <span className="font-bold text-slate-800">
                        {item.value}% ({formatRWF(Math.round(loanSimulation.amount * (item.value / 100)))})
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

             {/* 2. AI Loan Recommendation Panel */}
             <Card className="bg-white border border-gray-200 shadow-sm flex flex-col justify-between">
               <CardContent className="p-6 h-full flex flex-col justify-between space-y-4">
                 <div>
                   <div className="flex items-center space-x-2 pb-3 border-b border-gray-150">
                     <Sparkles className="w-5 h-5 text-emerald-600" />
                     <h3 className="text-sm font-bold text-slate-800 font-heading">AI Loan Recommendations</h3>
                   </div>

                   <div className="space-y-4 mt-4">
                     <div>
                       <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Recommended Principal</span>
                       <span className="text-xl font-bold text-emerald-650 font-mono mt-1 block text-emerald-600">{formatRWF(aiRecommendation.suggestedAmount)}</span>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                       <div>
                         <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block flex items-center">
                           <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" /> Best Timing
                         </span>
                         <span className="text-xs font-semibold text-slate-700 mt-1 block leading-relaxed">{aiRecommendation.timing}</span>
                       </div>
                       <div>
                         <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block flex items-center">
                           <Building className="w-3.5 h-3.5 mr-1 text-slate-400" /> Target Lender
                         </span>
                         <span className="text-xs font-semibold text-slate-700 mt-1 block leading-relaxed">{aiRecommendation.bank}</span>
                       </div>
                     </div>
                   </div>
                 </div>

                 <div className="bg-slate-50 rounded-xl p-3 border border-slate-205 text-xs text-slate-600 leading-relaxed mt-2">
                   <span className="font-bold text-slate-800 block mb-1">AI Reasoning Engine:</span>
                   {aiRecommendation.reasoning}
                 </div>
               </CardContent>
             </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
