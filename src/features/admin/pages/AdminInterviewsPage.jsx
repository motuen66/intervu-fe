import { useState } from "react";
import {
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import InterviewTypeManagementPage from "./InterviewTypeManagement/InterviewTypeManagementPage";
import "./AdminDashboard.css";
import "./AdminInterviewsPage.css";
import { PrimaryButton, SecondaryButton } from "../../../common/components/buttons";
import AdminPageHeader from "../../../common/components/admin/AdminPageHeader";

export default function AdminInterviewsPage() {
    const [openTypesModal, setOpenTypesModal] = useState(false);

    return (
        <Container maxWidth="xl" className="admin-page admin-interviews-page" sx={{ py: 3 }}>
            <AdminPageHeader
                title="Interviews"
                subtitle="Monitor interview activity and settings."
                actionButton={
                    <PrimaryButton size="md" onClick={() => setOpenTypesModal(true)}>
                        Manage Interview Types
                    </PrimaryButton>
                }
            />

            <div className="admin-card admin-interviews-card">
                <div className="admin-interviews-empty">
                    <h3>Interview overview</h3>
                    <p>Connect interview data here when the API is ready.</p>
                </div>
            </div>

            <Dialog
                open={openTypesModal}
                onClose={() => setOpenTypesModal(false)}
                fullWidth
                maxWidth="lg"
                PaperProps={{ className: "admin-interviews-dialog" }}
            >
                <DialogTitle className="admin-interviews-dialog-title">
                    <div className="admin-interviews-dialog-header">
                        <div>
                            <p className="admin-interviews-dialog-eyebrow">Configuration</p>
                            <h3 className="admin-interviews-dialog-title-text">Interview Types</h3>
                            <p className="admin-interviews-dialog-subtitle">
                                Create and maintain interview presets used across the platform.
                            </p>
                        </div>
                        <IconButton
                            className="admin-interviews-close"
                            onClick={() => setOpenTypesModal(false)}
                            aria-label="close"
                        >
                            <CloseIcon />
                        </IconButton>
                    </div>
                </DialogTitle>
                <DialogContent dividers className="admin-interviews-dialog-content">
                    <InterviewTypeManagementPage />
                </DialogContent>
                <DialogActions>
                    <SecondaryButton onClick={() => setOpenTypesModal(false)}>Close</SecondaryButton>
                </DialogActions>
            </Dialog>
        </Container>
    );
}
