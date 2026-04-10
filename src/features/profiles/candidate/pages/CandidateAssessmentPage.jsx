import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import AssessmentContainer from "../candidate-assessment/pages/AssessmentPage";
import {
    isAssessmentForceRequired,
    saveSkippedAssessment,
    setAssessmentForceRequired,
} from "../candidate-assessment/services/assessmentApi";
import AssessmentRequiredDialog from "../candidate-assessment/components/AssessmentRequiredDialog";

const CandidateAssessmentPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { userData } = useSelector((state) => state.auth || {});
    const [openPrompt, setOpenPrompt] = useState(false);
    const [isSkipping, setIsSkipping] = useState(false);

    const isForceRequired = useMemo(() => isAssessmentForceRequired(userData?.id), [userData?.id]);

    useEffect(() => {
        setOpenPrompt(true);

        const openedByRedirect = Boolean(location.state?.showAssessmentPrompt);
        if (openedByRedirect) {
            navigate(`${location.pathname}${location.search}`, {
                replace: true,
                state: {},
            });
        }
    }, [location.pathname, location.search, location.state?.showAssessmentPrompt, navigate]);

    const handleLetsGo = () => {
        setOpenPrompt(false);
    };

    const handleSkipForNow = async () => {
        if (!userData?.id || isSkipping) {
            return;
        }

        setIsSkipping(true);
        try {
            await saveSkippedAssessment(userData.id);

            setAssessmentForceRequired(userData.id, false);
            setOpenPrompt(false);

            toast.info("Welcome back! You can complete your assessment anytime from the dashboard.");
            navigate("/home", { replace: true });
        } catch (error) {
            // Silently fail and still try to go home if possible,
            // or just ensure we don't crash
            setAssessmentForceRequired(userData.id, false);
            navigate("/home", { replace: true });
        } finally {
            setIsSkipping(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 pt-10 px-4 md:px-8">
            <AssessmentRequiredDialog
                open={openPrompt}
                onSkip={handleSkipForNow}
                onProceed={handleLetsGo}
                loading={isSkipping}
            />

            <div className="max-w-7xl mx-auto">
                <AssessmentContainer />
            </div>
        </div>
    );
};

export default CandidateAssessmentPage;
