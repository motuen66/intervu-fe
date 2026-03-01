import MainLayout from "../layouts/MainLayout";
import { adminRoutes } from "./adminRoutes";
import { authRoutes } from "./authRoutes";
import { interviewerRoutes } from "./coachRoutes.jsx";
import { candidateRoutes } from "./candidateRoutes.jsx";
import { Navigate } from "react-router-dom";
import PublicInterviewerProfilePage from "../../features/profiles/coach/page/PublicInterviewerProfilePage/PublicInterviewerProfilePage.jsx";
import EmptyLayout from "../layouts/EmptyLayout";
import ProtectedRoute from "../../common/components/ProtectedRoute";
import { ROLES } from "../../common/constants/common";
import HomePage from "../../features/home/pages/HomePage";
import InterviewerProfilePage from "../../features/profiles/coach/page/InterviewerProfilePage.jsx";
import CandidateProfilePage from "../../features/profiles/candidate/page/CandidateProfilePage.jsx";
import UserProfilePage from "../../features/profile/pages/UserProfilePage";
import InterviewRoomListPage from "../../features/interview/pages/InterviewRoomListPage/InterviewRoomListPage";
import InterviewRoomPage from "../../features/interview/pages/InterviewRoomPage/InterviewRoomPage";
import AdminDashboard from "../../features/admin/pages/AdminDashboard";
import App from "../../App";
import InterviewQuestionsPage from "../../features/interviewQuestions/page/InterviewQuestionsPage/InterviewQuestionsPage.jsx";
import QuestionDetailPage from "../../features/interviewQuestions/page/QuestionDetailPage/QuestionDetailPage.jsx";
import ShareExperiencePage from "../../features/interviewQuestions/page/ShareExperiencePage/ShareExperiencePage.jsx";

export const routes = [
    { path: "/", element: <Navigate to="/home" replace /> },

    // Auth routes
    { element: <EmptyLayout />, children: authRoutes },

    // Home page (public)
    { element: <MainLayout />, children: [{ path: "/home", element: <HomePage /> }] },

    // Questions pages (public)
    {
        element: <MainLayout />,
        children: [
            { path: "/questions", element: <InterviewQuestionsPage /> },
            { path: "/questions/share", element: <ShareExperiencePage /> },
            { path: "/questions/:id", element: <QuestionDetailPage /> },
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
            { path: "/user/profile", element: <UserProfilePage /> },
            { path: "/settings", element: <UserProfilePage /> },
        ],
    },

    {
        element: (
            <ProtectedRoute allowedRoles={[ROLES.CANDIDATE, ROLES.INTERVIEWER]}>
                <EmptyLayout />
            </ProtectedRoute>
        ),
        children: [
            { path: "/", element: <App /> },
            { path: "/admin", element: <AdminDashboard /> },
            { path: "/interview", element: <InterviewRoomListPage /> },
            {
                path: "/interview",
                element: <MainLayout />,
                children: [{ index: true, element: <InterviewRoomListPage /> }],
            },
            { path: "/interview/room/:roomId", element: <InterviewRoomPage /> },
        ],
    },

    // Public routes
    {
        element: <MainLayout />,
        children: [{ path: "/profile/:slugProfileUrl", element: <PublicInterviewerProfilePage /> }],
    },

    // Candidate specific routes
    {
        element: (
            <ProtectedRoute allowedRoles={[ROLES.CANDIDATE]}>
                <MainLayout />
            </ProtectedRoute>
        ),
        children: [
            ...candidateRoutes,
            { path: "/candidate/profile", element: <CandidateProfilePage /> },
            { path: "/candidate/profile/:profileUrl", element: <CandidateProfilePage /> },
        ],
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
