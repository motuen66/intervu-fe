import { Suspense } from "react";
import { lazyWithRetry } from "../../common/utils/lazyWithRetry";
import RouteLoadingFallback from "../../common/components/loaders/RouteLoadingFallback";

const ScheduleManagement = lazyWithRetry(
    () => import("../../features/coach/pages/ScheduleManagementPage/ScheduleManagement.jsx"),
    "schedule-management-page",
);
const CoachInterviewServicePage = lazyWithRetry(
    () => import("../../features/coach/pages/CoachInterviewServicePage/CoachInterviewServicePage.jsx"),
    "coach-interview-service-page",
);
const InterviewerProfilePage = lazyWithRetry(
    () => import("../../features/profiles/coach/page/InterviewerProfilePage.jsx"),
    "interviewer-profile-page",
);
const CandidateProfilePage = lazyWithRetry(
    () => import("../../features/profiles/candidate/page/CandidateProfilePage.jsx"),
    "candidate-profile-for-coach-page",
);
const CoachDashboardPage = lazyWithRetry(
    () => import("../../features/coach/pages/CoachDashboardPage/CoachDashboardPage.jsx"),
    "coach-dashboard-page",
);
const CoachWalletPage = lazyWithRetry(
    () => import("../../features/coach/pages/CoachWalletPage/CoachWalletPage.jsx"),
    "coach-wallet-page",
);

const renderLazy = (LazyComponent) => (
    <Suspense fallback={<RouteLoadingFallback />}>
        <LazyComponent />
    </Suspense>
);

export const interviewerRoutes = [
    { path: "/dashboard", element: renderLazy(CoachDashboardPage) },
    { path: "/profile", element: renderLazy(InterviewerProfilePage) },
    { path: "/interviewer/profile", element: renderLazy(InterviewerProfilePage) },
    { path: "/candidate/:slugProfileUrl", element: renderLazy(CandidateProfilePage) },
    { path: "/schedule", element: renderLazy(ScheduleManagement) },
    { path: "/my-services", element: renderLazy(CoachInterviewServicePage) },
    { path: "/dashboard/wallet", element: renderLazy(CoachWalletPage) },
];
