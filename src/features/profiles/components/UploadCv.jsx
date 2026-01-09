import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import {
    Box,
    Typography,
    Button,
    Paper,
    IconButton,
    CircularProgress
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { callApi } from "../../../common/utils/apiConnector.js";
import { METHOD } from "../../../common/constants/api.js";
import { profileEndPoints } from "../../profile/services/profileApi.js";
import useUser from "../../../common/hooks/useUser.jsx";

const UploadCv = ({ cvUrl }) => {
    const theme = useTheme();
    const [cvFile, setCvFile] = useState(null);
    const [cvContent, setCvContent] = useState(cvUrl || '');
    const [isLoading, setIsLoading] = useState(false);
    const [isUploadMode, setIsUploadMode] = useState(!cvUrl);
    const user = useUser();

    useEffect(() => {
        if (cvUrl) {
            setCvContent(cvUrl);
            setIsUploadMode(false);
        }
    }, [cvUrl]);

    const onDrop = useCallback((acceptedFiles) => {
        const file = acceptedFiles[0];
        if (file && file.type === 'application/pdf') {
            setCvFile(file);
        } else {
            console.error('Please upload a PDF file.');
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: 'application/pdf',
        multiple: false,
    });

    const handleUpload = async () => {
        if (!cvFile || !user?.id) return;

        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append('file', cvFile);

            const response = await callApi({
                method: METHOD.POST,
                endpoint: profileEndPoints.UPLOAD_CV(user.id),
                arg: formData,
            });

            if (response.success) {
                const content = response.data || "CV uploaded successfully.";
                setCvContent(content);
                if (content.startsWith('http')) {
                    setCvFile(null);
                    setIsUploadMode(false);
                }
            }

        } catch (error) {
            console.error('Error uploading CV:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveFile = () => {
        setCvFile(null);
    };

    const handleStartUpload = () => {
        setIsUploadMode(true);
        setCvFile(null);
    };

    const handleCancelUpload = () => {
        setIsUploadMode(false);
        setCvFile(null);
    };

    const handleViewCv = () => {
        if (cvContent && cvContent.startsWith('http')) {
            window.open(cvContent, '_blank');
        }
    };

    const hasExistingCv = cvContent && cvContent.startsWith('http');
    const showSuccessCard = !isUploadMode && hasExistingCv;

    return (
        <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, fontSize: '1rem' }}>
                CV
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 2 }}>
                Upload your CV in PDF format. 
                This will help us parse your skills and experience.
            </Typography>

            {showSuccessCard ? (
                <Box
                    sx={{
                        p: 4,
                        textAlign: 'center',
                        backgroundColor: theme.palette.background.default,
                        borderRadius: '12px',
                        border: `1px solid ${theme.palette.divider}`
                    }}
                >
                    {/*<Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: theme.palette.success.main }}>*/}
                    {/*    CV Uploaded Successfully*/}
                    {/*</Typography>*/}
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                        <Button
                            variant="outlined"
                            onClick={handleViewCv}
                            startIcon={<VisibilityIcon />}
                            sx={{
                                borderColor: theme.palette.primary.main,
                                color: theme.palette.primary.main,
                                "&:hover": {
                                    borderColor: theme.palette.primary.dark,
                                    backgroundColor: alpha(theme.palette.primary.main, 0.04),
                                },
                                textTransform: "none",
                                borderRadius: '8px',
                            }}
                        >
                            View CV
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleStartUpload}
                            startIcon={<CloudUploadIcon />}
                            sx={{
                                background: theme.palette.primary.main,
                                "&:hover": {
                                    background: theme.palette.primary.dark,
                                },
                                textTransform: "none",
                                borderRadius: '8px',
                                boxShadow: 'none',
                            }}
                        >
                            Upload New CV
                        </Button>
                    </Box>
                </Box>
            ) : (
                <>
                    {!cvFile ? (
                        <Box
                            {...getRootProps()}
                            sx={{
                                border: '2px dashed',
                                borderColor: isDragActive ? theme.palette.primary.main : theme.palette.divider,
                                borderRadius: '12px',
                                p: 4,
                                textAlign: 'center',
                                cursor: 'pointer',
                                backgroundColor: isDragActive ? alpha(theme.palette.primary.main, 0.04) : theme.palette.background.default,
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                    borderColor: theme.palette.primary.main,
                                    backgroundColor: alpha(theme.palette.primary.main, 0.04),
                                }
                            }}
                        >
                            <input {...getInputProps({ accept: '.pdf' })} />
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
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                borderRadius: '8px',
                                mb: 2,
                                borderColor: theme.palette.divider
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box
                                    sx={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: '8px',
                                        backgroundColor: alpha(theme.palette.error.main, 0.1),
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <PictureAsPdfIcon sx={{ color: theme.palette.error.main }} />
                                </Box>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    {cvFile.name}
                                </Typography>
                            </Box>
                            <IconButton onClick={handleRemoveFile} size="small" color="error">
                                <DeleteOutlineIcon />
                            </IconButton>
                        </Paper>
                    )}

                    <Box sx={{ display: 'flex', gap: 2, mt: 2, justifyContent: 'flex-end' }}>
                        {hasExistingCv && (
                            <Button
                                variant="outlined"
                                onClick={handleCancelUpload}
                                sx={{
                                    borderColor: theme.palette.divider,
                                    color: theme.palette.text.secondary,
                                    "&:hover": {
                                        borderColor: theme.palette.text.primary,
                                        backgroundColor: alpha(theme.palette.text.primary, 0.04),
                                    },
                                    textTransform: "none",
                                    borderRadius: '8px',
                                }}
                            >
                                Cancel
                            </Button>
                        )}
                        <Button
                            variant="contained"
                            onClick={handleUpload}
                            disabled={!cvFile || isLoading}
                            sx={{
                                background: theme.palette.primary.main,
                                "&:hover": {
                                    background: theme.palette.primary.dark,
                                },
                                textTransform: "none",
                                py: 1.5,
                                px: 4,
                                borderRadius: '8px',
                                boxShadow: 'none',
                                '&:disabled': {
                                    backgroundColor: theme.palette.action.disabledBackground,
                                    color: theme.palette.text.disabled
                                }
                            }}
                        >
                            {isLoading ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <CircularProgress size={20} color="inherit" />
                                    <span>Uploading...</span>
                                </Box>
                            ) : (
                                'Upload and Process CV'
                            )}
                        </Button>
                    </Box>
                </>
            )}

            {cvContent && !cvContent.startsWith('http') && (
                <Box sx={{ mt: 3, p: 3, bgcolor: theme.palette.background.default, borderRadius: '8px', border: `1px solid ${theme.palette.divider}` }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: theme.palette.text.primary }}>
                        Processed CV Content
                    </Typography>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                        {cvContent}
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

export default UploadCv;