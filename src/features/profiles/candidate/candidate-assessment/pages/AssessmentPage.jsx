import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { useAssessment } from "../context/AssessmentContext";
import StepperHeader from "../components/StepperHeader";
import ChatSurvey from "../components/ChatSurvey";
import ProcessingState from "../components/ProcessingState";
import ResultDashboard from "../components/ResultDashboard";
import RoadmapDashboard from "../../../../roadmap/RoadmapDashboard";
import { getAssessmentDataFromCache, isAssessmentCacheValid } from "../../../../../common/utils/assessmentCache";
import { ASSESSMENT_DATA_STATE, getAssessmentState, mapAssessmentPayloadToResult } from "../helpers/assessmentHelper";

const steps = ["Survey", "Analysis", "Results", "Roadmap"];

function AssessmentFlow() {
    const {
        currentStep,
        setCurrentStep,
        setAnswers,
        setSurveyResult,
        skillScores,
        setSkillScores,
        roadmap,
        setRoadmap,
        answers,
        updateMatchPercentage,
    } = useAssessment();
    const currentUser = useSelector((state) => state.auth?.userData);
    const userId = currentUser?.id;
    const [searchParams] = useSearchParams();
    const stepParam = useMemo(() => searchParams.get("step"), [searchParams]);
    const initialStateCheckedRef = useRef(null);
    const hasRoadmap = Boolean(
        roadmap &&
            ((Array.isArray(roadmap?.today) && roadmap.today.length > 0) ||
                (Array.isArray(roadmap?.weeks) && roadmap.weeks.length > 0) ||
                (Array.isArray(roadmap?.phases) && roadmap.phases.length > 0)),
    );

    useEffect(() => {   
        if (!userId || !isAssessmentCacheValid(userId)) {
            return;
        }

        const cached = getAssessmentDataFromCache(userId);
        if (!cached || typeof cached !== "object") {
            return;
        }

        if (cached.answers && !answers) {
            setAnswers(cached.answers);
        }

        if (cached.surveyResult) {
            setSurveyResult(cached.surveyResult);
        }

        if (Array.isArray(cached.skillScores) && cached.skillScores.length > 0 && skillScores.length === 0) {
            setSkillScores(cached.skillScores);
        }

        if (cached.roadmap) {
            setRoadmap(cached.roadmap);
        }

        if (typeof cached.matchPercentage === "number") {
            updateMatchPercentage(cached.matchPercentage);
        }

        if (!stepParam && typeof cached.currentStep === "number" && cached.currentStep >= 3) {
            setCurrentStep(Math.min(4, Math.max(1, cached.currentStep)));
        }
    }, [
        answers,
        stepParam,
        setAnswers,
        setCurrentStep,
        setRoadmap,
        setSkillScores,
        setSurveyResult,
        skillScores.length,
        updateMatchPercentage,
        userId,
    ]);

    useEffect(() => {
        if (stepParam === "result" && skillScores.length > 0) {
            setCurrentStep(3);
            return;
        }

        if (stepParam === "roadmap") {
            if (hasRoadmap) {
                setCurrentStep(4);
            } else if (skillScores.length > 0) {
                setCurrentStep(3);
            }
        }
    }, [hasRoadmap, setCurrentStep, skillScores.length, stepParam]);

    useEffect(() => {
        initialStateCheckedRef.current = null;
    }, [stepParam, userId]);

    useEffect(() => {
        let cancelled = false;

        const applyInitialStepFromBackend = async () => {
            if (!userId || stepParam || skillScores.length > 0) {
                return;
            }

            if (isAssessmentCacheValid(userId)) {
                return;
            }

            const requestKey = `${userId}:no-step`;
            if (initialStateCheckedRef.current === requestKey) {
                return;
            }
            initialStateCheckedRef.current = requestKey;

            try {
                const assessmentState = await getAssessmentState(userId);

                if (cancelled) {
                    return;
                }

                if (assessmentState.status === ASSESSMENT_DATA_STATE.HAS_DATA) {
                    const mapped = mapAssessmentPayloadToResult(assessmentState.data, userId);
                    if (mapped) {
                        setAnswers(mapped.answers);
                        setSurveyResult(mapped.surveyResult);
                        setSkillScores(mapped.skillScores);
                        updateMatchPercentage(mapped.matchPercentage);
                    }

                    setCurrentStep(3);
                    return;
                }

                setCurrentStep(1);
            } catch (error) {
                if (!cancelled) {
                    setCurrentStep(1);
                }
            }
        };

        applyInitialStepFromBackend();

        return () => {
            cancelled = true;
        };
    }, [
        setAnswers,
        setCurrentStep,
        setSkillScores,
        setSurveyResult,
        skillScores.length,
        stepParam,
        updateMatchPercentage,
        userId,
    ]);

    const handleStepNodeClick = useCallback(
        (nextStep) => {
            if (!Number.isInteger(nextStep)) {
                return;
            }

            // Allow going back to visited steps only.
            if (nextStep > currentStep) {
                return;
            }

            setCurrentStep(Math.min(steps.length, Math.max(1, nextStep)));
        },
        [currentStep, setCurrentStep],
    );

    return (
        <div className="space-y-8">
            <StepperHeader currentStep={currentStep} steps={steps} onStepClick={handleStepNodeClick} />
            {currentStep === 1 && <ChatSurvey />}
            {currentStep === 2 && <ProcessingState />}
            {currentStep === 3 && <ResultDashboard />}
            {currentStep === 4 && <RoadmapDashboard roadmap={roadmap} userId={answers?.userId} />}
        </div>
    );
}

export default function AssessmentPage() {
    return <AssessmentFlow />;
}
