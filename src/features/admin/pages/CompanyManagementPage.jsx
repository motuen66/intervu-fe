import { useEffect, useState } from 'react';
import { Container, Avatar, Box, Tooltip, IconButton } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import toast from 'react-hot-toast';
import DataTable from '../../../common/components/table/DataTable';
import AdminPageHeader from '../../../common/components/admin/AdminPageHeader';
import useTableState from '../../../hooks/useTableState';
import { callApi } from '../../../common/utils/apiConnector';
import { METHOD } from '../../../common/constants/api';
import { adminEndPoints } from '../services/adminApi';
import './AdminDashboard.css';

export default function CompanyManagementPage() {
    const { 
        data: companies, setData: setCompanies, 
        loading, setLoading, 
        page, setPage, 
        pageSize, setPageSize, 
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

    const companiesColumns = [
        {
            field: 'id',
            headerName: 'ID',
            width: 120,
            render: (value) => (
                <Tooltip title={value} arrow placement="top">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }}>
                        <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#6b7280' }}>
                            {value?.substring(0, 8)}...
                        </span>
                        <IconButton
                            size="small"
                            onClick={() => handleCopyId(value)}
                            sx={{
                                opacity: 0,
                                transition: 'opacity 0.2s',
                                '&:hover': { opacity: 1 },
                                p: 0.5,
                                color: '#4F46E5'
                            }}
                        >
                            <ContentCopyIcon sx={{ fontSize: '14px' }} />
                        </IconButton>
                    </Box>
                </Tooltip>
            )
        },
        {
            field: 'logoPath',
            headerName: 'Logo',
            width: 80,
            render: (value) => (
                <Avatar
                    src={value}
                    sx={{
                        width: 32,
                        height: 32,
                        backgroundColor: '#e5e7eb',
                        fontSize: '11px',
                        fontWeight: 600
                    }}
                >
                    {value ? '' : 'CO'}
                </Avatar>
            )
        },
        { field: 'name', headerName: 'Company Name', width: 220 },
        { field: 'website', headerName: 'Website', width: 220 },
    ];

    return (
        <Container maxWidth="xl" className="admin-page" sx={{ py: 3 }}>
            <AdminPageHeader 
                title="Company Management" 
                subtitle="Manage company accounts and details."
            />

            <div className="admin-card">
                <DataTable
                    title="Companies Management"
                    showHeader={false}
                    showIndex
                    columns={companiesColumns}
                    data={companies}
                    totalItems={totalItems}
                    page={page}
                    pageSize={pageSize}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                    loading={loading}
                    actions={false}
                />
            </div>
        </Container>
    );
}
