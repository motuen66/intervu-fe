import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import {
    Avatar,
    Box,
    Button,
    Chip,
    CircularProgress,
    DialogActions,
    Dialog,
    DialogContent,
    LinearProgress,
    Paper,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { keyframes } from "@mui/system";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import AccountBalanceRoundedIcon from "@mui/icons-material/AccountBalanceRounded";
import AddCircleOutlineRoundedIcon from "@mui/icons-material/AddCircleOutlineRounded";
import HealthAndSafetyRoundedIcon from "@mui/icons-material/HealthAndSafetyRounded";
import KeyboardBackspaceRoundedIcon from "@mui/icons-material/KeyboardBackspaceRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import SkipNextRoundedIcon from "@mui/icons-material/SkipNextRounded";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";
import ShoppingBagRoundedIcon from "@mui/icons-material/ShoppingBagRounded";
import SportsEsportsRoundedIcon from "@mui/icons-material/SportsEsportsRounded";
import { useNavigate } from "react-router-dom";
import { useAssessment } from "../context/AssessmentContext";
import { assessmentEndPoints } from "../services/assessmentApi.js";
import {
    mapAssessmentPayloadToResult,
    saveSkippedAssessment,
    setAssessmentForceRequired,
} from "../helpers/assessmentHelper";
import { callApi } from "../../../../../common/utils/apiConnector";
import { METHOD } from "../../../../../common/constants/api";
import {
    ASSESSMENT_PROGRESS_EXPIRY_MS,
    clearProgressCache,
    getProgressDataFromCache,
    isProgressCacheValid,
    setProgressCache,
} from "../../../../../common/utils/assessmentCache";

const setupFields = [
    {
        id: "role",
        label: "Target Role",
        step: "1.",
        type: "single",
        options: ["Backend", "Frontend", "Fullstack", "Mobile", "DevOps", "Data Science"],
        placeholder: "Or type your target role",
        hoverNote: "This should be the role you are targeting now, not every role you have tried before.",
        required: true,
    },
    {
        id: "level",
        label: "Target Level",
        step: "2.",
        type: "single",
        options: ["Entry", "Junior", "Mid-Level", "Senior", "Staff / Lead"],
        placeholder: "Or describe your current level",
        hoverNote: "Choose the level that matches your target role today, not your past experience.",
        required: true,
    },
    {
        id: "techstack",
        label: "Primary Stack",
        step: "3.",
        type: "multi",
        options: ["React", "TypeScript", "Node.js", "Python", "Go", "GraphQL", "PostgreSQL", "AWS"],
        placeholder: "Example: TypeScript, React, Node.js",
        hoverNote: "This is your current focus stack, not every technology you have ever touched or learned.",
        required: true,
    },
    {
        id: "domain",
        label: "Industry Domain",
        step: "4.",
        type: "multi",
        options: ["FinTech", "E-commerce", "HealthTech", "Gaming", "AI/ML", "Other"],
        placeholder: "Example: FinTech, SaaS",
        hoverNote: "Share the business area you want to move into most, even if your past projects were different.",
        required: false,
    },
    {
        id: "freeText",
        label: "Tell Us More",
        step: "5.",
        type: "freeText",
        placeholder: "Highlight specific projects or unique skills...",
        hoverNote: "Use this to guide the assessment design with context that chips alone cannot capture.",
        required: false,
    },
];

const floatUp = keyframes`
    from { opacity: 0; transform: translateY(22px) scale(0.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
`;

const pulseDots = keyframes`
    0%, 80%, 100% { transform: scale(0.6); opacity: 0.35; }
    40% { transform: scale(1); opacity: 1; }
`;

const glowShift = keyframes`
    0% { transform: translate3d(0, 0, 0) scale(1); }
    50% { transform: translate3d(10px, -8px, 0) scale(1.05); }
    100% { transform: translate3d(0, 0, 0) scale(1); }
`;

const normalizeToArray = (value) =>
    value
        ? value
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean)
        : [];

