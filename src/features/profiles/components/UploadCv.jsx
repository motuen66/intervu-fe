import React, { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Box, Typography, Paper, IconButton, CircularProgress } from "@mui/material";
import { PrimaryButton, SecondaryButton } from "../../../common/components/buttons";
import { useTheme, alpha } from "@mui/material/styles";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { callApi } from "../../../common/utils/apiConnector.js";
import { METHOD } from "../../../common/constants/api.js";
import { profileEndPoints } from "../../profile/services/profileApi.js";
import useUser from "../../../common/hooks/useUser.jsx";
import { candidateProfileEndPoints } from "../candidate/service/candidateProfileApi.js";
import { CvPreview } from "../../../common/utils/filePdfPreview";
import { CvDialog } from "./CvDialog";

const UploadCv = ({ profile, canEdit = true }) => {
    const [cvUrl, setCvUrl] = useState(profile.cvUrl);
    const [cvFile, setCvFile] = useState(null);
    const [cvContent, setCvContent] = useState(cvUrl || "");
    const [isLoading, setIsLoading] = useState(false);
    const [isUploadMode, setIsUploadMode] = useState(!cvUrl);
    const [viewerOpen, setViewerOpen] = useState(false);
    const user = useUser();
    const previewUrl = cvFile ? URL.createObjectURL(cvFile) : null;
    const theme = useTheme();

    const BOX_WIDTH = 76;
    const BOX_HEIGHT = 96;

    useEffect(() => {
        setCvUrl(profile.cvUrl || "");
    }, [profile.cvUrl]);

    useEffect(() => {
        if (cvUrl) {
            setCvContent(cvUrl);
            setIsUploadMode(false);
        }
    }, [cvUrl]);

    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    const onDrop = useCallback((acceptedFiles) => {
        const file = acceptedFiles[0];
        if (file && file.type === "application/pdf") {
            setCvFile(file);
        } else {
            console.error("Please upload a PDF file.");
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: "application/pdf",
        multiple: false,
    });

    const handleUpload = async () => {
        if (!cvFile || !user?.id) return;
        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append("file", cvFile);
            const response = await callApi({
                method: METHOD.POST,
                endpoint: profileEndPoints.UPLOAD_CV(user.id),
                arg: formData,
            });
            if (response.success) {
                const content = response.data || "CV uploaded successfully.";
                setCvContent(content);
                if (content.startsWith("http")) {
                    setCvUrl(content);
                    setCvFile(null);
                    setIsUploadMode(false);
                }
            }
        } catch (error) {
            console.error("Error uploading CV:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteCv = async () => {
        if (!user?.id) return;
        setIsLoading(true);
        try {
            const payload = {
                id: profile.id,
                fullName: profile.fullName || "",
                email: profile.email || "",
                cvUrl: "",
            };
            const response = await callApi({
                method: METHOD.PUT,
                endpoint: candidateProfileEndPoints.UPDATE_CANDIDATE_PROFILE.replace("{id}", profile.id),
                arg: payload,
            });
            if (response.success) {
                setCvUrl("");
                setCvContent("");
                setCvFile(null);
                setIsUploadMode(true);
            }
        } catch (error) {
            console.error("Error deleting CV:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveFile = () => setCvFile(null);
    const handleStartUpload = () => {
        setIsUploadMode(true);
        setCvFile(null);
    };
    const handleCancelUpload = () => {
        setIsUploadMode(false);
        setCvFile(null);
    };

    const hasExistingCv = cvContent && cvContent.startsWith("http");
    const showSuccessCard = !isUploadMode && hasExistingCv;

    return (
        <Box id="cv-upload-section" sx={{ mb: 4 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                <Box
                    sx={{
                        width: 44,
                        height: 44,
                        borderRadius: "12px",
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                    }}
                >
                    <CloudUploadIcon sx={{ color: theme.palette.primary.main, fontSize: 24 }} />
                </Box>
                <Box>
                    <Typography
                        variant="h6"
                        sx={{
                            color: theme.palette.text.secondary,
                            fontWeight: 700,
                            fontSize: "1.1rem",
                            lineHeight: 1.2,
                        }}
                    >
                        CV Upload and Preview
                    </Typography>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                        Upload your PDF resume to help us parse your experience.
                    </Typography>
                </Box>
            </Box>

            {showSuccessCard ? (
                <Paper
                    elevation={0}
                    sx={{
                        p: 3,
                        display: "flex",
                        flexDirection: { xs: "column", md: "row" },
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 3,
                        borderRadius: "20px",
                        border: "1px solid",
                        borderColor: theme.palette.divider,
                        backgroundColor: "white",
                        transition: "all 0.3s ease",
                        "&:hover": {
                            borderColor: theme.palette.primary.main,
                            boxShadow: "0 10px 30px -10px rgba(0,0,0,0.05)",
                        },
                    }}
                >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2.5, width: { xs: "100%", md: "auto" } }}>
                        <Box
                            sx={{
                                width: BOX_WIDTH,
                                height: BOX_HEIGHT,
                                overflow: "hidden",
                                borderRadius: "8px",
                                position: "relative",
                            }}
                        >
                            {hasExistingCv ? (
                                <CvPreview url={cvContent} width={76} height={96} />
                            ) : (
                                <PictureAsPdfIcon sx={{ color: theme.palette.error.main }} />
                            )}
                        </Box>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography
                                variant="subtitle1"
                                sx={{ fontWeight: 700, color: theme.palette.text.primary, mb: 0.25 }}
                            >
                                Current CV
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{
                                    color: theme.palette.text.secondary,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                }}
                            >
                                <span>PDF Document</span>
                                <Box
                                    component="span"
                                    sx={{
                                        width: 4,
                                        height: 4,
                                        borderRadius: "50%",
                                        bgcolor: "currentColor",
                                        opacity: 0.5,
                                    }}
                                />
                                <Box component="span" sx={{ color: theme.palette.success.main, fontWeight: 600 }}>
                                    Uploaded
                                </Box>
                            </Typography>
                        </Box>
                    </Box>

                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                            width: { xs: "100%", md: "auto" },
                            justifyContent: { xs: "flex-start", md: "flex-end" },
                        }}
                    >
                        <SecondaryButton
                            onClick={() => setViewerOpen(true)}
                            startIcon={<VisibilityIcon size={18} />}
                            sx={{ borderRadius: "10px", px: 2 }}
                        >
                            View
                        </SecondaryButton>
                        {canEdit && (
                            <>
                                <SecondaryButton
                                    onClick={handleStartUpload}
                                    disabled={isLoading}
                                    startIcon={<CloudUploadIcon size={18} />}
                                    sx={{
                                        borderRadius: "10px",
                                        px: 2,
                                        borderColor: theme.palette.primary.main,
                                        color: theme.palette.primary.main,
                                        "&:hover": {
                                            backgroundColor: alpha(theme.palette.primary.main, 0.04),
                                            borderColor: theme.palette.primary.dark,
                                        },
                                    }}
                                >
                                    Update
                                </SecondaryButton>
                                <IconButton
                                    onClick={handleDeleteCv}
                                    disabled={isLoading}
                                    sx={{
                                        color: theme.palette.error.main,
                                        bgcolor: alpha(theme.palette.error.main, 0.05),
                                        borderRadius: "10px",
                                        "&:hover": { bgcolor: alpha(theme.palette.error.main, 0.1) },
                                    }}
                                >
                                    <DeleteOutlineIcon fontSize="small" />
                                </IconButton>
                            </>
                        )}
                    </Box>
                </Paper>
            ) : canEdit ? (
                <>
                    {!cvFile ? (
                        <Box
                            {...getRootProps()}
                            sx={{
                                border: "2px dashed",
                                borderColor: isDragActive ? theme.palette.primary.main : theme.palette.divider,
                                borderRadius: "20px",
                                p: 5,
                                textAlign: "center",
                                cursor: "pointer",
                                backgroundColor: isDragActive ? alpha(theme.palette.primary.main, 0.04) : "white",
                                transition: "all 0.3s ease",
                                "&:hover": {
                                    borderColor: theme.palette.primary.main,
                                    backgroundColor: alpha(theme.palette.primary.main, 0.02),
                                    transform: "translateY(-2px)",
                                },
                            }}
                        >
                            <input {...getInputProps({ accept: ".pdf" })} />
                            <Box
                                sx={{
                                    width: 64,
                                    height: 64,
                                    borderRadius: "50%",
                                    bgcolor: alpha(theme.palette.text.disabled, 0.1),
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    margin: "0 auto 16px",
                                }}
                            >
                                <CloudUploadIcon sx={{ fontSize: 32, color: theme.palette.text.disabled }} />
                            </Box>
                            <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.primary, mb: 1 }}>
                                <span style={{ color: theme.palette.primary.main }}>Click to upload</span> or drag and
                                drop
                            </Typography>
                            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                                Support PDF files up to 10MB
                            </Typography>
                        </Box>
                    ) : (
                        <Paper
                            elevation={0}
                            sx={{
                                p: 2.5,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                borderRadius: "16px",
                                mb: 3,
                                border: "1px solid",
                                borderColor: theme.palette.primary.main,
                                bgcolor: alpha(theme.palette.primary.main, 0.02),
                            }}
                        >
                            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                <Box
                                    sx={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: "12px",
                                        backgroundColor: alpha(theme.palette.error.main, 0.1),
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    <PictureAsPdfIcon sx={{ color: theme.palette.error.main }} />
                                </Box>
                                <Box>
                                    <Typography
                                        variant="body1"
                                        sx={{ fontWeight: 600, color: theme.palette.text.primary }}
                                    >
                                        {cvFile.name}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                                        {(cvFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to upload
                                    </Typography>
                                </Box>
                            </Box>
                            <IconButton onClick={handleRemoveFile} size="small" color="error" sx={{ bgcolor: "white" }}>
                                <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                        </Paper>
                    )}

                    <Box sx={{ display: "flex", gap: 2, mt: 3, justifyContent: "flex-end" }}>
                        {hasExistingCv && (
                            <SecondaryButton onClick={handleCancelUpload} sx={{ borderRadius: "10px" }}>
                                Cancel
                            </SecondaryButton>
                        )}
                        <PrimaryButton
                            onClick={handleUpload}
                            loading={isLoading}
                            disabled={!cvFile}
                            sx={{
                                py: 1.25,
                                px: 4,
                                borderRadius: "10px",
                                boxShadow: "0 4px 14px 0 rgba(198,245,111,0.39)",
                            }}
                        >
                            Upload and Process CV
                        </PrimaryButton>
                    </Box>
                </>
            ) : (
                <Box
                    sx={{
                        textAlign: "center",
                        py: 4,
                        border: "1px dashed",
                        borderColor: "divider",
                        borderRadius: "20px",
                    }}
                >
                    <Typography color="text.secondary">No CV uploaded by this candidate.</Typography>
                </Box>
            )}

            {cvContent && !cvContent.startsWith("http") && (
                <Box
                    sx={{
                        mt: 4,
                        p: 3,
                        bgcolor: "#fdfdf5",
                        borderRadius: "16px",
                        border: "1px solid",
                        borderColor: "rgba(175,227,74,0.18)",
                    }}
                >
                    <Typography
                        variant="subtitle1"
                        sx={{
                            fontWeight: 700,
                            mb: 1.5,
                            color: theme.palette.text.primary,
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                        }}
                    >
                        <Box
                            component="span"
                            sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "var(--ep-accent-dark)" }}
                        />
                        Processed CV Content
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{
                            color: theme.palette.text.secondary,
                            whiteSpace: "pre-wrap",
                            lineHeight: 1.7,
                            fontSize: "0.9rem",
                        }}
                    >
                        {cvContent}
                    </Typography>
                </Box>
            )}
            <CvDialog open={viewerOpen} onClose={() => setViewerOpen(false)} url={cvContent} />
        </Box>
    );
};

export default UploadCv;
