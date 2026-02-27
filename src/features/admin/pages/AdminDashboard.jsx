import { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Grid,
    CircularProgress,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PeopleIcon from '@mui/icons-material/People';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import PaymentIcon from '@mui/icons-material/Payment';
import FeedbackIcon from '@mui/icons-material/Feedback';
import StarIcon from '@mui/icons-material/Star';
import StatsCard from '../components/StatsCard';
import DataTable from '../components/DataTable';
import UserFormModal from '../components/UserFormModal';
import toast from 'react-hot-toast';
import { callApi } from '../../../common/utils/apiConnector';
import { METHOD } from '../../../common/constants/api';
import { adminEndPoints } from '../services/adminApi';
import './AdminDashboard.css';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [stats, setStats] = useState(null);
    const [activeTab, setActiveTab] = useState(0);
    const [loading, setLoading] = useState(true);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [openUserModal, setOpenUserModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userFormMode, setUserFormMode] = useState('create');
    const [roleFilter, setRoleFilter] = useState('all');
    const [emailSearch, setEmailSearch] = useState('');

    // Pagination states for each tab
    const [usersData, setUsersData] = useState({ data: [], total: 0, page: 0, pageSize: 10 });
    const [companiesData, setCompaniesData] = useState({ data: [], total: 0, page: 0, pageSize: 10 });
    const [paymentsData, setPaymentsData] = useState({ data: [], total: 0, page: 0, pageSize: 10 });
    const [feedbacksData, setFeedbacksData] = useState({ data: [], total: 0, page: 0, pageSize: 10 });
    const [interviewersData, setInterviewersData] = useState({ data: [], total: 0, page: 0, pageSize: 10 });

    // Fetch stats on mount
    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [usersRes, companiesRes, interviewersRes] = await Promise.all([
                callApi({ method: METHOD.GET, endpoint: `${adminEndPoints.GET_USERS}?page=1&pageSize=1` }),
                callApi({ method: METHOD.GET, endpoint: `${adminEndPoints.GET_COMPANIES}?page=1&pageSize=1` }),
                callApi({ method: METHOD.GET, endpoint: `${adminEndPoints.GET_INTERVIEWERS}?page=1&pageSize=1` }),
            ]);

            // Calculate stats from totalItems
            const calculatedStats = {
                totalUsers: usersRes?.data?.totalItems || 0,
                totalCompanies: companiesRes?.data?.totalItems || 0,
                totalInterviewers: interviewersRes?.data?.totalItems || 0,
                totalPayments: 0,
                totalFeedbacks: 0,
                averageRating: 0
            };

            setStats(calculatedStats);
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
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

    // User Management Handlers
    const handleAddUser = () => {
        setSelectedUser(null);
        setUserFormMode('create');
        setOpenUserModal(true);
    };

    const handleEditUser = (user) => {
        setSelectedUser(user);
        setUserFormMode('edit');
        setOpenUserModal(true);
    };

    const handleDeleteUser = (user) => {
        const userId = typeof user === 'string' ? user : user?.id;
        setSelectedUserId(userId);
        setOpenDeleteDialog(true);
    };

    const confirmDeleteUser = async () => {
        if (!selectedUserId) {
            toast.error('User ID is missing');
            return;
        }

        const { success, message } = await callApi({
            method: METHOD.DELETE,
            endpoint: adminEndPoints.DELETE_USER(selectedUserId),
        });

        if (success) {
            toast.success('User deleted successfully');
            setOpenDeleteDialog(false);
            fetchUsers(usersData.page, usersData.pageSize);
        } else {
            toast.error(message || 'Failed to delete user');
        }
    };

    const handleSubmitUserForm = async (formData, onError) => {
        const endpoint = userFormMode === 'create'
            ? adminEndPoints.CREATE_USER
            : adminEndPoints.UPDATE_USER(selectedUser.id);

        const method = userFormMode === 'create' ? METHOD.POST : METHOD.PUT;

        const { success, message, data } = await callApi({
            method,
            endpoint,
            arg: formData,
        });

        if (success) {
            toast.success(userFormMode === 'create' ? 'User created successfully' : 'User updated successfully');
            setOpenUserModal(false);
            fetchUsers(usersData.page, usersData.pageSize);
        } else {
            // Kiểm tra lỗi email trùng
            if (message && message.toLowerCase().includes('email')) {
                onError?.(message);
            } else {
                toast.error(message || `Failed to ${userFormMode} user`);
            }
        }
    };

    // Role mapping
    const roleMap = {
        0: 'Candidate',
        1: 'Coach',
        2: 'Admin'
    };

    const getRoleLabel = (roleValue) => {
        return roleMap[roleValue] || roleValue;
    };

    const normalizeRoleValue = (roleValue) => {
        if (typeof roleValue === 'number') return roleValue;
        if (typeof roleValue === 'string') {
            const normalized = roleValue.toLowerCase();
            if (normalized === 'candidate') return 0;
            if (normalized === 'coach') return 1;
            if (normalized === 'admin') return 2;
        }
        return roleValue;
    };

    const filteredUsersByRole = roleFilter === 'all'
        ? usersData.data
        : (usersData.data || []).filter((user) => normalizeRoleValue(user.role) === Number(roleFilter));

    const filteredUsers = (filteredUsersByRole || []).filter((user) => {
        if (!emailSearch.trim()) return true;
        return (user.email || '').toLowerCase().includes(emailSearch.trim().toLowerCase());
    });

    // Table columns configurations
    const usersColumns = [
        { field: 'id', headerName: 'ID', width: 70 },
        { field: 'fullName', headerName: 'Full Name', width: 200 },
        { field: 'email', headerName: 'Email', width: 250 },
        {
            field: 'role',
            headerName: 'Role',
            type: 'chip',
            render: (val) => getRoleLabel(val),
            chipColor: (val) => {
                const roleLabel = getRoleLabel(val);
                if (roleLabel === 'Admin') return 'rgba(248,113,113,0.3)';
                if (roleLabel === 'Coach') return 'rgba(74,222,128,0.3)';
                return 'rgba(123,97,255,0.3)';
            }
        }
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
        {
            field: 'status', headerName: 'Status', type: 'chip', chipColor: (val) => {
                if (val === 'SUCCESS') return 'rgba(74,222,128,0.3)';
                if (val === 'PENDING') return 'rgba(251,191,36,0.3)';
                return 'rgba(248,113,113,0.3)';
            }
        },
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

    const currentMeta = {
        title: 'Dashboard',
        subtitle: 'Overview statistics for the platform.'
    };

    return (
        <Container maxWidth="xl" className="admin-page">
            <div className="admin-page-header">
                <div>
                    <h2 className="admin-page-title">{currentMeta.title}</h2>
                    <p className="admin-page-subtitle">{currentMeta.subtitle}</p>
                </div>
                {currentMeta.action && (
                    <button className="admin-primary-btn" onClick={currentMeta.onAction}>
                        + {currentMeta.action}
                    </button>
                )}
            </div>

            {loading && !stats ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress sx={{ color: '#4F46E5' }} />
                </Box>
            ) : (
                <Grid container spacing={3} sx={{ mb: 2 }}>
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
                            color="#4F46E5"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4} lg={2}>
                        <StatsCard
                            title="Avg Rating"
                            value={parseFloat(stats?.averageRating ?? stats?.avgRating ?? stats?.ratingAverage ?? 0).toFixed(2)}
                            icon={StarIcon}
                            color="#fbbf24"
                        />
                    </Grid>
                </Grid>
            )}
            {false && (
                <div className="admin-card" />
            )}
        </Container>
    );
}
