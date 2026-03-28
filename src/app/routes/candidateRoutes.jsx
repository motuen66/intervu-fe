import Test from "../../features/test/pages/Test";
import HomePage from "../../features/home/pages/HomePage";
import PublicInterviewerProfilePage from "../../features/profiles/coach/page/PublicInterviewerProfilePage/PublicInterviewerProfilePage";
import CandidateAssessmentPage from "../../features/profiles/candidate/pages/CandidateAssessmentPage";

export const candidateRoutes = [
    { path: "/test/:id", element: <Test /> },
    { path: "/home", element: <HomePage /> },
    { path: "/assessment", element: <CandidateAssessmentPage /> },
    { path: "/profile/:slugProfileUrl", element: <PublicInterviewerProfilePage /> },
];
