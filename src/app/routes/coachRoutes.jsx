import ScheduleManagement from "../../features/coach/pages/ScheduleManagement.jsx";
import InterviewerProfilePage from "../../features/profiles/coach/page/InterviewerProfilePage.jsx";
import CandidateProfilePage from "../../features/profiles/candidate/page/CandidateProfilePage.jsx";

export const interviewerRoutes = [
    { path: "/profile", element: <InterviewerProfilePage /> },
    { path: "/interviewer/profile", element: <InterviewerProfilePage /> },
    { path: "/candidate/:slugProfileUrl", element: <CandidateProfilePage /> },
    { path: "/schedule", element: <ScheduleManagement /> },
    
];
