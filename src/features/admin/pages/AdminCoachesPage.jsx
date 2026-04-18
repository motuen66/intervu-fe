import { useState, useEffect, useMemo } from 'react';
import { Container, Box, Avatar, Typography } from '@mui/material';
import { callApi } from '../../../common/utils/apiConnector';
import { METHOD } from '../../../common/constants/api';
import { adminEndPoints } from '../services/adminApi';
import toast from 'react-hot-toast';
import DataTable from '../../../common/components/table/DataTable';
import AdminPageHeader from '../../../common/components/admin/AdminPageHeader';
import SearchInput from '../../../common/components/admin/SearchInput';
import useTableState from '../../../hooks/useTableState';
import './AdminDashboard.css';

// Helper: generate initials-based avatar color from name
const stringToColor = (str = '') => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 55%, 45%)`;
};

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
            // CoachAdminDto: fullName, email
            field: 'fullName',
            headerName: 'Coach',
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
            field: 'specialization',
            headerName: 'Specialization',
            width: 220,
            render: (val) => val || (
                <Typography sx={{ fontSize: '12px', color: 'text.disabled', fontStyle: 'italic' }}>
                    Not set
                </Typography>
            )
        },
        {
            // CoachAdminDto: experience (int, years)
            field: 'experience',
            headerName: 'Experience',
            width: 120,
            render: (val) => val != null ? `${val} yr${val !== 1 ? 's' : ''}` : '-'
        },
        {
            // CoachAdminDto: createdAt
            field: 'createdAt',
            headerName: 'Joined',
            width: 120,
            render: (val) => {
                if (!val) return '-';
                const d = new Date(val);
                return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('vi-VN');
            }
        },
    ], []);

    return (
        <Container maxWidth="xl" className="admin-page" sx={{ py: 3 }}>
            <AdminPageHeader
                title="Coaches"
                subtitle="View and monitor all coach profiles on the platform."
            />

            <Box className="admin-card">
                <Box sx={{
                    display: 'flex', gap: '16px',
                    padding: '16px 20px',
                    borderBottom: '1px solid #E2E8F0',
                    bgcolor: '#fff'
                }}>
                    <SearchInput
                        placeholder="Search by name or email"
                        onSearch={handleSearchChange}
                    />
                </Box>

                <DataTable
                    showHeader={false}
                    showIndex
                    columns={columns}
                    data={coaches}
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
