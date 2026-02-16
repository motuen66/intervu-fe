import Test from "../../features/test/pages/Test";
import HomePage from "../../features/home/pages/HomePage";
import PublicInterviewerProfilePage from "../../features/profiles/coach/page/PublicInterviewerProfilePage/PublicInterviewerProfilePage";

export const candidateRoutes = [
    { path: "/test/:id", element: <Test /> },
    { path: "/home", element: <HomePage /> },
    { path: "/profile/:slugProfileUrl", element: <PublicInterviewerProfilePage /> },
];
