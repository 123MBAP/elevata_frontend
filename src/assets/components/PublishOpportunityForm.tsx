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
  RefreshCw,
  ChevronDown
} from 'lucide-react';
import FormattedText from './ui/FormattedText';
import { OpportunityType } from './SelectOpportunityTypeModal';

interface PublishOpportunityFormProps {
  oppType: OpportunityType;
  oppCategory: string;
  onCancel: () => void;
  onPublish: (data: any) => Promise<void>;
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

  const [docFormats, setDocFormats] = useState<Record<string, string[]>>({
    'Business Registration Certificate': ['PDF (.pdf)', 'Images (.png, .jpg, .jpeg)'],
    'National ID / Passport': ['PDF (.pdf)', 'Images (.png, .jpg, .jpeg)'],
    'RRA Tax Clearance Certificate': ['PDF (.pdf)'],
    'Bank Statements (Last 6 Months)': ['PDF (.pdf)', 'Excel (.xlsx, .csv)'],
    'Audited Financial Statements': ['PDF (.pdf)', 'Excel (.xlsx, .csv)', 'Word (.docx, .doc)'],
    'Business Plan & Projections': ['PDF (.pdf)', 'Word (.docx, .doc)', 'PowerPoint (.pptx, .ppt)'],
    'Cash Flow Forecast': ['Excel (.xlsx, .csv)', 'PDF (.pdf)'],
    'Collateral Valuation Documents': ['PDF (.pdf)', 'Images (.png, .jpg, .jpeg)']
  });
  const [openFormatDoc, setOpenFormatDoc] = useState<string | null>(null);

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

  // Rich templates tailored to each opportunity type
  const getTemplateForType = (type: OpportunityType) => {
    switch (type) {
      case 'grant':
        return `## Program Overview\nNon-dilutive grant facility designed to fund high-impact enterprises, green innovations, and community-driven economic initiatives across Rwanda.\n\n### Key Highlights & Terms\n• 100% equity-free matching subsidy with no repayment obligations\n• Direct milestone-based disbursement following verification\n• Structured technical assistance and ESG mentorship\n\n### Targeted Use of Grant Funds\n1. Community employment creation and youth/women empowerment\n2. Clean energy, circular economy, and green technology adoption\n3. Local value-chain development and export readiness\n\n> Note: Beneficiaries are required to report quarterly impact metrics and maintain transparent accounting on Elevata.`;
      case 'fintech':
        return `## Program Overview\nComprehensive fintech deployment program equipping micro, small, and medium businesses with modern digital commerce, mobile money, and merchant rails.\n\n### Key Highlights & Terms\n• Subsidized Smart POS hardware and contactless payment terminal\n• Preferential merchant discount rates (MDR) and next-day settlement\n• Automated RRA EBM tax invoicing bridge and ledger sync\n\n### Product Inclusions & Capabilities\n1. Multi-currency digital POS payment terminal\n2. Real-time cashflow analytics and automated reconciliation\n3. Pre-approved revolving working capital lines based on POS transaction turnover\n\n> Note: Requires active business registration and Rwandan merchant bank account.`;
      case 'equity':
        return `## Program Overview\nDirect growth equity and quasi-equity co-investment facility targeting high-growth Rwandan ventures and scalable enterprises.\n\n### Key Highlights & Terms\n• Patient minority equity investment (typically 10% – 25% stake)\n• Active board governance participation and strategic expansion advisory\n• Access to regional angel investor syndicates and international follow-on capital\n\n### Targeted Investment Focus\n1. Rapid geographical market expansion and distribution scale\n2. Product R&D, digital automation, and key executive hiring\n3. Strengthening balance sheet for senior debt readiness\n\n> Note: Eligible enterprises should have minimum 18 months audited track record and strong unit economics.`;
      case 'agricultural_loan':
        return `## Program Overview\nSeasonal agricultural value-chain financing program structured around planting cycles, harvest schedules, and guaranteed buyer off-taker contracts.\n\n### Key Highlights & Terms\n• Synchronized balloon repayment structured around Season A & B harvest timelines\n• Extended post-harvest grace period to safeguard against price volatility\n• Bundled climate-indexed crop and livestock insurance protection\n\n### Eligible Financing Areas\n1. Certified seed, organic fertilizer, and modern input procurement\n2. Post-harvest aggregation, cold storage, and warehouse receipt financing\n3. Irrigation infrastructure, tractor mechanization, and agro-processing equipment\n\n> Note: Cooperative off-taker supply contracts or structured off-take agreements required.`;
      case 'guarantee':
        return `## Program Overview\nPartial credit risk mitigation and loan guarantee scheme enabling under-collateralized SMEs to unlock commercial bank credit facilities.\n\n### Key Highlights & Terms\n• First-loss default coverage up to 75% for qualifying borrowing facilities\n• Waived or reduced physical real-estate collateral requirements\n• Streamlined bank credit committee approval under Elevata Risk Pool\n\n### Qualifying Guarantee Purposes\n1. Commercial bank working capital and letter of credit issuance\n2. Fixed asset and industrial equipment acquisition loans\n3. Public tender and corporate contract execution financing\n\n> Note: Borrowing SME must be registered on Elevata with at least 6 months digital bookkeeping history.`;
      case 'loan':
      default:
        return `## Program Overview\nComprehensive Credit & Working Capital facility designed to provide accessible, low-friction growth financing to qualifying enterprises across Rwanda.\n\n### Key Highlights & Terms\n• Subsidized fixed annual interest rate and transparent repayment terms\n• Expedited underwriting approval decision within 48 to 72 business hours\n• Dedicated credit advisory and capacity building support\n\n### Targeted Use of Funds\n1. Working capital & inventory expansion\n2. Equipment acquisition & technology upgrades\n3. Market distribution and scaling operations\n\n> Note: All eligible businesses must maintain active digital bookkeeping records on Elevata.`;
    }
  };

