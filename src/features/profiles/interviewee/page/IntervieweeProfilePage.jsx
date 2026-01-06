import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import useUser from "../../../../common/hooks/useUser";
import { callApi } from "../../../../common/utils/apiConnector";
import { METHOD } from "../../../../common/constants/api";
import { intervieweeProfileEndPoints } from "../service/intervieweeProfileApi";
import {
    Avatar,
    Box,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Grid,
    Stack,
    Typography,
    Alert,
    IconButton,
    TextField,
    Autocomplete,
    Button,
    Fade,
    Divider,
    Paper,
    Link,
} from "@mui/material";
import {
    Edit as EditIcon,
    Close as CloseIcon,
    Save as SaveIcon,
    Work as WorkIcon,
    Person as PersonIcon,
    Email as EmailIcon,
    Link as LinkIcon,
    Code as CodeIcon,
} from "@mui/icons-material";
import { CameraAlt as CameraIcon } from "@mui/icons-material";
import { uploadImage } from "../../../../firebase/service/storage";
import { useDispatch } from "react-redux";
import { setUserData } from "../../../../common/store/authSlice";
import ConfirmModal from "../../../../common/components/ConfirmModal";
import UploadCv from "../../components/UploadCv.jsx";

import { ROLES } from "../../../../common/constants/common";

