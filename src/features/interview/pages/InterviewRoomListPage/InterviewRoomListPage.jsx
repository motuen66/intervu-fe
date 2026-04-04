import { Box, Typography, Stack, Tabs, Tab, Container } from "@mui/material";
import CommonLoader from "../../../../common/components/loaders/CommonLoader";
import { interviewEndPoints } from "../../services/interviewRoomApi";
import useUser from "../../../../common/hooks/useUser.jsx";
import { callApi } from "../../../../common/utils/apiConnector.js";
import { METHOD } from "../../../../common/constants/api.js";
import toast from "react-hot-toast";
import { useEffect, useState, useCallback, useMemo } from "react";
import { INTERVIEW_ROOM_STATUS } from "../../../../common/constants/status.js";
import { ROLES } from "../../../../common/constants/common.js";
import FeedbackListModal from "./FeedbackListModal.jsx";
import RescheduleRequestModal from "./RescheduleRequestModal.jsx";
import JDMultiRoundRescheduleModal from "./JDMultiRoundRescheduleModal.jsx";
import ConfirmModal from "../../../../common/components/ConfirmModal.jsx";
import GeneratedQuestionsModal from "./GeneratedQuestionsModal.jsx";
import { useNavigate, useLocation } from "react-router-dom";
import ViewFeedbackModal from "./ViewFeedbackModal.jsx";
import CoachEvaluationModal from "./CoachEvaluationModal.jsx";

// Import sub-components
import InterviewStats from "./components/InterviewStats.jsx";
import UpcomingTab from "./components/UpcomingTab.jsx";
import PastHistoryTab from "./components/PastHistoryTab.jsx";

// Tab Panel Component
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

const UPCOMING_PAGE_SIZE = 6;
const PAST_PAGE_SIZE = 5;

function InterviewRoomListPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const user = useUser();
    
    // --- Data States ---
    const [upcomingRooms, setUpcomingRooms] = useState([]);
    const [pastRooms, setPastRooms] = useState([]);
    const [rescheduleRequests, setRescheduleRequests] = useState([]);
    
    // --- Pagination States ---
    const [upcomingPagination, setUpcomingPagination] = useState({ page: 1, totalItems: 0 });
    const [pastPagination, setPastPagination] = useState({ page: 1, totalItems: 0 });
    
    // --- Loading States ---
    const [loading, setLoading] = useState(false);
    const [rescheduleLoading, setRescheduleLoading] = useState(false);
    
    // --- Modal & UI States ---
    const [feedbackModalState, setFeedbackModalState] = useState({ open: false, mode: "pending" });
    const [rescheduleModalState, setRescheduleModalState] = useState({ open: false, room: null });
    const [cancelConfirmState, setCancelConfirmState] = useState({
        open: false,
        room: null,
        previewRefundPercent: null,
    });
    const [activeTab, setActiveTab] = useState(0);
    const [coachEvaluationState, setCoachEvaluationState] = useState({ open: false, room: null });
    const [viewFeedbackState, setViewFeedbackState] = useState({ open: false, interviewRoomId: null });
    const [stats, setStats] = useState({ upcoming: 0, completed: 0, avgScore: null, nextSessionIn: "—" });
    const [genQuestionsModalState, setGenQuestionsModalState] = useState({ open: false, roomId: null });

    /**
     * Effect: Handle deep linking from notifications
     * Listens to URL parameters to open specific modals (Review Questions, View Feedback)
     */
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

    /**
     * Callback: groupRoomsByBooking
     * Organizes individual interview rounds into grouped booking requests for display
     */
    const groupRoomsByBooking = useCallback((roomsList) => {
        if (!roomsList || roomsList.length === 0) return [];
        const grouped = {};
        const standalone = [];

        roomsList.forEach(room => {
            if (room.bookingRequestId) {
                if (!grouped[room.bookingRequestId]) {
                    grouped[room.bookingRequestId] = [];
                }
                grouped[room.bookingRequestId].push(room);
            } else {
                standalone.push(room);
            }
        });

        const combinedRooms = Object.values(grouped).map(group => {
            if (group.length === 1) return group[0];

            group.sort((a, b) => new Date(a.scheduledTime) - new Date(b.scheduledTime));

            let activeRoundIndex = group.findIndex(r => r.status === INTERVIEW_ROOM_STATUS.ON_GOING);
            if (activeRoundIndex === -1) {
                activeRoundIndex = group.findIndex(r => r.status === INTERVIEW_ROOM_STATUS.SCHEDULED);
            }
            if (activeRoundIndex === -1) {
                activeRoundIndex = group.length - 1;
            }

            const activeRoom = group[activeRoundIndex];

            return {
                ...activeRoom,
                id: activeRoom.id,
                rounds: group,
                currentRound: activeRoundIndex + 1,
            };
        });

        const all = [...standalone, ...combinedRooms];
        all.sort((a, b) => new Date(b.scheduledTime) - new Date(a.scheduledTime));
        return all;
    }, []);

    /**
     * Callback: calculateAndSetStats
     * Pure function to derive stats from provided data without additional API calls
     */
    const calculateAndSetStats = useCallback((allUpcomingRooms, allPastRooms, upTotal, pastTotal) => {
        // Find evaluated rooms in the currently loaded past sessions
        const evaluatedRooms = allPastRooms.filter(r => typeof r.score === 'number' && r.score > 0);

        let avgScore = null;
        if (evaluatedRooms.length > 0) {
            const totalScore = evaluatedRooms.reduce((acc, room) => acc + room.score, 0);
            avgScore = (totalScore / evaluatedRooms.length).toFixed(1);
        }

        // Calculate next session from currently loaded upcoming sessions
        const now = new Date();
        let nextSession = "—";
        const upcomingFutureRooms = allUpcomingRooms
            .map(r => ({ ...r, dateObj: new Date(r.scheduledTime) }))
            .filter(r => !isNaN(r.dateObj.getTime()) && r.dateObj >= now)
            .sort((a, b) => a.dateObj - b.dateObj);

        if (upcomingFutureRooms.length > 0) {
            const diffMs = upcomingFutureRooms[0].dateObj - now;
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

            if (diffDays > 0) {
                nextSession = `${diffDays}d ${diffHours}h`;
            } else if (diffHours > 0) {
                nextSession = `${diffHours}h`;
            } else {
                const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                nextSession = `${diffMins}m`;
            }
        }

        setStats({
            upcoming: upTotal,
            completed: pastTotal, // This counts all past (completed + cancelled). 
            avgScore: avgScore && !isNaN(avgScore) ? parseFloat(avgScore) : null,
            nextSessionIn: nextSession,
        });
    }, []);

    /**
     * Callback: fetchRooms
     * Core fetching logic for paginated interview rooms based on tab and status
     */
    const fetchRooms = useCallback(async (tabIndex, page = 1) => {
        setLoading(true);
        try {
            const pageSize = tabIndex === 0 ? UPCOMING_PAGE_SIZE : PAST_PAGE_SIZE;
            const statuses = tabIndex === 0 
                ? [INTERVIEW_ROOM_STATUS.SCHEDULED, INTERVIEW_ROOM_STATUS.ON_GOING] 
                : [INTERVIEW_ROOM_STATUS.COMPLETED, INTERVIEW_ROOM_STATUS.CANCELLED];

            const statusParams = statuses.map(s => `Statuses=${s}`).join('&');
            const res = await callApi({
                method: METHOD.GET,
                endpoint: `${interviewEndPoints.INTERVIEW_ROOMS}?Page=${page}&PageSize=${pageSize}&${statusParams}`,
            });

            const { items, totalItems } = res?.data || { items: [], totalItems: 0 };
            const grouped = groupRoomsByBooking(items);

            if (tabIndex === 0) {
                setUpcomingRooms(grouped);
                setUpcomingPagination({ page, totalItems });
            } else {
                setPastRooms(grouped);
                setPastPagination({ page, totalItems });
            }
        } catch (error) {
            console.error("Failed to fetch rooms:", error);
        }
        setLoading(false);
    }, [groupRoomsByBooking]);

    /**
     * Effect: Stats Recalculation
     * Recalculate stats whenever rooms or pagination totals are updated
     */
    useEffect(() => {
        calculateAndSetStats(
            upcomingRooms, 
            pastRooms, 
            upcomingPagination.totalItems, 
            pastPagination.totalItems
        );
    }, [upcomingRooms, pastRooms, upcomingPagination.totalItems, pastPagination.totalItems, calculateAndSetStats]);

    /**
     * Callback: fetchRescheduleRequests
     * Retrieves all pending reschedule requests for the current user
     */
    const fetchRescheduleRequests = async () => {
        setRescheduleLoading(true);
        try {
            const res = await callApi({
                method: METHOD.GET,
                endpoint: interviewEndPoints.GET_ALL_RESCHEDULE_REQUESTS,
            });
            setRescheduleRequests(res?.data || []);
        } catch (error) {
            console.error("Failed to fetch reschedule requests:", error);
        }
        setRescheduleLoading(false);
    };

    /**
     * Callback: checkPendingFeedbacks
     * Checks for any incomplete feedback forms (Candidate side)
     */
    const checkPendingFeedbacks = async () => {
        try {
            const res = await callApi({
                method: METHOD.GET,
                endpoint: interviewEndPoints.GET_FEEDBACKS,
            });
            if (res?.data) {
                const pending = res.data.items?.filter((fb) => !fb.comments || fb.comments.trim() === "") || [];
                if (pending.length > 0) {
                    setFeedbackModalState({ open: true, mode: "pending" });
                }
            }
        } catch (error) {
            console.error("Failed to check pending feedbacks:", error);
        }
    };

    /**
     * Callback: checkPendingCoachEvaluations
     * Optimized: Just look at the first page of pastRooms already in memory
     */
    const checkPendingCoachEvaluations = useCallback(() => {
        const pendingRoom = pastRooms.find(
            (room) => room.status === INTERVIEW_ROOM_STATUS.COMPLETED && room.isEvaluationCompleted === false,
        );
        if (pendingRoom) {
            setCoachEvaluationState({ open: true, room: pendingRoom });
        }
    }, [pastRooms]);

    /**
     * Effect: Initial Data Load
     * Parallelizes all required data fetching on mount
     */
    useEffect(() => {
        if (!user) return;
        
        Promise.allSettled([
            fetchRooms(0, 1), // Fetch first page of upcoming
            fetchRooms(1, 1), // Fetch first page of past
            fetchRescheduleRequests(),
            user.role === ROLES.CANDIDATE ? checkPendingFeedbacks() : Promise.resolve()
        ]);
    }, [user, fetchRooms]);

    /**
     * Effect: Watch pastRooms for pending evaluations
     * Triggers checkPendingCoachEvaluations when pastRooms data is available/updated
     */
    useEffect(() => {
        if (user?.role === ROLES.INTERVIEWER && pastRooms.length > 0) {
            checkPendingCoachEvaluations();
        }
    }, [user, pastRooms, checkPendingCoachEvaluations]);

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
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
                await callApi({
                    method: METHOD.POST,
                    endpoint: interviewEndPoints.RESCHEDULE_JD_BOOKING(data.bookingRequestId),
                    arg: { rounds: data.rounds },
                    displaySuccessMessage: true,
                });
            } else {
                await callApi({
                    method: METHOD.POST,
                    endpoint: interviewEndPoints.CREATE_RESCHEDULE_REQUEST,
                    arg: {
                        roomId: data.roomId,
                        proposedAvailabilityId: data.proposedAvailabilityId,
                        reason: data.reason,
                    },
                });
            }
            fetchRooms(activeTab, activeTab === 0 ? upcomingPagination.page : pastPagination.page);
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
        setCancelConfirmState({ open: true, room, previewRefundPercent });
    };

    const handleCloseCancelConfirm = () => {
        setCancelConfirmState({ open: false, room: null, previewRefundPercent: null });
    };

    const handleConfirmCancelInterview = async () => {
        const room = cancelConfirmState.room;
        if (!room?.id) {
            handleCloseCancelConfirm();
            return;
        }
        try {
            const endpoint = (room.rounds?.length > 1)
                ? interviewEndPoints.CANCEL_BOOKING_REQUEST(room.bookingRequestId)
                : interviewEndPoints.CANCEL_INTERVIEW(room.id);

            const response = await callApi({
                method: METHOD.POST,
                endpoint: endpoint,
                displaySuccessMessage: false,
                alertErrorMessage: true,
            });

            if (response?.success) {
                toast.success(response.message || "Interview cancelled successfully");
                fetchRooms(0, upcomingPagination.page);
                fetchRooms(1, pastPagination.page);
                fetchRescheduleRequests();
            }
        } catch (error) {
            console.error("Failed to cancel interview:", error);
        } finally {
            handleCloseCancelConfirm();
        }
    };

    const handleCloseCoachEvaluation = () => setCoachEvaluationState({ open: false, room: null });

    const handleCoachEvaluationSubmitted = async () => {
        setCoachEvaluationState({ open: false, room: null });
        fetchRooms(1, pastPagination.page);
        // checkPendingCoachEvaluations will be triggered by pastRooms effect
    };

    const handleViewFeedback = (room) => {
        if (!room?.id) return;
        setViewFeedbackState({ open: true, interviewRoomId: room.id });
    };

    const handleCloseViewFeedback = () => {
        setViewFeedbackState({ open: false, interviewRoomId: null });
    };

    const handleReviewQuestions = (room) => {
        setGenQuestionsModalState({ open: true, roomId: room.id });
    };

    const handleCloseGenQuestionsModal = () => {
        setGenQuestionsModalState({ open: false, roomId: null });
    };

    const handleUpcomingPageChange = (event, page) => {
        fetchRooms(0, page);
    };

    const handlePastPageChange = (event, page) => {
        fetchRooms(1, page);
    };

    // --- Memoized Tab Contents ---
    const upcomingTabContent = useMemo(() => (
        <UpcomingTab
            rooms={upcomingRooms}
            recentRooms={pastRooms}
            user={user}
            loading={loading}
            onRequestReschedule={handleRequestReschedule}
            onCancelInterview={handleCancelInterview}
            onViewFeedback={handleViewFeedback}
            onReviewQuestions={handleReviewQuestions}
            rescheduleRequests={rescheduleRequests}
            page={upcomingPagination.page}
            totalItems={upcomingPagination.totalItems}
            pageSize={UPCOMING_PAGE_SIZE}
            onPageChange={handleUpcomingPageChange}
        />
    ), [upcomingRooms, pastRooms, user, loading, rescheduleRequests, upcomingPagination.page, upcomingPagination.totalItems, handleRequestReschedule, handleCancelInterview, handleViewFeedback, handleReviewQuestions, handleUpcomingPageChange]);

    const pastTabContent = useMemo(() => (
        <PastHistoryTab
            rooms={pastRooms}
            user={user}
            loading={loading}
            onViewFeedback={handleViewFeedback}
            onReviewQuestions={handleReviewQuestions}
            page={pastPagination.page}
            totalItems={pastPagination.totalItems}
            pageSize={PAST_PAGE_SIZE}
            onPageChange={handlePastPageChange}
        />
    ), [pastRooms, user, loading, pastPagination.page, pastPagination.totalItems, handleViewFeedback, handleReviewQuestions, handlePastPageChange]);

    if (loading && upcomingRooms.length === 0 && pastRooms.length === 0) {
        return (
            <Box sx={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CommonLoader />
            </Box>
        );
    }

    const isMultiRoundReschedule = Boolean(
        rescheduleModalState.room?.rounds && rescheduleModalState.room.rounds.length > 1,
    );

    return (
        <Box sx={{ minHeight: "100vh", py: 4 }}>
            <Container maxWidth="lg">
                {/* Header Section */}
                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    justifyContent="space-between"
                    alignItems={{ xs: "flex-start", sm: "center" }}
                    spacing={2}
                    sx={{ mb: 4 }}
                >
                    <Box>
                        <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5, color: "text.primary" }}>
                            My Interviews
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Track your upcoming practice sessions and review past performance feedback.
                        </Typography>
                    </Box>
                </Stack>

                {/* Statistics Overview */}
                <InterviewStats
                    totalCount={stats.completed}
                    upcomingCount={stats.upcoming}
                    completedCount={stats.completed}
                    avgScore={stats.avgScore}
                    nextSessionIn={stats.nextSessionIn}
                />

                {/* Tabs Navigation */}
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

                {/* Tab Content Panels */}
                <TabPanel value={activeTab} index={0}>
                    {upcomingTabContent}
                </TabPanel>

                <TabPanel value={activeTab} index={1}>
                    {pastTabContent}
                </TabPanel>

                {/* Modal Overlays */}
                <FeedbackListModal
                    open={feedbackModalState.open}
                    onClose={() => setFeedbackModalState({ open: false, mode: "pending" })}
                    mode={feedbackModalState.mode}
                    onFeedbackSubmitted={checkPendingFeedbacks}
                />

                <CoachEvaluationModal
                    open={coachEvaluationState.open}
                    room={coachEvaluationState.room}
                    onClose={handleCloseCoachEvaluation}
                    onSubmitted={handleCoachEvaluationSubmitted}
                />

                <ViewFeedbackModal
                    open={viewFeedbackState.open}
                    onClose={handleCloseViewFeedback}
                    interviewRoomId={viewFeedbackState.interviewRoomId}
                    user={user}
                />

                {isMultiRoundReschedule ? (
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
                )}

                <ConfirmModal
                    show={cancelConfirmState.open}
                    title="Cancel Interview"
                    message={`Are you sure you want to cancel this interview?\n\nRefund policy:\n- Cancel >= 24 hours before start time: 100% refund\n- Cancel >= 12 hours before start time: 50% refund\n- Cancel < 12 hours before start time: no refund\n\nPreview (if you cancel now): ${cancelConfirmState.previewRefundPercent === null
                            ? "Unable to calculate refund preview."
                            : `${cancelConfirmState.previewRefundPercent}% of the paid amount`
                        }`}
                    onConfirm={handleConfirmCancelInterview}
                    onCancel={handleCloseCancelConfirm}
                    confirmText="Cancel Interview"
                    cancelText="Keep Interview"
                />
            </Container>
            <GeneratedQuestionsModal
                open={genQuestionsModalState.open}
                onClose={handleCloseGenQuestionsModal}
                roomId={genQuestionsModalState.roomId}
            />
        </Box>
    );
}

export default InterviewRoomListPage;
