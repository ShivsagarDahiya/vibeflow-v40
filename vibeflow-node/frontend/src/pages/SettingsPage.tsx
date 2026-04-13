import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Edit3,
  Bell,
  Lock,
  Eye,
  Video,
  Palette,
  Shield,
  Info,
  LogOut,
  X,
  Plus,
  Trash2,
} from "lucide-react";
import { useSettings, useUpdateSettings, useBlockedUsers, useUnblockUser } from "../hooks/useProfile";
import type { AppSettings } from "../hooks/useProfile";
import { toast } from "sonner";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "pt", label: "Português" },
  { code: "hi", label: "हिन्दी" },
  { code: "ar", label: "العربية" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
  { code: "zh", label: "中文" },
];

function SectionHeader({ title, icon }: { title: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
      <div className="text-primary">{icon}</div>
      <span className="text-xs font-semibold uppercase tracking-wider text-white/50">{title}</span>
    </div>
  );
}

function Toggle({
  label, sublabel, value, onChange, ocid,
}: {
  label: string; sublabel?: string; value: boolean; onChange: (v: boolean) => void; ocid: string;
}) {
  return (
    <button
      type="button"
      className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-surface-high transition-colors"
      onClick={() => onChange(!value)}
      data-ocid={ocid}
      aria-pressed={value}
    >
      <div className="flex flex-col items-start text-left">
        <span className="text-sm text-white">{label}</span>
        {sublabel && <span className="text-xs text-white/40 mt-0.5">{sublabel}</span>}
      </div>
      <div className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${value ? "bg-primary" : "bg-surface-higher"}`}>
        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${value ? "translate-x-5" : "translate-x-0.5"}`} />
      </div>
    </button>
  );
}

