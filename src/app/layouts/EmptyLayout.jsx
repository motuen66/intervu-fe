import { Outlet } from "react-router-dom";
import SuspendedGate from "../../common/components/SuspendedGate";
import CandidateAssessmentGate from "../../common/components/CandidateAssessmentGate";
import usePageTracking from "../../hooks/usePageTracking";
import { CollectQuestionTrayProvider } from "../../common/context/CollectQuestionTrayContext";

function EmptyLayout() {
    usePageTracking();
    return (
        <CollectQuestionTrayProvider>
            <CandidateAssessmentGate />
            <SuspendedGate>
                <Outlet />
            </SuspendedGate>
        </CollectQuestionTrayProvider>
    );
}

export default EmptyLayout;
