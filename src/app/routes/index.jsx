import MainLayout from "../layouts/MainLayout";
import { adminRoutes } from "./adminRoutes";
import { authRoutes } from "./authRoutes";
import { interviewerRoutes } from "./interviewerRoutes";
import { intervieweeRoutes } from "./intervieweeRoutes";
import { Navigate } from "react-router-dom";
import PublicInterviewerProfilePage from "../../features/profiles/interviewer/page/PublicInterviewerProfilePage/PublicInterviewerProfilePage";
import EmptyLayout from "../layouts/EmptyLayout";
import ProtectedRoute from "../../common/components/ProtectedRoute";
import { ROLES } from "../../common/constants/common";
import HomePage from "../../features/home/pages/HomePage";
import InterviewerProfilePage from "../../features/profiles/interviewer/page/InterviewerProfilePage";
import UserProfilePage from "../../features/profile/pages/UserProfilePage";
import InterviewRoomListPage from "../../features/interview/pages/InterviewRoomListPage/InterviewRoomListPage";
import InterviewRoomPage from "../../features/interview/pages/InterviewRoomPage/InterviewRoomPage";
import AdminDashboard from "../../features/admin/pages/AdminDashboard";
import AuthLayout from "../layouts/AuthLayout";
import DefaultLayout from "../layouts/DefaultLayout";
import { authRoutes } from "./authRoutes";

export const routes = [
    { path: "/", element: <Navigate to="/home" replace /> },

    // Auth routes
    { element: <EmptyLayout />, children: authRoutes },

    // Home page (public)
    { element: <MainLayout />, children: [{ path: "/home", element: <HomePage /> }] },

    // Profile route - accessible by all authenticated users
    {
        element: (
            <ProtectedRoute allowedRoles={[ROLES.INTERVIEWEE, ROLES.INTERVIEWER, ROLES.ADMIN]}>
                <MainLayout />
            </ProtectedRoute>
        ),
        children: [{ path: "/user/profile", element: <UserProfilePage /> }],
    },

    {
        element: (
            <ProtectedRoute allowedRoles={[ROLES.INTERVIEWEE, ROLES.INTERVIEWER]}>
                <EmptyLayout />
            </ProtectedRoute>
        ),
        children: [
            { path: "/", element: <App /> },
            { path: "/admin", element: <AdminDashboard /> },
            { path: "/interview", element: <InterviewRoomListPage /> },
            { path: "/interview", element: <MainLayout />, children: [{ index: true, element: <InterviewRoomListPage /> }] },
            { path: "/interview/room/:roomId", element: <InterviewRoomPage /> },
        ],
    },

    // Public routes
    {
        element: <MainLayout />,
        children: [{ path: "/interviewer/:id", element: <PublicInterviewerProfilePage /> }],
    },

    // Interviewee specific routes
    {
        element: (
            <ProtectedRoute allowedRoles={[ROLES.INTERVIEWEE]}>
                <MainLayout />
            </ProtectedRoute>
        ),
        children: [...intervieweeRoutes, { path: "/profile/:id", element: <InterviewerProfilePage /> }],
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