function SelectRow<T extends string>({
  label, value, options, onChange, ocid,
}: {
  label: string; value: T; options: Array<{ value: T; label: string }>; onChange: (v: T) => void; ocid: string;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5">
      <span className="text-sm text-white">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="bg-surface-higher border border-white/10 rounded-lg text-sm text-white/80 px-2 py-1 outline-none focus:border-primary"
        data-ocid={ocid}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

function NavRow({
  label, sublabel, onClick, ocid, destructive,
}: {
  label: string; sublabel?: string; onClick: () => void; ocid: string; destructive?: boolean;
}) {
  return (
    <button
      type="button"
      className={`w-full flex items-center justify-between px-4 py-3.5 hover:bg-surface-high transition-colors ${destructive ? "text-red-400" : "text-white"}`}
      onClick={onClick}
      data-ocid={ocid}
    >
      <div className="flex flex-col items-start text-left">
        <span className="text-sm">{label}</span>
        {sublabel && <span className="text-xs text-white/40 mt-0.5">{sublabel}</span>}
      </div>
      {!destructive && <ChevronRight className="w-4 h-4 text-white/30" />}
    </button>
  );
}

function BlockedAccountsSection() {
  const { data: blocked, isLoading } = useBlockedUsers();
  const unblock = useUnblockUser();

  if (isLoading) return <div className="px-4 py-4 text-white/40 text-sm">Loading...</div>;
  if (!blocked?.length) return <div className="px-4 py-4 text-white/40 text-sm">No blocked accounts</div>;

  return (
    <div className="divide-y divide-white/5">
      {blocked.map((user) => (
        <div key={user.id} className="flex items-center gap-3 px-4 py-3" data-ocid={`blocked-${user.id}`}>
          <img src={user.avatarUrl} alt={user.displayName} className="w-9 h-9 rounded-full object-cover flex-shrink-0" loading="lazy" />
          <div className="flex-1 min-w-0">
            <div className="text-sm text-white truncate">{user.displayName}</div>
            <div className="text-xs text-white/40">@{user.username}</div>
          </div>
          <button
            type="button"
            onClick={() => { unblock.mutate(user.id); toast.success(`Unblocked @${user.username}`); }}
            className="text-xs text-primary font-medium flex-shrink-0"
            data-ocid={`unblock-${user.id}`}
          >
            Unblock
          </button>
        </div>
      ))}
    </div>
  );
}

function BlockedHashtags({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const [input, setInput] = useState("");
  const add = () => {
    const tag = input.trim().replace(/^#/, "").toLowerCase();
    if (!tag || tags.includes(tag)) return;
    onChange([...tags, tag]);
    setInput("");
  };

  return (
    <div className="px-4 py-3 space-y-2">
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 bg-surface-higher text-white/70 text-xs px-2.5 py-1 rounded-full border border-white/10">
            #{tag}
            <button type="button" onClick={() => onChange(tags.filter((t) => t !== tag))} className="text-white/40 hover:text-white" aria-label={`Remove #${tag}`}>
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder="Add hashtag..."
          className="flex-1 bg-surface-higher border border-white/10 rounded-lg text-sm text-white px-3 py-2 outline-none focus:border-primary placeholder:text-white/30"
          data-ocid="blocked-hashtag-input"
        />
        <button type="button" onClick={add} className="w-9 h-9 btn-love rounded-lg flex items-center justify-center flex-shrink-0" aria-label="Add hashtag">
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const [showBlocked, setShowBlocked] = useState(false);
  const [cacheClearing, setCacheClearing] = useState(false);

  const update = useCallback(
    <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
      updateSettings.mutate({ [key]: value } as Partial<AppSettings>);
    },
    [updateSettings]
  );

  const handleLogout = () => {
    toast.success("Signed out successfully");
    navigate("/login");
  };

  const handleClearCache = async () => {
    setCacheClearing(true);
    await new Promise((r) => setTimeout(r, 1200));
    setCacheClearing(false);
    toast.success("Cache cleared!");
  };

  if (isLoading || !settings) {
    return (
      <div className="flex flex-col h-full overflow-y-auto scrollbar-hide pb-tab">
        <div className="h-16 flex items-center px-4 gap-3 border-b border-white/8 pt-safe">
          <div className="w-8 h-8 skeleton rounded-full" />
          <div className="w-24 h-5 skeleton rounded" />
        </div>
        <div className="space-y-2 mt-4 px-4">
          {["s1","s2","s3","s4","s5","s6","s7","s8","s9","s10","s11","s12"].map((k) => (
            <div key={k} className="h-14 skeleton rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-hide pb-tab" data-ocid="settings-page">
      <div className="flex items-center gap-3 px-4 py-4 pt-safe border-b border-white/8 bg-surface sticky top-0 z-10">
        <button type="button" onClick={() => navigate(-1)} className="w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:text-white" aria-label="Back">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-display font-semibold text-white">Settings</h1>
      </div>

      <div className="divide-y divide-white/5">
        {/* Account */}
        <div>
          <SectionHeader title="Account" icon={<Edit3 className="w-4 h-4" />} />
          <NavRow label="Edit Profile" sublabel="Update your info and photos" onClick={() => navigate("/edit-profile")} ocid="edit-profile-nav" />
          <NavRow label="Change Username" onClick={() => navigate("/edit-profile")} ocid="change-username-nav" />
          <SelectRow label="Privacy Mode" value={settings.privacyMode} options={[{ value: "public", label: "Public" }, { value: "private", label: "Private" }]} onChange={(v) => update("privacyMode", v)} ocid="privacy-mode-select" />
          <Toggle label="Activity Status" sublabel="Let people know when you're active" value={settings.showActivityStatus} onChange={(v) => update("showActivityStatus", v)} ocid="activity-status-toggle" />
          <SelectRow label="Allow DMs from" value={settings.allowDMs} options={[{ value: "everyone", label: "Everyone" }, { value: "matches", label: "Matches only" }, { value: "none", label: "No one" }]} onChange={(v) => update("allowDMs", v)} ocid="allow-dms-select" />
          <SelectRow label="Allow Duets from" value={settings.allowDuets} options={[{ value: "everyone", label: "Everyone" }, { value: "followers", label: "Followers" }, { value: "none", label: "No one" }]} onChange={(v) => update("allowDuets", v)} ocid="allow-duets-select" />
          <SelectRow label="Allow Stitch from" value={settings.allowStitch} options={[{ value: "everyone", label: "Everyone" }, { value: "followers", label: "Followers" }, { value: "none", label: "No one" }]} onChange={(v) => update("allowStitch", v)} ocid="allow-stitch-select" />
        </div>

        {/* Notifications */}
        <div>
          <SectionHeader title="Notifications" icon={<Bell className="w-4 h-4" />} />
          <Toggle label="Push Notifications" sublabel="Receive alerts on your device" value={settings.pushEnabled} onChange={(v) => update("pushEnabled", v)} ocid="push-notif-toggle" />
          <Toggle label="Likes" value={settings.notifyLikes} onChange={(v) => update("notifyLikes", v)} ocid="notify-likes-toggle" />
          <Toggle label="Comments" value={settings.notifyComments} onChange={(v) => update("notifyComments", v)} ocid="notify-comments-toggle" />
          <Toggle label="New Followers" value={settings.notifyFollows} onChange={(v) => update("notifyFollows", v)} ocid="notify-follows-toggle" />
          <Toggle label="Match Requests" value={settings.notifyMatches} onChange={(v) => update("notifyMatches", v)} ocid="notify-matches-toggle" />
          <Toggle label="Mentions" value={settings.notifyMentions} onChange={(v) => update("notifyMentions", v)} ocid="notify-mentions-toggle" />
          <Toggle label="Duets & Collabs" value={settings.notifyDuets} onChange={(v) => update("notifyDuets", v)} ocid="notify-duets-toggle" />
        </div>

        {/* Content */}
        <div>
          <SectionHeader title="Content Preferences" icon={<Video className="w-4 h-4" />} />
          <Toggle label="Autoplay Videos" sublabel="Play videos as you scroll" value={settings.autoplay} onChange={(v) => update("autoplay", v)} ocid="autoplay-toggle" />
          <SelectRow label="Video Quality" value={settings.videoQuality} options={[{ value: "auto", label: "Auto" }, { value: "hd", label: "HD" }, { value: "sd", label: "SD" }]} onChange={(v) => update("videoQuality", v)} ocid="video-quality-select" />
          <Toggle label="Sensitive Content Filter" sublabel="Hide potentially sensitive content" value={settings.sensitiveContent} onChange={(v) => update("sensitiveContent", v)} ocid="sensitive-content-toggle" />
          <div>
            <div className="px-4 pt-3 pb-1 text-sm text-white">Blocked Hashtags</div>
            <BlockedHashtags tags={settings.blockedHashtags} onChange={(v) => update("blockedHashtags", v)} />
          </div>
        </div>

        {/* Blocked Accounts */}
        <div>
          <SectionHeader title="Blocked Accounts" icon={<Lock className="w-4 h-4" />} />
          <button
            type="button"
            className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-surface-high transition-colors"
            onClick={() => setShowBlocked((v) => !v)}
            data-ocid="blocked-accounts-toggle"
          >
            <span className="text-sm text-white">Manage blocked users</span>
            <ChevronRight className={`w-4 h-4 text-white/30 transition-transform ${showBlocked ? "rotate-90" : ""}`} />
          </button>
          {showBlocked && <BlockedAccountsSection />}
        </div>

        {/* App */}
        <div>
          <SectionHeader title="App" icon={<Palette className="w-4 h-4" />} />
          <SelectRow label="Theme" value={settings.theme} options={[{ value: "dark", label: "Dark" }, { value: "light", label: "Light" }, { value: "system", label: "System" }]} onChange={(v) => update("theme", v)} ocid="theme-select" />
          <SelectRow label="Language" value={settings.language} options={LANGUAGES.map((l) => ({ value: l.code, label: l.label }))} onChange={(v) => update("language", v)} ocid="language-select" />
          <button
            type="button"
            className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-surface-high transition-colors"
            onClick={handleClearCache}
            disabled={cacheClearing}
            data-ocid="clear-cache-btn"
          >
            <div className="flex flex-col items-start">
              <span className="text-sm text-white">Clear Cache</span>
              <span className="text-xs text-white/40">Free up storage space</span>
            </div>
            {cacheClearing ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Trash2 className="w-4 h-4 text-white/30" />}
          </button>
          <Toggle label="Data Collection" sublabel="Help improve VibeFlow" value={settings.dataCollection} onChange={(v) => update("dataCollection", v)} ocid="data-collection-toggle" />
        </div>

        {/* Security */}
        <div>
          <SectionHeader title="Security" icon={<Shield className="w-4 h-4" />} />
          <div className="px-4 py-3.5">
            <div className="text-sm text-white mb-1">Two-Factor Authentication</div>
            <div className="text-xs text-white/40">Your account is protected by Internet Identity, which provides built-in two-factor security.</div>
            <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-green-400 bg-green-400/10 border border-green-400/20 rounded-full px-2.5 py-1">
              <Eye className="w-3 h-3" />
              Protected
            </div>
          </div>
        </div>

        {/* About */}
        <div>
          <SectionHeader title="About" icon={<Info className="w-4 h-4" />} />
          <div className="px-4 py-3 text-sm text-white/50 space-y-1">
            <div className="flex justify-between"><span>Version</span><span>2.0.0</span></div>
          </div>
          <NavRow label="Privacy Policy" onClick={() => {}} ocid="privacy-policy-nav" />
          <NavRow label="Terms of Service" onClick={() => {}} ocid="terms-nav" />
        </div>

        {/* Logout */}
        <div className="pt-2 pb-6 px-4">
          <button
            type="button"
            onClick={handleLogout}
            data-ocid="logout-btn"
            className="w-full mt-4 h-12 rounded-2xl border border-red-500/30 text-red-400 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>

      <div className="py-6 text-center">
        <span className="text-xs text-white/20">© {new Date().getFullYear()}. Built with love using </span>
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-white/30 hover:text-primary transition-colors"
        >
          caffeine.ai
        </a>
      </div>
    </div>
  );
}
