import { useState } from "react";
import {
    Box,
    Typography,
    Stack,
    Avatar,
    Button,
    Chip,
    Pagination,
    CircularProgress,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
} from "@mui/material";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CodeIcon from "@mui/icons-material/Code";
import { formattedDateTime } from "../../../../../common/utils/dateFormatter";
import ConfirmModal from "../../../../../common/components/ConfirmModal";

const ITEMS_PER_PAGE = 5;

// Helper function to get status color and label
// Aligned with RescheduleRequestStatus.cs: Pending=0, Approved=1, Rejected=2, Expired=3
// Color scheme matches INTERVIEW_ROOM_STATUS for consistency
const getStatusInfo = (status) => {
    switch (status) {
        case 0: // Pending - matches SCHEDULED (both are "waiting" states)
            return { 
                label: "Pending", 
                color: "warning",
                bgcolor: "rgba(237, 108, 2, 0.12)", // warning lighter
                textColor: "#e65100" // warning dark
            };
        case 1: // Approved - success state
            return { 
                label: "Approved", 
                color: "success",
                bgcolor: "rgba(46, 125, 50, 0.12)", // success lighter
                textColor: "#2e7d32" // success dark
            };
        case 2: // Rejected - error state
            return { 
                label: "Rejected", 
                color: "error",
                bgcolor: "rgba(211, 47, 47, 0.12)", // error lighter
                textColor: "#c62828" // error dark
            };
        case 3: // Expired - neutral/disabled state
            return { 
                label: "Expired", 
                color: "default",
                bgcolor: "rgba(0, 0, 0, 0.08)", // grey lighter
                textColor: "#616161" // grey dark
            };
        default:
            return { 
                label: "Unknown", 
                color: "default",
                bgcolor: "rgba(0, 0, 0, 0.08)",
                textColor: "#616161"
            };
    }
};

// Reschedule Request Card Component
function RescheduleRequestCard({ request, user, onApprove, onReject }) {
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
    const problemName = interviewRoom?.problemShortName || "Interview Session";
    const duration = interviewRoom?.durationMinutes || 60;
    const interviewType = interviewRoom?.interviewTypeName || "Technical Interview";
    
    // Get times from availability objects
    const originalTime = request.currentAvailability?.startTime;
    const proposedTime = request.proposedAvailability?.startTime;
    
    const statusInfo = getStatusInfo(request.status);

    return (
        <Box
            sx={{
                p: 2.5,
                bgcolor: "background.paper",
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
                borderLeft: "4px solid",
                borderLeftColor: isSentByMe ? "info.main" : "warning.main",
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                    borderColor: isSentByMe ? "info.main" : "warning.main",
                    boxShadow: 1,
                },
            }}
        >
            {/* Header Row */}
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                        {problemName}
                    </Typography>
                    <Stack direction="row" spacing={2} alignItems="center">
                        {/* Duration with icon */}
                        <Stack direction="row" spacing={0.75} alignItems="center">
                            <AccessTimeIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                            <Typography variant="body2" color="text.secondary">
                                {duration} min
                            </Typography>
                        </Stack>
                        
                        {/* Interview Type */}
                        <Stack direction="row" spacing={0.75} alignItems="center">
                            <CodeIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ textTransform: "uppercase", fontSize: "0.75rem" }}
                            >
                                {interviewType}
                            </Typography>
                        </Stack>
                    </Stack>
                </Box>
                
                <Stack direction="row" spacing={0.5} alignItems="center">
                    {/* Request type indicator */}
                    <Chip
                        label={isSentByMe ? "Sent" : "Received"}
                        size="small"
                        sx={{
                            bgcolor: isSentByMe ? "info.lighter" : "warning.lighter",
                            color: isSentByMe ? "info.dark" : "warning.dark",
                            fontWeight: 600,
                            fontSize: "0.7rem",
                            height: 24,
                            borderRadius: 1.5,
                        }}
                    />
                    {/* Status chip */}
                    <Chip
                        label={statusInfo.label}
                        size="small"
                        sx={{
                            bgcolor: statusInfo.bgcolor,
                            color: statusInfo.textColor,
                            fontWeight: 600,
                            fontSize: "0.7rem",
                            height: 24,
                            borderRadius: 1.5,
                        }}
                    />
                </Stack>
            </Stack>

            {/* Main Content - Compact Grid Layout */}
            <Box 
                sx={{ 
                    display: "grid", 
                    gridTemplateColumns: "auto 1fr auto 1fr auto",
                    gap: 0,
                    alignItems: "center",
                    p: 1.5,
                    bgcolor: "grey.50",
                    borderRadius: 1,
                }}
            >
                {/* Requester Avatar & Info */}
                <Avatar
                    sx={{
                        bgcolor: isSentByMe ? "info.main" : "primary.main",
                        width: 36,
                        height: 36,
                        fontSize: "0.85rem",
                        fontWeight: 600,
                    }}
                >
                    {getInitials(requesterName)}
                </Avatar>
                <Box>
                    <Typography variant="body2" fontWeight={600} fontSize="0.85rem">
                        {requesterName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" fontSize="0.7rem">
                        {isSentByMe ? "You (Requester)" : "Requester"}
                    </Typography>
                </Box>

                <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

                {/* Time Change Info - Simple */}
                <Stack direction="row" spacing={1} alignItems="center">
                    {/* Original Time */}
                    <Box>
                        <Typography variant="caption" color="text.secondary" fontSize="0.65rem" display="block">
                            Original
                        </Typography>
                        <Typography variant="body2" fontSize="0.8rem">
                            {originalTime ? formattedDateTime(originalTime) : "N/A"}
                        </Typography>
                    </Box>

                    {/* Arrow */}
                    <ArrowForwardIcon sx={{ color: "text.secondary", fontSize: 16 }} />

                    {/* Proposed Time */}
                    <Box>
                        <Typography variant="caption" color="text.secondary" fontSize="0.65rem" display="block">
                            Proposed
                        </Typography>
                        <Typography variant="body2" fontSize="0.8rem" fontWeight={600}>
                            {proposedTime ? formattedDateTime(proposedTime) : "N/A"}
                        </Typography>
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

            {/* Reason - Compact */}
            {request.reason && (
                <Box
                    sx={{
                        mt: 1.5,
                        p: 1,
                        bgcolor: "primary.lighter",
                        borderRadius: 1,
                        borderLeft: "3px solid",
                        borderLeftColor: "primary.main",
                    }}
                >
                    <Typography variant="caption" color="primary.dark" fontWeight={600} fontSize="0.7rem">
                        Reason:{" "}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" fontSize="0.7rem">
                        {request.reason}
                    </Typography>
                </Box>
            )}

            {/* Rejection Reason (if rejected) - Compact */}
            {request.status === 2 && request.rejectionReason && (
                <Box
                    sx={{
                        mt: 1.5,
                        p: 1,
                        bgcolor: "error.lighter",
                        borderRadius: 1,
                        borderLeft: "3px solid",
                        borderLeftColor: "error.main",
                    }}
                >
                    <Typography variant="caption" color="error.dark" fontWeight={600} fontSize="0.7rem">
                        Rejection Reason:{" "}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" fontSize="0.7rem">
                        {request.rejectionReason}
                    </Typography>
                </Box>
            )}
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
