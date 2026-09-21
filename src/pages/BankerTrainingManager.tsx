import React, { useState } from 'react';
import {
  Video,
  Calendar,
  Clock,
  Users,
  Award,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Radio,
  Sparkles,
  ExternalLink,
  ChevronRight,
  UserCheck,
  Download,
  Edit,
  Trash2,
  Share2,
  ShieldCheck,
  BookOpen,
  ArrowRight,
  GraduationCap,
  Globe
} from 'lucide-react';
import { Training, useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import ScheduleTrainingModal from '../assets/components/ScheduleTrainingModal';
import VirtualTrainingDeliveryModal from '../assets/components/VirtualTrainingDeliveryModal';

export default function BankerTrainingManager() {
  const { user } = useAuth();
  const {
    trainings,
    deleteTraining,
    startLiveTraining,
    admitAttendee,
    admitAllAttendees
  } = useApp();

  // State
  const [activeTab, setActiveTab] = useState<'all' | 'live' | 'scheduled' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sectorFilter, setSectorFilter] = useState('ALL');
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingTraining, setEditingTraining] = useState<Training | null>(null);
  const [deliveringTraining, setDeliveringTraining] = useState<Training | null>(null);
  const [rosterTraining, setRosterTraining] = useState<Training | null>(null);

  // Statistics calculation
  const totalTrainings = trainings.length;
  const liveTrainings = trainings.filter(t => t.status === 'live');
  const scheduledTrainings = trainings.filter(t => t.status !== 'live' && !t.completed);
  const completedTrainings = trainings.filter(t => t.completed || t.status === 'completed');

  const totalEnrolled = trainings.reduce((acc, t) => acc + (t.participantsCount || 0), 0);
  const totalWaiting = trainings.reduce(
    (acc, t) => acc + (t.attendees?.filter(a => a.status === 'waiting').length || 0),
    0
  );
  const totalCertificates = trainings.filter(t => t.completed).length * 18; // Simulated aggregate

  // Filtered trainings
  const filteredTrainings = trainings.filter(t => {
    // Status tab filter
    if (activeTab === 'live' && t.status !== 'live') return false;
    if (activeTab === 'scheduled' && (t.status === 'live' || t.completed)) return false;
    if (activeTab === 'completed' && !t.completed && t.status !== 'completed') return false;

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchSpeaker = t.speaker?.toLowerCase().includes(q);
      const matchDesc = t.description?.toLowerCase().includes(q);
      if (!matchTitle && !matchSpeaker && !matchDesc) return false;
    }

    // Sector filter
    if (sectorFilter !== 'ALL') {
      const hasSector = t.targetAudience?.some(
        aud => aud.toLowerCase().includes(sectorFilter.toLowerCase()) || aud === 'All Sectors'
      );
      if (!hasSector) return false;
    }

    return true;
  });

  const handleExportAttendance = (training: Training) => {
    const attendees = training.attendees || [];
    const csvContent = [
      ['Attendee Name', 'Company', 'Sector', 'Status', 'Hand Raised', 'Joined At'],
      ...attendees.map(a => [
        a.name,
        a.company || a.businessName || 'N/A',
        a.sector || 'N/A',
        a.status,
        a.handRaised ? 'Yes' : 'No',
        a.joinedAt || 'N/A'
      ])
    ]
      .map(e => e.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${training.title.replace(/\s+/g, '_')}_Attendance.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Credit Institution Virtual Academy Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Virtual Training & Masterclass Manager
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Schedule interactive capacity building, broadcast live underwriting masterclasses to all registered SMEs across all sectors with screen sharing,
              manage waiting room admissions, and issue official accredited certificates.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                setEditingTraining(null);
                setIsScheduleModalOpen(true);
              }}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-lg shadow-blue-500/30 flex items-center space-x-2 transition transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule New Training</span>
            </button>
          </div>
        </div>

        {/* Universal Access Notice */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-2 text-xs text-blue-200">
          <Globe className="w-4 h-4 text-blue-400 shrink-0" />
          <span><strong>Universal SME Distribution Active:</strong> All masterclasses scheduled here are immediately visible to and attendable by all SMEs across all business sectors.</span>
        </div>

        {/* Live Warning Banner if sessions are active */}
        {liveTrainings.length > 0 && (
          <div className="mt-6 pt-5 border-t border-slate-800 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center space-x-3">
              <span className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500"></span>
              </span>
              <p className="text-xs font-bold text-white">
                {liveTrainings.length} Masterclass{liveTrainings.length > 1 ? 'es are' : ' is'} currently LIVE!
              </p>
            </div>
            <button
              onClick={() => setDeliveringTraining(liveTrainings[0])}
              className="px-4 py-1.5 rounded-lg bg-red-500/20 border border-red-500/40 text-red-200 text-xs font-bold hover:bg-red-500/30 transition flex items-center space-x-1.5"
            >
              <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse" />
              <span>Join Live Delivery Room</span>
            </button>
          </div>
        )}
      </div>

      {/* KPI Metrics Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Total Sessions</p>
            <p className="text-lg font-bold text-slate-900">{totalTrainings}</p>
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
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Total Enrolled</p>
            <p className="text-lg font-bold text-slate-900">{totalEnrolled} SMEs</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Waiting Queue</p>
            <p className="text-lg font-bold text-amber-600">{totalWaiting} Waiting</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3 col-span-2 sm:col-span-1">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Certificates Awarded</p>
            <p className="text-lg font-bold text-emerald-600">{totalCertificates}</p>
          </div>
        </div>
      </div>

      {/* Control Navigation & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center space-x-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Sessions ({totalTrainings})
            </button>
            <button
              onClick={() => setActiveTab('live')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center space-x-1.5 ${
                activeTab === 'live'
                  ? 'bg-red-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
              <span>Live Now ({liveTrainings.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('scheduled')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'scheduled' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Scheduled ({scheduledTrainings.length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'completed' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Completed ({completedTrainings.length})
            </button>
          </div>

          {/* Search & Sector Filters */}
          <div className="flex items-center space-x-2.5">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search masterclasses or instructor..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <select
              value={sectorFilter}
              onChange={e => setSectorFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="ALL">All Sectors (Cross-Sector Reach)</option>
              <option value="Retail">Retail & Wholesale</option>
              <option value="Agriculture">Agriculture & Processing</option>
              <option value="Manufacturing">Manufacturing</option>
              <option value="Technology">Technology & ICT</option>
              <option value="Logistics">Logistics & Transport</option>
            </select>
          </div>
        </div>
      </div>

      {/* Trainings Grid / Cards */}
      {filteredTrainings.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center mx-auto">
            <Video className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Masterclasses Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            There are no virtual trainings matching your current filter criteria. Schedule a new masterclass to begin.
          </p>
          <button
            onClick={() => {
              setEditingTraining(null);
              setIsScheduleModalOpen(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition inline-flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Masterclass</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTrainings.map(training => {
            const isLive = training.status === 'live';
            const isCompleted = training.completed || training.status === 'completed';
            const attendees = training.attendees || [];
            const waitingCount = attendees.filter(a => a.status === 'waiting').length;

            return (
              <div
                key={training.id}
                className={`bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md ${
                  isLive
                    ? 'border-red-500 ring-2 ring-red-500/20'
                    : isCompleted
                    ? 'border-emerald-200'
                    : 'border-slate-200 hover:border-blue-300'
                }`}
              >
                {/* Card Header */}
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      {isLive ? (
                        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-red-500 text-white text-[10px] font-extrabold uppercase tracking-wider animate-pulse shadow-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                          <span>LIVE STUDIO ACTIVE</span>
                        </span>
                      ) : isCompleted ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Completed & Accredited</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
                          <Calendar className="w-3 h-3" />
                          <span>Scheduled Masterclass</span>
                        </span>
                      )}

                      <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2 mt-1">
                        {training.title}
                      </h3>
                    </div>

                    {/* Quick Menu Actions */}
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => {
                          setEditingTraining(training);
                          setIsScheduleModalOpen(true);
                        }}
                        title="Edit Masterclass"
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteTraining(training.id)}
                        title="Cancel / Delete"
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {training.description}
                  </p>

                  {/* Schedule Details */}
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
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Duration:</span>
                      </span>
                      <span className="font-semibold text-slate-800">
                        {training.durationMinutes || 60} Minutes
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

                  {/* Universal Access & Target Audience Pills */}
                  <div className="p-2.5 rounded-xl bg-blue-50/60 border border-blue-100 text-[11px] space-y-1">
                    <div className="flex items-center justify-between text-blue-900 font-bold">
                      <span className="flex items-center space-x-1">
                        <Globe className="w-3.5 h-3.5 text-blue-600" />
                        <span>Open to All Registered SMEs</span>
                      </span>
                      {training.hasCertificate && (
                        <span className="text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded text-[10px] font-bold">
                          +12% Boost
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
                </div>

                {/* Card Footer & CTAs */}
                <div className="p-4 bg-slate-50/70 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <button
                      onClick={() => setRosterTraining(training)}
                      className="font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>{training.participantsCount || 0} Enrolled SMEs</span>
                    </button>

                    {waitingCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold animate-pulse">
                        {waitingCount} waiting in lobby
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {isLive ? (
                      <button
                        onClick={() => setDeliveringTraining(training)}
                        className="col-span-2 w-full py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-red-500/20 flex items-center justify-center space-x-1.5 transition"
                      >
                        <Radio className="w-4 h-4 animate-pulse" />
                        <span>Enter Live Studio</span>
                      </button>
                    ) : isCompleted ? (
                      <>
                        <button
                          onClick={() => setRosterTraining(training)}
                          className="w-full py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center space-x-1 transition"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>View Roster</span>
                        </button>
                        <button
                          onClick={() => handleExportAttendance(training)}
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1 transition shadow-sm"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Export CSV</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            startLiveTraining(training.id);
                            setDeliveringTraining({ ...training, status: 'live' });
                          }}
                          className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1 transition shadow-sm"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Launch Live</span>
                        </button>
                        <button
                          onClick={() => setRosterTraining(training)}
                          className="w-full py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center justify-center space-x-1 transition"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Manage Queue</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {/* 1. Schedule / Edit Training Modal */}
      <ScheduleTrainingModal
        isOpen={isScheduleModalOpen}
        onClose={() => {
          setIsScheduleModalOpen(false);
          setEditingTraining(null);
        }}
        initialData={editingTraining}
      />

      {/* 2. Virtual Training Delivery Studio Modal */}
      {deliveringTraining && (
        <VirtualTrainingDeliveryModal
          training={deliveringTraining}
          onClose={() => setDeliveringTraining(null)}
          onComplete={() => setDeliveringTraining(null)}
        />
      )}

      {/* 3. Attendee & Waiting Room Roster Drawer/Modal */}
      {rosterTraining && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">{rosterTraining.title} - Participant Roster</h3>
                <p className="text-xs text-slate-300">
                  {rosterTraining.attendees?.length || 0} Total Registered SMEs
                </p>
              </div>
              <button
                onClick={() => setRosterTraining(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
              {/* Waiting Room Queue */}
              {rosterTraining.attendees && rosterTraining.attendees.filter(a => a.status === 'waiting').length > 0 && (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center space-x-1.5">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span>Waiting Room Queue ({rosterTraining.attendees.filter(a => a.status === 'waiting').length})</span>
                    </h4>
                    <button
                      onClick={() => admitAllAttendees(rosterTraining.id)}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition"
                    >
                      Admit All
                    </button>
                  </div>
                  <div className="space-y-2">
                    {rosterTraining.attendees
                      .filter(a => a.status === 'waiting')
                      .map(att => (
                        <div
                          key={att.id}
                          className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-amber-200 text-xs"
                        >
                          <div>
                            <p className="font-bold text-slate-900">{att.name}</p>
                            <p className="text-[11px] text-slate-500">{att.businessName || att.company} • {att.sector}</p>
                          </div>
                          <button
                            onClick={() => admitAttendee(rosterTraining.id, att.id)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition"
                          >
                            Admit
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* All Attendees */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Enrolled & Admitted Participants
                </h4>
                {(!rosterTraining.attendees || rosterTraining.attendees.length === 0) ? (
                  <p className="text-xs text-slate-400 italic">No participants enrolled yet.</p>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                    {rosterTraining.attendees.map(att => (
                      <div key={att.id} className="p-3 flex items-center justify-between hover:bg-slate-50 text-xs">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                            {att.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{att.name}</p>
                            <p className="text-[11px] text-slate-500">{att.businessName || att.company} • {att.sector}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {att.status === 'admitted' ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                              Admitted
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">
                              Waiting
                            </span>
                          )}
                          {att.handRaised && (
                            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">
                              ✋ Raised Hand
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => handleExportAttendance(rosterTraining)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Attendance</span>
              </button>
              <button
                onClick={() => setRosterTraining(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition"
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
