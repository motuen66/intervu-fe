import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import useUser from "../../../../common/hooks/useUser";
import { useNavigate } from "react-router-dom";
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
    // Alert,
    Autocomplete,
    Fade,
    Divider,
    Link,
    IconButton,
    TextField,
    Tab,
    Tabs,
    Paper,
    Rating,
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
    ExternalLink as ExternalLinkIcon,
} from "lucide-react";
import { uploadImage } from "../../../../firebase/service/storage";
import { useDispatch } from "react-redux";
import { setUserData } from "../../../../common/store/authSlice";
import ConfirmModal from "../../../../common/components/ConfirmModal";
import UploadCv from "../../components/UploadCv.jsx";
import { CompanyLogo } from "../../../../common/utils/logoImageGenerator";
import { ROLES } from "../../../../common/constants/common";
import QuestionCard from "../../../interviewQuestions/page/InterviewQuestionsPage/QuestionCard";
import "../../coach/page/PublicInterviewerProfilePage/EliteCoachProfile.css";

import BankSelection from "../../coach/page/BankSelection";

function SidebarCard({ icon, title, badge, badgeActive, children, sx = {} }) {
    return (
        <Box
            className="ep-side-card"
            sx={{
                p: 0,
                overflow: "hidden",
                border: "1px solid",
                borderColor: "rgba(175, 227, 74, 0.3)",
                borderRadius: "var(--ep-radius-md)",
                background: "#fdfdf5",
                ...sx,
            }}
        >
            <Box
                sx={{
                    px: 2.5,
                    py: 1.75,
                    background: "linear-gradient(135deg, rgba(198,245,111,0.22) 0%, rgba(255,255,255,0.5) 100%)",
                    borderBottom: "1px solid",
                    borderColor: "rgba(175, 227, 74, 0.18)",
                    display: "flex",
                    alignItems: "center",
                    gap: 1.25,
                }}
            >
                <Box
                    sx={{
                        width: 30,
                        height: 30,
                        borderRadius: 1.5,
                        bgcolor: "rgba(175, 227, 74, 0.18)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                    }}
                >
                    {React.cloneElement(icon, { size: 15, strokeWidth: 2, color: "#6aaa00" })}
                </Box>
                <Typography variant="subtitle2" fontWeight={700} letterSpacing={0.1}>
                    {title}
                </Typography>
                {badge !== undefined && (
                    <Box
                        sx={{
                            ml: "auto",
                            bgcolor: badgeActive ? "#eaf9c9" : "grey.100",
                            color: badgeActive ? "#3a6b00" : "text.disabled",
                            px: 1.25,
                            py: 0.25,
                            borderRadius: 99,
                            fontSize: "0.7rem",
                            fontWeight: 800,
                            letterSpacing: "0.04em",
                        }}
                    >
                        {badge}
                    </Box>
                )}
            </Box>
            <Box sx={{ px: 2.5, py: 2 }}>{children}</Box>
        </Box>
    );
}

// ─── Info row ─────────────────────────────────────────────────────────────────
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

// ─── Main component ────────────────────────────────────────────────────────────
function CandidateProfilePage() {
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
                // If we requested by slug and candidate endpoint returned not-found, try coach public route
                const slug = slugProfileUrl || profileUrl;
                if (slug && (!res || !res.success || !res.data)) {
                    // Redirect to public interviewer profile route which handles coach profiles
                    navigate(`/profile/${slug}`);
                    return;
                }

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
    const isInterviewer = user?.role === ROLES.INTERVIEWER || String(user?.role).toLowerCase() === "interviewer";
    const isCoach = user?.role === ROLES.COACH || String(user?.role).toLowerCase() === "coach" || isInterviewer;
    const viewingBySlugOrId = Boolean(
        slugProfileUrl || profileUrl || (routeId && String(routeId) !== String(user?.id)),
    );
    const isSelf = !viewingBySlugOrId;
    const canEdit = isCandidate && isSelf;
    const canManageBank = isCandidate && isSelf;
    const canView = isSelf || isCandidate || isCoach;

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

    if (!canView) {
        return (
            <Box sx={{ p: 4, textAlign: "center" }}>
                <Typography variant="h6" color="text.secondary">
                    You do not have permission to view this profile.
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
    const portfolioLabel = profile?.portfolioUrl ? "Available" : "Missing";
    // const currentAmountLabel =
    //     profile?.currentAmount != null && profile?.currentAmount !== ""
    //         ? `${Number(profile.currentAmount).toLocaleString()} credits`
    //         : "Open to discuss";
    const cvStatus = profile?.cvUrl ? "CV uploaded" : "CV not uploaded";

    return (
        <Box className="elite-profile-container" sx={{ minHeight: "90vh" }}>
            <Box className="ep-shell" sx={{ pb: 0 }}>
                {/* <Fade in={saveSuccess}>
                    <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSaveSuccess(false)}>
                        Profile updated successfully!
                    </Alert>
                </Fade> */}

                {/* ── Hero card ── */}
                <BaseCard
                    elevation={0}
                    sx={{
                        mb: 4,
                        overflow: "hidden",
                        background: "#fdfdf5",
                        boxShadow: "var(--ep-shadow)",
                    }}
                >
                    <Box
                        sx={{
                            height: 72,
                            background:
                                "linear-gradient(135deg, rgba(198,245,111,0.28) 0%, rgba(255,255,255,0.45) 100%)",
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

                    <CardContent sx={{ pt: 0, p: { xs: 3, md: 5 } }}>
                        <Box
                            sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: { xs: 3, md: 5 } }}
                        >
                            <Box sx={{ mt: -4, position: "relative" }}>
                                <Box sx={{ position: "relative", display: "inline-block" }}>
                                    <Avatar
                                        src={avatarUrl}
                                        key={avatarKey}
                                        alt={fullName}
                                        sx={{
                                            width: { xs: 160, md: 220 },
                                            height: { xs: 160, md: 220 },
                                            border: "10px solid white",
                                            borderRadius: "var(--ep-radius-md)",
                                            boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.1)",
                                        }}
                                    />
                                    {canEdit && (
                                        <IconButton
                                            component="label"
                                            sx={{
                                                position: "absolute",
                                                bottom: 12,
                                                right: 12,
                                                bgcolor: "common.white",
                                                color: "text.primary",
                                                width: 42,
                                                height: 42,
                                                border: "1px solid",
                                                borderColor: "divider",
                                                "&:hover": { bgcolor: "grey.100" },
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

                            <Box sx={{ flex: 1, pt: { xs: 0, md: 1 } }}>
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
                                        sx={{ mb: 2, maxWidth: 520, bgcolor: "background.paper" }}
                                    />
                                ) : (
                                    <Typography
                                        component="h1"
                                        sx={{
                                            fontSize: { xs: "2rem", md: "3.5rem" },
                                            fontWeight: 800,
                                            lineHeight: 1,
                                            mb: 1,
                                            letterSpacing: "-0.04em",
                                        }}
                                    >
                                        {fullName}
                                    </Typography>
                                )}

                                <Typography
                                    component="p"
                                    sx={{
                                        fontSize: { xs: "1rem", md: "1.25rem" },
                                        color: "text.secondary",
                                        mb: 3,
                                        fontWeight: 500,
                                    }}
                                >
                                    Candidate profile
                                </Typography>

                                <Box
                                    sx={{ display: "flex", gap: { xs: 2, md: 3 }, mb: 3, flexWrap: "wrap", rowGap: 2 }}
                                >
                                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <Typography
                                                sx={{
                                                    fontSize: { xs: "1.25rem", md: "1.75rem" },
                                                    fontWeight: 800,
                                                    color: "text.primary",
                                                }}
                                            >
                                                {normalizedCandidateRating.toFixed(1)}
                                            </Typography>
                                            <Rating
                                                value={normalizedCandidateRating}
                                                precision={0.1}
                                                readOnly
                                                size="small"
                                                sx={{ color: "#afe34a" }}
                                            />
                                        </Stack>
                                        <Typography
                                            sx={{
                                                fontSize: "0.65rem",
                                                fontWeight: 700,
                                                textTransform: "uppercase",
                                                letterSpacing: "0.1em",
                                                color: "text.secondary",
                                                mt: 0.5,
                                            }}
                                        >
                                            {normalizedCandidateRatingCount} Ratings
                                        </Typography>
                                    </Box>

                                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                                        <Typography
                                            sx={{
                                                fontSize: { xs: "1.25rem", md: "1.75rem" },
                                                fontWeight: 800,
                                                color: "text.primary",
                                            }}
                                        >
                                            {(profile?.skills || []).length}
                                        </Typography>
                                        <Typography
                                            sx={{
                                                fontSize: "0.65rem",
                                                fontWeight: 700,
                                                textTransform: "uppercase",
                                                letterSpacing: "0.1em",
                                                color: "text.secondary",
                                                mt: 0.5,
                                            }}
                                        >
                                            Core Skills
                                        </Typography>
                                    </Box>

                                    {/* <Box sx={{ display: "flex", flexDirection: "column" }}>
                                        <Typography
                                            sx={{
                                                fontSize: { xs: "1.25rem", md: "1.75rem" },
                                                fontWeight: 800,
                                                color: "text.primary",
                                            }}
                                        >
                                            {currentAmountLabel}
                                        </Typography>
                                        <Typography
                                            sx={{
                                                fontSize: "0.65rem",
                                                fontWeight: 700,
                                                textTransform: "uppercase",
                                                letterSpacing: "0.1em",
                                                color: "text.secondary",
                                                mt: 0.5,
                                            }}
                                        >
                                            Current Amount
                                        </Typography>
                                    </Box> */}
                                </Box>
                            </Box>
                        </Box>

                        {/* Bio */}
                        {profile && (
                            <Box sx={{ mt: 3 }}>
                                <Typography className="ep-about-title">About</Typography>
                                {editMode ? (
                                    <TextField
                                        fullWidth
                                        multiline
                                        minRows={5}
                                        value={profile.bio || ""}
                                        inputProps={{ maxLength: 3000 }}
                                        onChange={(e) => setProfile((prev) => ({ ...prev, bio: e.target.value }))}
                                        placeholder="Tell us about yourself (max 500 words)..."
                                        sx={{
                                            mt: 1,
                                            maxWidth: 860,
                                            "& .MuiOutlinedInput-root": { bgcolor: "background.paper" },
                                        }}
                                    />
                                ) : (
                                    <Typography className="ep-about-text" sx={{ whiteSpace: "pre-wrap" }}>
                                        {profile.bio || "No bio provided yet."}
                                    </Typography>
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
                                <Box className="ep-main-grid" sx={{ mb: 3 }}>
                                    <Box className="ep-content-left">
                                        <Box component="section" className="ep-expertise" sx={{ mb: 5 }}>
                                            {/* <SectionHeader icon={<StarIcon />} title="Expertise & Experience" /> */}

                                            <Typography
                                                sx={{
                                                    fontSize: "0.75rem",
                                                    fontWeight: 800,
                                                    textTransform: "uppercase",
                                                    letterSpacing: "0.12em",
                                                    color: "var(--ep-accent-dark)",
                                                    mb: 1.25,
                                                }}
                                            >
                                                Core Skills
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
                                                            sx={{
                                                                mb: 3,
                                                                "& .MuiOutlinedInput-root": {
                                                                    bgcolor: "background.paper",
                                                                },
                                                            }}
                                                        />
                                                    )}
                                                />
                                            ) : (
                                                <Box
                                                    sx={{
                                                        display: "flex",
                                                        flexWrap: "wrap",
                                                        gap: 0.85,
                                                        mb: 3,
                                                    }}
                                                >
                                                    {(profile?.skills || []).filter(Boolean).map((name, i) => (
                                                        <Box
                                                            key={`skill-public-${i}`}
                                                            sx={{
                                                                display: "inline-flex",
                                                                alignItems: "center",
                                                                gap: 0.7,
                                                                background: "white",
                                                                border: "1px solid rgba(175, 227, 74, 0.3)",
                                                                padding: "0.6rem 1.4rem",
                                                                borderRadius: 99,
                                                                fontWeight: 700,
                                                                fontSize: "0.85rem",
                                                                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.03)",
                                                                color: "var(--ep-text-main)",
                                                                transition: "all 0.2s ease",
                                                                cursor: "default",
                                                            }}
                                                        >
                                                            <CompanyLogo name={String(name)} size={18} />
                                                            {name}
                                                        </Box>
                                                    ))}
                                                    {(profile?.skills || []).length === 0 && (
                                                        <Typography color="text.secondary">
                                                            No skills listed.
                                                        </Typography>
                                                    )}
                                                </Box>
                                            )}

                                            {/* <Typography
                                                sx={{
                                                    fontSize: "0.75rem",
                                                    fontWeight: 800,
                                                    textTransform: "uppercase",
                                                    letterSpacing: "0.12em",
                                                    color: "var(--ep-accent-dark)",
                                                    mb: 1.25,
                                                }}
                                            >
                                                Profile Highlights
                                            </Typography> */}
                                            <Box
                                                sx={{
                                                    display: "grid",
                                                    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                                                    gap: 2,
                                                    mb: 4,
                                                }}
                                            >
                                                {/* <Box
                                                    sx={{
                                                        background: "white",
                                                        border: "1px solid var(--ep-border)",
                                                        borderRadius: "20px",
                                                        padding: "1.75rem",
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        gap: 0.25,
                                                        position: "relative",
                                                        overflow: "hidden",
                                                        "&:hover": {
                                                            borderColor: "var(--ep-accent)",
                                                            boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.1)",
                                                        },
                                                        "&::before": {
                                                            content: '""',
                                                            position: "absolute",
                                                            top: 0,
                                                            left: 0,
                                                            width: 4,
                                                            height: "100%",
                                                            background: "var(--ep-accent)",
                                                        },
                                                    }}
                                                > */}
                                                {/* <Typography
                                                        variant="subtitle2"
                                                        sx={{ fontWeight: 800, textTransform: "uppercase", mb: 0.5 }}
                                                    >
                                                        Portfolio
                                                    </Typography>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{ color: "text.secondary", fontWeight: 500 }}
                                                    >
                                                        {profile.portfolioUrl ||
                                                            "Add your portfolio link to showcase your work."}
                                                    </Typography> */}
                                                {/* </Box> */}
                                                {/* <Box
                                                    sx={{
                                                        background: "white",
                                                        border: "1px solid var(--ep-border)",
                                                        borderRadius: "20px",
                                                        padding: "1.75rem",
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        gap: 0.25,
                                                        position: "relative",
                                                        overflow: "hidden",
                                                        "&:hover": {
                                                            borderColor: "var(--ep-accent)",
                                                            boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.1)",
                                                        },
                                                        "&::before": {
                                                            content: '""',
                                                            position: "absolute",
                                                            top: 0,
                                                            left: 0,
                                                            width: 4,
                                                            height: "100%",
                                                            background: "var(--ep-accent)",
                                                        },
                                                    }}
                                                >
                                                    <Typography
                                                        variant="subtitle2"
                                                        sx={{ fontWeight: 800, textTransform: "uppercase", mb: 0.5 }}
                                                    >
                                                        Current Amount
                                                    </Typography>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{ color: "text.secondary", fontWeight: 500 }}
                                                    >
                                                        {currentAmountLabel}
                                                    </Typography>
                                                </Box> */}
                                            </Box>
                                        </Box>

                                        <Box component="section" className="ep-services">
                                            {/* <SectionHeader icon={<CodeIcon />} title="Candidate Materials" /> */}
                                            <Box
                                                sx={{
                                                    display: "grid",
                                                    gridTemplateColumns: "1fr",
                                                    gap: 3,
                                                }}
                                            >
                                                <Box sx={{ cursor: "default" }}>
                                                    <UploadCv profile={profile} canEdit={canEdit} />
                                                </Box>
                                            </Box>
                                        </Box>
                                    </Box>

                                    {/* ── Sidebar ── */}
                                    <Box component="aside" className="ep-sidebar">
                                        {/* Merged Portfolio & Contact card */}
                                        <SidebarCard
                                            icon={<LinkIcon />}
                                            title="Portfolio & Contact"
                                            badge={profile?.portfolioUrl ? "Available" : "Missing"}
                                            badgeActive={!!profile?.portfolioUrl}
                                            sx={{ mb: 3 }}
                                        >
                                            {/* Portfolio row */}
                                            <Box sx={{ mb: 2 }}>
                                                <Typography
                                                    variant="caption"
                                                    color="text.disabled"
                                                    fontWeight={700}
                                                    sx={{
                                                        textTransform: "uppercase",
                                                        letterSpacing: "0.07em",
                                                        display: "block",
                                                        mb: 0.75,
                                                    }}
                                                >
                                                    Portfolio
                                                </Typography>
                                                {editMode ? (
                                                    <TextField
                                                        fullWidth
                                                        size="small"
                                                        placeholder="https://yourportfolio.com"
                                                        value={profile?.portfolioUrl || ""}
                                                        onChange={(e) =>
                                                            setProfile((prev) => ({
                                                                ...prev,
                                                                portfolioUrl: e.target.value,
                                                            }))
                                                        }
                                                        sx={{
                                                            "& .MuiOutlinedInput-root": { bgcolor: "background.paper" },
                                                        }}
                                                    />
                                                ) : profile?.portfolioUrl ? (
                                                    <Link
                                                        href={profile.portfolioUrl}
                                                        target="_blank"
                                                        rel="noopener"
                                                        sx={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: 0.75,
                                                            wordBreak: "break-all",
                                                            fontSize: "0.85rem",
                                                            fontWeight: 600,
                                                            color: "#3a7d00",
                                                            textDecorationColor: "rgba(58,125,0,0.3)",
                                                        }}
                                                    >
                                                        {profile.portfolioUrl}
                                                        <ExternalLinkIcon
                                                            size={13}
                                                            strokeWidth={2}
                                                            style={{ flexShrink: 0 }}
                                                        />
                                                    </Link>
                                                ) : (
                                                    <Typography
                                                        color="text.disabled"
                                                        fontStyle="italic"
                                                        fontSize="0.85rem"
                                                    >
                                                        No portfolio URL provided yet.
                                                    </Typography>
                                                )}
                                            </Box>

                                            <Divider sx={{ my: 1.5, opacity: 0.5 }} />

                                            {/* Contact row */}
                                            <Box>
                                                <Typography
                                                    variant="caption"
                                                    color="text.disabled"
                                                    fontWeight={700}
                                                    sx={{
                                                        textTransform: "uppercase",
                                                        letterSpacing: "0.07em",
                                                        display: "block",
                                                        mb: 0.75,
                                                    }}
                                                >
                                                    Contact
                                                </Typography>
                                                <Typography fontSize="0.9rem" fontWeight={500}>
                                                    {email}
                                                </Typography>
                                            </Box>

                                            {/* Bank Info in EDIT MODE ONLY */}
                                            {editMode && canManageBank && (
                                                <Box
                                                    sx={{
                                                        mt: 3,
                                                        pt: 2,
                                                        borderTop: "1px dashed",
                                                        borderColor: "divider",
                                                    }}
                                                >
                                                    <Typography
                                                        variant="subtitle2"
                                                        fontWeight={700}
                                                        sx={{ mb: 1.5, color: "primary.main" }}
                                                    >
                                                        Payment Settings
                                                    </Typography>
                                                    <BankSelection
                                                        selectedBin={profile?.bankBinNumber}
                                                        accountNumber={profile?.bankAccountNumber}
                                                        onChange={(data) =>
                                                            setProfile((prev) => ({
                                                                ...prev,
                                                                bankBinNumber: data.bin,
                                                                bankAccountNumber: data.accountNumber,
                                                            }))
                                                        }
                                                    />
                                                </Box>
                                            )}
                                        </SidebarCard>

                                        {/* Checklist card - only show when viewing own profile */}
                                        {isSelf && (
                                            <Box className="ep-side-card ep-match-card">
                                                <Typography
                                                    variant="overline"
                                                    sx={{ fontWeight: 800, color: "text.secondary" }}
                                                >
                                                    Checklist
                                                </Typography>
                                                <Box className="ep-progress-bg">
                                                    <Box
                                                        className="ep-progress-bar"
                                                        sx={{
                                                            width: `${(profile?.skills?.length ? 33 : 0) + (profile?.cvUrl ? 33 : 0) + (profile?.portfolioUrl ? 34 : 0)}%`,
                                                        }}
                                                    />
                                                </Box>
                                                <Typography sx={{ fontSize: "0.9rem", color: "text.secondary", mb: 2 }}>
                                                    Complete the essentials so your candidate profile feels finished.
                                                </Typography>
                                                <Box component="ul" className="ep-benefit-list" sx={{ mb: 0 }}>
                                                    {["Skills added", "CV uploaded", "Portfolio linked"].map(
                                                        (item, i) => (
                                                            <Box key={item} component="li" className="ep-benefit-item">
                                                                <Box className="ep-benefit-check">{i + 1}</Box>
                                                                {item}
                                                            </Box>
                                                        ),
                                                    )}
                                                </Box>
                                            </Box>
                                        )}
                                    </Box>
                                </Box>

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
                                    <Stack spacing={1}>
                                        {savedQuestions.map((q) => (
                                            <QuestionCard key={q.id} item={q} />
                                        ))}
                                    </Stack>
                                )}
                            </Box>
                        )}
                    </>
                )}
            </Box>
        </Box>
    );
}

export default CandidateProfilePage;
