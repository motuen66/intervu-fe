import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { Calendar, CalendarDays, ArrowRight, BookOpen, Map, Sparkles } from "lucide-react";
import { CompanyLogo } from "../../../common/utils/logoImageGenerator";
import { getSessions } from "../../interview/services/interviewRoomApi";
import { INTERVIEW_ROOM_STATUS } from "../../../common/constants/status";
import { callApi } from "../../../common/utils/apiConnector";
import { METHOD } from "../../../common/constants/api";
import { homeEndPoints } from "../services/homeApi";
import { interviewQuestionEndPoints } from "../../interviewQuestions/service/interviewQuestionApi";
import { candidateProfileEndPoints } from "../../profiles/candidate/service/candidateProfileApi";
import {
    getAssessmentState,
    ASSESSMENT_DATA_STATE,
} from "../../profiles/candidate/candidate-assessment/helpers/assessmentHelper";
import { assessmentEndPoints } from "../../profiles/candidate/candidate-assessment/services/assessmentApi";
import SmartMatchModal from "../../smartSearch/components/SmartMatchModal";
import CoachOrbitHero from "../components/CoachOrbitHero";
import FeatureCards from "../components/FeatureCards";
import PrepJourney from "../components/PrepJourney";
import "./CandidateHomePage.css";

const UPCOMING_STATUSES = [INTERVIEW_ROOM_STATUS.SCHEDULED, INTERVIEW_ROOM_STATUS.ON_GOING];


const getSessionStartTimeMs = (session) => {
    if (!session) return Number.POSITIVE_INFINITY;
    const rounds = Array.isArray(session.rounds) ? session.rounds : [];
    if (rounds.length > 0) {
        const firstRound = [...rounds]
            .filter((r) => r?.scheduledTime)
            .sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime())[0];
        if (firstRound?.scheduledTime) {
            const ts = new Date(firstRound.scheduledTime).getTime();
            if (!Number.isNaN(ts)) return ts;
        }
    }
    const fallbackTs = new Date(session.scheduledTime).getTime();
    return Number.isNaN(fallbackTs) ? Number.POSITIVE_INFINITY : fallbackTs;
};

const sortByStartTimeNearestNow = (items = []) => {
    const now = Date.now();
    return [...items].sort((a, b) => {
        const aDistance = Math.abs(getSessionStartTimeMs(a) - now);
        const bDistance = Math.abs(getSessionStartTimeMs(b) - now);
        return aDistance - bDistance;
    });
};

const pickRoomIdForSession = (session) => {
    if (!session) return null;
    const rounds = Array.isArray(session.rounds) && session.rounds.length > 0 ? session.rounds : [session];
    const ongoing = rounds.find((r) => r?.status === INTERVIEW_ROOM_STATUS.ON_GOING && r?.id);
    if (ongoing?.id) return ongoing.id;
    const scheduled = [...rounds]
        .filter((r) => r?.status === INTERVIEW_ROOM_STATUS.SCHEDULED && r?.scheduledTime)
        .sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime())[0];
    if (scheduled?.id) return scheduled.id;
    return session.id ?? session.Id ?? null;
};

const sessionTitle = (session) => {
    const rounds = Array.isArray(session?.rounds) ? session.rounds : [];
    const r0 = rounds[0] ?? session;
    return (
        r0?.interviewTypeName ||
        r0?.problemShortName ||
        session?.interviewTypeName ||
        session?.problemShortName ||
        "Interview session"
    );
};

