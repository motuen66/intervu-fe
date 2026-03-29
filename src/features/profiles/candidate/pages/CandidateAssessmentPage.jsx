import React from "react";
import AssessmentContainer from "../candidate-assessment/pages/AssessmentPage";

const CandidateAssessmentPage = () => {
    return (
        <div className="min-h-screen bg-slate-50 pt-10 px-4 md:px-8">
            <div className="max-w-7xl mx-auto">
                <AssessmentContainer />
            </div>
        </div>
    );
};

export default CandidateAssessmentPage;
