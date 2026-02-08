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
            return (
                <Chip 
                    label={displayValue} 
                    size="small"
                    sx={{
                        background: column.chipColor?.(value) || 'rgba(123,97,255,0.2)',
                        color: '#fff',
                        fontWeight: 600,
                        fontSize: '11px'
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
                background: '#ffffff',
                border: '1px solid #eef0f5',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 8px 20px rgba(17,24,39,0.04)'
            }}
        >
            {showHeader && (
                <Box sx={{ p: 2, borderBottom: '1px solid #eef0f5' }}>
                    <Typography variant="h6" sx={{ color: '#111827', fontWeight: 700, fontSize: '14px' }}>
                        {title}
                    </Typography>
                </Box>
            )}
            
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow sx={{ background: '#f8fafc' }}>
                            {showIndex && (
                                <TableCell sx={{ borderBottom: '1px solid #eef0f5', width: 56, color: '#94a3b8', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                                    STT
                                </TableCell>
                            )}
                            {columns.map((column) => (
                                <TableCell 
                                    key={column.field}
                                    sx={{ 
                                        color: '#94a3b8',
                                        fontWeight: 700,
                                        fontSize: '10px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.6px',
                                        borderBottom: '1px solid #eef0f5'
                                    }}
                                >
                                    {column.headerName}
                                </TableCell>
                            ))}
                            {actions && (
                                <TableCell 
                                    sx={{ 
                                        color: '#94a3b8',
                                        fontWeight: 700,
                                        fontSize: '10px',
                                        textTransform: 'uppercase',
                                        borderBottom: '1px solid #eef0f5'
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
                                    <CircularProgress sx={{ color: '#7B61FF' }} />
                                </TableCell>
                            </TableRow>
                        ) : !Array.isArray(data) || data.length === 0 ? (
                            <TableRow>
                                <TableCell 
                                    colSpan={columns.length + (actions ? 1 : 0) + (showIndex ? 1 : 0)} 
                                    sx={{ 
                                        textAlign: 'center', 
                                        py: 8,
                                        color: 'rgba(0,0,0,0.5)',
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
                                            background: '#f8fafc'
                                        }
                                    }}
                                >
                                    {showIndex && (
                                        <TableCell sx={{ borderBottom: '1px solid #eef0f5', color: '#94a3b8', fontSize: '12px' }}>
                                            {index + 1}
                                        </TableCell>
                                    )}
                                    {columns.map((column) => (
                                        <TableCell 
                                            key={column.field}
                                            sx={{ 
                                                color: '#1f2937',
                                                fontSize: '12px',
                                                borderBottom: '1px solid #eef0f5'
                                            }}
                                        >
                                            {renderCellValue(row, column)}
                                        </TableCell>
                                    ))}
                                    {actions && (
                                        <TableCell sx={{ borderBottom: '1px solid #eef0f5' }}>
                                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                {onView && (
                                                    <IconButton 
                                                        size="small"
                                                        onClick={() => onView(row)}
                                                        sx={{ 
                                                            color: '#64748b',
                                                            '&:hover': { background: '#f1f5f9' }
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
                                                            color: '#22c55e',
                                                            '&:hover': { background: '#ecfdf3' }
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
                                                            color: '#ef4444',
                                                            '&:hover': { background: '#fef2f2' }
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
                    color: '#64748b',
                    borderTop: '1px solid #eef0f5',
                    '.MuiTablePagination-toolbar': {
                        paddingRight: 12
                    },
                    '.MuiTablePagination-select': {
                        color: '#1f2937'
                    },
                    '.MuiTablePagination-selectIcon': {
                        color: '#64748b'
                    }
                }}
            />
        </Paper>
    );
}
