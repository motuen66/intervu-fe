import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    getBookingRequestDetail,
    respondToBookingRequest,
    payBookingRequest,
    cancelBookingRequest,
} from "../../services/bookingRequestApi";
import {
    BOOKING_REQUEST_STATUS,
    BOOKING_REQUEST_STATUS_LABELS,
    BOOKING_REQUEST_TYPE,
    BOOKING_REQUEST_TYPE_LABELS,
    AIM_LEVEL_LABELS,
} from "../../../../common/constants/status";
import useUser from "../../../../common/hooks/useUser";
import { ROLES } from "../../../../common/constants/common";
import {
    Box,
    Typography,
    Stack,
    CircularProgress,
    DialogActions,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { dialogStyles } from "../../../../common/constants/uiStyles";
import { DangerButton, PrimaryButton, SecondaryButton } from "../../../../common/components/buttons";
import FormTextField from "../../../../common/components/form/FormTextField";
import StatusChip from "../../../../common/components/StatusChip";
import LinkIcon from "@mui/icons-material/Link";
import CloseIcon from "@mui/icons-material/Close";
import PaymentIcon from "@mui/icons-material/Payment";
import CancelIcon from "@mui/icons-material/Cancel";
import toast from "react-hot-toast";
import "./BookingRequestPage.css";

const STATUS_COLOR_MAP = {
    [BOOKING_REQUEST_STATUS.PENDING]: "warning",
    [BOOKING_REQUEST_STATUS.ACCEPTED]: "success",
    [BOOKING_REQUEST_STATUS.REJECTED]: "error",
    [BOOKING_REQUEST_STATUS.PAID]: "info",
    [BOOKING_REQUEST_STATUS.EXPIRED]: "default",
    [BOOKING_REQUEST_STATUS.CANCELLED]: "default",
};

export default function BookingRequestDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const user = useUser();
    const isCoach = user?.role === ROLES.INTERVIEWER;

    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [responding, setResponding] = useState(false);
    const [paying, setPaying] = useState(false);
    const [cancelling, setCancelling] = useState(false);

    // Reject dialog state
    const [rejectOpen, setRejectOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");

    useEffect(() => {
        if (id) fetchDetail();
    }, [id]);

    const fetchDetail = async () => {
        setLoading(true);
        try {
            const data = await getBookingRequestDetail(id);
            setDetail(data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load booking request.");
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async () => {
        setResponding(true);
        try {
            await respondToBookingRequest(id, { isApproved: true });
            toast.success("Booking request accepted!");
            fetchDetail();
        } catch (err) {
            toast.error(err.message || "Failed to accept.");
        } finally {
            setResponding(false);
        }
    };

    const handleReject = async () => {
        if (!rejectionReason.trim()) {
            toast.error("Please provide a reason for rejection.");
            return;
        }
        setResponding(true);
        try {
            await respondToBookingRequest(id, {
                isApproved: false,
                rejectionReason: rejectionReason.trim(),
            });
            toast.success("Booking request rejected.");
            setRejectOpen(false);
            setRejectionReason("");
            fetchDetail();
        } catch (err) {
            toast.error(err.message || "Failed to reject.");
        } finally {
            setResponding(false);
        }
    };

    const handlePay = async () => {
        setPaying(true);
        try {
            const returnUrl = window.location.origin + "/booking-requests/" + id;
            const result = await payBookingRequest(id, { returnUrl });
            if (result?.checkOutUrl) {
                window.location.href = result.checkOutUrl;
            } else {
                toast.success("Payment completed!");
                fetchDetail();
            }
        } catch (err) {
            toast.error(err.message || "Failed to initiate payment.");
        } finally {
            setPaying(false);
        }
    };

    const handleCancel = async () => {
        setCancelling(true);
        try {
            await cancelBookingRequest(id);
            toast.success("Booking request cancelled.");
            fetchDetail();
        } catch (err) {
            toast.error(err.message || "Failed to cancel.");
        } finally {
            setCancelling(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    if (loading) {
        return (
            <Box className="booking-detail-page" display="flex" justifyContent="center" py={8}>
                <CircularProgress />
            </Box>
        );
    }

    if (!detail) {
        return (
            <Box className="booking-detail-page" textAlign="center" py={8}>
                <Typography variant="h6" color="text.secondary">
                    Booking request not found.
                </Typography>
                <SecondaryButton sx={{ mt: 2 }} onClick={() => navigate("/booking-requests")}>
                    Back to list
                </SecondaryButton>
            </Box>
        );
    }

    const isExternal = detail.type === BOOKING_REQUEST_TYPE.EXTERNAL;
    const isPending = detail.status === BOOKING_REQUEST_STATUS.PENDING;

    return (
        <Box className="booking-detail-page">
            {/* Back button */}
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
                <IconButton onClick={() => navigate("/booking-requests")} size="small">
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h5" fontWeight={700}>
                    Booking Request Detail
                </Typography>
            </Stack>

            {/* Main info card */}
            <div className="booking-detail-card">
                <div className="detail-header">
                    <div>
                        <Typography variant="h6" fontWeight={700}>
                            {isExternal ? "External Booking" : "JD Multi-Round Interview"}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            Created {formatDate(detail.createdAt)}
                        </Typography>
                    </div>
                    <StatusChip
                        label={BOOKING_REQUEST_STATUS_LABELS[detail.status] || "Unknown"}
                        color={STATUS_COLOR_MAP[detail.status] || "default"}
                    />
                </div>

                <div className="detail-grid">
                    <div className="detail-item">
                        <span className="detail-label">Candidate</span>
                        <span className="detail-value">{detail.candidateName || "—"}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Coach</span>
                        <span className="detail-value">{detail.coachName || "—"}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Type</span>
                        <span className="detail-value">{BOOKING_REQUEST_TYPE_LABELS[detail.type] || "—"}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Total Amount</span>
                        <span className="detail-value" style={{ color: "#4F46E5", fontWeight: 700 }}>
                            {detail.totalAmount?.toLocaleString()} ₫
                        </span>
                    </div>

                    {detail.aimLevel !== null && detail.aimLevel !== undefined && (
                        <div className="detail-item">
                            <span className="detail-label">Aim Level</span>
                            <span className="detail-value">{AIM_LEVEL_LABELS[detail.aimLevel] || "—"}</span>
                        </div>
                    )}

                    {isExternal && detail.interviewTypeName && (
                        <div className="detail-item">
                            <span className="detail-label">Interview Type</span>
                            <span className="detail-value">{detail.interviewTypeName}</span>
                        </div>
                    )}

                    {isExternal && detail.requestedStartTime && (
                        <div className="detail-item">
                            <span className="detail-label">Requested Start Time</span>
                            <span className="detail-value">{formatDate(detail.requestedStartTime)}</span>
                        </div>
                    )}

                    {isExternal && detail.serviceDurationMinutes && (
                        <div className="detail-item">
                            <span className="detail-label">Duration</span>
                            <span className="detail-value">{detail.serviceDurationMinutes} min</span>
                        </div>
                    )}

                    {detail.expiresAt && (
                        <div className="detail-item">
                            <span className="detail-label">Expires At</span>
                            <span className="detail-value">{formatDate(detail.expiresAt)}</span>
                        </div>
                    )}

                    {detail.respondedAt && (
                        <div className="detail-item">
                            <span className="detail-label">Responded At</span>
                            <span className="detail-value">{formatDate(detail.respondedAt)}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* JD/CV links for Flow C */}
            {!isExternal && (detail.jobDescriptionUrl || detail.cvUrl) && (
                <div className="booking-detail-card">
                    <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                        Documents
                    </Typography>
                    <Stack spacing={1.5}>
                        {detail.jobDescriptionUrl && (
                            <Stack direction="row" spacing={1} alignItems="center">
                                <LinkIcon fontSize="small" sx={{ color: "#64748b" }} />
                                <Typography variant="body2">
                                    <a
                                        href={detail.jobDescriptionUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ color: "#4F46E5", textDecoration: "none" }}
                                    >
                                        Job Description
                                    </a>
                                </Typography>
                            </Stack>
                        )}
                        {detail.cvUrl && (
                            <Stack direction="row" spacing={1} alignItems="center">
                                <LinkIcon fontSize="small" sx={{ color: "#64748b" }} />
                                <Typography variant="body2">
                                    <a
                                        href={detail.cvUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ color: "#4F46E5", textDecoration: "none" }}
                                    >
                                        Candidate CV
                                    </a>
                                </Typography>
                            </Stack>
                        )}
                    </Stack>
                </div>
            )}

            {/* Rounds (Flow C) */}
            {detail.rounds && detail.rounds.length > 0 && (
                <div className="booking-detail-card">
                    <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                        Interview Rounds ({detail.rounds.length})
                    </Typography>
                    <div className="booking-rounds-list">
                        {detail.rounds.map((round) => (
                            <div key={round.id} className="booking-round-card">
                                <div className="round-info">
                                    <div className="round-title">
                                        Round {round.roundNumber}: {round.interviewTypeName || "Interview"}
                                        {round.isCoding && (
                                            <StatusChip
                                                label="Coding"
                                                color="success"
                                                sx={{ ml: 1 }}
                                            />
                                        )}
                                    </div>
                                    <div className="round-meta">
                                        {formatDate(round.startTime)} — {formatDate(round.endTime)}
                                    </div>
                                </div>
                                <div className="round-price">{round.price?.toLocaleString()} ₫</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Rejection reason */}
            {detail.status === BOOKING_REQUEST_STATUS.REJECTED && detail.rejectionReason && (
                <div className="booking-detail-card">
                    <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1, color: "#b91c1c" }}>
                        Rejection Reason
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#64748b" }}>
                        {detail.rejectionReason}
                    </Typography>
                </div>
            )}

            {/* Coach actions */}
            {isCoach && isPending && (
                <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                    <PrimaryButton onClick={handleAccept} loading={responding}>
                        Accept Request
                    </PrimaryButton>
                    <DangerButton disabled={responding} onClick={() => setRejectOpen(true)}>
                        Reject
                    </DangerButton>
                </Stack>
            )}

            {/* Candidate actions */}
            {!isCoach && (
                <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                    {/* Pay button — only when status is Accepted */}
                    {detail.status === BOOKING_REQUEST_STATUS.ACCEPTED && (
                        <PrimaryButton loading={paying} onClick={handlePay} startIcon={<PaymentIcon />}>
                            {`Pay ${detail.totalAmount?.toLocaleString()} ₫`}
                        </PrimaryButton>
                    )}

                    {/* Cancel button — when Pending or Accepted */}
                    {(detail.status === BOOKING_REQUEST_STATUS.PENDING ||
                        detail.status === BOOKING_REQUEST_STATUS.ACCEPTED) && (
                            <DangerButton loading={cancelling} onClick={handleCancel} startIcon={<CancelIcon />}>
                                Cancel Request
                            </DangerButton>
                        )}
                </Stack>
            )}

            {/* Reject dialog */}
            <Dialog
                open={rejectOpen}
                onClose={() => setRejectOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: dialogStyles.paper }}
            >
                <DialogTitle
                    sx={{
                        fontWeight: 700,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    Reject Booking Request
                    <IconButton onClick={() => setRejectOpen(false)} size="small" sx={{ color: "#6b7280" }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ mb: 2, color: "#64748b" }}>
                        Please provide a reason for rejecting this booking request.
                    </Typography>
                    <FormTextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Rejection Reason"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="e.g., Schedule conflict, not available at that time..."
                        inputProps={{ maxLength: 500 }}
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <SecondaryButton onClick={() => setRejectOpen(false)} disabled={responding}>
                        Cancel
                    </SecondaryButton>
                    <DangerButton onClick={handleReject} loading={responding}>
                        Confirm Reject
                    </DangerButton>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
