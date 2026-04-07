import { useEffect, useState } from 'react';
import { Container, Avatar, Box, Tooltip, IconButton } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import toast from 'react-hot-toast';
import DataTable from '../components/DataTable';
import { callApi } from '../../../common/utils/apiConnector';
import { METHOD } from '../../../common/constants/api';
import { adminEndPoints } from '../services/adminApi';
import './AdminDashboard.css';

export default function CompanyManagementPage() {
    const [loading, setLoading] = useState(false);
    const [companiesData, setCompaniesData] = useState({ data: [], total: 0, page: 0, pageSize: 10 });

    const fetchCompanies = async (page = 0, pageSize = 10) => {
        setLoading(true);
        const response = await callApi({
            method: METHOD.GET,
            endpoint: `${adminEndPoints.GET_COMPANIES}?page=${page + 1}&pageSize=${pageSize}`,
        });
        if (response?.success) {
            setCompaniesData({
                data: response.data?.items || [],
                total: response.data?.totalItems || 0,
                page,
                pageSize,
            });
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchCompanies(companiesData.page, companiesData.pageSize);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [companiesData.page, companiesData.pageSize]);

    const companiesColumns = [
        {
            field: 'logoPath',
            headerName: 'Logo',
            width: 80,
            render: (value) => (
                <Avatar
                    src={value}
                    sx={{
                        width: 36,
                        height: 36,
                        backgroundColor: '#e5e7eb',
                        fontSize: '12px',
                        fontWeight: 600
                    }}
                >
                    {value ? '' : 'CO'}
                </Avatar>
            )
        },
        { field: 'name', headerName: 'Company Name', width: 200 },
        { field: 'website', headerName: 'Website', width: 220 },
    ];

    return (
        <Container maxWidth="xl" className="admin-page">
            <div className="admin-page-header">
                <div>
                    <h2 className="admin-page-title">Company</h2>
                    <p className="admin-page-subtitle">Manage company accounts and details.</p>
                </div>
            </div>

            <div className="admin-card">
                <DataTable
                    title="Companies Management"
                    showHeader={false}
                    columns={companiesColumns}
                    data={companiesData.data}
                    totalItems={companiesData.total}
                    page={companiesData.page}
                    pageSize={companiesData.pageSize}
                    onPageChange={(newPage) => fetchCompanies(newPage, companiesData.pageSize)}
                    onPageSizeChange={(newSize) => fetchCompanies(0, newSize)}
                    loading={loading}
                    actions={false}
                />
            </div>
        </Container>
    );
}
