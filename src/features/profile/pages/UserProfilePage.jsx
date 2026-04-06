import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
    Box,
    Container,
    Paper,
    Typography,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip
} from '@mui/material';
import { callApi } from '../../../common/utils/apiConnector';
import { METHOD } from '../../../common/constants/api';
import { profileEndPoints } from '../services/profileApi';
import toast from 'react-hot-toast';

export default function UserProfilePage() {
    return (
        <Box sx={{ minHeight: "100vh", background: "#f8fafc", py: 6 }}>
            <Container maxWidth="lg">
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em', mb: 1 }}>
                        My Interview Reports
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                        Track the status and history of your reported interview issues.
                    </Typography>
                </Box>

                <MyReportsTab />
            </Container>
        </Box>
    );
}

const MyReportsTab = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMyReports = async () => {
            try {
                const response = await callApi({
                    method: METHOD.GET,
                    endpoint: profileEndPoints.GET_MY_REPORTS,
                });
                if (response?.success) {
                    setReports(response.data?.items || []);
                }
            } catch (error) {
                toast.error("Failed to load your reports");
            } finally {
                setLoading(false);
            }
        };
        fetchMyReports();
    }, []);

    const getStatusChip = (status) => {
        const configs = {
            0: { 
                label: "PENDING", 
                color: "#f59e0b", 
                bg: "rgba(245, 158, 11, 0.1)",
                border: "rgba(245, 158, 11, 0.2)"
            },
            1: { 
                label: "RESOLVED", 
                color: "#10b981", 
                bg: "rgba(16, 185, 129, 0.1)",
                border: "rgba(16, 185, 129, 0.2)"
            },
            2: { 
                label: "REJECTED", 
                color: "#ef4444", 
                bg: "rgba(239, 68, 68, 0.1)",
                border: "rgba(239, 68, 68, 0.2)" 
            }
        };

        const config = configs[status] || configs[0];

        return (
            <Box sx={{
                display: 'inline-flex',
                alignItems: 'center',
                px: 1.5,
                py: 0.5,
                borderRadius: '8px',
                bgcolor: config.bg,
                color: config.color,
                border: '1px solid',
                borderColor: config.border,
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.05em',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
            }}>
                <Box sx={{ 
                    width: 6, 
                    height: 6, 
                    borderRadius: '50%', 
                    bgcolor: config.color, 
                    mr: 1,
                    boxShadow: `0 0 8px ${config.color}`
                }} />
                {config.label}
            </Box>
        );
    };

    if (loading) return (
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', p: 12, gap: 2 }}>
            <CircularProgress thickness={5} size={50} sx={{ color: 'primary.main' }} />
            <Typography sx={{ color: 'text.secondary', fontWeight: 600, letterSpacing: '0.02em' }}>
                Fetching your report history...
            </Typography>
        </Box>
    );

    return (
        <Paper sx={{ 
            borderRadius: '24px', 
            overflow: 'hidden', 
            border: '1px solid', 
            borderColor: 'divider', 
            boxShadow: '0 10px 40px -10px rgba(0,0,0,0.04)',
            background: 'white',
            position: 'relative'
        }}>
            <TableContainer>
                <Table>
                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 800, color: 'text.disabled', fontSize: '11px', letterSpacing: '0.1em', pl: 4 }}>DATE</TableCell>
                            <TableCell sx={{ fontWeight: 800, color: 'text.disabled', fontSize: '11px', letterSpacing: '0.1em' }}>REASON & DETAILS</TableCell>
                            <TableCell sx={{ fontWeight: 800, color: 'text.disabled', fontSize: '11px', letterSpacing: '0.1em' }}>STATUS</TableCell>
                            <TableCell sx={{ fontWeight: 800, color: 'text.disabled', fontSize: '11px', letterSpacing: '0.1em', pr: 4 }}>ADMIN RESPONSE</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {reports.length > 0 ? reports.map((report) => (
                            <TableRow key={report.id} sx={{ transition: 'all 0.2s', '&:hover': { bgcolor: '#fdfdfd' } }}>
                                <TableCell sx={{ fontSize: '13px', fontWeight: 600, color: 'text.secondary', pl: 4 }}>
                                    {new Date(report.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                </TableCell>
                                <TableCell sx={{ py: 3 }}>
                                    <Typography sx={{ fontSize: '15px', fontWeight: 700, color: 'primary.dark', mb: 0.5 }}>
                                        {report.reason}
                                    </Typography>
                                    <Typography sx={{ color: 'text.secondary', fontSize: '13px', lineHeight: 1.5, maxWidth: 400 }}>
                                        {report.details}
                                    </Typography>
                                </TableCell>
                                <TableCell>{getStatusChip(report.status)}</TableCell>
                                <TableCell sx={{ pr: 4, fontSize: '13px', fontStyle: 'italic', color: 'text.secondary' }}>
                                    {report.adminNote || "-"}
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={4} sx={{ py: 15, textAlign: 'center' }}>
                                    <Box sx={{ display: 'inline-flex', mb: 2, p: 2, bgcolor: '#f1f5f9', borderRadius: '50%' }}>
                                        <CircularProgress variant="determinate" value={100} size={40} sx={{ color: 'divider' }} />
                                    </Box>
                                    <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 800, mb: 1, letterSpacing: '-0.01em' }}>
                                        All Clear!
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 300, mx: 'auto', fontWeight: 500 }}>
                                        You haven't reported any issues. Your interview experience looks great!
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    );
};
