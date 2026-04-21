import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { METHOD } from "../../../../../common/constants/api";
import { callApi } from "../../../../../common/utils/apiConnector";
import { assessmentEndPoints } from "../services/assessmentApi.js";

const AssessmentContext = createContext(null);

export function AssessmentProvider({ children }) {
    const [currentStep, setCurrentStep] = useState(1);
    const [answers, setAnswers] = useState(null);
    const [surveyResult, setSurveyResult] = useState(null);
    const [skillScores, setSkillScores] = useState([]);
    const [roadmap, setRoadmap] = useState(null);
    const [matchPercentage, setMatchPercentage] = useState(0);
    const [lastMatchPercentage, setLastMatchPercentage] = useState(0);

    const nextStep = useCallback(() => setCurrentStep((prev) => prev + 1), []);
    const prevStep = useCallback(() => setCurrentStep((prev) => Math.max(1, prev - 1)), []);

    const saveAssessmentSnapshot = useCallback(async () => {
        if (surveyResult) {
            return surveyResult;
        }

        const payload = answers?.processingPayload;
        if (!payload) {
            return surveyResult;
        }

        const apiResult = await callApi({
            method: METHOD.POST,
            // MIGRATION: evaluate-assessment now requires payload shape { answer: { profile, responses } }
            endpoint: assessmentEndPoints.EVALUATE_ASSESSMENT(),
            arg: payload,
            alertErrorMessage: true,
            useGlobalLoading: false,
        });
        if (apiResult?.data) {
            setSurveyResult(apiResult.data);
            return apiResult.data;
        }

        return surveyResult;
    }, [answers?.processingPayload, surveyResult]);

    const resetAssessment = useCallback(() => {
        setAnswers(null);
        setSurveyResult(null);
        setSkillScores([]);
        setRoadmap({ today: [], weeks: [] });
        setMatchPercentage(0);
        setLastMatchPercentage(0);
        setCurrentStep(1);
    }, []);

    const updateMatchPercentage = useCallback((nextValue) => {
        setMatchPercentage((prev) => {
            setLastMatchPercentage(prev);
            return nextValue;
        });
    }, []);

    const value = useMemo(
        () => ({
            currentStep,
            setCurrentStep,
            nextStep,
            prevStep,
            answers,
            setAnswers,
            surveyResult,
            setSurveyResult,
            skillScores,
            setSkillScores,
            roadmap,
            setRoadmap,
            saveAssessmentSnapshot,
            resetAssessment,
            matchPercentage,
            lastMatchPercentage,
            updateMatchPercentage,
        }),
        [
            answers,
            currentStep,
            lastMatchPercentage,
            matchPercentage,
            nextStep,
            prevStep,
            resetAssessment,
            roadmap,
            saveAssessmentSnapshot,
            skillScores,
            surveyResult,
            updateMatchPercentage,
        ],
    );

    return <AssessmentContext.Provider value={value}>{children}</AssessmentContext.Provider>;
}

export function useAssessment() {
    const context = useContext(AssessmentContext);

    if (!context) {
        throw new Error("useAssessment must be used within an AssessmentProvider");
    }

    return context;
}
