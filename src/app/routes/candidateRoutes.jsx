import { lazy, Suspense } from "react";

const Test = lazy(() => import("../../features/test/pages/Test"));
const CoachBrowsePage = lazy(() => import("../../features/home/pages/CoachBrowsePage"));
const CandidateHomePage = lazy(() => import("../../features/home/pages/CandidateHomePage"));
const RoadmapDashboard = lazy(() => import("../../features/roadmap/RoadmapDashboard"));
const CandidateAssessmentPage = lazy(() => import("../../features/profiles/candidate/pages/CandidateAssessmentPage"));

const renderLazy = (LazyComponent) => (
    <Suspense fallback={null}>
        <LazyComponent />
    </Suspense>
);

export const candidateRoutes = [
    { path: "/test/:id", element: renderLazy(Test) },
    { path: "/candidate", element: renderLazy(CandidateHomePage) },
    { path: "/coaches", element: renderLazy(CoachBrowsePage) },
    { path: "/assessment", element: renderLazy(CandidateAssessmentPage) },
    { path: "/roadmap", element: renderLazy(RoadmapDashboard) },
];
