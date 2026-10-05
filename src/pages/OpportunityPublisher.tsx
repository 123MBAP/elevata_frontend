import { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useApp, Opportunity } from '../context/AppContext';
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
  AlertCircle,
  Clock,
  ExternalLink,
  DollarSign,
  FileCheck,
  FileSpreadsheet,
  FileBadge,
  MapPin,
  Mail,
  Phone,
  Globe,
  Share2,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import SelectOpportunityTypeModal, { OpportunityType as ModalOpportunityType } from '../assets/components/SelectOpportunityTypeModal';
import PublishOpportunityForm from '../assets/components/PublishOpportunityForm';
import ScheduleTrainingModal from '../assets/components/ScheduleTrainingModal';
import FormattedText from '../assets/components/ui/FormattedText';
import VirtualTrainingDeliveryModal from '../assets/components/VirtualTrainingDeliveryModal';
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

const getDocIcon = (docName: string, className = "w-4 h-4") => {
  const lower = docName.toLowerCase();
  if (lower.includes('tax') || lower.includes('compliance') || lower.includes('rra')) {
    return <FileCheck className={className} />;
  }
  if (lower.includes('financial') || lower.includes('ledger') || lower.includes('statement') || lower.includes('audit') || lower.includes('cashflow') || lower.includes('bank')) {
    return <FileSpreadsheet className={className} />;
  }
  if (lower.includes('license') || lower.includes('rdb') || lower.includes('registration') || lower.includes('certificate') || lower.includes('id') || lower.includes('profile')) {
    return <FileBadge className={className} />;
  }
  return <FileText className={className} />;
};

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
  const [availableCategories, setAvailableCategories] = useState<{ id: string; businessType: string }[]>([]);
  const [activeDeliveryTraining, setActiveDeliveryTraining] = useState<typeof trainings[0] | null>(null);

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await apiRequest('/categories');
        if (res?.success && Array.isArray(res.data?.categories)) {
          const formatted = res.data.categories.map((c: any) => ({
            id: c.id,
            businessType: c.businessType || c.cat_name
          })).filter((c: any) => c.businessType);
          setAvailableCategories(formatted);
        }
      } catch (e) {
        console.warn('Unable to load business categories:', e);
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

  // Viewing Opportunity Details Modal State
  const [viewingOpportunity, setViewingOpportunity] = useState<Opportunity | null>(null);
  const [viewModalTab, setViewModalTab] = useState<'overview' | 'terms' | 'eligibility' | 'docs' | 'matches'>('overview');

  // Database-backed portfolio preview
  const portfolioCandidates = useMemo(() => smes.map((sme) => {
    const hasTransactions = sme.sales.length > 0 || sme.monthlyData.length > 0;
    const hasInventory = sme.inventoryItems.length > 0;
    const hasContact = Boolean(sme.email);
    const checks = [
      { label: 'Business profile available', pass: Boolean(sme.name && sme.ownerName) },
      { label: 'Financial activity recorded', pass: hasTransactions },
      { label: 'Inventory records available', pass: hasInventory },
      { label: 'Business contact available', pass: hasContact }
    ];
    const passed = checks.filter((check) => check.pass).length;
    const matchPercent = Math.round((passed / checks.length) * 100);
    const missing = checks.filter((check) => !check.pass).map((check) => check.label);
    return {
      name: sme.name,
      sector: sme.sector,
      matchPercent,
      status: matchPercent >= 75 ? 'Profile Ready' : 'Profile Incomplete',
      checks,
      missing,
      readiness: matchPercent >= 75 ? 'Ready for criteria review' : 'Needs profile data',
      action: missing.length > 0
        ? `Complete: ${missing.join(', ')}.`
        : 'Review this business against the opportunity criteria.'
    };
  }), [smes]);

  // Training Form State (reusing unified ScheduleTrainingModal)
  const [isTrainingModalOpen, setIsTrainingModalOpen] = useState(false);
  const [trainingPrefill, setTrainingPrefill] = useState<Partial<any> | null>(null);

  // Selected Opportunity for detailed view/analytics
  const [selectedOppId, setSelectedOppId] = useState<string>('');

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

  // Action: Create Training from Gap Analysis
  const handleCreateTrainingFromGap = (missingRequirement: string, count: number) => {
    if (!selectedOpp) return;
    setTrainingPrefill({
      title: `Masterclass: Preparing ${missingRequirement} for Financing`,
      description: `A specialized capacity building workshop scheduled for the ${count} SMEs lacking completed ${missingRequirement.toLowerCase()} files to qualify for the ${selectedOpp.title} program.`,
      date: '2026-08-22',
      time: '09:00 AM - 11:30 AM',
      speaker: 'Dr. Agnes Kalibata (Director, AgroGrow)',
      targetAudience: ['Low Readiness SMEs', ...(selectedOpp.sectors || [])],
      opportunityId: selectedOpp.id,
      opportunityTitle: selectedOpp.title
    });
    setIsTrainingModalOpen(true);
  };

  // Action: Create Training for Specific Opportunity
  const handleCreateTrainingForOpp = (opp: Opportunity) => {
    setTrainingPrefill({
      title: `Capacity Building: Qualifying for ${opp.title}`,
      description: `A specialized training program organized by ${opp.institution} to guide SMEs on eligibility requirements, credit compliance checks, and document compilation to successfully unlock financing under the "${opp.title}" opportunity.`,
      date: '2026-08-25',
      time: '10:00 AM - 12:30 PM',
      speaker: 'Bank Credit Officer & Elevata Consultants',
      speakerOrg: opp.institution,
      targetAudience: ['Low Readiness SMEs', ...(opp.sectors || [])],
      opportunityId: opp.id,
      opportunityTitle: opp.title,
      meetingLink: 'https://meet.elevata.rw/live-capacity'
    });
    setIsTrainingModalOpen(true);
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
      const sectorMatch = (selectedOpp.sectors || []).includes(sme.sector);
      if (sectorMatch) score += 20;
      else missing.push('Sector Mismatch');

      // Check Revenue match
      const annualRevenue = sme.monthlyData.reduce((sum, d) => sum + d.revenue, 0) * 2;
      const revenueMatch = annualRevenue >= (selectedOpp.minRevenue || 0);
      if (revenueMatch) score += 20;
      else missing.push('Insufficient Revenue');

      // Check health score match
      const healthMatch = sme.healthScore >= (selectedOpp.minHealthScore || 50);
      if (healthMatch) score += 15;
      else missing.push('Lower Business Health Score');

      // Check readiness score
      const readinessMatch = sme.healthScore + 2 >= (selectedOpp.minReadinessScore || 50);
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

  // Active Applications for the viewing opportunity
  const viewingOppApplications = useMemo(() => {
    if (!viewingOpportunity) return [];
    return applications.filter(a => a.opportunityId === viewingOpportunity.id);
  }, [viewingOpportunity, applications]);

  // Matched SMEs specifically for the viewing opportunity modal
  const viewingOppMatchedSmes = useMemo(() => {
    if (!viewingOpportunity) return [];
    return smes.map(sme => {
      let score = 30;
      let missing: string[] = [];

      const sectorMatch = (viewingOpportunity.sectors || []).includes(sme.sector);
      if (sectorMatch) score += 20;
      else missing.push('Sector Mismatch');

      const annualRevenue = sme.monthlyData.reduce((sum, d) => sum + d.revenue, 0) * 2;
      const revenueMatch = annualRevenue >= (viewingOpportunity.minRevenue || 0);
      if (revenueMatch) score += 20;
      else missing.push('Insufficient Revenue');

      const healthMatch = sme.healthScore >= (viewingOpportunity.minHealthScore || 50);
      if (healthMatch) score += 15;
      else missing.push('Lower Business Health');

      const readinessMatch = sme.healthScore + 2 >= (viewingOpportunity.minReadinessScore || 50);
      if (readinessMatch) score += 15;
      else missing.push('Lower Readiness');

      const finalMatchPercent = Math.min(100, score);
      let status: 'Highly Qualified' | 'Needs Minor Improvements' | 'Needs Preparation' = 'Needs Preparation';
      if (finalMatchPercent >= 80) status = 'Highly Qualified';
      else if (finalMatchPercent >= 60) status = 'Needs Minor Improvements';

      return {
        ...sme,
        matchPercent: finalMatchPercent,
        status,
        missing
      };
    }).sort((a, b) => b.matchPercent - a.matchPercent);
  }, [viewingOpportunity, smes]);

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
          onPublish={async (data) => {
            try {
              const created = await publishOpportunity(data);
              triggerToast(`"${data.title}" published successfully.`);
              setViewMode('dashboard');
              if (created && created.id) {
                setSelectedOppId(created.id);
                setViewingOpportunity(created);
                setViewModalTab('overview');
              }
            } catch (error) {
              triggerToast(error instanceof Error ? error.message : 'Unable to publish this opportunity.', 'info');
            }
          }}
          onChangeType={() => setIsTypeModalOpen(true)}
          availableCategories={availableCategories}
          simulatedCandidates={portfolioCandidates}
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
            <span className="bg-[#2998d6]/10 text-[#2998d6] text-[11px] px-2.5 py-0.5 font-bold rounded-full border border-[#2998d6]/20 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2998d6] animate-pulse"></span>
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
            onClick={() => {
              setTrainingPrefill(null);
              setIsTrainingModalOpen(true);
            }}
            className="flex items-center justify-center space-x-1.5 px-4 py-2 rounded-full border border-[#666666] bg-white hover:bg-[#f3f2f0] text-xs font-semibold text-[#181818] transition-colors cursor-pointer"
          >
            <Video className="w-3.5 h-3.5 text-[#5e5e5e]" />
            <span>Schedule Training</span>
          </button>
          
          <button
            type="button"
            onClick={() => setIsTypeModalOpen(true)}
            className="flex items-center justify-center space-x-1.5 px-5 py-2 rounded-full bg-[#2998d6] hover:bg-[#1f85be] text-white text-xs font-bold transition-colors shadow-xs border-none cursor-pointer"
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
            iconBg: 'bg-[#2998d6]/10 text-[#2998d6]'
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
              <span>Published Programs & Opportunities</span>
              <span className="bg-white border border-[#e0e0e0] text-[#2998d6] text-xs px-2.5 py-0.5 rounded-full font-mono font-bold shadow-2xs">
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
                  className="w-full h-9 pl-9 pr-3 bg-white border border-[#666666] rounded-[4px] text-xs text-[#181818] placeholder:text-[#8c8c8c] focus:outline-none focus:border-[#2998d6] focus:ring-1 focus:ring-[#2998d6] transition-colors"
                />
              </div>
              <select
                value={activeCategory}
                onChange={e => setActiveCategory(e.target.value)}
                className="h-9 bg-white border border-[#666666] text-xs text-[#181818] px-3 rounded-[4px] focus:outline-none focus:border-[#2998d6] focus:ring-1 focus:ring-[#2998d6]"
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
                onClick={() => {
                  setSelectedOppId(opp.id);
                  setViewingOpportunity(opp);
                  setViewModalTab('overview');
                }}
                className={`p-5 bg-white rounded-[10px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] cursor-pointer transition flex flex-col justify-between hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] border ${
                  selectedOppId === opp.id
                    ? 'border-2 border-[#2998d6] ring-2 ring-[#2998d6]/10 bg-[#2998d6]/[0.015]'
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

                  <h3 className="text-xs font-bold text-[#181818] line-clamp-1 hover:text-[#2998d6] transition-colors">
                    {opp.title}
                  </h3>
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
                      <span className="px-2 py-0.5 rounded-full bg-[#2998d6]/10 text-[#2998d6] font-bold border border-[#2998d6]/20 text-[9px] flex items-center gap-1">
                        AI Matched
                      </span>
                    </div>
                  </div>

                  {/* 3-Button Action Row with View Details */}
                  <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-[#f3f2f0] mt-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOppId(opp.id);
                        setViewingOpportunity(opp);
                        setViewModalTab('overview');
                      }}
                      className="py-1.5 px-2 bg-sky-50 hover:bg-sky-100 text-[#0284c7] text-[11px] font-bold rounded-full transition-colors flex items-center justify-center gap-1 text-center border border-sky-200 cursor-pointer"
                      title="View Published Opportunity Details"
                    >
                      <Eye className="w-3.5 h-3.5 shrink-0" />
                      <span>View</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOppId(opp.id);
                        handleCreateTrainingForOpp(opp);
                      }}
                      className="py-1.5 px-2 bg-white hover:bg-[#f3f2f0] border border-[#666666] text-[11px] font-semibold text-[#181818] rounded-full transition-colors flex items-center justify-center gap-1 text-center cursor-pointer"
                      title="Schedule Masterclass"
                    >
                      <GraduationCap className="w-3.5 h-3.5 text-[#5e5e5e] shrink-0" />
                      <span>Training</span>
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
                      className="py-1.5 px-2 bg-[#2998d6] hover:bg-[#1f85be] text-[11px] font-bold text-white rounded-full transition-colors flex items-center justify-center gap-1 text-center border-none shadow-2xs cursor-pointer"
                      title="Match & Invite SMEs"
                    >
                      <Target className="w-3.5 h-3.5 text-white shrink-0" />
                      <span>Matches</span>
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
                    <span className="text-[10px] font-bold text-[#2998d6] uppercase tracking-widest flex items-center gap-1">
                      Elevata Match Engine
                    </span>
                    <span className="text-[11px] font-semibold text-[#5e5e5e]">Accuracy: 98%</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-1.5">
                    <h3 className="text-xs font-bold text-[#181818] line-clamp-1">
                      {selectedOpp?.title || 'Select an Opportunity'}
                    </h3>
                    {selectedOpp && (
                      <button
                        type="button"
                        onClick={() => {
                          setViewingOpportunity(selectedOpp);
                          setViewModalTab('overview');
                        }}
                        className="text-[#0284c7] hover:text-[#0369a1] text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                        title="Inspect full opportunity details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-[#5e5e5e] mt-0.5">Eligibility Match Analysis</p>
                </div>

                <div className="py-3 text-xs text-[#5e5e5e] leading-relaxed font-sans border-b border-[#e0e0e0] space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span>Sectors targeted:</span>
                    <span className="font-semibold text-[#181818]">{(selectedOpp?.sectors || []).join(', ') || 'All Sectors'}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span>Min Revenue:</span>
                    <span className="font-semibold text-[#181818]">{formatRWF(selectedOpp?.minRevenue || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span>Readiness threshold:</span>
                    <span className="font-semibold text-[#2998d6] font-mono">{selectedOpp?.minReadinessScore || 60}%</span>
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

              <div className="pt-4 border-t border-[#e0e0e0] space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    if (selectedOpp) {
                      setViewingOpportunity(selectedOpp);
                      setViewModalTab('overview');
                    }
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-white hover:bg-slate-50 text-[#181818] border border-[#666666] text-xs font-bold rounded-full transition-colors cursor-pointer"
                >
                  <Eye className="w-4 h-4 text-[#2998d6]" />
                  <span>Inspect Full Program Specs</span>
                </button>

                <a
                  href="#eligible-table"
                  className="w-full flex items-center justify-center gap-1 py-2.5 bg-[#2998d6] hover:bg-[#1f85be] text-white text-xs font-bold rounded-full shadow-xs transition-colors"
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
              className="px-4 py-1.5 bg-[#2998d6] text-white text-xs font-bold rounded-full hover:bg-[#1f85be] transition-colors shadow-xs cursor-pointer"
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
                        className="px-3 py-1 bg-white hover:bg-[#f3f2f0] text-[11px] font-semibold text-[#181818] border border-[#666666] rounded-full transition-colors cursor-pointer"
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
                    <Area type="monotone" dataKey="Views" stroke="#2998d6" fill="#e8f0fe" />
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
                  { label: 'Views', value: selectedOpp?.views || 100, pct: '100%', barBg: 'bg-[#2998d6]' },
                  { label: 'Interested', value: selectedOpp?.saved || 30, pct: `${Math.round(((selectedOpp?.saved || 30) / (selectedOpp?.views || 100)) * 100)}%`, barBg: 'bg-[#2998d6]/80' },
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
                        className="bg-white hover:bg-[#2998d6]/10 text-[#2998d6] font-bold px-3 py-1 rounded-full text-xs border border-[#2998d6]/30 transition-colors shrink-0 cursor-pointer"
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
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div>
            <h3 className="text-xs font-bold text-[#181818] uppercase tracking-wider">Virtual Training Manager</h3>
            <p className="text-[11px] text-[#5e5e5e] mt-0.5 font-sans">Schedule interactive capacity sessions to increase SME credit worthiness.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/banker/trainings"
              className="px-4 py-1.5 bg-[#2998d6] hover:bg-[#1f85be] text-white rounded-full text-xs font-bold transition-colors shadow-2xs flex items-center gap-1.5"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Full Training Studio</span>
            </Link>
            <button
              onClick={() => {
                setTrainingPrefill(null);
                setIsTrainingModalOpen(true);
              }}
              className="px-4 py-1.5 bg-white hover:bg-[#f3f2f0] border border-[#666666] rounded-full text-xs font-semibold text-[#181818] transition-colors shadow-2xs cursor-pointer"
            >
              Create Training Session
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active trainings list */}
          <div className="lg:col-span-2 space-y-3">
            {trainings.map((tr) => {
              const isLive = tr.status === 'live';
              const isCompleted = tr.status === 'completed';
              const waitingCount = tr.attendees?.filter(a => a.status === 'waiting').length || 0;

              return (
                <div key={tr.id} className="p-4 border border-[#e0e0e0] rounded-[10px] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-[#181818]">{tr.title}</h4>
                      {isLive ? (
                        <span className="bg-red-500/10 text-red-600 text-[9px] px-2 py-0.5 rounded-full border border-red-500/30 uppercase tracking-wider font-bold flex items-center gap-1 animate-pulse font-mono">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" /> LIVE NOW
                        </span>
                      ) : isCompleted ? (
                        <span className="bg-emerald-500/10 text-emerald-700 text-[9px] px-2 py-0.5 rounded-full border border-emerald-500/20 uppercase tracking-wider font-bold">
                          Completed
                        </span>
                      ) : (
                        <span className="bg-[#2998d6]/10 text-[#2998d6] text-[9px] px-2 py-0.5 rounded-full border border-[#2998d6]/20 uppercase tracking-wider font-bold">
                          Scheduled
                        </span>
                      )}
                      {waitingCount > 0 && (
                        <span className="bg-amber-500/10 text-amber-700 border border-amber-500/30 text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                          {waitingCount} waiting
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#5e5e5e] line-clamp-1">{tr.description}</p>
                    <div className="flex items-center gap-3 text-[11px] text-[#717171] pt-1 font-sans">
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-[#8c8c8c]" /> {tr.date} ({tr.time})</span>
                      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-[#8c8c8c]" /> {tr.speaker}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    <div className="text-right text-xs font-mono mr-1">
                      <span className="block font-bold text-[#181818]">{tr.participantsCount} enrolled</span>
                      <span className="text-[#717171] text-[10px]">Attended: {tr.attendees?.filter(a=>a.status==='admitted').length || 0}</span>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => setActiveDeliveryTraining(tr)}
                      className="px-3.5 py-1.5 bg-[#2998d6] hover:bg-[#1f85be] text-xs font-bold text-white rounded-full transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>{isLive ? 'Enter Live Room' : 'Deliver Training'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => triggerToast(`Invited target SME audience for: ${tr.title}`)}
                      className="px-3 py-1.5 border border-[#666666] hover:bg-[#f3f2f0] text-xs font-semibold text-[#181818] rounded-full transition-colors cursor-pointer"
                    >
                      Invite
                    </button>
                  </div>
                </div>
              );
            })}
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
                  className="w-full text-center py-2 bg-[#2998d6] hover:bg-[#1f85be] text-xs font-bold text-white rounded-full mt-2 transition-colors shadow-xs cursor-pointer"
                >
                  Invite Target Participants
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DETAILED PUBLISHED OPPORTUNITY VIEW MODAL (INSPECT PUBLISHED OPPORTUNITIES) */}
      {/* ========================================================================= */}
      {viewingOpportunity && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white border border-[#cbd5e1] rounded-2xl shadow-2xl max-w-4xl w-full my-4 sm:my-8 animate-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-200 bg-slate-50/70 flex items-start justify-between gap-4">
              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-sky-50 text-[#0284c7] font-bold text-[11px] px-2.5 py-0.5 rounded border border-sky-200 uppercase tracking-wider font-mono">
                    {viewingOpportunity.category}
                  </span>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded border flex items-center gap-1.5 ${
                    viewingOpportunity.status === 'Active'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${viewingOpportunity.status === 'Active' ? 'bg-emerald-600 animate-pulse' : 'bg-slate-400'}`} />
                    {viewingOpportunity.status || 'Active'}
                  </span>
                  {viewingOpportunity.createdAt && (
                    <span className="text-[11px] text-slate-400 font-mono">
                      Published: {viewingOpportunity.createdAt.split('T')[0]}
                    </span>
                  )}
                </div>

                <h2 className="text-lg sm:text-xl font-bold text-slate-900 font-heading">
                  {viewingOpportunity.title}
                </h2>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-1 text-slate-700">
                    <Building2 className="w-3.5 h-3.5 text-[#2998d6]" />
                    <span>{viewingOpportunity.institution}</span>
                  </span>
                  {viewingOpportunity.publisher?.representativeName && (
                    <span>· Lead: {viewingOpportunity.publisher.representativeName}</span>
                  )}
                  {viewingOpportunity.publisher?.operatingScope && (
                    <span>· Scope: {viewingOpportunity.publisher.operatingScope}</span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setViewingOpportunity(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200/60 transition-colors cursor-pointer shrink-0"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Stats Metric Strips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 p-4 bg-white border-b border-slate-100 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Max Financing</span>
                <span className="text-sm font-bold text-slate-900 font-mono block mt-0.5">
                  {viewingOpportunity.maxFunding || 'Not Specified'}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Closing Deadline</span>
                <span className="text-sm font-bold text-slate-900 font-mono block mt-0.5">
                  {viewingOpportunity.deadline || 'Open Enrollment'}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Applications</span>
                <span className="text-sm font-bold text-emerald-700 font-mono block mt-0.5">
                  {viewingOpportunity.applicationsCount || viewingOppApplications.length || 0} Submitted
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Min Readiness</span>
                <span className="text-sm font-bold text-[#2998d6] font-mono block mt-0.5">
                  {viewingOpportunity.minReadinessScore || 60}% Score
                </span>
              </div>
            </div>

            {/* Modal Folder Navigation Tabs */}
            <div className="flex items-center overflow-x-auto border-b border-slate-200 px-5 sm:px-6 bg-slate-50/50 space-x-2 text-xs">
              {[
                { id: 'overview', label: 'Program Overview', icon: <Info className="w-3.5 h-3.5" /> },
                { id: 'terms', label: 'Financial & Terms', icon: <Coins className="w-3.5 h-3.5" /> },
                { id: 'eligibility', label: 'Underwriting Criteria', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
                { id: 'docs', label: `Required Documents (${(viewingOpportunity.requiredDocs || []).length})`, icon: <FileText className="w-3.5 h-3.5" /> },
                { id: 'matches', label: `Matched SMEs & Apps (${viewingOppMatchedSmes.filter(s => s.status === 'Highly Qualified').length})`, icon: <Users className="w-3.5 h-3.5" /> }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setViewModalTab(tab.id as any)}
                  className={`py-3 px-3 font-semibold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                    viewModalTab === tab.id
                      ? 'border-[#2998d6] text-[#2998d6] font-bold bg-white'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Modal Full Scrollable Body */}
            <div className="p-5 sm:p-6 space-y-5 text-slate-700 text-xs flex-1">
              
              {/* TAB 1: OVERVIEW & DESCRIPTION */}
              {viewModalTab === 'overview' && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-[#2998d6]" />
                      <span>Detailed Opportunity Description</span>
                    </h3>
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 leading-relaxed">
                      {viewingOpportunity.description ? (
                        <FormattedText text={viewingOpportunity.description} />
                      ) : (
                        <p className="text-slate-400 italic">No detailed description provided.</p>
                      )}
                    </div>
                  </div>

                  {viewingOpportunity.benefits && (
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                        <span>Key Program Benefits & Incentives</span>
                      </h3>
                      <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/70 text-slate-800 leading-relaxed">
                        <FormattedText text={viewingOpportunity.benefits} />
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                      Targeted Business Sectors
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {(viewingOpportunity.sectors || []).length > 0 ? (
                        viewingOpportunity.sectors.map((s, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-white border border-slate-200 rounded-full font-semibold text-slate-700 text-xs shadow-2xs"
                          >
                            {s}
                          </span>
                        ))
                      ) : (
                        <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold">
                          Open to All Industry Sectors
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: FINANCIAL & TERMS */}
              {viewModalTab === 'terms' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2">
                        Financing Envelope
                      </h4>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-slate-500">Maximum Funding:</span>
                        <span className="font-bold text-slate-900 font-mono text-sm">{viewingOpportunity.maxFunding}</span>
                      </div>
                      {typeof viewingOpportunity.loanRate === 'number' && (
                        <div className="flex justify-between items-center py-1">
                          <span className="text-slate-500">Annual Interest Rate:</span>
                          <span className="font-bold text-emerald-700 font-mono">{viewingOpportunity.loanRate}% p.a.</span>
                        </div>
                      )}
                      {typeof viewingOpportunity.grantCoFundingPct === 'number' && (
                        <div className="flex justify-between items-center py-1">
                          <span className="text-slate-500">Co-funding Required:</span>
                          <span className="font-bold text-amber-700 font-mono">{viewingOpportunity.grantCoFundingPct}%</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center py-1">
                        <span className="text-slate-500">Disbursement Category:</span>
                        <span className="font-semibold text-slate-800">{viewingOpportunity.category}</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2">
                        Tenor & Collateral Structuring
                      </h4>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-slate-500">Financing Tenor / Term:</span>
                        <span className="font-bold text-slate-900 font-mono">
                          {viewingOpportunity.loanTerm ? `${viewingOpportunity.loanTerm} Months` : 'Flexible Term'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-slate-500">Grace Period:</span>
                        <span className="font-bold text-slate-900 font-mono">
                          {viewingOpportunity.loanGrace ? `${viewingOpportunity.loanGrace} Months` : 'Standard Grace Period'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-slate-500">Collateral Required:</span>
                        <span className={`font-bold ${viewingOpportunity.collateralRequired ? 'text-amber-700' : 'text-emerald-700'}`}>
                          {viewingOpportunity.collateralRequired ? `Yes (${viewingOpportunity.collateralType || 'Physical / Guarantee'})` : 'No Collateral Required'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: UNDERWRITING CRITERIA */}
              {viewModalTab === 'eligibility' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Min Annual Revenue</span>
                      <span className="text-sm font-bold text-slate-900 font-mono block mt-1">
                        {formatRWF(viewingOpportunity.minRevenue || 0)}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">or {formatRWF(Math.round((viewingOpportunity.minRevenue || 0) / 12))} / month</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Min Business Health Score</span>
                      <span className="text-sm font-bold text-emerald-700 font-mono block mt-1">
                        {viewingOpportunity.minHealthScore || 50} / 100
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">Financial consistency metric</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Min Loan Readiness Score</span>
                      <span className="text-sm font-bold text-[#2998d6] font-mono block mt-1">
                        {viewingOpportunity.minReadinessScore || 60}% Readiness
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">Audit & documentation score</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Business Age Minimum</span>
                      <span className="text-sm font-bold text-slate-900 font-mono block mt-1">
                        {viewingOpportunity.minAge ? `${viewingOpportunity.minAge} Months Operating` : 'Open to Startups'}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">RDB Legal Registration</span>
                      <span className={`text-sm font-bold block mt-1 ${viewingOpportunity.registrationRequired ? 'text-slate-900' : 'text-slate-500'}`}>
                        {viewingOpportunity.registrationRequired ? 'Mandatory RDB Certificate' : 'Optional / Informal OK'}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">RRA Tax Compliance</span>
                      <span className={`text-sm font-bold block mt-1 ${viewingOpportunity.taxCompliance ? 'text-slate-900' : 'text-slate-500'}`}>
                        {viewingOpportunity.taxCompliance ? 'Tax Clearance Required' : 'Not Required'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: REQUIRED DOCUMENTS */}
              {viewModalTab === 'docs' && (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-[#2998d6]" />
                    <span>Mandatory Verification Documents</span>
                  </h3>

                  {(viewingOpportunity.requiredDocs || []).length === 0 ? (
                    <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                      <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-xs text-slate-600">No specific documents specified</p>
                      <p className="text-[11px] mt-0.5">SMEs can apply directly with their standard Elevata business profile.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {viewingOpportunity.requiredDocs.map((doc, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 hover:bg-slate-100/70 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-sky-50 text-[#0284c7] flex items-center justify-center font-bold shrink-0 border border-sky-200">
                              {getDocIcon(doc)}
                            </div>
                            <div className="min-w-0">
                              <span className="font-semibold text-slate-900 text-xs block truncate">{doc}</span>
                              <span className="text-[10px] text-slate-400">Mandatory Verification File</span>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-mono font-bold text-[10px] border border-emerald-200 shrink-0">
                            Required
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: MATCHED SMES & APPLICATIONS */}
              {viewModalTab === 'matches' && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center justify-between">
                      <span>Received Applications for this Program ({viewingOppApplications.length})</span>
                    </h3>

                    {viewingOppApplications.length === 0 ? (
                      <p className="text-slate-400 text-xs italic bg-slate-50 p-4 rounded-xl border border-slate-200">
                        No applications submitted for this opportunity yet. Matched businesses will appear here upon submission.
                      </p>
                    ) : (
                      <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
                        <table className="w-full text-xs text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-[10px] uppercase">
                              <th className="py-2.5 px-3">Applicant Name</th>
                              <th className="py-2.5 px-3">Sector</th>
                              <th className="py-2.5 px-3">Readiness</th>
                              <th className="py-2.5 px-3">Requested Amount</th>
                              <th className="py-2.5 px-3">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {viewingOppApplications.map(app => (
                              <tr key={app.id} className="hover:bg-slate-50/70">
                                <td className="py-2.5 px-3 font-semibold text-slate-900">{app.smeName}</td>
                                <td className="py-2.5 px-3 text-slate-600">{app.smeSector}</td>
                                <td className="py-2.5 px-3 font-mono font-bold text-[#2998d6]">{app.smeReadiness}%</td>
                                <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                                  {app.requestedAmount ? formatRWF(app.requestedAmount) : 'Standard'}
                                </td>
                                <td className="py-2.5 px-3">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-[#0284c7] border border-sky-200">
                                    {app.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                      Top Qualified SMEs Matching This Opportunity ({viewingOppMatchedSmes.filter(s => s.status === 'Highly Qualified').length} businesses)
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {viewingOppMatchedSmes.slice(0, 6).map(sme => (
                        <div
                          key={sme.id}
                          className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <span className="font-semibold text-slate-900 text-xs block truncate">{sme.name}</span>
                            <span className="text-[10px] text-slate-500">{sme.sector} · Health {sme.healthScore}%</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 border ${
                            sme.status === 'Highly Qualified'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {sme.matchPercent}% Fit
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => {
                    const opp = viewingOpportunity;
                    setViewingOpportunity(null);
                    handleCreateTrainingForOpp(opp);
                  }}
                  className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-semibold rounded-full transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <GraduationCap className="w-4 h-4 text-[#2998d6]" />
                  <span>Schedule Masterclass</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerToast(`Sent invite notifications to all qualified SMEs for "${viewingOpportunity.title}".`);
                  }}
                  className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-semibold rounded-full transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>Invite Qualified SMEs</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setViewingOpportunity(null)}
                className="px-5 py-2 bg-[#2998d6] hover:bg-[#1f85be] text-white text-xs font-bold rounded-full transition-colors shadow-xs cursor-pointer self-end sm:self-auto"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* SCHEDULE VIRTUAL TRAINING MASTERCLASS MODAL (SHARED REUSABLE FORM) */}
      <ScheduleTrainingModal
        isOpen={isTrainingModalOpen}
        onClose={() => {
          setIsTrainingModalOpen(false);
          setTrainingPrefill(null);
        }}
        initialData={trainingPrefill}
        onSuccess={(title) => {
          triggerToast(`Virtual Training "${title}" scheduled successfully.`);
        }}
      />

      {/* LIVE VIRTUAL TRAINING DELIVERY MODAL (HOST / TRAINER WORKSPACE) */}
      {activeDeliveryTraining && (
        <VirtualTrainingDeliveryModal
          training={activeDeliveryTraining}
          onClose={() => setActiveDeliveryTraining(null)}
          onComplete={() => {
            triggerToast('Training session concluded. Certificates issued to all attendees.', 'success');
          }}
        />
      )}
    </div>
  );
}
