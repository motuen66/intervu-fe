import {
    Box,
    Typography,
    Stack,
    Button,
    Tabs,
    Tab,
    CircularProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { interviewEndPoints } from "../../services/interviewRoomApi";
import useUser from "../../../../common/hooks/useUser.jsx";
import { callApi } from "../../../../common/utils/apiConnector.js";
import { METHOD } from "../../../../common/constants/api.js";
import { useEffect, useState, useCallback } from "react";
import { INTERVIEW_ROOM_STATUS } from "../../../../common/constants/status.js";
import { ROLES } from "../../../../common/constants/common.js";
import FeedbackListModal from "./FeedbackListModal.jsx";
import RescheduleRequestModal from "./RescheduleRequestModal.jsx";

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
    const user = useUser();
    const [upcomingRooms, setUpcomingRooms] = useState([]);
    const [pastRooms, setPastRooms] = useState([]);
    const [rescheduleRequests, setRescheduleRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [rescheduleLoading, setRescheduleLoading] = useState(false);
    const [hasPendingFeedbacks, setHasPendingFeedbacks] = useState(false);
    const [feedbackModalState, setFeedbackModalState] = useState({ open: false, mode: 'pending' });
    const [rescheduleModalState, setRescheduleModalState] = useState({ open: false, room: null });
    const [activeTab, setActiveTab] = useState(0);
    const [stats, setStats] = useState({ upcoming: 0, completed: 0, avgScore: null });

    // Fetch initial data once on mount
    useEffect(() => {
        if (!user) return;
        
        // Fetch data for initial tab (Upcoming)
        fetchRooms([0, 1]);
        fetchRescheduleRequests();
        if (user.role === ROLES.CANDIDATE) {
            checkPendingFeedbacks();
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
        } else if (activeTab === 2) {
            fetchRescheduleRequests();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]); // Refetch when tab changes

    const fetchRooms = async (statuses = null) => {
        setLoading(true);
        try {
            // Build query params
            let endpoint = interviewEndPoints.INTERVIEW_ROOMS + "?PageSize=100";
            if (statuses && statuses.length > 0) {
                statuses.forEach(status => {
                    endpoint += `&Statuses=${status}`;
                });
            }
            
            const res = await callApi({
                method: METHOD.GET,
                endpoint: endpoint,
            });
            const interviewRooms = res?.data || [];
            
            console.log('Fetched rooms with statuses:', statuses, 'Data:', interviewRooms);

            // Update state based on which statuses were fetched
            if (statuses && statuses.includes(0)) {
                // Upcoming tab: statuses [0, 1]
                console.log('Setting upcoming rooms:', interviewRooms);
                setUpcomingRooms(interviewRooms);
            } else if (statuses && statuses.includes(2)) {
                // Past history tab: statuses [2, 3]
                console.log('Setting past rooms:', interviewRooms);
                setPastRooms(interviewRooms);
            }
            
            // Calculate stats on initial load (fetch all data for stats)
            if (statuses && statuses.includes(0)) {
                // Only calculate stats when fetching upcoming data (initial load or upcoming tab)
                const allRooms = await callApi({
                    method: METHOD.GET,
                    endpoint: interviewEndPoints.INTERVIEW_ROOMS + "?PageSize=1000",
                });
                const allRoomsData = allRooms?.data || [];
                const upcomingCount = allRoomsData.filter(r => r.status === 0 || r.status === 1).length;
                const completedRooms = allRoomsData.filter(r => r.status === 2);
                const avgScore = completedRooms.length > 0 
                    ? (completedRooms.reduce((acc, room) => acc + (room.score || 0), 0) / completedRooms.filter(r => r.score).length).toFixed(1)
                    : null;
                
                setStats({
                    upcoming: upcomingCount,
                    completed: completedRooms.length,
                    avgScore: avgScore && !isNaN(avgScore) ? parseFloat(avgScore) : null,
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
                const pending = res.data.items?.filter(fb => !fb.comments || fb.comments.trim() === '') || [];
                if (pending.length > 0) {
                    setHasPendingFeedbacks(true);
                    setFeedbackModalState({ open: true, mode: 'pending' });
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
        // TODO: Implement cancel interview logic
        alert("Cancel Interview feature is not yet implemented. This will be available in a future update.");
        console.log("Cancel interview:", room.id);
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
                    rejectionReason: rejectionReason || "Request rejected"
                },
            });
            fetchRescheduleRequests();
        } catch (error) {
            console.error("Failed to reject reschedule:", error);
        }
    };

    const handleOpenFeedbackModal = (mode) => setFeedbackModalState({ open: true, mode });
    const handleCloseFeedbackModal = () => setFeedbackModalState({ open: false, mode: 'pending' });

    if (loading && upcomingRooms.length === 0 && pastRooms.length === 0) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: "background.default", minHeight: "100vh" }}>
            <Box sx={{ maxWidth: 1200, mx: "auto" }}>
                {/* Header */}
                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    justifyContent="space-between"
                    alignItems={{ xs: "flex-start", sm: "center" }}
                    spacing={2}
                    sx={{ mb: 4 }}
                >
                    <Box>
                        <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>
                            My Interviews
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Track your upcoming practice sessions and review past performance feedback.
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={2}>
                        {user?.role === ROLES.CANDIDATE && (
                            <Button
                                variant="outlined"
                                onClick={() => handleOpenFeedbackModal('all')}
                                sx={{ borderRadius: 2, fontWeight: 600 }}
                            >
                                View All Feedbacks
                            </Button>
                        )}
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            sx={{ borderRadius: 2, fontWeight: 600, boxShadow: "none" }}
                        >
                            Book New Session
                        </Button>
                    </Stack>
                </Stack>

                {/* Stats Section */}
                <InterviewStats
                    upcomingCount={stats.upcoming}
                    completedCount={stats.completed}
                    avgScore={stats.avgScore}
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
                        <Tab 
                            label={`Reschedule Request${rescheduleRequests.length > 0 ? ` (${rescheduleRequests.length})` : ''}`} 
                            {...a11yProps(2)} 
                        />
                    </Tabs>
                </Box>

                {/* Tab Panels */}
                <TabPanel value={activeTab} index={0}>
                    <UpcomingTab
                        rooms={upcomingRooms}
                        user={user}
                        loading={loading}
                        onRequestReschedule={handleRequestReschedule}
                        onCancelInterview={handleCancelInterview}
                        rescheduleRequests={rescheduleRequests}
                    />
                </TabPanel>

                <TabPanel value={activeTab} index={1}>
                    <PastHistoryTab
                        rooms={pastRooms}
                        user={user}
                        loading={loading}
                    />
                </TabPanel>

                <TabPanel value={activeTab} index={2}>
                    <RescheduleRequestsTab
                        requests={rescheduleRequests}
                        user={user}
                        loading={rescheduleLoading}
                        onApprove={handleApproveReschedule}
                        onReject={handleRejectReschedule}
                    />
                </TabPanel>

                {/* Feedback Modal */}
                <FeedbackListModal
                    open={feedbackModalState.open}
                    onClose={handleCloseFeedbackModal}
                    mode={feedbackModalState.mode}
                    onFeedbackSubmitted={checkPendingFeedbacks}
                />

                {/* Reschedule Request Modal */}
                <RescheduleRequestModal
                    open={rescheduleModalState.open}
                    onClose={handleCloseRescheduleModal}
                    onSubmit={handleSubmitReschedule}
                    currentSession={rescheduleModalState.room}
                />
            </Box>
        </Box>
    );
}

export default InterviewRoomListPage;
