import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { ROLES } from "../constants/common";
import {
    hasAssessmentData,
    setAssessmentForceRequired,
} from "../../features/profiles/candidate/candidate-assessment/services/assessmentApi";

function CandidateAssessmentGate({ children }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { token, userData } = useSelector((state) => state.auth || {});
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        let cancelled = false;

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
                const hasData = await hasAssessmentData(userData?.id);
                if (!cancelled && !hasData) {
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
