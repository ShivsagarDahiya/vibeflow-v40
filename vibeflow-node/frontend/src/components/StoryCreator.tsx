import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCreateStory } from "../hooks/useStories";

interface StoryCreatorProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StoryCreator({ isOpen, onClose }: StoryCreatorProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mutateAsync: createStory } = useCreateStory();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreview(url);
  };

  const handlePost = async () => {
    if (!preview) return;
    setIsUploading(true);
    try {
      await createStory({
        mediaUrl: preview,
        mediaType: selectedFile?.type.startsWith("video") ? "video" : "photo",
        caption: caption || undefined,
      });
      onClose();
      setSelectedFile(null);
      setPreview(null);
      setCaption("");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (preview) URL.revokeObjectURL(preview);
    setSelectedFile(null);
    setPreview(null);
    setCaption("");
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
            onClick={handleClose}
          />
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 bg-[#1a0a12] rounded-t-3xl overflow-hidden"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            <div className="px-4 pb-8">
              <h2 className="text-white font-bold text-lg text-center mb-4">Create Story</h2>

              {!preview ? (
                <div className="space-y-3">
                  <button
                    type="button"
                    className="w-full py-4 rounded-2xl border-2 border-dashed border-[#e91e63]/50 flex flex-col items-center gap-2 hover:border-[#e91e63] transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                    data-ocid="story-upload-btn"
                  >
                    <span className="text-3xl">📸</span>
                    <span className="text-white font-medium">Choose Photo or Video</span>
                    <span className="text-white/50 text-sm">From your gallery</span>
                  </button>

                  <button
                    type="button"
                    className="w-full py-4 rounded-2xl bg-[#e91e63]/10 border border-[#e91e63]/30 flex flex-col items-center gap-2"
                    onClick={() => fileInputRef.current?.click()}
                    data-ocid="story-camera-btn"
                  >
                    <span className="text-3xl">📷</span>
                    <span className="text-white font-medium">Open Camera</span>
                    <span className="text-white/50 text-sm">Take a new photo or video</span>
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative rounded-2xl overflow-hidden h-64 bg-black">
                    {selectedFile?.type.startsWith("video") ? (
                      <video
                        src={preview}
                        className="w-full h-full object-cover"
                        controls={false}
                        autoPlay
                        loop
                        muted
                        playsInline
                      />
                    ) : (
                      <img src={preview} alt="Story preview" className="w-full h-full object-cover" />
                    )}
                    <button
                      type="button"
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white"
                      onClick={() => { setPreview(null); setSelectedFile(null); }}
                      aria-label="Remove media"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <title>Remove</title>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <input
                    type="text"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Add a caption..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#e91e63]"
                    data-ocid="story-caption-input"
                  />

                  <button
                    type="button"
                    className="w-full py-3.5 rounded-2xl font-semibold text-white disabled:opacity-50 transition-opacity"
                    style={{ background: "linear-gradient(135deg, #e91e63, #f4a460)" }}
                    onClick={handlePost}
                    disabled={isUploading}
                    data-ocid="story-post-btn"
                  >
                    {isUploading ? "Posting..." : "Share Story"}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
