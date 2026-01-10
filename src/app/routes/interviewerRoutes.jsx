import ScheduleManagement from "../../features/interviewer/pages/ScheduleManagement";
import InterviewerProfilePage from "../../features/profiles/interviewer/page/InterviewerProfilePage";
import CandidateProfilePage from "../../features/profiles/candidate/page/CandidateProfilePage.jsx";

export const interviewerRoutes = [
    { path: "/profile", element: <InterviewerProfilePage /> },
    { path: "/interviewer/profile", element: <InterviewerProfilePage /> },
    { path: "/candidate/:slugProfileUrl", element: <CandidateProfilePage /> },
    { path: "/schedule", element: <ScheduleManagement /> },
    
];
