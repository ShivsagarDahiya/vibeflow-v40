import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Camera, Plus, X, Save } from "lucide-react";
import { useMyProfile, useUpdateProfile } from "../hooks/useProfile";
import { toast } from "sonner";

const NICHE_OPTIONS = [
  "Dance", "Music", "Comedy", "Travel", "Food", "Fashion", "Fitness",
  "Beauty", "Art", "Gaming", "Tech", "Sports", "Lifestyle", "Education",
  "DIY", "Pets", "Nature", "Photography", "Cooking", "Wellness",
];

const PRONOUNS = ["he/him", "she/her", "they/them", "xe/xem", "any", "prefer not to say"];

interface FormState {
  displayName: string;
  username: string;
  bio: string;
  pronouns: string;
  website: string;
  location: string;
  gender: string;
  birthday: string;
  instagramUrl: string;
  twitterUrl: string;
  youtubeUrl: string;
  nicheTags: string[];
  avatarUrl: string;
  coverPhotoUrl: string;
}

function AvatarUpload({ url, onChange }: { url: string; onChange: (url: string) => void }) {
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    onChange(objectUrl);
    toast.success("Avatar updated — save to persist");
  };

  return (
    <label className="relative cursor-pointer group" htmlFor="avatar-upload" aria-label="Change avatar">
      <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-dark">
        <img src={url || "https://picsum.photos/seed/default/100/100"} alt="Avatar" className="w-full h-full object-cover" />
      </div>
      <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <Camera className="w-6 h-6 text-white" />
      </div>
      <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full btn-love flex items-center justify-center shadow-love">
        <Camera className="w-4 h-4 text-white" />
      </div>
      <input id="avatar-upload" type="file" accept="image/*" className="sr-only" onChange={handleFile} data-ocid="avatar-upload" />
    </label>
  );
}

function CoverUpload({ url, onChange }: { url: string; onChange: (url: string) => void }) {
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onChange(URL.createObjectURL(file));
    toast.success("Cover updated — save to persist");
  };

  return (
    <label className="relative cursor-pointer group h-36 w-full block" htmlFor="cover-upload" aria-label="Change cover photo">
      {url ? (
        <img src={url} alt="Cover" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-dark-300 via-primary/20 to-dark-400" />
      )}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-sm font-medium">
        <Camera className="w-5 h-5" />
        Change Cover
      </div>
      <input id="cover-upload" type="file" accept="image/*" className="sr-only" onChange={handleFile} data-ocid="cover-upload" />
    </label>
  );
}

function Field({
  label, name, value, onChange, type = "text", placeholder, multiline, maxLength,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  multiline?: boolean;
  maxLength?: number;
}) {
  const classes = "w-full bg-surface-higher border border-white/10 rounded-xl text-sm text-white px-3 py-2.5 outline-none focus:border-primary placeholder:text-white/30 resize-none transition-colors";
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="text-xs font-medium text-white/60 uppercase tracking-wide">{label}</label>
      {multiline ? (
        <textarea
          id={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          rows={3}
          className={classes}
          data-ocid={`field-${name}`}
        />
      ) : (
        <input
          id={name}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          className={classes}
          data-ocid={`field-${name}`}
        />
      )}
      {maxLength && (
        <div className="text-right text-xs text-white/30">{value.length}/{maxLength}</div>
      )}
    </div>
  );
}

