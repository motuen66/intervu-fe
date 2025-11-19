import { useState, useEffect } from 'react';
import { 
    Box, 
    Container, 
    Grid, 
    Typography, 
    Tabs, 
    Tab,
    CircularProgress 
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import PaymentIcon from '@mui/icons-material/Payment';
import FeedbackIcon from '@mui/icons-material/Feedback';
import StarIcon from '@mui/icons-material/Star';
import StatsCard from '../components/StatsCard';
import DataTable from '../components/DataTable';
import { callApi } from '../../../common/utils/apiConnector';
import { METHOD } from '../../../common/constants/api';
import { adminEndPoints } from '../services/adminApi';

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [activeTab, setActiveTab] = useState(0);
    const [loading, setLoading] = useState(true);
    
    // Pagination states for each tab
    const [usersData, setUsersData] = useState({ data: [], total: 0, page: 0, pageSize: 10 });
    const [companiesData, setCompaniesData] = useState({ data: [], total: 0, page: 0, pageSize: 10 });
    const [paymentsData, setPaymentsData] = useState({ data: [], total: 0, page: 0, pageSize: 10 });
    const [feedbacksData, setFeedbacksData] = useState({ data: [], total: 0, page: 0, pageSize: 10 });
    const [interviewersData, setInterviewersData] = useState({ data: [], total: 0, page: 0, pageSize: 10 });

    // Fetch stats on mount
    useEffect(() => {
        fetchStats();
    }, []);

    // Fetch data when tab changes
    useEffect(() => {
        switch(activeTab) {
            case 0: fetchUsers(usersData.page, usersData.pageSize); break;
            case 1: fetchCompanies(companiesData.page, companiesData.pageSize); break;
            case 2: fetchPayments(paymentsData.page, paymentsData.pageSize); break;
            case 3: fetchFeedbacks(feedbacksData.page, feedbacksData.pageSize); break;
            case 4: fetchInterviewers(interviewersData.page, interviewersData.pageSize); break;
        }
    }, [activeTab]);

    const fetchStats = async () => {
        setLoading(true);
        const response = await callApi({
            method: METHOD.GET,
            endpoint: adminEndPoints.GET_STATS,
        });
        console.log('📊 Stats Response:', response);
        if (response?.success) {
            setStats(response.data);
        }
        setLoading(false);
    };

    const fetchUsers = async (page = 0, pageSize = 10) => {
        setLoading(true);
        const response = await callApi({
            method: METHOD.GET,
            endpoint: `${adminEndPoints.GET_USERS}?page=${page + 1}&pageSize=${pageSize}`,
        });
        console.log('👥 Users Response:', response);
        if (response?.success) {
            setUsersData({ 
                data: response.data?.items || [], 
                total: response.data?.totalItems || 0, 
                page, 
                pageSize 
            });
        }
        setLoading(false);
    };

    const fetchCompanies = async (page = 0, pageSize = 10) => {
        setLoading(true);
        const response = await callApi({
            method: METHOD.GET,
            endpoint: `${adminEndPoints.GET_COMPANIES}?page=${page + 1}&pageSize=${pageSize}`,
        });
        console.log('🏢 Companies Response:', response);
        if (response?.success) {
            setCompaniesData({ 
                data: response.data?.items || [], 
                total: response.data?.totalItems || 0, 
                page, 
                pageSize 
            });
        }
        setLoading(false);
    };

    const fetchPayments = async (page = 0, pageSize = 10) => {
        setLoading(true);
        const response = await callApi({
            method: METHOD.GET,
            endpoint: `${adminEndPoints.GET_PAYMENTS}?page=${page + 1}&pageSize=${pageSize}`,
        });
        console.log('💳 Payments Response:', response);
        if (response?.success) {
            setPaymentsData({ 
                data: response.data?.items || [], 
                total: response.data?.totalItems || 0, 
                page, 
                pageSize 
            });
        }
        setLoading(false);
    };

    const fetchFeedbacks = async (page = 0, pageSize = 10) => {
        setLoading(true);
        const response = await callApi({
            method: METHOD.GET,
            endpoint: `${adminEndPoints.GET_FEEDBACKS}?page=${page + 1}&pageSize=${pageSize}`,
        });
        console.log('📝 Feedbacks Response:', response);
        if (response?.success) {
            setFeedbacksData({ 
                data: response.data?.items || [], 
                total: response.data?.totalItems || 0, 
                page, 
                pageSize 
            });
        }
        setLoading(false);
    };

    const fetchInterviewers = async (page = 0, pageSize = 10) => {
        setLoading(true);
        const response = await callApi({
            method: METHOD.GET,
            endpoint: `${adminEndPoints.GET_INTERVIEWERS}?page=${page + 1}&pageSize=${pageSize}`,
        });
        console.log('🎤 Interviewers Response:', response);
        if (response?.success) {
            setInterviewersData({ 
                data: response.data?.items || [], 
                total: response.data?.totalItems || 0, 
                page, 
                pageSize 
            });
        }
        setLoading(false);
    };

    // Table columns configurations
    const usersColumns = [
        { field: 'id', headerName: 'ID', width: 70 },
        { field: 'fullName', headerName: 'Full Name', width: 200 },
        { field: 'email', headerName: 'Email', width: 250 },
        { field: 'role', headerName: 'Role', type: 'chip', chipColor: (val) => val === 'ADMIN' ? 'rgba(248,113,113,0.3)' : 'rgba(123,97,255,0.3)' },
        { field: 'createdAt', headerName: 'Created At', type: 'date' },
    ];

    const companiesColumns = [
        { field: 'id', headerName: 'ID', width: 70 },
        { field: 'name', headerName: 'Company Name', width: 250 },
        { field: 'email', headerName: 'Email', width: 200 },
        { field: 'phone', headerName: 'Phone', width: 150 },
        { field: 'address', headerName: 'Address', width: 200 },
        { field: 'createdAt', headerName: 'Created At', type: 'date' },
    ];

    const paymentsColumns = [
        { field: 'id', headerName: 'ID', width: 70 },
        { field: 'userId', headerName: 'User ID', width: 100 },
        { field: 'amount', headerName: 'Amount', type: 'currency' },
        { field: 'status', headerName: 'Status', type: 'chip', chipColor: (val) => {
            if (val === 'SUCCESS') return 'rgba(74,222,128,0.3)';
            if (val === 'PENDING') return 'rgba(251,191,36,0.3)';
            return 'rgba(248,113,113,0.3)';
        }},
        { field: 'createdAt', headerName: 'Created At', type: 'date' },
    ];

    const feedbacksColumns = [
        { field: 'id', headerName: 'ID', width: 70 },
        { field: 'userId', headerName: 'User ID', width: 100 },
        { field: 'rating', headerName: 'Rating', render: (val) => `⭐ ${val}/5` },
        { field: 'comment', headerName: 'Comment', width: 300 },
        { field: 'createdAt', headerName: 'Created At', type: 'date' },
    ];

    const interviewersColumns = [
        { field: 'id', headerName: 'ID', width: 70 },
        { field: 'fullName', headerName: 'Full Name', width: 200 },
        { field: 'email', headerName: 'Email', width: 200 },
        { field: 'phoneNumber', headerName: 'Phone', width: 150 },
        { field: 'specialization', headerName: 'Specialization', width: 150 },
        { field: 'experienceYears', headerName: 'Experience (Years)', width: 150, render: (val) => val ? `${val} years` : '-' },
        { field: 'createdAt', headerName: 'Created At', type: 'date' },
    ];

    return (
        <Box sx={{ 
            minHeight: '100vh', 
            background: 'linear-gradient(135deg, #f5f7fa 0%, #e8eaf6 50%, #f3e5f5 100%)',
            py: 4
        }}>
            <Container maxWidth="xl">
                {/* Header */}
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h3" sx={{ 
                        color: '#1a1a2e', 
                        fontWeight: 800, 
                        mb: 1,
                        background: 'linear-gradient(135deg, #7B61FF 0%, #B794F6 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        Admin Dashboard
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'rgba(0,0,0,0.6)' }}>
                        Manage your platform with ease
                    </Typography>
                </Box>

                {/* Stats Cards */}
                {loading && !stats ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <CircularProgress sx={{ color: '#7B61FF' }} />
                    </Box>
                ) : (
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        <Grid item xs={12} sm={6} md={4} lg={2}>
                            <StatsCard 
                                title="Total Users" 
                                value={stats?.totalUsers} 
                                icon={PeopleIcon}
                                color="#7B61FF"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={4} lg={2}>
                            <StatsCard 
                                title="Total Companies" 
                                value={stats?.totalCompanies} 
                                icon={BusinessIcon}
                                color="#4ade80"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={4} lg={2}>
                            <StatsCard 
                                title="Total Interviewers" 
                                value={stats?.totalInterviewers} 
                                icon={PersonIcon}
                                color="#60a5fa"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={4} lg={2}>
                            <StatsCard 
                                title="Total Payments" 
                                value={stats?.totalPayments} 
                                icon={PaymentIcon}
                                color="#f59e0b"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={4} lg={2}>
                            <StatsCard 
                                title="Total Feedbacks" 
                                value={stats?.totalFeedbacks} 
                                icon={FeedbackIcon}
                                color="#8b5cf6"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={4} lg={2}>
                            <StatsCard 
                                title="Avg Rating" 
                                value={parseFloat(stats?.averageRating || 0).toFixed(2)} 
                                icon={StarIcon}
                                color="#fbbf24"
                            />
                        </Grid>
                    </Grid>
                )}

                {/* Tabs for different data tables */}
                <Box sx={{ 
                    background: 'rgba(255,255,255,0.9)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(123,97,255,0.2)',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    mb: 3,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                }}>
                    <Tabs 
                        value={activeTab} 
                        onChange={(e, val) => setActiveTab(val)}
                        sx={{
                            borderBottom: '1px solid rgba(123,97,255,0.15)',
                            '& .MuiTab-root': {
                                color: 'rgba(0,0,0,0.6)',
                                fontWeight: 600,
                                textTransform: 'none',
                                fontSize: '14px',
                                '&.Mui-selected': {
                                    color: '#7B61FF'
                                }
                            },
                            '& .MuiTabs-indicator': {
                                backgroundColor: '#7B61FF',
                                height: '3px',
                                borderRadius: '3px 3px 0 0'
                            }
                        }}
                    >
                        <Tab label="Users" />
                        <Tab label="Companies" />
                        <Tab label="Payments" />
                        <Tab label="Feedbacks" />
                        <Tab label="Interviewers" />
                    </Tabs>
                </Box>

                {/* Data Tables */}
                {activeTab === 0 && (
                    <DataTable 
                        title="Users Management"
                        columns={usersColumns}
                        data={usersData.data}
                        totalItems={usersData.total}
                        page={usersData.page}
                        pageSize={usersData.pageSize}
                        onPageChange={(newPage) => fetchUsers(newPage, usersData.pageSize)}
                        onPageSizeChange={(newSize) => fetchUsers(0, newSize)}
                        loading={loading}
                    />
                )}

                {activeTab === 1 && (
                    <DataTable 
                        title="Companies Management"
                        columns={companiesColumns}
                        data={companiesData.data}
                        totalItems={companiesData.total}
                        page={companiesData.page}
                        pageSize={companiesData.pageSize}
                        onPageChange={(newPage) => fetchCompanies(newPage, companiesData.pageSize)}
                        onPageSizeChange={(newSize) => fetchCompanies(0, newSize)}
                        loading={loading}
                    />
                )}

                {activeTab === 2 && (
                    <DataTable 
                        title="Payments Management"
                        columns={paymentsColumns}
                        data={paymentsData.data}
                        totalItems={paymentsData.total}
                        page={paymentsData.page}
                        pageSize={paymentsData.pageSize}
                        onPageChange={(newPage) => fetchPayments(newPage, paymentsData.pageSize)}
                        onPageSizeChange={(newSize) => fetchPayments(0, newSize)}
                        loading={loading}
                    />
                )}

                {activeTab === 3 && (
                    <DataTable 
                        title="Feedbacks Management"
                        columns={feedbacksColumns}
                        data={feedbacksData.data}
                        totalItems={feedbacksData.total}
                        page={feedbacksData.page}
                        pageSize={feedbacksData.pageSize}
                        onPageChange={(newPage) => fetchFeedbacks(newPage, feedbacksData.pageSize)}
                        onPageSizeChange={(newSize) => fetchFeedbacks(0, newSize)}
                        loading={loading}
                    />
                )}

                {activeTab === 4 && (
                    <DataTable 
                        title="Interviewers Management"
                        columns={interviewersColumns}
                        data={interviewersData.data}
                        totalItems={interviewersData.total}
                        page={interviewersData.page}
                        pageSize={interviewersData.pageSize}
                        onPageChange={(newPage) => fetchInterviewers(newPage, interviewersData.pageSize)}
                        onPageSizeChange={(newSize) => fetchInterviewers(0, newSize)}
                        loading={loading}
                    />
                )}
            </Container>
        </Box>
    );
}
