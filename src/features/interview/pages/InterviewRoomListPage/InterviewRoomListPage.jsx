import {
    Card,
    CardContent,
    Grid,
    Box,
    Typography,
    Avatar,
    Chip,
    Stack,
    Skeleton,
    Button,
    IconButton,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
} from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CodeIcon from "@mui/icons-material/Code";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import VisibilityIcon from "@mui/icons-material/Visibility";
import FeedbackIcon from "@mui/icons-material/Feedback";
import { interviewEndPoints } from "../../services/interviewRoomApi";
import { useNavigate } from "react-router-dom";
import { formattedDateTime } from "../../../../common/utils/dateFormatter";
import useUser from "../../../../common/hooks/useUser.jsx";
import { callApi } from "../../../../common/utils/apiConnector.js";
import { METHOD } from "../../../../common/constants/api.js";
import { useEffect, useState } from "react";
import { INTERVIEW_ROOM_STATUS } from "../../../../common/constants/status.js";
import { ROLES } from "../../../../common/constants/common.js";
import FeedbackListModal from "./FeedbackListModal.jsx";
import ViewFeedbackModal from "./ViewFeedbackModal.jsx";

function InterviewRoomListPage() {
    const user = useUser();
    const [upcomingRooms, setUpcomingRooms] = useState([]);
    const [pastRooms, setPastRooms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasPendingFeedbacks, setHasPendingFeedbacks] = useState(false);
    const [feedbackModalState, setFeedbackModalState] = useState({ open: false, mode: 'pending' }); // 'pending' or 'all'

    useEffect(() => {
        if (user) {
            fetchRooms();
            // Check for pending feedbacks only if the user is an candidate
            if (user.role === ROLES.CANDIDATE) {
                checkPendingFeedbacks();
            }
        }
    }, [user]);

    const fetchRooms = async () => {
        setLoading(true);
        const res = await callApi({
            method: METHOD.GET,
            endpoint: interviewEndPoints.INTERVIEW_ROOMS,
        });
        const interviewRooms = res?.data || [];

        if (interviewRooms) {
            setUpcomingRooms(
                interviewRooms.filter(
                    (room) =>
                        room.status === INTERVIEW_ROOM_STATUS.SCHEDULED ||
                        room.status === INTERVIEW_ROOM_STATUS.ON_GOING,
                ),
            );
            setPastRooms(interviewRooms.filter((room) => room.status === INTERVIEW_ROOM_STATUS.COMPLETED));
        }
        setLoading(false);
    };

    const checkPendingFeedbacks = async () => {
        try {
            const res = await callApi({
                method: METHOD.GET,
                endpoint: interviewEndPoints.GET_FEEDBACKS,
            });
            if (res?.data) {
                const pending = res.data.items.filter(fb => !fb.comments || fb.comments.trim() === '');
                if (pending.length > 0) {
                    setHasPendingFeedbacks(true);
                    setFeedbackModalState({ open: true, mode: 'pending' }); // Open modal automatically if pending feedbacks exist
                } else {
                    setHasPendingFeedbacks(false);
                }
            }
        } catch (error) {
            console.error("Failed to check pending feedbacks:", error);
        }
    };

    const handleOpenFeedbackModal = (mode) => setFeedbackModalState({ open: true, mode });
    const handleCloseFeedbackModal = () => setFeedbackModalState({ open: false, mode: 'pending' });

    if (loading) return <RoomsSkeleton />;

    return (
        <Box sx={{ p: 4, bgcolor: "background.default", minHeight: "100vh" }}>
            <Box sx={{ maxWidth: 1200, mx: "auto" }}>
                {/* Header */}
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
                    <Box>
                        <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>
                            Upcoming Interviews
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Manage your scheduled and ongoing interviews
                        </Typography>
                    </Box>
                    {user?.role === ROLES.CANDIDATE && (
                        <Button 
                            variant="outlined" 
                            onClick={() => handleOpenFeedbackModal('all')}
                            sx={{ 
                                textTransform: "none",
                                borderRadius: 2,
                                fontWeight: 600
                            }}
                        >
                            View All Feedbacks
                        </Button>
                    )}
                </Stack>

                {upcomingRooms.length === 0 ? (
                    <Box 
                        sx={{ 
                            py: 8, 
                            textAlign: "center",
                            bgcolor: "background.paper",
                            borderRadius: 3,
                            border: "1px dashed",
                            borderColor: "divider"
                        }}
                    >
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            No upcoming interviews
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Your scheduled interviews will appear here
                        </Typography>
                    </Box>
                ) : (
                    <Grid container spacing={3}>
                        {upcomingRooms.map((room) => (
                            <RoomCard key={room.id} user={user} room={room} />
                        ))}
                    </Grid>
                )}

                {/* Past Interviews Section */}
                <Box sx={{ mt: 6, mb: 4 }}>
                    <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>
                        Past Interviews
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Review your completed interview sessions
                    </Typography>
                </Box>

                {pastRooms.length === 0 ? (
                    <Box 
                        sx={{ 
                            py: 8, 
                            textAlign: "center",
                            bgcolor: "background.paper",
                            borderRadius: 3,
                            border: "1px dashed",
                            borderColor: "divider"
                        }}
                    >
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            No past interviews
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Completed interviews will appear here
                        </Typography>
                    </Box>
                ) : (
                    <Grid container spacing={3}>
                        {pastRooms.map((room) => (
                            <RoomCard key={room.id} user={user} room={room} />
                        ))}
                    </Grid>
                )}
                <FeedbackListModal
                    open={feedbackModalState.open}
                    onClose={handleCloseFeedbackModal}
                    mode={feedbackModalState.mode}
                    onFeedbackSubmitted={checkPendingFeedbacks}
                />
            </Box>
        </Box>
    );
}

