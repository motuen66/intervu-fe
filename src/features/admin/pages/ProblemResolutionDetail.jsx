import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ReplayIcon from "@mui/icons-material/Replay";
import toast from "react-hot-toast";
import { callApi } from "../../../common/utils/apiConnector";
import { METHOD } from "../../../common/constants/api";
import { PrimaryButton } from "../../../common/components/buttons";
import StatusChip from "../../../common/components/StatusChip";
import { adminEndPoints } from "../services/adminApi";

// TODO: load real BOOKING INFO
// Load finance status

const statusLabels = {
    0: "Pending",
    1: "Resolved",
    2: "Rejected",
};

const statusColors = {
    0: "warning",
    1: "success",
    2: "error",
};

const reportTypeLabels = {
    0: "Other",
    1: "Audio/Video Issue",
    2: "Candidate Behavior",
    3: "Interviewer Behavior",
};

const resolutionOptions = ["Refund", "Dismiss", "Reschedule"];

const formatDateTime = (value) => {
    if (!value) return "N/A";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "N/A";
    return `${date.toLocaleDateString("vi-VN")} ${date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    })}`;
};

const parseBoolean = (value) => {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value === 1;
    if (typeof value === "string") return value.toLowerCase() === "true";
    return false;
};

const DetailRow = ({ label, value }) => (
    <Box
        sx={{
            display: "flex",
            justifyContent: "space-between",
            gap: 2,
            py: 1,
            borderBottom: "1px solid",
            borderColor: "divider",
        }}
    >
        <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 600 }}>
            {label}
        </Typography>
        <Typography variant="body2" sx={{ color: "text.primary", fontWeight: 600, textAlign: "right" }}>
            {value || "N/A"}
        </Typography>
    </Box>
);

const SectionCard = ({ title, children, action }) => (
    <Card variant="outlined" sx={{ borderColor: "divider", bgcolor: "background.paper", borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: "text.primary" }}>
                    {title}
                </Typography>
                {action}
            </Box>
            {children}
        </CardContent>
    </Card>
);

