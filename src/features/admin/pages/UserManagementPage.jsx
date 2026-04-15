import { useState, useEffect } from 'react';
import { Container } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { callApi } from '../../../common/utils/apiConnector';
import { METHOD } from '../../../common/constants/api';
import { adminEndPoints } from '../services/adminApi';
import toast from 'react-hot-toast';
import UserFormModal from '../components/UserFormModal';
import DataTable from '../../../common/components/table/DataTable';
import ConfirmModal from '../../../common/components/ConfirmModal';
import { PrimaryButton } from '../../../common/components/buttons';

import AdminPageHeader from '../../../common/components/admin/AdminPageHeader';
import SearchInput from '../../../common/components/admin/SearchInput';
import FilterDropdown from '../../../common/components/admin/FilterDropdown';
import TableActionsMenu from '../../../common/components/table/TableActionsMenu';
import useTableState from '../../../hooks/useTableState';
import './AdminDashboard.css';

export default function UserManagementPage() {
    const { 
        data: users, setData: setUsers, 
        loading, setLoading, 
        page, setPage, 
        pageSize, setPageSize, 
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

    const getRoleColor = (role) => {
        switch (getRoleLabel(role).toUpperCase()) {
            case 'ADMIN': return 'rgba(248,113,113,0.3)';
            case 'INTERVIEWER': return 'rgba(59,130,246,0.3)';
            case 'CANDIDATE': return 'rgba(34,197,94,0.3)';
            default: return 'rgba(123,97,255,0.3)';
        }
    };

    const getStatusLabel = (status) => {
        if (status === 1 || status === 'Inactive') return 'Suspended';
        return 'Active';
    };

    const getStatusColor = (status) => {
        if (status === 1 || status === 'Inactive') return 'error';
        return 'success';
    };

    const usersColumns = [
        { field: 'id', headerName: 'ID', width: 70 },
        { field: 'fullName', headerName: 'Full Name', width: 200 },
        { field: 'email', headerName: 'Email', width: 250 },
        {
            field: 'role',
            headerName: 'Role',
            type: 'chip',
            render: (val) => getRoleLabel(val),
            chipColor: (val) => getRoleColor(val)
        },
        {
            field: 'status',
            headerName: 'Status',
            type: 'chip',
            render: (val) => getStatusLabel(val),
            chipColor: (val) => getStatusColor(val)
        },
        {
            field: 'actions',
            headerName: 'Actions',
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
    ];

    const roleOptions = [
        { label: 'Candidate', value: 'Candidate' },
        { label: 'Interviewer', value: 'Interviewer' },
        { label: 'Admin', value: 'Admin' },
        { label: 'Coach', value: 'Coach' }
    ];

    return (
        <Container maxWidth="xl" className="admin-page" sx={{ py: 3 }}>
            <AdminPageHeader 
                title="Users Management" 
                subtitle="Manage user accounts and details."
                actionButton={
                    <PrimaryButton
                        startIcon={<AddIcon />}
                        onClick={handleCreateUser}
                        sx={{
                            textTransform: 'none',
                            px: 3,
                            py: 1,
                            borderRadius: '999px',
                            fontSize: '14px',
                            fontWeight: 600,
                        }}
                    >
                        Create User
                    </PrimaryButton>
                }
            />

            <div className="admin-card">
                <div style={{ display: 'flex', gap: '16px', padding: '16px 20px', borderBottom: '1px solid #E2E8F0', backgroundColor: '#fff' }}>
                    <SearchInput 
                        placeholder="Search by name, email, or phone" 
                        onSearch={handleSearchChange} 
                    />
                    <FilterDropdown 
                        options={roleOptions} 
                        value={roleFilter} 
                        onChange={handleRoleChange} 
                        placeholder="All roles" 
                    />
                </div>
                
                <DataTable
                    title="Users Table"
                    showHeader={false}
                    showIndex
                    columns={usersColumns}
                    data={users}
                    totalItems={totalItems}
                    page={page}
                    pageSize={pageSize}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                    loading={loading}
                    actions={false}
                />
            </div>

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
                        Are you sure you want to deactivate <strong>{selectedUser?.fullName || selectedUser?.email}</strong>?{"\n\n"}
                        <span style={{ color: '#d32f2f', fontSize: '0.875rem' }}>This action will set the user's status to Inactive.</span>
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
                        Are you sure you want to activate <strong>{selectedUser?.fullName || selectedUser?.email}</strong>?{"\n\n"}
                        <span style={{ color: '#2e7d32', fontSize: '0.875rem' }}>This action will grant the user access to the system again.</span>
                    </>
                }
            />
        </Container>
    );
}
