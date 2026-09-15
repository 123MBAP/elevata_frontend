import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Landmark,
  Gift,
  Smartphone,
  TrendingUp,
  Layers,
  ShieldCheck,
  FileText,
  Sliders,
  CheckCircle,
  Sparkles,
  Check,
  X,
  AlertCircle,
  Wand2,
  Bold,
  Italic,
  Heading3,
  List,
  Quote,
  RefreshCw
} from 'lucide-react';
import FormattedText from './ui/FormattedText';
import { OpportunityType } from './SelectOpportunityTypeModal';

interface PublishOpportunityFormProps {
  oppType: OpportunityType;
  oppCategory: string;
  onCancel: () => void;
  onPublish: (data: any) => void;
  onChangeType: () => void;
  availableCategories: { id: string; businessType: string }[];
  simulatedCandidates: {
    name: string;
    sector: string;
    matchPercent: number;
    status: string;
    checks: { label: string; pass: boolean }[];
    missing: string[];
    readiness: string;
    action: string;
  }[];
  formatRWF: (amount: number) => string;
}

export default function PublishOpportunityForm({
  oppType,
  oppCategory,
  onCancel,
  onPublish,
  onChangeType,
  availableCategories,
  simulatedCandidates,
  formatRWF
}: PublishOpportunityFormProps) {
  // Navigation active tab for quick anchor jumps
  const [activeTab, setActiveTab] = useState<'basic' | 'product' | 'financial' | 'docs' | 'matching'>('basic');

  // Section 1: Basic Info
  const [oppName, setOppName] = useState('');
  const [oppProvider, setOppProvider] = useState('Elevata Underwriting Corp');
  const [oppStage, setOppStage] = useState('Growth');
  const [oppDeadline, setOppDeadline] = useState('2026-10-31');
  const [oppSectors, setOppSectors] = useState<string[]>(['Agriculture', 'Retail Shop']);
  const [oppDesc, setOppDesc] = useState('');
  const [descViewMode, setDescViewMode] = useState<'write' | 'preview'>('write');
  const descRef = useRef<HTMLTextAreaElement>(null);

  // Section 2: Product Specific Details
  // Debt / Loan
  const [loanType, setLoanType] = useState('Working Capital');
  const [loanPurpose, setLoanPurpose] = useState('Working Capital & Inventory Growth');
  const [loanMinAmt, setLoanMinAmt] = useState('1000000');
  const [loanMaxAmt, setLoanMaxAmt] = useState('25000000');
  const [loanRate, setLoanRate] = useState('8.5');
  const [loanTerm, setLoanTerm] = useState('24');
  const [loanGrace, setLoanGrace] = useState('3');
  const [loanCollateralReq, setLoanCollateralReq] = useState(false);
  const [loanCollateralType, setLoanCollateralType] = useState('Asset Registration');

  // Grant
  const [grantAmt, setGrantAmt] = useState('15000000');
  const [grantDuration, setGrantDuration] = useState('12');
  const [grantImpact, setGrantImpact] = useState('Employment Creation & Green Technology');
  const [grantCoFundingReq, setGrantCoFundingReq] = useState(false);
  const [grantCoFundingPct, setGrantCoFundingPct] = useState('20');

  // Fintech
  const [fintechType, setFintechType] = useState('POS Payments');
  const [fintechFee, setFintechFee] = useState('15000');
  const [fintechTxFee, setFintechTxFee] = useState('1.5%');

  // Equity
  const [equityStake, setEquityStake] = useState('15%');
  const [equityValuation, setEquityValuation] = useState('100000000');

  // Agri
  const [agriSeasonCycle, setAgriSeasonCycle] = useState('Season A & B (6 Months)');
  const [agriCropFocus, setAgriCropFocus] = useState('Coffee, Tea, Maize & Horticulture');
  const [agriGracePeriod, setAgriGracePeriod] = useState('Post-Harvest (4 Months)');

  // Guarantee
  const [guaranteeCoverage, setGuaranteeCoverage] = useState('75');
  const [guaranteeMaxLoss, setGuaranteeMaxLoss] = useState('50000000');
  const [guaranteeInstitution, setGuaranteeInstitution] = useState('BDF / Elevata Risk Pool');

  // Section 3: Financial Rules & Eligibility
  const [finMinMonthlyRev, setFinMinMonthlyRev] = useState(2000000);
  const [finMinAnnualRev, setFinMinAnnualRev] = useState(24000000);
  const [eligMinAge, setEligMinAge] = useState(1);
  const [eligMinEmployees, setEligMinEmployees] = useState(3);
  const [eligLocations, setEligLocations] = useState<string[]>(['Kigali', 'Northern Province']);
  const [finMinReadiness, setFinMinReadiness] = useState(65);
  const [finMinHealth, setFinMinHealth] = useState(60);
  const [finMaxDebtToRevenue, setFinMaxDebtToRevenue] = useState(35);
  const [finStatementsReq, setFinStatementsReq] = useState(true);
  const [eligSoleProp, setEligSoleProp] = useState(true);
  const [eligCompany, setEligCompany] = useState(true);
  const [eligCooperative, setEligCooperative] = useState(true);
  const [eligStartup, setEligStartup] = useState(true);

  // Section 4: Required Documents Dossier
  const [docRequirements, setDocRequirements] = useState<Record<string, 'Required' | 'Optional' | 'N/A'>>({
    'Business Registration Certificate': 'Required',
    'National ID / Passport': 'Required',
    'RRA Tax Clearance Certificate': 'Required',
    'Bank Statements (Last 6 Months)': 'Required',
    'Audited Financial Statements': 'Optional',
    'Business Plan & Projections': 'Optional',
    'Cash Flow Forecast': 'Optional',
    'Collateral Valuation Documents': 'N/A'
  });

  // Section 5: Platform Verification & Submission
  const [readinessMinRecords, setReadinessMinRecords] = useState('6 months');
  const [readinessMinDigitalActivity, setReadinessMinDigitalActivity] = useState('3 months');
  const [readinessPlanReq, setReadinessPlanReq] = useState(true);
  const [readinessTaxCompliance, setReadinessTaxCompliance] = useState(true);
  const [appMethod, setAppMethod] = useState('Apply directly through Elevata');
  const appSteps = [
    '1. Check eligibility profile & AI suitability score',
    '2. Complete online application dossier',
    '3. Upload verified documentation files',
    '4. Automated algorithmic underwriting verification',
    '5. Bank credit officer interview & fund disbursement'
  ];

  // AI Matching factor weights
  const [weights, setWeights] = useState<Record<string, 'Required' | 'Important' | 'Preferred'>>({
    'Business Sector Match': 'Required',
    'Operating District & Province': 'Important',
    'Revenue & Turnover Limits': 'Required',
    'Operating Age (History)': 'Preferred',
    'Financial Health Score': 'Required',
    'Loan Readiness Score': 'Required',
    'Required Documentation Dossier': 'Important',
    'Growth Stage': 'Preferred'
  });

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  // Pre-populate description template
  useEffect(() => {
    if (!oppDesc) {
      const typeLabel =
        oppType === 'loan'
          ? 'Credit & Working Capital'
          : oppType === 'grant'
          ? 'Non-Dilutive Grant'
          : oppType === 'fintech'
          ? 'Fintech & Payment Solution'
          : oppType === 'equity'
          ? 'Equity Growth Capital'
          : oppType === 'agricultural_loan'
          ? 'Agricultural Value-Chain'
          : 'Credit Guarantee';

      setOppDesc(
        `## Program Overview\nComprehensive ${typeLabel} facility designed to provide accessible growth financing to qualifying enterprises across target sectors in Rwanda.\n\n### Key Highlights & Benefits\n• Subsidized fixed annual interest rate and transparent repayment terms\n• Expedited approval decision within 48 to 72 business hours\n• Dedicated credit advisory and capacity building support\n\n### Targeted Use of Funds\n1. Working capital & inventory expansion\n2. Equipment acquisition & technology upgrades\n3. Market distribution and scaling operations\n\n> Note: All eligible businesses must maintain active bookkeeping records on Elevata.`
      );
    }
  }, [oppType]);

  // Rich text formatting helpers
  const insertFormatting = (prefix: string, suffix: string = '', defaultText: string = '') => {
    if (!descRef.current) {
      setOppDesc(prev => (prev ? prev + '\n' : '') + prefix + defaultText + suffix);
      return;
    }
    const textarea = descRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = oppDesc.substring(start, end) || defaultText;
    const replacement = prefix + selected + suffix;
    const newText = oppDesc.substring(0, start) + replacement + oppDesc.substring(end);
    setOppDesc(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 15);
  };

  const insertTemplate = () => {
    const template = `## Program Overview\nComprehensive financing facility designed to provide accessible growth capital to qualifying enterprises across priority sectors.\n\n### Key Highlights & Terms\n• Subsidized fixed annual interest rate with transparent fee structure\n• Expedited underwriting approval decision within 48 to 72 business hours\n• Dedicated credit advisory and capacity building support\n\n### Targeted Use of Funds\n1. Working capital & inventory expansion\n2. Equipment acquisition & technology upgrades\n3. Market distribution and scaling operations\n\n> Note: All eligible SMEs must maintain active digital bookkeeping records on Elevata.`;
    setOppDesc(template);
  };

  // Submit Handler
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!oppName.trim()) newErrors.oppName = 'Opportunity Title is required';
    if (!oppProvider.trim()) newErrors.oppProvider = 'Provider / Institution is required';

    if (oppType === 'loan' || oppType === 'agricultural_loan') {
      if (!loanMaxAmt) newErrors.loanMaxAmt = 'Maximum funding amount is required';
      if (!loanRate) newErrors.loanRate = 'Interest rate is required';
      if (!loanTerm) newErrors.loanTerm = 'Loan term is required';
    } else if (oppType === 'grant') {
      if (!grantAmt) newErrors.grantAmt = 'Grant funding amount is required';
      if (!grantDuration) newErrors.grantDuration = 'Grant duration is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    let fundingVal = 'Flexible';
    if (oppType === 'loan' || oppType === 'agricultural_loan' || oppType === 'guarantee') {
      fundingVal = formatRWF(parseInt(loanMaxAmt) || 0);
    } else if (oppType === 'grant') {
      fundingVal = formatRWF(parseInt(grantAmt) || 0);
    } else if (oppType === 'equity') {
      fundingVal = formatRWF(parseInt(loanMaxAmt) || 0);
    }

    const docsList = Object.keys(docRequirements).filter(doc => docRequirements[doc] === 'Required');
    const finalTitle = oppName.trim();
    const finalInstitution = oppProvider.trim();
    const finalDeadline = oppDeadline || '2026-10-31';
    const finalSectors = oppSectors && oppSectors.length > 0 ? oppSectors : ['All Sectors'];

    onPublish({
      title: finalTitle,
      institution: finalInstitution,
      category: oppCategory,
      description: oppDesc || `${oppCategory} opportunity targeting growing local enterprises.`,
      benefits:
        oppType === 'loan' || oppType === 'agricultural_loan'
          ? `${loanRate || '8.5'}% Annual Interest, ${loanTerm || '24'} months term, grace period of ${loanGrace || '3'} months.`
          : oppType === 'grant'
          ? `100% equity-free funding. Expected impact: ${grantImpact}`
          : oppType === 'agri'
          ? `Tailored seasonal repayment (${agriSeasonCycle}), ${agriCropFocus}`
          : 'Automated terms, digital disbursement, and capacity scaling benefits.',
      deadline: finalDeadline,
      maxFunding: fundingVal,
      sectors: finalSectors,
      minAge: eligMinAge,
      minRevenue: finMinAnnualRev,
      minHealthScore: finMinHealth,
      minReadinessScore: finMinReadiness,
      registrationRequired: eligSoleProp || eligCompany,
      taxCompliance: readinessTaxCompliance,
      collateralRequired: loanCollateralReq,
      requiredDocs: docsList,
      minMonthlyRevenue: finMinMonthlyRev,
      loanRate: parseFloat(loanRate) || 8.5,
      loanTerm: parseInt(loanTerm) || 24,
      loanGrace: parseInt(loanGrace) || 3,
      appMethod: appMethod
    });
  };

  const getTypeMeta = () => {
    switch (oppType) {
      case 'grant':
        return {
          title: 'Grant & Non-Dilutive Subsidy',
          badge: '100% Equity Free',
          badgeColor: 'bg-[#057642]/10 text-[#057642] border-[#057642]/20',
          icon: <Gift className="w-4 h-4 text-[#057642]" />
        };
      case 'fintech':
        return {
          title: 'Fintech & Digital Rails',
          badge: 'Merchant Solutions',
          badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          icon: <Smartphone className="w-4 h-4 text-indigo-600" />
        };
      case 'equity':
        return {
          title: 'Equity & Venture Capital',
          badge: 'Growth Capital',
          badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
          icon: <TrendingUp className="w-4 h-4 text-purple-600" />
        };
      case 'agricultural_loan':
        return {
          title: 'Agri & Value-Chain Facility',
          badge: 'Seasonal / Crop',
          badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          icon: <Layers className="w-4 h-4 text-emerald-700" />
        };
      case 'guarantee':
        return {
          title: 'Credit Guarantee & Insurance',
          badge: 'Risk Mitigation',
          badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
          icon: <ShieldCheck className="w-4 h-4 text-amber-700" />
        };
      case 'loan':
      default:
        return {
          title: 'Loan & Credit Facility',
          badge: 'Debt Financing',
          badgeColor: 'bg-[#0a66c2]/10 text-[#0a66c2] border-[#0a66c2]/20',
          icon: <Landmark className="w-4 h-4 text-[#0a66c2]" />
        };
    }
  };

  const typeMeta = getTypeMeta();

  return (
    <div className="space-y-6 bg-[#f3f2f0] min-h-screen p-4 sm:p-6 pb-28 font-sans animate-in fade-in duration-150">
      
      {/* Top Header & Breadcrumb Bar */}
      <div className="bg-white border border-[#e0e0e0] rounded-[10px] p-5 sm:p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-2 text-xs font-semibold text-[#5e5e5e] hover:text-[#181818] mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Opportunities Dashboard</span>
          </button>
          
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-[#181818] font-heading">
              Publish New Opportunity
            </h1>
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${typeMeta.badgeColor}`}>
              {typeMeta.icon}
              {typeMeta.badge}
            </span>
          </div>
          <p className="text-[13px] text-[#5e5e5e] mt-1 font-sans">
            Complete the single-page specification below to publish directly to matching SME businesses across Rwanda.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onChangeType}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#666666] bg-white hover:bg-[#f3f2f0] text-xs font-semibold text-[#181818] transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#5e5e5e]" />
            <span>Change Type ({typeMeta.title})</span>
          </button>

          <button
            type="button"
            onClick={() => handleSubmit()}
            className="flex items-center justify-center space-x-1.5 px-6 py-2 rounded-full bg-[#0a66c2] hover:bg-[#004182] text-white text-xs font-bold transition-colors shadow-xs border-none"
          >
            <Sparkles className="w-4 h-4" />
            <span>Publish Opportunity</span>
          </button>
        </div>
      </div>

      {/* Quick Jump Sticky Navigation Tabs */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-xs border border-[#e0e0e0] rounded-[10px] p-1.5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-wrap gap-1">
        {[
          { id: 'basic', label: '1. Basic Info', num: '01' },
          { id: 'product', label: '2. Product Details', num: '02' },
          { id: 'financial', label: '3. Financial & Eligibility Rules', num: '03' },
          { id: 'docs', label: '4. Required Documents Dossier', num: '04' },
          { id: 'matching', label: '5. Application Workflow', num: '05' }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveTab(tab.id as any);
              const el = document.getElementById(`section-${tab.id}`);
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className={`px-3.5 py-2 rounded-[6px] text-xs font-semibold transition-colors flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-[#0a66c2] text-white shadow-xs'
                : 'text-[#5e5e5e] hover:text-[#181818] hover:bg-[#f3f2f0]'
            }`}
          >
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ==================================================================== */}
      {/* SECTION 1: BASIC INFORMATION (RELAXED SINGLE-ROW INPUT LAYOUT) */}
      {/* ==================================================================== */}
      <div id="section-basic" className="bg-white border border-[#e0e0e0] rounded-[10px] p-6 sm:p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-6">
        <div className="border-b border-[#e0e0e0] pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-[#0a66c2]/10 text-[#0a66c2] text-xs font-bold flex items-center justify-center font-mono">
              1
            </span>
            <h3 className="text-sm font-bold text-[#181818] font-heading uppercase tracking-wider">
              Basic Information &amp; Overview
            </h3>
          </div>
          <span className="text-[11px] text-[#5e5e5e] font-sans">Every field on its own dedicated row</span>
        </div>

        <div className="space-y-5">
          {/* Row 1: Opportunity Title */}
          <div className="w-full max-w-3xl">
            <label className="mb-1.5 block text-[13px] font-semibold text-[#181818]">
              Opportunity Title / Program Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={oppName}
              onChange={e => {
                setOppName(e.target.value);
                clearError('oppName');
              }}
              placeholder="e.g. Agri-SME Working Capital & Inventory Growth Facility"
              className={`h-11 w-full rounded-[6px] border bg-white px-3.5 text-[14px] text-[#181818] outline-none transition-colors ${
                errors.oppName
                  ? 'border-red-500 bg-red-50/20 focus:border-red-600 focus:ring-1 focus:ring-red-600'
                  : 'border-[#666666] focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]'
              }`}
            />
            {errors.oppName && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {errors.oppName}
              </p>
            )}
          </div>

          {/* Row 2: Provider */}
          <div className="w-full max-w-xl">
            <label className="mb-1.5 block text-[13px] font-semibold text-[#181818]">
              Offering Financial Institution / Provider <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={oppProvider}
              onChange={e => {
                setOppProvider(e.target.value);
                clearError('oppProvider');
              }}
              className="h-11 w-full rounded-[6px] border border-[#666666] bg-white px-3.5 text-[14px] text-[#181818] outline-none focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
            />
          </div>

          {/* Row 3: Category Classification */}
          <div className="w-full max-w-md">
            <label className="mb-1.5 block text-[13px] font-semibold text-[#181818]">
              Category Classification
            </label>
            <input
              type="text"
              readOnly
              value={oppCategory}
              className="h-11 w-full rounded-[6px] border border-[#e0e0e0] bg-[#f3f2f0]/60 px-3.5 text-[14px] text-[#5e5e5e] font-semibold cursor-not-allowed outline-none"
            />
          </div>

          {/* Row 4: Target Business Stage */}
          <div className="w-full max-w-md">
            <label className="mb-1.5 block text-[13px] font-semibold text-[#181818]">
              Target Business Stage
            </label>
            <select
              value={oppStage}
              onChange={e => setOppStage(e.target.value)}
              className="h-11 w-full rounded-[6px] border border-[#666666] bg-white px-3.5 text-[14px] text-[#181818] outline-none focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
            >
              <option value="Early Stage">Early Stage (0 - 2 Years)</option>
              <option value="Growth">Growth &amp; Expansion Stage</option>
              <option value="Established">Mature / Established Entity</option>
              <option value="All Stages">All Stages</option>
            </select>
          </div>

          {/* Row 5: Application Deadline */}
          <div className="w-full max-w-xs">
            <label className="mb-1.5 block text-[13px] font-semibold text-[#181818]">
              Application Deadline
            </label>
            <input
              type="date"
              value={oppDeadline}
              onChange={e => setOppDeadline(e.target.value)}
              className="h-11 w-full rounded-[6px] border border-[#666666] bg-white px-3.5 text-[14px] font-mono text-[#181818] outline-none focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
            />
          </div>

          {/* Row 6: Target Sectors */}
          <div className="w-full max-w-3xl">
            <label className="mb-1.5 block text-[13px] font-semibold text-[#181818]">
              Eligible Target Sectors
            </label>
            <div className="flex flex-wrap gap-2 pt-1">
              {['Agriculture', 'Retail Shop', 'Wholesale', 'Manufacturing', 'ICT & Tech', 'Transport', 'Healthcare', 'Construction', 'Tourism & Hospitality'].map(sector => {
                const isSelected = oppSectors.includes(sector);
                return (
                  <button
                    key={sector}
                    type="button"
                    onClick={() => {
                      setOppSectors(prev =>
                        isSelected ? prev.filter(s => s !== sector) : [...prev, sector]
                      );
                    }}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition ${
                      isSelected
                        ? 'bg-[#0a66c2] text-white border-[#0a66c2]'
                        : 'bg-white text-[#5e5e5e] border-[#e0e0e0] hover:bg-[#f3f2f0]'
                    }`}
                  >
                    {sector}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 7: Program Description & Terms */}
          <div className="w-full max-w-3xl space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[13px] font-semibold text-[#181818]">
                Program Description &amp; Terms (Markdown Supported)
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setDescViewMode('write')}
                  className={`px-3 py-1 text-xs font-semibold rounded-[4px] ${
                    descViewMode === 'write' ? 'bg-[#0a66c2] text-white' : 'text-[#5e5e5e] hover:bg-[#f3f2f0]'
                  }`}
                >
                  Write
                </button>
                <button
                  type="button"
                  onClick={() => setDescViewMode('preview')}
                  className={`px-3 py-1 text-xs font-semibold rounded-[4px] ${
                    descViewMode === 'preview' ? 'bg-[#0a66c2] text-white' : 'text-[#5e5e5e] hover:bg-[#f3f2f0]'
                  }`}
                >
                  Preview
                </button>
              </div>
            </div>

            {descViewMode === 'write' ? (
              <div className="border border-[#666666] rounded-[6px] overflow-hidden focus-within:border-[#0a66c2] focus-within:ring-1 focus-within:ring-[#0a66c2] bg-white">
                <div className="bg-[#f3f2f0] border-b border-[#e0e0e0] px-3 py-2 flex flex-wrap items-center gap-1.5 text-xs">
                  <button type="button" onClick={() => insertFormatting('**', '**', 'bold text')} className="p-1.5 hover:bg-white rounded text-[#181818]" title="Bold"><Bold className="w-3.5 h-3.5" /></button>
                  <button type="button" onClick={() => insertFormatting('*', '*', 'italic text')} className="p-1.5 hover:bg-white rounded text-[#181818]" title="Italic"><Italic className="w-3.5 h-3.5" /></button>
                  <button type="button" onClick={() => insertFormatting('### ', '', 'Heading')} className="p-1.5 hover:bg-white rounded text-[#181818]" title="Heading"><Heading3 className="w-3.5 h-3.5" /></button>
                  <button type="button" onClick={() => insertFormatting('• ', '', 'List item')} className="p-1.5 hover:bg-white rounded text-[#181818]" title="Bullet List"><List className="w-3.5 h-3.5" /></button>
                  <button type="button" onClick={() => insertFormatting('> ', '', 'Important note')} className="p-1.5 hover:bg-white rounded text-[#181818]" title="Quote / Callout"><Quote className="w-3.5 h-3.5" /></button>
                  <div className="h-4 w-px bg-[#e0e0e0] mx-1" />
                  <button type="button" onClick={insertTemplate} className="text-[#0a66c2] font-semibold text-xs hover:underline flex items-center gap-1">
                    <Wand2 className="w-3.5 h-3.5" /> Auto-Fill Template
                  </button>
                </div>
                <textarea
                  ref={descRef}
                  rows={7}
                  value={oppDesc}
                  onChange={e => setOppDesc(e.target.value)}
                  className="w-full p-3.5 text-[13px] text-[#181818] outline-none font-sans resize-y leading-relaxed"
                  placeholder="Provide comprehensive program description..."
                />
              </div>
            ) : (
              <div className="border border-[#e0e0e0] rounded-[6px] p-5 bg-white min-h-[180px] text-xs leading-relaxed">
                {oppDesc ? (
                  <FormattedText text={oppDesc} className="text-[#181818] leading-relaxed" />
                ) : (
                  <span className="text-[#5e5e5e] italic">No description entered yet.</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* SECTION 2: PRODUCT SPECIFIC PARAMETERS (SINGLE-ROW INPUTS) */}
      {/* ==================================================================== */}
      <div id="section-product" className="bg-white border border-[#e0e0e0] rounded-[10px] p-6 sm:p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-6">
        <div className="border-b border-[#e0e0e0] pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-[#0a66c2]/10 text-[#0a66c2] text-xs font-bold flex items-center justify-center font-mono">
              2
            </span>
            <h3 className="text-sm font-bold text-[#181818] font-heading uppercase tracking-wider">
              Product Specific Parameters ({typeMeta.title})
            </h3>
          </div>
          <span className="text-[11px] text-[#0a66c2] font-semibold">Customized by chosen opportunity type</span>
        </div>

        {/* Loan Product Fields (Single-column relaxed stack) */}
        {oppType === 'loan' && (
          <div className="space-y-5">
            <div className="w-full max-w-md">
              <label className="mb-1.5 block text-[13px] font-semibold text-[#181818]">Loan Facility Type</label>
              <select
                value={loanType}
                onChange={e => setLoanType(e.target.value)}
                className="h-11 w-full rounded-[6px] border border-[#666666] bg-white px-3.5 text-[14px] text-[#181818] outline-none focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
              >
                <option value="Working Capital">Working Capital &amp; Inventory</option>
                <option value="Asset Financing">Machinery &amp; Equipment Financing</option>
                <option value="Invoice Discounting">Invoice Discounting &amp; Factoring</option>
                <option value="Trade Finance">Trade Finance &amp; L/C</option>
              </select>
            </div>

            <div className="w-full max-w-md">
              <label className="mb-1.5 block text-[13px] font-semibold text-[#181818]">Min Loan Amount (FRW)</label>
              <input
                type="number"
                value={loanMinAmt}
                onChange={e => setLoanMinAmt(e.target.value)}
                className="h-11 w-full rounded-[6px] border border-[#666666] bg-white px-3.5 text-[14px] font-mono text-[#181818] outline-none focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
              />
            </div>

            <div className="w-full max-w-md">
              <label className="mb-1.5 block text-[13px] font-semibold text-[#181818]">
                Max Loan Amount (FRW) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={loanMaxAmt}
                onChange={e => {
                  setLoanMaxAmt(e.target.value);
                  clearError('loanMaxAmt');
                }}
                className={`h-11 w-full rounded-[6px] border bg-white px-3.5 text-[14px] font-mono text-[#181818] outline-none transition-colors ${
                  errors.loanMaxAmt
                    ? 'border-red-500 bg-red-50/20 focus:border-red-600 focus:ring-1 focus:ring-red-600'
                    : 'border-[#666666] focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]'
                }`}
              />
              {errors.loanMaxAmt && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {errors.loanMaxAmt}
                </p>
              )}
            </div>

            <div className="w-full max-w-xs">
              <label className="mb-1.5 block text-[13px] font-semibold text-[#181818]">
                Annual Interest Rate (%) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                value={loanRate}
                onChange={e => setLoanRate(e.target.value)}
                className="h-11 w-full rounded-[6px] border border-[#666666] bg-white px-3.5 text-[14px] font-mono text-[#181818] outline-none focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
              />
            </div>

            <div className="w-full max-w-xs">
              <label className="mb-1.5 block text-[13px] font-semibold text-[#181818]">
                Repayment Term (Months) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={loanTerm}
                onChange={e => setLoanTerm(e.target.value)}
                className="h-11 w-full rounded-[6px] border border-[#666666] bg-white px-3.5 text-[14px] font-mono text-[#181818] outline-none focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
              />
            </div>

            <div className="w-full max-w-xs">
              <label className="mb-1.5 block text-[13px] font-semibold text-[#181818]">Grace Period (Months)</label>
              <input
                type="number"
                value={loanGrace}
                onChange={e => setLoanGrace(e.target.value)}
                className="h-11 w-full rounded-[6px] border border-[#666666] bg-white px-3.5 text-[14px] font-mono text-[#181818] outline-none focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
              />
            </div>

            <div className="w-full max-w-xl p-4 bg-[#f3f2f0]/60 border border-[#e0e0e0] rounded-[8px] flex items-center justify-between">
              <div>
                <strong className="text-[13px] text-[#181818] font-bold block">Collateral Security Required?</strong>
                <span className="text-xs text-[#5e5e5e] block">Check if tangible or registered collateral asset pledge is required</span>
              </div>
              <input
                type="checkbox"
                checked={loanCollateralReq}
                onChange={e => setLoanCollateralReq(e.target.checked)}
                className="rounded-[3px] accent-[#0a66c2] h-4 w-4 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Grant Product Fields */}
        {oppType === 'grant' && (
          <div className="space-y-5">
            <div className="w-full max-w-md">
              <label className="mb-1.5 block text-[13px] font-semibold text-[#181818]">
                Grant Amount (FRW) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={grantAmt}
                onChange={e => {
                  setGrantAmt(e.target.value);
                  clearError('grantAmt');
                }}
                className="h-11 w-full rounded-[6px] border border-[#666666] bg-white px-3.5 text-[14px] font-mono text-[#181818] outline-none focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
              />
            </div>

            <div className="w-full max-w-xs">
              <label className="mb-1.5 block text-[13px] font-semibold text-[#181818]">
                Grant Duration (Months) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={grantDuration}
                onChange={e => setGrantDuration(e.target.value)}
                className="h-11 w-full rounded-[6px] border border-[#666666] bg-white px-3.5 text-[14px] font-mono text-[#181818] outline-none focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
              />
            </div>

            <div className="w-full max-w-2xl">
              <label className="mb-1.5 block text-[13px] font-semibold text-[#181818]">Expected Socio-Economic Impact Goal</label>
              <input
                type="text"
                value={grantImpact}
                onChange={e => setGrantImpact(e.target.value)}
                placeholder="e.g. Job creation, female entrepreneurship empowerment, green technologies"
                className="h-11 w-full rounded-[6px] border border-[#666666] bg-white px-3.5 text-[14px] text-[#181818] outline-none focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
              />
            </div>

            <div className="w-full max-w-xl p-4 bg-[#f3f2f0]/60 border border-[#e0e0e0] rounded-[8px] flex items-center justify-between">
              <div>
                <strong className="text-[13px] text-[#181818] font-bold block">Co-funding / Matching Equity Required?</strong>
                <span className="text-xs text-[#5e5e5e] block">SME must provide matching cash contribution</span>
              </div>
              <input
                type="checkbox"
                checked={grantCoFundingReq}
                onChange={e => setGrantCoFundingReq(e.target.checked)}
                className="rounded-[3px] accent-[#0a66c2] h-4 w-4 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Fintech Product Fields */}
        {oppType === 'fintech' && (
          <div className="space-y-5">
            <div className="w-full max-w-md">
              <label className="mb-1.5 block text-[13px] font-semibold text-[#181818]">Digital Solution Type</label>
              <select
                value={fintechType}
                onChange={e => setFintechType(e.target.value)}
                className="h-11 w-full rounded-[6px] border border-[#666666] bg-white px-3.5 text-[14px] text-[#181818] outline-none focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
              >
                <option value="POS Payments">Smart POS Terminal</option>
                <option value="Mobile Banking SDK">Mobile Money QR &amp; SDK</option>
                <option value="Invoicing Integrations">Tax Invoicing &amp; EBM Bridge</option>
                <option value="Payment Gateway">E-Commerce Payment Gateway</option>
              </select>
            </div>

            <div className="w-full max-w-md">
              <label className="mb-1.5 block text-[13px] font-semibold text-[#181818]">Monthly Service Fee (FRW)</label>
              <input
                type="number"
                value={fintechFee}
                onChange={e => setFintechFee(e.target.value)}
                className="h-11 w-full rounded-[6px] border border-[#666666] bg-white px-3.5 text-[14px] font-mono text-[#181818] outline-none focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
              />
            </div>

            <div className="w-full max-w-xs">
              <label className="mb-1.5 block text-[13px] font-semibold text-[#181818]">Transaction MDR Rate</label>
              <input
                type="text"
                value={fintechTxFee}
                onChange={e => setFintechTxFee(e.target.value)}
                className="h-11 w-full rounded-[6px] border border-[#666666] bg-white px-3.5 text-[14px] font-mono text-[#181818] outline-none focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
              />
            </div>
          </div>
        )}

        {/* Equity / Venture Capital */}
        {oppType === 'equity' && (
          <div className="space-y-5">
            <div className="w-full max-w-xs">
              <label className="mb-1.5 block text-[13px] font-semibold text-[#181818]">Target Equity Stake (%)</label>
              <input
                type="text"
                value={equityStake}
                onChange={e => setEquityStake(e.target.value)}
                className="h-11 w-full rounded-[6px] border border-[#666666] bg-white px-3.5 text-[14px] font-mono text-[#181818] outline-none focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
              />
            </div>

            <div className="w-full max-w-md">
              <label className="mb-1.5 block text-[13px] font-semibold text-[#181818]">Target Valuation Cap (FRW)</label>
              <input
                type="number"
                value={equityValuation}
                onChange={e => setEquityValuation(e.target.value)}
                className="h-11 w-full rounded-[6px] border border-[#666666] bg-white px-3.5 text-[14px] font-mono text-[#181818] outline-none focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
              />
            </div>
          </div>
        )}

        {/* Agri / Value Chain */}
        {oppType === 'agricultural_loan' && (
          <div className="space-y-5">
            <div className="w-full max-w-md">
              <label className="mb-1.5 block text-[13px] font-semibold text-[#181818]">Season Cycle Period</label>
              <input
                type="text"
                value={agriSeasonCycle}
                onChange={e => setAgriSeasonCycle(e.target.value)}
                className="h-11 w-full rounded-[6px] border border-[#666666] bg-white px-3.5 text-[14px] text-[#181818] outline-none focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
              />
            </div>

            <div className="w-full max-w-md">
              <label className="mb-1.5 block text-[13px] font-semibold text-[#181818]">Grace &amp; Harvest Settlement</label>
              <input
                type="text"
                value={agriGracePeriod}
                onChange={e => setAgriGracePeriod(e.target.value)}
                className="h-11 w-full rounded-[6px] border border-[#666666] bg-white px-3.5 text-[14px] text-[#181818] outline-none focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
              />
            </div>

            <div className="w-full max-w-xl">
              <label className="mb-1.5 block text-[13px] font-semibold text-[#181818]">Priority Crop Value-Chains</label>
              <input
                type="text"
                value={agriCropFocus}
                onChange={e => setAgriCropFocus(e.target.value)}
                className="h-11 w-full rounded-[6px] border border-[#666666] bg-white px-3.5 text-[14px] text-[#181818] outline-none focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
              />
            </div>
          </div>
        )}

        {/* Credit Guarantee */}
        {oppType === 'guarantee' && (
          <div className="space-y-5">
            <div className="w-full max-w-xs">
              <label className="mb-1.5 block text-[13px] font-semibold text-[#181818]">Coverage Ratio (%)</label>
              <input
                type="number"
                value={guaranteeCoverage}
                onChange={e => setGuaranteeCoverage(e.target.value)}
                className="h-11 w-full rounded-[6px] border border-[#666666] bg-white px-3.5 text-[14px] font-mono text-[#181818] outline-none focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
              />
            </div>

            <div className="w-full max-w-md">
              <label className="mb-1.5 block text-[13px] font-semibold text-[#181818]">Max Loss Cap (FRW)</label>
              <input
                type="number"
                value={guaranteeMaxLoss}
                onChange={e => setGuaranteeMaxLoss(e.target.value)}
                className="h-11 w-full rounded-[6px] border border-[#666666] bg-white px-3.5 text-[14px] font-mono text-[#181818] outline-none focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
              />
            </div>

            <div className="w-full max-w-xl">
              <label className="mb-1.5 block text-[13px] font-semibold text-[#181818]">Backing Risk Pool</label>
              <input
                type="text"
                value={guaranteeInstitution}
                onChange={e => setGuaranteeInstitution(e.target.value)}
                className="h-11 w-full rounded-[6px] border border-[#666666] bg-white px-3.5 text-[14px] text-[#181818] outline-none focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
              />
            </div>
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* SECTION 3: FINANCIAL RULES & ELIGIBILITY (SINGLE-ROW INPUTS) */}
      {/* ==================================================================== */}
      <div id="section-financial" className="bg-white border border-[#e0e0e0] rounded-[10px] p-6 sm:p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-6">
        <div className="border-b border-[#e0e0e0] pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-[#0a66c2]/10 text-[#0a66c2] text-xs font-bold flex items-center justify-center font-mono">
              3
            </span>
            <h3 className="text-sm font-bold text-[#181818] font-heading uppercase tracking-wider">
              Financial Rules &amp; Eligibility Thresholds
            </h3>
          </div>
          <span className="text-[11px] text-[#5e5e5e]">Used by algorithmic matching engine</span>
        </div>

        <div className="space-y-5">
          {/* Row 1: Legal Structures */}
          <div className="w-full max-w-2xl">
            <label className="mb-2 block text-[13px] font-semibold text-[#181818]">
              Permitted Legal Structures
            </label>
            <div className="space-y-2">
              {[
                { label: 'Sole Proprietorship', val: eligSoleProp, set: setEligSoleProp },
                { label: 'Registered Company (Ltd)', val: eligCompany, set: setEligCompany },
                { label: 'Cooperative / SACCO', val: eligCooperative, set: setEligCooperative },
                { label: 'Tech Startup / Incubator', val: eligStartup, set: setEligStartup }
              ].map((typeItem, i) => (
                <label key={i} className="flex items-center gap-3 p-3 bg-white border border-[#e0e0e0] rounded-[6px] hover:border-[#0a66c2] cursor-pointer transition-colors">
                  <input type="checkbox" checked={typeItem.val} onChange={e => typeItem.set(e.target.checked)} className="rounded-[3px] accent-[#0a66c2] h-4 w-4" />
                  <span className="text-xs text-[#181818] font-semibold">{typeItem.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Row 2: Min Monthly Turnover */}
          <div className="w-full max-w-md">
            <label className="mb-1.5 block text-[13px] font-semibold text-[#181818]">Min Monthly Turnover (FRW)</label>
            <input
              type="number"
              value={finMinMonthlyRev}
              onChange={e => setFinMinMonthlyRev(parseInt(e.target.value) || 0)}
              className="h-11 w-full rounded-[6px] border border-[#666666] bg-white px-3.5 text-[14px] font-mono text-[#181818] outline-none focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
            />
          </div>

          {/* Row 3: Min Annual Turnover */}
          <div className="w-full max-w-md">
            <label className="mb-1.5 block text-[13px] font-semibold text-[#181818]">Min Annual Turnover (FRW)</label>
            <input
              type="number"
              value={finMinAnnualRev}
              onChange={e => setFinMinAnnualRev(parseInt(e.target.value) || 0)}
              className="h-11 w-full rounded-[6px] border border-[#666666] bg-white px-3.5 text-[14px] font-mono text-[#181818] outline-none focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
            />
          </div>

          {/* Row 4: Min Readiness Score */}
          <div className="w-full max-w-xs">
            <label className="mb-1.5 block text-[13px] font-semibold text-[#181818]">Min Loan Readiness Score (%)</label>
            <input
              type="number"
              max="100"
              value={finMinReadiness}
              onChange={e => setFinMinReadiness(parseInt(e.target.value) || 0)}
              className="h-11 w-full rounded-[6px] border border-[#666666] bg-white px-3.5 text-[14px] font-mono text-[#181818] outline-none focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
            />
          </div>

          {/* Row 5: Min Business Health Score */}
          <div className="w-full max-w-xs">
            <label className="mb-1.5 block text-[13px] font-semibold text-[#181818]">Min Business Health Score (%)</label>
            <input
              type="number"
              max="100"
              value={finMinHealth}
              onChange={e => setFinMinHealth(parseInt(e.target.value) || 0)}
              className="h-11 w-full rounded-[6px] border border-[#666666] bg-white px-3.5 text-[14px] font-mono text-[#181818] outline-none focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
            />
          </div>

          {/* Row 6: Min Operating Age */}
          <div className="w-full max-w-xs">
            <label className="mb-1.5 block text-[13px] font-semibold text-[#181818]">Min Operating Age (Years)</label>
            <input
              type="number"
              value={eligMinAge}
              onChange={e => setEligMinAge(parseInt(e.target.value) || 0)}
              className="h-11 w-full rounded-[6px] border border-[#666666] bg-white px-3.5 text-[14px] font-mono text-[#181818] outline-none focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
            />
          </div>

          {/* Row 7: Min Employee Count */}
          <div className="w-full max-w-xs">
            <label className="mb-1.5 block text-[13px] font-semibold text-[#181818]">Min Employee Count</label>
            <input
              type="number"
              value={eligMinEmployees}
              onChange={e => setEligMinEmployees(parseInt(e.target.value) || 0)}
              className="h-11 w-full rounded-[6px] border border-[#666666] bg-white px-3.5 text-[14px] font-mono text-[#181818] outline-none focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
            />
          </div>

          {/* Row 8: Max Debt-to-Revenue Ratio */}
          <div className="w-full max-w-xs">
            <label className="mb-1.5 block text-[13px] font-semibold text-[#181818]">Max Debt-to-Revenue Ratio (%)</label>
            <input
              type="number"
              value={finMaxDebtToRevenue}
              onChange={e => setFinMaxDebtToRevenue(parseInt(e.target.value) || 0)}
              className="h-11 w-full rounded-[6px] border border-[#666666] bg-white px-3.5 text-[14px] font-mono text-[#181818] outline-none focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
            />
          </div>

          {/* Row 9: Geographical Scope */}
          <div className="w-full max-w-3xl space-y-1.5">
            <label className="mb-1.5 block text-[13px] font-semibold text-[#181818]">Geographical Districts</label>
            <div className="flex flex-wrap gap-2 pt-1">
              {['Kigali', 'Nyarugenge', 'Gasabo', 'Kicukiro', 'Northern Province', 'Western Province', 'Eastern Province', 'Southern Province'].map(loc => {
                const exists = eligLocations.includes(loc);
                return (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => setEligLocations(prev => (exists ? prev.filter(x => x !== loc) : [...prev, loc]))}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition ${
                      exists ? 'bg-[#0a66c2]/10 border-[#0a66c2] text-[#0a66c2]' : 'bg-white border-[#e0e0e0] text-[#5e5e5e] hover:bg-[#f3f2f0]'
                    }`}
                  >
                    {loc}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* SECTION 4: REQUIRED DOCUMENTS DOSSIER (SINGLE-ROW ITEMS) */}
      {/* ==================================================================== */}
      <div id="section-docs" className="bg-white border border-[#e0e0e0] rounded-[10px] p-6 sm:p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-6">
        <div className="border-b border-[#e0e0e0] pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-[#0a66c2]/10 text-[#0a66c2] text-xs font-bold flex items-center justify-center font-mono">
              4
            </span>
            <h3 className="text-sm font-bold text-[#181818] font-heading uppercase tracking-wider">
              Required Documents Dossier Checklist
            </h3>
          </div>
          <span className="text-[11px] text-[#5e5e5e]">Each document on its own clean row</span>
        </div>

        <div className="w-full max-w-3xl space-y-2.5">
          {Object.keys(docRequirements).map((doc) => (
            <div key={doc} className="flex justify-between items-center p-3.5 bg-white border border-[#e0e0e0] rounded-[8px] text-xs gap-3 hover:border-[#0a66c2] transition-colors">
              <strong className="text-[#181818] font-bold text-xs truncate">{doc}</strong>
              <div className="flex gap-1.5 shrink-0">
                {['Required', 'Optional', 'N/A'].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setDocRequirements(prev => ({ ...prev, [doc]: lvl as any }))}
                    className={`px-3.5 py-1 rounded-full text-xs font-semibold border transition ${
                      docRequirements[doc] === lvl
                        ? 'bg-[#0a66c2] text-white border-[#0a66c2]'
                        : 'bg-white text-[#5e5e5e] border-[#e0e0e0] hover:bg-[#f3f2f0]'
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

      {/* ==================================================================== */}
      {/* SECTION 5: APPLICATION & SUBMISSION WORKFLOW */}
      {/* ==================================================================== */}
      <div id="section-matching" className="bg-white border border-[#e0e0e0] rounded-[10px] p-6 sm:p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-6">
        <div className="border-b border-[#e0e0e0] pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-[#0a66c2]/10 text-[#0a66c2] text-xs font-bold flex items-center justify-center font-mono">
              5
            </span>
            <h3 className="text-sm font-bold text-[#181818] font-heading uppercase tracking-wider">
              Application &amp; Submission Workflow
            </h3>
          </div>
          <span className="text-[11px] text-[#057642] font-bold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Direct Publishing
          </span>
        </div>

        <div className="space-y-6">
          {/* Channel */}
          <div className="w-full max-w-lg">
            <label className="mb-1.5 block text-[13px] font-semibold text-[#181818]">Primary Application Channel</label>
            <select
              value={appMethod}
              onChange={e => setAppMethod(e.target.value)}
              className="h-11 w-full rounded-[6px] border border-[#666666] bg-white px-3.5 text-[14px] font-semibold text-[#181818] outline-none focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
            >
              <option value="Apply directly through Elevata">Apply directly through Elevata Engine (Instant)</option>
              <option value="External application link">External Partner Portal Link</option>
              <option value="Contact institution">Contact Direct Credit Officer</option>
              <option value="Visit branch">Visit Local Bank Branch</option>
            </select>
          </div>

          {/* Milestones Workflow */}
          <div className="w-full max-w-2xl space-y-2">
            <label className="mb-1.5 block text-[13px] font-semibold text-[#181818]">Configured Milestone Pipeline</label>
            <div className="space-y-2">
              {appSteps.map((stepTxt, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-[#f3f2f0]/60 border border-[#e0e0e0] rounded-[6px] text-xs font-mono">
                  <Check className="w-4 h-4 text-[#057642] shrink-0 stroke-[3]" />
                  <span className="text-[#181818] font-semibold">{stepTxt}</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Underwriting Factor Weights */}
          <div className="w-full max-w-2xl space-y-2.5">
            <label className="block text-[13px] font-semibold text-[#181818]">AI Underwriting Factor Significance</label>
            <div className="space-y-2">
              {Object.keys(weights).map((factor) => (
                <div key={factor} className="flex justify-between items-center p-3 bg-white border border-[#e0e0e0] rounded-[6px] text-xs">
                  <span className="font-bold text-[#181818] text-xs">{factor}</span>
                  <div className="flex gap-1.5 shrink-0">
                    {['Required', 'Important', 'Preferred'].map((wLvl) => (
                      <button
                        key={wLvl}
                        type="button"
                        onClick={() => setWeights(prev => ({ ...prev, [factor]: wLvl as any }))}
                        className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${
                          weights[factor] === wLvl
                            ? 'bg-[#0a66c2] text-white border-[#0a66c2]'
                            : 'bg-white text-[#5e5e5e] border-[#e0e0e0] hover:bg-[#f3f2f0]'
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

          {/* Centered In-Form Submit Action */}
          <div className="pt-8 pb-4 flex flex-col items-center justify-center border-t border-[#e0e0e0] gap-2.5">
            <button
              type="button"
              onClick={() => handleSubmit()}
              className="flex h-12 items-center justify-center gap-2 rounded-full bg-[#0a66c2] hover:bg-[#004182] px-12 text-[15px] font-bold text-white transition-all shadow-md hover:shadow-lg border-none cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Publish Opportunity</span>
            </button>
            <p className="text-xs text-[#5e5e5e] font-sans">
              Matching SME businesses will immediately qualify upon publishing.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Sticky Action Bar with Centered Submit */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-[#e0e0e0] px-6 py-4 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button
            type="button"
            onClick={onCancel}
            className="flex h-11 items-center justify-center rounded-full border border-[#666666] bg-white px-6 text-[13px] font-semibold text-[#181818] transition-colors hover:bg-[#f3f2f0]"
          >
            ← Cancel &amp; Return
          </button>

          {/* Centered Submit Button */}
          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={() => handleSubmit()}
              className="flex h-11 items-center justify-center gap-2 rounded-full bg-[#0a66c2] hover:bg-[#004182] px-10 text-[14px] font-bold text-white transition-all shadow-sm hover:shadow-md border-none cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Publish Opportunity</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onChangeType}
            className="flex h-11 items-center justify-center rounded-full border border-[#e0e0e0] bg-white px-5 text-[13px] font-semibold text-[#5e5e5e] transition-colors hover:bg-[#f3f2f0] hover:text-[#181818]"
          >
            Change Type
          </button>
        </div>
      </div>

    </div>
  );
}
