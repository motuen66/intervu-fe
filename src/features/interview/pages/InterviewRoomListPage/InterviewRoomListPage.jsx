import { Box, Typography, Stack, Tabs, Tab, Container } from "@mui/material";
import CommonLoader from "../../../../common/components/loaders/CommonLoader";
import { PrimaryButton, SecondaryButton } from "../../../../common/components/buttons";
import { Plus as AddIcon } from "lucide-react";
import { interviewEndPoints } from "../../services/interviewRoomApi";
import useUser from "../../../../common/hooks/useUser.jsx";
import { callApi } from "../../../../common/utils/apiConnector.js";
import { METHOD } from "../../../../common/constants/api.js";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import { INTERVIEW_ROOM_STATUS } from "../../../../common/constants/status.js";
import { ROLES } from "../../../../common/constants/common.js";
import { INTERVIEW_ROOM_TYPE } from "../../../../common/constants/types.js";
import FeedbackListModal from "./FeedbackListModal.jsx";
import RescheduleRequestModal from "./RescheduleRequestModal.jsx";
import ConfirmModal from "../../../../common/components/ConfirmModal.jsx";
// import AICVSelectionModal from "./components/AICVSelectionModal.jsx";
import GeneratedQuestionsModal from "./GeneratedQuestionsModal.jsx";
import { useNavigate, useLocation } from "react-router-dom";
import ViewFeedbackModal from "./ViewFeedbackModal.jsx";
import CoachEvaluationModal from "./CoachEvaluationModal.jsx";

// Import sub-components
import InterviewStats from "./components/InterviewStats.jsx";
import UpcomingTab from "./components/UpcomingTab.jsx";
import PastHistoryTab from "./components/PastHistoryTab.jsx";
import RescheduleRequestsTab from "./components/RescheduleRequestsTab.jsx";

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

function InterviewRoomListPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const user = useUser();
    const [upcomingRooms, setUpcomingRooms] = useState([]);
    const [pastRooms, setPastRooms] = useState([]);
    const [rescheduleRequests, setRescheduleRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [rescheduleLoading, setRescheduleLoading] = useState(false);
    const [hasPendingFeedbacks, setHasPendingFeedbacks] = useState(false);
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
    // const [aiCvModalState, setAiCvModalState] = useState({ open: false, room: null });

    // New state for Generated Questions Modal
    const [genQuestionsModalState, setGenQuestionsModalState] = useState({ open: false, roomId: null });

    // Helper function to get the label from the type value
    const getRoomTypeLabel = (typeValue) => {
        const roomType = INTERVIEW_ROOM_TYPE.find((t) => t.value === typeValue);
        return roomType ? roomType.label : "Normal"; // Default to "Normal" if type is not specified
    };

    // Handle deep linking from notifications
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const roomId = params.get("roomId");
        const action = params.get("action");

        if (roomId && action === "review-questions") {
            setGenQuestionsModalState({ open: true, roomId });
            // Clean up URL without reload
            navigate(location.pathname, { replace: true });
        }
    }, [location, navigate]);

    // Fetch initial data once on mount
    useEffect(() => {
        if (!user) return;

        // Fetch data for initial tab (Upcoming)
        fetchRooms([0, 1]);
        fetchRescheduleRequests();
        if (user.role === ROLES.CANDIDATE) {
            checkPendingFeedbacks();
        }
        if (user.role === ROLES.INTERVIEWER) {
            checkPendingCoachEvaluations();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run once on mount

    // Refetch data when switching tabs
    useEffect(() => {
        if (!user) return;

        if (activeTab === 0) {
            // Upcoming: Fetch SCHEDULED (0) and ON_GOING (1)
            fetchRooms([0, 1]);
        } else if (activeTab === 1) {
            // Past History: Fetch COMPLETED (2) and CANCELLED (3)
            fetchRooms([2, 3]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]); // Refetch when tab changes

    const groupRoomsByBooking = (roomsList) => {
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

            // Sort by roundNumber (or scheduledTime)
            group.sort((a, b) => new Date(a.scheduledTime) - new Date(b.scheduledTime));

            // Find current/next round
            let activeRoundIndex = group.findIndex(r => r.status === INTERVIEW_ROOM_STATUS.ON_GOING);
            if (activeRoundIndex === -1) {
                activeRoundIndex = group.findIndex(r => r.status === INTERVIEW_ROOM_STATUS.SCHEDULED);
            }
            if (activeRoundIndex === -1) {
                // All done or cancelled, pick the last one or last completed
                activeRoundIndex = group.length - 1;
            }

            const activeRoom = group[activeRoundIndex];

            return {
                ...activeRoom,
                id: activeRoom.id,
                rounds: group,
                currentRound: activeRoundIndex + 1,
                // Status of the grouped card is the status of the active round
            };
        });

        const all = [...standalone, ...combinedRooms];
        // Sort newest first based on scheduled time
        all.sort((a, b) => new Date(b.scheduledTime) - new Date(a.scheduledTime));
        return all;
    };

    const fetchRooms = async (statuses = null) => {
        setLoading(true);
        try {
            // Fetch ALL rooms to properly group multi-round bookings
            const allRoomsRes = await callApi({
                method: METHOD.GET,
                endpoint: interviewEndPoints.INTERVIEW_ROOMS + "?PageSize=1000",
            });
            const allRoomsData = allRoomsRes?.data || [];

            // Group rooms
            const groupedRooms = groupRoomsByBooking(allRoomsData);

            console.log("Grouped Rooms:", groupedRooms);

            // Filter into Upcoming (0, 1) and Past (2, 3)
            const upcomingRoomsList = groupedRooms.filter((r) => r.status === INTERVIEW_ROOM_STATUS.SCHEDULED || r.status === INTERVIEW_ROOM_STATUS.ON_GOING);
            const pastRoomsList = groupedRooms.filter((r) => r.status === INTERVIEW_ROOM_STATUS.COMPLETED || r.status === INTERVIEW_ROOM_STATUS.CANCELLED);

            // Update state
            if (statuses === null || statuses.includes(0)) {
                setUpcomingRooms(upcomingRoomsList);
            }

            setPastRooms(pastRoomsList); // Always set past rooms so UpcomingTab can display Recent History

            // Calculate stats
            if (statuses === null || statuses.includes(0)) {
                const upcomingCount = upcomingRoomsList.length;
                const completedRooms = pastRoomsList.filter((r) => r.status === INTERVIEW_ROOM_STATUS.COMPLETED);

                let avgScore = null;
                // Calculate average score across ALL individual completed rooms, not just grouped ones
                const allCompletedIndividualRooms = allRoomsData.filter(r => r.status === INTERVIEW_ROOM_STATUS.COMPLETED && typeof r.score === 'number');
                if (allCompletedIndividualRooms.length > 0) {
                    const totalScore = allCompletedIndividualRooms.reduce((acc, room) => acc + room.score, 0);
                    avgScore = (totalScore / allCompletedIndividualRooms.length).toFixed(1);
                }

                // Next session calculation
                const now = new Date();
                let nextSession = "—";
                const upcomingFutureRooms = upcomingRoomsList
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
                    upcoming: upcomingCount,
                    completed: completedRooms.length,
                    avgScore: avgScore && !isNaN(avgScore) ? parseFloat(avgScore) : null,
                    nextSessionIn: nextSession,
                });
            }
        } catch (error) {
            console.error("Failed to fetch rooms:", error);
        }
        setLoading(false);
    };

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

    const checkPendingFeedbacks = async () => {
        try {
            const res = await callApi({
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

    const checkPendingCoachEvaluations = async () => {
        try {
            const res = await callApi({
                method: METHOD.GET,
                endpoint: `${interviewEndPoints.INTERVIEW_ROOMS}?PageSize=1000`, // Increased limit to find rounds
            });
            const rooms = res?.data || [];
            
            // For multi-round interviews, we need to check ALL individual rooms,
            // not just the ones currently marked as 'COMPLETED' in the top-level grouping.
            const pendingRoom = rooms.find(
                (room) => room.status === INTERVIEW_ROOM_STATUS.COMPLETED && room.isEvaluationCompleted === false,
            );
            
            console.log("Checked pending coach evaluations. Total rooms:", rooms.length, "Pending evaluation room:", pendingRoom);
            if (pendingRoom) {
                setCoachEvaluationState({ open: true, room: pendingRoom });
            }
        } catch (error) {
            console.error("Failed to check pending coach evaluations:", error);
        }
    };

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
            await callApi({
                method: METHOD.POST,
                endpoint: interviewEndPoints.CREATE_RESCHEDULE_REQUEST,
                arg: {
                    roomId: data.roomId,
                    proposedAvailabilityId: data.proposedAvailabilityId,
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
            // Multi-round bookings (rounds.length > 1) use CANCEL_BOOKING_REQUEST
            // Single-round or standalone sessions use CANCEL_INTERVIEW
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
                await fetchRooms([0, 1]);
                await fetchRooms([2, 3]);
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
            await callApi({
                method: METHOD.POST,
                endpoint: interviewEndPoints.RESPOND_RESCHEDULE_REQUEST(request.id),
                arg: { isApproved: true },
            });
            fetchRescheduleRequests();
            fetchRooms();
        } catch (error) {
            console.error("Failed to approve reschedule:", error);
        }
    };

    const handleRejectReschedule = async (request, rejectionReason) => {
        try {
            await callApi({
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
        await fetchRooms([2, 3]);
        await checkPendingCoachEvaluations();
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
        // if (user?.role === ROLES.CANDIDATE && room?.type === INTERVIEW_ROOM_TYPE.WITH_AI) {
        //     setAiCvModalState({ open: true, room });
        //     return;
        // }
        navigate(`/interview/room/${room.id}`);
    };

    // const handleCloseAiCvModal = () => {
    //     setAiCvModalState({ open: false, room: null });
    // };

    // const handleConfirmAiCvJoin = (room) => {
    //     if (!room?.id) return;
    //     navigate(`/interview/room/${room.id}`);
    // };

    const handleReviewQuestions = (room) => {
        setGenQuestionsModalState({ open: true, roomId: room.id });
    };

    const handleCloseGenQuestionsModal = () => {
        setGenQuestionsModalState({ open: false, roomId: null });
    };

    if (loading && upcomingRooms.length === 0 && pastRooms.length === 0) {
        return (
            <Box sx={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CommonLoader />
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: "100vh", py: 4 }}>
            <Container maxWidth="lg">
                {/* Header */}
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

                {/* Stats Section */}
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

                {/* Tab Panels */}
                <TabPanel value={activeTab} index={0}>
                    <UpcomingTab
                        rooms={upcomingRooms}
                        recentRooms={pastRooms}
                        user={user}
                        loading={loading}
                        onRequestReschedule={handleRequestReschedule}
                        onCancelInterview={handleCancelInterview}
                        onViewFeedback={handleViewFeedback}
                        // onJoin={handleJoinRoom}
                        onReviewQuestions={handleReviewQuestions}
                        rescheduleRequests={rescheduleRequests}
                    />
                </TabPanel>

                <TabPanel value={activeTab} index={1}>
                    <PastHistoryTab
                        rooms={pastRooms}
                        user={user}
                        loading={loading}
                        onViewFeedback={handleViewFeedback}
                        onReviewQuestions={handleReviewQuestions}
                    />
                </TabPanel>

                {/* Modals outside Container flow for better management if needed, but here kept for logic */}
                <FeedbackListModal
                    open={feedbackModalState.open}
                    onClose={handleCloseFeedbackModal}
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

                {/* Reschedule Request Modal */}
                <RescheduleRequestModal
                    open={rescheduleModalState.open}
                    onClose={handleCloseRescheduleModal}
                    onSubmit={handleSubmitReschedule}
                    currentSession={rescheduleModalState.room}
                />

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
