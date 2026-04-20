import { METHOD } from "../../../../../common/constants/api";
import { axiosInstance, callApi } from "../../../../../common/utils/apiConnector";
import { assessmentEndPoints } from "../services/assessmentApi.js";

const ASSESSMENT_FORCE_REQUIRED_PREFIX = "assessment_force_required:";
const assessmentStateInFlight = new Map();

export const ASSESSMENT_DATA_STATE = {
    NO_RECORD: "no-record",
    ALL_EMPTY: "all-empty",
    HAS_DATA: "has-data",
};

const toArray = (value) => {
    if (!Array.isArray(value)) return [];
    return value
        .map((item) => {
            if (item === null || item === undefined) return "";
            if (typeof item === "string") return item.trim();
            return String(item).trim();
        })
        .filter(Boolean);
};

const toObject = (value) => {
    if (!value) return null;
    if (typeof value === "string") {
        try {
            const parsed = JSON.parse(value);
            return parsed && typeof parsed === "object" ? parsed : null;
        } catch {
            return null;
        }
    }
    return typeof value === "object" ? value : null;
};

const toNumberOrNull = (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
};

const toNumberOrZero = (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
};

const LEVEL_CODES = ["0", "1", "2", "3", "4"];
const toLevelCode = (value, fallback = "0") => {
    const asString = String(value ?? "")
        .trim()
        .toLowerCase();
    if (LEVEL_CODES.includes(asString)) return asString;
    if (["missing", "none"].includes(asString)) return "0";
    if (["basic", "beginner", "entry", "junior"].includes(asString)) return "1";
    if (["intermediate", "mid"].includes(asString)) return "2";
    if (["advanced", "senior"].includes(asString)) return "3";
    if (["expert", "lead", "principal", "staff"].includes(asString)) return "4";
    return fallback;
};

const levelCodeToScore = (levelCode) => {
    switch (toLevelCode(levelCode)) {
        case "0":
            return 0;
        case "1":
            return 35;
        case "2":
            return 60;
        case "3":
            return 80;
        case "4":
            return 95;
        default:
            return 0;
    }
};

const normalizeSkillObject = (item) => {
    if (!item) return null;
    if (typeof item === "string") {
        const skill = item.trim();
        return skill ? { skill, level: "", sfiaLevel: null } : null;
    }
    if (typeof item !== "object") return null;

    const skill = String(item.skill ?? item.Skill ?? "").trim();
    if (!skill) return null;

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
    if (!Array.isArray(value)) return [];
    return value.map(normalizeSkillObject).filter(Boolean);
};

