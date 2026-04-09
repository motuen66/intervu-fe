import React, { useState, useCallback, useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Stack,
    CircularProgress,
    Link,
    Paper,
    IconButton,
} from "@mui/material";
import { useDropzone } from "react-dropzone";
import { useTheme, alpha } from "@mui/material/styles";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { callApi } from "../../../../../common/utils/apiConnector";
import { METHOD } from "../../../../../common/constants/api";
import { interviewEndPoints } from "../../../services/interviewRoomApi.js";
import useUser from "../../../../../common/hooks/useUser.jsx";
import { SecondaryButton, PrimaryButton } from "../../../../../common/components/buttons";

function AICVSelectionModal({ open, onClose, onJoin, room }) {
    const [step, setStep] = useState("selection"); // selection, processing, confirm
    const [cvSource, setCvSource] = useState(""); // "current" or "upload"
    const [uploadedFile, setUploadedFile] = useState(null);
    const [cvUrl, setCvUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [lastCvUrl, setLastCvUrl] = useState("");
    const [checkingLastCv, setCheckingLastCv] = useState(false);
    const theme = useTheme();

    const handleClose = () => {
        setStep("selection");
        setCvSource("");
        setUploadedFile(null);
        setCvUrl("");
        setLoading(false);
        setLastCvUrl("");
        setCheckingLastCv(false);
        onClose();
    };

    const handleSelectCurrent = () => {
        setCvSource("current");
        processCV();
    };

    const handleUploadNew = () => {
        setCvSource("upload");
    };

    const handleSelectLastCv = () => {
        if (!lastCvUrl) return;
        setCvSource("last");
        setCvUrl(lastCvUrl);
        setStep("confirm");
    };

    const onDrop = useCallback((acceptedFiles) => {
        const file = acceptedFiles[0];
        if (file && file.type === "application/pdf") {
            setUploadedFile(file);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: "application/pdf",
        multiple: false,
    });

    const handleRemoveFile = () => {
        setUploadedFile(null);
    };

    useEffect(() => {
        if (!open || !room?.id) return;

        let isActive = true;
        const fetchLastCvUrl = async () => {
            setCheckingLastCv(true);
            try {
                const response = await callApi({
                    method: METHOD.GET,
                    endpoint: interviewEndPoints.GET_LAST_CV_PDF_URL,
                    arg: { roomId: room.id },
                    displaySuccessMessage: false,
                    alertErrorMessage: false,
                });
                if (isActive && response?.data?.cvUrl) {
                    setLastCvUrl(response.data.cvUrl);
                }
            } catch (error) {
                // Silent fail: keep lastCvUrl empty to hide option
            } finally {
                if (isActive) setCheckingLastCv(false);
            }
        };

        fetchLastCvUrl();
        return () => {
            isActive = false;
        };
    }, [open, room?.id]);

    const processCV = async () => {
        if (cvSource === "upload" && !uploadedFile) return;
        setLoading(true);
        setStep("processing");
        try {
            const isUpload = cvSource === "upload";
            let payload = { useCurrentCV: true, roomId: room.id };
            let headers;

            if (isUpload) {
                const formData = new FormData();
                formData.append("file", uploadedFile);
                formData.append("roomId", room.id);
                payload = formData;
                // Let the browser/axios set multipart boundary automatically.
            }

            // Placeholder API call - user will add the actual endpoint later
            const response = await callApi({
                method: METHOD.POST,
                endpoint: interviewEndPoints.UPLOAD_CV_AI_INTERVIEW, // TODO: Replace with actual endpoint
                arg: payload,
                headers,
                displaySuccessMessage: false,
                alertErrorMessage: true,
            });

            // Assuming response.data contains the CV URL
            setCvUrl(response.data.cvUrl); // Placeholder URL
            setStep("confirm");
        } catch (error) {
            console.error("Failed to process CV:", error);
            setStep("selection");
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmJoin = () => {
        onJoin(room);
        handleClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>Select CV for AI Interview</DialogTitle>
            <DialogContent>
                {step === "selection" && (
                    <Stack spacing={2}>
                        <Typography variant="body1">
                            Choose how to provide your CV for the AI interview:
                        </Typography>
                        <Stack direction="row" spacing={2}>
                            <Button
                                variant="outlined"
                                onClick={handleSelectCurrent}
                                fullWidth
                            >
                                Use Current CV from Profile
                            </Button>
                            <Button
                                variant="outlined"
                                onClick={handleUploadNew}
                                fullWidth
                            >
                                Upload New CV
                            </Button>
                            <Button
                                variant="outlined"
                                onClick={handleSelectLastCv}
                                fullWidth
                                disabled={!lastCvUrl || checkingLastCv}
                            >
                                Use Previous CV
                            </Button>
                        </Stack>
                    </Stack>
                )}

                {step === "selection" && cvSource === "upload" && (
                    <Box sx={{ mt: 2 }}>
                        {!uploadedFile ? (
                            <Box
                                {...getRootProps()}
                                sx={{
                                    border: "2px dashed",
                                    borderColor: isDragActive ? theme.palette.primary.main : theme.palette.divider,
                                    borderRadius: "12px",
                                    p: 4,
                                    textAlign: "center",
                                    cursor: "pointer",
                                    backgroundColor: isDragActive
                                        ? alpha(theme.palette.primary.main, 0.04)
                                        : theme.palette.background.default,
                                    transition: "all 0.2s ease",
                                    "&:hover": {
                                        borderColor: theme.palette.primary.main,
                                        backgroundColor: alpha(theme.palette.primary.main, 0.04),
                                    },
                                }}
                            >
                                <input {...getInputProps({ accept: ".pdf" })} />
                                <CloudUploadIcon sx={{ fontSize: 48, color: theme.palette.text.disabled, mb: 2 }} />
                                <Typography variant="body1" sx={{ fontWeight: 500, color: theme.palette.text.primary, mb: 0.5 }}>
                                    <span style={{ color: theme.palette.primary.main }}>Click to upload</span> or drag and drop
                                </Typography>
                                <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                                    PDF file only
                                </Typography>
                            </Box>
                        ) : (
                            <Paper
                                variant="outlined"
                                sx={{
                                    p: 2,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    borderRadius: "8px",
                                    borderColor: theme.palette.divider,
                                }}
                            >
                                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                    <Box
                                        sx={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: "8px",
                                            backgroundColor: alpha(theme.palette.error.main, 0.1),
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        <PictureAsPdfIcon sx={{ color: theme.palette.error.main }} />
                                    </Box>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                        {uploadedFile.name}
                                    </Typography>
                                </Box>
                                <IconButton onClick={handleRemoveFile} size="small" color="error">
                                    <DeleteOutlineIcon />
                                </IconButton>
                            </Paper>
                        )}

                        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
                            <Button
                                variant="contained"
                                onClick={processCV}
                                disabled={!uploadedFile}
                                sx={{ textTransform: "none" }}
                            >
                                Process CV
                            </Button>
                        </Box>
                    </Box>
                )}

                {step === "processing" && (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                        <Stack alignItems="center" spacing={2}>
                            <CircularProgress />
                            <Typography>Processing your CV...</Typography>
                        </Stack>
                    </Box>
                )}

                {step === "confirm" && (
                    <Stack spacing={2}>
                        <Typography variant="body1">
                            Your CV has been processed. Please review the CV URL below and confirm to join the interview.
                        </Typography>
                        <Box>
                            <Typography variant="body2" color="text.secondary">
                                CV URL:
                            </Typography>
                            <Link href={cvUrl} target="_blank" rel="noopener noreferrer">
                                {cvUrl}
                            </Link>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                            By confirming, you agree that this CV will be used for the AI interview.
                        </Typography>
                    </Stack>
                )}
            </DialogContent>
            <DialogActions>
                {step === "selection" && (
                    <SecondaryButton onClick={handleClose}>Cancel</SecondaryButton>
                )}
                {step === "confirm" && (
                    <>
                        <SecondaryButton onClick={handleClose}>Cancel</SecondaryButton>
                        <PrimaryButton onClick={handleConfirmJoin}>
                            Confirm & Join Interview
                        </PrimaryButton>
                    </>
                )}
            </DialogActions>
        </Dialog>
    );
}

export default AICVSelectionModal;
