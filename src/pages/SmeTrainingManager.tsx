import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Users,
  Award,
  BookOpen,
  Search,
  CheckCircle2,
  Radio,
  Sparkles,
  ExternalLink,
  Printer,
  Building2,
  GraduationCap,
  CalendarPlus,
  PlayCircle,
  Globe,
  X,
  Check,
  CheckCircle,
  FileText,
  LayoutGrid,
  List,
  Clock,
  ArrowRight,
  ShieldCheck,
  Filter
} from 'lucide-react';
import { Training, useApp } from '../context/AppContext';
import VirtualTrainingAttendeeModal from '../assets/components/VirtualTrainingAttendeeModal';

export type TrainingTab = 'all' | 'enrolled' | 'live' | 'certificates';

export default function SmeTrainingManager() {
  const {
    activeSme,
    trainings,
    toggleTrainingEnrollment,
    joinTraining
  } = useApp();

  const [activeTab, setActiveTab] = useState<TrainingTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sectorFilter, setSectorFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [attendingTraining, setAttendingTraining] = useState<Training | null>(null);
  const [previewCertTraining, setPreviewCertTraining] = useState<Training | null>(null);
  const [showAttentionBanner, setShowAttentionBanner] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filtered trainings: search query, sector filter, status filter
  const allScheduledTrainings = trainings.filter(t => {
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDesc = t.description?.toLowerCase().includes(q);
      const matchSpeaker = t.speaker?.toLowerCase().includes(q);
      const matchOrg = t.speakerOrg?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchSpeaker && !matchOrg) return false;
    }

    // Sector filter
    if (sectorFilter !== 'ALL') {
      const hasSector = t.targetAudience?.some(
        aud => aud.toLowerCase().includes(sectorFilter.toLowerCase()) || aud === 'All Sectors'
      );
      if (!hasSector) return false;
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'live' && t.status !== 'live') return false;
      if (statusFilter === 'scheduled' && t.status === 'live') return false;
      if (statusFilter === 'completed' && !t.completed && !t.attended) return false;
    }

    return true;
  });

  // Enrolled list: sessions where SME has enrolled OR has attended/completed OR is listed in attendees
  const enrolledTrainings = allScheduledTrainings.filter(t => {
    const isExplicitlyEnrolled = t.enrolled;
    const isAttendee = t.attendees?.some(a => a.id === activeSme.id);
    const hasAttended = t.attended;
    return isExplicitlyEnrolled || isAttendee || hasAttended;
  });

  const liveTrainings = allScheduledTrainings.filter(t => t.status === 'live');
  const completedTrainings = enrolledTrainings.filter(t => t.completed || t.attended);
  const readinessBoostTotal = completedTrainings.length * 12;

  const handleAddToCalendar = (training: Training) => {
    const title = encodeURIComponent(training.title);
    const details = encodeURIComponent(
      `${training.description}\n\nDelivering Institution: ${training.speakerOrg || 'Bank Partner'}\nInstructor: ${training.speaker}\nMeeting Link: ${training.meetingLink}`
    );
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}`;
    window.open(url, '_blank');
    showToast(`Added "${training.title}" to Google Calendar.`);
  };

  const handleToggleEnroll = (id: string, title: string, currentlyEnrolled: boolean) => {
    toggleTrainingEnrollment(id);
    showToast(currentlyEnrolled ? `Unenrolled from "${title}"` : `Successfully enrolled in "${title}"`);
  };

  const currentDisplayList =
    activeTab === 'all'
      ? allScheduledTrainings
      : activeTab === 'enrolled'
      ? enrolledTrainings
      : activeTab === 'live'
      ? liveTrainings
      : [];

  const tabsConfig = [
    {
      id: 'all' as TrainingTab,
      label: 'All Masterclasses',
      icon: <Globe className="w-4 h-4" />,
      count: allScheduledTrainings.length,
      color: 'text-[#2998d6]'
    },
    {
      id: 'enrolled' as TrainingTab,
      label: 'My Enrolled',
      icon: <BookOpen className="w-4 h-4" />,
      count: enrolledTrainings.length,
      color: 'text-[#2998d6]'
    },
    {
      id: 'live' as TrainingTab,
      label: 'Live Now',
      icon: <Radio className="w-4 h-4" />,
      count: liveTrainings.length,
      color: 'text-rose-600'
    },
    {
      id: 'certificates' as TrainingTab,
      label: 'Accredited Certs',
      icon: <Award className="w-4 h-4" />,
      count: completedTrainings.length,
      color: 'text-amber-600'
    }
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-20 right-6 z-50 bg-[#1a2332] text-white text-xs px-4 py-3 rounded-xl shadow-xl flex items-center space-x-2 border border-[#2d3b4e]"
        >
          <CheckCircle className="w-4 h-4 text-[#38bdf8]" />
          <span className="font-medium">{toastMessage}</span>
        </motion.div>
      )}

      {/* ========================================================================= */}
      {/* 1. TOP ATTENTION / LIVE BROADCAST BANNER (Matching BusinessActivities style) */}
      {/* ========================================================================= */}
      {showAttentionBanner && liveTrainings.length > 0 ? (
        <div className="flex items-center justify-between rounded-[4px] bg-[#ffa834] px-3.5 sm:px-4 py-2 text-white shadow-xs transition-all">
          <div
            onClick={() => setAttendingTraining(liveTrainings[0])}
            className="flex items-center gap-2 sm:gap-2.5 text-xs sm:text-[13px] font-semibold cursor-pointer hover:opacity-95 select-none transition-opacity min-w-0"
            title="Click to enter live masterclass classroom"
          >
            <Radio className="w-4 h-4 shrink-0 text-white animate-pulse" />
            <span className="font-bold">Live Masterclass!</span>
            <span className="truncate">
              "{liveTrainings[0].title}" by {liveTrainings[0].speakerOrg || 'Delivering Bank Partner'}.
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setAttendingTraining(liveTrainings[0]);
              }}
              className="ml-1 sm:ml-2 px-2.5 py-0.5 rounded-[4px] bg-white/20 hover:bg-white/30 text-white text-[11px] font-bold border border-white/40 shadow-xs transition-colors cursor-pointer shrink-0"
            >
              Enter Classroom
            </button>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowAttentionBanner(false)}
              className="rounded-full p-1 text-white/80 hover:bg-white/20 hover:text-white transition-colors cursor-pointer"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
              title={viewMode === 'grid' ? 'Switch to Ledger Table' : 'Switch to Grid View'}
              className="hidden sm:flex items-center justify-center h-7 w-7 rounded-[4px] bg-[#2998d6] hover:bg-[#1f85be] text-white transition-colors shadow-xs cursor-pointer"
            >
              {viewMode === 'grid' ? <List className="w-3.5 h-3.5" /> : <LayoutGrid className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      ) : showAttentionBanner && (
        <div className="flex items-center justify-between rounded-[4px] bg-[#1a2332] border border-[#2d3b4e] px-3.5 sm:px-4 py-2 text-white shadow-xs transition-all">
          <div className="flex items-center gap-2 sm:gap-2.5 text-xs sm:text-[13px] font-medium text-slate-200">
            <ShieldCheck className="w-4 h-4 shrink-0 text-[#38bdf8]" />
            <span className="font-bold text-white">Institutional Capacity Building:</span>
            <span>
              Each accredited masterclass completed adds <strong>+12%</strong> directly to your underwriting readiness score.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#2998d6] text-white">
              Current Boost: +{readinessBoostTotal}%
            </span>
            <button
              type="button"
              onClick={() => setShowAttentionBanner(false)}
              className="rounded-full p-1 text-slate-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. STATS RIBBON CARDS (Matching Accounting Metrics) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Catalog */}
        <div
          onClick={() => setActiveTab('all')}
          className={`accounting-card p-4 transition-all cursor-pointer hover:border-[#2998d6] flex items-center justify-between ${
            activeTab === 'all' ? 'border-[#2998d6] ring-1 ring-[#2998d6] shadow-sm' : ''
          }`}
        >
          <div>
            <span className="accounting-label !text-[11px] uppercase tracking-wider font-semibold">Available Catalog</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl sm:text-2xl font-bold font-mono text-slate-900">{allScheduledTrainings.length}</span>
              <span className="text-xs text-slate-500 font-medium">Sessions</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Bank accredited workshops</span>
          </div>
          <div className="w-9 h-9 rounded-[4px] bg-sky-50 text-[#2998d6] flex items-center justify-center font-bold shrink-0 border border-sky-100">
            <Globe className="w-4.5 h-4.5" />
          </div>
        </div>

        {/* Live Now */}
        <div
          onClick={() => setActiveTab('live')}
          className={`accounting-card p-4 transition-all cursor-pointer hover:border-[#2998d6] flex items-center justify-between ${
            activeTab === 'live' ? 'border-[#2998d6] ring-1 ring-[#2998d6] shadow-sm' : ''
          }`}
        >
          <div>
            <span className="accounting-label !text-[11px] uppercase tracking-wider font-semibold">Live Classrooms</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl sm:text-2xl font-bold font-mono text-rose-600">{liveTrainings.length}</span>
              {liveTrainings.length > 0 && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-rose-50 text-rose-600 text-[10px] font-bold border border-rose-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-600 animate-ping" />
                  Active
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Real-time virtual sessions</span>
          </div>
          <div className="w-9 h-9 rounded-[4px] bg-rose-50 text-rose-600 flex items-center justify-center font-bold shrink-0 border border-rose-100">
            <Radio className="w-4.5 h-4.5" />
          </div>
        </div>

        {/* Enrolled */}
        <div
          onClick={() => setActiveTab('enrolled')}
          className={`accounting-card p-4 transition-all cursor-pointer hover:border-[#2998d6] flex items-center justify-between ${
            activeTab === 'enrolled' ? 'border-[#2998d6] ring-1 ring-[#2998d6] shadow-sm' : ''
          }`}
        >
          <div>
            <span className="accounting-label !text-[11px] uppercase tracking-wider font-semibold">Enrolled Learning</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl sm:text-2xl font-bold font-mono text-[#2998d6]">{enrolledTrainings.length}</span>
              <span className="text-xs text-slate-500 font-medium">Enrolled</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">On active calendar track</span>
          </div>
          <div className="w-9 h-9 rounded-[4px] bg-sky-50 text-[#2998d6] flex items-center justify-center font-bold shrink-0 border border-sky-100">
            <BookOpen className="w-4.5 h-4.5" />
          </div>
        </div>

        {/* Accredited Certificates */}
        <div
          onClick={() => setActiveTab('certificates')}
          className={`accounting-card p-4 transition-all cursor-pointer hover:border-[#2998d6] flex items-center justify-between ${
            activeTab === 'certificates' ? 'border-[#2998d6] ring-1 ring-[#2998d6] shadow-sm' : ''
          }`}
        >
          <div>
            <span className="accounting-label !text-[11px] uppercase tracking-wider font-semibold">Readiness Score Boost</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-600">+{readinessBoostTotal}%</span>
              <span className="text-xs text-slate-500 font-medium">({completedTrainings.length} Certs)</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Underwriting rating weight</span>
          </div>
          <div className="w-9 h-9 rounded-[4px] bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0 border border-emerald-100">
            <Award className="w-4.5 h-4.5" />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MAIN TRAINING BOOKS & WORKSHOP CARD (Folder Tab Design) */}
      {/* ========================================================================= */}
      <div className="relative">
        {/* EYE-CATCHING FOLDER TABS BAR (Connected to Card Body) */}
        <div className="flex items-end overflow-x-auto scrollbar-none z-10 relative space-x-1 sm:space-x-1.5 -mb-[1px]">
          {tabsConfig.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
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
        <div className="accounting-card p-5 sm:p-7 relative z-0 border-[#cbd5e1] rounded-t-none space-y-5">
          {/* Card Header Title & Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#e2e8f0]">
            <div>
              <h2 className="text-xl sm:text-2xl font-normal text-[#1e293b] font-heading">
                {activeTab === 'all' && 'Capacity Building Masterclasses & Workshops Catalog'}
                {activeTab === 'enrolled' && 'My Scheduled Masterclasses & Learning Track'}
                {activeTab === 'live' && 'Live Virtual Classrooms & Interactive Workshops'}
                {activeTab === 'certificates' && 'Accredited Portfolio of Verified Certificates'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {activeTab === 'all' && 'Explore and enroll in institutional workshops scheduled by commercial banks and development partners.'}
                {activeTab === 'enrolled' && 'Track upcoming virtual sessions, access waiting rooms, or sync dates to your business calendar.'}
                {activeTab === 'live' && 'Enter active virtual delivery rooms directly to interact with instructors and credit officers.'}
                {activeTab === 'certificates' && 'Formal endorsements and completion credentials that feed into credit underwriting assessment.'}
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

              {activeTab !== 'all' && (
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className="accounting-btn-primary"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Browse All</span>
                </button>
              )}
            </div>
          </div>

          {/* Top 3 Solid Cyan Select Dropdowns / Filters Strip (matching BusinessActivities 3 selects) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label className="accounting-label">Masterclass Track Filter</label>
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value as TrainingTab)}
                className="accounting-select w-full"
              >
                <option value="all">All Masterclasses ({allScheduledTrainings.length})</option>
                <option value="enrolled">My Enrolled Sessions ({enrolledTrainings.length})</option>
                <option value="live">Live Now Broadcasts ({liveTrainings.length})</option>
                <option value="certificates">Accredited Certificates ({completedTrainings.length})</option>
              </select>
            </div>

            <div>
              <label className="accounting-label">Target Industry Sector</label>
              <select
                value={sectorFilter}
                onChange={(e) => setSectorFilter(e.target.value)}
                className="accounting-select w-full"
              >
                <option value="ALL">All Sectors (Cross-Sector Masterclasses)</option>
                <option value="Retail">Retail & Wholesale Distribution</option>
                <option value="Agriculture">Agriculture & Agri-Processing</option>
                <option value="Manufacturing">Manufacturing & Production</option>
                <option value="Technology">Technology & Digital Services</option>
                <option value="Logistics">Logistics, Transport & Supply Chain</option>
              </select>
            </div>

            <div>
              <label className="accounting-label">Quick Search Catalog</label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by masterclass, bank, speaker..."
                  className="accounting-input w-full pl-8"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* TAB 1, 2, 3: MASTERCLASS WORKSHOPS (GRID OR LEDGER TABLE) */}
          {/* ===================================================================== */}
          {activeTab !== 'certificates' && (
            <div>
              {currentDisplayList.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-[4px] border border-[#cbd5e1] space-y-3">
                  <div className="w-10 h-10 rounded-[4px] bg-sky-50 text-[#2998d6] flex items-center justify-center mx-auto border border-sky-100">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-[#181818]">
                    {activeTab === 'enrolled'
                      ? "You haven't enrolled in any masterclasses yet"
                      : activeTab === 'live'
                      ? "No live masterclasses broadcasting right now"
                      : "No masterclasses found matching your filters"}
                  </h3>
                  <p className="text-xs text-[#5e5e5e] max-w-md mx-auto">
                    All virtual masterclasses scheduled by partnering commercial banks and financial institutions are accessible to {activeSme.name}.
                  </p>
                  {activeTab !== 'all' && (
                    <button
                      onClick={() => setActiveTab('all')}
                      className="accounting-btn-primary"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>View All Masterclasses</span>
                    </button>
                  )}
                </div>
              ) : viewMode === 'grid' ? (
                /* GRID VIEW */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentDisplayList.map((training) => {
                    const isLive = training.status === 'live';
                    const isCompleted = training.completed || training.attended;
                    const isEnrolled =
                      training.enrolled ||
                      training.attendees?.some((a) => a.id === activeSme.id) ||
                      isCompleted;

                    return (
                      <div
                        key={training.id}
                        className={`accounting-card transition-all duration-150 flex flex-col justify-between overflow-hidden border-[#cbd5e1] hover:border-[#2998d6] hover:shadow-md ${
                          isLive ? 'ring-1 ring-[#2998d6] border-[#2998d6]' : ''
                        }`}
                      >
                        {/* Card Content */}
                        <div className="p-5 space-y-3.5">
                          {/* Badges strip */}
                          <div className="flex items-center justify-between gap-1.5 flex-wrap">
                            <div className="flex items-center gap-1.5">
                              {isLive ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-[#2998d6] text-white text-[10px] font-bold uppercase tracking-wider">
                                  <Radio className="w-3 h-3 animate-pulse" />
                                  <span>Live Classroom</span>
                                </span>
                              ) : isCompleted ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Completed</span>
                                </span>
                              ) : isEnrolled ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-sky-50 text-[#2998d6] text-[10px] font-bold border border-sky-200">
                                  <Check className="w-3 h-3 stroke-[3]" />
                                  <span>Enrolled</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-slate-100 text-slate-700 text-[10px] font-medium border border-slate-200">
                                  <Calendar className="w-3 h-3" />
                                  <span>Scheduled</span>
                                </span>
                              )}
                            </div>

                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-[#f8fafc] text-slate-700 text-[10px] font-medium border border-[#cbd5e1]">
                              <Building2 className="w-3 h-3 text-[#2998d6]" />
                              <span className="font-semibold truncate max-w-[130px]">{training.speakerOrg || 'Delivering Bank'}</span>
                            </span>
                          </div>

                          {/* Title & Description */}
                          <div className="space-y-1">
                            <h3 className="text-sm font-bold text-[#181818] leading-snug line-clamp-2 hover:text-[#2998d6] transition-colors">
                              {training.title}
                            </h3>
                            <p className="text-xs text-[#5e5e5e] line-clamp-2 leading-relaxed">
                              {training.description}
                            </p>
                          </div>

                          {/* Focus Sector & Readiness Boost Banner */}
                          <div className="p-2.5 rounded-[4px] bg-[#f8fafc] border border-[#e2e8f0] text-[11px] space-y-1">
                            <div className="flex items-center justify-between text-[#181818] font-semibold">
                              <span className="flex items-center gap-1 text-[#2998d6]">
                                <Globe className="w-3.5 h-3.5" />
                                <span>Open to All Registered SMEs</span>
                              </span>
                              {training.hasCertificate && (
                                <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-[4px] text-[10px] font-bold">
                                  +12% Readiness
                                </span>
                              )}
                            </div>
                            {training.targetAudience && training.targetAudience.length > 0 && (
                              <p className="text-[10px] text-[#5e5e5e] truncate">
                                <span className="font-semibold text-slate-700">Target Focus:</span>{' '}
                                {training.targetAudience.join(', ')}
                              </p>
                            )}
                          </div>

                          {/* Schedule & Instructor Meta Box */}
                          <div className="p-3 bg-[#f8fafc] rounded-[4px] space-y-1.5 text-xs text-[#181818] border border-[#e2e8f0]">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500 flex items-center gap-1.5 text-[11px]">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                <span>Date &amp; Time:</span>
                              </span>
                              <span className="font-semibold text-slate-800 font-mono text-[11px]">
                                {training.date} • {training.time}
                              </span>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-slate-500 flex items-center gap-1.5 text-[11px]">
                                <Users className="w-3.5 h-3.5 text-slate-400" />
                                <span>Lead Instructor:</span>
                              </span>
                              <span className="font-medium text-slate-800 truncate max-w-[150px] text-[11px]">
                                {training.speaker}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Card Footer Actions */}
                        <div className="p-3 bg-[#f8fafc] border-t border-[#e2e8f0]">
                          {isLive ? (
                            <button
                              type="button"
                              onClick={() => setAttendingTraining(training)}
                              className="w-full h-8 rounded-[4px] bg-[#2998d6] hover:bg-[#1f85be] text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition cursor-pointer border-none"
                            >
                              <Radio className="w-3.5 h-3.5 animate-pulse" />
                              <span>Enter Live Classroom</span>
                            </button>
                          ) : isCompleted ? (
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => setPreviewCertTraining(training)}
                                className="accounting-btn-primary !h-8 !text-xs w-full"
                              >
                                <Award className="w-3.5 h-3.5" />
                                <span>Certificate</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setAttendingTraining(training)}
                                className="accounting-btn-secondary !h-8 !text-xs w-full"
                              >
                                <BookOpen className="w-3.5 h-3.5" />
                                <span>Open Session</span>
                              </button>
                            </div>
                          ) : isEnrolled ? (
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => setAttendingTraining(training)}
                                className="accounting-btn-primary !h-8 !text-xs w-full"
                              >
                                <PlayCircle className="w-3.5 h-3.5" />
                                <span>Waiting Room</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAddToCalendar(training)}
                                className="accounting-btn-secondary !h-8 !text-xs w-full"
                                title="Add to Google Calendar"
                              >
                                <CalendarPlus className="w-3.5 h-3.5" />
                                <span>Add Calendar</span>
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleToggleEnroll(training.id, training.title, false)}
                                className="accounting-btn-primary !h-8 !text-xs flex-1"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Enroll in Masterclass</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setAttendingTraining(training)}
                                className="accounting-btn-secondary !h-8 !w-9 !px-0 flex items-center justify-center"
                                title="Preview Session Info"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* AUDIT LEDGER TABLE VIEW (Matching BusinessActivities table) */
                <div className="overflow-x-auto border border-[#cbd5e1] rounded-[4px] bg-white">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#f1f5f9] text-[#475569] font-bold border-b border-[#cbd5e1] text-[11px] uppercase tracking-wider">
                        <th className="py-2.5 px-3 w-10 text-center">#</th>
                        <th className="py-2.5 px-3 min-w-[240px]">Masterclass Title &amp; Focus</th>
                        <th className="py-2.5 px-3 w-36">Delivering Bank</th>
                        <th className="py-2.5 px-3 w-36">Instructor</th>
                        <th className="py-2.5 px-3 w-32 font-mono">Date &amp; Time</th>
                        <th className="py-2.5 px-3 w-28 text-center">Boost</th>
                        <th className="py-2.5 px-3 w-28 text-center">Status</th>
                        <th className="py-2.5 px-3 w-40 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e2e8f0] bg-white">
                      {currentDisplayList.map((tr, idx) => {
                        const isLive = tr.status === 'live';
                        const isCompleted = tr.completed || tr.attended;
                        const isEnrolled =
                          tr.enrolled || tr.attendees?.some((a) => a.id === activeSme.id) || isCompleted;

                        return (
                          <tr key={tr.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-2.5 px-3 text-center font-mono text-slate-400 font-bold">{idx + 1}</td>
                            <td className="py-2.5 px-3">
                              <div className="space-y-0.5">
                                <p className="font-bold text-slate-900 leading-tight">{tr.title}</p>
                                <p className="text-[11px] text-slate-500 line-clamp-1">{tr.description}</p>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-700">
                              <span className="flex items-center gap-1">
                                <Building2 className="w-3 h-3 text-[#2998d6]" />
                                <span>{tr.speakerOrg || 'Commercial Bank'}</span>
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-700 font-medium">
                              {tr.speaker}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                              {tr.date} {tr.time}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="inline-block px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-mono font-bold text-[10px]">
                                +12%
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {isLive ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200">
                                  <Radio className="w-2.5 h-2.5 animate-pulse" />
                                  Live
                                </span>
                              ) : isCompleted ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                                  <Check className="w-2.5 h-2.5" />
                                  Done
                                </span>
                              ) : isEnrolled ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-sky-50 text-[#2998d6] text-[10px] font-bold border border-sky-200">
                                  Enrolled
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-slate-50 text-slate-600 text-[10px] font-medium border border-slate-200">
                                  Scheduled
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {isLive ? (
                                <button
                                  type="button"
                                  onClick={() => setAttendingTraining(tr)}
                                  className="px-2.5 py-1 rounded bg-[#2998d6] hover:bg-[#1f85be] text-white text-[11px] font-bold transition shadow-xs cursor-pointer border-none inline-flex items-center gap-1"
                                >
                                  <Radio className="w-3 h-3 animate-pulse" />
                                  <span>Enter Room</span>
                                </button>
                              ) : isCompleted ? (
                                <button
                                  type="button"
                                  onClick={() => setPreviewCertTraining(tr)}
                                  className="accounting-btn-primary !h-7 !text-[11px] !px-2.5 inline-flex items-center gap-1"
                                >
                                  <Award className="w-3.5 h-3.5" />
                                  <span>View Cert</span>
                                </button>
                              ) : isEnrolled ? (
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => setAttendingTraining(tr)}
                                    className="accounting-btn-primary !h-7 !text-[11px] !px-2.5"
                                  >
                                    Join
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleAddToCalendar(tr)}
                                    className="accounting-btn-secondary !h-7 !w-7 !p-0 flex items-center justify-center"
                                    title="Add to Google Calendar"
                                  >
                                    <CalendarPlus className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleToggleEnroll(tr.id, tr.title, false)}
                                  className="accounting-btn-secondary !h-7 !text-[11px] !px-2.5 inline-flex items-center gap-1 hover:border-[#2998d6] hover:text-[#2998d6]"
                                >
                                  <Sparkles className="w-3 h-3 text-[#2998d6]" />
                                  <span>Enroll</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB 4: ACCREDITED CERTIFICATES PORTFOLIO */}
          {/* ===================================================================== */}
          {activeTab === 'certificates' && (
            <div>
              {completedTrainings.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-[4px] border border-[#cbd5e1] space-y-3">
                  <div className="w-10 h-10 rounded-[4px] bg-slate-100 text-slate-600 flex items-center justify-center mx-auto border border-slate-200">
                    <Award className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-[#181818]">No Accredited Certificates Earned Yet</h3>
                  <p className="text-xs text-[#5e5e5e] max-w-md mx-auto">
                    Attend and complete virtual masterclasses delivered by partner financial institutions to unlock verified accredited certificates and systematically elevate your underwriting readiness index.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('all')}
                    className="accounting-btn-primary"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Browse All Masterclasses</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {completedTrainings.map((training) => (
                    <div
                      key={training.id}
                      className="accounting-card p-5 border-[#cbd5e1] hover:border-[#2998d6] transition-all space-y-4 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[4px] bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                            <Award className="w-3 h-3 text-emerald-600" />
                            <span>Accredited Certificate</span>
                          </span>
                          <span className="text-[10px] font-bold text-[#2998d6] bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-[4px]">
                            +12% Readiness Boost
                          </span>
                        </div>

                        <h3 className="text-sm font-bold text-[#181818] leading-snug">{training.title}</h3>
                        <p className="text-xs text-[#5e5e5e]">
                          Issued by <span className="font-semibold text-slate-800">{training.speakerOrg || 'Commercial Bank Partner'}</span>
                        </p>

                        <div className="p-3 bg-[#f8fafc] rounded-[4px] border border-[#e2e8f0] text-[11px] text-[#5e5e5e] space-y-1 font-sans">
                          <p>
                            <span className="font-semibold text-slate-800">Recipient SME:</span> {activeSme.name}
                          </p>
                          <p>
                            <span className="font-semibold text-slate-800">Lead Instructor:</span> {training.speaker}
                          </p>
                          <p>
                            <span className="font-semibold text-slate-800">Completion Date:</span> {training.date}
                          </p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-[#e2e8f0]">
                        <button
                          type="button"
                          onClick={() => setPreviewCertTraining(training)}
                          className="accounting-btn-primary w-full !h-8 !text-xs"
                        >
                          <Award className="w-3.5 h-3.5" />
                          <span>View &amp; Print Official Certificate</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIRTUAL TRAINING ATTENDEE MODAL */}
      {/* ========================================================================= */}
      {attendingTraining && (
        <VirtualTrainingAttendeeModal
          training={attendingTraining}
          onClose={() => setAttendingTraining(null)}
          onCompleted={() => {
            joinTraining(attendingTraining.id);
            setAttendingTraining(null);
            showToast(`Masterclass completed! +12% Readiness Boost awarded.`);
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* ACCREDITED CERTIFICATE PREVIEW MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {previewCertTraining && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white rounded-[6px] shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden p-6 relative"
            >
              <button
                type="button"
                onClick={() => setPreviewCertTraining(null)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-[4px] hover:bg-slate-100 transition cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Certificate Canvas Frame */}
              <div className="border-4 border-double border-[#2998d6]/50 p-8 rounded-[4px] bg-[#eaeff5]/30 text-center space-y-5">
                <div className="flex items-center justify-center space-x-2 text-[#2998d6]">
                  <GraduationCap className="w-7 h-7" />
                  <span className="text-xl font-bold tracking-tight uppercase font-heading">Elevata</span>
                </div>

                <div className="space-y-1">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-slate-700">
                    Official Accredited Certificate of Completion
                  </h2>
                  <p className="text-[11px] text-[#5e5e5e]">This certifies that</p>
                  <h3 className="text-2xl font-bold text-[#181818] underline decoration-[#2998d6] decoration-2">
                    {activeSme.name}
                  </h3>
                  <p className="text-xs text-[#5e5e5e] font-medium">
                    {activeSme.sector} Sector • RDB Business Verified
                  </p>
                </div>

                <div className="space-y-1 max-w-md mx-auto">
                  <p className="text-xs text-[#5e5e5e]">
                    Has successfully attended, participated in, and completed the accredited institutional masterclass:
                  </p>
                  <p className="text-sm font-bold text-[#181818] italic">
                    "{previewCertTraining.title}"
                  </p>
                  <p className="text-xs text-[#5e5e5e]">
                    Delivered by {previewCertTraining.speakerOrg || 'Commercial Bank Partner'} under Elevata Underwriting Standards.
                  </p>
                </div>

                <div className="pt-6 border-t border-[#cbd5e1] flex items-center justify-between text-left text-xs">
                  <div>
                    <p className="font-bold text-[#181818]">{previewCertTraining.speaker}</p>
                    <p className="text-[10px] text-[#5e5e5e]">Lead Masterclass Instructor</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full border-2 border-dashed border-[#2998d6] flex items-center justify-center mx-auto text-[#2998d6] font-bold text-[10px]">
                      SEAL
                    </div>
                    <p className="text-[9px] text-slate-500 mt-1 uppercase font-bold tracking-wider">Accredited</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#181818] font-mono">{previewCertTraining.date}</p>
                    <p className="text-[10px] text-[#5e5e5e]">Certification Date</p>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-5 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="accounting-btn-secondary"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Certificate</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewCertTraining(null)}
                  className="accounting-btn-primary"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
