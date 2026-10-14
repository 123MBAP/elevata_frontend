import React, { useState, useMemo } from 'react';
import {
  Play,
  Video,
  ExternalLink,
  AlertCircle,
  Film,
  CheckCircle2,
  Maximize2,
  Sparkles
} from 'lucide-react';

export interface VideoEmbedInfo {
  isValid: boolean;
  type: 'youtube' | 'vimeo' | 'loom' | 'direct' | 'other';
  embedUrl: string | null;
  directUrl: string | null;
  thumbnailUrl: string | null;
  providerName: string;
}

export function parseVideoUrl(rawUrl?: string | null): VideoEmbedInfo {
  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
    return {
      isValid: false,
      type: 'other',
      embedUrl: null,
      directUrl: null,
      thumbnailUrl: null,
      providerName: 'Unknown'
    };
  }

  const url = rawUrl.trim();

  // YouTube matchers:
  // - https://www.youtube.com/watch?v=VIDEO_ID
  // - https://youtu.be/VIDEO_ID
  // - https://www.youtube.com/embed/VIDEO_ID
  // - https://www.youtube.com/shorts/VIDEO_ID
  const ytMatch = url.match(
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i
  );
  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    return {
      isValid: true,
      type: 'youtube',
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=0&rel=0`,
      directUrl: url,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      providerName: 'YouTube'
    };
  }

  // Vimeo matchers:
  // - https://vimeo.com/VIDEO_ID
  // - https://player.vimeo.com/video/VIDEO_ID
  const vimeoMatch = url.match(
    /(?:https?:\/\/)?(?:www\.)?(?:player\.)?vimeo\.com\/(?:video\/)?(\d+)/i
  );
  if (vimeoMatch && vimeoMatch[1]) {
    const videoId = vimeoMatch[1];
    return {
      isValid: true,
      type: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${videoId}?dnt=1`,
      directUrl: url,
      thumbnailUrl: null,
      providerName: 'Vimeo'
    };
  }

  // Loom matchers:
  // - https://www.loom.com/share/VIDEO_ID
  // - https://www.loom.com/embed/VIDEO_ID
  const loomMatch = url.match(
    /(?:https?:\/\/)?(?:www\.)?loom\.com\/(?:share|embed)\/([a-zA-Z0-9]+)/i
  );
  if (loomMatch && loomMatch[1]) {
    const videoId = loomMatch[1];
    return {
      isValid: true,
      type: 'loom',
      embedUrl: `https://www.loom.com/embed/${videoId}`,
      directUrl: url,
      thumbnailUrl: null,
      providerName: 'Loom'
    };
  }

  // Direct video file (.mp4, .webm, .ogg)
  if (/\.(mp4|webm|ogg)($|\?)/i.test(url)) {
    return {
      isValid: true,
      type: 'direct',
      embedUrl: null,
      directUrl: url,
      thumbnailUrl: null,
      providerName: 'Direct Video'
    };
  }

  // Generic valid web link (attempt standard embed/iframe)
  if (/^https?:\/\/.+/i.test(url)) {
    return {
      isValid: true,
      type: 'other',
      embedUrl: url,
      directUrl: url,
      thumbnailUrl: null,
      providerName: 'Web Video'
    };
  }

  return {
    isValid: false,
    type: 'other',
    embedUrl: null,
    directUrl: null,
    thumbnailUrl: null,
    providerName: 'Invalid'
  };
}

interface VideoPreviewPlayerProps {
  url: string;
  title?: string;
  className?: string;
  aspectRatio?: '16/9' | '4/3' | 'auto';
  showBadge?: boolean;
  showExternalLink?: boolean;
  allowPlayback?: boolean;
}

export default function VideoPreviewPlayer({
  url,
  title = 'Opportunity Walkthrough Video',
  className = '',
  aspectRatio = '16/9',
  showBadge = true,
  showExternalLink = true,
  allowPlayback = true
}: VideoPreviewPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const info = useMemo(() => parseVideoUrl(url), [url]);

  if (!info.isValid) {
    return (
      <div className={`p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-900 ${className}`}>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <p className="font-bold">Unable to preview video URL</p>
            <p className="text-amber-800/80 mt-0.5 leading-relaxed">
              Please provide a valid link from YouTube, Vimeo, Loom, or a direct MP4 video link.
            </p>
            {url && (
              <p className="font-mono text-[11px] text-amber-700 mt-1 truncate bg-white/60 px-2 py-1 rounded border border-amber-200">
                {url}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl overflow-hidden border border-slate-200/90 bg-slate-950 text-white shadow-sm flex flex-col ${className}`}>
      {/* Top Header Bar */}
      <div className="px-3.5 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-md bg-[#2998d6]/20 text-[#2998d6] flex items-center justify-center shrink-0 border border-[#2998d6]/30">
            <Video className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-slate-200 truncate">{title}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {showBadge && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/20">
              {info.providerName}
            </span>
          )}

          {showExternalLink && info.directUrl && (
            <a
              href={info.directUrl}
              target="_blank"
              rel="noreferrer"
              className="p-1 text-slate-400 hover:text-white transition-colors"
              title="Open video in new window"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* Video Viewport */}
      <div className="relative w-full aspect-video bg-black overflow-hidden flex items-center justify-center">
        {info.type === 'direct' ? (
          <video
            controls
            preload="metadata"
            src={info.directUrl || ''}
            className="w-full h-full object-contain"
          >
            Your browser does not support HTML5 video preview.
          </video>
        ) : info.embedUrl ? (
          <iframe
            src={info.embedUrl}
            title={title}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <div className="p-6 text-center text-slate-400 space-y-2">
            <Film className="w-10 h-10 mx-auto text-slate-600" />
            <p className="text-xs">Interactive preview ready for: {info.providerName}</p>
            {info.directUrl && (
              <a
                href={info.directUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2998d6] hover:bg-[#1f85be] text-white text-xs font-bold transition-colors"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Watch Video</span>
              </a>
            )}
          </div>
        )}
      </div>

      {/* Subtle Bottom Status Bar */}
      <div className="px-3.5 py-1.5 bg-slate-900/60 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
        <span className="flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          <span>Interactive Preview Loaded</span>
        </span>
        <span className="font-mono text-slate-500 truncate max-w-[250px]">{info.directUrl}</span>
      </div>
    </div>
  );
}
