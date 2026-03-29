import axios from "axios";
import { BE_BASE_URL } from "../../../../../common/constants/env";
import { axiosInstance } from "../../../../../common/utils/apiConnector";

const ASSESSMENT_BASE = `${BE_BASE_URL}/assessment`;
const AI_GENERATOR_URL = `${BE_BASE_URL}/generate-assessment`;

export const assessmentEndPoints = {
    GENERATE_ASSESSMENT: AI_GENERATOR_URL,
    PROCESS_SURVEY_RESPONSES: () => `${ASSESSMENT_BASE}/process`,
};

export const assessmentApi = {
    generateAssessment: (payload) => axios.post(assessmentEndPoints.GENERATE_ASSESSMENT, payload),
    processSurveyResponses: (payload) => axiosInstance.post(assessmentEndPoints.PROCESS_SURVEY_RESPONSES(), payload),
};