  // Dynamic placeholders based on opportunity type
  const getTitlePlaceholder = () => {
    switch (oppType) {
      case 'grant':
        return 'e.g. Green Innovation & Youth Employment Matching Grant';
      case 'fintech':
        return 'e.g. Smart POS & Digital Merchant Rails Facility';
      case 'equity':
        return 'e.g. Seed & Series A Equity Growth Capital Facility';
      case 'agricultural_loan':
        return 'e.g. Agri-SME Seasonal Harvest & Input Credit Facility';
      case 'guarantee':
        return 'e.g. SME Partial Credit Risk Guarantee & Collateral Support';
      case 'loan':
      default:
        return 'e.g. Agri-SME Working Capital & Inventory Growth Facility';
    }
  };

  // Pre-populate or update description template when type changes if empty
  useEffect(() => {
    if (!oppDesc) {
      setOppDesc(getTemplateForType(oppType));
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
    setOppDesc(getTemplateForType(oppType));
  };

  // Submit Handler
  const handleSubmit = async (e?: React.FormEvent) => {
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
    const docsWithFormats = Object.keys(docRequirements)
      .filter(doc => docRequirements[doc] !== 'N/A')
      .map(doc => ({
        name: doc,
        status: docRequirements[doc],
        acceptedFormats: docFormats[doc] || ['PDF (.pdf)']
      }));
    const finalTitle = oppName.trim();
    const finalInstitution = oppProvider.trim();
    const finalDeadline = oppDeadline || '2026-10-31';
    const finalSectors = oppSectors && oppSectors.length > 0 ? oppSectors : ['All Sectors'];

    await onPublish({
      title: finalTitle,
      institution: finalInstitution,
      category: oppCategory,
      description: oppDesc || `${oppCategory} opportunity targeting growing local enterprises.`,
      benefits:
        oppType === 'loan'
          ? `${loanRate || '8.5'}% Annual Interest, ${loanTerm || '24'} months term, grace period of ${loanGrace || '3'} months.`
          : oppType === 'agricultural_loan'
          ? `Tailored seasonal repayment (${agriSeasonCycle}), ${agriCropFocus}`
          : oppType === 'grant'
          ? `100% equity-free funding. Expected impact: ${grantImpact}`
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
      documentDossier: docsWithFormats,
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
              Publish New {typeMeta.title}
            </h1>
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${typeMeta.badgeColor}`}>
              {typeMeta.icon}
              {typeMeta.badge}
            </span>
          </div>
          <p className="text-[13px] text-[#5e5e5e] mt-1 font-sans">
            Complete the {typeMeta.title.toLowerCase()} specification below to publish directly to matching SME businesses across Rwanda.
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
            className="flex items-center justify-center space-x-1.5 px-6 py-2 rounded-full bg-[#0a66c2] hover:bg-[#004182] text-white text-xs font-bold transition-colors shadow-xs border-none cursor-pointer"
          >
            <span>Publish {typeMeta.title}</span>
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
              Basic Information &amp; Overview — {typeMeta.title}
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
              placeholder={getTitlePlaceholder()}
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
          <div className="w-full max-w-2xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-[13px] font-semibold text-[#181818]">
                Eligible Target Sectors <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[#5e5e5e] font-medium">
                  {oppSectors.length} selected
                </span>
                <span className="text-[#e0e0e0]">|</span>
                <button
                  type="button"
                  onClick={() =>
                    setOppSectors([
                      'Agriculture',
                      'Retail Shop',
                      'Wholesale',
                      'Manufacturing',
                      'ICT & Tech',
                      'Transport',
                      'Healthcare',
                      'Construction',
                      'Tourism & Hospitality'
                    ])
                  }
                  className="text-[#0a66c2] hover:underline font-semibold cursor-pointer"
                >
                  Select All
                </button>
                <span className="text-[#e0e0e0]">|</span>
                <button
                  type="button"
                  onClick={() => setOppSectors([])}
                  className="text-[#5e5e5e] hover:text-[#181818] font-semibold cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            </div>

            <p className="text-xs text-[#5e5e5e]">
              Select each qualifying sector. Matching SME businesses will be automatically surfaced and notified.
            </p>

            <div className="space-y-2 pt-1">
              {[
                { id: 'Agriculture', name: 'Agriculture & Agribusiness', desc: 'Farming, crop production, livestock, agri-processing & agricultural inputs' },
                { id: 'Retail Shop', name: 'Retail Shop & Commerce', desc: 'Supermarkets, convenience stores, consumer goods & retail trade' },
                { id: 'Wholesale', name: 'Wholesale & Distribution', desc: 'Bulk supply, FMCG distribution, import/export trade & merchant hubs' },
                { id: 'Manufacturing', name: 'Manufacturing & Light Industry', desc: 'Value addition, assembly, packaging, textiles & industrial production' },
                { id: 'ICT & Tech', name: 'ICT & Technology', desc: 'Software development, digital services, fintech & hardware solutions' },
                { id: 'Transport', name: 'Transport & Logistics', desc: 'Freight forwarding, fleet haulage, delivery & public transit services' },
                { id: 'Healthcare', name: 'Healthcare & Pharmaceuticals', desc: 'Clinics, pharmacies, diagnostic centers & medical supply operations' },
                { id: 'Construction', name: 'Construction & Real Estate', desc: 'Contractors, building materials, architecture & infrastructure' },
                { id: 'Tourism & Hospitality', name: 'Tourism & Hospitality', desc: 'Hotels, lodges, tour operations, restaurants & culinary services' }
              ].map(sector => {
                const isSelected = oppSectors.includes(sector.id);
                return (
                  <label
                    key={sector.id}
                    className={`flex items-center justify-between p-3.5 rounded-[6px] border cursor-pointer transition-all duration-150 ${
                      isSelected
                        ? 'bg-[#0a66c2]/5 border-[#0a66c2] shadow-[0_1px_3px_rgba(10,102,194,0.08)]'
                        : 'bg-white border-[#e0e0e0] hover:border-[#0a66c2] hover:bg-[#fafafa]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          setOppSectors(prev =>
                            isSelected ? prev.filter(s => s !== sector.id) : [...prev, sector.id]
                          );
                        }}
                        className="h-4 w-4 rounded-[3px] accent-[#0a66c2] cursor-pointer"
                      />
                      <div>
                        <div className="text-xs font-semibold text-[#181818]">
                          {sector.name}
                        </div>
                        <div className="text-[11px] text-[#5e5e5e] mt-0.5">
                          {sector.desc}
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="shrink-0 ml-3 inline-flex items-center gap-1 text-[11px] font-bold text-[#0a66c2] bg-[#0a66c2]/10 px-2.5 py-0.5 rounded-full">
                        <Check className="w-3 h-3 stroke-[2.5]" />
                        Selected
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Row 7: Program Description & Terms */}
          <div className="w-full max-w-4xl space-y-2">
            <div className="flex justify-between items-center">
              <div>
                <label className="text-[13px] font-semibold text-[#181818] block">
                  Program Description &amp; Terms (Markdown Supported)
                </label>
                <span className="text-[11px] text-[#5e5e5e] block mt-0.5">
                  Full programmatic overview, eligibility criteria, disbursement terms, and benefits.
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setDescViewMode('write')}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-[6px] transition-colors cursor-pointer ${
                    descViewMode === 'write' ? 'bg-[#0a66c2] text-white shadow-xs' : 'text-[#5e5e5e] hover:text-[#181818] hover:bg-[#f3f2f0]'
                  }`}
                >
                  Write Mode
                </button>
                <button
                  type="button"
                  onClick={() => setDescViewMode('preview')}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-[6px] transition-colors cursor-pointer ${
                    descViewMode === 'preview' ? 'bg-[#0a66c2] text-white shadow-xs' : 'text-[#5e5e5e] hover:text-[#181818] hover:bg-[#f3f2f0]'
                  }`}
                >
                  Preview Rendered
                </button>
              </div>
            </div>

