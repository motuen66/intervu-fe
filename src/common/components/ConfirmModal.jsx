import React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";

function ConfirmModal({ show, title, message, onConfirm, onCancel, confirmText = "Confirm", cancelText = "Cancel" }) {
    return (
        <Dialog open={show} onClose={onCancel}>
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
            <DialogActions>
                <Button onClick={onCancel} color="secondary" variant="outlined">
                    {cancelText}
                </Button>
                <Button onClick={onConfirm} color="primary" variant="contained">
                    {confirmText}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default ConfirmModal;
