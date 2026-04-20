import { useState, useEffect, useMemo } from 'react';
import { Container, Box, Typography, Avatar, TablePagination } from '@mui/material';
import { callApi } from '../../../common/utils/apiConnector';
import { METHOD } from '../../../common/constants/api';
import { adminEndPoints } from '../services/adminApi';
import toast from 'react-hot-toast';
import AdminPageHeader from '../../../common/components/admin/AdminPageHeader';
import useTableState from '../../../hooks/useTableState';
import {
    Badge,
    DataGrid,
    EmptyState,
    Spinner,
} from '../../../common/design-system';
import AdminDesignSystemPageShell from '../components/AdminDesignSystemPageShell';
import './AdminDashboard.css';

const STATUS_VARIANT_MAP = {
    Paid: 'success',
    PendingPayout: 'warning',
    Created: 'warning',
    Cancel: 'error',
};

const TYPE_VARIANT_MAP = {
    Payment: 'brand',
    Payout: 'success',
    Refund: 'warning',
};

const formatVND = (amount) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);

const getInitials = (name = '') =>
    name.split(' ').filter(Boolean).slice(0, 2).map((n) => n[0]).join('').toUpperCase() || '?';

export default function AdminTransactionsPage({ filterType, filterStatus, title, subtitle }) {
    const {
        data: transactions,
        setData: setTransactions,
        loading,
        setLoading,
        page,
        pageSize,
        totalItems,
        setTotalItems,
        handlePageChange,
        handlePageSizeChange,
    } = useTableState(10);

    useEffect(() => {
        fetchTransactions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, pageSize, filterType, filterStatus]);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const params = [`page=${page + 1}`, `pageSize=${pageSize}`];
            if (filterType) params.push(`type=${filterType}`);
            if (filterStatus) params.push(`status=${filterStatus}`);

            const response = await callApi({
                method: METHOD.GET,
                endpoint: `${adminEndPoints.GET_TRANSACTIONS}?${params.join('&')}`,
                useGlobalLoading: false,
            });

            if (response?.success) {
                setTransactions(response.data?.items || []);
                setTotalItems(response.data?.totalItems || 0);
            }
        } catch {
            toast.error('Error loading transactions');
        } finally {
            setLoading(false);
        }
    };

    const columns = useMemo(
        () => [
            {
                key: 'index',
                label: '#',
                width: 52,
            },
            {
                key: 'orderCode',
                label: 'Order Code',
                width: 140,
                render: (val) => (
                    <Typography sx={{ fontSize: '12px', fontWeight: 600, color: 'text.primary', fontFamily: 'monospace' }}>
                        #{val}
                    </Typography>
                ),
            },
            {
                key: 'type',
                label: 'Type',
                width: 130,
                render: (val) => (
                    <Badge variant={TYPE_VARIANT_MAP[val] || 'neutral'}>{val || '-'}</Badge>
                ),
            },
            {
                key: 'userName',
                label: 'Party',
                width: 260,
                render: (val, row) => (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar
                            sx={{
                                width: 28,
                                height: 28,
                                fontSize: 11,
                                fontWeight: 700,
                                bgcolor: 'secondary.main',
                                color: 'primary.main',
                            }}
                        >
                            {getInitials(val)}
                        </Avatar>
                        <Box>
                            <Typography sx={{ fontSize: '13px', fontWeight: 600, color: 'text.primary', lineHeight: 1.3 }}>
                                {val || '-'}
                            </Typography>
                            <Typography sx={{ fontSize: '11px', color: 'text.secondary' }}>
                                {row.userEmail || ''}
                            </Typography>
                        </Box>
                    </Box>
                ),
            },
            {
                key: 'amount',
                label: 'Amount',
                width: 170,
                render: (val) => (
                    <Typography sx={{ fontSize: '13px', fontWeight: 600, color: 'text.primary' }}>
                        {formatVND(val)}
                    </Typography>
                ),
            },
            {
                key: 'status',
                label: 'Status',
                width: 150,
                render: (val) => (
                    <Badge variant={STATUS_VARIANT_MAP[val] || 'neutral'}>{val || '-'}</Badge>
                ),
            },
            {
                key: 'createdAt',
                label: 'Date',
                width: 130,
                render: (val) => {
                    if (!val) return '-';
                    const d = new Date(val);
                    return isNaN(d.getTime())
                        ? '-'
                        : d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
                },
            },
        ],
        [],
    );

    const rows = useMemo(
        () => transactions.map((row, index) => ({
            ...row,
            index: page * pageSize + index + 1,
        })),
        [transactions, page, pageSize],
    );

    return (
        <AdminDesignSystemPageShell>
            <Container maxWidth="xl" className="admin-page" sx={{ py: 3 }}>
                <AdminPageHeader title={title} subtitle={subtitle} />

                <Box className="admin-card">
                    {loading ? (
                        <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
                            <Spinner />
                        </Box>
                    ) : rows.length === 0 ? (
                        <Box sx={{ p: 2 }}>
                            <EmptyState
                                title="No transactions found"
                                body="There are no transactions matching current filters."
                            />
                        </Box>
                    ) : (
                        <DataGrid columns={columns} rows={rows} striped dense />
                    )}

                    <TablePagination
                        component="div"
                        count={totalItems}
                        page={page}
                        onPageChange={(_, newPage) => handlePageChange(newPage)}
                        rowsPerPage={pageSize}
                        onRowsPerPageChange={(e) => handlePageSizeChange(parseInt(e.target.value, 10))}
                        rowsPerPageOptions={[10, 20, 50]}
                        sx={{
                            borderTop: '1px solid',
                            borderColor: 'divider',
                            '.MuiTablePagination-toolbar': {
                                minHeight: 52,
                            },
                            '.MuiTablePagination-select, .MuiTablePagination-displayedRows': {
                                fontSize: '0.78rem',
                                color: 'text.secondary',
                            },
                        }}
                    />
                </Box>
            </Container>
        </AdminDesignSystemPageShell>
    );
}
