import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import useUser from "../../../../common/hooks/useUser";
import { callApi } from "../../../../common/utils/apiConnector";
import { METHOD } from "../../../../common/constants/api";
import { interviewerProfileEndPoints } from "../service/coachProfileApi";
import { CompanyLogo } from "../../../../common/utils/logoImageGenerator";
import { uploadImage } from "../../../../firebase/service/storage";
import { useDispatch } from "react-redux";
import { setUserData } from "../../../../common/store/authSlice";
import ConfirmModal from "../../../../common/components/ConfirmModal";
import BankSelection from "./BankSelection";
import {
    Box,
    Typography,
    Stack,
    CircularProgress,
    Avatar,
    IconButton,
    TextField,
    Paper,
    Link,
    Grid,
    Divider,
    CardContent,
} from "@mui/material";
import { Tabs, Tab } from "@mui/material";
import {
    Camera as CameraIcon,
    Edit as EditIcon,
    X as CloseIcon,
    Briefcase as WorkIcon,
    Mail as EmailIcon,
    Link as LinkIcon,
    Code as CodeIcon,
    User as PersonIcon,
    Save as SaveIcon,
    Star as StarIcon,
} from "lucide-react";
import { Autocomplete } from "@mui/material";
import BaseCard from "../../../../common/components/cards/BaseCard";
import { PrimaryButton, SecondaryButton } from "../../../../common/components/buttons";
import QuestionCard from "../../../interviewQuestions/page/InterviewQuestionsPage/QuestionCard";
import { interactionEndPoints } from "../../../interviewQuestions/service/interactionApi";

function getRoleFromJwt() {
    try {
        const raw = localStorage.getItem("token");
        if (!raw) return undefined;
        const token = JSON.parse(raw);
        if (!token || typeof token !== "string") return undefined;
        const parts = token.split(".");
        if (parts.length < 2) return undefined;
        const json = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
        const payload = JSON.parse(json);
        const claim =
            payload?.role ||
            payload?.roles ||
            payload?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
        if (Array.isArray(claim)) return claim[0];
        return claim;
    } catch {
        return undefined;
    }
}

