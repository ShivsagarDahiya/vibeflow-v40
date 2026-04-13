import { useState, useEffect, useCallback } from "react";
import { X, Download, Share2, QrCode } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  username: string;
  displayName: string;
  avatarUrl: string;
}

// Minimal QR code renderer using Google Charts API
function QRImage({ data, size = 200 }: { data: string; size?: number }) {
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}&bgcolor=12121a&color=f5f5f7&format=png`;
  return (
    <img
      src={url}
      alt="QR Code"
      width={size}
      height={size}
      className="rounded-2xl"
      loading="eager"
    />
  );
}

export default function QRShareModal({ open, onClose, username, displayName, avatarUrl }: Props) {
  const profileUrl = `${window.location.origin}/user/${username}`;
  const [copied, setCopied] = useState(false);

  // Trap focus / close on escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      toast.success("Link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy link");
    }
  }, [profileUrl]);

  const handleDownload = useCallback(() => {
    const a = document.createElement("a");
    a.href = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(profileUrl)}&bgcolor=12121a&color=f5f5f7&format=png`;
    a.download = `vibeflow-${username}-qr.png`;
    a.click();
    toast.success("QR code saved!");
  }, [profileUrl, username]);

  const handleShare = useCallback(async () => {
    try {
      await navigator.share?.({ title: `${displayName} on VibeFlow`, url: profileUrl });
    } catch {
      handleCopy();
    }
  }, [displayName, profileUrl, handleCopy]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="QR Code Share"
    >
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-dark/80 backdrop-blur-sm w-full"
        onClick={onClose}
        aria-label="Close modal"
      />

      {/* Sheet */}
      <div className="relative z-10 w-full sm:w-96 bg-surface rounded-t-3xl sm:rounded-3xl p-6 pb-safe animate-slide-up">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-surface-higher flex items-center justify-center text-white/60 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-6">
          <QrCode className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold font-display text-white">Share Profile</h2>
        </div>

        {/* Card preview */}
        <div className="rounded-2xl bg-surface-higher p-5 flex flex-col items-center gap-4 border border-white/8 mb-5">
          <img
            src={avatarUrl}
            alt={displayName}
            className="w-16 h-16 rounded-full object-cover ring-2 ring-primary/60"
          />
          <div className="text-center">
            <div className="font-display font-semibold text-white">{displayName}</div>
            <div className="text-white/50 text-sm">@{username}</div>
          </div>
          <div className="p-3 bg-dark rounded-2xl" data-ocid="qr-code-img">
            <QRImage data={profileUrl} size={160} />
          </div>
          <div className="text-xs text-white/30 text-center font-mono break-all">{profileUrl}</div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={handleCopy}
            data-ocid="qr-copy-btn"
            className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-surface-higher hover:bg-surface-high transition-colors"
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${copied ? "bg-green-500/20 text-green-400" : "bg-primary/20 text-primary"}`}>
              {copied ? "✓" : <Share2 className="w-4 h-4" />}
            </div>
            <span className="text-xs text-white/60">{copied ? "Copied!" : "Copy Link"}</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            data-ocid="qr-download-btn"
            className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-surface-higher hover:bg-surface-high transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-gold/20 text-gold flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <span className="text-xs text-white/60">Download</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            data-ocid="qr-share-btn"
            className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-surface-higher hover:bg-surface-high transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <span className="text-xs text-white/60">Share</span>
          </button>
        </div>
      </div>
    </div>
  );
}
