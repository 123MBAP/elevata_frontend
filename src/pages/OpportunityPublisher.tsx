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
  Info,
  Landmark
} from 'lucide-react';
import { Card, CardContent } from '../assets/components/ui/card';

type OpportunityType = 'loan' | 'grant' | 'fintech' | 'insurance' | 'training' | 'guarantee' | 'savings' | 'other';

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

  // Dynamic Publisher wizard state
  const [oppType, setOppType] = useState<OpportunityType>('loan');
  
  // Step 2: Basic info
  const [oppName, setOppName] = useState('');
  const [oppDesc, setOppDesc] = useState('');
  const [oppProvider, setOppProvider] = useState('Elevata Underwriting Corp');
  const [oppCategory, setOppCategory] = useState('Loan');
  const [oppStage, setOppStage] = useState('Growth');
  const [oppSectors, setOppSectors] = useState<string[]>(['Agriculture', 'Retail']);
  const [oppLocation, setOppLocation] = useState('Rwanda');
  const [oppDeadline, setOppDeadline] = useState('2026-10-31');

  // Step 3: Type specific details
  // Loan params
  const [loanType, setLoanType] = useState('Working Capital');
  const [loanMinAmt, setLoanMinAmt] = useState('1000000');
  const [loanMaxAmt, setLoanMaxAmt] = useState('25000000');
  const [loanRate, setLoanRate] = useState('8.5');
  const [loanTerm, setLoanTerm] = useState('24');
  const [loanGrace, setLoanGrace] = useState('3');
  const [loanCollateralReq, setLoanCollateralReq] = useState(false);
  const [loanCollateralType, setLoanCollateralType] = useState('Asset Registration');
  const [loanPurpose, setLoanPurpose] = useState('Working Capital');

  // Grant params
  const [grantAmt, setGrantAmt] = useState('15000000');
  const [grantCoFundingReq, setGrantCoFundingReq] = useState(false);
  const [grantCoFundingPct, setGrantCoFundingPct] = useState('20');
  const [grantDuration, setGrantDuration] = useState('12');
  const [grantImpact, setGrantImpact] = useState('Employment & Green Tech');

  // Fintech params
  const [fintechType, setFintechType] = useState('POS Payments');
  const [fintechFee, setFintechFee] = useState('15000');
  const [fintechTxFee, setFintechTxFee] = useState('1.5%');

  // Step 4: Business Profile Eligibility Builder
  const [eligSoleProp, setEligSoleProp] = useState(true);
  const [eligCompany, setEligCompany] = useState(true);
  const [eligCooperative, setEligCooperative] = useState(true);
  const [eligStartup, setEligStartup] = useState(true);
  const [eligMinAge, setEligMinAge] = useState(1);
  const [eligMinEmployees, setEligMinEmployees] = useState(3);
  const [eligLocations, setEligLocations] = useState<string[]>(['Kigali', 'Northern Province']);

  // Step 5: Financial Eligibility Builder
  const [finMinMonthlyRev, setFinMinMonthlyRev] = useState(2000000);
  const [finMinAnnualRev, setFinMinAnnualRev] = useState(24000000);
  const [finMinReadiness, setFinMinReadiness] = useState(65);
  const [finMinHealth, setFinMinHealth] = useState(60);
  const [finMaxDebtToRevenue, setFinMaxDebtToRevenue] = useState(35);
  const [finStatementsReq, setFinStatementsReq] = useState(true);

  // Step 6: Documentation Requirements Dossier checklist
  const [docRequirements, setDocRequirements] = useState<Record<string, 'Required' | 'Optional' | 'N/A'>>({
    'Business Registration Certificate': 'Required',
    'National ID': 'Required',
    'Tax Clearance': 'Required',
    'Bank Statements': 'Required',
    'Financial Statements': 'Optional',
    'Business Plan': 'Optional',
    'Cash Flow Projection': 'Optional',
    'Collateral Documents': 'N/A'
  });

  // Step 7: Readiness Requirements
  const [readinessMinRecords, setReadinessMinRecords] = useState('6 months');
  const [readinessPlanReq, setReadinessPlanReq] = useState(true);
  const [readinessMinDigitalActivity, setReadinessMinDigitalActivity] = useState('3 months');
  const [readinessTaxCompliance, setReadinessTaxCompliance] = useState(true);

  // Step 8: Application Process Definition
  const [appMethod, setAppMethod] = useState('Apply directly through Elevata');
  const appSteps = [
    '1. Check eligibility profile',
    '2. Complete application dossier',
    '3. Upload required documents',
    '4. Automated AI risk review',
    '5. Bank officer interview & disburse'
  ];

  // Step 9: AI Matching Weights
  const [weights, setWeights] = useState<Record<string, 'Required' | 'Important' | 'Preferred'>>({
    'Business sector': 'Required',
    'Business location': 'Important',
    'Revenue': 'Required',
    'Business age': 'Preferred',
    'Financial health': 'Required',
    'Loan readiness': 'Required',
    'Required documents': 'Important',
    'Business stage': 'Preferred'
  });

  // Step 10: AI Match Preview & Suitability Simulator Data
  const simulatedMatches = useMemo(() => {
    return [
      {
        name: 'Green Harvest Ltd',
        sector: 'Agriculture',
        matchPercent: 94,
        status: 'Highly Qualified',
        checks: [
          { label: 'Agriculture sector', pass: true },
          { label: '3 years operating history', pass: true },
          { label: 'Revenue meets requirement', pass: true },
          { label: 'Strong cash flow', pass: true },
          { label: 'Location eligible', pass: true },
          { label: 'Business profile complete', pass: true }
        ],
        missing: ['Updated tax clearance'],
        readiness: 'Financing Ready',
        action: 'Upload updated tax clearance and proceed with application.'
      },
      {
        name: "Marie's Kigali Fresh Mart",
        sector: 'Retail',
        matchPercent: 78,
        status: 'Needs Minor Improvements',
        checks: [
          { label: 'Retail sector', pass: true },
          { label: 'Kigali location', pass: true },
          { label: 'Revenue meets requirement', pass: true },
          { label: 'Current inventory levels stable', pass: true },
          { label: 'Missing requirements dossier', pass: false }
        ],
        missing: ['Audited Financial Statements', 'Cooperative Certificate'],
        readiness: 'Needs Prep',
        action: 'Submit financial statements to unlock full match score.'
      },
      {
        name: 'David Transport Services',
        sector: 'Logistics',
        matchPercent: 42,
        status: 'Needs Preparation',
        checks: [
          { label: 'Sector mismatch', pass: false },
          { label: 'High overhead fuel costs', pass: false },
          { label: 'Operating history under 12 months', pass: false },
          { label: 'Debt service coverage below limits', pass: false }
        ],
        missing: ['Collateral Documents', 'Tax Returns', 'Business Plan'],
        readiness: 'Unqualified',
        action: 'Schedule advisory consultation or complete Record-Keeping training.'
      }
    ];
  }, []);

  // Training Form State
  const [isTrainingModalOpen, setIsTrainingModalOpen] = useState(false);
  const [trTitle, setTrTitle] = useState('');
  const [trDescription, setTrDescription] = useState('');
  const [trDate, setTrDate] = useState('2026-08-15');
  const [trTime, setTrTime] = useState('10:00 AM - 12:00 PM');
  const [trSpeaker, setTrSpeaker] = useState('Dr. Agnes Kalibata (Director, AgroGrow)');
  const [trLink, setTrLink] = useState('https://zoom.us/j/elevata-training-live');
  const [trAudience, setTrAudience] = useState<string[]>(['Agriculture', 'Low Readiness SMEs']);

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
  const availableSectors = ['Retail', 'Agriculture', 'Logistics', 'Technology', 'Manufacturing', 'Hospitality', 'Services'];

  // Categories helper
  const categories = ['All', 'Loan', 'Grant', 'Savings Product', 'Investment', 'Training', 'Insurance', 'Business Advisory'];

  // Stepper helper
  const stepsList = [
    { num: 1, name: 'Select Type' },
    { num: 2, name: 'Basic Info' },
    { num: 3, name: 'Product Details' },
    { num: 4, name: 'Profile Rules' },
    { num: 5, name: 'Financial Rules' },
    { num: 6, name: 'Documents' },
    { num: 7, name: 'Readiness' },
    { num: 8, name: 'Application' },
    { num: 9, name: 'AI Weights' },
    { num: 10, name: 'AI Preview' }
  ];

  // Handle step navigations
  const handleNextStep = () => {
    if (publishStep === 1) {
      setPublishStep(2);
    } else if (publishStep === 2) {
      if (!oppName || !oppDeadline) {
        triggerToast('Please fill in opportunity name and deadline date.', 'info');
        return;
      }
      setPublishStep(3);
    } else if (publishStep === 3) {
      setPublishStep(4);
    } else if (publishStep === 4) {
      setPublishStep(5);
    } else if (publishStep === 5) {
      setPublishStep(6);
    } else if (publishStep === 6) {
      setPublishStep(7);
    } else if (publishStep === 7) {
      setPublishStep(8);
    } else if (publishStep === 8) {
      setPublishStep(9);
    } else if (publishStep === 9) {
      setPublishStep(10);
      setMatchingAnimation(true);
      setTimeout(() => {
        setMatchingAnimation(false);
      }, 2000);
    }
  };

  // Handle final opportunity publication
  const handlePublishSubmit = () => {
    let fundingVal = 'Flexible';
    if (oppType === 'loan') {
      fundingVal = `${formatRWF(parseInt(loanMaxAmt) || 0)}`;
    } else if (oppType === 'grant') {
      fundingVal = `${formatRWF(parseInt(grantAmt) || 0)}`;
    }

    const docsList = Object.keys(docRequirements).filter(doc => docRequirements[doc] === 'Required');

    publishOpportunity({
      title: oppName,
      institution: oppProvider,
      category: oppCategory,
      description: oppDesc || `${oppCategory} opportunity targeting growing local ventures.`,
      benefits: oppType === 'loan'
        ? `${loanRate}% Interest, ${loanTerm} months term, grace period of ${loanGrace} months.`
        : oppType === 'grant'
        ? `100% equity-free funding. Expected impact: ${grantImpact}`
        : 'Automated terms and capacity scaling benefits.',
      deadline: oppDeadline,
      maxFunding: fundingVal,
      sectors: oppSectors,
      minAge: eligMinAge,
      minRevenue: finMinAnnualRev,
      minHealthScore: finMinHealth,
      minReadinessScore: finMinReadiness,
      registrationRequired: eligSoleProp || eligCompany,
      taxCompliance: readinessTaxCompliance,
      collateralRequired: loanCollateralReq,
      requiredDocs: docsList,
      
      // Extended fields
      minMonthlyRevenue: finMinMonthlyRev,
      maxDebtToRevenue: finMaxDebtToRevenue,
      collateralType: loanCollateralReq ? loanCollateralType : undefined,
      eligLocations: eligLocations,
      loanRate: oppType === 'loan' ? parseFloat(loanRate) : undefined,
      loanTerm: oppType === 'loan' ? parseInt(loanTerm) : undefined,
      loanGrace: oppType === 'loan' ? parseInt(loanGrace) : undefined,
      grantCoFundingReq: oppType === 'grant' ? grantCoFundingReq : undefined,
      grantCoFundingPct: oppType === 'grant' && grantCoFundingReq ? parseFloat(grantCoFundingPct) : undefined,
      grantDuration: oppType === 'grant' ? parseInt(grantDuration) : undefined,
      appMethod: appMethod,
      appSteps: appSteps
    });

    triggerToast(`"${oppName}" published successfully! AI matches simulated and active.`);
    setIsPublishModalOpen(false);
    
    // Reset Form states
    setOppName('');
    setOppDesc('');
    setPublishStep(1);
  };

  // Action: Create Training from Gap Analysis
  const handleCreateTrainingFromGap = (missingRequirement: string, count: number) => {
    setTrTitle(`Masterclass: Preparing ${missingRequirement} for Financing`);
    setTrDescription(`A specialized capacity building workshop scheduled for the ${count} SMEs lacking completed ${missingRequirement.toLowerCase()} files to qualify for the ${selectedOpp.title} program.`);
    setTrDate('2026-08-22');
    setTrTime('09:00 AM - 11:30 AM');
    setTrSpeaker('Dr. Agnes Kalibata (Director, AgroGrow)');
    setTrAudience(['Low Readiness SMEs', ...selectedOpp.sectors]);
    setIsTrainingModalOpen(true);
  };

  // Action: Create Training for Specific Opportunity
  const handleCreateTrainingForOpp = (opp: typeof opportunities[0]) => {
    setTrTitle(`Capacity Building: Qualifying for ${opp.title}`);
    setTrDescription(`A specialized training program organized by ${opp.institution} to guide SMEs on eligibility requirements, credit compliance checks, and document compilation to successfully unlock financing under the "${opp.title}" opportunity.`);
    setTrDate('2026-08-25');
    setTrTime('10:00 AM - 12:30 PM');
    setTrSpeaker('Bank Credit Officer & Elevata Consultants');
    setTrAudience(['Low Readiness SMEs', ...opp.sectors]);
    setIsTrainingModalOpen(true);
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
      time: trTime,
      speaker: trSpeaker,
      meetingLink: trLink,
      targetAudience: trAudience
    });
    triggerToast(`Virtual Training session scheduled for targeting gap.`);
    setIsTrainingModalOpen(false);
    setTrTitle('');
    setTrDescription('');
  };

  // KPI Calculations
  const activeOppsCount = opportunities.filter(o => o.status === 'Active').length;
  const totalApplications = applications.length;
  const activeTrainingsCount = trainings.length;

  // Real-time matches computation for selected Opportunity
  const matchedSMEs = useMemo(() => {
    if (!selectedOpp) return [];
    return smes.map(sme => {
      let score = 30; // base score
      let missing: string[] = [];

      // Check Sector match
      const sectorMatch = selectedOpp.sectors.includes(sme.sector);
      if (sectorMatch) score += 20;
      else missing.push('Sector Mismatch');

      // Check Revenue match
      const annualRevenue = sme.monthlyData.reduce((sum, d) => sum + d.revenue, 0) * 2;
      const revenueMatch = annualRevenue >= selectedOpp.minRevenue;
      if (revenueMatch) score += 20;
      else missing.push('Insufficient Revenue');

      // Check health score match
      const healthMatch = sme.healthScore >= selectedOpp.minHealthScore;
      if (healthMatch) score += 15;
      else missing.push('Lower Business Health Score');

      // Check readiness score
      const readinessMatch = sme.healthScore + 2 >= selectedOpp.minReadinessScore;
      if (readinessMatch) score += 15;
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

  const missingRequirementData = useMemo(() => {
    return [
      { name: 'Financial Statements', count: 312 },
      { name: 'Business Plan', count: 187 },
      { name: 'Tax Clearance', count: 142 },
      { name: 'Minimum Revenue', count: 96 }
    ];
  }, []);

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
                  
                  <p className="text-[11px] text-slate-500 mt-2 line-clamp-2 leading-relaxed font-sans">
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

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-50 mt-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOppId(opp.id);
                        handleCreateTrainingForOpp(opp);
                      }}
                      className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-slate-700 rounded-md transition text-center"
                    >
                      🎓 Schedule Training
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOppId(opp.id);
                        setTimeout(() => {
                          document.getElementById('eligible-table')?.scrollIntoView({ behavior: 'smooth' });
                        }, 50);
                      }}
                      className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-[10px] font-bold text-white rounded-md transition text-center border-none"
                    >
                      🎯 Match SMEs
                    </button>
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
                  <th className="px-5 py-3">Match Details / Gaps</th>
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
                      {sme.healthScore + 2}%
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
                    <td className="px-5 py-3.5">
                      {sme.missing.length === 0 ? (
                        <span className="text-[10px] text-emerald-600 font-bold">100% Match: Met all criteria</span>
                      ) : (
                        <div className="text-[10px] text-slate-500 space-y-0.5">
                          <span className="font-mono text-slate-450 block truncate max-w-[170px]" title={sme.missing.join(', ')}>
                            {sme.missing.join(', ')}
                          </span>
                        </div>
                      )}
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
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Why are SMEs not qualifying? (Eligibility Gap)</h4>
                <div className="space-y-2.5">
                  {missingRequirementData.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded-lg border border-slate-150">
                      <div>
                        <span className="text-slate-800 font-bold block">{item.name}</span>
                        <span className="text-[9px] text-slate-400 font-medium">{item.count} matching SMEs missing this</span>
                      </div>
                      <button
                        onClick={() => handleCreateTrainingFromGap(item.name, item.count)}
                        className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-extrabold px-2.5 py-1 rounded text-[9.5px] border border-emerald-100 transition shrink-0"
                      >
                        Create Training
                      </button>
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
            onClick={() => {
              setTrTitle('');
              setTrDescription('');
              setIsTrainingModalOpen(true);
            }}
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
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 font-heading">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
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

      {/* DYNAMIC 10-STEP PUBLISH OPPORTUNITY STEPS MODAL */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-150 bg-slate-55 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 uppercase font-heading flex items-center gap-1.5">
                  <Landmark className="w-4 h-4 text-emerald-600" />
                  Opportunity Publisher Portal
                </h3>
                <p className="text-[10px] text-gray-400 mt-0.5">SME Credit &amp; Financing Facility Deployment</p>
              </div>
              <button
                onClick={() => setIsPublishModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-650 font-mono font-bold text-xs"
              >
                ✕
              </button>
            </div>

            {/* Stepper Steps Indicators Scrollable */}
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-150 flex items-center gap-1.5 overflow-x-auto text-[9.5px] text-slate-400 font-bold select-none whitespace-nowrap scrollbar-thin">
              {stepsList.map((step) => (
                <div key={step.num} className="flex items-center gap-1 shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] ${
                    publishStep === step.num
                      ? 'bg-emerald-600 text-white font-extrabold'
                      : publishStep > step.num
                      ? 'bg-emerald-100 text-emerald-700 font-bold'
                      : 'bg-slate-100 text-slate-400 font-medium'
                  }`}>
                    {step.num}
                  </span>
                  <span className={publishStep === step.num ? 'text-emerald-700 font-extrabold' : ''}>
                    {step.name}
                  </span>
                  {step.num < 10 && <ChevronRight className="w-3 h-3 text-slate-300" />}
                </div>
              ))}
            </div>

            {/* Content Scroll Area */}
            <div className="p-6 overflow-y-auto flex-1 text-xs space-y-4">
              
              {/* STEP 1: Select Opportunity Type */}
              {publishStep === 1 && (
                <div className="space-y-4">
                  <div className="text-center pb-2">
                    <h4 className="text-sm font-bold text-slate-800 font-heading">What would you like to publish?</h4>
                    <p className="text-[10px] text-gray-400 mt-0.5">Select a category to load the customized requirements schema.</p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { type: 'loan', label: 'Loan / Financing', emoji: '💰', cat: 'Loan' },
                      { type: 'grant', label: 'Grant Funding', emoji: '🎁', cat: 'Grant' },
                      { type: 'fintech', label: 'Digital Solutions', emoji: '📱', cat: 'Digital Solution' },
                      { type: 'insurance', label: 'Insurance Product', emoji: '🛡️', cat: 'Insurance' },
                      { type: 'training', label: 'Training session', emoji: '🎓', cat: 'Training' },
                      { type: 'guarantee', label: 'Financing Support', emoji: '🤝', cat: 'Business Advisory' }
                    ].map((opt) => (
                      <button
                        key={opt.type}
                        type="button"
                        onClick={() => {
                          setOppType(opt.type as any);
                          setOppCategory(opt.cat);
                          setPublishStep(2);
                        }}
                        className={`p-4 border rounded-xl flex flex-col items-center justify-center text-center gap-2 transition hover:border-emerald-500 hover:bg-slate-50/50 ${
                          oppType === opt.type
                            ? 'border-emerald-500 bg-emerald-50/20 text-emerald-800 ring-1 ring-emerald-500/20'
                            : 'border-slate-200 text-slate-700 bg-white'
                        }`}
                      >
                        <span className="text-2xl">{opt.emoji}</span>
                        <strong className="text-[10.5px] font-bold block">{opt.label}</strong>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 2: Basic Opportunity Information */}
              {publishStep === 2 && (
                <div className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Opportunity Name</label>
                    <input
                      type="text"
                      placeholder="e.g. SME Working Capital Facility"
                      value={oppName}
                      onChange={e => setOppName(e.target.value)}
                      className="w-full border border-slate-250 rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-slate-50/30"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Provider Institution</label>
                      <input
                        type="text"
                        value={oppProvider}
                        onChange={e => setOppProvider(e.target.value)}
                        className="w-full border border-slate-250 rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-slate-50/30"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Target Stage</label>
                      <select
                        value={oppStage}
                        onChange={e => setOppStage(e.target.value)}
                        className="w-full border border-slate-250 bg-white rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      >
                        <option value="Idea / Pre-revenue">Idea / Pre-revenue</option>
                        <option value="Startup">Startup</option>
                        <option value="Early-stage">Early-stage</option>
                        <option value="Growth">Growth</option>
                        <option value="Established">Established</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Target Sectors</label>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {availableSectors.map(s => {
                        const exists = oppSectors.includes(s);
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setOppSectors(prev => exists ? prev.filter(x => x !== s) : [...prev, s])}
                            className={`px-3 py-1 rounded-md text-[10px] font-bold border transition ${
                              exists ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-white border-slate-250 text-slate-500'
                            }`}
                          >
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Target Location</label>
                      <input
                        type="text"
                        value={oppLocation}
                        onChange={e => setOppLocation(e.target.value)}
                        className="w-full border border-slate-250 rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-slate-50/30"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Application Deadline</label>
                      <input
                        type="date"
                        value={oppDeadline}
                        onChange={e => setOppDeadline(e.target.value)}
                        className="w-full border border-slate-250 rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-slate-50/30 font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Short Description</label>
                    <textarea
                      placeholder="e.g. Working capital financing for growing retail and trading businesses."
                      rows={2}
                      value={oppDesc}
                      onChange={e => setOppDesc(e.target.value)}
                      className="w-full border border-slate-250 rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-slate-50/30 leading-relaxed"
                    />
                  </div>
                </div>
              )}

              {/* STEP 3: Specific Product Details (Based on Type) */}
              {publishStep === 3 && (
                <div className="space-y-4">
                  {oppType === 'loan' && (
                    <div className="space-y-3">
                      <span className="font-bold text-slate-800 block border-b pb-1 text-[11px] uppercase tracking-wider">💰 Financing Parameters</span>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Financing Type</label>
                          <select value={loanType} onChange={e => setLoanType(e.target.value)} className="w-full border border-slate-250 bg-white rounded-lg p-2.5 text-xs focus:outline-none">
                            <option value="Working Capital">Working Capital</option>
                            <option value="Asset Finance">Asset Finance</option>
                            <option value="Expansion">Expansion Facility</option>
                            <option value="Agriculture Finance">Agriculture Finance</option>
                            <option value="Trade Finance">Trade Finance</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Purpose of Financing</label>
                          <select value={loanPurpose} onChange={e => setLoanPurpose(e.target.value)} className="w-full border border-slate-250 bg-white rounded-lg p-2.5 text-xs focus:outline-none">
                            <option value="Inventory">Purchase Inventory</option>
                            <option value="Equipment">Acquire Machinery</option>
                            <option value="Technology">Technology Upgrade</option>
                            <option value="Working Capital">General Operating Capital</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Min Principal (FRW)</label>
                          <input type="number" value={loanMinAmt} onChange={e => setLoanMinAmt(e.target.value)} className="w-full border border-slate-250 rounded-lg p-2.5 text-xs focus:outline-none font-mono" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Max Principal (FRW)</label>
                          <input type="number" value={loanMaxAmt} onChange={e => setLoanMaxAmt(e.target.value)} className="w-full border border-slate-250 rounded-lg p-2.5 text-xs focus:outline-none font-mono" />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Interest Rate (% p.a.)</label>
                          <input type="number" step="0.1" value={loanRate} onChange={e => setLoanRate(e.target.value)} className="w-full border border-slate-250 rounded-lg p-2.5 text-xs focus:outline-none font-mono" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Period (Months)</label>
                          <input type="number" value={loanTerm} onChange={e => setLoanTerm(e.target.value)} className="w-full border border-slate-250 rounded-lg p-2.5 text-xs focus:outline-none font-mono" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Grace Period (m)</label>
                          <input type="number" value={loanGrace} onChange={e => setLoanGrace(e.target.value)} className="w-full border border-slate-250 rounded-lg p-2.5 text-xs focus:outline-none font-mono" />
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3.5">
                        <div className="flex justify-between items-center text-xs">
                          <label className="text-slate-650 font-bold uppercase text-[9.5px]">Collateral Required?</label>
                          <input type="checkbox" checked={loanCollateralReq} onChange={e => setLoanCollateralReq(e.target.checked)} className="rounded border-slate-300 text-emerald-600" />
                        </div>
                        {loanCollateralReq && (
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase block">Collateral Type description</label>
                            <input type="text" value={loanCollateralType} onChange={e => setLoanCollateralType(e.target.value)} className="w-full border border-slate-200 bg-white rounded p-1.5 text-xs focus:outline-none" />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {oppType === 'grant' && (
                    <div className="space-y-3">
                      <span className="font-bold text-slate-800 block border-b pb-1 text-[11px] uppercase tracking-wider">🎁 Grant Details</span>
                      
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Grant Amount (FRW)</label>
                        <input type="number" value={grantAmt} onChange={e => setGrantAmt(e.target.value)} className="w-full border border-slate-250 rounded-lg p-2.5 text-xs focus:outline-none font-mono" />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Grant Duration (Months)</label>
                          <input type="number" value={grantDuration} onChange={e => setGrantDuration(e.target.value)} className="w-full border border-slate-250 rounded-lg p-2.5 text-xs focus:outline-none font-mono" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Expected Impact Goal</label>
                          <input type="text" value={grantImpact} onChange={e => setGrantImpact(e.target.value)} className="w-full border border-slate-250 rounded-lg p-2.5 text-xs focus:outline-none" />
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                        <div className="flex justify-between items-center text-xs">
                          <label className="text-slate-650 font-bold uppercase text-[9.5px]">Co-funding / Matching Contribution Required?</label>
                          <input type="checkbox" checked={grantCoFundingReq} onChange={e => setGrantCoFundingReq(e.target.checked)} className="rounded border-slate-300 text-emerald-600" />
                        </div>
                        {grantCoFundingReq && (
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase block">Percentage of Co-funding required (%)</label>
                            <input type="number" value={grantCoFundingPct} onChange={e => setGrantCoFundingPct(e.target.value)} className="w-full border border-slate-200 bg-white rounded p-1.5 text-xs focus:outline-none" />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {oppType === 'fintech' && (
                    <div className="space-y-3">
                      <span className="font-bold text-slate-800 block border-b pb-1 text-[11px] uppercase tracking-wider">📱 Digital Solution Parameters</span>
                      
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Product Type</label>
                        <select value={fintechType} onChange={e => setFintechType(e.target.value)} className="w-full border border-slate-250 bg-white rounded-lg p-2.5 text-xs focus:outline-none">
                          <option value="POS Payments">POS Merchants terminal</option>
                          <option value="Mobile Banking SDK">Mobile Banking SDK</option>
                          <option value="Internet Banking">Internet Banking Portal</option>
                          <option value="Invoicing Integrations">Tax Invoicing Bridge</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Monthly Maintenance Fee (FRW)</label>
                          <input type="number" value={fintechFee} onChange={e => setFintechFee(e.target.value)} className="w-full border border-slate-250 rounded-lg p-2.5 text-xs focus:outline-none font-mono" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Transaction Fee rate</label>
                          <input type="text" value={fintechTxFee} onChange={e => setFintechTxFee(e.target.value)} className="w-full border border-slate-250 rounded-lg p-2.5 text-xs focus:outline-none" />
                        </div>
                      </div>
                    </div>
                  )}

                  {oppType !== 'loan' && oppType !== 'grant' && oppType !== 'fintech' && (
                    <div className="p-8 text-center text-gray-400">
                      <Info className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <span>Custom opportunity selected. Proceed to profile rules settings.</span>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 4: Eligibility Criteria (Business Profile Builder) */}
              {publishStep === 4 && (
                <div className="space-y-4">
                  <span className="font-bold text-slate-800 block border-b pb-1 text-[11px] uppercase tracking-wider">🏢 Eligible Business Profile</span>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Business Legal Structure</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'Sole Proprietorship', val: eligSoleProp, set: setEligSoleProp },
                        { label: 'Registered Company', val: eligCompany, set: setEligCompany },
                        { label: 'Cooperative (SACCO)', val: eligCooperative, set: setEligCooperative },
                        { label: 'Startup Incubator', val: eligStartup, set: setEligStartup }
                      ].map((typeItem, i) => (
                        <label key={i} className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer">
                          <input type="checkbox" checked={typeItem.val} onChange={e => typeItem.set(e.target.checked)} className="rounded text-emerald-600" />
                          <span className="text-[10px] text-slate-700 font-semibold">{typeItem.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Min Operating Age (Years)</label>
                      <input type="number" min="0" value={eligMinAge} onChange={e => setEligMinAge(parseInt(e.target.value) || 0)} className="w-full border border-slate-255 rounded-lg p-2.5 text-xs focus:outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Min Employee Count</label>
                      <input type="number" min="0" value={eligMinEmployees} onChange={e => setEligMinEmployees(parseInt(e.target.value) || 0)} className="w-full border border-slate-255 rounded-lg p-2.5 text-xs focus:outline-none" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Geographical Scope (Districts)</label>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {['Kigali', 'Nyarugenge', 'Gasabo', 'Kicukiro', 'Northern Province', 'Western Province', 'Eastern Province'].map(loc => {
                        const exists = eligLocations.includes(loc);
                        return (
                          <button
                            key={loc}
                            type="button"
                            onClick={() => setEligLocations(prev => exists ? prev.filter(x => x !== loc) : [...prev, loc])}
                            className={`px-2.5 py-1 rounded-md text-[10px] font-bold border transition ${
                              exists ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-white border-slate-250 text-slate-500'
                            }`}
                          >
                            {loc}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5: Financial Eligibility Builder */}
              {publishStep === 5 && (
                <div className="space-y-3.5">
                  <span className="font-bold text-slate-800 block border-b pb-1 text-[11px] uppercase tracking-wider">📈 Financial Requirements Threshold</span>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Min Monthly turnover (FRW)</label>
                      <input type="number" value={finMinMonthlyRev} onChange={e => setFinMinMonthlyRev(parseInt(e.target.value) || 0)} className="w-full border border-slate-250 rounded-lg p-2.5 text-xs focus:outline-none font-mono" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Min Annual turnover (FRW)</label>
                      <input type="number" value={finMinAnnualRev} onChange={e => setFinMinAnnualRev(parseInt(e.target.value) || 0)} className="w-full border border-slate-250 rounded-lg p-2.5 text-xs focus:outline-none font-mono" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Min Loan Readiness Score (%)</label>
                      <input type="number" max="100" value={finMinReadiness} onChange={e => setFinMinReadiness(parseInt(e.target.value) || 0)} className="w-full border border-slate-250 rounded-lg p-2.5 text-xs focus:outline-none font-mono" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Min Business Health Score (%)</label>
                      <input type="number" max="100" value={finMinHealth} onChange={e => setFinMinHealth(parseInt(e.target.value) || 0)} className="w-full border border-slate-250 rounded-lg p-2.5 text-xs focus:outline-none font-mono" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Max Debt-to-Revenue Ratio (%)</label>
                      <input type="number" value={finMaxDebtToRevenue} onChange={e => setFinMaxDebtToRevenue(parseInt(e.target.value) || 0)} className="w-full border border-slate-250 rounded-lg p-2.5 text-xs focus:outline-none font-mono" />
                    </div>
                    <div className="flex items-center gap-2 pt-4">
                      <input type="checkbox" checked={finStatementsReq} onChange={e => setFinStatementsReq(e.target.checked)} className="rounded border-slate-350 text-emerald-600" />
                      <label className="text-[10px] font-bold text-slate-500 uppercase cursor-pointer">Tax Audit Statements Required</label>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 6: Documentation Requirements */}
              {publishStep === 6 && (
                <div className="space-y-3">
                  <span className="font-bold text-slate-800 block border-b pb-1 text-[11px] uppercase tracking-wider">📁 Required Documents Checklist</span>
                  <p className="text-[9px] text-slate-400 block mb-2">Define dossier guidelines for matching businesses.</p>

                  <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                    {Object.keys(docRequirements).map((doc) => (
                      <div key={doc} className="flex justify-between items-center p-2.5 bg-slate-50 border border-slate-150 rounded-lg text-xs gap-3">
                        <strong className="text-slate-800 font-bold text-[10.5px] truncate">{doc}</strong>
                        
                        <div className="flex gap-2 shrink-0">
                          {['Required', 'Optional', 'N/A'].map((lvl) => (
                            <button
                              key={lvl}
                              type="button"
                              onClick={() => setDocRequirements(prev => ({ ...prev, [doc]: lvl as any }))}
                              className={`px-2.5 py-0.5 rounded text-[9px] font-extrabold uppercase border transition ${
                                docRequirements[doc] === lvl
                                  ? 'bg-slate-800 text-white border-slate-900'
                                  : 'bg-white text-slate-450 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {lvl}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 7: Readiness Requirements */}
              {publishStep === 7 && (
                <div className="space-y-3.5">
                  <span className="font-bold text-slate-800 block border-b pb-1 text-[11px] uppercase tracking-wider">🛡️ Platforms Verification Criteria</span>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase block">Financial Records history</label>
                      <select value={readinessMinRecords} onChange={e => setReadinessMinRecords(e.target.value)} className="w-full border border-slate-250 bg-white rounded-lg p-2.5 text-xs focus:outline-none">
                        <option value="None">No minimum duration</option>
                        <option value="3 months">At least 3 months</option>
                        <option value="6 months">At least 6 months</option>
                        <option value="12 months">At least 12 months</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase block">Digital Transaction Volume</label>
                      <select value={readinessMinDigitalActivity} onChange={e => setReadinessMinDigitalActivity(e.target.value)} className="w-full border border-slate-250 bg-white rounded-lg p-2.5 text-xs focus:outline-none">
                        <option value="None">No minimum activity</option>
                        <option value="3 months">Active for 3 months</option>
                        <option value="6 months">Active for 6 months</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <label className="text-slate-650 font-bold uppercase text-[9.5px]">Detailed Business Plan dossier?</label>
                      <input type="checkbox" checked={readinessPlanReq} onChange={e => setReadinessPlanReq(e.target.checked)} className="rounded border-slate-300 text-emerald-600" />
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <label className="text-slate-650 font-bold uppercase text-[9.5px]">Verified Tax Compliance status?</label>
                      <input type="checkbox" checked={readinessTaxCompliance} onChange={e => setReadinessTaxCompliance(e.target.checked)} className="rounded border-slate-300 text-emerald-600" />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 8: Application Process Definition */}
              {publishStep === 8 && (
                <div className="space-y-3.5">
                  <span className="font-bold text-slate-800 block border-b pb-1 text-[11px] uppercase tracking-wider">🤝 Submission Workspace Workflow</span>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">Primary application method</label>
                    <select value={appMethod} onChange={e => setAppMethod(e.target.value)} className="w-full border border-slate-250 bg-white rounded-lg p-2.5 text-xs focus:outline-none font-bold">
                      <option value="Apply directly through Elevata">Apply directly through Elevata API Engine</option>
                      <option value="External application link">External Funding Portal Link</option>
                      <option value="Contact institution">Contact Credit Officer</option>
                      <option value="Visit branch">Visit Local Bank Branch</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">Configured milestones workflow</label>
                    <div className="space-y-1.5">
                      {appSteps.map((stepTxt, idx) => (
                        <div key={idx} className="flex items-center gap-2.5 p-2 bg-slate-50 border border-slate-150 rounded text-xs font-mono">
                          <span className="text-emerald-600">✓</span>
                          <span>{stepTxt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 9: AI Matching Configuration Weights */}
              {publishStep === 9 && (
                <div className="space-y-3">
                  <span className="font-bold text-slate-800 block border-b pb-1 text-[11px] uppercase tracking-wider">⚙️ AI Underwriting Weights</span>
                  <p className="text-[9px] text-slate-400 block mb-2">Adjust significance weights to optimize continuous background matches.</p>

                  <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                    {Object.keys(weights).map((factor) => (
                      <div key={factor} className="flex justify-between items-center p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs gap-3">
                        <span className="font-bold text-slate-800">{factor}</span>
                        
                        <div className="flex gap-1.5 shrink-0">
                          {['Required', 'Important', 'Preferred'].map((wLvl) => (
                            <button
                              key={wLvl}
                              type="button"
                              onClick={() => setWeights(prev => ({ ...prev, [factor]: wLvl as any }))}
                              className={`px-2 py-0.5 rounded text-[8.5px] font-bold border transition ${
                                weights[factor] === wLvl
                                  ? 'bg-emerald-600 text-white border-emerald-700'
                                  : 'bg-white text-slate-450 border-slate-250 hover:bg-slate-100'
                              }`}
                            >
                              {wLvl}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 10: AI Match Preview & Suitability Simulator */}
              {publishStep === 10 && (
                <div className="space-y-4">
                  {matchingAnimation ? (
                    <div className="text-center py-12 space-y-4">
                      <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mx-auto" />
                      <div className="space-y-1">
                        <strong className="text-xs font-bold text-slate-800 block font-heading">Matching active SME dossiers...</strong>
                        <span className="text-[10px] text-slate-450 block">Evaluating credit risk indices &amp; bookkeeping history</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-100 p-2.5 rounded-lg text-[10.5px] text-emerald-800 leading-snug">
                        <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>AI Match engine analyzed all active databases. Find suitability preview dossiers below:</span>
                      </div>

                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                        {simulatedMatches.map((match, idx) => (
                          <div key={idx} className="p-3.5 border border-slate-200 rounded-xl space-y-3 bg-slate-50/50">
                            <div className="flex justify-between items-center border-b pb-2 border-slate-150">
                              <div>
                                <strong className="text-slate-850 font-extrabold text-[11px] block">{match.name}</strong>
                                <span className="text-[9px] text-slate-400 block">{match.sector} sector</span>
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] font-bold text-emerald-600 font-mono block">{match.matchPercent}% Match</span>
                                <span className={`text-[8.5px] font-bold uppercase ${
                                  match.status === 'Highly Qualified' ? 'text-emerald-700' : match.status.includes('Minor') ? 'text-amber-600' : 'text-rose-600'
                                }`}>{match.status}</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[9.5px]">
                              {match.checks.map((chk, i) => (
                                <div key={i} className="flex items-center gap-1 text-slate-650">
                                  <span>{chk.pass ? '✅' : '❌'}</span>
                                  <span className={chk.pass ? 'text-slate-700 font-medium' : 'text-rose-600 font-bold'}>{chk.label}</span>
                                </div>
                              ))}
                            </div>

                            <div className="pt-2 border-t border-slate-150 flex flex-col gap-1 text-[9.5px]">
                              <div>
                                <span className="text-gray-400 block">Missing: <strong className="text-slate-800 font-bold font-mono">{match.missing.join(', ') || 'None'}</strong></span>
                              </div>
                              <div>
                                <span className="text-gray-400 block">Action recommendation: <strong className="text-emerald-600 font-bold">{match.action}</strong></span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Footer Buttons */}
            <div className="px-5 py-4 bg-slate-50 border-t border-slate-150 flex justify-between items-center shrink-0">
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
                onClick={publishStep === 10 ? handlePublishSubmit : handleNextStep}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition border-none"
              >
                {publishStep === 10 ? 'Publish Opportunity' : 'Next Step'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE TRAINING MODAL */}
      {isTrainingModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <form onSubmit={handleTrainingSubmit} className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-slate-955 font-heading">Schedule Virtual Capacity Session</h3>
                <p className="text-[10px] text-slate-450 mt-0.5 font-mono">Addressing SME eligibility matching gaps</p>
              </div>
              <button
                type="button"
                onClick={() => setIsTrainingModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Training Title</label>
                <input
                  type="text"
                  placeholder="e.g. Masterclass: Preparing Tax Clearance & Financials"
                  value={trTitle}
                  onChange={e => setTrTitle(e.target.value)}
                  className="w-full border border-slate-250 rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Speaker / Host</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Agnes Kalibata"
                  value={trSpeaker}
                  onChange={e => setTrSpeaker(e.target.value)}
                  className="w-full border border-slate-250 rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Date</label>
                  <input
                    type="date"
                    value={trDate}
                    onChange={e => setTrDate(e.target.value)}
                    className="w-full border border-slate-250 rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none font-mono"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Time</label>
                  <input
                    type="text"
                    value={trTime}
                    onChange={e => setTrTime(e.target.value)}
                    className="w-full border border-slate-250 rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Meeting Link</label>
                <input
                  type="text"
                  value={trLink}
                  onChange={e => setTrLink(e.target.value)}
                  className="w-full border border-slate-250 rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Description Abstract</label>
                <textarea
                  placeholder="Describe workshop goals..."
                  rows={3}
                  value={trDescription}
                  onChange={e => setTrDescription(e.target.value)}
                  className="w-full border border-slate-250 rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none leading-relaxed"
                  required
                />
              </div>
            </div>

            <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsTrainingModalOpen(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition border-none"
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
