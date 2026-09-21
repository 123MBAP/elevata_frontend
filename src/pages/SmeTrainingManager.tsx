import React, { useState } from 'react';
import {
  Video,
  Calendar,
  Clock,
  Users,
  Award,
  BookOpen,
  Search,
  Filter,
  CheckCircle2,
  Radio,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Download,
  Share2,
  Printer,
  ShieldCheck,
  Building2,
  Check,
  GraduationCap,
  CalendarPlus,
  PlayCircle,
  Globe,
  Layers,
  Sparkle
} from 'lucide-react';
import { Training, useApp } from '../context/AppContext';
import VirtualTrainingAttendeeModal from '../assets/components/VirtualTrainingAttendeeModal';

export default function SmeTrainingManager() {
  const {
    activeSme,
    trainings,
    toggleTrainingEnrollment,
    joinTraining
  } = useApp();

  const [activeTab, setActiveTab] = useState<'all' | 'enrolled' | 'live' | 'certificates'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sectorFilter, setSectorFilter] = useState('ALL');
  const [attendingTraining, setAttendingTraining] = useState<Training | null>(null);
  const [previewCertTraining, setPreviewCertTraining] = useState<Training | null>(null);

  // Filtered trainings: ALL banker scheduled trainings regardless of SME's registered sector
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

    // Optional user-selected sector filter
    if (sectorFilter !== 'ALL') {
      const hasSector = t.targetAudience?.some(
        aud => aud.toLowerCase().includes(sectorFilter.toLowerCase()) || aud === 'All Sectors'
      );
      if (!hasSector) return false;
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
  };

  const currentDisplayList =
    activeTab === 'all'
      ? allScheduledTrainings
      : activeTab === 'enrolled'
      ? enrolledTrainings
      : activeTab === 'live'
      ? liveTrainings
      : [];

  return (
    <div className="space-y-6 pb-12">
      {/* Hero Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-950 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl border border-emerald-900/50">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>SME Capacity Building & Bankability Academy</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Virtual Capacity Academy
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 max-w-2xl leading-relaxed">
              Explore and attend all live interactive masterclasses scheduled by partner financial institutions.
              Master underwriting criteria, ask bank officers questions directly, and earn verified accredited certificates.
            </p>
          </div>

          {/* Readiness Score Card */}
          <div className="p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-center min-w-[190px]">
            <div className="flex items-center justify-center space-x-1.5 text-emerald-300 mb-1">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Readiness Impact</span>
            </div>
            <p className="text-2xl font-extrabold text-white">+{readinessBoostTotal}%</p>
            <p className="text-[10px] text-emerald-200 mt-0.5">Verified Underwriting Boost</p>
          </div>
        </div>

        {/* Universal Access Notice */}
        <div className="mt-5 pt-4 border-t border-emerald-800/60 flex items-center justify-between flex-wrap gap-2 text-xs text-emerald-200">
          <div className="flex items-center space-x-2">
            <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold text-white">Universal Cross-Sector Access:</span>
            <span>All scheduled banker masterclasses are open for enrollment to your business ({activeSme.name} • {activeSme.sector} Sector).</span>
          </div>
        </div>

        {/* Live Warning Banner if sessions are active */}
        {liveTrainings.length > 0 && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center space-x-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <p className="text-xs font-bold text-white">
                🔴 "{liveTrainings[0].title}" by {liveTrainings[0].speakerOrg} is BROADCASTING LIVE NOW!
              </p>
            </div>
            <button
              onClick={() => setAttendingTraining(liveTrainings[0])}
              className="px-4 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-md shadow-red-500/30"
            >
              <Radio className="w-3.5 h-3.5 text-white animate-pulse" />
              <span>Join Live Classroom</span>
            </button>
          </div>
        )}
      </div>

      {/* KPI Metrics Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div
          onClick={() => setActiveTab('all')}
          className={`p-4 rounded-xl border transition cursor-pointer shadow-sm flex items-center space-x-3 ${
            activeTab === 'all' ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/20' : 'bg-white border-slate-200 hover:border-emerald-200'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">All Scheduled</p>
            <p className="text-lg font-bold text-slate-900">{allScheduledTrainings.length} Masterclasses</p>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('live')}
          className={`p-4 rounded-xl border transition cursor-pointer shadow-sm flex items-center space-x-3 ${
            activeTab === 'live' ? 'bg-red-50 border-red-300 ring-2 ring-red-500/20' : 'bg-white border-slate-200 hover:border-red-200'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Live Now</p>
            <p className="text-lg font-bold text-red-600">{liveTrainings.length}</p>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('enrolled')}
          className={`p-4 rounded-xl border transition cursor-pointer shadow-sm flex items-center space-x-3 ${
            activeTab === 'enrolled' ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-500/20' : 'bg-white border-slate-200 hover:border-blue-200'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">My Enrolled</p>
            <p className="text-lg font-bold text-slate-900">{enrolledTrainings.length}</p>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('certificates')}
          className={`p-4 rounded-xl border transition cursor-pointer shadow-sm flex items-center space-x-3 ${
            activeTab === 'certificates' ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-500/20' : 'bg-white border-slate-200 hover:border-amber-200'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Accredited Certs</p>
            <p className="text-lg font-bold text-amber-600">{completedTrainings.length}</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center space-x-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center space-x-1.5 ${
                activeTab === 'all'
                  ? 'bg-white text-emerald-800 shadow-sm border border-slate-200/50'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>All Scheduled Masterclasses ({allScheduledTrainings.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('enrolled')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center space-x-1.5 ${
                activeTab === 'enrolled'
                  ? 'bg-white text-emerald-800 shadow-sm border border-slate-200/50'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>My Enrolled ({enrolledTrainings.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('live')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center space-x-1.5 ${
                activeTab === 'live'
                  ? 'bg-red-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Live Now ({liveTrainings.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('certificates')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center space-x-1.5 ${
                activeTab === 'certificates'
                  ? 'bg-white text-emerald-800 shadow-sm border border-slate-200/50'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Certificates ({completedTrainings.length})</span>
            </button>
          </div>

          {/* Search & Sector Filters */}
          {activeTab !== 'certificates' && (
            <div className="flex items-center space-x-2.5">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search masterclass, bank, speaker..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <select
                value={sectorFilter}
                onChange={e => setSectorFilter(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                <option value="ALL">All Sectors (Cross-Sector)</option>
                <option value="Retail">Retail & Wholesale</option>
                <option value="Agriculture">Agriculture & Processing</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Technology">Technology & ICT</option>
                <option value="Logistics">Logistics & Transport</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: All / Enrolled / Live Masterclasses */}
      {activeTab !== 'certificates' && (
        <div>
          {currentDisplayList.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <GraduationCap className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                {activeTab === 'enrolled'
                  ? "You haven't enrolled in any masterclasses yet"
                  : activeTab === 'live'
                  ? "No live masterclasses broadcasting right now"
                  : "No masterclasses found matching your filters"}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                All capacity masterclasses scheduled by partner financial institutions are accessible to your business across all sectors.
              </p>
              {activeTab !== 'all' && (
                <button
                  onClick={() => setActiveTab('all')}
                  className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition inline-flex items-center space-x-1.5 shadow-sm"
                >
                  <Globe className="w-4 h-4" />
                  <span>View All Scheduled Masterclasses</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {currentDisplayList.map(training => {
                const isLive = training.status === 'live';
                const isCompleted = training.completed || training.attended;
                const isEnrolled =
                  training.enrolled ||
                  training.attendees?.some(a => a.id === activeSme.id) ||
                  isCompleted;

                return (
                  <div
                    key={training.id}
                    className={`bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md ${
                      isLive
                        ? 'border-red-500 ring-2 ring-red-500/20'
                        : isCompleted
                        ? 'border-emerald-200'
                        : 'border-slate-200 hover:border-emerald-300'
                    }`}
                  >
                    {/* Card Content */}
                    <div className="p-5 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center flex-wrap gap-1.5">
                            {isLive ? (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-extrabold uppercase tracking-wider animate-pulse shadow-sm">
                                <Radio className="w-3 h-3 animate-ping" />
                                <span>LIVE NOW</span>
                              </span>
                            ) : isCompleted ? (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Certified & Completed</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
                                <Calendar className="w-3 h-3" />
                                <span>Scheduled</span>
                              </span>
                            )}

                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                              <Building2 className="w-3 h-3 text-slate-500" />
                              <span>{training.speakerOrg || 'Delivering Bank'}</span>
                            </span>
                          </div>

                          <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2 mt-1">
                            {training.title}
                          </h3>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {training.description}
                      </p>

                      {/* Universal Access / Focus Sector Pill */}
                      <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200/60 text-[11px] space-y-1">
                        <div className="flex items-center justify-between text-emerald-900 font-bold">
                          <span className="flex items-center space-x-1">
                            <Globe className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Open to All Registered SMEs</span>
                          </span>
                          {training.hasCertificate && (
                            <span className="text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded text-[10px] font-bold">
                              +12% Readiness
                            </span>
                          )}
                        </div>
                        {training.targetAudience && training.targetAudience.length > 0 && (
                          <p className="text-[10px] text-slate-500 truncate">
                            <span className="font-semibold text-slate-700">Target Focus:</span>{' '}
                            {training.targetAudience.join(', ')}
                          </p>
                        )}
                      </div>

                      {/* Schedule Summary Box */}
                      <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-700 border border-slate-100">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 flex items-center space-x-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>Date & Time:</span>
                          </span>
                          <span className="font-bold text-slate-900">
                            {training.date} • {training.time}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 flex items-center space-x-1.5">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            <span>Instructor:</span>
                          </span>
                          <span className="font-semibold text-slate-800 truncate max-w-[150px]">
                            {training.speaker}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 bg-slate-50/70 border-t border-slate-100 space-y-2">
                      {isLive ? (
                        <button
                          onClick={() => setAttendingTraining(training)}
                          className="w-full py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-red-500/20 flex items-center justify-center space-x-2 transition"
                        >
                          <Radio className="w-4 h-4 animate-pulse" />
                          <span>Enter Live Classroom</span>
                        </button>
                      ) : isCompleted ? (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => setPreviewCertTraining(training)}
                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1 transition shadow-sm"
                          >
                            <Award className="w-3.5 h-3.5" />
                            <span>Certificate</span>
                          </button>
                          <button
                            onClick={() => setAttendingTraining(training)}
                            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center space-x-1 transition"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Review Slides</span>
                          </button>
                        </div>
                      ) : isEnrolled ? (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => setAttendingTraining(training)}
                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition shadow-sm"
                          >
                            <PlayCircle className="w-3.5 h-3.5" />
                            <span>Join Waiting Room</span>
                          </button>
                          <button
                            onClick={() => handleAddToCalendar(training)}
                            className="w-full py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center justify-center space-x-1 transition"
                          >
                            <CalendarPlus className="w-3.5 h-3.5" />
                            <span>Add Calendar</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleTrainingEnrollment(training.id)}
                            className="flex-1 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition flex items-center justify-center space-x-1.5"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Enroll in Masterclass</span>
                          </button>
                          <button
                            onClick={() => setAttendingTraining(training)}
                            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                            title="Preview Room"
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
          )}
        </div>
      )}

      {/* Tab: Accredited Certificates Portfolio */}
      {activeTab === 'certificates' && (
        <div>
          {completedTrainings.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                <Award className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No Certificates Earned Yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Attend and complete virtual masterclasses delivered by financial institutions to unlock verified accredited certificates and boost your loan readiness score.
              </p>
              <button
                onClick={() => setActiveTab('all')}
                className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition inline-flex items-center space-x-1.5 shadow-sm"
              >
                <Globe className="w-4 h-4" />
                <span>Browse All Scheduled Masterclasses</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {completedTrainings.map(training => (
                <div
                  key={training.id}
                  className="bg-gradient-to-br from-amber-50/50 via-white to-emerald-50/50 rounded-2xl border border-amber-200/80 p-5 shadow-sm space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                        <Award className="w-3 h-3" />
                        <span>Accredited Certificate</span>
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                        +12% Readiness Boost
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900">{training.title}</h3>
                    <p className="text-xs text-slate-600">
                      Issued by <span className="font-semibold text-slate-800">{training.speakerOrg || 'Financial Institution'}</span>
                    </p>

                    <div className="p-3 bg-white rounded-xl border border-slate-200/80 text-[11px] text-slate-600 space-y-1">
                      <p>
                        <span className="font-semibold text-slate-800">Recipient:</span> {activeSme.name}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-800">Instructor:</span> {training.speaker}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-800">Completed Date:</span> {training.date}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 pt-2 border-t border-slate-200/60">
                    <button
                      onClick={() => setPreviewCertTraining(training)}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-sm"
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>View Certificate</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Virtual Training Attendee Modal */}
      {attendingTraining && (
        <VirtualTrainingAttendeeModal
          training={attendingTraining}
          onClose={() => setAttendingTraining(null)}
          onCompleted={() => {
            joinTraining(attendingTraining.id);
            setAttendingTraining(null);
          }}
        />
      )}

      {/* Certificate Preview Modal */}
      {previewCertTraining && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden p-6 relative">
            <button
              onClick={() => setPreviewCertTraining(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              ✕
            </button>

            {/* Certificate Canvas */}
            <div className="border-4 border-double border-amber-400/70 p-8 rounded-xl bg-gradient-to-br from-amber-50/20 via-white to-emerald-50/20 text-center space-y-5">
              <div className="flex items-center justify-center space-x-2 text-emerald-700">
                <GraduationCap className="w-8 h-8" />
                <span className="text-xl font-extrabold tracking-wider uppercase font-heading">Elevata</span>
              </div>

              <div className="space-y-1">
                <h2 className="text-xs font-bold uppercase tracking-widest text-amber-800">
                  Official Accredited Certificate of Completion
                </h2>
                <p className="text-[11px] text-slate-500">This certifies that</p>
                <h3 className="text-2xl font-black text-slate-900 font-heading underline decoration-amber-400 decoration-2">
                  {activeSme.name}
                </h3>
                <p className="text-xs text-slate-600 font-medium">
                  {activeSme.sector} Sector • Registration Verified
                </p>
              </div>

              <div className="space-y-1 max-w-md mx-auto">
                <p className="text-xs text-slate-600">
                  Has successfully attended, participated in, and completed the accredited virtual masterclass:
                </p>
                <p className="text-sm font-bold text-slate-900 italic">
                  "{previewCertTraining.title}"
                </p>
                <p className="text-xs text-slate-500">
                  Delivered by {previewCertTraining.speakerOrg || 'Credit Partner'} under Elevata Underwriting Standards.
                </p>
              </div>

              <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-left text-xs">
                <div>
                  <p className="font-bold text-slate-900">{previewCertTraining.speaker}</p>
                  <p className="text-[10px] text-slate-500">Masterclass Lead Instructor</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full border-2 border-dashed border-amber-500 flex items-center justify-center mx-auto text-amber-600 font-black text-[10px]">
                    SEAL
                  </div>
                  <p className="text-[9px] text-slate-400 mt-1">Accredited</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900">{previewCertTraining.date}</p>
                  <p className="text-[10px] text-slate-500">Certification Date</p>
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end space-x-3">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Certificate</span>
              </button>
              <button
                onClick={() => setPreviewCertTraining(null)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
