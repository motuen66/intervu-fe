import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useUser from "../../../../common/hooks/useUser";
import { callApi } from "../../../../common/utils/apiConnector";
import { METHOD } from "../../../../common/constants/api";
import { candidateProfileEndPoints } from "../service/candidateProfileApi.js";
import { interactionEndPoints } from "../../../interviewQuestions/service/interactionApi.js";
import {
    Avatar,
    Box,
    CardContent,
    CircularProgress,
    Grid,
    Stack,
    Typography,
    Alert,
    Autocomplete,
    Fade,
    Divider,
    Link,
    IconButton,
    TextField,
    Tab,
    Tabs,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    Paper,
} from "@mui/material";
import BaseCard from "../../../../common/components/cards/BaseCard";
import { PrimaryButton, SecondaryButton } from "../../../../common/components/buttons";
import {
    Edit3 as EditIcon,
    X as CloseIcon,
    Save as SaveIcon,
    Mail as EmailIcon,
    Link as LinkIcon,
    Code as CodeIcon,
    Camera as CameraIcon,
    Star as StarIcon,
    User as PersonIcon,
} from "lucide-react";
import { uploadImage } from "../../../../firebase/service/storage";
import { useDispatch } from "react-redux";
import { setUserData } from "../../../../common/store/authSlice";
import ConfirmModal from "../../../../common/components/ConfirmModal";
import UploadCv from "../../components/UploadCv.jsx";
import { CompanyLogo } from "../../../../common/utils/logoImageGenerator";
import { ROLES } from "../../../../common/constants/common";

// ─── Shared row component ──────────────────────────────────────────────────────
function InfoRow({ icon, label, children }) {
    return (
        <Box
            sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: 1.5,
                p: 1.5,
                borderRadius: 2,
                border: "0.5px solid",
                borderColor: "divider",
                bgcolor: "grey.50",
                transition: "background 0.15s",
                "&:hover": { bgcolor: "grey.100" },
            }}
        >
            <Box
                sx={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    bgcolor: "background.paper",
                    border: "0.5px solid",
                    borderColor: "divider",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    mt: 0.25,
                }}
            >
                {icon}
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography
                    variant="caption"
                    color="text.disabled"
                    fontWeight={600}
                    sx={{ textTransform: "uppercase", letterSpacing: 0.7, display: "block", mb: 0.25 }}
                >
                    {label}
                </Typography>
                {children}
            </Box>
        </Box>
    );
}

// ─── Shared section header ─────────────────────────────────────────────────────
function SectionHeader({ icon, iconColor = "primary.main", iconBgColor, title }) {
    return (
        <>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 2.5 }}>
                <Box
                    sx={{
                        width: 32,
                        height: 32,
                        borderRadius: 1.5,
                        bgcolor: iconBgColor || ((t) => `${t.palette.primary.main}14`),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                    }}
                >
                    {React.cloneElement(icon, {
                        size: 16,
                        strokeWidth: 1.8,
                        color: `var(--mui-palette-${iconColor.replace(".", "-")})`,
                    })}
                </Box>
                <Typography variant="subtitle2" fontWeight={700} letterSpacing={0.1}>
                    {title}
                </Typography>
            </Box>
            <Divider sx={{ mb: 2.5, opacity: 0.6 }} />
        </>
    );
}

// ─── Skill pill ───────────────────────────────────────────────────────────────
function SkillPill({ name }) {
    return (
        <Box
            sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.6,
                px: 1.25,
                py: 0.5,
                borderRadius: 1.5,
                border: "0.5px solid",
                borderColor: "divider",
                bgcolor: "grey.50",
                color: "text.primary",
                fontSize: "0.8rem",
                fontWeight: 500,
                lineHeight: 1.4,
                transition: "all 0.12s ease",
                cursor: "default",
                "&:hover": {
                    bgcolor: "grey.100",
                    borderColor: "grey.400",
                    transform: "translateY(-1px)",
                },
            }}
        >
            <CompanyLogo name={String(name)} size={13} />
            {name}
        </Box>
    );
}

