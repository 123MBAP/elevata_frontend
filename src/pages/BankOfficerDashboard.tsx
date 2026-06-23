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
  Cell
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
  Shield
} from 'lucide-react';
import { Card, CardContent } from '../assets/components/ui/card';

export default function BankOfficerDashboard() {
  const {
    smes,
    selectedSmeId,
    setSelectedSmeId,
    approveLoan,
    rejectLoan,
    requestFieldVisit,
    loanSimulation
  } = useApp();

  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'danger' | 'warning' | 'info'; text: string } | null>(null);

  const showToast = (type: 'success' | 'danger' | 'warning' | 'info', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4500);
  };

  const portfolioStats = useMemo(() => {
    const totalSMEs = smes.length;
    const totalOutstandingLoans = smes.reduce((acc, curr) => acc + curr.loanDetails.outstandingAmount, 0);
    const highRiskSMEs = smes.filter(sme => sme.healthScore < 60).length;
    const loanReadySMEs = smes.filter(sme => sme.healthScore >= 80).length;
    return { totalSMEs, totalOutstandingLoans, highRiskSMEs, loanReadySMEs };
  }, [smes]);

  const filteredSmes = useMemo(() =>
    smes.filter(sme =>
      sme.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sme.sector.toLowerCase().includes(searchTerm.toLowerCase())
    ), [smes, searchTerm]);

  const highlightedSme = useMemo(() =>
    smes.find(sme => sme.id === selectedSmeId) || smes[0],
    [smes, selectedSmeId]);

  const sectorChartData = useMemo(() =>
    smes.map(sme => ({
      name: sme.sector,
      'Health Score': sme.healthScore,
      'Lending Capacity': Math.round(sme.borrowingCapacity / 1000000)
    })), [smes]);

  const handleApprove = () => {
    if (!highlightedSme) return;
    const amount = highlightedSme.borrowingCapacity > 0 ? highlightedSme.borrowingCapacity : loanSimulation.amount;
    const period = highlightedSme.borrowingCapacity > 0 ? 12 : loanSimulation.period;
    const rate   = highlightedSme.borrowingCapacity > 0 ? 14 : loanSimulation.rate;
    approveLoan(highlightedSme.id, amount, period, rate);
    showToast('success', `Loan of ${formatRWF(amount)} approved for ${highlightedSme.name}.`);
  };

  const handleReject = () => {
    if (!highlightedSme) return;
    rejectLoan(highlightedSme.id);
    showToast('danger', `Loan application for ${highlightedSme.name} rejected.`);
  };

  const handleAudit = () => {
    if (!highlightedSme) return;
    requestFieldVisit(highlightedSme.id);
    showToast('warning', `Field inspection requested for ${highlightedSme.name}.`);
  };

  const handleMonitor = () => navigate('/');

  const scoreColor = (s: number) =>
    s >= 80 ? '#059669' : s >= 60 ? '#D97706' : '#DC2626';

  const scoreBg = (s: number) =>
    s >= 80
      ? 'bg-emerald-50 text-emerald-700'
      : s >= 60
      ? 'bg-amber-50 text-amber-700'
      : 'bg-red-50 text-red-700';

  const toastStyles: Record<string, string> = {
    success: 'bg-emerald-600 text-white',
    danger:  'bg-red-600 text-white',
    warning: 'bg-amber-500 text-white',
    info:    'bg-blue-600 text-white',
  };

  return (
    <div className="space-y-5 bg-gray-50 min-h-screen p-5">

      {/* ── Toast ── */}
      {toastMessage && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${toastStyles[toastMessage.type]}`}>
          {toastMessage.type === 'success' && <Check className="w-4 h-4 shrink-0" />}
          {toastMessage.type === 'danger'  && <XCircle className="w-4 h-4 shrink-0" />}
          {toastMessage.type === 'warning' && <AlertTriangle className="w-4 h-4 shrink-0" />}
          {toastMessage.type === 'info'    && <Eye className="w-4 h-4 shrink-0" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 tracking-tight">Bank officer dashboard</h1>
          <p className="text-xs text-gray-500 mt-0.5">SME portfolio risk &amp; lending control · all amounts in RWF</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search SME or sector…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
          />
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: 'Total portfolio',
            value: `${portfolioStats.totalSMEs} SMEs`,
            sub: 'active accounts',
            icon: <Users className="w-4 h-4" />,
            iconBg: 'bg-blue-50 text-blue-600',
            valueClass: 'text-gray-900',
          },
          {
            label: 'Outstanding loans',
            value: formatRWF(portfolioStats.totalOutstandingLoans),
            sub: 'total disbursed',
            icon: <DollarSign className="w-4 h-4" />,
            iconBg: 'bg-emerald-50 text-emerald-600',
            valueClass: 'text-emerald-700',
          },
          {
            label: 'High risk SMEs',
            value: `${portfolioStats.highRiskSMEs} SMEs`,
            sub: 'score below 60',
            icon: <AlertTriangle className="w-4 h-4" />,
            iconBg: 'bg-red-50 text-red-600',
            valueClass: 'text-red-600',
          },
          {
            label: 'Loan ready',
            value: `${portfolioStats.loanReadySMEs} SMEs`,
            sub: 'score 80 or above',
            icon: <Shield className="w-4 h-4" />,
            iconBg: 'bg-emerald-50 text-emerald-600',
            valueClass: 'text-emerald-700',
          },
        ].map((c, i) => (
          <Card key={i} className="bg-white border border-gray-200 shadow-sm rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-heading">{c.label}</span>
                <div className={`p-2 rounded-lg ${c.iconBg}`}>{c.icon}</div>
              </div>
              <div className={`text-2xl font-bold font-mono tracking-tight ${c.valueClass}`}>{c.value}</div>
              <div className="text-[10px] text-gray-400 mt-1">{c.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Mid grid: table + panel ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Table */}
        <div className="lg:col-span-2">
          <Card className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden flex flex-col h-full">
            <div className="px-5 pt-4 pb-3 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-800">Risk scoring &amp; ledger status</h2>
              <p className="text-xs text-gray-400 mt-0.5">Select a row to activate the decision panel</p>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['SME', 'Score', 'Status', 'Recommended action'].map(h => (
                      <th key={h} className="px-5 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredSmes.map(sme => (
                    <tr
                      key={sme.id}
                      onClick={() => setSelectedSmeId(sme.id)}
                      className={`cursor-pointer transition-colors ${
                        selectedSmeId === sme.id
                          ? 'bg-slate-100 font-semibold'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <td className="px-5 py-3">
                        <div className="font-medium text-gray-900 text-sm">{sme.name}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{sme.sector} · {sme.ownerName}</div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="text-sm font-semibold font-mono" style={{ color: scoreColor(sme.healthScore) }}>
                            {sme.healthScore}
                          </span>
                          <div className="w-14 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${sme.healthScore}%`, background: scoreColor(sme.healthScore) }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${scoreBg(sme.healthScore)}`}>
                          {sme.healthScore >= 80 ? 'Safe' : sme.healthScore >= 60 ? 'Medium' : 'Risk'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-500">
                        {sme.healthScore >= 80 ? 'Pre-approve loan' : sme.healthScore >= 60 ? 'Review working capital' : 'Schedule audit'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-5 py-2.5 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
              <span className="text-xs text-gray-400">{filteredSmes.length} of {smes.length} entries</span>
              <span className="text-[10px] font-bold text-slate-400 font-mono">ELEVATA v1.0</span>
            </div>
          </Card>
        </div>

        {/* Decision panel */}
        <div className="lg:col-span-1">
          <Card className="bg-white border border-gray-200 shadow-sm rounded-xl">
            <CardContent className="p-5 space-y-4">

              <div className="pb-3 border-b border-gray-100">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Decision panel</p>
                <h3 className="text-base font-semibold text-gray-900 truncate">{highlightedSme.name}</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {highlightedSme.sector} · Score{' '}
                  <span className="font-semibold" style={{ color: scoreColor(highlightedSme.healthScore) }}>
                    {highlightedSme.healthScore}
                  </span>
                </p>
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleApprove}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition"
                >
                  <Check className="w-4 h-4" /> Approve loan
                </button>
                <button
                  onClick={handleMonitor}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg transition"
                >
                  <Eye className="w-4 h-4" /> Inspect dashboard
                </button>
                <button
                  onClick={handleAudit}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-amber-50 hover:bg-amber-100 text-amber-700 text-sm font-semibold rounded-lg border border-amber-200 transition"
                >
                  <FileSearch className="w-4 h-4" /> Request audit
                </button>
                <button
                  onClick={handleReject}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white hover:bg-red-50 text-red-600 text-sm font-semibold rounded-lg border border-gray-200 transition"
                >
                  <XCircle className="w-4 h-4" /> Reject application
                </button>
              </div>

              <div className="bg-gray-50 border border-gray-100 rounded-lg p-3.5 space-y-2">
                {[
                  { label: 'Borrowing capacity', value: formatRWF(highlightedSme.borrowingCapacity) },
                  { label: 'Current balance',    value: formatRWF(highlightedSme.currentBalance) },
                  { label: 'Leverage ratio',     value: highlightedSme.loanDetails.status === 'Active' ? 'Medium' : 'None',
                    valueClass: highlightedSme.loanDetails.status === 'Active' ? 'text-amber-600' : 'text-emerald-600' },
                ].map((row, i) => (
                  <div key={i} className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">{row.label}</span>
                    <span className={`font-semibold font-mono ${row.valueClass ?? 'text-gray-800'}`}>{row.value}</span>
                  </div>
                ))}
              </div>

            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Bottom grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Sector chart */}
        <div className="lg:col-span-1">
          <Card className="bg-white border border-gray-200 shadow-sm rounded-xl h-full">
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2 mb-4">
                <Building2 className="w-4 h-4 text-gray-400" /> Sector health scores
              </h3>
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sectorChartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9CA3AF', fontSize: 10, fontFamily: 'Inter, sans-serif' }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9CA3AF', fontSize: 10, fontFamily: 'Inter, sans-serif' }}
                    />
                    <Tooltip
                      contentStyle={{
                        fontSize: '12px',
                        fontFamily: 'Inter, sans-serif',
                        borderRadius: '8px',
                        border: '1px solid #E5E7EB',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      }}
                    />
                    <Bar dataKey="Health Score" barSize={18} radius={[3, 3, 0, 0]}>
                      {sectorChartData.map((entry, i) => (
                        <Cell
                          key={`cell-${i}`}
                          fill={entry['Health Score'] >= 80 ? '#059669' : entry['Health Score'] >= 60 ? '#D97706' : '#DC2626'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {/* Legend */}
              <div className="flex items-center gap-4 mt-3 flex-wrap">
                {[
                  { color: '#059669', label: 'Safe (≥80)' },
                  { color: '#D97706', label: 'Medium (60–79)' },
                  { color: '#DC2626', label: 'Risk (<60)' },
                ].map(l => (
                  <span key={l.label} className="flex items-center gap-1.5 text-xs text-gray-500">
                    <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: l.color }} />
                    {l.label}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Opportunity feed */}
        <Card className="bg-white border border-gray-200 shadow-sm rounded-xl">
          <CardContent className="p-5 space-y-3">
            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2 border-b border-gray-100 pb-3">
              <Zap className="w-4 h-4 text-gray-400" /> Lending opportunity feed
            </h3>
            <div className="space-y-2">
              {smes
                .filter(sme => sme.healthScore >= 60 && sme.borrowingCapacity > 0)
                .map(sme => (
                  <div key={sme.id} className="p-3 bg-gray-50 border border-gray-100 rounded-lg hover:border-gray-200 transition space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-gray-800">{sme.name}</span>
                      <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                        High eligibility
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Capacity: <strong className="text-gray-700 font-semibold">{formatRWF(sme.borrowingCapacity)}</strong></span>
                      <span>Est. ROI: <strong className="text-gray-700 font-semibold">{sme.healthScore >= 80 ? '8.4%' : '6.2%'}</strong></span>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Early warning */}
        <Card className="bg-white border border-gray-200 shadow-sm rounded-xl">
          <CardContent className="p-5 space-y-3">
            <h3 className="text-sm font-semibold text-red-700 flex items-center gap-2 border-b border-red-100 pb-3">
              <AlertTriangle className="w-4 h-4 text-red-500" /> Early warning system
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-0.5">
              {smes.some(s => s.healthScore < 70) ? (
                smes
                  .filter(sme => sme.healthScore < 70)
                  .map(sme => (
                    <div key={sme.id} className="p-3 bg-red-50 border-l-2 border-red-400 rounded-r-lg space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-red-800">{sme.name}</span>
                        <span className="text-xs font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                          Score {sme.healthScore}
                        </span>
                      </div>
                      <p className="text-xs text-red-600 leading-relaxed">
                        {sme.sector === 'Agriculture'
                          ? 'Receivables cycle delayed + seasonal cash shortage'
                          : sme.sector === 'Logistics'
                          ? 'Fuel overhead squeezing operating margin'
                          : 'Cash reserves buffer below threshold'}
                      </p>
                    </div>
                  ))
              ) : (
                <div className="text-center py-6 text-sm text-gray-400">No critical alerts</div>
              )}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}