            {descViewMode === 'write' ? (
              <div className="border border-[#666666] rounded-[8px] overflow-hidden focus-within:border-[#0a66c2] focus-within:ring-1 focus-within:ring-[#0a66c2] bg-white shadow-xs transition-all">
                {/* Formatting Toolbar */}
                <div className="bg-[#f3f2f0] border-b border-[#e0e0e0] px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex flex-wrap items-center gap-1">
                    <button type="button" onClick={() => insertFormatting('**', '**', 'bold text')} className="p-1.5 hover:bg-white rounded-[4px] text-[#181818] transition-colors cursor-pointer" title="Bold (**text**)">
                      <Bold className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" onClick={() => insertFormatting('*', '*', 'italic text')} className="p-1.5 hover:bg-white rounded-[4px] text-[#181818] transition-colors cursor-pointer" title="Italic (*text*)">
                      <Italic className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" onClick={() => insertFormatting('### ', '', 'Section Heading')} className="p-1.5 hover:bg-white rounded-[4px] text-[#181818] transition-colors cursor-pointer" title="Heading (### Title)">
                      <Heading3 className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" onClick={() => insertFormatting('• ', '', 'List item')} className="p-1.5 hover:bg-white rounded-[4px] text-[#181818] transition-colors cursor-pointer" title="Bullet List (• item)">
                      <List className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" onClick={() => insertFormatting('> ', '', 'Important requirement or note')} className="p-1.5 hover:bg-white rounded-[4px] text-[#181818] transition-colors cursor-pointer" title="Callout Quote (> note)">
                      <Quote className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" onClick={() => insertFormatting('```\n', '\n```', 'Key Metric: Specification')} className="p-1.5 hover:bg-white rounded-[4px] text-[#181818] text-[11px] font-mono transition-colors cursor-pointer" title="Code Block">
                      &lt;/&gt;
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {oppDesc && (
                      <button
                        type="button"
                        onClick={() => setOppDesc('')}
                        className="text-[#5e5e5e] hover:text-red-600 text-xs font-semibold px-2 py-1 rounded hover:bg-white transition-colors cursor-pointer"
                        title="Clear Description"
                      >
                        Clear
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={insertTemplate}
                      className="bg-white hover:bg-[#0a66c2]/10 border border-[#0a66c2]/30 text-[#0a66c2] px-2.5 py-1 rounded-[5px] font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Auto-Fill {typeMeta.title} Template
                    </button>
                  </div>
                </div>

                {/* Extended Textarea */}
                <textarea
                  ref={descRef}
                  rows={14}
                  value={oppDesc}
                  onChange={e => setOppDesc(e.target.value)}
                  className="w-full p-4 text-[13.5px] text-[#181818] outline-none font-sans resize-y leading-relaxed min-h-[300px] sm:min-h-[340px]"
                  placeholder="Provide comprehensive program description, terms, covenants, disbursement mechanics, and compliance requirements..."
                />

                {/* Status Bar */}
                <div className="bg-[#f9f9f9] border-t border-[#e0e0e0] px-4 py-2 flex flex-wrap items-center justify-between text-[11px] text-[#5e5e5e]">
                  <span>Supports GitHub Flavored Markdown (Headers, Lists, Bold, Quotes &amp; Tables)</span>
                  <span className="font-mono">
                    {oppDesc ? `${oppDesc.trim().split(/\s+/).filter(Boolean).length} words · ${oppDesc.length} characters` : '0 words'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="border border-[#e0e0e0] rounded-[8px] p-6 bg-white min-h-[340px] max-h-[600px] overflow-y-auto text-xs leading-relaxed shadow-2xs">
                {oppDesc ? (
                  <FormattedText text={oppDesc} className="text-[#181818] leading-relaxed" />
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-[#5e5e5e] text-center">
                    <p className="text-sm font-semibold">No description entered yet</p>
                    <p className="text-xs mt-1">Switch to Write Mode to add content or click Auto-Fill Template.</p>
                  </div>
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
          <div className="w-full max-w-2xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-[13px] font-semibold text-[#181818]">
                Geographical Districts &amp; Provinces <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[#5e5e5e] font-medium">
                  {eligLocations.length} selected
                </span>
                <span className="text-[#e0e0e0]">|</span>
                <button
                  type="button"
                  onClick={() =>
                    setEligLocations([
                      'Kigali',
                      'Nyarugenge',
                      'Gasabo',
                      'Kicukiro',
                      'Northern Province',
                      'Western Province',
                      'Eastern Province',
                      'Southern Province'
                    ])
                  }
                  className="text-[#0a66c2] hover:underline font-semibold cursor-pointer"
                >
                  Select All
                </button>
                <span className="text-[#e0e0e0]">|</span>
                <button
                  type="button"
                  onClick={() => setEligLocations([])}
                  className="text-[#5e5e5e] hover:text-[#181818] font-semibold cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            </div>

            <p className="text-xs text-[#5e5e5e]">
              Specify eligible operating territories. Registered businesses situated in these locations will be matched.
            </p>

            <div className="space-y-2 pt-1">
              {[
                { id: 'Kigali', name: 'Kigali City (All Districts)', desc: 'Metropolitan commerce & services across Nyarugenge, Gasabo, and Kicukiro' },
                { id: 'Nyarugenge', name: 'Nyarugenge District', desc: 'Central commercial district, market centers, CBD & Biryogo commercial zone' },
                { id: 'Gasabo', name: 'Gasabo District', desc: 'Tech corridors, commercial trading hubs, Kimironko, Remera & Kacyiru' },
                { id: 'Kicukiro', name: 'Kicukiro District', desc: 'Industrial park zone, logistics hubs, Gahanga, Kanombe & Kagarama' },
                { id: 'Northern Province', name: 'Northern Province', desc: 'Musanze, Gicumbi, Burera, Rulindo & Gakenke commercial & agri zones' },
                { id: 'Western Province', name: 'Western Province', desc: 'Rubavu, Rusizi, Karongi, Rutsiro, Nyamasheke & cross-border trading' },
                { id: 'Eastern Province', name: 'Eastern Province', desc: 'Bugesera, Rwamagana, Kayonza, Nyagatare, Gatsibo & agricultural corridor' },
                { id: 'Southern Province', name: 'Southern Province', desc: 'Huye, Muhanga, Nyanza, Ruhango, Kamonyi, Gisagara & Southern economic hubs' }
              ].map(loc => {
                const isSelected = eligLocations.includes(loc.id);
                return (
                  <label
                    key={loc.id}
                    className={`flex items-center justify-between p-3.5 rounded-[6px] border cursor-pointer transition-all duration-150 ${
                      isSelected
                        ? 'bg-[#0a66c2]/5 border-[#0a66c2] shadow-[0_1px_3px_rgba(10,102,194,0.08)]'
                        : 'bg-white border-[#e0e0e0] hover:border-[#0a66c2] hover:bg-[#fafafa]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          setEligLocations(prev =>
                            isSelected ? prev.filter(x => x !== loc.id) : [...prev, loc.id]
                          );
                        }}
                        className="h-4 w-4 rounded-[3px] accent-[#0a66c2] cursor-pointer"
                      />
                      <div>
                        <div className="text-xs font-semibold text-[#181818]">
                          {loc.name}
                        </div>
                        <div className="text-[11px] text-[#5e5e5e] mt-0.5">
                          {loc.desc}
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="shrink-0 ml-3 inline-flex items-center gap-1 text-[11px] font-bold text-[#0a66c2] bg-[#0a66c2]/10 px-2.5 py-0.5 rounded-full">
                        <Check className="w-3 h-3 stroke-[2.5]" />
                        Selected
                      </span>
                    )}
                  </label>
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
          {Object.keys(docRequirements).map((doc) => {
            const status = docRequirements[doc];
            const isNA = status === 'N/A';
            const currentFormats = docFormats[doc] || ['PDF (.pdf)'];

            const formatOptions = [
              { id: 'PDF (.pdf)', label: 'PDF (.pdf)', short: 'PDF' },
              { id: 'Images (.png, .jpg, .jpeg)', label: 'Images (PNG, JPG, JPEG)', short: 'Images' },
              { id: 'Word (.docx, .doc)', label: 'Word (DOCX, DOC)', short: 'Word' },
              { id: 'Excel (.xlsx, .csv)', label: 'Excel (XLSX, CSV)', short: 'Excel' },
              { id: 'PowerPoint (.pptx, .ppt)', label: 'PowerPoint (PPT, PPTX)', short: 'PPT' }
            ];

            const formatLabel = () => {
              if (currentFormats.length === formatOptions.length) return 'All Formats';
              if (currentFormats.length === 1) {
                const found = formatOptions.find(f => f.id === currentFormats[0]);
                return found ? found.short : '1 Format';
              }
              return `${currentFormats.length} Formats`;
            };

            return (
              <div
                key={doc}
                className={`p-3.5 bg-white border rounded-[8px] transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative ${
                  status === 'Required'
                    ? 'border-[#0a66c2]/40 shadow-[0_1px_4px_rgba(10,102,194,0.06)]'
                    : status === 'Optional'
                    ? 'border-[#e0e0e0]'
                    : 'border-[#e8e8e8] bg-[#fafafa]/80 opacity-70'
                }`}
              >
                {/* Left: Document Name & Subtitle */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText
                    className={`w-4 h-4 shrink-0 ${
                      status === 'Required'
                        ? 'text-[#0a66c2]'
                        : status === 'Optional'
                        ? 'text-[#057642]'
                        : 'text-gray-400'
                    }`}
                  />
                  <div className="min-w-0">
                    <strong className="text-[#181818] font-bold text-xs block truncate">{doc}</strong>
                    <span className="text-[11px] text-[#5e5e5e] block truncate">
                      {status === 'Required'
                        ? 'Mandatory upload for underwriting'
                        : status === 'Optional'
                        ? 'Optional supporting document'
                        : 'Not required for this program'}
                    </span>
                  </div>
                </div>

                {/* Right: Dropdown for Document Format Types & Requirement Pills */}
                <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                  {/* File Format Multi-Select Dropdown */}
                  {!isNA && (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setOpenFormatDoc(openFormatDoc === doc ? null : doc)}
                        className={`h-8 px-2.5 rounded-[6px] border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                          openFormatDoc === doc
                            ? 'bg-[#0a66c2]/10 border-[#0a66c2] text-[#0a66c2] ring-2 ring-[#0a66c2]/20'
                            : 'bg-[#f8f9fa] border-[#d0d0d0] text-[#181818] hover:bg-[#f3f2f0] hover:border-[#a0a0a0]'
                        }`}
                        title="Select accepted file formats"
                      >
                        <span className="text-[11px] font-semibold">{formatLabel()}</span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 text-[#5e5e5e] transition-transform duration-150 ${
                            openFormatDoc === doc ? 'rotate-180 text-[#0a66c2]' : ''
                          }`}
                        />
                      </button>

                      {/* Dropdown Menu Popup */}
                      {openFormatDoc === doc && (
                        <>
                          <div
                            className="fixed inset-0 z-20 cursor-default"
                            onClick={() => setOpenFormatDoc(null)}
                          />
                          <div className="absolute right-0 top-full mt-1.5 w-64 bg-white border border-[#d0d0d0] rounded-[8px] shadow-xl z-30 p-2.5 space-y-2 animate-in fade-in zoom-in-95 duration-100">
                            <div className="flex items-center justify-between pb-1.5 border-b border-[#f0f0f0]">
                              <span className="text-[11px] font-bold text-[#181818] uppercase tracking-wider">
                                Accepted Formats
                              </span>
                              <div className="flex items-center gap-1.5 text-[11px]">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setDocFormats(prev => ({
                                      ...prev,
                                      [doc]: formatOptions.map(f => f.id)
                                    }))
                                  }
                                  className="text-[#0a66c2] hover:underline font-semibold cursor-pointer"
                                >
                                  All
                                </button>
                                <span className="text-[#e0e0e0]">|</span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setDocFormats(prev => ({
                                      ...prev,
                                      [doc]: ['PDF (.pdf)']
                                    }))
                                  }
                                  className="text-[#5e5e5e] hover:text-[#181818] font-semibold cursor-pointer"
                                >
                                  PDF Only
                                </button>
                              </div>
                            </div>

                            <div className="space-y-1">
                              {formatOptions.map((fmt) => {
                                const isChecked = currentFormats.includes(fmt.id);
                                return (
                                  <label
                                    key={fmt.id}
                                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-[5px] text-xs cursor-pointer transition-colors ${
                                      isChecked
                                        ? 'bg-[#0a66c2]/8 text-[#0a66c2] font-semibold'
                                        : 'text-[#181818] hover:bg-[#f3f2f0]'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => {
                                          setDocFormats(prev => {
                                            const list = prev[doc] || [];
                                            const next = isChecked
                                              ? list.filter(item => item !== fmt.id)
                                              : [...list, fmt.id];
                                            return {
                                              ...prev,
                                              [doc]: next.length > 0 ? next : [fmt.id]
                                            };
                                          });
                                        }}
                                        className="h-3.5 w-3.5 rounded-[3px] accent-[#0a66c2] cursor-pointer"
                                      />
                                      <span className="text-xs">{fmt.label}</span>
                                    </div>
                                    {isChecked && <Check className="w-3 h-3 text-[#0a66c2] stroke-[2.5]" />}
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Requirement Status Buttons */}
                  <div className="flex gap-1 shrink-0">
                    {(['Required', 'Optional', 'N/A'] as const).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => {
                          setDocRequirements(prev => ({ ...prev, [doc]: lvl }));
                          if (lvl === 'N/A' && openFormatDoc === doc) {
                            setOpenFormatDoc(null);
                          }
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-semibold border transition cursor-pointer ${
                          docRequirements[doc] === lvl
                            ? lvl === 'Required'
                              ? 'bg-[#0a66c2] text-white border-[#0a66c2]'
                              : lvl === 'Optional'
                              ? 'bg-[#057642] text-white border-[#057642]'
                              : 'bg-gray-700 text-white border-gray-700'
                            : 'bg-white text-[#5e5e5e] border-[#e0e0e0] hover:bg-[#f3f2f0]'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
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
            Direct Publishing
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
              <span>Publish {typeMeta.title}</span>
            </button>
            <p className="text-xs text-[#5e5e5e] font-sans">
              Matching SME businesses will immediately qualify upon publishing.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
