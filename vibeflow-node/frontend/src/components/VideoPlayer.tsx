import React, { useRef, useState, useEffect, useCallback } from "react";

interface VideoPlayerProps {
  videoUrl: string;
  thumbnailUrl: string;
  isActive: boolean;
  quality: "HD" | "SD";
  duration: number;
  onProgressChange?: (progress: number) => void;
}

export function VideoPlayer({
  videoUrl,
  thumbnailUrl,
  isActive,
  quality,
  onProgressChange,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [progress, setProgress] = useState(0);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const speeds = [0.5, 1, 1.5, 2];

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isActive) {
      video.play().catch(() => {});
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, [isActive]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = speed;
  }, [speed]);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    const p = video.currentTime / video.duration;
    setProgress(p);
    onProgressChange?.(p);
  }, [onProgressChange]);

  const handleClick = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  const handleProgressKey = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    if (e.key === "ArrowRight") video.currentTime = Math.min(video.currentTime + 5, video.duration);
    if (e.key === "ArrowLeft") video.currentTime = Math.max(video.currentTime - 5, 0);
  }, []);

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      <button
        type="button"
        className="absolute inset-0 w-full h-full cursor-pointer"
        onClick={handleClick}
        aria-label="Toggle video playback"
      />
      <video
        ref={videoRef}
        src={videoUrl}
        poster={thumbnailUrl}
        className="w-full h-full object-cover pointer-events-none"
        loop
        playsInline
        muted={isMuted}
        preload="auto"
        onTimeUpdate={handleTimeUpdate}
      />

      {/* Play/Pause indicator */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center">
            <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <title>Play</title>
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}

      {/* Quality badge */}
      <div className="absolute top-3 left-3 pointer-events-none">
        <span
          className={`text-xs font-bold px-1.5 py-0.5 rounded ${
            quality === "HD"
              ? "bg-[#e91e63] text-white"
              : "bg-white/20 text-white/80"
          }`}
        >
          {quality}
        </span>
      </div>

      {/* Bottom controls */}
      <div
        className="absolute bottom-0 left-0 right-0 flex items-center gap-2 px-3 pb-3 pt-6 z-10"
        style={{
          background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)",
        }}
      >
        {/* Mute button */}
        <button
          type="button"
          className="w-9 h-9 rounded-full bg-black/40 flex items-center justify-center text-white z-10"
          onClick={() => setIsMuted((m) => !m)}
          aria-label={isMuted ? "Unmute" : "Mute"}
          data-ocid="video-mute-btn"
        >
          {isMuted ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <title>Muted</title>
              <path d="M16.5 12A4.5 4.5 0 0014 7.97V11.18l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0021 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25A7.007 7.007 0 0112 19c-1.37 0-2.63-.42-3.68-1.12L6.94 19.26A8.97 8.97 0 0012 21c1.75 0 3.38-.51 4.77-1.38l1.96 1.96L20 20.27 4.27 3zM12 3L9.91 5.09 12 7.18V3z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <title>Sound on</title>
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
            </svg>
          )}
        </button>

        {/* Progress slider */}
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(progress * 100)}
          onChange={(e) => {
            const video = videoRef.current;
            if (!video) return;
            video.currentTime = (Number(e.target.value) / 100) * video.duration;
          }}
          onKeyDown={handleProgressKey}
          className="flex-1 h-1 accent-[#e91e63] cursor-pointer z-10"
          aria-label="Video progress"
          data-ocid="video-progress"
        />

        {/* Speed control */}
        <div className="relative z-10">
          <button
            type="button"
            className="w-9 h-9 rounded-full bg-black/40 flex items-center justify-center text-white text-xs font-bold"
            onClick={() => setShowSpeedMenu((s) => !s)}
            aria-label="Playback speed"
            data-ocid="video-speed-btn"
          >
            {speed}x
          </button>
          {showSpeedMenu && (
            <div className="absolute bottom-10 right-0 bg-black/90 rounded-xl overflow-hidden border border-white/10">
              {speeds.map((s) => (
                <button
                  type="button"
                  key={s}
                  className={`block w-16 py-2 text-sm text-center transition-colors ${
                    speed === s ? "text-[#e91e63] font-bold" : "text-white"
                  }`}
                  onClick={() => {
                    setSpeed(s);
                    setShowSpeedMenu(false);
                  }}
                >
                  {s}x
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
