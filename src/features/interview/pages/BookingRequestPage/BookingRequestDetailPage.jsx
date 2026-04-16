import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    getBookingRequestDetail,
    respondToBookingRequest,
    payBookingRequest,
    cancelBookingRequest,
    cancelInterviewRound,
} from "../../services/bookingRequestApi";
import {
    BOOKING_REQUEST_STATUS,
    BOOKING_REQUEST_STATUS_LABELS,
    BOOKING_REQUEST_TYPE,
    AIM_LEVEL_LABELS,
    INTERVIEW_ROUND_STATUS,
} from "../../../../common/constants/status";
import useUser from "../../../../common/hooks/useUser";
import { ROLES } from "../../../../common/constants/common";
import {
    Box,
    Typography,
    Stack,
    CircularProgress,
    IconButton,
    Grid,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LinkIcon from "@mui/icons-material/Link";
import CloseIcon from "@mui/icons-material/Close";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import AssignmentIcon from "@mui/icons-material/Assignment";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import toast from "react-hot-toast";
import SessionResultSection from "./components/SessionResultSection";
import FormTextField from "../../../../common/components/form/FormTextField";
import { SecondaryButton, DangerButton } from "../../../../common/components/buttons";
import { dialogStyles } from "../../../../common/constants/uiStyles";
import { CvDialog } from "../../../../features/profiles/components/CvDialog";
import "./BookingRequestPage.css";
import { trackInitiatePayment, trackCreateBooking, trackServiceUsed } from "../../../../utils/analytics";

// UI Helper: Detail Item matching the premium style
const DetailItem = ({ label, value, statusBadge, color }) => (
    <Box>
        <Typography
            variant="caption"
            color="#94a3b8"
            fontWeight={700}
            sx={{ letterSpacing: "0.08em", display: "block", mb: 1.5, fontSize: "0.75rem" }}
        >
            {label}
        </Typography>
        {statusBadge ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <FiberManualRecordIcon sx={{ fontSize: 10, color: color || "#22c55e" }} />
                <Typography variant="body1" fontWeight={800} color="#111827">
                    {value}
                </Typography>
            </Box>
        ) : (
            <Typography
                variant="body1"
                fontWeight={800}
                color={color || "#0f172a"}
                sx={{ fontSize: "1.05rem", lineHeight: 1.15 }}
            >
                {value || "—"}
            </Typography>
        )}
    </Box>
);

