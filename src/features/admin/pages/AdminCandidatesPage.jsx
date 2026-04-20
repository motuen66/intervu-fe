import { useState, useEffect, useMemo } from 'react';
import { Container, Box, Avatar, Typography, TablePagination } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { callApi } from '../../../common/utils/apiConnector';
import { METHOD } from '../../../common/constants/api';
import { adminEndPoints } from '../services/adminApi';
import toast from 'react-hot-toast';
import UserFormModal from '../components/UserFormModal';
import ConfirmModal from '../../../common/components/ConfirmModal';
import AdminPageHeader from '../../../common/components/admin/AdminPageHeader';
import TableActionsMenu from '../../../common/components/table/TableActionsMenu';
import useTableState from '../../../hooks/useTableState';
import {
    Badge,
    Button,
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

export default function AdminCandidatesPage() {
    const {
        data: users, setData: setUsers,
        loading, setLoading,
        page, setPage,
        pageSize,
        totalItems, setTotalItems,
        handlePageChange, handlePageSizeChange
    } = useTableState(10);

    const [searchTerm, setSearchTerm] = useState('');
    const [openFormModal, setOpenFormModal] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [openActivateDialog, setOpenActivateDialog] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [formMode, setFormMode] = useState('create');

    useEffect(() => {
        fetchUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, pageSize, searchTerm]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params = [`page=${page + 1}`, `pageSize=${pageSize}`, `role=Candidate`];
            if (searchTerm) params.push(`search=${encodeURIComponent(searchTerm)}`);

            const response = await callApi({
                method: METHOD.GET,
                endpoint: `${adminEndPoints.FILTER_USERS}?${params.join('&')}`,
                useGlobalLoading: false,
            });

            if (response?.success) {
                setUsers(response.data?.items || []);
                setTotalItems(response.data?.totalItems || 0);
            }
        } catch {
            toast.error('Error loading candidates list');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = () => {
        setFormMode('create');
        setSelectedUser(null);
        setOpenFormModal(true);
    };

    const handleSearchChange = (value) => {
        setSearchTerm(value);
        setPage(0);
    };

    const handleEditUser = async (user) => {
        setFormMode('edit');
        setSelectedUser(user);
        setOpenFormModal(true);
        if (user?.phoneNumber) return;
        try {
            const response = await callApi({
                method: METHOD.GET,
                endpoint: adminEndPoints.GET_USER_BY_ID(user.id),
            });
            if (response?.success) {
                const detail = response.data?.item || response.data?.user || response.data;
                if (detail) setSelectedUser(detail);
            }
        } catch {
            toast.error('Error loading user detail');
        }
    };

    const handleDeleteClick = (user) => {
        if (user.status === 1 || user.status === 'Inactive') {
            toast.error('User is already suspended');
            return;
        }
        setSelectedUser(user);
        setOpenDeleteDialog(true);
    };

    const handleDeleteConfirm = async () => {
        if (!selectedUser) return;
        try {
            const response = await callApi({
                method: METHOD.DELETE,
                endpoint: adminEndPoints.DELETE_USER(selectedUser.id),
            });
            if (response?.success) {
                toast.success('User deactivated successfully!');
                fetchUsers();
            } else {
                toast.error('Cannot deactivate user');
            }
        } catch {
            toast.error('Error deactivating user');
        } finally {
            setOpenDeleteDialog(false);
            setSelectedUser(null);
        }
    };

    const handleActivateClick = (user) => {
        if (user.status !== 1 && user.status !== 'Inactive') {
            toast.error('User is not suspended');
            return;
        }
        setSelectedUser(user);
        setOpenActivateDialog(true);
    };

    const handleActivateConfirm = async () => {
        if (!selectedUser) return;
        try {
            const response = await callApi({
                method: METHOD.PUT,
                endpoint: adminEndPoints.ACTIVATE_USER(selectedUser.id),
            });
            if (response?.success) {
                toast.success('User activated successfully!');
                fetchUsers();
            } else {
                toast.error('Cannot activate user');
            }
        } catch {
            toast.error('Error activating user');
        } finally {
            setOpenActivateDialog(false);
            setSelectedUser(null);
        }
    };

    const handleFormSubmit = async (formData, onError) => {
        try {
            let response;
            if (formMode === 'create') {
                response = await callApi({
                    method: METHOD.POST,
                    endpoint: adminEndPoints.CREATE_USER,
                    arg: { ...formData, role: 0 }, // Force Candidate role
                });
            } else {
                response = await callApi({
                    method: METHOD.PUT,
                    endpoint: adminEndPoints.UPDATE_USER(selectedUser.id),
                    arg: formData,
                });
            }
            if (response?.success) {
                toast.success(formMode === 'create' ? 'Candidate created!' : 'Candidate updated!');
                setOpenFormModal(false);
                fetchUsers();
            } else {
                const message = response?.message || 'An error occurred';
                onError?.(message);
                toast.error(message);
            }
        } catch (error) {
            const message = error?.response?.data?.message || error?.message || 'Save failed';
            onError?.(message);
            toast.error(message);
        }
    };

    const getStatusLabel = (status) => (status === 1 || status === 'Inactive') ? 'Suspended' : 'Active';
    const getStatusVariant = (status) => (status === 1 || status === 'Inactive') ? 'error' : 'success';

    const columns = useMemo(() => [
        {
            key: 'index',
            label: '#',
            width: 52,
        },
        {
            key: 'fullName',
            label: 'Candidate',
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
            key: 'phoneNumber',
            label: 'Phone',
            width: 150,
            render: (val) => val || '-',
        },
        {
            key: 'status',
            label: 'Status',
            width: 120,
            render: (val) => (
                <Badge variant={getStatusVariant(val)}>{getStatusLabel(val)}</Badge>
            ),
        },
        {
            key: 'createdAt',
            label: 'Joined',
            width: 120,
            render: (val) => {
                if (!val) return '-';
                const d = new Date(val);
                return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('vi-VN');
            }
        },
        {
            key: 'actions',
            label: 'Actions',
            width: 110,
            render: (_, row) => {
                const isDeactivated = row.status === 1 || row.status === 'Inactive';
                const actions = [
                    { label: 'Edit', icon: <EditIcon fontSize="small" sx={{ color: 'primary.main' }} />, onClick: () => handleEditUser(row) },
                    isDeactivated
                        ? { label: 'Activate', icon: <CheckCircleOutlineIcon fontSize="small" color="success" />, onClick: () => handleActivateClick(row) }
                        : { label: 'Deactivate', icon: <DeleteIcon fontSize="small" color="error" />, onClick: () => handleDeleteClick(row) }
                ];
                return <TableActionsMenu actions={actions} />;
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], []);

    const rows = useMemo(
        () => users.map((row, index) => ({
            ...row,
            index: page * pageSize + index + 1,
        })),
        [users, page, pageSize],
    );

    return (
        <AdminDesignSystemPageShell>
            <Container maxWidth="xl" className="admin-page" sx={{ py: 3 }}>
                <AdminPageHeader
                    title="Candidates"
                    subtitle="Manage candidate accounts on the platform."
                    actionButton={
                        <Button onClick={handleCreateUser}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                <AddIcon sx={{ fontSize: 18 }} />
                                Add Candidate
                            </span>
                        </Button>
                    }
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
                                title="No candidates found"
                                body="Try adjusting your search to find candidate accounts."
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

                <UserFormModal
                    open={openFormModal}
                    onClose={() => setOpenFormModal(false)}
                    onSubmit={handleFormSubmit}
                    user={selectedUser}
                    mode={formMode}
                />

                <ConfirmModal
                    show={openDeleteDialog}
                    title="Deactivate candidate"
                    confirmText="Deactivate"
                    cancelText="Cancel"
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setOpenDeleteDialog(false)}
                    message={
                        <>
                            Are you sure you want to deactivate <strong>{selectedUser?.fullName || selectedUser?.email}</strong>?
                            <Typography component="span" sx={{ display: 'block', color: 'error.main', fontSize: '0.875rem', mt: 1 }}>
                                This will set the user&apos;s status to Inactive.
                            </Typography>
                        </>
                    }
                />

                <ConfirmModal
                    show={openActivateDialog}
                    title="Activate candidate"
                    confirmText="Activate"
                    cancelText="Cancel"
                    onConfirm={handleActivateConfirm}
                    onCancel={() => setOpenActivateDialog(false)}
                    message={
                        <>
                            Activate <strong>{selectedUser?.fullName || selectedUser?.email}</strong>?
                            <Typography component="span" sx={{ display: 'block', color: 'success.main', fontSize: '0.875rem', mt: 1 }}>
                                This will restore the user&apos;s access to the platform.
                            </Typography>
                        </>
                    }
                />
            </Container>
        </AdminDesignSystemPageShell>
    );
}
