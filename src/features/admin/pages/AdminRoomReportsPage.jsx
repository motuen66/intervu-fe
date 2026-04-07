import { useEffect, useMemo, useState } from "react";
import {
    Box,
    Container,
    Typography,
    Button,
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
    FormControl,
    Select,
    MenuItem,
    IconButton,
    Tooltip,
    alpha,
    ListItemIcon,
    ListItemText,
    Radio,
    RadioGroup,
    FormControlLabel,
    TextField
} from "@mui/material";
import HistoryIcon from "@mui/icons-material/History";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import PolicyIcon from '@mui/icons-material/Policy';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import BlockIcon from '@mui/icons-material/Block';
import toast from "react-hot-toast";
import DataTable from "../components/DataTable";
import StatusChip from "../../../common/components/StatusChip";
import ActionMenu from "../../../common/components/ActionMenu";
import { callApi } from "../../../common/utils/apiConnector";
import { METHOD } from "../../../common/constants/api";
import { adminEndPoints } from "../services/adminApi";
import { PrimaryButton } from "../../../common/components/buttons";
import "./AdminDashboard.css";

const statusLabels = {
    0: "Pending",
    1: "Resolved",
    2: "Rejected"
};

const statusColors = {
    0: "warning",
    1: "success",
    2: "error"
};

const reportTypeLabels = {
    0: "Other",
    1: "Audio/Video Issue",
    2: "Candidate Behavior",
    3: "Interviewer Behavior"
};

