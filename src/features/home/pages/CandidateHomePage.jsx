import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { Box, Button, CircularProgress, Typography } from "@mui/material";
import { Calendar, ArrowRight, BookOpen, Map } from "lucide-react";
import { CompanyLogo } from "../../../common/utils/logoImageGenerator";
import { getSessions } from "../../interview/services/interviewRoomApi";
import { INTERVIEW_ROOM_STATUS } from "../../../common/constants/status";
import { callApi } from "../../../common/utils/apiConnector";
import { METHOD } from "../../../common/constants/api";
import { homeEndPoints } from "../services/homeApi";
import { interviewQuestionEndPoints } from "../../interviewQuestions/service/interviewQuestionApi";
import { candidateProfileEndPoints } from "../../profiles/candidate/service/candidateProfileApi";
import SmartMatchModal from "../../smartSearch/components/SmartMatchModal";
import CoachOrbitHero from "../components/CoachOrbitHero";
import FeatureCards from "../components/FeatureCards";
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
                const endpoint = candidateProfileEndPoints.VIEW_OWN_CANDIDATE_PROFILE.replace("{id}", userData.id);
                const res = await callApi({ method: METHOD.GET, endpoint, useGlobalLoading: false });
                if (cancelled) return;
                const profile = res?.data ?? res ?? {};
                const rawSkills = profile.skills ?? profile.Skills ?? [];
                const names = (Array.isArray(rawSkills) ? rawSkills : [])
                    .map((s) => (typeof s === "string" ? s : s?.name ?? s?.Name))
                    .filter(Boolean)
                    .slice(0, 12);
                setSkills(names);
            } catch {
                if (!cancelled) setSkills([]);
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
                <CoachOrbitHero coaches={topCoaches} onFindMatch={openSmartMatch} />
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
                            <Calendar size={18} />
                            Schedule
                        </h3>
                        {sessionsLoading ? (
                            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                                <CircularProgress size={28} />
                            </Box>
                        ) : scheduleSessions.length === 0 ? (
                            <Typography variant="body2" color="text.secondary">
                                No upcoming sessions.{" "}
                                <Link className="candidate-home__text-link" to="/coaches">
                                    Find a coach
                                </Link>{" "}
                                or open{" "}
                                <button type="button" className="candidate-home__text-link" onClick={openSmartMatch}>
                                    Smart match
                                </button>
                                .
                            </Typography>
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
                        <h3>Get ready</h3>
                        <ul className="candidate-home__checklist">
                            <li>
                                <span>1.</span>
                                <Link to="/candidate/profile">Complete your candidate profile</Link>
                            </li>
                            <li>
                                <span>2.</span>
                                <Link to="/assessment">Finish skills assessment</Link>
                            </li>
                            <li>
                                <span>3.</span>
                                <Link to="/roadmap">Review your roadmap</Link>
                            </li>
                            <li>
                                <span>4.</span>
                                <Link to="/booking-requests">Track booking requests</Link>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="candidate-home__grid">
                <div className="candidate-home__col-7">
                    <div className="candidate-home__card">
                        <h3>
                            <BookOpen size={18} />
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
                            <Map size={18} />
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
