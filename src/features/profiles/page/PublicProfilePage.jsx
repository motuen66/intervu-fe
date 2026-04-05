import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import { callApi } from "../../../common/utils/apiConnector";
import { METHOD } from "../../../common/constants/api";
import { interviewerProfileEndPoints } from "../coach/service/coachProfileApi";
import { candidateProfileEndPoints } from "../candidate/service/candidateProfileApi";
import PublicInterviewerProfilePage from "../coach/page/PublicInterviewerProfilePage/PublicInterviewerProfilePage";
import PublicCandidateProfilePage from "../candidate/page/PublicCandidateProfilePage";
import CommonLoader from "../../../common/components/loaders/CommonLoader";

function PublicProfilePage() {
    const { slugProfileUrl } = useParams();
    const [loading, setLoading] = useState(true);
    const [profileType, setProfileType] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const detectProfileType = async () => {
            if (!slugProfileUrl) {
                setError("Profile not found.");
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const coachRes = await callApi({
                    method: METHOD.GET,
                    endpoint: interviewerProfileEndPoints.VIEW_PROFILE_BY_CANDIDATE.replace(
                        "{slugProfileUrl}",
                        slugProfileUrl,
                    ),
                });

                if (coachRes?.success && coachRes?.data) {
                    setProfileType("coach");
                    return;
                }
            } catch (_) {}

            try {
                const candidateRes = await callApi({
                    method: METHOD.GET,
                    endpoint: candidateProfileEndPoints.VIEW_PROFILE_BY_SLUG.replace(
                        "{slugProfileUrl}",
                        slugProfileUrl,
                    ),
                });

                if (candidateRes?.success && candidateRes?.data) {
                    setProfileType("candidate");
                    return;
                }
            } catch (_) {}

            setError("Profile not found.");
        };

        detectProfileType().finally(() => setLoading(false));
    }, [slugProfileUrl]);

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
                <CommonLoader text="Loading Profile" subtext="Preparing profile details..." />
            </Box>
        );
    }

    if (error || !profileType) {
        return (
            <Box sx={{ p: 4, textAlign: "center" }}>
                <Typography variant="h6" color="text.secondary">
                    {error || "Profile not found."}
                </Typography>
            </Box>
        );
    }

    if (profileType === "candidate") return <PublicCandidateProfilePage />;

    return <PublicInterviewerProfilePage />;
}

export default PublicProfilePage;