const formatSessionWhen = (session) => {
    const rounds = Array.isArray(session?.rounds) ? session.rounds : [];
    const r0 =
        [...rounds].filter((r) => r?.scheduledTime).sort(
            (a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime(),
        )[0] || session;
    const dt = r0?.scheduledTime || session?.scheduledTime;
    if (!dt) return "";
    const d = new Date(dt);
    if (Number.isNaN(d.getTime())) return "";
    const today = new Date();
    const isToday =
        d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const isTomorrow =
        d.getDate() === tomorrow.getDate() &&
        d.getMonth() === tomorrow.getMonth() &&
        d.getFullYear() === tomorrow.getFullYear();
    const timeStr = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    if (isToday) return `Today, ${timeStr}`;
    if (isTomorrow) return `Tomorrow, ${timeStr}`;
    return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
};

const isSessionLive = (session) => {
    const rounds = Array.isArray(session?.rounds) ? session.rounds : [];
    if (rounds.length) return rounds.some((r) => r?.status === INTERVIEW_ROOM_STATUS.ON_GOING);
    return session?.status === INTERVIEW_ROOM_STATUS.ON_GOING;
};

function hashPickIndex(seed, length) {
    if (length <= 0) return 0;
    let h = 0;
    for (let i = 0; i < seed.length; i++) {
        h = (h << 5) - h + seed.charCodeAt(i);
        h |= 0;
    }
    return Math.abs(h) % length;
}

export default function CandidateHomePage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { userData } = useSelector((state) => state.auth || {});

    const [smartMatchOpen, setSmartMatchOpen] = useState(false);
    const [sessionsLoading, setSessionsLoading] = useState(true);
    const [scheduleSessions, setScheduleSessions] = useState([]);
    const [completedCount, setCompletedCount] = useState(0);

    const [topCoaches, setTopCoaches] = useState([]);
    const [topCoachesLoading, setTopCoachesLoading] = useState(true);

    const [qotd, setQotd] = useState(null);
    const [qotdLoading, setQotdLoading] = useState(true);

    const [skills, setSkills] = useState([]);

    const [journeyFlags, setJourneyFlags] = useState({
        profileComplete: false,
        assessmentDone: false,
        roadmapExists: false,
        loading: true,
    });

    useEffect(() => {
        setSmartMatchOpen(searchParams.get("smartMatch") === "1");
    }, [searchParams]);

    const openSmartMatch = useCallback(() => {
        const next = new URLSearchParams(searchParams);
        next.set("smartMatch", "1");
        setSearchParams(next);
    }, [searchParams, setSearchParams]);

    const closeSmartMatch = useCallback(() => {
        const next = new URLSearchParams(searchParams);
        next.delete("smartMatch");
        setSearchParams(next);
    }, [searchParams, setSearchParams]);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setSessionsLoading(true);
            try {
                const response = await getSessions({
                    page: 1,
                    pageSize: 6,
                    statuses: UPCOMING_STATUSES,
                });
                if (cancelled) return;
                const page = response?.page ?? response?.Page ?? {};
                const items = page.items ?? page.Items ?? [];
                const sorted = sortByStartTimeNearestNow(items);
                setScheduleSessions(sorted.slice(0, 5));

                const st = response?.stats ?? response?.Stats;
                if (st) {
                    setCompletedCount(st.completed ?? st.Completed ?? 0);
                }
            } catch (e) {
                console.error(e);
                if (!cancelled) {
                    setScheduleSessions([]);
                }
            } finally {
                if (!cancelled) setSessionsLoading(false);
            }
        };
        load();
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setTopCoachesLoading(true);
            try {
                const res = await callApi({
                    method: METHOD.GET,
                    endpoint: homeEndPoints.GET_TOP_COACHES,
                    arg: { count: 5 },
                    useGlobalLoading: false,
                });
                if (cancelled) return;
                const raw = res?.data;
                setTopCoaches(Array.isArray(raw) ? raw : []);
            } catch (e) {
                console.error(e);
                if (!cancelled) setTopCoaches([]);
            } finally {
                if (!cancelled) setTopCoachesLoading(false);
            }
        };
        load();
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setQotdLoading(true);
            try {
                const { data } = await callApi({
                    method: METHOD.GET,
                    endpoint: interviewQuestionEndPoints.GET_LIST,
                    arg: { page: 1, pageSize: 40, sortBy: 1 },
                    useGlobalLoading: false,
                });
                if (cancelled) return;
                const payload = data ?? {};
                const items = payload.items ?? payload.data ?? (Array.isArray(payload) ? payload : []);
                const list = Array.isArray(items) ? items : [];
                if (!list.length) {
                    setQotd(null);
                    return;
                }
                const userId = userData?.id ?? "anon";
                const dayKey = new Date().toISOString().slice(0, 10);
                const idx = hashPickIndex(`${userId}|${dayKey}`, list.length);
                const picked = list[idx];
                setQotd({
                    id: picked.id ?? picked.Id,
                    title: picked.title ?? picked.Title ?? "Practice question",
                    content: picked.content ?? picked.Content ?? "",
                });
            } catch (e) {
                console.error(e);
                if (!cancelled) setQotd(null);
            } finally {
                if (!cancelled) setQotdLoading(false);
            }
        };
        load();
        return () => {
            cancelled = true;
        };
    }, [userData?.id]);

    useEffect(() => {
        if (!userData?.id) return;
        let cancelled = false;
        const load = async () => {
            try {
                const profileEndpoint = candidateProfileEndPoints.VIEW_OWN_CANDIDATE_PROFILE.replace(
                    "{id}",
                    userData.id,
                );
                const [profileResult, assessmentResult, roadmapResult] = await Promise.allSettled([
                    callApi({ method: METHOD.GET, endpoint: profileEndpoint, useGlobalLoading: false }),
                    getAssessmentState(userData.id),
                    callApi({
                        method: METHOD.GET,
                        endpoint: assessmentEndPoints.GET_ROADMAP(userData.id),
                        useGlobalLoading: false,
                    }),
                ]);
                if (cancelled) return;

                const profile =
                    profileResult.status === "fulfilled"
                        ? (profileResult.value?.data ?? profileResult.value ?? {})
                        : {};

                const rawSkills = profile.skills ?? profile.Skills ?? [];
                const names = (Array.isArray(rawSkills) ? rawSkills : [])
                    .map((s) => (typeof s === "string" ? s : s?.name ?? s?.Name))
                    .filter(Boolean)
                    .slice(0, 12);
                setSkills(names);

                const profileComplete = Boolean(
                    (profile.bio ?? profile.Bio)?.trim() &&
                        names.length > 0 &&
                        (profile.user?.fullName ?? profile.fullName ?? userData?.fullName)?.trim(),
                );

                const assessmentDone =
                    assessmentResult.status === "fulfilled" &&
                    assessmentResult.value?.status === ASSESSMENT_DATA_STATE.HAS_DATA;

                const roadmapData =
                    roadmapResult.status === "fulfilled"
                        ? (roadmapResult.value?.data ?? roadmapResult.value)
                        : null;
                const roadmapExists = Boolean(
                    roadmapData && (Array.isArray(roadmapData) ? roadmapData.length > 0 : true),
                );

                setJourneyFlags({ profileComplete, assessmentDone, roadmapExists, loading: false });
            } catch {
                if (!cancelled) setJourneyFlags((f) => ({ ...f, loading: false }));
            }
        };
        load();
        return () => {
            cancelled = true;
        };
    }, [userData?.id]);

    const firstName = useMemo(() => {
        const n = userData?.fullName?.trim();
        if (!n) return "";
        return n.split(/\s+/)[0];
    }, [userData?.fullName]);

    const hasBooked = useMemo(
        () => completedCount > 0 || scheduleSessions.length > 0,
        [completedCount, scheduleSessions],
    );

    const journeySteps = useMemo(
        () => [
            {
                id: "profile",
                label: "Complete Profile",
                actionLabel: "Set up now",
                to: "/candidate/profile",
                done: journeyFlags.profileComplete,
            },
            {
                id: "assessment",
                label: "Finish Assessment",
                actionLabel: "Resume task",
                to: "/assessment",
                done: journeyFlags.assessmentDone,
            },
            {
                id: "roadmap",
                label: "Review Roadmap",
                actionLabel: "Open roadmap",
                to: "/roadmap",
                done: journeyFlags.roadmapExists,
            },
            {
                id: "booking",
                label: "Book First Session",
                actionLabel: "Find a coach",
                to: "/coaches",
                done: hasBooked,
            },
        ],
        [journeyFlags, hasBooked],
    );

    const handleJoinRoom = (e, session) => {
        e.stopPropagation();
        const roomId = pickRoomIdForSession(session);
        navigate(roomId ? `/interview/room/${roomId}` : "/interview");
    };

    const handleSessionDetail = (session) => {
        const sessionId = session.sessionId ?? session.SessionId ?? session.id;
        navigate(sessionId ? `/booking-requests?session=${sessionId}` : "/booking-requests");
    };

    return (
        <div className="candidate-home">
            <div className="candidate-home__greeting">
                <h1>
                    Ready to crush it
                    {firstName ? (
                        <>
                            ,&nbsp;<span className="candidate-home__greeting-name">{firstName}</span>
                        </>
                    ) : null}
                    ?
                </h1>
                <p>
                    Your personalized roadmap is optimized.{" "}
                    {completedCount > 0 ? (
                        <>
                            You&apos;ve completed <strong>{completedCount}</strong>{" "}
                            {completedCount === 1 ? "session" : "sessions"} — keep the momentum!
                        </>
                    ) : (
                        <>Start your first session and begin climbing toward your dream offer.</>
                    )}
                </p>
            </div>

            {/* 6 feature shortcut cards — always at the top */}
            <FeatureCards onSmartMatch={openSmartMatch} />

            <Box sx={{ mb: 3 }}>
                <CoachOrbitHero coaches={topCoaches} />
                {topCoachesLoading && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                        Loading spotlight coaches…
                    </Typography>
                )}
            </Box>


            <div className="candidate-home__grid">
                <div className="candidate-home__col-7">
                    <div className="candidate-home__card">
                        <h3>
                            <span className="candidate-home__card-icon" aria-hidden>
                                <Calendar size={16} strokeWidth={2} />
                            </span>
                            Schedule
                        </h3>
                        {sessionsLoading ? (
                            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                                <CircularProgress size={28} />
                            </Box>
                        ) : scheduleSessions.length === 0 ? (
                            <Box
                                className="candidate-home__schedule-empty"
                                sx={{
                                    flex: 1,
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    textAlign: "center",
                                    gap: 1.5,
                                    minHeight: { xs: 200, sm: 240 },
                                    py: { xs: 2, sm: 1 },
                                    px: 1,
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 52,
                                        height: 52,
                                        borderRadius: 2.5,
                                        bgcolor: "action.hover",
                                        color: "primary.main",
                                        display: "grid",
                                        placeItems: "center",
                                        border: "1px solid",
                                        borderColor: "divider",
                                    }}
                                    aria-hidden
                                >
                                    <CalendarDays size={26} strokeWidth={1.75} />
                                </Box>
                                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "text.primary", mt: 0.5 }}>
                                    No upcoming sessions
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 320, lineHeight: 1.65, mb: 0.5 }}>
                                    Book a coach when you&apos;re ready, or use Smart match to get suggestions from your profile.
                                </Typography>
                                <Stack
                                    direction={{ xs: "column", sm: "row" }}
                                    spacing={1.25}
                                    sx={{ width: "100%", maxWidth: 340, justifyContent: "center", mt: 0.5 }}
                                >
                                    <Button
                                        component={Link}
                                        to="/coaches"
                                        variant="contained"
                                        color="primary"
                                        size="medium"
                                        sx={{ fontWeight: 800 }}
                                    >
                                        Find a coach
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        color="primary"
                                        size="medium"
                                        startIcon={<Sparkles size={18} strokeWidth={2} />}
                                        onClick={openSmartMatch}
                                        sx={{ fontWeight: 700, borderWidth: 2, "&:hover": { borderWidth: 2 } }}
                                    >
                                        Smart match
                                    </Button>
                                </Stack>
                            </Box>
                        ) : (
                            <>
                                {scheduleSessions.map((session) => {
                                    const live = isSessionLive(session);
                                    return (
                                        <div
                                            key={session.sessionId ?? session.SessionId ?? session.id}
                                            className="candidate-home__schedule-item"
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => !live && handleSessionDetail(session)}
                                            onKeyDown={(e) => e.key === "Enter" && !live && handleSessionDetail(session)}
                                            style={{ cursor: live ? "default" : "pointer" }}
                                        >
                                            <div>
                                                <div className="candidate-home__session-title">{sessionTitle(session)}</div>
                                                <div className="candidate-home__session-meta">{formatSessionWhen(session)}</div>
                                            </div>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                {live ? (
                                                    <Button
                                                        size="small"
                                                        variant="contained"
                                                        color="secondary"
                                                        onClick={(e) => handleJoinRoom(e, session)}
                                                        sx={{ fontWeight: 800, fontSize: "12px", minWidth: 90, py: 0.5 }}
                                                    >
                                                        Join Room
                                                    </Button>
                                                ) : (
                                                    <ArrowRight size={16} className="candidate-home__schedule-arrow" />
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                                <Box sx={{ mt: 1 }}>
                                    <Button component={Link} to="/interview" variant="contained" size="small" fullWidth>
                                        View calendar
                                    </Button>
                                </Box>
                            </>
                        )}
                    </div>
                </div>

                <div className="candidate-home__col-5">
                    <div className="candidate-home__card">
                        <PrepJourney
                            steps={journeySteps}
                            loading={journeyFlags.loading || sessionsLoading}
                        />
                    </div>
                </div>
            </div>

            <div className="candidate-home__grid">
                <div className="candidate-home__col-7">
                    <div className="candidate-home__card">
                        <h3>
                            <span className="candidate-home__card-icon" aria-hidden>
                                <BookOpen size={16} strokeWidth={2} />
                            </span>
                            Question of the day
                        </h3>
                        {qotdLoading ? (
                            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                                <CircularProgress size={24} />
                            </Box>
                        ) : qotd ? (
                            <>
                                <p className="candidate-home__qotd-title">{qotd.title}</p>
                                {qotd.content && (
                                    <p className="candidate-home__qotd-meta candidate-home__qotd-content">{qotd.content}</p>
                                )}
                                <Button
                                    component={Link}
                                    to={`/questions/${qotd.id}`}
                                    variant="outlined"
                                    endIcon={<ArrowRight size={16} />}
                                >
                                    Open question
                                </Button>
                            </>
                        ) : (
                            <Typography variant="body2" color="text.secondary">
                                No questions available right now.{" "}
                                <Link className="candidate-home__text-link" to="/questions">
                                    Browse the bank
                                </Link>
                            </Typography>
                        )}
                    </div>
                </div>
                <div className="candidate-home__col-5">
                    <div className="candidate-home__card">
                        <h3>
                            <span className="candidate-home__card-icon" aria-hidden>
                                <Map size={16} strokeWidth={2} />
                            </span>
                            Your focus
                        </h3>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                            Skills on your profile — refine them in profile settings, then use Smart match or browse
                            coaches filtered by skill.
                        </Typography>
                        {skills.length ? (
                            <div className="candidate-home__skills-row">
                                {skills.map((name) => (
                                    <span key={name} className="candidate-home__skill-chip">
                                        <CompanyLogo name={name} size={15} />
                                        {name}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <Typography variant="body2" color="text.secondary">
                                Add skills to your profile for better coach matching.
                            </Typography>
                        )}
                        <div className="candidate-home__link-row">
                            <Link className="candidate-home__text-link" to="/candidate/profile">
                                Edit profile
                            </Link>
                            <Link className="candidate-home__text-link" to="/roadmap">
                                Open roadmap
                            </Link>
                            <Link className="candidate-home__text-link" to="/coaches">
                                Browse coaches
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <SmartMatchModal open={smartMatchOpen} onClose={closeSmartMatch} />
        </div>
    );
}
