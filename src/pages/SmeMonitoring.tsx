import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatRWF } from '../lib/mockData';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  AlertTriangle,
  ShieldAlert,
  Search,
  Eye,
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent } from '../assets/components/ui/card';
import logo from '../assets/images/elevata_logo.png';

export default function SmeMonitoring() {
  const { smes, setSelectedSmeId } = useApp();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [sectorFilter, setSectorFilter] = useState('All');
  const [riskFilter, setRiskFilter] = useState('All');

  // Stats calculation
  const stats = useMemo(() => {
    const total = smes.length;
    const avgHealth = total > 0 ? Math.round(smes.reduce((acc, s) => acc + s.healthScore, 0) / total) : 0;
    const activeLoans = smes.filter(s => s.loanDetails.status === 'Active').length;
    const criticalRisks = smes.filter(s => s.healthScore < 60 || s.riskRating === 'High').length;
    
    return { total, avgHealth, activeLoans, criticalRisks };
  }, [smes]);

  // Filtering
  const filteredSmes = useMemo(() => {
    return smes.filter(sme => {
      const matchesSearch = 
        sme.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sme.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sme.sector.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSector = sectorFilter === 'All' || sme.sector === sectorFilter;
      const matchesRisk = riskFilter === 'All' || sme.riskRating === riskFilter;

      return matchesSearch && matchesSector && matchesRisk;
    });
  }, [smes, searchTerm, sectorFilter, riskFilter]);

  const scoreColor = (s: number) =>
    s >= 80 ? '#059669' : s >= 60 ? '#D97706' : '#DC2626';

  const riskColor = (r: 'Low' | 'Medium' | 'High') =>
    r === 'Low' ? 'bg-emerald-100 text-emerald-800' :
    r === 'Medium' ? 'bg-amber-100 text-amber-800' :
    'bg-rose-100 text-rose-805 text-rose-800';

  const sectorBadgeColor = (sector: string) => {
    switch (sector) {
      case 'Retail': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'Agriculture': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Logistics': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'Technology': return 'bg-purple-50 text-purple-700 border-purple-100';
      default: return 'bg-gray-50 text-gray-700 border-gray-100';
    }
  };

  const handleInspect = (id: string) => {
    setSelectedSmeId(id);
    navigate('/');
  };

  const handleControlPanel = (id: string) => {
    setSelectedSmeId(id);
    navigate('/banker');
  };

  return (
    <div className="space-y-6 bg-[#eef1f6] min-h-screen p-5 font-sans text-slate-800 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#2d2d2d] tracking-tight font-sans flex items-center gap-2">
            <img src={logo} alt="Elevata" className="h-6 w-auto object-contain" />
            SMEs Portfolio Monitoring
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Real-time status tracking, debt metrics &amp; credit exposure audit console.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { label: 'Monitored SMEs', value: `${stats.total} accounts`, sub: 'Active registry', icon: <Users className="w-4 h-4 text-gray-500" />, bg: 'bg-white' },
          { label: 'Avg Health Score', value: `${stats.avgHealth}%`, sub: 'Target threshold: 75%', icon: <Activity className="w-4 h-4 text-emerald-500" />, bg: 'bg-white' },
          { label: 'Active Loans', value: `${stats.activeLoans}`, sub: 'Outstanding lines', icon: <DollarSign className="w-4 h-4 text-indigo-500" />, bg: 'bg-white' },
          { label: 'Critical Risks', value: `${stats.criticalRisks} accounts`, sub: 'Score < 60 or high risk', icon: <ShieldAlert className="w-4 h-4 text-rose-500" />, bg: 'bg-rose-50/20 border-rose-100' }
        ].map((card, i) => (
          <Card key={i} className={`border border-[#e2e8f0] shadow-sm rounded-sm ${card.bg}`}>
            <CardContent className="p-4 flex justify-between items-center">
              <div className="space-y-1">
                <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 block">{card.label}</span>
                <span className="text-lg font-bold text-[#2d2d2d] block font-sans">{card.value}</span>
                <span className="text-[9px] text-gray-400 block">{card.sub}</span>
              </div>
              <div className="p-2 bg-gray-50 border border-gray-100 rounded-sm">{card.icon}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search & Filters */}
      <Card className="bg-white border border-[#e2e8f0] shadow-sm rounded-sm">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by SME, owner, or sector..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-[#d0d0d0] rounded-md bg-[#f5f5f5] text-sm text-[#2d2d2d] placeholder-gray-400 outline-none focus:border-[#00c09d] focus:bg-white font-sans transition-all"
            />
          </div>

          <div className="flex flex-wrap gap-4 w-full md:w-auto items-center justify-end">
            {/* Sector Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Sector:</span>
              <select
                value={sectorFilter}
                onChange={e => setSectorFilter(e.target.value)}
                className="rounded-md border border-[#d0d0d0] bg-[#f5f5f5] py-1.5 px-3 text-xs text-[#2d2d2d] outline-none focus:border-[#00c09d] focus:bg-white font-sans transition-all"
              >
                <option value="All">All Sectors</option>
                <option value="Retail">Retail</option>
                <option value="Agriculture">Agriculture</option>
                <option value="Logistics">Logistics</option>
                <option value="Technology">Technology</option>
              </select>
            </div>

            {/* Risk Rating Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Risk Level:</span>
              <select
                value={riskFilter}
                onChange={e => setRiskFilter(e.target.value)}
                className="rounded-md border border-[#d0d0d0] bg-[#f5f5f5] py-1.5 px-3 text-xs text-[#2d2d2d] outline-none focus:border-[#00c09d] focus:bg-white font-sans transition-all"
              >
                <option value="All">All Risks</option>
                <option value="Low">Low Risk</option>
                <option value="Medium">Medium Risk</option>
                <option value="High">High Risk</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table view of monitored SMEs */}
      {filteredSmes.length > 0 ? (
        <Card className="bg-white border border-[#e2e8f0] shadow-sm rounded-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-sm border-collapse text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <th className="px-5 py-3.5">SME &amp; Sector</th>
                  <th className="px-5 py-3.5">Owner / Representative</th>
                  <th className="px-5 py-3.5">Health Score</th>
                  <th className="px-5 py-3.5 text-center">Risk Level</th>
                  <th className="px-5 py-3.5">Balance / Capacity</th>
                  <th className="px-5 py-3.5">Active Loan Status</th>
                  <th className="px-5 py-3.5">Bulletins</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-slate-800">
                {filteredSmes.map(sme => (
                  <tr 
                    key={sme.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    {/* SME Name & Sector */}
                    <td className="px-5 py-4">
                      <div className="font-bold text-sm text-[#2d2d2d]">{sme.name}</div>
                      <span className={`inline-block mt-1 px-2 py-0.5 text-[9px] font-bold rounded-sm border ${sectorBadgeColor(sme.sector)}`}>
                        {sme.sector}
                      </span>
                    </td>

                    {/* Owner / Contact */}
                    <td className="px-5 py-4">
                      <div className="font-semibold text-xs text-slate-700">{sme.ownerName}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{sme.email}</div>
                    </td>

                    {/* Health Index & Trend */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5">
                          {sme.healthTrend === 'up' ? (
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                          ) : sme.healthTrend === 'down' ? (
                            <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
                          ) : (
                            <Activity className="w-3.5 h-3.5 text-slate-400" />
                          )}
                          <span className="font-bold font-sans text-xs text-slate-800">
                            {sme.healthScore}%
                          </span>
                        </div>
                        <div className="w-16 h-1.5 bg-[#eaeaea] rounded-full overflow-hidden hidden sm:block">
                          <div 
                            className="h-full rounded-full"
                            style={{ 
                              width: `${sme.healthScore}%`, 
                              backgroundColor: scoreColor(sme.healthScore) 
                            }}
                          />
                        </div>
                      </div>
                      <span className={`text-[9px] font-semibold ${sme.healthTrend === 'up' ? 'text-emerald-500' : sme.healthTrend === 'down' ? 'text-rose-500' : 'text-slate-400'}`}>
                        {sme.healthTrend === 'up' ? '+' : ''}{sme.healthTrendPercent}% MoM
                      </span>
                    </td>

                    {/* Risk Level */}
                    <td className="px-5 py-4 text-center">
                      <span className={`inline-block px-2.5 py-0.5 text-[9px] font-bold rounded-sm ${riskColor(sme.riskRating)}`}>
                        {sme.riskRating}
                      </span>
                    </td>

                    {/* Balance & Capacity */}
                    <td className="px-5 py-4 font-mono text-xs">
                      <div className="font-bold text-[#2d2d2d]">{formatRWF(sme.currentBalance)}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">Cap: {formatRWF(sme.borrowingCapacity)}</div>
                    </td>

                    {/* Loan Details summary */}
                    <td className="px-5 py-4 text-xs">
                      {sme.loanDetails.status === 'Active' ? (
                        <div className="font-mono">
                          <div className="font-bold text-amber-700">Active Debt</div>
                          <div className="text-[10px] text-gray-500 mt-0.5">{formatRWF(sme.loanDetails.outstandingAmount)} ({formatRWF(sme.loanDetails.monthlyInstallment)}/mo)</div>
                        </div>
                      ) : sme.loanDetails.status === 'Pending' ? (
                        <span className="px-1.5 py-0.5 rounded-sm font-bold text-[9px] bg-blue-50 text-blue-705 text-blue-700 border border-blue-100">
                          Pending Approval
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-400 font-normal italic">No Debt</span>
                      )}
                    </td>

                    {/* Active Warnings */}
                    <td className="px-5 py-4 max-w-[200px]">
                      {sme.riskAlerts.length > 0 ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-[10px] font-bold text-gray-450 text-gray-400">
                            <AlertTriangle className="w-3 h-3 text-amber-500" />
                            <span>{sme.riskAlerts.length} bulletin{sme.riskAlerts.length > 1 ? 's' : ''}</span>
                          </div>
                          <p className="text-[10px] text-gray-500 truncate" title={sme.riskAlerts[0].text}>
                            {sme.riskAlerts[0].text}
                          </p>
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-400 italic">Clear</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex gap-1.5 justify-end">
                        <button
                          onClick={() => handleInspect(sme.id)}
                          title="Inspect SME Dashboard"
                          className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-sm transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleControlPanel(sme.id)}
                          title="Control Panel Decisions"
                          className="p-1.5 bg-[#00c09d] hover:bg-[#00a889] text-white rounded-sm transition-colors shadow-sm"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3.5 border-t border-gray-100 bg-gray-50 flex justify-between items-center text-xs text-gray-455 text-gray-400">
            <span>Showing {filteredSmes.length} of {smes.length} records</span>
            <span className="font-semibold text-[10px] tracking-wider uppercase">Elevata credit portfolio monitoring</span>
          </div>
        </Card>
      ) : (
        <Card className="bg-white border border-[#e2e8f0] shadow-sm rounded-sm py-12 text-center">
          <p className="text-sm text-gray-400 font-sans font-medium">No SME accounts found matching the filter criteria.</p>
        </Card>
      )}
    </div>
  );
}
