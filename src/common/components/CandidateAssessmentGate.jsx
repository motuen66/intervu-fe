import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { ROLES } from "../constants/common";
import { hasAssessmentData } from "../../features/profiles/candidate/candidate-assessment/services/assessmentApi";

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

        const checkSkillGap = async () => {
            console.log("nhi along with userData", userData);
            const isAssessment = await hasAssessmentData(userData?.id);
            if (!isAssessment) {
                navigate("/assessment", { replace: true });
            }
        };

        setIsChecking(true);
        checkSkillGap();

        return () => {
            cancelled = true;
        };
    }, [location.pathname, navigate, token, userData?.id, userData?.role]);

    if (isChecking) {
        return null;
    }

    return children;
}

export default CandidateAssessmentGate;
