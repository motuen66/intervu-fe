import { Outlet } from "react-router-dom";
import SuspendedGate from "../../common/components/SuspendedGate";
import CandidateAssessmentGate from "../../common/components/CandidateAssessmentGate";
import usePageTracking from "../../hooks/usePageTracking";
import { ProcessingTrayProvider } from "../../common/context/ProcessingTrayContext";

function EmptyLayout() {
    usePageTracking();
    return (
        <ProcessingTrayProvider>
            <CandidateAssessmentGate />
            <SuspendedGate>
                <Outlet />
            </SuspendedGate>
        </ProcessingTrayProvider>
    );
}

export default EmptyLayout;
