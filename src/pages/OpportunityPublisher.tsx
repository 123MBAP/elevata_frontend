import { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { formatRWF } from '../lib/mockData';
import { apiRequest } from '../lib/api';
import {
  Plus,
  Target,
  Users,
  Layers,
  Calendar,
  Video,
  TrendingUp,
  Search,
  ChevronRight,
  Loader2,
  Info,
  Landmark,
  Tag,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Quote,
  AlignLeft,
  Eye,
  Edit3,
  Wand2,
  Bookmark,
  GraduationCap,
  Coins,
  Gift,
  Smartphone,
  ShieldCheck,
  Building2,
  FileText,
  Sliders,
  Check,
  CheckCircle,
  X,
  AlertCircle
} from 'lucide-react';
import logo from '../assets/images/elevata_logo.png';
import SelectOpportunityTypeModal, { OpportunityType as ModalOpportunityType } from '../assets/components/SelectOpportunityTypeModal';
import PublishOpportunityForm from '../assets/components/PublishOpportunityForm';
import FormattedText from '../assets/components/ui/FormattedText';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { Card, CardContent } from '../assets/components/ui/card';

type OpportunityType = 'loan' | 'grant' | 'fintech' | 'insurance' | 'training' | 'guarantee' | 'savings' | 'other';

const DEFAULT_CATEGORIES = [
  { id: 'cat-1', businessType: 'Retail Shop' },
  { id: 'cat-2', businessType: 'Wholesale' },
  { id: 'cat-3', businessType: 'Restaurant' },
  { id: 'cat-4', businessType: 'Hotel' },
  { id: 'cat-5', businessType: 'Agriculture' },
  { id: 'cat-6', businessType: 'Manufacturing' },
  { id: 'cat-7', businessType: 'Construction' },
  { id: 'cat-8', businessType: 'Transport' },
  { id: 'cat-9', businessType: 'Education' },
  { id: 'cat-10', businessType: 'Healthcare' },
  { id: 'cat-11', businessType: 'ICT' },
  { id: 'cat-12', businessType: 'Finance' },
  { id: 'cat-13', businessType: 'Pharmacy' },
  { id: 'cat-14', businessType: 'Salon' },
  { id: 'cat-15', businessType: 'Fashion' },
  { id: 'cat-16', businessType: 'Electronics' },
  { id: 'cat-17', businessType: 'Hardware Store' },
  { id: 'cat-18', businessType: 'Supermarket' },
  { id: 'cat-19', businessType: 'Stationery' },
  { id: 'cat-20', businessType: 'Printing' },
  { id: 'cat-21', businessType: 'Other' }
];

export default function OpportunityPublisher() {
  const {
    opportunities,
    applications,
    trainings,
    smes,
    publishOpportunity,
    createTraining
  } = useApp();

  // Dynamic business categories from DB
  const [availableCategories, setAvailableCategories] = useState<{ id: string; businessType: string }[]>(DEFAULT_CATEGORIES);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('cat-5');

  // Form validation errors state
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

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await apiRequest('/categories');
        if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
          const formatted = res.data.map((c: any) => ({
            id: c.id,
            businessType: c.businessType || c.cat_name
          })).filter((c: any) => c.businessType);
          if (formatted.length > 0) {
            setAvailableCategories(formatted);
            if (!selectedCategoryId || selectedCategoryId === 'cat-5') {
              setSelectedCategoryId(formatted[0].id);
            }
          }
        }
      } catch (e) {
        // Fallback silently
      }
    }
    loadCategories();
  }, []);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  // Page view mode: 'dashboard' | 'create_form'
  const [viewMode, setViewMode] = useState<'dashboard' | 'create_form'>('dashboard');
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [selectedOppType, setSelectedOppType] = useState<ModalOpportunityType>('loan');
  const [selectedOppCategory, setSelectedOppCategory] = useState('Loan');
  
  // Step 2: Basic info
  const [oppName, setOppName] = useState('');
  const [oppDesc, setOppDesc] = useState('');
  const [descViewMode, setDescViewMode] = useState<'write' | 'preview'>('write');
  const descRef = useRef<HTMLTextAreaElement>(null);

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
    const template = `## Program Overview\nComprehensive financing program designed to provide accessible capital to growing businesses across target sectors.\n\n### Key Highlights & Benefits\n• Subsidized fixed interest rate with flexible repayment\n• Fast approval decision within 48 to 72 business hours\n• Dedicated credit advisory and capacity building support\n\n### Targeted Use of Funds\n1. Working capital & inventory expansion\n2. Equipment acquisition & technology upgrades\n3. Market distribution and scaling operations\n\n> Note: All eligible SMEs must have active financial bookkeeping records on Elevata.`;
    setOppDesc(template);
  };

  const [oppProvider, setOppProvider] = useState('Elevata Underwriting Corp');
  const [oppCategory, setOppCategory] = useState('Loan');
  const [oppStage, setOppStage] = useState('Growth');
  const [oppSectors, setOppSectors] = useState<string[]>(['Agriculture', 'Retail Shop']);
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

  // Handle step navigations (allows freely going through details even if not fully filled)
  const handleNextStep = () => {
    setErrors({});
    if (publishStep === 9) {
      setPublishStep(10);
      setMatchingAnimation(true);
      setTimeout(() => {
        setMatchingAnimation(false);
      }, 1500);
    } else {
      setPublishStep(prev => prev + 1);
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
    const finalTitle = oppName.trim() || `${oppCategory || 'Financing'} Facility`;
    const finalInstitution = oppProvider.trim() || 'Elevata Underwriting Corp';
    const finalDeadline = oppDeadline || '2026-10-31';
    const finalSectors = oppSectors && oppSectors.length > 0 ? oppSectors : ['All Sectors'];

    publishOpportunity({
      title: finalTitle,
      institution: finalInstitution,
      category: oppCategory || 'Loan',
      description: oppDesc || `${oppCategory} opportunity targeting growing local ventures.`,
      benefits: oppType === 'loan'
        ? `${loanRate || '8.5'}% Interest, ${loanTerm || '24'} months term, grace period of ${loanGrace || '3'} months.`
        : oppType === 'grant'
        ? `100% equity-free funding. Expected impact: ${grantImpact}`
        : 'Automated terms and capacity scaling benefits.',
      deadline: finalDeadline,
      maxFunding: fundingVal,
      sectors: finalSectors,
      categoryId: selectedCategoryId,
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
      loanRate: oppType === 'loan' ? parseFloat(loanRate) || 8.5 : undefined,
      loanTerm: oppType === 'loan' ? parseInt(loanTerm) || 24 : undefined,
      loanGrace: oppType === 'loan' ? parseInt(loanGrace) || 3 : undefined,
      grantCoFundingReq: oppType === 'grant' ? grantCoFundingReq : undefined,
      grantCoFundingPct: oppType === 'grant' && grantCoFundingReq ? parseFloat(grantCoFundingPct) : undefined,
      grantDuration: oppType === 'grant' ? parseInt(grantDuration) || 12 : undefined,
      appMethod: appMethod,
      appSteps: appSteps
    });

    triggerToast(`"${finalTitle}" published successfully! AI matches simulated and active.`);
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

  // Full page view rendering for Opportunity Creation Form
  if (viewMode === 'create_form') {
    return (
      <div className="min-h-screen bg-[#f3f2f0]">
        {toast && (
          <div className="fixed top-5 right-5 z-50 flex items-center gap-3 bg-[#181818] text-white px-5 py-3.5 rounded-[8px] shadow-[0_4px_20px_rgba(0,0,0,0.2)] text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-200 border border-[#333333]">
                       <span>{toast.message}</span>
          </div>
        )}

        <PublishOpportunityForm
          oppType={selectedOppType}
          oppCategory={selectedOppCategory}
          onCancel={() => setViewMode('dashboard')}
          onPublish={(data) => {
            publishOpportunity(data);
            triggerToast(`"${data.title}" published successfully! AI matches simulated and active.`);
            setViewMode('dashboard');
          }}
          onChangeType={() => setIsTypeModalOpen(true)}
          availableCategories={availableCategories}
          simulatedCandidates={simulatedMatches}
          formatRWF={formatRWF}
        />

        {/* SELECT TYPE POPUP MODAL (ACCESSIBLE VIA CHANGE TYPE) */}
        <SelectOpportunityTypeModal
          isOpen={isTypeModalOpen}
          onClose={() => setIsTypeModalOpen(false)}
          onSelectType={(type, category) => {
            setSelectedOppType(type);
            setSelectedOppCategory(category);
            setIsTypeModalOpen(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-[#f3f2f0] min-h-screen p-4 sm:p-6 pb-16 font-sans">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 bg-[#181818] text-white px-5 py-3.5 rounded-[8px] shadow-[0_4px_20px_rgba(0,0,0,0.2)] text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-200 border border-[#333333]">
             <span>{toast.message}</span>
        </div>
      )}

      {/* Header and Action Banner */}
      <div className="bg-white border border-[#e0e0e0] rounded-[10px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-[#181818] font-heading">Opportunity Publisher</h1>
            <span className="bg-[#0a66c2]/10 text-[#0a66c2] text-[11px] px-2.5 py-0.5 font-bold rounded-full border border-[#0a66c2]/20 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0a66c2] animate-pulse"></span>
              Live Platform
            </span>
          </div>
          <p className="text-[13px] text-[#5e5e5e] mt-1 font-sans">
            Configure financial products, evaluate real-time AI matches, and publish opportunities to the SME ecosystem.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setIsTrainingModalOpen(true)}
            className="flex items-center justify-center space-x-1.5 px-4 py-2 rounded-full border border-[#666666] bg-white hover:bg-[#f3f2f0] text-xs font-semibold text-[#181818] transition-colors"
          >
            <Video className="w-3.5 h-3.5 text-[#5e5e5e]" />
            <span>Schedule Training</span>
          </button>
          
          <button
            type="button"
            onClick={() => setIsTypeModalOpen(true)}
            className="flex items-center justify-center space-x-1.5 px-5 py-2 rounded-full bg-[#0a66c2] hover:bg-[#004182] text-white text-xs font-bold transition-colors shadow-xs border-none"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
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
            iconBg: 'bg-[#0a66c2]/10 text-[#0a66c2]'
          },
          {
            label: 'Eligible SMEs',
            value: totalEligibleSMEs,
            sub: 'Qualified in database',
            icon: <Target className="w-4 h-4" />,
            iconBg: 'bg-[#057642]/10 text-[#057642]'
          },
          {
            label: 'Applications Received',
            value: totalApplications,
            sub: '+3 this week',
            icon: <Users className="w-4 h-4" />,
            iconBg: 'bg-amber-500/10 text-amber-700'
          },
          {
            label: 'Upcoming Trainings',
            value: activeTrainingsCount,
            sub: 'Virtual sessions booked',
            icon: <Calendar className="w-4 h-4" />,
            iconBg: 'bg-indigo-500/10 text-indigo-700'
          }
        ].map((kpi, idx) => (
          <Card key={idx} className="bg-white border border-[#e0e0e0] shadow-[0_2px_8px_rgba(0,0,0,0.04)] rounded-[10px] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all duration-150">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-[#5e5e5e] uppercase tracking-wider block">{kpi.label}</span>
                <span className="text-2xl font-bold text-[#181818] block font-mono">{kpi.value}</span>
                <span className="text-[11px] text-[#717171] block">{kpi.sub}</span>
              </div>
              <div className={`p-3 rounded-full ${kpi.iconBg}`}>{kpi.icon}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Mid Section: Opportunity List & Live Matching */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Opportunity List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <h2 className="text-sm font-bold text-[#181818] flex items-center gap-2">
              <span>Published Programs</span>
              <span className="bg-white border border-[#e0e0e0] text-[#0a66c2] text-xs px-2.5 py-0.5 rounded-full font-mono font-bold shadow-2xs">
                {filteredOpportunities.length}
              </span>
            </h2>

            {/* Search + Category Filter */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-52">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8c8c8c]" />
                <input
                  type="text"
                  placeholder="Search opportunities..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 bg-white border border-[#666666] rounded-[4px] text-xs text-[#181818] placeholder:text-[#8c8c8c] focus:outline-none focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2] transition-colors"
                />
              </div>
              <select
                value={activeCategory}
                onChange={e => setActiveCategory(e.target.value)}
                className="h-9 bg-white border border-[#666666] text-xs text-[#181818] px-3 rounded-[4px] focus:outline-none focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
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
                className={`p-5 bg-white rounded-[10px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] cursor-pointer transition flex flex-col justify-between hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] border ${
                  selectedOppId === opp.id
                    ? 'border-2 border-[#0a66c2] ring-2 ring-[#0a66c2]/10 bg-[#0a66c2]/[0.015]'
                    : 'border-[#e0e0e0]'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-2.5">
                    <span className="text-[10px] font-bold bg-[#f3f2f0] text-[#181818] border border-[#e0e0e0] px-2.5 py-0.5 rounded-[4px] uppercase tracking-wider">
                      {opp.category}
                    </span>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-[4px] border ${
                      opp.status === 'Active' ? 'bg-[#057642]/10 text-[#057642] border-[#057642]/20' : 'bg-[#f3f2f0] text-[#5e5e5e] border-[#e0e0e0]'
                    }`}>
                      {opp.status}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-[#181818] line-clamp-1">{opp.title}</h3>
                  <p className="text-[11px] text-[#5e5e5e] mt-0.5 font-medium">by {opp.institution}</p>
                  
                  <p className="text-[12px] text-[#5e5e5e] mt-2.5 line-clamp-2 leading-relaxed font-sans">
                    {opp.description}
                  </p>
                </div>

                <div className="mt-4 pt-3.5 border-t border-[#e0e0e0] space-y-2.5">
                  <div className="grid grid-cols-3 gap-2 text-[10px]">
                    <div>
                      <span className="text-[#717171] block uppercase font-semibold text-[8.5px]">Max Funding</span>
                      <span className="font-bold text-[#181818] text-xs">{opp.maxFunding}</span>
                    </div>
                    <div>
                      <span className="text-[#717171] block uppercase font-semibold text-[8.5px]">Applications</span>
                      <span className="font-bold text-[#181818] text-xs">{opp.applicationsCount} received</span>
                    </div>
                    <div>
                      <span className="text-[#717171] block uppercase font-semibold text-[8.5px]">Closing Date</span>
                      <span className="font-bold text-[#181818] font-mono text-xs">{opp.deadline}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs text-[#717171] pt-1">
                    <div className="flex items-center space-x-3">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5 text-[#8c8c8c]" />
                        {opp.views} views
                      </span>
                      <span className="flex items-center gap-1">
                        <Bookmark className="w-3.5 h-3.5 text-[#8c8c8c]" />
                        {opp.saved} saved
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full bg-[#0a66c2]/10 text-[#0a66c2] font-bold border border-[#0a66c2]/20 text-[9px] flex items-center gap-1">
                         AI Matched
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-[#f3f2f0] mt-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOppId(opp.id);
                        handleCreateTrainingForOpp(opp);
                      }}
                      className="flex-1 py-1.5 px-2 bg-white hover:bg-[#f3f2f0] border border-[#666666] text-[11px] font-semibold text-[#181818] rounded-full transition-colors flex items-center justify-center gap-1.5 text-center"
                    >
                      <GraduationCap className="w-3.5 h-3.5 text-[#5e5e5e]" />
                      <span>Schedule Training</span>
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
                      className="flex-1 py-1.5 px-2 bg-[#0a66c2] hover:bg-[#004182] text-[11px] font-bold text-white rounded-full transition-colors flex items-center justify-center gap-1.5 text-center border-none shadow-2xs"
                    >
                      <Target className="w-3.5 h-3.5 text-white" />
                      <span>Match SMEs</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 1 Column: Live Opportunity AI Match Analyzer */}
        <div className="lg:col-span-1">
          <Card className="bg-white border border-[#e0e0e0] rounded-[10px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] h-full flex flex-col justify-between">
            <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
              <div>
                <div className="pb-3.5 border-b border-[#e0e0e0]">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#0a66c2] uppercase tracking-widest flex items-center gap-1">
                                           Elevata Match Engine
                    </span>
                    <span className="text-[11px] font-semibold text-[#5e5e5e]">Accuracy: 98%</span>
                  </div>
                  <h3 className="text-xs font-bold text-[#181818] mt-1.5 line-clamp-1">
                    {selectedOpp?.title || 'Select an Opportunity'}
                  </h3>
                  <p className="text-[11px] text-[#5e5e5e] mt-0.5">Eligibility Match Analysis</p>
                </div>

                <div className="py-3 text-xs text-[#5e5e5e] leading-relaxed font-sans border-b border-[#e0e0e0] space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span>Sectors targeted:</span>
                    <span className="font-semibold text-[#181818]">{selectedOpp?.sectors.join(', ')}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span>Min Revenue:</span>
                    <span className="font-semibold text-[#181818]">{formatRWF(selectedOpp?.minRevenue || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span>Readiness threshold:</span>
                    <span className="font-semibold text-[#0a66c2] font-mono">{selectedOpp?.minReadinessScore}%</span>
                  </div>
                </div>

                <div className="space-y-3 pt-3.5">
                  <h4 className="text-[11px] font-bold text-[#181818] uppercase tracking-wider">AI Categorized Matches</h4>
                  <div className="space-y-2.5">
                    {[
                      {
                        label: 'Highly Qualified',
                        badge: 'bg-[#057642]/10 text-[#057642] border-[#057642]/20',
                        count: matchedSMEs.filter(s => s.status === 'Highly Qualified').length,
                        smesList: matchedSMEs.filter(s => s.status === 'Highly Qualified').map(s => s.name).join(', ')
                      },
                      {
                        label: 'Needs Minor Improvements',
                        badge: 'bg-amber-500/10 text-amber-700 border-amber-200',
                        count: matchedSMEs.filter(s => s.status === 'Needs Minor Improvements').length,
                        smesList: matchedSMEs.filter(s => s.status === 'Needs Minor Improvements').map(s => s.name).join(', ')
                      },
                      {
                        label: 'Needs Preparation',
                        badge: 'bg-red-500/10 text-red-700 border-red-200',
                        count: matchedSMEs.filter(s => s.status === 'Needs Preparation').length,
                        smesList: matchedSMEs.filter(s => s.status === 'Needs Preparation').map(s => s.name).join(', ')
                      }
                    ].map((group, i) => (
                      <div key={i} className="p-3 bg-[#f3f2f0]/60 border border-[#e0e0e0] rounded-[8px] space-y-1 hover:bg-[#f3f2f0] transition-colors">
                        <div className="flex justify-between items-center">
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded border uppercase ${group.badge}`}>
                            {group.label}
                          </span>
                          <span className="text-xs font-bold text-[#181818] font-mono">{group.count} SMEs</span>
                        </div>
                        <p className="text-[11px] text-[#5e5e5e] truncate mt-0.5">
                          {group.smesList || 'None in current scope'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#e0e0e0]">
                <a
                  href="#eligible-table"
                  className="w-full flex items-center justify-center gap-1 py-2.5 bg-[#0a66c2] hover:bg-[#004182] text-white text-xs font-bold rounded-full shadow-xs transition-colors"
                >
                  View Matches Table
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Eligible SMEs Section */}
      <div id="eligible-table" className="pt-2">
        <div className="bg-white border border-[#e0e0e0] rounded-[10px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#e0e0e0] flex justify-between items-center bg-[#f3f2f0]/60">
            <div>
              <h3 className="text-xs font-bold text-[#181818] uppercase tracking-wider">AI Matched Eligible SMEs</h3>
              <p className="text-[11px] text-[#5e5e5e] mt-0.5 font-sans">Businesses matching current selection eligibility rules</p>
            </div>
            <button
              onClick={() => triggerToast('Invited all highly qualified SMEs to apply via automated messaging.')}
              className="px-4 py-1.5 bg-[#0a66c2] text-white text-xs font-bold rounded-full hover:bg-[#004182] transition-colors shadow-xs"
            >
              Invite All Matches
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#f3f2f0] border-b border-[#e0e0e0] text-[#5e5e5e] uppercase font-semibold text-[10px] tracking-wider">
                  <th className="px-5 py-3.5">Business Name</th>
                  <th className="px-5 py-3.5">Sector</th>
                  <th className="px-5 py-3.5">Loan Readiness</th>
                  <th className="px-5 py-3.5">Business Health</th>
                  <th className="px-5 py-3.5">Revenue Trend</th>
                  <th className="px-5 py-3.5">AI Fit status</th>
                  <th className="px-5 py-3.5">Match Details / Gaps</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e0e0e0]">
                {matchedSMEs.map((sme) => (
                  <tr key={sme.id} className="hover:bg-[#f3f2f0]/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-[#181818] text-xs">{sme.name}</div>
                      <div className="text-[11px] text-[#717171] mt-0.5">{sme.ownerName} · {sme.email}</div>
                    </td>
                    <td className="px-5 py-4 text-[#5e5e5e] font-medium">{sme.sector}</td>
                    <td className="px-5 py-4 font-mono font-bold text-[#181818]">
                      {sme.healthScore + 2}%
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold font-mono text-[#181818]">{sme.healthScore}</span>
                        <div className="w-16 h-1.5 bg-[#e0e0e0] rounded-full overflow-hidden shrink-0">
                          <div
                            className={`h-full rounded-full ${
                              sme.healthScore >= 80 ? 'bg-[#057642]' : sme.healthScore >= 60 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${sme.healthScore}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-0.5 font-bold ${
                        sme.healthTrend === 'up' ? 'text-[#057642]' : 'text-[#717171]'
                      }`}>
                        <TrendingUp className="w-3.5 h-3.5" />
                        {sme.revenueTrend}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded border text-[9.5px] font-bold uppercase ${
                        sme.status === 'Highly Qualified'
                           ? 'bg-[#057642]/10 text-[#057642] border-[#057642]/20'
                          : sme.status === 'Needs Minor Improvements'
                          ? 'bg-amber-500/10 text-amber-700 border-amber-200'
                          : 'bg-red-500/10 text-red-700 border-red-200'
                      }`}>
                        {sme.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {sme.missing.length === 0 ? (
                        <span className="text-[11px] text-[#057642] font-bold">100% Match: Met all criteria</span>
                      ) : (
                        <div className="text-[11px] text-[#5e5e5e] space-y-0.5">
                          <span className="font-mono text-[#5e5e5e] block truncate max-w-[170px]" title={sme.missing.join(', ')}>
                            {sme.missing.join(', ')}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => triggerToast(`Invited ${sme.name} to apply for "${selectedOpp?.title}".`)}
                        className="px-3 py-1 bg-white hover:bg-[#f3f2f0] text-[11px] font-semibold text-[#181818] border border-[#666666] rounded-full transition-colors"
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
      <div className="pt-2 space-y-4">
        <div>
          <h3 className="text-xs font-bold text-[#181818] uppercase tracking-wider">Opportunity Analytics</h3>
          <p className="text-[11px] text-[#5e5e5e] mt-0.5 font-sans">Performance and conversion demographics for {selectedOpp?.title}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Views & Applications over Time */}
          <Card className="bg-white border border-[#e0e0e0] rounded-[10px] shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <CardContent className="p-5">
              <h4 className="text-[11px] font-bold text-[#5e5e5e] uppercase tracking-wider mb-4">Engagement Trend</h4>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={viewsApplicationsChartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#717171' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#717171' }} />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6, borderColor: '#e0e0e0' }} />
                    <Area type="monotone" dataKey="Views" stroke="#0a66c2" fill="#e8f0fe" />
                    <Area type="monotone" dataKey="Applications" stroke="#057642" fill="#e6f4ea" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Middle Column: Funnel & Sector Distribution */}
          <Card className="bg-white border border-[#e0e0e0] rounded-[10px] shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <CardContent className="p-5">
              <h4 className="text-[11px] font-bold text-[#5e5e5e] uppercase tracking-wider mb-4">Conversion Funnel</h4>
              <div className="space-y-3.5 mt-2">
                {[
                  { label: 'Views', value: selectedOpp?.views || 100, pct: '100%', barBg: 'bg-[#0a66c2]' },
                  { label: 'Interested', value: selectedOpp?.saved || 30, pct: `${Math.round(((selectedOpp?.saved || 30) / (selectedOpp?.views || 100)) * 100)}%`, barBg: 'bg-[#0a66c2]/80' },
                  { label: 'Applications', value: selectedOpp?.applicationsCount || 5, pct: `${Math.round(((selectedOpp?.applicationsCount || 5) / (selectedOpp?.views || 100)) * 100)}%`, barBg: 'bg-amber-500' },
                  { label: 'Approved', value: 1, pct: '20% of apps', barBg: 'bg-[#057642]' }
                ].map((step, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between items-center text-xs text-[#5e5e5e] font-medium">
                      <span>{step.label}</span>
                      <span className="font-mono font-bold text-[#181818]">{step.value} ({step.pct})</span>
                    </div>
                    <div className="w-full bg-[#f3f2f0] h-2 rounded-full overflow-hidden border border-[#e0e0e0]">
                      <div
                        className={`h-full rounded-full ${step.barBg}`}
                        style={{ width: i === 0 ? '100%' : i === 1 ? '40%' : i === 2 ? '15%' : '5%' }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Right Column: Missing Requirements & Sector distribution */}
          <Card className="bg-white border border-[#e0e0e0] rounded-[10px] shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <CardContent className="p-5 flex flex-col justify-between h-full">
              <div>
                <h4 className="text-[11px] font-bold text-[#5e5e5e] uppercase tracking-wider mb-3.5">Why are SMEs not qualifying?</h4>
                <div className="space-y-2.5">
                  {missingRequirementData.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs p-3 bg-[#f3f2f0]/60 rounded-[8px] border border-[#e0e0e0]">
                      <div>
                        <span className="text-[#181818] font-bold block">{item.name}</span>
                        <span className="text-[11px] text-[#5e5e5e] font-medium">{item.count} matching SMEs missing this</span>
                      </div>
                      <button
                        onClick={() => handleCreateTrainingFromGap(item.name, item.count)}
                        className="bg-white hover:bg-[#0a66c2]/10 text-[#0a66c2] font-bold px-3 py-1 rounded-full text-xs border border-[#0a66c2]/30 transition-colors shrink-0"
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
      <div className="pt-2 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xs font-bold text-[#181818] uppercase tracking-wider">Virtual Training Manager</h3>
            <p className="text-[11px] text-[#5e5e5e] mt-0.5 font-sans">Schedule interactive capacity sessions to increase SME credit worthiness.</p>
          </div>
          <button
            onClick={() => {
              setTrTitle('');
              setTrDescription('');
              setIsTrainingModalOpen(true);
            }}
            className="px-4 py-1.5 bg-white hover:bg-[#f3f2f0] border border-[#666666] rounded-full text-xs font-semibold text-[#181818] transition-colors shadow-2xs"
          >
            Create Training Session
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active trainings list */}
          <div className="lg:col-span-2 space-y-3">
            {trainings.map((tr) => (
              <div key={tr.id} className="p-4 border border-[#e0e0e0] rounded-[10px] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-[#181818]">{tr.title}</h4>
                    <span className="bg-[#0a66c2]/10 text-[#0a66c2] text-[9px] px-2 py-0.5 rounded-full border border-[#0a66c2]/20 uppercase tracking-wider font-bold">
                      Virtual
                    </span>
                  </div>
                  <p className="text-[11px] text-[#5e5e5e] line-clamp-1">{tr.description}</p>
                  <div className="flex items-center gap-3 text-[11px] text-[#717171] pt-1 font-sans">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-[#8c8c8c]" /> {tr.date} ({tr.time})</span>
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-[#8c8c8c]" /> {tr.speaker}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                  <div className="text-right text-xs font-mono">
                    <span className="block font-bold text-[#181818]">{tr.participantsCount} registered</span>
                    <span className="text-[#717171] text-[11px]">Attendance rate: 85%</span>
                  </div>
                  
                  <button
                    onClick={() => triggerToast(`Invited target audience for: ${tr.title}`)}
                    className="px-3.5 py-1.5 border border-[#666666] hover:bg-[#f3f2f0] text-xs font-semibold text-[#181818] rounded-full transition-colors"
                  >
                    Invite Audience
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* AI Training Impact & Auto Participant recommendation */}
          <Card className="bg-white border border-[#e0e0e0] rounded-[10px] shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <CardContent className="p-5 space-y-4">
              <h4 className="text-[11px] font-bold text-[#181818] uppercase tracking-wider flex items-center gap-1.5 font-heading">
                           AI Capacity Impact
              </h4>
              <p className="text-xs text-[#5e5e5e] leading-relaxed font-sans">
                Virtual trainings improve average SME readiness scores by <strong className="text-[#057642] font-bold">+12%</strong>. We recommend targeting under-qualified SMEs for upcoming classes.
              </p>

              <div className="p-3.5 bg-[#f3f2f0]/60 border border-[#e0e0e0] rounded-[8px] space-y-2.5">
                <span className="text-[10px] font-bold text-[#5e5e5e] uppercase tracking-wider block">Recommended participants</span>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs text-[#181818] font-medium">
                    <span>Jean Bosco (Maize Agro)</span>
                    <span className="text-amber-700 font-semibold font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-200">Readiness 64%</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-[#181818] font-medium">
                    <span>David Mugisha (Logistics)</span>
                    <span className="text-red-700 font-semibold font-mono bg-red-500/10 px-2 py-0.5 rounded border border-red-200">Readiness 45%</span>
                  </div>
                </div>
                <button
                  onClick={() => triggerToast('Invited recommended participants to the next workshop.')}
                  className="w-full text-center py-2 bg-[#0a66c2] hover:bg-[#004182] text-xs font-bold text-white rounded-full mt-2 transition-colors shadow-xs"
                >
                  Invite Target Participants
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* SELECT OPPORTUNITY TYPE POPUP MODAL */}
      <SelectOpportunityTypeModal
        isOpen={isTypeModalOpen}
        onClose={() => setIsTypeModalOpen(false)}
        onSelectType={(type, category) => {
          setSelectedOppType(type);
          setSelectedOppCategory(category);
          setIsTypeModalOpen(false);
          setViewMode('create_form');
        }}
      />

      {/* CREATE TRAINING MODAL */}
      {isTrainingModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <form onSubmit={handleTrainingSubmit} className="w-full max-w-md rounded-[10px] bg-white border border-[#e0e0e0] shadow-[0_4px_24px_rgba(0,0,0,0.12)] overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-[#e0e0e0] bg-white flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <img src={logo} alt="Elevata" className="h-7 w-7 object-contain" />
                <div>
                  <h3 className="text-sm font-bold text-[#181818]">Schedule Virtual Capacity Session</h3>
                  <p className="text-[11px] text-[#5e5e5e] mt-0.5">Addressing SME eligibility matching gaps</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTrainingModalOpen(false)}
                className="p-1.5 text-[#5e5e5e] hover:text-[#181818] hover:bg-[#f3f2f0] rounded-full transition-colors"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs bg-white">
              <div>
                <label className="mb-1 block text-[13px] font-medium text-[#181818]">Training Title</label>
                <input
                  type="text"
                  placeholder="e.g. Masterclass: Preparing Tax Clearance & Financials"
                  value={trTitle}
                  onChange={e => setTrTitle(e.target.value)}
                  className="h-10 w-full rounded-[4px] border border-[#666666] bg-white px-3 text-[14px] text-[#181818] outline-none transition-colors focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-[13px] font-medium text-[#181818]">Speaker / Host</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Agnes Kalibata"
                  value={trSpeaker}
                  onChange={e => setTrSpeaker(e.target.value)}
                  className="h-10 w-full rounded-[4px] border border-[#666666] bg-white px-3 text-[14px] text-[#181818] outline-none transition-colors focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="mb-1 block text-[13px] font-medium text-[#181818]">Date</label>
                  <input
                    type="date"
                    value={trDate}
                    onChange={e => setTrDate(e.target.value)}
                    className="h-10 w-full rounded-[4px] border border-[#666666] bg-white px-3 text-[14px] font-mono text-[#181818] outline-none transition-colors focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[13px] font-medium text-[#181818]">Time</label>
                  <input
                    type="text"
                    value={trTime}
                    onChange={e => setTrTime(e.target.value)}
                    className="h-10 w-full rounded-[4px] border border-[#666666] bg-white px-3 text-[14px] text-[#181818] outline-none transition-colors focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[13px] font-medium text-[#181818]">Meeting Link</label>
                <input
                  type="text"
                  value={trLink}
                  onChange={e => setTrLink(e.target.value)}
                  className="h-10 w-full rounded-[4px] border border-[#666666] bg-white px-3 text-[14px] font-mono text-[#181818] outline-none transition-colors focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-[13px] font-medium text-[#181818]">Description Abstract</label>
                <textarea
                  placeholder="Describe workshop goals..."
                  rows={3}
                  value={trDescription}
                  onChange={e => setTrDescription(e.target.value)}
                  className="w-full rounded-[4px] border border-[#666666] bg-white p-3 text-[13px] text-[#181818] outline-none transition-colors focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2] leading-relaxed"
                  required
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-[#f3f2f0] border-t border-[#e0e0e0] flex justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsTrainingModalOpen(false)}
                className="flex h-10 items-center justify-center rounded-full border border-[#666666] bg-white px-5 text-[14px] font-semibold text-[#181818] transition-colors hover:bg-[#f3f2f0]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex h-10 items-center justify-center rounded-full bg-[#0a66c2] px-6 text-[14px] font-bold text-white transition-colors hover:bg-[#004182] shadow-xs border-none"
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
