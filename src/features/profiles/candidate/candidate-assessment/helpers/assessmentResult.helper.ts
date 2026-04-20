import type { EvaluateAssessmentResponse } from "./assessment.types";

export function mapEvaluationToDashboardModel(res: EvaluateAssessmentResponse) {
    const overall = res.answer?.overallScore ?? 0;
    const responses = res.answer?.responses ?? [];
    const currentSkills = res.current?.skills ?? [];

    return {
        summaryText: res.summaryText || "",
        overallScore: overall,
        overallLevel: res.answer?.overallLevel || "None",
        scoredResponses: responses,
        missingSkills: res.missing || [],
        currentSkills,
        readyPercent: Math.max(0, Math.min(100, Math.round(overall * 25))),
    };
}

export function normalizeEvaluationResponse(raw: any): EvaluateAssessmentResponse {
    if (raw?.answer && raw?.current && Array.isArray(raw?.missing)) return raw;

    return {
        userId: raw?.userId ?? null,
        summaryText: raw?.summaryText ?? "",
        answer: {
            profile: raw?.summaryObject?.overall?.Answer?.profile ?? {
                role: "",
                level: "",
                techstack: [],
                domain: [],
                freeText: "",
            },
            responses: raw?.summaryObject?.overall?.Answer?.responses ?? [],
            overallScore: raw?.summaryObject?.overall?.AverageScore ?? 0,
            overallLevel: raw?.summaryObject?.overall?.AverageLevel ?? "None",
        },
        target: {},
        current: { skills: raw?.summaryObject?.overall?.Current?.Skills ?? [] },
        missing: raw?.summaryObject?.overall?.Gap?.Missing ?? [],
    };
}
