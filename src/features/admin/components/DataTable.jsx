import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Paper,
    IconButton,
    Box,
    Typography,
    CircularProgress
} from '@mui/material';
import { alpha } from "@mui/material/styles";
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import StatusChip from '../../../common/components/StatusChip';

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
    const normalizedData = Array.isArray(data) ? data : [];
    const emptyRowsCount = !loading ? Math.max(pageSize - normalizedData.length, 0) : 0;

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
            const hexColor = column.chipColor?.(value);

            let mappedColor = "default";
            if (hexColor) {
                const lowerHex = hexColor.toLowerCase();
                if (lowerHex.includes('error') || lowerHex.includes('f44336') || lowerHex.includes('d32f2f') || lowerHex === 'error') {
                    mappedColor = "error";
                } else if (lowerHex.includes('success') || lowerHex.includes('4caf50') || lowerHex.includes('2e7d32') || lowerHex === 'success') {
                    mappedColor = "success";
                } else if (lowerHex.includes('warning') || lowerHex.includes('ff9800') || lowerHex.includes('ed6c02') || lowerHex === 'warning') {
                    mappedColor = "warning";
                } else if (lowerHex.includes('info') || lowerHex.includes('2196f3') || lowerHex.includes('0288d1') || lowerHex === 'info') {
                    mappedColor = "info";
                } else if (lowerHex.includes('primary') || lowerHex === 'primary') {
                    mappedColor = "primary";
                } else if (lowerHex.includes('secondary') || lowerHex === 'secondary') {
                    mappedColor = "secondary";
                }
            }

            return (
                <StatusChip
                    label={displayValue}
                    color={mappedColor}
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
                bgcolor: "transparent",
                border: "none",
                borderRadius: 0,
                overflow: 'hidden',
                boxShadow: "none",
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
                        ) : (
                            normalizedData.map((row, index) => (
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

                        {!loading && emptyRowsCount > 0 &&
                            Array.from({ length: emptyRowsCount }).map((_, idx) => (
                                <TableRow key={`empty-row-${idx}`}>
                                    {showIndex && (
                                        <TableCell
                                            sx={{
                                                borderBottom: "1px solid",
                                                borderBottomColor: "divider",
                                                color: "transparent",
                                                fontSize: "12px",
                                                height: 53,
                                            }}
                                        >
                                            &nbsp;
                                        </TableCell>
                                    )}
                                    {columns.map((column) => (
                                        <TableCell
                                            key={`${column.field}-empty-${idx}`}
                                            sx={{
                                                color: "transparent",
                                                fontSize: "12px",
                                                borderBottom: "1px solid",
                                                borderBottomColor: "divider",
                                                height: 53,
                                            }}
                                        >
                                            &nbsp;
                                        </TableCell>
                                    ))}
                                    {actions && (
                                        <TableCell
                                            sx={{
                                                borderBottom: "1px solid",
                                                borderBottomColor: "divider",
                                                height: 53,
                                            }}
                                        >
                                            &nbsp;
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
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
                rowsPerPageOptions={[10, 25, 50]}
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