const AdminRoomReportsPage = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRoomId, setSelectedRoomId] = useState(null);
    const [selectedReportId, setSelectedReportId] = useState(null);
    const [auditLogDialogOpen, setAuditLogDialogOpen] = useState(false);
    const [auditLogs, setAuditLogs] = useState([]);
    const [loadingLogs, setLoadingLogs] = useState(false);
    const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
    const [actionMenuRow, setActionMenuRow] = useState(null);
    const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
    const [refundOption, setRefundOption] = useState(0);
    const [adminNote, setAdminNote] = useState('');
    const [isResolving, setIsResolving] = useState(false);

    // Pagination
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    // Filters
    const [searchInput, setSearchInput] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchTerm(searchInput.trim());
        }, 400);
        return () => clearTimeout(timer);
    }, [searchInput]);

    useEffect(() => {
        fetchReports();
    }, [page, pageSize, searchTerm, statusFilter]);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const params = [`page=${page + 1}`, `pageSize=${pageSize}`];
            if (statusFilter && statusFilter !== 'all') {
                params.push(`status=${encodeURIComponent(statusFilter)}`);
            }
            if (searchTerm) {
                params.push(`search=${encodeURIComponent(searchTerm)}`);
            }

            const response = await callApi({
                method: METHOD.GET,
                endpoint: `${adminEndPoints.GET_ROOM_REPORTS}?${params.join('&')}`,
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
        setIsResolving(true);
        try {
            const response = await callApi({
                method: METHOD.POST,
                endpoint: adminEndPoints.RESOLVE_ROOM_REPORT,
                arg: {
                    reportId,
                    status,
                    adminNote: note || "Updated status via Admin Panel",
                    refundOption: refund
                }
            });
            if (response?.success) {
                toast.success(`Report marked as ${statusLabels[status]}`);
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
        setSelectedReportId(report.id);
        setSelectedRoomId(report.interviewRoomId);
        setAuditLogDialogOpen(true);
        fetchAuditLogs(report.interviewRoomId);
    };

    const columns = useMemo(() => [
        {
            field: "reporterName",
            headerName: "Reporter",
            render: (val, row) => (
                <Typography sx={{ fontWeight: 600, color: "text.primary", fontSize: '14px' }}>
                    {val || row.reporter?.fullName || "System"}
                </Typography>
            ),
            width: 200
        },
        {
            field: "reportType",
            headerName: "Type",
            render: (val, row) => {
                const label = reportTypeLabels[val] || row.reason || "Unknown";
                return (
                    <Typography sx={{ 
                        fontWeight: 600, color: "text.secondary", fontSize: '11px',
                        bgcolor: 'action.hover', px: 1.2, py: 0.4, borderRadius: '6px',
                        display: 'inline-block', border: '1px solid', borderColor: 'divider',
                        textTransform: 'uppercase', letterSpacing: '0.02em'
                    }}>
                        {label}
                    </Typography>
                );
            },
            width: 160
        },
        {
            field: "content",
            headerName: "Content",
            render: (val, row) => (
                <Tooltip title={val || row.details || "N/A"}>
                    <Typography sx={{ 
                        fontSize: '13px', color: 'text.secondary', maxWidth: '300px',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                    }}>
                        {val || row.details || "N/A"}
                    </Typography>
                </Tooltip>
            ),
            width: 320
        },
        {
            field: "status",
            headerName: "Status",
            render: (val) => (
                <StatusChip
                    label={statusLabels[val]}
                    color={statusColors[val]}
                />
            ),
            width: 130
        },
        {
            field: "createdAt",
            headerName: "Date Reported",
            render: (val) => (
                <Box>
                    <Typography sx={{ fontSize: '13px', color: 'text.primary', fontWeight: 500 }}>
                        {new Date(val).toLocaleDateString("vi-VN")}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {new Date(val).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                </Box>
            ),
            width: 160
        },
        {
            field: "audit",
            headerName: "Audit",
            render: (_, row) => (
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Tooltip title="View audit logs">
                        <IconButton
                            size="small"
                            onClick={() => handleViewAuditLog(row)}
                            sx={{
                                bgcolor: 'action.hover',
                                borderRadius: '10px',
                                height: 32,
                                width: 32,
                                '&:hover': { bgcolor: 'divider' }
                            }}
                        >
                            <HistoryIcon fontSize="small" color="primary" />
                        </IconButton>
                    </Tooltip>
                </Box>
            ),
            width: 100
        },
        {
            field: "actions",
            headerName: "Actions",
            render: (_, row) => (
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <IconButton
                        size="small"
                        onClick={(e) => {
                            setActionMenuAnchor(e.currentTarget);
                            setActionMenuRow(row);
                        }}
                        sx={{ 
                            bgcolor: 'action.hover', 
                            borderRadius: '10px',
                            height: 32, width: 32,
                            '&:hover': { bgcolor: 'divider' }
                        }}
                    >
                        <MoreVertIcon fontSize="small" />
                    </IconButton>
                </Box>
            ),
            width: 100
        }
    ], []);

    const handleCloseMenu = () => {
        setActionMenuAnchor(null);
        setActionMenuRow(null);
    };

    return (
        <Container maxWidth="xl" sx={{ py: 4 }} className="admin-page">
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em', mb: 0.5 }}>
                        Room Reports
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                        Monitor and investigate environmental audit logs for reported interview rooms.
                    </Typography>
                </Box>
            </Box>

            <Box sx={{ p: 0, overflow: 'hidden' }}>
                <Box sx={{ 
                    mb: 2.5,
                    display: 'flex', 
                    gap: 2, 
                    alignItems: 'center', 
                }}>
                    <Box sx={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                        <SearchIcon sx={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'text.disabled', fontSize: 20 }} />
                        <input
                            className="admin-search-input"
                            placeholder="Search by reporter or content..."
                            value={searchInput}
                            onChange={(e) => { setSearchInput(e.target.value); setPage(0); }}
                            style={{
                                paddingLeft: '44px', height: '44px', borderRadius: '12px', fontSize: '14px',
                                width: '100%', border: '1px solid', borderColor: '#E2E8F0', background: '#fff', fontWeight: 500,
                                outline: 'none'
                            }}
                        />
                    </Box>
                    <FormControl size="small" sx={{ minWidth: 180 }}>
                        <Select
                            displayEmpty
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
                            startAdornment={<FilterListIcon sx={{ color: 'text.disabled', mr: 1, fontSize: 18 }} />}
                            sx={{
                                height: 44, borderRadius: '12px', bgcolor: '#fff',
                                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E2E8F0' },
                                fontSize: '14px', fontWeight: 600, color: 'text.primary'
                            }}
                        >
                            <MenuItem value="all">All Statuses</MenuItem>
                            <MenuItem value="0">Pending Review</MenuItem>
                            <MenuItem value="1">Marked Resolved</MenuItem>
                            <MenuItem value="2">Marked Rejected</MenuItem>
                        </Select>
                    </FormControl>
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
                    onPageChange={(newPage) => setPage(newPage)}
                    onPageSizeChange={(newSize) => { setPageSize(newSize); setPage(0); }}
                    loading={loading}
                    sx={{
                        bgcolor: 'transparent',
                        '& .MuiDataGrid-main': { bgcolor: 'transparent' },
                        '& .MuiDataGrid-columnHeaders': { 
                            bgcolor: 'action.hover', 
                            color: 'text.secondary', 
                            fontWeight: 700,
                            borderTop: '1px solid',
                            borderColor: 'divider',
                            borderRadius: '12px 12px 0 0'
                        },
                        '& .MuiDataGrid-row': {
                            bgcolor: '#fff',
                            mb: 1,
                            borderRadius: '12px',
                            border: '1px solid',
                            borderColor: 'divider',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                            '&:hover': { bgcolor: (theme) => alpha(theme.palette.primary.main, 0.02) }
                        }
                    }}
                />
            </Box>

            <Dialog 
                open={auditLogDialogOpen} 
                onClose={() => setAuditLogDialogOpen(false)}
                fullWidth maxWidth="lg"
                PaperProps={{ 
                    sx: { 
                        borderRadius: '24px', 
                        overflow: 'hidden',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                    } 
                }}
            >
                <DialogTitle sx={{ p: 4, bgcolor: 'primary.main', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                            <PolicyIcon sx={{ fontSize: 20, opacity: 0.8 }} />
                            <Typography sx={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', opacity: 0.7, letterSpacing: '0.1em' }}>
                                Investigation Console
                            </Typography>
                        </Box>
                        <Typography variant="h5" sx={{ fontWeight: 800 }}>
                            Room Audit History
                        </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="caption" sx={{ display: 'block', opacity: 0.7, fontWeight: 700 }}>SESSION REFERENCE</Typography>
                        <Typography sx={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 700 }}>{selectedRoomId}</Typography>
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ p: 0, bgcolor: '#fff' }}>
                    {loadingLogs ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '450px', gap: 2 }}>
                            <CircularProgress size={40} thickness={5} sx={{ color: 'primary.main' }} />
                            <Typography sx={{ color: 'text.secondary', fontWeight: 600 }}>Analyzing room telemetry...</Typography>
                        </Box>
                    ) : (
                        <TableContainer sx={{ maxHeight: '550px' }}>
                            <Table stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ bgcolor: 'action.hover', color: 'text.secondary', fontWeight: 800, fontSize: '11px', py: 2, pl: 4 }}>EVENT DESCRIPTION</TableCell>
                                        <TableCell sx={{ bgcolor: 'action.hover', color: 'text.secondary', fontWeight: 800, fontSize: '11px', py: 2 }}>ACTOR</TableCell>
                                        <TableCell sx={{ bgcolor: 'action.hover', color: 'text.secondary', fontWeight: 800, fontSize: '11px', py: 2, pr: 4, textAlign: 'right' }}>TIMESTAMP</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {auditLogs.length > 0 ? auditLogs.map((log) => {
                                        const getEventStyle = (type) => {
                                            switch(type) {
                                                case 0: return { icon: '🚪', label: 'JOIN', color: '#10B981' };
                                                case 1: return { icon: '🏃', label: 'LEAVE', color: '#F59E0B' };
                                                case 2: return { icon: '⚠️', label: 'DISCONNECT', color: '#EF4444' };
                                                case 3: return { icon: '⚡', label: 'CODE', color: '#3B82F6' };
                                                case 4: return { icon: '🌐', label: 'LANG', color: '#6366F1' };
                                                case 5: return { icon: '📝', label: 'PROB', color: '#8B5CF6' };
                                                case 6: return { icon: '📷', label: 'CAM', color: '#EC4899' };
                                                case 7: return { icon: '🎙️', label: 'MIC', color: '#06B6D4' };
                                                case 8: return { icon: '🚨', label: 'REPORT', color: '#F43F5E' };
                                                default: return { icon: '🔔', label: 'EVENT', color: '#64748B' };
                                            }
                                        };
                                        const style = getEventStyle(log.eventType);

                                        return (
                                            <TableRow key={log.id} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                                                <TableCell sx={{ py: 2.5, pl: 4 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                                        <Box sx={{ 
                                                            fontSize: '20px', width: 40, height: 40, borderRadius: '12px', 
                                                            bgcolor: `${style.color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                        }}>
                                                            {style.icon}
                                                        </Box>
                                                        <Box>
                                                            <Typography sx={{ fontSize: '14px', color: 'text.primary', fontWeight: 700, mb: 0.5 }}>
                                                                {log.message}
                                                            </Typography>
                                                            <Box sx={{ display: 'inline-flex', px: 1, py: 0.25, borderRadius: '4px', bgcolor: `${style.color}15`, color: style.color, fontSize: '10px', fontWeight: 800 }}>
                                                                {style.label}
                                                            </Box>
                                                        </Box>
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography sx={{ fontSize: '13px', color: 'text.primary', fontWeight: 700 }}>
                                                        {log.userName || "System"}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell sx={{ textAlign: 'right', pr: 4 }}>
                                                    <Typography sx={{ fontSize: '13px', color: 'text.primary', fontWeight: 600 }}>{new Date(log.timestamp).toLocaleTimeString()}</Typography>
                                                    <Typography sx={{ fontSize: '11px', color: 'text.disabled' }}>{new Date(log.timestamp).toLocaleDateString("vi-VN")}</Typography>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    }) : (
                                        <TableRow>
                                            <TableCell colSpan={3} sx={{ py: 12, textAlign: 'center' }}>
                                                <HistoryIcon sx={{ fontSize: 56, color: 'divider', mb: 1.5 }} />
                                                <Typography sx={{ color: 'text.disabled', fontWeight: 700 }}>No telemetry data available.</Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'action.hover', justifyContent: 'space-between' }}>
                    <Button onClick={() => setAuditLogDialogOpen(false)} sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'none' }}>Close Console</Button>
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                        <Button 
                            variant="outlined" color="error" disableElevation
                            onClick={() => handleResolveReport(selectedReportId, 2)}
                            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, px: 3 }}
                        >
                            Mark Irrelevant
                        </Button>
                        <PrimaryButton 
                            onClick={() => {
                                setResolveDialogOpen(true);
                            }}
                            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, px: 3 }}
                        >
                            Resolve Problem
                        </PrimaryButton>
                    </Box>
                </DialogActions>
            </Dialog>

            <Dialog open={resolveDialogOpen} onClose={() => setResolveDialogOpen(false)} PaperProps={{ sx: { borderRadius: '20px', p: 1 } }}>
                <DialogTitle sx={{ fontWeight: 800 }}>Confirm Resolution</DialogTitle>
                <DialogContent>
                    <Typography sx={{ mb: 2, fontSize: '14px', color: 'text.secondary' }}>
                        Choose a refund option for the candidate based on your investigation.
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Refund Amount</Typography>
                    <RadioGroup value={refundOption} onChange={(e) => setRefundOption(Number(e.target.value))}>
                        <FormControlLabel value={0} control={<Radio />} label="No Refund (0%)" />
                        <FormControlLabel value={50} control={<Radio />} label="Partial Refund (50%)" />
                        <FormControlLabel value={100} control={<Radio />} label="Full Refund (100%)" />
                    </RadioGroup>

                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        placeholder="Add admin note (optional)..."
                        value={adminNote}
                        onChange={(e) => setAdminNote(e.target.value)}
                        sx={{ mt: 3, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setResolveDialogOpen(false)} sx={{ fontWeight: 700, color: 'text.secondary' }}>Cancel</Button>
                    <PrimaryButton 
                        loading={isResolving}
                        onClick={() => handleResolveReport(selectedReportId || actionMenuRow?.id, 1, refundOption, adminNote)}
                        sx={{ px: 4 }}
                    >
                        Confirm & Resolve
                    </PrimaryButton>
                </DialogActions>
            </Dialog>

            <ActionMenu
                anchorEl={actionMenuAnchor}
                open={Boolean(actionMenuAnchor)}
                onClose={handleCloseMenu}
            >
                <MenuItem
                    disabled={actionMenuRow?.status === 1}
                    onClick={() => {
                        setResolveDialogOpen(true);
                        handleCloseMenu();
                    }}
                >
                    <ListItemIcon>
                        <CheckCircleOutlineIcon fontSize="small" color="success" />
                    </ListItemIcon>
                    <ListItemText
                        primary="Resolve Problem"
                        primaryTypographyProps={{ fontSize: "13px", fontWeight: 600 }}
                    />
                </MenuItem>
                <MenuItem
                    disabled={actionMenuRow?.status === 2}
                    onClick={() => {
                        handleResolveReport(actionMenuRow.id, 2);
                        handleCloseMenu();
                    }}
                >
                    <ListItemIcon>
                        <BlockIcon fontSize="small" color="warning" />
                    </ListItemIcon>
                    <ListItemText
                        primary="Mark Irrelevant"
                        primaryTypographyProps={{ fontSize: "13px", fontWeight: 600 }}
                    />
                </MenuItem>
            </ActionMenu>
        </Container>
    );
};

export default AdminRoomReportsPage;



