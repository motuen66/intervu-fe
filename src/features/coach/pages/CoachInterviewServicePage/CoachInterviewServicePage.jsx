import React, { useEffect, useState, useCallback } from "react";
import { getMyInterviewServices, deleteCoachInterviewService } from "../../services/coachInterviewServiceApi";
import { interviewTypeEndPoints } from "../../../admin/services/interviewTypeApi";
import { callApi } from "../../../../common/utils/apiConnector";
import { METHOD } from "../../../../common/constants/api";
import CreateCoachServiceDialog from "./CreateCoachServiceDialog";
import UpdateCoachServiceDialog from "./UpdateCoachServiceDialog";
import ConfirmModal from "../../../../common/components/ConfirmModal";
import { Box, CircularProgress, IconButton, Tooltip } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import toast from "react-hot-toast";
import "./CoachInterviewServicePage.css";
import { PrimaryButton } from "../../../../common/components/buttons";
import PageHeader from "../../../../common/components/PageHeader";
import StatusChip from "../../../../common/components/StatusChip";

const INTERVIEW_TYPE_STATUS = {
    DEPRECATED: 3,
};

const getUnavailableLabel = (service) =>
    Number(service?.interviewTypeStatus) === INTERVIEW_TYPE_STATUS.DEPRECATED
        ? "Deprecated / unavailable"
        : "Unavailable";

const getServiceSubtitle = (service, isUnavailable) => {
    if (isUnavailable) return "This service is hidden from candidates and cannot be edited.";
    return service.isCoding ? "Includes coding exercises" : "Non-coding interview";
};

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
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchInterviewTypes = useCallback(async () => {
        try {
            const result = await callApi({
                method: METHOD.GET,
                endpoint: interviewTypeEndPoints.GET_ALL_TYPES,
                alertErrorMessage: false,
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
        // toast.success("Service added successfully!");
    };

    const handleUpdateClick = (item) => {
        setActiveItem(item);
        setOpenUpdate(true);
    };

    const handleUpdateSuccess = () => {
        setOpenUpdate(false);
        setActiveItem(null);
        fetchItems();
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
        } catch (err) {
            console.error(err);
            toast.error("Failed to delete service.");
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <Box className="coach-service-management">
            <div className="coach-service-panel">
                <PageHeader
                    title="My Interview Services"
                    subtitle="Manage the interview types you offer and set your own pricing."
                    actions={<PrimaryButton onClick={() => setOpenCreate(true)}>Add Service</PrimaryButton>}
                />

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
                    </Box>
                ) : (
                    <Box className="coach-service-grid">
                        {items.map((it) => {
                            const isUnavailable = it.isBookable === false;

                            return (
                                <div
                                    key={it.id}
                                    className={`coach-service-card ${isUnavailable ? "coach-service-card-unavailable" : ""}`}
                                >
                                    <div className="coach-service-card-header">
                                        <div>
                                            <div className="coach-service-card-title-row">
                                                <div className="coach-service-card-title">{it.interviewTypeName}</div>
                                                {isUnavailable && (
                                                    <StatusChip
                                                        label={getUnavailableLabel(it)}
                                                        color="error"
                                                        size="sm"
                                                        variant="filled"
                                                    />
                                                )}
                                            </div>
                                            <div className="coach-service-card-subtitle">
                                                {getServiceSubtitle(it, isUnavailable)}
                                            </div>
                                        </div>
                                        <div className="coach-service-card-actions">
                                            <Tooltip
                                                title={isUnavailable ? "Unavailable services cannot be edited" : ""}
                                            >
                                                <span>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleUpdateClick(it)}
                                                        disabled={isUnavailable}
                                                        aria-label="Edit interview service"
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </span>
                                            </Tooltip>
                                            <IconButton
                                                size="small"
                                                className="delete-btn"
                                                onClick={() => handleDeleteClick(it.id)}
                                                aria-label="Delete interview service"
                                            >
                                                <DeleteIcon fontSize="small" />
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
                            );
                        })}
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
