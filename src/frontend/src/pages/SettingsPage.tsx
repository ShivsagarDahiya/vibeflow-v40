import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft,
  Bell,
  Check,
  ChevronDown,
  ChevronRight,
  Eye,
  Globe,
  HelpCircle,
  Info,
  Lock,
  LogOut,
  MessageSquare,
  Monitor,
  Send,
  Shield,
  Unlock,
  User,
  UserX,
  Video,
  Volume2,
  VolumeX,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useBackend } from "../hooks/useBackend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

interface Props {
  onBack: () => void;
  onEditProfile: () => void;
}

type ThemeMode = "dark" | "light" | "auto";
type DmPrivacy = "everyone" | "matches" | "none";
type VideoQuality = "HD" | "SD" | "Auto";
type ContentFilter = "all" | "moderate" | "strict";

interface Settings {
  isPrivate: boolean;
  activityStatusVisible: boolean;
  showOnlineStatus: boolean;
  readReceiptsEnabled: boolean;
  dmPrivacy: DmPrivacy;
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  muteNotificationSound: boolean;
  theme: ThemeMode;
  language: string;
  autoPlayVideos: boolean;
  videoQuality: VideoQuality;
  contentFilter: ContentFilter;
  ageRestriction: boolean;
  blockedHashtags: string;
  blockedUsers: string;
  twoFactorEnabled: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  isPrivate: false,
  activityStatusVisible: true,
  showOnlineStatus: true,
  readReceiptsEnabled: true,
  dmPrivacy: "everyone",
  notificationsEnabled: true,
  emailNotifications: false,
  pushNotifications: true,
  muteNotificationSound: false,
  theme: "dark",
  language: "en",
  autoPlayVideos: true,
  videoQuality: "Auto",
  contentFilter: "moderate",
  ageRestriction: false,
  blockedHashtags: "",
  blockedUsers: "[]",
  twoFactorEnabled: false,
};

const LANGUAGES = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "hi", label: "हिन्दी", flag: "🇮🇳" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
];

// Tiny save indicator that shows a green checkmark for 500ms
function SaveDot({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500/20 border border-green-500/40 shrink-0"
        >
          <Check size={11} className="text-green-400" />
        </motion.span>
      )}
    </AnimatePresence>
  );
}