const SectionCard = ({ title, icon: Icon, children, sx }) => (
    <Box sx={{ bgcolor: "white", p: 5, borderRadius: "24px", border: "1px solid #f1f5f9", mb: 1, ...sx }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
            {Icon && (
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: "#111827",
                        color: "white",
                        borderRadius: "50%",
                        p: 0.5,
                    }}
                >
                    <Icon sx={{ fontSize: 20 }} />
                </Box>
            )}
            <Typography variant="h6" fontWeight={900} color="#111827" sx={{ letterSpacing: "-0.01em" }}>
                {title}
            </Typography>
        </Stack>
        {children}
    </Box>
);

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
    const [cancellingRoundId, setCancellingRoundId] = useState(null);

    // Reject dialog state
    const [rejectOpen, setRejectOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");

    // Cancel round dialog state
    const [cancelRoundTarget, setCancelRoundTarget] = useState(null); // { id, roundNumber }
    const [documentDialog, setDocumentDialog] = useState({ open: false, title: "", url: "" });

    const openDocumentDialog = (title, url) => {
        if (!url) return;
        setDocumentDialog({ open: true, title, url });
    };

    useEffect(() => {
        if (id) fetchDetail();
    }, [id]);

    // Poll for status update after returning from payment gateway
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const hasPaymentReturn = params.has("orderCode") || params.has("status");
        if (!hasPaymentReturn || !detail || detail.status !== BOOKING_REQUEST_STATUS.PENDING) return;

        const interval = setInterval(async () => {
            try {
                const data = await getBookingRequestDetail(id);
                if (data.status !== BOOKING_REQUEST_STATUS.PENDING) {
                    setDetail(data);
                    clearInterval(interval);
                    // Clean up URL params
                    window.history.replaceState({}, "", window.location.pathname);
                }
            } catch { /* ignore polling errors */ }
        }, 3000);

        // Stop polling after 60 seconds
        const timeout = setTimeout(() => clearInterval(interval), 60000);

        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
    }, [id, detail?.status]);

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

    const getTotalDurationMinutes = (booking) => {
        if (!booking || !Array.isArray(booking.rounds) || booking.rounds.length === 0) return 0;
        return booking.rounds.reduce((sum, r) => {
            try {
                const s = r.startTime ? new Date(r.startTime).getTime() : NaN;
                const e = r.endTime ? new Date(r.endTime).getTime() : NaN;
                if (Number.isNaN(s) || Number.isNaN(e) || e <= s) return sum;
                return sum + Math.round((e - s) / 60000);
            } catch {
                return sum;
            }
        }, 0);
    };

    const formatDurationLabel = (minutes) => {
        if (!minutes) return "0 Minutes";
        const hrs = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hrs > 0) {
            return mins > 0 ? `${hrs} hr ${mins} min` : `${hrs} hr`;
        }
        return `${mins} Minutes`;
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
            try {
                trackInitiatePayment(id, detail?.totalAmount ?? null);
            } catch (err) {
                console.warn("trackInitiatePayment failed", err);
            }
            const returnUrl = `${window.location.origin}/booking-requests/${id}`;
            const result = await payBookingRequest(id, { returnUrl });
            if (result?.checkOutUrl) {
                window.location.href = result.checkOutUrl;
            } else {
                toast.success("Payment completed!");
                try {
                    const coachId = detail?.coachId ?? detail?.coach?.id ?? detail?.coachUserId ?? null;
                    const serviceId = detail?.serviceId ?? detail?.interviewTypeId ?? detail?.interviewType?.id ?? null;
                    trackCreateBooking(id, coachId, serviceId, detail?.totalAmount ?? null);
                    try {
                        // Also mark the service as used by this booking
                        trackServiceUsed(serviceId, id, coachId, detail?.totalAmount ?? null);
                    } catch (e) {}
                } catch (err) {
                    console.warn("trackCreateBooking failed", err);
                }
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

    const handleCancelRound = async () => {
        if (!cancelRoundTarget) return;
        setCancellingRoundId(cancelRoundTarget.id);
        try {
            await cancelInterviewRound(id, cancelRoundTarget.id);
            toast.success(`Round ${cancelRoundTarget.roundNumber} cancelled.`);
            setCancelRoundTarget(null);
            fetchDetail();
        } catch (err) {
            toast.error(err.message || "Failed to cancel round.");
        } finally {
            setCancellingRoundId(null);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
                <CircularProgress size={40} sx={{ color: "#bef264" }} />
            </Box>
        );
    }

    if (!detail) {
        return (
            <Box sx={{ textAlign: "center", py: 10 }}>
                <Typography variant="h5" color="text.secondary">
                    Booking request not found.
                </Typography>
                <SecondaryButton sx={{ mt: 4 }} onClick={() => navigate("/booking-requests")}>
                    Back to list
                </SecondaryButton>
            </Box>
        );
    }

    const isPaid = detail.status === BOOKING_REQUEST_STATUS.ACCEPTED;
    const isPending = detail.status === BOOKING_REQUEST_STATUS.PENDING;
    const isAccepted = detail.status === BOOKING_REQUEST_STATUS.ACCEPTED;
    const hasCompletedInterview = (detail.rounds || []).some(
        (round) => String(round?.interviewRoomStatus || "").toUpperCase() === "COMPLETED",
    );
    const isPendingApproval = detail.status === BOOKING_REQUEST_STATUS.PendingForApprovalAfterPayment;

    return (
        <Box sx={{ minHeight: "100vh", pt: 3, pb: 6, px: { xs: 3, md: 4 } }}>
            <Box className="booking-detail-page" sx={{ maxWidth: 1200, mx: "auto", width: "100%" }}>
                {/* NAVIGATION & TOP ACTIONS */}
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                        <IconButton
                            onClick={() => navigate("/booking-requests")}
                            sx={{
                                bgcolor: "white",
                                border: "1px solid #f1f5f9",
                                "&:hover": { bgcolor: "#f1f5f9" },
                                p: 1,
                            }}
                        >
                            <ArrowBackIosNewIcon sx={{ fontSize: 14, color: "#111827" }} />
                        </IconButton>
                        <Box>
                            <Typography
                                variant="caption"
                                color="#94a3b8"
                                fontWeight={700}
                                sx={{ letterSpacing: "0.05em" }}
                            >
                                RETURN TO LIST
                            </Typography>
                        </Box>
                    </Stack>

                    {/* Primary Action Context Dependent */}
                    <Stack direction="row" spacing={2}>
                        {isCoach && isPaid && !hasCompletedInterview && (
                            <>
                                <SecondaryButton
                                    onClick={handleAccept}
                                    loading={responding}
                                    sx={{
                                        borderRadius: "14px",
                                        px: 4,
                                        bgcolor: "#bef264",
                                        color: "#111827",
                                        border: "none",
                                        "&:hover": { bgcolor: "#a3e635" },
                                    }}
                                >
                                    Accept Request
                                </SecondaryButton>
                                <DangerButton onClick={() => setRejectOpen(true)} sx={{ borderRadius: "14px", px: 3 }}>
                                    Reject
                                </DangerButton>
                            </>
                        )}

                        {!isCoach && !hasCompletedInterview && (
                            <>
                                {isPending && (
                                    <SecondaryButton
                                        onClick={handlePay}
                                        loading={paying}
                                        sx={{
                                            borderRadius: "14px",
                                            px: 4,
                                            bgcolor: "#bef264",
                                            color: "#111827",
                                            border: "none",
                                            "&:hover": { bgcolor: "#a3e635" },
                                        }}
                                    >
                                        Pay {detail.totalAmount?.toLocaleString()} ₫
                                    </SecondaryButton>
                                )}
                                {(isPending || isAccepted) && (
                                    <DangerButton
                                        onClick={handleCancel}
                                        loading={cancelling}
                                        sx={{ borderRadius: "14px", px: 3 }}
                                    >
                                        Cancel Request
                                    </DangerButton>
                                )}
                            </>
                        )}

                        {/* {isAccepted && (
                            <SecondaryButton
                                onClick={() => navigate("/home")}
                                sx={{
                                    borderRadius: "28px",
                                    px: 4,
                                    py: 1.1,
                                    fontWeight: 900,
                                    border: "none",
                                }}
                            >
                                Schedule Follow-up
                            </SecondaryButton>
                        )} */}
                    </Stack>
                </Stack>

                {/* PAGE TITLE */}
                <Box sx={{ mb: 3 }}>
                    <Typography
                        fontWeight={900}
                        color="#0f172a"
                        sx={{
                            letterSpacing: "-0.03em",
                            fontSize: { xs: "2.2rem", md: "3rem" },
                            lineHeight: 1.1,
                            mb: 1,
                            fontFamily: '"Outfit", "Plus Jakarta Sans", sans-serif',
                        }}
                    >
                        {isAccepted ? "Interview Results" : "Booking Details"}
                    </Typography>
                    <Typography
                        variant="h6"
                        color="#475569"
                        fontWeight={700}
                        sx={{ fontSize: "1.15rem", opacity: 0.9 }}
                    >
                        {"Session: "}
                        {detail.interviewTypeName ||
                            (detail.type === BOOKING_REQUEST_TYPE.EXTERNAL ? "External Session" : "JD Interview")}
                    </Typography>
                </Box>

                {/* CONTENT STACK — vertical alignment of all major blocks */}
                <Stack spacing={1.5}>
                    {/* Session Details — always full width */}
                    <SectionCard title="Session Details" icon={InfoOutlinedIcon} sx={{ mb: 0, p: 4 }}>
                        <Stack direction="row" justifyContent="space-between" sx={{ flexWrap: "wrap", gap: 3 }}>
                            <Box sx={{ flex: "1 1 auto", minWidth: "150px" }}>
                                <DetailItem label="CANDIDATE" value={detail.candidateName} />
                            </Box>
                            <Box sx={{ flex: "1 1 auto", minWidth: "150px" }}>
                                <DetailItem label="COACH" value={detail.coachName} />
                            </Box>
                            <Box sx={{ flex: "1 1 auto", minWidth: "180px" }}>
                                <DetailItem
                                    label="SERVICE"
                                    value={
                                        detail.interviewTypeName ||
                                        (detail.type === BOOKING_REQUEST_TYPE.EXTERNAL
                                            ? "External Session"
                                            : "JD Interview")
                                    }
                                />
                            </Box>
                            <Box sx={{ flex: "1 1 auto", minWidth: "120px" }}>
                                <DetailItem
                                    label="TOTAL DURATION"
                                    value={formatDurationLabel(getTotalDurationMinutes(detail))}
                                />
                            </Box>
                            {detail.rounds?.length === 1 && (
                                <Box sx={{ flex: "1 1 auto", minWidth: "200px" }}>
                                    <DetailItem
                                        label="START TIME (LOCAL TIME)"
                                        value={new Date(detail.rounds?.[0].startTime).toLocaleString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    />
                                </Box>
                            )}
                            {detail.rounds?.length > 0 && (
                                <Box sx={{ flex: "1 1 auto", minWidth: "100px" }}>
                                    <DetailItem label="ROUNDS" value={`${detail.rounds.length} rounds`} />
                                </Box>
                            )}
                        </Stack>
                    </SectionCard>

                    {/* Documents — compact horizontal bar below Session Details */}
                    {(detail.jobDescriptionUrl?.length > 4 || detail.cvUrl?.length > 4) && (
                        <Box
                            sx={{
                                bgcolor: "white",
                                borderRadius: "16px",
                                border: "1px solid #f1f5f9",
                                px: 3,
                                py: 2,
                                display: "flex",
                                alignItems: "center",
                                gap: 2,
                                flexWrap: "wrap",
                            }}
                        >
                            <Stack direction="row" spacing={1} alignItems="center">
                                <LinkIcon sx={{ fontSize: 15, color: "#94a3b8" }} />
                                <Typography
                                    variant="caption"
                                    color="#94a3b8"
                                    fontWeight={700}
                                    sx={{ letterSpacing: "0.08em", textTransform: "uppercase", fontSize: "0.68rem" }}
                                >
                                    Documents
                                </Typography>
                            </Stack>
                            {detail.jobDescriptionUrl?.length > 4 && (
                                <Box
                                    sx={{
                                        px: 2,
                                        py: 0.75,
                                        borderRadius: "8px",
                                        bgcolor: "#f8fafc",
                                        border: "1px solid #f1f5f9",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1.5,
                                        cursor: "pointer",
                                        "&:hover": { bgcolor: "#f1f5f9" },
                                    }}
                                    onClick={() => openDocumentDialog("Job Description", detail.jobDescriptionUrl)}
                                >
                                    <Typography variant="body2" fontWeight={700} color="#0f172a">
                                        Job Description
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: "#4F46E5", fontWeight: 800 }}>
                                        VIEW ↗
                                    </Typography>
                                </Box>
                            )}
                            {detail.cvUrl?.length > 4 && (
                                <Box
                                    sx={{
                                        px: 2,
                                        py: 0.75,
                                        borderRadius: "8px",
                                        bgcolor: "#f8fafc",
                                        border: "1px solid #f1f5f9",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1.5,
                                        cursor: "pointer",
                                        "&:hover": { bgcolor: "#f1f5f9" },
                                    }}
                                    onClick={() => openDocumentDialog("Candidate CV", detail.cvUrl)}
                                >
                                    <Typography variant="body2" fontWeight={700} color="#0f172a">
                                        Candidate CV
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: "#4F46E5", fontWeight: 800 }}>
                                        VIEW ↗
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    )}

                    {/* Interview Rounds — show overview for multi-round sessions */}
                    {detail.rounds?.length > 1 && (
                        <SectionCard title="Interview Rounds" icon={AssignmentIcon} sx={{ mb: 0, p: 4 }}>
                            <Grid container spacing={3} alignItems="stretch">
                                {detail.rounds.map((r, i) => {
                                    const isCancelled = r.status === INTERVIEW_ROUND_STATUS.CANCELLED;
                                    const canCancelRound =
                                        !isCoach && isAccepted && !isCancelled && r.interviewRoomStatus === "Scheduled";
                                    const roundDurationMinutes =
                                        r.startTime && r.endTime
                                            ? Math.round(
                                                  (new Date(r.endTime).getTime() - new Date(r.startTime).getTime()) /
                                                      60000,
                                              )
                                            : 0;
                                    return (
                                        <Grid item key={i} sx={{ display: "flex" }}>
                                            <Box
                                                sx={{
                                                    p: 4,
                                                    borderRadius: "24px",
                                                    bgcolor: isCancelled ? "#f8fafc" : "white",
                                                    border: `1px solid ${isCancelled ? "#e2e8f0" : "#f1f5f9"}`,
                                                    width: "340px",
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    flexShrink: 0,
                                                    position: "relative",
                                                    opacity: isCancelled ? 0.65 : 1,
                                                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                                    boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
                                                    ...(!isCancelled && {
                                                        "&:hover": {
                                                            boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
                                                            transform: "translateY(-4px)",
                                                            borderColor: "#bef264",
                                                        },
                                                    }),
                                                }}
                                            >
                                                {/* Top identifier */}
                                                <Stack
                                                    direction="row"
                                                    justifyContent="space-between"
                                                    alignItems="flex-start"
                                                    sx={{ mb: 3 }}
                                                >
                                                    <Box>
                                                        <Typography
                                                            variant="caption"
                                                            color="#94a3b8"
                                                            fontWeight={800}
                                                            sx={{ letterSpacing: "0.1em", display: "block", mb: 0.5 }}
                                                        >
                                                            ROUND
                                                        </Typography>
                                                        <Typography
                                                            variant="h4"
                                                            fontWeight={900}
                                                            color="#0f172a"
                                                            sx={{ lineHeight: 1 }}
                                                        >
                                                            {String(r.roundNumber).padStart(2, "0")}
                                                        </Typography>
                                                    </Box>
                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                        {isCancelled && (
                                                            <Box
                                                                sx={{
                                                                    py: 0.6,
                                                                    px: 2,
                                                                    borderRadius: "12px",
                                                                    bgcolor: "#fef2f2",
                                                                    border: "1px solid #fecaca",
                                                                }}
                                                            >
                                                                <Typography
                                                                    variant="caption"
                                                                    sx={{
                                                                        color: "#ef4444",
                                                                        fontWeight: 900,
                                                                        fontSize: "0.7rem",
                                                                        letterSpacing: "0.05em",
                                                                    }}
                                                                >
                                                                    CANCELLED
                                                                </Typography>
                                                            </Box>
                                                        )}
                                                        <Box
                                                            sx={{
                                                                py: 0.6,
                                                                px: 2,
                                                                borderRadius: "12px",
                                                                bgcolor: "#0f172a",
                                                                border: "1px solid #1e293b",
                                                            }}
                                                        >
                                                            <Typography
                                                                variant="caption"
                                                                sx={{
                                                                    color: "#bef264",
                                                                    fontWeight: 900,
                                                                    fontSize: "0.7rem",
                                                                    letterSpacing: "0.05em",
                                                                }}
                                                            >
                                                                {r.isCoding ? "TECHNICAL" : "GENERAL"}
                                                            </Typography>
                                                        </Box>
                                                    </Stack>
                                                </Stack>

                                                <Box sx={{ mb: 4 }}>
                                                    <Typography
                                                        variant="h6"
                                                        fontWeight={800}
                                                        color="#0f172a"
                                                        sx={{ mb: 1, lineHeight: 1.2 }}
                                                    >
                                                        {r.interviewTypeName}
                                                    </Typography>
                                                    <Stack spacing={1}>
                                                        <Typography
                                                            variant="body2"
                                                            color="#64748b"
                                                            fontWeight={600}
                                                            sx={{ display: "flex", alignItems: "center", gap: 1 }}
                                                        >
                                                            <AccessTimeIcon sx={{ fontSize: 16, color: "#94a3b8" }} />
                                                            {new Date(r.startTime).toLocaleString("en-US", {
                                                                day: "numeric",
                                                                month: "short",
                                                                hour: "2-digit",
                                                                minute: "2-digit",
                                                            })}
                                                            {roundDurationMinutes > 0 && (
                                                                <span
                                                                    style={{
                                                                        marginLeft: 8,
                                                                        color: "#64748b",
                                                                        fontWeight: 600,
                                                                    }}
                                                                >
                                                                    • {formatDurationLabel(roundDurationMinutes)}
                                                                </span>
                                                            )}
                                                        </Typography>
                                                        {/* <Typography
                                                            variant="body2"
                                                            color="#64748b"
                                                            fontWeight={600}
                                                            sx={{ display: "flex", alignItems: "center", gap: 1 }}
                                                        >
                                                            <AssignmentIcon sx={{ fontSize: 16, color: "#94a3b8" }} />
                                                            {r.isCoding
                                                                ? "Coding Workspace included"
                                                                : "Question set focused"}
                                                        </Typography> */}
                                                    </Stack>
                                                </Box>

                                                <Box
                                                    sx={{
                                                        mt: "auto",
                                                        pt: 3,
                                                        borderTop: "1px dashed #e2e8f0",
                                                        display: "flex",
                                                        justifyContent: "space-between",
                                                        alignItems: "center",
                                                    }}
                                                >
                                                    <Typography variant="body2" color="#94a3b8" fontWeight={700}>
                                                        Session Price
                                                    </Typography>
                                                    <Typography variant="h6" fontWeight={900} color="#0f172a">
                                                        {r.price?.toLocaleString()} ₫
                                                    </Typography>
                                                </Box>

                                                {canCancelRound && (
                                                    <Box sx={{ mt: 2 }}>
                                                        <DangerButton
                                                            fullWidth
                                                            loading={cancellingRoundId === r.id}
                                                            onClick={() =>
                                                                setCancelRoundTarget({
                                                                    id: r.id,
                                                                    roundNumber: r.roundNumber,
                                                                })
                                                            }
                                                            sx={{ borderRadius: "12px", py: 1 }}
                                                        >
                                                            Cancel Round
                                                        </DangerButton>
                                                    </Box>
                                                )}
                                            </Box>
                                        </Grid>
                                    );
                                })}
                            </Grid>
                        </SectionCard>
                    )}

                    {/* Results Section (only if Paid) */}
                    {isAccepted && (
                        <Box sx={{ mt: 1 }}>
                            {/* SessionResultSection handles its own internal grid of results */}
                            <SessionResultSection bookingRequest={detail} />
                        </Box>
                    )}

                    {/* Rejection context */}
                    {detail.status === BOOKING_REQUEST_STATUS.REJECTED && detail.rejectionReason && (
                        <SectionCard
                            title="Rejection Reason"
                            icon={CloseIcon}
                            sx={{ bgcolor: "#fff1f2", border: "1px solid #fecdd3", p: 4 }}
                        >
                            <Typography variant="body1" color="#991b1b" fontWeight={500}>
                                {detail.rejectionReason}
                            </Typography>
                        </SectionCard>
                    )}
                </Stack>
            </Box>

            {/* CANCEL ROUND DIALOG */}
            <Dialog
                open={!!cancelRoundTarget}
                onClose={() => setCancelRoundTarget(null)}
                PaperProps={{ sx: { ...dialogStyles.paper, borderRadius: "32px" } }}
            >
                <DialogTitle sx={{ fontWeight: 900, px: 4, pt: 4 }}>
                    Cancel Round {cancelRoundTarget?.roundNumber}
                </DialogTitle>
                <DialogContent sx={{ px: 4 }}>
                    <Typography variant="body2" color="#64748b">
                        Are you sure you want to cancel Round {cancelRoundTarget?.roundNumber}? A partial refund will be
                        calculated based on the time remaining before the session.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 4, pb: 4 }}>
                    <SecondaryButton onClick={() => setCancelRoundTarget(null)}>Keep Round</SecondaryButton>
                    <DangerButton onClick={handleCancelRound} loading={!!cancellingRoundId}>
                        Confirm Cancel
                    </DangerButton>
                </DialogActions>
            </Dialog>

            {/* REJECT DIALOG */}
            <Dialog
                open={rejectOpen}
                onClose={() => setRejectOpen(false)}
                PaperProps={{ sx: { ...dialogStyles.paper, borderRadius: "32px" } }}
            >
                <DialogTitle sx={{ fontWeight: 900, px: 4, pt: 4 }}>Reject Request</DialogTitle>
                <DialogContent sx={{ px: 4 }}>
                    <Typography variant="body2" color="#64748b" sx={{ mb: 3 }}>
                        Please explain why you cannot accept this session.
                    </Typography>
                    <FormTextField
                        fullWidth
                        multiline
                        rows={4}
                        label="Reason"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="e.g., I have a prior commitment at this time..."
                    />
                </DialogContent>
                <DialogActions sx={{ px: 4, pb: 4 }}>
                    <SecondaryButton onClick={() => setRejectOpen(false)}>Cancel</SecondaryButton>
                    <DangerButton onClick={handleReject} loading={responding}>
                        Confirm Reject
                    </DangerButton>
                </DialogActions>
            </Dialog>

            <CvDialog
                open={documentDialog.open}
                onClose={() => setDocumentDialog({ open: false, title: "", url: "" })}
                url={documentDialog.url}
                title={documentDialog.title || "Document Viewer"}
            />
        </Box>
    );
}
