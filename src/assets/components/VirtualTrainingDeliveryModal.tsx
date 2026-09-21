import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  Users,
  MessageSquare,
  FileText,
  Award,
  CheckCircle2,
  X,
  Send,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Radio,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { Training, useApp } from '../../context/AppContext';
import { apiRequest } from '../../lib/api';

interface VirtualTrainingDeliveryModalProps {
  training: Training;
  onClose: () => void;
  onComplete?: () => void;
}

export default function VirtualTrainingDeliveryModal({
  training,
  onClose,
  onComplete
}: VirtualTrainingDeliveryModalProps) {
  const {
    trainings,
    startLiveTraining,
    endLiveTraining,
    admitAttendee,
    admitAllAttendees,
    toggleHandRaise,
    sendTrainingMessage,
    updateTrainingLiveState
  } = useApp();

  // Find latest training state from context
  const currentTraining = trainings.find(t => t.id === training.id) || training;
  const attendees = currentTraining.attendees || [];
  const waitingAttendees = attendees.filter(a => a.status === 'waiting');
  const admittedAttendees = attendees.filter(a => a.status === 'admitted');
  const chatMessages = currentTraining.chatMessages || [];

  // Media states
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);

  // Layout & Tabs
  const [activeSideTab, setActiveSideTab] = useState<'attendees' | 'chat' | 'slides'>('attendees');
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [chatInput, setChatInput] = useState('');
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [isEnded, setIsEnded] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  // Interactive Presentation Slides
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

  // Initialize session timer
  useEffect(() => {
    startLiveTraining(training.id);
    const interval = setInterval(() => {
      setSessionSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [training.id]);

  // Format timer
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const snapshotIntervalRef = useRef<any>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const screenStreamRef = useRef<MediaStream | null>(null);
  const hiddenVideoRef = useRef<HTMLVideoElement | null>(null);

  // Keep screenStreamRef synchronized
  useEffect(() => {
    screenStreamRef.current = screenStream;
  }, [screenStream]);

  // WebRTC Host & Local Broadcast Channel (persists across screen share toggles)
  useEffect(() => {
    let ch: BroadcastChannel | null = null;
    try {
      ch = new BroadcastChannel(`elevata_training_live_${training.id}`);
      broadcastChannelRef.current = ch;
      ch.onmessage = async (e) => {
        const msg = e.data;
        if (!msg) return;
        if (msg.type === 'ATTENDEE_REQUEST_STREAM' && screenStreamRef.current) {
          initiatePeerConnection(msg.attendeeId, screenStreamRef.current);
        } else if (msg.type === 'ANSWER' && msg.to === 'host') {
          const pc = peerConnectionsRef.current.get(msg.from);
          if (pc && pc.signalingState !== 'stable') {
            await pc.setRemoteDescription(new RTCSessionDescription(msg.answer));
          }
        } else if (msg.type === 'ICE_CANDIDATE' && msg.to === 'host') {
          const pc = peerConnectionsRef.current.get(msg.from);
          if (pc && msg.candidate) {
            await pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
          }
        }
      };
    } catch (err) {}

    // Polling backend for signals from cross-device attendees
    const signalInterval = setInterval(async () => {
      try {
        const res = await apiRequest(`/trainings/${training.id}/signal?peerId=host`);
        if (res && res.success && Array.isArray(res.data)) {
          for (const item of res.data) {
            if (item.signal?.type === 'request_stream' && screenStreamRef.current) {
              initiatePeerConnection(item.from, screenStreamRef.current);
            } else if (item.signal?.type === 'answer') {
              const pc = peerConnectionsRef.current.get(item.from);
              if (pc && pc.signalingState !== 'stable') {
                await pc.setRemoteDescription(new RTCSessionDescription(item.signal.answer));
              }
            } else if (item.signal?.type === 'candidate' && item.signal.candidate) {
              const pc = peerConnectionsRef.current.get(item.from);
              if (pc) {
                await pc.addIceCandidate(new RTCIceCandidate(item.signal.candidate));
              }
            }
          }
        }
      } catch (e) {}
    }, 2000);

    return () => {
      ch?.close();
      clearInterval(signalInterval);
      stopSnapshotLoop();
      peerConnectionsRef.current.forEach(pc => pc.close());
      peerConnectionsRef.current.clear();
    };
  }, [training.id]);

  const initiatePeerConnection = async (attendeeId: string, stream: MediaStream) => {
    try {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          broadcastChannelRef.current?.postMessage({
            type: 'ICE_CANDIDATE',
            from: 'host',
            to: attendeeId,
            candidate: event.candidate
          });
          apiRequest(`/trainings/${training.id}/signal`, {
            method: 'POST',
            body: JSON.stringify({
              from: 'host',
              to: attendeeId,
              signal: { type: 'candidate', candidate: event.candidate }
            })
          }).catch(() => {});
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      broadcastChannelRef.current?.postMessage({
        type: 'OFFER',
        from: 'host',
        to: attendeeId,
        offer
      });

      await apiRequest(`/trainings/${training.id}/signal`, {
        method: 'POST',
        body: JSON.stringify({
          from: 'host',
          to: attendeeId,
          signal: { type: 'offer', offer }
        })
      });

      peerConnectionsRef.current.set(attendeeId, pc);
    } catch (err) {
      console.warn('Failed to initiate WebRTC with attendee:', err);
    }
  };

  const startSnapshotLoop = (stream: MediaStream) => {
    if (snapshotIntervalRef.current) clearInterval(snapshotIntervalRef.current);

    const hiddenVideo = document.createElement('video');
    hiddenVideo.srcObject = stream;
    hiddenVideo.muted = true;
    hiddenVideo.playsInline = true;
    hiddenVideo.play().catch(() => {});
    hiddenVideoRef.current = hiddenVideo;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const captureFrame = () => {
      const vid = (screenVideoRef.current && screenVideoRef.current.videoWidth > 0)
        ? screenVideoRef.current
        : hiddenVideoRef.current;
      if (!vid || !vid.videoWidth || !vid.videoHeight) return;
      const targetWidth = 854;
      const targetHeight = Math.round((vid.videoHeight / vid.videoWidth) * targetWidth);
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      ctx?.drawImage(vid, 0, 0, targetWidth, targetHeight);
      try {
        const frameData = canvas.toDataURL('image/jpeg', 0.6);
        broadcastChannelRef.current?.postMessage({
          type: 'SCREEN_FRAME',
          frame: frameData,
          trainingId: training.id
        });
        updateTrainingLiveState(training.id, {
          isScreenSharing: true,
          shareType: 'screen',
          screenSnapshot: frameData
        });
      } catch (e) {}
    };

    hiddenVideo.onloadedmetadata = () => {
      setTimeout(captureFrame, 150);
    };

    // Immediate initial captures
    setTimeout(captureFrame, 200);
    setTimeout(captureFrame, 600);
    setTimeout(captureFrame, 1200);

    snapshotIntervalRef.current = setInterval(captureFrame, 1500);
  };

  const handleAdmitAttendee = (attendeeId: string) => {
    admitAttendee(training.id, attendeeId);
    if (screenStreamRef.current) {
      initiatePeerConnection(attendeeId, screenStreamRef.current);
    }
  };

  const handleAdmitAll = () => {
    admitAllAttendees(training.id);
    if (screenStreamRef.current) {
      waitingAttendees.forEach(att => {
        initiatePeerConnection(att.id, screenStreamRef.current!);
      });
    }
  };

  const stopSnapshotLoop = () => {
    if (snapshotIntervalRef.current) {
      clearInterval(snapshotIntervalRef.current);
      snapshotIntervalRef.current = null;
    }
  };

  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
      }
      setScreenStream(null);
      setIsScreenSharing(false);
      stopSnapshotLoop();
      peerConnectionsRef.current.forEach(pc => pc.close());
      peerConnectionsRef.current.clear();

      broadcastChannelRef.current?.postMessage({
        type: 'SCREEN_SHARE_STOPPED',
        trainingId: training.id
      });
      updateTrainingLiveState(training.id, {
        isScreenSharing: false,
        shareType: 'slides',
        screenSnapshot: ''
      });
    } else {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
          const stream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: false
          });
          setScreenStream(stream);
          setIsScreenSharing(true);
          startSnapshotLoop(stream);

          if (screenVideoRef.current) {
            screenVideoRef.current.srcObject = stream;
          }

          broadcastChannelRef.current?.postMessage({
            type: 'SCREEN_SHARE_STARTED',
            trainingId: training.id
          });
          updateTrainingLiveState(training.id, {
            isScreenSharing: true,
            shareType: 'screen'
          });

          // Pre-connect to existing admitted attendees
          admittedAttendees.forEach(att => {
            initiatePeerConnection(att.id, stream);
          });

          stream.getVideoTracks()[0].onended = () => {
            setScreenStream(null);
            setIsScreenSharing(false);
            stopSnapshotLoop();
            broadcastChannelRef.current?.postMessage({
              type: 'SCREEN_SHARE_STOPPED',
              trainingId: training.id
            });
            updateTrainingLiveState(training.id, {
              isScreenSharing: false,
              shareType: 'slides',
              screenSnapshot: ''
            });
          };
        } else {
          setIsScreenSharing(true);
          setActiveSideTab('slides');
          updateTrainingLiveState(training.id, {
            isScreenSharing: true,
            shareType: 'slides',
            currentSlideIndex
          });
        }
      } catch (err) {
        setIsScreenSharing(true);
        setActiveSideTab('slides');
        updateTrainingLiveState(training.id, {
          isScreenSharing: true,
          shareType: 'slides',
          currentSlideIndex
        });
      }
    }
  };

  const handleSlideChange = (newIndex: number) => {
    setCurrentSlideIndex(newIndex);
    broadcastChannelRef.current?.postMessage({
      type: 'SLIDE_CHANGED',
      slideIndex: newIndex,
      trainingId: training.id
    });
    updateTrainingLiveState(training.id, {
      currentSlideIndex: newIndex,
      shareType: isScreenSharing ? 'screen' : 'slides'
    });
  };

  // Connect video stream to video element when screenStream updates
  useEffect(() => {
    if (screenVideoRef.current && screenStream) {
      screenVideoRef.current.srcObject = screenStream;
    }
  }, [screenStream, isScreenSharing]);

  // Handle Send Chat
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendTrainingMessage(training.id, {
      senderName: training.speaker ? `${training.speaker} (Host)` : 'Trainer (Host)',
      senderRole: 'host',
      text: chatInput.trim()
    });
    setChatInput('');
  };

  // End Training
  const handleEndSession = () => {
    endLiveTraining(training.id);
    setIsEnded(true);
    setShowEndConfirm(false);
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
    }
    if (onComplete) {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#090d16] text-white flex flex-col font-sans overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="h-14 px-4 sm:px-6 bg-[#0f172a] border-b border-[#1e293b] flex items-center justify-between shrink-0 select-none z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 bg-red-500/10 border border-red-500/30 rounded-full">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider flex items-center gap-1 font-mono">
              <Radio className="w-3 h-3 text-red-400" /> LIVE DELIVERY
            </span>
          </div>

          <div className="h-4 w-px bg-slate-700 hidden sm:block" />

          <div>
            <h2 className="text-xs sm:text-sm font-bold text-slate-100 truncate max-w-[200px] sm:max-w-md">
              {training.title}
            </h2>
            <p className="text-[10px] text-slate-400 hidden sm:block">
              Host: <span className="text-slate-200 font-semibold">{training.speaker}</span> · {training.speakerOrg || 'Elevata Partner Academy'}
            </p>
          </div>
        </div>

        {/* Center: Live Timer & Roster Count */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-[#1e293b] rounded-full border border-slate-700 text-slate-300 font-mono">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{formatTime(sessionSeconds)}</span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 font-medium text-xs">
            <Users className="w-3.5 h-3.5" />
            <span>{admittedAttendees.length} Admitted</span>
            {waitingAttendees.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-amber-500 text-slate-950 font-bold text-[10px] rounded-full">
                {waitingAttendees.length} in waiting room
              </span>
            )}
          </div>
        </div>

        {/* Right: End Session / Exit */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowEndConfirm(true)}
            className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition shadow-sm cursor-pointer flex items-center gap-1.5"
          >
            <span>End Session</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            title="Minimize / Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Left / Center: Main Live Broadcast Stage */}
        <main className="flex-1 bg-[#060911] p-3 sm:p-4 flex flex-col justify-between overflow-hidden relative">
          
          {/* Main Stage Viewport */}
          <div className="flex-1 bg-[#0d1322] border border-[#1e293b] rounded-xl overflow-hidden relative flex flex-col items-center justify-center shadow-2xl">
            
            {/* Case A: Screen Share Video Stream */}
            {isScreenSharing && screenStream ? (
              <div className="w-full h-full relative bg-black flex items-center justify-center">
                <video
                  ref={screenVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                />
                <div className="absolute top-4 left-4 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700 text-xs flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold text-slate-200">Sharing Your Screen to Attendees</span>
                </div>
              </div>
            ) : isScreenSharing || activeSideTab === 'slides' ? (
              /* Case B: Interactive Presentation Slide Deck */
              <div className="w-full h-full p-6 sm:p-10 flex flex-col justify-between bg-gradient-to-br from-[#0e1628] via-[#090d18] to-[#04060c] text-white">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-[#0a66c2]/20 border border-[#0a66c2]/40 text-[#38bdf8] text-[11px] font-bold rounded-full uppercase tracking-wider">
                      {presentationSlides[currentSlideIndex].badge}
                    </span>
                    <span className="text-xs text-slate-400">
                      Slide {currentSlideIndex + 1} of {presentationSlides.length}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={currentSlideIndex === 0}
                      onClick={() => handleSlideChange(Math.max(0, currentSlideIndex - 1))}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg text-xs transition cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={currentSlideIndex === presentationSlides.length - 1}
                      onClick={() => handleSlideChange(Math.min(presentationSlides.length - 1, currentSlideIndex + 1))}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg text-xs transition cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Slide Core Content */}
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

                  {/* Slide Key Metric Box */}
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

                {/* Slide Footer */}
                <div className="flex justify-between items-center text-xs text-slate-500 pt-4 border-t border-slate-800/80">
                  <span>Elevata Virtual Academy · Credit Underwriting &amp; Capacity Program</span>
                  <span>Press arrow buttons or click next to advance</span>
                </div>
              </div>
            ) : (
              /* Case C: Trainer Stage Grid View */
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center relative">
                {/* Trainer Avatar / Camera Box */}
                <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gradient-to-tr from-[#0a66c2] to-[#38bdf8] flex items-center justify-center shadow-2xl p-1 border-4 border-slate-700/50 relative">
                  <div className="w-full h-full rounded-full bg-[#0d1527] flex items-center justify-center overflow-hidden">
                    {isCamOn ? (
                      <div className="w-full h-full bg-[#0a66c2]/20 flex flex-col items-center justify-center">
                        <Video className="w-12 h-12 text-[#38bdf8] animate-pulse" />
                        <span className="text-[10px] font-bold text-slate-300 mt-1">Host Camera Active</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <VideoOff className="w-10 h-10 text-slate-500" />
                        <span className="text-[10px] text-slate-500 mt-1">Camera Muted</span>
                      </div>
                    )}
                  </div>
                  {isMicOn && (
                    <span className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-[#090d16] flex items-center justify-center shadow">
                      <Mic className="w-3 h-3 text-white" />
                    </span>
                  )}
                </div>

                <div className="mt-4 space-y-1 max-w-md">
                  <h3 className="text-base font-bold text-white">{training.speaker}</h3>
                  <p className="text-xs text-slate-400">{training.speakerRole || 'Lead Trainer'} · {training.speakerOrg || 'Elevata Partner Academy'}</p>
                </div>

                <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={handleToggleScreenShare}
                    className="px-4 py-2 bg-[#0a66c2] hover:bg-[#004182] text-white rounded-lg font-bold flex items-center gap-2 shadow-lg transition cursor-pointer"
                  >
                    <Monitor className="w-4 h-4" />
                    <span>Share Screen or Slides</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSideTab('slides')}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg font-semibold flex items-center gap-2 transition cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-[#38bdf8]" />
                    <span>Open Training Slides</span>
                  </button>
                </div>
              </div>
            )}

            {/* Picture-In-Picture: Host Camera Corner Overlay when Screen Sharing or in Slides */}
            {(isScreenSharing || activeSideTab === 'slides') && (
              <div className="absolute bottom-4 right-4 w-44 h-32 bg-[#0a0f1d] border border-slate-700/80 rounded-xl overflow-hidden shadow-2xl flex flex-col justify-between p-2.5 z-20">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-300 bg-black/60 px-2 py-0.5 rounded">
                    Host (You)
                  </span>
                  <div className="flex items-center gap-1">
                    {isMicOn ? <Mic className="w-3 h-3 text-emerald-400" /> : <MicOff className="w-3 h-3 text-red-400" />}
                  </div>
                </div>

                <div className="flex items-center justify-center my-auto">
                  {isCamOn ? (
                    <div className="text-center">
                      <div className="w-10 h-10 rounded-full bg-[#0a66c2] mx-auto flex items-center justify-center text-xs font-bold">
                        {training.speaker?.split(' ').map(n=>n[0]).join('') || 'TR'}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block">Live Video</span>
                    </div>
                  ) : (
                    <VideoOff className="w-6 h-6 text-slate-600" />
                  )}
                </div>

                <div className="text-[9px] text-slate-400 truncate text-center">
                  {training.speaker}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Host Control Dock */}
          <div className="h-16 mt-3 bg-[#0f172a] border border-[#1e293b] rounded-xl px-4 flex items-center justify-between shrink-0">
            {/* Left Controls: Mic & Camera */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsMicOn(!isMicOn)}
                className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                  isMicOn ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-red-600 text-white'
                }`}
                title={isMicOn ? 'Mute Microphone' : 'Unmute Microphone'}
              >
                {isMicOn ? <Mic className="w-4 h-4 text-emerald-400" /> : <MicOff className="w-4 h-4 text-white" />}
                <span className="hidden sm:inline">{isMicOn ? 'Mute' : 'Unmuted'}</span>
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
                <span className="hidden sm:inline">{isCamOn ? 'Stop Video' : 'Start Video'}</span>
              </button>
            </div>

            {/* Center Controls: Screen Share & Slides */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleScreenShare}
                className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition shadow cursor-pointer ${
                  isScreenSharing
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-[#0a66c2] hover:bg-[#004182] text-white'
                }`}
              >
                <Monitor className="w-4 h-4" />
                <span>{isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSideTab('slides')}
                className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition cursor-pointer ${
                  activeSideTab === 'slides'
                    ? 'bg-[#38bdf8]/20 border-[#38bdf8] text-[#38bdf8]'
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span className="hidden md:inline">Slide Deck</span>
              </button>
            </div>

            {/* Right Controls: Tab Switchers */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveSideTab('attendees')}
                className={`p-2 rounded-lg relative transition cursor-pointer ${
                  activeSideTab === 'attendees' ? 'bg-[#0a66c2] text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                }`}
                title="Attendees & Waiting Room"
              >
                <Users className="w-4 h-4" />
                {waitingAttendees.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-bold text-[9px] flex items-center justify-center">
                    {waitingAttendees.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveSideTab('chat')}
                className={`p-2 rounded-lg relative transition cursor-pointer ${
                  activeSideTab === 'chat' ? 'bg-[#0a66c2] text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                }`}
                title="Live Chat & Q&A"
              >
                <MessageSquare className="w-4 h-4" />
                {chatMessages.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#38bdf8] text-slate-950 font-bold text-[9px] flex items-center justify-center">
                    {chatMessages.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </main>

        {/* Right Panel: Attendees Roster, Waiting Room, Live Chat, Slides */}
        <aside className="w-full lg:w-96 bg-[#0c1222] border-t lg:border-t-0 lg:border-l border-[#1e293b] flex flex-col justify-between shrink-0 overflow-hidden">
          
          {/* Top Panel Tab Headers */}
          <div className="p-3 bg-[#0f172a] border-b border-[#1e293b] flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveSideTab('attendees')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeSideTab === 'attendees'
                  ? 'bg-[#0a66c2] text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Attendees ({admittedAttendees.length})</span>
              {waitingAttendees.length > 0 && (
                <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 rounded-full text-[9px] font-extrabold">
                  {waitingAttendees.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveSideTab('chat')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeSideTab === 'chat'
                  ? 'bg-[#0a66c2] text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Live Q&amp;A</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSideTab('slides')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeSideTab === 'slides'
                  ? 'bg-[#0a66c2] text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Slides</span>
            </button>
          </div>

          {/* TAB 1: Attendees & Waiting Room Management */}
          {activeSideTab === 'attendees' && (
            <div className="flex-1 p-4 overflow-y-auto space-y-5">
              
              {/* WAITING ROOM QUEUE */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                      Waiting Room ({waitingAttendees.length})
                    </h3>
                  </div>

                  {waitingAttendees.length > 0 && (
                    <button
                      type="button"
                      onClick={handleAdmitAll}
                      className="text-xs font-bold text-[#38bdf8] hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <UserCheck className="w-3.5 h-3.5" /> Admit All
                    </button>
                  )}
                </div>

                {waitingAttendees.length === 0 ? (
                  <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg text-center text-xs text-slate-500">
                    No participants waiting in queue.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {waitingAttendees.map((att) => (
                      <div
                        key={att.id}
                        className="p-3 bg-[#131b2e] border border-amber-500/30 rounded-lg flex items-center justify-between gap-2 shadow-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-300 font-bold text-xs flex items-center justify-center shrink-0">
                            {att.avatar || att.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <strong className="text-xs font-bold text-white block truncate">
                              {att.name}
                            </strong>
                            <span className="text-[11px] text-slate-400 block truncate">
                              {att.businessName} · <span className="text-slate-300 font-medium">{att.sector}</span>
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleAdmitAttendee(att.id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                          >
                            <UserCheck className="w-3 h-3" /> Admit
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ADMITTED PARTICIPANTS LIST */}
              <div className="space-y-2.5 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    In Session ({admittedAttendees.length})
                  </h3>
                  <span className="text-[11px] text-slate-500">Live Active</span>
                </div>

                <div className="space-y-2">
                  {admittedAttendees.map((att) => (
                    <div
                      key={att.id}
                      className={`p-3 rounded-lg border transition flex items-center justify-between gap-2 ${
                        att.handRaised
                          ? 'bg-amber-500/10 border-amber-500/40 shadow-sm'
                          : 'bg-[#111827] border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center shrink-0 relative">
                          {att.avatar || att.name.charAt(0)}
                          {att.handRaised && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-[9px] font-extrabold animate-bounce">
                              ✋
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <strong className="text-xs font-bold text-white truncate">
                              {att.name}
                            </strong>
                            {att.handRaised && (
                              <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-bold rounded">
                                Hand Raised
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 block truncate">
                            {att.businessName} · {att.sector}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {att.handRaised && (
                          <button
                            type="button"
                            onClick={() => toggleHandRaise(training.id, att.id)}
                            className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-bold rounded border border-amber-500/30 transition cursor-pointer"
                            title="Lower Hand"
                          >
                            Lower Hand
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Live Chat & Q&A Stream */}
          {activeSideTab === 'chat' && (
            <div className="flex-1 flex flex-col justify-between overflow-hidden">
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {chatMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                    <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
                    <p className="text-xs">No questions yet.</p>
                    <span className="text-[11px] text-slate-600 mt-1">
                      Post an announcement or encourage attendees to ask questions.
                    </span>
                  </div>
                ) : (
                  chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-lg text-xs space-y-1 ${
                        msg.senderRole === 'host'
                          ? 'bg-[#0a66c2]/20 border border-[#0a66c2]/40 text-slate-100 ml-4'
                          : 'bg-[#131b2e] border border-[#1e293b] text-slate-200 mr-4'
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

              {/* Chat Send Input Form */}
              <form onSubmit={handleSendMessage} className="p-3 bg-[#0f172a] border-t border-[#1e293b] flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Post announcement or reply to Q&A..."
                  className="flex-1 bg-[#131b2e] border border-[#233358] rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#38bdf8]"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="px-3 py-2 bg-[#0a66c2] hover:bg-[#004182] disabled:opacity-40 text-white rounded-lg transition cursor-pointer shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: Slide Deck Controls */}
          {activeSideTab === 'slides' && (
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Interactive Curriculum Slides
              </h4>
              <p className="text-xs text-slate-400">
                Click any slide below to broadcast it onto the main stage for all admitted participants.
              </p>

              <div className="space-y-2 pt-2">
                {presentationSlides.map((slide, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      handleSlideChange(idx);
                      if (isScreenSharing) {
                        handleToggleScreenShare();
                      }
                    }}
                    className={`w-full text-left p-3 rounded-lg border transition cursor-pointer ${
                      currentSlideIndex === idx
                        ? 'bg-[#0a66c2]/20 border-[#0a66c2] text-white shadow-md'
                        : 'bg-[#111827] border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1">
                      <span className="font-bold text-[#38bdf8]">SLIDE {idx + 1}</span>
                      <span>{slide.badge}</span>
                    </div>
                    <strong className="text-xs font-bold block">{slide.title}</strong>
                    <span className="text-[11px] text-slate-400 block mt-0.5 line-clamp-1">{slide.subtitle}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Session Overview Footer */}
          <div className="p-3.5 bg-[#090d16] border-t border-[#1e293b] flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Accredited Session</span>
            </span>
            <span className="font-mono text-slate-300">{training.opportunityTitle || 'Elevata Academy'}</span>
          </div>
        </aside>
      </div>

      {/* MODAL: End Session Confirmation & Certification Award */}
      {showEndConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">End Session &amp; Grant Certificates?</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Conclude live training and certify all admitted SME participants.
                </p>
              </div>
            </div>

            <div className="p-4 bg-[#141f38] border border-[#233358] rounded-xl space-y-2 text-xs text-slate-300">
              <div className="flex justify-between">
                <span>Total Admitted SMEs:</span>
                <strong className="text-white font-mono">{admittedAttendees.length} Participants</strong>
              </div>
              <div className="flex justify-between">
                <span>Readiness Score Bonus:</span>
                <strong className="text-emerald-400 font-mono">+12% Points Each</strong>
              </div>
              <div className="flex justify-between">
                <span>Digital Credentials Issued:</span>
                <strong className="text-[#38bdf8] font-mono">Accredited Certificate</strong>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowEndConfirm(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEndSession}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Award className="w-4 h-4" />
                <span>Confirm &amp; Issue Certificates</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Final Session Completed Summary */}
      {isEnded && (
        <div className="fixed inset-0 z-50 bg-[#060911]/95 backdrop-blur-lg flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-emerald-500/40 rounded-2xl max-w-md w-full p-8 text-center space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center shadow-lg">
              <Award className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-extrabold text-white">Training Successfully Delivered!</h2>
              <p className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto">
                All <strong className="text-emerald-400 font-bold">{admittedAttendees.length} admitted SMEs</strong> have been issued accredited certificates of completion with readiness points added.
              </p>
            </div>

            <div className="p-4 bg-[#141f38] border border-slate-800 rounded-xl text-left text-xs space-y-2 font-mono">
              <div className="flex justify-between text-slate-300">
                <span>Session Duration:</span>
                <span className="text-white font-bold">{formatTime(sessionSeconds)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Certified Alumni:</span>
                <span className="text-emerald-400 font-bold">{admittedAttendees.map(a=>a.name).join(', ') || 'Attended SMEs'}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 bg-[#0a66c2] hover:bg-[#004182] text-white font-bold text-xs rounded-xl shadow-lg transition cursor-pointer"
            >
              Return to Opportunities Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