// Collapsible section wrapper
function Section({
  id,
  title,
  icon,
  children,
  defaultOpen = true,
}: {
  id: string;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-1 pb-2 pt-1"
        data-ocid={`settings.section_${id}.toggle`}
      >
        <span className="text-muted-foreground">{icon}</span>
        <span className="flex-1 text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          {title}
        </span>
        <ChevronDown
          size={14}
          className={`text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="settings-section overflow-hidden mb-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

// Individual setting row with toggle
function ToggleRow({
  label,
  description,
  icon,
  checked,
  onChange,
  ocid,
  saving,
}: {
  label: string;
  description?: string;
  icon?: React.ReactNode;
  checked: boolean;
  onChange: (v: boolean) => void;
  ocid: string;
  saving?: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-[14px] border-t border-border/50 first:border-t-0 min-h-[52px]">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {icon && (
          <span className="text-muted-foreground shrink-0 w-5 flex justify-center">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <p className="text-sm text-foreground leading-tight">{label}</p>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
              {description}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-3">
        <SaveDot show={!!saving} />
        <Switch
          checked={checked}
          onCheckedChange={onChange}
          data-ocid={ocid}
          className="data-[state=checked]:bg-primary"
          style={{ width: 51, height: 31 }}
        />
      </div>
    </div>
  );
}

// Picker row with dropdown
function PickerRow<T extends string>({
  label,
  icon,
  value,
  options,
  onChange,
  ocid,
  saving,
}: {
  label: string;
  icon?: React.ReactNode;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  ocid: string;
  saving?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  return (
    <div className="border-t border-border/50 first:border-t-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-[14px] min-h-[52px] active:bg-muted/30 transition-colors"
        data-ocid={ocid}
      >
        <div className="flex items-center gap-3">
          {icon && (
            <span className="text-muted-foreground w-5 flex justify-center">
              {icon}
            </span>
          )}
          <span className="text-sm text-foreground">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <SaveDot show={!!saving} />
          <span className="text-sm text-muted-foreground">
            {selected?.label}
          </span>
          <ChevronRight
            size={14}
            className={`text-muted-foreground transition-transform duration-150 ${open ? "rotate-90" : ""}`}
          />
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden border-t border-border/50 bg-background/60"
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className="w-full flex items-center justify-between px-4 py-3 border-b border-border/30 last:border-b-0 active:bg-muted/30"
                data-ocid={`${ocid}_${opt.value}`}
              >
                <span className="text-sm text-foreground">{opt.label}</span>
                {value === opt.value && (
                  <Check size={14} className="text-primary" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SettingsPage({ onBack, onEditProfile }: Props) {
  const { backend, identity } = useBackend();
  const { clear } = useInternetIdentity();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [savingField, setSavingField] = useState<string | null>(null);
  const [blockedUsersList, setBlockedUsersList] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState("");
  const [showReportBox, setShowReportBox] = useState(false);
  const [reportText, setReportText] = useState("");
  const [reportSent, setReportSent] = useState(false);
  const reportRef = useRef<HTMLTextAreaElement>(null);

  // Load settings from backend on mount
  useEffect(() => {
    if (!backend) {
      setLoading(false);
      return;
    }
    backend
      .getUserSettings()
      .then((s: Settings) => {
        setSettings({
          isPrivate: s.isPrivate,
          activityStatusVisible: s.activityStatusVisible,
          showOnlineStatus: s.showOnlineStatus,
          readReceiptsEnabled: s.readReceiptsEnabled,
          dmPrivacy: (s.dmPrivacy || "everyone") as DmPrivacy,
          notificationsEnabled: s.notificationsEnabled,
          emailNotifications: s.emailNotifications,
          pushNotifications: s.pushNotifications,
          muteNotificationSound: s.muteNotificationSound,
          theme: (s.theme || "dark") as ThemeMode,
          language: s.language || "en",
          autoPlayVideos: s.autoPlayVideos,
          videoQuality: (s.videoQuality || "Auto") as VideoQuality,
          contentFilter: (s.contentFilter || "moderate") as ContentFilter,
          ageRestriction: s.ageRestriction,
          blockedHashtags: s.blockedHashtags || "",
          blockedUsers: s.blockedUsers || "[]",
          twoFactorEnabled: s.twoFactorEnabled,
        });
        setHashtagInput(s.blockedHashtags || "");
        try {
          setBlockedUsersList(JSON.parse(s.blockedUsers || "[]"));
        } catch {
          setBlockedUsersList([]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [backend]);

  // Apply theme to HTML
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === "light") {
      root.classList.remove("dark");
      root.classList.add("light");
    } else {
      root.classList.remove("light");
      root.classList.add("dark");
    }
  }, [settings.theme]);

  const saveToBackend = useCallback(
    async (updated: Settings, fieldKey: string) => {
      if (!backend) return;
      setSavingField(fieldKey);
      try {
        await backend.updateUserSettings(
          updated.isPrivate,
          updated.notificationsEnabled,
          updated.theme,
          updated.language,
          updated.contentFilter,
          updated.ageRestriction,
          updated.blockedHashtags,
          updated.blockedUsers,
          updated.twoFactorEnabled,
          updated.emailNotifications,
          updated.pushNotifications,
          updated.autoPlayVideos,
          updated.videoQuality,
          updated.activityStatusVisible,
          updated.readReceiptsEnabled,
          updated.muteNotificationSound,
          updated.dmPrivacy,
          updated.showOnlineStatus,
        );
      } catch {}
      setTimeout(() => setSavingField(null), 600);
    },
    [backend],
  );

  const updateSetting = useCallback(
    <K extends keyof Settings>(key: K, value: Settings[K]) => {
      setSettings((prev) => {
        const next = { ...prev, [key]: value };
        saveToBackend(next, key);
        return next;
      });
    },
    [saveToBackend],
  );

  const handleBlockedHashtagsBlur = () => {
    updateSetting("blockedHashtags", hashtagInput);
  };

  const handleUnblockUser = (username: string) => {
    const updated = blockedUsersList.filter((u) => u !== username);
    setBlockedUsersList(updated);
    updateSetting("blockedUsers", JSON.stringify(updated));
  };

  const handleLogout = () => {
    clear();
    window.location.reload();
  };

  const handleSendReport = () => {
    setReportSent(true);
    setReportText("");
    setTimeout(() => {
      setReportSent(false);
      setShowReportBox(false);
    }, 2200);
  };

  const principal = identity?.getPrincipal().toString();
  const selectedLang = LANGUAGES.find((l) => l.code === settings.language);

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-background flex flex-col"
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 26, stiffness: 220 }}
      data-ocid="settings.page"
    >
      {/* iOS-style header */}
      <header className="flex items-center gap-3 px-4 pt-12 pb-4 border-b border-border sticky top-0 bg-background/95 backdrop-blur z-10 shadow-ios-sm">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-primary font-semibold text-sm active:opacity-60 transition-opacity"
          data-ocid="settings.close_button"
        >
          <ArrowLeft size={18} />
          Back
        </button>
        <h1 className="flex-1 text-center text-base font-semibold text-foreground">
          Settings
        </h1>
        <div className="w-16" />
      </header>

      {loading ? (
        <div
          className="flex-1 flex items-center justify-center"
          data-ocid="settings.loading_state"
        >
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-4 space-y-1">
            {/* Account row */}
            <div className="settings-section overflow-hidden mb-5">
              <button
                type="button"
                onClick={onEditProfile}
                className="w-full flex items-center justify-between px-4 py-[14px] min-h-[52px] active:bg-muted/30 transition-colors border-b border-border/50"
                data-ocid="settings.edit_profile.button"
              >
                <div className="flex items-center gap-3">
                  <User size={16} className="text-muted-foreground" />
                  <span className="text-sm text-foreground">Edit Profile</span>
                </div>
                <ChevronRight size={14} className="text-muted-foreground" />
              </button>
              <div className="px-4 py-3 flex items-center gap-3">
                <Shield size={16} className="text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">Principal ID</p>
                  <p className="text-xs text-foreground/70 font-mono truncate">
                    {principal ?? "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* SECTION 1 — PRIVACY */}
            <Section id="privacy" title="Privacy" icon={<Lock size={13} />}>
              {/* Private Account featured row */}
              <button
                type="button"
                onClick={() => updateSetting("isPrivate", !settings.isPrivate)}
                className={`w-full flex items-center gap-3 px-4 py-4 border-b border-border/50 transition-colors ${
                  settings.isPrivate ? "bg-primary/5" : "active:bg-muted/30"
                }`}
                data-ocid="settings.private_account.toggle"
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    settings.isPrivate ? "bg-primary/20" : "bg-muted"
                  }`}
                >
                  {settings.isPrivate ? (
                    <Lock size={16} className="text-primary" />
                  ) : (
                    <Unlock size={16} className="text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p
                    className={`text-sm font-semibold ${settings.isPrivate ? "text-primary" : "text-foreground"}`}
                  >
                    Private Account
                  </p>
                  <p className="text-xs text-muted-foreground leading-snug">
                    {settings.isPrivate
                      ? "Only approved followers see your content"
                      : "Anyone can view your content"}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <SaveDot show={savingField === "isPrivate"} />
                  <Switch
                    checked={settings.isPrivate}
                    onCheckedChange={(v) => updateSetting("isPrivate", v)}
                    data-ocid="settings.private_account.switch"
                    className="data-[state=checked]:bg-primary"
                    style={{ width: 51, height: 31 }}
                  />
                </div>
              </button>

              <ToggleRow
                label="Activity Status"
                description="Show when you were last active"
                icon={<Eye size={15} />}
                checked={settings.activityStatusVisible}
                onChange={(v) => updateSetting("activityStatusVisible", v)}
                ocid="settings.activity_status.switch"
                saving={savingField === "activityStatusVisible"}
              />
              <ToggleRow
                label="Show Online Status"
                description="Show when you're online in chat"
                icon={<Globe size={15} />}
                checked={settings.showOnlineStatus}
                onChange={(v) => updateSetting("showOnlineStatus", v)}
                ocid="settings.online_status.switch"
                saving={savingField === "showOnlineStatus"}
              />
              <ToggleRow
                label="Read Receipts"
                description="Let others know you've read their messages"
                icon={<MessageSquare size={15} />}
                checked={settings.readReceiptsEnabled}
                onChange={(v) => updateSetting("readReceiptsEnabled", v)}
                ocid="settings.read_receipts.switch"
                saving={savingField === "readReceiptsEnabled"}
              />
              <PickerRow<DmPrivacy>
                label="Who Can DM Me"
                icon={<Send size={15} />}
                value={settings.dmPrivacy}
                options={[
                  { value: "everyone", label: "Everyone" },
                  { value: "matches", label: "Matches Only" },
                  { value: "none", label: "No One" },
                ]}
                onChange={(v) => updateSetting("dmPrivacy", v)}
                ocid="settings.dm_privacy.picker"
                saving={savingField === "dmPrivacy"}
              />
            </Section>

            {/* SECTION 2 — NOTIFICATIONS */}
            <Section
              id="notifications"
              title="Notifications"
              icon={<Bell size={13} />}
            >
              <ToggleRow
                label="Enable Notifications"
                description="Receive all types of notifications"
                checked={settings.notificationsEnabled}
                onChange={(v) => updateSetting("notificationsEnabled", v)}
                ocid="settings.notifications_enabled.switch"
                saving={savingField === "notificationsEnabled"}
              />
              <ToggleRow
                label="Email Notifications"
                description="Get updates in your inbox"
                checked={settings.emailNotifications}
                onChange={(v) => updateSetting("emailNotifications", v)}
                ocid="settings.email_notifications.switch"
                saving={savingField === "emailNotifications"}
              />
              <ToggleRow
                label="Push Notifications"
                description="Instant alerts on your device"
                checked={settings.pushNotifications}
                onChange={(v) => updateSetting("pushNotifications", v)}
                ocid="settings.push_notifications.switch"
                saving={savingField === "pushNotifications"}
              />
              <ToggleRow
                label="Mute Sound"
                description="Silent notifications only"
                icon={
                  settings.muteNotificationSound ? (
                    <VolumeX size={15} />
                  ) : (
                    <Volume2 size={15} />
                  )
                }
                checked={settings.muteNotificationSound}
                onChange={(v) => updateSetting("muteNotificationSound", v)}
                ocid="settings.mute_sound.switch"
                saving={savingField === "muteNotificationSound"}
              />
            </Section>

            {/* SECTION 3 — APPEARANCE */}
            <Section
              id="appearance"
              title="Appearance"
              icon={<Monitor size={13} />}
            >
              {/* Theme 3-way pill */}
              <div className="px-4 py-4 border-b border-border/50">
                <p className="text-sm text-foreground mb-3">Theme</p>
                <div className="flex gap-2">
                  {(["dark", "light", "auto"] as ThemeMode[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => updateSetting("theme", t)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                        settings.theme === t
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted text-muted-foreground border-border"
                      }`}
                      data-ocid={`settings.theme_${t}.toggle`}
                    >
                      {t === "dark"
                        ? "🌙 Dark"
                        : t === "light"
                          ? "☀️ Light"
                          : "🔄 Auto"}
                    </button>
                  ))}
                </div>
                <AnimatePresence>
                  {savingField === "theme" && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-xs text-green-400 mt-2 flex items-center gap-1"
                    >
                      <Check size={11} /> Saved
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Language picker */}
              <PickerRow<string>
                label="Language"
                icon={<Globe size={15} />}
                value={settings.language}
                options={LANGUAGES.map((l) => ({
                  value: l.code,
                  label: `${l.flag} ${l.label}`,
                }))}
                onChange={(v) => updateSetting("language", v)}
                ocid="settings.language.picker"
                saving={savingField === "language"}
              />
              <div className="px-4 py-3 flex items-center gap-2">
                <span className="text-lg">{selectedLang?.flag}</span>
                <span className="text-xs text-muted-foreground">
                  {selectedLang?.label}
                </span>
              </div>
            </Section>

            {/* SECTION 4 — CONTENT */}
            <Section id="content" title="Content" icon={<Video size={13} />}>
              <ToggleRow
                label="Auto-Play Videos"
                description="Videos play automatically when scrolling"
                checked={settings.autoPlayVideos}
                onChange={(v) => updateSetting("autoPlayVideos", v)}
                ocid="settings.autoplay.switch"
                saving={savingField === "autoPlayVideos"}
              />
              <PickerRow<VideoQuality>
                label="Video Quality"
                value={settings.videoQuality}
                options={[
                  { value: "HD", label: "HD — Best quality" },
                  { value: "SD", label: "SD — Save data" },
                  { value: "Auto", label: "Auto — Adaptive" },
                ]}
                onChange={(v) => updateSetting("videoQuality", v)}
                ocid="settings.video_quality.picker"
                saving={savingField === "videoQuality"}
              />
              <PickerRow<ContentFilter>
                label="Content Filter"
                value={settings.contentFilter}
                options={[
                  { value: "all", label: "All — No filter" },
                  { value: "moderate", label: "Moderate — Default" },
                  { value: "strict", label: "Strict — Family safe" },
                ]}
                onChange={(v) => updateSetting("contentFilter", v)}
                ocid="settings.content_filter.picker"
                saving={savingField === "contentFilter"}
              />
              <ToggleRow
                label="Age Restriction (18+)"
                description="Only show content appropriate for adults"
                checked={settings.ageRestriction}
                onChange={(v) => updateSetting("ageRestriction", v)}
                ocid="settings.age_restriction.switch"
                saving={savingField === "ageRestriction"}
              />
            </Section>

            {/* SECTION 5 — ACCOUNT */}
            <Section
              id="account"
              title="Account"
              icon={<UserX size={13} />}
              defaultOpen={false}
            >
              {/* Blocked Hashtags */}
              <div className="px-4 py-4 border-b border-border/50">
                <p className="text-sm text-foreground mb-1">Blocked Hashtags</p>
                <p className="text-xs text-muted-foreground mb-2">
                  Comma-separated — e.g. spam, nsfw, ads
                </p>
                <input
                  type="text"
                  value={hashtagInput}
                  onChange={(e) => setHashtagInput(e.target.value)}
                  onBlur={handleBlockedHashtagsBlur}
                  placeholder="Enter hashtags to block…"
                  className="w-full bg-background border border-input rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary placeholder:text-muted-foreground transition-colors"
                  data-ocid="settings.blocked_hashtags.input"
                />
                <AnimatePresence>
                  {savingField === "blockedHashtags" && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-xs text-green-400 mt-2 flex items-center gap-1"
                    >
                      <Check size={11} /> Saved
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Blocked Users */}
              <div className="px-4 py-4 border-b border-border/50">
                <p className="text-sm text-foreground mb-3">Blocked Users</p>
                {blockedUsersList.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No blocked users
                  </p>
                ) : (
                  <div className="space-y-2">
                    {blockedUsersList.map((u, i) => (
                      <div
                        key={u}
                        className="flex items-center justify-between"
                        data-ocid={`settings.blocked_user.row.${i + 1}`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                            <User size={13} className="text-muted-foreground" />
                          </div>
                          <span className="text-sm text-foreground">@{u}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleUnblockUser(u)}
                          className="text-xs text-primary font-semibold px-3 py-1 rounded-full border border-primary/30 active:opacity-70 transition-opacity"
                          data-ocid={`settings.unblock.button.${i + 1}`}
                        >
                          Unblock
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 2FA Status */}
              <div className="px-4 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-foreground">
                      Two-Factor Authentication
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Secured by Internet Identity
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-green-500/15 border border-green-500/30 rounded-full px-2.5 py-1">
                    <Shield size={11} className="text-green-400" />
                    <span className="text-green-400 text-[11px] font-bold">
                      Protected
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  Internet Identity provides cryptographic multi-factor
                  authentication. No password required.
                </p>
              </div>
            </Section>

            {/* SECTION 6 — ABOUT */}
            <Section
              id="about"
              title="About"
              icon={<Info size={13} />}
              defaultOpen={false}
            >
              <div className="flex items-center justify-between px-4 py-[14px] border-b border-border/50">
                <span className="text-sm text-foreground">App Version</span>
                <span className="text-sm text-muted-foreground">39.0.0</span>
              </div>
              <div className="flex items-center justify-between px-4 py-[14px] border-b border-border/50">
                <span className="text-sm text-foreground">Platform</span>
                <span className="text-sm text-muted-foreground">
                  Internet Computer
                </span>
              </div>
              <a
                href="https://vibeflow.app/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-4 py-[14px] border-b border-border/50 active:bg-muted/30 transition-colors"
                data-ocid="settings.privacy_policy.link"
              >
                <span className="text-sm text-foreground">Privacy Policy</span>
                <ChevronRight size={14} className="text-muted-foreground" />
              </a>
              <a
                href="https://vibeflow.app/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-4 py-[14px] border-b border-border/50 active:bg-muted/30 transition-colors"
                data-ocid="settings.terms.link"
              >
                <span className="text-sm text-foreground">
                  Terms of Service
                </span>
                <ChevronRight size={14} className="text-muted-foreground" />
              </a>
              {/* Report a problem */}
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setShowReportBox((v) => !v);
                    setReportSent(false);
                  }}
                  className="w-full flex items-center justify-between px-4 py-[14px] active:bg-muted/30 transition-colors"
                  data-ocid="settings.report_problem.button"
                >
                  <div className="flex items-center gap-3">
                    <HelpCircle size={15} className="text-muted-foreground" />
                    <span className="text-sm text-foreground">
                      Report a Problem
                    </span>
                  </div>
                  <ChevronRight
                    size={14}
                    className={`text-muted-foreground transition-transform ${showReportBox ? "rotate-90" : ""}`}
                  />
                </button>
                <AnimatePresence>
                  {showReportBox && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-border/50 px-4 pb-4 pt-3"
                    >
                      {reportSent ? (
                        <p className="text-green-400 text-sm text-center py-2 flex items-center justify-center gap-1.5">
                          <Check size={15} /> Thanks! We'll look into it.
                        </p>
                      ) : (
                        <>
                          <textarea
                            ref={reportRef}
                            value={reportText}
                            onChange={(e) => setReportText(e.target.value)}
                            placeholder="Describe the problem…"
                            rows={3}
                            className="w-full bg-background border border-input rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary resize-none placeholder:text-muted-foreground transition-colors"
                            data-ocid="settings.report.textarea"
                          />
                          <button
                            type="button"
                            onClick={handleSendReport}
                            disabled={!reportText.trim()}
                            className="mt-2.5 w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-40 flex items-center justify-center gap-2 transition-opacity"
                            data-ocid="settings.report.submit_button"
                          >
                            <Send size={14} /> Send Report
                          </button>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Section>

            {/* Logout */}
            <motion.button
              type="button"
              onClick={handleLogout}
              whileTap={{ scale: 0.98 }}
              className="w-full settings-section px-4 py-4 flex items-center gap-3 text-destructive active:bg-destructive/5 transition-colors mt-2"
              data-ocid="settings.logout.button"
            >
              <LogOut size={18} />
              <span className="font-semibold text-sm">Log Out</span>
            </motion.button>

            <div className="h-10" />
          </div>
        </div>
      )}
    </motion.div>
  );
}
