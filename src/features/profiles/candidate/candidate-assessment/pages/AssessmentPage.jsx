import React, { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { AssessmentProvider, useAssessment } from "../context/AssessmentContext";
import StepperHeader from "../components/StepperHeader";
import ChatSurvey from "../components/ChatSurvey";
import ProcessingState from "../components/ProcessingState";
import ResultDashboard from "../components/ResultDashboard";
import RoadmapDashboard from "../../../../roadmap/RoadmapDashboard";

const steps = ["Survey", "Analysis", "Results", "Roadmap"];

function AssessmentFlow() {
    const {
        currentStep,
        setCurrentStep,
        skillScores,
        roadmap,
        answers,
    } = useAssessment();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        if (searchParams.get("step") === "roadmap" && skillScores.length > 0) {
            setCurrentStep(4);
        }
    }, [searchParams, skillScores.length, setCurrentStep]);

    return (
        <div className="space-y-8">
            <StepperHeader currentStep={currentStep} steps={steps} />
            {currentStep === 1 && <ChatSurvey />}
            {currentStep === 2 && <ProcessingState />}
            {currentStep === 3 && <ResultDashboard />}
            {currentStep === 4 && <RoadmapDashboard roadmap={roadmap} userId={answers?.userId} />}
        </div>
    );
}

export default function AssessmentPage() {
    return (
        <AssessmentProvider>
            <AssessmentFlow />
        </AssessmentProvider>
    );
}
