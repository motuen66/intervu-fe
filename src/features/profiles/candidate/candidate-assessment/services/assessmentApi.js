import { METHOD } from "../../../../../common/constants/api";
import { BE_BASE_URL } from "../../../../../common/constants/env";
import { axiosInstance, callApi } from "../../../../../common/utils/apiConnector";

const ASSESSMENT_BASE = `${BE_BASE_URL}/assessment`;
const AI_GENERATOR_URL = `${BE_BASE_URL}/generate-assessment`;
const ASSESSMENT_FORCE_REQUIRED_PREFIX = "assessment_force_required:";

export const assessmentEndPoints = {
    GENERATE_ASSESSMENT: AI_GENERATOR_URL,
    PROCESS_SURVEY_RESPONSES: () => `${ASSESSMENT_BASE}/process`,
    PROCESS_SURVEY_RESPONSES_FALLBACK: () => `${ASSESSMENT_BASE}`,
    SAVE_ANSWERS: () => `${ASSESSMENT_BASE}/answers`,
    GENERATE_ROADMAP: () => `${ASSESSMENT_BASE}/roadmap/generate`,
    GET_ROADMAP: (userId) => `${ASSESSMENT_BASE}/roadmap/${userId}`,
    GET_SKILL_GAPS: (userId) => `${ASSESSMENT_BASE}/${userId}`,
};

