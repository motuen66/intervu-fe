import ScheduleManagement from "../../features/interviewer/pages/ScheduleManagement";
import InterviewerProfilePage from "../../features/profiles/interviewer/page/InterviewerProfilePage";
import PublicInterviewerProfilePage from "../../features/profiles/interviewer/page/PublicInterviewerProfilePage/PublicInterviewerProfilePage";

export const interviewerRoutes = [
    { path: "/profile", element: <InterviewerProfilePage /> },
    { path: "/profile/:slugProfileUrl", element: <PublicInterviewerProfilePage /> },

    { path: "/schedule", element: <ScheduleManagement /> },
];