const deriveSkillsFromAnswer = (answerObject) => {
    if (!answerObject || typeof answerObject !== "object") return [];

    const derivedSkills = toSkillObjects(answerObject.derivedSkills);
    if (derivedSkills.length > 0) return derivedSkills;

    const responseSkills = (answerObject.responses || [])
        .map((item) => normalizeSkillObject({ skill: item?.skill, level: item?.selectedLevel || item?.answer }))
        .filter(Boolean);

    if (responseSkills.length > 0) {
        const dedupedMap = new Map();
        responseSkills.forEach((item) => {
            const key = item.skill.toLowerCase();
            if (!dedupedMap.has(key)) dedupedMap.set(key, item);
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

const normalizeEvaluateSkill = (item) => {
    if (!item || typeof item !== "object") return null;
    const skill = String(item.skill ?? item.Skill ?? "").trim();
    if (!skill) return null;

    const level = toLevelCode(item.level ?? item.Level ?? item.selectedLevel ?? item.finalLevel, "0");
    const sfiaLevel = Math.max(0, Math.round(toNumberOrZero(item.sfiaLevel ?? item.SfiaLevel)));
    const score =
        item.score != null
            ? Math.max(0, Math.min(100, Math.round(toNumberOrZero(item.score))))
            : Math.max(0, Math.min(100, levelCodeToScore(level)));

    return { skill, level, sfiaLevel, score };
};

const normalizeEvaluateAnswerResponse = (item, index) => {
    if (!item || typeof item !== "object") return null;

    const questionId = String(item.questionId ?? item.QuestionId ?? `q_${index + 1}`).trim();
    const question = String(item.question ?? item.Question ?? "").trim();
    const phase = String(item.phase ?? item.Phase ?? "phaseA").trim();
    const inputSkill = String(item.inputSkill ?? item.InputSkill ?? item.skill ?? item.Skill ?? "").trim();
    const skill = String(item.skill ?? item.Skill ?? inputSkill).trim();
    const answer = String(item.answer ?? item.Answer ?? "").trim();
    const selectedLevelInput = String(
        item.selectedLevelInput ?? item.SelectedLevelInput ?? item.selectedLevel ?? item.SelectedLevel ?? "",
    ).trim();
    const selectedLevel = toLevelCode(item.selectedLevel ?? item.SelectedLevel ?? item.finalLevel ?? item.FinalLevel, "0");
    const finalLevel = toLevelCode(item.finalLevel ?? item.FinalLevel ?? selectedLevel, selectedLevel);
    const semanticLevel = toLevelCode(item.semanticLevel ?? item.SemanticLevel ?? finalLevel, finalLevel);
    const sfiaLevel = Math.max(0, Math.round(toNumberOrZero(item.sfiaLevel ?? item.SfiaLevel)));
    const score =
        item.score != null
            ? Math.max(0, Math.min(100, Math.round(toNumberOrZero(item.score))))
            : Math.max(0, Math.min(100, levelCodeToScore(finalLevel)));
    const rawStatus = String(item.status ?? item.Status ?? "").toLowerCase();
    const isMissing = Boolean(
        item.isMissing ?? item.IsMissing ?? (rawStatus ? rawStatus === "missing" : finalLevel === "0"),
    );

    return {
        questionId,
        question,
        phase,
        inputSkill,
        skill,
        answer,
        selectedLevelInput,
        selectedLevel,
        semanticLevel,
        finalLevel,
        sfiaLevel,
        score,
        isMissing,
    };
};

export const normalizeEvaluateResponse = (raw) => {
    const source = raw?.assessment || raw?.Assessment || raw || {};
    const directAnswer = source?.answer || source?.Answer || {};
    const answerObject = toObject(source?.Answer ?? source?.answer ?? source?.AnswerJson ?? source?.answerJson) || directAnswer;
    const profileSource = answerObject?.profile || {};
    const currentSource = source?.current || source?.Current || {};
    const gapSource = source?.gap || source?.Gap || {};

    const legacyCurrentSkills = toSkillObjects(currentSource?.skills || currentSource?.Skills || answerObject?.current?.skills);
    const legacyMissing = toArray(gapSource?.missing || gapSource?.Missing);

    const normalizedFromNew = {
        userId: source?.userId ?? source?.UserId ?? null,
        summaryText: String(source?.summaryText ?? source?.SummaryText ?? "").trim(),
        answer: {
            profile: {
                role: String(profileSource?.role || "").trim(),
                level: String(profileSource?.level || "").trim(),
                techstack: toArray(profileSource?.techstack),
                domain: toArray(profileSource?.domain),
                freeText: String(profileSource?.freeText || "").trim(),
            },
            responses: Array.isArray(answerObject?.responses)
                ? answerObject.responses.map(normalizeEvaluateAnswerResponse).filter(Boolean)
                : [],
            overallScore: toNumberOrZero(answerObject?.overallScore),
            overallLevel: String(answerObject?.overallLevel ?? "None").trim() || "None",
        },
        target: {},
        current: {
            skills: Array.isArray(currentSource?.skills)
                ? currentSource.skills.map(normalizeEvaluateSkill).filter(Boolean)
                : [],
        },
        missing: toArray(source?.missing),
    };

    if (normalizedFromNew.answer.responses.length > 0 || normalizedFromNew.current.skills.length > 0) {
        return normalizedFromNew;
    }

    const fallbackResponses = Array.isArray(answerObject?.responses)
        ? answerObject.responses.map(normalizeEvaluateAnswerResponse).filter(Boolean)
        : [];
    const fallbackSkills =
        legacyCurrentSkills.length > 0
            ? legacyCurrentSkills.map((item) => ({
                  skill: item.skill,
                  level: toLevelCode(item.level, "0"),
                  sfiaLevel: Math.max(0, Math.round(toNumberOrZero(item.sfiaLevel))),
                  score:
                      item.score != null
                          ? Math.max(0, Math.min(100, Math.round(toNumberOrZero(item.score))))
                          : Math.max(0, Math.min(100, levelCodeToScore(toLevelCode(item.level, "0")))),
              }))
            : deriveSkillsFromAnswer(answerObject).map((item) => {
                  const level = toLevelCode(item.level, "0");
                  return {
                      skill: item.skill,
                      level,
                      sfiaLevel: Math.max(0, Math.round(toNumberOrZero(item.sfiaLevel))),
                      score: levelCodeToScore(level),
                  };
              });

    const computedOverallScore =
        fallbackSkills.length > 0
            ? Math.round(fallbackSkills.reduce((sum, item) => sum + (item.score || 0), 0) / fallbackSkills.length)
            : 0;

    return {
        userId: source?.userId ?? source?.UserId ?? null,
        summaryText: String(source?.summaryText ?? source?.SummaryText ?? "").trim(),
        answer: {
            profile: {
                role: String(profileSource?.role || "").trim(),
                level: String(profileSource?.level || "").trim(),
                techstack: toArray(profileSource?.techstack),
                domain: toArray(profileSource?.domain),
                freeText: String(profileSource?.freeText || "").trim(),
            },
            responses: fallbackResponses,
            overallScore: toNumberOrZero(answerObject?.overallScore ?? computedOverallScore),
            overallLevel: String(answerObject?.overallLevel ?? "None").trim() || "None",
        },
        target: {},
        current: {
            skills: fallbackSkills,
        },
        missing: legacyMissing,
    };
};

export const hasAnyAssessmentFieldData = (data) => {
    const normalized = normalizeEvaluateResponse(data);
    return (
        normalized.answer.responses.length > 0 ||
        normalized.current.skills.length > 0 ||
        normalized.missing.length > 0 ||
        Boolean(normalized.summaryText)
    );
};

export const mapAssessmentPayloadToResult = (data, userId) => {
    const normalized = normalizeEvaluateResponse(data);
    const hasAnyData =
        normalized.answer.responses.length > 0 || normalized.current.skills.length > 0 || normalized.missing.length > 0;
    if (!hasAnyData) return null;

    const targetLevel = mapTargetLevel(normalized.answer.profile.level);
    const missingSet = new Set(normalized.missing.map((item) => String(item || "").toLowerCase()));
    const skillScores = normalized.current.skills.map((item) => {
        const levelCode = toLevelCode(item.level, "0");
        const isMissing = missingSet.has(String(item.skill || "").toLowerCase()) || levelCode === "0";
        const status = isMissing ? "missing" : levelCode === "1" ? "weak" : levelCode === "2" ? "medium" : "good";
        const score = Math.max(0, Math.min(100, toNumberOrZero(item.score) || levelCodeToScore(levelCode)));
        return {
            skillKey: item.skill,
            status,
            score,
            sfiaLevel: Math.max(0, Math.round(toNumberOrZero(item.sfiaLevel))),
            targetLevel,
            baseScore: score,
            selectedLevel: levelCode,
        };
    });

    const overallScore = toNumberOrZero(normalized.answer.overallScore);
    const overallPercent = overallScore <= 4 ? overallScore * 25 : overallScore;
    const matchPercentage =
        overallPercent > 0
            ? Math.max(0, Math.min(100, Math.round(overallPercent)))
            : skillScores.length > 0
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
            userId: normalized.userId || userId || null,
            profile: {
                role: normalized.answer.profile.role || "Candidate",
                level: normalized.answer.profile.level || "Mid-Level",
                techstack: normalized.answer.profile.techstack || [],
                domain: normalized.answer.profile.domain || [],
                freeText: normalized.answer.profile.freeText || "",
            },
            responses: normalized.answer.responses,
            answerJson: {
                responses: normalized.answer.responses,
                skillScores,
                matchPercentage,
            },
            evaluateResponse: normalized,
            processingPayload: {
                answer: {
                    profile: normalized.answer.profile,
                    responses: normalized.answer.responses.map((item) => ({
                        questionId: item.questionId,
                        question: item.question,
                        phase: item.phase,
                        skill: item.skill,
                        answer: item.answer,
                        selectedLevel: item.selectedLevelInput || item.selectedLevel,
                    })),
                },
            },
        },
        surveyResult: normalized,
        skillScores,
        matchPercentage,
        roadmap: data?.roadmap || data?.Roadmap || null,
    };
};

export const hasSkillGapData = (data) => {
    if (data == null) return false;
    if (Array.isArray(data)) return data.length > 0;
    if (typeof data !== "object") return Boolean(data);

    const values = Object.values(data);
    if (!values.length) return false;

    return values.some((value) => {
        if (Array.isArray(value)) {
            if (!value.length) return false;
            return value.some((item) => {
                if (item && typeof item === "object") return hasSkillGapData(item);
                return item !== null && item !== undefined && String(item).trim() !== "";
            });
        }

        if (value && typeof value === "object") return hasSkillGapData(value);
        return value !== null && value !== undefined && String(value).trim() !== "";
    });
};

export const getAssessmentData = async (userId) => {
    if (!userId) return null;
    const res = await callApi({
        method: METHOD.GET,
        endpoint: assessmentEndPoints.GET_SKILL_GAPS(userId),
        alertErrorMessage: false,
        useGlobalLoading: false,
    });
    if (!res?.success) return null;
    return res?.data ?? null;
};

export const getAssessmentState = async (userId) => {
    if (!userId) return { status: ASSESSMENT_DATA_STATE.NO_RECORD, data: null, httpStatus: null };
    const key = String(userId);

    if (assessmentStateInFlight.has(key)) {
        return assessmentStateInFlight.get(key);
    }

    const promise = (async () => {
        try {
            const data = await getAssessmentData(userId);
            if (!hasAnyAssessmentFieldData(data)) {
                return { status: ASSESSMENT_DATA_STATE.ALL_EMPTY, data, httpStatus: 200 };
            }
            return { status: ASSESSMENT_DATA_STATE.HAS_DATA, data, httpStatus: 200 };
        } catch (error) {
            const status = error?.response?.status;
            if (status === 404) return { status: ASSESSMENT_DATA_STATE.NO_RECORD, data: null, httpStatus: 404 };
            throw error;
        } finally {
            assessmentStateInFlight.delete(key);
        }
    })();

    assessmentStateInFlight.set(key, promise);
    return promise;
};

export const getAssessmentForceRequiredKey = (userId) => `${ASSESSMENT_FORCE_REQUIRED_PREFIX}${userId ?? ""}`;

export const isAssessmentForceRequired = (userId) => {
    if (!userId) return false;
    try {
        return localStorage.getItem(getAssessmentForceRequiredKey(userId)) === "true";
    } catch {
        return false;
    }
};

export const setAssessmentForceRequired = (userId, required) => {
    if (!userId) return;
    try {
        localStorage.setItem(getAssessmentForceRequiredKey(userId), required ? "true" : "false");
    } catch {
        // ignore storage errors
    }
};

export const saveSkippedAssessment = async (userId, customPayload = null) => {
    if (!userId) return false;

    const payload = customPayload || {
        UserId: userId,
        AssessmentName: "Skipped Assessment",
        Responses: [],
        Target: { Roles: [], Level: "", SkillsTarget: [] },
        Current: { Skills: [] },
        Gap: { Missing: [], Weak: [] },
        Roadmap: { roadmap_metadata: { target_role: "", target_level: "", total_phases: 0 }, phases: [] },
        Answer: { profile: { role: "", level: "", techstack: [], domain: [], freeText: "" }, responses: [] },
    };

    try {
        try {
            const res = await callApi({
                method: METHOD.POST,
                endpoint: assessmentEndPoints.PROCESS_SURVEY_RESPONSES(),
                arg: payload,
                alertErrorMessage: false,
                useGlobalLoading: false,
            });
            return Boolean(res?.success) || Boolean(res);
        } catch (error) {
            try {
                const primary = await axiosInstance.post(assessmentEndPoints.PROCESS_SURVEY_RESPONSES(), payload);
                if (primary?.status >= 200 && primary?.status < 300) return true;
            } catch {
                const fb = await axiosInstance.post(assessmentEndPoints.PROCESS_SURVEY_RESPONSES_FALLBACK(), payload);
                if (fb?.status >= 200 && fb?.status < 300) return true;
                throw error;
            }
            return false;
        }
    } catch (error) {
        console.warn("Save skipped assessment failed:", error);
        return false;
    }
};

export const saveAssessmentAnswers = async (payload) =>
    callApi({
        method: METHOD.POST,
        endpoint: assessmentEndPoints.SAVE_ANSWERS(),
        arg: payload,
        alertErrorMessage: true,
        useGlobalLoading: false,
    });
