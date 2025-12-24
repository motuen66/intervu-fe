import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
    Box,
    Typography,
    Button,
    Paper,
    IconButton,
    CircularProgress
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { callApi } from "../../../common/utils/apiConnector.js";
import { METHOD } from "../../../common/constants/api.js";
import { profileEndPoints } from "../services/profileApi.js";
import useUser from "../../../common/hooks/useUser.jsx";

const UploadCv = () => {
    const [cvFile, setCvFile] = useState(null);
    const [cvContent, setCvContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const user = useUser();

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
        setCvContent('');
    };

    const handleReset = () => {
        setCvFile(null);
        setCvContent('');
    };

    const handleViewCv = () => {
        if (cvContent && cvContent.startsWith('http')) {
            window.open(cvContent, '_blank');
        }
    };

    const isUploadSuccess = cvContent && cvContent.startsWith('http');

    return (
        <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                Upload Your CV
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(0,0,0,0.6)", mb: 2 }}>
                Upload your CV in PDF format. This will help us parse your skills and experience.
            </Typography>

            {isUploadSuccess ? (
                <Box
                    sx={{
                        p: 4,
                        textAlign: 'center',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '12px',
                        border: '1px solid rgba(0,0,0,0.08)'
                    }}
                >
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#2e7d32' }}>
                        CV Uploaded Successfully
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                        <Button
                            variant="outlined"
                            onClick={handleViewCv}
                            startIcon={<VisibilityIcon />}
                            sx={{
                                borderColor: "#7B61FF",
                                color: "#7B61FF",
                                "&:hover": {
                                    borderColor: "#6851d9",
                                    backgroundColor: "rgba(123, 97, 255, 0.04)",
                                },
                                textTransform: "none",
                                borderRadius: '8px',
                            }}
                        >
                            View CV
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleReset}
                            startIcon={<CloudUploadIcon />}
                            sx={{
                                background: "#7B61FF",
                                "&:hover": {
                                    background: "#6851d9",
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
                                borderColor: isDragActive ? '#7B61FF' : 'rgba(0, 0, 0, 0.23)',
                                borderRadius: '12px',
                                p: 4,
                                textAlign: 'center',
                                cursor: 'pointer',
                                backgroundColor: isDragActive ? 'rgba(123, 97, 255, 0.04)' : '#fafafa',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                    borderColor: '#7B61FF',
                                    backgroundColor: 'rgba(123, 97, 255, 0.04)',
                                }
                            }}
                        >
                            <input {...getInputProps({ accept: '.pdf' })} />
                            <CloudUploadIcon sx={{ fontSize: 48, color: '#9e9e9e', mb: 2 }} />
                            <Typography variant="body1" sx={{ fontWeight: 500, color: '#333', mb: 0.5 }}>
                                <span style={{ color: '#7B61FF' }}>Click to upload</span> or drag and drop
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#9e9e9e' }}>
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
                                borderColor: 'rgba(0,0,0,0.12)'
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box
                                    sx={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: '8px',
                                        backgroundColor: 'rgba(255, 0, 0, 0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <PictureAsPdfIcon sx={{ color: '#d32f2f' }} />
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
                        <Button
                            variant="contained"
                            onClick={handleUpload}
                            disabled={!cvFile || isLoading}
                            sx={{
                                background: "#7B61FF",
                                "&:hover": {
                                    background: "#6851d9",
                                },
                                textTransform: "none",
                                py: 1.5,
                                px: 4,
                                borderRadius: '8px',
                                boxShadow: 'none',
                                '&:disabled': {
                                    backgroundColor: 'rgba(0, 0, 0, 0.12)',
                                    color: 'rgba(0, 0, 0, 0.26)'
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
                <Box sx={{ mt: 3, p: 3, bgcolor: '#f8f9fa', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.08)' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: '#1a1a2e' }}>
                        Processed CV Content
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#4a4a4a', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                        {cvContent}
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

export default UploadCv;