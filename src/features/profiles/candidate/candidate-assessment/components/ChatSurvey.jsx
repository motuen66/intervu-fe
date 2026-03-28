import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import {
    Avatar,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogContent,
    Divider,
    LinearProgress,
    Paper,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { keyframes } from "@mui/system";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import AccountBalanceRoundedIcon from "@mui/icons-material/AccountBalanceRounded";
import AddCircleOutlineRoundedIcon from "@mui/icons-material/AddCircleOutlineRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
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
import { assessmentApi } from "../services/assessmentApi";

const setupFields = [
    {
        id: "role",
        label: "Target Role",
        step: "1.",
        type: "single",
        options: ["Backend", "Frontend", "Fullstack", "Mobile", "DevOps", "Data Science"],
        placeholder: "Or type your target role",
        helper: "Choose or type the role you want this assessment to optimize for right now.",
        hoverNote: "This should be the role you are targeting now, not every role you have tried before.",
        required: true,
    },
    {
        id: "level",
        label: "Experience Level",
        step: "2.",
        type: "single",
        options: ["Entry", "Junior", "Mid-Level", "Senior", "Staff / Lead"],
        placeholder: "Or describe your current level",
        helper: "Pick the level closest to your current working confidence.",
        hoverNote: "Choose the level that matches your current performance today, not your ideal target yet.",
        required: true,
    },
    {
        id: "techstack",
        label: "Primary Stack",
        step: "3.",
        type: "multi",
        options: ["React", "TypeScript", "Node.js", "Python", "Go", "GraphQL", "PostgreSQL", "AWS"],
        placeholder: "Example: TypeScript, React, Node.js",
        helper: "Add the technologies you want the interview to focus on most.",
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
        helper: "This helps the AI tailor scenario questions to the products you care about.",
        hoverNote: "Share the business area you want to move into most, even if your past projects were different.",
        required: false,
    },
    {
        id: "free_text",
        label: "Tell Us More",
        step: "5.",
        type: "free_text",
        placeholder: "Highlight specific projects or unique skills...",
        helper: "You can mention interview goals, strengths, weak spots, or role expectations.",
        hoverNote: "Use this to guide the assessment design with context that chips alone cannot capture.",
        required: true,
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

const buildGeneratedQuestions = (data) => {
    const phaseA = Array.isArray(data?.phaseA) ? data.phaseA : [];
    const phaseB = Array.isArray(data?.phaseB) ? data.phaseB : [];
    const questions = [];

    phaseA.forEach((item, index) => {
        questions.push({
            id: `phaseA_${index + 1}`,
            phase: "phaseA",
            skill: item?.skill || `Phase A Skill ${index + 1}`,
            type: "single",
            question: item?.question || `Phase A question ${index + 1}`,
            helper: "Choose the option that best matches your real experience.",
            options: (item?.options || []).map((option) => option?.text || option?.level).filter(Boolean),
            optionLevels: (item?.options || []).map((option) => ({
                text: option?.text || option?.level || "",
                level: option?.level || option?.text || "",
            })),
        });
    });

    phaseB.forEach((item, index) => {
        questions.push({
            id: `phaseB_${index + 1}`,
            phase: "phaseB",
            skill: item?.skill || `Phase B Skill ${index + 1}`,
            type: "single",
            question: item?.question || `Phase B question ${index + 1}`,
            helper: "Choose the target level you want to reach.",
            options: (item?.options || []).map((option) => option?.text || option?.level).filter(Boolean),
            optionLevels: (item?.options || []).map((option) => ({
                text: option?.text || option?.level || "",
                level: option?.level || option?.text || "",
            })),
        });
    });

    return questions;
};

const buildFallbackSurveyResult = (responses) => ({
    summaryObject: {
        generated: {
            Questions: responses.map((response) => ({
                Skill: response.skill,
                SelectedLevel: response.selectedLevel,
            })),
        },
    },
});

const createFallbackQuestions = () => [
    {
        id: "phaseA_1",
        phase: "phaseA",
        skill: "Problem Solving",
        type: "single",
        question: "How much real project experience do you have solving technical problems in your main stack?",
        helper: "Choose the option that best matches your real experience.",
        options: ["None", "Basic", "Intermediate", "Advanced"],
        optionLevels: [
            { text: "None", level: "None" },
            { text: "Basic", level: "Basic" },
            { text: "Intermediate", level: "Intermediate" },
            { text: "Advanced", level: "Advanced" },
        ],
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
    const listRef = useRef(null);
    const mountedRef = useRef(true);
    const sequenceRef = useRef(0);
    const generateTimerRef = useRef(null);

    const [stage, setStage] = useState("setup");
    const [setupForm, setSetupForm] = useState({
        role: "Backend",
        level: "Junior Associate",
        techstack: "",
        domain: "",
        free_text: "",
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
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isBotResponding, setIsBotResponding] = useState(false);

    const currentQuestion = chatQuestions[currentIndex] || null;
    const totalQuestions = chatQuestions.length;
    const answeredCount = Object.keys(answerMap).length;
    const progress = totalQuestions ? Math.round((answeredCount / totalQuestions) * 100) : 0;
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
        const animatedWordCount = Math.min(words.length, 8);
        const animatedText = words.slice(0, animatedWordCount).join(" ");
        const remainingText = words.slice(animatedWordCount).join(" ");
        let visibleText = "";
        setMessages((prev) =>
            prev.map((message) => (message.id === messageId ? { ...message, status: "typing", text: "" } : message)),
        );

        for (const character of animatedText) {
            visibleText += character;
            setMessages((prev) =>
                prev.map((message) =>
                    message.id === messageId ? { ...message, status: "typing", text: visibleText } : message,
                ),
            );

            const pause = /[.!?]/.test(character) ? 140 : /[,;:]/.test(character) ? 90 : 28;
            await sleep(pause);
            if (!mountedRef.current || token !== sequenceRef.current) {
                return false;
            }
        }

        if (remainingText) {
            visibleText = `${animatedText} ${remainingText}`.trim();
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
        setSetupForm((prev) => ({ ...prev, [fieldId]: value }));
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
            free_text: setupForm.free_text || "",
        };

        setIsGenerating(true);
        startGenerateProgress();

        try {
            const response = await assessmentApi.generateAssessment(payload);
            const generatedQuestions = buildGeneratedQuestions(response?.data || {});
            if (!generatedQuestions.length) {
                throw new Error("Assessment generator returned no questions.");
            }
            await finishGenerateProgress();
            await startGeneratedAssessment(
                generatedQuestions,
                "Profile calibrated. I'm generating a focused interview conversation based on your setup.",
            );
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
        const missingSkills = derivedSkills.filter((item) => item.status === "missing").map((item) => item.skillKey);
        const weakSkills = derivedSkills.filter((item) => item.status === "weak").map((item) => item.skillKey);

        const payload = {
            UserId: userId,
            AssessmentName: `${role || "Candidate"} Assessment`,
            Responses: finalResponses.map((item) => ({
                Phase: item.phase,
                Skill: item.skill,
                SelectedLevel: item.selectedLevel,
            })),
            Target: { Roles: role ? [role] : [], Level: level, SkillsTarget: techstack },
            Current: {
                Skills: derivedSkills.map((item) => ({
                    Skill: item.skillKey,
                    Level: item.selectedLevel,
                    SfiaLevel: null,
                })),
            },
            Gap: { Missing: missingSkills, Weak: weakSkills },
        };

        setAnswers({
            profile: { role, level, techstack, domain, freeText: setupForm.free_text || "" },
            responses: finalResponses,
            derivedSkills,
        });

        setIsSubmitting(true);
        await runBotMessage("Thanks. I'm analyzing your answers now.", { processingMs: 1500 });

        try {
            const response = await assessmentApi.processSurveyResponses(payload);
            setSurveyResult(response?.data || buildFallbackSurveyResult(finalResponses));
        } catch (error) {
            console.error(error);
            setSurveyResult(buildFallbackSurveyResult(finalResponses));
        } finally {
            if (mountedRef.current) {
                setIsSubmitting(false);
            }
            nextStep();
        }
    };

    const handleSkipAssessment = () => {
        if (isGenerating || isSubmitting || isBotResponding) {
            return;
        }

        setAnswers({ profile: { role: "", level: "", techstack: [], domain: [], freeText: "" }, responses: [] });
        setSurveyResult(null);
        setSkillScores([]);
        setRoadmap({ today: [], weeks: [] });
        updateMatchPercentage(0);
        navigate("/home");
    };

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
    };

    const handleBackToSetup = () => {
        if (isGenerating || isSubmitting) {
            return;
        }
        sequenceRef.current += 1;
        setIsBotResponding(false);
        setStage("setup");
        setChatQuestions([]);
        setCurrentIndex(0);
        setChatDraft("");
        setAnswerMap({});
        setMessages([]);
    };

    const renderSectionHeader = (field) => (
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} sx={{ mb: 1.75 }}>
            <Tooltip title={field.hoverNote} arrow placement="top-start">
                <Typography
                    variant="overline"
                    sx={{ color: "#3f4b54", fontWeight: 800, letterSpacing: "0.12em", cursor: "help" }}
                >
                    {field.step} {field.label}
                </Typography>
            </Tooltip>
            {field.required ? (
                <Chip
                    label="Required"
                    size="small"
                    sx={{
                        height: 22,
                        borderRadius: 1,
                        bgcolor: alpha("#b7ef4e", 0.95),
                        color: "#456500",
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                    }}
                />
            ) : null}
        </Stack>
    );

    const renderSelectableButtons = (field, selectedValues) => {
        const isStack = field.id === "techstack";
        const columns = isStack
            ? { xs: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }
            : { xs: "repeat(2, 1fr)", md: "repeat(3, 1fr)" };

        return (
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: columns,
                    gap: 1.25,
                }}
            >
                {field.options.map((option) => {
                    const isActive =
                        field.type === "multi"
                            ? selectedValues.some((item) => item.toLowerCase() === option.toLowerCase())
                            : setupForm[field.id].trim().toLowerCase() === option.toLowerCase();

                    return (
                        <Button
                            key={option}
                            variant="outlined"
                            onClick={() =>
                                handleSetupChange(
                                    field.id,
                                    field.type === "multi" ? toggleHintValue(setupForm[field.id], option) : option,
                                )
                            }
                            startIcon={
                                isStack && isActive ? (
                                    <CheckCircleRoundedIcon sx={{ fontSize: 16, color: "#4d7c0f" }} />
                                ) : null
                            }
                            sx={{
                                width: "100%",
                                minHeight: isStack ? 40 : 44,
                                justifyContent: "center",
                                borderRadius: 2,
                                px: isStack ? 1.5 : 2,
                                py: isStack ? 0.8 : 1.1,
                                textTransform: "none",
                                fontWeight: isActive ? 800 : 700,
                                fontSize: isStack ? "0.78rem" : "0.88rem",
                                whiteSpace: "normal",
                                textAlign: "center",
                                lineHeight: 1.3,
                                borderColor: isActive ? alpha("#84cc16", 0.55) : "transparent",
                                bgcolor: isActive ? "#b7ef4e" : "#e7eef3",
                                color: isActive ? "#456500" : "#64707b",
                                "&:hover": {
                                    borderColor: alpha("#84cc16", 0.42),
                                    bgcolor: isActive ? "#a6dd41" : "#dde6ed",
                                },
                            }}
                        >
                            {option}
                        </Button>
                    );
                })}
            </Box>
        );
    };

    const renderDomainCards = (field) => {
        const selectedValues = selectedDomainValues;

        return (
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(3, 1fr)" }, gap: 1.5 }}>
                {field.options.map((option) => {
                    const isActive = selectedValues.some((item) => item.toLowerCase() === option.toLowerCase());
                    const IconComponent = domainIconMap[option] || AddCircleOutlineRoundedIcon;

                    return (
                        <Button
                            key={option}
                            variant="outlined"
                            onClick={() => handleSetupChange(field.id, toggleHintValue(setupForm[field.id], option))}
                            sx={{
                                minHeight: 86,
                                borderRadius: 2.5,
                                borderColor: isActive ? alpha("#84cc16", 0.85) : "transparent",
                                bgcolor: isActive ? "#bff365" : "#eaf0f4",
                                color: isActive ? "#456500" : "#44515a",
                                justifyContent: "flex-start",
                                alignItems: "flex-start",
                                p: 1.7,
                                textTransform: "none",
                                "&:hover": {
                                    borderColor: alpha("#84cc16", 0.55),
                                    bgcolor: isActive ? "#b3ea57" : "#e2eaef",
                                },
                            }}
                        >
                            <Stack spacing={1.3} alignItems="flex-start">
                                <IconComponent sx={{ fontSize: 20 }} />
                                <Typography sx={{ fontSize: "0.82rem", fontWeight: 800 }}>{option}</Typography>
                            </Stack>
                        </Button>
                    );
                })}
            </Box>
        );
    };

    if (stage === "setup") {
        return (
            <>
                <Box sx={{ maxWidth: 1240, mx: "auto", px: { xs: 2, md: 3 }, py: { xs: 2.5, md: 4 } }}>
                    <Paper
                        elevation={0}
                        sx={{
                            overflow: "hidden",
                            borderRadius: 6,
                            border: "1px solid",
                            borderColor: alpha("#cbd5e1", 0.8),
                            background:
                                "radial-gradient(circle at top left, rgba(189, 242, 100, 0.18), transparent 28%), linear-gradient(135deg, #f8fafc 0%, #eef2f7 100%)",
                        }}
                    >
                        <Box
                            sx={{
                                display: "grid",
                                gridTemplateColumns: { xs: "1fr", lg: "minmax(420px, 1fr) minmax(620px, 1.18fr)" },
                                alignItems: "stretch",
                            }}
                        >
                            <Box sx={{ p: { xs: 3, md: 5 }, position: "relative", minHeight: { lg: 760 } }}>
                                <Chip
                                    icon={<AutoAwesomeRoundedIcon sx={{ color: "#1f2937 !important" }} />}
                                    label="ONBOARDING AI"
                                    sx={{
                                        mb: 3,
                                        px: 1,
                                        height: 42,
                                        borderRadius: 999,
                                        bgcolor: "#b7ef4e",
                                        color: "#1f2937",
                                        fontWeight: 800,
                                        letterSpacing: "0.08em",
                                    }}
                                />
                                <Typography
                                    variant="h2"
                                    sx={{
                                        maxWidth: 440,
                                        fontSize: { xs: "2.5rem", md: "4rem" },
                                        lineHeight: 0.98,
                                        fontWeight: 900,
                                        letterSpacing: "-0.04em",
                                        color: "#1f2937",
                                    }}
                                >
                                    Let&apos;s calibrate your{" "}
                                    <Box component="span" sx={{ color: "#5b8c09" }}>
                                        profile.
                                    </Box>
                                </Typography>
                                <Typography
                                    sx={{
                                        mt: 2.5,
                                        maxWidth: 420,
                                        color: "#475569",
                                        fontSize: "1.1rem",
                                        lineHeight: 1.8,
                                    }}
                                >
                                    Give the AI the role, level, stack, and context you care about most. You can click
                                    the quick choices, type your own answers, or mix both.
                                </Typography>

                                <Paper
                                    elevation={0}
                                    sx={{
                                        mt: 5,
                                        p: 3,
                                        borderRadius: 4,
                                        maxWidth: 420,
                                        minHeight: 250,
                                        position: "relative",
                                        overflow: "hidden",
                                        background:
                                            "linear-gradient(180deg, rgba(46, 125, 50, 0.16) 0%, rgba(15, 23, 42, 0.04) 100%)",
                                        border: "1px solid",
                                        borderColor: alpha("#94a3b8", 0.28),
                                        boxShadow: "0 30px 60px rgba(15, 23, 42, 0.10)",
                                    }}
                                >
                                    <Stack spacing={2} alignItems="center">
                                        <img
                                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuC-EKQhF8FcTmqCP0qOLEnNxbFYtQnBt3KtqMj0fB1Jlw_n9wcuPHgAseNQRjmRM-Weo0-wMH-O2X-eWhzaG8iX3pWAXEPRsAxQaTf0ixPqH5LtZtPdeI4XpKtucFuq_9gh9VHU5NopcAmWNhPAZsgWvevxo8hZ23jOYkXNvZhGpgqK5zBkpUR-OORLdq8ogJEIwDI5HU4bMgl7BYF5wP-1YYC8GD2KmLyUVHq6sdJiLqIaoU5tru4ufwQK96Mky_c6GeZJo5RPbzHc"
                                            alt="Assessment"
                                            style={{ maxWidth: "320px", borderRadius: "12px" }}
                                        />
                                        <Typography variant="h6" textAlign="center" fontWeight={600}>
                                            Calibrated questions. Cleaner signal. Better assessment.
                                        </Typography>
                                    </Stack>
                                </Paper>
                            </Box>

                            <Box
                                sx={{
                                    p: { xs: 3, md: 4.5 },
                                    bgcolor: "#ffffff",
                                    borderLeft: { lg: "1px solid" },
                                    borderColor: alpha("#d6e0e6", 0.95),
                                }}
                            >
                                <Stack spacing={4.5}>
                                    {setupFields
                                        .filter(
                                            (field) =>
                                                field.id === "role" || field.id === "level" || field.id === "techstack",
                                        )
                                        .map((field) => {
                                            const selectedValues =
                                                field.id === "techstack"
                                                    ? selectedTechstackValues
                                                    : selectedDomainValues;

                                            return (
                                                <Box key={field.id}>
                                                    {renderSectionHeader(field)}
                                                    <Typography variant="body2" sx={{ color: "#73808a", mb: 1.75 }}>
                                                        {field.helper}
                                                    </Typography>
                                                    {renderSelectableButtons(field, selectedValues)}
                                                    <TextField
                                                        fullWidth
                                                        value={setupForm[field.id]}
                                                        onChange={(event) =>
                                                            handleSetupChange(field.id, event.target.value)
                                                        }
                                                        error={Boolean(setupErrors[field.id])}
                                                        helperText={setupErrors[field.id] || " "}
                                                        placeholder={field.placeholder}
                                                        sx={{
                                                            mt: 1.5,
                                                            "& .MuiOutlinedInput-root": {
                                                                borderRadius: 2,
                                                                bgcolor: "#eef3f7",
                                                                "& fieldset": { borderColor: alpha("#d8e0e6", 0.85) },
                                                            },
                                                        }}
                                                    />
                                                </Box>
                                            );
                                        })}

                                    {setupFields
                                        .filter((field) => field.id === "domain")
                                        .map((field) => (
                                            <Box key={field.id}>
                                                {renderSectionHeader(field)}
                                                <Typography variant="body2" sx={{ color: "#73808a", mb: 1.75 }}>
                                                    {field.helper}
                                                </Typography>
                                                {renderDomainCards(field)}
                                                <TextField
                                                    fullWidth
                                                    value={setupForm[field.id]}
                                                    onChange={(event) =>
                                                        handleSetupChange(field.id, event.target.value)
                                                    }
                                                    error={Boolean(setupErrors[field.id])}
                                                    helperText={setupErrors[field.id] || "Optional custom domain input"}
                                                    placeholder={field.placeholder}
                                                    sx={{
                                                        mt: 1.5,
                                                        "& .MuiOutlinedInput-root": {
                                                            borderRadius: 2,
                                                            bgcolor: "#eef3f7",
                                                            "& fieldset": { borderColor: alpha("#d8e0e6", 0.85) },
                                                        },
                                                    }}
                                                />
                                            </Box>
                                        ))}

                                    {setupFields
                                        .filter((field) => field.id === "free_text")
                                        .map((field) => (
                                            <Box key={field.id}>
                                                {renderSectionHeader(field)}
                                                <Box sx={{ position: "relative" }}>
                                                    <TextField
                                                        fullWidth
                                                        multiline
                                                        minRows={5}
                                                        value={setupForm[field.id]}
                                                        onChange={(event) =>
                                                            handleSetupChange(field.id, event.target.value)
                                                        }
                                                        error={Boolean(setupErrors[field.id])}
                                                        helperText={setupErrors[field.id] || " "}
                                                        placeholder={field.placeholder}
                                                        sx={{
                                                            "& .MuiOutlinedInput-root": {
                                                                alignItems: "flex-start",
                                                                borderRadius: 2.25,
                                                                bgcolor: "#eaf0f4",
                                                                "& fieldset": { borderColor: alpha("#d8e0e6", 0.8) },
                                                            },
                                                            "& .MuiInputBase-input": {
                                                                py: 1.7,
                                                            },
                                                        }}
                                                    />
                                                    <Typography
                                                        variant="caption"
                                                        sx={{
                                                            position: "absolute",
                                                            right: 14,
                                                            bottom: 18,
                                                            color: "#a1acb5",
                                                            fontWeight: 800,
                                                            letterSpacing: "0.18em",
                                                            textTransform: "uppercase",
                                                            pointerEvents: "none",
                                                        }}
                                                    >
                                                        {field.required ? "Required" : "Optional"}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        ))}

                                    <Stack
                                        direction={{ xs: "column", sm: "row" }}
                                        justifyContent="space-between"
                                        alignItems={{ xs: "stretch", sm: "center" }}
                                        spacing={2}
                                        sx={{ pt: 1 }}
                                    >
                                        <Button
                                            variant="text"
                                            color="inherit"
                                            onClick={handleSkipAssessment}
                                            disabled={isGenerating || isSubmitting}
                                            sx={{ justifyContent: "flex-start", fontWeight: 700 }}
                                        >
                                            Skip for now
                                        </Button>
                                        <Button
                                            variant="contained"
                                            size="large"
                                            onClick={requestGeneratedQuestions}
                                            disabled={isGenerating || isSubmitting}
                                            sx={{
                                                minWidth: 220,
                                                borderRadius: 2.5,
                                                py: 1.5,
                                                bgcolor: "#b7ef4e",
                                                color: "#1f2937",
                                                fontWeight: 800,
                                                textTransform: "none",
                                                "&:hover": { bgcolor: "#a6dd41" },
                                            }}
                                        >
                                            <Stack direction="row" spacing={1.2} alignItems="center">
                                                {isGenerating ? (
                                                    <CircularProgress size={18} sx={{ color: "#1f2937" }} />
                                                ) : (
                                                    <AutoAwesomeRoundedIcon fontSize="small" />
                                                )}
                                                <Box component="span">
                                                    {isGenerating ? "Generating Questions..." : "Continue Assessment"}
                                                </Box>
                                            </Stack>
                                        </Button>
                                    </Stack>
                                </Stack>
                            </Box>
                        </Box>
                    </Paper>
                </Box>

                <Dialog open={showGenerateDialog} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
                    <DialogContent sx={{ p: 3.5 }}>
                        <Stack spacing={3} alignItems="center">
                            <Box sx={{ width: "100%", textAlign: "center" }}>
                                <Typography variant="h6" fontWeight={800} gutterBottom>
                                    Generating your assessment
                                </Typography>
                                <Typography color="text.secondary">
                                    We&apos;re calibrating questions from your role, stack, and goals.
                                </Typography>
                            </Box>
                            <Box sx={{ position: "relative", display: "inline-flex" }}>
                                <CircularProgress
                                    size={88}
                                    thickness={4}
                                    value={100}
                                    variant="determinate"
                                    sx={{ color: alpha("#cbd5e1", 0.8) }}
                                />
                                <CircularProgress
                                    size={88}
                                    thickness={4}
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
                                        fontWeight: 900,
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
                                    height: 10,
                                    borderRadius: 999,
                                    bgcolor: alpha("#cbd5e1", 0.45),
                                    "& .MuiLinearProgress-bar": { borderRadius: 999, bgcolor: "#84cc16" },
                                }}
                            />
                        </Stack>
                    </DialogContent>
                </Dialog>
            </>
        );
    }

    return (
        <Box sx={{ maxWidth: 980, mx: "auto", px: { xs: 2, md: 3 }, py: { xs: 2.5, md: 4 } }}>
            <Stack spacing={3}>
                <Paper
                    elevation={0}
                    sx={{
                        p: 3,
                        borderRadius: 4,
                        border: "1px solid",
                        borderColor: alpha("#cbd5e1", 0.85),
                        background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
                    }}
                >
                    <Stack
                        direction={{ xs: "column", md: "row" }}
                        spacing={2}
                        justifyContent="space-between"
                        alignItems={{ xs: "flex-start", md: "center" }}
                    >
                        <Box>
                            <Typography
                                variant="overline"
                                sx={{ color: "#64748b", fontWeight: 800, letterSpacing: "0.08em" }}
                            >
                                AI Assessment Chat
                            </Typography>
                            <Typography variant="h5" fontWeight={800} sx={{ color: "#0f172a" }}>
                                {setupForm.role || "Candidate"} interview simulation
                            </Typography>
                            <Typography color="text.secondary">
                                {currentQuestion?.helper ||
                                    "Stay natural. We'll move one question at a time with paced AI replies."}
                            </Typography>
                        </Box>
                        <Chip
                            label={
                                isSubmitting
                                    ? "Submitting Answers"
                                    : isBotResponding
                                      ? "AI Responding"
                                      : `Question ${Math.min(currentIndex + 1, Math.max(totalQuestions, 1))} of ${Math.max(totalQuestions, 1)}`
                            }
                            sx={{
                                borderRadius: 999,
                                bgcolor: alpha("#b7ef4e", 0.18),
                                color: "#365314",
                                fontWeight: 800,
                            }}
                        />
                    </Stack>
                    <LinearProgress
                        variant="determinate"
                        value={Math.max(progress, answeredCount ? 6 : 2)}
                        sx={{
                            mt: 2.5,
                            height: 10,
                            borderRadius: 999,
                            bgcolor: alpha("#cbd5e1", 0.45),
                            "& .MuiLinearProgress-bar": { borderRadius: 999, bgcolor: "#84cc16" },
                        }}
                    />
                </Paper>

                <Paper
                    elevation={0}
                    sx={{
                        borderRadius: 4,
                        border: "1px solid",
                        borderColor: alpha("#cbd5e1", 0.85),
                        overflow: "hidden",
                    }}
                >
                    <Box sx={{ p: 3.5, bgcolor: alpha("#f8fafc", 0.82) }}>
                        <Typography variant="h5" fontWeight={800}>
                            Assessment Conversation
                        </Typography>
                        <Typography color="text.secondary">
                            Your setup is locked in. If you need to adjust it, use Previous to go back to chapter 1.
                        </Typography>
                    </Box>
                    <Divider />
                    <Box ref={listRef} sx={{ p: 3, bgcolor: "#f8fafc", height: 400, overflowY: "auto" }}>
                        <Stack spacing={2.5}>
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
                                            direction="row"
                                            spacing={1.5}
                                            sx={{
                                                maxWidth: "86%",
                                                alignItems: "flex-end",
                                                animation: message.animateIn
                                                    ? `${floatUp} 360ms ease-out both`
                                                    : "none",
                                            }}
                                        >
                                            {!isUser ? (
                                                <Avatar
                                                    sx={{ bgcolor: "#0f172a", color: "#fff", width: 36, height: 36 }}
                                                >
                                                    <SmartToyRoundedIcon fontSize="small" />
                                                </Avatar>
                                            ) : null}
                                            <Paper
                                                elevation={0}
                                                sx={{
                                                    p: 2,
                                                    borderRadius: isUser ? "20px 20px 6px 20px" : "20px 20px 20px 6px",
                                                    bgcolor: isUser ? "#b7ef4e" : "#ffffff",
                                                    color: isUser ? "#365314" : "#0f172a",
                                                    border: "1px solid",
                                                    borderColor: isUser
                                                        ? alpha("#84cc16", 0.48)
                                                        : alpha("#cbd5e1", 0.9),
                                                    boxShadow: `0 14px 34px ${alpha("#0f172a", isUser ? 0.16 : 0.08)}`,
                                                    minWidth: isProcessing ? 150 : 0,
                                                }}
                                            >
                                                {isProcessing ? (
                                                    <TypingIndicator />
                                                ) : (
                                                    <Typography sx={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
                                                        {message.text}
                                                    </Typography>
                                                )}
                                            </Paper>
                                            {isUser ? (
                                                <Avatar
                                                    sx={{ bgcolor: "#1f2937", color: "#fff", width: 36, height: 36 }}
                                                >
                                                    <PersonRoundedIcon fontSize="small" />
                                                </Avatar>
                                            ) : null}
                                        </Stack>
                                    </Stack>
                                );
                            })}
                        </Stack>
                    </Box>
                    <Divider />
                    <Box sx={{ p: 3.5 }}>
                        {currentQuestion?.type === "single" && (currentQuestion.options || []).length > 0 ? (
                            <Stack spacing={1.5}>
                                <Typography color="text.secondary">
                                    Pick a suggested answer or type your own response below.
                                </Typography>
                                <Stack spacing={1.25}>
                                    {(currentQuestion.options || []).map((option) => (
                                        <Button
                                            key={option}
                                            variant={chatDraft === option ? "contained" : "outlined"}
                                            onClick={() => setChatDraft(option)}
                                            disabled={isBotResponding || isSubmitting}
                                            sx={{
                                                width: "100%",
                                                minHeight: 58,
                                                borderRadius: 2.5,
                                                px: 2,
                                                py: 1.25,
                                                textTransform: "none",
                                                fontWeight: 700,
                                                whiteSpace: "normal",
                                                textAlign: "left",
                                                justifyContent: "flex-start",
                                                lineHeight: 1.35,
                                            }}
                                        >
                                            {option}
                                        </Button>
                                    ))}
                                </Stack>
                            </Stack>
                        ) : null}
                        <TextField
                            sx={{ mt: currentQuestion?.type === "single" ? 2.5 : 0 }}
                            multiline={currentQuestion?.type !== "single"}
                            minRows={currentQuestion?.type !== "single" ? 4 : 1}
                            fullWidth
                            value={chatDraft}
                            onChange={(event) => setChatDraft(event.target.value)}
                            placeholder={
                                currentQuestion?.type === "single"
                                    ? "Select a suggestion above or type your own answer"
                                    : currentQuestion?.helper || "Type your answer here"
                            }
                            disabled={isBotResponding || isSubmitting}
                        />
                        <Stack
                            direction={{ xs: "column", md: "row" }}
                            justifyContent="space-between"
                            alignItems={{ xs: "stretch", md: "center" }}
                            spacing={2}
                            sx={{ mt: 3 }}
                        >
                            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                                <Button
                                    variant="outlined"
                                    startIcon={<KeyboardBackspaceRoundedIcon />}
                                    onClick={handleBackToSetup}
                                    disabled={isBotResponding || isSubmitting}
                                    sx={{ borderRadius: 2.5, textTransform: "none", fontWeight: 700 }}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="text"
                                    color="inherit"
                                    endIcon={<SkipNextRoundedIcon />}
                                    onClick={handleSkipAssessment}
                                    disabled={isBotResponding || isSubmitting}
                                >
                                    Skip Assessment
                                </Button>
                            </Stack>
                            <Stack direction="row" spacing={2} alignItems="center" justifyContent="flex-end">
                                <Typography color="text.secondary">
                                    {responses.length} answer{responses.length === 1 ? "" : "s"} captured.
                                </Typography>
                                <Button
                                    variant="contained"
                                    size="large"
                                    endIcon={!isSubmitting && !isBotResponding ? <SendRoundedIcon /> : null}
                                    onClick={handleSend}
                                    disabled={!chatDraft.trim() || isBotResponding || isSubmitting}
                                    sx={{ minWidth: 180, borderRadius: 2.5, textTransform: "none", fontWeight: 800 }}
                                >
                                    {isSubmitting ? (
                                        <Stack direction="row" spacing={1.2} alignItems="center">
                                            <CircularProgress size={18} sx={{ color: "#fff" }} />
                                            <Box component="span">Submitting...</Box>
                                        </Stack>
                                    ) : answeredCount === totalQuestions - 1 ? (
                                        "Finish Assessment"
                                    ) : (
                                        "Send"
                                    )}
                                </Button>
                            </Stack>
                        </Stack>
                    </Box>
                </Paper>
            </Stack>
        </Box>
    );
};

export default ChatSurvey;