// ─── Main component ────────────────────────────────────────────────────────────
function CandidateProfilePage() {
    const { id: routeId, slugProfileUrl, profileUrl } = useParams();
    const navigate = useNavigate();
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
    const [candidateRating, setCandidateRating] = useState(null);
    const [candidateRatingCount, setCandidateRatingCount] = useState(0);
    const [tabValue, setTabValue] = useState(0);
    const [savedQuestions, setSavedQuestions] = useState([]);
    const [loadingSaved, setLoadingSaved] = useState(false);
    const dispatch = useDispatch();

    const endpoint = useMemo(() => {
        const slug = slugProfileUrl || profileUrl;
        if (slug) return candidateProfileEndPoints.VIEW_PROFILE_BY_SLUG.replace("{slugProfileUrl}", slug);
        if (routeId) return candidateProfileEndPoints.VIEW_OWN_CANDIDATE_PROFILE.replace("{id}", routeId);
        if (!user?.id) return null;
        return candidateProfileEndPoints.VIEW_OWN_CANDIDATE_PROFILE.replace("{id}", user.id);
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
                        currentAmount: res.data.currentAmount ?? null,
                    });
                    // fetch rating for this profile if endpoint exists
                    try {
                        const idToUse = res.data.id || routeId || user?.id;
                        if (idToUse) {
                            const ep = candidateProfileEndPoints.GET_CANDIDATE_RATING.replace("{id}", idToUse);
                            const r = await callApi({ method: METHOD.GET, endpoint: ep });
                            if (r?.success && r.data) {
                                const payload = r.data?.data || r.data;
                                const val = Number(
                                    payload?.averageRating ?? payload?.avgRating ?? payload?.rating ?? 0,
                                );
                                setCandidateRating(Number.isFinite(val) ? val : null);
                                // preserve count when available
                                setCandidateRatingCount(
                                    payload?.totalRatings ??
                                        payload?.totalFeedbacks ??
                                        payload?.ratingCount ??
                                        payload?.count ??
                                        0,
                                );
                            }
                        }
                    } catch (err) {
                        console.error("Error fetching candidate rating", err);
                    }
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
                    endpoint: candidateProfileEndPoints.GET_ALL_SKILLS.replace("{page}", "1").replace(
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

    const isCandidate = user?.role === ROLES.CANDIDATE || String(user?.role).toLowerCase() === "candidate";
    const isSelf = (!routeId && !slugProfileUrl) || String(routeId) === String(user?.id);
    const canEdit = isCandidate && isSelf;

    useEffect(() => {
        if (tabValue !== 1 || !isSelf || !isCandidate) return;
        setLoadingSaved(true);
        callApi({ method: METHOD.GET, endpoint: interactionEndPoints.GET_SAVED_QUESTIONS })
            .then(({ data }) => {
                const items = data?.items ?? data?.data ?? (Array.isArray(data) ? data : []);
                setSavedQuestions(items);
            })
            .catch(console.error)
            .finally(() => setLoadingSaved(false));
    }, [tabValue, isSelf, isCandidate]);

    const handleSave = async () => {
        if (!canEdit || !profile) return;
        const ep = candidateProfileEndPoints.UPDATE_CANDIDATE_PROFILE.replace("{id}", profile.id);
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

            const res = await callApi({ method: METHOD.PUT, endpoint: ep, arg: payload, displaySuccessMessage: true });
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

    const handleConfirmAvatar = async () => {
        setShowConfirmAvatar(false);
        if (!pendingAvatarFile) return;
        try {
            const data = await uploadImage(user.id, pendingAvatarFile);
            if (data?.profilePictureUrl) {
                const updatedUser = { ...user, profilePicture: data.profilePictureUrl };
                try {
                    localStorage.setItem("user", JSON.stringify(updatedUser));
                } catch (e) {
                    console.warn(e);
                }
                dispatch(setUserData(updatedUser));
                setProfile((prev) => ({
                    ...prev,
                    user: { ...(prev?.user || {}), profilePicture: data.profilePictureUrl },
                    profilePicture: data.profilePictureUrl,
                }));
                setAvatarKey(Date.now());
            }
        } catch (err) {
            console.error(err);
            setProfile((prev) => ({
                ...prev,
                user: { ...(prev?.user || {}), profilePicture: prevAvatar },
                profilePicture: prevAvatar,
            }));
        } finally {
            setPendingAvatarFile(null);
            setPendingAvatarLocalUrl(null);
            setPrevAvatar(null);
        }
    };

    const handleCancelAvatar = () => {
        setProfile((prev) => ({
            ...prev,
            user: { ...(prev?.user || {}), profilePicture: prevAvatar },
            profilePicture: prevAvatar,
        }));
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
    const fullName =
        profile?.user?.fullName ?? profile?.fullName ?? (viewingBySlug ? "Unnamed" : user?.fullName || "Unnamed");
    const email = profile?.user?.email ?? profile?.email ?? (viewingBySlug ? "-" : user?.email || "-");
    const normalizedCandidateRating = Number.isFinite(Number(candidateRating)) ? Number(candidateRating) : 0;
    const normalizedCandidateRatingCount = Number.isFinite(Number(candidateRatingCount))
        ? Number(candidateRatingCount)
        : 0;

    return (
        <Box sx={{ minHeight: "100vh" }}>
            <Fade in={saveSuccess}>
                <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSaveSuccess(false)}>
                    Profile updated successfully!
                </Alert>
            </Fade>

            {/* ── Hero card ── */}
            <BaseCard elevation={0} sx={{ mb: 3, overflow: "hidden", border: "0.5px solid", borderColor: "divider" }}>
                <Box
                    sx={{
                        height: 160,
                        background: "linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)",
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
                            {editMode ? (
                                <CloseIcon size={20} strokeWidth={2} />
                            ) : (
                                <EditIcon size={20} strokeWidth={2} />
                            )}
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
                                    sx={{ width: 140, height: 140, border: "5px solid white", boxShadow: 3 }}
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
                                            "&:hover": { bgcolor: "primary.dark" },
                                        }}
                                    >
                                        <CameraIcon size={18} strokeWidth={2} />
                                        <input
                                            hidden
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                const localUrl = URL.createObjectURL(file);
                                                setPrevAvatar(
                                                    profile?.profilePicture || profile?.user?.profilePicture || "",
                                                );
                                                setPendingAvatarFile(file);
                                                setPendingAvatarLocalUrl(localUrl);
                                                setProfile((prev) => ({
                                                    ...prev,
                                                    user: { ...(prev?.user || {}), profilePicture: localUrl },
                                                    profilePicture: localUrl,
                                                }));
                                                setShowConfirmAvatar(true);
                                            }}
                                        />
                                    </IconButton>
                                )}
                            </Box>
                        </Box>

                        <Box sx={{ flex: 1, pt: { xs: 0, sm: 2 } }}>
                            {editMode ? (
                                <TextField
                                    label="Full Name"
                                    fullWidth
                                    value={profile?.user?.fullName || profile?.fullName || ""}
                                    inputProps={{ maxLength: 100 }}
                                    onChange={(e) =>
                                        setProfile((prev) => ({
                                            ...prev,
                                            user: { ...(prev?.user || {}), fullName: e.target.value },
                                            fullName: e.target.value,
                                        }))
                                    }
                                    sx={{ mb: 2 }}
                                />
                            ) : (
                                <Typography variant="h4" fontWeight={700} gutterBottom>
                                    {fullName}
                                </Typography>
                            )}
                        </Box>
                    </Box>

                    {/* Bio Section */}
                    {profile && (
                        <Box sx={{ mt: 3 }}>
                            <Typography
                                variant="h6"
                                fontWeight={600}
                                gutterBottom
                                sx={{ display: "flex", alignItems: "center", gap: 1 }}
                            >
                                <PersonIcon size={24} strokeWidth={1.5} color="var(--mui-palette-primary-main)" />
                                About
                            </Typography>
                            {editMode ? (
                                <TextField
                                    fullWidth
                                    multiline
                                    minRows={4}
                                    value={profile.bio || ""}
                                    inputProps={{ maxLength: 3000 }} // Supporting approx 500 words
                                    onChange={(e) => setProfile((prev) => ({ ...prev, bio: e.target.value }))}
                                    placeholder="Tell us about yourself (max 500 words)..."
                                    sx={{ mt: 1 }}
                                />
                            ) : (
                                <Paper elevation={0} sx={{ p: 2, bgcolor: "grey.50", mt: 1 }}>
                                    <Typography variant="body1" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
                                        {profile.bio || "No bio provided yet."}
                                    </Typography>
                                </Paper>
                            )}
                        </Box>
                    )}
                </CardContent>
            </BaseCard>

            {profile && (
                <>
                    {isSelf && isCandidate && (
                        <Tabs
                            value={tabValue}
                            onChange={(_, v) => setTabValue(v)}
                            sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}
                        >
                            <Tab label="Profile" />
                            <Tab label="Saved Questions" />
                        </Tabs>
                    )}

                    {/* ── Profile tab ── */}
                    {tabValue === 0 && (
                        <>
                            <Grid
                                container
                                spacing={0}
                                sx={{
                                    border: "0.5px solid",
                                    borderColor: "divider",
                                    borderRadius: 3,
                                    overflow: "hidden",
                                    bgcolor: "background.paper",
                                    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                                }}
                            >
                                {/* ── LEFT: Contact ── */}
                                <Grid
                                    item
                                    xs={12}
                                    md={4}
                                    sx={{
                                        borderRight: { md: "0.5px solid" },
                                        borderRightColor: { md: "divider" },
                                        borderBottom: { xs: "0.5px solid", md: "none" },
                                        borderBottomColor: { xs: "divider" },
                                        display: "flex",
                                        flexDirection: "column",
                                    }}
                                >
                                    <Box sx={{ p: 3, flex: 1, display: "flex", flexDirection: "column" }}>
                                        <SectionHeader
                                            icon={<EmailIcon />}
                                            iconColor="primary.main"
                                            title="Contact Information"
                                        />

                                        <Stack spacing={1.5} sx={{ flex: 1 }}>
                                            {/* Email */}
                                            <InfoRow icon={<EmailIcon size={13} strokeWidth={1.8} />} label="Email">
                                                <Typography
                                                    variant="body2"
                                                    fontWeight={500}
                                                    sx={{
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                        whiteSpace: "nowrap",
                                                    }}
                                                >
                                                    {email}
                                                </Typography>
                                            </InfoRow>

                                            {/* Portfolio */}
                                            <InfoRow icon={<LinkIcon size={13} strokeWidth={1.8} />} label="Portfolio">
                                                {editMode ? (
                                                    <TextField
                                                        size="small"
                                                        fullWidth
                                                        placeholder="https://yourportfolio.com"
                                                        value={profile.portfolioUrl || ""}
                                                        onChange={(e) =>
                                                            setProfile((prev) => ({
                                                                ...prev,
                                                                portfolioUrl: e.target.value,
                                                            }))
                                                        }
                                                        sx={{
                                                            mt: 0.5,
                                                            "& .MuiOutlinedInput-root": { bgcolor: "background.paper" },
                                                        }}
                                                    />
                                                ) : profile.portfolioUrl ? (
                                                    <Link
                                                        href={profile.portfolioUrl}
                                                        target="_blank"
                                                        rel="noopener"
                                                        variant="body2"
                                                        fontWeight={500}
                                                        sx={{
                                                            display: "block",
                                                            overflow: "hidden",
                                                            textOverflow: "ellipsis",
                                                            whiteSpace: "nowrap",
                                                        }}
                                                    >
                                                        {profile.portfolioUrl}
                                                    </Link>
                                                ) : (
                                                    <Typography
                                                        variant="body2"
                                                        color="text.disabled"
                                                        fontStyle="italic"
                                                    >
                                                        Not provided
                                                    </Typography>
                                                )}
                                            </InfoRow>

                                            {/* Rating */}
                                            <InfoRow icon={<StarIcon size={13} strokeWidth={1.8} />} label="Rating">
                                                <Typography variant="body2" fontWeight={500}>
                                                    {`${normalizedCandidateRating.toFixed(1)} / 5`}
                                                </Typography>
                                                <Typography variant="caption" color="text.disabled">
                                                    {`${normalizedCandidateRatingCount} ratings`}
                                                </Typography>
                                            </InfoRow>
                                        </Stack>
                                    </Box>
                                </Grid>

                                {/* ── RIGHT: Skills ── */}
                                <Grid
                                    item
                                    xs={12}
                                    md={7}
                                    sx={{ display: "flex", flexDirection: "column", minWidth: "900px" }}
                                >
                                    <Box sx={{ p: 3, flex: 1, display: "flex", flexDirection: "column" }}>
                                        <SectionHeader
                                            icon={<CodeIcon />}
                                            iconColor="secondary.main"
                                            iconBgColor={(t) => `${t.palette.secondary.main}14`}
                                            title="Expertise"
                                        />

                                        <Box sx={{ mb: 3, flex: 1, display: "flex", flexDirection: "column" }}>
                                            <Typography
                                                variant="caption"
                                                color="text.disabled"
                                                fontWeight={600}
                                                sx={{
                                                    textTransform: "uppercase",
                                                    letterSpacing: 0.7,
                                                    display: "block",
                                                    mb: 1.25,
                                                }}
                                            >
                                                Skills
                                            </Typography>

                                            {editMode ? (
                                                <Autocomplete
                                                    multiple
                                                    options={allSkillNames || []}
                                                    getOptionLabel={(option) => String(option)}
                                                    value={profile?.skills || []}
                                                    onChange={(_, newValue) =>
                                                        setProfile((prev) => ({ ...prev, skills: newValue }))
                                                    }
                                                    renderInput={(params) => (
                                                        <TextField
                                                            {...params}
                                                            placeholder="Add skills"
                                                            size="small"
                                                            inputProps={{ ...params.inputProps, maxLength: 100 }}
                                                        />
                                                    )}
                                                />
                                            ) : (profile?.skills || []).length === 0 ? (
                                                <Typography variant="body2" color="text.disabled" fontStyle="italic">
                                                    No skills added yet
                                                </Typography>
                                            ) : (
                                                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 0.5 }}>
                                                    {(profile?.skills || []).filter(Boolean).map((name, i) => (
                                                        <Box
                                                            key={`skill-${i}`}
                                                            sx={{
                                                                display: "inline-flex",
                                                                alignItems: "center",
                                                                gap: 1,
                                                                px: 1.25,
                                                                py: 0.75,
                                                                borderRadius: 2,
                                                                border: "0.5px solid",
                                                                borderColor: "divider",
                                                                bgcolor: "grey.50",
                                                                color: "text.primary",
                                                                fontSize: "0.96rem",
                                                                fontWeight: 600,
                                                                lineHeight: 1.35,
                                                                transition: "all 0.12s ease",
                                                                cursor: "default",
                                                                minWidth: 140,
                                                                justifyContent: "flex-start",
                                                                "&:hover": {
                                                                    bgcolor: "grey.100",
                                                                    borderColor: "grey.400",
                                                                    transform: "translateY(-1px)",
                                                                },
                                                            }}
                                                        >
                                                            <CompanyLogo name={String(name)} size={18} />
                                                            <Box
                                                                component="span"
                                                                sx={{
                                                                    display: "block",
                                                                    whiteSpace: "normal",
                                                                    wordBreak: "break-word",
                                                                }}
                                                            >
                                                                {name}
                                                            </Box>
                                                        </Box>
                                                    ))}
                                                </Box>
                                            )}
                                        </Box>

                                        {user.role === ROLES.CANDIDATE && (
                                            <Box sx={{ pt: 2.5, borderTop: "0.5px solid", borderColor: "divider" }}>
                                                <UploadCv profile={profile} />
                                            </Box>
                                        )}
                                    </Box>
                                </Grid>
                            </Grid>

                            {/* ── Save bar ── */}
                            {canEdit && editMode && (
                                <>
                                    <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end", gap: 1 }}>
                                        <SecondaryButton
                                            startIcon={<CloseIcon size={18} strokeWidth={2} />}
                                            onClick={() => setEditMode(false)}
                                        >
                                            Cancel
                                        </SecondaryButton>
                                        <PrimaryButton
                                            startIcon={<SaveIcon size={18} strokeWidth={2} />}
                                            onClick={() => setShowConfirmSave(true)}
                                            loading={saving}
                                        >
                                            Save changes
                                        </PrimaryButton>
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

                    {/* ── Saved Questions tab ── */}
                    {tabValue === 1 && isSelf && isCandidate && (
                        <Box>
                            {loadingSaved ? (
                                <Box display="flex" justifyContent="center" py={4}>
                                    <CircularProgress />
                                </Box>
                            ) : savedQuestions.length === 0 ? (
                                <Typography align="center" color="text.secondary" py={4}>
                                    No saved questions yet.
                                </Typography>
                            ) : (
                                <List disablePadding>
                                    {savedQuestions.map((q) => (
                                        <ListItem key={q.id} disablePadding>
                                            <ListItemButton
                                                onClick={() => navigate(`/questions/${q.id}`)}
                                                sx={{ borderRadius: 1, mb: 0.5 }}
                                            >
                                                <ListItemText
                                                    primary={q.content ?? q.title ?? "Untitled"}
                                                    secondary={`${q.answerCount ?? 0} answers · ${q.vote ?? q.voteCount ?? 0} votes`}
                                                />
                                            </ListItemButton>
                                        </ListItem>
                                    ))}
                                </List>
                            )}
                        </Box>
                    )}
                </>
            )}
        </Box>
    );
}

export default CandidateProfilePage;
