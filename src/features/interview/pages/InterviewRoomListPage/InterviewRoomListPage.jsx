import { Box, Stack, Tabs, Tab, CircularProgress } from "@mui/material";
import PageHeader from "../../../../common/components/PageHeader";
import { interviewEndPoints, getSessions } from "../../services/interviewRoomApi";
import useUser from "../../../../common/hooks/useUser.jsx";
import { callApi } from "../../../../common/utils/apiConnector.js";
import { METHOD } from "../../../../common/constants/api.js";
import toast from "react-hot-toast";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import axios from "axios";
import { INTERVIEW_ROOM_STATUS } from "../../../../common/constants/status.js";
import { ROLES } from "../../../../common/constants/common.js";
import { INTERVIEW_ROOM_TYPE } from "../../../../common/constants/types.js";
import { useNavigate, useLocation } from "react-router-dom";
import { userEndPoints } from "../../../../common/services/userApi.js";

import InterviewStats from "./components/InterviewStats.jsx";
import UpcomingTab from "./components/UpcomingTab.jsx";

// Lazy-loaded below-the-fold / modal chunks — keeps initial render light.
const PastHistoryTab = lazy(() => import("./components/PastHistoryTab.jsx"));
const FeedbackListModal = lazy(() => import("./FeedbackListModal.jsx"));
const RescheduleRequestModal = lazy(() => import("./RescheduleRequestModal.jsx"));
const JDMultiRoundRescheduleModal = lazy(() => import("./JDMultiRoundRescheduleModal.jsx"));
const GeneratedQuestionsModal = lazy(() => import("./GeneratedQuestionsModal.jsx"));
const ViewFeedbackModal = lazy(() => import("./ViewFeedbackModal.jsx"));
const CoachEvaluationModal = lazy(() => import("./CoachEvaluationModal.jsx"));
const PrecheckModal = lazy(() => import("./PrecheckModal.jsx"));
const CancelInterviewConfirmDialog = lazy(
    () => import("./components/CancelInterviewConfirmDialog.jsx"),
);

function TabPanel({ children, value, index, ...other }) {
    return (
        <Box
            role="tabpanel"
            hidden={value !== index}
            id={`interview-tabpanel-${index}`}
            aria-labelledby={`interview-tab-${index}`}
            {...other}
        >
            {value === index && <Box>{children}</Box>}
        </Box>
    );
}

function a11yProps(index) {
    return {
        id: `interview-tab-${index}`,
        "aria-controls": `interview-tabpanel-${index}`,
    };
}

const UPCOMING_STATUSES = [INTERVIEW_ROOM_STATUS.SCHEDULED, INTERVIEW_ROOM_STATUS.ON_GOING];
const PAST_STATUSES = [INTERVIEW_ROOM_STATUS.COMPLETED, INTERVIEW_ROOM_STATUS.CANCELLED];
const HIGHLIGHT_ELIGIBLE_STATUSES = [INTERVIEW_ROOM_STATUS.SCHEDULED, INTERVIEW_ROOM_STATUS.ON_GOING];

const formatNextSessionIn = (ms) => {
    if (ms == null || ms < 0) return "—";
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h`;
    const mins = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${mins}m`;
};

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

const getSessionKey = (session) => session?.sessionId || session?.bookingRequestId || session?.id || null;

const getNearestEligibleRoundForSession = (session, nowMs) => {
    if (!session) return null;

    const rounds = Array.isArray(session.rounds) && session.rounds.length > 0 ? session.rounds : [session];
    const eligible = rounds
        .map((round, index) => ({ round, index }))
        .filter(({ round }) => round?.scheduledTime && HIGHLIGHT_ELIGIBLE_STATUSES.includes(round?.status))
        .map(({ round, index }) => {
            const timeMs = new Date(round.scheduledTime).getTime();
            return Number.isNaN(timeMs)
                ? null
                : {
                      round,
                      index,
                      timeMs,
                      distanceMs: Math.abs(timeMs - nowMs),
                  };
        })
        .filter(Boolean)
        .sort((a, b) => a.distanceMs - b.distanceMs);

    return eligible[0] || null;
};