function ProblemResolutionDetail() {
    const { roomId: routeRoomId } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const [reportDetail, setReportDetail] = useState(null);
    const [auditLogs, setAuditLogs] = useState([]);
    const [confirmOpen, setConfirmOpen] = useState(false);

    const [resolutionType, setResolutionType] = useState("Refund");
    const [refundAmount, setRefundAmount] = useState("");
    const [internalNote, setInternalNote] = useState("");
    const [userMessage, setUserMessage] = useState("");

    const loadDetail = useCallback(async () => {
        if (!routeRoomId) {
            setErrorMessage("Missing room id");
            setLoading(false);
            return;
        }

        setLoading(true);
        setErrorMessage("");

        try {
            const [reportResponse, logsResponse] = await Promise.all([
                callApi({
                    method: METHOD.GET,
                    endpoint: adminEndPoints.GET_ROOM_REPORTS,
                    arg: {
                        page: 1,
                        pageSize: 100,
                        search: routeRoomId,
                    },
                }),
                callApi({
                    method: METHOD.GET,
                    endpoint: adminEndPoints.GET_ROOM_AUDIT_LOGS(routeRoomId),
                }),
            ]);

            const reportItems = reportResponse?.data?.items || [];
            const matchedReport =
                reportItems.find((item) => String(item?.interviewRoomId) === String(routeRoomId)) ||
                reportItems.find((item) => String(item?.roomId) === String(routeRoomId)) ||
                null;

            const normalized = matchedReport
                ? {
                      reportId:
                          matchedReport.id ||
                          matchedReport.reportId ||
                          matchedReport.reportID ||
                          matchedReport.reportUuid ||
                          null,
                      roomId: matchedReport.interviewRoomId || matchedReport.roomId || routeRoomId,
                      reporterName: matchedReport.reporterName || matchedReport.reporter?.fullName || "Unknown",
                      category: reportTypeLabels[matchedReport.reportType] || matchedReport.reason || "Other",
                      description: matchedReport.content || matchedReport.details || "N/A",
                      expectTo:
                          matchedReport.expectTo ||
                          matchedReport.expectedTo ||
                          matchedReport.resolution ||
                          matchedReport.requestedResolution ||
                          "N/A",
                      createdAt: matchedReport.createdAt,
                      status: matchedReport.status ?? 0,
                      booking: {
                          coachName:
                              matchedReport.coachName ||
                              matchedReport.interviewerName ||
                              matchedReport.interviewer?.fullName ||
                              "N/A",
                          candidateName: matchedReport.candidateName || matchedReport.candidate?.fullName || "N/A",
                          serviceName:
                              matchedReport.serviceName ||
                              matchedReport.typeName ||
                              matchedReport.interviewType ||
                              "N/A",
                          originalTime: formatDateTime(
                              matchedReport.originalTime || matchedReport.scheduledTime || matchedReport.startTime,
                          ),
                      },
                      financial: {
                          paymentStatus: matchedReport.paymentStatus || "Unknown",
                          payOsCode:
                              matchedReport.payOsCode ||
                              matchedReport.payosCode ||
                              matchedReport.payOsTransactionCode ||
                              "N/A",
                          payoutLocked: parseBoolean(
                              matchedReport.payoutLocked ||
                                  matchedReport.isPayoutLocked ||
                                  matchedReport.payoutProcessed,
                          ),
                      },
                  }
                : null;

            setReportDetail(normalized);
            setAuditLogs(logsResponse?.data?.items || []);

            if (!normalized) {
                setErrorMessage("No report details found for this room");
            }
        } catch (error) {
            setErrorMessage(error?.message || "Failed to load report details");
        } finally {
            setLoading(false);
        }
    }, [routeRoomId]);

    useEffect(() => {
        loadDetail();
    }, [loadDetail]);

    const resolvePayload = useMemo(() => {
        const parsedRefund = Number(refundAmount);
        const safeRefundAmount = Number.isNaN(parsedRefund) ? 0 : Math.max(0, parsedRefund);

        const status = resolutionType === "Dismiss" ? 2 : 1;
        let refundOption = 0;
        if (resolutionType === "Refund") {
            if (safeRefundAmount >= 100) refundOption = 100;
            else if (safeRefundAmount > 0) refundOption = 50;
        }

        return {
            RoomId: routeRoomId,
            roomId: routeRoomId,
            ReportId: reportDetail?.reportId,
            reportId: reportDetail?.reportId,
            status,
            Status: status,
            refundOption,
            RefundOption: refundOption,
            refundAmount: safeRefundAmount,
            RefundAmount: safeRefundAmount,
            adminNote: internalNote || "Resolution submitted from Admin Panel",
            AdminNote: internalNote || "Resolution submitted from Admin Panel",
            userMessage,
            UserMessage: userMessage,
            resolutionType,
            ResolutionType: resolutionType,
        };
    }, [refundAmount, resolutionType, routeRoomId, reportDetail?.reportId, internalNote, userMessage]);

    const handleExecuteResolution = async () => {
        setSubmitting(true);
        try {
            const response = await callApi({
                method: METHOD.POST,
                endpoint: adminEndPoints.RESOLVE_ROOM_REPORT,
                arg: resolvePayload,
                displaySuccessMessage: true,
            });

            if (!response?.success) {
                throw new Error(response?.message || "Execute resolution failed");
            }

            setConfirmOpen(false);
            await loadDetail();
        } catch (error) {
            toast.error(error?.message || "Failed to execute resolution");
        } finally {
            setSubmitting(false);
        }
    };

    const isResolvedOrRejected = reportDetail?.status === 1 || reportDetail?.status === 2;
    const isRefundDisabled = resolutionType !== "Refund";

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
                <Box>
                    <Button
                        startIcon={<ArrowBackIcon />}
                        onClick={() => navigate(-1)}
                        sx={{ mb: 1, textTransform: "none", color: "text.secondary" }}
                    >
                        Back
                    </Button>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: "text.primary" }}>
                        Problem Resolution Detail
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                        Room ID: {routeRoomId}
                    </Typography>
                </Box>

                <PrimaryButton startIcon={<ReplayIcon />} onClick={loadDetail} loading={loading}>
                    Refresh
                </PrimaryButton>
            </Stack>

            {errorMessage && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {errorMessage}
                </Alert>
            )}

            {loading ? (
                <Box
                    sx={{
                        minHeight: 280,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: "background.paper",
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 3,
                    }}
                >
                    <CircularProgress />
                </Box>
            ) : (
                <Grid container spacing={3}>
                    <Grid item xs={12} md={7}>
                        <Stack spacing={3}>
                            <SectionCard title="Complaint Details">
                                <DetailRow label="Reporter" value={reportDetail?.reporterName} />
                                <DetailRow label="Category" value={reportDetail?.category} />
                                <DetailRow label="Description" value={reportDetail?.description} />
                                <DetailRow label="Expect to" value={reportDetail?.expectTo} />
                                <Box
                                    sx={{
                                        pt: 1.5,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                    }}
                                >
                                    <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 600 }}>
                                        Current Status
                                    </Typography>
                                    <StatusChip
                                        label={statusLabels[reportDetail?.status ?? 0]}
                                        color={statusColors[reportDetail?.status ?? 0]}
                                    />
                                </Box>
                            </SectionCard>

                            <SectionCard title="Room Audit Log">
                                <TableContainer
                                    sx={{
                                        border: "1px solid",
                                        borderColor: "divider",
                                        borderRadius: 2,
                                        maxHeight: 380,
                                    }}
                                >
                                    <Table stickyHeader size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ bgcolor: "background.default", fontWeight: 700 }}>
                                                    Event
                                                </TableCell>
                                                <TableCell sx={{ bgcolor: "background.default", fontWeight: 700 }}>
                                                    Actor
                                                </TableCell>
                                                <TableCell sx={{ bgcolor: "background.default", fontWeight: 700 }}>
                                                    Role
                                                </TableCell>
                                                <TableCell sx={{ bgcolor: "background.default", fontWeight: 700 }}>
                                                    Timestamp
                                                </TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {auditLogs.length > 0 ? (
                                                auditLogs.map((log) => (
                                                    <TableRow key={log.id} hover>
                                                        <TableCell>{log.message || "N/A"}</TableCell>
                                                        <TableCell>{log.userName || "System"}</TableCell>
                                                        <TableCell>{log.roleName || log.role || "N/A"}</TableCell>
                                                        <TableCell>{formatDateTime(log.timestamp)}</TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell
                                                        colSpan={4}
                                                        sx={{ py: 4, textAlign: "center", color: "text.secondary" }}
                                                    >
                                                        No audit logs available.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </SectionCard>
                        </Stack>
                    </Grid>

                    <Grid item xs={12} md={5}>
                        <Stack spacing={3}>
                            <SectionCard title="Booking Context">
                                <DetailRow label="Coach" value={reportDetail?.booking?.coachName} />
                                <DetailRow label="Candidate" value={reportDetail?.booking?.candidateName} />
                                <DetailRow label="Service" value={reportDetail?.booking?.serviceName} />
                                <DetailRow label="Original Time" value={reportDetail?.booking?.originalTime} />
                            </SectionCard>

                            <SectionCard title="Financial Status">
                                {reportDetail?.financial?.payoutLocked && (
                                    <Alert severity="warning" sx={{ mb: 2 }}>
                                        Payout already processed. Refund-related actions may be blocked by backend
                                        policy.
                                    </Alert>
                                )}
                                <DetailRow label="Payment Status" value={reportDetail?.financial?.paymentStatus} />
                                <DetailRow label="PayOS Code" value={reportDetail?.financial?.payOsCode} />
                                <DetailRow
                                    label="Payout Lock"
                                    value={reportDetail?.financial?.payoutLocked ? "Processed/Locked" : "Not Processed"}
                                />
                            </SectionCard>
                        </Stack>
                    </Grid>

                    <Grid item xs={12}>
                        <SectionCard title="Resolution Panel">
                            <Grid container spacing={2.5}>
                                <Grid item xs={12} md={4}>
                                    <FormControl fullWidth>
                                        <InputLabel id="resolution-type-label">Resolution Type</InputLabel>
                                        <Select
                                            labelId="resolution-type-label"
                                            label="Resolution Type"
                                            value={resolutionType}
                                            onChange={(e) => setResolutionType(e.target.value)}
                                            disabled={isResolvedOrRejected || submitting}
                                        >
                                            {resolutionOptions.map((option) => (
                                                <MenuItem key={option} value={option}>
                                                    {option}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>

                                <Grid item xs={12} md={4}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Refund Amount"
                                        value={refundAmount}
                                        onChange={(e) => setRefundAmount(e.target.value)}
                                        disabled={isRefundDisabled || isResolvedOrRejected || submitting}
                                        inputProps={{ min: 0 }}
                                        helperText={
                                            isRefundDisabled
                                                ? "Only enabled for Refund type"
                                                : "Amount used to infer refund option"
                                        }
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={3}
                                        label="Internal Note"
                                        value={internalNote}
                                        onChange={(e) => setInternalNote(e.target.value)}
                                        disabled={isResolvedOrRejected || submitting}
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={3}
                                        label="User Message"
                                        value={userMessage}
                                        onChange={(e) => setUserMessage(e.target.value)}
                                        disabled={isResolvedOrRejected || submitting}
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                                        <PrimaryButton
                                            onClick={() => setConfirmOpen(true)}
                                            disabled={isResolvedOrRejected || submitting || !reportDetail}
                                        >
                                            Execute Resolution
                                        </PrimaryButton>
                                    </Box>
                                </Grid>
                            </Grid>
                        </SectionCard>
                    </Grid>
                </Grid>
            )}

            <Dialog
                open={confirmOpen}
                onClose={() => (submitting ? null : setConfirmOpen(false))}
                fullWidth
                maxWidth="sm"
            >
                <DialogTitle>Confirm Resolution Execution</DialogTitle>
                <DialogContent>
                    <Stack spacing={1.25} sx={{ mt: 1 }}>
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                            Please confirm this action before applying resolution to the room report.
                        </Typography>
                        <Typography variant="body2">
                            <strong>Resolution Type:</strong> {resolutionType}
                        </Typography>
                        <Typography variant="body2">
                            <strong>Refund Amount:</strong> {refundAmount || 0}
                        </Typography>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2.5 }}>
                    <Button onClick={() => setConfirmOpen(false)} disabled={submitting}>
                        Cancel
                    </Button>
                    <PrimaryButton onClick={handleExecuteResolution} loading={submitting}>
                        Confirm & Execute
                    </PrimaryButton>
                </DialogActions>
            </Dialog>
        </Container>
    );
}

export default ProblemResolutionDetail;
