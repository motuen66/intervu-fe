import ProtectedRoute from "../../common/components/ProtectedRoute";
import LoginPage from "../../features/auth/pages/LoginPage/LoginPage";
import SignUpPage from "../../features/auth/pages/SignUpPage";
import Test from "../../features/test/pages/Test";
import ResetPassword from "../../features/auth/pages/ForgotPassword/ResetPassword";
import ForgotPassword from "../../features/auth/pages/ForgotPassword/ForgotPassword";

export const authRoutes = [
    { path: "/login", element: <LoginPage /> },
    { path: "/signup", element: <SignUpPage /> },
    { path: "/forgot-password", element: <ForgotPassword /> },
    { path: "/reset-password", element: <ResetPassword /> },
    { path: "/test/:id", element: <Test /> },
    {
        element: <ProtectedRoute />,
        children: [{ path: "/path", element: null }],
    },
];
