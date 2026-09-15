import React, { useState, useRef } from 'react';
import {
  X,
  ChevronRight,
  Landmark,
  Gift,
  Smartphone,
  TrendingUp,
  Layers,
  ShieldCheck,
  FileText,
  Coins,
  Sliders,
  CheckCircle,
 
  Check,
  Wand2,
  Bold,
  Italic,
  Heading3,
  List,
  Quote
} from 'lucide-react';
import logo from '../images/elevata_logo.png';
import FormattedText from './ui/FormattedText';

export type OpportunityType = 'loan' | 'grant' | 'fintech' | 'equity' | 'agricultural_loan' | 'guarantee';

interface PublishOpportunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish: (oppData: any) => void;
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

export default function PublishOpportunityModal({
  isOpen,
  onClose,
  onPublish,
  availableCategories,
  simulatedCandidates,
  formatRWF
}: PublishOpportunityModalProps) {
  // Modal View: 'choose_type' | 'full_form'
  const [modalView, setModalView] = useState<'choose_type' | 'full_form'>('choose_type');

  // Selected Type & Category
  const [oppType, setOppType] = useState<OpportunityType>('loan');
  const [oppCategory, setOppCategory] = useState('Loan');

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
  const [equityValuation, setEquityValuation] = useState('100,000,000');

  // Section 3: Financial Rules & Eligibility
  const [finMinMonthlyRev, setFinMinMonthlyRev] = useState(2000000);
  const [finMinAnnualRev, setFinMinAnnualRev] = useState(24000000);
  const [eligMinAge, setEligMinAge] = useState(1);
  const [finMinReadiness, setFinMinReadiness] = useState(65);
  const [finMinHealth, setFinMinHealth] = useState(60);
  const [eligSoleProp, setEligSoleProp] = useState(true);
  const [eligCompany, setEligCompany] = useState(true);
  const [eligCooperative, setEligCooperative] = useState(true);
  const [eligStartup, setEligStartup] = useState(true);

  // Section 4: Required Documents Dossier
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

  // Section 5: Application Method
  const [appMethod, setAppMethod] = useState('Apply directly through Elevata');
  const [readinessMinRecords, setReadinessMinRecords] = useState('6 months');

  // Rich description helpers
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

    let fundingVal = 'Flexible';
    if (oppType === 'loan' || oppType === 'agricultural_loan' || oppType === 'guarantee') {
      fundingVal = formatRWF(parseInt(loanMaxAmt) || 0);
    } else if (oppType === 'grant') {
      fundingVal = formatRWF(parseInt(grantAmt) || 0);
    } else if (oppType === 'equity') {
      fundingVal = formatRWF(parseInt(loanMaxAmt) || 0);
    }

    const docsList = Object.keys(docRequirements).filter(doc => docRequirements[doc] === 'Required');
    const finalTitle = oppName.trim() || `${oppCategory} Opportunity`;
    const finalInstitution = oppProvider.trim() || 'Elevata Underwriting Corp';
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
          : 'Automated terms, digital disbursement, and capacity scaling benefits.',
      deadline: finalDeadline,
      maxFunding: fundingVal,
      sectors: finalSectors,
      minAge: eligMinAge,
      minRevenue: finMinAnnualRev,
      minHealthScore: finMinHealth,
      minReadinessScore: finMinReadiness,
      registrationRequired: eligSoleProp || eligCompany,
      taxCompliance: true,
      collateralRequired: loanCollateralReq,
      requiredDocs: docsList,
      minMonthlyRevenue: finMinMonthlyRev,
      loanRate: parseFloat(loanRate) || 8.5,
      loanTerm: parseInt(loanTerm) || 24,
      loanGrace: parseInt(loanGrace) || 3,
      appMethod: appMethod
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-[2px] z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      
      {/* ==================================================================== */}
      {/* VIEW 1: SELECT OPPORTUNITY TYPE CARD POPUP */}
      {/* ==================================================================== */}
      {modalView === 'choose_type' ? (
        <div className="w-full max-w-2xl rounded-[10px] bg-white border border-[#e0e0e0] shadow-[0_8px_30px_rgba(0,0,0,0.12)] overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col">
          {/* Header */}
          <div className="px-6 py-5 border-b border-[#e0e0e0] bg-white flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Elevata" className="h-8 w-8 object-contain" />
              <div>
                <h3 className="text-base font-bold text-[#181818] font-heading">
                  Select Opportunity Type
                </h3>
                <p className="text-[12px] text-[#5e5e5e] mt-0.5 font-sans">
                  Choose the classification of financial facility or support program you wish to deploy.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-[#5e5e5e] hover:text-[#181818] hover:bg-[#f3f2f0] rounded-full transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Type Cards Grid */}
          <div className="p-6 bg-white space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {[
                {
                  type: 'loan' as OpportunityType,
                  category: 'Loan',
                  title: 'Loan & Credit Facility',
                  badge: 'Debt Financing',
                  badgeColor: 'bg-[#0a66c2]/10 text-[#0a66c2] border-[#0a66c2]/20',
                  icon: <Landmark className="w-5 h-5 text-[#0a66c2]" />,
                  desc: 'Working capital, inventory financing, term loans, and credit lines with custom interest & grace periods.'
                },
                {
                  type: 'grant' as OpportunityType,
                  category: 'Grant',
                  title: 'Grant & Non-Dilutive Subsidy',
                  badge: '100% Equity Free',
                  badgeColor: 'bg-[#057642]/10 text-[#057642] border-[#057642]/20',
                  icon: <Gift className="w-5 h-5 text-[#057642]" />,
                  desc: 'Donor-funded subsidies, development grants, matching capital, and innovation prize programs.'
                },
                {
                  type: 'fintech' as OpportunityType,
                  category: 'Fintech Product',
                  title: 'Fintech & Digital Rails',
                  badge: 'Merchant Solutions',
                  badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
                  icon: <Smartphone className="w-5 h-5 text-indigo-600" />,
                  desc: 'POS terminals, merchant wallets, payment gateways, and automated revenue collection systems.'
                },
                {
                  type: 'equity' as OpportunityType,
                  category: 'Investment',
                  title: 'Equity & Venture Capital',
                  badge: 'Growth Capital',
                  badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
                  icon: <TrendingUp className="w-5 h-5 text-purple-600" />,
                  desc: 'Direct equity investments, convertible debt notes, syndicate co-investments, and angel capital.'
                },
                {
                  type: 'agricultural_loan' as OpportunityType,
                  category: 'Loan',
                  title: 'Agri & Value-Chain Facility',
                  badge: 'Seasonal / Crop',
                  badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                  icon: <Layers className="w-5 h-5 text-emerald-700" />,
                  desc: 'Seasonal crop financing, warehouse receipt credit, input vouchers, and contract off-taker facilities.'
                },
                {
                  type: 'guarantee' as OpportunityType,
                  category: 'Guarantee',
                  title: 'Credit Guarantee & Insurance',
                  badge: 'Risk Mitigation',
                  badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
                  icon: <ShieldCheck className="w-5 h-5 text-amber-700" />,
                  desc: 'Partial credit risk guarantees, trade insurance, collateral support, and export protection.'
                }
              ].map((item) => (
                <div
                  key={item.type}
                  onClick={() => {
                    setOppType(item.type);
                    setOppCategory(item.category);
                    setModalView('full_form');
                  }}
                  className="group p-4 rounded-[10px] border border-[#e0e0e0] hover:border-[#0a66c2] bg-white hover:bg-[#f3f2f0]/50 transition-all cursor-pointer shadow-[0_1px_4px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_16px_rgba(10,102,194,0.12)] flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="p-2.5 rounded-[8px] bg-[#f3f2f0] group-hover:bg-white border border-[#e0e0e0] transition-colors">
                        {item.icon}
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#181818] group-hover:text-[#0a66c2] transition-colors font-heading">
                        {item.title}
                      </h4>
                      <p className="text-[12px] text-[#5e5e5e] mt-1 leading-relaxed font-sans line-clamp-2">
                        {item.desc}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-[#f0f0f0] flex items-center justify-between text-xs font-semibold text-[#0a66c2]">
                    <span>Configure this form</span>
                    <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-[#f3f2f0] border-t border-[#e0e0e0] flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 items-center justify-center rounded-full border border-[#666666] bg-white px-5 text-[14px] font-semibold text-[#181818] transition-colors hover:bg-[#f3f2f0]"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        
        /* ==================================================================== */
        /* VIEW 2: UNIFIED FULL FORM (SINGLE SCROLLABLE PAGE WITH CLEAR SECTIONS) */
        /* ==================================================================== */
        <div className="w-full max-w-4xl rounded-[10px] bg-white border border-[#e0e0e0] shadow-[0_8px_32px_rgba(0,0,0,0.15)] overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
          
          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-[#e0e0e0] bg-white flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Elevata" className="h-8 w-8 object-contain" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[1.25rem] font-black tracking-tight text-[#0a66c2]">
                    Elevata
                  </span>
                  <span className="text-slate-300 text-sm">|</span>
                  <h3 className="text-sm font-bold text-[#181818]">
                    Publish {oppCategory} Opportunity
                  </h3>
                  <span className="bg-[#0a66c2]/10 text-[#0a66c2] text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-[#0a66c2]/20">
                    {oppType.toUpperCase()}
                  </span>
                </div>
                <p className="text-[11px] text-[#5e5e5e] mt-0.5 font-sans">
                  Configure basic info, product terms, financial rules, and documents on this single publisher form.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setModalView('choose_type')}
                className="text-xs font-semibold text-[#0a66c2] hover:underline px-3 py-1 rounded-full bg-[#0a66c2]/5 border border-[#0a66c2]/20 transition-colors"
              >
                Change Type
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-[#5e5e5e] hover:text-[#181818] hover:bg-[#f3f2f0] rounded-full transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Section Quick Jump Anchor Bar */}
          <div className="px-6 py-2.5 bg-[#f3f2f0] border-b border-[#e0e0e0] flex items-center gap-2 overflow-x-auto text-[11px] font-semibold select-none whitespace-nowrap scrollbar-thin shrink-0">
            <span className="text-[#717171] uppercase text-[10px] tracking-wider pr-1">Form Sections:</span>
            {[
              { id: 'sec-basic', label: '1. Basic Info', icon: <FileText className="w-3.5 h-3.5" /> },
              { id: 'sec-product', label: '2. Product Details', icon: <Coins className="w-3.5 h-3.5" /> },
              { id: 'sec-financial', label: '3. Financial & Eligibility Rules', icon: <Sliders className="w-3.5 h-3.5" /> },
              { id: 'sec-docs', label: '4. Required Documents', icon: <CheckCircle className="w-3.5 h-3.5" /> },
              { id: 'sec-matching', label: '5. Application & Matching', icon: <Sparkles className="w-3.5 h-3.5" /> }
            ].map((sec) => (
              <button
                key={sec.id}
                type="button"
                onClick={() => {
                  document.getElementById(sec.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white hover:bg-slate-100 text-[#181818] border border-[#e0e0e0] transition-colors shadow-2xs hover:text-[#0a66c2]"
              >
                {sec.icon}
                <span>{sec.label}</span>
              </button>
            ))}
          </div>

          {/* Scrollable Form Body with All Unified Sections */}
          <div className="p-6 overflow-y-auto flex-1 text-xs space-y-8 bg-white scroll-smooth">

            {/* ======================================================== */}
            {/* SECTION 1: BASIC INFORMATION */}
            {/* ======================================================== */}
            <div id="sec-basic" className="space-y-4 pt-1">
              <div className="flex items-center justify-between border-b border-[#e0e0e0] pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#0a66c2] text-white flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <h4 className="text-sm font-bold text-[#181818] font-heading">
                    Basic Information
                  </h4>
                </div>
                <span className="text-[11px] text-[#5e5e5e]">Title, provider, category &amp; description</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-[13px] font-medium text-[#181818]">
                    Opportunity Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rwanda Agribusiness Working Capital Facility"
                    value={oppName}
                    onChange={e => setOppName(e.target.value)}
                    className="h-10 w-full rounded-[4px] border border-[#666666] bg-white px-3 text-[14px] text-[#181818] outline-none transition-colors focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[13px] font-medium text-[#181818]">
                    Host / Providing Institution <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bank of Kigali / Elevata Capital"
                    value={oppProvider}
                    onChange={e => setOppProvider(e.target.value)}
                    className="h-10 w-full rounded-[4px] border border-[#666666] bg-white px-3 text-[14px] text-[#181818] outline-none transition-colors focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="mb-1 block text-[13px] font-medium text-[#181818]">Category</label>
                  <select
                    value={oppCategory}
                    onChange={e => setOppCategory(e.target.value)}
                    className="h-10 w-full rounded-[4px] border border-[#666666] bg-white px-3 text-[14px] text-[#181818] outline-none transition-colors focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
                  >
                    <option value="Loan">Loan &amp; Debt</option>
                    <option value="Grant">Grant &amp; Subsidy</option>
                    <option value="Fintech Product">Fintech &amp; Payments</option>
                    <option value="Investment">Equity &amp; Investment</option>
                    <option value="Guarantee">Guarantee &amp; Insurance</option>
                    <option value="Training">Training &amp; Advisory</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[13px] font-medium text-[#181818]">Business Stage</label>
                  <select
                    value={oppStage}
                    onChange={e => setOppStage(e.target.value)}
                    className="h-10 w-full rounded-[4px] border border-[#666666] bg-white px-3 text-[14px] text-[#181818] outline-none transition-colors focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
                  >
                    <option value="Early Stage">Early Stage (0-2 yrs)</option>
                    <option value="Growth">Growth (2-5 yrs)</option>
                    <option value="Mature">Mature / Established (5+ yrs)</option>
                    <option value="All Stages">All Stages</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[13px] font-medium text-[#181818]">Application Deadline</label>
                  <input
                    type="date"
                    value={oppDeadline}
                    onChange={e => setOppDeadline(e.target.value)}
                    className="h-10 w-full rounded-[4px] border border-[#666666] bg-white px-3 text-[14px] font-mono text-[#181818] outline-none transition-colors focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
                  />
                </div>
              </div>

              {/* Target Sectors Multi-Select */}
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-[#181818]">
                  Target Industry Sectors (Select all that apply)
                </label>
                <div className="flex flex-wrap gap-1.5 p-3 rounded-[6px] border border-[#e0e0e0] bg-[#f3f2f0]/40">
                  {availableCategories.slice(0, 12).map(cat => {
                    const isSelected = oppSectors.includes(cat.businessType);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setOppSectors(oppSectors.filter(s => s !== cat.businessType));
                          } else {
                            setOppSectors([...oppSectors, cat.businessType]);
                          }
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
                          isSelected
                            ? 'bg-[#0a66c2] text-white border-[#0a66c2] shadow-xs'
                            : 'bg-white text-[#5e5e5e] border-[#cccccc] hover:border-[#666666] hover:text-[#181818]'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 inline mr-1 stroke-[3]" />}
                        {cat.businessType}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Markdown Description with Toolbar */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[13px] font-medium text-[#181818]">
                    Opportunity Description &amp; Highlights (Markdown Supported)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={insertTemplate}
                      className="flex items-center gap-1 text-[11px] font-bold text-[#0a66c2] hover:underline"
                    >
                      <Wand2 className="w-3 h-3" />
                      Insert Template
                    </button>
                    <div className="flex rounded border border-[#e0e0e0] overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setDescViewMode('write')}
                        className={`px-2.5 py-0.5 text-[11px] font-semibold ${
                          descViewMode === 'write' ? 'bg-[#0a66c2] text-white' : 'bg-white text-[#5e5e5e]'
                        }`}
                      >
                        Write
                      </button>
                      <button
                        type="button"
                        onClick={() => setDescViewMode('preview')}
                        className={`px-2.5 py-0.5 text-[11px] font-semibold ${
                          descViewMode === 'preview' ? 'bg-[#0a66c2] text-white' : 'bg-white text-[#5e5e5e]'
                        }`}
                      >
                        Preview
                      </button>
                    </div>
                  </div>
                </div>

                {descViewMode === 'write' ? (
                  <div className="space-y-1.5">
                    {/* Editor Formatting Toolbar */}
                    <div className="flex items-center gap-1 p-1.5 bg-[#f3f2f0] border border-[#666666]/40 rounded-t-[4px] text-[#5e5e5e]">
                      <button
                        type="button"
                        onClick={() => insertFormatting('**', '**', 'bold text')}
                        className="p-1 hover:bg-white hover:text-[#181818] rounded transition"
                        title="Bold"
                      >
                        <Bold className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting('*', '*', 'italic text')}
                        className="p-1 hover:bg-white hover:text-[#181818] rounded transition"
                        title="Italic"
                      >
                        <Italic className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting('### ', '\n', 'Heading')}
                        className="p-1 hover:bg-white hover:text-[#181818] rounded transition"
                        title="Heading"
                      >
                        <Heading3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting('• ', '\n', 'List item')}
                        className="p-1 hover:bg-white hover:text-[#181818] rounded transition"
                        title="Bullet List"
                      >
                        <List className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting('> ', '\n', 'Important note')}
                        className="p-1 hover:bg-white hover:text-[#181818] rounded transition"
                        title="Quote"
                      >
                        <Quote className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <textarea
                      ref={descRef}
                      placeholder="Describe the opportunity purpose, terms, benefits, and required qualification profile..."
                      rows={5}
                      value={oppDesc}
                      onChange={e => setOppDesc(e.target.value)}
                      className="w-full rounded-b-[4px] border border-t-0 border-[#666666] bg-white p-3 text-[13px] text-[#181818] outline-none transition-colors focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2] leading-relaxed font-sans"
                    />
                  </div>
                ) : (
                  <div className="min-h-[120px] rounded-[4px] border border-[#e0e0e0] bg-[#f3f2f0]/30 p-3.5 text-xs text-[#181818]">
                    <FormattedText text={oppDesc || '_No description provided yet._'} />
                  </div>
                )}
              </div>
            </div>

            {/* ======================================================== */}
            {/* SECTION 2: PRODUCT & FACILITY DETAILS */}
            {/* ======================================================== */}
            <div id="sec-product" className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b border-[#e0e0e0] pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#0a66c2] text-white flex items-center justify-center font-bold text-xs">
                    2
                  </div>
                  <h4 className="text-sm font-bold text-[#181818] font-heading">
                    Product Details ({oppType === 'grant' ? 'Grant Parameters' : oppType === 'fintech' ? 'Fintech Parameters' : 'Credit & Facility Parameters'})
                  </h4>
                </div>
                <span className="text-[11px] text-[#5e5e5e]">Funding amounts, rates, tenor &amp; collateral</span>
              </div>

              {/* DEBT / LOAN / AGRI LOAN SPECIFIC FIELDS */}
              {(oppType === 'loan' || oppType === 'agricultural_loan' || oppType === 'guarantee') && (
                <div className="space-y-4 p-4 rounded-[8px] border border-[#e0e0e0] bg-[#f3f2f0]/30">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-[13px] font-medium text-[#181818]">Loan Facility Sub-Type</label>
                      <select
                        value={loanType}
                        onChange={e => setLoanType(e.target.value)}
                        className="h-10 w-full rounded-[4px] border border-[#666666] bg-white px-3 text-[14px] text-[#181818] outline-none transition-colors focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
                      >
                        <option value="Working Capital">Working Capital Credit Line</option>
                        <option value="Asset & Equipment Financing">Asset &amp; Equipment Financing</option>
                        <option value="Invoice Discounting">Invoice Discounting &amp; Factoring</option>
                        <option value="Agricultural Seasonal Loan">Agricultural Seasonal Loan</option>
                        <option value="Term Loan">Medium-to-Long Term Loan</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-[13px] font-medium text-[#181818]">Targeted Loan Purpose</label>
                      <input
                        type="text"
                        placeholder="e.g. Inventory replenishment & scaling"
                        value={loanPurpose}
                        onChange={e => setLoanPurpose(e.target.value)}
                        className="h-10 w-full rounded-[4px] border border-[#666666] bg-white px-3 text-[14px] text-[#181818] outline-none transition-colors focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-[13px] font-medium text-[#181818]">Minimum Amount (RWF)</label>
                      <input
                        type="number"
                        value={loanMinAmt}
                        onChange={e => setLoanMinAmt(e.target.value)}
                        className="h-10 w-full rounded-[4px] border border-[#666666] bg-white px-3 text-[14px] font-mono text-[#181818] outline-none transition-colors focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
                      />
                      <span className="text-[11px] text-[#5e5e5e] mt-0.5 block font-mono">{formatRWF(parseInt(loanMinAmt) || 0)}</span>
                    </div>

                    <div>
                      <label className="mb-1 block text-[13px] font-medium text-[#181818]">Maximum Amount (RWF)</label>
                      <input
                        type="number"
                        value={loanMaxAmt}
                        onChange={e => setLoanMaxAmt(e.target.value)}
                        className="h-10 w-full rounded-[4px] border border-[#666666] bg-white px-3 text-[14px] font-mono text-[#181818] outline-none transition-colors focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
                      />
                      <span className="text-[11px] text-[#5e5e5e] mt-0.5 block font-mono">{formatRWF(parseInt(loanMaxAmt) || 0)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="mb-1 block text-[13px] font-medium text-[#181818]">Annual Interest Rate (%)</label>
                      <input
                        type="text"
                        placeholder="e.g. 8.5"
                        value={loanRate}
                        onChange={e => setLoanRate(e.target.value)}
                        className="h-10 w-full rounded-[4px] border border-[#666666] bg-white px-3 text-[14px] font-mono text-[#181818] outline-none transition-colors focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-[13px] font-medium text-[#181818]">Tenure / Duration (Months)</label>
                      <input
                        type="number"
                        placeholder="e.g. 24"
                        value={loanTerm}
                        onChange={e => setLoanTerm(e.target.value)}
                        className="h-10 w-full rounded-[4px] border border-[#666666] bg-white px-3 text-[14px] font-mono text-[#181818] outline-none transition-colors focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-[13px] font-medium text-[#181818]">Grace Period (Months)</label>
                      <input
                        type="number"
                        placeholder="e.g. 3"
                        value={loanGrace}
                        onChange={e => setLoanGrace(e.target.value)}
                        className="h-10 w-full rounded-[4px] border border-[#666666] bg-white px-3 text-[14px] font-mono text-[#181818] outline-none transition-colors focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#e0e0e0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="loanCollateralReq"
                        checked={loanCollateralReq}
                        onChange={e => setLoanCollateralReq(e.target.checked)}
                        className="w-4 h-4 rounded text-[#0a66c2] focus:ring-[#0a66c2]"
                      />
                      <label htmlFor="loanCollateralReq" className="text-xs font-semibold text-[#181818] cursor-pointer">
                        Collateral Security Required for this Facility
                      </label>
                    </div>

                    {loanCollateralReq && (
                      <div className="w-full sm:w-auto flex items-center gap-2">
                        <span className="text-xs text-[#5e5e5e]">Type:</span>
                        <select
                          value={loanCollateralType}
                          onChange={e => setLoanCollateralType(e.target.value)}
                          className="h-9 rounded-[4px] border border-[#666666] bg-white px-2.5 text-xs text-[#181818] outline-none"
                        >
                          <option value="Asset Registration">Movable Asset / Equipment</option>
                          <option value="Real Estate Land Title">Real Estate / Land Title</option>
                          <option value="Personal Guarantee">Director Personal Guarantee</option>
                          <option value="Receivables Pledge">Receivables / Contract Pledge</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* GRANT SPECIFIC FIELDS */}
              {oppType === 'grant' && (
                <div className="space-y-4 p-4 rounded-[8px] border border-[#e0e0e0] bg-[#f3f2f0]/30">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-[13px] font-medium text-[#181818]">Total Grant Funding (RWF)</label>
                      <input
                        type="number"
                        value={grantAmt}
                        onChange={e => setGrantAmt(e.target.value)}
                        className="h-10 w-full rounded-[4px] border border-[#666666] bg-white px-3 text-[14px] font-mono text-[#181818] outline-none"
                      />
                      <span className="text-[11px] text-[#5e5e5e] mt-0.5 block font-mono">{formatRWF(parseInt(grantAmt) || 0)}</span>
                    </div>

                    <div>
                      <label className="mb-1 block text-[13px] font-medium text-[#181818]">Grant Execution Duration (Months)</label>
                      <input
                        type="number"
                        value={grantDuration}
                        onChange={e => setGrantDuration(e.target.value)}
                        className="h-10 w-full rounded-[4px] border border-[#666666] bg-white px-3 text-[14px] font-mono text-[#181818] outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-[13px] font-medium text-[#181818]">Targeted Impact Theme</label>
                    <input
                      type="text"
                      placeholder="e.g. Women-led enterprise, Youth digital transformation, Green agro-processing"
                      value={grantImpact}
                      onChange={e => setGrantImpact(e.target.value)}
                      className="h-10 w-full rounded-[4px] border border-[#666666] bg-white px-3 text-[14px] text-[#181818] outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <input
                      type="checkbox"
                      id="grantCoFundingReq"
                      checked={grantCoFundingReq}
                      onChange={e => setGrantCoFundingReq(e.target.checked)}
                      className="w-4 h-4 rounded text-[#0a66c2]"
                    />
                    <label htmlFor="grantCoFundingReq" className="text-xs font-semibold text-[#181818] cursor-pointer">
                      Applicant Matching Co-Funding Required ({grantCoFundingPct}%)
                    </label>
                  </div>
                </div>
              )}

              {/* FINTECH SPECIFIC FIELDS */}
              {oppType === 'fintech' && (
                <div className="space-y-4 p-4 rounded-[8px] border border-[#e0e0e0] bg-[#f3f2f0]/30">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="mb-1 block text-[13px] font-medium text-[#181818]">Fintech Tool Type</label>
                      <select
                        value={fintechType}
                        onChange={e => setFintechType(e.target.value)}
                        className="h-10 w-full rounded-[4px] border border-[#666666] bg-white px-3 text-[14px] text-[#181818] outline-none"
                      >
                        <option value="POS Payments">Smart POS Terminal</option>
                        <option value="Merchant Wallet">Merchant Digital Wallet</option>
                        <option value="Payment Gateway">E-Commerce Gateway</option>
                        <option value="Payroll Solution">Digital Payroll Rails</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-[13px] font-medium text-[#181818]">Setup / Hardware Fee (RWF)</label>
                      <input
                        type="number"
                        value={fintechFee}
                        onChange={e => setFintechFee(e.target.value)}
                        className="h-10 w-full rounded-[4px] border border-[#666666] bg-white px-3 text-[14px] font-mono text-[#181818] outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[13px] font-medium text-[#181818]">Transaction Fee (%)</label>
                      <input
                        type="text"
                        value={fintechTxFee}
                        onChange={e => setFintechTxFee(e.target.value)}
                        className="h-10 w-full rounded-[4px] border border-[#666666] bg-white px-3 text-[14px] font-mono text-[#181818] outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* EQUITY SPECIFIC FIELDS */}
              {oppType === 'equity' && (
                <div className="space-y-4 p-4 rounded-[8px] border border-[#e0e0e0] bg-[#f3f2f0]/30">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-[13px] font-medium text-[#181818]">Investment Ticket Size (RWF)</label>
                      <input
                        type="number"
                        value={loanMaxAmt}
                        onChange={e => setLoanMaxAmt(e.target.value)}
                        className="h-10 w-full rounded-[4px] border border-[#666666] bg-white px-3 text-[14px] font-mono text-[#181818] outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[13px] font-medium text-[#181818]">Target Equity Stake (%)</label>
                      <input
                        type="text"
                        placeholder="e.g. 10 - 20%"
                        value={equityStake}
                        onChange={e => setEquityStake(e.target.value)}
                        className="h-10 w-full rounded-[4px] border border-[#666666] bg-white px-3 text-[14px] text-[#181818] outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ======================================================== */}
            {/* SECTION 3: FINANCIAL RULES & ELIGIBILITY */}
            {/* ======================================================== */}
            <div id="sec-financial" className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b border-[#e0e0e0] pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#0a66c2] text-white flex items-center justify-center font-bold text-xs">
                    3
                  </div>
                  <h4 className="text-sm font-bold text-[#181818] font-heading">
                    Financial Rules &amp; SME Eligibility
                  </h4>
                </div>
                <span className="text-[11px] text-[#5e5e5e]">Turnover limits, readiness scores &amp; legal forms</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-[13px] font-medium text-[#181818]">
                    Minimum Monthly Revenue (RWF)
                  </label>
                  <input
                    type="number"
                    value={finMinMonthlyRev}
                    onChange={e => setFinMinMonthlyRev(parseInt(e.target.value) || 0)}
                    className="h-10 w-full rounded-[4px] border border-[#666666] bg-white px-3 text-[14px] font-mono text-[#181818] outline-none transition-colors focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
                  />
                  <span className="text-[11px] text-[#5e5e5e] mt-0.5 block font-mono">{formatRWF(finMinMonthlyRev)} / month</span>
                </div>

                <div>
                  <label className="mb-1 block text-[13px] font-medium text-[#181818]">
                    Minimum Annual Revenue (RWF)
                  </label>
                  <input
                    type="number"
                    value={finMinAnnualRev}
                    onChange={e => setFinMinAnnualRev(parseInt(e.target.value) || 0)}
                    className="h-10 w-full rounded-[4px] border border-[#666666] bg-white px-3 text-[14px] font-mono text-[#181818] outline-none transition-colors focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
                  />
                  <span className="text-[11px] text-[#5e5e5e] mt-0.5 block font-mono">{formatRWF(finMinAnnualRev)} / year</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="mb-1 block text-[13px] font-medium text-[#181818]">Min Business Age</label>
                  <select
                    value={eligMinAge}
                    onChange={e => setEligMinAge(parseInt(e.target.value))}
                    className="h-10 w-full rounded-[4px] border border-[#666666] bg-white px-3 text-[14px] text-[#181818] outline-none transition-colors focus:border-[#0a66c2]"
                  >
                    <option value={0}>No minimum age</option>
                    <option value={1}>At least 1 year in operation</option>
                    <option value={2}>At least 2 years in operation</option>
                    <option value={3}>At least 3 years in operation</option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[13px] font-medium text-[#181818]">Min SME Readiness</label>
                    <span className="text-xs font-bold text-[#0a66c2] font-mono">{finMinReadiness}%</span>
                  </div>
                  <input
                    type="range"
                    min={30}
                    max={90}
                    value={finMinReadiness}
                    onChange={e => setFinMinReadiness(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0a66c2]"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[13px] font-medium text-[#181818]">Min Financial Health</label>
                    <span className="text-xs font-bold text-[#057642] font-mono">{finMinHealth}%</span>
                  </div>
                  <input
                    type="range"
                    min={30}
                    max={90}
                    value={finMinHealth}
                    onChange={e => setFinMinHealth(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#057642]"
                  />
                </div>
              </div>

              {/* Legal Entity Checkboxes */}
              <div>
                <label className="mb-2 block text-[13px] font-medium text-[#181818]">
                  Eligible Business Registration Types
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-[6px] border border-[#e0e0e0] bg-[#f3f2f0]/30">
                  {[
                    { label: 'Sole Proprietorship', checked: eligSoleProp, set: setEligSoleProp },
                    { label: 'Limited Company (Ltd)', checked: eligCompany, set: setEligCompany },
                    { label: 'Cooperative (Coop)', checked: eligCooperative, set: setEligCooperative },
                    { label: 'Early-stage Startup', checked: eligStartup, set: setEligStartup }
                  ].map((item, idx) => (
                    <label key={idx} className="flex items-center gap-2 text-xs font-medium text-[#181818] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={e => item.set(e.target.checked)}
                        className="w-4 h-4 rounded text-[#0a66c2] focus:ring-[#0a66c2]"
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* ======================================================== */}
            {/* SECTION 4: REQUIRED DOCUMENTATION DOSSIER */}
            {/* ======================================================== */}
            <div id="sec-docs" className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b border-[#e0e0e0] pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#0a66c2] text-white flex items-center justify-center font-bold text-xs">
                    4
                  </div>
                  <h4 className="text-sm font-bold text-[#181818] font-heading">
                    Required Documentation Dossier
                  </h4>
                </div>
                <span className="text-[11px] text-[#5e5e5e]">Set compliance status for mandatory attachments</span>
              </div>

              <div className="border border-[#e0e0e0] rounded-[8px] overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f3f2f0] border-b border-[#e0e0e0] text-[#5e5e5e] font-bold">
                    <tr>
                      <th className="p-3">Document Title</th>
                      <th className="p-3 text-right">Requirement Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0f0f0]">
                    {Object.keys(docRequirements).map((doc) => (
                      <tr key={doc} className="hover:bg-[#f3f2f0]/30 transition-colors">
                        <td className="p-3 text-[#181818] font-medium flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-[#5e5e5e]" />
                          {doc}
                        </td>
                        <td className="p-3 text-right">
                          <div className="inline-flex rounded-full p-0.5 bg-[#f3f2f0] border border-[#e0e0e0]">
                            {(['Required', 'Optional', 'N/A'] as const).map((status) => (
                              <button
                                key={status}
                                type="button"
                                onClick={() => {
                                  setDocRequirements(prev => ({ ...prev, [doc]: status }));
                                }}
                                className={`px-3 py-1 text-[11px] font-bold rounded-full transition-all ${
                                  docRequirements[doc] === status
                                    ? status === 'Required'
                                      ? 'bg-[#057642] text-white shadow-2xs'
                                      : status === 'Optional'
                                      ? 'bg-[#0a66c2] text-white shadow-2xs'
                                      : 'bg-[#666666] text-white shadow-2xs'
                                    : 'text-[#5e5e5e] hover:text-[#181818]'
                                }`}
                              >
                                {status}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ======================================================== */}
            {/* SECTION 5: APPLICATION & AI MATCHING SIMULATION */}
            {/* ======================================================== */}
            <div id="sec-matching" className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b border-[#e0e0e0] pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#0a66c2] text-white flex items-center justify-center font-bold text-xs">
                    5
                  </div>
                  <h4 className="text-sm font-bold text-[#181818] font-heading">
                    Application Method &amp; AI Live Matching Preview
                  </h4>
                </div>
                <span className="text-[11px] text-[#5e5e5e]">Intelligent verification simulation</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-[13px] font-medium text-[#181818]">Application Intake Channel</label>
                  <select
                    value={appMethod}
                    onChange={e => setAppMethod(e.target.value)}
                    className="h-10 w-full rounded-[4px] border border-[#666666] bg-white px-3 text-[14px] text-[#181818] outline-none"
                  >
                    <option value="Apply directly through Elevata">Apply directly through Elevata (Instant AI scoring)</option>
                    <option value="External Provider Portal">External Bank / Underwriting Portal</option>
                    <option value="In-Person Branch Submission">In-Person Physical Branch Walk-in</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[13px] font-medium text-[#181818]">Bookkeeping History Benchmark</label>
                  <select
                    value={readinessMinRecords}
                    onChange={e => setReadinessMinRecords(e.target.value)}
                    className="h-10 w-full rounded-[4px] border border-[#666666] bg-white px-3 text-[14px] text-[#181818] outline-none"
                  >
                    <option value="3 months">At least 3 months digital records</option>
                    <option value="6 months">At least 6 months digital records</option>
                    <option value="12 months">12+ months audited history</option>
                  </select>
                </div>
              </div>

              {/* Live Simulated Candidate Preview */}
              <div className="p-4 rounded-[8px] border border-[#0a66c2]/30 bg-[#0a66c2]/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#0a66c2]" />
                    <h5 className="text-xs font-bold text-[#181818] uppercase tracking-wider font-heading">
                      Live AI Candidate Match Simulation
                    </h5>
                  </div>
                  <span className="text-[11px] font-bold text-[#057642] bg-white px-2 py-0.5 rounded-full border border-[#057642]/30">
                    {simulatedCandidates.filter(c => c.matchPercent >= 70).length} High-Fit SMEs in Database
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {simulatedCandidates.map((c, i) => (
                    <div key={i} className="p-3 bg-white border border-[#e0e0e0] rounded-[6px] shadow-2xs space-y-1.5">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-[#181818] truncate block text-[11.5px]">{c.name}</span>
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                          c.matchPercent >= 80 ? 'bg-[#057642]/10 text-[#057642]' : c.matchPercent >= 60 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {c.matchPercent}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-[#5e5e5e]">
                        <span>{c.sector}</span>
                        <span className="font-medium text-[#181818]">{c.readiness}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Sticky Footer with Cancel & Publish Actions */}
          <div className="px-6 py-4 bg-[#f3f2f0] border-t border-[#e0e0e0] flex justify-between items-center shrink-0">
            <button
              type="button"
              onClick={() => setModalView('choose_type')}
              className="flex h-10 items-center justify-center rounded-full border border-[#666666] bg-white px-5 text-[14px] font-semibold text-[#181818] transition-colors hover:bg-[#f3f2f0]"
            >
              Back to Type Selection
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex h-10 items-center justify-center rounded-full px-5 text-[14px] font-semibold text-[#5e5e5e] hover:text-[#181818] transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => handleSubmit()}
                className="flex h-10 items-center justify-center rounded-full bg-[#0a66c2] px-7 text-[14px] font-bold text-white transition-colors hover:bg-[#004182] shadow-xs border-none"
              >
                Publish Opportunity
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
