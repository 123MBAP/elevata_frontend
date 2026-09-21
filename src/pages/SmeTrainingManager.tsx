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
  PlayCircle
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

  const [activeTab, setActiveTab] = useState<'enrolled' | 'explore' | 'certificates'>('enrolled');
  const [searchQuery, setSearchQuery] = useState('');
  const [sectorFilter, setSectorFilter] = useState('ALL');
  const [attendingTraining, setAttendingTraining] = useState<Training | null>(null);
  const [previewCertTraining, setPreviewCertTraining] = useState<Training | null>(null);

  // Enrolled list: sessions where SME has enrolled OR has attended/completed OR is listed in attendees
  const enrolledTrainings = trainings.filter(t => {
    const isExplicitlyEnrolled = t.enrolled;
    const isAttendee = t.attendees?.some(a => a.id === activeSme.id);
    const hasAttended = t.attended;
    return isExplicitlyEnrolled || isAttendee || hasAttended;
  });

  const liveTrainings = trainings.filter(t => t.status === 'live');
  const completedTrainings = enrolledTrainings.filter(t => t.completed || t.attended);

  // Explore list: all trainings matching search / sector
  const exploreTrainings = trainings.filter(t => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDesc = t.description?.toLowerCase().includes(q);
      const matchSpeaker = t.speaker?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchSpeaker) return false;
    }

    if (sectorFilter !== 'ALL') {
      const hasSector = t.targetAudience?.some(
        aud => aud.toLowerCase().includes(sectorFilter.toLowerCase()) || aud === 'All Sectors'
      );
      if (!hasSector) return false;
    }

    return true;
  });

  const readinessBoostTotal = completedTrainings.length * 12;

  const handleAddToCalendar = (training: Training) => {
    const title = encodeURIComponent(training.title);
    const details = encodeURIComponent(
      `${training.description}\n\nInstructor: ${training.speaker} (${training.speakerOrg || 'Delivering Bank'})\nMeeting Link: ${training.meetingLink}`
    );
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}`;
    window.open(url, '_blank');
  };

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
              Attend live interactive underwriting masterclasses delivered directly by financial institutions, master
              financial statements, raise your questions in real-time, and earn verified accredited certificates.
            </p>
          </div>

          {/* Readiness Score Card */}
          <div className="p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-center min-w-[180px]">
            <div className="flex items-center justify-center space-x-1.5 text-emerald-300 mb-1">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Readiness Impact</span>
            </div>
            <p className="text-2xl font-extrabold text-white">+{readinessBoostTotal}%</p>
            <p className="text-[10px] text-emerald-200 mt-0.5">Accredited Underwriting Boost</p>
          </div>
        </div>

        {/* Live Warning Banner if sessions are active */}
        {liveTrainings.length > 0 && (
          <div className="mt-6 pt-5 border-t border-emerald-900/60 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center space-x-3">
              <span className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500"></span>
              </span>
              <p className="text-xs font-bold text-white">
                🔴 {liveTrainings[0].title} is LIVE NOW with interactive screen stream!
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
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Enrolled Sessions</p>
            <p className="text-lg font-bold text-slate-900">{enrolledTrainings.length}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Live Now</p>
            <p className="text-lg font-bold text-red-600">{liveTrainings.length}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Completed</p>
            <p className="text-lg font-bold text-slate-900">{completedTrainings.length}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Certificates</p>
            <p className="text-lg font-bold text-amber-600">{completedTrainings.length}</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center space-x-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto">
            <button
              onClick={() => setActiveTab('enrolled')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center space-x-1.5 ${
                activeTab === 'enrolled'
                  ? 'bg-white text-emerald-800 shadow-sm border border-slate-200/50'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>My Enrolled Schedule ({enrolledTrainings.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('explore')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center space-x-1.5 ${
                activeTab === 'explore'
                  ? 'bg-white text-emerald-800 shadow-sm border border-slate-200/50'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Explore Masterclasses ({trainings.length})</span>
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
              <span>Accredited Certificates ({completedTrainings.length})</span>
            </button>
          </div>

          {/* Search & Filter */}
          {activeTab !== 'certificates' && (
            <div className="flex items-center space-x-2.5">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search topic or bank..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <select
                value={sectorFilter}
                onChange={e => setSectorFilter(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                <option value="ALL">All Sectors</option>
                <option value="Retail">Retail</option>
                <option value="Agriculture">Agriculture</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Technology">Technology</option>
                <option value="Logistics">Logistics</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Tab 1: My Enrolled Schedule */}
      {activeTab === 'enrolled' && (
        <div>
          {enrolledTrainings.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <GraduationCap className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-800">You haven't enrolled in any masterclasses yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Explore available bankability trainings published by credit institutions to build capacity and earn verified certificate boosts.
              </p>
              <button
                onClick={() => setActiveTab('explore')}
                className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition inline-flex items-center space-x-1.5"
              >
                <span>Browse Available Masterclasses</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {enrolledTrainings.map(training => {
                const isLive = training.status === 'live';
                const isCompleted = training.completed || training.attended;

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
                    <div className="p-5 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          {isLive ? (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-red-500 text-white text-[10px] font-extrabold uppercase tracking-wider animate-pulse shadow-sm">
                              <Radio className="w-3 h-3 animate-ping" />
                              <span>BROADCASTING LIVE</span>
                            </span>
                          ) : isCompleted ? (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Completed & Accredited</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
                              <Calendar className="w-3 h-3" />
                              <span>Enrolled • Upcoming</span>
                            </span>
                          )}

                          <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2 mt-1">
                            {training.title}
                          </h3>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {training.description}
                      </p>

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
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            <span>Host Institution:</span>
                          </span>
                          <span className="font-semibold text-slate-800">
                            {training.speakerOrg || 'Bank Credit Dept.'}
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
                      ) : (
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
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Explore Masterclasses Catalog */}
      {activeTab === 'explore' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {exploreTrainings.map(training => {
            const isEnrolled =
              training.enrolled ||
              training.attendees?.some(a => a.id === activeSme.id) ||
              training.attended;
            const isLive = training.status === 'live';

            return (
              <div
                key={training.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md"
              >
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                        <Building2 className="w-3 h-3" />
                        <span>{training.speakerOrg || 'Financial Institution'}</span>
                      </span>

                      <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2 mt-1">
                        {training.title}
                      </h3>
                    </div>

                    {isLive && (
                      <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-extrabold animate-pulse">
                        LIVE NOW
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {training.description}
                  </p>

                  {/* Syllabus Roadmap Preview */}
                  {training.curriculum && training.curriculum.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Key Modules:</p>
                      <ul className="text-xs text-slate-600 space-y-1">
                        {training.curriculum.slice(0, 2).map((mod, i) => (
                          <li key={i} className="flex items-start space-x-1.5 truncate">
                            <span className="text-emerald-500 font-bold">•</span>
                            <span className="truncate">{mod}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Schedule Details */}
                  <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs text-slate-700 border border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Date & Time:</span>
                      <span className="font-bold text-slate-900">
                        {training.date} • {training.time}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Instructor:</span>
                      <span className="font-medium text-slate-800">{training.speaker}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Enrollment Action */}
                <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-slate-500">
                    {training.participantsCount || 0} Registered
                  </span>

                  {isEnrolled ? (
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-emerald-600 flex items-center space-x-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>Enrolled</span>
                      </span>
                      <button
                        onClick={() => setAttendingTraining(training)}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition"
                      >
                        {isLive ? 'Join Live' : 'Open Room'}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        toggleTrainingEnrollment(training.id);
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition flex items-center space-x-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Enroll in Masterclass</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 3: Accredited Certificates Portfolio */}
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
                onClick={() => setActiveTab('explore')}
                className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition"
              >
                Find a Masterclass to Attend
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