const shuffleArray = (list = []) => {
    const arr = [...list];
    for (let i = arr.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};

const stackKeywordMap = {
    react: ["react", "jsx", "component", "hook", "state", "redux", "context", "frontend", "ui"],
    typescript: ["typescript", "type", "typing", "generic", "interface", "ts"],
    "node.js": ["node", "express", "api", "backend", "server", "rest", "middleware"],
    python: ["python", "django", "flask", "fastapi"],
    go: ["go", "golang", "goroutine", "concurrency"],
    graphql: ["graphql", "resolver", "schema", "apollo"],
    postgresql: ["postgresql", "postgres", "sql", "query", "join", "index", "database", "schema"],
    aws: ["aws", "cloud", "lambda", "s3", "ec2", "deployment"],
    java: ["java", "jvm", "spring"],
    "spring boot": ["spring", "spring boot", "java"],
};

const levelScoreMap = {
    none: 0,
    missing: 0,
    beginner: 1,
    basic: 2,
    entry: 2,
    junior: 3,
    intermediate: 4,
    mid: 4,
    comfortable: 4,
    confident: 4,
    advanced: 6,
    senior: 6,
    expert: 7,
};

const normalizeLabel = (value) =>
    String(value || "")
        .trim()
        .toLowerCase();

const inferLevelScore = (value) => {
    const normalized = normalizeLabel(value);

    for (const [label, score] of Object.entries(levelScoreMap)) {
        if (normalized.includes(label)) {
            return score;
        }
    }

    return 2;
};

const mapScoreToLevelLabel = (score) => {
    if (score <= 1) return "Missing";
    if (score <= 3) return "Weak";
    if (score <= 5) return "Intermediate";
    return "Advanced";
};

const getStackKeywords = (stack) => {
    const normalized = normalizeLabel(stack);
    return Array.from(new Set([normalized, ...(stackKeywordMap[normalized] || [])])).filter(Boolean);
};

const buildStackDrivenSkills = (techstack = [], responses = []) =>
    techstack.map((stack) => {
        const keywords = getStackKeywords(stack);
        const relatedResponses = responses.filter((response) => {
            const haystack = `${response.skill || ""} ${response.question || ""}`.toLowerCase();
            return keywords.some((keyword) => haystack.includes(keyword));
        });

        if (!relatedResponses.length) {
            return {
                skillKey: stack,
                selectedLevel: "Missing",
                scoreValue: 0,
                status: "missing",
            };
        }

        const averageScore =
            relatedResponses.reduce(
                (sum, response) => sum + inferLevelScore(response.selectedLevel || response.answer),
                0,
            ) / relatedResponses.length;

        const roundedScore = Math.round(averageScore * 10) / 10;
        const status =
            roundedScore <= 1 ? "missing" : roundedScore <= 3 ? "weak" : roundedScore <= 5 ? "medium" : "good";

        return {
            skillKey: stack,
            selectedLevel: mapScoreToLevelLabel(roundedScore),
            scoreValue: roundedScore,
            status,
        };
    });

const toggleHintValue = (currentValue, nextValue) => {
    const currentItems = normalizeToArray(currentValue);
    const hasValue = currentItems.some((item) => item.toLowerCase() === nextValue.toLowerCase());
    if (hasValue) {
        return currentItems.filter((item) => item.toLowerCase() !== nextValue.toLowerCase()).join(", ");
    }
    return [...currentItems, nextValue].join(", ");
};

const sleep = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

const toQuestionOptions = (rawOptions) => {
    if (!Array.isArray(rawOptions)) {
        return [];
    }

    return rawOptions
        .map((option) => {
            if (typeof option === "string") {
                const text = option.trim();
                return text ? { text, level: text } : null;
            }

            if (!option || typeof option !== "object") {
                return null;
            }

            const text = String(
                option.text ?? option.Text ?? option.label ?? option.Label ?? option.level ?? "",
            ).trim();
            const level = String(option.level ?? option.Level ?? option.text ?? option.Text ?? "").trim();
            if (!text) {
                return null;
            }

            return {
                text,
                level: level || text,
            };
        })
        .filter(Boolean);
};

const buildGeneratedQuestions = (data) => {
    const phaseA = Array.isArray(data?.phaseA) ? data.phaseA : Array.isArray(data?.PhaseA) ? data.PhaseA : [];
    const phaseB = Array.isArray(data?.phaseB) ? data.phaseB : Array.isArray(data?.PhaseB) ? data.PhaseB : [];
    const questions = [];

    phaseA.forEach((item, index) => {
        const optionPairs = toQuestionOptions(item?.options || item?.Options);
        const shuffled = shuffleArray(optionPairs);

        questions.push({
            id: `phaseA_${index + 1}`,
            phase: "phaseA",
            skill: item?.skill || item?.Skill || `Phase A Skill ${index + 1}`,
            type: "single",
            question: item?.question || item?.Question || `Phase A question ${index + 1}`,
            helper: "Choose the option that best matches your real experience.",
            options: shuffled.map((option) => option.text).filter(Boolean),
            optionLevels: shuffled,
        });
    });

    phaseB.forEach((item, index) => {
        const optionPairs = toQuestionOptions(item?.options || item?.Options);
        const shuffled = shuffleArray(optionPairs);

        questions.push({
            id: `phaseB_${index + 1}`,
            phase: "phaseB",
            skill: item?.skill || item?.Skill || `Phase B Skill ${index + 1}`,
            type: "single",
            question: item?.question || item?.Question || `Phase B question ${index + 1}`,
            helper: "Choose the target level you want to reach.",
            options: shuffled.map((option) => option.text).filter(Boolean),
            optionLevels: shuffled,
        });
    });

    return questions;
};

const buildGeneratedAssessment = (data) => {
    const response = data || {};
    const nested = response?.data || {};
    const assessmentRoot =
        response?.assessment || response?.Assessment || nested?.assessment || nested?.Assessment || null;
    const source = assessmentRoot && typeof assessmentRoot === "object" ? assessmentRoot : response;
    const sourceWithFallback = source?.phaseA || source?.PhaseA || source?.phaseB || source?.PhaseB ? source : nested;
    const contextQuestion =
        sourceWithFallback?.contextQuestion ||
        sourceWithFallback?.ContextQuestion ||
        sourceWithFallback?.context_question ||
        response?.contextQuestion ||
        response?.ContextQuestion ||
        response?.context_question ||
        sourceWithFallback?.question ||
        sourceWithFallback?.Question;

    return {
        introText:
            contextQuestion ||
            "Profile calibrated. I'm generating a focused interview conversation based on your setup.",
        questions: buildGeneratedQuestions(sourceWithFallback),
    };
};

const buildFallbackSurveyResult = (profile, responses) => ({
    userId: null,
    summaryText: "",
    answer: {
        profile,
        responses,
        overallScore: 0,
        overallLevel: "None",
    },
    target: {},
    current: { skills: [] },
    missing: [],
});

const createFallbackQuestions = () => [
    {
        id: "phaseA_1",
        phase: "phaseA",
        skill: "Problem Solving",
        type: "single",
        question: "How much real project experience do you have solving technical problems in your main stack?",
        helper: "Choose the option that best matches your real experience.",
        ...(() => {
            const optionPairs = [
                { text: "None", level: "None" },
                { text: "Basic", level: "Basic" },
                { text: "Intermediate", level: "Intermediate" },
                { text: "Advanced", level: "Advanced" },
            ];
            const shuffled = shuffleArray(optionPairs);
            return {
                options: shuffled.map((opt) => opt.text),
                optionLevels: shuffled,
            };
        })(),
    },
];

const domainIconMap = {
    FinTech: AccountBalanceRoundedIcon,
    "E-commerce": ShoppingBagRoundedIcon,
    HealthTech: HealthAndSafetyRoundedIcon,
    Gaming: SportsEsportsRoundedIcon,
    "AI/ML": SmartToyRoundedIcon,
    Other: AddCircleOutlineRoundedIcon,
};

const getOptionHintText = (field, option) => {
    if (field.id === "role") {
        return `Choose only your current target role. ${option} should reflect what you are practicing now.`;
    }

    if (field.id === "level") {
        return "Pick your current level today, not your ideal future level.";
    }

    if (field.id === "techstack") {
        return `Select focused stack only. ${option} should be in your active interview prep scope.`;
    }

    if (field.id === "domain") {
        return `Pick domains you are currently targeting. ${option} helps context, not full history.`;
    }

    return "Choose only what you are focusing on right now.";
};

const TypingIndicator = () => (
    <Stack direction="row" spacing={0.7} alignItems="center" sx={{ minHeight: 24 }}>
        {[0, 1, 2].map((dot) => (
            <Box
                key={dot}
                sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    bgcolor: "text.secondary",
                    animation: `${pulseDots} 1.2s ease-in-out infinite`,
                    animationDelay: `${dot * 0.15}s`,
                }}
            />
        ))}
        <Typography variant="body2" color="text.secondary" sx={{ ml: 0.6 }}>
            Processing...
        </Typography>
    </Stack>
);

