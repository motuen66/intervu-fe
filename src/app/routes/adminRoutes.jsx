import { lazy, Suspense } from "react";
import { Navigate } from "react-router-dom";

const AdminDashboard = lazy(() => import("../../features/admin/pages/AdminDashboardPage/AdminDashboardPage"));
const UserManagementPage = lazy(() => import("../../features/admin/pages/UserManagementPage"));
const CompanyManagementPage = lazy(() => import("../../features/admin/pages/CompanyManagementPage"));
const AdminEmptyPage = lazy(() => import("../../features/admin/pages/AdminEmptyPage"));
const AdminInterviewsPage = lazy(() => import("../../features/admin/pages/AdminInterviewsPage"));
const AdminReportsPage = lazy(() => import("../../features/admin/pages/AdminReportsPage"));
const AdminRoomReportsPage = lazy(() =>
    import("../../features/admin/pages/AdminRoomReportsPage").then((module) => ({
        default: module.AdminRoomReportsPage,
    })),
);
const AdminQuestionBankPage = lazy(() => import("../../features/admin/pages/AdminQuestionBankPage"));
const ProblemResolutionDetail = lazy(() => import("../../features/admin/pages/ProblemResolutionDetail"));

const renderLazy = (LazyComponent) => (
    <Suspense fallback={null}>
        <LazyComponent />
    </Suspense>
);

export const adminRoutes = [
    { path: "/admin", element: <Navigate to="/admin/dashboard" replace /> },
    { path: "/admin/dashboard", element: renderLazy(AdminDashboard) },
    { path: "/admin/schedules", element: renderLazy(AdminEmptyPage) },
    { path: "/admin/interviews", element: renderLazy(AdminInterviewsPage) },
    { path: "/admin/users", element: renderLazy(UserManagementPage) },
    { path: "/admin/companies", element: renderLazy(CompanyManagementPage) },
    { path: "/admin/question-bank", element: renderLazy(AdminQuestionBankPage) },
    { path: "/admin/income/earnings", element: renderLazy(AdminEmptyPage) },
    { path: "/admin/income/refunds", element: renderLazy(AdminEmptyPage) },
    { path: "/admin/income/payouts", element: renderLazy(AdminEmptyPage) },
    { path: "/admin/reports", element: <Navigate to="/admin/reports/question" replace /> },
    { path: "/admin/reports/room", element: renderLazy(AdminRoomReportsPage) },
    { path: "/admin/reports/room/:roomId", element: renderLazy(ProblemResolutionDetail) },
    { path: "/admin/reports/question", element: renderLazy(AdminReportsPage) },
];
