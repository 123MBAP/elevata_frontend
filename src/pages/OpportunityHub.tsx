import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApp, Training } from '../context/AppContext';
import { formatRWF } from '../lib/mockData';
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
  Globe
} from 'lucide-react';
import { Card, CardContent } from '../assets/components/ui/card';
import FormattedText from '../assets/components/ui/FormattedText';
import VirtualTrainingAttendeeModal from '../assets/components/VirtualTrainingAttendeeModal';

export default function OpportunityHub() {
  const {
    opportunities,
    applications,
    trainings,
    activeSme,
    applyForOpportunity,
    bookmarkOpportunity,
    bookmarkedOpportunities
  } = useApp();

  // Tab control inside SME Hub
  const [activeTab, setActiveTab] = useState<'marketplace' | 'readiness' | 'trainings' | 'applications'>('marketplace');
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

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
    return opportunities.map(opp => {
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
    }).sort((a, b) => b.matchPercent - a.matchPercent);
  }, [opportunities, activeSme, calculatedReadiness]);

  const recommendedOpp = useMemo(() => {
    return scoredOpportunities[0];
  }, [scoredOpportunities]);

  const selectedOpp = useMemo(() => {
    return scoredOpportunities.find(o => o.id === selectedOppId) || null;
  }, [scoredOpportunities, selectedOppId]);

  // Quick Apply Modal Form State
  const [applyingOpp, setApplyingOpp] = useState<typeof scoredOpportunities[0] | null>(null);
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

  const handleOpenApplyModal = (opp: typeof scoredOpportunities[0]) => {
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
      setActiveTab('applications');
    } catch (error: unknown) {
      setIsSubmittingApp(false);
      const message = error instanceof Error ? error.message : 'Unable to submit the application.';
      setApplyErrors({ submit: message });
      triggerToast(message);
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
      const matchSearch = opp.title.toLowerCase().includes(searchTerm.toLowerCase()) || opp.institution.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = categoryFilter === 'All' || opp.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [scoredOpportunities, searchTerm, categoryFilter]);

  return (
    <div className="space-y-6 bg-white min-h-screen pb-12">
      {/* Toast popup */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 bg-slate-950 text-white px-5 py-3 rounded-lg shadow-2xl text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-200">
          <Sparkles className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Header */}
      <div className="p-6 bg-slate-50 border border-slate-200 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded border border-emerald-100 uppercase tracking-widest flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-600 animate-pulse" />
              Elevata AI Insight
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight font-heading">
            {activeSme.ownerName ? `Welcome back, ${activeSme.ownerName.split(' ')[0]}!` : 'Welcome to Opportunity Hub'}
          </h1>
          <p className="text-xs text-slate-500 max-w-xl font-sans">
            AI matched <strong className="text-slate-900 font-bold">{scoredOpportunities.filter(o => o.matchPercent >= 60).length} financial opportunities</strong> against your current business profile.
          </p>
        </div>

        <div className="flex gap-2.5 shrink-0 z-10">
          <button
            onClick={() => {
              setActiveTab('marketplace');
              const listElement = document.getElementById('marketplace-list');
              if (listElement) listElement.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-4 py-2 bg-slate-950 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-sm transition"
          >
            Explore Opportunities
          </button>
          
          <button
            onClick={() => setActiveTab('readiness')}
            className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 bg-white text-xs font-semibold text-slate-700 rounded-lg transition"
          >
            Check Loan Readiness
          </button>
        </div>
      </div>

      {/* Recommendations Carousel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recommended Card Left 2 Columns */}
        <div className="lg:col-span-2">
          {recommendedOpp ? (
            <div className="p-5 border border-emerald-500 ring-1 ring-emerald-500/10 rounded-lg bg-emerald-50/10 hover:bg-emerald-50/20 transition flex flex-col md:flex-row justify-between gap-5">
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold bg-emerald-500 text-white px-2 py-0.5 rounded uppercase tracking-wider">
                    Recommended Today
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 font-mono">
                    {recommendedOpp.matchPercent}% AI Match Match
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
                    className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-[10px] font-bold text-slate-700 rounded-md transition"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => handleOpenApplyModal(recommendedOpp)}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-md shadow-sm transition"
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

      {/* Tab Navigation Menu */}
      <div className="flex border-b border-slate-200 pt-3">
        {[
          { id: 'marketplace', label: 'Opportunity Marketplace' },
          { id: 'readiness', label: 'My Loan Readiness' },
          { id: 'trainings', label: 'Virtual Academy' },
          { id: 'applications', label: 'My Applications' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 text-xs font-semibold border-b-2 -mb-px transition ${
              activeTab === tab.id
                ? 'border-slate-950 text-slate-950 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT PANEL */}
      <div id="marketplace-list" className="py-2">
        
        {/* TAB 1: Marketplace */}
        {activeTab === 'marketplace' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Browse Financial Marketplace</h3>
                <p className="text-[10px] text-slate-400 mt-0.5 font-sans">Filter and apply to verified grants and loans.</p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search catalog..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-8 pr-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-400"
                  />
                </div>
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  className="bg-white border border-slate-200 text-xs px-2 py-1.5 rounded-lg focus:outline-none"
                >
                  <option value="All">All Categories</option>
                  <option value="Loan">Loans</option>
                  <option value="Grant">Grants</option>
                  <option value="Savings Product">Savings</option>
                  <option value="Investment">Investment</option>
                </select>
              </div>
            </div>

            {/* Marketplace Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMarketplace.map(opp => (
                <div
                  key={opp.id}
                  className="p-4 border border-slate-200 rounded-lg bg-white shadow-sm flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition duration-150"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="text-[9px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded uppercase">
                        {opp.category}
                      </span>
                      
                      <button
                        onClick={() => {
                          bookmarkOpportunity(opp.id);
                          triggerToast(bookmarkedOpportunities.includes(opp.id) ? 'Removed bookmark.' : 'Opportunity bookmarked!');
                        }}
                        className={`text-slate-400 hover:text-slate-600 transition ${
                          bookmarkedOpportunities.includes(opp.id) ? 'text-indigo-600 fill-indigo-600' : ''
                        }`}
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{opp.title}</h4>
                      <p className="text-[9px] text-slate-400">{opp.institution}</p>
                    </div>

                    <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">
                      {opp.description}
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
                      <div className="p-1.5 bg-slate-50 border border-slate-100 rounded">
                        <span className="text-slate-400 block text-[8px] uppercase">AI Match</span>
                        <span className="font-bold text-emerald-600 font-mono">{opp.matchPercent}%</span>
                      </div>
                      <div className="p-1.5 bg-slate-50 border border-slate-100 rounded">
                        <span className="text-slate-400 block text-[8px] uppercase">App Chance</span>
                        <span className={`font-bold font-mono ${
                          opp.chance === 'High' ? 'text-emerald-600' : opp.chance === 'Medium' ? 'text-amber-600' : 'text-rose-600'
                        }`}>{opp.chance}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-[10px]">
                    <span className="text-slate-400 font-mono">Max: {opp.maxFunding}</span>
                    
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => setSelectedOppId(opp.id)}
                        className="px-2.5 py-1 border border-slate-200 rounded hover:bg-slate-50 font-bold transition text-[9px]"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => handleOpenApplyModal(opp)}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold transition text-[9px]"
                      >
                        Quick Apply
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {filteredMarketplace.length === 0 && (
                <div className="md:col-span-2 lg:col-span-3 rounded-xl border border-dashed border-slate-300 p-10 text-center text-xs text-slate-500">
                  {opportunities.length === 0
                    ? 'No opportunities have been published yet.'
                    : 'No opportunities match the current filters.'}
                </div>
              )}
            </div>
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
                <Sparkles className="w-4.5 h-4.5 text-emerald-600" />
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
                  <div key={item.id} className="p-3 bg-white border border-slate-200 rounded-lg flex justify-between items-center gap-4 hover:shadow-sm transition">
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
                        className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold border border-emerald-100 rounded-md transition flex items-center gap-1 shrink-0"
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
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-bold transition shadow-sm flex items-center gap-1.5"
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
                  <div key={tr.id} className="p-4 border border-slate-200 bg-white rounded-xl flex flex-col justify-between hover:shadow-lg transition-all duration-150 space-y-3">
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-start">
                        {isLive ? (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border bg-red-50 text-red-600 border-red-200 flex items-center gap-1 font-mono uppercase tracking-wider animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" /> LIVE NOW
                          </span>
                        ) : isCompleted ? (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200 uppercase tracking-wider">
                            ✓ Certified
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border bg-blue-50 text-blue-700 border-blue-100 uppercase tracking-wider">
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
                          <div className="flex items-center gap-1.5 text-[10px] text-[#0a66c2] font-semibold">
                            <ShieldCheck className="w-3 h-3 text-[#0a66c2] shrink-0" />
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
                        className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-sm ${
                          isLive
                            ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                            : isCompleted
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
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
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">My Application Workspace</h3>
              <p className="text-[10px] text-slate-400 mt-0.5 font-sans">Track status and respond to requirements requests.</p>
            </div>

            <div className="space-y-3">
              {applications.map(app => (
                <div key={app.id} className="p-4 border border-slate-200 bg-white rounded-lg space-y-3">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{app.opportunityTitle}</h4>
                      <span className="text-[9px] text-slate-400 font-mono">App Ref: {app.id} · Applied: {app.appliedAt}</span>
                    </div>

                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      app.status === 'Approved'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        : app.status === 'Rejected'
                        ? 'bg-rose-50 text-rose-700 border border-rose-100'
                        : app.status === 'Under Review'
                        ? 'bg-blue-50 text-blue-700 border border-blue-100'
                        : 'bg-slate-50 text-slate-500'
                    }`}>
                      {app.status}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-2 border border-slate-100">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Institution Feedback</span>
                      <p className="text-slate-600 font-sans mt-0.5">{app.feedback}</p>
                    </div>

                    {app.aiSuggestions.length > 0 && (
                      <div className="pt-2 border-t border-slate-200/60 space-y-1 text-slate-500">
                        <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-500" /> AI suggestion for approval speedup
                        </span>
                        <ul className="list-disc pl-4 space-y-0.5 text-slate-600 text-[10px]">
                          {app.aiSuggestions.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {applications.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-xs text-slate-500">
                  No applications submitted yet.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {selectedOpp && (() => {
        const activeSmeLocation = 'Not provided';
        const activeSmeAnnualRevenue = activeSme.monthlyData.reduce((sum, item) => sum + item.revenue, 0);
        const activeSmeMonthlyRevenue = activeSme.monthlyData[activeSme.monthlyData.length - 1]?.revenue || 0;
        const minMonthly = selectedOpp.minMonthlyRevenue || Math.round(selectedOpp.minRevenue / 12);

        return (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-lg shadow-2xl w-full max-w-4xl h-[560px] overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-150">
              <div className="flex-1 p-5 overflow-y-auto space-y-4 border-r border-slate-100">
                <div className="flex justify-between items-start">
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded uppercase">
                      {selectedOpp.category}
                    </span>
                    {selectedOpp.category === 'Loan' && (
                      <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded uppercase flex items-center gap-1">
                        <Coins className="w-3 h-3 text-indigo-600" />
                        Financing
                      </span>
                    )}
                    {selectedOpp.sectors.includes('Agriculture') && (
                      <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded uppercase flex items-center gap-1">
                        <Sprout className="w-3 h-3 text-emerald-600" />
                        Agrisolutions
                      </span>
                    )}
                  </div>
                  
                  <button
                    onClick={() => setSelectedOppId(null)}
                    className="p-1 text-slate-400 hover:text-slate-600 transition md:hidden"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-955 font-heading">{selectedOpp.title}</h3>
                  <p className="text-[10px] text-slate-400">Published by {selectedOpp.institution} · Deadline: {selectedOpp.deadline}</p>
                </div>

                <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-[#0a66c2]">Verified financial institution</span>
                      <p className="mt-1 text-xs font-bold text-slate-900">{selectedOpp.publisher?.institutionName || selectedOpp.institution}</p>
                      {selectedOpp.publisher?.representativeName && <p className="text-[10px] text-slate-500">Contact: {selectedOpp.publisher.representativeName}</p>}
                    </div>
                    <ShieldCheck className="h-5 w-5 shrink-0 text-[#057642]" />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedOpp.publisher?.phone && <a href={`tel:${selectedOpp.publisher.phone}`} className="flex items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-[10px] font-bold text-slate-700 shadow-sm"><Phone className="h-3 w-3 text-[#0a66c2]" />{selectedOpp.publisher.phone}</a>}
                    {selectedOpp.publisher?.email && <a href={`mailto:${selectedOpp.publisher.email}`} className="flex items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-[10px] font-bold text-slate-700 shadow-sm"><Mail className="h-3 w-3 text-[#0a66c2]" />Email officer</a>}
                    {selectedOpp.publisher?.website && <a href={selectedOpp.publisher.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-[10px] font-bold text-slate-700 shadow-sm"><Globe className="h-3 w-3 text-[#0a66c2]" />Website</a>}
                  </div>
                </div>

                {selectedOpp.sectors.includes('Agriculture') && (
                  <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3.5 shadow-sm">
                    <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0 border border-emerald-500/30">
                      <Sprout className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest block font-sans">Agribusiness / Agrisolutions Program</span>
                      <p className="text-xs text-slate-650 leading-relaxed font-sans font-medium">
                        Specialized support, inventory logistics, or equity-free grants designed for agricultural cooperatives and local farming supply chains.
                      </p>
                    </div>
                  </div>
                )}

                {selectedOpp.category === 'Loan' && (
                  <div className="bg-gradient-to-r from-indigo-500/10 via-blue-500/5 to-transparent border border-indigo-500/20 rounded-xl p-4 space-y-3 shadow-sm">
                    <div className="flex items-center gap-3.5">
                      <div className="h-10 w-10 rounded-xl bg-indigo-500/20 flex items-center justify-center shrink-0 border border-indigo-500/30">
                        <Coins className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest block font-sans">Financing Terms &amp; Cost Breakdown</span>
                        <p className="text-xs text-slate-650 leading-relaxed font-sans font-medium">
                          Detailed cost of borrowing based on your digital ledger transactions.
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-2 border-t border-indigo-500/10">
                      <div className="p-2 bg-white rounded-lg border border-indigo-500/10 shadow-sm">
                        <span className="text-slate-400 block text-[8px] uppercase tracking-wider font-semibold">Interest Rate</span>
                        <span className="font-bold text-slate-800 font-sans block text-sm mt-0.5">
                          {selectedOpp.loanRate ? `${selectedOpp.loanRate}% p.a. fixed` : 'Not specified'}
                        </span>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-indigo-500/10 shadow-sm">
                        <span className="text-slate-400 block text-[8px] uppercase tracking-wider font-semibold">Repayment Term</span>
                        <span className="font-bold text-slate-800 font-sans block text-sm mt-0.5">
                          {selectedOpp.loanTerm ? `${selectedOpp.loanTerm} Months` : 'Not specified'}
                        </span>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-indigo-500/10 shadow-sm">
                        <span className="text-slate-400 block text-[8px] tracking-wider uppercase font-semibold">Grace Period</span>
                        <span className="font-bold text-slate-800 font-sans block text-sm mt-0.5">
                          {selectedOpp.loanGrace ? `${selectedOpp.loanGrace} Months` : 'Not specified'}
                        </span>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-indigo-500/10 shadow-sm">
                        <span className="text-slate-400 block text-[8px] tracking-wider uppercase font-semibold">Collateral type</span>
                        <span className="font-bold text-slate-800 font-sans block text-sm mt-0.5 truncate" title={selectedOpp.collateralRequired ? (selectedOpp.collateralType || 'Asset Registration') : 'No Land Collateral'}>
                          {selectedOpp.collateralRequired ? (selectedOpp.collateralType || 'Asset Registration') : 'No Land Collateral'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <h4 className="text-[10px] font-bold text-slate-700 uppercase tracking-widest block font-sans">Overview &amp; Scope</h4>
                  <div className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-lg">
                    <FormattedText text={selectedOpp.description} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-[10px] font-bold text-slate-700 uppercase tracking-widest block font-sans">Benefits &amp; Terms</h4>
                  <div className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-lg">
                    <FormattedText text={selectedOpp.benefits} />
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <h4 className="text-[10px] font-bold text-slate-700 uppercase tracking-widest block font-sans">Published Requirements Summary</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-[8px] uppercase tracking-wider font-bold">Min Turnover</span>
                      </div>
                      <strong className="text-slate-900 block text-xs font-sans font-extrabold truncate" title={`${formatRWF(minMonthly)}/mo`}>
                        {formatRWF(minMonthly)}/mo
                      </strong>
                    </div>
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Coins className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-[8px] uppercase tracking-wider font-bold">Max Funding</span>
                      </div>
                      <strong className="text-slate-900 block text-xs font-sans font-extrabold truncate">
                        {selectedOpp.maxFunding}
                      </strong>
                    </div>
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-[8px] uppercase tracking-wider font-bold">Operating Age</span>
                      </div>
                      <strong className="text-slate-900 block text-xs font-sans font-extrabold truncate">
                        {selectedOpp.minAge === 0 ? 'Any Age' : `${selectedOpp.minAge}+ Year${selectedOpp.minAge > 1 ? 's' : ''}`}
                      </strong>
                    </div>
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-[8px] uppercase tracking-wider font-bold">Target Districts</span>
                      </div>
                      <strong className="text-slate-900 block text-xs font-sans font-extrabold truncate" title={selectedOpp.eligLocations?.join(', ') || 'All districts'}>
                        {selectedOpp.eligLocations && selectedOpp.eligLocations.length > 0 ? selectedOpp.eligLocations.join(', ') : 'All districts'}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <h4 className="text-[10px] font-bold text-slate-700 uppercase tracking-widest block font-sans">Dynamic SME Eligibility Match</h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-xs font-sans border-collapse bg-white">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[9px] tracking-wider">
                          <th className="px-4 py-2">Requirement</th>
                          <th className="px-4 py-2">Criteria Threshold</th>
                          <th className="px-4 py-2">Your Business Profile</th>
                          <th className="px-4 py-2 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150">
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
                          <tr key={idx} className="hover:bg-slate-50/50 transition duration-75">
                            <td className="px-4 py-2.5 font-semibold text-slate-800 text-[10.5px]">{chk.name}</td>
                            <td className="px-4 py-2.5 text-slate-650 font-mono text-[10px]">{chk.req}</td>
                            <td className="px-4 py-2.5 text-slate-600 font-mono text-[10px]">{chk.val}</td>
                            <td className="px-4 py-2.5 text-right">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${
                                chk.met 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-150' 
                                  : 'bg-rose-50 text-rose-700 border-rose-150'
                              }`}>
                                {chk.met ? 'Met' : 'Not Met'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <h4 className="text-[10px] font-bold text-slate-700 uppercase tracking-widest block font-sans">Required Documentation Checklist</h4>
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
                        label = "Upload Document";
                      }

                      return (
                        <div key={i} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center gap-3">
                          <div className="flex items-center gap-2 text-[10.5px] font-semibold text-slate-750 truncate max-w-[65%]">
                            <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                            <span title={doc} className="truncate">{doc}</span>
                          </div>
                          {isUploaded ? (
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-150 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-wider font-sans shrink-0">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                              Uploaded
                            </span>
                          ) : (
                            <button
                              onClick={action}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-[9.5px] font-bold px-2.5 py-1 rounded-md shadow-sm transition border-none shrink-0"
                            >
                              {label}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Right 40%: AI Assistant Panel */}
              <div className="w-full md:w-80 bg-slate-50/50 p-5 flex flex-col justify-between h-full">
                <div className="flex-1 flex flex-col justify-between h-[90%] overflow-hidden">
                  <div className="pb-3 border-b border-slate-200 flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
                      <div>
                        <h4 className="text-[11px] font-bold text-slate-900 font-heading">Ask AI Assistant</h4>
                        <p className="text-[8px] text-slate-400 font-sans uppercase">Elevata advisor online</p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => setSelectedOppId(null)}
                      className="p-1 text-slate-400 hover:text-slate-600 transition hidden md:block"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Chat conversation area */}
                  <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1 text-xs">
                    {chatHistory.map((msg, i) => (
                      <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`p-2.5 rounded-lg max-w-[85%] leading-relaxed ${
                          msg.sender === 'user' ? 'bg-slate-950 text-white font-medium' : 'bg-white border border-slate-200 text-slate-700'
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    ))}
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="p-2.5 bg-white border border-slate-200 rounded-lg text-slate-400 font-sans">
                          AI Assistant is typing...
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input query box */}
                  <form onSubmit={handleSendMessage} className="flex gap-2 pt-2 border-t border-slate-200">
                    <input
                      type="text"
                      placeholder="Ask about collateral, interest rates..."
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      className="flex-1 border border-slate-250 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-slate-400 bg-white"
                    />
                    <button
                      type="submit"
                      className="p-2 bg-slate-950 hover:bg-slate-900 text-white rounded-lg shadow-sm transition"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>

                <div className="pt-4 border-t border-slate-200 mt-4">
                  <button
                    onClick={() => {
                      const oppToApply = selectedOpp;
                      setSelectedOppId(null);
                      if (oppToApply) handleOpenApplyModal(oppToApply);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-md transition"
                  >
                    Apply Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* QUICK APPLY & DYNAMIC DOCUMENT UPLOAD MODAL */}
      {applyingOpp && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-150 bg-slate-50 flex justify-between items-start shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100 uppercase tracking-wider">
                    {applyingOpp.category} Application
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Max: {applyingOpp.maxFunding}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-950 font-heading">
                  Apply for {applyingOpp.title}
                </h3>
                <p className="text-[10px] text-slate-500">
                  Offered by <strong className="text-slate-800 font-semibold">{applyingOpp.institution}</strong> · Deadline: <span className="font-mono text-slate-700">{applyingOpp.deadline}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setApplyingOpp(null)}
                className="p-1 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmitApplication} className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
              
              {/* Top Section: Pre-filled Business Profile Dossier */}
              <div className="p-3 bg-slate-50/80 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-slate-400" />
                    Applicant Business Dossier
                  </span>
                  <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    Verified on Elevata
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
                    <strong className="text-indigo-600 font-bold block font-mono">{calculatedReadiness}%</strong>
                  </div>
                </div>
              </div>

              {/* Funding Request Details */}
              <div className="space-y-3 pt-1">
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block border-b pb-1">
                  1. Funding &amp; Facility Request
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                        Requested Amount (FRW) <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[9px] text-slate-400 font-mono">Max: {applyingOpp.maxFunding}</span>
                    </div>
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
                      className={`w-full p-2.5 rounded-lg border text-xs font-mono transition ${
                        applyErrors.applyAmount ? 'border-rose-500 ring-1 ring-rose-500/20 bg-rose-50/20' : 'border-slate-250 bg-slate-50/30 focus:ring-1 focus:ring-emerald-500'
                      } focus:outline-none`}
                      required
                    />
                    {applyErrors.applyAmount && (
                      <p className="text-[9.5px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-rose-600 shrink-0" /> {applyErrors.applyAmount}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                      Intended Use of Funds <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={applyPurpose}
                      onChange={e => setApplyPurpose(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-250 bg-white text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
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
                    <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                      Repayment / Term
                    </label>
                    <select
                      value={applyTerm}
                      onChange={e => setApplyTerm(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-250 bg-white text-xs focus:outline-none"
                    >
                      <option value="6">6 Months</option>
                      <option value="12">12 Months (1 Year)</option>
                      <option value="24">24 Months (2 Years)</option>
                      <option value="36">36 Months (3 Years)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                      Contact Phone <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={applyPhone}
                      onChange={e => setApplyPhone(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-250 bg-slate-50/30 text-xs focus:outline-none font-mono"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                      Official Email <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={applyEmail}
                      onChange={e => setApplyEmail(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-250 bg-slate-50/30 text-xs focus:outline-none"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* DYNAMIC DOCUMENT UPLOADS BASED ON OPPORTUNITY REQUIREMENTS */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b pb-1">
                  <div>
                    <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
                      2. Required Compliance &amp; Verification Documents
                    </span>
                    <p className="text-[9.5px] text-slate-400 mt-0.5">
                      Upload verification files mapped to {applyingOpp.institution}'s underwriting checklist.
                    </p>
                  </div>
                  <span className="text-[9px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {Object.keys(uploadedDocs).length} / {applyingOpp.requiredDocs.length || 1} Uploaded
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
                          className={`p-3 rounded-xl border transition flex flex-col sm:flex-row justify-between sm:items-center gap-2.5 ${
                            isUploaded ? 'bg-emerald-50/30 border-emerald-200' : 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="space-y-0.5 max-w-sm">
                            <div className="flex items-center gap-2">
                              <FileText className={`w-3.5 h-3.5 ${isUploaded ? 'text-emerald-600' : 'text-slate-400'}`} />
                              <strong className="text-xs font-bold text-slate-900">{doc}</strong>
                              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-600 uppercase tracking-wider">
                                Required
                              </span>
                            </div>

                            {isUploaded ? (
                              <p className="text-[9.5px] text-emerald-700 font-mono pl-5.5 flex items-center gap-2">
                                <span className="truncate max-w-[200px]">{uploadedInfo.fileName}</span>
                                <span className="text-slate-400">({uploadedInfo.fileSize})</span>
                                <span className="text-slate-400">· {uploadedInfo.uploadedAt}</span>
                              </p>
                            ) : (
                              <>
                                <p className="text-[9px] text-slate-400 pl-5.5">
                                  PDF, images, Office, CSV/text, audio or MP4/WebM · Max 10 MB
                                </p>
                                {applyErrors[doc] && (
                                  <p className="text-[9px] font-semibold text-rose-600 pl-5.5">{applyErrors[doc]}</p>
                                )}
                              </>
                            )}
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                            {isUploaded ? (
                              <div className="flex items-center gap-1.5">
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-bold rounded-full flex items-center gap-1">
                                  <Check className="w-2.5 h-2.5 text-emerald-700 stroke-[3]" />
                                  Attached
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveUploadedDoc(doc)}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                                  title="Remove file"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <label className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-[10px] font-bold rounded-lg cursor-pointer transition flex items-center gap-1.5 shadow-2xs">
                                <UploadCloud className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Attach Document</span>
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
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-400 text-[10px]">
                      No additional documents required for this program.
                    </div>
                  )}
                </div>
              </div>

              {/* Cover Note */}
              <div className="space-y-1 pt-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                  3. Remarks / Note to Underwriting Officer (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Provide additional context regarding your operational cashflows, upcoming supplier contracts, or specific financing timelines..."
                  value={applyNotes}
                  onChange={e => setApplyNotes(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-250 bg-slate-50/30 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none leading-relaxed"
                />
              </div>

              {/* Consent and terms checkbox */}
              <div className="pt-2 border-t border-slate-200/80">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyAgreed}
                    onChange={e => setApplyAgreed(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-slate-600 leading-snug">
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
              <div className="pt-3 border-t border-slate-150 flex justify-between items-center shrink-0">
                <button
                  type="button"
                  onClick={() => setApplyingOpp(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmittingApp}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
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
