import { useState } from "react";
import {
    Box,
    Typography,
    Stack,
    Avatar,
    Button,
    Pagination,
    CircularProgress,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Badge,
    useTheme,
} from "@mui/material";
import { Clock, Code, ArrowRight, Calendar, MoreHorizontal, X } from "lucide-react";
import { formattedDateTime } from "../../../../../common/utils/dateFormatter";
import ConfirmModal from "../../../../../common/components/ConfirmModal";
import StatusChip from "../../../../../common/components/StatusChip";
import { getRescheduleRequestStatusConfig } from "../../../../../common/constants/statusConfig";

const ITEMS_PER_PAGE = 5;

// Helper function to get status color and label
// Aligned with RescheduleRequestStatus.cs: Pending=0, Approved=1, Rejected=2, Expired=3
// Color scheme matches INTERVIEW_ROOM_STATUS for consistency
const getStatusInfo = (status) => getRescheduleRequestStatusConfig(status);

// Custom Muted Chip for modern & clean look
const MutedChip = ({ label, color }) => {
    const isGray = color === "default" || color === "secondary";
    const bgOpacity = 0.1;
    return (
        <Box
            sx={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: isGray ? "rgba(0,0,0,0.06)" : `${color}.main`,
                color: isGray ? "text.secondary" : `${color}.dark`,
                px: 1.5,
                py: 0.5,
                borderRadius: "8px",
                fontSize: "0.7rem",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                /* Apply opacity to background only using trick if color is defined in MUI theme */
                ...(!isGray && {
                    bgcolor: (theme) => {
                        const mainColor = theme.palette[color].main;
                        // Extremely simple faux-opacity for hex colors by relying on a known lighter shade if available, 
                        // or using the built in alpha if we had it. Since we don't, we'll try to pick from lighter.
                        return theme.palette[color].lighter || `${mainColor}20`; // 20 hex = ~12% opacity
                    }
                })
            }}
        >
            {label}
        </Box>
    );
};

