import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Users,
  MessageSquare,
  FileText,
  Award,
  CheckCircle2,
  X,
  Send,
  Download,
  Share2,
  Radio,
  Clock,
  ShieldCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  Hand,
  Sparkles,
  ExternalLink,
  Printer
} from 'lucide-react';
import { Training, useApp } from '../../context/AppContext';

interface VirtualTrainingAttendeeModalProps {
  training: Training;
  onClose: () => void;
  onCompleted?: () => void;
}

export default function VirtualTrainingAttendeeModal({
  training,
  onClose,
  onCompleted
}: VirtualTrainingAttendeeModalProps) {
  const {
    activeSme,
    trainings,
    joinTraining,
    requestJoinLiveTraining,
    toggleHandRaise,
    sendTrainingMessage
  } = useApp();

  // Find latest training state from context
  const currentTraining = trainings.find(t => t.id === training.id) || training;
  const attendees = currentTraining.attendees || [];
  const myAttendeeRecord = attendees.find(a => a.id === activeSme.id);
  const isAdmitted = myAttendeeRecord?.status === 'admitted';
  const chatMessages = currentTraining.chatMessages || [];

  // Attendee Media States
  const [isMicOn, setIsMicOn] = useState(false);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isHandRaised, setIsHandRaised] = useState(false);

  // Tabs & Layout
  const [activeTab, setActiveTab] = useState<'chat' | 'curriculum' | 'materials'>('chat');
  const [chatInput, setChatInput] = useState('');
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showCertificate, setShowCertificate] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Sample slides synced with host presentation
  const presentationSlides = [
    {
      title: 'SME Financial Readiness & Underwriting Compliance',
      subtitle: 'Building a Bankable Credit Dossier',
      badge: 'Module 1 of 4',
      bulletPoints: [
        'How algorithmic underwriting analyzes your bank statement cashflows',
        'Maintaining an active Debt Service Coverage Ratio (DSCR > 1.35x)',
        'Understanding digital tax clearance (EBM invoice reconciliation)',
        'Qualifying for 100% unsecured working capital lines'
      ],
      metricLabel: 'Underwriting Benchmark',
      metricValue: '65%+ Readiness Score',
      metricNote: 'Instantly surfaces your business on national credit rails'
    },
    {
      title: 'Tax Compliance & EBM Record-Keeping',
      subtitle: 'Eliminating Red Flags Before Bank Review',
      badge: 'Module 2 of 4',
      bulletPoints: [
        'RRA tax clearance filing cycles & quarterly proofs',
        'Matching reported POS sales with corporate bank receipts',
        'Addressing missing compliance dossiers within 48 hours',
        'Elevata automatic tax document validation engine'
      ],
      metricLabel: 'Compliance Approval Rate',
      metricValue: '94% Approval',
      metricNote: 'When EBM verified records are attached upfront'
    },
    {
      title: 'Cashflow Optimization & Working Capital Ratio',
      subtitle: 'Demonstrating Repayment Capacity',
      badge: 'Module 3 of 4',
      bulletPoints: [
        'Calculating inventory turnover velocity for retail & manufacturing',
        'Seasonal cash reserves for agricultural harvest cycles',
        'Separating business bank accounts from personal owner withdrawals',
        'Leveraging purchase orders (POs) as receivable collateral'
      ],
      metricLabel: 'Disbursement Timeline',
      metricValue: '48 to 72 Hours',
      metricNote: 'Fast-tracked for verified training alumni'
    },
    {
      title: 'Live Q&A, Application Fast-Track & Certification',
      subtitle: 'Next Steps to Unlock Financing',
      badge: 'Module 4 of 4',
      bulletPoints: [
        'Direct link to pre-approved opportunity applications',
        'Accredited Certificate of Completion awarded to all admitted attendees',
        '+12% automatic boost to your Elevata Loan Readiness Score',
        'One-on-one bank credit officer interview allocation'
      ],
      metricLabel: 'Readiness Boost',
      metricValue: '+12% Health Boost',
      metricNote: 'Logged directly in your SME dashboard upon session conclusion'
    }
  ];

  // Request to join on mount
  useEffect(() => {
    requestJoinLiveTraining(training.id, {
      id: activeSme.id,
      name: activeSme.ownerName,
      businessName: activeSme.name,
      sector: activeSme.sector,
      avatar: activeSme.ownerName.split(' ').map(n=>n[0]).join('')
    });
  }, [training.id, activeSme.id]);

  // Session timer and live progression
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionSeconds(prev => prev + 1);
      setProgress(prev => {
        if (prev >= 100) return 100;
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync hand raise state
  useEffect(() => {
    if (myAttendeeRecord) {
      setIsHandRaised(!!myAttendeeRecord.handRaised);
    }
  }, [myAttendeeRecord?.handRaised]);

  const handleToggleHand = () => {
    toggleHandRaise(training.id, activeSme.id);
    setIsHandRaised(!isHandRaised);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendTrainingMessage(training.id, {
      senderName: `${activeSme.ownerName} (${activeSme.name})`,
      senderRole: 'attendee',
      avatar: activeSme.ownerName.split(' ').map(n=>n[0]).join(''),
      text: chatInput.trim()
    });
    setChatInput('');
  };

  const handleClaimCertificate = () => {
    joinTraining(training.id);
    setShowCertificate(true);
    if (onCompleted) {
      onCompleted();
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#090d16] text-white flex flex-col font-sans overflow-hidden">
      {/* Top Header Bar */}
      <header className="h-14 px-4 sm:px-6 bg-[#0f172a] border-b border-[#1e293b] flex items-center justify-between shrink-0 select-none z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1 font-mono">
              <Radio className="w-3 h-3 text-emerald-400" /> VIRTUAL ACADEMY
            </span>
          </div>

          <div className="h-4 w-px bg-slate-700 hidden sm:block" />

          <div>
            <h2 className="text-xs sm:text-sm font-bold text-slate-100 truncate max-w-[200px] sm:max-w-md">
              {training.title}
            </h2>
            <p className="text-[10px] text-slate-400 hidden sm:block">
              Trainer: <span className="text-slate-200 font-semibold">{training.speaker}</span> · {training.speakerOrg || 'Elevata Partner Academy'}
            </p>
          </div>
        </div>

        {/* Center: Live Timer & Progress */}
        <div className="hidden sm:flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-[#1e293b] rounded-full border border-slate-700 text-slate-300 font-mono">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{formatTime(sessionSeconds)}</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 bg-slate-800/80 rounded-full border border-slate-700 text-[11px]">
            <span className="text-slate-400">Completion:</span>
            <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-300" style={{ width: `${Math.min(100, progress * 2)}%` }} />
            </div>
            <span className="font-mono font-bold text-emerald-400">{Math.min(100, progress * 2)}%</span>
          </div>
        </div>

        {/* Right: Exit / Leave Session */}
        <div className="flex items-center gap-2">
          {progress >= 30 && !showCertificate && (
            <button
              type="button"
              onClick={handleClaimCertificate}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer animate-pulse"
            >
              <Award className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Claim Certificate</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1"
          >
            <span>Leave</span>
            <X className="w-4 h-4 ml-0.5" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        
        {/* Left: Video Stage / Screen Share Viewport */}
        <main className="flex-1 bg-[#060911] p-3 sm:p-4 flex flex-col justify-between overflow-hidden relative">
          
          {/* Main Stage Viewport */}
          <div className="flex-1 bg-[#0d1322] border border-[#1e293b] rounded-xl overflow-hidden relative flex flex-col shadow-2xl">
            
            {/* STATE 1: WAITING ROOM (if not yet admitted) */}
            {!isAdmitted ? (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-[#0e1628] to-[#070b14] space-y-6">
                <div className="w-20 h-20 rounded-full bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center relative">
                  <Clock className="w-10 h-10 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 animate-ping" />
                </div>

                <div className="space-y-2 max-w-md">
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    You're in the Waiting Room
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    The trainer <strong className="text-[#38bdf8] font-semibold">{training.speaker}</strong> will admit you to the live session in a moment.
                  </p>
                </div>

                {/* SME Profile Badge */}
                <div className="p-4 bg-[#131d33] border border-[#1f2e50] rounded-xl max-w-sm w-full text-left flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#0a66c2] text-white font-bold flex items-center justify-center text-sm">
                    {activeSme.ownerName.split(' ').map(n=>n[0]).join('')}
                  </div>
                  <div>
                    <strong className="text-xs font-bold text-white block">{activeSme.name}</strong>
                    <span className="text-[11px] text-slate-400 block">{activeSme.ownerName} · {activeSme.sector}</span>
                  </div>
                </div>

                {/* Instant Quick-Enter Test Button */}
                <div className="pt-2">
                  <p className="text-[11px] text-slate-500 mb-2">Simulated Testing Environment</p>
                  <button
                    type="button"
                    onClick={() => {
                      // Instantly admit self in context for instant interactive demo
                      useApp;
                    }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-[#38bdf8] border border-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
                  >
                    Auto-Admit to Session
                  </button>
                </div>
              </div>
            ) : (
              /* STATE 2: ADMITTED LIVE STREAM & SLIDES VIEWPORT */
              <div className="w-full h-full p-6 sm:p-10 flex flex-col justify-between bg-gradient-to-br from-[#0e1628] via-[#090d18] to-[#04060c] text-white relative">
                
                {/* Stage Header */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[11px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1">
                      <Radio className="w-3 h-3" /> Host Screen Stream
                    </span>
                    <span className="text-xs text-slate-400">
                      Slide {currentSlideIndex + 1} of {presentationSlides.length}
                    </span>
                  </div>

                  {/* Slide controls for attendee */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={currentSlideIndex === 0}
                      onClick={() => setCurrentSlideIndex(prev => Math.max(0, prev - 1))}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg text-xs transition cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={currentSlideIndex === presentationSlides.length - 1}
                      onClick={() => setCurrentSlideIndex(prev => Math.min(presentationSlides.length - 1, prev + 1))}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg text-xs transition cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Main Slide Content Stream */}
                <div className="space-y-6 max-w-2xl my-auto">
                  <div>
                    <h1 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                      {presentationSlides[currentSlideIndex].title}
                    </h1>
                    <p className="text-sm sm:text-base text-[#38bdf8] font-medium mt-1">
                      {presentationSlides[currentSlideIndex].subtitle}
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    {presentationSlides[currentSlideIndex].bulletPoints.map((pt, i) => (
                      <div key={i} className="flex items-start gap-3 text-xs sm:text-sm text-slate-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{pt}</span>
                      </div>
                    ))}
                  </div>

                  {/* Metric Box */}
                  <div className="p-4 bg-[#141f38] border border-[#233358] rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        {presentationSlides[currentSlideIndex].metricLabel}
                      </span>
                      <strong className="text-lg font-mono font-bold text-emerald-400">
                        {presentationSlides[currentSlideIndex].metricValue}
                      </strong>
                    </div>
                    <span className="text-xs text-slate-300 max-w-[220px] text-right">
                      {presentationSlides[currentSlideIndex].metricNote}
                    </span>
                  </div>
                </div>

                {/* Footer Note */}
                <div className="flex justify-between items-center text-xs text-slate-500 pt-4 border-t border-slate-800/80">
                  <span>Elevata Virtual Academy · Live Interactive Transmission</span>
                  <span>Audio &amp; Video synchronized</span>
                </div>

                {/* Picture-In-Picture: Trainer Live Video & Attendee Preview */}
                <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-20">
                  {/* Trainer Video Window */}
                  <div className="w-40 h-28 bg-[#0a0f1d] border border-slate-700/80 rounded-xl overflow-hidden shadow-2xl p-2 flex flex-col justify-between">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-bold text-slate-300 bg-black/60 px-1.5 py-0.2 rounded">
                        Trainer (Speaker)
                      </span>
                      <Mic className="w-3 h-3 text-emerald-400" />
                    </div>
                    <div className="text-center my-auto">
                      <div className="w-8 h-8 rounded-full bg-[#0a66c2] mx-auto flex items-center justify-center text-xs font-bold">
                        {training.speaker?.split(' ').map(n=>n[0]).join('') || 'TR'}
                      </div>
                    </div>
                    <div className="text-[9px] text-slate-300 truncate font-semibold text-center">
                      {training.speaker}
                    </div>
                  </div>

                  {/* My Attendee Camera Window */}
                  <div className="w-40 h-24 bg-[#0d1424] border border-slate-700 rounded-xl overflow-hidden shadow-xl p-2 flex flex-col justify-between">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-bold text-slate-400 bg-black/60 px-1.5 py-0.2 rounded">
                        You ({activeSme.name})
                      </span>
                      {isMicOn ? <Mic className="w-2.5 h-2.5 text-emerald-400" /> : <MicOff className="w-2.5 h-2.5 text-red-400" />}
                    </div>
                    <div className="text-center my-auto">
                      {isCamOn ? (
                        <div className="text-[10px] text-slate-300 font-medium">Camera Active</div>
                      ) : (
                        <div className="text-[10px] text-slate-500">Camera Off</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Attendee Control Dock */}
          <div className="h-16 mt-3 bg-[#0f172a] border border-[#1e293b] rounded-xl px-4 flex items-center justify-between shrink-0">
            {/* Left Controls: Mic & Camera */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsMicOn(!isMicOn)}
                className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                  isMicOn ? 'bg-emerald-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
                title={isMicOn ? 'Mute Microphone' : 'Unmute Microphone'}
              >
                {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4 text-slate-400" />}
                <span className="hidden sm:inline">{isMicOn ? 'Mute' : 'Unmute'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCamOn(!isCamOn)}
                className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                  isCamOn ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-red-600 text-white'
                }`}
                title={isCamOn ? 'Stop Camera' : 'Start Camera'}
              >
                {isCamOn ? <Video className="w-4 h-4 text-[#38bdf8]" /> : <VideoOff className="w-4 h-4 text-white" />}
                <span className="hidden sm:inline">{isCamOn ? 'Camera' : 'Start Video'}</span>
              </button>
            </div>

            {/* Center Controls: Raise Hand */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleHand}
                className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition shadow cursor-pointer ${
                  isHandRaised
                    ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold animate-bounce'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
              >
                <span className="text-base">✋</span>
                <span>{isHandRaised ? 'Hand Raised!' : 'Raise Hand'}</span>
              </button>
            </div>

            {/* Right Controls: Tab Toggles */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveTab('chat')}
                className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  activeTab === 'chat' ? 'bg-[#0a66c2] text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span className="hidden sm:inline">Q&amp;A</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('materials')}
                className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  activeTab === 'materials' ? 'bg-[#0a66c2] text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Materials</span>
              </button>
            </div>
          </div>
        </main>

        {/* Right Side Panel: Live Q&A, Materials & Curriculum */}
        <aside className="w-full lg:w-96 bg-[#0c1222] border-t lg:border-t-0 lg:border-l border-[#1e293b] flex flex-col justify-between shrink-0 overflow-hidden">
          
          {/* Header Tabs */}
          <div className="p-3 bg-[#0f172a] border-b border-[#1e293b] flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'chat'
                  ? 'bg-[#0a66c2] text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Live Q&amp;A Chat</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('materials')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'materials'
                  ? 'bg-[#0a66c2] text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Handouts &amp; Files</span>
            </button>
          </div>

          {/* TAB 1: Chat Stream */}
          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col justify-between overflow-hidden">
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {chatMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                    <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
                    <p className="text-xs">No questions yet.</p>
                    <span className="text-[11px] text-slate-600 mt-1">
                      Type your question below to ask the trainer.
                    </span>
                  </div>
                ) : (
                  chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-lg text-xs space-y-1 ${
                        msg.senderRole === 'host'
                          ? 'bg-[#0a66c2]/20 border border-[#0a66c2]/40 text-slate-100 mr-4'
                          : 'bg-[#131b2e] border border-[#1e293b] text-slate-200 ml-4'
                      }`}
                    >
                      <div className="flex justify-between items-center text-[10px]">
                        <strong className={msg.senderRole === 'host' ? 'text-[#38bdf8] font-bold' : 'text-slate-300 font-bold'}>
                          {msg.senderName}
                        </strong>
                        <span className="text-slate-500 font-mono">{msg.timestamp}</span>
                      </div>
                      <p className="leading-relaxed">{msg.text}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendChat} className="p-3 bg-[#0f172a] border-t border-[#1e293b] flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask a question to the trainer..."
                  className="flex-1 bg-[#131b2e] border border-[#233358] rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#38bdf8]"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-lg transition cursor-pointer shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: Materials & Handouts */}
          {activeTab === 'materials' && (
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Session Handouts &amp; Guides
                </h4>
                <p className="text-xs text-slate-400">
                  Download materials provided for this program.
                </p>
              </div>

              <div className="space-y-2">
                {(training.materials || [
                  { title: 'SME Tax Clearance Checklist.pdf', size: '1.2 MB' },
                  { title: 'Credit Readiness Evaluation Sheet.xlsx', size: '850 KB' },
                  { title: 'Presentation Slides - Session 1.pdf', size: '3.4 MB' }
                ]).map((mat, i) => (
                  <div key={i} className="p-3 bg-[#111827] border border-slate-800 rounded-xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="w-4 h-4 text-[#38bdf8] shrink-0" />
                      <div className="min-w-0">
                        <strong className="text-xs font-bold text-white block truncate">{mat.title}</strong>
                        <span className="text-[10px] text-slate-400">{mat.size}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => alert(`Downloading ${mat.title}...`)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-[#38bdf8] rounded-lg transition cursor-pointer"
                      title="Download File"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Accreditation */}
          <div className="p-3.5 bg-[#090d16] border-t border-[#1e293b] flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Accredited Academy</span>
            </span>
            <span className="font-mono text-emerald-400 font-bold">+12% Readiness Boost</span>
          </div>
        </aside>
      </div>

      {/* MODAL: Digital Certificate of Completion */}
      {showCertificate && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-emerald-500/40 rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            
            {/* Printable Certificate Box */}
            <div className="border-4 border-double border-emerald-500/40 bg-gradient-to-b from-[#0b1324] to-[#080d19] rounded-xl p-6 sm:p-8 text-center space-y-4 relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div className="text-left">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest font-mono">
                    ELEVATA NATIONAL CREDIT RAILS
                  </span>
                  <p className="text-xs text-slate-400">Certificate of Accreditation</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Award className="w-6 h-6" />
                </div>
              </div>

              <div className="space-y-1 pt-2">
                <h2 className="text-lg sm:text-2xl font-extrabold text-white tracking-wide font-heading uppercase">
                  Certificate of Completion
                </h2>
                <p className="text-xs text-slate-400">This certifies that</p>
                <h3 className="text-xl sm:text-2xl font-bold text-emerald-400 font-heading pt-1">
                  {activeSme.name}
                </h3>
                <p className="text-xs text-slate-300 font-medium">
                  Represented by <span className="text-white font-semibold">{activeSme.ownerName}</span> ({activeSme.sector} Sector)
                </p>
              </div>

              <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                has successfully attended and qualified in the accredited capacity-building masterclass:
              </p>

              <div className="p-3 bg-[#131d33] border border-emerald-500/30 rounded-lg max-w-md mx-auto">
                <strong className="text-xs font-bold text-white block">{training.title}</strong>
                <span className="text-[11px] text-slate-400">{training.speaker} · {training.speakerOrg || 'Elevata Partner Academy'}</span>
              </div>

              {/* Certificate Signatures & Serial */}
              <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-left text-[11px]">
                <div>
                  <span className="text-slate-500 block">Verified Serial No:</span>
                  <span className="font-mono text-slate-300 font-bold">ELV-ACAD-{Date.now().toString().slice(-6)}</span>
                </div>
                <div className="text-center sm:text-right">
                  <span className="text-slate-500 block">Approved &amp; Certified by:</span>
                  <span className="font-bold text-white">{training.speakerOrg || 'Financial Partner Bank'} &amp; Elevata</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
                <Check className="w-4 h-4 stroke-[3]" />
                <span>+12% Readiness Points applied to your business profile</span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 sm:flex-none px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Certificate</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 sm:flex-none px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-md cursor-pointer"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
