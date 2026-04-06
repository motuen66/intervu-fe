import { Navigate } from "react-router-dom";
import AdminDashboard from "../../features/admin/pages/AdminDashboard";
import UserManagementPage from "../../features/admin/pages/UserManagementPage";
import CompanyManagementPage from "../../features/admin/pages/CompanyManagementPage";
import AdminEmptyPage from "../../features/admin/pages/AdminEmptyPage";
import AdminInterviewsPage from "../../features/admin/pages/AdminInterviewsPage";
import AdminReportsPage from "../../features/admin/pages/AdminReportsPage";
import AdminRoomReportsPage from "../../features/admin/pages/AdminRoomReportsPage";
import AdminQuestionBankPage from "../../features/admin/pages/AdminQuestionBankPage";

export const adminRoutes = [
    { path: "/admin", element: <Navigate to="/admin/dashboard" replace /> },
    { path: "/admin/dashboard", element: <AdminDashboard /> },
    { path: "/admin/schedules", element: <AdminEmptyPage /> },
    { path: "/admin/interviews", element: <AdminInterviewsPage /> },
    { path: "/admin/users", element: <UserManagementPage /> },
    { path: "/admin/companies", element: <CompanyManagementPage /> },
    { path: "/admin/question-bank", element: <AdminQuestionBankPage /> },
    { path: "/admin/income/earnings", element: <AdminEmptyPage /> },
    { path: "/admin/income/refunds", element: <AdminEmptyPage /> },
    { path: "/admin/income/payouts", element: <AdminEmptyPage /> },
    { path: "/admin/reports", element: <Navigate to="/admin/reports/questions" replace /> },
    { path: "/admin/reports/questions", element: <AdminReportsPage /> },
    { path: "/admin/reports/rooms", element: <AdminRoomReportsPage /> },
];


