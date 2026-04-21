import { Suspense } from "react";
import { Navigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { adminRoutes } from "./adminRoutes";
import { authRoutes } from "./authRoutes";
import { interviewerRoutes } from "./coachRoutes.jsx";
import { candidateRoutes } from "./candidateRoutes.jsx";
import EmptyLayout from "../layouts/EmptyLayout";
import ProtectedRoute from "../../common/components/ProtectedRoute";
import { ROLES } from "../../common/constants/common";
import { lazyWithRetry } from "../../common/utils/lazyWithRetry";
import RouteLoadingFallback from "../../common/components/loaders/RouteLoadingFallback";

const HomePage = lazyWithRetry(() => import("../../features/home/pages/HomePage"), "home-page");
const LandingPage = lazyWithRetry(() => import("../../features/landing/pages/LandingPage"), "landing-page");
const RootPage = lazyWithRetry(() => import("./RootPage"), "root-page");
const CandidateProfilePage = lazyWithRetry(
    () => import("../../features/profiles/candidate/page/CandidateProfilePage.jsx"),
    "candidate-profile-page",
);
const PublicCandidateProfilePage = lazyWithRetry(
    () => import("../../features/profiles/candidate/page/PublicCandidateProfilePage.jsx"),
    "public-candidate-profile-page",
);
const UserProfilePage = lazyWithRetry(() => import("../../features/profile/pages/UserProfilePage"), "user-profile-page");
const InterviewRoomListPage = lazyWithRetry(
    () => import("../../features/interview/pages/InterviewRoomListPage/InterviewRoomListPage"),
    "interview-room-list-page",
);
const InterviewRoomPage = lazyWithRetry(
    () => import("../../features/interview/pages/InterviewRoomPage/InterviewRoomPage"),
    "interview-room-page",
);
const BookingRequestListPage = lazyWithRetry(
    () => import("../../features/interview/pages/BookingRequestPage/BookingRequestListPage"),
    "booking-request-list-page",
);
const BookingRequestDetailPage = lazyWithRetry(
    () => import("../../features/interview/pages/BookingRequestPage/BookingRequestDetailPage"),
    "booking-request-detail-page",
);
const App = lazyWithRetry(() => import("../../App"), "app-page");
const PaymentHistoryPage = lazyWithRetry(
    () => import("../../features/payments/pages/PaymentHistoryPage.jsx"),
    "payment-history-page",
);
const InterviewQuestionsPage = lazyWithRetry(
    () => import("../../features/interviewQuestions/page/InterviewQuestionsPage/InterviewQuestionsPage.jsx"),
    "interview-questions-page",
);
const QuestionDetailPage = lazyWithRetry(
    () => import("../../features/interviewQuestions/page/QuestionDetailPage/QuestionDetailPage.jsx"),
    "question-detail-page",
);
const ShareExperiencePage = lazyWithRetry(
    () => import("../../features/interviewQuestions/page/ShareExperiencePage/ShareExperiencePage.jsx"),
    "share-experience-page",
);
const SavedQuestionsPage = lazyWithRetry(
    () => import("../../features/interviewQuestions/page/SavedQuestionsPage/SavedQuestionsPage.jsx"),
    "saved-questions-page",
);
const PublicProfilePage = lazyWithRetry(
    () => import("../../features/profiles/page/PublicProfilePage.jsx"),
    "public-profile-page",
);

const renderLazy = (LazyComponent, props = {}) => (
    <Suspense fallback={<RouteLoadingFallback />}>
        <LazyComponent {...props} />
    </Suspense>
);

export const routes = [
    { path: "/", element: renderLazy(RootPage) },
    { path: "/landing", element: renderLazy(LandingPage) },

    // Auth routes
    { element: <EmptyLayout />, children: authRoutes },

    // Home page (public)
    { element: <MainLayout />, children: [{ path: "/home", element: renderLazy(HomePage) }] },

    // Questions pages (public)
    {
        element: <MainLayout />,
        children: [
            { path: "/questions", element: renderLazy(InterviewQuestionsPage) },
            { path: "/questions/share", element: renderLazy(ShareExperiencePage) },
            { path: "/questions/saved", element: renderLazy(SavedQuestionsPage) },
            { path: "/questions/:id", element: renderLazy(QuestionDetailPage) },
        ],
    },

    // Profile route - accessible by all authenticated users
    {
        element: (
            <ProtectedRoute allowedRoles={[ROLES.CANDIDATE, ROLES.COACH, ROLES.ADMIN]}>
                <MainLayout />
            </ProtectedRoute>
        ),
        children: [
            { path: "/user/profile", element: renderLazy(UserProfilePage) },
            { path: "/settings", element: renderLazy(UserProfilePage) },
        ],
    },

    // Payment history page (candidate & coach)
    {
        element: (
            <ProtectedRoute allowedRoles={[ROLES.CANDIDATE, ROLES.INTERVIEWER]}>
                <MainLayout />
            </ProtectedRoute>
        ),
        children: [{ path: "/payment-history", element: renderLazy(PaymentHistoryPage) }],
    },

    {
        element: (
            <ProtectedRoute allowedRoles={[ROLES.CANDIDATE, ROLES.INTERVIEWER]}>
                <EmptyLayout />
            </ProtectedRoute>
        ),
        children: [
            { path: "/", element: renderLazy(App) },

            { path: "/interview", element: renderLazy(InterviewRoomListPage) },
            {
                path: "/interview",
                element: <MainLayout />,
                children: [{ index: true, element: renderLazy(InterviewRoomListPage) }],
            },
            { path: "/interview/room/:roomId", element: renderLazy(InterviewRoomPage) },
        ],
    },

    // Booking requests (accessible by both candidate and coach)
    {
        element: (
            <ProtectedRoute allowedRoles={[ROLES.CANDIDATE, ROLES.INTERVIEWER]}>
                <MainLayout />
            </ProtectedRoute>
        ),
        children: [
            { path: "/booking-requests", element: renderLazy(BookingRequestListPage) },
            { path: "/booking-requests/:id", element: renderLazy(BookingRequestDetailPage) },
        ],
    },

    // Public routes
    {
        element: <MainLayout />,
        children: [{ path: "/profile/:slugProfileUrl", element: renderLazy(PublicProfilePage) }],
    },

    // Candidate specific routes
    {
        element: (
            <ProtectedRoute allowedRoles={[ROLES.CANDIDATE]}>
                <MainLayout />
            </ProtectedRoute>
        ),
        children: [...candidateRoutes, { path: "/candidate/profile", element: renderLazy(CandidateProfilePage) }],
    },
    {
        element: (
            <ProtectedRoute allowedRoles={[ROLES.CANDIDATE, ROLES.INTERVIEWER]}>
                <MainLayout />
            </ProtectedRoute>
        ),
        children: [{ path: "/candidate/profile/:profileUrl", element: renderLazy(PublicCandidateProfilePage) }],
    },
    {
        element: (
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                <MainLayout />
            </ProtectedRoute>
        ),
        children: adminRoutes,
    },

    // Interviewer specific routes
    {
        element: (
            <ProtectedRoute allowedRoles={[ROLES.INTERVIEWER]}>
                <MainLayout />
            </ProtectedRoute>
        ),
        children: interviewerRoutes,
    },
];