export default function EditProfilePage() {
  const navigate = useNavigate();
  const { data: profile, isLoading } = useMyProfile();
  const updateProfile = useUpdateProfile();
  const [form, setForm] = useState<FormState | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (profile && !form) {
      setForm({
        displayName: profile.displayName ?? "",
        username: profile.username ?? "",
        bio: profile.bio ?? "",
        pronouns: profile.pronouns ?? "",
        website: profile.website ?? "",
        location: profile.location ?? "",
        gender: profile.gender ?? "",
        birthday: profile.birthday ?? "",
        instagramUrl: profile.instagramUrl ?? "",
        twitterUrl: profile.twitterUrl ?? "",
        youtubeUrl: profile.youtubeUrl ?? "",
        nicheTags: profile.nicheTags ?? [],
        avatarUrl: profile.avatarUrl ?? "",
        coverPhotoUrl: profile.coverPhotoUrl ?? "",
      });
    }
  }, [profile, form]);

  const set = (key: keyof FormState, value: string | string[]) => {
    setForm((prev) => prev ? { ...prev, [key]: value } : prev);
    setHasChanges(true);
  };

  const toggleTag = (tag: string) => {
    if (!form) return;
    const next = form.nicheTags.includes(tag)
      ? form.nicheTags.filter((t) => t !== tag)
      : form.nicheTags.length < 5
      ? [...form.nicheTags, tag]
      : form.nicheTags;
    set("nicheTags", next);
  };

  const handleSave = async () => {
    if (!form) return;
    try {
      await updateProfile.mutateAsync(form);
      toast.success("Profile saved!");
      setHasChanges(false);
      navigate("/profile");
    } catch {
      toast.error("Failed to save profile. Please try again.");
    }
  };

  if (isLoading || !form) {
    return (
      <div className="flex flex-col h-full overflow-y-auto scrollbar-hide pb-tab">
        <div className="h-36 skeleton" />
        <div className="flex flex-col items-center -mt-12 gap-4 px-4 pt-2">
          <div className="w-24 h-24 rounded-full skeleton" />
          <div className="w-full space-y-3">
            {["e1","e2","e3","e4"].map((k) => <div key={k} className="h-12 skeleton rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-hide pb-tab" data-ocid="edit-profile-page">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 pt-safe border-b border-white/8 bg-surface sticky top-0 z-10">
        <button type="button" onClick={() => navigate(-1)} className="w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:text-white" aria-label="Back">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-display font-semibold text-white flex-1">Edit Profile</h1>
        {hasChanges && (
          <button
            type="button"
            onClick={handleSave}
            disabled={updateProfile.isPending}
            className="btn-love px-4 h-8 rounded-full text-sm flex items-center gap-1.5 disabled:opacity-50"
            data-ocid="save-btn-header"
          >
            {updateProfile.isPending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save className="w-3.5 h-3.5" />Save</>}
          </button>
        )}
      </div>

      {/* Cover photo */}
      <CoverUpload url={form.coverPhotoUrl} onChange={(v) => set("coverPhotoUrl", v)} />

      {/* Avatar */}
      <div className="flex flex-col items-center -mt-12 pb-4 bg-gradient-to-b from-dark/60 to-surface">
        <AvatarUpload url={form.avatarUrl} onChange={(v) => set("avatarUrl", v)} />
      </div>

      {/* Form */}
      <div className="px-4 pb-6 space-y-5">
        {/* Basic info */}
        <div className="space-y-4">
          <h2 className="text-xs font-semibold text-white/50 uppercase tracking-wider">Basic Info</h2>
          <Field label="Display Name" name="displayName" value={form.displayName} onChange={(v) => set("displayName", v)} placeholder="Your name" maxLength={50} />
          <Field label="Username" name="username" value={form.username} onChange={(v) => set("username", v)} placeholder="@username" maxLength={30} />
          <Field label="Bio" name="bio" value={form.bio} onChange={(v) => set("bio", v)} placeholder="Tell your story..." multiline maxLength={200} />
        </div>

        {/* Personal */}
        <div className="space-y-4">
          <h2 className="text-xs font-semibold text-white/50 uppercase tracking-wider">Personal</h2>
          <div className="space-y-1.5">
            <label htmlFor="pronouns" className="text-xs font-medium text-white/60 uppercase tracking-wide">Pronouns</label>
            <select
              id="pronouns"
              value={form.pronouns}
              onChange={(e) => set("pronouns", e.target.value)}
              className="w-full bg-surface-higher border border-white/10 rounded-xl text-sm text-white px-3 py-2.5 outline-none focus:border-primary"
              data-ocid="field-pronouns"
            >
              <option value="">Select pronouns</option>
              {PRONOUNS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <Field label="Location" name="location" value={form.location} onChange={(v) => set("location", v)} placeholder="City, Country" />
          <div className="space-y-1.5">
            <label htmlFor="gender" className="text-xs font-medium text-white/60 uppercase tracking-wide">Gender</label>
            <select id="gender" value={form.gender} onChange={(e) => set("gender", e.target.value)} className="w-full bg-surface-higher border border-white/10 rounded-xl text-sm text-white px-3 py-2.5 outline-none focus:border-primary" data-ocid="field-gender">
              <option value="">Prefer not to say</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="non-binary">Non-binary</option>
              <option value="other">Other</option>
            </select>
          </div>
          <Field label="Birthday" name="birthday" value={form.birthday} onChange={(v) => set("birthday", v)} type="date" />
        </div>

        {/* Links */}
        <div className="space-y-4">
          <h2 className="text-xs font-semibold text-white/50 uppercase tracking-wider">Links</h2>
          <Field label="Website" name="website" value={form.website} onChange={(v) => set("website", v)} placeholder="https://yoursite.com" type="url" />
          <Field label="Instagram" name="instagramUrl" value={form.instagramUrl} onChange={(v) => set("instagramUrl", v)} placeholder="instagram.com/username" />
          <Field label="Twitter / X" name="twitterUrl" value={form.twitterUrl} onChange={(v) => set("twitterUrl", v)} placeholder="twitter.com/username" />
          <Field label="YouTube" name="youtubeUrl" value={form.youtubeUrl} onChange={(v) => set("youtubeUrl", v)} placeholder="youtube.com/@channel" />
        </div>

        {/* Niche tags */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-white/50 uppercase tracking-wider">Content Niche</h2>
            <span className="text-xs text-white/30">{form.nicheTags.length}/5 selected</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {NICHE_OPTIONS.map((tag) => {
              const isSelected = form.nicheTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  data-ocid={`niche-tag-${tag.toLowerCase()}`}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-smooth ${
                    isSelected
                      ? "btn-love border-transparent text-white"
                      : "bg-surface-higher border-white/10 text-white/60 hover:border-white/30 hover:text-white"
                  }`}
                >
                  {isSelected && <span className="mr-1">✓</span>}
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Save button */}
        <button
          type="button"
          onClick={handleSave}
          disabled={updateProfile.isPending || !hasChanges}
          data-ocid="save-btn"
          className="w-full h-12 btn-love rounded-2xl font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {updateProfile.isPending ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <><Save className="w-4 h-4" />Save Profile</>
          )}
        </button>
      </div>
    </div>
  );
}
