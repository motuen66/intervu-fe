import React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import { PrimaryButton, SecondaryButton, DangerButton } from "./buttons";
import { dialogStyles } from "../constants/uiStyles";
import AppText from "./AppText";
import SectionHeading from "./SectionHeading";

function ConfirmModal({
    show,
    title,
    message,
    content,
    onConfirm,
    onCancel,
    confirmText = "Confirm",
    cancelText = "Cancel",
    hideCancel = false,
    confirmVariant = "primary",
    paperSx,
    titleSx,
    contentSx,
    actionsSx,
}) {
    const ConfirmButton = confirmVariant === "danger" ? DangerButton : PrimaryButton;
    return (
        <Dialog open={show} onClose={onCancel} PaperProps={{ sx: { ...dialogStyles.paper, ...paperSx } }}>
            <DialogTitle
                component="div"
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderColor: "divider",
                    ...titleSx,
                }}
            >
                <SectionHeading title={title} disableGutters as="h2" />
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
            <DialogContent dividers sx={contentSx}>
                {content || (
                    <AppText variant="body" sx={{ whiteSpace: "pre-line" }}>
                        {message}
                    </AppText>
                )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3, pt: 1, ...actionsSx }}>
                {!hideCancel && <SecondaryButton onClick={onCancel}>{cancelText}</SecondaryButton>}
                <ConfirmButton onClick={onConfirm}>
                    {confirmText}
                </ConfirmButton>
            </DialogActions>
        </Dialog>
    );
}

export default ConfirmModal;
