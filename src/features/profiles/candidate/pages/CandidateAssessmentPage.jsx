import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import AssessmentContainer from "../candidate-assessment/pages/AssessmentPage";
import {
    ASSESSMENT_DATA_STATE,
    getAssessmentState,
    isAssessmentForceRequired,
    saveSkippedAssessment,
    setAssessmentForceRequired,
} from "../candidate-assessment/helpers/assessmentHelper";
import { getAssessmentDataFromCache, isAssessmentCacheValid } from "../../../../common/utils/assessmentCache";
import { AssessmentProvider } from "../candidate-assessment/context/AssessmentContext";
import AssessmentRequiredDialog from "../candidate-assessment/components/AssessmentRequiredDialog";

const CandidateAssessmentPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { userData } = useSelector((state) => state.auth || {});
    const [openPrompt, setOpenPrompt] = useState(false);
    const [isSkipping, setIsSkipping] = useState(false);
    const [assessmentDataState, setAssessmentDataState] = useState(null);

    const isForceRequired = useMemo(() => isAssessmentForceRequired(userData?.id), [userData?.id]);
    const hasReachedAssessmentResult = useMemo(() => {
        if (!userData?.id || !isAssessmentCacheValid(userData.id)) {
            return false;
        }

        const cached = getAssessmentDataFromCache(userData.id);
        return typeof cached?.currentStep === "number" && cached.currentStep >= 3;
    }, [userData?.id]);

    useEffect(() => {
        let cancelled = false;

        const loadStructuredAssessmentState = async () => {
            if (!userData?.id) {
                setAssessmentDataState(ASSESSMENT_DATA_STATE.NO_RECORD);
                return;
            }

            try {
                const result = await getAssessmentState(userData.id);
                if (!cancelled) {
                    setAssessmentDataState(result.status);
                }
            } catch (error) {
                if (!cancelled) {
                    setAssessmentDataState(ASSESSMENT_DATA_STATE.NO_RECORD);
                }
            }
        };

        loadStructuredAssessmentState();

        return () => {
            cancelled = true;
        };
    }, [userData?.id]);

    useEffect(() => {
        const openedByRedirect = Boolean(location.state?.showAssessmentPrompt);
        const step = new URLSearchParams(location.search).get("step");
        const isResultOrRoadmapStep = step === "result" || step === "roadmap";
        const isNoRecordState = assessmentDataState === ASSESSMENT_DATA_STATE.NO_RECORD;
        const isAllEmptyState = assessmentDataState === ASSESSMENT_DATA_STATE.ALL_EMPTY;
        const isHasDataState = assessmentDataState === ASSESSMENT_DATA_STATE.HAS_DATA;
        const shouldOpenForAllEmpty = isAllEmptyState && openedByRedirect;
        const shouldOpenPrompt =
            isNoRecordState ||
            shouldOpenForAllEmpty ||
            ((openedByRedirect || isForceRequired) && !isHasDataState && !hasReachedAssessmentResult);

        setOpenPrompt(shouldOpenPrompt && !isResultOrRoadmapStep);

        if (openedByRedirect) {
            navigate(`${location.pathname}${location.search}`, {
                replace: true,
                state: {},
            });
        }
    }, [
        hasReachedAssessmentResult,
        assessmentDataState,
        isForceRequired,
        location.pathname,
        location.search,
        location.state?.showAssessmentPrompt,
        navigate,
    ]);

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
            navigate("/candidate", { replace: true });
        } catch (error) {
            // Silently fail and still try to go home if possible,
            // or just ensure we don't crash
            setAssessmentForceRequired(userData.id, false);
            navigate("/candidate", { replace: true });
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
                <AssessmentProvider>
                    <AssessmentContainer />
                </AssessmentProvider>
            </div>
        </div>
    );
};

export default CandidateAssessmentPage;
