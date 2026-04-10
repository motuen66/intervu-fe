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

export const ASSESSMENT_DATA_STATE = {
    NO_RECORD: "no-record",
    ALL_EMPTY: "all-empty",
    HAS_DATA: "has-data",
};

const toArray = (value) => {
    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .map((item) => {
            if (item === null || item === undefined) {
                return "";
            }

            if (typeof item === "string") {
                return item.trim();
            }

            return String(item).trim();
        })
        .filter(Boolean);
};

const mapTargetLevel = (levelLabel) => {
    const normalized = String(levelLabel || "").toLowerCase();

    if (["staff", "lead", "principal"].some((key) => normalized.includes(key))) return 7;
    if (normalized.includes("senior")) return 6;
    if (["mid", "intermediate"].some((key) => normalized.includes(key))) return 5;
    if (["junior", "associate"].some((key) => normalized.includes(key))) return 4;
    if (["entry", "intern", "fresher", "graduate"].some((key) => normalized.includes(key))) return 3;
    return 4;
};

export const normalizeAssessmentPayload = (data) => {
    const source = data?.assessment || data?.Assessment || data || {};
    const target = source?.Target || source?.target || {};
    const current = source?.Current || source?.current || {};
    const gap = source?.Gap || source?.gap || {};

    const roles = toArray(target?.Roles || target?.roles);
    const level = String(target?.Level || target?.level || "").trim();
    const skillsTarget = toArray(target?.SkillsTarget || target?.skillsTarget || target?.skills);
    const currentSkills = toArray(current?.Skills || current?.skills);
    const missing = toArray(gap?.Missing || gap?.missing);
    const weak = toArray(gap?.Weak || gap?.weak);

    return {
        source,
        target: {
            roles,
            level,
            skillsTarget,
        },
        current: {
            skills: currentSkills,
        },
        gap: {
            missing,
            weak,
        },
    };
};

export const hasStructuredAssessmentData = (data) => {
    const normalized = normalizeAssessmentPayload(data);
    const hasTargetData =
        normalized.target.roles.length > 0 ||
        normalized.target.skillsTarget.length > 0 ||
        normalized.target.level.length > 0;
    const hasCurrentSkillData = normalized.current.skills.length > 0;
    const hasGapData = normalized.gap.missing.length > 0 || normalized.gap.weak.length > 0;

    return hasTargetData && hasCurrentSkillData && hasGapData;
};

export const hasAnyAssessmentFieldData = (data) => {
    const normalized = normalizeAssessmentPayload(data);
    const hasTargetData =
        normalized.target.roles.length > 0 ||
        normalized.target.skillsTarget.length > 0 ||
        normalized.target.level.length > 0;
    const hasCurrentSkillData = normalized.current.skills.length > 0;
    const hasGapData = normalized.gap.missing.length > 0 || normalized.gap.weak.length > 0;

    return hasTargetData || hasCurrentSkillData || hasGapData;
};

export const mapAssessmentPayloadToResult = (data, userId) => {
    const normalized = normalizeAssessmentPayload(data);

    const hasTargetData =
        normalized.target.roles.length > 0 ||
        normalized.target.skillsTarget.length > 0 ||
        normalized.target.level.length > 0;
    const hasCurrentSkillData = normalized.current.skills.length > 0;
    const hasGapData = normalized.gap.missing.length > 0 || normalized.gap.weak.length > 0;

    if (!(hasTargetData || hasCurrentSkillData || hasGapData)) {
        return null;
    }

    const targetLevel = mapTargetLevel(normalized.target.level);
    const statusScore = {
        missing: 20,
        weak: 50,
        medium: 78,
        good: 92,
    };
    const missingSet = new Set(normalized.gap.missing.map((item) => item.toLowerCase()));
    const weakSet = new Set(normalized.gap.weak.map((item) => item.toLowerCase()));

    const mergedSkills = Array.from(
        new Set([
            ...normalized.target.skillsTarget,
            ...normalized.current.skills,
            ...normalized.gap.missing,
            ...normalized.gap.weak,
        ]),
    );

    const skillScores = mergedSkills.map((skill) => {
        const normalizedSkill = String(skill || "").toLowerCase();
        const status = missingSet.has(normalizedSkill) ? "missing" : weakSet.has(normalizedSkill) ? "weak" : "good";
        const score = statusScore[status] ?? 70;

        return {
            skillKey: skill,
            status,
            score,
            sfiaLevel: Math.max(1, Math.round((score / 100) * targetLevel)),
            targetLevel,
            baseScore: score,
            selectedLevel: status,
        };
    });

    const matchPercentage =
        skillScores.length > 0
            ? Math.max(
                  25,
                  Math.min(
                      100,
                      Math.round(skillScores.reduce((sum, item) => sum + item.score, 0) / skillScores.length),
                  ),
              )
            : 35;

    return {
        answers: {
            userId,
            profile: {
                role: normalized.target.roles[0] || "Candidate",
                level: normalized.target.level || "Mid-Level",
                techstack: normalized.target.skillsTarget,
                domain: [],
                freeText: "Loaded from existing assessment data.",
            },
            responses: normalized.current.skills.map((skill) => ({
                skill,
                selectedLevel: "Current",
            })),
        },
        surveyResult: {
            summaryObject: {
                loaded: {
                    Questions: normalized.current.skills.map((skill) => ({
                        Skill: skill,
                        SelectedLevel: weakSet.has(String(skill || "").toLowerCase()) ? "Weak" : "Current",
                    })),
                },
            },
        },
        skillScores,
        matchPercentage,
    };
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
            if (!value.length) {
                return false;
            }

            return value.some((item) => {
                if (item && typeof item === "object") {
                    return hasSkillGapData(item);
                }

                return item !== null && item !== undefined && String(item).trim() !== "";
            });
        }

        if (value && typeof value === "object") {
            return hasSkillGapData(value);
        }

        return value !== null && value !== undefined && String(value).trim() !== "";
    });
};

export const hasAssessmentData = async (userId) => {
    if (!userId) {
        return false;
    }

    const state = await getAssessmentState(userId);
    return state.status === ASSESSMENT_DATA_STATE.HAS_DATA;
};

export const getAssessmentData = async (userId) => {
    if (!userId) {
        return null;
    }

    const res = await callApi({
        method: METHOD.GET,
        endpoint: assessmentEndPoints.GET_SKILL_GAPS(userId),
        alertErrorMessage: false,
    });

    if (!res?.success) {
        return null;
    }

    return res?.data ?? null;
};

export const getAssessmentState = async (userId) => {
    if (!userId) {
        return { status: ASSESSMENT_DATA_STATE.NO_RECORD, data: null, httpStatus: null };
    }

    try {
        const data = await getAssessmentData(userId);

        if (!hasAnyAssessmentFieldData(data)) {
            return { status: ASSESSMENT_DATA_STATE.ALL_EMPTY, data, httpStatus: 200 };
        }

        return { status: ASSESSMENT_DATA_STATE.HAS_DATA, data, httpStatus: 200 };
    } catch (error) {
        const status = error?.response?.status;
        if (status === 404) {
            return { status: ASSESSMENT_DATA_STATE.NO_RECORD, data: null, httpStatus: 404 };
        }

        throw error;
    }
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