function IntervieweeProfilePage() {
    const { id: routeId, slugProfileUrl, profileUrl } = useParams();
    const user = useUser();

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [allSkills, setAllSkills] = useState([]);
    const [allSkillNames, setAllSkillNames] = useState([]);
    const [avatarKey, setAvatarKey] = useState(Date.now());
    const [prevAvatar, setPrevAvatar] = useState(null);
    const [pendingAvatarFile, setPendingAvatarFile] = useState(null);
    const [pendingAvatarLocalUrl, setPendingAvatarLocalUrl] = useState(null);
    const [showConfirmAvatar, setShowConfirmAvatar] = useState(false);
    const [showConfirmSave, setShowConfirmSave] = useState(false);
    const dispatch = useDispatch();

    const endpoint = useMemo(() => {
        const slug = slugProfileUrl || profileUrl;
        if (slug) {
            return intervieweeProfileEndPoints.VIEW_PROFILE_BY_SLUG.replace("{slugProfileUrl}", slug);
        }
        if (routeId) {
            return intervieweeProfileEndPoints.VIEW_OWN_INTERVIEWEE_PROFILE.replace("{id}", routeId);
        }
        if (!user?.id) return null;
        return intervieweeProfileEndPoints.VIEW_OWN_INTERVIEWEE_PROFILE.replace("{id}", user.id);
    }, [routeId, slugProfileUrl, profileUrl, user?.id]);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!endpoint) return;
            setLoading(true);
            setError(null);
            try {
                const res = await callApi({ method: METHOD.GET, endpoint });
                if (res.success) {
                    const normalizeToString = (s) => {
                        if (!s) return null;
                        if (typeof s === "string") return s;
                        return s.name || s.title || s.skillName || String(s);
                    };
                    setProfile({
                        ...res.data,
                        skills: (res.data.skills || []).map(normalizeToString).filter(Boolean),
                        cvUrl: res.data.cvUrl || "",
                        portfolioUrl: res.data.portfolioUrl || "",
                        bio: res.data.bio || "",
                        currentAmount: res.data.currentAmount ?? 0,
                    });
                } else {
                    setError(res.message || "Failed to load profile");
                }
            } catch (err) {
                setError(err.message || "An error occurred while fetching the profile.");
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [endpoint]);

    useEffect(() => {
        const fetchSkills = async () => {
            try {
                const skillsRes = await callApi({
                    method: METHOD.GET,
                    endpoint: intervieweeProfileEndPoints.GET_ALL_SKILLS.replace("{page}", "1").replace(
                        "{pageSize}",
                        "100",
                    ),
                });
                if (skillsRes.success) {
                    const skills = Array.isArray(skillsRes.data)
                        ? skillsRes.data
                        : Array.isArray(skillsRes.data?.items)
                        ? skillsRes.data.items
                        : [];
                    setAllSkills(skills);
                    setAllSkillNames(skills.map((sk) => (sk && (sk.name || String(sk))) || "").filter(Boolean));
                }
            } catch (err) {
                console.error("Error loading skills:", err);
            }
        };
        fetchSkills();
    }, []);

    const isInterviewee = user?.role === ROLES.INTERVIEWEE || String(user?.role).toLowerCase() === "interviewee";
    const isSelf = (!routeId && !slugProfileUrl) || String(routeId) === String(user?.id);
    const canEdit = isInterviewee && isSelf;

    const handleSave = async () => {
        if (!canEdit) return;
        if (!profile) return;
        const endpoint = intervieweeProfileEndPoints.UPDATE_INTERVIEWEE_PROFILE.replace("{id}", profile.id);
        setSaving(true);
        setError(null);
        try {
            const skillIds = (profile.skills || [])
                .map((name) => {
                    const found = (allSkills || []).find((sk) => (sk && (sk.name || String(sk))) === name);
                    return found?.id;
                })
                .filter(Boolean);

            const payload = {
                id: profile.id,
                fullName: profile.user?.fullName || profile.fullName || "",
                email: profile.user?.email || profile.email || "",
                cvUrl: profile.cvUrl || "",
                portfolioUrl: profile.portfolioUrl || "",
                bio: profile.bio || "",
                skillIds,
            };

            const res = await callApi({ method: METHOD.PUT, endpoint, arg: payload, displaySuccessMessage: true });
            if (res.success) {
                setEditMode(false);
                setSaveSuccess(true);
                setProfile((prev) => ({ ...prev, ...payload }));
            } else {
                setError(res.message || "Failed to save profile.");
            }
        } catch (err) {
            setError(err.message || "An error occurred while saving.");
        } finally {
            setSaving(false);
        }
    };

    // Avatar confirmation handlers (moved here so modal is rendered in the main return)
    const handleConfirmAvatar = async () => {
        setShowConfirmAvatar(false);
        if (!pendingAvatarFile) return;
        try {
            const data = await uploadImage(user.id, pendingAvatarFile);
            if (data?.avatar) {
                const updatedUser = { ...user, profilePicture: data.avatar };
                try { localStorage.setItem("user", JSON.stringify(updatedUser)); } catch (e) { console.warn(e); }
                dispatch(setUserData(updatedUser));
                setProfile((prev) => ({ ...prev, user: { ...(prev?.user || {}), profilePicture: data.avatar }, profilePicture: data.avatar }));
                setAvatarKey(Date.now());
            }
        } catch (err) {
            console.error(err);
            setProfile((prev) => ({ ...prev, user: { ...(prev?.user || {}), profilePicture: prevAvatar }, profilePicture: prevAvatar }));
        } finally {
            setPendingAvatarFile(null);
            setPendingAvatarLocalUrl(null);
            setPrevAvatar(null);
        }
    };

    const handleCancelAvatar = () => {
        setProfile((prev) => ({ ...prev, user: { ...(prev?.user || {}), profilePicture: prevAvatar }, profilePicture: prevAvatar }));
        setPendingAvatarFile(null);
        setPendingAvatarLocalUrl(null);
        setPrevAvatar(null);
        setShowConfirmAvatar(false);
    };

    if (!user) {
        return (
            <Box sx={{ p: 4, textAlign: "center" }}>
                <Typography variant="h6" color="text.secondary">
                    Please login to view your profile.
                </Typography>
            </Box>
        );
    }

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
                <Stack alignItems="center" spacing={2}>
                    <CircularProgress size={48} />
                    <Typography variant="h6" color="text.secondary">
                        Loading profile...
                    </Typography>
                </Stack>
            </Box>
        );
    }

    const avatarUrl = profile?.profilePicture || profile?.user?.profilePicture || "";
    const viewingBySlug = Boolean(slugProfileUrl || profileUrl);
    const fullName = profile?.user?.fullName ?? profile?.fullName ?? (viewingBySlug ? "Unnamed" : user?.fullName || "Unnamed");
    const email = profile?.user?.email ?? profile?.email ?? (viewingBySlug ? "-" : user?.email || "-");

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1100, mx: "auto" }}>
            <Fade in={saveSuccess}>
                <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSaveSuccess(false)}>
                    Profile updated successfully!
                </Alert>
            </Fade>

            <Card
                elevation={0}
                sx={{
                    mb: 3,
                    overflow: "hidden",
                    border: "1px solid",
                    borderColor: "divider",
                }}
            >
                <Box
                    sx={{
                        height: 160,
                        background: "linear-gradient(135deg, #36D1DC 0%, #5B86E5 100%)",
                        position: "relative",
                    }}
                >
                    {canEdit && (
                        <IconButton
                            onClick={() => setEditMode((v) => !v)}
                            sx={{
                                position: "absolute",
                                top: 16,
                                right: 16,
                                bgcolor: "rgba(255,255,255,0.9)",
                                "&:hover": { bgcolor: "white" },
                            }}
                        >
                            {editMode ? <CloseIcon /> : <EditIcon />}
                        </IconButton>
                    )}

            <ConfirmModal
                show={showConfirmAvatar}
                title="Confirm avatar change"
                message="Are you sure you want to change your avatar?"
                onConfirm={handleConfirmAvatar}
                onCancel={handleCancelAvatar}
                confirmText="Change"
                cancelText="Cancel"
            />
		</Box>

                <CardContent sx={{ pt: 0 }}>
                    <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 3 }}>
                        <Box sx={{ mt: -6, position: "relative" }}>
                            <Box sx={{ position: "relative", display: "inline-block" }}>
                                <Avatar
                                    src={avatarUrl}
                                    key={avatarKey}
                                    alt={fullName}
                                    sx={{
                                        width: 140,
                                        height: 140,
                                        border: "5px solid white",
                                        boxShadow: 3,
                                    }}
                                />
                                {canEdit && (
                                    <IconButton
                                        component="label"
                                        sx={{
                                            position: "absolute",
                                            bottom: 0,
                                            right: 0,
                                            bgcolor: "primary.main",
                                            color: "white",
                                            width: 40,
                                            height: 40,
                                            "&:hover": {
                                                bgcolor: "primary.dark",
                                            },
                                        }}
                                    >
                                        <CameraIcon fontSize="small" />
                                        <input hidden type="file" accept="image/*" onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            const localUrl = URL.createObjectURL(file);
                                            setPrevAvatar(profile?.profilePicture || profile?.user?.profilePicture || "");
                                            setPendingAvatarFile(file);
                                            setPendingAvatarLocalUrl(localUrl);
                                            setProfile((prev) => ({
                                                ...prev,
                                                user: { ...(prev?.user || {}), profilePicture: localUrl },
                                                profilePicture: localUrl,
                                            }));
                                            
                                            setShowConfirmAvatar(true);
                                        }} />
                                    </IconButton>
                                )}
                            </Box>
                        </Box>

                        <Box sx={{ flex: 1, pt: { xs: 0, sm: 2 } }}>
                            <Typography variant="h4" fontWeight={700} gutterBottom>
                                {fullName}
                            </Typography>
                        </Box>
                    </Box>
                </CardContent>
            </Card>

            {profile && (
                <>
                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}>
                            <Card elevation={0} sx={{ height: "100%", border: "1px solid", borderColor: "divider" }}>
                                <CardContent>
                                    <Typography
                                        variant="h6"
                                        fontWeight={600}
                                        gutterBottom
                                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                                    >
                                        <EmailIcon color="primary" />
                                        Contact Information
                                    </Typography>
                                    <Divider sx={{ mb: 2 }} />

                                    <InfoRow icon={<EmailIcon fontSize="small" />} label="Email" content={email} />

                                    <InfoRow
                                        icon={<LinkIcon fontSize="small" />}
                                        label="Portfolio"
                                        content={
                                            editMode ? (
                                                <TextField
                                                    size="small"
                                                    fullWidth
                                                    placeholder="Portfolio URL"
                                                    value={profile.portfolioUrl || ""}
                                                    onChange={(e) => setProfile((prev) => ({ ...prev, portfolioUrl: e.target.value }))}
                                                />
                                            ) : profile.portfolioUrl ? (
                                                <Link href={profile.portfolioUrl} target="_blank" rel="noopener" sx={{ fontWeight: 500 }}>
                                                    {profile.portfolioUrl}
                                                </Link>
                                            ) : (
                                                <Typography color="text.secondary">Not provided</Typography>
                                            )
                                        }
                                    />
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Card elevation={0} sx={{ height: "100%", border: "1px solid", borderColor: "divider" }}>
                                <CardContent>
                                    <Typography
                                        variant="h6"
                                        fontWeight={600}
                                        gutterBottom
                                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                                    >
                                        <CodeIcon color="primary" />
                                        Expertise
                                    </Typography>
                                    <Divider sx={{ mb: 2 }} />

                                    <Box sx={{ mb: 3 }}>
                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight={600}>
                                            SKILLS
                                        </Typography>
                                        {editMode ? (
                                            <Autocomplete
                                                multiple
                                                options={allSkillNames || []}
                                                getOptionLabel={(option) => String(option)}
                                                value={profile?.skills || []}
                                                onChange={(_, value) => setProfile((prev) => ({ ...prev, skills: value }))}
                                                renderInput={(params) => <TextField {...params} placeholder="Add skills" size="small" />}
                                            />
                                        ) : (
                                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
                                                {(profile?.skills || [])
                                                    .filter(Boolean)
                                                    .map((name, i) => (
                                                        <Chip key={`skill-${i}`} label={name} size="medium" color="primary" variant="outlined" />
                                                    ))}
                                            </Box>
                                        )}
                                    </Box>
                                    <UploadCv cvUrl={profile.cvUrl} />
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    {canEdit && editMode && (
                        <>
                            <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end", gap: 1 }}>
                                <Button
                                    variant="outlined"
                                    color="inherit"
                                    startIcon={<CloseIcon />}
                                    onClick={async () => {
                                        setEditMode(false);
                                        await reloadProfile();
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    startIcon={<SaveIcon />}
                                    onClick={() => setShowConfirmSave(true)}
                                    disabled={saving}
                                >
                                    {saving ? "Saving..." : "Save changes"}
                                </Button>
                            </Box>

                            <ConfirmModal
                                show={showConfirmSave}
                                title="Confirm save"
                                message="Are you sure you want to save changes to your profile?"
                                onConfirm={async () => {
                                    setShowConfirmSave(false);
                                    await handleSave();
                                }}
                                onCancel={() => setShowConfirmSave(false)}
                                confirmText="Save"
                                cancelText="Cancel"
                            />

                        </>
                    )}
                </>
            )}
        </Box>
    );
}


function InfoRow({ icon, label, content }) {
    return (
        <Box sx={{ mb: 2.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                {icon}
                <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
                    {label.toUpperCase()}
                </Typography>
            </Box>
            {typeof content === "string" ? (
                <Typography sx={{ ml: 3 }}>{content}</Typography>
            ) : (
                <Box sx={{ ml: 3 }}>{content}</Box>
            )}
        </Box>
    );
}

export default IntervieweeProfilePage;
