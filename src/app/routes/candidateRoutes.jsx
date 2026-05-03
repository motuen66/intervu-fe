import { lazy, Suspense } from "react";

const Test = lazy(() => import("../../features/test/pages/Test"));
const HomePage = lazy(() => import("../../features/home/pages/HomePage"));
const RoadmapDashboard = lazy(() => import("../../features/roadmap/RoadmapDashboard"));
const RoadmapPhaseDetailPage = lazy(() => import("../../features/roadmap/RoadmapPhaseDetailPage"));
const CandidateAssessmentPage = lazy(() => import("../../features/profiles/candidate/pages/CandidateAssessmentPage"));

const renderLazy = (LazyComponent) => (
    <Suspense fallback={null}>
        <LazyComponent />
    </Suspense>
);

export const candidateRoutes = [
    { path: "/test/:id", element: renderLazy(Test) },
    { path: "/home", element: renderLazy(HomePage) },
    { path: "/assessment", element: renderLazy(CandidateAssessmentPage) },
    { path: "/roadmap", element: renderLazy(RoadmapDashboard) },
    { path: "/roadmap/phase/:phaseId", element: renderLazy(RoadmapPhaseDetailPage) },
];
