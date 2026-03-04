import React, { useEffect, useState, useCallback } from "react";
import { getMyInterviewServices, deleteCoachInterviewService } from "../../services/coachInterviewServiceApi";
import { interviewTypeEndPoints } from "../../../admin/services/interviewTypeApi";
import { callApi } from "../../../../common/utils/apiConnector";
import { METHOD } from "../../../../common/constants/api";
import CreateCoachServiceDialog from "./CreateCoachServiceDialog";
import UpdateCoachServiceDialog from "./UpdateCoachServiceDialog";
import ConfirmModal from "../../../../common/components/ConfirmModal";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import toast from "react-hot-toast";
import "./CoachInterviewServicePage.css";

export default function CoachInterviewServicePage() {
    const [items, setItems] = useState([]);
    const [interviewTypes, setInterviewTypes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [openCreate, setOpenCreate] = useState(false);
    const [openUpdate, setOpenUpdate] = useState(false);
    const [activeItem, setActiveItem] = useState(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    const fetchItems = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getMyInterviewServices();
            setItems(data || []);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load your interview services.");
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchInterviewTypes = useCallback(async () => {
        try {
            const result = await callApi({
                method: METHOD.GET,
                endpoint: interviewTypeEndPoints.GET_ALL_TYPES,
                alertErrorMessage: true,
            });
            const list = result.items || result.data || [];
            setInterviewTypes(list);
        } catch (err) {
            console.error("Error fetching interview types:", err);
        }
    }, []);

    useEffect(() => {
        fetchItems();
        fetchInterviewTypes();
    }, [fetchItems, fetchInterviewTypes]);

    const handleCreateSuccess = () => {
        setOpenCreate(false);
        fetchItems();
        toast.success("Service added successfully!");
    };

    const handleUpdateClick = (item) => {
        setActiveItem(item);
        setOpenUpdate(true);
    };

    const handleUpdateSuccess = () => {
        setOpenUpdate(false);
        setActiveItem(null);
        fetchItems();
        toast.success("Service updated successfully!");
    };

    const handleDeleteClick = (id) => {
        setDeletingId(id);
        setConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        setConfirmOpen(false);
        if (!deletingId) return;
        try {
            await deleteCoachInterviewService(deletingId);
            fetchItems();
            toast.success("Service deleted successfully!");
        } catch (err) {
            console.error(err);
            toast.error("Failed to delete service.");
        } finally {
            setDeletingId(null);
        }
    };

    const primaryCtaSx = {
        textTransform: "none",
        background: "#2f5cf6",
        color: "#ffffff",
        px: 3,
        py: 1,
        borderRadius: "999px",
        fontSize: "14px",
        fontWeight: 600,
        boxShadow: "0 10px 24px rgba(47, 92, 246, 0.32)",
        "&:hover": { background: "#2952e6" },
    };

    return (
        <Box className="coach-service-management" p={2}>
            <div className="coach-service-panel">
                <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Box>
                        <Typography variant="h6">My Interview Services</Typography>
                        <Typography variant="body2" color="text.secondary">
                            Manage the interview types you offer and set your own pricing.
                        </Typography>
                    </Box>
                    <Box>
                        <Button variant="contained" onClick={() => setOpenCreate(true)} sx={primaryCtaSx}>
                            Add Service
                        </Button>
                    </Box>
                </Toolbar>

                {loading ? (
                    <Box display="flex" justifyContent="center" mt={6} mb={6}>
                        <CircularProgress />
                    </Box>
                ) : items.length === 0 ? (
                    <Box className="coach-service-empty">
                        <div className="coach-service-empty-title">No interview services yet</div>
                        <div className="coach-service-empty-subtitle">
                            Add your first interview service to start accepting bookings from candidates.
                        </div>
                        <Button variant="contained" onClick={() => setOpenCreate(true)} sx={{ ...primaryCtaSx, mt: 1 }}>
                            Add Service
                        </Button>
                    </Box>
                ) : (
                    <Box className="coach-service-grid">
                        {items.map((it) => (
                            <div key={it.id} className="coach-service-card">
                                <div className="coach-service-card-header">
                                    <div>
                                        <div className="coach-service-card-title">{it.interviewTypeName}</div>
                                        <div className="coach-service-card-subtitle">
                                            {it.isCoding ? "Includes coding exercises" : "Non-coding interview"}
                                        </div>
                                    </div>
                                    <div className="coach-service-card-actions">
                                        <IconButton size="small" onClick={() => handleUpdateClick(it)}>
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton size="small" onClick={() => handleDeleteClick(it.id)}>
                                            <DeleteIcon />
                                        </IconButton>
                                    </div>
                                </div>
                                <div className="coach-service-card-meta">
                                    <div className="meta-item">
                                        <span className="meta-label">Price</span>
                                        <span className="meta-value">{it.price?.toLocaleString()} ₫</span>
                                    </div>
                                    <div className="meta-item">
                                        <span className="meta-label">Duration</span>
                                        <span className="meta-value">{it.durationMinutes} min</span>
                                    </div>
                                    <div className="meta-item">
                                        <span className="meta-label">Type</span>
                                        <span
                                            className={`meta-pill ${it.isCoding ? "pill-coding" : "pill-non-coding"}`}
                                        >
                                            {it.isCoding ? "Coding" : "Non-Coding"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </Box>
                )}
            </div>

            <CreateCoachServiceDialog
                open={openCreate}
                onClose={() => setOpenCreate(false)}
                onCreated={handleCreateSuccess}
                interviewTypes={interviewTypes?.items}
            />
            <UpdateCoachServiceDialog
                open={openUpdate}
                onClose={() => {
                    setOpenUpdate(false);
                    setActiveItem(null);
                }}
                item={activeItem}
                onUpdated={handleUpdateSuccess}
            />

            <ConfirmModal
                show={confirmOpen}
                title="Delete interview service"
                message="Are you sure you want to remove this interview service? Candidates will no longer be able to book it."
                onConfirm={handleConfirmDelete}
                onCancel={() => setConfirmOpen(false)}
                confirmText="Delete"
                cancelText="Cancel"
            />
        </Box>
    );
}
