import { lazy, Suspense } from "react";
import { Navigate } from "react-router-dom";

const AdminDashboard = lazy(() => import("../../features/admin/pages/AdminDashboardPage/AdminDashboardPage"));
const UserManagementPage = lazy(() => import("../../features/admin/pages/UserManagementPage"));
const AdminCandidatesPage = lazy(() => import("../../features/admin/pages/AdminCandidatesPage"));
const AdminCoachesPage = lazy(() => import("../../features/admin/pages/AdminCoachesPage"));
const CompanyManagementPage = lazy(() => import("../../features/admin/pages/CompanyManagementPage"));
const AdminEmptyPage = lazy(() => import("../../features/admin/pages/AdminEmptyPage"));
const AdminTransactionsPage = lazy(() => import("../../features/admin/pages/AdminTransactionsPage"));
const AdminInterviewsPage = lazy(() => import("../../features/admin/pages/AdminInterviewsPage"));
const AdminReportsPage = lazy(() => import("../../features/admin/pages/AdminReportsPage"));
const AdminRoomReportsPage = lazy(() =>
    import("../../features/admin/pages/AdminRoomReportsPage").then((module) => ({
        default: module.AdminRoomReportsPage,
    })),
);
const AdminQuestionBankPage = lazy(() => import("../../features/admin/pages/AdminQuestionBankPage"));
const ProblemResolutionDetail = lazy(() => import("../../features/admin/pages/ProblemResolutionDetail"));
const AdminPineconeManagementPage = lazy(() =>
    import("../../features/admin/pages/AdminPineconeManagementPage/AdminPineconeManagementPage"),
);
const PythonServiceMonitorPage = lazy(() =>
    import("../../features/admin/pages/PythonServiceMonitorPage/PythonServiceMonitorPage"),
);
const AdminBroadcastPage = lazy(() => import("../../features/admin/pages/AdminBroadcastPage"));
const AdminPlatformSettingsPage = lazy(() => import("../../features/admin/pages/AdminPlatformSettingsPage"));

const renderLazy = (LazyComponent, props = {}) => (
    <Suspense fallback={null}>
        <LazyComponent {...props} />
    </Suspense>
);

export const adminRoutes = [
    { path: "/admin", element: <Navigate to="/admin/dashboard" replace /> },
    { path: "/admin/dashboard", element: renderLazy(AdminDashboard) },
    { path: "/admin/schedules", element: renderLazy(AdminEmptyPage) },
    { path: "/admin/interviews", element: renderLazy(AdminInterviewsPage) },
    // Users sub-section
    { path: "/admin/users", element: <Navigate to="/admin/users/candidates" replace /> },
    { path: "/admin/users/all", element: renderLazy(UserManagementPage) },
    { path: "/admin/users/candidates", element: renderLazy(AdminCandidatesPage) },
    { path: "/admin/users/coaches", element: renderLazy(AdminCoachesPage) },
    // Other pages
    { path: "/admin/companies", element: renderLazy(CompanyManagementPage) },
    { path: "/admin/question-bank", element: renderLazy(AdminQuestionBankPage) },
    { path: "/admin/income", element: <Navigate to="/admin/income/earnings" replace /> },
    {
        path: "/admin/income/earnings",
        element: renderLazy(AdminTransactionsPage, {
            filterType: "Payment",
            filterStatus: "Paid",
            title: "Earnings",
            subtitle: "Completed payments received from candidates.",
        }),
    },
    {
        path: "/admin/income/refunds",
        element: renderLazy(AdminTransactionsPage, {
            filterType: "Refund",
            title: "Refunds",
            subtitle: "Refund transactions issued to candidates.",
        }),
    },
    {
        path: "/admin/income/payouts",
        element: renderLazy(AdminTransactionsPage, {
            filterType: "Payout",
            filterStatus: "Paid",
            title: "Payouts",
            subtitle: "Completed payouts disbursed to coaches.",
        }),
    },
    {
        path: "/admin/income/withdrawals",
        element: renderLazy(AdminTransactionsPage, {
            filterType: "Payout",
            filterStatus: "PendingPayout",
            title: "Withdrawal Requests",
            subtitle: "Coaches awaiting payout for completed sessions.",
        }),
    },
    { path: "/admin/reports", element: <Navigate to="/admin/reports/question" replace /> },
    { path: "/admin/reports/room", element: renderLazy(AdminRoomReportsPage) },
    { path: "/admin/reports/room/:roomId", element: renderLazy(ProblemResolutionDetail) },
    { path: "/admin/reports/question", element: renderLazy(AdminReportsPage) },
    // System Management
    { path: "/admin/system", element: <Navigate to="/admin/system/pinecone" replace /> },
    { path: "/admin/system/pinecone", element: renderLazy(AdminPineconeManagementPage) },
    { path: "/admin/system/ai-services", element: <Navigate to="/admin/system/python-ai-monitor" replace /> },
    { path: "/admin/system/python-ai-monitor", element: renderLazy(PythonServiceMonitorPage) },
    { path: "/admin/broadcast", element: renderLazy(AdminBroadcastPage) },
    { path: "/admin/system/platform-settings", element: renderLazy(AdminPlatformSettingsPage) },
];

