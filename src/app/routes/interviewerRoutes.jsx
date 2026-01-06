import ScheduleManagement from "../../features/interviewer/pages/ScheduleManagement";
import InterviewerProfilePage from "../../features/profiles/interviewer/page/InterviewerProfilePage";
import IntervieweeProfilePage from "../../features/profiles/interviewee/page/IntervieweeProfilePage";

export const interviewerRoutes = [
    { path: "/profile", element: <InterviewerProfilePage /> },
    { path: "/interviewer/profile", element: <InterviewerProfilePage /> },
    { path: "/interviewee/:slugProfileUrl", element: <IntervieweeProfilePage /> },
    { path: "/schedule", element: <ScheduleManagement /> },
    
];
