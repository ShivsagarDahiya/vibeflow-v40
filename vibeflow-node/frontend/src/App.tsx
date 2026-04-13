import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { Suspense, lazy } from "react";
import Layout from "@/components/Layout";
import AuthGuard from "@/components/AuthGuard";
import { SkeletonLoader } from "@/components/SkeletonLoader";
import LoginPage from "@/pages/LoginPage";

// Lazy-load all page components for performance
const FeedPage = lazy(() => import("@/pages/FeedPage"));
const ExplorePage = lazy(() => import("@/pages/ExplorePage"));
const MatchPage = lazy(() => import("@/pages/MatchPage"));
const InboxPage = lazy(() => import("@/pages/InboxPage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));
const UserPage = lazy(() => import("@/pages/UserPage"));
const ChatPage = lazy(() => import("@/pages/ChatPage"));
const HashtagPage = lazy(() => import("@/pages/HashtagPage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const SearchResultsPage = lazy(() => import("@/pages/SearchResultsPage"));
const EditProfilePage = lazy(() => import("@/pages/EditProfilePage"));
const UserProfilePage = lazy(() => import("@/pages/UserProfilePage"));
const LiveRoomPage = lazy(() => import("@/pages/LiveRoomPage"));

function PageFallback() {
  return (
    <div className="flex-1 flex flex-col gap-3 p-4 pt-safe">
      <SkeletonLoader variant="video-card" />
      <SkeletonLoader variant="video-card" />
    </div>
  );
}

export default function App() {
  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "#1e1e2a",
            color: "#f5f5f7",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "12px",
            fontFamily: "Inter, sans-serif",
          },
        }}
      />

      <Routes>
        {/* Public route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected routes wrapped in Layout */}
        <Route
          element={
            <AuthGuard>
              <Layout />
            </AuthGuard>
          }
        >
          <Route
            path="/"
            element={
              <Suspense fallback={<PageFallback />}>
                <FeedPage />
              </Suspense>
            }
          />
          <Route
            path="/explore"
            element={
              <Suspense fallback={<PageFallback />}>
                <ExplorePage />
              </Suspense>
            }
          />
          <Route
            path="/match"
            element={
              <Suspense fallback={<PageFallback />}>
                <MatchPage />
              </Suspense>
            }
          />
          <Route
            path="/inbox"
            element={
              <Suspense fallback={<PageFallback />}>
                <InboxPage />
              </Suspense>
            }
          />
          <Route
            path="/profile"
            element={
              <Suspense fallback={<PageFallback />}>
                <ProfilePage />
              </Suspense>
            }
          />
          <Route
            path="/user/:id"
            element={
              <Suspense fallback={<PageFallback />}>
                <UserProfilePage />
              </Suspense>
            }
          />
          <Route
            path="/chat/:id"
            element={
              <Suspense fallback={<PageFallback />}>
                <ChatPage />
              </Suspense>
            }
          />
          <Route
            path="/hashtag/:tag"
            element={
              <Suspense fallback={<PageFallback />}>
                <HashtagPage />
              </Suspense>
            }
          />
          <Route
            path="/settings"
            element={
              <Suspense fallback={<PageFallback />}>
                <SettingsPage />
              </Suspense>
            }
          />
          <Route path="/search" element={<Suspense fallback={<PageFallback />}><SearchResultsPage /></Suspense>} />
          <Route path="/edit-profile" element={<Suspense fallback={<PageFallback />}><EditProfilePage /></Suspense>} />
          <Route path="/live/:id" element={<Suspense fallback={<PageFallback />}><LiveRoomPage /></Suspense>} />
          <Route path="/live" element={<Suspense fallback={<PageFallback />}><LiveRoomPage /></Suspense>} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
