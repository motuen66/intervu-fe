import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
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
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LinkIcon from "@mui/icons-material/Link";
import CloseIcon from "@mui/icons-material/Close";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import AssignmentIcon from "@mui/icons-material/Assignment";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import toast from "react-hot-toast";
import axios from "axios";
import SessionResultSection from "./components/SessionResultSection";
import FormTextField from "../../../../common/components/form/FormTextField";
import { PrimaryButton, SecondaryButton, DangerButton } from "../../../../common/components/buttons";
import PageHeader from "../../../../common/components/PageHeader";
import { dialogStyles } from "../../../../common/constants/uiStyles";
import { CvDialog } from "../../../../features/profiles/components/CvDialog";
import { callApi } from "../../../../common/utils/apiConnector";
import { METHOD } from "../../../../common/constants/api";
import { userEndPoints } from "../../../../common/services/userApi";
import CancelInterviewConfirmDialog from "../InterviewRoomListPage/components/CancelInterviewConfirmDialog";
import "./BookingRequestPage.css";
import { trackInitiatePayment, trackCreateBooking, trackServiceUsed } from "../../../../utils/analytics";
import { formatCurrency } from "../../../../common/utils/dateFormatter";
import AppText from "../../../../common/components/AppText";
import SectionHeading from "../../../../common/components/SectionHeading";
import StatusChip from "../../../../common/components/StatusChip";

// UI Helper: Detail Item matching the premium style
const DetailItem = ({ label, value, statusBadge, color }) => (
    <Box>
        <AppText
            variant="overline"
            sx={{ color: "#94a3b8", letterSpacing: "0.08em", display: "block", mb: 1.5, fontSize: "0.75rem" }}
        >
            {label}
        </AppText>
        {statusBadge ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <FiberManualRecordIcon sx={{ fontSize: 10, color: color || "#22c55e" }} />
                <AppText variant="bodyStrong" sx={{ color: "#111827", fontWeight: 600 }}>
                    {value}
                </AppText>
            </Box>
        ) : (
            <AppText
                variant="bodyStrong"
                sx={{ color: color || "#0f172a", fontSize: "1.05rem", lineHeight: 1.15, fontWeight: 600 }}
            >
                {value || "—"}
            </AppText>
        )}
    </Box>
);

const SectionCard = ({ title, icon: Icon, children, sx }) => (
    <Box sx={{ bgcolor: "white", p: 5, borderRadius: "24px", border: "1px solid #f1f5f9", mb: 1, ...sx }}>
        <SectionHeading
            title={title}
            icon={
                Icon ? (
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            bgcolor: "action.hover",
                            color: "text.secondary",
                            borderRadius: "50%",
                            p: 0.5,
                        }}
                    >
                        <Icon sx={{ fontSize: 20 }} />
                    </Box>
                ) : null
            }
            disableGutters
        />
        <Box sx={{ mt: 3 }}>{children}</Box>
    </Box>
);

