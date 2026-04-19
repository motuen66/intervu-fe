import { lazy, Suspense } from "react";
import { Navigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { adminRoutes } from "./adminRoutes";
import { authRoutes } from "./authRoutes";
import { interviewerRoutes } from "./coachRoutes.jsx";
import { candidateRoutes } from "./candidateRoutes.jsx";
import EmptyLayout from "../layouts/EmptyLayout";
import ProtectedRoute from "../../common/components/ProtectedRoute";
import { ROLES } from "../../common/constants/common";

const HomePage = lazy(() => import("../../features/home/pages/HomePage"));
const LandingPage = lazy(() => import("../../features/landing/pages/LandingPage"));
const RootPage = lazy(() => import("./RootPage"));
const CandidateProfilePage = lazy(() => import("../../features/profiles/candidate/page/CandidateProfilePage.jsx"));
const PublicCandidateProfilePage = lazy(
    () => import("../../features/profiles/candidate/page/PublicCandidateProfilePage.jsx"),
);
const UserProfilePage = lazy(() => import("../../features/profile/pages/UserProfilePage"));
const InterviewRoomListPage = lazy(
    () => import("../../features/interview/pages/InterviewRoomListPage/InterviewRoomListPage"),
);
const InterviewRoomPage = lazy(() => import("../../features/interview/pages/InterviewRoomPage/InterviewRoomPage"));
const BookingRequestListPage = lazy(
    () => import("../../features/interview/pages/BookingRequestPage/BookingRequestListPage"),
);
const BookingRequestDetailPage = lazy(
    () => import("../../features/interview/pages/BookingRequestPage/BookingRequestDetailPage"),
);
const App = lazy(() => import("../../App"));
const PaymentHistoryPage = lazy(() => import("../../features/payments/pages/PaymentHistoryPage.jsx"));
const InterviewQuestionsPage = lazy(
    () => import("../../features/interviewQuestions/page/InterviewQuestionsPage/InterviewQuestionsPage.jsx"),
);
const QuestionDetailPage = lazy(
    () => import("../../features/interviewQuestions/page/QuestionDetailPage/QuestionDetailPage.jsx"),
);
const ShareExperiencePage = lazy(
    () => import("../../features/interviewQuestions/page/ShareExperiencePage/ShareExperiencePage.jsx"),
);
const SavedQuestionsPage = lazy(
    () => import("../../features/interviewQuestions/page/SavedQuestionsPage/SavedQuestionsPage.jsx"),
);
const PublicProfilePage = lazy(() => import("../../features/profiles/page/PublicProfilePage.jsx"));
const DesignSystemSandbox = import.meta.env.VITE_SHOW_DESIGN_SYSTEM === 'true'
  ? lazy(() => import("../../features/design-system/pages/DesignSystemSandbox"))
  : null;

const renderLazy = (LazyComponent, props = {}) => (
    <Suspense fallback={null}>
        <LazyComponent {...props} />
    </Suspense>
);

export const routes = [
    { path: "/", element: renderLazy(RootPage) },
    { path: "/landing", element: renderLazy(LandingPage) },
    ...(DesignSystemSandbox ? [{ path: "/design-system", element: renderLazy(DesignSystemSandbox) }] : []),

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
