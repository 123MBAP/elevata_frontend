import { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApp, Training, Opportunity, Application } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { formatRWF } from '../lib/mockData';
import { apiFile } from '../lib/api';
import {
  Sparkles,
  Search,
  CheckCircle,
  Send,
  Video,
  Award,
  Clock,
  FileText,
  Bookmark,
  Bell,
  UploadCloud,
  Sprout,
  Coins,
  Calendar,
  MapPin,
  TrendingUp,
  User,
  X,
  Building2,
  ShieldCheck,
  Trash2,
  AlertCircle,
  Check,
  Loader2,
  Mail,
  Phone,
  Globe,
  AlertTriangle,
  Lock,
  ShieldAlert,
  Info,
  FileUp,
  FileSpreadsheet,
  FileCheck,
  FileBadge,
  CheckCircle2,
  Paperclip,
  HelpCircle,
  Briefcase,
  Layers,
  ArrowRight,
  List,
  LayoutGrid,
  Download,
  ExternalLink,
  Filter,
  RefreshCw,
  FilePlus,
  Eye,
  XCircle,
  ChevronRight,
  Activity
} from 'lucide-react';
import { Card, CardContent } from '../assets/components/ui/card';
import FormattedText from '../assets/components/ui/FormattedText';
import VirtualTrainingAttendeeModal from '../assets/components/VirtualTrainingAttendeeModal';

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

