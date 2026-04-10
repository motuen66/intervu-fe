import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { ROLES } from "../constants/common";
import {
    ASSESSMENT_DATA_STATE,
    getAssessmentState,
    setAssessmentForceRequired,
} from "../../features/profiles/candidate/candidate-assessment/services/assessmentApi";

function CandidateAssessmentGate({ children }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { token, userData } = useSelector((state) => state.auth || {});
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        let cancelled = false;
        const isRoadmapPath = location.pathname.startsWith("/roadmap");

        const shouldSkipCheck =
            !token || userData?.role !== ROLES.CANDIDATE || location.pathname.startsWith("/assessment");

        if (shouldSkipCheck) {
            setIsChecking(false);
            return () => {
                cancelled = true;
            };
        }

        const checkAssessment = async () => {
            try {
                const assessmentState = await getAssessmentState(userData?.id);

                if (cancelled) {
                    return;
                }

                if (assessmentState.status === ASSESSMENT_DATA_STATE.NO_RECORD) {
                    setAssessmentForceRequired(userData?.id, true);
                    navigate("/assessment", {
                        replace: true,
                        state: {
                            showAssessmentPrompt: true,
                            redirectedFrom: `${location.pathname}${location.search}`,
                        },
                    });
                    return;
                }

                if (assessmentState.status === ASSESSMENT_DATA_STATE.ALL_EMPTY && isRoadmapPath) {
                    setAssessmentForceRequired(userData?.id, false);
                    navigate("/assessment", {
                        replace: true,
                        state: {
                            showAssessmentPrompt: true,
                            redirectedFrom: `${location.pathname}${location.search}`,
                        },
                    });
                    return;
                }

                setAssessmentForceRequired(userData?.id, false);
            } catch (error) {
                if (!cancelled) {
                    setAssessmentForceRequired(userData?.id, true);
                    navigate("/assessment", { replace: true });
                }
            } finally {
                if (!cancelled) {
                    setIsChecking(false);
                }
            }
        };

        setIsChecking(true);
        checkAssessment();

        return () => {
            cancelled = true;
        };
    }, [location.pathname, location.search, navigate, token, userData?.id, userData?.role]);

    if (isChecking) {
        return null;
    }

    return children ?? null;
}

export default CandidateAssessmentGate;
