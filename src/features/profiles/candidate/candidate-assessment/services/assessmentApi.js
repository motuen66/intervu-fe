import { BE_BASE_URL } from "../../../../../common/constants/env";

const ASSESSMENT_BASE = `${BE_BASE_URL}/assessment`;
const AI_GENERATOR_URL = `${BE_BASE_URL}/generate-assessment`;
const EVALUATE_ASSESSMENT_URL = `${ASSESSMENT_BASE}/evaluate-assessment`;

export const assessmentEndPoints = {
    GENERATE_ASSESSMENT: AI_GENERATOR_URL,
    EVALUATE_ASSESSMENT: () => EVALUATE_ASSESSMENT_URL,
    PROCESS_SURVEY_RESPONSES: () => `${ASSESSMENT_BASE}/process`,
    PROCESS_SURVEY_RESPONSES_FALLBACK: () => `${ASSESSMENT_BASE}`,
    SAVE_ANSWERS: () => `${ASSESSMENT_BASE}/answers`,
    GENERATE_ROADMAP: () => `${ASSESSMENT_BASE}/roadmap/generate`,
    GET_ROADMAP: (userId) => `${ASSESSMENT_BASE}/roadmap/${userId}`,
    GET_SKILL_GAPS: (userId) => `${ASSESSMENT_BASE}/${userId}`,
};
