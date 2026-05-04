import React, { useCallback, useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import { TextButton } from "./buttons";
import { callApi } from "../utils/apiConnector";
import { METHOD } from "../constants/api";
import { candidateProfileEndPoints } from "../../features/profiles/candidate/service/candidateProfileApi";
import { uploadMedia } from "../services/mediaApi";
import toast from "react-hot-toast";

function isValidHttpUrl(s) {
    if (!s?.trim()) return false;
    try {
        const u = new URL(s.trim());
        return u.protocol === "http:" || u.protocol === "https:";
    } catch {
        return false;
    }
}

/**
 * CV URL entry: paste link, upload file, or use profile CV (when candidateUserId is set).
 */
export default function CandidateCvPicker({ candidateUserId, value, onChange, error, disabled }) {
    const [profileCvUrl, setProfileCvUrl] = useState("");
    const [loadingProfile, setLoadingProfile] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);
    const fetchIdRef = useRef(0);

    const fetchProfileCv = useCallback(async () => {
        if (!candidateUserId) {
            setProfileCvUrl("");
            setLoadingProfile(false);
            return;
        }
        const rid = ++fetchIdRef.current;
        setLoadingProfile(true);
        try {
            const endpoint = candidateProfileEndPoints.VIEW_OWN_CANDIDATE_PROFILE.replace("{id}", candidateUserId);
            const response = await callApi({ method: METHOD.GET, endpoint, useGlobalLoading: false });
            if (fetchIdRef.current !== rid) return;
            if (response?.success) {
                setProfileCvUrl((response?.data?.cvUrl || "").trim());
            } else {
                setProfileCvUrl("");
            }
        } catch {
            if (fetchIdRef.current === rid) setProfileCvUrl("");
        } finally {
            if (fetchIdRef.current === rid) setLoadingProfile(false);
        }
    }, [candidateUserId]);

    useEffect(() => {
        fetchProfileCv();
    }, [fetchProfileCv]);

    const handleUploadClick = () => fileInputRef.current?.click();

    const handleFile = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file || disabled) return;
        setUploading(true);
        try {
            const url = await uploadMedia(file, "cv");
            if (typeof url === "string" && url) onChange(url);
            else toast.error("Upload did not return a URL.");
        } catch (err) {
            toast.error(err.message || "Upload failed.");
        } finally {
            setUploading(false);
        }
    };

    const useProfile = () => {
        if (!profileCvUrl) return;
        onChange(profileCvUrl);
    };

    return (
        <Box sx={{ mt: 2 }}>
            <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", mb: 0.5, color: "text.primary" }}>
                Your CV / resume{" "}
                <Typography component="span" color="error.main" fontWeight={700}>
                    *
                </Typography>
            </Typography>
            <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", mb: 1.5 }}>
                Required for this interview type. Paste a link, upload a file, or use the CV on your profile.
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 1.5 }} alignItems={{ sm: "center" }}>
                <TextButton onClick={handleUploadClick} disabled={disabled || uploading} sx={{ alignSelf: "flex-start" }}>
                    {uploading ? "Uploading…" : "Upload file"}
                </TextButton>
                {candidateUserId && (
                    <TextButton onClick={useProfile} disabled={disabled || !profileCvUrl || loadingProfile} sx={{ alignSelf: "flex-start" }}>
                        Use profile CV
                    </TextButton>
                )}
                {loadingProfile && <CircularProgress size={18} sx={{ color: "text.secondary" }} />}
            </Stack>
            <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,application/pdf"
                hidden
                onChange={handleFile}
            />
            <TextField
                fullWidth
                size="small"
                placeholder="https://…"
                value={value}
                disabled={disabled}
                onChange={(e) => onChange(e.target.value)}
                error={!!error}
                helperText={error || (value && !isValidHttpUrl(value) ? "Enter a valid http(s) URL" : "")}
                sx={{
                    "& .MuiOutlinedInput-root": {
                        borderRadius: "12px",
                        bgcolor: disabled ? "action.disabledBackground" : "background.default",
                    },
                }}
            />
            {candidateUserId && !loadingProfile && !profileCvUrl && (
                <Alert severity="info" sx={{ mt: 1 }}>
                    No CV on your profile yet — upload a file or paste a link.
                </Alert>
            )}
        </Box>
    );
}
