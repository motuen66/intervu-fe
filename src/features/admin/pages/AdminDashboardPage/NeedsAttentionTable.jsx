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
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import { Warning, Report, Payment, ArrowForward } from "@mui/icons-material";
import BaseCard from "../../../../common/components/cards/BaseCard";
import { Link } from "react-router-dom";

export default function NeedsAttentionTable({ data, loading }) {
    if (loading && !data) {
        return <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 4 }} />;
    }

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
            <Box sx={{ p: 3, borderBottom: 1, borderColor: "divider", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="h6" fontWeight={700}>
                    Needs Attention
                </Typography>
                <Chip label={`${data?.length || 0} Issues`} size="small" variant="outlined" />
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
                        {!data || data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        All clear! No items need attention right now.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((item) => (
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
                                        <Button
                                            component={Link}
                                            to={item.actionLink}
                                            size="small"
                                            endIcon={<ArrowForward fontSize="inherit" />}
                                            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
                                        >
                                            Handle
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </BaseCard>
    );
}
