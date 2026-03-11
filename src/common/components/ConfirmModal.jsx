import React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import { PrimaryButton, SecondaryButton } from "./buttons";
import { dialogStyles } from "../constants/uiStyles";

function ConfirmModal({ show, title, message, onConfirm, onCancel, confirmText = "Confirm", cancelText = "Cancel" }) {
    return (
        <Dialog open={show} onClose={onCancel} PaperProps={{ sx: dialogStyles.paper }}>
            <DialogTitle
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderColor: "divider",
                }}
            >
                <span>{title}</span>
                <IconButton
                    aria-label="close"
                    onClick={onCancel}
                    edge="end"
                    sx={{
                        color: (theme) => theme.palette.grey[500],
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers>
                <DialogContentText sx={{ whiteSpace: "pre-line" }}>{message}</DialogContentText>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
                <SecondaryButton onClick={onCancel}>
                    {cancelText}
                </SecondaryButton>
                <PrimaryButton onClick={onConfirm}>
                    {confirmText}
                </PrimaryButton>
            </DialogActions>
        </Dialog>
    );
}

export default ConfirmModal;
