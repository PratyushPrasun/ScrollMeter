import React from 'react';
import { Clock } from 'lucide-react';

function InstagramIcon({ className = 'w-3.5 h-3.5' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function YoutubeIcon({ className = 'w-3.5 h-3.5' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
      <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor" />
    </svg>
  );
}

export default function PlatformStats({
  instagramCount = 0,
  youtubeCount = 0,
  instagramSeconds = 0,
  youtubeSeconds = 0,
}) {
  const formatTime = (secs = 0) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    if (mins < 60) {
      return `${mins}m ${remainingSecs.toString().padStart(2, '0')}s`;
    }
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hrs}h ${remMins}m`;
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Instagram Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-pink-950/20 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-pink-400 font-semibold mb-1">
            <span className="flex items-center gap-1.5">
              <InstagramIcon className="w-3.5 h-3.5 text-pink-400" />
              Reels
            </span>
          </div>
          <div className="text-xl font-bold text-slate-100">{instagramCount}</div>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800/80">
          <Clock className="w-3 h-3 text-slate-400" />
          <span>{formatTime(instagramSeconds)}</span>
        </div>
      </div>

      {/* YouTube Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-red-950/20 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-red-400 font-semibold mb-1">
            <span className="flex items-center gap-1.5">
              <YoutubeIcon className="w-3.5 h-3.5 text-red-400" />
              Shorts
            </span>
          </div>
          <div className="text-xl font-bold text-slate-100">{youtubeCount}</div>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800/80">
          <Clock className="w-3 h-3 text-slate-400" />
          <span>{formatTime(youtubeSeconds)}</span>
        </div>
      </div>
    </div>
  );
}
