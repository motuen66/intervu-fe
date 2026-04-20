import { useState, useEffect, useMemo } from 'react';
import { Container, Box, TablePagination } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
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
    SelectField,
    Spinner,
    Toolbar,
} from '../../../common/design-system';
import AdminDesignSystemPageShell from '../components/AdminDesignSystemPageShell';
import './AdminDashboard.css';

export default function UserManagementPage() {
    const {
        data: users, setData: setUsers,
        loading, setLoading,
        page, setPage,
        pageSize,
        totalItems, setTotalItems,
        handlePageChange, handlePageSizeChange
    } = useTableState(10);

    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');

    // Modal states
    const [openFormModal, setOpenFormModal] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [openActivateDialog, setOpenActivateDialog] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [formMode, setFormMode] = useState('create');

    useEffect(() => {
        fetchUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, pageSize, roleFilter, searchTerm]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params = [`page=${page + 1}`, `pageSize=${pageSize}`];
            if (roleFilter && roleFilter !== 'all') {
                params.push(`role=${encodeURIComponent(roleFilter)}`);
            }
            if (searchTerm) {
                params.push(`search=${encodeURIComponent(searchTerm)}`);
            }

            const response = await callApi({
                method: METHOD.GET,
                endpoint: `${adminEndPoints.FILTER_USERS}?${params.join('&')}`,
                useGlobalLoading: false,
            });

            if (response?.success) {
                setUsers(response.data?.items || []);
                setTotalItems(response.data?.totalItems || 0);
            }
        } catch (error) {
            toast.error('Error loading user list');
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

    const handleRoleChange = (value) => {
        setRoleFilter(value);
        setPage(0);
    };

    const handleEditUser = async (user) => {
        setFormMode('edit');
        setSelectedUser(user);
        setOpenFormModal(true);
        if (user?.phoneNumber) {
            return;
        }

        try {
            const response = await callApi({
                method: METHOD.GET,
                endpoint: adminEndPoints.GET_USER_BY_ID(user.id),
            });

            if (response?.success) {
                const detail = response.data?.item || response.data?.user || response.data;
                if (detail) {
                    setSelectedUser(detail);
                }
            }
        } catch (error) {
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
        } catch (error) {
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
        } catch (error) {
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
                    arg: formData,
                });
            } else {
                response = await callApi({
                    method: METHOD.PUT,
                    endpoint: adminEndPoints.UPDATE_USER(selectedUser.id),
                    arg: formData,
                });
            }

            if (response?.success) {
                toast.success(formMode === 'create' ? 'Tạo user thành công!' : 'Cập nhật user thành công!');
                setOpenFormModal(false);
                fetchUsers();
            } else {
                const message = response?.message || 'Có lỗi xảy ra';
                onError?.(message);
                toast.error(message);
            }
        } catch (error) {
            const message = error?.response?.data?.message || error?.message || 'Lỗi khi lưu user';
            onError?.(message);
            toast.error(message);
        }
    };

    const getRoleLabel = (role) => {
        if (typeof role === 'number') {
            if (role === 2) return 'ADMIN';
            if (role === 1) return 'INTERVIEWER';
            return 'CANDIDATE';
        }
        return (role || '').toString();
    };

    const getRoleVariant = (role) => {
        switch (getRoleLabel(role).toUpperCase()) {
            case 'ADMIN': return 'error';
            case 'INTERVIEWER': return 'brand';
            case 'CANDIDATE': return 'success';
            case 'COACH': return 'warning';
            default: return 'neutral';
        }
    };

    const getStatusLabel = (status) => {
        if (status === 1 || status === 'Inactive') return 'Suspended';
        return 'Active';
    };

    const getStatusVariant = (status) => {
        if (status === 1 || status === 'Inactive') return 'error';
        return 'success';
    };

    const usersColumns = useMemo(() => [
        { key: 'index', label: '#', width: 52 },
        { key: 'id', label: 'ID', width: 70 },
        { key: 'fullName', label: 'Full Name', width: 220, render: (val) => val || '-' },
        { key: 'email', label: 'Email', width: 260, render: (val) => val || '-' },
        {
            key: 'role',
            label: 'Role',
            width: 140,
            render: (val) => (
                <Badge variant={getRoleVariant(val)}>{getRoleLabel(val)}</Badge>
            )
        },
        {
            key: 'status',
            label: 'Status',
            width: 130,
            render: (val) => (
                <Badge variant={getStatusVariant(val)}>{getStatusLabel(val)}</Badge>
            )
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

    const roleOptions = [
        { label: 'Candidate', value: 'Candidate' },
        { label: 'Interviewer', value: 'Interviewer' },
        { label: 'Admin', value: 'Admin' },
        { label: 'Coach', value: 'Coach' }
    ];

    return (
        <AdminDesignSystemPageShell>
            <Container maxWidth="xl" className="admin-page" sx={{ py: 3 }}>
                <AdminPageHeader
                    title="Users Management"
                    subtitle="Manage user accounts and details."
                    actionButton={
                        <Button onClick={handleCreateUser}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                <AddIcon sx={{ fontSize: 18 }} />
                                Create User
                            </span>
                        </Button>
                    }
                />

                <Box className="admin-card">
                    <Toolbar
                        group={
                            <div style={{ minWidth: 280, width: '100%', maxWidth: 420 }}>
                                <SearchField
                                    placeholder="Search by name, email, or phone"
                                    value={searchTerm}
                                    onChange={(e) => handleSearchChange(e.target.value)}
                                    onClear={() => handleSearchChange('')}
                                />
                            </div>
                        }
                        actions={
                            <div style={{ minWidth: 180 }}>
                                <SelectField value={roleFilter} onChange={(e) => handleRoleChange(e.target.value)}>
                                    <option value="all">All roles</option>
                                    {roleOptions.map((opt) => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </SelectField>
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
                                title="No users found"
                                body="Try adjusting your filters to find matching users."
                            />
                        </Box>
                    ) : (
                        <DataGrid columns={usersColumns} rows={rows} striped dense />
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

                {/* Form Modal */}
                <UserFormModal
                    open={openFormModal}
                    onClose={() => setOpenFormModal(false)}
                    onSubmit={handleFormSubmit}
                    user={selectedUser}
                    mode={formMode}
                />

                {/* Delete Confirmation Dialog */}
                <ConfirmModal
                    show={openDeleteDialog}
                    title="Deactivate user"
                    confirmText="Deactivate"
                    cancelText="Cancel"
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setOpenDeleteDialog(false)}
                    message={
                        <>
                            Are you sure you want to deactivate <strong>{selectedUser?.fullName || selectedUser?.email}</strong>?{' '}
                            <span style={{ display: 'block', color: '#d32f2f', fontSize: '0.875rem', marginTop: 8 }}>
                                This action will set the user&apos;s status to Inactive.
                            </span>
                        </>
                    }
                />

                {/* Activate Confirmation Dialog */}
                <ConfirmModal
                    show={openActivateDialog}
                    title="Activate user"
                    confirmText="Activate"
                    cancelText="Cancel"
                    onConfirm={handleActivateConfirm}
                    onCancel={() => setOpenActivateDialog(false)}
                    message={
                        <>
                            Are you sure you want to activate <strong>{selectedUser?.fullName || selectedUser?.email}</strong>?{' '}
                            <span style={{ display: 'block', color: '#2e7d32', fontSize: '0.875rem', marginTop: 8 }}>
                                This action will grant the user access to the system again.
                            </span>
                        </>
                    }
                />
            </Container>
        </AdminDesignSystemPageShell>
    );
}
