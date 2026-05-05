import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Chip from "@mui/material/Chip";
import { SecondaryButton } from "../../../../common/components/buttons";
import Skeleton from "@mui/material/Skeleton";
import { Warning, Report, Payment, ArrowForward, CheckCircleOutline as CheckCircleOutlineIcon } from "@mui/icons-material";
import BaseCard from "../../../../common/components/cards/BaseCard";
import SectionHeading from "../../../../common/components/SectionHeading";
import AppText from "../../../../common/components/AppText";
import { Link } from "react-router-dom";

export default function NeedsAttentionTable({ data, loading }) {
    if (loading && !data) {
        return <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 4 }} />;
    }
    const issues = Array.isArray(data) ? data : [];
    const toTime = (item) => {
        const raw = item?.createdAt || item?.createdOn || item?.createdDate || item?.updatedAt || item?.reportedAt;
        if (!raw) return 0;
        const parsed = new Date(raw);
        return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
    };
    const sortedIssues = [...issues].sort((a, b) => toTime(b) - toTime(a));
    const visibleIssues = sortedIssues.slice(0, 3);
    const remainingCount = Math.max(0, sortedIssues.length - visibleIssues.length);

    const getIcon = (type) => {
        switch (type) {
            case "Room Dispute": return <Warning fontSize="small" color="error" />;
            case "Question Report": return <Report fontSize="small" color="warning" />;
            case "Failed Payout": return <Payment fontSize="small" color="error" />;
            default: return <Warning fontSize="small" />;
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity?.toLowerCase()) {
            case "high": return "error";
            case "medium": return "warning";
            case "low": return "info";
            default: return "default";
        }
    };

    return (
        <BaseCard sx={{ p: 0 }}>
            <Box sx={{ px: 2.5, py: 1.5, borderBottom: 1, borderColor: "divider", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <SectionHeading title="Needs Attention" size="sm" disableGutters />
                <Chip label={`${issues.length} Issues`} size="small" variant="outlined" />
            </Box>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Type</TableCell>
                            <TableCell>Entity</TableCell>
                            <TableCell>Severity</TableCell>
                            <TableCell>Time</TableCell>
                            <TableCell align="right">Action</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {visibleIssues.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'text.secondary' }}>
                                        <Box sx={{ 
                                            bgcolor: 'success.light', 
                                            borderRadius: '50%', 
                                            p: 1.5, 
                                            mb: 2,
                                            display: 'inline-flex',
                                            opacity: 0.2
                                        }}>
                                            <CheckCircleOutlineIcon sx={{ fontSize: 32, color: 'success.main' }} />
                                        </Box>
                                        <AppText variant="bodyStrong" sx={{ color: 'text.primary' }}>
                                            All clear!
                                        </AppText>
                                        <AppText variant="caption">
                                            No items currently need your attention.
                                        </AppText>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ) : (
                            visibleIssues.map((item) => (
                                <TableRow key={item.id} hover>
                                    <TableCell>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                            {getIcon(item.type)}
                                            <Typography variant="body2" fontWeight={600}>
                                                {item.type}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight={500}>
                                            {item.entityName}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={item.severity}
                                            size="small"
                                            color={getSeverityColor(item.severity)}
                                            sx={{ fontWeight: 700, fontSize: "0.7rem", height: 20 }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" color="text.secondary">
                                            {item.timeOffset}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <SecondaryButton
                                            component={Link}
                                            to={item.actionLink}
                                            size="small"
                                            endIcon={<ArrowForward fontSize="inherit" />}
                                        >
                                            Handle
                                        </SecondaryButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            {remainingCount > 0 && (
                <Box sx={{ px: 2.5, py: 1.25, borderTop: 1, borderColor: "divider" }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                        +{remainingCount} more
                    </Typography>
                </Box>
            )}
        </BaseCard>
    );
}
