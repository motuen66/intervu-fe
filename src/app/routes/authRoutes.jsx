import { lazy, Suspense } from "react";
import ProtectedRoute from "../../common/components/ProtectedRoute";

const LoginPage = lazy(() => import("../../features/auth/pages/LoginPage/LoginPage"));
const SignUpPage = lazy(() => import("../../features/auth/pages/SignUpPage"));
const Test = lazy(() => import("../../features/test/pages/Test"));
const ResetPassword = lazy(() => import("../../features/auth/pages/ForgotPassword/ResetPassword"));
const ForgotPassword = lazy(() => import("../../features/auth/pages/ForgotPassword/ForgotPassword"));

const renderLazy = (LazyComponent) => (
    <Suspense fallback={null}>
        <LazyComponent />
    </Suspense>
);

export const authRoutes = [
    { path: "/login", element: renderLazy(LoginPage) },
    { path: "/signup", element: renderLazy(SignUpPage) },
    { path: "/forgot-password", element: renderLazy(ForgotPassword) },
    { path: "/reset-password", element: renderLazy(ResetPassword) },
    { path: "/test/:id", element: renderLazy(Test) },
    {
        element: <ProtectedRoute />,
        children: [{ path: "/path", element: null }],
    },
];
