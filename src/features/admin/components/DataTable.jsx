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
    actions = true
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
        
        if (column.type === 'chip') {
            return (
                <Chip 
                    label={value} 
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
            return new Date(value).toLocaleDateString('vi-VN');
        }
        
        if (column.render) {
            return column.render(value, row);
        }
        
        return value || '-';
    };

    return (
        <Paper 
            sx={{ 
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(123,97,255,0.2)',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
            }}
        >
            <Box sx={{ p: 3, borderBottom: '1px solid rgba(123,97,255,0.15)' }}>
                <Typography variant="h6" sx={{ color: '#1a1a2e', fontWeight: 700 }}>
                    {title}
                </Typography>
            </Box>
            
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow sx={{ background: 'rgba(123,97,255,0.08)' }}>
                            {columns.map((column) => (
                                <TableCell 
                                    key={column.field}
                                    sx={{ 
                                        color: 'rgba(0,0,0,0.7)',
                                        fontWeight: 700,
                                        fontSize: '12px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                        borderBottom: '1px solid rgba(123,97,255,0.15)'
                                    }}
                                >
                                    {column.headerName}
                                </TableCell>
                            ))}
                            {actions && (
                                <TableCell 
                                    sx={{ 
                                        color: 'rgba(0,0,0,0.7)',
                                        fontWeight: 700,
                                        fontSize: '12px',
                                        textTransform: 'uppercase',
                                        borderBottom: '1px solid rgba(123,97,255,0.15)'
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
                                    colSpan={columns.length + (actions ? 1 : 0)} 
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
                                    colSpan={columns.length + (actions ? 1 : 0)} 
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
                                            background: 'rgba(123,97,255,0.08)'
                                        }
                                    }}
                                >
                                    {columns.map((column) => (
                                        <TableCell 
                                            key={column.field}
                                            sx={{ 
                                                color: '#1a1a2e',
                                                borderBottom: '1px solid rgba(123,97,255,0.08)'
                                            }}
                                        >
                                            {renderCellValue(row, column)}
                                        </TableCell>
                                    ))}
                                    {actions && (
                                        <TableCell sx={{ borderBottom: '1px solid rgba(123,97,255,0.08)' }}>
                                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                <IconButton 
                                                    size="small"
                                                    sx={{ 
                                                        color: '#7B61FF',
                                                        '&:hover': { background: 'rgba(123,97,255,0.1)' }
                                                    }}
                                                >
                                                    <VisibilityIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton 
                                                    size="small"
                                                    sx={{ 
                                                        color: '#4ade80',
                                                        '&:hover': { background: 'rgba(74,222,128,0.1)' }
                                                    }}
                                                >
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton 
                                                    size="small"
                                                    sx={{ 
                                                        color: '#f87171',
                                                        '&:hover': { background: 'rgba(248,113,113,0.1)' }
                                                    }}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
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
                    color: 'rgba(0,0,0,0.7)',
                    borderTop: '1px solid rgba(123,97,255,0.15)',
                    '.MuiTablePagination-select': {
                        color: '#1a1a2e'
                    },
                    '.MuiTablePagination-selectIcon': {
                        color: 'rgba(0,0,0,0.7)'
                    }
                }}
            />
        </Paper>
    );
}
