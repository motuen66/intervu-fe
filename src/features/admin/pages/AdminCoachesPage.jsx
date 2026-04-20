import { useState, useEffect, useMemo } from 'react';
import { Container, Box, Avatar, Typography, TablePagination } from '@mui/material';
import { callApi } from '../../../common/utils/apiConnector';
import { METHOD } from '../../../common/constants/api';
import { adminEndPoints } from '../services/adminApi';
import toast from 'react-hot-toast';
import AdminPageHeader from '../../../common/components/admin/AdminPageHeader';
import useTableState from '../../../hooks/useTableState';
import {
    DataGrid,
    EmptyState,
    SearchField,
    Spinner,
    Toolbar,
} from '../../../common/design-system';
import AdminDesignSystemPageShell from '../components/AdminDesignSystemPageShell';
import './AdminDashboard.css';

const getInitials = (name = '') =>
    name.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase() || '?';

export default function AdminCoachesPage() {
    const {
        data: coaches, setData: setCoaches,
        loading, setLoading,
        page, setPage,
        pageSize,
        totalItems, setTotalItems,
        handlePageChange, handlePageSizeChange
    } = useTableState(10);

    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchCoaches();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, pageSize, searchTerm]);

    const fetchCoaches = async () => {
        setLoading(true);
        try {
            const params = [`page=${page + 1}`, `pageSize=${pageSize}`];
            if (searchTerm) params.push(`search=${encodeURIComponent(searchTerm)}`);

            const response = await callApi({
                method: METHOD.GET,
                endpoint: `${adminEndPoints.GET_INTERVIEWERS}?${params.join('&')}`,
                useGlobalLoading: false,
            });

            if (response?.success) {
                // API returns PagedResult<CoachAdminDto> — try both shapes
                const items = response.data?.items ?? (Array.isArray(response.data) ? response.data : []);
                setCoaches(items);
                setTotalItems(response.data?.totalCount ?? response.data?.totalItems ?? items.length);
            }
        } catch {
            toast.error('Error loading coaches list');
        } finally {
            setLoading(false);
        }
    };

    const handleSearchChange = (value) => {
        setSearchTerm(value);
        setPage(0);
    };

    const columns = useMemo(() => [
        {
            key: 'index',
            label: '#',
            width: 52,
        },
        {
            // CoachAdminDto: fullName, email
            key: 'fullName',
            label: 'Coach',
            width: 240,
            render: (val, row) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar
                        sx={{
                            width: 32, height: 32,
                            fontSize: 13, fontWeight: 700,
                            bgcolor: 'secondary.main', // Lime
                            color: 'primary.main',     // Navy
                        }}
                    >
                        {getInitials(val)}
                    </Avatar>
                    <Box>
                        <Typography sx={{ fontSize: '13px', fontWeight: 600, color: 'text.primary', lineHeight: 1.3 }}>
                            {val || '-'}
                        </Typography>
                        <Typography sx={{ fontSize: '11px', color: 'text.secondary' }}>
                            {row.email || ''}
                        </Typography>
                    </Box>
                </Box>
            )
        },
        {
            // CoachAdminDto: specialization (joined skills list)
            key: 'specialization',
            label: 'Specialization',
            width: 220,
            render: (val) => val || (
                <Typography sx={{ fontSize: '12px', color: 'text.disabled', fontStyle: 'italic' }}>
                    Not set
                </Typography>
            )
        },
        {
            // CoachAdminDto: experience (int, years)
            key: 'experience',
            label: 'Experience',
            width: 120,
            render: (val) => val != null ? `${val} yr${val !== 1 ? 's' : ''}` : '-'
        },
        {
            // CoachAdminDto: createdAt
            key: 'createdAt',
            label: 'Joined',
            width: 120,
            render: (val) => {
                if (!val) return '-';
                const d = new Date(val);
                return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('vi-VN');
            }
        },
    ], []);

    const rows = useMemo(
        () => coaches.map((row, index) => ({
            ...row,
            index: page * pageSize + index + 1,
        })),
        [coaches, page, pageSize],
    );

    return (
        <AdminDesignSystemPageShell>
        <Container maxWidth="xl" className="admin-page" sx={{ py: 3 }}>
            <AdminPageHeader
                title="Coaches"
                subtitle="View and monitor all coach profiles on the platform."
            />

            <Box className="admin-card">
                <Toolbar
                    group={
                        <div style={{ minWidth: 280, width: '100%', maxWidth: 420 }}>
                            <SearchField
                                placeholder="Search by name or email"
                                value={searchTerm}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                onClear={() => handleSearchChange('')}
                            />
                        </div>
                    }
                />

                {loading ? (
                    <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
                        <Spinner />
                    </Box>
                ) : rows.length === 0 ? (
                    <Box sx={{ p: 2 }}>
                        <EmptyState
                            title="No coaches found"
                            body="Try adjusting your search to find coach profiles."
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
