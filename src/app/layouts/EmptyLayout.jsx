import { Outlet } from "react-router-dom";
import SuspendedGate from "../../common/components/SuspendedGate";
import CandidateAssessmentGate from "../../common/components/CandidateAssessmentGate";
import usePageTracking from "../../hooks/usePageTracking";

function EmptyLayout() {
    usePageTracking();
    return (
        <>
            <CandidateAssessmentGate />
            <SuspendedGate>
                <Outlet />
            </SuspendedGate>
        </>
    );
}

export default EmptyLayout;
