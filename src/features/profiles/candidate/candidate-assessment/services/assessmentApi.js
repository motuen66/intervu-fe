import { METHOD } from "../../../../../common/constants/api";
import { BE_BASE_URL } from "../../../../../common/constants/env";
import { axiosInstance, callApi } from "../../../../../common/utils/apiConnector";

const ASSESSMENT_BASE = `${BE_BASE_URL}/assessment`;
const AI_GENERATOR_URL = `${BE_BASE_URL}/generate-assessment`;
const ASSESSMENT_FORCE_REQUIRED_PREFIX = "assessment_force_required:";

export const assessmentEndPoints = {
    GENERATE_ASSESSMENT: AI_GENERATOR_URL,
    PROCESS_SURVEY_RESPONSES: () => `${ASSESSMENT_BASE}/process`,
    GENERATE_ROADMAP: () => `${ASSESSMENT_BASE}/roadmap/generate`,
    GET_ROADMAP: (userId) => `${ASSESSMENT_BASE}/roadmap/${userId}`,
    GET_SKILL_GAPS: (userId) => `${ASSESSMENT_BASE}/${userId}`,
};

export const assessmentApi = {
    generateRoadmapFromSurvey: (payload) => axiosInstance.post(assessmentEndPoints.GENERATE_ROADMAP(), payload),
    getRoadmapByUserId: (userId) => axiosInstance.get(assessmentEndPoints.GET_ROADMAP(userId)),
};

export const hasSkillGapData = (data) => {
    if (data == null) {
        return false;
    }

    if (Array.isArray(data)) {
        return data.length > 0;
    }

    if (typeof data !== "object") {
        return Boolean(data);
    }

    const values = Object.values(data);
    if (!values.length) {
        return false;
    }

    return values.some((value) => {
        if (Array.isArray(value)) {
            return value.length > 0;
        }

        if (value && typeof value === "object") {
            return Object.keys(value).length > 0;
        }

        return value !== null && value !== undefined && value !== "";
    });
};

export const hasAssessmentData = async (userId) => {
    if (!userId) {
        return false;
    }

    const res = await callApi({
        method: METHOD.GET,
        endpoint: assessmentEndPoints.GET_SKILL_GAPS(userId),
        alertErrorMessage: false,
    });

    return res?.success && res?.data !== null && res?.data !== undefined;
};

export const getAssessmentForceRequiredKey = (userId) => `${ASSESSMENT_FORCE_REQUIRED_PREFIX}${userId ?? ""}`;

export const isAssessmentForceRequired = (userId) => {
    if (!userId) {
        return false;
    }

    try {
        return localStorage.getItem(getAssessmentForceRequiredKey(userId)) === "true";
    } catch (error) {
        return false;
    }
};

export const setAssessmentForceRequired = (userId, required) => {
    if (!userId) {
        return;
    }

    try {
        localStorage.setItem(getAssessmentForceRequiredKey(userId), required ? "true" : "false");
    } catch (error) {
        // ignore storage errors
    }
};

export const saveSkippedAssessment = async (userId) => {
    if (!userId) {
        return false;
    }

    const payload = {
        UserId: userId,
        AssessmentName: "Skipped Assessment",
        Responses: [],
        Target: {
            Roles: [],
            Level: "",
            SkillsTarget: [],
        },
        Current: {
            Skills: [],
        },
        Gap: {
            Missing: [],
            Weak: [],
        },
    };

    const res = await callApi({
        method: METHOD.POST,
        endpoint: assessmentEndPoints.PROCESS_SURVEY_RESPONSES(),
        arg: payload,
        alertErrorMessage: false,
    });

    return Boolean(res?.success);
};
