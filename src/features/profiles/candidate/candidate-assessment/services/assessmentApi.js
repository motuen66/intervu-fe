import { METHOD } from "../../../../../common/constants/api";
import { BE_BASE_URL } from "../../../../../common/constants/env";
import { callApi } from "../../../../../common/utils/apiConnector";

const ASSESSMENT_BASE = `${BE_BASE_URL}/assessment`;
const AI_GENERATOR_URL = `${BE_BASE_URL}/generate-assessment`;

export const assessmentEndPoints = {
    GENERATE_ASSESSMENT: AI_GENERATOR_URL,
    PROCESS_SURVEY_RESPONSES: () => `${ASSESSMENT_BASE}/process`,
    GET_SKILL_GAPS: (userId) => `${ASSESSMENT_BASE}/${userId}`,
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
    const res = await callApi({
        method: METHOD.GET,
        endpoint: assessmentEndPoints.GET_SKILL_GAPS(userId),
        alertErrorMessage: false,
    });

    return res?.success && hasSkillGapData(res?.data);
};
