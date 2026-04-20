import { useEffect, useMemo } from 'react';
import { Container, Avatar, Box, Tooltip, IconButton, TablePagination } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import toast from 'react-hot-toast';
import AdminPageHeader from '../../../common/components/admin/AdminPageHeader';
import useTableState from '../../../hooks/useTableState';
import { callApi } from '../../../common/utils/apiConnector';
import { METHOD } from '../../../common/constants/api';
import { adminEndPoints } from '../services/adminApi';
import { DataGrid, EmptyState, Spinner } from '../../../common/design-system';
import AdminDesignSystemPageShell from '../components/AdminDesignSystemPageShell';
import './AdminDashboard.css';

export default function CompanyManagementPage() {
    const {
        data: companies, setData: setCompanies,
        loading, setLoading,
        page,
        pageSize,
        totalItems, setTotalItems,
        handlePageChange, handlePageSizeChange
    } = useTableState(10);

    const handleCopyId = (id) => {
        navigator.clipboard.writeText(id);
        toast.success('ID copied!');
    };

    const fetchCompanies = async () => {
        setLoading(true);
        const response = await callApi({
            method: METHOD.GET,
            endpoint: `${adminEndPoints.GET_COMPANIES}?page=${page + 1}&pageSize=${pageSize}`,
            useGlobalLoading: false,
        });
        if (response?.success) {
            setCompanies(response.data?.items || []);
            setTotalItems(response.data?.totalItems || 0);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchCompanies();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, pageSize]);

    const companiesColumns = useMemo(() => [
        {
            key: 'index',
            label: '#',
            width: 52,
        },
        {
            key: 'id',
            label: 'ID',
            width: 120,
            render: (value) => (
                <Tooltip title={value} arrow placement="top">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--claude-color-text-stone-gray)' }}>
                            {value?.substring(0, 8)}...
                        </span>
                        <IconButton
                            size="small"
                            onClick={() => handleCopyId(value)}
                            sx={{
                                p: 0.5,
                                color: 'var(--claude-focus-color)'
                            }}
                        >
                            <ContentCopyIcon sx={{ fontSize: '14px' }} />
                        </IconButton>
                    </Box>
                </Tooltip>
            )
        },
        {
            key: 'logoPath',
            label: 'Logo',
            width: 80,
            render: (value) => (
                <Avatar
                    src={value}
                    sx={{
                        width: 32,
                        height: 32,
                        backgroundColor: 'var(--claude-color-surface-warm-sand)',
                        fontSize: '11px',
                        fontWeight: 600
                    }}
                >
                    {value ? '' : 'CO'}
                </Avatar>
            )
        },
        { key: 'name', label: 'Company Name', width: 220, render: (value) => value || '-' },
        { key: 'website', label: 'Website', width: 220, render: (value) => value || '-' },
    ], []);

    const rows = useMemo(
        () => companies.map((row, index) => ({
            ...row,
            index: page * pageSize + index + 1,
        })),
        [companies, page, pageSize],
    );

    return (
        <AdminDesignSystemPageShell>
            <Container maxWidth="xl" className="admin-page" sx={{ py: 3 }}>
                <AdminPageHeader
                    title="Company Management"
                    subtitle="Manage company accounts and details."
                />

                <Box className="admin-card">
                    {loading ? (
                        <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
                            <Spinner />
                        </Box>
                    ) : rows.length === 0 ? (
                        <Box sx={{ p: 2 }}>
                            <EmptyState
                                title="No companies found"
                                body="There are no companies available right now."
                            />
                        </Box>
                    ) : (
                        <DataGrid columns={companiesColumns} rows={rows} striped dense />
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
