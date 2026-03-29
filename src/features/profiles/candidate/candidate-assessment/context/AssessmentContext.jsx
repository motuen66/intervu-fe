import React, { createContext, useContext, useMemo, useState } from "react";

const AssessmentContext = createContext(null);

export function AssessmentProvider({ children }) {
    const [currentStep, setCurrentStep] = useState(1);
    const [answers, setAnswers] = useState(null);
    const [surveyResult, setSurveyResult] = useState(null);
    const [skillScores, setSkillScores] = useState([]);
    const [roadmap, setRoadmap] = useState({ today: [], weeks: [] });
    const [matchPercentage, setMatchPercentage] = useState(0);
    const [lastMatchPercentage, setLastMatchPercentage] = useState(0);

    const value = useMemo(
        () => ({
            currentStep,
            setCurrentStep,
            nextStep: () => setCurrentStep((prev) => prev + 1),
            prevStep: () => setCurrentStep((prev) => Math.max(1, prev - 1)),
            answers,
            setAnswers,
            surveyResult,
            setSurveyResult,
            skillScores,
            setSkillScores,
            roadmap,
            setRoadmap,
            matchPercentage,
            lastMatchPercentage,
            updateMatchPercentage: (nextValue) => {
                setLastMatchPercentage(matchPercentage);
                setMatchPercentage(nextValue);
            },
        }),
        [answers, currentStep, lastMatchPercentage, matchPercentage, roadmap, skillScores, surveyResult],
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
