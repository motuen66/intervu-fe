export type NumericLevel = "0" | "1" | "2" | "3" | "4";

export interface GenerateAssessmentRequest {
    role: string;
    level: string;
    techstack: string[];
    domain: string[];
    freeText: string;
}

export interface SkillOption {
    text: string;
    level: "1" | "2" | "3" | "4";
}

export interface SkillQuestion {
    skill: string;
    question: string;
    options: SkillOption[];
}

export interface GenerateAssessmentResponse {
    status: "success" | "need_input";
    context_question?: string;
    question?: string;
    phaseA?: SkillQuestion[];
    phaseB?: SkillQuestion[];
}

export interface SurveyAnswerProfile {
    role: string;
    level: string;
    techstack: string[];
    domain: string[];
    freeText: string;
}

export interface SurveyAnswerInputResponse {
    questionId: string;
    question: string;
    phase: string;
    skill: string;
    answer: string;
    selectedLevel: string;
}

export interface SurveyAnswerJson {
    profile: SurveyAnswerProfile;
    responses: SurveyAnswerInputResponse[];
}

export interface EvaluateAssessmentRequest {
    answer: SurveyAnswerJson;
}

export interface EvaluatedAnswerResponse {
    questionId: string;
    question: string;
    phase: string;
    skill: string;
    answer: string;
    selectedLevel: NumericLevel;
    score: number;
    isMissing: boolean;
}

export interface EvaluateAnswerBlock {
    profile: SurveyAnswerProfile;
    responses: EvaluatedAnswerResponse[];
    overallScore: number;
    overallLevel: "None" | "Basic" | "Intermediate" | "Advanced" | string;
}

export interface CurrentSkill {
    skill: string;
    level: NumericLevel;
    score: number;
}

export interface EvaluateAssessmentResponse {
    userId: string | null;
    summaryText: string;
    answer: EvaluateAnswerBlock;
    target: {
        roles: string[];
        level: string;
        skillsTarget: string[];
    };
    current: {
        skills: CurrentSkill[];
    };
    gapJson: {
        weak: string[];
        missing: string[];
    };
}
