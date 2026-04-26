import React, { useEffect, useState, useCallback } from "react";
import { interviewTypeEndPoints } from "../../services/interviewTypeApi";
import { callApi } from "../../../../common/utils/apiConnector";
import { METHOD } from "../../../../common/constants/api";
import CreateInterviewTypeDialog from "./CreateInterviewTypeDialog";
import UpdateInterviewTypeDialog from "./UpdateInterviewTypeDialog";
import ConfirmModal from "../../../../common/components/ConfirmModal";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import "./InterviewTypeManagementPage.css";
import { PrimaryButton } from "../../../../common/components/buttons";
import SectionHeading from "../../../../common/components/SectionHeading";

export default function InterviewTypeManagementPage() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [openCreate, setOpenCreate] = useState(false);
    const [openUpdate, setOpenUpdate] = useState(false);
    const [activeItem, setActiveItem] = useState(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState("");

    const fetchItems = useCallback(
        async (p = page, ps = pageSize, q = search) => {
            setLoading(true);
            try {
                const apiPage = p + 1;
                const params = new URLSearchParams();
                params.set("page", String(apiPage));
                params.set("pageSize", String(ps));
                if (q) params.set("q", q);

                const url = `${interviewTypeEndPoints.GET_ALL_TYPES}?${params.toString()}`;
                const result = await callApi({
                    method: METHOD.GET,
                    endpoint: url,
                    useGlobalLoading: false,
                });

                const itemsList = result.data.items || [];
                setItems(itemsList || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        },
        [page, pageSize, search],
    );

    useEffect(() => {
        fetchItems(page, pageSize, search);
    }, [fetchItems, page, pageSize, search]);

    const handleCreateSuccess = () => {
        setOpenCreate(false);
        // reload current page
        fetchItems(page, pageSize, search);
    };

    const handleUpdateClick = (item) => {
        setActiveItem(item);
        setOpenUpdate(true);
    };

    const handleUpdateSuccess = () => {
        setOpenUpdate(false);
        setActiveItem(null);
        fetchItems(page, pageSize, search);
    };

    const handleDeleteClick = (id) => {
        setDeletingId(id);
        setConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        setConfirmOpen(false);
        if (!deletingId) return;
        try {
            await callApi({
                method: METHOD.DELETE,
                endpoint: interviewTypeEndPoints.DELETE_TYPE(deletingId),
            });
            // reload page after delete
            fetchItems(page, pageSize, search);
        } catch (err) {
            console.error(err);
        } finally {
            setDeletingId(null);
        }
    };

    const getEvaluationItems = (item) => {
        if (Array.isArray(item?.evaluationStructure)) return item.evaluationStructure;
        if (typeof item?.evaluationStructureJson === "string") {
            try {
                const parsed = JSON.parse(item.evaluationStructureJson);
                if (Array.isArray(parsed)) return parsed;
            } catch (e) {
                console.warn("Failed to parse evaluation structure", e);
            }
        }
        return [];
    };

    const getStatusLabel = (value) => {
        if (value === 1 || value === "1" || value === true) return "Active";
        return "Inactive";
    };

    return (
        <Box className="interview-type-management" p={2}>
            <div className="interview-type-panel">
                <Toolbar sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <SectionHeading title="Interview Types" />
                    </Box>

                    <Box>
                        <PrimaryButton size="md" onClick={() => setOpenCreate(true)}>
                            Create New
                        </PrimaryButton>
                    </Box>
                </Toolbar>

                {loading ? (
                    <Box display="flex" justifyContent="center" mt={6} mb={6}>
                        <CircularProgress />
                    </Box>
                ) : items.length === 0 ? (
                    <Box className="interview-type-empty">
                        <div className="interview-type-empty-title">No interview types yet</div>
                        <div className="interview-type-empty-subtitle">
                            Create your first interview type to get started.
                        </div>
                        <PrimaryButton size="md" onClick={() => setOpenCreate(true)}>
                            Create New
                        </PrimaryButton>
                    </Box>
                ) : (
                    <Box className="interview-type-grid">
                        {items?.map((it) => (
                            <div key={it.id} className="interview-type-card">
                                <div className="interview-type-card-header">
                                    <div>
                                        <div className="interview-type-card-title">{it.name}</div>
                                        <div className="interview-type-card-description">
                                            {it.description || "No description"}
                                        </div>
                                    </div>
                                    <div className="interview-type-card-actions">
                                        <IconButton size="small" onClick={() => handleUpdateClick(it)}>
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton size="small" onClick={() => handleDeleteClick(it.id)}>
                                            <DeleteIcon />
                                        </IconButton>
                                    </div>
                                </div>
                                <div className="interview-type-card-meta">
                                    <div className="meta-item">
                                        <span className="meta-label">Duration</span>
                                        <span className="meta-value">{it.suggestedDurationMinutes} min</span>
                                    </div>
                                    <div className="meta-item">
                                        <span className="meta-label">Price Range</span>
                                        <span className="meta-value">
                                            {it.minPrice} - {it.maxPrice}
                                        </span>
                                    </div>
                                    <div className="meta-item">
                                        <span className="meta-label">Is Coding</span>
                                        <span className={`meta-pill ${it.isCoding ? "pill-yes" : "pill-no"}`}>
                                            {it.isCoding ? "Yes" : "No"}
                                        </span>
                                    </div>
                                    <div className="meta-item">
                                        <span className="meta-label">Status</span>
                                        <span
                                            className={`meta-pill ${getStatusLabel(it.status) === "Active" ? "pill-active" : "pill-inactive"}`}
                                        >
                                            {getStatusLabel(it.status)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </Box>
                )}
            </div>

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

            <ConfirmModal
                show={confirmOpen}
                title="Delete interview type"
                message="Are you sure you want to delete this interview type? This action cannot be undone."
                onConfirm={handleConfirmDelete}
                onCancel={() => setConfirmOpen(false)}
                confirmText="Delete"
                cancelText="Cancel"
            />
        </Box>
    );
}