function RoomsSkeleton() {
    return (
        <Box sx={{ p: 2 }}>
            <Grid container spacing={2}>
                {[...Array(3)].map((_, i) => (
                    <Grid item xs={12} md={6} lg={4} key={i}>
                        <Card sx={{ height: "100%" }}>
                            <CardContent>
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <Skeleton variant="circular" width={40} height={40} />
                                    <Box sx={{ flex: 1 }}>
                                        <Skeleton width="70%" height={20} />
                                        <Skeleton width="50%" height={16} sx={{ mt: 1 }} />
                                    </Box>
                                    <Skeleton variant="rounded" width={70} height={24} />
                                </Stack>

                                <Stack spacing={1} direction="row" alignItems="center" sx={{ mt: 2 }}>
                                    <Skeleton width={90} height={14} />
                                    <Skeleton width={50} height={14} />
                                    <Skeleton width={40} height={14} />
                                </Stack>

                                <Skeleton width="100%" height={16} sx={{ mt: 2 }} />
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}

function RoomCard({ user, room }) {
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState(null);
    const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
    const menuOpen = Boolean(anchorEl);

    const handleMenuClick = (event) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleViewDetails = () => {
        handleMenuClose();
        navigate(`/interview/room/${room.id}`);
    };

    const handleViewFeedback = () => {
        console.log("Opening feedback modal for room:", room.id);
        handleMenuClose();
        setFeedbackModalOpen(true);
    };

    const handleCardClick = () => {
        // For completed interviews, show menu instead of direct navigation
        if (room.status === INTERVIEW_ROOM_STATUS.COMPLETED) {
            return; // Do nothing, let menu handle it
        }
        
        if (room.status === INTERVIEW_ROOM_STATUS.ON_GOING) {
            navigate(`/interview/room/${room.id}`);
        }
    };

    const getParticipantLabel = (room) => {
        if (user.role === ROLES.CANDIDATE) return `Interview with: ${room.coachId}`;
        if (user.role === ROLES.INTERVIEWER) return `Interview with: ${room.candidateId}`;
        return `Interview with interviewer:${room.coachId} / candidate:${room.candidateId}`;
    };

    const isPastInterview = room.status === INTERVIEW_ROOM_STATUS.COMPLETED;
    const isInterviewer = user.role === ROLES.INTERVIEWER || user.role === 1;

    console.log("RoomCard Debug:", {
        roomId: room.id,
        roomStatus: room.status,
        isPastInterview,
        userRole: user.role,
        isInterviewer,
        shouldShowMenu: isPastInterview && isInterviewer
    });

    return (
        <Grid item xs={12} md={6} lg={4} key={room.id}>
            <Card
                elevation={0}
                sx={{ 
                    cursor: isPastInterview ? "default" : "pointer", 
                    height: "100%", 
                    display: "flex", 
                    flexDirection: "column",
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 3,
                    transition: "all 0.2s ease-in-out",
                    "&:hover": {
                        borderColor: isPastInterview ? "divider" : "primary.main",
                        boxShadow: isPastInterview ? 0 : 3,
                        transform: isPastInterview ? "none" : "translateY(-2px)",
                    }
                }}
                onClick={handleCardClick}
            >
                <CardContent sx={{ flex: 1, p: 3 }}>
                    <Stack direction="row" spacing={2} alignItems="flex-start">
                        <Avatar 
                            sx={{ 
                                bgcolor: "primary.main",
                                width: 48,
                                height: 48,
                                fontSize: "1.25rem",
                                fontWeight: 600
                            }}
                        >
                            {room.interviewerId ?? "I"}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography 
                                variant="h6" 
                                sx={{ 
                                    lineHeight: 1.3,
                                    fontWeight: 700,
                                    mb: 0.5,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap"
                                }}
                            >
                                {room.problemShortName || "Interview"}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.875rem" }}>
                                {getParticipantLabel(room)}
                            </Typography>
                        </Box>
                        <Stack direction="column" spacing={0.5} alignItems="flex-end">
                            <Chip
                                label={room.status === 0 ? "Scheduled" : room.status === 1 ? "Ongoing" : "Completed"}
                                color={room.status === 0 ? "info" : room.status === 1 ? "success" : "default"}
                                size="small"
                                sx={{ 
                                    fontWeight: 600,
                                    fontSize: "0.75rem",
                                    height: 24
                                }}
                            />
                            {isPastInterview && isInterviewer && (
                                <IconButton
                                    size="small"
                                    onClick={handleMenuClick}
                                    sx={{ 
                                        mt: 0.5,
                                        "&:hover": {
                                            bgcolor: "action.hover"
                                        }
                                    }}
                                >
                                    <MoreVertIcon fontSize="small" />
                                </IconButton>
                            )}
                        </Stack>
                    </Stack>

                    <Box 
                        sx={{ 
                            mt: 2.5,
                            pt: 2,
                            borderTop: "1px solid",
                            borderColor: "divider"
                        }}
                    >
                        <Stack spacing={1.5}>
                            <Stack direction="row" spacing={0.75} alignItems="center">
                                <AccessTimeIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                                    {formattedDateTime(room.scheduledTime)}
                                </Typography>
                            </Stack>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <Stack direction="row" spacing={0.75} alignItems="center">
                                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                                        ⏱️ {room.durationMinutes ?? 60} min
                                    </Typography>
                                </Stack>
                                <Stack direction="row" spacing={0.75} alignItems="center">
                                    <CodeIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                                        {room.currentLanguage || "—"}
                                    </Typography>
                                </Stack>
                            </Stack>
                        </Stack>
                    </Box>

                    {room.status === INTERVIEW_ROOM_STATUS.COMPLETED && room.problemDescription && (
                        <Box 
                            sx={{ 
                                mt: 2,
                                p: 1.5,
                                bgcolor: "action.hover",
                                borderRadius: 2,
                                border: "1px solid",
                                borderColor: "divider"
                            }}
                        >
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    display: "-webkit-box",
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: "vertical",
                                    lineHeight: 1.5
                                }}
                            >
                                {room.problemDescription}
                            </Typography>
                        </Box>
                    )}
                </CardContent>
            </Card>

            {/* Dropdown Menu for Past Interviews (Interviewer only) */}
            <Menu
                anchorEl={anchorEl}
                open={menuOpen}
                onClose={handleMenuClose}
                onClick={(e) => e.stopPropagation()}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                PaperProps={{
                    elevation: 3,
                    sx: {
                        borderRadius: 2,
                        minWidth: 180,
                        mt: 1
                    }
                }}
            >
                <MenuItem onClick={handleViewDetails}>
                    <ListItemIcon>
                        <VisibilityIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>View Details</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleViewFeedback}>
                    <ListItemIcon>
                        <FeedbackIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>View Feedback</ListItemText>
                </MenuItem>
            </Menu>

            {/* Feedback Modal */}
            <ViewFeedbackModal
                open={feedbackModalOpen}
                onClose={() => setFeedbackModalOpen(false)}
                interviewRoomId={room.id}
            />
        </Grid>
    );
}

export default InterviewRoomListPage;
