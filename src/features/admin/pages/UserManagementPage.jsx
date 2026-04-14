import { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    Select,
    MenuItem,
    IconButton,
    Menu,
    ListItemIcon,
    ListItemText,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { callApi } from '../../../common/utils/apiConnector';
import { METHOD } from '../../../common/constants/api';
import { adminEndPoints } from '../services/adminApi';
import toast from 'react-hot-toast';
import UserFormModal from '../components/UserFormModal';
import DataTable from '../components/DataTable';
import ConfirmModal from '../../../common/components/ConfirmModal';
import { PrimaryButton } from '../../../common/components/buttons';
import './AdminDashboard.css';

function RowActionsMenu({ user, onEdit, onDeactivate, onActivate }) {
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const handleClick = (event) => setAnchorEl(event.currentTarget);
    const handleClose = () => setAnchorEl(null);

    const isDeactivated = user.status === 1 || user.status === 'Inactive';

    return (
        <div>
            <IconButton onClick={handleClick} size="small">
                <MoreVertIcon fontSize="small" />
            </IconButton>
            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                PaperProps={{
                    sx: { minWidth: 140, borderRadius: '8px', boxShadow: '0 8px 24px rgba(17,24,39,0.1)' }
                }}
            >
                <MenuItem onClick={() => { handleClose(); onEdit(user); }}>
                    <ListItemIcon><EditIcon fontSize="small" sx={{ color: 'primary.main' }} /></ListItemIcon>
                    <ListItemText primaryTypographyProps={{ fontSize: '13px', fontWeight: 500 }}>Edit</ListItemText>
                </MenuItem>
                {isDeactivated ? (
                    <MenuItem onClick={() => { handleClose(); onActivate(user); }}>
                        <ListItemIcon><CheckCircleOutlineIcon fontSize="small" color="success" /></ListItemIcon>
                        <ListItemText primaryTypographyProps={{ fontSize: '13px', fontWeight: 500 }}>Activate</ListItemText>
                    </MenuItem>
                ) : (
                    <MenuItem onClick={() => { handleClose(); onDeactivate(user); }}>
                        <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
                        <ListItemText primaryTypographyProps={{ fontSize: '13px', fontWeight: 500 }}>Deactivate</ListItemText>
                    </MenuItem>
                )}
            </Menu>
        </div>
    );
}

export default function UserManagementPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const [searchInput, setSearchInput] = useState('');
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
    }, [page, pageSize, roleFilter, searchTerm]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchTerm(searchInput.trim());
        }, 400);

        return () => clearTimeout(timer);
    }, [searchInput]);

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

    const handleSearchChange = (event) => {
        setSearchInput(event.target.value);
        setPage(0);
    };

    const handleRoleChange = (event) => {
        setRoleFilter(event.target.value);
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
            case 'ADMIN':
                return 'rgba(248,113,113,0.3)';
            case 'INTERVIEWER':
                return 'rgba(59,130,246,0.3)';
            case 'CANDIDATE':
                return 'rgba(34,197,94,0.3)';
            default:
                return 'rgba(123,97,255,0.3)';
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
            render: (_, row) => (
                <RowActionsMenu 
                    user={row} 
                    onEdit={handleEditUser} 
                    onDeactivate={handleDeleteClick} 
                    onActivate={handleActivateClick} 
                />
            )
        }
    ];

    return (
        <Container maxWidth="xl" className="admin-page">
            <div className="admin-page-header">
                <div>
                    <h2 className="admin-page-title">User</h2>
                    <p className="admin-page-subtitle">Manage user accounts and details.</p>
                </div>
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
            </div>

            <div className="admin-card">
                <div className="admin-table-toolbar">
                    <div className="admin-toolbar-left">
                        <input
                            className="admin-search-input"
                            placeholder="Search by name, email, or phone"
                            value={searchInput}
                            onChange={handleSearchChange}
                        />
                        <FormControl
                            size="small"
                            sx={{ minWidth: 140 }}
                        >
                            <Select
                                displayEmpty
                                value={roleFilter}
                                onChange={handleRoleChange}
                                sx={{
                                    height: 32,
                                    borderRadius: '10px',
                                    background: 'linear-gradient(180deg, #ffffff 0%, #f7f8ff 100%)',
                                    boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.6), 0 6px 16px rgba(17, 24, 39, 0.06)',
                                    '.MuiSelect-select': {
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        color: '#1f2937',
                                        padding: '6px 10px'
                                    },
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'rgba(102, 126, 234, 0.25)'
                                    },
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'rgba(102, 126, 234, 0.5)'
                                    },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                        borderColor: '#4F46E5'
                                    }
                                }}
                                MenuProps={{
                                    PaperProps: {
                                        sx: {
                                            mt: 1,
                                            borderRadius: 2,
                                            border: '1px solid #eef0f5',
                                            boxShadow: '0 18px 40px rgba(15, 23, 42, 0.12)'
                                        }
                                    }
                                }}
                            >
                                <MenuItem value="all" sx={{ fontSize: '12px', minHeight: 32 }}>All roles</MenuItem>
                                <MenuItem value="Candidate" sx={{ fontSize: '12px', minHeight: 32 }}>Candidate</MenuItem>
                                <MenuItem value="Interviewer" sx={{ fontSize: '12px', minHeight: 32 }}>Interviewer</MenuItem>
                                <MenuItem value="Admin" sx={{ fontSize: '12px', minHeight: 32 }}>Admin</MenuItem>
                                <MenuItem value="Coach" sx={{ fontSize: '12px', minHeight: 32 }}>Coach</MenuItem>
                            </Select>
                        </FormControl>
                    </div>
                </div>
                <DataTable
                    title="Users Management"
                    showHeader={false}
                    showIndex
                    columns={usersColumns}
                    data={users}
                    totalItems={totalItems}
                    page={page}
                    pageSize={pageSize}
                    onPageChange={(newPage) => setPage(newPage)}
                    onPageSizeChange={(newSize) => {
                        setPageSize(newSize);
                        setPage(0);
                    }}
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
