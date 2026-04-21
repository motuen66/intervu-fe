import { Suspense } from "react";
import ProtectedRoute from "../../common/components/ProtectedRoute";
import { lazyWithRetry } from "../../common/utils/lazyWithRetry";
import RouteLoadingFallback from "../../common/components/loaders/RouteLoadingFallback";

const LoginPage = lazyWithRetry(() => import("../../features/auth/pages/LoginPage/LoginPage"), "login-page");
const SignUpPage = lazyWithRetry(() => import("../../features/auth/pages/SignUpPage"), "signup-page");
const Test = lazyWithRetry(() => import("../../features/test/pages/Test"), "test-page");
const ResetPassword = lazyWithRetry(
    () => import("../../features/auth/pages/ForgotPassword/ResetPassword"),
    "reset-password-page",
);
const ForgotPassword = lazyWithRetry(
    () => import("../../features/auth/pages/ForgotPassword/ForgotPassword"),
    "forgot-password-page",
);

const renderLazy = (LazyComponent) => (
    <Suspense fallback={<RouteLoadingFallback />}>
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
