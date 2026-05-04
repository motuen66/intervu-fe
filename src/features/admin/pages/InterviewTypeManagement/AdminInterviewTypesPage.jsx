import { useEffect, useMemo, useState } from "react";
import { Box, Container, Tooltip, Typography } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import toast from "react-hot-toast";

import AdminPageHeader from "../../../../common/components/admin/AdminPageHeader";
import SearchInput from "../../../../common/components/inputs/SearchInput";
import DataTable from "../../../../common/components/table/DataTable";
import TableActionsMenu from "../../../../common/components/table/TableActionsMenu";
import StatusChip from "../../../../common/components/StatusChip";
import { PrimaryButton } from "../../../../common/components/buttons";
import useTableState from "../../../../hooks/useTableState";
import { callApi } from "../../../../common/utils/apiConnector";
import { METHOD } from "../../../../common/constants/api";
import { interviewTypeEndPoints } from "../../services/interviewTypeApi";
import CreateInterviewTypeDialog from "./CreateInterviewTypeDialog";
import UpdateInterviewTypeDialog from "./UpdateInterviewTypeDialog";
import "../AdminDashboard.css";

/** Matches backend InterviewTypeStatus; FE no longer allows selecting Inactive, but may display existing records. */
const getStatusLabel = (value) => {
    const n = Number(value);
    if (Number.isNaN(n)) return String(value ?? "-");
    switch (n) {
        case 0:
            return "Draft";
        case 1:
            return "Active";
        case 2:
            return "Inactive";
        case 3:
            return "Deprecated";
        default:
            return `Unknown (${n})`;
    }
};

export default function AdminInterviewTypesPage() {
    const {
        data: items,
        setData: setItems,
        loading,
        setLoading,
        page,
        setPage,
        pageSize,
        totalItems,
        setTotalItems,
        handlePageChange,
        handlePageSizeChange,
    } = useTableState(10);

    const [searchTerm, setSearchTerm] = useState("");
    const [openCreate, setOpenCreate] = useState(false);
    const [openUpdate, setOpenUpdate] = useState(false);
    const [activeItem, setActiveItem] = useState(null);

    useEffect(() => {
        fetchItems();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, pageSize, searchTerm]);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set("page", String(page + 1));
            params.set("pageSize", String(pageSize));
            if (searchTerm) params.set("q", searchTerm);

            const url = `${interviewTypeEndPoints.GET_ALL_TYPES_ADMIN}?${params.toString()}`;
            const response = await callApi({
                method: METHOD.GET,
                endpoint: url,
                useGlobalLoading: false,
            });

            if (response?.success) {
                const list = response?.data?.items || [];
                setItems(Array.isArray(list) ? list : []);
                setTotalItems(response?.data?.totalItems ?? list.length ?? 0);
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to load interview types");
        } finally {
            setLoading(false);
        }
    };

    const handleSearchChange = (val) => {
        setSearchTerm(val);
        setPage(0);
    };

    const handleCreateSuccess = () => {
        setOpenCreate(false);
        fetchItems();
    };

    const handleUpdateClick = (row) => {
        setActiveItem(row);
        setOpenUpdate(true);
    };

    const handleUpdateSuccess = () => {
        setOpenUpdate(false);
        setActiveItem(null);
        fetchItems();
    };

    const columns = useMemo(
        () => [
            {
                field: "name",
                headerName: "Name",
                render: (value) => (
                    <Tooltip title={value || "-"}>
                        <Typography
                            sx={{
                                fontSize: "12px",
                                fontWeight: 600,
                                color: "text.primary",
                                maxWidth: 220,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                            }}
                        >
                            {value || "-"}
                        </Typography>
                    </Tooltip>
                ),
            },
            {
                field: "description",
                headerName: "Description",
                render: (value) => (
                    <Tooltip title={value || "No description"}>
                        <Typography
                            sx={{
                                fontSize: "12px",
                                color: "text.secondary",
                                maxWidth: 320,
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                                lineHeight: 1.35,
                            }}
                        >
                            {value || "No description"}
                        </Typography>
                    </Tooltip>
                ),
            },
            {
                field: "suggestedDurationMinutes",
                headerName: "Duration",
                render: (value) => (value || value === 0 ? `${value} min` : "-"),
            },
            {
                field: "minPrice",
                headerName: "Price Range",
                render: (_, row) => `${row?.minPrice ?? 0} - ${row?.maxPrice ?? 0}`,
            },
            {
                field: "isCoding",
                headerName: "Coding",
                render: (value) => <StatusChip label={value ? "Yes" : "No"} color={value ? "success" : "default"} />,
            },
            {
                field: "status",
                headerName: "Status",
                render: (value) => {
                    const label = getStatusLabel(value);
                    const color =
                        label === "Active" ? "success" : label === "Draft" ? "warning" : label === "Deprecated" ? "error" : "default";
                    return <StatusChip label={label} color={color} />;
                },
            },
            {
                field: "actions",
                headerName: "Actions",
                render: (_, row) => (
                    <Box sx={{ display: "flex", justifyContent: "center" }}>
                        <TableActionsMenu
                            actions={[
                                {
                                    label: "Edit",
                                    icon: <EditIcon fontSize="small" />,
                                    onClick: () => handleUpdateClick(row),
                                },
                            ]}
                        />
                    </Box>
                ),
            },
            // eslint-disable-next-line react-hooks/exhaustive-deps
        ],
        [],
    );

    return (
        <Container maxWidth="xl" sx={{ py: 3 }} className="admin-page">
            <AdminPageHeader
                title="Interview Types"
                subtitle="Manage available interview type templates."
                actionButton={
                    <Box sx={{ display: "flex", gap: 1 }}>
                        <PrimaryButton size="md" startIcon={<RefreshIcon />} onClick={fetchItems}>
                            Refresh
                        </PrimaryButton>
                        <PrimaryButton size="md" startIcon={<AddIcon />} onClick={() => setOpenCreate(true)}>
                            Create
                        </PrimaryButton>
                    </Box>
                }
            />

            <Box className="admin-card">
                <Box
                    sx={{
                        p: 2,
                        borderBottom: "1px solid",
                        borderColor: "divider",
                        display: "flex",
                        gap: 1.5,
                        alignItems: "center",
                        bgcolor: "background.paper",
                    }}
                >
                    <SearchInput placeholder="Search interview types..." onSearch={handleSearchChange} />
                </Box>

                <DataTable
                    title="Interview Types"
                    showHeader={false}
                    showIndex
                    actions={false}
                    columns={columns}
                    data={items}
                    totalItems={totalItems}
                    page={page}
                    pageSize={pageSize}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                    loading={loading}
                />
            </Box>

            <CreateInterviewTypeDialog
                open={openCreate}
                onClose={() => setOpenCreate(false)}
                onCreated={handleCreateSuccess}
            />
            <UpdateInterviewTypeDialog
                open={openUpdate}
                onClose={() => setOpenUpdate(false)}
                item={activeItem}
                onUpdated={handleUpdateSuccess}
            />
        </Container>
    );
}