// Reschedule Request Card Component
function RescheduleRequestCard({ request, user, onApprove, onReject }) {
    const theme = useTheme();

    const getInitials = (name) => {
        if (!name) return "?";
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    // Determine if this request was sent BY me or TO me
    const isSentByMe = request.requestedBy === user?.id;
    // If request is NOT sent by me and is pending, I need to respond
    const isWaitingForMyResponse = !isSentByMe && request.status === 0;

    // Get requester name from nested object
    const requesterName = request.requester?.fullName || "Unknown User";

    // Get interview room info
    const interviewRoom = request.interviewRoom;
    const duration = interviewRoom?.durationMinutes || 60;
    const interviewType = interviewRoom?.interviewTypeName || "Interview Session";

    // Get times from availability objects
    const originalTime = request.currentAvailability?.startTime;
    const proposedTime = request.proposedAvailability?.startTime;

    const statusInfo = getStatusInfo(request.status);

    return (
        <Box
            sx={{
                p: { xs: 2, sm: 2.5 },
                bgcolor: "background.paper",
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                    borderColor: "primary.main",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
                    transform: "translateY(-2px)"
                },
            }}
        >
            {/* Header Row */}
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                <Box sx={{ flex: 1 }}>
                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 0.5 }}>
                        <Box sx={{
                            bgcolor: "primary.main",
                            color: "white",
                            p: 0.75,
                            borderRadius: "8px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                        }}>
                            <Clock size={16} strokeWidth={2} />
                        </Box>
                        <Typography variant="h6" fontWeight={900} sx={{ textTransform: "uppercase", letterSpacing: "-0.5px" }}>
                            {interviewType}
                        </Typography>
                    </Stack>

                    <Stack direction="row" spacing={2} alignItems="center" sx={{ pl: 5 }}>
                        {/* Duration */}
                        <Stack direction="row" spacing={0.75} alignItems="center">
                            <Clock size={14} strokeWidth={2} color="var(--mui-palette-text-secondary)" />
                            <Typography variant="body2" color="text.secondary" fontWeight={500}>
                                {duration} minutes session
                            </Typography>
                        </Stack>
                    </Stack>
                </Box>

                <Stack direction="row" spacing={1} alignItems="center">
                    <MutedChip label={isSentByMe ? "Sent" : "Received"} color={isSentByMe ? "primary" : "info"} />
                    <MutedChip label={statusInfo.label} color={statusInfo.color} />
                </Stack>
            </Stack>

            {/* Main Content - Compact Grid Layout */}
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: "auto 1fr auto 1fr auto",
                    gap: 0,
                    alignItems: "center",
                    p: 1.25,
                    bgcolor: "grey.50",
                    borderRadius: 1,
                }}
            >
                {/* Requester Avatar & Info */}
                <Box>
                    <Badge
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        variant="dot"
                        sx={{
                            '& .MuiBadge-badge': {
                                backgroundColor: isSentByMe ? 'primary.main' : 'secondary.main',
                                border: '2px solid white',
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                            }
                        }}
                    >
                        <Avatar
                            src={request.requester?.profilePicture || ""}
                            sx={{
                                width: 40,
                                height: 40,
                                fontSize: "1rem",
                                fontWeight: 600,
                                bgcolor: request.requester?.profilePicture ? "transparent" : "secondary.main",
                                color: request.requester?.profilePicture ? "inherit" : "primary.main",
                            }}
                        >
                            {!request.requester?.profilePicture ? getInitials(requesterName) : null}
                        </Avatar>
                    </Badge>
                </Box>
                <Box sx={{ pl: 1.5 }}>
                    <Typography variant="body2" fontWeight={700} fontSize="0.9rem" sx={{ color: "text.primary" }}>
                        {requesterName}
                    </Typography>
                    <Typography variant="caption" fontWeight={600} sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.5px", fontSize: "0.65rem" }}>
                        {isSentByMe ? "You / Requester" : "Requester"}
                    </Typography>
                </Box>

                <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

                {/* Time Change Info - Enhanced Hierarchy */}
                <Stack direction="row" spacing={2.5} alignItems="center">
                    {/* Original Time - Muffled */}
                    <Box sx={{ opacity: 0.7 }}>
                        <Typography variant="caption" fontWeight={700} sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.5px", fontSize: "0.65rem", display: "block", mb: 0.5 }}>
                            Original Time
                        </Typography>
                        <Stack direction="row" spacing={0.75} alignItems="center">
                            <Calendar size={14} strokeWidth={2} color="var(--mui-palette-text-secondary)" />
                            <Typography variant="body2" fontWeight={500} color="text.secondary">
                                {originalTime ? formattedDateTime(originalTime) : "N/A"}
                            </Typography>
                        </Stack>
                    </Box>

                    {/* Arrow Flow Connector */}
                    <Box sx={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        border: "1px solid",
                        borderColor: "divider",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: "background.paper"
                    }}>
                        <ArrowRight size={12} strokeWidth={2} color="var(--mui-palette-text-primary)" />
                    </Box>

                    {/* Proposed Time - Highlighted */}
                    <Box>
                        <Typography variant="caption" fontWeight={800} sx={{ color: "primary.main", textTransform: "uppercase", letterSpacing: "0.5px", fontSize: "0.65rem", display: "block", mb: 0.5 }}>
                            Proposed Time
                        </Typography>
                        <Stack direction="row" spacing={0.75} alignItems="center">
                            <Calendar size={14} strokeWidth={2.5} color={theme.palette.primary.main} />
                            <Typography variant="body2" fontWeight={800} color="text.primary">
                                {proposedTime ? formattedDateTime(proposedTime) : "N/A"}
                            </Typography>
                        </Stack>
                    </Box>
                </Stack>

                <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

                {/* Action Area - Compact */}
                <Box sx={{ minWidth: 100 }}>
                    {isWaitingForMyResponse && (
                        <Stack direction="row" spacing={0.75}>
                            <Button
                                variant="contained"
                                color="success"
                                size="small"
                                onClick={() => onApprove(request)}
                                sx={{
                                    borderRadius: 1,
                                    fontWeight: 600,
                                    boxShadow: "none",
                                    px: 1.5,
                                    py: 0.5,
                                    fontSize: "0.75rem",
                                }}
                            >
                                Approve
                            </Button>
                            <Button
                                variant="outlined"
                                color="error"
                                size="small"
                                onClick={() => onReject(request)}
                                sx={{
                                    borderRadius: 1,
                                    fontWeight: 600,
                                    px: 1.5,
                                    py: 0.5,
                                    fontSize: "0.75rem",
                                }}
                            >
                                Reject
                            </Button>
                        </Stack>
                    )}
                </Box>
            </Box>

            <Divider sx={{ my: 1.5, borderStyle: "dashed" }} />

            {/* Content Blocks - Reasons */}
            <Stack spacing={1.5}>
                {request.reason && (
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                        <Box sx={{
                            mt: 0.25,
                            p: 0.5,
                            bgcolor: "grey.100",
                            borderRadius: "50%",
                            display: "flex"
                        }}>
                            <MoreHorizontal size={14} strokeWidth={2} color="var(--mui-palette-text-secondary)" />
                        </Box>
                        <Box>
                            <Typography variant="caption" fontWeight={700} sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.5px", fontSize: "0.65rem", display: "block" }}>
                                Reason for reschedule
                            </Typography>
                            <Typography variant="body2" color="text.primary" sx={{ fontStyle: "italic", mt: 0.25 }}>
                                "{request.reason}"
                            </Typography>
                        </Box>
                    </Box>
                )}

                {request.status === 2 && request.rejectionReason && (
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mt: 1, p: 2, bgcolor: "error.lighter", borderRadius: 2 }}>
                        <Box sx={{
                            mt: 0.25,
                            p: 0.5,
                            bgcolor: "rgba(255, 255, 255, 0.5)",
                            borderRadius: "50%",
                            display: "flex",
                            color: "error.main"
                        }}>
                            <X size={14} strokeWidth={2.5} />
                        </Box>
                        <Box>
                            <Typography variant="caption" fontWeight={800} sx={{ color: "error.main", textTransform: "uppercase", letterSpacing: "0.5px", fontSize: "0.65rem", display: "block" }}>
                                Rejection Feedback
                            </Typography>
                            <Typography variant="body2" color="error.dark" sx={{ fontStyle: "italic", mt: 0.25, fontWeight: 500 }}>
                                "{request.rejectionReason}"
                            </Typography>
                        </Box>
                    </Box>
                )}
            </Stack>
        </Box>
    );
}

