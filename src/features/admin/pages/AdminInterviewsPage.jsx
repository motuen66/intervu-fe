import { useState } from "react";
import {
    Button,
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

export default function AdminInterviewsPage() {
    const [openTypesModal, setOpenTypesModal] = useState(false);
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
        "&:hover": {
            background: "#2952e6",
        },
    };

    return (
        <Container maxWidth="xl" className="admin-page admin-interviews-page">
            <div className="admin-page-header">
                <div>
                    <h2 className="admin-page-title">Interviews</h2>
                    <p className="admin-page-subtitle">Monitor interview activity and settings.</p>
                </div>
                <Button
                    variant="contained"
                    onClick={() => setOpenTypesModal(true)}
                    sx={primaryCtaSx}
                >
                    Manage Interview Types
                </Button>
            </div>

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
                    <Button onClick={() => setOpenTypesModal(false)} sx={primaryCtaSx}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}
