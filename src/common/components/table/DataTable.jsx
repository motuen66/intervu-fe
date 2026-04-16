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
import StatusChip from '../../components/StatusChip';
import { commonMenuProps } from '../form/FormSelect';

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
                <Table size="small"> {/* Density optimization */}
                    <TableHead>
                        <TableRow sx={{ bgcolor: "action.hover" }}>
                            {showIndex && (
                                <TableCell
                                    sx={{
                                        borderBottom: "1px solid",
                                        borderBottomColor: "divider",
                                        width: 50,
                                        color: "text.secondary",
                                        fontWeight: 700,
                                        fontSize: "10px",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.5px",
                                        py: 1, // Minimize padding
                                        px: 1.5,
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
                                        letterSpacing: "0.5px",
                                        borderBottom: "1px solid",
                                        borderBottomColor: "divider",
                                        py: 1, // Minimize padding
                                        px: 1.5,
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
                                        py: 1, // Minimize padding
                                        px: 1.5,
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
                        ) : normalizedData.length > 0 ? (
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
                                                py: '6px', // Dense padding
                                                px: 1.5,
                                            }}
                                        >
                                            {page * pageSize + index + 1}
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
                                                py: '6px', // Dense padding
                                                px: 1.5,
                                            }}
                                        >
                                            {renderCellValue(row, column)}
                                        </TableCell>
                                    ))}
                                    {actions && (
                                        <TableCell sx={{ borderBottom: "1px solid", borderBottomColor: "divider", py: '6px', px: 1.5 }}>
                                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                {onView && (
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => onView(row)}
                                                        sx={{
                                                            color: "text.secondary",
                                                            "&:hover": { bgcolor: "action.hover" },
                                                            padding: '4px'
                                                        }}
                                                    >
                                                        <VisibilityIcon sx={{ fontSize: '18px' }} />
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
                                                            padding: '4px'
                                                        }}
                                                    >
                                                        <EditIcon sx={{ fontSize: '18px' }} />
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
                                                            padding: '4px'
                                                        }}
                                                    >
                                                        <DeleteIcon sx={{ fontSize: '18px' }} />
                                                    </IconButton>
                                                )}
                                            </Box>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length + (actions ? 1 : 0) + (showIndex ? 1 : 0)}
                                    sx={{
                                        textAlign: 'center',
                                        py: 10,
                                        borderBottom: 'none'
                                    }}
                                >
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'text.secondary' }}>
                                        <Box sx={{ 
                                            bgcolor: 'action.hover', 
                                            borderRadius: '50%', 
                                            p: 2, 
                                            mb: 2,
                                            display: 'inline-flex'
                                        }}>
                                            <VisibilityIcon sx={{ fontSize: 40, opacity: 0.2 }} />
                                        </Box>
                                        <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5 }}>
                                            No data available
                                        </Typography>
                                        <Typography variant="body2" sx={{ maxWidth: 300 }}>
                                            It looks like there's nothing to show here right now. Try adjusting your filters or search.
                                        </Typography>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        )}
                        {!loading && normalizedData.length > 0 && emptyRowsCount > 0 &&
                            Array.from({ length: emptyRowsCount }).map((_, idx) => (
                                <TableRow key={`empty-row-${idx}`}>
                                    {showIndex && (
                                        <TableCell
                                            sx={{
                                                borderBottom: "none",
                                                borderBottomColor: "divider",
                                                color: "transparent",
                                                fontSize: "12px",
                                                py: '6px',
                                                px: 1.5,
                                                height: 38, // Match standard dense row height
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
                                                borderBottom: "none",
                                                borderBottomColor: "divider",
                                                py: '6px',
                                                px: 1.5,
                                                height: 38,
                                            }}
                                        >
                                            &nbsp;
                                        </TableCell>
                                    ))}
                                    {actions && (
                                        <TableCell
                                            sx={{
                                                borderBottom: "none",
                                                borderBottomColor: "divider",
                                                py: '6px',
                                                px: 1.5,
                                                height: 38,
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
                SelectProps={{
                    MenuProps: {
                        ...commonMenuProps,
                        anchorOrigin: { vertical: 'top', horizontal: 'left' },
                        transformOrigin: { vertical: 'bottom', horizontal: 'left' },
                    }
                }}
                sx={{
                    color: "text.secondary",
                    borderTop: "1px solid",
                    borderTopColor: "divider",
                    '.MuiTablePagination-toolbar': {
                        minHeight: 40,
                        paddingRight: 2
                    },
                    '.MuiTablePagination-select': {
                        color: "text.primary",
                        fontSize: '13px'
                    },
                    '.MuiTablePagination-displayedRows': {
                        fontSize: '13px'
                    },
                    '.MuiTablePagination-selectIcon': {
                        color: "text.secondary",
                    }
                }}
            />
        </Paper>
    );
}
