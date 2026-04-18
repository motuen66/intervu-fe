import { Navigate } from "react-router-dom";
import AdminDashboard from "../../features/admin/pages/AdminDashboardPage/AdminDashboardPage";
import UserManagementPage from "../../features/admin/pages/UserManagementPage";
import AdminCandidatesPage from "../../features/admin/pages/AdminCandidatesPage";
import AdminCoachesPage from "../../features/admin/pages/AdminCoachesPage";
import CompanyManagementPage from "../../features/admin/pages/CompanyManagementPage";
import AdminEmptyPage from "../../features/admin/pages/AdminEmptyPage";
import AdminTransactionsPage from "../../features/admin/pages/AdminTransactionsPage";
import AdminInterviewsPage from "../../features/admin/pages/AdminInterviewsPage";
import AdminReportsPage from "../../features/admin/pages/AdminReportsPage";
import { AdminRoomReportsPage } from "../../features/admin/pages/AdminRoomReportsPage";
import AdminQuestionBankPage from "../../features/admin/pages/AdminQuestionBankPage";
import ProblemResolutionDetail from "../../features/admin/pages/ProblemResolutionDetail";
import AdminPineconeManagementPage from "../../features/admin/pages/AdminPineconeManagementPage/AdminPineconeManagementPage";
import PythonServiceMonitorPage from "../../features/admin/pages/PythonServiceMonitorPage/PythonServiceMonitorPage";

export const adminRoutes = [
    { path: "/admin", element: <Navigate to="/admin/dashboard" replace /> },
    { path: "/admin/dashboard", element: <AdminDashboard /> },
    { path: "/admin/schedules", element: <AdminEmptyPage /> },
    { path: "/admin/interviews", element: <AdminInterviewsPage /> },
    // Users sub-section
    { path: "/admin/users", element: <Navigate to="/admin/users/candidates" replace /> },
    { path: "/admin/users/all", element: <UserManagementPage /> },
    { path: "/admin/users/candidates", element: <AdminCandidatesPage /> },
    { path: "/admin/users/coaches", element: <AdminCoachesPage /> },
    // Other pages
    { path: "/admin/companies", element: <CompanyManagementPage /> },
    { path: "/admin/question-bank", element: <AdminQuestionBankPage /> },
    { path: "/admin/income", element: <Navigate to="/admin/income/earnings" replace /> },
    {
        path: "/admin/income/earnings",
        element: (
            <AdminTransactionsPage
                filterType="Payment"
                filterStatus="Paid"
                title="Earnings"
                subtitle="Completed payments received from candidates."
            />
        ),
    },
    {
        path: "/admin/income/refunds",
        element: (
            <AdminTransactionsPage
                filterType="Refund"
                title="Refunds"
                subtitle="Refund transactions issued to candidates."
            />
        ),
    },
    {
        path: "/admin/income/payouts",
        element: (
            <AdminTransactionsPage
                filterType="Payout"
                filterStatus="Paid"
                title="Payouts"
                subtitle="Completed payouts disbursed to coaches."
            />
        ),
    },
    {
        path: "/admin/income/withdrawals",
        element: (
            <AdminTransactionsPage
                filterType="Payout"
                filterStatus="PendingPayout"
                title="Withdrawal Requests"
                subtitle="Coaches awaiting payout for completed sessions."
            />
        ),
    },
    { path: "/admin/reports", element: <Navigate to="/admin/reports/question" replace /> },
    { path: "/admin/reports/room", element: <AdminRoomReportsPage /> },
    { path: "/admin/reports/room/:roomId", element: <ProblemResolutionDetail /> },
    { path: "/admin/reports/question", element: <AdminReportsPage /> },
    // System Management
    { path: "/admin/system", element: <Navigate to="/admin/system/pinecone" replace /> },
    { path: "/admin/system/pinecone", element: <AdminPineconeManagementPage /> },
    { path: "/admin/system/ai-services", element: <Navigate to="/admin/system/python-ai-monitor" replace /> },
    { path: "/admin/system/python-ai-monitor", element: <PythonServiceMonitorPage /> },
];