export const assessmentApi = {
    generateRoadmapFromSurvey: (payload) => axiosInstance.post(assessmentEndPoints.GENERATE_ROADMAP(), payload),
    getRoadmapByUserId: (userId) => axiosInstance.get(assessmentEndPoints.GET_ROADMAP(userId)),
    saveAnswers: (payload) =>
        callApi({
            method: METHOD.POST,
            endpoint: assessmentEndPoints.SAVE_ANSWERS(),
            arg: payload,
            alertErrorMessage: true,
        }),
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

const toObject = (value) => {
    if (!value) {
        return null;
    }

    if (typeof value === "string") {
        try {
            const parsed = JSON.parse(value);
            return parsed && typeof parsed === "object" ? parsed : null;
        } catch (error) {
            return null;
        }
    }

    return typeof value === "object" ? value : null;
};

const toNumberOrNull = (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
};

const normalizeSkillObject = (item) => {
    if (!item) {
        return null;
    }

    if (typeof item === "string") {
        const skill = item.trim();
        return skill ? { skill, level: "", sfiaLevel: null } : null;
    }

    if (typeof item !== "object") {
        return null;
    }

    const skill = String(item.skill ?? item.Skill ?? "").trim();
    if (!skill) {
        return null;
    }

    return {
        skill,
        level: String(item.level ?? item.Level ?? item.selectedLevel ?? "").trim(),
        sfiaLevel: toNumberOrNull(item.sfiaLevel ?? item.SfiaLevel),
        status: String(item.status ?? item.Status ?? "")
            .trim()
            .toLowerCase(),
        score: toNumberOrNull(item.score ?? item.Score),
        scoreValue: toNumberOrNull(item.scoreValue),
    };
};

const toSkillObjects = (value) => {
    if (!Array.isArray(value)) {
        return [];
    }

    return value.map(normalizeSkillObject).filter(Boolean);
};

const deriveSkillsFromAnswer = (answerObject) => {
    if (!answerObject || typeof answerObject !== "object") {
        return [];
    }

    const derivedSkills = toSkillObjects(answerObject.derivedSkills);
    if (derivedSkills.length > 0) {
        return derivedSkills;
    }

    const responseSkills = (answerObject.responses || [])
        .map((item) => normalizeSkillObject({ skill: item?.skill, level: item?.selectedLevel || item?.answer }))
        .filter(Boolean);

    if (responseSkills.length > 0) {
        const dedupedMap = new Map();
        responseSkills.forEach((item) => {
            const key = item.skill.toLowerCase();
            if (!dedupedMap.has(key)) {
                dedupedMap.set(key, item);
            }
        });
        return Array.from(dedupedMap.values());
    }

    return toArray(answerObject?.profile?.techstack).map((skill) => ({ skill, level: "", sfiaLevel: null }));
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
    const answerObject = toObject(source?.Answer ?? source?.answer ?? source?.AnswerJson ?? source?.answerJson);
    const roadmap =
        toObject(source?.RoadMapJson ?? source?.roadMapJson) ||
        toObject(source?.Roadmap ?? source?.roadmap) ||
        source?.Roadmap ||
        source?.roadmap ||
        null;

    const roles = toArray(target?.Roles || target?.roles || answerObject?.target?.roles).length
        ? toArray(target?.Roles || target?.roles || answerObject?.target?.roles)
        : toArray(answerObject?.profile?.role ? [answerObject.profile.role] : []);
    const level = String(
        target?.Level || target?.level || answerObject?.target?.level || answerObject?.profile?.level || "",
    ).trim();
    const skillsTarget = toArray(
        target?.SkillsTarget ||
            target?.skillsTarget ||
            target?.skills ||
            answerObject?.target?.skillsTarget ||
            answerObject?.profile?.techstack,
    );
    const currentSkills = toSkillObjects(current?.Skills || current?.skills || answerObject?.current?.skills);
    const fallbackAnswerSkills = currentSkills.length ? [] : deriveSkillsFromAnswer(answerObject);
    const missing = toArray(gap?.Missing || gap?.missing);
    const weak = toArray(gap?.Weak || gap?.weak);

    return {
        source,
        answer: answerObject,
        target: {
            roles,
            level,
            skillsTarget,
        },
        current: {
            skills: currentSkills.length ? currentSkills : fallbackAnswerSkills,
        },
        gap: {
            missing,
            weak,
        },
        roadmap,
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

    const currentSkillMap = new Map(
        normalized.current.skills.map((item) => [String(item.skill || "").toLowerCase(), item]),
    );

    const mergedSkills = Array.from(
        new Set([
            ...normalized.target.skillsTarget,
            ...normalized.current.skills.map((item) => item.skill),
            ...normalized.gap.missing,
            ...normalized.gap.weak,
        ]),
    ).filter(Boolean);

    const skillScores = mergedSkills.map((skill) => {
        const normalizedSkill = String(skill || "").toLowerCase();
        const currentSkill = currentSkillMap.get(normalizedSkill);
        const status = missingSet.has(normalizedSkill)
            ? "missing"
            : weakSet.has(normalizedSkill)
              ? "weak"
              : ["missing", "weak", "medium", "good"].includes(currentSkill?.status)
                ? currentSkill.status
                : "good";
        const inferredScore =
            currentSkill?.score ??
            (currentSkill?.scoreValue != null ? Math.round((currentSkill.scoreValue / 7) * 100) : null) ??
            (currentSkill?.sfiaLevel != null ? Math.round((Math.max(currentSkill.sfiaLevel, 0) / 7) * 100) : null);
        const score = Math.max(0, Math.min(100, inferredScore ?? statusScore[status] ?? 70));
        const sfiaLevel =
            currentSkill?.sfiaLevel != null
                ? Math.max(0, Math.round(currentSkill.sfiaLevel))
                : Math.max(1, Math.round((score / 100) * targetLevel));

        return {
            skillKey: skill,
            status,
            score,
            sfiaLevel,
            targetLevel,
            baseScore: score,
            selectedLevel: currentSkill?.level || status,
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
                role: normalized.answer?.profile?.role || normalized.target.roles[0] || "Candidate",
                level: normalized.answer?.profile?.level || normalized.target.level || "Mid-Level",
                techstack: normalized.answer?.profile?.techstack || normalized.target.skillsTarget,
                domain: normalized.answer?.profile?.domain || [],
                freeText: normalized.answer?.profile?.freeText || "Loaded from existing assessment data.",
            },
            responses:
                normalized.answer?.responses ||
                normalized.current.skills.map((skill) => ({
                    skill: skill.skill,
                    selectedLevel: skill.level || "Current",
                })),
        },
        surveyResult: {
            summaryObject: {
                loaded: {
                    Questions: normalized.current.skills.map((skill) => ({
                        Skill: skill.skill,
                        SelectedLevel: weakSet.has(String(skill?.skill || "").toLowerCase())
                            ? "Weak"
                            : skill.level || "Current",
                    })),
                },
            },
        },
        skillScores,
        matchPercentage,
        roadmap: normalized.roadmap,
    };
};

export const saveAssessmentAnswers = async (payload) => {
    const result = await assessmentApi.saveAnswers(payload);
    return result;
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
