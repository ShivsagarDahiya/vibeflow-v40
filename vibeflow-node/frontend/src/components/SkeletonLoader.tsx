import { cn } from "@/lib/utils";

type SkeletonVariant =
  | "video-card"
  | "story-circle"
  | "profile-card"
  | "chat-row"
  | "notification-row"
  | "match-card"
  | "text"
  | "avatar"
  | "thumbnail";

interface SkeletonLoaderProps {
  variant?: SkeletonVariant;
  className?: string;
  count?: number;
}

function SkeletonBase({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "skeleton rounded-lg",
        "bg-surface",
        className
      )}
    />
  );
}

function VideoCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-4">
      <SkeletonBase className="w-full aspect-[9/16] rounded-2xl" />
      <div className="flex items-center gap-3">
        <SkeletonBase className="w-10 h-10 rounded-full flex-shrink-0" />
        <div className="flex-1 flex flex-col gap-2">
          <SkeletonBase className="h-3.5 w-2/3 rounded-full" />
          <SkeletonBase className="h-3 w-1/2 rounded-full" />
        </div>
      </div>
    </div>
  );
}

function StoryCircleSkeleton() {
  return (
    <div className="flex flex-col items-center gap-1.5 flex-shrink-0 w-16">
      <SkeletonBase className="w-14 h-14 rounded-full" />
      <SkeletonBase className="h-2.5 w-10 rounded-full" />
    </div>
  );
}

function ProfileCardSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Cover */}
      <SkeletonBase className="w-full h-40 rounded-2xl" />
      {/* Avatar + Stats */}
      <div className="flex items-end gap-4 -mt-10 px-2">
        <SkeletonBase className="w-20 h-20 rounded-full border-4 border-dark flex-shrink-0" />
        <div className="flex gap-4 pb-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <SkeletonBase className="h-5 w-10 rounded-md" />
              <SkeletonBase className="h-3 w-14 rounded-full" />
            </div>
          ))}
        </div>
      </div>
      {/* Name & Bio */}
      <div className="px-2 flex flex-col gap-2">
        <SkeletonBase className="h-5 w-40 rounded-full" />
        <SkeletonBase className="h-3.5 w-full rounded-full" />
        <SkeletonBase className="h-3.5 w-3/4 rounded-full" />
      </div>
      {/* Buttons */}
      <div className="flex gap-2 px-2">
        <SkeletonBase className="h-10 flex-1 rounded-full" />
        <SkeletonBase className="h-10 flex-1 rounded-full" />
      </div>
    </div>
  );
}

function ChatRowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <SkeletonBase className="w-12 h-12 rounded-full flex-shrink-0" />
      <div className="flex-1 flex flex-col gap-2 min-w-0">
        <div className="flex items-center justify-between">
          <SkeletonBase className="h-3.5 w-28 rounded-full" />
          <SkeletonBase className="h-3 w-10 rounded-full" />
        </div>
        <SkeletonBase className="h-3 w-3/4 rounded-full" />
      </div>
    </div>
  );
}

function NotificationRowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <SkeletonBase className="w-10 h-10 rounded-full flex-shrink-0" />
      <div className="flex-1 flex flex-col gap-2 min-w-0">
        <SkeletonBase className="h-3.5 w-full rounded-full" />
        <SkeletonBase className="h-3 w-2/3 rounded-full" />
      </div>
      <SkeletonBase className="w-12 h-12 rounded-lg flex-shrink-0" />
    </div>
  );
}

function MatchCardSkeleton() {
  return (
    <div className="relative w-full max-w-sm mx-auto">
      <SkeletonBase className="w-full aspect-[3/4] rounded-4xl" />
      <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col gap-2">
        <SkeletonBase className="h-6 w-40 rounded-full" />
        <SkeletonBase className="h-4 w-56 rounded-full" />
        <div className="flex gap-2 mt-2">
          {[0, 1, 2].map((i) => (
            <SkeletonBase key={i} className="h-7 w-16 rounded-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

function TextSkeleton() {
  return (
    <div className="flex flex-col gap-2 p-2">
      <SkeletonBase className="h-4 w-full rounded-full" />
      <SkeletonBase className="h-4 w-5/6 rounded-full" />
      <SkeletonBase className="h-4 w-4/5 rounded-full" />
    </div>
  );
}

function AvatarSkeleton() {
  return <SkeletonBase className="w-10 h-10 rounded-full" />;
}

function ThumbnailSkeleton() {
  return <SkeletonBase className="w-full aspect-video rounded-xl" />;
}

const variantMap: Record<SkeletonVariant, React.ComponentType> = {
  "video-card": VideoCardSkeleton,
  "story-circle": StoryCircleSkeleton,
  "profile-card": ProfileCardSkeleton,
  "chat-row": ChatRowSkeleton,
  "notification-row": NotificationRowSkeleton,
  "match-card": MatchCardSkeleton,
  text: TextSkeleton,
  avatar: AvatarSkeleton,
  thumbnail: ThumbnailSkeleton,
};

export function SkeletonLoader({
  variant = "text",
  className,
  count = 1,
}: SkeletonLoaderProps) {
  const Component = variantMap[variant];
  return (
    <div className={cn("animate-fade-in", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Component key={i} />
      ))}
    </div>
  );
}

export default SkeletonLoader;