const getNearestSessionFocus = (items = []) => {
    const nowMs = Date.now();

    const candidates = items
        .map((session) => {
            const nearestRound = getNearestEligibleRoundForSession(session, nowMs);
            const sessionKey = getSessionKey(session);
            if (!nearestRound || !sessionKey) return null;

            return {
                sessionKey,
                roundId: nearestRound.round?.id || null,
                roundIndex: nearestRound.index,
                distanceMs: nearestRound.distanceMs,
            };
        })
        .filter(Boolean)
        .sort((a, b) => a.distanceMs - b.distanceMs);

    return candidates[0] || { sessionKey: null, roundId: null, roundIndex: null };
};

const INITIAL_UPCOMING = {
    items: [],
    page: 1,
    pageSize: 6,
    totalItems: 0,
    totalPages: 0,
    loading: false,
    dirty: true,
};

const INITIAL_PAST = {
    items: [],
    page: 1,
    pageSize: 5,
    totalItems: 0,
    totalPages: 0,
    loading: false,
    dirty: true,
};

function InterviewRoomListPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const user = useUser();
    const [upcomingState, setUpcomingState] = useState(INITIAL_UPCOMING);
    const [pastState, setPastState] = useState(INITIAL_PAST);
    const [rescheduleRequests, setRescheduleRequests] = useState([]);
    const [rescheduleLoading, setRescheduleLoading] = useState(false);
    const [hasPendingFeedbacks, setHasPendingFeedbacks] = useState(false);
    const [feedbackModalState, setFeedbackModalState] = useState({ open: false, mode: "pending" });
    const [rescheduleModalState, setRescheduleModalState] = useState({ open: false, room: null });
    const [cancelConfirmState, setCancelConfirmState] = useState({
        open: false,
        room: null,
        previewRefundPercent: null,
        previewRefundAmount: null,
    });
    const [cancelBankInfoState, setCancelBankInfoState] = useState({
        loading: false,
        bankBinNumber: "",
        maskedAccountNumber: "",
        bankCode: "",
        bankShortName: "",
        bankLogo: "",
        error: "",
    });
    const [activeTab, setActiveTab] = useState(0);
    const [coachEvaluationState, setCoachEvaluationState] = useState({ open: false, room: null });
    const [viewFeedbackState, setViewFeedbackState] = useState({ open: false, interviewRoomId: null });
    const [stats, setStats] = useState({ upcoming: 0, completed: 0, avgScore: null, nextSessionIn: "—" });
    const [nearestFocus, setNearestFocus] = useState({ sessionKey: null, roundId: null, roundIndex: null });

    const upcomingSeqRef = useRef(0);
    const pastSeqRef = useRef(0);
    const pendingCoachShownRef = useRef(new Set());

    const [genQuestionsModalState, setGenQuestionsModalState] = useState({ open: false, roomId: null });
    const [precheckState, setPrecheckState] = useState({ open: false, room: null });

    const callApiLocal = (options) => callApi({ ...options, useGlobalLoading: false });

    const getRoomTypeLabel = (typeValue) => {
        const roomType = INTERVIEW_ROOM_TYPE.find((t) => t.value === typeValue);
        return roomType ? roomType.label : "Normal";
    };

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const roomId = params.get("roomId");
        const action = params.get("action");

        if (roomId) {
            if (action === "review-questions") {
                setGenQuestionsModalState({ open: true, roomId });
            } else if (action === "view-feedback") {
                setViewFeedbackState({ open: true, interviewRoomId: roomId });
            }
            navigate(location.pathname, { replace: true });
        }
    }, [location, navigate]);

    useEffect(() => {
        if (!user?.id) return;
        fetchRescheduleRequests();
        if (user.role === ROLES.CANDIDATE) {
            checkPendingFeedbacks();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id, user?.role]);

    useEffect(() => {
        if (!user?.id) return;

        const isUpcoming = activeTab === 0;
        const tabState = isUpcoming ? upcomingState : pastState;
        if (!tabState.dirty) return;

        const setter = isUpcoming ? setUpcomingState : setPastState;
        const seqRef = isUpcoming ? upcomingSeqRef : pastSeqRef;
        const statuses = isUpcoming ? UPCOMING_STATUSES : PAST_STATUSES;
        const mySeq = ++seqRef.current;

        setter((prev) => ({ ...prev, loading: true }));

        getSessions({
            page: tabState.page,
            pageSize: tabState.pageSize,
            statuses,
        })
            .then((response) => {
                if (mySeq !== seqRef.current) return;
                const pageData = response?.page || {};
                const sortedItems = sortByStartTimeNearestNow(pageData.items || []);
                const focus = getNearestSessionFocus(sortedItems);
                setter((prev) => ({
                    ...prev,
                    items: sortedItems,
                    totalItems: pageData.totalItems || 0,
                    totalPages: pageData.totalPages || 0,
                    loading: false,
                    dirty: false,
                }));

                if (isUpcoming) {
                    setNearestFocus(focus);
                }

                if (response?.stats) {
                    setStats({
                        upcoming: response.stats.upcoming || 0,
                        completed: response.stats.completed || 0,
                        avgScore: typeof response.stats.avgScore === "number" ? response.stats.avgScore : null,
                        nextSessionIn: formatNextSessionIn(response.stats.nextSessionInMs),
                    });
                }

                if (user?.role === ROLES.INTERVIEWER && response?.pendingCoachEvaluationSession) {
                    const pending = response.pendingCoachEvaluationSession;
                    if (!pendingCoachShownRef.current.has(pending.id)) {
                        pendingCoachShownRef.current.add(pending.id);
                        setCoachEvaluationState({ open: true, room: pending });
                    }
                }
            })
            .catch((error) => {
                if (mySeq !== seqRef.current) return;
                console.error("Failed to fetch sessions:", error);
                setter((prev) => ({ ...prev, loading: false }));
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id, user?.role, activeTab, upcomingState.dirty, upcomingState.page, pastState.dirty, pastState.page]);

    const markTabDirty = (tabKey) => {
        if (tabKey === 0) {
            setUpcomingState((prev) => ({ ...prev, dirty: true }));
        } else {
            setPastState((prev) => ({ ...prev, dirty: true }));
        }
    };

    const markBothTabsDirty = () => {
        setUpcomingState((prev) => ({ ...prev, dirty: true }));
        setPastState((prev) => ({ ...prev, dirty: true }));
    };

    const fetchRescheduleRequests = async () => {
        setRescheduleLoading(true);
        try {
            const res = await callApiLocal({
                method: METHOD.GET,
                endpoint: interviewEndPoints.GET_ALL_RESCHEDULE_REQUESTS,
            });
            setRescheduleRequests(res?.data || []);
        } catch (error) {
            console.error("Failed to fetch reschedule requests:", error);
        }
        setRescheduleLoading(false);
    };

    const checkPendingFeedbacks = async () => {
        try {
            const res = await callApiLocal({
                method: METHOD.GET,
                endpoint: interviewEndPoints.GET_FEEDBACKS,
            });
            if (res?.data) {
                const pending = res.data.items?.filter((fb) => !fb.comments || fb.comments.trim() === "") || [];
                if (pending.length > 0) {
                    setHasPendingFeedbacks(true);
                    setFeedbackModalState({ open: true, mode: "pending" });
                } else {
                    setHasPendingFeedbacks(false);
                }
            }
        } catch (error) {
            console.error("Failed to check pending feedbacks:", error);
        }
    };

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const handleUpcomingPageChange = (_event, value) => {
        setUpcomingState((prev) => ({ ...prev, page: value, dirty: true }));
    };

    const handlePastPageChange = (_event, value) => {
        setPastState((prev) => ({ ...prev, page: value, dirty: true }));
    };

    const handleRequestReschedule = (room) => {
        setRescheduleModalState({ open: true, room });
    };

    const handleCloseRescheduleModal = () => {
        setRescheduleModalState({ open: false, room: null });
    };

    const handleSubmitReschedule = async (data) => {
        try {
            if (data?.type === "multi-round") {
                await callApiLocal({
                    method: METHOD.POST,
                    endpoint: interviewEndPoints.RESCHEDULE_JD_BOOKING(data.bookingRequestId),
                    arg: {
                        rounds: data.rounds,
                    },
                    displaySuccessMessage: true,
                });

                markBothTabsDirty();
                await fetchRescheduleRequests();
                handleCloseRescheduleModal();
                return;
            }

            await callApiLocal({
                method: METHOD.POST,
                endpoint: interviewEndPoints.CREATE_RESCHEDULE_REQUEST,
                arg: {
                    roomId: data.roomId,
                    newStartTime: data.newStartTime,
                    reason: data.reason,
                },
            });
            fetchRescheduleRequests();
            handleCloseRescheduleModal();
        } catch (error) {
            console.error("Failed to submit reschedule request:", error);
            throw error;
        }
    };

    const handleCancelInterview = (room) => {
        if (!room?.id) return;

        const startTime = room?.scheduledTime ? new Date(room.scheduledTime) : null;
        const now = new Date();

        let previewRefundPercent = null;
        if (startTime && !isNaN(startTime.getTime())) {
            const hoursBeforeInterview = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);
            if (hoursBeforeInterview >= 24) previewRefundPercent = 100;
            else if (hoursBeforeInterview >= 12) previewRefundPercent = 50;
            else previewRefundPercent = 0;
        }

        const parseAmount = (value) => {
            if (typeof value === "number") return value;
            const raw = String(value ?? "")
                .replace(/,/g, "")
                .trim();
            const parsed = Number(raw);
            return Number.isNaN(parsed) ? null : parsed;
        };

        const baseAmount =
            parseAmount(room?.totalAmount) ??
            parseAmount(room?.amount) ??
            parseAmount(room?.paidAmount) ??
            parseAmount(room?.paymentAmount) ??
            parseAmount(room?.price) ??
            null;

        const previewRefundAmount =
            typeof baseAmount === "number" && typeof previewRefundPercent === "number"
                ? Math.max(0, Math.round((baseAmount * previewRefundPercent) / 100))
                : null;

        setCancelConfirmState({
            open: true,
            room,
            previewRefundPercent,
            previewRefundAmount,
        });

        loadCancelRefundBankInfo();
    };

    const handleCloseCancelConfirm = () => {
        setCancelConfirmState({ open: false, room: null, previewRefundPercent: null, previewRefundAmount: null });
        setCancelBankInfoState({
            loading: false,
            bankBinNumber: "",
            maskedAccountNumber: "",
            bankCode: "",
            bankShortName: "",
            bankLogo: "",
            error: "",
        });
    };

    const loadCancelRefundBankInfo = async () => {
        setCancelBankInfoState((prev) => ({
            ...prev,
            loading: true,
            error: "",
        }));

        try {
            const profileResponse = await callApiLocal({
                method: METHOD.GET,
                endpoint: userEndPoints.GET_ME,
            });

            const profile = profileResponse?.data || {};
            const bankProfile = profile?.candidateProfile || profile?.coachProfile || null;
            const bankBinNumber = String(bankProfile?.bankBinNumber || "").trim();
            const maskedAccountNumber = String(bankProfile?.bankAccountNumber || "").trim();

            if (!bankBinNumber || !maskedAccountNumber) {
                setCancelBankInfoState({
                    loading: false,
                    bankBinNumber,
                    maskedAccountNumber,
                    bankCode: "",
                    bankShortName: "",
                    bankLogo: "",
                    error: "You have not configured bank information yet.",
                });
                return;
            }

            const banksResponse = await axios.get("https://api.vietqr.io/v2/banks");
            const banks = Array.isArray(banksResponse?.data?.data) ? banksResponse.data.data : [];
            const matchedBank = banks.find((bank) => String(bank?.bin) === bankBinNumber);

            if (!matchedBank) {
                setCancelBankInfoState({
                    loading: false,
                    bankBinNumber,
                    maskedAccountNumber,
                    bankCode: "",
                    bankShortName: "",
                    bankLogo: "",
                    error: "Cannot resolve bank metadata for your BIN.",
                });
                return;
            }

            setCancelBankInfoState({
                loading: false,
                bankBinNumber,
                maskedAccountNumber,
                bankCode: matchedBank?.code || "",
                bankShortName: matchedBank?.shortName || matchedBank?.short_name || matchedBank?.name || "",
                bankLogo: matchedBank?.logo || "",
                error: "",
            });
        } catch {
            setCancelBankInfoState({
                loading: false,
                bankBinNumber: "",
                maskedAccountNumber: "",
                bankCode: "",
                bankShortName: "",
                bankLogo: "",
                error: "Failed to load your bank information.",
            });
        }
    };

    const handleConfirmCancelInterview = async () => {
        const room = cancelConfirmState.room;
        if (!room?.id) {
            handleCloseCancelConfirm();
            return;
        }

        try {
            const endpoint =
                room.rounds?.length > 1
                    ? interviewEndPoints.CANCEL_BOOKING_REQUEST(room.bookingRequestId)
                    : interviewEndPoints.CANCEL_INTERVIEW(room.id);

            const response = await callApiLocal({
                method: METHOD.POST,
                endpoint: endpoint,
                displaySuccessMessage: false,
                alertErrorMessage: true,
            });

            if (response?.success) {
                toast.success(response.message || "Interview cancelled successfully");
                markBothTabsDirty();
                await fetchRescheduleRequests();
            }
        } catch (error) {
            console.error("Failed to cancel interview:", error);
        } finally {
            handleCloseCancelConfirm();
        }
    };

    const handleApproveReschedule = async (request) => {
        try {
            await callApiLocal({
                method: METHOD.POST,
                endpoint: interviewEndPoints.RESPOND_RESCHEDULE_REQUEST(request.id),
                arg: { isApproved: true },
            });
            fetchRescheduleRequests();
            markBothTabsDirty();
        } catch (error) {
            console.error("Failed to approve reschedule:", error);
        }
    };

    const handleRejectReschedule = async (request, rejectionReason) => {
        try {
            await callApiLocal({
                method: METHOD.POST,
                endpoint: interviewEndPoints.RESPOND_RESCHEDULE_REQUEST(request.id),
                arg: {
                    isApproved: false,
                    rejectionReason: rejectionReason || "Request rejected",
                },
            });
            fetchRescheduleRequests();
        } catch (error) {
            console.error("Failed to reject reschedule:", error);
        }
    };

    const handleOpenFeedbackModal = (mode) => setFeedbackModalState({ open: true, mode });
    const handleCloseFeedbackModal = () => setFeedbackModalState({ open: false, mode: "pending" });

    const handleCloseCoachEvaluation = () => setCoachEvaluationState({ open: false, room: null });

    const handleCoachEvaluationSubmitted = async () => {
        setCoachEvaluationState({ open: false, room: null });
        markTabDirty(1);
    };

    const handleViewFeedback = (room) => {
        if (!room?.id) return;
        setViewFeedbackState({ open: true, interviewRoomId: room.id });
    };

    const handleCloseViewFeedback = () => {
        setViewFeedbackState({ open: false, interviewRoomId: null });
    };

    const handleJoinRoom = (room) => {
        if (!room?.id) return;
        setPrecheckState({ open: true, room });
    };

    const handleReviewQuestions = (room) => {
        setGenQuestionsModalState({ open: true, roomId: room.id });
    };

    const handleCloseGenQuestionsModal = () => {
        setGenQuestionsModalState({ open: false, roomId: null });
    };

    const showFullscreenSpinner =
        upcomingState.items.length === 0 &&
        pastState.items.length === 0 &&
        (upcomingState.loading || pastState.loading);

    if (showFullscreenSpinner) {
        return (
            <Box sx={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CircularProgress size={34} />
            </Box>
        );
    }

    const isMultiRoundReschedule = Boolean(
        rescheduleModalState.room?.rounds && rescheduleModalState.room.rounds.length > 1,
    );

    return (
        <>
                <PageHeader
                    title="My Interviews"
                    subtitle="Track your upcoming practice sessions and review past performance feedback."
                />

                <InterviewStats
                    totalCount={stats.completed}
                    upcomingCount={stats.upcoming}
                    completedCount={stats.completed}
                    avgScore={stats.avgScore}
                    nextSessionIn={stats.nextSessionIn}
                    userRole={user?.role}
                />

                <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
                    <Tabs
                        value={activeTab}
                        onChange={handleTabChange}
                        aria-label="interview tabs"
                        sx={{
                            "& .MuiTab-root": {
                                textTransform: "none",
                                fontWeight: 600,
                                fontSize: "0.9rem",
                                minHeight: 48,
                            },
                            "& .Mui-selected": {
                                color: "primary.main",
                            },
                        }}
                    >
                        <Tab label="Upcoming" {...a11yProps(0)} />
                        <Tab label="Past History" {...a11yProps(1)} />
                    </Tabs>
                </Box>

                <TabPanel value={activeTab} index={0}>
                    <UpcomingTab
                        rooms={upcomingState.items}
                        recentRooms={[]}
                        user={user}
                        loading={upcomingState.loading}
                        page={upcomingState.page}
                        totalPages={upcomingState.totalPages}
                        totalItems={upcomingState.totalItems}
                        pageSize={upcomingState.pageSize}
                        onPageChange={handleUpcomingPageChange}
                        onRequestReschedule={handleRequestReschedule}
                        onCancelInterview={handleCancelInterview}
                        onViewFeedback={handleViewFeedback}
                        onJoin={handleJoinRoom}
                        onReviewQuestions={handleReviewQuestions}
                        rescheduleRequests={rescheduleRequests}
                        highlightedSessionKey={nearestFocus.sessionKey}
                        highlightedRoundId={nearestFocus.roundId}
                        highlightedRoundIndex={nearestFocus.roundIndex}
                    />
                </TabPanel>

                <TabPanel value={activeTab} index={1}>
                    <Suspense
                        fallback={
                            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                                <CircularProgress size={30} />
                            </Box>
                        }
                    >
                        <PastHistoryTab
                            rooms={pastState.items}
                            user={user}
                            loading={pastState.loading}
                            page={pastState.page}
                            totalPages={pastState.totalPages}
                            totalItems={pastState.totalItems}
                            pageSize={pastState.pageSize}
                            onPageChange={handlePastPageChange}
                            onViewFeedback={handleViewFeedback}
                            onReviewQuestions={handleReviewQuestions}
                        />
                    </Suspense>
                </TabPanel>

                <Suspense fallback={null}>
                    {feedbackModalState.open && (
                        <FeedbackListModal
                            open={feedbackModalState.open}
                            onClose={handleCloseFeedbackModal}
                            mode={feedbackModalState.mode}
                            onFeedbackSubmitted={checkPendingFeedbacks}
                        />
                    )}

                    {coachEvaluationState.open && (
                        <CoachEvaluationModal
                            open={coachEvaluationState.open}
                            room={coachEvaluationState.room}
                            onClose={handleCloseCoachEvaluation}
                            onSubmitted={handleCoachEvaluationSubmitted}
                        />
                    )}

                    {viewFeedbackState.open && (
                        <ViewFeedbackModal
                            open={viewFeedbackState.open}
                            onClose={handleCloseViewFeedback}
                            interviewRoomId={viewFeedbackState.interviewRoomId}
                            user={user}
                        />
                    )}

                    {rescheduleModalState.open && (
                        isMultiRoundReschedule ? (
                            <JDMultiRoundRescheduleModal
                                open={rescheduleModalState.open}
                                onClose={handleCloseRescheduleModal}
                                onSubmit={handleSubmitReschedule}
                                currentSession={rescheduleModalState.room}
                            />
                        ) : (
                            <RescheduleRequestModal
                                open={rescheduleModalState.open}
                                onClose={handleCloseRescheduleModal}
                                onSubmit={handleSubmitReschedule}
                                currentSession={rescheduleModalState.room}
                            />
                        )
                    )}

                    {cancelConfirmState.open && (
                        <CancelInterviewConfirmDialog
                            open={cancelConfirmState.open}
                            onClose={handleCloseCancelConfirm}
                            onConfirm={handleConfirmCancelInterview}
                            previewRefundPercent={cancelConfirmState.previewRefundPercent}
                            previewRefundAmount={cancelConfirmState.previewRefundAmount}
                            bankInfo={cancelBankInfoState}
                        />
                    )}
                </Suspense>
            <Suspense fallback={null}>
                {genQuestionsModalState.open && (
                    <GeneratedQuestionsModal
                        open={genQuestionsModalState.open}
                        onClose={handleCloseGenQuestionsModal}
                        roomId={genQuestionsModalState.roomId}
                    />
                )}

                {precheckState.open && (
                    <PrecheckModal
                        open={precheckState.open}
                        onClose={() => setPrecheckState({ open: false, room: null })}
                        room={precheckState.room}
                    />
                )}
            </Suspense>
        </>
    );
}

export default InterviewRoomListPage;