function InterviewerProfilePage() {
    const { id: routeId } = useParams();
    const user = useUser();
    const dispatch = useDispatch();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [expandedBio, setExpandedBio] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [allSkills, setAllSkills] = useState([]);
    const [allCompanies, setAllCompanies] = useState([]);
    const [avatarKey, setAvatarKey] = useState(Date.now());
    const [prevAvatar, setPrevAvatar] = useState(null);
    const [pendingAvatarFile, setPendingAvatarFile] = useState(null);
    const [pendingAvatarLocalUrl, setPendingAvatarLocalUrl] = useState(null);
    const [showConfirmAvatar, setShowConfirmAvatar] = useState(false);
    const [showConfirmSave, setShowConfirmSave] = useState(false);
    const [coachRating, setCoachRating] = useState(null);
    const [coachRatingCount, setCoachRatingCount] = useState(0);
    const [tabValue, setTabValue] = useState(0);
    const [savedQuestions, setSavedQuestions] = useState([]);
    const [loadingSaved, setLoadingSaved] = useState(false);

    const tokenRole = useMemo(() => {
        const r = getRoleFromJwt();
        return typeof r === "number" ? r : String(r || "").toLowerCase();
    }, []);
    const isInterviewer =
        user?.role === 1 ||
        String(user?.role).toLowerCase() === "interviewer" ||
        tokenRole === 1 ||
        tokenRole === "interviewer";

    const endpoint = useMemo(() => {
        if (routeId) {
            return interviewerProfileEndPoints.VIEW_OWN_INTERVIEWER_PROFILE.replace("{id}", routeId);
        }
        if (!user?.id) return null;

        return isInterviewer
            ? interviewerProfileEndPoints.VIEW_OWN_INTERVIEWER_PROFILE.replace("{id}", user.id)
            : interviewerProfileEndPoints.VIEW_PROFILE_BY_CANDIDATE.replace("{id}", user.id);
    }, [routeId, user?.id, user?.role]);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!endpoint) return;
            setLoading(true);
            setError(null);
            try {
                const res = await callApi({ method: METHOD.GET, endpoint });
                if (res.success) {
                    setProfile({
                        ...res.data,
                        skills: res.data.skills?.map((s) => s.name || s) || [],
                        companies: res.data.companies?.map((c) => c.name || c) || [],
                        bankBinNumber: res.data.bankBinNumber || "",
                        bankAccountNumber: res.data.bankAccountNumber || "",
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
        const fetchDropdownData = async () => {
            try {
                const skillsRes = await callApi({
                    method: METHOD.GET,
                    endpoint: interviewerProfileEndPoints.GET_ALL_SKILLS.replace("{page}", "1").replace(
                        "{pageSize}",
                        "100",
                    ),
                });

                const companiesRes = await callApi({
                    method: METHOD.GET,
                    endpoint: interviewerProfileEndPoints.GET_ALL_COMPANIES.replace("{page}", "1").replace(
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
                }

                if (companiesRes.success) {
                    const companies = Array.isArray(companiesRes.data)
                        ? companiesRes.data
                        : Array.isArray(companiesRes.data?.items)
                          ? companiesRes.data.items
                          : [];
                    setAllCompanies(companies);
                }
            } catch (err) {
                console.error("Error loading dropdown data:", err);
            }
        };
        fetchDropdownData();
    }, []);

    useEffect(() => {
        const fetchRating = async () => {
            if (!profile?.id) return;
            try {
                const res = await callApi({
                    endpoint: interviewerProfileEndPoints.GET_COACH_RATING.replace("{id}", profile.id),
                    method: METHOD.GET,
                });
                const data = res?.data || {};
                const payload = data?.data || data;
                setCoachRating(payload?.averageRating ?? payload?.avgRating ?? payload?.rating ?? 0);
                setCoachRatingCount(
                    payload?.totalRatings ?? payload?.totalFeedbacks ?? payload?.ratingCount ?? payload?.count ?? 0,
                );
            } catch (err) {
                // ignore
            }
        };

        fetchRating();
    }, [profile?.id]);

    if (!user) {
        return (
            <Box sx={{ p: 4, textAlign: "center" }}>
                <Typography variant="h6" color="text.secondary">
                    Please login to view your profile.
                </Typography>
            </Box>
        );
    }

    const handleTabChange = (_, v) => setTabValue(v);

    const onPick = (e) => {
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
    };

    const handleConfirmAvatar = async () => {
        setShowConfirmAvatar(false);
        console.log("Pending avatar file:", pendingAvatarFile);
        if (!pendingAvatarFile) return;
        console.log("Uploading avatar for user ID:", user.id);
        try {
            const data = await uploadImage(user.id, pendingAvatarFile);
            console.log("Uploaded avatar data:", data);
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
        // revert preview
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

    const avatarUrl = profile?.profilePicture || profile?.user?.profilePicture || "";
    const fullName = profile?.user?.fullName || profile?.fullName || user?.fullName || "Unnamed";
    const email = profile?.user?.email || user?.email || "-";
    const years = profile?.experienceYears ?? profile?.yearsOfExperience;
    const bio = profile?.bio || profile?.description || "";

    const truncatedBio = React.useMemo(() => {
        if (!bio) return "";
        if (bio.length <= 240) return bio;
        return expandedBio ? bio : bio.slice(0, 240) + "...";
    }, [bio, expandedBio]);

    const handleSave = async () => {
        if (!profile) return;

        const endpoint = interviewerProfileEndPoints.UPDATE_INTERVIEWER_PROFILE.replace("{id}", profile.id);
        setSaving(true);
        setError(null);

        try {
            const skillIds = (profile.skills || [])
                .map((s) => (typeof s === "object" ? s.id : allSkills.find((sk) => sk.name === s)?.id))
                .filter(Boolean);

            const companyIds = (profile.companies || [])
                .map((c) => (typeof c === "object" ? c.id : allCompanies.find((co) => co.name === c)?.id))
                .filter(Boolean);

            const payload = {
                id: profile.id,
                fullName: profile.user?.fullName || profile.fullName || "",
                email: profile.user?.email || profile.email || "",
                profilePicture: avatarUrl,
                portfolioUrl: profile.portfolioUrl || "",
                currentAmount: Number(profile.currentAmount) || 0,
                experienceYears:
                    profile.experienceYears === "" || profile.experienceYears == null
                        ? undefined
                        : Number(profile.experienceYears),
                bio: profile.bio || "",
                skillIds,
                companyIds,
                bankBinNumber: profile.bankBinNumber || "",
                bankAccountNumber: String(profile.bankAccountNumber || "").trim(),
            };

            const res = await callApi({
                method: METHOD.PUT,
                endpoint,
                arg: payload,
                displaySuccessMessage: true,
            });

            if (res.success) {
                setEditMode(false);
                setSaveSuccess(true);
                setProfile((prev) => ({ ...prev, ...payload }));
                //dispatch(setUserData(res.data.user));
            } else {
                setError(res.message || "Failed to save profile.");
            }
        } catch (err) {
            setError(err.message || "An error occurred while saving.");
        } finally {
            setSaving(false);
        }
    };

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

    const skillsDisplay = (profile?.skills || []).map((s) => (typeof s === "object" ? s?.name : s)).filter(Boolean);
    const companiesDisplay = (profile?.companies || [])
        .map((c) => (typeof c === "object" ? c?.name : c))
        .filter(Boolean);
    const averageRating = Number(coachRating ?? profile?.rating ?? 0);
    const totalRatings = Number(coachRatingCount ?? profile?.ratingCount ?? 0);

    const isSelf = !routeId || String(routeId) === String(user?.id);
    const canEdit = isInterviewer && isSelf;
    const canManageBank = isInterviewer && isSelf;

    useEffect(() => {
        if (tabValue !== 1 || !isSelf || !isInterviewer) return;
        setLoadingSaved(true);
        callApi({ method: METHOD.GET, endpoint: interactionEndPoints.GET_SAVED_QUESTIONS })
            .then(({ data }) => {
                const payload = data ?? {};
                const items = Array.isArray(payload) ? payload : (payload.items ?? payload.data ?? []);
                setSavedQuestions(items);
            })
            .catch(() => setSavedQuestions([]))
            .finally(() => setLoadingSaved(false));
    }, [tabValue, isSelf, isInterviewer]);

    return (
        <Box sx={{ minHeight: "100vh" }}>
            <BaseCard
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
                        background: "linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)",
                        position: "relative",
                    }}
                >
                    {(() => {
                        const isSelf = !routeId || String(routeId) === String(user?.id);
                        const canEdit = isInterviewer && isSelf;
                        return (
                            canEdit && (
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
                            )
                        );
                    })()}
                </Box>

                <ConfirmModal
                    show={showConfirmAvatar}
                    title="Confirm avatar change"
                    message="Are you sure you want to change your avatar?"
                    onConfirm={handleConfirmAvatar}
                    onCancel={handleCancelAvatar}
                    confirmText="Change"
                    cancelText="Cancel"
                />
                <CardContent sx={{ pt: 0 }}>
                    <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 3 }}>
                        {/* Avatar */}
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
                                        <CameraIcon size={18} strokeWidth={2} />
                                        <input hidden type="file" accept="image/*" onChange={onPick} />
                                    </IconButton>
                                )}
                            </Box>
                        </Box>

                        <Box sx={{ flex: 1, pt: { xs: 0, sm: 2 } }}>
                            {editMode ? (
                                <TextField
                                    label="Full Name"
                                    fullWidth
                                    value={profile?.user?.fullName || ""}
                                    inputProps={{ maxLength: 100 }}
                                    onChange={(e) =>
                                        setProfile((prev) => ({
                                            ...prev,
                                            user: { ...(prev?.user || {}), fullName: e.target.value },
                                        }))
                                    }
                                    sx={{ mb: 2 }}
                                />
                            ) : (
                                <Typography variant="h4" fontWeight={700} gutterBottom>
                                    {fullName}
                                </Typography>
                            )}

                            {years != null && (
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                                    <WorkIcon size={18} strokeWidth={2} color="var(--mui-palette-action-active)" />
                                    {editMode ? (
                                        <TextField
                                            label="Years of experience"
                                            type="number"
                                            size="small"
                                            value={profile?.experienceYears ?? ""}
                                            inputProps={{ maxLength: 3, min: 0 }}
                                            onChange={(e) =>
                                                setProfile((prev) => ({
                                                    ...prev,
                                                    experienceYears:
                                                        e.target.value === "" ? "" : Number(e.target.value),
                                                }))
                                            }
                                            sx={{ width: 200 }}
                                        />
                                    ) : (
                                        <Typography color="text.secondary" variant="body1">
                                            {years} years of experience
                                        </Typography>
                                    )}
                                </Box>
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
                                    inputProps={{ maxLength: 3000 }}
                                    onChange={(e) => setProfile((prev) => ({ ...prev, bio: e.target.value }))}
                                    placeholder="Tell us about yourself (max 500 words)..."
                                    sx={{ mt: 1 }}
                                />
                            ) : (
                                <Paper elevation={0} sx={{ p: 2, bgcolor: "grey.50", mt: 1 }}>
                                    <Typography variant="body1" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
                                        {truncatedBio || "No bio provided yet."}
                                    </Typography>
                                    {bio.length > 240 && (
                                        <Link
                                            component="button"
                                            type="button"
                                            onClick={() => setExpandedBio((v) => !v)}
                                            sx={{ mt: 1, fontWeight: 600 }}
                                        >
                                            {expandedBio ? "Show less" : "Read more"}
                                        </Link>
                                    )}
                                </Paper>
                            )}
                        </Box>
                    )}
                </CardContent>
            </BaseCard>

            {/* Tabs: Profile / Saved Questions (coach) */}
            {isSelf && isInterviewer && (
                <Box sx={{ mt: 2, mb: 2 }}>
                    <Tabs value={tabValue} onChange={handleTabChange}>
                        <Tab label="Profile" />
                        <Tab label="Saved Questions" />
                    </Tabs>
                </Box>
            )}

            {profile && (
                <>
                    {tabValue === 0 && (
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
                                width: "100%",
                                m: 0,
                            }}
                        >
                            {/* ─── LEFT: Contact ─────────────────────────── */}
                            <Grid
                                item
                                xs={12}
                                md={4}
                                sx={{
                                    borderRight: { md: "0.5px solid" },
                                    borderRightColor: { md: "divider" },
                                    borderBottom: { xs: "0.5px solid", md: "none" },
                                    borderBottomColor: { xs: "divider" },
                                }}
                            >
                                <Box sx={{ p: 3 }}>
                                    {/* Header */}
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 2.5 }}>
                                        <Box
                                            sx={{
                                                width: 32,
                                                height: 32,
                                                borderRadius: 1.5,
                                                bgcolor: (t) => `${t.palette.primary.main}14`,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                flexShrink: 0,
                                            }}
                                        >
                                            <EmailIcon
                                                size={16}
                                                strokeWidth={1.8}
                                                color="var(--mui-palette-primary-main)"
                                            />
                                        </Box>
                                        <Typography variant="subtitle2" fontWeight={700} letterSpacing={0.1}>
                                            Contact Information
                                        </Typography>
                                    </Box>

                                    <Divider sx={{ mb: 2.5, opacity: 0.6 }} />

                                    {/* Email */}
                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "flex-start",
                                            gap: 1.5,
                                            mb: 2,
                                            p: 1.5,
                                            borderRadius: 2,
                                            border: "0.5px solid",
                                            borderColor: "divider",
                                            bgcolor: "grey.50",
                                            "&:hover": { bgcolor: "grey.100" },
                                            transition: "background 0.15s",
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
                                            <EmailIcon size={13} strokeWidth={1.8} />
                                        </Box>
                                        <Box sx={{ minWidth: 0, flex: 1 }}>
                                            <Typography
                                                variant="caption"
                                                color="text.disabled"
                                                fontWeight={600}
                                                sx={{
                                                    textTransform: "uppercase",
                                                    letterSpacing: 0.7,
                                                    display: "block",
                                                    mb: 0.25,
                                                }}
                                            >
                                                Email
                                            </Typography>
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
                                        </Box>
                                    </Box>

                                    {/* Portfolio */}
                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "flex-start",
                                            gap: 1.5,
                                            mb: 2,
                                            p: 1.5,
                                            borderRadius: 2,
                                            border: "0.5px solid",
                                            borderColor: "divider",
                                            bgcolor: "grey.50",
                                            "&:hover": { bgcolor: "grey.100" },
                                            transition: "background 0.15s",
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
                                            <LinkIcon size={13} strokeWidth={1.8} />
                                        </Box>
                                        <Box sx={{ minWidth: 0, flex: 1 }}>
                                            <Typography
                                                variant="caption"
                                                color="text.disabled"
                                                fontWeight={600}
                                                sx={{
                                                    textTransform: "uppercase",
                                                    letterSpacing: 0.7,
                                                    display: "block",
                                                    mb: 0.25,
                                                }}
                                            >
                                                Portfolio
                                            </Typography>
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
                                                <Typography variant="body2" color="text.disabled" fontStyle="italic">
                                                    Not provided
                                                </Typography>
                                            )}
                                        </Box>
                                    </Box>

                                    {/* Rating row */}
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
                                            "&:hover": { bgcolor: "grey.100" },
                                            transition: "background 0.15s",
                                            mt: 2,
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
                                            <StarIcon size={13} strokeWidth={1.8} />
                                        </Box>
                                        <Box sx={{ minWidth: 0, flex: 1 }}>
                                            <Typography
                                                variant="caption"
                                                color="text.disabled"
                                                fontWeight={600}
                                                sx={{
                                                    textTransform: "uppercase",
                                                    letterSpacing: 0.7,
                                                    display: "block",
                                                    mb: 0.25,
                                                }}
                                            >
                                                Coach Rating
                                            </Typography>
                                            <Typography variant="body2" fontWeight={600}>
                                                {averageRating > 0 ? averageRating.toFixed(1) : "N/A"} / 5
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {totalRatings.toLocaleString()} ratings
                                            </Typography>
                                        </Box>
                                    </Box>

                                    {/* Bank Info in EDIT MODE ONLY */}
                                    {editMode && canManageBank && (
                                        <Box sx={{ mt: 3, pt: 2, borderTop: "1px dashed", borderColor: "divider" }}>
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
                                                onChange={(data) => {
                                                    setProfile((prev) => ({
                                                        ...prev,
                                                        bankBinNumber: data.bin,
                                                        bankAccountNumber: data.accountNumber,
                                                    }));
                                                }}
                                            />
                                        </Box>
                                    )}
                                </Box>
                            </Grid>

                            {/* ─── RIGHT: Skills & Companies ─────────────── */}
                            <Grid item xs={12} md={8}>
                                <Box sx={{ p: 3 }}>
                                    {/* Header */}
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 2.5 }}>
                                        <Box
                                            sx={{
                                                width: 32,
                                                height: 32,
                                                borderRadius: 1.5,
                                                bgcolor: (t) => `${t.palette.secondary.main}14`,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                flexShrink: 0,
                                            }}
                                        >
                                            <CodeIcon
                                                size={16}
                                                strokeWidth={1.8}
                                                color="var(--mui-palette-secondary-main)"
                                            />
                                        </Box>
                                        <Typography variant="subtitle2" fontWeight={700} letterSpacing={0.1}>
                                            Expertise
                                        </Typography>
                                    </Box>
                                    <Divider sx={{ mb: 2.5, opacity: 0.6 }} />
                                    {/* Skills */}
                                    <Box sx={{ mb: 3 }}>
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
                                                options={allSkills || []}
                                                getOptionLabel={(option) => option.name}
                                                value={
                                                    profile.skills?.map((s) =>
                                                        typeof s === "object"
                                                            ? s
                                                            : allSkills.find((sk) => sk.name === s),
                                                    ) || []
                                                }
                                                onChange={(e, newValue) =>
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
                                        ) : (
                                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 0.5 }}>
                                                {skillsDisplay.length === 0 ? (
                                                    <Typography
                                                        variant="body2"
                                                        color="text.disabled"
                                                        fontStyle="italic"
                                                    >
                                                        No skills added yet
                                                    </Typography>
                                                ) : (
                                                    skillsDisplay.map((name, i) => (
                                                        <Box
                                                            key={`skill-${i}`}
                                                            sx={{
                                                                display: "inline-flex",
                                                                alignItems: "center",
                                                                gap: 1,
                                                                px: 2,
                                                                py: 1,
                                                                borderRadius: "24px",
                                                                border: "1px solid",
                                                                borderColor: "divider",
                                                                bgcolor: "grey.50",
                                                                color: "text.primary",
                                                                fontSize: "1rem",
                                                                fontWeight: 600,
                                                                lineHeight: 1.5,
                                                                transition: "all 0.12s ease",
                                                                cursor: "default",
                                                                minWidth: 160,
                                                                justifyContent: "flex-start",
                                                                "&:hover": {
                                                                    bgcolor: "grey.100",
                                                                    borderColor: "grey.400",
                                                                    transform: "translateY(-1px)",
                                                                },
                                                            }}
                                                        >
                                                            <CompanyLogo name={String(name)} size={20} />
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
                                                    ))
                                                )}
                                            </Box>
                                        )}
                                    </Box>
                                    {/* Companies */}
                                    <Box
                                        sx={{
                                            pt: 2.5,
                                            borderTop: "0.5px solid",
                                            borderColor: "divider",
                                        }}
                                    >
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
                                            Companies
                                        </Typography>

                                        {editMode ? (
                                            <Autocomplete
                                                multiple
                                                options={allCompanies || []}
                                                getOptionLabel={(option) => option.name}
                                                value={
                                                    profile.companies?.map((c) =>
                                                        typeof c === "object"
                                                            ? c
                                                            : allCompanies.find((co) => co.name === c),
                                                    ) || []
                                                }
                                                onChange={(e, newValue) =>
                                                    setProfile((prev) => ({ ...prev, companies: newValue }))
                                                }
                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        placeholder="Add companies"
                                                        size="small"
                                                        inputProps={{ ...params.inputProps, maxLength: 100 }}
                                                    />
                                                )}
                                            />
                                        ) : (
                                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 0.5 }}>
                                                {companiesDisplay.length === 0 ? (
                                                    <Typography
                                                        variant="body2"
                                                        color="text.disabled"
                                                        fontStyle="italic"
                                                    >
                                                        No companies added yet
                                                    </Typography>
                                                ) : (
                                                    companiesDisplay.map((name, i) => (
                                                        <Box
                                                            key={`company-${i}`}
                                                            sx={{
                                                                display: "inline-flex",
                                                                alignItems: "center",
                                                                gap: 1,
                                                                px: 2,
                                                                py: 1,
                                                                borderRadius: "24px",
                                                                border: "1px solid",
                                                                borderColor: "divider",
                                                                bgcolor: "grey.50",
                                                                color: "text.primary",
                                                                fontSize: "1rem",
                                                                fontWeight: 600,
                                                                lineHeight: 1.5,
                                                                transition: "all 0.12s ease",
                                                                cursor: "default",
                                                                minWidth: 160,
                                                                justifyContent: "flex-start",
                                                                "&:hover": {
                                                                    bgcolor: "grey.100",
                                                                    borderColor: "grey.400",
                                                                    transform: "translateY(-1px)",
                                                                },
                                                            }}
                                                        >
                                                            <CompanyLogo name={String(name)} size={20} />
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
                                                    ))
                                                )}
                                            </Box>
                                        )}
                                    </Box>
                                </Box>
                            </Grid>
                        </Grid>
                    )}
                    {tabValue === 1 && isSelf && isInterviewer && (
                        <Box sx={{ mt: 1 }}>
                            {loadingSaved ? (
                                <Box display="flex" justifyContent="center" py={4}>
                                    <CircularProgress />
                                </Box>
                            ) : savedQuestions.length === 0 ? (
                                <Typography align="center" color="text.secondary" py={4}>
                                    No saved questions yet.
                                </Typography>
                            ) : (
                                <Box
                                    sx={{
                                        display: "grid",
                                        gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
                                        gap: 2,
                                    }}
                                >
                                    {savedQuestions.map((q) => (
                                        <QuestionCard key={q.id} item={q} />
                                    ))}
                                </Box>
                            )}
                        </Box>
                    )}
                </>
            )}

            {/* Profile Action Buttons (Edit mode & Non-edit mode) */}
            <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end", gap: 2 }}>
                {!editMode && isSelf && (
                    <PrimaryButton startIcon={<EditIcon size={18} strokeWidth={2} />} onClick={() => setEditMode(true)}>
                        Edit Profile
                    </PrimaryButton>
                )}

                {editMode && profile && (
                    <>
                        <SecondaryButton onClick={() => setEditMode(false)} disabled={saving}>
                            Cancel
                        </SecondaryButton>
                        <PrimaryButton
                            size="large"
                            startIcon={<SaveIcon size={18} strokeWidth={2} />}
                            onClick={() => setShowConfirmSave(true)}
                            loading={saving}
                        >
                            Save Changes
                        </PrimaryButton>
                    </>
                )}
            </Box>

            {editMode && (
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
            )}

            {!loading && !profile && !error && (
                <Paper elevation={0} sx={{ p: 4, textAlign: "center", border: "1px solid", borderColor: "divider" }}>
                    <Typography color="text.secondary">No profile found.</Typography>
                </Paper>
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

export default InterviewerProfilePage;