const formatFileSize = (bytes?: number) => {
  if (!bytes || bytes <= 0) return 'File uploaded';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getAppStatusCategory = (status: string): 'pending' | 'under_review' | 'completed' | 'rejected' => {
  const s = (status || '').toLowerCase().trim();
  if (s === 'approved' || s === 'completed') return 'completed';
  if (s === 'under review' || s === 'in progress' || s === 'review' || s === 'under_review') return 'under_review';
  if (s === 'rejected' || s === 'declined' || s === 'denied') return 'rejected';
  return 'pending'; // 'submitted', 'pending', etc.
};

const getStatusBadge = (status: string) => {
  const category = getAppStatusCategory(status);
  switch (category) {
    case 'completed':
      return {
        label: 'Completed / Approved',
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
      };
    case 'under_review':
      return {
        label: 'Under Review',
        bg: 'bg-sky-50 text-[#0284c7] border-sky-200',
        icon: <Activity className="w-3.5 h-3.5 text-[#0284c7] animate-pulse" />
      };
    case 'rejected':
      return {
        label: 'Rejected / Action Required',
        bg: 'bg-rose-50 text-rose-700 border-rose-200',
        icon: <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
      };
    case 'pending':
    default:
      return {
        label: 'Pending Initial Review',
        bg: 'bg-amber-50 text-amber-800 border-amber-200',
        icon: <Clock className="w-3.5 h-3.5 text-amber-600" />
      };
  }
};

export interface ScoredOpportunity extends Opportunity {
  matchPercent: number;
  chance: 'High' | 'Medium' | 'Low';
  reasons: string[];
  missing: string[];
}

export interface OpportunityHubProps {
  initialTab?: 'marketplace' | 'readiness' | 'trainings' | 'applications';
}

export default function OpportunityHub({ initialTab }: OpportunityHubProps = {}) {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    opportunities,
    applications,
    refreshApplications,
    uploadApplicationDocument,
    trainings,
    activeSme,
    applyForOpportunity,
    bookmarkOpportunity,
    bookmarkedOpportunities
  } = useApp();

  // 90-Day evaluation policy calculation for SME account maturity
  const EVALUATION_PERIOD_DAYS = 90;
  const smeSystemDays = useMemo(() => {
    if (user?.createdAt) {
      const createdDate = new Date(user.createdAt);
      if (!isNaN(createdDate.getTime())) {
        const diffMs = Date.now() - createdDate.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        return Math.max(1, diffDays);
      }
    }
    if (typeof activeSme.age === 'number' && activeSme.age > 0) {
      return activeSme.age;
    }
    return 28; // Default initial trial period (under 90 days)
  }, [user?.createdAt, activeSme.age]);

  const isUnder90Days = smeSystemDays < EVALUATION_PERIOD_DAYS;
  const remainingEvaluationDays = Math.max(0, EVALUATION_PERIOD_DAYS - smeSystemDays);
  const evaluationProgressPercent = Math.min(100, Math.round((smeSystemDays / EVALUATION_PERIOD_DAYS) * 100));

  // Tab control inside SME Hub
  const [activeTab, setActiveTab] = useState<'marketplace' | 'readiness' | 'trainings' | 'applications'>(() => {
    const urlTab = searchParams.get('tab');
    if (urlTab === 'applications' || urlTab === 'readiness' || urlTab === 'trainings' || urlTab === 'marketplace') {
      return urlTab;
    }
    return initialTab || 'marketplace';
  });

  // Sync tab with URL search parameter or initialTab prop
  useEffect(() => {
    const urlTab = searchParams.get('tab');
    if (urlTab === 'applications' || urlTab === 'readiness' || urlTab === 'trainings' || urlTab === 'marketplace') {
      setActiveTab(urlTab);
    } else if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [searchParams, initialTab]);

  const switchTab = (tab: 'marketplace' | 'readiness' | 'trainings' | 'applications') => {
    setActiveTab(tab);
    const newParams = new URLSearchParams(searchParams);
    if (tab === 'marketplace') {
      newParams.delete('tab');
    } else {
      newParams.set('tab', tab);
    }
    setSearchParams(newParams, { replace: true });
  };

  // Applications Filter, Search, and Management State
  const [appStatusFilter, setAppStatusFilter] = useState<'all' | 'pending' | 'under_review' | 'completed' | 'rejected'>('all');
  const [appSearchTerm, setAppSearchTerm] = useState('');
  const [uploadModalApp, setUploadModalApp] = useState<Application | null>(null);
  const [uploadDocType, setUploadDocType] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [isRefreshingApps, setIsRefreshingApps] = useState(false);
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sectorFilter, setSectorFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Selected opportunity for details panel
  const [selectedOppId, setSelectedOppId] = useState<string | null>(null);

  // AI Assistant Chat state (simulated)
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    { sender: 'ai', text: 'Hello! I can answer questions about the selected opportunity, including its deadline and required files.' }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  // Training Center Modal
  const [activeLiveTraining, setActiveLiveTraining] = useState<Training | null>(null);

  // Toast / Status banner
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Document upload checklist state (interactivity to boost readiness score)
  const [taxClearanceUploaded, setTaxClearanceUploaded] = useState(false);
  const [auditedStatementsUploaded, setAuditedStatementsUploaded] = useState(false);
  const [profileCompleted, setProfileCompleted] = useState(false);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Readiness Calculations
  const calculatedReadiness = useMemo(() => {
    let score = activeSme.healthScore;
    if (taxClearanceUploaded) score += 5;
    if (auditedStatementsUploaded) score += 7;
    if (profileCompleted) score += 6;
    return Math.min(100, score);
  }, [activeSme.healthScore, taxClearanceUploaded, auditedStatementsUploaded, profileCompleted]);

  const calculatedDocScore = useMemo(() => {
    let base = 65;
    if (taxClearanceUploaded) base += 15;
    if (auditedStatementsUploaded) base += 10;
    if (profileCompleted) base += 10;
    return Math.min(100, base);
  }, [taxClearanceUploaded, auditedStatementsUploaded, profileCompleted]);

  // AI Matching for Marketplace List
  const scoredOpportunities = useMemo(() => {
    const list = opportunities.map(opp => {
      let score = 0;
      const reasons: string[] = [];
      const missing: string[] = [];

      // Sector Match
      const sectorMatch = opp.sectors.includes(activeSme.sector);
      if (sectorMatch) {
        score += 30;
        reasons.push(`Sector matches "${activeSme.sector}"`);
      } else {
        missing.push(`Targeted sectors are ${opp.sectors.join(', ')}`);
      }

      // Revenue Match
      const monthlyRevenue = activeSme.monthlyData[activeSme.monthlyData.length - 1]?.revenue ?? 0;
      if (monthlyRevenue >= opp.minRevenue) {
        score += 30;
        reasons.push('Monthly turnover satisfies criteria');
      } else {
        missing.push(`Requires min revenue of ${formatRWF(opp.minRevenue)}`);
      }

      // Business Health Score Match
      if (activeSme.healthScore >= opp.minHealthScore) {
        score += 20;
        reasons.push('Business risk score matches target profile');
      } else {
        missing.push(`Requires health score of ${opp.minHealthScore}`);
      }

      // Readiness Score Match
      if (calculatedReadiness >= opp.minReadinessScore) {
        score += 20;
        reasons.push('Loan readiness level matches requirements');
      } else {
        missing.push(`Requires loan readiness score of ${opp.minReadinessScore}%`);
      }

      const matchPercent = Math.min(100, score);
      let chance: 'High' | 'Medium' | 'Low' = 'Low';
      if (matchPercent >= 80) chance = 'High';
      else if (matchPercent >= 60) chance = 'Medium';

      return {
        ...opp,
        matchPercent,
        chance,
        reasons,
        missing
      };
    });

    // When under 90 days, do NOT rank by recommendation match score; keep neutral listing
    if (isUnder90Days) {
      return list;
    }
    return list.sort((a, b) => b.matchPercent - a.matchPercent);
  }, [opportunities, activeSme, calculatedReadiness, isUnder90Days]);

  const recommendedOpp = useMemo(() => {
    return isUnder90Days ? null : scoredOpportunities[0];
  }, [scoredOpportunities, isUnder90Days]);

  const selectedOpp = useMemo(() => {
    return scoredOpportunities.find(o => o.id === selectedOppId) || null;
  }, [scoredOpportunities, selectedOppId]);

  // Quick Apply Modal Form State
  const [applyingOpp, setApplyingOpp] = useState<ScoredOpportunity | null>(null);
  const [applyAmount, setApplyAmount] = useState<string>('5000000');
  const [applyPurpose, setApplyPurpose] = useState<string>('Working Capital & Inventory Purchase');
  const [applyTerm, setApplyTerm] = useState<string>('24');
  const [applyPhone, setApplyPhone] = useState<string>('');
  const [applyEmail, setApplyEmail] = useState<string>(activeSme.email || '');
  const [applyNotes, setApplyNotes] = useState<string>('');
  const [applyAgreed, setApplyAgreed] = useState<boolean>(true);
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, { file: File; fileName: string; fileSize: string; uploadedAt: string }>>({});
  const [isSubmittingApp, setIsSubmittingApp] = useState<boolean>(false);
  const [applyErrors, setApplyErrors] = useState<Record<string, string>>({});

  const handleOpenApplyModal = (opp: ScoredOpportunity) => {
    setApplyingOpp(opp);
    setApplyErrors({});
    if (opp.category === 'Grant') {
      setApplyAmount('10000000');
    } else if (opp.category === 'Loan') {
      setApplyAmount('5000000');
    } else {
      setApplyAmount('2500000');
    }

    setUploadedDocs({});
  };

  const handleFileUpload = (docName: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        setApplyErrors(prev => ({ ...prev, [docName]: 'File must be 10 MB or smaller.' }));
        e.target.value = '';
        return;
      }
      const sizeStr = file.size > 1024 * 1024 
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

      setUploadedDocs(prev => ({
        ...prev,
        [docName]: {
          file,
          fileName: file.name,
          fileSize: sizeStr,
          uploadedAt: 'Just now'
        }
      }));

      // Clear error for this doc if it was flagged
      if (applyErrors[docName] || applyErrors.documents) {
        setApplyErrors(prev => {
          const copy = { ...prev };
          delete copy[docName];
          delete copy.documents;
          return copy;
        });
      }
    }
  };

  const handleRemoveUploadedDoc = (docName: string) => {
    setUploadedDocs(prev => {
      const copy = { ...prev };
      delete copy[docName];
      return copy;
    });
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyingOpp) return;

    const newErrors: Record<string, string> = {};

    if (!applyAmount || Number(applyAmount) <= 0) {
      newErrors.applyAmount = 'Please enter a valid requested funding amount.';
    }

    if (!applyPhone.trim()) {
      newErrors.applyPhone = 'Contact phone number is required.';
    }

    if (!applyEmail.trim()) {
      newErrors.applyEmail = 'Contact email is required.';
    }

    if (!applyAgreed) {
      newErrors.applyAgreed = 'You must certify the accuracy of provided information.';
    }

    // Validate that required documents have been uploaded
    const missingRequiredDocs = (applyingOpp.requiredDocs || []).filter(doc => !uploadedDocs[doc]);
    if (missingRequiredDocs.length > 0) {
      newErrors.documents = `Please upload all required files (${missingRequiredDocs.join(', ')}).`;
    }

    if (Object.keys(newErrors).length > 0) {
      setApplyErrors(newErrors);
      triggerToast('Please complete all highlighted fields and upload required documents.');
      return;
    }

    setIsSubmittingApp(true);
    try {
      await applyForOpportunity({
        opportunityId: applyingOpp.id,
        requestedAmount: Number(applyAmount),
        purpose: applyPurpose,
        termMonths: Number(applyTerm),
        contactPhone: applyPhone,
        contactEmail: applyEmail,
        notes: applyNotes,
        documents: Object.fromEntries(
          Object.entries(uploadedDocs).map(([documentType, upload]) => [documentType, upload.file])
        )
      });
      setIsSubmittingApp(false);
      const title = applyingOpp.title;
      setApplyingOpp(null);
      triggerToast(`Application submitted successfully for "${title}"!`);
      switchTab('applications');
    } catch (error: unknown) {
      setIsSubmittingApp(false);
      const message = error instanceof Error ? error.message : 'Unable to submit the application.';
      setApplyErrors({ submit: message });
      triggerToast(message);
    }
  };

  // Application Filter & Statistics Calculations
  const applicationStats = useMemo(() => {
    const total = applications.length;
    const pending = applications.filter(a => getAppStatusCategory(a.status) === 'pending').length;
    const underReview = applications.filter(a => getAppStatusCategory(a.status) === 'under_review').length;
    const completed = applications.filter(a => getAppStatusCategory(a.status) === 'completed').length;
    const rejected = applications.filter(a => getAppStatusCategory(a.status) === 'rejected').length;
    return { total, pending, underReview, completed, rejected };
  }, [applications]);

  const filteredApplications = useMemo(() => {
    return applications.filter(app => {
      const category = getAppStatusCategory(app.status);
      if (appStatusFilter !== 'all' && category !== appStatusFilter) {
        return false;
      }
      if (!appSearchTerm.trim()) return true;
      const term = appSearchTerm.toLowerCase();
      const oppTitle = (app.opportunityTitle || '').toLowerCase();
      const inst = (app.institution || '').toLowerCase();
      const id = (app.id || '').toLowerCase();
      const purpose = (app.purpose || '').toLowerCase();
      return oppTitle.includes(term) || inst.includes(term) || id.includes(term) || purpose.includes(term);
    });
  }, [applications, appStatusFilter, appSearchTerm]);

  const handleRefreshApplications = async () => {
    setIsRefreshingApps(true);
    try {
      await refreshApplications();
      triggerToast('Applications portfolio synchronized with credit institutions.');
    } catch {
      triggerToast('Failed to refresh applications.');
    } finally {
      setIsRefreshingApps(false);
    }
  };

  const openUploadDocModal = (app: Application, docType = '') => {
    setUploadModalApp(app);
    setUploadDocType(docType);
    setUploadFile(null);
  };

  const handleUploadAdditionalDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadModalApp || !uploadFile) {
      triggerToast('Please select a document file to upload.');
      return;
    }
    const docType = uploadDocType.trim() || uploadFile.name;
    setIsUploadingDoc(true);
    try {
      await uploadApplicationDocument(uploadModalApp.id, docType, uploadFile);
      triggerToast(`Document "${docType}" uploaded successfully!`);
      setUploadModalApp(null);
      setUploadDocType('');
      setUploadFile(null);
    } catch (err: unknown) {
      triggerToast(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const handleDownloadDoc = async (doc: { id: string; fileName: string; downloadUrl?: string }) => {
    if (!doc.downloadUrl) return;
    try {
      const blob = await apiFile(doc.downloadUrl);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      triggerToast(err instanceof Error ? err.message : 'Unable to download file.');
    }
  };

  // Chatbot Q&A simulation
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedOpp) return;

    const userMsg = chatInput;
    setChatHistory(prev => [...prev, { sender: 'user', text: userMsg }]);
    setChatInput('');
    setIsTyping(true);

    setTimeout(() => {
      let response = '';
      const textLower = userMsg.toLowerCase();
      
      if (textLower.includes('rate') || textLower.includes('interest')) {
        response = selectedOpp.loanRate
          ? `The published interest rate is ${selectedOpp.loanRate}% per year${selectedOpp.loanGrace ? ` with a ${selectedOpp.loanGrace}-month grace period` : ''}.`
          : 'The publisher has not specified an interest rate for this opportunity.';
      } else if (textLower.includes('deadline') || textLower.includes('when')) {
        response = `The deadline for this opportunity is ${selectedOpp.deadline}. I recommend submitting your file 3 days prior.`;
      } else if (textLower.includes('document') || textLower.includes('file') || textLower.includes('upload')) {
        response = `You will need: ${selectedOpp.requiredDocs.join(', ')}. Currently, your tax compliance matches!`;
      } else if (textLower.includes('collateral') || textLower.includes('land')) {
        response = selectedOpp.collateralRequired
          ? `Collateral is required${selectedOpp.collateralType ? `: ${selectedOpp.collateralType}` : ''}.`
          : 'The published requirements do not require collateral.';
      } else {
        response = `The maximum published funding is ${selectedOpp.maxFunding}. Your current profile match is ${selectedOpp.matchPercent}%; the publisher makes the final eligibility decision.`;
      }

      setChatHistory(prev => [...prev, { sender: 'ai', text: response }]);
      setIsTyping(false);
    }, 1500);
  };

  // Launch Virtual Training Room
  const startWebinar = (tr: Training) => {
    setActiveLiveTraining(tr);
  };

  const closeWebinar = () => {
    setActiveLiveTraining(null);
  };

  const filteredMarketplace = useMemo(() => {
    return scoredOpportunities.filter(opp => {
      const matchSearch =
        opp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opp.institution.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opp.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = categoryFilter === 'All' || opp.category === categoryFilter;
      const matchSector =
        sectorFilter === 'All' ||
        opp.sectors.some(s => s.toLowerCase().includes(sectorFilter.toLowerCase()));
      return matchSearch && matchCat && matchSector;
    });
  }, [scoredOpportunities, searchTerm, categoryFilter, sectorFilter]);

  return (
    <div className="space-y-6 font-sans pb-12">
      {/* Toast popup */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 bg-[#1a2332] text-white px-5 py-3 rounded-xl shadow-2xl text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-200 border border-[#2d3b4e]">
          <Sparkles className="w-4.5 h-4.5 text-[#38bdf8] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. TOP ATTENTION / 90-DAY POLICY ADVISORY BANNER (Matching BusinessActivities style) */}
      {/* ========================================================================= */}
      {isUnder90Days ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-[4px] bg-[#ffa834] px-4 py-2.5 text-white shadow-xs transition-all">
          <div className="flex items-center gap-2.5 text-xs sm:text-[13px] font-semibold min-w-0">
            <AlertTriangle className="w-4.5 h-4.5 shrink-0 text-white animate-pulse" />
            <span className="font-bold">Evaluation Window Active:</span>
            <span className="truncate">
              {remainingEvaluationDays} Days remaining until automated AI matching unlocks (Day {smeSystemDays} of 90 completed).
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-white/20 border border-white/30 text-white">
              {evaluationProgressPercent}% Progress
            </span>
            <button
              type="button"
              onClick={() => {
                switchTab('marketplace');
                const listElement = document.getElementById('marketplace-list');
                if (listElement) listElement.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-2.5 py-1 rounded-[4px] bg-white text-slate-900 text-xs font-bold hover:bg-slate-100 transition shadow-xs cursor-pointer"
            >
              Browse Open Catalog
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-[4px] bg-[#1a2332] border border-[#2d3b4e] px-4 py-2.5 text-white shadow-xs transition-all">
          <div className="flex items-center gap-2.5 text-xs sm:text-[13px] font-medium text-slate-200 min-w-0">
            <Sparkles className="w-4.5 h-4.5 shrink-0 text-[#38bdf8] animate-pulse" />
            <span className="font-bold text-white">AI Credit Marketplace Active:</span>
            <span className="truncate">
              {scoredOpportunities.filter(o => o.matchPercent >= 60).length} financial facility programs match your trade ledger profile.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-[#2998d6] text-white">
              Readiness: {calculatedReadiness}%
            </span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. STATS RIBBON CARDS (Matching Accounting Metrics) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Available Programs */}
        <div
          onClick={() => switchTab('marketplace')}
          className={`accounting-card p-4 transition-all cursor-pointer hover:border-[#2998d6] flex items-center justify-between ${
            activeTab === 'marketplace' ? 'border-[#2998d6] ring-1 ring-[#2998d6] shadow-sm' : ''
          }`}
        >
          <div>
            <span className="accounting-label !text-[11px] uppercase tracking-wider font-semibold">Available Facilities</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl sm:text-2xl font-bold font-mono text-slate-900">{opportunities.length}</span>
              <span className="text-xs text-slate-500 font-medium">Programs</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Bank credit &amp; grants</span>
          </div>
          <div className="w-9 h-9 rounded-[4px] bg-sky-50 text-[#2998d6] flex items-center justify-center font-bold shrink-0 border border-sky-100">
            <Coins className="w-4.5 h-4.5" />
          </div>
        </div>

        {/* AI Matched Programs */}
        <div
          onClick={() => switchTab('marketplace')}
          className="accounting-card p-4 transition-all cursor-pointer hover:border-[#2998d6] flex items-center justify-between"
        >
          <div>
            <span className="accounting-label !text-[11px] uppercase tracking-wider font-semibold">AI Pre-Qualified</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-600">
                {isUnder90Days ? 'Baseline' : `${scoredOpportunities.filter(o => o.matchPercent >= 60).length} Matches`}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              {isUnder90Days ? 'Day 90 unlock' : 'Criteria >=60% met'}
            </span>
          </div>
          <div className="w-9 h-9 rounded-[4px] bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0 border border-emerald-100">
            <Sparkles className="w-4.5 h-4.5" />
          </div>
        </div>

        {/* Readiness Index */}
        <div
          onClick={() => switchTab('readiness')}
          className={`accounting-card p-4 transition-all cursor-pointer hover:border-[#2998d6] flex items-center justify-between ${
            activeTab === 'readiness' ? 'border-[#2998d6] ring-1 ring-[#2998d6] shadow-sm' : ''
          }`}
        >
          <div>
            <span className="accounting-label !text-[11px] uppercase tracking-wider font-semibold">Underwriting Readiness</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl sm:text-2xl font-bold font-mono text-[#2998d6]">{calculatedReadiness}%</span>
              <span className="text-xs text-slate-500 font-medium">Index</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Based on live trade files</span>
          </div>
          <div className="w-9 h-9 rounded-[4px] bg-sky-50 text-[#2998d6] flex items-center justify-center font-bold shrink-0 border border-sky-100">
            <TrendingUp className="w-4.5 h-4.5" />
          </div>
        </div>

        {/* Submitted Applications */}
        <div
          onClick={() => switchTab('applications')}
          className={`accounting-card p-4 transition-all cursor-pointer hover:border-[#2998d6] flex items-center justify-between ${
            activeTab === 'applications' ? 'border-[#2998d6] ring-1 ring-[#2998d6] shadow-sm' : ''
          }`}
        >
          <div>
            <span className="accounting-label !text-[11px] uppercase tracking-wider font-semibold">Active Applications</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl sm:text-2xl font-bold font-mono text-slate-900">{applications.length}</span>
              <span className="text-xs text-slate-500 font-medium">Files</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Under credit desk review</span>
          </div>
          <div className="w-9 h-9 rounded-[4px] bg-slate-100 text-slate-700 flex items-center justify-center font-bold shrink-0 border border-slate-200">
            <FileText className="w-4.5 h-4.5" />
          </div>
        </div>
      </div>

      {/* Recommendations Carousel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recommended Card Left 2 Columns */}
        <div className="lg:col-span-2">
          {isUnder90Days ? (
            /* 90-Day Policy: Locked Recommendations Placeholder */
            <div className="p-5 border border-amber-300 rounded-lg bg-amber-50/50 flex flex-col md:flex-row justify-between gap-5 shadow-sm">
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold bg-amber-600 text-white px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" />
                    AI Recommendation Locked
                  </span>
                  <span className="text-[10px] font-bold text-amber-800 font-mono">
                    {remainingEvaluationDays} Days Remaining
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900">Personalized Product Recommendations Pending</h3>
                  <p className="text-[10px] text-slate-500">System Policy: 90-Day Verified Trade Ledger Required</p>
                </div>

                <p className="text-[11px] text-slate-600 leading-relaxed max-w-lg">
                  Elevata AI does not bias or prioritize specific funding products during your first 90 days. This guarantees financial institutions receive verified, unskewed performance data when reviewing your profile.
                </p>

                <div className="p-3 bg-white border border-amber-200 rounded-lg text-[10px] text-slate-500 space-y-1.5 max-w-lg shadow-sm">
                  <span className="font-bold text-slate-700 uppercase tracking-wider block text-[9px] flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-600" />
                    How to ensure high match scores on Day 90
                  </span>
                  <ul className="list-disc pl-4 space-y-1 text-slate-600">
                    <li>Consistently register daily sales transactions and invoices.</li>
                    <li>Record operating expenses, rent, utilities, and supplier purchase bills.</li>
                    <li>Update your product inventory stock levels to verify operational turnover.</li>
                  </ul>
                </div>
              </div>

              <div className="flex flex-row md:flex-col justify-between items-center md:items-end gap-3 shrink-0 self-end md:self-auto pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 md:border-l md:pl-5 border-amber-200">
                <div className="text-left md:text-right font-mono">
                  <span className="text-[8px] text-slate-400 block uppercase font-semibold">Available Catalog</span>
                  <span className="text-base font-bold text-slate-900 block">{opportunities.length} Programs</span>
                  <span className="text-[9px] text-amber-800 block mt-1 font-semibold">Manual applications active</span>
                </div>

                <button
                  onClick={() => {
                    setActiveTab('marketplace');
                    const listElement = document.getElementById('marketplace-list');
                    if (listElement) listElement.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold rounded-md shadow-sm transition"
                >
                  Browse Catalog
                </button>
              </div>
            </div>
          ) : recommendedOpp ? (
            <div className="p-5 border border-emerald-500 ring-1 ring-emerald-500/10 rounded-lg bg-emerald-50/10 hover:bg-emerald-50/20 transition flex flex-col md:flex-row justify-between gap-5">
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold bg-emerald-500 text-white px-2 py-0.5 rounded uppercase tracking-wider">
                    Recommended Today
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 font-mono">
                    {recommendedOpp.matchPercent}% AI Match
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900">{recommendedOpp.title}</h3>
                  <p className="text-[10px] text-slate-400">Published by {recommendedOpp.institution} · Category: {recommendedOpp.category}</p>
                </div>

                <p className="text-[11px] text-slate-600 leading-relaxed max-w-lg">
                  {recommendedOpp.description}
                </p>

                <div className="p-3 bg-white border border-emerald-100 rounded-lg text-[10px] text-slate-500 space-y-1.5 max-w-lg shadow-sm">
                  <span className="font-bold text-slate-700 uppercase tracking-wider block text-[9px] flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-500" />
                    Why you match
                  </span>
                  <ul className="list-disc pl-4 space-y-1 text-slate-600">
                    <li>Your monthly turnover meets the eligibility threshold of {formatRWF(recommendedOpp.minRevenue)}.</li>
                    <li>Your business health score ({activeSme.healthScore}) indicates a low borrowing risk rating.</li>
                    <li>Your target sector ({activeSme.sector}) matches this program's criteria.</li>
                  </ul>
                </div>
              </div>

              <div className="flex flex-row md:flex-col justify-between items-center md:items-end gap-3 shrink-0 self-end md:self-auto pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 md:border-l md:pl-5 border-emerald-100">
                <div className="text-left md:text-right font-mono">
                  <span className="text-[8px] text-slate-400 block uppercase font-semibold">Max Funding</span>
                  <span className="text-base font-bold text-slate-900 block">{recommendedOpp.maxFunding}</span>
                  <span className="text-[9px] text-slate-400 block mt-1">Deadline: {recommendedOpp.deadline}</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedOppId(recommendedOpp.id)}
                    className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-[10px] font-bold text-slate-700 rounded-md transition cursor-pointer"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => handleOpenApplyModal(recommendedOpp)}
                    className="px-3.5 py-1.5 bg-[#2998d6] hover:bg-[#1f85be] text-white text-[10px] font-bold rounded-md shadow-xs transition cursor-pointer"
                  >
                    Quick Apply
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 border border-dashed rounded-lg text-slate-400 text-xs">
              No recommendations available.
            </div>
          )}
        </div>

        {/* Dynamic Navigation Tabs Menu & Notification Bell */}
        <div className="lg:col-span-1">
          <Card className="bg-white border border-slate-200 rounded-lg shadow-sm h-full flex flex-col justify-between">
            <CardContent className="p-4 flex flex-col justify-between h-full space-y-4">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                    <Bell className="w-3.5 h-3.5 text-slate-400" /> Notifications Feed
                  </span>
                  <span className="bg-rose-50 text-rose-600 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded border border-rose-100">
                    0 new
                  </span>
                </div>

                <div className="space-y-2.5 pt-3 max-h-48 overflow-y-auto pr-1">
                  <div className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-[10px] text-slate-400">
                    No notifications yet.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MAIN OPPORTUNITY BOOKS & MARKETPLACE CARD (Folder Tab Design) */}
      {/* ========================================================================= */}
      <div className="relative">
        {/* EYE-CATCHING FOLDER TABS BAR (Connected to Card Body) */}
        <div className="flex items-end overflow-x-auto scrollbar-none z-10 relative space-x-1 sm:space-x-1.5 -mb-[1px]">
          {[
            { id: 'marketplace', label: 'Opportunity Marketplace', count: opportunities.length, icon: <Coins className="w-4 h-4" />, color: 'text-[#2998d6]' },
            { id: 'readiness', label: 'My Loan Readiness', count: `${calculatedReadiness}%`, icon: <TrendingUp className="w-4 h-4" />, color: 'text-emerald-600' },
            { id: 'trainings', label: 'Virtual Academy', count: trainings.length, icon: <Award className="w-4 h-4" />, color: 'text-amber-600' },
            { id: 'applications', label: 'My Applications', count: applications.length, icon: <FileCheck className="w-4 h-4" />, color: 'text-purple-600' }
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => switchTab(tab.id as any)}
                className={`group relative flex items-center gap-2 sm:gap-2.5 px-4 sm:px-6 py-2.5 sm:py-3 rounded-t-[6px] text-xs sm:text-sm transition-all duration-150 cursor-pointer whitespace-nowrap select-none border-t border-x ${
                  isActive
                    ? 'bg-white text-slate-900 font-bold border-[#cbd5e1] border-b-white border-b-2 shadow-xs z-20 -mb-[1px] pt-3 sm:pt-3.5 pb-2.5 sm:pb-3 ring-0'
                    : 'bg-[#f1f5f9] hover:bg-[#e4eaf2] text-[#475569] font-medium border-[#cbd5e1] border-b-[#cbd5e1] hover:text-[#0f172a]'
                }`}
              >
                {/* Active Indicator Accent Top Strip */}
                {isActive && (
                  <span className="absolute top-0 left-0 right-0 h-[3px] bg-[#2998d6] rounded-t-[6px]" />
                )}

                <span className={`shrink-0 transition-transform group-hover:scale-110 ${isActive ? tab.color : 'text-slate-400 group-hover:text-slate-600'}`}>
                  {tab.icon}
                </span>

                <span className="tracking-tight">{tab.label}</span>

                {/* Count Badge */}
                <span
                  className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold transition-colors ${
                    isActive
                      ? 'bg-[#2998d6] text-white shadow-xs'
                      : 'bg-[#cbd5e1] text-[#334155] group-hover:bg-[#94a3b8] group-hover:text-white'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* MAIN WHITE CARD CONTAINER */}
        <div id="marketplace-list" className="accounting-card p-5 sm:p-7 relative z-0 border-[#cbd5e1] rounded-t-none space-y-5">
          
          {/* TAB 1: Marketplace */}
          {activeTab === 'marketplace' && (
            <div className="space-y-5">
              {/* Card Header Title & Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#e2e8f0]">
                <div>
                  <h2 className="text-xl sm:text-2xl font-normal text-[#1e293b] font-heading">
                    Browse Financial Opportunities &amp; Facilities
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isUnder90Days
                      ? `Catalog open for standard manual inspection (${remainingEvaluationDays} days remaining in baseline evaluation window).`
                      : 'Verified pre-qualified grants, commercial credit lines, and working capital facilities.'}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
                    className="accounting-btn-secondary"
                    title="Toggle View Mode"
                  >
                    {viewMode === 'grid' ? (
                      <>
                        <List className="w-3.5 h-3.5" />
                        <span>Table View</span>
                      </>
                    ) : (
                      <>
                        <LayoutGrid className="w-3.5 h-3.5" />
                        <span>Card Grid</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('readiness')}
                    className="accounting-btn-primary"
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Check Readiness</span>
                  </button>
                </div>
              </div>

              {/* Top 3 Solid Cyan Select Dropdowns / Filters Strip (matching BusinessActivities 3 selects) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="accounting-label">Facility Category</label>
                  <select
                    value={categoryFilter}
                    onChange={e => setCategoryFilter(e.target.value)}
                    className="accounting-select w-full"
                  >
                    <option value="All">All Categories ({opportunities.length} Available)</option>
                    <option value="Loan">Credit Loans &amp; Term Facilities</option>
                    <option value="Grant">Direct Grants &amp; Subsidies</option>
                    <option value="Savings Product">Savings &amp; Treasury Products</option>
                    <option value="Investment">Equity &amp; Growth Investment</option>
                  </select>
                </div>

                <div>
                  <label className="accounting-label">Target Industry Sector</label>
                  <select
                    value={sectorFilter}
                    onChange={e => setSectorFilter(e.target.value)}
                    className="accounting-select w-full"
                  >
                    <option value="All">All Industry Sectors</option>
                    <option value="Agriculture">Agriculture &amp; Agri-Processing</option>
                    <option value="Retail">Retail &amp; Wholesale Trade</option>
                    <option value="Manufacturing">Manufacturing &amp; Industry</option>
                    <option value="Technology">Technology &amp; Digital Services</option>
                    <option value="Logistics">Logistics &amp; Transport</option>
                  </select>
                </div>

                <div>
                  <label className="accounting-label">Search Opportunity Catalog</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search program, bank, criteria..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="accounting-input w-full pl-8"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    {searchTerm && (
                      <button
                        type="button"
                        onClick={() => setSearchTerm('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* View Mode 1: Card Grid */}
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredMarketplace.map(opp => (
                    <div
                      key={opp.id}
                      className="accounting-card p-4 transition-all duration-150 flex flex-col justify-between hover:shadow-md hover:border-[#2998d6] border-[#cbd5e1]"
                    >
                      <div className="space-y-2.5">
                        <div className="flex justify-between items-start">
                          <span className="text-[9.5px] font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-[4px] uppercase tracking-wider font-mono border border-slate-200">
                            {opp.category}
                          </span>
                          
                          <button
                            type="button"
                            onClick={() => {
                              bookmarkOpportunity(opp.id);
                              triggerToast(bookmarkedOpportunities.includes(opp.id) ? 'Removed bookmark.' : 'Opportunity bookmarked!');
                            }}
                            className={`p-1 rounded text-slate-400 hover:text-[#2998d6] transition cursor-pointer ${
                              bookmarkedOpportunities.includes(opp.id) ? 'text-[#2998d6] fill-[#2998d6]' : ''
                            }`}
                            title="Bookmark opportunity"
                          >
                            <Bookmark className="w-4 h-4" />
                          </button>
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-slate-900 leading-snug line-clamp-1 hover:text-[#2998d6] transition-colors">
                            {opp.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                            <Building2 className="w-3 h-3 text-[#2998d6]" />
                            <span className="truncate">{opp.institution}</span>
                          </p>
                        </div>

                        <p className="text-xs text-[#5e5e5e] line-clamp-2 leading-relaxed">
                          {opp.description}
                        </p>

                        <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
                          <div className="p-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-[4px]">
                            <span className="text-slate-400 block text-[8px] uppercase tracking-wider font-semibold">
                              {isUnder90Days ? 'Status' : 'AI Match'}
                            </span>
                            {isUnder90Days ? (
                              <span className="font-bold text-emerald-700 font-mono text-[9.5px] flex items-center gap-1 mt-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> Open Catalog
                              </span>
                            ) : (
                              <span className="font-bold text-emerald-600 font-mono text-[11px] block mt-0.5">
                                {opp.matchPercent}% Match
                              </span>
                            )}
                          </div>
                          <div className="p-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-[4px]">
                            <span className="text-slate-400 block text-[8px] uppercase tracking-wider font-semibold">
                              {isUnder90Days ? 'Channel' : 'Approval Chance'}
                            </span>
                            {isUnder90Days ? (
                              <span className="font-bold text-slate-700 font-mono text-[9.5px] block mt-0.5">Direct Review</span>
                            ) : (
                              <span className={`font-bold font-mono text-[10.5px] block mt-0.5 ${
                                opp.chance === 'High' ? 'text-emerald-600' : opp.chance === 'Medium' ? 'text-amber-600' : 'text-rose-600'
                              }`}>{opp.chance} Chance</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-[#e2e8f0] flex justify-between items-center text-xs">
                        <div>
                          <span className="text-[9px] text-slate-400 block uppercase font-mono">Max Facility</span>
                          <span className="font-bold text-slate-900 font-mono text-xs">{opp.maxFunding}</span>
                        </div>
                        
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedOppId(opp.id)}
                            className="accounting-btn-secondary !h-7 !text-[11px] !px-2.5"
                          >
                            Details
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenApplyModal(opp)}
                            className="accounting-btn-primary !h-7 !text-[11px] !px-3"
                          >
                            Quick Apply
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredMarketplace.length === 0 && (
                    <div className="md:col-span-2 lg:col-span-3 rounded-[4px] border border-dashed border-[#cbd5e1] p-10 text-center text-xs text-slate-500">
                      {opportunities.length === 0
                        ? 'No opportunities have been published yet.'
                        : 'No opportunities match the current filter criteria.'}
                    </div>
                  )}
                </div>
              ) : (
                /* View Mode 2: Audit Ledger Table (Matching BusinessActivities) */
                <div className="overflow-x-auto border border-[#cbd5e1] rounded-[4px] bg-white">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#f1f5f9] text-[#475569] font-bold border-b border-[#cbd5e1] text-[11px] uppercase tracking-wider">
                        <th className="py-2.5 px-3 w-10 text-center">#</th>
                        <th className="py-2.5 px-3 min-w-[220px]">Program Title &amp; Facility</th>
                        <th className="py-2.5 px-3 w-36">Financial Institution</th>
                        <th className="py-2.5 px-3 w-28">Category</th>
                        <th className="py-2.5 px-3 w-32 font-mono text-right">Max Funding</th>
                        <th className="py-2.5 px-3 w-24 text-center">AI Match</th>
                        <th className="py-2.5 px-3 w-28 font-mono">Deadline</th>
                        <th className="py-2.5 px-3 w-36 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e2e8f0] bg-white">
                      {filteredMarketplace.map((opp, idx) => (
                        <tr key={opp.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2.5 px-3 text-center font-mono text-slate-400 font-bold">{idx + 1}</td>
                          <td className="py-2.5 px-3">
                            <div className="space-y-0.5">
                              <p className="font-bold text-slate-900 leading-tight">{opp.title}</p>
                              <p className="text-[11px] text-slate-500 line-clamp-1">{opp.description}</p>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-700">
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-[#2998d6]" />
                              <span>{opp.institution}</span>
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded text-[10px] font-bold uppercase font-mono">
                              {opp.category}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 text-[11px]">
                            {opp.maxFunding}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {isUnder90Days ? (
                              <span className="inline-block px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-mono font-bold text-[9.5px]">
                                Open
                              </span>
                            ) : (
                              <span className="inline-block px-1.5 py-0.5 bg-sky-50 text-[#2998d6] border border-sky-200 rounded font-mono font-bold text-[10px]">
                                {opp.matchPercent}%
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                            {opp.deadline}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => setSelectedOppId(opp.id)}
                                className="accounting-btn-secondary !h-7 !text-[11px] !px-2"
                              >
                                Details
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenApplyModal(opp)}
                                className="accounting-btn-primary !h-7 !text-[11px] !px-2.5"
                              >
                                Apply
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        {/* TAB 2: My Readiness */}
        {activeTab === 'readiness' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">My Loan Readiness</h3>
                <p className="text-[10px] text-slate-400 mt-0.5 font-sans">Audit analysis scorecard linked to your active trade transactions.</p>
              </div>
            </div>

            {/* Circular Gauges Row */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { label: 'Overall Readiness', value: calculatedReadiness, sub: 'Credit capability rating' },
                { label: 'Business Health', value: activeSme.healthScore, sub: 'Stability metric' },
                { label: 'Documentation', value: calculatedDocScore, sub: 'KYC & License checklist' },
                { label: 'Tax Compliance', value: taxClearanceUploaded ? 100 : 70, sub: 'RRA clearance status' },
                { label: 'Financial Records', value: 90, sub: 'Digital transaction logging' }
              ].map((gauge, i) => (
                <Card key={i} className="bg-white border border-slate-200 shadow-sm rounded-lg hover:shadow-md transition">
                  <CardContent className="p-4 flex flex-col items-center text-center space-y-3">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block h-6 overflow-hidden">
                      {gauge.label}
                    </span>

                    {/* Radial SVG Gauge */}
                    <div className="relative flex items-center justify-center shrink-0">
                      <svg className="w-16 h-16 -rotate-90">
                        <circle cx="32" cy="32" r="26" stroke="#F1F5F9" strokeWidth="4.5" fill="transparent" />
                        <circle
                          cx="32" cy="32" r="26"
                          stroke={gauge.value >= 80 ? '#10B981' : gauge.value >= 60 ? '#F59E0B' : '#EF4444'}
                          strokeWidth="4.5"
                          fill="transparent"
                          strokeDasharray={2 * Math.PI * 26}
                          strokeDashoffset={((100 - gauge.value) / 100) * (2 * Math.PI * 26)}
                          strokeLinecap="round"
                          className="transition-all duration-500"
                        />
                      </svg>
                      <span className="absolute text-xs font-bold text-slate-800 font-mono">{gauge.value}%</span>
                    </div>

                    <p className="text-[9px] text-slate-400 mt-1">{gauge.sub}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* AI Suggestions Checklist */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 space-y-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4.5 h-4.5 text-[#2998d6]" />
                AI-Suggested Actions to Increase Score
              </h3>
              
              <div className="space-y-3">
                {[
                  {
                    id: 'tax',
                    title: 'Upload Q3 RRA Tax Clearance Certificate',
                    desc: 'Submit your tax clearance statement to boost your Tax Compliance score to 100% (+30% weight).',
                    uploaded: taxClearanceUploaded,
                    action: () => {
                      setTaxClearanceUploaded(true);
                      triggerToast('Tax Clearance Certificate uploaded. Compliance score increased to 100%!');
                    }
                  },
                  {
                    id: 'audited',
                    title: 'Upload Audited Inventory Ledger Statement',
                    desc: 'Completes verified asset tracking records, improving borrowing capacity index by +15%.',
                    uploaded: auditedStatementsUploaded,
                    action: () => {
                      setAuditedStatementsUploaded(true);
                      triggerToast('Audited financials uploaded successfully. Documentation score updated.');
                    }
                  },
                  {
                    id: 'profile',
                    title: 'Complete Digital Business profile detail',
                    desc: 'Add location references and verify owner registration credentials.',
                    uploaded: profileCompleted,
                    action: () => {
                      setProfileCompleted(true);
                      triggerToast('Business profile completed. Readiness index improved.');
                    }
                  }
                ].map((item) => (
                  <div key={item.id} className="p-3 bg-white border border-slate-200 rounded-lg flex justify-between items-center gap-4 hover:shadow-xs transition">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {item.uploaded ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : (
                          <Clock className="w-4 h-4 text-slate-300 shrink-0" />
                        )}
                        <h4 className={`text-xs font-bold ${item.uploaded ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                          {item.title}
                        </h4>
                      </div>
                      <p className="text-[10px] text-slate-400 pl-6">{item.desc}</p>
                    </div>

                    {!item.uploaded && (
                      <button
                        onClick={item.action}
                        className="accounting-btn-primary !h-7 !text-[11px] !px-3 !bg-[#2998d6] hover:!bg-[#1f85be] flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>Action</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Trainings */}
        {activeTab === 'trainings' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Virtual Capacity Academy</h3>
                <p className="text-[11px] text-slate-500 mt-0.5 font-sans">
                  Attend interactive live masterclasses delivered by partner financial institutions and receive accredited certificates (+12% readiness boost).
                </p>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-center">
                <Link
                  to="/trainings"
                  className="accounting-btn-primary !h-8 !text-xs !px-4 !bg-[#2998d6] hover:!bg-[#1f85be] flex items-center gap-1.5 shadow-xs"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Full Academy Hub</span>
                </Link>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold font-mono">
                  Accredited
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {trainings.map(tr => {
                const isLive = tr.status === 'live';
                const isCompleted = tr.completed || tr.attended;

                return (
                  <div key={tr.id} className="accounting-card p-4 flex flex-col justify-between hover:shadow-md transition-all duration-150 space-y-3">
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-start">
                        {isLive ? (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border bg-red-50 text-red-600 border-red-200 flex items-center gap-1 font-mono uppercase tracking-wider animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" /> LIVE NOW
                          </span>
                        ) : isCompleted ? (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200 uppercase tracking-wider flex items-center gap-1">
                            <Check className="w-3 h-3" /> Certified
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border bg-sky-50 text-[#2998d6] border-sky-100 uppercase tracking-wider">
                            Scheduled
                          </span>
                        )}
                        {tr.hasCertificate && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            <Award className="w-3.5 h-3.5 text-amber-500" />
                            +12% Readiness
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 leading-snug">{tr.title}</h4>
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{tr.description}</p>
                      
                      <div className="space-y-1.5 text-[11px] text-slate-500 font-sans border-t border-slate-100 pt-2.5">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{tr.date} · {tr.time}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{tr.speaker}</span>
                        </div>
                        {tr.opportunityTitle && (
                          <div className="flex items-center gap-1.5 text-[10px] text-[#2998d6] font-semibold">
                            <ShieldCheck className="w-3 h-3 text-[#2998d6] shrink-0" />
                            <span className="truncate">Qualifies for: {tr.opportunityTitle}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-slate-400 font-mono">
                        {tr.participantsCount} enrolled
                      </span>
                      <button
                        type="button"
                        onClick={() => startWebinar(tr)}
                        className={`px-3.5 py-1.5 text-xs font-bold rounded transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                          isLive
                            ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                            : isCompleted
                            ? 'bg-[#1a2332] hover:bg-slate-800 text-slate-200'
                            : 'accounting-btn-primary !h-7 !text-[11px] !px-3 !bg-[#2998d6] hover:!bg-[#1f85be]'
                        }`}
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>{isLive ? 'Join Live Room' : isCompleted ? 'Review & Certificate' : 'Attend Training'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
              {trainings.length === 0 && (
                <div className="md:col-span-2 lg:col-span-3 rounded-xl border border-dashed border-slate-300 p-10 text-center text-xs text-slate-500">
                  No training sessions have been scheduled yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: Applications */}
        {activeTab === 'applications' && (
          <div className="space-y-6">
            {/* Header & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#e2e8f0]">
              <div>
                <h2 className="text-xl sm:text-2xl font-normal text-[#1e293b] font-heading flex items-center gap-2">
                  <span>My Credit &amp; Financing Applications</span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {applications.length} {applications.length === 1 ? 'Dossier' : 'Dossiers'}
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Track real-time underwriting progress, document verification statuses, and requirement requests across institutional lenders.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={handleRefreshApplications}
                  disabled={isRefreshingApps}
                  className="accounting-btn-secondary !h-8 !text-xs !px-3 flex items-center gap-1.5"
                  title="Synchronize status with bank servers"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isRefreshingApps ? 'animate-spin text-[#2998d6]' : ''}`} />
                  <span>{isRefreshingApps ? 'Syncing...' : 'Refresh Status'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => switchTab('marketplace')}
                  className="accounting-btn-primary !h-8 !text-xs !px-3.5 flex items-center gap-1.5"
                >
                  <Coins className="w-3.5 h-3.5" />
                  <span>Explore Facilities</span>
                </button>
              </div>
            </div>

            {/* KPI Status Filter Ribbon (5 Clickable Cards) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {/* All */}
              <div
                onClick={() => setAppStatusFilter('all')}
                className={`accounting-card p-3.5 transition-all cursor-pointer hover:border-[#2998d6] flex flex-col justify-between ${
                  appStatusFilter === 'all' ? 'border-[#2998d6] ring-2 ring-[#2998d6]/30 shadow-xs' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">All Files</span>
                  <FileText className="w-4 h-4 text-slate-400" />
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-bold font-mono text-slate-900">{applicationStats.total}</span>
                  <span className="text-[10px] text-slate-400">Total made</span>
                </div>
              </div>

              {/* Pending */}
              <div
                onClick={() => setAppStatusFilter('pending')}
                className={`accounting-card p-3.5 transition-all cursor-pointer hover:border-amber-400 flex flex-col justify-between ${
                  appStatusFilter === 'pending' ? 'border-amber-400 ring-2 ring-amber-400/30 bg-amber-50/20 shadow-xs' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Pending</span>
                  <Clock className="w-4 h-4 text-amber-500" />
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-bold font-mono text-amber-700">{applicationStats.pending}</span>
                  <span className="text-[10px] text-amber-600/80">In intake queue</span>
                </div>
              </div>

              {/* Under Review */}
              <div
                onClick={() => setAppStatusFilter('under_review')}
                className={`accounting-card p-3.5 transition-all cursor-pointer hover:border-[#2998d6] flex flex-col justify-between ${
                  appStatusFilter === 'under_review' ? 'border-[#2998d6] ring-2 ring-[#2998d6]/30 bg-sky-50/20 shadow-xs' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#0284c7]">Under Review</span>
                  <Activity className="w-4 h-4 text-[#0284c7]" />
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-bold font-mono text-[#0284c7]">{applicationStats.underReview}</span>
                  <span className="text-[10px] text-[#0284c7]/80">With committee</span>
                </div>
              </div>

              {/* Completed / Approved */}
              <div
                onClick={() => setAppStatusFilter('completed')}
                className={`accounting-card p-3.5 transition-all cursor-pointer hover:border-emerald-500 flex flex-col justify-between ${
                  appStatusFilter === 'completed' ? 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-50/20 shadow-xs' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Completed</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-bold font-mono text-emerald-700">{applicationStats.completed}</span>
                  <span className="text-[10px] text-emerald-600/80">Approved &amp; active</span>
                </div>
              </div>

              {/* Rejected */}
              <div
                onClick={() => setAppStatusFilter('rejected')}
                className={`accounting-card p-3.5 transition-all cursor-pointer hover:border-rose-400 flex flex-col justify-between ${
                  appStatusFilter === 'rejected' ? 'border-rose-400 ring-2 ring-rose-400/30 bg-rose-50/20 shadow-xs' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Rejected</span>
                  <AlertCircle className="w-4 h-4 text-rose-500" />
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-bold font-mono text-rose-700">{applicationStats.rejected}</span>
                  <span className="text-[10px] text-rose-600/80">Requires revision</span>
                </div>
              </div>
            </div>

            {/* Quick Filter Pills & Search Input Row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
                {[
                  { id: 'all', label: 'All Applications', count: applicationStats.total },
                  { id: 'pending', label: 'Pending', count: applicationStats.pending },
                  { id: 'under_review', label: 'Under Review', count: applicationStats.underReview },
                  { id: 'completed', label: 'Completed', count: applicationStats.completed },
                  { id: 'rejected', label: 'Rejected', count: applicationStats.rejected }
                ].map(pill => {
                  const isPillActive = appStatusFilter === pill.id;
                  return (
                    <button
                      key={pill.id}
                      type="button"
                      onClick={() => setAppStatusFilter(pill.id as any)}
                      className={`px-3 py-1.5 rounded text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                        isPillActive
                          ? 'bg-[#1a2332] text-white shadow-xs'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <span>{pill.label}</span>
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                        isPillActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {pill.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="relative min-w-[240px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search program, institution, ref..."
                  value={appSearchTerm}
                  onChange={e => setAppSearchTerm(e.target.value)}
                  className="accounting-input !h-8 !text-xs !pl-8 w-full bg-white"
                />
                {appSearchTerm && (
                  <button
                    type="button"
                    onClick={() => setAppSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Applications List */}
            <div className="space-y-5">
              {filteredApplications.map(app => {
                const matchedOpp = opportunities.find(o => o.id === app.opportunityId);
                const statusCategory = getAppStatusCategory(app.status);
                const statusBadge = getStatusBadge(app.status);

                // Derive requirements list
                const requiredDocList = (matchedOpp?.requiredDocs && matchedOpp.requiredDocs.length > 0)
                  ? matchedOpp.requiredDocs
                  : [
                      'RDB Certificate of Registration',
                      'RRA Tax Clearance Certificate',
                      'Audited Financial Ledger (Last 6 Months)',
                      'Bank Statement (Last 3 Months)'
                    ];

                const uploadedDocsMap = new Map<string, any>();
                (app.documents || []).forEach(doc => {
                  uploadedDocsMap.set(doc.documentType.toLowerCase(), doc);
                });

                // Check missing docs
                const missingDocsCount = requiredDocList.filter(reqDoc => {
                  const reqLower = reqDoc.toLowerCase();
                  return !(app.documents || []).some(d => {
                    const docTypeLower = d.documentType.toLowerCase();
                    return docTypeLower === reqLower || reqLower.includes(docTypeLower) || docTypeLower.includes(reqLower);
                  });
                }).length;

                // Extra uploaded docs not in the required checklist
                const extraUploadedDocs = (app.documents || []).filter(doc => {
                  const docTypeLower = doc.documentType.toLowerCase();
                  return !requiredDocList.some(reqDoc => {
                    const reqLower = reqDoc.toLowerCase();
                    return docTypeLower === reqLower || reqLower.includes(docTypeLower) || docTypeLower.includes(reqLower);
                  });
                });

                return (
                  <div
                    key={app.id}
                    className="accounting-card p-5 sm:p-6 space-y-5 border-[#cbd5e1] hover:border-[#2998d6] transition-all duration-150 shadow-xs"
                  >
                    {/* Top Row: Title, Institution, Badges, Application ID */}
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-slate-150">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-bold bg-[#1a2332] text-white px-2.5 py-0.5 rounded uppercase tracking-wider font-mono">
                            {matchedOpp?.category || 'Financing Facility'}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10.5px] font-bold uppercase tracking-wider border ${statusBadge.bg}`}>
                            {statusBadge.icon}
                            <span>{statusBadge.label}</span>
                          </span>
                          <span className="text-[10.5px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            Ref: #{app.id.slice(0, 8).toUpperCase()}
                          </span>
                        </div>

                        <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug font-heading">
                          {app.opportunityTitle}
                        </h3>

                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-sans">
                          <span className="flex items-center gap-1 font-semibold text-slate-800">
                            <Building2 className="w-3.5 h-3.5 text-[#2998d6]" />
                            <span>{app.institution || matchedOpp?.institution || 'Credit Institution'}</span>
                          </span>
                          <span>·</span>
                          <span className="flex items-center gap-1 text-slate-500">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>Applied: <strong className="text-slate-700 font-mono">{app.appliedAt}</strong></span>
                          </span>
                          {missingDocsCount > 0 ? (
                            <>
                              <span>·</span>
                              <span className="text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[10.5px] flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                {missingDocsCount} requirement{missingDocsCount === 1 ? '' : 's'} pending
                              </span>
                            </>
                          ) : (
                            <>
                              <span>·</span>
                              <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10.5px] flex items-center gap-1">
                                <CheckCircle className="w-3 h-3 text-emerald-600" />
                                All required documents submitted
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Financial Request Terms Pill */}
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 shrink-0 flex items-center gap-4 text-xs font-mono">
                        <div>
                          <span className="text-[9px] text-slate-400 uppercase font-semibold block">Requested Capital</span>
                          <strong className="text-sm font-bold text-slate-900 block mt-0.5">
                            {app.requestedAmount ? formatRWF(app.requestedAmount) : (matchedOpp?.maxFunding || 'Discretionary')}
                          </strong>
                        </div>
                        <div className="border-l border-slate-200 pl-4">
                          <span className="text-[9px] text-slate-400 uppercase font-semibold block">Facility Term</span>
                          <strong className="text-sm font-bold text-slate-700 block mt-0.5">
                            {app.termMonths ? `${app.termMonths} Months` : (matchedOpp?.loanTerm ? `${matchedOpp.loanTerm} Months` : '24 Months')}
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* 4-STAGE AUDIT TIMELINE PROGRESS TRACKER */}
                    <div className="bg-slate-50/70 border border-slate-200 rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        <span className="flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-[#2998d6]" />
                          Underwriting Audit Pipeline Progress
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono font-medium">
                          {statusCategory === 'completed' ? '100% Completed' : statusCategory === 'under_review' ? '65% In Committee Audit' : statusCategory === 'rejected' ? 'Evaluation Concluded' : '30% Intake Screening'}
                        </span>
                      </div>

                      {/* Stepper Dots & Line */}
                      <div className="grid grid-cols-4 gap-2 pt-2 relative">
                        {/* Stage 1: Submitted */}
                        <div className="flex flex-col items-center text-center space-y-1">
                          <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs font-bold text-xs ring-4 ring-emerald-100">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                          <span className="text-[10.5px] font-bold text-slate-900 leading-tight">1. Lodged</span>
                          <span className="text-[9px] text-slate-400 font-mono hidden sm:block">Application Received</span>
                        </div>

                        {/* Stage 2: Desk Intake Screening */}
                        <div className="flex flex-col items-center text-center space-y-1">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shadow-xs transition-all ${
                            statusCategory === 'pending'
                              ? 'bg-amber-500 text-white ring-4 ring-amber-100 animate-pulse'
                              : 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                          }`}>
                            {statusCategory === 'pending' ? <Clock className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                          <span className={`text-[10.5px] font-bold leading-tight ${statusCategory === 'pending' ? 'text-amber-700' : 'text-slate-900'}`}>
                            2. Desk Intake
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono hidden sm:block">
                            {statusCategory === 'pending' ? 'Screening Active' : 'Verified'}
                          </span>
                        </div>

                        {/* Stage 3: Risk & Requirements Audit */}
                        <div className="flex flex-col items-center text-center space-y-1">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shadow-xs transition-all ${
                            statusCategory === 'under_review'
                              ? 'bg-[#2998d6] text-white ring-4 ring-sky-100 animate-pulse'
                              : statusCategory === 'completed'
                              ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                              : statusCategory === 'rejected'
                              ? 'bg-rose-500 text-white ring-4 ring-rose-100'
                              : 'bg-slate-200 text-slate-400'
                          }`}>
                            {statusCategory === 'under_review' ? (
                              <Activity className="w-3.5 h-3.5" />
                            ) : statusCategory === 'completed' ? (
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            ) : statusCategory === 'rejected' ? (
                              <AlertCircle className="w-3.5 h-3.5" />
                            ) : (
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                            )}
                          </div>
                          <span className={`text-[10.5px] font-bold leading-tight ${
                            statusCategory === 'under_review' ? 'text-[#0284c7]' : statusCategory === 'rejected' ? 'text-rose-700' : 'text-slate-900'
                          }`}>
                            3. Risk Audit
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono hidden sm:block">
                            {statusCategory === 'under_review' ? 'Under Review' : statusCategory === 'rejected' ? 'Findings Raised' : 'Committee Audit'}
                          </span>
                        </div>

                        {/* Stage 4: Decision */}
                        <div className="flex flex-col items-center text-center space-y-1">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shadow-xs transition-all ${
                            statusCategory === 'completed'
                              ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                              : statusCategory === 'rejected'
                              ? 'bg-rose-600 text-white ring-4 ring-rose-100'
                              : 'bg-slate-200 text-slate-400'
                          }`}>
                            {statusCategory === 'completed' ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : statusCategory === 'rejected' ? (
                              <XCircle className="w-4 h-4" />
                            ) : (
                              <Lock className="w-3 h-3 text-slate-400" />
                            )}
                          </div>
                          <span className={`text-[10.5px] font-bold leading-tight ${
                            statusCategory === 'completed' ? 'text-emerald-700' : statusCategory === 'rejected' ? 'text-rose-700' : 'text-slate-400'
                          }`}>
                            4. Decision
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono hidden sm:block">
                            {statusCategory === 'completed' ? 'Completed & Approved' : statusCategory === 'rejected' ? 'Declined' : 'Pending Review'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* REQUIREMENTS REQUIRED & COMPLIANCE CHECKLIST */}
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                            <ShieldCheck className="w-4 h-4 text-[#2998d6]" />
                            Program Requirements &amp; Verification Documents Checklist
                          </h4>
                          <p className="text-[10.5px] text-slate-500 font-sans mt-0.5">
                            Institutional underwriting conditions verified against this SME submission.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => openUploadDocModal(app)}
                          className="accounting-btn-secondary !h-7 !text-[11px] !px-2.5 self-start sm:self-auto flex items-center gap-1.5 cursor-pointer"
                        >
                          <FilePlus className="w-3.5 h-3.5 text-[#2998d6]" />
                          <span>Upload Additional File</span>
                        </button>
                      </div>

                      {/* Required Documents Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {requiredDocList.map((reqDoc, idx) => {
                          const reqLower = reqDoc.toLowerCase();
                          const matchedUploadedDoc = (app.documents || []).find(d => {
                            const dLower = d.documentType.toLowerCase();
                            return dLower === reqLower || reqLower.includes(dLower) || dLower.includes(reqLower);
                          });

                          const isProvided = !!matchedUploadedDoc;

                          return (
                            <div
                              key={idx}
                              className={`p-3 rounded-lg border transition-all flex flex-col justify-between space-y-2 ${
                                isProvided
                                  ? 'bg-emerald-50/30 border-emerald-200'
                                  : 'bg-amber-50/40 border-amber-200'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-start gap-2">
                                  <div className="mt-0.5">
                                    {isProvided ? (
                                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                    ) : (
                                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 animate-pulse" />
                                    )}
                                  </div>
                                  <div>
                                    <h5 className="text-xs font-bold text-slate-900 leading-tight">
                                      {reqDoc}
                                    </h5>
                                    {isProvided ? (
                                      <div className="mt-1 text-[10px] text-slate-500 font-mono space-y-0.5">
                                        <p className="truncate text-slate-700 font-semibold max-w-[240px]">
                                          {matchedUploadedDoc.fileName}
                                        </p>
                                        <p className="text-slate-400">
                                          {formatFileSize(matchedUploadedDoc.sizeBytes)} · Uploaded: {new Date(matchedUploadedDoc.uploadedAt || Date.now()).toLocaleDateString()}
                                        </p>
                                      </div>
                                    ) : (
                                      <p className="text-[10px] text-amber-700 mt-1">
                                        Mandatory underwriting requirement pending submission.
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div>
                                  {isProvided ? (
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold font-mono uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                                      Submitted
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold font-mono uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                                      Required
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                                <span className="text-[9.5px] text-slate-400 font-mono">
                                  {isProvided ? 'Verified Format' : 'Accepted: PDF, Office, Img (<=10MB)'}
                                </span>

                                {isProvided ? (
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadDoc(matchedUploadedDoc)}
                                    className="px-2.5 py-1 text-[10.5px] font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 rounded transition flex items-center gap-1 cursor-pointer"
                                  >
                                    <Download className="w-3 h-3 text-[#2998d6]" />
                                    <span>Download</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => openUploadDocModal(app, reqDoc)}
                                    className="px-2.5 py-1 text-[10.5px] font-bold text-white bg-[#2998d6] hover:bg-[#1f85be] rounded shadow-2xs transition flex items-center gap-1 cursor-pointer"
                                  >
                                    <UploadCloud className="w-3 h-3" />
                                    <span>Upload Now</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Extra Uploaded Documents (if any) */}
                      {extraUploadedDocs.length > 0 && (
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                            <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                            Additional Supporting Attachments ({extraUploadedDocs.length})
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {extraUploadedDocs.map((extraDoc, idx) => (
                              <div key={idx} className="p-2 bg-white rounded border border-slate-200 flex items-center justify-between text-xs">
                                <div className="truncate mr-2">
                                  <strong className="block text-[11px] text-slate-800 font-semibold truncate">{extraDoc.documentType}</strong>
                                  <span className="text-[9.5px] text-slate-400 font-mono">{extraDoc.fileName} · {formatFileSize(extraDoc.sizeBytes)}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadDoc(extraDoc)}
                                  className="px-2 py-0.5 text-[10px] font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 shrink-0 flex items-center gap-1 cursor-pointer"
                                >
                                  <Download className="w-3 h-3 text-[#2998d6]" />
                                  <span>Download</span>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Financial & Underwriting Criteria Compliance Breakdown */}
                      <div className="p-3.5 bg-slate-50/80 border border-slate-200 rounded-lg space-y-2">
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block font-sans">
                          SME Profile Underwriting Standard Matching
                        </span>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          {/* Health Score */}
                          <div className="p-2.5 bg-white rounded border border-slate-200 space-y-0.5">
                            <span className="text-[9px] text-slate-400 block uppercase font-semibold">Min Health Score</span>
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-800 font-mono">{matchedOpp?.minHealthScore || 60}% Req</span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded font-mono ${
                                (app.smeHealth || activeSme.healthScore) >= (matchedOpp?.minHealthScore || 60)
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}>
                                {app.smeHealth || activeSme.healthScore}% Actual
                              </span>
                            </div>
                          </div>

                          {/* Readiness Score */}
                          <div className="p-2.5 bg-white rounded border border-slate-200 space-y-0.5">
                            <span className="text-[9px] text-slate-400 block uppercase font-semibold">Loan Readiness</span>
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-800 font-mono">{matchedOpp?.minReadinessScore || 65}% Req</span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded font-mono ${
                                (app.smeReadiness || calculatedReadiness) >= (matchedOpp?.minReadinessScore || 65)
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-sky-50 text-[#0284c7] border border-sky-200'
                              }`}>
                                {app.smeReadiness || calculatedReadiness}% Index
                              </span>
                            </div>
                          </div>

                          {/* Regulatory Registration */}
                          <div className="p-2.5 bg-white rounded border border-slate-200 space-y-0.5">
                            <span className="text-[9px] text-slate-400 block uppercase font-semibold">RDB / Tax Status</span>
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-800 text-[11px] truncate">
                                {matchedOpp?.taxCompliance ? 'RRA Clearance' : 'Registered SME'}
                              </span>
                              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded font-mono">
                                Pass
                              </span>
                            </div>
                          </div>

                          {/* Collateral Security */}
                          <div className="p-2.5 bg-white rounded border border-slate-200 space-y-0.5">
                            <span className="text-[9px] text-slate-400 block uppercase font-semibold">Security Structure</span>
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-800 text-[11px] truncate" title={matchedOpp?.collateralRequired ? (matchedOpp.collateralType || 'Asset Pledge') : 'Unsecured'}>
                                {matchedOpp?.collateralRequired ? (matchedOpp.collateralType || 'Asset Pledge') : 'No Collateral'}
                              </span>
                              <span className="text-[9px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded font-mono">
                                Standard
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* REVIEW FEEDBACK & AI ACCELERATOR ADVISORY */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest flex items-center gap-1.5 font-sans">
                            <Building2 className="w-3.5 h-3.5 text-[#2998d6]" />
                            Financial Institution Review Decision &amp; Remarks
                          </span>
                          <span className="text-[9px] font-mono text-slate-400">
                            Desk: {app.institution || matchedOpp?.institution || 'Credit Desk'}
                          </span>
                        </div>
                        <div className="mt-1.5 p-3 bg-white border border-slate-200 rounded text-xs text-slate-700 leading-relaxed font-sans shadow-2xs">
                          {app.feedback || 'Application received and placed in credit intake pool. Awaiting underwriter inspection of submitted trading books.'}
                        </div>
                      </div>

                      {/* AI Copilot Guidance */}
                      <div className="pt-2 border-t border-slate-200 space-y-1.5 text-xs">
                        <span className="text-[10px] font-bold text-[#0284c7] uppercase tracking-widest flex items-center gap-1 font-sans">
                          <Sparkles className="w-3.5 h-3.5 text-[#2998d6]" />
                          Elevata AI Fast-Track Recommendation
                        </span>
                        {app.aiSuggestions && app.aiSuggestions.length > 0 ? (
                          <ul className="list-disc pl-4 space-y-1 text-slate-600 text-[11px]">
                            {app.aiSuggestions.map((suggestion, sIdx) => (
                              <li key={sIdx}>{suggestion}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-[11px] text-slate-600 leading-relaxed">
                            {statusCategory === 'pending'
                              ? 'Your file is in the initial desk screening queue. Continue recording daily sales and inventory in the ledger to maintain positive momentum.'
                              : statusCategory === 'under_review'
                              ? 'Credit committee is analyzing debt-to-revenue ratio. Ensure all required compliance documents above are verified and up-to-date.'
                              : statusCategory === 'completed'
                              ? 'Credit facility has been successfully approved! Reach out to the institution representative to arrange loan facility disbursement.'
                              : 'Review the underwriter remarks above, update any missing documents, and re-apply once requirements are satisfied.'}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Bottom Card Footer Actions */}
                    <div className="pt-3 border-t border-slate-150 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="text-[11px] text-slate-500 font-sans">
                        Need assistance with this facility? Contact the underwriter directly:
                      </div>

                      <div className="flex items-center gap-2">
                        {matchedOpp && (
                          <button
                            type="button"
                            onClick={() => setSelectedOppId(matchedOpp.id)}
                            className="accounting-btn-secondary !h-8 !text-xs !px-3 flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            <span>View Program Terms</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => openUploadDocModal(app)}
                          className="accounting-btn-primary !h-8 !text-xs !px-3.5 flex items-center gap-1.5 cursor-pointer"
                        >
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span>Submit Requirement File</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredApplications.length === 0 && (
                <div className="rounded-xl border border-dashed border-[#cbd5e1] p-12 text-center space-y-3 bg-slate-50/50">
                  <div className="w-12 h-12 rounded-full bg-sky-50 text-[#2998d6] mx-auto flex items-center justify-center border border-sky-100">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-800 font-heading">
                      {applications.length === 0
                        ? 'No Credit or Grant Applications Submitted Yet'
                        : `No Applications Match Status "${appStatusFilter}"`}
                    </h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                      {applications.length === 0
                        ? 'Explore matched commercial credit lines, working capital loans, and business development grants in the Opportunity Marketplace.'
                        : 'Try selecting "All Applications" or adjusting your search keyword above to view other applications.'}
                    </p>
                  </div>
                  <div>
                    {applications.length === 0 ? (
                      <button
                        type="button"
                        onClick={() => switchTab('marketplace')}
                        className="accounting-btn-primary !h-8 !px-4 !text-xs"
                      >
                        <Coins className="w-3.5 h-3.5 mr-1.5" />
                        <span>Browse Available Opportunities</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setAppStatusFilter('all');
                          setAppSearchTerm('');
                        }}
                        className="accounting-btn-secondary !h-8 !px-4 !text-xs"
                      >
                        Reset Filter
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        </div>
      </div>

      {selectedOpp && (() => {
        const activeSmeLocation = 'Not provided';
        const activeSmeAnnualRevenue = activeSme.monthlyData.reduce((sum, item) => sum + item.revenue, 0);
        const activeSmeMonthlyRevenue = activeSme.monthlyData[activeSme.monthlyData.length - 1]?.revenue || 0;
        const minMonthly = selectedOpp.minMonthlyRevenue || Math.round(selectedOpp.minRevenue / 12);

        return (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-5xl h-[650px] max-h-[92vh] overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-150">
              
              {/* Left Column: Opportunity Core Details & Criteria */}
              <div className="flex-1 p-6 overflow-y-auto space-y-5 border-r border-slate-100">
                
                {/* Header info */}
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <span className="text-[10px] font-bold bg-[#1a2332] text-white px-2.5 py-0.5 rounded uppercase tracking-wider">
                        {selectedOpp.category}
                      </span>
                      {selectedOpp.category === 'Loan' && (
                        <span className="text-[10px] font-bold bg-sky-50 text-[#2998d6] border border-sky-200 px-2.5 py-0.5 rounded uppercase flex items-center gap-1 font-mono">
                          <Coins className="w-3 h-3 text-[#2998d6]" />
                          Credit Facility
                        </span>
                      )}
                      {selectedOpp.sectors.includes('Agriculture') && (
                        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-0.5 rounded uppercase flex items-center gap-1">
                          <Sprout className="w-3 h-3 text-emerald-600" />
                          Agrisolutions
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-base font-extrabold text-slate-900 tracking-tight leading-snug">
                      {selectedOpp.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 flex items-center gap-2 flex-wrap">
                      <span>Offered by <strong className="text-slate-800 font-semibold">{selectedOpp.institution}</strong></span>
                      <span>·</span>
                      <span className="font-mono text-slate-600">Deadline: {selectedOpp.deadline}</span>
                    </p>
                  </div>
                  
                  <button
                    onClick={() => setSelectedOppId(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition shrink-0 md:hidden"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Verified Institution strip */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-[#2998d6] flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#2998d6]" />
                        Verified Financial Institution
                      </span>
                      <p className="text-xs font-bold text-slate-900">{selectedOpp.publisher?.institutionName || selectedOpp.institution}</p>
                      {selectedOpp.publisher?.representativeName && (
                        <p className="text-[10px] text-slate-500">Officer / Desk: {selectedOpp.publisher.representativeName}</p>
                      )}
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-[9px] font-bold rounded-full uppercase tracking-wider">
                      Active
                    </span>
                  </div>

                  <div className="mt-2.5 flex flex-wrap gap-2 pt-2 border-t border-slate-200/60">
                    {selectedOpp.publisher?.phone && (
                      <a href={`tel:${selectedOpp.publisher.phone}`} className="flex items-center gap-1.5 rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-[10px] font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs">
                        <Phone className="h-3 w-3 text-[#2998d6]" />
                        {selectedOpp.publisher.phone}
                      </a>
                    )}
                    {selectedOpp.publisher?.email && (
                      <a href={`mailto:${selectedOpp.publisher.email}`} className="flex items-center gap-1.5 rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-[10px] font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs">
                        <Mail className="h-3 w-3 text-[#2998d6]" />
                        Email Desk
                      </a>
                    )}
                    {selectedOpp.publisher?.website && (
                      <a href={selectedOpp.publisher.website} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-[10px] font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs">
                        <Globe className="h-3 w-3 text-[#2998d6]" />
                        Web Portal
                      </a>
                    )}
                  </div>
                </div>

                {/* Key Financing Terms Breakdown */}
                {selectedOpp.category === 'Loan' && (
                  <div className="bg-slate-50/90 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Coins className="w-3.5 h-3.5 text-[#2998d6]" />
                        Financing Terms &amp; Cost Structure
                      </span>
                      <span className="text-[9px] font-mono text-slate-500">Ledger-backed</span>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                        <span className="text-slate-400 block text-[8px] uppercase tracking-wider font-semibold">Interest Rate</span>
                        <span className="font-bold text-slate-900 block text-xs mt-0.5">
                          {selectedOpp.loanRate ? `${selectedOpp.loanRate}% p.a.` : 'Standard'}
                        </span>
                      </div>
                      <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                        <span className="text-slate-400 block text-[8px] uppercase tracking-wider font-semibold">Repayment Term</span>
                        <span className="font-bold text-slate-900 block text-xs mt-0.5">
                          {selectedOpp.loanTerm ? `${selectedOpp.loanTerm} Months` : 'Negotiable'}
                        </span>
                      </div>
                      <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                        <span className="text-slate-400 block text-[8px] uppercase tracking-wider font-semibold">Grace Period</span>
                        <span className="font-bold text-slate-900 block text-xs mt-0.5">
                          {selectedOpp.loanGrace ? `${selectedOpp.loanGrace} Months` : 'None'}
                        </span>
                      </div>
                      <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                        <span className="text-slate-400 block text-[8px] uppercase tracking-wider font-semibold">Collateral Type</span>
                        <span className="font-bold text-slate-900 block text-xs mt-0.5 truncate" title={selectedOpp.collateralRequired ? (selectedOpp.collateralType || 'Asset Registration') : 'No Land Collateral'}>
                          {selectedOpp.collateralRequired ? (selectedOpp.collateralType || 'Asset Registration') : 'No Land Collateral'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Scope & Description */}
                <div className="space-y-1.5">
                  <h4 className="text-[10px] font-bold text-slate-700 uppercase tracking-widest block font-sans">
                    Overview &amp; Scope
                  </h4>
                  <div className="p-3.5 bg-slate-50/80 border border-slate-200 rounded-xl leading-relaxed">
                    <FormattedText text={selectedOpp.description} />
                  </div>
                </div>

                {/* Benefits */}
                <div className="space-y-1.5">
                  <h4 className="text-[10px] font-bold text-slate-700 uppercase tracking-widest block font-sans">
                    Program Benefits &amp; Terms
                  </h4>
                  <div className="p-3.5 bg-slate-50/80 border border-slate-200 rounded-xl leading-relaxed">
                    <FormattedText text={selectedOpp.benefits} />
                  </div>
                </div>

                {/* Published Requirements Summary Cards */}
                <div className="space-y-1.5 pt-2 border-t border-slate-150">
                  <h4 className="text-[10px] font-bold text-slate-700 uppercase tracking-widest block font-sans">
                    Published Program Requirements
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-[8px] uppercase tracking-wider font-bold">Min Turnover</span>
                      </div>
                      <strong className="text-slate-900 block text-xs font-mono font-bold truncate" title={`${formatRWF(minMonthly)}/mo`}>
                        {formatRWF(minMonthly)}/mo
                      </strong>
                    </div>
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Coins className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-[8px] uppercase tracking-wider font-bold">Max Funding</span>
                      </div>
                      <strong className="text-slate-900 block text-xs font-mono font-bold truncate">
                        {selectedOpp.maxFunding}
                      </strong>
                    </div>
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-[8px] uppercase tracking-wider font-bold">Operating Age</span>
                      </div>
                      <strong className="text-slate-900 block text-xs font-bold truncate">
                        {selectedOpp.minAge === 0 ? 'Any Age' : `${selectedOpp.minAge}+ Years`}
                      </strong>
                    </div>
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-[8px] uppercase tracking-wider font-bold">Target Districts</span>
                      </div>
                      <strong className="text-slate-900 block text-xs font-bold truncate" title={selectedOpp.eligLocations?.join(', ') || 'All districts'}>
                        {selectedOpp.eligLocations && selectedOpp.eligLocations.length > 0 ? selectedOpp.eligLocations.join(', ') : 'All districts'}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Eligibility Match Table */}
                <div className="space-y-2 pt-2 border-t border-slate-150">
                  <h4 className="text-[10px] font-bold text-slate-700 uppercase tracking-widest block font-sans">
                    Business Profile Eligibility Match
                  </h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left text-xs font-sans border-collapse bg-white">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[9px] tracking-wider">
                          <th className="px-4 py-2.5">Requirement</th>
                          <th className="px-4 py-2.5">Criteria Threshold</th>
                          <th className="px-4 py-2.5">Your Profile</th>
                          <th className="px-4 py-2.5 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {[
                          {
                            name: 'Target Sector',
                            req: selectedOpp.sectors.join(', '),
                            val: activeSme.sector,
                            met: selectedOpp.sectors.includes(activeSme.sector)
                          },
                          {
                            name: 'Min Monthly Turnover',
                            req: formatRWF(minMonthly),
                            val: formatRWF(activeSmeMonthlyRevenue),
                            met: activeSmeMonthlyRevenue >= minMonthly
                          },
                          {
                            name: 'Min Annual Turnover',
                            req: formatRWF(selectedOpp.minRevenue),
                            val: formatRWF(activeSmeAnnualRevenue),
                            met: activeSmeAnnualRevenue >= selectedOpp.minRevenue
                          },
                          {
                            name: 'Business Age',
                            req: selectedOpp.minAge === 0 ? 'Any' : `${selectedOpp.minAge}+ Years`,
                            val: `${activeSme.age} Years`,
                            met: activeSme.age >= selectedOpp.minAge
                          },
                          {
                            name: 'Business Health Score',
                            req: `Min ${selectedOpp.minHealthScore}%`,
                            val: `${activeSme.healthScore}%`,
                            met: activeSme.healthScore >= selectedOpp.minHealthScore
                          },
                          {
                            name: 'Loan Readiness Score',
                            req: `Min ${selectedOpp.minReadinessScore}%`,
                            val: `${calculatedReadiness}%`,
                            met: calculatedReadiness >= selectedOpp.minReadinessScore
                          },
                          {
                            name: 'Geographical Scope',
                            req: selectedOpp.eligLocations && selectedOpp.eligLocations.length > 0 ? selectedOpp.eligLocations.join(', ') : 'All districts',
                            val: activeSmeLocation,
                            met: !selectedOpp.eligLocations || selectedOpp.eligLocations.length === 0
                          }
                        ].map((chk, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/60 transition">
                            <td className="px-4 py-2.5 font-semibold text-slate-800 text-[10.5px]">{chk.name}</td>
                            <td className="px-4 py-2.5 text-slate-600 font-mono text-[10px]">{chk.req}</td>
                            <td className="px-4 py-2.5 text-slate-600 font-mono text-[10px]">{chk.val}</td>
                            <td className="px-4 py-2.5 text-right">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${
                                chk.met 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}>
                                {chk.met ? <Check className="w-2.5 h-2.5" /> : <AlertCircle className="w-2.5 h-2.5" />}
                                {chk.met ? 'Met' : 'Not Met'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Required Documentation Checklist */}
                <div className="space-y-2 pt-2 border-t border-slate-150">
                  <h4 className="text-[10px] font-bold text-slate-700 uppercase tracking-widest block font-sans">
                    Required Verification Files &amp; Checklist
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {selectedOpp.requiredDocs.map((doc, i) => {
                      const isTax = doc.toLowerCase().includes('tax') || doc.toLowerCase().includes('compliance') || doc.toLowerCase().includes('rra');
                      const isFinancial = doc.toLowerCase().includes('financial') || doc.toLowerCase().includes('ledger') || doc.toLowerCase().includes('statements');
                      const isLicense = doc.toLowerCase().includes('license') || doc.toLowerCase().includes('address') || doc.toLowerCase().includes('profile');
                      
                      let isUploaded = false;
                      let action = null;
                      let label = "";

                      if (isTax) {
                        isUploaded = taxClearanceUploaded;
                        action = () => {
                          setTaxClearanceUploaded(true);
                          triggerToast('Tax Clearance Certificate uploaded. Compliance score increased to 100%!');
                        };
                        label = "Upload Tax Certificate";
                      } else if (isFinancial) {
                        isUploaded = auditedStatementsUploaded;
                        action = () => {
                          setAuditedStatementsUploaded(true);
                          triggerToast('Financial statements uploaded successfully. Documentation score updated.');
                        };
                        label = "Upload Financials";
                      } else if (isLicense) {
                        isUploaded = profileCompleted;
                        action = () => {
                          setProfileCompleted(true);
                          triggerToast('Business profile completed. Readiness index improved.');
                        };
                        label = "Complete License Info";
                      } else {
                        isUploaded = false;
                        action = () => {
                          triggerToast(`"${doc}" uploaded successfully!`);
                        };
                        label = "Upload File";
                      }

                      return (
                        <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center gap-3">
                          <div className="flex items-center gap-2.5 text-[10.5px] font-semibold text-slate-800 truncate max-w-[65%]">
                            <span className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 shrink-0">
                              {getDocIcon(doc, "w-3.5 h-3.5 text-slate-600")}
                            </span>
                            <span title={doc} className="truncate">{doc}</span>
                          </div>
                          {isUploaded ? (
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 uppercase tracking-wider font-sans shrink-0">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Uploaded
                            </span>
                          ) : (
                            <button
                              onClick={action}
                              className="bg-slate-900 hover:bg-slate-800 text-white text-[9.5px] font-bold px-3 py-1.5 rounded-lg shadow-2xs transition flex items-center gap-1 shrink-0"
                            >
                              <FileUp className="w-3 h-3 text-slate-300" />
                              {label}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Right Column: AI Assistant Panel & Action Footer */}
              <div className="w-full md:w-88 bg-slate-50/70 p-5 flex flex-col justify-between h-full border-t md:border-t-0 md:border-l border-slate-200">
                <div className="flex-1 flex flex-col justify-between h-[88%] overflow-hidden">
                  <div className="pb-3 border-b border-slate-200 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-sky-50 border border-sky-200 rounded-lg">
                        <Sparkles className="w-4 h-4 text-[#2998d6]" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">Elevata AI Advisor</h4>
                        <p className="text-[9px] text-slate-400 uppercase tracking-wider">Opportunity Copilot</p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => setSelectedOppId(null)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition hidden md:block"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Chat conversation area */}
                  <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1 text-xs">
                    {chatHistory.map((msg, i) => (
                      <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`p-3 rounded-lg max-w-[88%] leading-relaxed ${
                          msg.sender === 'user'
                            ? 'bg-[#1a2332] text-white font-medium shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-700 shadow-2xs'
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    ))}
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="p-2.5 bg-white border border-slate-200 rounded-lg text-slate-400 font-sans flex items-center gap-2">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2998d6]" />
                          <span>AI Assistant is typing...</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input query box */}
                  <form onSubmit={handleSendMessage} className="flex gap-2 pt-2.5 border-t border-slate-200">
                    <input
                      type="text"
                      placeholder="Ask about collateral, interest rates..."
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      className="accounting-input flex-1 !text-xs"
                    />
                    <button
                      type="submit"
                      className="accounting-btn-primary !h-8 !px-3 !bg-[#2998d6] hover:!bg-[#1f85be] flex items-center justify-center shrink-0 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>

                <div className="pt-3 border-t border-slate-200 mt-3">
                  <button
                    onClick={() => {
                      const oppToApply = selectedOpp;
                      setSelectedOppId(null);
                      if (oppToApply) handleOpenApplyModal(oppToApply);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#2998d6] hover:bg-[#1f85be] text-white text-xs font-bold rounded shadow-xs transition cursor-pointer"
                  >
                    <span>Proceed to Quick Apply</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* QUICK APPLY & DYNAMIC DOCUMENT UPLOAD MODAL */}
      {applyingOpp && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white border border-[#cbd5e1] rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
            
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-800 bg-[#1a2332] text-white flex justify-between items-start shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold bg-[#2998d6] text-white px-2 py-0.5 rounded uppercase tracking-wider font-mono">
                    {applyingOpp.category} Facility Dossier
                  </span>
                  <span className="text-[10px] text-slate-300 font-mono">
                    Max: {applyingOpp.maxFunding}
                  </span>
                </div>
                <h3 className="text-sm font-extrabold text-white">
                  Apply for {applyingOpp.title}
                </h3>
                <p className="text-[10.5px] text-slate-300">
                  Offered by <strong className="text-white font-semibold">{applyingOpp.institution}</strong> · Deadline: <span className="font-mono text-cyan-300">{applyingOpp.deadline}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setApplyingOpp(null)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmitApplication} className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
              
              {/* Top Section: Pre-filled Business Profile Dossier */}
              <div className="p-3.5 bg-slate-50/90 border border-slate-200 rounded-lg space-y-2.5">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    Applicant Business Dossier
                  </span>
                  <span className="text-[9px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    Verified SME
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                  <div>
                    <span className="text-slate-400 block text-[8px] uppercase">Business Name</span>
                    <strong className="text-slate-800 font-bold block truncate">{activeSme.name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[8px] uppercase">Sector</span>
                    <strong className="text-slate-800 font-bold block truncate">{activeSme.sector}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[8px] uppercase">Health Score</span>
                    <strong className="text-emerald-600 font-bold block font-mono">{activeSme.healthScore}%</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[8px] uppercase">Loan Readiness</span>
                    <strong className="text-[#2998d6] font-bold block font-mono">{calculatedReadiness}%</strong>
                  </div>
                </div>
              </div>

              {/* Funding Request Details */}
              <div className="space-y-3 pt-1">
                <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block border-b pb-1 font-sans">
                  1. Funding &amp; Facility Request
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="accounting-label">
                        Requested Amount (FRW) <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[9px] text-slate-400 font-mono">Max: {applyingOpp.maxFunding}</span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        value={applyAmount}
                        onChange={e => {
                          setApplyAmount(e.target.value);
                          if (applyErrors.applyAmount) {
                            setApplyErrors(prev => {
                              const copy = { ...prev };
                              delete copy.applyAmount;
                              return copy;
                            });
                          }
                        }}
                        placeholder="e.g. 5000000"
                        className={`accounting-input w-full font-mono ${
                          applyErrors.applyAmount ? 'border-rose-500 ring-1 ring-rose-500/20 bg-rose-50/20' : ''
                        }`}
                        required
                      />
                    </div>
                    <div className="flex justify-between items-center text-[9.5px] text-slate-400 font-mono">
                      <span>Preview:</span>
                      <span className="font-semibold text-slate-700">{formatRWF(Number(applyAmount) || 0)}</span>
                    </div>
                    {applyErrors.applyAmount && (
                      <p className="text-[9.5px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-rose-600 shrink-0" /> {applyErrors.applyAmount}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="accounting-label">
                      Intended Use of Funds <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={applyPurpose}
                      onChange={e => setApplyPurpose(e.target.value)}
                      className="accounting-select w-full"
                    >
                      <option value="Working Capital & Inventory Purchase">Working Capital &amp; Inventory Purchase</option>
                      <option value="Machinery & Equipment Acquisition">Machinery &amp; Equipment Acquisition</option>
                      <option value="Business Operations Expansion">Business Operations Expansion</option>
                      <option value="Agriculture & Supply Chain Financing">Agriculture &amp; Supply Chain Financing</option>
                      <option value="Technology & Digital Upgrade">Technology &amp; Digital Upgrade</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="accounting-label">
                      Repayment / Term
                    </label>
                    <select
                      value={applyTerm}
                      onChange={e => setApplyTerm(e.target.value)}
                      className="accounting-select w-full"
                    >
                      <option value="6">6 Months</option>
                      <option value="12">12 Months (1 Year)</option>
                      <option value="24">24 Months (2 Years)</option>
                      <option value="36">36 Months (3 Years)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="accounting-label">
                      Contact Phone <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={applyPhone}
                      onChange={e => setApplyPhone(e.target.value)}
                      className="accounting-input w-full font-mono"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="accounting-label">
                      Official Email <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={applyEmail}
                      onChange={e => setApplyEmail(e.target.value)}
                      className="accounting-input w-full"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* DYNAMIC DOCUMENT UPLOADS BASED ON OPPORTUNITY REQUIREMENTS */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b pb-1">
                  <div>
                    <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block font-sans">
                      2. Required Compliance &amp; Verification Documents
                    </span>
                    <p className="text-[9.5px] text-slate-400 mt-0.5">
                      Upload verification files mapped to {applyingOpp.institution}'s underwriting checklist.
                    </p>
                  </div>
                  <span className="text-[9px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full font-bold">
                    {Object.keys(uploadedDocs).length} / {applyingOpp.requiredDocs.length || 1} Attached
                  </span>
                </div>

                {applyErrors.documents && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-[10px] font-semibold flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>{applyErrors.documents}</span>
                  </div>
                )}

                <div className="space-y-2">
                  {applyingOpp.requiredDocs && applyingOpp.requiredDocs.length > 0 ? (
                    applyingOpp.requiredDocs.map((doc, idx) => {
                      const isUploaded = !!uploadedDocs[doc];
                      const uploadedInfo = uploadedDocs[doc];

                      return (
                        <div
                          key={idx}
                          className={`p-3 rounded-lg border transition flex flex-col sm:flex-row justify-between sm:items-center gap-2.5 ${
                            isUploaded ? 'bg-emerald-50/40 border-emerald-200' : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="space-y-1 max-w-sm">
                            <div className="flex items-center gap-2">
                              <span className="p-1 bg-white border border-slate-200 rounded text-slate-600 shrink-0">
                                {getDocIcon(doc, `w-3.5 h-3.5 ${isUploaded ? 'text-emerald-600' : 'text-slate-500'}`)}
                              </span>
                              <strong className="text-xs font-bold text-slate-900">{doc}</strong>
                              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-700 uppercase tracking-wider">
                                Required
                              </span>
                            </div>

                            {isUploaded ? (
                              <p className="text-[9.5px] text-emerald-700 font-mono pl-6 flex items-center gap-2">
                                <span className="truncate max-w-[200px]">{uploadedInfo.fileName}</span>
                                <span className="text-slate-400">({uploadedInfo.fileSize})</span>
                                <span className="text-slate-400">· {uploadedInfo.uploadedAt}</span>
                              </p>
                            ) : (
                              <>
                                <p className="text-[9px] text-slate-400 pl-6">
                                  PDF, PNG, JPG, XLSX, DOCX · Max 10 MB
                                </p>
                                {applyErrors[doc] && (
                                  <p className="text-[9px] font-semibold text-rose-600 pl-6">{applyErrors[doc]}</p>
                                )}
                              </>
                            )}
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                            {isUploaded ? (
                              <div className="flex items-center gap-1.5">
                                <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-[9px] font-bold rounded flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                                  Attached
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveUploadedDoc(doc)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded transition cursor-pointer"
                                  title="Remove file"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <label className="accounting-btn-secondary !h-7 !text-[11px] !px-3 cursor-pointer flex items-center gap-1.5">
                                <FileUp className="w-3.5 h-3.5 text-slate-600" />
                                <span>Attach File</span>
                                <input
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png,.webp,.gif,.bmp,.tif,.tiff,.heic,.heif,.csv,.txt,.rtf,.json,.xml,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.mp3,.wav,.ogg,.mp4,.webm"
                                  onChange={(e) => handleFileUpload(doc, e)}
                                  className="hidden"
                                />
                              </label>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center text-slate-400 text-[10px]">
                      No additional documents required for this program.
                    </div>
                  )}
                </div>
              </div>

              {/* Cover Note */}
              <div className="space-y-1 pt-1">
                <label className="accounting-label">
                  3. Remarks / Note to Underwriting Officer (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Provide additional context regarding your operational cashflows, upcoming supplier contracts, or specific financing timelines..."
                  value={applyNotes}
                  onChange={e => setApplyNotes(e.target.value)}
                  className="accounting-input w-full leading-relaxed"
                />
              </div>

              {/* Consent and terms checkbox */}
              <div className="pt-2 border-t border-slate-200">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyAgreed}
                    onChange={e => setApplyAgreed(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-[#2998d6] focus:ring-[#2998d6]"
                  />
                  <span className="text-[10.5px] text-slate-600 leading-snug">
                    I declare that the information and documents uploaded are authentic and accurately represent the current trading records of <strong className="text-slate-900 font-bold">{activeSme.name}</strong> on Elevata.
                  </span>
                </label>
                {applyErrors.applyAgreed && (
                  <p className="text-[9.5px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-rose-600 shrink-0" /> {applyErrors.applyAgreed}
                  </p>
                )}
              </div>

              {/* Footer */}
              {applyErrors.submit && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-[10px] font-semibold">
                  {applyErrors.submit}
                </div>
              )}
              <div className="pt-3 border-t border-slate-200 flex justify-between items-center shrink-0">
                <button
                  type="button"
                  onClick={() => setApplyingOpp(null)}
                  className="accounting-btn-secondary !h-9 !px-4"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmittingApp}
                  className="accounting-btn-primary !h-9 !px-6 !bg-[#2998d6] hover:!bg-[#1f85be] flex items-center gap-1.5 shadow-xs"
                >
                  {isSubmittingApp ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Submitting Application...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Application Dossier</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPLOAD ADDITIONAL / REQUIRED DOCUMENT MODAL */}
      {uploadModalApp && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white border border-[#cbd5e1] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-800 bg-[#1a2332] text-white flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[9px] font-bold bg-[#2998d6] text-white px-2 py-0.5 rounded uppercase tracking-wider font-mono">
                  Requirements Upload
                </span>
                <h3 className="text-sm font-bold text-white leading-snug">
                  Upload Requirement Document
                </h3>
                <p className="text-[11px] text-slate-300">
                  Dossier: <span className="text-white font-semibold">{uploadModalApp.opportunityTitle}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setUploadModalApp(null);
                  setUploadDocType('');
                  setUploadFile(null);
                }}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleUploadAdditionalDoc} className="p-5 space-y-4 text-xs">
              <div>
                <label className="accounting-label">Document Type / Requirement Name</label>
                <input
                  type="text"
                  placeholder="e.g. RRA Tax Clearance Certificate, Bank Statement..."
                  value={uploadDocType}
                  onChange={e => setUploadDocType(e.target.value)}
                  className="accounting-input w-full"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Name of the verification requirement or institutional request.
                </span>
              </div>

              <div>
                <label className="accounting-label">Select File to Upload</label>
                <div className="border-2 border-dashed border-slate-300 hover:border-[#2998d6] rounded-lg p-5 text-center transition-colors bg-slate-50/50">
                  <input
                    type="file"
                    id="additional-doc-input"
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.gif,.bmp,.tif,.tiff,.heic,.heif,.csv,.txt,.rtf,.json,.xml,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        setUploadFile(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />
                  <label htmlFor="additional-doc-input" className="cursor-pointer block space-y-2">
                    <div className="w-10 h-10 rounded-full bg-sky-50 text-[#2998d6] mx-auto flex items-center justify-center border border-sky-100">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    {uploadFile ? (
                      <div className="space-y-0.5">
                        <strong className="text-slate-900 block font-semibold text-xs truncate max-w-xs mx-auto">
                          {uploadFile.name}
                        </strong>
                        <span className="text-[10px] text-emerald-600 font-mono font-bold block">
                          Ready ({formatFileSize(uploadFile.size)}) · Click to replace
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-0.5">
                        <span className="text-xs font-semibold text-slate-700 block">
                          Click to select a file
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          PDF, PNG, JPG, Word, Excel, CSV up to 10 MB
                        </span>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setUploadModalApp(null);
                    setUploadDocType('');
                    setUploadFile(null);
                  }}
                  className="accounting-btn-secondary !h-9 !px-4"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isUploadingDoc || !uploadFile}
                  className="accounting-btn-primary !h-9 !px-5 !bg-[#2998d6] hover:!bg-[#1f85be] flex items-center gap-1.5 shadow-xs"
                >
                  {isUploadingDoc ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading Document...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Submit Requirement File</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LIVE VIRTUAL TRAINING ATTENDEE MODAL (SME CLASSROOM) */}
      {activeLiveTraining && (
        <VirtualTrainingAttendeeModal
          training={activeLiveTraining}
          onClose={closeWebinar}
          onCompleted={() => {
            triggerToast('Accredited Certificate generated and logged to your SME profile! (+12% points)');
          }}
        />
      )}
    </div>
  );
}
