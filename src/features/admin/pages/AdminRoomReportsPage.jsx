import { useEffect, useMemo, useState } from "react";
import {
    Box,
    Container,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    Tooltip,
    Radio,
    RadioGroup,
    FormControlLabel,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import HistoryIcon from "@mui/icons-material/History";
import RefreshIcon from "@mui/icons-material/Refresh";
import PolicyIcon from "@mui/icons-material/Policy";
import VisibilityIcon from "@mui/icons-material/Visibility";
import toast from "react-hot-toast";

import AdminPageHeader from "../../../common/components/admin/AdminPageHeader";
import SearchInput from "../../../common/components/inputs/SearchInput";
import FilterDropdown from "../../../common/components/inputs/FilterDropdown";
import TableActionsMenu from "../../../common/components/table/TableActionsMenu";
import DataTable from "../../../common/components/table/DataTable";
import StatusChip from "../../../common/components/StatusChip";
import { PrimaryButton, SecondaryButton, DangerButton } from "../../../common/components/buttons";
import FormTextField from "../../../common/components/form/FormTextField";
import useTableState from "../../../hooks/useTableState";

import { callApi } from "../../../common/utils/apiConnector";
import { METHOD } from "../../../common/constants/api";
import { adminEndPoints } from "../services/adminApi";
import { dialogStyles } from "../../../common/constants/uiStyles";
import "./AdminDashboard.css";

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

export const AdminRoomReportsPage = () => {
    const navigate = useNavigate();

    const {
        data: reports, setData: setReports,
        loading, setLoading,
        page, setPage,
        pageSize, setPageSize,
        totalItems, setTotalItems,
        handlePageChange, handlePageSizeChange
    } = useTableState(10);

    const [selectedRoomId, setSelectedRoomId] = useState(null);
    const [selectedReportId, setSelectedReportId] = useState(null);
    
    // Audit log dialog
    const [auditLogDialogOpen, setAuditLogDialogOpen] = useState(false);
    const [auditLogs, setAuditLogs] = useState([]);
    const [loadingLogs, setLoadingLogs] = useState(false);
    
    // Resolve dialog
    const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
    const [refundOption, setRefundOption] = useState(0);
    const [adminNote, setAdminNote] = useState("");
    const [isResolving, setIsResolving] = useState(false);

    // Filters
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    useEffect(() => {
        fetchReports();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, pageSize, searchTerm, statusFilter]);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const params = [`page=${page + 1}`, `pageSize=${pageSize}`];
            if (statusFilter && statusFilter !== "all") {
                params.push(`status=${encodeURIComponent(statusFilter)}`);
            }
            if (searchTerm) {
                params.push(`search=${encodeURIComponent(searchTerm)}`);
            }

            const response = await callApi({
                method: METHOD.GET,
                endpoint: `${adminEndPoints.GET_ROOM_REPORTS}?${params.join("&")}`,
                useGlobalLoading: false,
            });
            if (response?.success) {
                setReports(response.data?.items || []);
                setTotalItems(response.data?.totalItems || response.data?.items?.length || 0);
            }
        } catch (error) {
            toast.error("Failed to load room reports");
        } finally {
            setLoading(false);
        }
    };

    const fetchAuditLogs = async (roomId) => {
        setLoadingLogs(true);
        try {
            const response = await callApi({
                method: METHOD.GET,
                endpoint: adminEndPoints.GET_ROOM_AUDIT_LOGS(roomId),
                useGlobalLoading: false,
            });
            if (response?.success) {
                setAuditLogs(response.data?.items || []);
            }
        } catch (error) {
            toast.error("Failed to load audit logs");
        } finally {
            setLoadingLogs(false);
        }
    };

    const handleResolveReport = async (reportId, status, refund = 0, note = "") => {
        if (!reportId) {
            toast.error("Missing report id");
            return;
        }

        setIsResolving(true);
        try {
            const response = await callApi({
                method: METHOD.POST,
                endpoint: adminEndPoints.RESOLVE_ROOM_REPORT,
                arg: {
                    ReportId: reportId,
                    reportId: reportId,
                    status,
                    adminNote: note || "Updated status via Admin Panel",
                    refundOption: refund,
                },
                displaySuccessMessage: true,
            });
            if (response?.success) {
                setAuditLogDialogOpen(false);
                setResolveDialogOpen(false);
                fetchReports();
            }
        } catch (error) {
            toast.error(error.message || "Failed to update report status");
        } finally {
            setIsResolving(false);
        }
    };

    const handleViewAuditLog = (report) => {
        const id = report?.id || report?.reportId;
        setSelectedReportId(id);
        setSelectedRoomId(report.interviewRoomId);
        setAuditLogDialogOpen(true);
        fetchAuditLogs(report.interviewRoomId);
    };

    const handleSearchChange = (val) => {
        setSearchTerm(val);
        setPage(0);
    };

    const handleStatusFilterChange = (val) => {
        setStatusFilter(val);
        setPage(0);
    };

    const statusOptions = [
        { label: 'Pending Review', value: "0" },
        { label: 'Marked Resolved', value: "1" },
        { label: 'Marked Rejected', value: "2" }
    ];

    const columns = useMemo(() => [
        {
            field: "reporterName",
            headerName: "Reporter",
            render: (val, row) => (
                <Typography sx={{ fontWeight: 600, color: "text.primary", fontSize: "12px" }}>
                    {val || row.reporter?.fullName || "System"}
                </Typography>
            ),
            width: 200,
        },
        {
            field: "reportType",
            headerName: "Type",
            render: (val, row) => {
                const label = reportTypeLabels[val] || row.reason || "Unknown";
                return (
                    <Typography
                        sx={{
                            fontWeight: 600, color: "text.secondary", fontSize: "11px",
                            bgcolor: "action.hover", px: 1, py: 0.2, borderRadius: "4px",
                            display: "inline-block", border: "1px solid", borderColor: "divider",
                            textTransform: "uppercase", letterSpacing: "0.02em",
                        }}
                    >
                        {label}
                    </Typography>
                );
            },
            width: 160,
        },
        {
            field: "content",
            headerName: "Content",
            render: (val, row) => (
                <Tooltip title={val || row.details || "N/A"}>
                    <Typography sx={{ fontSize: "12px", color: "text.secondary", maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {val || row.details || "N/A"}
                    </Typography>
                </Tooltip>
            ),
            width: 320,
        },
        {
            field: "status",
            headerName: "Status",
            render: (val) => <StatusChip label={statusLabels[val]} color={statusColors[val]} />,
            width: 130,
        },
        {
            field: "createdAt",
            headerName: "Date Reported",
            render: (val) => (
                <Box>
                    <Typography sx={{ fontSize: "12px", color: "text.primary", fontWeight: 500 }}>
                        {new Date(val).toLocaleDateString("vi-VN")}
                    </Typography>
                </Box>
            ),
            width: 160,
        },
        {
            field: "actions",
            headerName: "Actions",
            render: (_, row) => {
                const roomId = row?.interviewRoomId || row?.roomId;
                const id = row?.id || row?.reportId || row?.reportID;
                const actions = [
                    {
                        label: 'Resolution Detail',
                        icon: <VisibilityIcon fontSize="small" color="info" />,
                        onClick: () => {
                            if (!roomId) toast.error("Missing room id");
                            else navigate(`/admin/reports/room/${roomId}`);
                        }
                    },
                    {
                        label: 'Investigate Console',
                        icon: <PolicyIcon fontSize="small" sx={{ color: "primary.main" }} />,
                        onClick: () => handleViewAuditLog(row)
                    }
                ];
                return <Box sx={{ display: "flex", justifyContent: "center" }}><TableActionsMenu actions={actions} /></Box>;
            },
            width: 100,
        },
    ], [navigate]);

    return (
        <Container maxWidth="xl" sx={{ py: 3 }} className="admin-page">
            <AdminPageHeader 
                title="Room Reports"  // AdminPageHeader styling
                subtitle="Monitor and investigate environmental audit logs for reported interview rooms."
                actionButton={
                    <PrimaryButton startIcon={<RefreshIcon />} onClick={fetchReports}>
                        Refresh
                    </PrimaryButton>
                }
            />

            <div className="admin-card">
                <Box sx={{ p: 2, borderBottom: '1px solid #E2E8F0', display: 'flex', gap: 2, alignItems: 'center', bgcolor: '#fff' }}>
                    <SearchInput placeholder="Search by reporter or content..." onSearch={handleSearchChange} />
                    <FilterDropdown placeholder="All status" options={statusOptions} value={statusFilter} onChange={handleStatusFilterChange} />
                </Box>

                <DataTable
                    showHeader={false}
                    showIndex
                    actions={false}
                    columns={columns}
                    data={reports}
                    totalItems={totalItems}
                    page={page}
                    pageSize={pageSize}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                    loading={loading}
                />
            </div>

            {/* Audit Log Dialog ... omitted for brevity ... */}
            <Dialog open={auditLogDialogOpen} onClose={() => setAuditLogDialogOpen(false)} fullWidth maxWidth="lg" PaperProps={{ sx: { borderRadius: "24px", overflow: "hidden", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", } }}>
                <DialogTitle sx={{ p: 4, bgcolor: "primary.main", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
                            <PolicyIcon sx={{ fontSize: 20, opacity: 0.8 }} />
                            <Typography sx={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", opacity: 0.7, letterSpacing: "0.1em" }}>Investigation Console</Typography>
                        </Box>
                        <Typography variant="h5" sx={{ fontWeight: 800 }}>Room Audit History</Typography>
                    </Box>
                    <Box sx={{ textAlign: "right" }}>
                        <Typography variant="caption" sx={{ display: "block", opacity: 0.7, fontWeight: 700 }}>SESSION REFERENCE</Typography>
                        <Typography sx={{ fontFamily: "monospace", fontSize: "14px", fontWeight: 700 }}>{selectedRoomId}</Typography>
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ p: 0, bgcolor: "#fff" }}>
                    {loadingLogs ? (
                        <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "450px", gap: 2 }}>
                            <CircularProgress size={40} thickness={5} sx={{ color: "primary.main" }} />
                            <Typography sx={{ color: "text.secondary", fontWeight: 600 }}>Analyzing room telemetry...</Typography>
                        </Box>
                    ) : (
                        <TableContainer sx={{ maxHeight: "550px" }}>
                            <Table stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ bgcolor: "action.hover", color: "text.secondary", fontWeight: 800, fontSize: "11px", py: 2, pl: 4 }}>EVENT</TableCell>
                                        <TableCell sx={{ bgcolor: "action.hover", color: "text.secondary", fontWeight: 800, fontSize: "11px", py: 2 }}>ACTOR</TableCell>
                                        <TableCell sx={{ bgcolor: "action.hover", color: "text.secondary", fontWeight: 800, fontSize: "11px", py: 2, pr: 4, textAlign: "right" }}>TIME</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {auditLogs.length > 0 ? auditLogs.map((log) => {
                                        const getEventStyle = (t) => {
                                            switch (t) {
                                                case 0: return { icon: "🚪", label: "JOIN", color: "#10B981" };
                                                case 1: return { icon: "🏃", label: "LEAVE", color: "#F59E0B" };
                                                case 2: return { icon: "⚠️", label: "DISCONNECT", color: "#EF4444" };
                                                case 3: return { icon: "⚡", label: "CODE", color: "#3B82F6" };
                                                case 4: return { icon: "🌐", label: "LANG", color: "#6366F1" };
                                                case 5: return { icon: "📝", label: "PROB", color: "#8B5CF6" };
                                                case 6: return { icon: "📷", label: "CAM", color: "#EC4899" };
                                                case 7: return { icon: "🎙️", label: "MIC", color: "#06B6D4" };
                                                case 8: return { icon: "🚨", label: "REPORT", color: "#F43F5E" };
                                                default: return { icon: "🔔", label: "EVENT", color: "#64748B" };
                                            }
                                        };
                                        const style = getEventStyle(log.eventType);
                                        return (
                                            <TableRow key={log.id} sx={{ "&:hover": { bgcolor: "action.hover" } }}>
                                                <TableCell sx={{ py: 2.5, pl: 4 }}>
                                                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                                                        <Box sx={{ fontSize: "20px", width: 40, height: 40, borderRadius: "12px", bgcolor: `${style.color}10`, display: "flex", alignItems: "center", justifyContent: "center" }}>{style.icon}</Box>
                                                        <Box>
                                                            <Typography sx={{ fontSize: "14px", color: "text.primary", fontWeight: 700 }}>{log.message}</Typography>
                                                            <Box sx={{ display: "inline-flex", px: 1, py: 0.25, borderRadius: "4px", bgcolor: `${style.color}15`, color: style.color, fontSize: "10px", fontWeight: 800 }}>{style.label}</Box>
                                                        </Box>
                                                    </Box>
                                                </TableCell>
                                                <TableCell><Typography sx={{ fontSize: "13px", fontWeight: 700 }}>{log.userName || "System"}</Typography></TableCell>
                                                <TableCell sx={{ textAlign: "right", pr: 4 }}>
                                                    <Typography sx={{ fontSize: "13px", fontWeight: 600 }}>{new Date(log.timestamp).toLocaleTimeString()}</Typography>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    }) : (
                                        <TableRow><TableCell colSpan={3} sx={{ py: 12, textAlign: "center" }}><HistoryIcon sx={{ fontSize: 56, color: "divider", mb: 1.5 }} /><Typography sx={{ color: "text.disabled", fontWeight: 700 }}>No telemetry data available.</Typography></TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 3, borderTop: "1px solid", borderColor: "divider", bgcolor: "action.hover", justifyContent: "space-between" }}>
                    <SecondaryButton onClick={() => setAuditLogDialogOpen(false)}>Close</SecondaryButton>
                    <Box sx={{ display: "flex", gap: 1.5 }}>
                        <DangerButton onClick={() => handleResolveReport(selectedReportId, 2)}>Mark Irrelevant</DangerButton>
                        <PrimaryButton onClick={() => setResolveDialogOpen(true)}>Resolve Problem</PrimaryButton>
                    </Box>
                </DialogActions>
            </Dialog>

            <Dialog
                open={resolveDialogOpen}
                onClose={() => setResolveDialogOpen(false)}
                PaperProps={{ sx: dialogStyles.paper }}
            >
                <DialogTitle sx={{ fontWeight: 800 }}>Confirm Resolution</DialogTitle>
                <DialogContent>
                    <Typography sx={{ mb: 2, fontSize: "14px", color: "text.secondary" }}>Choose a refund option for the candidate based on your investigation.</Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Refund Amount</Typography>
                    <RadioGroup value={refundOption} onChange={(e) => setRefundOption(Number(e.target.value))}>
                        <FormControlLabel value={0} control={<Radio />} label="No Refund (0%)" />
                        <FormControlLabel value={50} control={<Radio />} label="Partial Refund (50%)" />
                        <FormControlLabel value={100} control={<Radio />} label="Full Refund (100%)" />
                    </RadioGroup>
                    <FormTextField fullWidth multiline rows={3} placeholder="Add admin note..." value={adminNote} onChange={(e) => setAdminNote(e.target.value)} sx={{ mt: 3 }} />
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <SecondaryButton onClick={() => setResolveDialogOpen(false)}>Cancel</SecondaryButton>
                    <PrimaryButton loading={isResolving} onClick={() => handleResolveReport(selectedReportId, 1, refundOption, adminNote)}>Confirm & Resolve</PrimaryButton>
                </DialogActions>
            </Dialog>
        </Container>
    );
};
