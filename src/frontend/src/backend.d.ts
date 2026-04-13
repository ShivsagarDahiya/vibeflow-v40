import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Video {
    id: string;
    title: string;
    creator: Principal;
    thumbnailKey: string;
    hashtags: Array<string>;
    views: bigint;
    createdAt: bigint;
    description: string;
    videoKey: string;
}
export interface Duet {
    id: string;
    creator: Principal;
    thumbnailKey: string;
    createdAt: bigint;
    caption: string;
    originalVideoId: string;
    videoKey: string;
}
export interface Comment {
    id: string;
    createdAt: bigint;
    text: string;
    author: Principal;
    videoId: string;
}
export interface Story {
    id: string;
    creator: Principal;
    expiresAt: bigint;
    createdAt: bigint;
    mediaKey: string;
    caption: string;
    mediaType: string;
}
export interface Match {
    id: string;
    createdAt: bigint;
    user1: Principal;
    user2: Principal;
}
export interface CallSignal {
    id: string;
    createdAt: bigint;
    callType: string;
    callee: Principal;
    caller: Principal;
    payload: string;
    signalType: string;
}
export interface StoryComment {
    id: string;
    storyId: string;
    createdAt: bigint;
    text: string;
    author: Principal;
}
export interface Post {
    id: string;
    creator: Principal;
    hashtags: Array<string>;
    createdAt: bigint;
    imageKey: string;
    caption: string;
}
export interface Notification {
    id: string;
    notifType: string;
    createdAt: bigint;
    read: boolean;
    recipient: Principal;
    sender: Principal;
    videoId?: string;
}
export interface Message {
    id: string;
    createdAt: bigint;
    text: string;
    sender: Principal;
    conversationId: string;
}
export interface UserSettings {
    blockedUsers: string;
    theme: string;
    notificationsEnabled: boolean;
    dmPrivacy: string;
    twoFactorEnabled: boolean;
    emailNotifications: boolean;
    showOnlineStatus: boolean;
    contentFilter: string;
    videoQuality: string;
    ageRestriction: boolean;
    language: string;
    isPrivate: boolean;
    muteNotificationSound: boolean;
    activityStatusVisible: boolean;
    pushNotifications: boolean;
    autoPlayVideos: boolean;
    readReceiptsEnabled: boolean;
    blockedHashtags: string;
}
export interface FollowRequest {
    id: string;
    to: Principal;
    from: Principal;
    createdAt: bigint;
}
export interface StoryReaction {
    id: string;
    storyId: string;
    createdAt: bigint;
    user: Principal;
    emoji: string;
}
export interface UserProfile {
    bio: string;
    principal: Principal;
    username: string;
    createdAt: bigint;
    avatarKey: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    acceptFollowRequest(requestId: string): Promise<boolean>;
    addComment(videoId: string, text: string): Promise<string>;
    addMessageReaction(messageId: string, emoji: string): Promise<void>;
    addPostComment(postId: string, text: string): Promise<string>;
    addStoryComment(storyId: string, text: string): Promise<string>;
    addStoryReaction(storyId: string, emoji: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    cancelFollowRequest(target: Principal): Promise<void>;
    clearCallSignals(signalIds: Array<string>): Promise<void>;
    createDuet(originalVideoId: string, videoKey: string, thumbnailKey: string, caption: string): Promise<string>;
    createStory(mediaKey: string, mediaType: string, caption: string): Promise<string>;
    declineFollowRequest(requestId: string): Promise<boolean>;
    deleteComment(commentId: string): Promise<boolean>;
    deleteDuet(id: string): Promise<boolean>;
    deletePost(id: string): Promise<boolean>;
    deleteReelDraft(draftId: string): Promise<boolean>;
    deleteStory(id: string): Promise<boolean>;
    deleteStoryComment(commentId: string): Promise<boolean>;
    deleteVideo(id: string): Promise<boolean>;
    didCallerLike(videoId: string): Promise<boolean>;
    didCallerLikePost(postId: string): Promise<boolean>;
    followUser(target: Principal): Promise<void>;
    getActiveStories(): Promise<Array<Story>>;
    getActivityStatus(user: Principal): Promise<string>;
    getAllUsers(): Promise<Array<UserProfile>>;
    getCallSignals(fromPrincipal: Principal | null): Promise<Array<CallSignal>>;
    getCallerUserRole(): Promise<UserRole>;
    getCandidateDetails(target: Principal): Promise<{
        postCount: bigint;
        videoCount: bigint;
        mutualCount: bigint;
        followerCount: bigint;
        followingCount: bigint;
    }>;
    getComments(videoId: string): Promise<Array<Comment>>;
    getConversations(): Promise<Array<{
        lastMessageText: string;
        lastMessageAt: bigint;
        otherPrincipal: Principal;
    }>>;
    getCoverPhoto(p: Principal): Promise<string | null>;
    getDuetsByVideo(videoId: string): Promise<Array<Duet>>;
    getFeed(offset: bigint, limit: bigint): Promise<Array<Video>>;
    getFollowers(p: Principal): Promise<Array<Principal>>;
    getFollowing(p: Principal): Promise<Array<Principal>>;
    getFollowingFeed(p: Principal, offset: bigint, limit: bigint): Promise<Array<Video>>;
    getLeaderboard(): Promise<Array<{
        principal: Principal;
        username: string;
        videoCount: bigint;
        totalViews: bigint;
        followerCount: bigint;
    }>>;
    getLikeCount(videoId: string): Promise<bigint>;
    getLikedVideos(): Promise<Array<Video>>;
    getMatches(): Promise<Array<Match>>;
    getMessageReactions(messageId: string): Promise<Array<{
        sender: Principal;
        emoji: string;
    }>>;
    getMessages(other: Principal): Promise<Array<Message>>;
    getMutualFollowCount(other: Principal): Promise<bigint>;
    getMutualFollowProfiles(other: Principal): Promise<Array<UserProfile>>;
    getMyStoryReaction(storyId: string): Promise<StoryReaction | null>;
    getNotifications(): Promise<Array<Notification>>;
    getPendingFollowRequests(): Promise<Array<FollowRequest>>;
    getPhotoPosts(offset: bigint, limit: bigint): Promise<Array<Post>>;
    getPinnedMessages(otherPrincipal: Principal): Promise<Array<Message>>;
    getPinnedVideo(p: Principal): Promise<Video | null>;
    getPopularFeed(offset: bigint, limit: bigint): Promise<Array<Video>>;
    getPostById(id: string): Promise<Post | null>;
    getPostComments(postId: string): Promise<Array<Comment>>;
    getPostLikeCount(postId: string): Promise<bigint>;
    getPotentialMatches(): Promise<Array<UserProfile>>;
    getProfile(p: Principal): Promise<UserProfile | null>;
    getReelAnalytics(videoId: string): Promise<{
        shares: bigint;
        likes: bigint;
        saves: bigint;
        comments: bigint;
        plays: bigint;
    }>;
    getReelDrafts(): Promise<Array<{
        id: string;
        title: string;
        thumbnailKey: string;
        hashtags: string;
        createdAt: bigint;
        description: string;
        videoKey: string;
    }>>;
    getSavedVideos(): Promise<Array<Video>>;
    getStoriesByUser(p: Principal): Promise<Array<Story>>;
    getStoryComments(storyId: string): Promise<Array<StoryComment>>;
    getStoryReactions(storyId: string): Promise<Array<StoryReaction>>;
    getTrendingFeed(offset: bigint, limit: bigint): Promise<Array<Video>>;
    getTrendingHashtags(): Promise<Array<{
        tag: string;
        count: bigint;
    }>>;
    getUserDuets(p: Principal): Promise<Array<Duet>>;
    getUserPhotos(p: Principal): Promise<Array<Post>>;
    getUserSettings(): Promise<UserSettings>;
    getUserStats(p: Principal): Promise<{
        videoCount: bigint;
        followerCount: bigint;
        followingCount: bigint;
    }>;
    getUserVideos(p: Principal): Promise<Array<Video>>;
    getVideoById(id: string): Promise<Video | null>;
    getViewedStoryIds(): Promise<Array<string>>;
    hasPendingFollowRequest(target: Principal): Promise<boolean>;
    hasUnviewedStories(p: Principal): Promise<boolean>;
    hideVideo(videoId: string): Promise<void>;
    incrementView(id: string): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    isMatch(other: Principal): Promise<boolean>;
    isVideoSaved(videoId: string): Promise<boolean>;
    likePost(postId: string): Promise<void>;
    likeVideo(videoId: string): Promise<void>;
    markNotificationsRead(): Promise<void>;
    pinMessage(messageId: string): Promise<void>;
    pinVideo(videoId: string): Promise<boolean>;
    postPhoto(imageKey: string, caption: string, hashtags: Array<string>): Promise<string>;
    postVideo(title: string, description: string, hashtags: Array<string>, videoKey: string, thumbnailKey: string): Promise<string>;
    registerUser(username: string, bio: string, avatarKey: string): Promise<void>;
    removeStoryReaction(storyId: string): Promise<void>;
    reportVideo(videoId: string, reason: string): Promise<void>;
    saveReelDraft(videoKey: string, thumbnailKey: string, title: string, description: string, hashtags: string): Promise<string>;
    saveVideo(videoId: string): Promise<void>;
    searchPosts(term: string): Promise<Array<Post>>;
    searchUsers(term: string): Promise<Array<UserProfile>>;
    searchVideos(term: string): Promise<Array<Video>>;
    sendFollowRequest(target: Principal): Promise<void>;
    sendMessage(recipient: Principal, text: string): Promise<boolean>;
    storeCallSignal(callee: Principal, signalType: string, payload: string, callType: string): Promise<string>;
    swipeLeft(target: Principal): Promise<void>;
    swipeRight(target: Principal): Promise<boolean>;
    unfollowUser(target: Principal): Promise<void>;
    unhideVideo(videoId: string): Promise<void>;
    unlikePost(postId: string): Promise<void>;
    unlikeVideo(videoId: string): Promise<void>;
    unpinVideo(): Promise<void>;
    unsaveVideo(videoId: string): Promise<void>;
    updateActivityStatus(status: string): Promise<void>;
    updateCoverPhoto(coverPhotoKey: string): Promise<void>;
    updateProfile(username: string, bio: string, avatarKey: string): Promise<void>;
    updateUserSettings(isPrivate: boolean, notificationsEnabled: boolean, theme: string, language: string, contentFilter: string, ageRestriction: boolean, blockedHashtags: string, blockedUsers: string, twoFactorEnabled: boolean, emailNotifications: boolean, pushNotifications: boolean, autoPlayVideos: boolean, videoQuality: string, activityStatusVisible: boolean, readReceiptsEnabled: boolean, muteNotificationSound: boolean, dmPrivacy: string, showOnlineStatus: boolean): Promise<void>;
    updateVideo(id: string, title: string, description: string, hashtags: Array<string>): Promise<boolean>;
    viewStory(id: string): Promise<void>;
}
