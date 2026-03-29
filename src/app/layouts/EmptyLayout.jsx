import { Outlet } from "react-router-dom";
import SuspendedGate from "../../common/components/SuspendedGate";
import CandidateAssessmentGate from "../../common/components/CandidateAssessmentGate";

function EmptyLayout() {
    return (
        // <CandidateAssessmentGate>
        <SuspendedGate>
            <Outlet />
        </SuspendedGate>
        // </CandidateAssessmentGate>
    );
}

export default EmptyLayout;
