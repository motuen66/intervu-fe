import { Navigate } from "react-router-dom";
import AdminDashboard from "../../features/admin/pages/AdminDashboard";
import UserManagementPage from "../../features/admin/pages/UserManagementPage";
import CompanyManagementPage from "../../features/admin/pages/CompanyManagementPage";
import AdminEmptyPage from "../../features/admin/pages/AdminEmptyPage";
import AdminInterviewsPage from "../../features/admin/pages/AdminInterviewsPage";

export const adminRoutes = [
    { path: "/admin", element: <Navigate to="/admin/dashboard" replace /> },
    { path: "/admin/dashboard", element: <AdminDashboard /> },
    { path: "/admin/schedules", element: <AdminEmptyPage /> },
    { path: "/admin/interviews", element: <AdminInterviewsPage /> },
    { path: "/admin/users", element: <UserManagementPage /> },
    { path: "/admin/companies", element: <CompanyManagementPage /> },
    { path: "/admin/question-bank", element: <AdminEmptyPage /> },
    { path: "/admin/income/earnings", element: <AdminEmptyPage /> },
    { path: "/admin/income/refunds", element: <AdminEmptyPage /> },
    { path: "/admin/income/payouts", element: <AdminEmptyPage /> },
    { path: "/admin/reports", element: <AdminEmptyPage /> },
];
