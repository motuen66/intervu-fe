import { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Paper,
    Chip,
    IconButton,
    Box,
    Typography,
    CircularProgress
} from '@mui/material';
import { alpha } from "@mui/material/styles";
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

export default function DataTable({
    title,
    columns,
    data = [],
    totalItems = 0,
    page = 0,
    pageSize = 10,
    onPageChange,
    onPageSizeChange,
    loading = false,
    actions = true,
    onEdit,
    onDelete,
    onView,
    showIndex = false,
    showHeader = true
}) {
    const handleChangePage = (event, newPage) => {
        onPageChange?.(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        onPageSizeChange?.(parseInt(event.target.value, 10));
        onPageChange?.(0);
    };

    const renderCellValue = (row, column) => {
        const value = row[column.field];

        // Get display value (after render function if exists)
        const displayValue = column.render ? column.render(value, row) : value;

        if (column.type === 'chip') {
            const resolved = column.chipColor?.(value);
            return (
                <Chip
                    label={displayValue}
                    size="small"
                    sx={(theme) => {
                        const main = resolved || theme.palette.primary.main;
                        return {
                            bgcolor: alpha(main, 0.16),
                            color: main,
                            border: "1px solid",
                            borderColor: alpha(main, 0.32),
                            fontWeight: 600,
                            fontSize: "11px",
                        };
                    }}
                />
            );
        }

        if (column.type === 'currency') {
            return `$${parseFloat(value || 0).toLocaleString()}`;
        }

        if (column.type === 'date') {
            if (!value) return '-';
            const date = new Date(value);
            if (isNaN(date.getTime())) return '-';
            return date.toLocaleDateString('vi-VN');
        }

        if (column.render) {
            return displayValue;
        }

        return value || '-';
    };

    return (
        <Paper
            sx={{
                bgcolor: "background.paper",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: "0 8px 20px rgba(17,24,39,0.04)",
            }}
        >
            {showHeader && (
                <Box sx={{ p: 2, borderBottom: "1px solid", borderBottomColor: "divider" }}>
                    <Typography variant="h6" sx={{ color: "text.primary", fontWeight: 700, fontSize: "14px" }}>
                        {title}
                    </Typography>
                </Box>
            )}

            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: "action.hover" }}>
                            {showIndex && (
                                <TableCell
                                    sx={{
                                        borderBottom: "1px solid",
                                        borderBottomColor: "divider",
                                        width: 56,
                                        color: "text.secondary",
                                        fontWeight: 700,
                                        fontSize: "10px",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.6px",
                                    }}
                                >
                                    STT
                                </TableCell>
                            )}
                            {columns.map((column) => (
                                <TableCell
                                    key={column.field}
                                    sx={{
                                        color: "text.secondary",
                                        fontWeight: 700,
                                        fontSize: "10px",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.6px",
                                        borderBottom: "1px solid",
                                        borderBottomColor: "divider",
                                    }}
                                >
                                    {column.headerName}
                                </TableCell>
                            ))}
                            {actions && (
                                <TableCell
                                    sx={{
                                        color: "text.secondary",
                                        fontWeight: 700,
                                        fontSize: "10px",
                                        textTransform: "uppercase",
                                        borderBottom: "1px solid",
                                        borderBottomColor: "divider",
                                    }}
                                >
                                    Actions
                                </TableCell>
                            )}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length + (actions ? 1 : 0) + (showIndex ? 1 : 0)}
                                    sx={{
                                        textAlign: 'center',
                                        py: 8,
                                        borderBottom: 'none'
                                    }}
                                >
                                    <CircularProgress sx={{ color: "primary.main" }} />
                                </TableCell>
                            </TableRow>
                        ) : !Array.isArray(data) || data.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length + (actions ? 1 : 0) + (showIndex ? 1 : 0)}
                                    sx={{
                                        textAlign: 'center',
                                        py: 8,
                                        color: "text.secondary",
                                        borderBottom: 'none'
                                    }}
                                >
                                    No data available
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((row, index) => (
                                <TableRow
                                    key={row.id || index}
                                    sx={{
                                        '&:hover': {
                                            bgcolor: "action.hover",
                                        }
                                    }}
                                >
                                    {showIndex && (
                                        <TableCell
                                            sx={{
                                                borderBottom: "1px solid",
                                                borderBottomColor: "divider",
                                                color: "text.secondary",
                                                fontSize: "12px",
                                            }}
                                        >
                                            {index + 1}
                                        </TableCell>
                                    )}
                                    {columns.map((column) => (
                                        <TableCell
                                            key={column.field}
                                            sx={{
                                                color: "text.primary",
                                                fontSize: "12px",
                                                borderBottom: "1px solid",
                                                borderBottomColor: "divider",
                                            }}
                                        >
                                            {renderCellValue(row, column)}
                                        </TableCell>
                                    ))}
                                    {actions && (
                                        <TableCell sx={{ borderBottom: "1px solid", borderBottomColor: "divider" }}>
                                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                {onView && (
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => onView(row)}
                                                        sx={{
                                                            color: "text.secondary",
                                                            "&:hover": { bgcolor: "action.hover" },
                                                        }}
                                                    >
                                                        <VisibilityIcon fontSize="small" />
                                                    </IconButton>
                                                )}
                                                {onEdit && (
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => onEdit(row)}
                                                        sx={{
                                                            color: "success.main",
                                                            "&:hover": (theme) => ({
                                                                bgcolor: alpha(theme.palette.success.main, 0.12),
                                                            }),
                                                        }}
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                )}
                                                {onDelete && (
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => onDelete(row)}
                                                        sx={{
                                                            color: "error.main",
                                                            "&:hover": (theme) => ({
                                                                bgcolor: alpha(theme.palette.error.main, 0.12),
                                                            }),
                                                        }}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                )}
                                            </Box>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <TablePagination
                component="div"
                count={totalItems}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={pageSize}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[5, 10, 25, 50]}
                sx={{
                    color: "text.secondary",
                    borderTop: "1px solid",
                    borderTopColor: "divider",
                    '.MuiTablePagination-toolbar': {
                        paddingRight: 12
                    },
                    '.MuiTablePagination-select': {
                        color: "text.primary",
                    },
                    '.MuiTablePagination-selectIcon': {
                        color: "text.secondary",
                    }
                }}
            />
        </Paper>
    );
}
