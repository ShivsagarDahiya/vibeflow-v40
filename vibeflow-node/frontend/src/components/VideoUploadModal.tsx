import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface VideoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploaded: (videoData: {
    videoUrl: string;
    caption: string;
    hashtags: string[];
  }) => void;
}

export function VideoUploadModal({ isOpen, onClose, onUploaded }: VideoUploadModalProps) {
  const [step, setStep] = useState<"select" | "details" | "uploading">("select");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [hashtagsInput, setHashtagsInput] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setStep("details");
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setStep("uploading");

    // Simulate upload progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        const hashtags = hashtagsInput
          .split(/[\s,#]+/)
          .filter(Boolean)
          .map((t) => t.replace(/^#/, ""));

        // Optimistic update — pass back the video url
        onUploaded({
          videoUrl: previewUrl ?? "",
          caption,
          hashtags,
        });
        handleClose();
      }
      setUploadProgress(Math.min(progress, 100));
    }, 200);
  };

  const handleClose = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setStep("select");
    setSelectedFile(null);
    setPreviewUrl(null);
    setCaption("");
    setHashtagsInput("");
    setUploadProgress(0);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/80 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={step === "select" ? handleClose : undefined}
          />
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 bg-[#1a0a12] rounded-t-3xl overflow-hidden"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-4">
              <button
                type="button"
                className="text-white/60 hover:text-white"
                onClick={handleClose}
                aria-label="Close upload modal"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <title>Close</title>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <h2 className="text-white font-bold text-lg">Upload Video</h2>
              <div className="w-6" />
            </div>

            <div className="px-4 pb-8">
              {step === "select" && (
                <div className="space-y-3">
                  <button
                    type="button"
                    className="w-full py-5 rounded-2xl border-2 border-dashed border-[#e91e63]/50 flex flex-col items-center gap-3 hover:border-[#e91e63] transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                    data-ocid="upload-gallery-btn"
                  >
                    <span className="text-4xl">🎬</span>
                    <span className="text-white font-semibold">Choose from Gallery</span>
                    <span className="text-white/40 text-sm">MP4, MOV up to 500MB</span>
                  </button>

                  <button
                    type="button"
                    className="w-full py-4 rounded-2xl bg-[#e91e63]/10 border border-[#e91e63]/30 flex items-center justify-center gap-3"
                    onClick={() => fileInputRef.current?.click()}
                    data-ocid="upload-camera-btn"
                  >
                    <span className="text-2xl">📹</span>
                    <span className="text-white font-medium">Record with Camera</span>
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </div>
              )}

              {step === "details" && previewUrl && (
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-24 h-32 rounded-xl overflow-hidden bg-black flex-shrink-0">
                      <video
                        src={previewUrl}
                        className="w-full h-full object-cover"
                        muted
                        autoPlay
                        loop
                        playsInline
                      />
                    </div>
                    <div className="flex-1 space-y-3">
                      <textarea
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        placeholder="Write a caption..."
                        rows={3}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-white/30 text-sm resize-none focus:outline-none focus:border-[#e91e63]"
                        data-ocid="upload-caption-input"
                      />
                      <input
                        type="text"
                        value={hashtagsInput}
                        onChange={(e) => setHashtagsInput(e.target.value)}
                        placeholder="#hashtag #fyp #trending"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#e91e63]"
                        data-ocid="upload-hashtags-input"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm text-white/50">
                    <span className="flex items-center gap-1">
                      <span>📁</span> {selectedFile?.name}
                    </span>
                    <span>
                      {selectedFile ? (selectedFile.size / (1024 * 1024)).toFixed(1) : 0}MB
                    </span>
                  </div>

                  <button
                    type="button"
                    className="w-full py-3.5 rounded-2xl font-semibold text-white"
                    style={{ background: "linear-gradient(135deg, #e91e63, #f4a460)" }}
                    onClick={handleUpload}
                    data-ocid="upload-submit-btn"
                  >
                    Post Video
                  </button>
                </div>
              )}

              {step === "uploading" && (
                <div className="py-8 flex flex-col items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-[#e91e63]/10 flex items-center justify-center">
                    <span className="text-4xl">🚀</span>
                  </div>
                  <p className="text-white font-semibold">Uploading your video...</p>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: "linear-gradient(90deg, #e91e63, #f4a460)" }}
                      initial={{ width: "0%" }}
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>
                  <p className="text-[#e91e63] font-bold">{Math.round(uploadProgress)}%</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
