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
    <div className="space-y-6 pb-12 font-sans">
      {/* Hero Header Card - Registration System Styling */}
      <div className="rounded-[10px] bg-white p-6 sm:p-7 border border-[#e0e0e0] shadow-[0_2px_8px_rgba(0,0,0,0.06)] relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-[6px] bg-[#eaf2ff] border border-[#0a66c2]/20 text-[#0a66c2] text-xs font-semibold">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>SME Capacity Building & Bankability Academy</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#181818]">
              Virtual Capacity Academy
            </h1>
            <p className="text-xs sm:text-sm text-[#5e5e5e] max-w-2xl leading-relaxed">
              Explore and attend live interactive masterclasses scheduled by partner financial institutions.
              Master underwriting criteria, ask bank officers questions directly, and earn verified accredited certificates.
            </p>
          </div>

          {/* Readiness Score Badge */}
          <div className="p-4 rounded-[8px] bg-[#f8fafc] border border-[#e0e0e0] text-center min-w-[190px]">
            <div className="flex items-center justify-center space-x-1.5 text-[#0a66c2] mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Readiness Impact</span>
            </div>
            <p className="text-2xl font-bold text-[#181818]">+{readinessBoostTotal}%</p>
            <p className="text-[11px] text-[#5e5e5e] mt-0.5">Verified Underwriting Boost</p>
          </div>
        </div>

        {/* Universal Access Notice */}
        <div className="mt-4 pt-3.5 border-t border-[#e0e0e0] flex items-center justify-between flex-wrap gap-2 text-xs text-[#5e5e5e]">
          <div className="flex items-center space-x-2">
            <Globe className="w-3.5 h-3.5 text-[#0a66c2] shrink-0" />
            <span className="font-semibold text-[#181818]">Universal Cross-Sector Access:</span>
            <span>All scheduled banker masterclasses are open for enrollment to your business ({activeSme.name} • {activeSme.sector} Sector).</span>
          </div>
        </div>

        {/* Live Warning Banner if sessions are active - Clean, Zero Emojis */}
        {liveTrainings.length > 0 && (
          <div className="mt-4 p-3 rounded-[8px] bg-red-50 border border-red-200 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center space-x-2.5">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
              </span>
              <span className="px-1.5 py-0.5 rounded-[4px] bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider">
                LIVE
              </span>
              <p className="text-xs font-semibold text-red-900 truncate">
                "{liveTrainings[0].title}" by {liveTrainings[0].speakerOrg} is broadcasting live now
              </p>
            </div>
            <button
              onClick={() => setAttendingTraining(liveTrainings[0])}
              className="px-3.5 py-1.5 rounded-[6px] bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-sm"
            >
              <Radio className="w-3.5 h-3.5 text-white" />
              <span>Join Live Classroom</span>
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
              ? 'bg-[#f0f7ff] border-[#0a66c2] ring-1 ring-[#0a66c2]'
              : 'bg-white border-[#e0e0e0] hover:border-[#0a66c2]/40'
          }`}
        >
          <div className="w-8 h-8 rounded-[6px] bg-[#eaf2ff] text-[#0a66c2] flex items-center justify-center font-bold shrink-0">
            <Globe className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-[#5e5e5e] font-semibold uppercase tracking-wider truncate">All Scheduled</p>
            <p className="text-base font-bold text-[#181818]">{allScheduledTrainings.length} Sessions</p>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('live')}
          className={`p-4 rounded-[8px] border transition cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex items-center space-x-3 ${
            activeTab === 'live'
              ? 'bg-red-50/70 border-red-500 ring-1 ring-red-500'
              : 'bg-white border-[#e0e0e0] hover:border-red-200'
          }`}
        >
          <div className="w-8 h-8 rounded-[6px] bg-red-50 text-red-600 flex items-center justify-center font-bold shrink-0">
            <Radio className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-[#5e5e5e] font-semibold uppercase tracking-wider truncate">Live Now</p>
            <p className="text-base font-bold text-red-600">{liveTrainings.length}</p>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('enrolled')}
          className={`p-4 rounded-[8px] border transition cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex items-center space-x-3 ${
            activeTab === 'enrolled'
              ? 'bg-[#f0f7ff] border-[#0a66c2] ring-1 ring-[#0a66c2]'
              : 'bg-white border-[#e0e0e0] hover:border-[#0a66c2]/40'
          }`}
        >
          <div className="w-8 h-8 rounded-[6px] bg-[#eaf2ff] text-[#0a66c2] flex items-center justify-center font-bold shrink-0">
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
              ? 'bg-[#fef9ee] border-amber-500 ring-1 ring-amber-500'
              : 'bg-white border-[#e0e0e0] hover:border-amber-200'
          }`}
        >
          <div className="w-8 h-8 rounded-[6px] bg-amber-50 text-amber-700 flex items-center justify-center font-bold shrink-0">
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
                  ? 'bg-white text-[#0a66c2] shadow-sm font-bold'
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
                  ? 'bg-white text-[#0a66c2] shadow-sm font-bold'
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
                  ? 'bg-red-600 text-white shadow-sm font-bold'
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
                  ? 'bg-white text-[#0a66c2] shadow-sm font-bold'
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
                  className="w-full pl-8 pr-3 py-1.5 rounded-[6px] border border-[#cccccc] text-xs text-[#181818] outline-none transition-colors placeholder:text-[#8c8c8c] focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
                />
              </div>

              <select
                value={sectorFilter}
                onChange={e => setSectorFilter(e.target.value)}
                className="px-3 py-1.5 rounded-[6px] border border-[#cccccc] text-xs text-[#181818] bg-white outline-none transition-colors focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
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
              <div className="w-10 h-10 rounded-[8px] bg-[#eaf2ff] text-[#0a66c2] flex items-center justify-center mx-auto">
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
                  className="px-4 py-2 bg-[#0a66c2] text-white rounded-[6px] text-xs font-semibold hover:bg-[#004182] transition inline-flex items-center space-x-1.5 shadow-sm"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>View All Scheduled Masterclasses</span>
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
                        ? 'border-red-500 ring-1 ring-red-500'
                        : isCompleted
                        ? 'border-[#e0e0e0]'
                        : 'border-[#e0e0e0] hover:border-[#0a66c2]'
                    }`}
                  >
                    {/* Card Content */}
                    <div className="p-5 space-y-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center flex-wrap gap-1.5">
                          {isLive ? (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-[4px] bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider">
                              <Radio className="w-3 h-3" />
                              <span>LIVE NOW</span>
                            </span>
                          ) : isCompleted ? (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-[4px] bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Certified & Completed</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-[4px] bg-[#eaf2ff] text-[#0a66c2] text-[10px] font-semibold border border-[#0a66c2]/20">
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
                          <span className="flex items-center space-x-1 text-[#0a66c2]">
                            <Globe className="w-3.5 h-3.5" />
                            <span>Open to All Registered SMEs</span>
                          </span>
                          {training.hasCertificate && (
                            <span className="text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded-[4px] text-[10px] font-bold">
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
                          className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-[6px] text-xs font-bold shadow-sm flex items-center justify-center space-x-1.5 transition"
                        >
                          <Radio className="w-3.5 h-3.5" />
                          <span>Enter Live Classroom</span>
                        </button>
                      ) : isCompleted ? (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => setPreviewCertTraining(training)}
                            className="w-full py-2 bg-[#0a66c2] hover:bg-[#004182] text-white rounded-[6px] text-xs font-semibold flex items-center justify-center space-x-1 transition shadow-sm"
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
                            className="w-full py-2 bg-[#0a66c2] hover:bg-[#004182] text-white rounded-[6px] text-xs font-semibold flex items-center justify-center space-x-1.5 transition shadow-sm"
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
                            className="flex-1 py-2 bg-[#0a66c2] hover:bg-[#004182] text-white rounded-[6px] text-xs font-semibold shadow-sm transition flex items-center justify-center space-x-1.5"
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
              <div className="w-10 h-10 rounded-[8px] bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#181818]">No Certificates Earned Yet</h3>
              <p className="text-xs text-[#5e5e5e] max-w-md mx-auto">
                Attend and complete virtual masterclasses delivered by financial institutions to unlock verified accredited certificates and boost your loan readiness score.
              </p>
              <button
                onClick={() => setActiveTab('all')}
                className="px-4 py-2 bg-[#0a66c2] text-white rounded-[6px] text-xs font-semibold hover:bg-[#004182] transition inline-flex items-center space-x-1.5 shadow-sm"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Browse All Scheduled Masterclasses</span>
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
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-[4px] bg-[#fef9ee] text-amber-800 border border-amber-200 text-[10px] font-bold">
                        <Award className="w-3 h-3" />
                        <span>Accredited Certificate</span>
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-[4px]">
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
                      className="w-full py-2 bg-[#0a66c2] hover:bg-[#004182] text-white rounded-[6px] text-xs font-semibold transition flex items-center justify-center space-x-1.5 shadow-sm"
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
            <div className="border-4 border-double border-amber-400/70 p-8 rounded-[8px] bg-[#fcfaf7] text-center space-y-5">
              <div className="flex items-center justify-center space-x-2 text-[#0a66c2]">
                <GraduationCap className="w-7 h-7" />
                <span className="text-xl font-bold tracking-tight uppercase">Elevata</span>
              </div>

              <div className="space-y-1">
                <h2 className="text-xs font-bold uppercase tracking-widest text-amber-800">
                  Official Accredited Certificate of Completion
                </h2>
                <p className="text-[11px] text-[#5e5e5e]">This certifies that</p>
                <h3 className="text-2xl font-bold text-[#181818] underline decoration-amber-400 decoration-2">
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
                  <div className="w-12 h-12 rounded-full border-2 border-dashed border-amber-500 flex items-center justify-center mx-auto text-amber-700 font-bold text-[10px]">
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
                className="px-5 py-2 bg-[#0a66c2] hover:bg-[#004182] text-white rounded-[6px] text-xs font-semibold transition"
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
