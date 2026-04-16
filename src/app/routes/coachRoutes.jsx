import { lazy, Suspense } from "react";

const ScheduleManagement = lazy(
    () => import("../../features/coach/pages/ScheduleManagementPage/ScheduleManagement.jsx"),
);
const CoachInterviewServicePage = lazy(
    () => import("../../features/coach/pages/CoachInterviewServicePage/CoachInterviewServicePage.jsx"),
);
const InterviewerProfilePage = lazy(() => import("../../features/profiles/coach/page/InterviewerProfilePage.jsx"));
const CandidateProfilePage = lazy(() => import("../../features/profiles/candidate/page/CandidateProfilePage.jsx"));
const CoachDashboardPage = lazy(() => import("../../features/coach/pages/CoachDashboardPage/CoachDashboardPage.jsx"));
const CoachWalletPage = lazy(() => import("../../features/coach/pages/CoachWalletPage/CoachWalletPage.jsx"));

const renderLazy = (LazyComponent) => (
    <Suspense fallback={null}>
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