function RescheduleRequestsTab({
    requests,
    user,
    loading,
    onApprove,
    onReject
}) {
    const [page, setPage] = useState(1);
    const [confirmModal, setConfirmModal] = useState({
        show: false,
        type: null, // 'approve' or 'reject'
        request: null,
    });
    const [rejectReason, setRejectReason] = useState("");

    // Pagination logic
    const totalPages = Math.ceil((requests?.length || 0) / ITEMS_PER_PAGE);
    const paginatedRequests = (requests || []).slice(
        (page - 1) * ITEMS_PER_PAGE,
        page * ITEMS_PER_PAGE
    );

    const handlePageChange = (event, value) => {
        setPage(value);
    };

    const handleApproveClick = (request) => {
        setConfirmModal({
            show: true,
            type: 'approve',
            request,
        });
    };

    const handleRejectClick = (request) => {
        setConfirmModal({
            show: true,
            type: 'reject',
            request,
        });
    };

    const handleConfirm = () => {
        if (confirmModal.type === 'approve') {
            onApprove(confirmModal.request);
        } else {
            // Pass rejection reason to parent
            onReject(confirmModal.request, rejectReason);
        }
        setConfirmModal({ show: false, type: null, request: null });
        setRejectReason("");
    };

    const handleCancel = () => {
        setConfirmModal({ show: false, type: null, request: null });
        setRejectReason("");
    };

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            {paginatedRequests.length === 0 ? (
                <Box
                    sx={{
                        py: 8,
                        textAlign: "center",
                        bgcolor: "background.paper",
                        borderRadius: 2,
                        border: "1px dashed",
                        borderColor: "divider",
                    }}
                >
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        No reschedule requests
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Pending reschedule requests will appear here
                    </Typography>
                </Box>
            ) : (
                <Stack spacing={2}>
                    {paginatedRequests.map((request) => (
                        <RescheduleRequestCard
                            key={request.id}
                            request={request}
                            user={user}
                            onApprove={handleApproveClick}
                            onReject={handleRejectClick}
                        />
                    ))}
                </Stack>
            )}

            {/* Pagination */}
            {(requests?.length || 0) > 0 && (
                <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ mt: 3, pt: 3, borderTop: "1px solid", borderColor: "divider" }}
                >
                    <Typography variant="body2" color="text.secondary">
                        Showing {(page - 1) * ITEMS_PER_PAGE + 1} to{" "}
                        {Math.min(page * ITEMS_PER_PAGE, requests?.length || 0)} of{" "}
                        {requests?.length || 0} results
                    </Typography>
                    <Pagination
                        count={totalPages}
                        page={page}
                        onChange={handlePageChange}
                        color="primary"
                        shape="rounded"
                        showFirstButton
                        showLastButton
                    />
                </Stack>
            )}

            {/* Approve Modal */}
            {confirmModal.type === 'approve' && (
                <ConfirmModal
                    show={confirmModal.show}
                    title='Approve Reschedule Request'
                    message='Are you sure you want to approve this reschedule request? The interview will be moved to the new proposed time.'
                    onConfirm={handleConfirm}
                    onCancel={handleCancel}
                    confirmText='Approve'
                    cancelText="Cancel"
                />
            )}

            {/* Reject Modal with Reason Input */}
            {confirmModal.type === 'reject' && (
                <Dialog
                    open={confirmModal.show}
                    onClose={handleCancel}
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogTitle>Reject Reschedule Request</DialogTitle>
                    <DialogContent>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Please provide a reason for rejecting this reschedule request. The requester will see this message.
                        </Typography>
                        <TextField
                            autoFocus
                            fullWidth
                            multiline
                            rows={3}
                            label="Rejection Reason"
                            placeholder="e.g., The proposed time conflicts with another interview..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            required
                        />
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2 }}>
                        <Button onClick={handleCancel} color="inherit">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            variant="contained"
                            color="error"
                            disabled={!rejectReason.trim()}
                        >
                            Reject
                        </Button>
                    </DialogActions>
                </Dialog>
            )}
        </Box>
    );
}

export default RescheduleRequestsTab;
