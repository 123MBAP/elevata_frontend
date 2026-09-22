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
import {
  Room,
  RoomEvent,
  VideoPresets,
  Track,
  LocalTrackPublication
} from 'livekit-client';

interface VirtualTrainingDeliveryModalProps {
  training: Training;
  onClose: () => void;
  onComplete?: () => void;
}

// Fallback high-performance canvas stream to ensure camera track always exists and actively emits frames across WebRTC
const createVirtualCameraStream = (speakerName: string, orgName?: string): MediaStream => {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 360;
  canvas.style.position = 'fixed';
  canvas.style.left = '-9999px';
  canvas.style.top = '-9999px';
  canvas.style.width = '640px';
  canvas.style.height = '360px';
  canvas.style.opacity = '0';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '-9999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  let frame = 0;

  const draw = () => {
    if (!ctx) return;
    frame++;

    // High-tech dark gradient studio background
    const grad = ctx.createLinearGradient(0, 0, 640, 360);
    grad.addColorStop(0, '#090d18');
    grad.addColorStop(0.5, '#0d1527');
    grad.addColorStop(1, '#060910');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 640, 360);

    // Subtle background glow
    ctx.save();
    const glow = ctx.createRadialGradient(320, 130, 20, 320, 130, 140);
    glow.addColorStop(0, 'rgba(10, 102, 194, 0.35)');
    glow.addColorStop(1, 'rgba(10, 102, 194, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 640, 360);
    ctx.restore();

    // Pulsing outer ring
    const pulseRadius = 55 + Math.sin(frame * 0.08) * 3;
    ctx.beginPath();
    ctx.arc(320, 130, pulseRadius + 6, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Inner avatar circle
    ctx.beginPath();
    ctx.arc(320, 130, 52, 0, Math.PI * 2);
    const circleGrad = ctx.createLinearGradient(270, 80, 370, 180);
    circleGrad.addColorStop(0, '#0a66c2');
    circleGrad.addColorStop(1, '#0284c7');
    ctx.fillStyle = circleGrad;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#38bdf8';
    ctx.stroke();

    // Speaker Initials
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const initials = speakerName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'TR';
    ctx.fillText(initials, 320, 130);

    // Animated voice wave bars below avatar
    const barCount = 11;
    const barWidth = 4;
    const barSpacing = 4;
    const startX = 320 - ((barCount * (barWidth + barSpacing)) / 2);
    for (let i = 0; i < barCount; i++) {
      const wave = Math.sin(frame * 0.15 + i * 0.6);
      const height = Math.max(6, Math.abs(wave) * 22);
      ctx.fillStyle = i % 2 === 0 ? '#10b981' : '#38bdf8';
      ctx.fillRect(startX + i * (barWidth + barSpacing), 195 - height / 2, barWidth, height);
    }

    // Speaker Name
    ctx.font = 'bold 18px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(speakerName, 320, 226);

    // Speaker Org / Role
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(orgName || 'Financial Institution Host', 320, 248);

    // Live On-Air Pill
    ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(220, 272, 200, 24, 12) : ctx.rect(220, 272, 200, 24);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(238, 284, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = '#10b981';
    ctx.fillText('PRESENTER LIVE HD', 324, 284);
  };

  draw();
  const interval = setInterval(draw, 1000 / 25);
  const stream = canvas.captureStream ? canvas.captureStream(25) : (canvas as any).mozCaptureStream(25);
  const vTrack = stream.getVideoTracks()[0];
  if (vTrack) {
    vTrack.addEventListener('ended', () => {
      clearInterval(interval);
      try {
        if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      } catch (e) {}
    });
  }
  return stream;
};

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
  const cameraSnapshotIntervalRef = useRef<any>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const screenStreamRef = useRef<MediaStream | null>(null);
  const hiddenVideoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const cameraTrackRef = useRef<MediaStreamTrack | null>(null);
  const presenterCameraVideoRef = useRef<HTMLVideoElement | null>(null);
  const livekitRoomRef = useRef<Room | null>(null);
  const [isLivekitConnected, setIsLivekitConnected] = useState(false);

  // Keep screenStreamRef synchronized
  useEffect(() => {
    screenStreamRef.current = screenStream;
  }, [screenStream]);

  const startCameraSnapshotLoop = (stream: MediaStream) => {
    if (cameraSnapshotIntervalRef.current) clearInterval(cameraSnapshotIntervalRef.current);

    const hiddenCamVideo = document.createElement('video');
    hiddenCamVideo.srcObject = stream;
    hiddenCamVideo.muted = true;
    hiddenCamVideo.playsInline = true;
    hiddenCamVideo.play().catch(() => {});

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const captureCamFrame = () => {
      const vid = (presenterCameraVideoRef.current && presenterCameraVideoRef.current.videoWidth > 0)
        ? presenterCameraVideoRef.current
        : hiddenCamVideo;
      if (!vid || !vid.videoWidth || !vid.videoHeight) return;
      const targetWidth = 480;
      const targetHeight = Math.round((vid.videoHeight / vid.videoWidth) * targetWidth);
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      ctx?.drawImage(vid, 0, 0, targetWidth, targetHeight);
      try {
        const frameData = canvas.toDataURL('image/jpeg', 0.65);
        broadcastChannelRef.current?.postMessage({
          type: 'CAMERA_FRAME',
          frame: frameData,
          trainingId: training.id
        });
        updateTrainingLiveState(training.id, {
          cameraSnapshot: frameData,
          hostCamOn: true,
          hostMicOn: true
        });
      } catch (e) {}
    };

    hiddenCamVideo.onloadedmetadata = () => {
      setTimeout(captureCamFrame, 150);
    };

    setTimeout(captureCamFrame, 200);
    setTimeout(captureCamFrame, 600);
    cameraSnapshotIntervalRef.current = setInterval(captureCamFrame, 1800);
  };

  const stopCameraSnapshotLoop = () => {
    if (cameraSnapshotIntervalRef.current) {
      clearInterval(cameraSnapshotIntervalRef.current);
      cameraSnapshotIntervalRef.current = null;
    }
  };

  // Initialize Presenter Camera Stream (real webcam with canvas fallback)
  useEffect(() => {
    let active = true;
    const initCamera = async () => {
      let stream: MediaStream;
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 1280, height: 720 },
            audio: false
          });
        } else {
          stream = createVirtualCameraStream(training.speaker || 'Trainer', training.speakerOrg);
        }
      } catch (err) {
        console.warn('[Presenter] Physical webcam unavailable, initializing virtual presenter camera:', err);
        stream = createVirtualCameraStream(training.speaker || 'Trainer', training.speakerOrg);
      }

      if (!active) return;
      cameraStreamRef.current = stream;
      const vTrack = stream.getVideoTracks()[0];
      if (vTrack) {
        cameraTrackRef.current = vTrack;
      }
      if (presenterCameraVideoRef.current) {
        presenterCameraVideoRef.current.srcObject = stream;
        presenterCameraVideoRef.current.play().catch(() => {});
      }

      startCameraSnapshotLoop(stream);

      // Immediately connect to all already admitted attendees!
      const currentAttendees = (training.attendees || []).filter(a => a.status === 'admitted');
      currentAttendees.forEach(att => {
        initiatePeerConnection(att.id, stream);
      });
    };

    initCamera();

    return () => {
      active = false;
      stopCameraSnapshotLoop();
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, [training.speaker]);

  // Connect to LiveKit Cloud Room as Presenter / Host
  useEffect(() => {
    let active = true;
    const connectLiveKit = async () => {
      try {
        console.log('[LiveKit Host] Requesting presenter token for training:', training.id);
        const res = await apiRequest(`/trainings/${training.id}/livekit-token`, {
          method: 'POST',
          body: JSON.stringify({
            participantId: 'host',
            participantName: training.speaker || 'Lead Credit Trainer',
            isHost: true
          })
        });

        if (!active || !res || !res.success || !res.data?.token) {
          console.warn('[LiveKit Host] Token response error:', res);
          return;
        }

        const { token, url } = res.data;
        const room = new Room({
          adaptiveStream: true,
          dynacast: true,
          videoCaptureDefaults: {
            resolution: VideoPresets.h720.resolution
          }
        });
        livekitRoomRef.current = room;

        room.on(RoomEvent.Connected, () => {
          console.log('[LiveKit Host] Successfully connected to LiveKit room:', room.name);
          if (active) setIsLivekitConnected(true);
        });

        room.on(RoomEvent.Disconnected, () => {
          console.log('[LiveKit Host] Disconnected from LiveKit room');
          if (active) setIsLivekitConnected(false);
        });

        // When local tracks are published, attach them to our preview elements
        room.on(RoomEvent.LocalTrackPublished, (publication: LocalTrackPublication) => {
          if (publication.source === Track.Source.Camera && publication.track && presenterCameraVideoRef.current) {
            publication.track.attach(presenterCameraVideoRef.current);
          }
          if (publication.source === Track.Source.ScreenShare && publication.track && screenVideoRef.current) {
            publication.track.attach(screenVideoRef.current);
          }
        });

        await room.connect(url, token);

        // Publish presenter camera and mic if enabled
        try {
          await room.localParticipant.setCameraEnabled(isCamOn);
          await room.localParticipant.setMicrophoneEnabled(isMicOn);
        } catch (mediaErr) {
          console.warn('[LiveKit Host] Physical webcam initial publish error, trying virtual stream:', mediaErr);
          if (cameraStreamRef.current && cameraStreamRef.current.getVideoTracks()[0]) {
            try {
              await room.localParticipant.publishTrack(cameraStreamRef.current.getVideoTracks()[0], {
                name: 'camera',
                source: Track.Source.Camera
              });
              console.log('[LiveKit Host] Published virtual canvas camera track to LiveKit SFU');
            } catch (canvasErr) {
              console.warn('[LiveKit Host] Canvas publish error:', canvasErr);
            }
          }
        }
      } catch (err) {
        console.warn('[LiveKit Host] LiveKit room initialization failed:', err);
      }
    };

    connectLiveKit();

    return () => {
      active = false;
      if (livekitRoomRef.current) {
        livekitRoomRef.current.disconnect();
        livekitRoomRef.current = null;
      }
    };
  }, [training.id]);

  // Establish or update WebRTC peer connection with an SME attendee
  const initiatePeerConnection = async (attendeeId: string, customStream?: MediaStream) => {
    try {
      let pc = peerConnectionsRef.current.get(attendeeId);
      const isNew = !pc || pc.connectionState === 'closed' || pc.connectionState === 'failed';

      if (isNew) {
        pc = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ]
        });
        peerConnectionsRef.current.set(attendeeId, pc);

        pc.onconnectionstatechange = () => {
          console.log(`[Presenter] connection state for ${attendeeId}:`, pc!.connectionState);
        };
        pc.oniceconnectionstatechange = () => {
          console.log(`[Presenter] ICE connection state for ${attendeeId}:`, pc!.iceConnectionState);
        };

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            console.log(`[Presenter] ICE candidates exchanged for ${attendeeId}:`, event.candidate.candidate);
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
      }

      // Ensure a media stream is ready to transmit
      if (!cameraStreamRef.current && !screenStreamRef.current && !customStream) {
        cameraStreamRef.current = createVirtualCameraStream(training.speaker || 'Trainer', training.speakerOrg);
        startCameraSnapshotLoop(cameraStreamRef.current);
      }

      // Determine active stream to transmit (screen share if active, else camera)
      const streamToSend = customStream || screenStreamRef.current || cameraStreamRef.current;
      if (!streamToSend) {
        console.warn(`[Presenter] No media stream ready to transmit to ${attendeeId}`);
        return;
      }

      const videoTrack = streamToSend.getVideoTracks()[0];
      if (videoTrack) {
        const videoSender = pc!.getSenders().find(s => s.track?.kind === 'video');
        if (videoSender) {
          console.log(`[Presenter] screen track added/replaced on existing sender for ${attendeeId}`);
          await videoSender.replaceTrack(videoTrack);
        } else {
          console.log(`[Presenter] adding track to peer connection for ${attendeeId}`);
          pc!.addTrack(videoTrack, streamToSend);
        }
      }

      // Create and send WebRTC Offer if connection is in stable state
      if (pc!.signalingState === 'stable') {
        const offer = await pc!.createOffer();
        await pc!.setLocalDescription(offer);
        console.log(`[Presenter] offer created for ${attendeeId}`);

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
        console.log(`[Presenter] offer sent to ${attendeeId}`);
      }
    } catch (err) {
      console.warn(`[Presenter] Error initiating WebRTC with ${attendeeId}:`, err);
    }
  };

  // WebRTC Signaling Listener & Polling (persists throughout training)
  useEffect(() => {
    let ch: BroadcastChannel | null = null;
    try {
      ch = new BroadcastChannel(`elevata_training_live_${training.id}`);
      broadcastChannelRef.current = ch;
      ch.onmessage = async (e) => {
        const msg = e.data;
        if (!msg) return;

        if (msg.type === 'ATTENDEE_REQUEST_STREAM') {
          console.log(`[Presenter] ATTENDEE_REQUEST_STREAM received from ${msg.attendeeId}`);
          initiatePeerConnection(msg.attendeeId);
        } else if (msg.type === 'ANSWER' && msg.to === 'host') {
          console.log(`[Presenter] answer received from ${msg.from}`);
          const pc = peerConnectionsRef.current.get(msg.from);
          if (pc && pc.signalingState !== 'stable') {
            await pc.setRemoteDescription(new RTCSessionDescription(msg.answer));
          }
        } else if (msg.type === 'ICE_CANDIDATE' && msg.to === 'host') {
          console.log(`[Presenter] ICE candidate received from ${msg.from}`);
          const pc = peerConnectionsRef.current.get(msg.from);
          if (pc && pc.remoteDescription && msg.candidate) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
            } catch (e) {
              console.warn(`[Presenter] ICE candidate add error for ${msg.from}:`, e);
            }
          }
        }
      };
    } catch (err) {}

    // Polling backend for WebRTC signals from cross-device attendees
    const signalInterval = setInterval(async () => {
      try {
        const res = await apiRequest(`/trainings/${training.id}/signal?peerId=host`);
        if (res && res.success && Array.isArray(res.data)) {
          for (const item of res.data) {
            if (item.signal?.type === 'request_stream') {
              console.log(`[Presenter] request_stream received from ${item.from}`);
              initiatePeerConnection(item.from);
            } else if (item.signal?.type === 'answer') {
              console.log(`[Presenter] answer received from ${item.from}`);
              const pc = peerConnectionsRef.current.get(item.from);
              if (pc && pc.signalingState !== 'stable') {
                await pc.setRemoteDescription(new RTCSessionDescription(item.signal.answer));
              }
            } else if (item.signal?.type === 'candidate' && item.signal.candidate) {
              const pc = peerConnectionsRef.current.get(item.from);
              if (pc && pc.remoteDescription) {
                try {
                  await pc.addIceCandidate(new RTCIceCandidate(item.signal.candidate));
                } catch (e) {
                  console.warn(`[Presenter] ICE candidate add error for ${item.from}:`, e);
                }
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

  const startSnapshotLoop = (stream: MediaStream) => {
    if (snapshotIntervalRef.current) clearInterval(snapshotIntervalRef.current);

    // Create a video element attached to the DOM inside the viewport so Chromium actively decodes frames
    const hiddenVideo = document.createElement('video');
    hiddenVideo.srcObject = stream;
    hiddenVideo.muted = true;
    hiddenVideo.playsInline = true;
    hiddenVideo.style.position = 'fixed';
    hiddenVideo.style.bottom = '0px';
    hiddenVideo.style.right = '0px';
    hiddenVideo.style.width = '160px';
    hiddenVideo.style.height = '90px';
    hiddenVideo.style.opacity = '0.01';
    hiddenVideo.style.pointerEvents = 'none';
    hiddenVideo.style.zIndex = '99999';
    document.body.appendChild(hiddenVideo);
    hiddenVideo.play().catch(() => {});
    hiddenVideoRef.current = hiddenVideo;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const captureFrame = () => {
      const vid = (screenVideoRef.current && screenVideoRef.current.videoWidth > 0)
        ? screenVideoRef.current
        : (hiddenVideoRef.current && hiddenVideoRef.current.videoWidth > 0)
        ? hiddenVideoRef.current
        : null;
      if (!vid || !vid.videoWidth || !vid.videoHeight) return;
      const targetWidth = 1024;
      const targetHeight = Math.round((vid.videoHeight / vid.videoWidth) * targetWidth);
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      ctx?.drawImage(vid, 0, 0, targetWidth, targetHeight);
      try {
        const frameData = canvas.toDataURL('image/jpeg', 0.7);
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
      hiddenVideo.play().catch(() => {});
      captureFrame();
      setTimeout(captureFrame, 100);
    };
    hiddenVideo.onloadeddata = () => {
      captureFrame();
    };

    captureFrame();
    setTimeout(captureFrame, 100);
    setTimeout(captureFrame, 300);
    setTimeout(captureFrame, 600);
    setTimeout(captureFrame, 1200);
    snapshotIntervalRef.current = setInterval(captureFrame, 800);
  };

  const stopSnapshotLoop = () => {
    if (snapshotIntervalRef.current) {
      clearInterval(snapshotIntervalRef.current);
      snapshotIntervalRef.current = null;
    }
    if (hiddenVideoRef.current) {
      try {
        if (hiddenVideoRef.current.parentNode) {
          hiddenVideoRef.current.parentNode.removeChild(hiddenVideoRef.current);
        }
      } catch (e) {}
      hiddenVideoRef.current = null;
    }
  };

  const handleAdmitAttendee = (attendeeId: string) => {
    admitAttendee(training.id, attendeeId);
    initiatePeerConnection(attendeeId);
  };

  const handleAdmitAll = () => {
    admitAllAttendees(training.id);
    waitingAttendees.forEach(att => {
      initiatePeerConnection(att.id);
    });
  };

  const handleToggleCamera = async () => {
    const nextState = !isCamOn;
    setIsCamOn(nextState);

    if (livekitRoomRef.current && livekitRoomRef.current.state === 'connected') {
      try {
        await livekitRoomRef.current.localParticipant.setCameraEnabled(nextState);
      } catch (e) {
        console.warn('[LiveKit Host] toggle camera error:', e);
      }
    }

    if (cameraTrackRef.current) {
      cameraTrackRef.current.enabled = nextState;
    }
    updateTrainingLiveState(training.id, {
      hostCamOn: nextState
    });
    broadcastChannelRef.current?.postMessage({
      type: 'HOST_CAMERA_TOGGLED',
      enabled: nextState,
      trainingId: training.id
    });
  };

  const handleToggleMic = async () => {
    const nextState = !isMicOn;
    setIsMicOn(nextState);

    if (livekitRoomRef.current && livekitRoomRef.current.state === 'connected') {
      try {
        await livekitRoomRef.current.localParticipant.setMicrophoneEnabled(nextState);
      } catch (e) {
        console.warn('[LiveKit Host] toggle mic error:', e);
      }
    }

    updateTrainingLiveState(training.id, {
      hostMicOn: nextState
    });
    broadcastChannelRef.current?.postMessage({
      type: 'HOST_MIC_TOGGLED',
      enabled: nextState,
      trainingId: training.id
    });
  };

  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      await handleStopScreenShare();
    } else {
      try {
        console.log("[Presenter] Starting screen sharing...");
        let stream: MediaStream | null = null;
        let screenTrack: MediaStreamTrack | null = null;
        let localLkTrack: any = null;

        // 1. Prioritize LiveKit SFU Screen Share
        if (livekitRoomRef.current && livekitRoomRef.current.state === 'connected') {
          console.log("[Presenter] Publishing screen via LiveKit SFU 1080p...");
          const pub = await livekitRoomRef.current.localParticipant.setScreenShareEnabled(true, {
            audio: false,
            resolution: VideoPresets.h1080.resolution
          });

          if (pub) {
            localLkTrack = pub.track || (pub as any).videoTrack || livekitRoomRef.current.localParticipant.getTrackPublication(Track.Source.ScreenShare)?.track;
            if (localLkTrack) {
              screenTrack = localLkTrack.mediaStreamTrack || localLkTrack.track;
              if (screenTrack) {
                stream = new MediaStream([screenTrack]);
              }
            }
          }
        }

        // 2. Direct browser fallback if LiveKit did not produce a local MediaStream
        if (!stream && navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
          console.log("[Presenter] Using browser getDisplayMedia fallback...");
          stream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: false
          });
          screenTrack = stream.getVideoTracks()[0];
        }

        const isLkSharing = !!(livekitRoomRef.current?.localParticipant?.isScreenShareEnabled);

        if (stream || isLkSharing) {
          if (screenTrack) {
            console.log("[Presenter] screen track active:", screenTrack.id, screenTrack.label);
            screenTrack.onended = async () => {
              console.log("[Presenter] screen sharing stopped via onended");
              await handleStopScreenShare();
            };
          }

          if (localLkTrack) {
            localLkTrack.on('ended', () => {
              handleStopScreenShare();
            });
          }

          if (stream) {
            setScreenStream(stream);
            screenStreamRef.current = stream;
            startSnapshotLoop(stream);

            if (screenVideoRef.current) {
              screenVideoRef.current.srcObject = stream;
              screenVideoRef.current.play().catch(() => {});
            }

            // WebRTC renegotiation for P2P fallback attendees
            for (const [attendeeId] of peerConnectionsRef.current.entries()) {
              await initiatePeerConnection(attendeeId, stream);
            }
          }

          setIsScreenSharing(true);
          broadcastChannelRef.current?.postMessage({
            type: 'SCREEN_SHARE_STARTED',
            trainingId: training.id
          });
          updateTrainingLiveState(training.id, {
            isScreenSharing: true,
            shareType: 'screen'
          });
        }
      } catch (err) {
        console.warn('[Presenter] Error starting screen share:', err);
      }
    }
  };

  const handleStopScreenShare = async () => {
    console.log("[Presenter] screen sharing stopped");

    // 1. Stop LiveKit Screen Share
    if (livekitRoomRef.current && livekitRoomRef.current.state === 'connected') {
      try {
        await livekitRoomRef.current.localParticipant.setScreenShareEnabled(false);
      } catch (e) {
        console.warn('[LiveKit Host] Error stopping screen share:', e);
      }
    }

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
    setScreenStream(null);
    setIsScreenSharing(false);
    stopSnapshotLoop();

    // Restore presenter's camera track using the same RTCRtpSender for P2P
    const cameraTrack = cameraTrackRef.current;
    if (cameraTrack) {
      for (const [attendeeId, pc] of peerConnectionsRef.current.entries()) {
        try {
          const sender = pc.getSenders().find(s => s.track?.kind === "video");
          if (sender) {
            await sender.replaceTrack(cameraTrack);
          }
        } catch (e) {
          console.warn(`[Presenter] Error restoring camera track for ${attendeeId}:`, e);
        }
      }
    }

    // Restore local video display
    if (presenterCameraVideoRef.current && cameraStreamRef.current) {
      presenterCameraVideoRef.current.srcObject = cameraStreamRef.current;
    }

    broadcastChannelRef.current?.postMessage({
      type: 'SCREEN_SHARE_STOPPED',
      trainingId: training.id
    });
    updateTrainingLiveState(training.id, {
      isScreenSharing: false,
      shareType: undefined,
      screenSnapshot: ''
    });
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

          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-sky-950/80 border border-sky-500/40 text-[#38bdf8] rounded-full text-[11px] font-bold uppercase tracking-wider">
            <Radio className={`w-3 h-3 ${isLivekitConnected ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
            <span>{isLivekitConnected ? 'LiveKit Cloud SFU' : 'LiveKit Connecting...'}</span>
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
                  ref={(el) => {
                    screenVideoRef.current = el;
                    if (el && screenStream && el.srcObject !== screenStream) {
                      el.srcObject = screenStream;
                      el.play().catch(() => {});
                    }
                  }}
                  autoPlay
                  playsInline
                  muted
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
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center relative bg-slate-950">
                {/* Trainer Camera Video Box */}
                <div className="w-64 sm:w-80 h-44 sm:h-56 rounded-2xl bg-slate-900 border-2 border-slate-700/80 overflow-hidden shadow-2xl relative flex items-center justify-center">
                  <video
                    ref={(el) => {
                      presenterCameraVideoRef.current = el;
                      if (el && cameraStreamRef.current && el.srcObject !== cameraStreamRef.current) {
                        el.srcObject = cameraStreamRef.current;
                        el.play().catch(() => {});
                      }
                    }}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-black/70 backdrop-blur-md rounded text-[10px] font-bold text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Presenter Live Video
                  </div>
                  {isMicOn && (
                    <span className="absolute bottom-2.5 right-2.5 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow">
                      <Mic className="w-3.5 h-3.5 text-white" />
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
                    <span>Share Screen</span>
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
              <div className="absolute bottom-4 right-4 w-44 h-32 bg-[#0a0f1d] border border-slate-700/80 rounded-xl overflow-hidden shadow-2xl flex flex-col justify-between p-2 z-20">
                <div className="flex justify-between items-center z-10">
                  <span className="text-[10px] font-bold text-slate-300 bg-black/60 px-2 py-0.5 rounded">
                    Host (You)
                  </span>
                  <div className="flex items-center gap-1">
                    {isMicOn ? <Mic className="w-3 h-3 text-emerald-400" /> : <MicOff className="w-3 h-3 text-red-400" />}
                  </div>
                </div>

                <div className="absolute inset-0 flex items-center justify-center">
                  <video
                    ref={(el) => {
                      if (el && cameraStreamRef.current && el.srcObject !== cameraStreamRef.current) {
                        el.srcObject = cameraStreamRef.current;
                        el.play().catch(() => {});
                      }
                    }}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="z-10 text-[9px] text-slate-300 truncate text-center font-semibold bg-black/60 py-0.5 rounded">
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
                onClick={handleToggleMic}
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
                onClick={handleToggleCamera}
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
