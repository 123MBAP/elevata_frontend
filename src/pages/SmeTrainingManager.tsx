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
  X
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
    <div className="mx-auto w-full max-w-7xl space-y-4 pb-10 sm:space-y-5 font-sans">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">Training</h1>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-center min-w-[120px]">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Boost</p>
            <p className="text-xl font-bold text-slate-950">+{readinessBoostTotal}%</p>
          </div>
        </div>

        {liveTrainings.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#0f766e] opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#0f766e]" />
              </span>
              <span className="rounded bg-[#0f766e] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">Live</span>
              <p className="text-xs font-semibold text-slate-800 truncate">{liveTrainings[0].title}</p>
            </div>
            <button
              onClick={() => setAttendingTraining(liveTrainings[0])}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0f172a] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-slate-800"
            >
              <Radio className="h-3.5 w-3.5" />
              Join
            </button>
          </div>
        )}
      </div>

      {/* KPI Metrics Summary - Registration Minimalist Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div
          onClick={() => setActiveTab('all')}
          className={`p-4 rounded-[8px] border transition cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex items-center space-x-3 ${
            activeTab === 'all'
              ? 'bg-[#f0fdfa] border-[#0f766e] ring-1 ring-[#0f766e]'
              : 'bg-white border-[#e0e0e0] hover:border-[#0f766e]/40'
          }`}
        >
          <div className="w-8 h-8 rounded-[6px] bg-[#f0fdfa] text-[#0f766e] flex items-center justify-center font-bold shrink-0">
            <Globe className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-[#5e5e5e] font-semibold uppercase tracking-wider truncate">All</p>
            <p className="text-base font-bold text-[#181818]">{allScheduledTrainings.length} Sessions</p>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('live')}
          className={`p-4 rounded-[8px] border transition cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex items-center space-x-3 ${
            activeTab === 'live'
              ? 'bg-teal-50 border-[#0f766e] ring-1 ring-[#0f766e]'
              : 'bg-white border-[#e0e0e0] hover:border-teal-200'
          }`}
        >
          <div className="w-8 h-8 rounded-[6px] bg-teal-50 text-[#0f766e] flex items-center justify-center font-bold shrink-0">
            <Radio className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-[#5e5e5e] font-semibold uppercase tracking-wider truncate">Live Now</p>
            <p className="text-base font-bold text-[#0f766e]">{liveTrainings.length}</p>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('enrolled')}
          className={`p-4 rounded-[8px] border transition cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex items-center space-x-3 ${
            activeTab === 'enrolled'
              ? 'bg-[#f0fdfa] border-[#0f766e] ring-1 ring-[#0f766e]'
              : 'bg-white border-[#e0e0e0] hover:border-[#0f766e]/40'
          }`}
        >
          <div className="w-8 h-8 rounded-[6px] bg-[#f0fdfa] text-[#0f766e] flex items-center justify-center font-bold shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-[#5e5e5e] font-semibold uppercase tracking-wider truncate">My Enrolled</p>
            <p className="text-base font-bold text-[#181818]">{enrolledTrainings.length}</p>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('certificates')}
          className={`p-4 rounded-[8px] border transition cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex items-center space-x-3 ${
            activeTab === 'certificates'
              ? 'bg-slate-50 border-slate-300 ring-1 ring-[#0f766e]'
              : 'bg-white border-[#e0e0e0] hover:border-slate-200'
          }`}
        >
          <div className="w-8 h-8 rounded-[6px] bg-slate-100 text-slate-600 flex items-center justify-center font-bold shrink-0">
            <Award className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-[#5e5e5e] font-semibold uppercase tracking-wider truncate">Accredited Certs</p>
            <p className="text-base font-bold text-[#181818]">{completedTrainings.length}</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs & Filter Bar - Registration Segmented Style */}
      <div className="bg-white p-3.5 sm:p-4 rounded-[8px] border border-[#e0e0e0] shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center space-x-1 p-1 bg-[#f3f2f0] rounded-[6px] border border-[#e0e0e0] overflow-x-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 rounded-[5px] text-xs font-semibold transition whitespace-nowrap flex items-center space-x-1.5 ${
                activeTab === 'all'
                  ? 'bg-white text-[#0f766e] shadow-sm font-bold'
                  : 'text-[#5e5e5e] hover:text-[#181818]'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>All Masterclasses ({allScheduledTrainings.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('enrolled')}
              className={`px-3.5 py-1.5 rounded-[5px] text-xs font-semibold transition whitespace-nowrap flex items-center space-x-1.5 ${
                activeTab === 'enrolled'
                  ? 'bg-white text-[#0f766e] shadow-sm font-bold'
                  : 'text-[#5e5e5e] hover:text-[#181818]'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>My Enrolled ({enrolledTrainings.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('live')}
              className={`px-3.5 py-1.5 rounded-[5px] text-xs font-semibold transition whitespace-nowrap flex items-center space-x-1.5 ${
                activeTab === 'live'
                  ? 'bg-[#0f766e] text-white shadow-sm font-bold'
                  : 'text-[#5e5e5e] hover:text-[#181818]'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Live Now ({liveTrainings.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('certificates')}
              className={`px-3.5 py-1.5 rounded-[5px] text-xs font-semibold transition whitespace-nowrap flex items-center space-x-1.5 ${
                activeTab === 'certificates'
                  ? 'bg-white text-[#0f766e] shadow-sm font-bold'
                  : 'text-[#5e5e5e] hover:text-[#181818]'
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
                <Search className="w-3.5 h-3.5 text-[#8c8c8c] absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search masterclass, bank, speaker..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-[6px] border border-[#cccccc] text-xs text-[#181818] outline-none transition-colors placeholder:text-[#8c8c8c] focus:border-[#0f766e] focus:ring-1 focus:ring-[#0f766e]"
                />
              </div>

              <select
                value={sectorFilter}
                onChange={e => setSectorFilter(e.target.value)}
                className="px-3 py-1.5 rounded-[6px] border border-[#cccccc] text-xs text-[#181818] bg-white outline-none transition-colors focus:border-[#0f766e] focus:ring-1 focus:ring-[#0f766e]"
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
            <div className="p-12 text-center bg-white rounded-[10px] border border-[#e0e0e0] space-y-3">
              <div className="w-10 h-10 rounded-[8px] bg-[#f0fdfa] text-[#0f766e] flex items-center justify-center mx-auto">
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
                All capacity masterclasses scheduled by partner financial institutions are accessible to your business across all sectors.
              </p>
              {activeTab !== 'all' && (
                <button
                  onClick={() => setActiveTab('all')}
                  className="px-4 py-2 bg-[#0f766e] text-white rounded-[6px] text-xs font-semibold hover:bg-[#115e59] transition inline-flex items-center space-x-1.5 shadow-sm"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>View All Masterclasses</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    className={`bg-white rounded-[10px] border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md ${
                      isLive
                        ? 'border-[#0f766e] ring-1 ring-[#0f766e]'
                        : isCompleted
                        ? 'border-[#e0e0e0]'
                        : 'border-[#e0e0e0] hover:border-[#0f766e]'
                    }`}
                  >
                    {/* Card Content */}
                    <div className="p-5 space-y-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center flex-wrap gap-1.5">
                          {isLive ? (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-[4px] bg-[#0f766e] text-white text-[10px] font-bold uppercase tracking-wider">
                              <Radio className="w-3 h-3" />
                              <span>Live</span>
                            </span>
                          ) : isCompleted ? (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-[4px] bg-teal-50 text-[#0f766e] text-[10px] font-semibold border border-teal-200">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Done</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-[4px] bg-[#f0fdfa] text-[#0f766e] text-[10px] font-semibold border border-[#0f766e]/20">
                              <Calendar className="w-3 h-3" />
                              <span>Scheduled</span>
                            </span>
                          )}

                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-[4px] bg-[#f3f2f0] text-[#5e5e5e] text-[10px] font-medium border border-[#e0e0e0]">
                            <Building2 className="w-3 h-3 text-[#5e5e5e]" />
                            <span>{training.speakerOrg || 'Delivering Bank'}</span>
                          </span>
                        </div>

                        <h3 className="text-sm font-bold text-[#181818] leading-snug line-clamp-2">
                          {training.title}
                        </h3>
                      </div>

                      <p className="text-xs text-[#5e5e5e] line-clamp-2 leading-relaxed">
                        {training.description}
                      </p>

                      {/* Universal Access / Focus Sector Pill */}
                      <div className="p-2.5 rounded-[6px] bg-[#f8fafc] border border-[#e0e0e0] text-[11px] space-y-1">
                        <div className="flex items-center justify-between text-[#181818] font-semibold">
                          <span className="flex items-center space-x-1 text-[#0f766e]">
                            <Globe className="w-3.5 h-3.5" />
                            <span>Open to All Registered SMEs</span>
                          </span>
                          {training.hasCertificate && (
                            <span className="text-slate-700 bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded-[4px] text-[10px] font-bold">
                              +12% Readiness
                            </span>
                          )}
                        </div>
                        {training.targetAudience && training.targetAudience.length > 0 && (
                          <p className="text-[10px] text-[#5e5e5e] truncate">
                            <span className="font-semibold text-[#181818]">Target:</span>{' '}
                            {training.targetAudience.join(', ')}
                          </p>
                        )}
                      </div>

                      {/* Schedule Summary Box */}
                      <div className="p-3 bg-[#f8fafc] rounded-[6px] space-y-1.5 text-xs text-[#181818] border border-[#e0e0e0]">
                        <div className="flex items-center justify-between">
                          <span className="text-[#5e5e5e] flex items-center space-x-1.5">
                            <Calendar className="w-3.5 h-3.5 text-[#8c8c8c]" />
                            <span>Date & Time:</span>
                          </span>
                          <span className="font-semibold text-[#181818]">
                            {training.date} • {training.time}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-[#5e5e5e] flex items-center space-x-1.5">
                            <Users className="w-3.5 h-3.5 text-[#8c8c8c]" />
                            <span>Instructor:</span>
                          </span>
                          <span className="font-medium text-[#181818] truncate max-w-[150px]">
                            {training.speaker}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-3.5 bg-[#f8fafc] border-t border-[#e0e0e0]">
                      {isLive ? (
                        <button
                          onClick={() => setAttendingTraining(training)}
                          className="w-full py-2 bg-red-600 hover:bg-teal-800 text-white rounded-[6px] text-xs font-bold shadow-sm flex items-center justify-center space-x-1.5 transition"
                        >
                          <Radio className="w-3.5 h-3.5" />
                          <span>Enter Live Classroom</span>
                        </button>
                      ) : isCompleted ? (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => setPreviewCertTraining(training)}
                            className="w-full py-2 bg-[#0f766e] hover:bg-[#115e59] text-white rounded-[6px] text-xs font-semibold flex items-center justify-center space-x-1 transition shadow-sm"
                          >
                            <Award className="w-3.5 h-3.5" />
                            <span>Certificate</span>
                          </button>
                          <button
                            onClick={() => setAttendingTraining(training)}
                            className="w-full py-2 bg-white hover:bg-[#f3f2f0] text-[#181818] border border-[#cccccc] rounded-[6px] text-xs font-semibold flex items-center justify-center space-x-1 transition"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Review Slides</span>
                          </button>
                        </div>
                      ) : isEnrolled ? (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => setAttendingTraining(training)}
                            className="w-full py-2 bg-[#0f766e] hover:bg-[#115e59] text-white rounded-[6px] text-xs font-semibold flex items-center justify-center space-x-1.5 transition shadow-sm"
                          >
                            <PlayCircle className="w-3.5 h-3.5" />
                            <span>Join Waiting Room</span>
                          </button>
                          <button
                            onClick={() => handleAddToCalendar(training)}
                            className="w-full py-2 bg-white hover:bg-[#f3f2f0] text-[#181818] border border-[#cccccc] rounded-[6px] text-xs font-semibold flex items-center justify-center space-x-1 transition"
                          >
                            <CalendarPlus className="w-3.5 h-3.5" />
                            <span>Add Calendar</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleTrainingEnrollment(training.id)}
                            className="flex-1 py-2 bg-[#0f766e] hover:bg-[#115e59] text-white rounded-[6px] text-xs font-semibold shadow-sm transition flex items-center justify-center space-x-1.5"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Enroll in Masterclass</span>
                          </button>
                          <button
                            onClick={() => setAttendingTraining(training)}
                            className="px-3 py-2 bg-white hover:bg-[#f3f2f0] text-[#5e5e5e] border border-[#cccccc] rounded-[6px] text-xs font-semibold transition"
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
            <div className="p-12 text-center bg-white rounded-[10px] border border-[#e0e0e0] space-y-3">
              <div className="w-10 h-10 rounded-[8px] bg-slate-100 text-slate-600 flex items-center justify-center mx-auto">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#181818]">No Certificates Earned Yet</h3>
              <p className="text-xs text-[#5e5e5e] max-w-md mx-auto">
                Attend and complete virtual masterclasses delivered by financial institutions to unlock verified accredited certificates and boost your loan readiness score.
              </p>
              <button
                onClick={() => setActiveTab('all')}
                className="px-4 py-2 bg-[#0f766e] text-white rounded-[6px] text-xs font-semibold hover:bg-[#115e59] transition inline-flex items-center space-x-1.5 shadow-sm"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Browse All Masterclasses</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedTrainings.map(training => (
                <div
                  key={training.id}
                  className="bg-white rounded-[10px] border border-[#e0e0e0] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-[4px] bg-slate-50 text-slate-700 border border-slate-200 text-[10px] font-bold">
                        <Award className="w-3 h-3" />
                        <span>Accredited Certificate</span>
                      </span>
                      <span className="text-[10px] font-bold text-[#0f766e] bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-[4px]">
                        +12% Readiness Boost
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-[#181818]">{training.title}</h3>
                    <p className="text-xs text-[#5e5e5e]">
                      Issued by <span className="font-semibold text-[#181818]">{training.speakerOrg || 'Financial Institution'}</span>
                    </p>

                    <div className="p-3 bg-[#f8fafc] rounded-[6px] border border-[#e0e0e0] text-[11px] text-[#5e5e5e] space-y-1">
                      <p>
                        <span className="font-semibold text-[#181818]">Recipient:</span> {activeSme.name}
                      </p>
                      <p>
                        <span className="font-semibold text-[#181818]">Instructor:</span> {training.speaker}
                      </p>
                      <p>
                        <span className="font-semibold text-[#181818]">Completed Date:</span> {training.date}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#e0e0e0]">
                    <button
                      onClick={() => setPreviewCertTraining(training)}
                      className="w-full py-2 bg-[#0f766e] hover:bg-[#115e59] text-white rounded-[6px] text-xs font-semibold transition flex items-center justify-center space-x-1.5 shadow-sm"
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

      {/* Certificate Preview Modal - Zero Emojis, Registration Styling */}
      {previewCertTraining && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-[10px] shadow-xl border border-[#e0e0e0] w-full max-w-2xl overflow-hidden p-6 relative">
            <button
              onClick={() => setPreviewCertTraining(null)}
              className="absolute top-4 right-4 p-1.5 text-[#5e5e5e] hover:text-[#181818] rounded-[4px] hover:bg-[#f3f2f0] transition"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Certificate Canvas */}
            <div className="border-4 border-double border-teal-500/40 p-8 rounded-[8px] bg-slate-50 text-center space-y-5">
              <div className="flex items-center justify-center space-x-2 text-[#0f766e]">
                <GraduationCap className="w-7 h-7" />
                <span className="text-xl font-bold tracking-tight uppercase">Elevata</span>
              </div>

              <div className="space-y-1">
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-700">
                  Official Accredited Certificate of Completion
                </h2>
                <p className="text-[11px] text-[#5e5e5e]">This certifies that</p>
                <h3 className="text-2xl font-bold text-[#181818] underline decoration-teal-500 decoration-2">
                  {activeSme.name}
                </h3>
                <p className="text-xs text-[#5e5e5e] font-medium">
                  {activeSme.sector} Sector • Registration Verified
                </p>
              </div>

              <div className="space-y-1 max-w-md mx-auto">
                <p className="text-xs text-[#5e5e5e]">
                  Has successfully attended, participated in, and completed the accredited virtual masterclass:
                </p>
                <p className="text-sm font-bold text-[#181818] italic">
                  "{previewCertTraining.title}"
                </p>
                <p className="text-xs text-[#5e5e5e]">
                  Delivered by {previewCertTraining.speakerOrg || 'Credit Partner'} under Elevata Underwriting Standards.
                </p>
              </div>

              <div className="pt-6 border-t border-[#e0e0e0] flex items-center justify-between text-left text-xs">
                <div>
                  <p className="font-bold text-[#181818]">{previewCertTraining.speaker}</p>
                  <p className="text-[10px] text-[#5e5e5e]">Masterclass Lead Instructor</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center mx-auto text-slate-600 font-bold text-[10px]">
                    SEAL
                  </div>
                  <p className="text-[9px] text-[#8c8c8c] mt-1">Accredited</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#181818]">{previewCertTraining.date}</p>
                  <p className="text-[10px] text-[#5e5e5e]">Certification Date</p>
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end space-x-3">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-white hover:bg-[#f3f2f0] text-[#181818] border border-[#cccccc] rounded-[6px] text-xs font-semibold flex items-center space-x-1.5 transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Certificate</span>
              </button>
              <button
                onClick={() => setPreviewCertTraining(null)}
                className="px-5 py-2 bg-[#0f766e] hover:bg-[#115e59] text-white rounded-[6px] text-xs font-semibold transition"
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
