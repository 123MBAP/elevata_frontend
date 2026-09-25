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
  Globe,
  Hand,
  X
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
    <div className="space-y-6 pb-12 font-sans">
      {/* Top Banner & Header - Registration System Styling */}
      <div className="rounded-[10px] bg-white p-6 sm:p-7 border border-[#e0e0e0] shadow-[0_2px_8px_rgba(0,0,0,0.06)] relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-[6px] bg-[#eaf2ff] border border-[#0a66c2]/20 text-[#0a66c2] text-xs font-semibold">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Credit Institution Virtual Academy Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#181818]">
              Virtual Training & Masterclass Manager
            </h1>
            <p className="text-xs sm:text-sm text-[#5e5e5e] max-w-2xl leading-relaxed">
              Schedule interactive capacity building, broadcast live underwriting masterclasses to registered SMEs across all sectors with screen sharing,
              manage waiting room admissions, and issue official accredited certificates.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                setEditingTraining(null);
                setIsScheduleModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-[6px] bg-[#0a66c2] hover:bg-[#004182] text-white font-semibold text-xs shadow-sm flex items-center space-x-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule New Training</span>
            </button>
          </div>
        </div>

        {/* Universal Access Notice */}
        <div className="mt-4 pt-3.5 border-t border-[#e0e0e0] flex items-center gap-2 text-xs text-[#5e5e5e]">
          <Globe className="w-3.5 h-3.5 text-[#0a66c2] shrink-0" />
          <span><strong className="text-[#181818]">Universal SME Distribution Active:</strong> All masterclasses scheduled here are immediately visible to and attendable by all SMEs across all business sectors.</span>
        </div>

        {/* Live Warning Banner if sessions are active - Zero Emojis */}
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
                {liveTrainings.length} Masterclass{liveTrainings.length > 1 ? 'es are' : ' is'} currently in live broadcast session
              </p>
            </div>
            <button
              onClick={() => setDeliveringTraining(liveTrainings[0])}
              className="px-3.5 py-1.5 rounded-[6px] bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-sm"
            >
              <Radio className="w-3.5 h-3.5 text-white" />
              <span>Enter Live Delivery Studio</span>
            </button>
          </div>
        )}
      </div>

      {/* KPI Metrics Summary - Minimalist Registration Styling */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-[8px] border border-[#e0e0e0] shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex items-center space-x-3">
          <div className="w-8 h-8 rounded-[6px] bg-[#eaf2ff] text-[#0a66c2] flex items-center justify-center font-bold shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-[#5e5e5e] font-semibold uppercase tracking-wider truncate">Total Sessions</p>
            <p className="text-base font-bold text-[#181818]">{totalTrainings}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-[8px] border border-[#e0e0e0] shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex items-center space-x-3">
          <div className="w-8 h-8 rounded-[6px] bg-red-50 text-red-600 flex items-center justify-center font-bold shrink-0">
            <Radio className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-[#5e5e5e] font-semibold uppercase tracking-wider truncate">Live Now</p>
            <p className="text-base font-bold text-red-600">{liveTrainings.length}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-[8px] border border-[#e0e0e0] shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex items-center space-x-3">
          <div className="w-8 h-8 rounded-[6px] bg-[#eaf2ff] text-[#0a66c2] flex items-center justify-center font-bold shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-[#5e5e5e] font-semibold uppercase tracking-wider truncate">Total Enrolled</p>
            <p className="text-base font-bold text-[#181818]">{totalEnrolled} SMEs</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-[8px] border border-[#e0e0e0] shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex items-center space-x-3">
          <div className="w-8 h-8 rounded-[6px] bg-amber-50 text-amber-700 flex items-center justify-center font-bold shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-[#5e5e5e] font-semibold uppercase tracking-wider truncate">Waiting Queue</p>
            <p className="text-base font-bold text-amber-700">{totalWaiting} Waiting</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-[8px] border border-[#e0e0e0] shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex items-center space-x-3 col-span-2 sm:col-span-1">
          <div className="w-8 h-8 rounded-[6px] bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold shrink-0">
            <Award className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-[#5e5e5e] font-semibold uppercase tracking-wider truncate">Certificates</p>
            <p className="text-base font-bold text-emerald-700">{totalCertificates}</p>
          </div>
        </div>
      </div>

      {/* Control Navigation & Filter Bar - Registration Segmented Style */}
      <div className="bg-white p-3.5 sm:p-4 rounded-[8px] border border-[#e0e0e0] shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center space-x-1 p-1 bg-[#f3f2f0] rounded-[6px] border border-[#e0e0e0] overflow-x-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 rounded-[5px] text-xs font-semibold transition whitespace-nowrap ${
                activeTab === 'all' ? 'bg-white text-[#0a66c2] shadow-sm font-bold' : 'text-[#5e5e5e] hover:text-[#181818]'
              }`}
            >
              All Sessions ({totalTrainings})
            </button>
            <button
              onClick={() => setActiveTab('live')}
              className={`px-3.5 py-1.5 rounded-[5px] text-xs font-semibold transition whitespace-nowrap flex items-center space-x-1.5 ${
                activeTab === 'live'
                  ? 'bg-red-600 text-white shadow-sm font-bold'
                  : 'text-[#5e5e5e] hover:text-[#181818]'
              }`}
            >
              <Radio className="w-3 h-3" />
              <span>Live Now ({liveTrainings.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('scheduled')}
              className={`px-3.5 py-1.5 rounded-[5px] text-xs font-semibold transition whitespace-nowrap ${
                activeTab === 'scheduled' ? 'bg-white text-[#0a66c2] shadow-sm font-bold' : 'text-[#5e5e5e] hover:text-[#181818]'
              }`}
            >
              Scheduled ({scheduledTrainings.length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-3.5 py-1.5 rounded-[5px] text-xs font-semibold transition whitespace-nowrap ${
                activeTab === 'completed' ? 'bg-white text-[#0a66c2] shadow-sm font-bold' : 'text-[#5e5e5e] hover:text-[#181818]'
              }`}
            >
              Completed ({completedTrainings.length})
            </button>
          </div>

          {/* Search & Sector Filters */}
          <div className="flex items-center space-x-2.5">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-[#8c8c8c] absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search masterclasses or instructor..."
                className="w-full pl-8 pr-3 py-1.5 rounded-[6px] border border-[#cccccc] text-xs text-[#181818] outline-none transition-colors placeholder:text-[#8c8c8c] focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
              />
            </div>

            <select
              value={sectorFilter}
              onChange={e => setSectorFilter(e.target.value)}
              className="px-3 py-1.5 rounded-[6px] border border-[#cccccc] text-xs text-[#181818] bg-white outline-none transition-colors focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
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
        <div className="p-12 text-center bg-white rounded-[10px] border border-[#e0e0e0] space-y-3">
          <div className="w-10 h-10 rounded-[8px] bg-[#eaf2ff] text-[#0a66c2] flex items-center justify-center mx-auto">
            <Video className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-[#181818]">No Masterclasses Found</h3>
          <p className="text-xs text-[#5e5e5e] max-w-md mx-auto">
            There are no virtual trainings matching your current filter criteria. Schedule a new masterclass to begin.
          </p>
          <button
            onClick={() => {
              setEditingTraining(null);
              setIsScheduleModalOpen(true);
            }}
            className="px-4 py-2 bg-[#0a66c2] text-white rounded-[6px] text-xs font-semibold hover:bg-[#004182] transition inline-flex items-center space-x-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule Masterclass</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTrainings.map(training => {
            const isLive = training.status === 'live';
            const isCompleted = training.completed || training.status === 'completed';
            const attendees = training.attendees || [];
            const waitingCount = attendees.filter(a => a.status === 'waiting').length;

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
                {/* Card Header */}
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      {isLive ? (
                        <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-[4px] bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider">
                          <Radio className="w-3 h-3" />
                          <span>LIVE STUDIO ACTIVE</span>
                        </span>
                      ) : isCompleted ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-[4px] bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Completed & Accredited</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-[4px] bg-[#eaf2ff] text-[#0a66c2] text-[10px] font-semibold border border-[#0a66c2]/20">
                          <Calendar className="w-3 h-3" />
                          <span>Scheduled Masterclass</span>
                        </span>
                      )}

                      <h3 className="text-sm font-bold text-[#181818] leading-snug line-clamp-2">
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
                        className="p-1.5 text-[#5e5e5e] hover:text-[#0a66c2] hover:bg-[#eaf2ff] rounded-[4px] transition"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteTraining(training.id)}
                        title="Cancel / Delete"
                        className="p-1.5 text-[#5e5e5e] hover:text-red-600 hover:bg-red-50 rounded-[4px] transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-[#5e5e5e] line-clamp-2 leading-relaxed">
                    {training.description}
                  </p>

                  {/* Schedule Details */}
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
                        <Clock className="w-3.5 h-3.5 text-[#8c8c8c]" />
                        <span>Duration:</span>
                      </span>
                      <span className="font-medium text-[#181818]">
                        {training.durationMinutes || 60} Minutes
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

                  {/* Universal Access & Target Audience Pills */}
                  <div className="p-2.5 rounded-[6px] bg-[#f8fafc] border border-[#e0e0e0] text-[11px] space-y-1">
                    <div className="flex items-center justify-between text-[#181818] font-semibold">
                      <span className="flex items-center space-x-1 text-[#0a66c2]">
                        <Globe className="w-3.5 h-3.5" />
                        <span>Open to All Registered SMEs</span>
                      </span>
                      {training.hasCertificate && (
                        <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-[4px] text-[10px] font-bold">
                          +12% Boost
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
                </div>

                {/* Card Footer & CTAs */}
                <div className="p-3.5 bg-[#f8fafc] border-t border-[#e0e0e0] space-y-2">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <button
                      onClick={() => setRosterTraining(training)}
                      className="font-semibold text-[#0a66c2] hover:underline flex items-center space-x-1"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>{training.participantsCount || 0} Enrolled SMEs</span>
                    </button>

                    {waitingCount > 0 && (
                      <span className="px-2 py-0.5 rounded-[4px] bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                        {waitingCount} in lobby
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {isLive ? (
                      <button
                        onClick={() => setDeliveringTraining(training)}
                        className="col-span-2 w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-[6px] text-xs font-bold shadow-sm flex items-center justify-center space-x-1.5 transition"
                      >
                        <Radio className="w-3.5 h-3.5" />
                        <span>Enter Live Studio</span>
                      </button>
                    ) : isCompleted ? (
                      <>
                        <button
                          onClick={() => setRosterTraining(training)}
                          className="w-full py-2 bg-white hover:bg-[#f3f2f0] text-[#181818] border border-[#cccccc] rounded-[6px] text-xs font-semibold flex items-center justify-center space-x-1 transition"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>View Roster</span>
                        </button>
                        <button
                          onClick={() => handleExportAttendance(training)}
                          className="w-full py-2 bg-[#0a66c2] hover:bg-[#004182] text-white rounded-[6px] text-xs font-semibold flex items-center justify-center space-x-1 transition shadow-sm"
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
                          className="w-full py-2 bg-[#0a66c2] hover:bg-[#004182] text-white rounded-[6px] text-xs font-semibold flex items-center justify-center space-x-1 transition shadow-sm"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Launch Live</span>
                        </button>
                        <button
                          onClick={() => setRosterTraining(training)}
                          className="w-full py-2 bg-white hover:bg-[#f3f2f0] text-[#181818] border border-[#cccccc] rounded-[6px] text-xs font-semibold flex items-center justify-center space-x-1 transition"
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

      {/* 3. Attendee & Waiting Room Roster Drawer/Modal - Registration Design & Zero Emojis */}
      {rosterTraining && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-[10px] shadow-xl border border-[#e0e0e0] w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-white border-b border-[#e0e0e0] p-5 text-[#181818] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#181818]">{rosterTraining.title} - Participant Roster</h3>
                <p className="text-xs text-[#5e5e5e]">
                  {rosterTraining.attendees?.length || 0} Total Registered SMEs
                </p>
              </div>
              <button
                onClick={() => setRosterTraining(null)}
                className="p-1.5 rounded-[4px] text-[#5e5e5e] hover:text-[#181818] hover:bg-[#f3f2f0] transition"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
              {/* Waiting Room Queue */}
              {rosterTraining.attendees && rosterTraining.attendees.filter(a => a.status === 'waiting').length > 0 && (
                <div className="p-4 bg-amber-50/70 rounded-[8px] border border-amber-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Waiting Room Queue ({rosterTraining.attendees.filter(a => a.status === 'waiting').length})</span>
                    </h4>
                    <button
                      onClick={() => admitAllAttendees(rosterTraining.id)}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-[4px] text-xs font-semibold transition"
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
                          className="flex items-center justify-between p-2.5 bg-white rounded-[6px] border border-amber-200 text-xs"
                        >
                          <div>
                            <p className="font-bold text-[#181818]">{att.name}</p>
                            <p className="text-[11px] text-[#5e5e5e]">{att.businessName || att.company} • {att.sector}</p>
                          </div>
                          <button
                            onClick={() => admitAttendee(rosterTraining.id, att.id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[4px] text-xs font-semibold transition"
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
                <h4 className="text-xs font-bold text-[#181818] uppercase tracking-wider mb-2">
                  Enrolled & Admitted Participants
                </h4>
                {(!rosterTraining.attendees || rosterTraining.attendees.length === 0) ? (
                  <p className="text-xs text-[#8c8c8c] italic">No participants enrolled yet.</p>
                ) : (
                  <div className="divide-y divide-[#e0e0e0] border border-[#e0e0e0] rounded-[8px] overflow-hidden">
                    {rosterTraining.attendees.map(att => (
                      <div key={att.id} className="p-3 flex items-center justify-between hover:bg-[#f8fafc] text-xs">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-[#eaf2ff] text-[#0a66c2] font-bold flex items-center justify-center text-xs">
                            {att.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-[#181818]">{att.name}</p>
                            <p className="text-[11px] text-[#5e5e5e]">{att.businessName || att.company} • {att.sector}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {att.status === 'admitted' ? (
                            <span className="px-2 py-0.5 rounded-[4px] bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
                              Admitted
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-[4px] bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-semibold">
                              Waiting
                            </span>
                          )}
                          {att.handRaised && (
                            <span className="px-2 py-0.5 rounded-[4px] bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-semibold flex items-center space-x-1">
                              <Hand className="w-3 h-3 text-amber-600" />
                              <span>Hand Raised</span>
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-[#f8fafc] border-t border-[#e0e0e0] flex items-center justify-between">
              <button
                onClick={() => handleExportAttendance(rosterTraining)}
                className="px-4 py-2 bg-white hover:bg-[#f3f2f0] text-[#181818] border border-[#cccccc] rounded-[6px] text-xs font-semibold flex items-center space-x-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Attendance</span>
              </button>
              <button
                onClick={() => setRosterTraining(null)}
                className="px-4 py-2 bg-[#0a66c2] hover:bg-[#004182] text-white rounded-[6px] text-xs font-semibold transition"
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