const ChatSurvey = () => {
    const { setAnswers, setSurveyResult, setSkillScores, setRoadmap, updateMatchPercentage, nextStep } =
        useAssessment();
    const currentUser = useSelector((state) => state.auth?.userData);
    const navigate = useNavigate();
    const theme = useTheme();
    const listRef = useRef(null);
    const mountedRef = useRef(true);
    const sequenceRef = useRef(0);
    const generateTimerRef = useRef(null);
    const inputRef = useRef(null);

    const [stage, setStage] = useState("setup");
    const [setupSubStep, setSetupSubStep] = useState(1);
    const [setupForm, setSetupForm] = useState({
        role: "Backend",
        level: "Junior Associate",
        techstack: "",
        domain: "",
        freeText: "",
    });
    const [setupErrors, setSetupErrors] = useState({});
    const [chatQuestions, setChatQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [chatDraft, setChatDraft] = useState("");
    const [answerMap, setAnswerMap] = useState({});
    const [messages, setMessages] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generateProgress, setGenerateProgress] = useState(0);
    const [showGenerateDialog, setShowGenerateDialog] = useState(false);
    const [showSkipConfirmDialog, setShowSkipConfirmDialog] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isBotResponding, setIsBotResponding] = useState(false);
    const [isSkipping, setIsSkipping] = useState(false);
    const assessmentUserId = currentUser?.id;

    const currentQuestion = chatQuestions[currentIndex] || null;
    const totalQuestions = chatQuestions.length;
    const answeredCount = Object.keys(answerMap).length;
    const progress = totalQuestions ? Math.round((answeredCount / totalQuestions) * 100) : 0;
    const hasResumableAssessment = totalQuestions > 0;
    const activeQuestionNumber = Math.min(currentIndex + 1, Math.max(totalQuestions, 1));
    const progressValue = Math.max(progress, answeredCount ? 6 : 2);
    const isFinalQuestion = answeredCount === totalQuestions - 1;
    const roleField = setupFields.find((field) => field.id === "role");
    const levelField = setupFields.find((field) => field.id === "level");
    const techstackField = setupFields.find((field) => field.id === "techstack");
    const domainField = setupFields.find((field) => field.id === "domain");
    const freeTextField = setupFields.find((field) => field.id === "freeText");
    const selectedTechstackValues = normalizeToArray(setupForm.techstack);
    const selectedDomainValues = normalizeToArray(setupForm.domain);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            sequenceRef.current += 1;
            if (generateTimerRef.current) {
                window.clearInterval(generateTimerRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        setChatDraft(answerMap[currentQuestion?.id] || "");
    }, [currentQuestion, answerMap]);

    useEffect(() => {
        if (!isBotResponding && !isSubmitting) {
            inputRef.current?.focus();
        }
    }, [isBotResponding, isSubmitting, currentQuestion]);

    useEffect(() => {
        if (!assessmentUserId) {
            return;
        }

        if (!isProgressCacheValid(assessmentUserId, ASSESSMENT_PROGRESS_EXPIRY_MS)) {
            clearProgressCache(assessmentUserId);
            return;
        }

        const cached = getProgressDataFromCache(assessmentUserId);
        if (!cached || typeof cached !== "object") {
            return;
        }

        if (cached.stage === "chat") {
            setStage("chat");
        }

        if (cached.setupForm && typeof cached.setupForm === "object") {
            setSetupForm((prev) => ({ ...prev, ...cached.setupForm }));
        }

        if (cached.setupSubStep === 2) {
            setSetupSubStep(2);
        }

        if (Array.isArray(cached.chatQuestions) && cached.chatQuestions.length > 0) {
            setChatQuestions(cached.chatQuestions);
            const maxIndex = cached.chatQuestions.length - 1;
            const safeIndex = Number.isInteger(cached.currentIndex)
                ? Math.min(Math.max(cached.currentIndex, 0), maxIndex)
                : 0;
            setCurrentIndex(safeIndex);
        }

        if (cached.answerMap && typeof cached.answerMap === "object") {
            setAnswerMap(cached.answerMap);
        }

        if (Array.isArray(cached.messages)) {
            setMessages(cached.messages);
        }
    }, [assessmentUserId]);

    useEffect(() => {
        if (!assessmentUserId) {
            return;
        }

        const cachePayload = {
            stage,
            setupSubStep,
            setupForm,
        };

        if (chatQuestions.length > 0) {
            Object.assign(cachePayload, {
                chatQuestions,
                currentIndex,
                answerMap,
                messages,
            });
        }

        setProgressCache(assessmentUserId, cachePayload);
    }, [answerMap, assessmentUserId, chatQuestions, currentIndex, setupForm, setupSubStep, stage, messages]);

    const responses = useMemo(
        () =>
            chatQuestions
                .filter((question) => answerMap[question.id])
                .map((question) => {
                    const answer = answerMap[question.id];
                    const matchedOption = question.optionLevels?.find((option) => option.text === answer);

                    return {
                        questionId: question.id,
                        question: question.question,
                        phase: question.phase,
                        skill: question.skill,
                        answer,
                        selectedLevel: matchedOption?.level || answer,
                    };
                }),
        [answerMap, chatQuestions],
    );

    const appendUserMessage = (text, questionId) => {
        setMessages((prev) => [
            ...prev,
            {
                id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                sender: "user",
                text,
                questionId,
                animateIn: true,
            },
        ]);
    };

    const runBotMessage = async (text, options = {}) => {
        const token = ++sequenceRef.current;
        const messageId = `bot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        if (!mountedRef.current) {
            return false;
        }

        setIsBotResponding(true);
        setMessages((prev) => [
            ...prev,
            { id: messageId, sender: "bot", text: "", questionId: options.questionId, status: "processing" },
        ]);

        await sleep(options.processingMs ?? 1400);
        if (!mountedRef.current || token !== sequenceRef.current) {
            return false;
        }

        const words = text.split(/\s+/).filter(Boolean);
        const animatedWordCount = Math.min(words.length, 10);
        const animatedWords = words.slice(0, animatedWordCount);
        const remainingText = words.slice(animatedWordCount).join(" ");
        let visibleText = "";
        setMessages((prev) =>
            prev.map((message) => (message.id === messageId ? { ...message, status: "typing", text: "" } : message)),
        );

        for (const word of animatedWords) {
            visibleText = visibleText ? `${visibleText} ${word}` : word;
            setMessages((prev) =>
                prev.map((message) =>
                    message.id === messageId ? { ...message, status: "typing", text: visibleText } : message,
                ),
            );

            const pause = /[.!?]$/.test(word) ? 180 : /[,;:]$/.test(word) ? 120 : 60;
            await sleep(pause);
            if (!mountedRef.current || token !== sequenceRef.current) {
                return false;
            }
        }

        if (remainingText) {
            visibleText = `${visibleText} ${remainingText}`.trim();
            setMessages((prev) =>
                prev.map((message) =>
                    message.id === messageId ? { ...message, status: "typing", text: visibleText } : message,
                ),
            );
            await sleep(140);
        }

        setMessages((prev) =>
            prev.map((message) => (message.id === messageId ? { ...message, status: "done", text } : message)),
        );
        setIsBotResponding(false);
        return true;
    };

    const validateSetupForm = () => {
        const nextErrors = {};
        setupFields.forEach((field) => {
            if (field.required && !setupForm[field.id]?.trim()) {
                nextErrors[field.id] = `${field.label} is required before we can generate your assessment.`;
            }
        });
        setSetupErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleSetupChange = (fieldId, value) => {
        let nextValue = value;
        if (fieldId === "freeText") {
            nextValue = String(value || "").replace(/\r?\n+/g, " ");
        }

        setSetupForm((prev) => ({ ...prev, [fieldId]: nextValue }));
        setSetupErrors((prev) => {
            if (!prev[fieldId]) {
                return prev;
            }
            const nextErrors = { ...prev };
            delete nextErrors[fieldId];
            return nextErrors;
        });
    };

    const startGenerateProgress = () => {
        setGenerateProgress(6);
        setShowGenerateDialog(true);

        if (generateTimerRef.current) {
            window.clearInterval(generateTimerRef.current);
        }

        generateTimerRef.current = window.setInterval(() => {
            setGenerateProgress((prev) => (prev >= 88 ? prev : Math.min(88, prev + Math.random() * 12)));
        }, 280);
    };

    const finishGenerateProgress = async () => {
        if (generateTimerRef.current) {
            window.clearInterval(generateTimerRef.current);
            generateTimerRef.current = null;
        }

        setGenerateProgress(90);
        await sleep(180);
        setGenerateProgress(96);
        await sleep(180);
        setGenerateProgress(100);
        await sleep(240);

        if (mountedRef.current) {
            setShowGenerateDialog(false);
            setGenerateProgress(0);
        }
    };

    const startGeneratedAssessment = async (generatedQuestions, introText) => {
        setChatQuestions(generatedQuestions);
        setAnswerMap({});
        setMessages([]);
        setCurrentIndex(0);
        setChatDraft("");
        setStage("chat");

        await sleep(120);
        const introCompleted = await runBotMessage(introText);
        if (!introCompleted || !generatedQuestions.length) {
            return;
        }
        await runBotMessage(generatedQuestions[0].question, {
            questionId: generatedQuestions[0].id,
            processingMs: 1250,
        });
    };

    const requestGeneratedQuestions = async () => {
        if (!validateSetupForm() || isGenerating || isSubmitting || isBotResponding) {
            return;
        }

        const payload = {
            role: setupForm.role || "",
            level: setupForm.level || "",
            techstack: normalizeToArray(setupForm.techstack || ""),
            domain: normalizeToArray(setupForm.domain || ""),
            freeText: setupForm.freeText || "",
        };

        setIsGenerating(true);
        startGenerateProgress();

        try {
            const apiResult = await callApi({
                method: METHOD.POST,
                endpoint: assessmentEndPoints.GENERATE_ASSESSMENT,
                arg: payload,
                alertErrorMessage: true,
                useGlobalLoading: false,
            });
            const { introText, questions: generatedQuestions } = buildGeneratedAssessment(apiResult?.data || apiResult);
            if (!generatedQuestions.length) {
                throw new Error("Assessment generator returned no questions.");
            }
            await finishGenerateProgress();
            await startGeneratedAssessment(generatedQuestions, introText);
        } catch (error) {
            console.error(error);
            await finishGenerateProgress();
            await startGeneratedAssessment(
                createFallbackQuestions(),
                "I couldn't load the full AI question set just now, so I'm starting with a smart fallback question.",
            );
        } finally {
            if (mountedRef.current) {
                setIsGenerating(false);
            }
        }
    };

    const submitSurvey = async (nextAnswerMap, questionSet) => {
        const finalResponses = questionSet
            .filter((question) => nextAnswerMap[question.id])
            .map((question) => {
                const answer = nextAnswerMap[question.id];
                const matchedOption = question.optionLevels?.find((option) => option.text === answer);
                return {
                    questionId: question.id,
                    question: question.question,
                    phase: question.phase,
                    skill: question.skill,
                    answer,
                    selectedLevel: matchedOption?.level || answer,
                };
            });

        const role = setupForm.role || "";
        const level = setupForm.level || "";
        const techstack = normalizeToArray(setupForm.techstack || "");
        const domain = normalizeToArray(setupForm.domain || "");
        const userId = currentUser?.id || "00000000-0000-0000-0000-000000000000";
        const derivedSkills = buildStackDrivenSkills(techstack, finalResponses);
        const answerJson = {
            profile: {
                role,
                level,
                techstack,
                domain,
                freeText: setupForm.freeText || "",
            },
            responses: finalResponses,
            derivedSkills,
        };

        const answerSnapshot = {
            profile: {
                role,
                level,
                techstack,
                domain,
                freeText: setupForm.freeText || "",
            },
            responses: finalResponses,
        };
        const payload = {
            userId,
            answer: answerSnapshot,
        };

        setAnswers({
            profile: { role, level, techstack, domain, freeText: setupForm.freeText || "" },
            userId,
            responses: finalResponses,
            derivedSkills,
            answerJson,
            processingPayload: payload,
        });

        setIsSubmitting(true);
        await runBotMessage("Thanks. I'm analyzing your answers now.", { processingMs: 1500 });

        try {
            const processResult = await callApi({
                method: METHOD.POST,
                // MIGRATION: evaluate-assessment now requires payload shape { answer: { profile, responses } }
                endpoint: assessmentEndPoints.EVALUATE_ASSESSMENT(),
                arg: payload,
                alertErrorMessage: false,
                useGlobalLoading: false,
            });

            if (!processResult?.success) {
                throw new Error("Evaluate assessment failed.");
            }

            const evaluatePayload = processResult?.data?.data || processResult?.data || null;
            const mappedResult = mapAssessmentPayloadToResult(evaluatePayload, userId);

            if (mappedResult) {
                setAnswers({
                    ...mappedResult.answers,
                    answerJson: {
                        ...answerJson,
                        skillScores: mappedResult.skillScores || [],
                        matchPercentage: mappedResult.matchPercentage || 0,
                    },
                    processingPayload: payload,
                });
                setSkillScores(mappedResult.skillScores || []);
                updateMatchPercentage(mappedResult.matchPercentage || 0);
                setRoadmap(mappedResult.roadmap || { today: [], weeks: [] });
                setSurveyResult(
                    mappedResult.surveyResult ||
                        evaluatePayload ||
                        buildFallbackSurveyResult(answerSnapshot.profile, finalResponses),
                );
            } else {
                setAnswers((prev) => ({
                    ...(prev || {}),
                    answerJson,
                    processingPayload: payload,
                }));
                setSkillScores([]);
                updateMatchPercentage(0);
                setSurveyResult(evaluatePayload || buildFallbackSurveyResult(answerSnapshot.profile, finalResponses));
            }
        } catch (error) {
            console.warn("Evaluate assessment failed. Falling back to local result.", error);
            setAnswers((prev) => ({
                ...(prev || {}),
                answerJson,
                processingPayload: payload,
            }));
            setSkillScores([]);
            updateMatchPercentage(0);
            setSurveyResult(buildFallbackSurveyResult(answerSnapshot.profile, finalResponses));
        } finally {
            if (mountedRef.current) {
                setIsSubmitting(false);
            }
            clearProgressCache(currentUser?.id);
            nextStep();
        }
    };

    const handleSkipAssessment = async () => {
        if (isGenerating || isSubmitting || isBotResponding || isSkipping) {
            return;
        }

        setShowSkipConfirmDialog(false);
        setIsSkipping(true);
        const currentUserId = currentUser?.id;

        if (currentUserId) {
            try {
                const skipped = await saveSkippedAssessment(currentUserId);
                if (!skipped) {
                    return;
                }
                setAssessmentForceRequired(currentUserId, false);
            } finally {
                setIsSkipping(false);
            }
        } else {
            setIsSkipping(false);
        }

        setAnswers({ profile: { role: "", level: "", techstack: [], domain: [], freeText: "" }, responses: [] });
        setSurveyResult(null);
        setSkillScores([]);
        setRoadmap({ today: [], weeks: [] });
        updateMatchPercentage(0);
        clearProgressCache(currentUser?.id);
        navigate("/home");
    };

    const handleOpenSkipConfirm = () => {
        if (isGenerating || isSubmitting || isBotResponding || isSkipping) {
            return;
        }
        setShowSkipConfirmDialog(true);
    };

    const handleCloseSkipConfirm = () => {
        if (isSkipping) {
            return;
        }
        setShowSkipConfirmDialog(false);
    };

    const skipConfirmDialog = (
        <Dialog
            open={showSkipConfirmDialog}
            onClose={handleCloseSkipConfirm}
            maxWidth="xs"
            fullWidth
            PaperProps={{ sx: { borderRadius: 3 } }}
        >
            <DialogContent sx={{ p: 2.5, pb: 1.5 }}>
                <Stack spacing={1}>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                        Skip Assessment?
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        This will stop the current assessment and return you to Home.
                    </Typography>
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 2.5, pb: 2.25, pt: 0 }}>
                <Button onClick={handleCloseSkipConfirm} disabled={isSkipping}>
                    Continue Assessment
                </Button>
                <Button
                    color="error"
                    variant="contained"
                    onClick={handleSkipAssessment}
                    disabled={isSkipping}
                    endIcon={isSkipping ? <CircularProgress size={14} sx={{ color: "#fff" }} /> : null}
                >
                    {isSkipping ? "Skipping..." : "Skip"}
                </Button>
            </DialogActions>
        </Dialog>
    );

    const handleSend = async () => {
        const value = chatDraft.trim();
        if (!currentQuestion || !value || isGenerating || isSubmitting || isBotResponding) {
            return;
        }

        const nextAnswerMap = { ...answerMap, [currentQuestion.id]: value };
        setAnswerMap(nextAnswerMap);
        appendUserMessage(value, currentQuestion.id);
        setChatDraft("");

        const nextIndex = currentIndex + 1;
        if (nextIndex < chatQuestions.length) {
            const nextQuestion = chatQuestions[nextIndex];
            setCurrentIndex(nextIndex);
            await runBotMessage(nextQuestion.question, { questionId: nextQuestion.id, processingMs: 1400 });
            return;
        }

        await submitSurvey(nextAnswerMap, chatQuestions);

        setTimeout(() => {
            inputRef.current?.focus();
        }, 0);
    };

    const handleBackToSetup = () => {
        if (isGenerating || isSubmitting) {
            return;
        }
        sequenceRef.current += 1;
        setIsBotResponding(false);
        setStage("setup");
        setSetupSubStep(1);
        setChatDraft("");
    };

    const handleContinueAssessment = () => {
        if (isGenerating || isSubmitting || !hasResumableAssessment) {
            return;
        }

        setStage("chat");
        const currentQuestionId = chatQuestions[currentIndex]?.id;
        setChatDraft(currentQuestionId ? answerMap[currentQuestionId] || "" : "");
    };

    const renderSectionHeader = (field) => (
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1.5} sx={{ mb: 1.1 }}>
            <Tooltip title={field.hoverNote} arrow placement="top-start">
                <Typography
                    sx={{
                        fontSize: "11px",
                        color: "text.secondary",
                        fontWeight: 800,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        cursor: "help",
                    }}
                >
                    {field.step} {field.label}
                </Typography>
            </Tooltip>
            <Chip
                label={field.required ? "Required" : "Optional"}
                size="small"
                sx={{
                    height: 18,
                    borderRadius: 1,
                    px: 0.2,
                    bgcolor: field.required
                        ? alpha(theme.palette.secondary.main, 0.75)
                        : alpha(theme.palette.background.default, 1),
                    color: field.required ? theme.palette.primary.main : "text.secondary",
                    border: "1px solid",
                    borderColor: field.required
                        ? alpha(theme.palette.secondary.dark, 0.7)
                        : alpha(theme.palette.primary.main, 0.12),
                    fontSize: "9px",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                }}
            />
        </Stack>
    );

    const renderSelectableButtons = (field, selectedValues) => {
        const isStack = field.id === "techstack";
        const columns =
            field.id === "role"
                ? { xs: "repeat(2, 1fr)", md: "repeat(3, 1fr)" }
                : field.id === "level"
                  ? { xs: "repeat(3, 1fr)", md: "repeat(5, 1fr)" }
                  : { xs: "repeat(4, 1fr)", md: "repeat(8, 1fr)" };

        return (
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: columns,
                    gap: 1,
                }}
            >
                {field.options.map((option) => {
                    const isActive =
                        field.type === "multi"
                            ? selectedValues.some((item) => item.toLowerCase() === option.toLowerCase())
                            : setupForm[field.id].trim().toLowerCase() === option.toLowerCase();

                    return (
                        <Tooltip key={option} title={getOptionHintText(field, option)} arrow>
                            <Button
                                variant="outlined"
                                onClick={() =>
                                    handleSetupChange(
                                        field.id,
                                        field.type === "multi" ? toggleHintValue(setupForm[field.id], option) : option,
                                    )
                                }
                                sx={{
                                    width: "100%",
                                    minHeight: 36,
                                    justifyContent: "center",
                                    borderRadius: 1.5,
                                    px: isStack ? 0.8 : 1.25,
                                    py: 0.6,
                                    textTransform: "none",
                                    fontWeight: isActive ? 800 : 700,
                                    fontSize: isStack ? "10px" : "11px",
                                    whiteSpace: "normal",
                                    textAlign: "center",
                                    lineHeight: 1.3,
                                    borderColor: isActive
                                        ? alpha(theme.palette.secondary.dark, 0.95)
                                        : alpha(theme.palette.primary.main, 0.08),
                                    bgcolor: isActive
                                        ? theme.palette.secondary.main
                                        : alpha(theme.palette.background.default, 0.8),
                                    color: isActive ? theme.palette.primary.main : "text.secondary",
                                    "&:hover": {
                                        borderColor: alpha(theme.palette.primary.main, 0.28),
                                        bgcolor: isActive
                                            ? theme.palette.secondary.dark
                                            : alpha(theme.palette.background.paper, 0.95),
                                    },
                                }}
                            >
                                {option}
                            </Button>
                        </Tooltip>
                    );
                })}
            </Box>
        );
    };

    const renderDomainCards = (field) => {
        const selectedValues = selectedDomainValues;

        return (
            <Box
                sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }, gap: 1.2 }}
            >
                {field.options.map((option) => {
                    const isActive = selectedValues.some((item) => item.toLowerCase() === option.toLowerCase());
                    const IconComponent = domainIconMap[option] || AddCircleOutlineRoundedIcon;

                    return (
                        <Tooltip key={option} title={getOptionHintText(field, option)} arrow>
                            <Button
                                variant="outlined"
                                onClick={() =>
                                    handleSetupChange(field.id, toggleHintValue(setupForm[field.id], option))
                                }
                                sx={{
                                    minHeight: 72,
                                    borderRadius: 1.5,
                                    borderColor: isActive
                                        ? alpha(theme.palette.secondary.dark, 0.95)
                                        : alpha(theme.palette.primary.main, 0.08),
                                    bgcolor: isActive
                                        ? theme.palette.secondary.main
                                        : alpha(theme.palette.background.default, 0.8),
                                    color: isActive ? theme.palette.primary.main : "text.secondary",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    p: 1,
                                    textTransform: "none",
                                    "&:hover": {
                                        borderColor: alpha(theme.palette.primary.main, 0.25),
                                        bgcolor: isActive
                                            ? theme.palette.secondary.dark
                                            : alpha(theme.palette.background.paper, 0.95),
                                    },
                                }}
                            >
                                <Stack spacing={0.7} alignItems="center">
                                    <IconComponent sx={{ fontSize: 18 }} />
                                    <Typography sx={{ fontSize: "10px", fontWeight: 800 }}>{option}</Typography>
                                </Stack>
                            </Button>
                        </Tooltip>
                    );
                })}
            </Box>
        );
    };

    if (stage === "setup") {
        return (
            <>
                <Box sx={{ maxWidth: 1220, mx: "auto", px: { xs: 1.5, md: 2 }, py: { xs: 1, md: 1.25 } }}>
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: { xs: "1fr", lg: "6fr 6fr" },
                            gap: 3,
                            alignItems: "stretch",
                            height: { lg: 620 },
                        }}
                    >
                        <Paper
                            elevation={0}
                            sx={{
                                p: { xs: 3.5, md: 5 },
                                borderRadius: 3,
                                border: "1px solid",
                                borderColor: alpha(theme.palette.primary.main, 0.1),
                                background: `linear-gradient(160deg, ${alpha(theme.palette.secondary.main, 0.1)} 0%, ${alpha(theme.palette.background.paper, 0.98)} 64%)`,
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between",
                                height: "100%",
                                position: "relative",
                                overflow: "hidden",
                                boxShadow: `inset 0 1px 0 ${alpha(theme.palette.background.paper, 0.8)}`,
                                minWidth: 0,
                                width: "100%",
                            }}
                        >
                            <Stack spacing={3.2} sx={{ position: "relative", zIndex: 1, flex: 1 }}>
                                <Chip
                                    icon={<AutoAwesomeRoundedIcon sx={{ color: "primary.main !important" }} />}
                                    label="Onboarding AI"
                                    sx={{
                                        alignSelf: "flex-start",
                                        borderRadius: 999,
                                        bgcolor: theme.palette.secondary.main,
                                        color: "primary.main",
                                        fontWeight: 800,
                                        letterSpacing: "0.06em",
                                        height: 28,
                                    }}
                                />
                                <Typography
                                    variant="h2"
                                    sx={{
                                        maxWidth: "100%",
                                        fontSize: { xs: "2.55rem", md: "3.9rem" },
                                        lineHeight: 0.95,
                                        fontWeight: 900,
                                        letterSpacing: "-0.035em",
                                        color: "text.primary",
                                    }}
                                >
                                    Let&apos;s get to know{" "}
                                    <Box component="span" sx={{ color: "secondary.dark" }}>
                                        you.
                                    </Box>
                                </Typography>
                                <Typography
                                    sx={{ maxWidth: "100%", color: "text.secondary", fontSize: 14, lineHeight: 1.75 }}
                                >
                                    Give the AI the role, level, stack, and context you care about most. You can click
                                    quick options, type your own answers, or mix both.
                                </Typography>
                            </Stack>

                            <Paper
                                elevation={0}
                                sx={{
                                    mt: 4.5,
                                    p: 1,
                                    borderRadius: 3.5,
                                    border: "1px solid",
                                    borderColor: alpha(theme.palette.primary.main, 0.15),
                                    background: alpha(theme.palette.background.paper, 0.82),
                                    position: "relative",
                                    zIndex: 1,
                                    width: "100%",
                                    maxWidth: "100%",
                                }}
                            >
                                <Box
                                    component="img"
                                    src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=1000&auto=format&fit=crop"
                                    alt="Workspace"
                                    sx={{
                                        width: "100%",
                                        maxWidth: { xs: 320, md: 420 },
                                        mx: "auto",
                                        display: "block",
                                        aspectRatio: "4 / 3",
                                        objectFit: "cover",
                                        borderRadius: 3,
                                        maxHeight: { xs: 200, md: 260 },
                                    }}
                                />
                            </Paper>

                            <Box
                                sx={{
                                    position: "absolute",
                                    top: -40,
                                    right: -50,
                                    width: 190,
                                    height: 190,
                                    borderRadius: "50%",
                                    bgcolor: alpha(theme.palette.secondary.main, 0.26),
                                    filter: "blur(22px)",
                                }}
                            />
                        </Paper>

                        <Paper
                            elevation={0}
                            sx={{
                                p: { xs: 3, md: 4 },
                                borderRadius: 3,
                                border: "1px solid",
                                borderColor: "divider",
                                bgcolor: "background.paper",
                                display: "flex",
                                flexDirection: "column",
                                minWidth: 0,
                                width: "100%",
                            }}
                        >
                            <Stack direction="row" spacing={1} sx={{ mb: 1.6 }}>
                                <Button
                                    variant={setupSubStep === 1 ? "contained" : "outlined"}
                                    onClick={() => setSetupSubStep(1)}
                                    disabled={isGenerating || isSubmitting}
                                    sx={{
                                        flex: 1,
                                        borderRadius: 2,
                                        py: 0.8,
                                        fontSize: 11,
                                        fontWeight: 800,
                                        textTransform: "uppercase",
                                        letterSpacing: "0.08em",
                                    }}
                                >
                                    Segment 1 - 1-3
                                </Button>
                                <Button
                                    variant={setupSubStep === 2 ? "contained" : "outlined"}
                                    onClick={() => setSetupSubStep(2)}
                                    disabled={isGenerating || isSubmitting}
                                    sx={{
                                        flex: 1,
                                        borderRadius: 2,
                                        py: 0.8,
                                        fontSize: 11,
                                        fontWeight: 800,
                                        textTransform: "uppercase",
                                        letterSpacing: "0.08em",
                                    }}
                                >
                                    Segment 2 - 4-5
                                </Button>
                            </Stack>

                            <Box
                                sx={{
                                    flex: 1,
                                    minHeight: 0,
                                    overflow: "hidden",
                                    pr: 0,
                                    display: "flex",
                                    width: "100%",
                                }}
                            >
                                {setupSubStep === 1 ? (
                                    <Stack
                                        spacing={1.25}
                                        sx={{
                                            flex: 1,
                                            height: "100%",
                                            width: "100%",
                                            p: 1.2,
                                            borderRadius: 2,
                                            border: "1px solid",
                                            borderColor: alpha(theme.palette.primary.main, 0.08),
                                            bgcolor: alpha(theme.palette.background.default, 0.36),
                                            justifyContent: "space-between",
                                        }}
                                    >
                                        {roleField ? (
                                            <Stack spacing={0.85}>
                                                {renderSectionHeader(roleField)}
                                                {renderSelectableButtons(roleField, [])}
                                                <TextField
                                                    fullWidth
                                                    value={setupForm.role}
                                                    onChange={(event) => handleSetupChange("role", event.target.value)}
                                                    error={Boolean(setupErrors.role)}
                                                    helperText={setupErrors.role || null}
                                                    placeholder={roleField.placeholder}
                                                    inputProps={{ maxLength: 40 }}
                                                    sx={{
                                                        mt: 0,
                                                        "& .MuiOutlinedInput-root": {
                                                            borderRadius: 1.5,
                                                            bgcolor: alpha(theme.palette.background.default, 0.8),
                                                        },
                                                        "& .MuiInputBase-input": { fontSize: 12, py: 1 },
                                                    }}
                                                />
                                            </Stack>
                                        ) : null}

                                        {levelField ? (
                                            <Stack spacing={0.85}>
                                                {renderSectionHeader(levelField)}
                                                {renderSelectableButtons(levelField, [])}
                                                <TextField
                                                    fullWidth
                                                    value={setupForm.level}
                                                    onChange={(event) => handleSetupChange("level", event.target.value)}
                                                    error={Boolean(setupErrors.level)}
                                                    helperText={setupErrors.level || null}
                                                    placeholder={levelField.placeholder}
                                                    inputProps={{ maxLength: 30 }}
                                                    sx={{
                                                        mt: 0,
                                                        "& .MuiOutlinedInput-root": {
                                                            borderRadius: 1.5,
                                                            bgcolor: alpha(theme.palette.background.default, 0.8),
                                                        },
                                                        "& .MuiInputBase-input": { fontSize: 12, py: 1 },
                                                    }}
                                                />
                                            </Stack>
                                        ) : null}

                                        {techstackField ? (
                                            <Stack spacing={0.85}>
                                                {renderSectionHeader(techstackField)}
                                                {renderSelectableButtons(techstackField, selectedTechstackValues)}
                                                <TextField
                                                    fullWidth
                                                    value={setupForm.techstack}
                                                    onChange={(event) =>
                                                        handleSetupChange("techstack", event.target.value)
                                                    }
                                                    error={Boolean(setupErrors.techstack)}
                                                    helperText={setupErrors.techstack || null}
                                                    placeholder={techstackField.placeholder}
                                                    inputProps={{ maxLength: 100 }}
                                                    sx={{
                                                        mt: 0,
                                                        "& .MuiOutlinedInput-root": {
                                                            borderRadius: 1.5,
                                                            bgcolor: alpha(theme.palette.background.default, 0.8),
                                                        },
                                                        "& .MuiInputBase-input": { fontSize: 12, py: 1 },
                                                    }}
                                                />
                                            </Stack>
                                        ) : null}
                                    </Stack>
                                ) : (
                                    <Stack
                                        spacing={1.25}
                                        sx={{
                                            flex: 1,
                                            height: "100%",
                                            width: "100%",
                                            p: 1.2,
                                            borderRadius: 2,
                                            border: "1px solid",
                                            borderColor: alpha(theme.palette.primary.main, 0.08),
                                            bgcolor: alpha(theme.palette.background.default, 0.36),
                                            justifyContent: "flex-start",
                                            overflow: "hidden",
                                        }}
                                    >
                                        {domainField ? (
                                            <Stack spacing={0.85} sx={{ flexShrink: 0 }}>
                                                {renderSectionHeader(domainField)}
                                                {renderDomainCards(domainField)}
                                                <TextField
                                                    fullWidth
                                                    value={setupForm.domain}
                                                    onChange={(event) =>
                                                        handleSetupChange("domain", event.target.value)
                                                    }
                                                    error={Boolean(setupErrors.domain)}
                                                    helperText={setupErrors.domain || null}
                                                    placeholder={domainField.placeholder}
                                                    inputProps={{ maxLength: 60 }}
                                                    sx={{
                                                        mt: 0,
                                                        "& .MuiOutlinedInput-root": {
                                                            borderRadius: 1.5,
                                                            bgcolor: alpha(theme.palette.background.default, 0.8),
                                                        },
                                                        "& .MuiInputBase-input": { fontSize: 12, py: 1 },
                                                    }}
                                                />
                                            </Stack>
                                        ) : null}

                                        {freeTextField ? (
                                            <Stack spacing={0.85} sx={{ flex: 1, minHeight: 0 }}>
                                                {renderSectionHeader(freeTextField)}
                                                <TextField
                                                    fullWidth
                                                    multiline
                                                    minRows={6}
                                                    value={setupForm.freeText}
                                                    onChange={(event) =>
                                                        handleSetupChange("freeText", event.target.value)
                                                    }
                                                    error={Boolean(setupErrors.freeText)}
                                                    helperText={setupErrors.freeText || null}
                                                    placeholder={freeTextField.placeholder}
                                                    inputProps={{ maxLength: 1000 }}
                                                    sx={{
                                                        flex: 1,
                                                        "& .MuiOutlinedInput-root": {
                                                            alignItems: "flex-start",
                                                            borderRadius: 2.2,
                                                            bgcolor: alpha(theme.palette.background.default, 0.8),
                                                            minHeight: 150,
                                                            height: "100%",
                                                        },
                                                        "& .MuiInputBase-input": {
                                                            py: 1.4,
                                                            px: 1.1,
                                                            fontSize: 13,
                                                        },
                                                        "& .MuiInputBase-inputMultiline": {
                                                            height: "100% !important",
                                                            overflowY: "auto !important",
                                                        },
                                                    }}
                                                />
                                            </Stack>
                                        ) : null}
                                    </Stack>
                                )}
                            </Box>

                            <Stack
                                direction={{ xs: "column", sm: "row" }}
                                justifyContent="space-between"
                                alignItems={{ xs: "stretch", sm: "center" }}
                                spacing={1.5}
                                sx={{
                                    pt: 2.4,
                                    mt: 2.4,
                                    borderTop: "1px solid",
                                    borderColor: alpha(theme.palette.primary.main, 0.06),
                                }}
                            >
                                {setupSubStep === 1 ? (
                                    <Button
                                        variant="text"
                                        color="inherit"
                                        onClick={handleOpenSkipConfirm}
                                        disabled={isGenerating || isSubmitting || isSkipping}
                                        sx={{ justifyContent: "flex-start", fontWeight: 700 }}
                                    >
                                        {isSkipping ? "Saving..." : "Skip for now"}
                                    </Button>
                                ) : (
                                    <Button
                                        variant="text"
                                        color="inherit"
                                        startIcon={<KeyboardBackspaceRoundedIcon />}
                                        onClick={() => setSetupSubStep(1)}
                                        disabled={isGenerating || isSubmitting}
                                        sx={{ justifyContent: "flex-start", fontWeight: 700 }}
                                    >
                                        Back to 1-3
                                    </Button>
                                )}

                                {setupSubStep === 1 ? (
                                    <Button
                                        variant="contained"
                                        onClick={() => setSetupSubStep(2)}
                                        disabled={isGenerating || isSubmitting}
                                        endIcon={<SkipNextRoundedIcon />}
                                        sx={{
                                            minWidth: 220,
                                            borderRadius: 2.25,
                                            py: 1.3,
                                            fontWeight: 800,
                                            textTransform: "uppercase",
                                            letterSpacing: "0.08em",
                                            fontSize: "11px",
                                        }}
                                    >
                                        Next 4-5
                                    </Button>
                                ) : (
                                    <Button
                                        variant="contained"
                                        size="large"
                                        onClick={
                                            hasResumableAssessment
                                                ? handleContinueAssessment
                                                : requestGeneratedQuestions
                                        }
                                        disabled={isGenerating || isSubmitting}
                                        sx={{
                                            minWidth: 260,
                                            borderRadius: 2.25,
                                            py: 1.45,
                                            bgcolor: theme.palette.secondary.main,
                                            color: theme.palette.primary.main,
                                            fontWeight: 800,
                                            textTransform: "uppercase",
                                            letterSpacing: "0.08em",
                                            fontSize: "11px",
                                            "&:hover": { bgcolor: theme.palette.secondary.dark },
                                        }}
                                    >
                                        <Stack direction="row" spacing={1.1} alignItems="center">
                                            {isGenerating ? (
                                                <CircularProgress
                                                    size={18}
                                                    sx={{ color: theme.palette.primary.main }}
                                                />
                                            ) : (
                                                <AutoAwesomeRoundedIcon fontSize="small" />
                                            )}
                                            <Box component="span">
                                                {isGenerating
                                                    ? "Generating Questions..."
                                                    : hasResumableAssessment
                                                      ? `Continue Assessment (Q${Math.min(currentIndex + 1, totalQuestions)}/${totalQuestions})`
                                                      : "Generate Assessment"}
                                            </Box>
                                        </Stack>
                                    </Button>
                                )}
                            </Stack>

                            {hasResumableAssessment && setupSubStep === 2 ? (
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1.25 }}>
                                    Unfinished assessment found. Continue from question{" "}
                                    {Math.min(currentIndex + 1, totalQuestions)} with your previous answers.
                                </Typography>
                            ) : null}
                        </Paper>
                    </Box>
                </Box>

                <Dialog
                    open={showGenerateDialog}
                    maxWidth="xs"
                    fullWidth
                    PaperProps={{
                        sx: {
                            borderRadius: 3,
                            maxWidth: 360,
                        },
                    }}
                >
                    <DialogContent sx={{ p: 2.5 }}>
                        <Stack spacing={2.25} alignItems="center">
                            <Box sx={{ width: "100%", textAlign: "center" }}>
                                <Typography variant="subtitle1" fontWeight={800} gutterBottom>
                                    Generating your assessment
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    We&apos;re calibrating questions from your role, stack, and goals.
                                </Typography>
                            </Box>
                            <Box sx={{ position: "relative", display: "inline-flex" }}>
                                <CircularProgress
                                    size={68}
                                    thickness={3.5}
                                    value={100}
                                    variant="determinate"
                                    sx={{ color: alpha("#cbd5e1", 0.8) }}
                                />
                                <CircularProgress
                                    size={68}
                                    thickness={3.5}
                                    value={Math.min(generateProgress, 100)}
                                    variant="determinate"
                                    sx={{ position: "absolute", left: 0, color: "#84cc16" }}
                                />
                                <Box
                                    sx={{
                                        position: "absolute",
                                        inset: 0,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontWeight: 800,
                                        fontSize: "0.9rem",
                                        color: "#0f172a",
                                    }}
                                >
                                    {Math.round(generateProgress)}%
                                </Box>
                            </Box>
                            <LinearProgress
                                variant="determinate"
                                value={Math.min(generateProgress, 100)}
                                sx={{
                                    width: "100%",
                                    height: 8,
                                    borderRadius: 999,
                                    bgcolor: alpha("#cbd5e1", 0.45),
                                    "& .MuiLinearProgress-bar": { borderRadius: 999, bgcolor: "#84cc16" },
                                }}
                            />
                        </Stack>
                    </DialogContent>
                </Dialog>
                {skipConfirmDialog}
            </>
        );
    }

    return (
        <Box
            sx={{
                maxWidth: 1240,
                mx: "auto",
                px: { xs: 2, md: 3 },
                py: { xs: 1.5, md: 2 },
                borderRadius: 5,
                background: `linear-gradient(150deg, ${alpha(theme.palette.secondary.main, 0.2)} 0%, ${theme.palette.background.default} 48%, ${alpha(theme.palette.primary.main, 0.06)} 100%)`,
            }}
        >
            <Stack spacing={2.5}>
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 2fr) minmax(320px, 1fr)" },
                        gap: 2.5,
                        alignItems: "stretch",
                        height: { xs: "auto", lg: 680 },
                    }}
                >
                    <Stack spacing={2.5} sx={{ minWidth: 0, minHeight: 0, height: { lg: "100%" } }}>
                        <Paper
                            elevation={0}
                            sx={{
                                borderRadius: 3,
                                border: "1px solid",
                                borderColor: "divider",
                                bgcolor: "background.paper",
                                minHeight: { xs: 500, lg: 0 },
                                height: { xs: "auto", lg: "100%" },
                                display: "flex",
                                flexDirection: "column",
                                overflow: "hidden",
                            }}
                        >
                            <Box
                                sx={{
                                    px: { xs: 2, md: 2.5 },
                                    py: 2,
                                    borderBottom: "1px solid",
                                    borderColor: "divider",
                                    bgcolor: alpha(theme.palette.background.default, 0.85),
                                }}
                            >
                                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                                    Assessment Conversation
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    This step is read-only. Use Previous if you need to adjust chapter 1.
                                </Typography>
                            </Box>

                            <Box
                                ref={listRef}
                                sx={{
                                    flex: 1,
                                    overflowY: "auto",
                                    px: { xs: 2, md: 2.5 },
                                    py: 2.25,
                                    bgcolor: alpha(theme.palette.background.default, 0.6),
                                }}
                            >
                                <Stack spacing={1.75}>
                                    {messages.map((message) => {
                                        const isUser = message.sender === "user";
                                        const isProcessing = message.status === "processing";

                                        return (
                                            <Stack
                                                key={message.id}
                                                direction="row"
                                                justifyContent={isUser ? "flex-end" : "flex-start"}
                                            >
                                                <Stack
                                                    direction={isUser ? "row-reverse" : "row"}
                                                    spacing={1.1}
                                                    sx={{
                                                        maxWidth: "90%",
                                                        alignItems: "flex-end",
                                                        animation: message.animateIn
                                                            ? `${floatUp} 360ms ease-out both`
                                                            : "none",
                                                    }}
                                                >
                                                    <Avatar
                                                        sx={{
                                                            width: 30,
                                                            height: 30,
                                                            bgcolor: isUser
                                                                ? alpha(theme.palette.primary.main, 0.18)
                                                                : theme.palette.primary.main,
                                                            color: isUser
                                                                ? theme.palette.primary.main
                                                                : theme.palette.primary.contrastText,
                                                        }}
                                                    >
                                                        {isUser ? (
                                                            <PersonRoundedIcon sx={{ fontSize: 18 }} />
                                                        ) : (
                                                            <SmartToyRoundedIcon sx={{ fontSize: 18 }} />
                                                        )}
                                                    </Avatar>
                                                    <Paper
                                                        elevation={0}
                                                        sx={{
                                                            px: 1.8,
                                                            py: 1.35,
                                                            borderRadius: isUser
                                                                ? "16px 16px 4px 16px"
                                                                : "16px 16px 16px 4px",
                                                            border: "1px solid",
                                                            borderColor: isUser
                                                                ? alpha(theme.palette.secondary.dark, 0.55)
                                                                : "divider",
                                                            bgcolor: isUser
                                                                ? alpha(theme.palette.secondary.main, 0.82)
                                                                : "background.paper",
                                                            color: "text.primary",
                                                            boxShadow: `0 8px 22px ${alpha(theme.palette.primary.main, 0.08)}`,
                                                            minWidth: isProcessing ? 150 : 0,
                                                        }}
                                                    >
                                                        {isProcessing ? (
                                                            <TypingIndicator />
                                                        ) : (
                                                            <Typography
                                                                variant="body2"
                                                                sx={{ whiteSpace: "pre-wrap", lineHeight: 1.65 }}
                                                            >
                                                                {message.text}
                                                            </Typography>
                                                        )}
                                                    </Paper>
                                                </Stack>
                                            </Stack>
                                        );
                                    })}
                                </Stack>
                            </Box>

                            <Box
                                sx={{
                                    p: { xs: 2, md: 2.5 },
                                    borderTop: "1px solid",
                                    borderColor: "divider",
                                    bgcolor: "background.paper",
                                }}
                            >
                                <Stack direction="row" spacing={1.25} alignItems="flex-end">
                                    <TextField
                                        autoFocus
                                        inputRef={inputRef}
                                        fullWidth
                                        multiline={true}
                                        minRows={1}
                                        maxRows={8}
                                        value={chatDraft}
                                        onChange={(event) => setChatDraft(event.target.value)}
                                        onKeyDown={(e) => {
                                            e.key === "Enter" && !e.shiftKey && handleSend();
                                        }}
                                        placeholder={
                                            currentQuestion?.type === "single"
                                                ? "Select a suggested answer or type your own"
                                                : currentQuestion?.helper || "Type your answer here"
                                        }
                                        disabled={isBotResponding || isSubmitting}
                                    />
                                    <Button
                                        variant="contained"
                                        onClick={handleSend}
                                        disabled={!chatDraft.trim() || isBotResponding || isSubmitting}
                                        sx={{
                                            minWidth: { xs: 110, sm: 140 },
                                            minHeight: 54,
                                            borderRadius: 2.25,
                                            fontWeight: 800,
                                        }}
                                        endIcon={!isSubmitting ? <SendRoundedIcon /> : null}
                                    >
                                        {isSubmitting ? (
                                            <CircularProgress
                                                size={18}
                                                sx={{ color: theme.palette.secondary.main }}
                                            />
                                        ) : isFinalQuestion ? (
                                            "Finish"
                                        ) : (
                                            "Send"
                                        )}
                                    </Button>
                                </Stack>
                            </Box>
                        </Paper>
                    </Stack>

                    <Stack spacing={2.5} sx={{ minWidth: 0, minHeight: 0, height: { lg: "100%" } }}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 2.25,
                                borderRadius: 3,
                                border: "1px solid",
                                borderColor: "divider",
                                bgcolor: "background.paper",
                                minHeight: 0,
                                flex: 1,
                                display: "flex",
                                flexDirection: "column",
                                overflow: "hidden",
                            }}
                        >
                            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                                Pick a suggested answer
                            </Typography>
                            <Box sx={{ mt: 1.5, flex: 1, overflowY: "auto", pr: 0.5 }}>
                                {currentQuestion?.type === "single" && (currentQuestion.options || []).length > 0 ? (
                                    <Stack spacing={1}>
                                        {(currentQuestion.options || []).map((option) => {
                                            const isSelected = chatDraft === option;
                                            return (
                                                <Button
                                                    key={option}
                                                    variant="outlined"
                                                    onClick={() => setChatDraft(option)}
                                                    disabled={isBotResponding || isSubmitting}
                                                    sx={{
                                                        width: "100%",
                                                        justifyContent: "flex-start",
                                                        textAlign: "left",
                                                        borderRadius: 2,
                                                        py: 1.2,
                                                        px: 1.5,
                                                        gap: 1.1,
                                                        borderColor: isSelected
                                                            ? alpha(theme.palette.primary.main, 0.48)
                                                            : "divider",
                                                        bgcolor: isSelected
                                                            ? alpha(theme.palette.primary.main, 0.06)
                                                            : alpha(theme.palette.background.default, 0.5),
                                                        color: "text.primary",
                                                        "&:hover": {
                                                            borderColor: theme.palette.primary.main,
                                                            bgcolor: alpha(theme.palette.primary.main, 0.09),
                                                        },
                                                    }}
                                                >
                                                    <Box
                                                        sx={{
                                                            width: 16,
                                                            height: 16,
                                                            borderRadius: "50%",
                                                            border: "1px solid",
                                                            borderColor: isSelected
                                                                ? theme.palette.primary.main
                                                                : alpha(theme.palette.primary.main, 0.28),
                                                            bgcolor: isSelected
                                                                ? theme.palette.primary.main
                                                                : theme.palette.background.paper,
                                                            boxShadow: isSelected
                                                                ? `inset 0 0 0 3px ${theme.palette.background.paper}`
                                                                : "none",
                                                            flexShrink: 0,
                                                        }}
                                                    />
                                                    <Typography variant="body2" sx={{ lineHeight: 1.45 }}>
                                                        {option}
                                                    </Typography>
                                                </Button>
                                            );
                                        })}
                                    </Stack>
                                ) : (
                                    <Box
                                        sx={{
                                            p: 1.5,
                                            borderRadius: 2,
                                            bgcolor: alpha(theme.palette.info.main, 0.08),
                                            color: "text.secondary",
                                        }}
                                    >
                                        <Typography variant="body2">
                                            No fixed suggestion for this question. Type your answer on the left.
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        </Paper>

                        <Paper
                            elevation={0}
                            sx={{
                                p: 2.25,
                                borderRadius: 3,
                                border: "1px solid",
                                borderColor: "divider",
                                bgcolor: "background.paper",
                            }}
                        >
                            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                                Submit Control
                            </Typography>
                            <Stack spacing={1.5} sx={{ mt: 1.6 }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Typography variant="body2" sx={{ fontWeight: 800, color: "text.primary" }}>
                                        Question {activeQuestionNumber} of {Math.max(totalQuestions, 1)}
                                    </Typography>
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>
                                        {progress}% Complete
                                    </Typography>
                                </Stack>

                                <LinearProgress
                                    variant="determinate"
                                    value={progressValue}
                                    sx={{
                                        height: 8,
                                        borderRadius: 999,
                                        bgcolor: alpha(theme.palette.secondary.main, 0.24),
                                        "& .MuiLinearProgress-bar": {
                                            borderRadius: 999,
                                            bgcolor: theme.palette.secondary.dark,
                                        },
                                    }}
                                />

                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Button
                                        size="small"
                                        variant="text"
                                        startIcon={<KeyboardBackspaceRoundedIcon />}
                                        onClick={handleBackToSetup}
                                        disabled={isBotResponding || isSubmitting}
                                    >
                                        Previous
                                    </Button>

                                    <Button
                                        variant="outlined"
                                        endIcon={<SkipNextRoundedIcon />}
                                        onClick={handleOpenSkipConfirm}
                                        disabled={isBotResponding || isSubmitting || isSkipping}
                                        sx={{ borderRadius: 2 }}
                                    >
                                        {isSkipping ? "Saving..." : "Skip"}
                                    </Button>
                                </Stack>
                            </Stack>
                        </Paper>
                    </Stack>
                </Box>
            </Stack>
            {skipConfirmDialog}
        </Box>
    );
};

export default ChatSurvey;
