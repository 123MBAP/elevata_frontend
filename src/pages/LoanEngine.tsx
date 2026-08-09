import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatRWF } from '../lib/mockData';
import { Card, CardContent } from '../assets/components/ui/card';
import { Button } from '../assets/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine
} from 'recharts';
import {
  BrainCircuit,
  Landmark,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  HelpCircle,
  FileText,
  BadgePercent,
  Sparkles,
  PieChart as PieIcon
} from 'lucide-react';

interface LoanRecommendation {
  amount: number;
  term: number;
  purpose: string;
  confidence: number;
  reason: string;
  impact: string;
}

interface FinancialInstitution {
  name: string;
  interestRate: number;
  maxTerm: number;
  minAmount: number;
  maxAmount: number;
  rating: number;
  approvalTime: string;
  specialFeatures: string[];
}

interface RepaymentSchedule {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  remainingBalance: number;
}

export default function LoanEngine() {
  const { activeSme } = useApp();

  // Selected option & calculations states
  const [selectedLoan, setSelectedLoan] = useState<LoanRecommendation | null>(null);
  const [repaymentSchedule, setRepaymentSchedule] = useState<RepaymentSchedule[]>([]);
  const [institutions, setInstitutions] = useState<FinancialInstitution[]>([]);
  const [showDetails, setShowDetails] = useState(false);

  // Custom simulation inputs
  const [customAmount, setCustomAmount] = useState<number>(3000000);
  const [customTerm, setCustomTerm] = useState<number>(24);

  const handleSimulateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (customAmount <= 0) return;

    const customLoan: LoanRecommendation = {
      amount: customAmount,
      term: customTerm,
      purpose: 'Custom Simulated Loan Facility',
      confidence: Math.round(activeSme.healthScore * 0.95 > 98 ? 98 : activeSme.healthScore * 0.95),
      reason: `Simulated custom pricing structure for requested principal amount of ${formatRWF(customAmount)} amortized over ${customTerm} monthly installments.`,
      impact: `Yields quick liquid working buffer of ${formatRWF(customAmount)} to satisfy custom operational demands.`
    };
    calculateLoanPlan(customLoan);
  };

  // Map active SME details to loan calculations
  const creditScore = useMemo(() => {
    return Math.round(550 + (activeSme.healthScore / 100) * 280); // Maps 0-100 to 550-830
  }, [activeSme.healthScore]);

  const latestMonthlyData = useMemo(() => {
    if (activeSme.monthlyData && activeSme.monthlyData.length > 0) {
      return activeSme.monthlyData[activeSme.monthlyData.length - 1];
    }
    return { revenue: 5000000, expenses: 3500000 };
  }, [activeSme.monthlyData]);

  const monthlyRevenue = latestMonthlyData.revenue;
  const monthlyExpenses = latestMonthlyData.expenses;
  const disposableIncome = Math.max(0, monthlyRevenue - monthlyExpenses);
  const existingDebt = activeSme.loanDetails?.outstandingAmount || 0;

  // Score calculations
  const affordabilityScore = Math.max(
    0,
    Math.min(100, Math.round((disposableIncome / Math.max(1, monthlyRevenue)) * 100))
  );

  const riskScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        100 -
          ((creditScore - 300) / (850 - 300)) * 100 -
          Math.min(30, (existingDebt / Math.max(1, monthlyRevenue)) * 10)
      )
    )
  );

  // Financial institutions list in FRW
  const financialInstitutions: FinancialInstitution[] = [
    {
      name: 'AgriBusiness Bank',
      interestRate: 7.5,
      maxTerm: 60,
      minAmount: 2000000,
      maxAmount: 50000000,
      rating: 4.8,
      approvalTime: '2-3 days',
      specialFeatures: ['Agricultural focus', 'Grace periods', 'Seasonal payment plans']
    },
    {
      name: 'Kigali Commerce Lender',
      interestRate: 9.2,
      maxTerm: 36,
      minAmount: 1000000,
      maxAmount: 25000000,
      rating: 4.5,
      approvalTime: '1-2 days',
      specialFeatures: ['Fast approval', 'No land collateral needed', 'Flexible terms']
    },
    {
      name: 'Community Development Fund',
      interestRate: 6.8,
      maxTerm: 84,
      minAmount: 5000000,
      maxAmount: 100000000,
      rating: 4.7,
      approvalTime: '5-7 days',
      specialFeatures: ['Lower rates', 'Business mentoring', 'Networking opportunities']
    }
  ];

  // Dynamic AI Loan Recommendations scaled in FRW
  const loanRecommendations: LoanRecommendation[] = useMemo(() => {
    return [
      {
        amount: Math.round(monthlyRevenue * 3.5),
        term: 36,
        purpose: 'Equipment Modernization',
        confidence: Math.round(activeSme.healthScore * 1.05 > 98 ? 98 : activeSme.healthScore * 1.05),
        reason: `Your ${activeSme.sector.toLowerCase()} operation shows consistent growth trend. Modernizing machinery can increase overall throughput by 30%.`,
        impact: 'Expected to grow monthly turnover by 18% and optimize manual labor costs.'
      },
      {
        amount: Math.round(monthlyRevenue * 2.0),
        term: 24,
        purpose: 'Inventory & Supplies Stocking',
        confidence: Math.round(activeSme.healthScore * 1.1 > 99 ? 99 : activeSme.healthScore * 1.1),
        reason: `Avoid stockouts during peak seasons. Scaling your raw materials repository handles spikes in demand.`,
        impact: 'Will allow you to capture seasonal demands and lock wholesale supply discounts.'
      },
      {
        amount: Math.round(monthlyRevenue * 1.2),
        term: 12,
        purpose: 'Working Capital Buffer',
        confidence: 95,
        reason: 'Maintains healthy cash flow buffer for utilities and maintenance during low production periods.',
        impact: 'Smooths operational cash reserves, preserving liquidity levels.'
      }
    ];
  }, [monthlyRevenue, activeSme]);

  // Generate repayment schedule
  const calculateLoanPlan = (loan: LoanRecommendation) => {
    const P = loan.amount;
    const r = 8.5 / 100 / 12; // 8.5% average APR
    const n = loan.term;

    const monthlyPayment = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);

    const schedule: RepaymentSchedule[] = [];
    let balance = P;

    for (let month = 1; month <= n; month++) {
      const interestPayment = balance * r;
      const principalPayment = monthlyPayment - interestPayment;
      balance -= principalPayment;

      schedule.push({
        month,
        payment: monthlyPayment,
        principal: principalPayment,
        interest: interestPayment,
        remainingBalance: balance > 0 ? balance : 0
      });
    }

    const suitableInstitutions = financialInstitutions.filter(
      inst => P >= inst.minAmount && P <= inst.maxAmount && loan.term <= inst.maxTerm
    );

    setSelectedLoan(loan);
    setRepaymentSchedule(schedule);
    setInstitutions(suitableInstitutions);
    setShowDetails(true);
  };

  // Chart data from SME profile
  const financialHealthData = useMemo(() => {
    return activeSme.monthlyData.map(d => ({
      month: d.month,
      revenue: d.revenue,
      expenses: d.expenses
    }));
  }, [activeSme.monthlyData]);

  const loanUsageData = [
    { name: 'Equipment', value: 45 },
    { name: 'Inventory', value: 25 },
    { name: 'Operating Cost', value: 20 },
    { name: 'Marketing', value: 10 }
  ];

  const PIE_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#6B7280'];

  // Project impact data for the next (term + 12) months
  const projectedImpactData = useMemo(() => {
    if (!selectedLoan || repaymentSchedule.length === 0) return [];

    const monthlyInst = repaymentSchedule[0]?.payment || 0;
    const baseRevenue = monthlyRevenue;
    const baseExpenses = monthlyExpenses;
    const totalMonths = selectedLoan.term + 12;
    const data = [];

    // Month 0
    data.push({
      month: 'Month 0',
      revenue: Math.round(baseRevenue),
      expenses: Math.round(baseExpenses),
      netCashflow: Math.round(baseRevenue - baseExpenses),
      phase: 'Before Loan'
    });

    for (let m = 1; m <= totalMonths; m++) {
      const isRepaying = m <= selectedLoan.term;
      
      // Growth factor reaches +18% during repayment, peaks at +25% post-repayment
      const growthFactor = isRepaying
        ? 1 + (m / selectedLoan.term) * 0.18
        : 1.25;

      const projectedRev = baseRevenue * growthFactor;
      const projectedExp = isRepaying
        ? baseExpenses + monthlyInst
        : baseExpenses;

      data.push({
        month: `Month ${m}`,
        revenue: Math.round(projectedRev),
        expenses: Math.round(projectedExp),
        netCashflow: Math.round(projectedRev - projectedExp),
        phase: isRepaying ? 'Repayment Phase' : 'Post-Repayment'
      });
    }

    return data;
  }, [selectedLoan, repaymentSchedule, monthlyRevenue, monthlyExpenses]);

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1e293b] text-white p-3 border border-slate-700 rounded-lg shadow-lg text-xs font-mono">
          <p className="font-bold text-slate-350 border-b border-slate-700 pb-1 mb-1.5">{label}</p>
          <p className="text-emerald-400 font-medium">Revenue: {formatRWF(payload[0].value)}</p>
          <p className="text-rose-400 font-medium">Expenses: {formatRWF(payload[1].value)}</p>
        </div>
      );
    }
    return null;
  };

  const CustomProjectionTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const phase = payload[0].payload.phase;
      return (
        <div className="bg-[#1e293b] text-white p-3 border border-slate-700 rounded-lg shadow-lg text-xs font-mono">
          <p className="font-bold text-slate-350 border-b border-slate-700 pb-1 mb-1.5">{label}</p>
          <p className="text-[10px] text-amber-400 font-bold mb-1 uppercase tracking-wider">{phase}</p>
          <p className="text-emerald-400 font-medium">Revenue: {formatRWF(payload[0].value)}</p>
          <p className="text-rose-400 font-medium">Expenses: {formatRWF(payload[1].value)}</p>
          <p className="text-indigo-300 font-bold border-t border-slate-700 pt-1 mt-1">
            Net Surplus: {formatRWF(payload[2].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 font-heading">Financing Advisory Workspace</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Evaluate credit eligibility and simulated repayment timelines for <span className="text-emerald-600 font-bold">{activeSme.name}</span>.
          </p>
        </div>

        {/* Dynamic Credit Metrics */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm flex items-center gap-3">
            <div className="w-1.5 h-10 bg-emerald-500 rounded-full"></div>
            <div>
              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Affordability Index</span>
              <span className="text-sm font-bold text-slate-800 font-mono">{affordabilityScore}%</span>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm flex items-center gap-3">
            <div className="w-1.5 h-10 bg-rose-500 rounded-full"></div>
            <div>
              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Risk Projection</span>
              <span className="text-sm font-bold text-slate-800 font-mono">{riskScore}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Business Financial Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-150 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-emerald-600 animate-pulse" />
                <h3 className="text-sm font-bold text-slate-800 font-heading">Underwriting Parameters Overview</h3>
              </div>
              <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-extrabold rounded-full border border-emerald-100 uppercase">
                {activeSme.sector} Sector
              </span>
            </div>

            <CardContent className="p-5 space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl">
                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Credit score</span>
                  <span className="text-sm font-bold text-slate-800 mt-1 block font-mono">{creditScore}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl">
                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Monthly Turnover</span>
                  <span className="text-sm font-bold text-emerald-600 mt-1 block font-mono truncate" title={formatRWF(monthlyRevenue)}>
                    {formatRWF(monthlyRevenue)}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl">
                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Monthly Expenses</span>
                  <span className="text-sm font-bold text-rose-600 mt-1 block font-mono truncate" title={formatRWF(monthlyExpenses)}>
                    {formatRWF(monthlyExpenses)}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl">
                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Outstanding Debt</span>
                  <span className="text-sm font-bold text-slate-800 mt-1 block font-mono truncate" title={formatRWF(existingDebt)}>
                    {formatRWF(existingDebt)}
                  </span>
                </div>
              </div>

              {/* Financial Trends Graph */}
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-3">Six-Month Financial Trends</span>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={financialHealthData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="month" stroke="#94a3b8" className="text-[10px] font-mono" />
                      <YAxis stroke="#94a3b8" className="text-[10px] font-mono" />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 11, fontFamily: 'monospace' }} />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#10B981"
                        name="Revenue"
                        strokeWidth={3}
                        dot={{ fill: '#10B981', r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="expenses"
                        stroke="#EF4444"
                        name="Expenses"
                        strokeWidth={3}
                        dot={{ fill: '#EF4444', r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Interactive Custom Simulator Widget Card */}
          <Card className="bg-white border-2 border-emerald-500/20 shadow-md rounded-2xl overflow-hidden text-slate-800 mt-6">
            <div className="p-5 border-b border-emerald-100 bg-emerald-50/40 flex items-center gap-3">
              <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest block">Interactive simulation</span>
                <h3 className="text-sm font-bold text-slate-800 font-heading">Custom Loan Calculator</h3>
              </div>
            </div>

            <CardContent className="p-6">
              <form onSubmit={handleSimulateCustom} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center text-xs">
                
                {/* Column 1: Amount (Span 5) */}
                <div className="md:col-span-5 space-y-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Amount to Borrow (FRW)
                  </label>
                  <input
                    type="number"
                    min="500000"
                    step="100000"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(Math.max(0, Number(e.target.value)))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none text-slate-850 font-mono font-bold"
                    required
                  />
                  <span className="text-[10px] text-slate-500 font-mono block">
                    Simulating: <strong className="text-emerald-600 font-extrabold">{formatRWF(customAmount)}</strong>
                  </span>
                </div>

                {/* Column 2: Duration (Span 4) */}
                <div className="md:col-span-4 space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <span>Repayment Term</span>
                    <span className="text-emerald-600 font-mono font-bold">{customTerm} Months</span>
                  </div>
                  <input
                    type="range"
                    min="6"
                    max="60"
                    step="6"
                    value={customTerm}
                    onChange={(e) => setCustomTerm(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                  <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                    <span>6m</span>
                    <span>30m</span>
                    <span>60m</span>
                  </div>
                </div>

                {/* Column 3: Simulate Button (Span 3) */}
                <div className="md:col-span-3 pt-2 md:pt-4">
                  <Button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs h-10 uppercase tracking-wider rounded-xl shadow-[0_4px_14px_rgba(16,185,129,0.18)] transition duration-200 border-none"
                  >
                    Simulate Plan
                  </Button>
                </div>

              </form>
            </CardContent>
          </Card>
        </div>

        {/* AI Recommendations Column */}
        <div className="space-y-4">
          <div className="flex items-center gap-1.5 px-1">
            <Sparkles className="w-4.5 h-4.5 text-emerald-500 animate-pulse" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest">AI Matched Suggestions</h4>
          </div>

          {loanRecommendations.map((loan, idx) => (
            <Card
              key={idx}
              className={`bg-white border hover:shadow transition duration-200 cursor-pointer overflow-hidden ${
                selectedLoan?.purpose === loan.purpose
                  ? 'border-emerald-500 ring-1 ring-emerald-500/10 bg-emerald-50/5'
                  : 'border-gray-200'
              }`}
              onClick={() => calculateLoanPlan(loan)}
            >
              <CardContent className="p-4 space-y-3.5">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded uppercase">
                    Option {idx + 1}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 font-mono">
                    {loan.confidence}% Match
                  </span>
                </div>

                <div>
                  <span className="text-base font-extrabold text-slate-900 block font-mono">{formatRWF(loan.amount)}</span>
                  <span className="text-[10px] text-gray-500 font-semibold">{loan.term} Months · {loan.purpose}</span>
                </div>

                <p className="text-[10.5px] leading-relaxed text-gray-600 font-medium">
                  {loan.reason}
                </p>

                <div className="flex items-center justify-between text-[10px] text-emerald-600 font-bold pt-2 border-t border-gray-50">
                  <span>Analyze Loan Terms</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Loan Analysis Details Panel */}
      <AnimatePresence mode="wait">
        {showDetails && selectedLoan && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Overview & Allocation */}
            <Card className="bg-white border border-slate-200 shadow-lg overflow-hidden">
              <div className="p-5 border-b border-gray-150 flex justify-between items-center bg-slate-50">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-heading">Advisory Simulation: {selectedLoan.purpose}</h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">Custom analysis computed at 8.5% p.a. average APR</p>
                </div>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-slate-700 text-xs font-bold font-mono"
                >
                  Close Plan
                </button>
              </div>

              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Simulated Principal</span>
                    <span className="text-base font-mono font-bold text-slate-900 mt-1 block">{formatRWF(selectedLoan.amount)}</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Term Duration</span>
                    <span className="text-base font-mono font-bold text-slate-900 mt-1 block">{selectedLoan.term} Months</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Projected Impact</span>
                    <span className="text-[11px] font-bold text-emerald-600 mt-1 block leading-relaxed">{selectedLoan.impact}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Allocation Pie Chart */}
                  <div className="space-y-3">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block flex items-center gap-1">
                      <PieIcon className="w-3.5 h-3.5 text-slate-400" />
                      Recommended Allocation Breakdown
                    </span>
                    <div className="h-60 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={loanUsageData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={4}
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            style={{ fontSize: 9, fontWeight: 'bold' }}
                          >
                            {loanUsageData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`${value}%`, 'Allocation']} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Repayment Stats */}
                  <div className="space-y-3">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block flex items-center gap-1">
                      <BadgePercent className="w-4 h-4 text-slate-400" />
                      Repayment Calculation Summary
                    </span>
                    <div className="space-y-3 pt-2">
                      <div className="flex justify-between items-center p-3 bg-slate-50 border border-slate-200/50 rounded-xl text-xs">
                        <span className="text-gray-500 font-medium">Monthly Installment:</span>
                        <span className="font-bold text-slate-900 font-mono">
                          {formatRWF(repaymentSchedule[0]?.payment || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-slate-50 border border-slate-200/50 rounded-xl text-xs">
                        <span className="text-gray-500 font-medium">Cumulative Interest:</span>
                        <span className="font-bold text-rose-600 font-mono">
                          {formatRWF(repaymentSchedule.reduce((acc, curr) => acc + curr.interest, 0))}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-slate-50 border border-slate-200/50 rounded-xl text-xs">
                        <span className="text-gray-500 font-medium">Aggregate Repayment:</span>
                        <span className="font-bold text-slate-900 font-mono">
                          {formatRWF(repaymentSchedule.reduce((acc, curr) => acc + curr.payment, 0))}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-slate-50 border border-slate-200/50 rounded-xl text-xs">
                        <span className="text-gray-500 font-medium">Debt Service Coverage Ratio:</span>
                        <span className="font-bold text-emerald-600 font-mono">
                          {((repaymentSchedule[0]?.payment / disposableIncome) * 100).toFixed(1)}% of disposable income
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Projected Business Impact Chart */}
            <Card className="bg-white border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-150 bg-slate-50 flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-bold text-slate-850 uppercase tracking-wider block">Projected Business Cash Flow Impact</h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">Visualizing monthly revenue, expenses, and net cashflow during repayment vs. post-repayment</p>
                </div>
              </div>
              <CardContent className="p-6">
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={projectedImpactData} margin={{ top: 15, right: 30, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="month" stroke="#94a3b8" className="text-[10px] font-mono" />
                      <YAxis stroke="#94a3b8" className="text-[10px] font-mono" />
                      <Tooltip content={<CustomProjectionTooltip />} />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 11, fontFamily: 'monospace' }} />
                      
                      {/* Repayment Threshold */}
                      <ReferenceLine
                        x={`Month ${selectedLoan.term}`}
                        stroke="#F59E0B"
                        strokeDasharray="4 4"
                        label={{
                          value: 'Loan Repaid',
                          fill: '#F59E0B',
                          position: 'top',
                          fontSize: 10,
                          fontWeight: 'bold'
                        }}
                      />

                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#10B981"
                        name="Projected Revenue"
                        strokeWidth={3}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="expenses"
                        stroke="#EF4444"
                        name="Projected Expenses (incl. Repayment)"
                        strokeWidth={3}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="netCashflow"
                        stroke="#6366F1"
                        name="Net Monthly Surplus"
                        strokeWidth={4}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Phase Description Legend */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200/50">
                  <div className="space-y-1">
                    <span className="font-bold text-amber-600 block text-[10px] uppercase">Repayment Phase (Months 1 - {selectedLoan.term})</span>
                    <p className="text-slate-600 leading-relaxed font-sans">
                      Business turnover expands from capital investment, while monthly expenses include the installment of <strong className="text-slate-850">{formatRWF(repaymentSchedule[0]?.payment || 0)}</strong>.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="font-bold text-emerald-600 block text-[10px] uppercase">Post-Repayment (Months {selectedLoan.term + 1}+)</span>
                    <p className="text-slate-600 leading-relaxed font-sans">
                      Debt obligations cease, dropping monthly overhead back to normal. Modernization benefits sustain higher sales baseline, resulting in a net monthly cash surplus boost.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Repayment Schedule Ledger Table */}
            <Card className="bg-white border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-150 flex justify-between items-center bg-slate-50">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">Repayment Schedule (First 12 Months)</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-gray-500 border-b border-gray-150 font-bold uppercase">
                      <th className="py-3 px-6 font-semibold">Month</th>
                      <th className="py-3 px-6 font-semibold">Scheduled Payment</th>
                      <th className="py-3 px-6 font-semibold">Principal Repaid</th>
                      <th className="py-3 px-6 font-semibold">Interest Component</th>
                      <th className="py-3 px-6 font-semibold">Remaining Principal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150 font-mono">
                    {repaymentSchedule.slice(0, 12).map((payment) => (
                      <tr key={payment.month} className="hover:bg-slate-50/50 transition">
                        <td className="py-3 px-6 font-bold text-slate-800">Month {payment.month}</td>
                        <td className="py-3 px-6 text-slate-700 font-bold">{formatRWF(payment.payment)}</td>
                        <td className="py-3 px-6 text-emerald-600 font-semibold">+{formatRWF(payment.principal)}</td>
                        <td className="py-3 px-6 text-rose-500">-{formatRWF(payment.interest)}</td>
                        <td className="py-3 px-6 text-slate-600">{formatRWF(payment.remainingBalance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Recommended Lenders */}
            {institutions.length > 0 && (
              <Card className="bg-white border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-150 bg-slate-50">
                  <h3 className="text-xs font-bold text-slate-850 uppercase tracking-wider">Matching Credit Institutions</h3>
                </div>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {institutions.map((inst, index) => (
                      <div
                        key={index}
                        className="border border-slate-200 rounded-xl p-5 hover:shadow-md transition duration-200 flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <h4 className="font-extrabold text-xs text-slate-900 uppercase">{inst.name}</h4>
                            <span className="bg-amber-50 text-amber-600 border border-amber-100 text-[10px] px-2 py-0.5 rounded font-extrabold">
                              ★ {inst.rating}
                            </span>
                          </div>

                          <div className="space-y-2 text-[11px] pt-1 font-mono">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Interest APR:</span>
                              <span className="font-extrabold text-slate-850">{inst.interestRate}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Turnaround:</span>
                              <span className="font-extrabold text-slate-850">{inst.approvalTime}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Max Term:</span>
                              <span className="font-extrabold text-slate-850">{inst.maxTerm} Months</span>
                            </div>
                          </div>

                          <div className="border-t border-slate-100 pt-3">
                            <span className="text-[9px] text-slate-400 uppercase tracking-widest block font-bold mb-1.5">Special Features</span>
                            <ul className="text-[10.5px] text-slate-600 space-y-1 font-medium">
                              {inst.specialFeatures.map((feat, i) => (
                                <li key={i} className="flex items-center gap-1.5">
                                  <span className="text-emerald-500 text-[10px]">✓</span>
                                  {feat}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <button className="w-full mt-5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-855 text-white py-2 rounded-lg text-xs font-bold transition shadow-sm">
                          Apply with {inst.name.split(' ')[0]}
                        </button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}