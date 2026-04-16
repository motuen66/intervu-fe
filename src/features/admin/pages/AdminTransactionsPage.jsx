import { useState, useEffect, useMemo } from 'react';
import { Container, Box, Typography, Avatar } from '@mui/material';
import { callApi } from '../../../common/utils/apiConnector';
import { METHOD } from '../../../common/constants/api';
import { adminEndPoints } from '../services/adminApi';
import toast from 'react-hot-toast';
import DataTable from '../../../common/components/table/DataTable';
import AdminPageHeader from '../../../common/components/admin/AdminPageHeader';
import useTableState from '../../../hooks/useTableState';
import StatusChip from '../../../common/components/StatusChip';
import './AdminDashboard.css';

const STATUS_COLOR_MAP = {
    Paid: 'success',
    PendingPayout: 'info',
    Created: 'warning',
    Cancel: 'error',
};

const TYPE_COLOR_MAP = {
    Payment: 'primary',
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

    const [selectedTransaction, setSelectedTransaction] = useState(null);

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
                field: 'orderCode',
                headerName: 'Order Code',
                render: (val) => (
                    <Typography sx={{ fontSize: '12px', fontWeight: 600, color: 'text.primary', fontFamily: 'monospace' }}>
                        #{val}
                    </Typography>
                ),
            },
            {
                field: 'type',
                headerName: 'Type',
                render: (val) => (
                    <StatusChip label={val} color={TYPE_COLOR_MAP[val] || 'default'} />
                ),
            },
            {
                field: 'userName',
                headerName: 'Party',
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
                field: 'amount',
                headerName: 'Amount',
                render: (val) => (
                    <Typography sx={{ fontSize: '13px', fontWeight: 600, color: 'text.primary' }}>
                        {formatVND(val)}
                    </Typography>
                ),
            },
            {
                field: 'status',
                headerName: 'Status',
                render: (val) => (
                    <StatusChip label={val} color={STATUS_COLOR_MAP[val] || 'default'} />
                ),
            },
            {
                field: 'createdAt',
                headerName: 'Date',
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

    return (
        <Container maxWidth="xl" className="admin-page" sx={{ py: 3 }}>
            <AdminPageHeader title={title} subtitle={subtitle} />

            <Box className="admin-card">
                <DataTable
                    showHeader={false}
                    showIndex
                    columns={columns}
                    data={transactions}
                    totalItems={totalItems}
                    page={page}
                    pageSize={pageSize}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                    loading={loading}
                    actions={false}
                />
            </Box>
        </Container>
    );
}
