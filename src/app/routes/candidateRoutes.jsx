import { Suspense } from "react";
import { lazyWithRetry } from "../../common/utils/lazyWithRetry";
import RouteLoadingFallback from "../../common/components/loaders/RouteLoadingFallback";

const Test = lazyWithRetry(() => import("../../features/test/pages/Test"), "candidate-test-page");
const HomePage = lazyWithRetry(() => import("../../features/home/pages/HomePage"), "candidate-home-page");
const RoadmapDashboard = lazyWithRetry(() => import("../../features/roadmap/RoadmapDashboard"), "roadmap-dashboard-page");
const CandidateAssessmentPage = lazyWithRetry(
    () => import("../../features/profiles/candidate/pages/CandidateAssessmentPage"),
    "candidate-assessment-page",
);

const renderLazy = (LazyComponent) => (
    <Suspense fallback={<RouteLoadingFallback />}>
        <LazyComponent />
    </Suspense>
);

export const candidateRoutes = [
    { path: "/test/:id", element: renderLazy(Test) },
    { path: "/home", element: renderLazy(HomePage) },
    { path: "/assessment", element: renderLazy(CandidateAssessmentPage) },
    { path: "/roadmap", element: renderLazy(RoadmapDashboard) },
];
