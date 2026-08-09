import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatRWF } from '../lib/mockData';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import {
  Plus,
  Target,
  Sparkles,
  Users,
  Layers,
  Calendar,
  Video,
  TrendingUp,
  Search,
  ChevronRight,
  Loader2,
  Check
} from 'lucide-react';
import { Card, CardContent } from '../assets/components/ui/card';

export default function OpportunityPublisher() {
  const {
    opportunities,
    applications,
    trainings,
    smes,
    publishOpportunity,
    createTraining
  } = useApp();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  // Modal / Form state
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [publishStep, setPublishStep] = useState(1);
  const [matchingAnimation, setMatchingAnimation] = useState(false);

  // New Opportunity Form state
  const [newOppTitle, setNewOppTitle] = useState('');
  const [newOppCategory, setNewOppCategory] = useState('Loan');
  const [newOppDescription, setNewOppDescription] = useState('');
  const [newOppBenefits, setNewOppBenefits] = useState('');
  const [newOppDeadline, setNewOppDeadline] = useState('');
  const [newOppMaxFunding, setNewOppMaxFunding] = useState('');
  const [newOppSectors, setNewOppSectors] = useState<string[]>([]);
  const [newOppMinAge, setNewOppMinAge] = useState(1);
  const [newOppMinRevenue, setNewOppMinRevenue] = useState(2000000);
  const [newOppMinHealthScore, setNewOppMinHealthScore] = useState(60);
  const [newOppMinReadiness, setNewOppMinReadiness] = useState(60);
  const [newOppRegRequired, setNewOppRegRequired] = useState(true);
  const [newOppTaxRequired, setNewOppTaxRequired] = useState(true);
  const [newOppCollateralRequired, setNewOppCollateralRequired] = useState(false);
  const [newOppRequiredDocs, setNewOppRequiredDocs] = useState<string[]>([]);

  // Training Form State
  const [isTrainingModalOpen, setIsTrainingModalOpen] = useState(false);
  const [trTitle, setTrTitle] = useState('');
  const [trDescription, setTrDescription] = useState('');
  const [trDate, setTrDate] = useState('');
  const [trTime, setTrTime] = useState('');
  const [trSpeaker, setTrSpeaker] = useState('');
  const [trLink, setTrLink] = useState('');
  const [trAudience, setTrAudience] = useState<string[]>([]);

  // Selected Opportunity for detailed view/analytics
  const [selectedOppId, setSelectedOppId] = useState<string>('opp-1');

  // Toast / notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const triggerToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const selectedOpp = useMemo(() => {
    return opportunities.find(o => o.id === selectedOppId) || opportunities[0];
  }, [opportunities, selectedOppId]);

  // Sector list helper
  const availableSectors = ['Retail', 'Agriculture', 'Logistics', 'Technology'];

  // Document checklist helper
  const documentOptions = ['Business License', 'Tax Clearance Certificate', 'Audited Financial Statements', 'Cooperative Certificate', 'National ID', 'Proof of Address'];

  // Categories helper
  const categories = ['All', 'Loan', 'Grant', 'Savings Product', 'Investment', 'Training', 'Insurance', 'Business Advisory'];

  // Handle Sector Checkbox Change
  const handleSectorChange = (sector: string) => {
    setNewOppSectors(prev =>
      prev.includes(sector) ? prev.filter(s => s !== sector) : [...prev, sector]
    );
  };

  // Handle Document Checklist Change
  const handleDocChange = (doc: string) => {
    setNewOppRequiredDocs(prev =>
      prev.includes(doc) ? prev.filter(d => d !== doc) : [...prev, doc]
    );
  };

  // Handle publish form submit steps
  const handleNextStep = () => {
    if (publishStep === 1) {
      if (!newOppTitle || !newOppDeadline || !newOppMaxFunding) {
        triggerToast('Please fill in title, deadline, and maximum funding.', 'info');
        return;
      }
      setPublishStep(2);
    } else if (publishStep === 2) {
      // Transition to AI Matching Step 3
      setPublishStep(3);
      setMatchingAnimation(true);
      setTimeout(() => {
        setMatchingAnimation(false);
      }, 2500);
    }
  };

  const handlePublishSubmit = () => {
    // Actually publish
    publishOpportunity({
      title: newOppTitle,
      institution: 'Elevata Finance Core',
      category: newOppCategory,
      description: newOppDescription,
      benefits: newOppBenefits,
      deadline: newOppDeadline,
      maxFunding: formatRWF(parseInt(newOppMaxFunding) || 0),
      sectors: newOppSectors.length > 0 ? newOppSectors : ['Retail', 'Agriculture', 'Technology'],
      minAge: newOppMinAge,
      minRevenue: newOppMinRevenue,
      minHealthScore: newOppMinHealthScore,
      minReadinessScore: newOppMinReadiness,
      registrationRequired: newOppRegRequired,
      taxCompliance: newOppTaxRequired,
      collateralRequired: newOppCollateralRequired,
      requiredDocs: newOppRequiredDocs
    });

    triggerToast(`"${newOppTitle}" published successfully! AI matched 3 eligible SMEs.`);
    setIsPublishModalOpen(false);
    
    // Reset Form
    setNewOppTitle('');
    setNewOppCategory('Loan');
    setNewOppDescription('');
    setNewOppBenefits('');
    setNewOppDeadline('');
    setNewOppMaxFunding('');
    setNewOppSectors([]);
    setNewOppRequiredDocs([]);
    setPublishStep(1);
  };

  // Handle Virtual Training Submission
  const handleTrainingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trTitle || !trSpeaker || !trDate || !trLink) {
      triggerToast('Please fill in all training fields', 'info');
      return;
    }
    createTraining({
      title: trTitle,
      description: trDescription,
      date: trDate,
      time: trTime || '10:00 AM',
      speaker: trSpeaker,
      meetingLink: trLink,
      targetAudience: trAudience.length > 0 ? trAudience : ['All SMEs']
    });
    triggerToast(`Virtual Training "${trTitle}" created successfully.`);
    setIsTrainingModalOpen(false);
    setTrTitle('');
    setTrDescription('');
    setTrDate('');
    setTrTime('');
    setTrSpeaker('');
    setTrLink('');
    setTrAudience([]);
  };

  // KPI Calculations
  const activeOppsCount = opportunities.filter(o => o.status === 'Active').length;
  const totalApplications = applications.length;
  const activeTrainingsCount = trainings.length;

  // AI Matching lists for selected Opportunity
  const matchedSMEs = useMemo(() => {
    if (!selectedOpp) return [];
    return smes.map(sme => {
      // Calculate suitability rating
      let score = 0;
      let missing: string[] = [];

      // Check Sector match
      const sectorMatch = selectedOpp.sectors.includes(sme.sector);
      if (sectorMatch) score += 30;
      else missing.push('Sector Mismatch');

      // Check Revenue match (Marie's Kigali Fresh Mart has approx 5.8M monthly)
      const annualRevenue = sme.monthlyData.reduce((sum, d) => sum + d.revenue, 0) * 2; // extrapolate
      const revenueMatch = annualRevenue >= selectedOpp.minRevenue;
      if (revenueMatch) score += 20;
      else missing.push('Insufficient Revenue');

      // Check health score match
      const healthMatch = sme.healthScore >= selectedOpp.minHealthScore;
      if (healthMatch) score += 25;
      else missing.push('Lower Business Health Score');

      // Check readiness score
      // Sme 1 has 82 health, etc.
      const readinessMatch = sme.healthScore + 3 >= selectedOpp.minReadinessScore;
      if (readinessMatch) score += 25;
      else missing.push('Lower Loan Readiness Score');

      const finalMatchPercent = Math.min(100, score);
      
      let status: 'Highly Qualified' | 'Needs Minor Improvements' | 'Needs Preparation' = 'Needs Preparation';
      if (finalMatchPercent >= 80) status = 'Highly Qualified';
      else if (finalMatchPercent >= 60) status = 'Needs Minor Improvements';

      return {
        ...sme,
        matchPercent: finalMatchPercent,
        status,
        missing,
        revenueTrend: sme.healthTrend === 'up' ? '+8.5%' : '-2.8%'
      };
    }).sort((a, b) => b.matchPercent - a.matchPercent);
  }, [smes, selectedOpp]);

  // Aggregate eligible SMEs from current set
  const totalEligibleSMEs = useMemo(() => {
    return smes.filter(sme => sme.healthScore >= 60).length;
  }, [smes]);

  // Analytics Chart calculations
  const viewsApplicationsChartData = useMemo(() => {
    return [
      { name: '08/01', Views: 45, Applications: 2 },
      { name: '08/02', Views: 82, Applications: 4 },
      { name: '08/03', Views: 120, Applications: 8 },
      { name: '08/04', Views: 195, Applications: 12 },
      { name: '08/05', Views: 240, Applications: 18 }
    ];
  }, []);

  const missingRequirementData = [
    { name: 'Tax Clearance Certificate', value: 45 },
    { name: 'Audited Financials', value: 30 },
    { name: 'Collateral Registration', value: 15 },
    { name: 'Business Plan details', value: 10 }
  ];

  const filteredOpportunities = useMemo(() => {
    return opportunities.filter(opp => {
      const matchSearch = opp.title.toLowerCase().includes(searchTerm.toLowerCase()) || opp.institution.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = activeCategory === 'All' || opp.category === activeCategory;
      return matchSearch && matchCat;
    });
  }, [opportunities, searchTerm, activeCategory]);

  return (
    <div className="space-y-6 bg-white min-h-screen pb-12">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 bg-slate-900 text-white px-5 py-3 rounded-lg shadow-xl text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-200">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header and Action */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-950 font-heading">Opportunity Publisher</h1>
            <span className="bg-emerald-50 text-emerald-700 text-[10px] px-2 py-0.5 font-bold rounded-full border border-emerald-100 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Platform
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-sans">
            Configure financial products, evaluate real-time AI matches, and publish opportunities to the SME ecosystem.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setIsTrainingModalOpen(true)}
            className="flex items-center justify-center space-x-1.5 px-3.5 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 transition"
          >
            <Video className="w-3.5 h-3.5" />
            <span>Schedule Training</span>
          </button>
          
          <button
            onClick={() => {
              setPublishStep(1);
              setIsPublishModalOpen(true);
            }}
            className="flex items-center justify-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Publish Opportunity</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Active Opportunities',
            value: activeOppsCount,
            sub: 'Opportunities live today',
            icon: <Layers className="w-4 h-4" />,
            iconBg: 'bg-emerald-50 text-emerald-600',
            borderColor: 'border-emerald-100'
          },
          {
            label: 'Eligible SMEs',
            value: totalEligibleSMEs,
            sub: 'Qualified in database',
            icon: <Target className="w-4 h-4" />,
            iconBg: 'bg-indigo-50 text-indigo-600',
            borderColor: 'border-indigo-100'
          },
          {
            label: 'Applications Received',
            value: totalApplications,
            sub: '+3 this week',
            icon: <Users className="w-4 h-4" />,
            iconBg: 'bg-amber-50 text-amber-600',
            borderColor: 'border-amber-100'
          },
          {
            label: 'Upcoming Trainings',
            value: activeTrainingsCount,
            sub: 'Virtual sessions booked',
            icon: <Calendar className="w-4 h-4" />,
            iconBg: 'bg-blue-50 text-blue-600',
            borderColor: 'border-blue-100'
          }
        ].map((kpi, idx) => (
          <Card key={idx} className={`bg-white border ${kpi.borderColor} shadow-sm rounded-lg hover:shadow-md transition duration-150`}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">{kpi.label}</span>
                <span className="text-2xl font-bold text-slate-900 block font-mono">{kpi.value}</span>
                <span className="text-[10px] text-slate-400 block">{kpi.sub}</span>
              </div>
              <div className={`p-2.5 rounded-lg ${kpi.iconBg}`}>{kpi.icon}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Mid Section: Opportunity List & Live Matching */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Opportunity List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span>Published Programs</span>
              <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full font-mono font-medium">
                {filteredOpportunities.length}
              </span>
            </h2>

            {/* Search + Category Filter */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-48">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search opportunities..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
              <select
                value={activeCategory}
                onChange={e => setActiveCategory(e.target.value)}
                className="bg-white border border-slate-200 text-xs text-slate-600 px-2 py-1.5 rounded-lg focus:outline-none focus:border-emerald-500"
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredOpportunities.map((opp) => (
              <div
                key={opp.id}
                onClick={() => setSelectedOppId(opp.id)}
                className={`p-4 border bg-white rounded-lg shadow-sm cursor-pointer transition flex flex-col justify-between hover:shadow-md ${
                  selectedOppId === opp.id
                    ? 'border-emerald-500 ring-1 ring-emerald-500/20'
                    : 'border-slate-200'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                      {opp.category}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      opp.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-50 text-slate-500'
                    }`}>
                      {opp.status}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-slate-900 line-clamp-1">{opp.title}</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">by {opp.institution}</p>
                  
                  <p className="text-[11px] text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                    {opp.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                  <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-500">
                    <div>
                      <span className="text-slate-400 block uppercase font-semibold text-[8px]">Max Funding</span>
                      <span className="font-semibold text-slate-800">{opp.maxFunding}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block uppercase font-semibold text-[8px]">Applications</span>
                      <span className="font-semibold text-slate-800">{opp.applicationsCount} received</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block uppercase font-semibold text-[8px]">Closing Date</span>
                      <span className="font-semibold text-slate-800 font-mono">{opp.deadline}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1">
                    <div className="flex items-center space-x-2">
                      <span>👁 {opp.views} views</span>
                      <span>💾 {opp.saved} saved</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold border border-emerald-100 text-[8px] flex items-center gap-1">
                        <Sparkles className="w-2 h-2 text-emerald-500" />
                        AI Matched
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 1 Column: Live Opportunity AI Match Analyzer */}
        <div className="lg:col-span-1">
          <Card className="bg-slate-50/50 border border-slate-200 rounded-lg shadow-sm h-full flex flex-col justify-between">
            <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
              <div>
                <div className="pb-3 border-b border-slate-200/80">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-500" />
                      Elevata Match Engine
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">Match Accuracy: 98%</span>
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 mt-1 line-clamp-1">
                    {selectedOpp?.title || 'Select an Opportunity'}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Eligibility Match Analysis</p>
                </div>

                <div className="py-2.5 text-xs text-slate-500 leading-relaxed font-sans border-b border-slate-200/80 space-y-2">
                  <div className="flex justify-between items-center text-[10px] text-slate-500">
                    <span>Sectors targeted:</span>
                    <span className="font-semibold text-slate-700">{selectedOpp?.sectors.join(', ')}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-500">
                    <span>Min Revenue:</span>
                    <span className="font-semibold text-slate-700">{formatRWF(selectedOpp?.minRevenue || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-500">
                    <span>Readiness threshold:</span>
                    <span className="font-semibold text-slate-700 font-mono">{selectedOpp?.minReadinessScore}%</span>
                  </div>
                </div>

                <div className="space-y-3 pt-3">
                  <h4 className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">AI Categorized Matches</h4>
                  <div className="space-y-2">
                    {[
                      {
                        label: 'Highly Qualified',
                        badge: 'bg-emerald-50 text-emerald-700 border-emerald-100',
                        count: matchedSMEs.filter(s => s.status === 'Highly Qualified').length,
                        smesList: matchedSMEs.filter(s => s.status === 'Highly Qualified').map(s => s.name).join(', ')
                      },
                      {
                        label: 'Needs Minor Improvements',
                        badge: 'bg-amber-50 text-amber-700 border-amber-100',
                        count: matchedSMEs.filter(s => s.status === 'Needs Minor Improvements').length,
                        smesList: matchedSMEs.filter(s => s.status === 'Needs Minor Improvements').map(s => s.name).join(', ')
                      },
                      {
                        label: 'Needs Preparation',
                        badge: 'bg-rose-50 text-rose-700 border-rose-100',
                        count: matchedSMEs.filter(s => s.status === 'Needs Preparation').length,
                        smesList: matchedSMEs.filter(s => s.status === 'Needs Preparation').map(s => s.name).join(', ')
                      }
                    ].map((group, i) => (
                      <div key={i} className="p-2.5 bg-white border border-slate-200 rounded-lg space-y-1 hover:bg-slate-50/50 transition">
                        <div className="flex justify-between items-center">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${group.badge}`}>
                            {group.label}
                          </span>
                          <span className="text-xs font-bold text-slate-900 font-mono">{group.count} SMEs</span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          {group.smesList || 'None in current scope'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200/80">
                <a
                  href="#eligible-table"
                  className="w-full flex items-center justify-center gap-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
                >
                  View Matches Table
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Eligible SMEs Section */}
      <div id="eligible-table" className="pt-4 border-t border-slate-100">
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">AI Matched Eligible SMEs</h3>
              <p className="text-[10px] text-slate-400 mt-0.5 font-sans">Businesses matching current selection eligibility rules</p>
            </div>
            <button
              onClick={() => triggerToast('Invited all highly qualified SMEs to apply via automated messaging.')}
              className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 rounded-md hover:bg-emerald-100 transition"
            >
              Invite All Matches
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[10px]">
                  <th className="px-5 py-3">Business Name</th>
                  <th className="px-5 py-3">Sector</th>
                  <th className="px-5 py-3">Loan Readiness</th>
                  <th className="px-5 py-3">Business Health</th>
                  <th className="px-5 py-3">Revenue Trend</th>
                  <th className="px-5 py-3">AI Fit status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {matchedSMEs.map((sme) => (
                  <tr key={sme.id} className="hover:bg-slate-50/40 transition">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-900">{sme.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{sme.ownerName} · {sme.email}</div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 font-medium">{sme.sector}</td>
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-800">
                      {sme.healthScore + 3}%
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold font-mono text-slate-800">{sme.healthScore}</span>
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden shrink-0">
                          <div
                            className={`h-full rounded-full ${
                              sme.healthScore >= 80 ? 'bg-emerald-500' : sme.healthScore >= 60 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${sme.healthScore}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-0.5 font-bold ${
                        sme.healthTrend === 'up' ? 'text-emerald-600' : 'text-slate-500'
                      }`}>
                        <TrendingUp className="w-3 h-3" />
                        {sme.revenueTrend}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[9px] font-bold uppercase ${
                        sme.status === 'Highly Qualified'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          : sme.status === 'Needs Minor Improvements'
                          ? 'bg-amber-50 text-amber-700 border-amber-100'
                          : 'bg-rose-50 text-rose-700 border-rose-100'
                      }`}>
                        {sme.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => triggerToast(`Invited ${sme.name} to apply for "${selectedOpp?.title}".`)}
                        className="px-2.5 py-1 bg-white hover:bg-slate-50 text-[10px] font-bold text-slate-700 border border-slate-200 rounded-md transition"
                      >
                        Invite SME
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Opportunity Analytics Section */}
      <div className="pt-4 border-t border-slate-100 space-y-4">
        <div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Opportunity Analytics</h3>
          <p className="text-[10px] text-slate-400 mt-0.5 font-sans">Performance and conversion demographics for {selectedOpp?.title}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Views & Applications over Time */}
          <Card className="bg-white border border-slate-200 rounded-lg shadow-sm">
            <CardContent className="p-4">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-4">Engagement Trend</h4>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={viewsApplicationsChartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 9 }} />
                    <Tooltip contentStyle={{ fontSize: 10 }} />
                    <Area type="monotone" dataKey="Views" stroke="#10B981" fill="#E6F4EA" />
                    <Area type="monotone" dataKey="Applications" stroke="#3B82F6" fill="#E8F0FE" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Middle Column: Funnel & Sector Distribution */}
          <Card className="bg-white border border-slate-200 rounded-lg shadow-sm">
            <CardContent className="p-4">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-4">Conversion Funnel</h4>
              <div className="space-y-3.5 mt-2">
                {[
                  { label: 'Views', value: selectedOpp?.views || 100, pct: '100%', bg: 'bg-slate-100' },
                  { label: 'Interested', value: selectedOpp?.saved || 30, pct: `${Math.round(((selectedOpp?.saved || 30) / (selectedOpp?.views || 100)) * 100)}%`, bg: 'bg-indigo-50 text-indigo-700' },
                  { label: 'Applications', value: selectedOpp?.applicationsCount || 5, pct: `${Math.round(((selectedOpp?.applicationsCount || 5) / (selectedOpp?.views || 100)) * 100)}%`, bg: 'bg-amber-50 text-amber-700' },
                  { label: 'Approved', value: 1, pct: '20% of apps', bg: 'bg-emerald-50 text-emerald-700' }
                ].map((step, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] text-slate-500 font-medium">
                      <span>{step.label}</span>
                      <span className="font-mono font-bold text-slate-800">{step.value} ({step.pct})</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          i === 0 ? 'bg-slate-400' : i === 1 ? 'bg-indigo-500' : i === 2 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: i === 0 ? '100%' : i === 1 ? '40%' : i === 2 ? '15%' : '5%' }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Right Column: Missing Requirements & Sector distribution */}
          <Card className="bg-white border border-slate-200 rounded-lg shadow-sm">
            <CardContent className="p-4 flex flex-col justify-between h-full">
              <div>
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Most Common Missing Requirements</h4>
                <div className="space-y-2.5">
                  {missingRequirementData.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-slate-700 font-medium">{item.name}</span>
                      <span className="bg-rose-50 text-rose-700 font-mono font-bold px-2 py-0.5 rounded text-[10px] border border-rose-100">
                        {item.value}% of fails
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Virtual Training Manager Section */}
      <div className="pt-6 border-t border-slate-100 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Virtual Training Manager</h3>
            <p className="text-[10px] text-slate-400 mt-0.5 font-sans">Schedule interactive capacity sessions to increase SME credit worthiness.</p>
          </div>
          <button
            onClick={() => setIsTrainingModalOpen(true)}
            className="px-3 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-md text-xs font-semibold text-slate-700 transition"
          >
            Create Training Session
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active trainings list */}
          <div className="lg:col-span-2 space-y-3">
            {trainings.map((tr) => (
              <div key={tr.id} className="p-4 border border-slate-200 rounded-lg bg-white shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-950">{tr.title}</h4>
                    <span className="bg-blue-50 text-blue-700 text-[8px] px-2 py-0.5 rounded border border-blue-100 uppercase tracking-wider font-bold">
                      Virtual
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 line-clamp-1">{tr.description}</p>
                  <div className="flex items-center gap-3 text-[10px] text-slate-400 pt-1 font-sans">
                    <span>📅 {tr.date} ({tr.time})</span>
                    <span>🎤 {tr.speaker}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                  <div className="text-right text-[10px] text-slate-500 font-mono">
                    <span className="block font-bold text-slate-800">{tr.participantsCount} registered</span>
                    <span className="text-slate-400">Attendance rate: 85%</span>
                  </div>
                  
                  <button
                    onClick={() => triggerToast(`Invited target audience for: ${tr.title}`)}
                    className="px-2.5 py-1 border border-slate-200 hover:bg-slate-50 text-[10px] font-bold text-slate-700 rounded-md transition"
                  >
                    Invite Audience
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* AI Training Impact & Auto Participant recommendation */}
          <Card className="bg-slate-50 border border-slate-200 rounded-lg shadow-sm">
            <CardContent className="p-4 space-y-4">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                AI Capacity Impact
              </h4>
              <p className="text-[10px] text-slate-500 leading-relaxed font-sans">
                Virtual trainings improve average SME readiness scores by <strong className="text-emerald-600 font-bold">+12%</strong>. We recommend targeting under-qualified SMEs for upcoming classes.
              </p>

              <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-2">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Recommended participants</span>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] text-slate-700 font-medium">
                    <span>Jean Bosco (Maize Agro)</span>
                    <span className="text-amber-600 font-semibold font-mono">Readiness 64%</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-700 font-medium">
                    <span>David Mugisha (Logistics)</span>
                    <span className="text-rose-600 font-semibold font-mono">Readiness 45%</span>
                  </div>
                </div>
                <button
                  onClick={() => triggerToast('Invited recommended participants to the next workshop.')}
                  className="w-full text-center py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-[10px] font-bold text-emerald-700 rounded-md mt-1 transition"
                >
                  Invite Target Participants
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* PUBLISH OPPORTUNITY STEPPER MODAL */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-lg shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-slate-950 font-heading">Publish Financial Opportunity</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">SME Credit Institution Portal</p>
              </div>
              <button
                onClick={() => setIsPublishModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Stepper Steps Indicators */}
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-100 flex justify-between items-center text-[10px] text-slate-500 font-medium">
              <span className={publishStep >= 1 ? 'text-emerald-700 font-bold' : ''}>1. Basic Info</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className={publishStep >= 2 ? 'text-emerald-700 font-bold' : ''}>2. Eligibility rules</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className={publishStep >= 3 ? 'text-emerald-700 font-bold' : ''}>3. AI Match analysis</span>
            </div>

            {/* Content */}
            <div className="p-5 max-h-[380px] overflow-y-auto">
              
              {/* STEP 1: Basic Information */}
              {publishStep === 1 && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Opportunity Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Agribusiness Expansion Loan"
                      value={newOppTitle}
                      onChange={e => setNewOppTitle(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Category</label>
                      <select
                        value={newOppCategory}
                        onChange={e => setNewOppCategory(e.target.value)}
                        className="w-full border border-slate-200 bg-white rounded-lg p-2 text-xs focus:outline-none focus:border-emerald-500"
                      >
                        {categories.filter(c => c !== 'All').map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Max Funding Amount</label>
                      <input
                        type="number"
                        placeholder="e.g. 15000000"
                        value={newOppMaxFunding}
                        onChange={e => setNewOppMaxFunding(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Description</label>
                    <textarea
                      placeholder="Enter description..."
                      rows={3}
                      value={newOppDescription}
                      onChange={e => setNewOppDescription(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Key Benefits</label>
                    <input
                      type="text"
                      placeholder="e.g. 10% interest rate, 2 weeks grace period"
                      value={newOppBenefits}
                      onChange={e => setNewOppBenefits(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Application Deadline</label>
                    <input
                      type="date"
                      value={newOppDeadline}
                      onChange={e => setNewOppDeadline(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>
              )}

              {/* STEP 2: Eligibility Requirements */}
              {publishStep === 2 && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Target Sectors</label>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {availableSectors.map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => handleSectorChange(s)}
                          className={`px-3 py-1 text-xs font-semibold rounded-md border transition ${
                            newOppSectors.includes(s)
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Min Monthly Sales (FRW)</label>
                      <input
                        type="number"
                        value={newOppMinRevenue}
                        onChange={e => setNewOppMinRevenue(parseInt(e.target.value) || 0)}
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Min Business Age (Years)</label>
                      <input
                        type="number"
                        value={newOppMinAge}
                        onChange={e => setNewOppMinAge(parseInt(e.target.value) || 0)}
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Min Business Health Score</label>
                      <input
                        type="number"
                        value={newOppMinHealthScore}
                        onChange={e => setNewOppMinHealthScore(parseInt(e.target.value) || 0)}
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Min Loan Readiness Score</label>
                      <input
                        type="number"
                        value={newOppMinReadiness}
                        onChange={e => setNewOppMinReadiness(parseInt(e.target.value) || 0)}
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5 pt-2">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newOppRegRequired}
                        onChange={e => setNewOppRegRequired(e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-[10px] text-slate-600 font-semibold uppercase">Registration Required</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newOppTaxRequired}
                        onChange={e => setNewOppTaxRequired(e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-[10px] text-slate-600 font-semibold uppercase">Tax Compliant</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newOppCollateralRequired}
                        onChange={e => setNewOppCollateralRequired(e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-[10px] text-slate-600 font-semibold uppercase">Collateral Req.</span>
                    </label>
                  </div>

                  <div className="space-y-1 pt-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Required Documents</label>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {documentOptions.map(doc => (
                        <label key={doc} className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-600">
                          <input
                            type="checkbox"
                            checked={newOppRequiredDocs.includes(doc)}
                            onChange={() => handleDocChange(doc)}
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <span>{doc}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: AI Matching Results */}
              {publishStep === 3 && (
                <div className="space-y-4 py-4 text-center">
                  {matchingAnimation ? (
                    <div className="space-y-4 py-8">
                      <div className="relative w-16 h-16 mx-auto">
                        <Loader2 className="w-16 h-16 text-emerald-500 animate-spin absolute" />
                        <Sparkles className="w-6 h-6 text-emerald-600 absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 animate-pulse" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-slate-900 font-heading">AI is matching eligible businesses...</h4>
                        <p className="text-[10px] text-slate-400">Parsing transaction ledgers and health scores across sectors</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
                        <Check className="w-6 h-6" />
                      </div>
                      
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-slate-900">Matching Complete!</h4>
                        <p className="text-[10px] text-slate-500">
                          We found <strong className="text-emerald-600 font-bold">4 matching businesses</strong> satisfying your eligibility criteria in Elevata network.
                        </p>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-lg text-left space-y-2 border border-slate-100">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">AI Match Breakdown</span>
                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                          <div className="p-2 bg-white rounded border border-slate-200/80">
                            <span className="block font-bold text-emerald-600">2</span>
                            <span className="text-[9px] text-slate-400 uppercase font-semibold">Highly Qualified</span>
                          </div>
                          <div className="p-2 bg-white rounded border border-slate-200/80">
                            <span className="block font-bold text-amber-600">1</span>
                            <span className="text-[9px] text-slate-400 uppercase font-semibold">Minor Fixes</span>
                          </div>
                          <div className="p-2 bg-white rounded border border-slate-200/80">
                            <span className="block font-bold text-rose-600">1</span>
                            <span className="text-[9px] text-slate-400 uppercase font-semibold">Needs Prep</span>
                          </div>
                        </div>
                      </div>

                      <p className="text-[10px] text-slate-400 italic">
                        Once submitted, this program will appear in the Opportunity Hub for matching businesses instantly.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
              <button
                type="button"
                onClick={() => {
                  if (publishStep > 1) setPublishStep(prev => prev - 1);
                  else setIsPublishModalOpen(false);
                }}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 transition"
              >
                {publishStep === 1 ? 'Cancel' : 'Back'}
              </button>

              <button
                type="button"
                disabled={matchingAnimation}
                onClick={publishStep === 3 ? handlePublishSubmit : handleNextStep}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition"
              >
                {publishStep === 3 ? 'Publish Opportunity' : 'Next Step'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE TRAINING MODAL */}
      {isTrainingModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <form onSubmit={handleTrainingSubmit} className="bg-white border border-slate-200 rounded-lg shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-slate-950 font-heading">Schedule Virtual Training</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Automated capacity integration for SMEs</p>
              </div>
              <button
                type="button"
                onClick={() => setIsTrainingModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Training Title</label>
                <input
                  type="text"
                  placeholder="e.g. Financial Recordkeeping Masterclass"
                  value={trTitle}
                  onChange={e => setTrTitle(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Description</label>
                <textarea
                  placeholder="Enter session abstract..."
                  rows={2}
                  value={trDescription}
                  onChange={e => setTrDescription(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Date</label>
                  <input
                    type="date"
                    value={trDate}
                    onChange={e => setTrDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 10:00 AM - 12:00 PM"
                    value={trTime}
                    onChange={e => setTrTime(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Speaker / Host</label>
                  <input
                    type="text"
                    placeholder="e.g. Jean Paul Habimana"
                    value={trSpeaker}
                    onChange={e => setTrSpeaker(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Meeting Link (Zoom / Teams)</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={trLink}
                    onChange={e => setTrLink(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Target Audience</label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {['Agriculture', 'Retail', 'Women', 'Youth', 'Low Readiness SMEs', 'High Growth SMEs'].map(aud => (
                    <button
                      key={aud}
                      type="button"
                      onClick={() => setTrAudience(prev => prev.includes(aud) ? prev.filter(a => a !== aud) : [...prev, aud])}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-md border transition ${
                        trAudience.includes(aud)
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {aud}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsTrainingModalOpen(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
              >
                Schedule Session
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
