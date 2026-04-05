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
    AIM_LEVEL_LABELS,
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
import './BookingRequestPage.css';

// UI Helper: Detail Item matching the premium style
const DetailItem = ({ label, value, statusBadge, color }) => (
    <Box>
        <Typography variant="caption" color="#94a3b8" fontWeight={700} sx={{ letterSpacing: '0.08em', display: 'block', mb: 1.5, fontSize: '0.75rem' }}>
            {label}
        </Typography>
        {statusBadge ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FiberManualRecordIcon sx={{ fontSize: 10, color: color || '#22c55e' }} />
                <Typography variant="body1" fontWeight={800} color="#111827">
                    {value}
                </Typography>
            </Box>
        ) : (
            <Typography variant="body1" fontWeight={800} color={color || "#0f172a"} sx={{ fontSize: '1.05rem', lineHeight: 1.15 }}>
                {value || '—'}
            </Typography>
        )}
    </Box>
);

const SectionCard = ({ title, icon: Icon, children, sx }) => (
    <Box sx={{ bgcolor: 'white', p: 5, borderRadius: '24px', border: '1px solid #f1f5f9', mb: 1, ...sx }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
            {Icon && (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#111827', color: 'white', borderRadius: '50%', p: 0.5 }}>
                    <Icon sx={{ fontSize: 20 }} />
                </Box>
            )}
            <Typography variant="h6" fontWeight={900} color="#111827" sx={{ letterSpacing: '-0.01em' }}>{title}</Typography>
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
            const returnUrl = `${window.location.origin}/booking-requests/${id}`;
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

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress size={40} sx={{ color: '#bef264' }} />
            </Box>
        );
    }

    if (!detail) {
        return (
            <Box sx={{ textAlign: 'center', py: 10 }}>
                <Typography variant="h5" color="text.secondary">Booking request not found.</Typography>
                <SecondaryButton sx={{ mt: 4 }} onClick={() => navigate("/booking-requests")}>Back to list</SecondaryButton>
            </Box>
        );
    }

    const isPaid = detail.status === BOOKING_REQUEST_STATUS.PAID;
    const isPending = detail.status === BOOKING_REQUEST_STATUS.PENDING;
    const isAccepted = detail.status === BOOKING_REQUEST_STATUS.ACCEPTED;

    return (
        <Box sx={{ minHeight: '100vh', pt: 3, pb: 6, px: { xs: 3, md: 4 } }}>
            <Box className="booking-detail-page" sx={{ maxWidth: 1200, mx: 'auto', width: '100%' }}>
                {/* NAVIGATION & TOP ACTIONS */}
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                        <IconButton
                            onClick={() => navigate("/booking-requests")}
                            sx={{
                                bgcolor: 'white', border: '1px solid #f1f5f9',
                                '&:hover': { bgcolor: '#f1f5f9' }, p: 1
                            }}
                        >
                            <ArrowBackIosNewIcon sx={{ fontSize: 14, color: '#111827' }} />
                        </IconButton>
                        <Box>
                            <Typography variant="caption" color="#94a3b8" fontWeight={700} sx={{ letterSpacing: '0.05em' }}>RETURN TO LIST</Typography>
                        </Box>
                    </Stack>

                    {/* Primary Action Context Dependent */}
                    <Stack direction="row" spacing={2}>
                        {isCoach && isPending && (
                            <>
                                <SecondaryButton
                                    onClick={handleAccept}
                                    loading={responding}
                                    sx={{ borderRadius: '14px', px: 4, bgcolor: '#bef264', color: '#111827', border: 'none', '&:hover': { bgcolor: '#a3e635' } }}
                                >
                                    Accept Request
                                </SecondaryButton>
                                <DangerButton onClick={() => setRejectOpen(true)} sx={{ borderRadius: '14px', px: 3 }}>
                                    Reject
                                </DangerButton>
                            </>
                        )}

                        {!isCoach && (
                            <>
                                {isAccepted && (
                                    <SecondaryButton
                                        onClick={handlePay}
                                        loading={paying}
                                        sx={{ borderRadius: '14px', px: 4, bgcolor: '#bef264', color: '#111827', border: 'none', '&:hover': { bgcolor: '#a3e635' } }}
                                    >
                                        Pay {detail.totalAmount?.toLocaleString()} ₫
                                    </SecondaryButton>
                                )}
                                {(isPending || isAccepted) && (
                                    <DangerButton onClick={handleCancel} loading={cancelling} sx={{ borderRadius: '14px', px: 3 }}>
                                        Cancel Request
                                    </DangerButton>
                                )}
                            </>
                        )}

                        {isPaid && (
                            <SecondaryButton
                                onClick={() => navigate("/home")}
                                sx={{ borderRadius: '28px', px: 4, py: 1.1, bgcolor: '#bef264', color: '#0f172a', fontWeight: 900, border: 'none', boxShadow: '0 8px 24px rgba(190,242,100,0.12)', '&:hover': { bgcolor: '#a3e635' } }}
                            >
                                Schedule Follow-up
                            </SecondaryButton>
                        )}
                    </Stack>
                </Stack>

                {/* PAGE TITLE */}
                <Box sx={{ mb: 3 }}>
                    <Typography fontWeight={900} color="#0f172a" sx={{ letterSpacing: '-0.03em', fontSize: { xs: '2.2rem', md: '3rem' }, lineHeight: 1.1, mb: 1, fontFamily: '"Outfit", "Plus Jakarta Sans", sans-serif' }}>
                        {isPaid ? 'Interview Results' : 'Booking Details'}
                    </Typography>
                    <Typography variant="h6" color="#475569" fontWeight={700} sx={{ fontSize: '1.15rem', opacity: 0.9 }}>
                        {'Session: '}{detail.interviewTypeName || (detail.type === BOOKING_REQUEST_TYPE.EXTERNAL ? 'External Session' : 'JD Interview')}{' — '}{new Date(detail.requestedStartTime || detail.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </Typography>
                </Box>

                {/* CONTENT STACK — vertical alignment of all major blocks */}
                <Stack spacing={1.5}>

                    {/* Session Details — always full width */}
                    <SectionCard title="Session Details" icon={InfoOutlinedIcon} sx={{ mb: 0, p: 4 }}>
                        <Stack direction="row" justifyContent="space-between" sx={{ flexWrap: 'wrap', gap: 3 }}>
                            <Box sx={{ flex: '1 1 auto', minWidth: '150px' }}>
                                <DetailItem label="CANDIDATE" value={detail.candidateName} />
                            </Box>
                            <Box sx={{ flex: '1 1 auto', minWidth: '150px' }}>
                                <DetailItem label="COACH" value={detail.coachName} />
                            </Box>
                            <Box sx={{ flex: '1 1 auto', minWidth: '180px' }}>
                                <DetailItem label="SERVICE" value={detail.interviewTypeName || (detail.type === BOOKING_REQUEST_TYPE.EXTERNAL ? 'External Session' : 'JD Interview')} />
                            </Box>
                            <Box sx={{ flex: '1 1 auto', minWidth: '120px' }}>
                                <DetailItem label="DURATION" value="45 Minutes" />
                            </Box>
                            <Box sx={{ flex: '1 1 auto', minWidth: '200px' }}>
                                <DetailItem label="START TIME (LOCAL TIME)" value={new Date(detail.requestedStartTime || detail.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })} />
                            </Box>
                            {detail.rounds?.length > 0 && (
                                <Box sx={{ flex: '1 1 auto', minWidth: '100px' }}>
                                    <DetailItem label="ROUNDS" value={`${detail.rounds.length} rounds`} />
                                </Box>
                            )}
                        </Stack>
                    </SectionCard>

                    {/* Documents — compact horizontal bar below Session Details */}
                    {(detail.jobDescriptionUrl?.length > 4 || detail.cvUrl?.length > 4) && (
                        <Box sx={{ bgcolor: 'white', borderRadius: '16px', border: '1px solid #f1f5f9', px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <LinkIcon sx={{ fontSize: 15, color: '#94a3b8' }} />
                                <Typography variant="caption" color="#94a3b8" fontWeight={700} sx={{ letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '0.68rem' }}>
                                    Documents
                                </Typography>
                            </Stack>
                            {detail.jobDescriptionUrl?.length > 4 && (
                                <Box sx={{ px: 2, py: 0.75, borderRadius: '8px', bgcolor: '#f8fafc', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer', '&:hover': { bgcolor: '#f1f5f9' } }} onClick={() => window.open(detail.jobDescriptionUrl, '_blank')}>
                                    <Typography variant="body2" fontWeight={700} color="#0f172a">Job Description</Typography>
                                    <Typography variant="caption" sx={{ color: '#4F46E5', fontWeight: 800 }}>VIEW ↗</Typography>
                                </Box>
                            )}
                            {detail.cvUrl?.length > 4 && (
                                <Box sx={{ px: 2, py: 0.75, borderRadius: '8px', bgcolor: '#f8fafc', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer', '&:hover': { bgcolor: '#f1f5f9' } }} onClick={() => window.open(detail.cvUrl, '_blank')}>
                                    <Typography variant="body2" fontWeight={700} color="#0f172a">Candidate CV</Typography>
                                    <Typography variant="caption" sx={{ color: '#4F46E5', fontWeight: 800 }}>VIEW ↗</Typography>
                                </Box>
                            )}
                        </Box>
                    )}

                    {/* Interview Rounds — show overview for multi-round sessions */}
                    {detail.rounds?.length > 1 && (
                        <SectionCard title="Interview Rounds" icon={AssignmentIcon} sx={{ mb: 0, p: 4 }}>
                            <Grid container spacing={3} alignItems="stretch">
                                {detail.rounds.map((r, i) => (
                                    <Grid item key={i} sx={{ display: 'flex' }}>
                                        <Box sx={{
                                            p: 4, borderRadius: '24px',
                                            bgcolor: 'white',
                                            border: '1px solid #f1f5f9',
                                            width: '340px', // Rigged width for consistency
                                            display: 'flex', flexDirection: 'column',
                                            flexShrink: 0,
                                            position: 'relative',
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                                            '&:hover': {
                                                boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
                                                transform: 'translateY(-4px)',
                                                borderColor: '#bef264'
                                            }
                                        }}>
                                            {/* Top identifier */}
                                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
                                                <Box>
                                                    <Typography variant="caption" color="#94a3b8" fontWeight={800} sx={{ letterSpacing: '0.1em', display: 'block', mb: 0.5 }}>ROUND</Typography>
                                                    <Typography variant="h4" fontWeight={900} color="#0f172a" sx={{ lineHeight: 1 }}>
                                                        {String(r.roundNumber).padStart(2, '0')}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ py: 0.6, px: 2, borderRadius: '12px', bgcolor: '#0f172a', border: '1px solid #1e293b' }}>
                                                    <Typography variant="caption" sx={{ color: '#bef264', fontWeight: 900, fontSize: '0.7rem', letterSpacing: '0.05em' }}>
                                                        {r.isCoding ? 'TECHNICAL' : 'GENERAL'}
                                                    </Typography>
                                                </Box>
                                            </Stack>

                                            <Box sx={{ mb: 4 }}>
                                                <Typography variant="h6" fontWeight={800} color="#0f172a" sx={{ mb: 1, lineHeight: 1.2 }}>
                                                    {r.interviewTypeName}
                                                </Typography>
                                                <Stack spacing={1}>
                                                    <Typography variant="body2" color="#64748b" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <AccessTimeIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
                                                        {new Date(r.startTime).toLocaleString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                    </Typography>
                                                    <Typography variant="body2" color="#64748b" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <AssignmentIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
                                                        {r.isCoding ? 'Coding Workspace included' : 'Question set focused'}
                                                    </Typography>
                                                </Stack>
                                            </Box>

                                            <Box sx={{ mt: 'auto', pt: 3, borderTop: '1px dashed #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Typography variant="body2" color="#94a3b8" fontWeight={700}>Session Price</Typography>
                                                <Typography variant="h6" fontWeight={900} color="#0f172a">
                                                    {r.price?.toLocaleString()} ₫
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Grid>
                                ))}
                            </Grid>
                        </SectionCard>
                    )}

                    {/* Results Section (only if Paid) */}
                    {isPaid && (
                        <Box sx={{ mt: 1 }}>
                            {/* SessionResultSection handles its own internal grid of results */}
                            <SessionResultSection bookingRequest={detail} />
                        </Box>
                    )}

                    {/* Rejection context */}
                    {detail.status === BOOKING_REQUEST_STATUS.REJECTED && detail.rejectionReason && (
                        <SectionCard title="Rejection Reason" icon={CloseIcon} sx={{ bgcolor: '#fff1f2', border: '1px solid #fecdd3', p: 4 }}>
                            <Typography variant="body1" color="#991b1b" fontWeight={500}>{detail.rejectionReason}</Typography>
                        </SectionCard>
                    )}
                </Stack>
            </Box>

            {/* REJECT DIALOG */}
            <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)} PaperProps={{ sx: { ...dialogStyles.paper, borderRadius: '32px' } }}>
                <DialogTitle sx={{ fontWeight: 900, px: 4, pt: 4 }}>Reject Request</DialogTitle>
                <DialogContent sx={{ px: 4 }}>
                    <Typography variant="body2" color="#64748b" sx={{ mb: 3 }}>Please explain why you cannot accept this session.</Typography>
                    <FormTextField
                        fullWidth multiline rows={4}
                        label="Reason" value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="e.g., I have a prior commitment at this time..."
                    />
                </DialogContent>
                <DialogActions sx={{ px: 4, pb: 4 }}>
                    <SecondaryButton onClick={() => setRejectOpen(false)}>Cancel</SecondaryButton>
                    <DangerButton onClick={handleReject} loading={responding}>Confirm Reject</DangerButton>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