export default function BookingRequestDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const user = useUser();
    const isCoach = user?.role === ROLES.INTERVIEWER;

    const highlightRoundParam = searchParams.get("round");
    const actionParam = searchParams.get("action");
    const highlightRoundNumber = highlightRoundParam ? Number(highlightRoundParam) : null;
    const shouldHighlightInsights = Number.isInteger(highlightRoundNumber) && highlightRoundNumber > 0;
    const shouldHighlightFeedback = actionParam?.toLowerCase() === "feedback";

    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [responding, setResponding] = useState(false);
    const [paying, setPaying] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [cancellingRoundId, setCancellingRoundId] = useState(null);
    const [cancelRequestConfirmState, setCancelRequestConfirmState] = useState({
        open: false,
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

    // Reject dialog state
    const [rejectOpen, setRejectOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");

    // Cancel round dialog state
    const [cancelRoundConfirmState, setCancelRoundConfirmState] = useState({
        open: false,
        roundId: null,
        roundNumber: null,
        previewRefundPercent: null,
        previewRefundAmount: null,
    });
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
            } catch {
                /* ignore polling errors */
            }
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

    const loadCancelRefundBankInfo = async () => {
        setCancelBankInfoState((prev) => ({
            ...prev,
            loading: true,
            error: "",
        }));

        try {
            const profileResponse = await callApi({
                method: METHOD.GET,
                endpoint: userEndPoints.GET_ME,
                useGlobalLoading: false,
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

    const handleOpenCancelRequestConfirm = async () => {
        let previewRefundPercent = null;
        const now = new Date();
        const startCandidates = (detail?.rounds || [])
            .map((round) => (round?.startTime ? new Date(round.startTime) : null))
            .filter((date) => date && !Number.isNaN(date.getTime()))
            .sort((a, b) => a.getTime() - b.getTime());

        const nearestStartTime =
            startCandidates.find((date) => date.getTime() > now.getTime()) || startCandidates[0] || null;
        if (nearestStartTime) {
            const hoursBeforeInterview = (nearestStartTime.getTime() - now.getTime()) / (1000 * 60 * 60);
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

        const roundsAmount = Array.isArray(detail?.rounds)
            ? detail.rounds.reduce((sum, round) => {
                  const isCancelledRound =
                      String(round?.status || "").toUpperCase() ===
                      String(INTERVIEW_ROUND_STATUS.CANCELLED || "CANCELLED").toUpperCase();

                  if (isCancelledRound) return sum;

                  const price = parseAmount(round?.price);
                  return typeof price === "number" ? sum + price : sum;
              }, 0)
            : null;

        const baseAmount =
            (typeof roundsAmount === "number" && roundsAmount > 0 ? roundsAmount : null) ??
            parseAmount(detail?.totalAmount) ??
            parseAmount(detail?.amount);

        const previewRefundAmount =
            typeof baseAmount === "number" && typeof previewRefundPercent === "number"
                ? Math.max(0, Math.round((baseAmount * previewRefundPercent) / 100))
                : null;

        setCancelRequestConfirmState({
            open: true,
            previewRefundPercent,
            previewRefundAmount,
        });

        await loadCancelRefundBankInfo();
    };

    const handleCloseCancelRequestConfirm = () => {
        setCancelRequestConfirmState({
            open: false,
            previewRefundPercent: null,
            previewRefundAmount: null,
        });

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

    const handleOpenCancelRoundConfirm = async (round) => {
        if (!round?.id) return;

        const parseAmount = (value) => {
            if (typeof value === "number") return value;
            const raw = String(value ?? "")
                .replace(/,/g, "")
                .trim();
            const parsed = Number(raw);
            return Number.isNaN(parsed) ? null : parsed;
        };

        let previewRefundPercent = null;
        const startTime = round?.startTime ? new Date(round.startTime) : null;
        const now = new Date();

        let hoursBeforeInterview = null;
        if (startTime && !Number.isNaN(startTime.getTime())) {
            hoursBeforeInterview = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);
            if (hoursBeforeInterview >= 24) previewRefundPercent = 100;
            else if (hoursBeforeInterview >= 12) previewRefundPercent = 50;
            else previewRefundPercent = 0;
        }



        const baseAmount = parseAmount(round?.price);
        const previewRefundAmount =
            typeof baseAmount === "number" && typeof previewRefundPercent === "number"
                ? Math.max(0, Math.round((baseAmount * previewRefundPercent) / 100))
                : null;

        setCancelRoundConfirmState({
            open: true,
            roundId: round.id,
            roundNumber: round.roundNumber,
            previewRefundPercent,
            previewRefundAmount,
        });

        await loadCancelRefundBankInfo();
    };

    const handleCloseCancelRoundConfirm = () => {
        setCancelRoundConfirmState({
            open: false,
            roundId: null,
            roundNumber: null,
            previewRefundPercent: null,
            previewRefundAmount: null,
        });

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
            handleCloseCancelRequestConfirm();
        }
    };

    const handleCancelRound = async () => {
        if (!cancelRoundConfirmState.roundId) return;
        setCancellingRoundId(cancelRoundConfirmState.roundId);
        try {
            await cancelInterviewRound(id, cancelRoundConfirmState.roundId);
            toast.success(`Round ${cancelRoundConfirmState.roundNumber} cancelled.`);
            handleCloseCancelRoundConfirm();
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
                <AppText variant="bodyStrong" sx={{ color: "text.secondary", fontSize: "1.125rem" }}>
                    Booking request not found.
                </AppText>
                <Box sx={{ mt: 4 }}>
                    <SecondaryButton onClick={() => navigate("/booking-requests")}>Back to list</SecondaryButton>
                </Box>
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
        <>
            <PageHeader
                title={isAccepted ? "Interview Details" : "Booking Details"}
                subtitle={`Session: ${detail.interviewTypeName || (detail.type === BOOKING_REQUEST_TYPE.EXTERNAL ? "External Session" : "JD Interview")}`}
                actions={
                    !isCoach && !hasCompletedInterview ? (
                        <Stack direction="row" spacing={1.5}>
                            {isPending && (
                                <PrimaryButton onClick={handlePay} loading={paying}>
                                    Pay {formatCurrency(detail.totalAmount ?? 0)}
                                </PrimaryButton>
                            )}
                            {(isPending || isAccepted) && (
                                <DangerButton onClick={handleOpenCancelRequestConfirm} loading={cancelling}>
                                    Cancel Request
                                </DangerButton>
                            )}
                        </Stack>
                    ) : null
                }
            />

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

                {(detail.candidateNote || "").trim().length > 0 && (
                    <SectionCard title="Candidate note" icon={AssignmentIcon} sx={{ mb: 0, p: 4 }}>
                        <AppText
                            variant="body"
                            sx={{
                                color: "#334155",
                                whiteSpace: "pre-wrap",
                                lineHeight: 1.65,
                                fontWeight: 500,
                            }}
                        >
                            {detail.candidateNote.trim()}
                        </AppText>
                    </SectionCard>
                )}

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
                            <AppText
                                variant="overline"
                                sx={{ color: "#94a3b8", letterSpacing: "0.08em", fontSize: "0.68rem" }}
                            >
                                Documents
                            </AppText>
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
                                <AppText variant="bodyStrong" sx={{ color: "#0f172a" }}>
                                    Job Description
                                </AppText>
                                <AppText variant="caption" sx={{ color: "#4F46E5", fontWeight: 800 }}>
                                    VIEW ↗
                                </AppText>
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
                                <AppText variant="bodyStrong" sx={{ color: "#0f172a" }}>
                                    Candidate CV
                                </AppText>
                                <AppText variant="caption" sx={{ color: "#4F46E5", fontWeight: 800 }}>
                                    VIEW ↗
                                </AppText>
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
                                              (new Date(r.endTime).getTime() - new Date(r.startTime).getTime()) / 60000,
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
                                                    <AppText
                                                        variant="overline"
                                                        sx={{
                                                            color: "#94a3b8",
                                                            letterSpacing: "0.1em",
                                                            display: "block",
                                                            mb: 0.5,
                                                        }}
                                                    >
                                                        ROUND
                                                    </AppText>
                                                    <AppText
                                                        variant="bodyStrong"
                                                        sx={{
                                                            color: "#0f172a",
                                                            fontSize: "2rem",
                                                            lineHeight: 1,
                                                            fontWeight: 700,
                                                        }}
                                                    >
                                                        {String(r.roundNumber).padStart(2, "0")}
                                                    </AppText>
                                                </Box>
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    {isCancelled && (
                                                        <StatusChip label="Cancelled" color="error" size="sm" />
                                                    )}
                                                    <StatusChip
                                                        label={r.isCoding ? "Technical" : "General"}
                                                        color={r.isCoding ? "info" : "default"}
                                                        size="sm"
                                                    />
                                                </Stack>
                                            </Stack>

                                            <Box sx={{ mb: 4 }}>
                                                <AppText
                                                    variant="bodyStrong"
                                                    sx={{
                                                        color: "#0f172a",
                                                        mb: 1,
                                                        lineHeight: 1.2,
                                                        fontWeight: 600,
                                                        fontSize: "1.125rem",
                                                    }}
                                                >
                                                    {r.interviewTypeName}
                                                </AppText>
                                                <Stack spacing={1}>
                                                    <AppText
                                                        variant="label"
                                                        sx={{
                                                            color: "#64748b",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: 1,
                                                            fontWeight: 600,
                                                        }}
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
                                                    </AppText>
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
                                                <AppText variant="label" sx={{ color: "#94a3b8", fontWeight: 700 }}>
                                                    Session Price
                                                </AppText>
                                                <AppText
                                                    variant="bodyStrong"
                                                    sx={{ color: "#0f172a", fontSize: "1.125rem", fontWeight: 700 }}
                                                >
                                                    {formatCurrency(r.price ?? 0)}
                                                </AppText>
                                            </Box>

                                            {canCancelRound && (
                                                <Box sx={{ mt: 2 }}>
                                                    <DangerButton
                                                        fullWidth
                                                        loading={cancellingRoundId === r.id}
                                                        onClick={() => handleOpenCancelRoundConfirm(r)}
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
                        <SessionResultSection
                            bookingRequest={detail}
                            highlightInsights={shouldHighlightInsights}
                            highlightRoundNumber={highlightRoundNumber}
                            highlightFeedback={shouldHighlightFeedback}
                        />
                    </Box>
                )}

                {/* Rejection context */}
                {detail.status === BOOKING_REQUEST_STATUS.REJECTED && detail.rejectionReason && (
                    <SectionCard
                        title="Rejection Reason"
                        icon={CloseIcon}
                        sx={{ bgcolor: "#fff1f2", border: "1px solid #fecdd3", p: 4 }}
                    >
                        <AppText variant="body" sx={{ color: "#991b1b", fontWeight: 500 }}>
                            {detail.rejectionReason}
                        </AppText>
                    </SectionCard>
                )}
            </Stack>

            <CancelInterviewConfirmDialog
                open={cancelRoundConfirmState.open}
                onClose={handleCloseCancelRoundConfirm}
                onConfirm={handleCancelRound}
                confirmLoading={!!cancellingRoundId}
                previewRefundPercent={cancelRoundConfirmState.previewRefundPercent}
                previewRefundAmount={cancelRoundConfirmState.previewRefundAmount}
                bankInfo={cancelBankInfoState}
                title={`Cancel Round ${cancelRoundConfirmState.roundNumber ?? ""}`.trim()}
                subtitle={`Are you sure you want to cancel round ${cancelRoundConfirmState.roundNumber ?? ""}?`}
                confirmText="Confirm Cancel"
                cancelText="Keep Round"
            />

            <CancelInterviewConfirmDialog
                open={cancelRequestConfirmState.open}
                onClose={handleCloseCancelRequestConfirm}
                onConfirm={handleCancel}
                confirmLoading={cancelling}
                previewRefundPercent={cancelRequestConfirmState.previewRefundPercent}
                previewRefundAmount={cancelRequestConfirmState.previewRefundAmount}
                bankInfo={cancelBankInfoState}
                title="Cancel Booking Request"
                subtitle="Are you sure you want to cancel this booking request?"
                confirmText="Cancel Request"
                cancelText="Keep Request"
            />

            {/* REJECT DIALOG */}
            <Dialog
                open={rejectOpen}
                onClose={() => setRejectOpen(false)}
                PaperProps={{ sx: { ...dialogStyles.paper, borderRadius: "32px" } }}
            >
                <DialogTitle sx={{ fontWeight: 900, px: 4, pt: 4 }}>Reject Request</DialogTitle>
                <DialogContent sx={{ px: 4 }}>
                    <AppText variant="muted" sx={{ color: "#64748b", mb: 3 }}>
                        Please explain why you cannot accept this session.
                    </AppText>
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
        </>
    );
}
