import { Suspense } from "react";
import { Navigate } from "react-router-dom";
import { lazyWithRetry } from "../../common/utils/lazyWithRetry";
import RouteLoadingFallback from "../../common/components/loaders/RouteLoadingFallback";

const AdminDashboard = lazyWithRetry(
    () => import("../../features/admin/pages/AdminDashboardPage/AdminDashboardPage"),
    "admin-dashboard-page",
);
const UserManagementPage = lazyWithRetry(
    () => import("../../features/admin/pages/UserManagementPage"),
    "admin-user-management-page",
);
const AdminCandidatesPage = lazyWithRetry(
    () => import("../../features/admin/pages/AdminCandidatesPage"),
    "admin-candidates-page",
);
const AdminCoachesPage = lazyWithRetry(() => import("../../features/admin/pages/AdminCoachesPage"), "admin-coaches-page");
const CompanyManagementPage = lazyWithRetry(
    () => import("../../features/admin/pages/CompanyManagementPage"),
    "admin-company-management-page",
);
const AdminEmptyPage = lazyWithRetry(() => import("../../features/admin/pages/AdminEmptyPage"), "admin-empty-page");
const AdminTransactionsPage = lazyWithRetry(
    () => import("../../features/admin/pages/AdminTransactionsPage"),
    "admin-transactions-page",
);
const AdminInterviewsPage = lazyWithRetry(
    () => import("../../features/admin/pages/AdminInterviewsPage"),
    "admin-interviews-page",
);
const AdminReportsPage = lazyWithRetry(() => import("../../features/admin/pages/AdminReportsPage"), "admin-reports-page");
const AdminRoomReportsPage = lazyWithRetry(() =>
    import("../../features/admin/pages/AdminRoomReportsPage").then((module) => ({
        default: module.AdminRoomReportsPage,
    })),
);
const AdminQuestionBankPage = lazyWithRetry(
    () => import("../../features/admin/pages/AdminQuestionBankPage"),
    "admin-question-bank-page",
);
const ProblemResolutionDetail = lazyWithRetry(
    () => import("../../features/admin/pages/ProblemResolutionDetail"),
    "problem-resolution-detail-page",
);
const AdminPineconeManagementPage = lazyWithRetry(
    () => import("../../features/admin/pages/AdminPineconeManagementPage/AdminPineconeManagementPage"),
    "admin-pinecone-management-page",
);
const PythonServiceMonitorPage = lazyWithRetry(
    () => import("../../features/admin/pages/PythonServiceMonitorPage/PythonServiceMonitorPage"),
    "python-service-monitor-page",
);
const AdminBroadcastPage = lazyWithRetry(
    () => import("../../features/admin/pages/AdminBroadcastPage"),
    "admin-broadcast-page",
);
const AdminPlatformSettingsPage = lazyWithRetry(
    () => import("../../features/admin/pages/AdminPlatformSettingsPage"),
    "admin-platform-settings-page",
);

const renderLazy = (LazyComponent, props = {}) => (
    <Suspense fallback={<RouteLoadingFallback />}>
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
