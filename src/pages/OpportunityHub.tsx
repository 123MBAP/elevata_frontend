import { useState, useMemo } from 'react';
import { useApp, Training } from '../context/AppContext';
import { formatRWF } from '../lib/mockData';
import {
  Sparkles,
  Search,
  CheckCircle,
  XCircle,
  Send,
  Video,
  Award,
  Clock,
  FileText,
  Bookmark,
  Bell,
  UploadCloud
} from 'lucide-react';
import { Card, CardContent } from '../assets/components/ui/card';

export default function OpportunityHub() {
  const {
    opportunities,
    applications,
    trainings,
    activeSme,
    applyForOpportunity,
    joinTraining,
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
    { sender: 'ai', text: 'Hi Marie! I can answer any questions about this opportunity. Ask me about interest rates, deadlines, or required files.' }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  // Training Center Modal
  const [activeLiveTraining, setActiveLiveTraining] = useState<Training | null>(null);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [trainingEnded, setTrainingEnded] = useState(false);
  const [trainingQuestions, setTrainingQuestions] = useState<Array<{ id: string; author: string; avatar: string; text: string }>>([]);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [webinarTimer, setWebinarTimer] = useState<any>(null);

  // User notifications checklist
  const [notifications] = useState([
    { id: 1, title: 'New Opportunity', desc: 'BPR Bank posted a "Business Expansion Loan" matching your profile.', time: '2 hours ago', read: false },
    { id: 2, title: 'Training Invitation', desc: 'Join the "Financial Readiness & Tax Compliance" webinar tomorrow.', time: '1 day ago', read: false },
    { id: 3, title: 'Application Approved', desc: 'Your application for "Women-Led Tech Venture Fund" has been accepted.', time: '3 days ago', read: true }
  ]);

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
      let reasons: string[] = [];
      let missing: string[] = [];

      // Sector Match
      const sectorMatch = opp.sectors.includes(activeSme.sector);
      if (sectorMatch) {
        score += 30;
        reasons.push(`Sector matches "${activeSme.sector}"`);
      } else {
        missing.push(`Targeted sectors are ${opp.sectors.join(', ')}`);
      }

      // Revenue Match (Marie's Kigali Fresh Mart has approx 5.8M monthly)
      const monthlyRevenue = activeSme.monthlyData[activeSme.monthlyData.length - 1]?.revenue || 4000000;
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

  // Handle Quick Apply
  const handleApply = (oppId: string, oppTitle: string) => {
    applyForOpportunity(oppId, activeSme.id);
    triggerToast(`Application submitted successfully for "${oppTitle}"!`);
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
        response = `The BPR Business Expansion Loan features a 12% p.a. fixed interest rate. There is also a 3 months grace period on principal repayments.`;
      } else if (textLower.includes('deadline') || textLower.includes('when')) {
        response = `The deadline for this opportunity is ${selectedOpp.deadline}. I recommend submitting your file 3 days prior.`;
      } else if (textLower.includes('document') || textLower.includes('file') || textLower.includes('upload')) {
        response = `You will need: ${selectedOpp.requiredDocs.join(', ')}. Currently, your tax compliance matches!`;
      } else if (textLower.includes('collateral') || textLower.includes('land')) {
        response = `No land collateral is required for this program, but you must register your stock ledger to Elevata's digital collateral system.`;
      } else {
        response = `Great question! The maximum funding is ${selectedOpp.maxFunding}. Your current cashflow trend (+8.5%) and business health score (${activeSme.healthScore}) make you a strong candidate for approval.`;
      }

      setChatHistory(prev => [...prev, { sender: 'ai', text: response }]);
      setIsTyping(false);
    }, 1500);
  };

  // Virtual Webinar Simulator
  const startWebinar = (tr: Training) => {
    setActiveLiveTraining(tr);
    setTrainingProgress(0);
    setTrainingEnded(false);

    setTrainingQuestions([
      { id: 'q1', author: 'Marie Kabera', avatar: 'MK', text: 'Will these slides be shared after the session?' },
      { id: 'q2', author: 'Jean Bosco', avatar: 'JB', text: 'Does BPR require audited financials for cooperative members?' }
    ]);

    if (webinarTimer) clearInterval(webinarTimer);

    // Simulate training attendance progression
    const timer = setInterval(() => {
      setTrainingProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          setTrainingEnded(true);
          // Update training registration completed in global context
          joinTraining(tr.id);
          return 100;
        }
        return prev + 20;
      });
    }, 2000);
    setWebinarTimer(timer);
  };

  const closeWebinar = () => {
    if (webinarTimer) clearInterval(webinarTimer);
    setWebinarTimer(null);
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
            Welcome back, {activeSme.ownerName.split(' ')[0]}!
          </h1>
          <p className="text-xs text-slate-500 max-w-xl font-sans">
            AI matched <strong className="text-slate-900 font-bold">{scoredOpportunities.filter(o => o.matchPercent >= 60).length} financial opportunities</strong> matching your retail business profile today.
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
                    onClick={() => handleApply(recommendedOpp.id, recommendedOpp.title)}
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
                    {notifications.filter(n => !n.read).length} new
                  </span>
                </div>

                <div className="space-y-2.5 pt-3 max-h-48 overflow-y-auto pr-1">
                  {notifications.map(n => (
                    <div key={n.id} className={`p-2.5 rounded-lg border text-xs space-y-0.5 ${
                      n.read ? 'bg-slate-50 border-slate-100 text-slate-500' : 'bg-indigo-50/10 border-indigo-100/50 text-slate-800'
                    }`}>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-900">{n.title}</span>
                        <span className="text-[8px] text-slate-400 font-mono">{n.time}</span>
                      </div>
                      <p className="text-[10px] leading-relaxed">{n.desc}</p>
                    </div>
                  ))}
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
                        onClick={() => handleApply(opp.id, opp.title)}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold transition text-[9px]"
                      >
                        Quick Apply
                      </button>
                    </div>
                  </div>
                </div>
              ))}
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
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Virtual Capacity Academy</h3>
              <p className="text-[10px] text-slate-400 mt-0.5 font-sans">Attend online webinars and download certificates to prove qualification.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {trainings.map(tr => (
                <div key={tr.id} className="p-4 border border-slate-200 bg-white rounded-lg flex flex-col justify-between hover:shadow-md transition">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <span className={`text-[8px] font-bold px-2 py-0.5 rounded border ${
                        tr.attended ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {tr.attended ? 'Completed' : 'Upcoming'}
                      </span>
                      {tr.hasCertificate && (
                        <Award className="w-4 h-4 text-emerald-500" />
                      )}
                    </div>

                    <h4 className="text-xs font-bold text-slate-900">{tr.title}</h4>
                    <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{tr.description}</p>
                    
                    <div className="space-y-1 text-[10px] text-slate-400 font-sans border-t border-slate-100 pt-2">
                      <div>🗓 {tr.date} · {tr.time}</div>
                      <div>👤 {tr.speaker}</div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end gap-2">
                    {tr.hasCertificate ? (
                      <button
                        onClick={() => triggerToast(`Downloading PDF Certificate of Completion for "${tr.title}"...`)}
                        className="px-2.5 py-1 text-[10px] font-bold bg-white border border-slate-200 rounded hover:bg-slate-50 text-slate-700 transition"
                      >
                        Download PDF
                      </button>
                    ) : (
                      <button
                        onClick={() => startWebinar(tr)}
                        className="px-3 py-1 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded shadow-sm transition flex items-center gap-1"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Attend Training</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
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
              {applications.filter(app => app.smeId === activeSme.id).map(app => (
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
            </div>
          </div>
        )}
      </div>

      {/* OPPORTUNITY DETAILS INTERACTIVE MODAL */}
      {selectedOpp && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-lg shadow-2xl w-full max-w-4xl h-[560px] overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-150">
            {/* Left 60%: Opportunity details & checklist */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4 border-r border-slate-100">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded uppercase">
                  {selectedOpp.category}
                </span>
                
                <button
                  onClick={() => setSelectedOppId(null)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold md:hidden"
                >
                  ✕
                </button>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-950 font-heading">{selectedOpp.title}</h3>
                <p className="text-[10px] text-slate-400">Published by {selectedOpp.institution} · Deadline: {selectedOpp.deadline}</p>
              </div>

              <div className="space-y-1">
                <h4 className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Overview</h4>
                <p className="text-xs text-slate-600 leading-relaxed font-sans">{selectedOpp.description}</p>
              </div>

              <div className="space-y-1">
                <h4 className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Benefits</h4>
                <p className="text-xs text-slate-600 leading-relaxed font-sans">{selectedOpp.benefits}</p>
              </div>

              {/* Dynamic Eligibility Checklists */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <h4 className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Eligibility Checklist Match</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {[
                    { label: `Target Sector matches (${activeSme.sector})`, met: selectedOpp.sectors.includes(activeSme.sector) },
                    { label: `Monthly Sales threshold (${formatRWF(selectedOpp.minRevenue)})`, met: (activeSme.monthlyData[activeSme.monthlyData.length-1]?.revenue || 0) >= selectedOpp.minRevenue },
                    { label: `Min Business Age (${selectedOpp.minAge} Years)`, met: true },
                    { label: `Tax Compliant registration status`, met: true },
                    { label: `Business Health rating (Min ${selectedOpp.minHealthScore})`, met: activeSme.healthScore >= selectedOpp.minHealthScore },
                    { label: `Loan Readiness metric (Min ${selectedOpp.minReadinessScore}%)`, met: calculatedReadiness >= selectedOpp.minReadinessScore }
                  ].map((rule, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 p-2 bg-slate-50 rounded border border-slate-100">
                      {rule.met ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                      )}
                      <span className="text-[10px] text-slate-600 font-medium leading-tight">{rule.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Required Documents checklist */}
              <div className="space-y-2 pt-1">
                <h4 className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Required Documentation checklist</h4>
                <div className="flex flex-wrap gap-2 text-xs">
                  {selectedOpp.requiredDocs.map((doc, i) => (
                    <span key={i} className="px-2.5 py-1 bg-white border border-slate-200 rounded-md text-[10px] font-medium text-slate-600 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      {doc}
                    </span>
                  ))}
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
                    className="text-slate-400 hover:text-slate-600 font-bold text-sm hidden md:block"
                  >
                    ✕
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
                    className="flex-1 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-slate-400 bg-white"
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
                    handleApply(selectedOpp.id, selectedOpp.title);
                    setSelectedOppId(null);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-md transition"
                >
                  Apply Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIRTUAL WEBINAR POPUP DIALOG (FULL SCREEN ZOOM STYLE) */}
      {activeLiveTraining && (
        <div className="fixed inset-0 bg-[#0f172a] z-50 flex flex-col text-white select-none">
          {/* Top Bar */}
          <div className="px-6 py-4 bg-[#1e293b] border-b border-[#334155] flex justify-between items-center shrink-0">
            <div className="flex items-center space-x-3">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-red-500">Live Training Webinar</span>
              <span className="text-gray-400">|</span>
              <h2 className="text-sm font-bold truncate max-w-md text-gray-100">{activeLiveTraining.title}</h2>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Progress bar info */}
              <div className="hidden sm:flex items-center space-x-2 text-xs">
                <span className="text-gray-400">Attendance:</span>
                <div className="w-24 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${trainingProgress}%` }}></div>
                </div>
                <span className="font-mono text-[10px] text-emerald-400 font-bold">{trainingProgress}%</span>
              </div>

              <button
                onClick={closeWebinar}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow transition"
              >
                Leave Seminar
              </button>
            </div>
          </div>

          {/* Main Grid */}
          <div className="flex-1 grid grid-cols-12 overflow-hidden h-[calc(100vh-60px)]">
            
            {/* Left Column: Attendees (3 cols) */}
            <div className="col-span-3 bg-[#131b2e] border-r border-[#1e293b] p-4 flex flex-col overflow-hidden">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider pb-3 border-b border-[#1e293b] flex justify-between items-center">
                <span>Attendees</span>
                <span className="bg-[#1e293b] px-2 py-0.5 rounded text-[10px] text-emerald-400 font-bold font-mono">
                  7
                </span>
              </h3>
              
              <div className="flex-1 overflow-y-auto pt-3 space-y-3 pr-1">
                {[
                  { id: 'a1', name: 'Jean Paul Habimana (Host)', avatar: 'JP', role: 'Presenter' },
                  { id: 'a2', name: 'Marie Kabera', avatar: 'MK', role: 'SME Owner' },
                  { id: 'a3', name: 'Jean Bosco Nsengimana', avatar: 'JB', role: 'SME Owner' },
                  { id: 'a4', name: 'Divine Mutoni', avatar: 'DM', role: 'SME Owner' },
                  { id: 'a5', name: 'David Mugisha', avatar: 'DM', role: 'SME Owner' },
                  { id: 'a6', name: 'Alice Umutoni', avatar: 'AU', role: 'SME Owner' },
                  { id: 'a7', name: 'Patrick Niyonsenga', avatar: 'PN', role: 'SME Owner' }
                ].map((att) => (
                  <div key={att.id} className="flex items-center space-x-3 p-1 rounded-lg hover:bg-slate-800/40 transition">
                    <div className="h-8 w-8 rounded-full bg-indigo-600/35 border border-indigo-500/50 flex items-center justify-center font-bold text-xs text-indigo-200">
                      {att.avatar}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-gray-200 block leading-tight">{att.name}</span>
                      <span className="text-[9px] text-gray-400">{att.role}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Center Column: Training Stream (6 cols) */}
            <div className="col-span-6 bg-[#090d16] p-6 flex flex-col justify-between overflow-hidden relative">
              {/* Seminar stream box */}
              <div className="flex-1 bg-[#131b2e] rounded-2xl border border-[#1e293b] overflow-hidden flex flex-col justify-between relative shadow-2xl">
                
                {/* Simulated Slides screen */}
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-[#0d1424] relative">
                  {/* Presentation slide content */}
                  <div className="space-y-4 max-w-md z-10">
                    <Video className="w-14 h-14 text-emerald-500 mx-auto animate-pulse" />
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest block font-mono">Module Presentation</span>
                      <h3 className="text-base font-bold text-gray-100">{activeLiveTraining.title}</h3>
                      <p className="text-xs text-slate-400 leading-relaxed font-sans">{activeLiveTraining.description}</p>
                    </div>

                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900/60 border border-slate-800 rounded-full text-[10px] text-slate-400">
                      <span>Moderated by</span>
                      <strong className="text-white font-bold">{activeLiveTraining.speaker}</strong>
                    </div>
                  </div>

                  {/* Presenter camera overlay in corner */}
                  <div className="absolute bottom-4 right-4 h-24 w-36 bg-slate-950 border border-[#334155] rounded-xl shadow-lg overflow-hidden flex flex-col justify-between p-2">
                    <div className="flex justify-between items-center text-[8px] text-slate-400">
                      <span className="font-bold truncate text-white">{activeLiveTraining.speaker}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                      <div className="h-7 w-7 rounded-full bg-emerald-600/35 flex items-center justify-center font-bold text-xs text-emerald-300">
                        {activeLiveTraining.speaker.split(' ').map(n=>n[0]).join('')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Webinar Player Controls */}
                <div className="px-6 py-4 bg-[#111726] border-t border-[#1e293b] flex justify-between items-center shrink-0">
                  <div className="flex space-x-3">
                    <button type="button" className="p-2 bg-[#1e293b] hover:bg-slate-700 rounded-lg text-xs font-bold transition">Mute</button>
                    <button type="button" className="p-2 bg-[#1e293b] hover:bg-slate-700 rounded-lg text-xs font-bold transition">Stop Video</button>
                  </div>
                  <div className="flex space-x-2">
                    <span className="px-3 py-2 bg-emerald-500/10 text-emerald-400 rounded-lg text-[10px] font-bold uppercase tracking-wider font-mono">
                      Connected Live
                    </span>
                  </div>
                </div>

                {/* Completed Screen overlay */}
                {trainingEnded && (
                  <div className="absolute inset-0 bg-[#0f172ab8] backdrop-blur-md flex flex-col items-center justify-center p-6 space-y-5 animate-in fade-in duration-300">
                    <Award className="w-16 h-16 text-emerald-400 animate-bounce" />
                    
                    <div className="space-y-1.5 text-center max-w-sm">
                      <h4 className="text-base font-bold">Training Complete!</h4>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans">
                        Your seminar attendance has been signed off. We have added a Custom Compliance certificate to your Academy dashboard.
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        closeWebinar();
                        triggerToast('Certificate successfully saved to your academy panel.');
                      }}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-xs font-extrabold rounded-lg shadow-md transition"
                    >
                      Collect Certificate & Exit
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Q&A panel (3 cols) */}
            <div className="col-span-3 bg-[#131b2e] border-l border-[#1e293b] p-4 flex flex-col justify-between overflow-hidden">
              <div className="flex-1 flex flex-col overflow-hidden">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider pb-3 border-b border-[#1e293b]">
                  Live Q&A Chat
                </h3>
                
                {/* Question List */}
                <div className="flex-1 overflow-y-auto py-3 space-y-3.5 pr-1">
                  {trainingQuestions.map((q) => (
                    <div key={q.id} className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <div className="h-6 w-6 rounded-full bg-slate-700 flex items-center justify-center font-bold text-[10px] text-white">
                          {q.avatar}
                        </div>
                        <span className="text-[10px] font-bold text-gray-300">{q.author}</span>
                      </div>
                      <div className="p-2.5 bg-[#1a233a] border border-[#232f4e] rounded-lg text-xs leading-relaxed text-gray-200">
                        {q.text}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ask Question Input Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newQuestionText.trim()) return;
                  const newQ = {
                    id: Date.now().toString(),
                    author: activeSme.ownerName,
                    avatar: activeSme.ownerName.split(' ').map(n=>n[0]).join(''),
                    text: newQuestionText
                  };
                  setTrainingQuestions(prev => [...prev, newQ]);
                  setNewQuestionText('');
                }}
                className="pt-3 border-t border-[#1e293b] flex gap-2 shrink-0"
              >
                <input
                  type="text"
                  placeholder="Ask a question..."
                  value={newQuestionText}
                  onChange={(e) => setNewQuestionText(e.target.value)}
                  className="flex-1 bg-[#1a233a] border border-[#232f4e] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#38bdf8] text-white"
                />
                <button
                  type="submit"
                  disabled={!newQuestionText.trim()}
                  className="p-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
