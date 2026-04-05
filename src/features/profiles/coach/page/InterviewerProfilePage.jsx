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
    Rating,
} from "@mui/material";
import { Tabs, Tab } from "@mui/material";
import {
    Camera as CameraIcon,
    Edit as EditIcon,
    X as CloseIcon,
    Mail as EmailIcon,
    Link as LinkIcon,
    Code as CodeIcon,
    Save as SaveIcon,
    Star as StarIcon,
    ExternalLink as ExternalLinkIcon,
} from "lucide-react";
import { Autocomplete } from "@mui/material";
import BaseCard from "../../../../common/components/cards/BaseCard";
import { PrimaryButton, SecondaryButton } from "../../../../common/components/buttons";
import QuestionCard from "../../../interviewQuestions/page/InterviewQuestionsPage/QuestionCard";
import { interactionEndPoints } from "../../../interviewQuestions/service/interactionApi";
import "./PublicInterviewerProfilePage/EliteCoachProfile.css";

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

// ─── Reusable sidebar card with header strip ──────────────────────────────────
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
            } catch (err) {}
        };
        fetchRating();
    }, [profile?.id]);

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

    const avatarUrl = profile?.profilePicture || profile?.user?.profilePicture || "";
    const fullName = profile?.user?.fullName || profile?.fullName || user?.fullName || "Unnamed";
    const email = profile?.user?.email || user?.email || "-";
    const years = profile?.experienceYears ?? profile?.yearsOfExperience;
    const bio = profile?.bio || profile?.description || "";
    const headlineCompany = companiesDisplay[0] || "Independent Coach";
    const headlineTitle = years != null ? `${years}+ years interviewing` : "Interview Coach";

    const truncatedBio = useMemo(() => {
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

    return (
        <Box className="elite-profile-container" sx={{ minHeight: "90vh" }}>
            <Box className="ep-shell" sx={{ pb: 0 }}>
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

                    <CardContent sx={{ pt: 0, p: { xs: 3, md: 5 } }}>
                        <Box
                            sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: { xs: 3, md: 5 } }}
                        >
                            {/* Avatar */}
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
                                            <input hidden type="file" accept="image/*" onChange={onPick} />
                                        </IconButton>
                                    )}
                                </Box>
                            </Box>

                            <Box sx={{ flex: 1, pt: { xs: 0, md: 1 } }}>
                                {editMode ? (
                                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 3 }}>
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
                                            sx={{ maxWidth: 520, bgcolor: "background.paper" }}
                                        />
                                        <TextField
                                            label="Years of Experience"
                                            type="number"
                                            value={profile?.experienceYears ?? ""}
                                            onChange={(e) =>
                                                setProfile((prev) => ({
                                                    ...prev,
                                                    experienceYears: parseInt(e.target.value) || 0,
                                                }))
                                            }
                                            sx={{ width: 160, bgcolor: "background.paper" }}
                                        />
                                    </Box>
                                ) : (
                                    <>
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

                                        <Typography
                                            component="p"
                                            sx={{
                                                fontSize: { xs: "1rem", md: "1.5rem" },
                                                color: "text.secondary",
                                                mb: 3,
                                                fontWeight: 500,
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 1,
                                            }}
                                        >
                                            {years}+ years experience
                                            {/* with
                                            <Box
                                                component="span"
                                                sx={{ display: "inline-flex", alignItems: "center", gap: 1, ml: 1 }}
                                            >
                                                <CompanyLogo name={headlineCompany} size={18} />
                                                <strong>{headlineCompany}</strong>
                                            </Box> */}
                                        </Typography>
                                    </>
                                )}

                                <Box
                                    sx={{ display: "flex", gap: { xs: 2, md: 3 }, mb: 3, flexWrap: "wrap", rowGap: 2 }}
                                >
                                    {[
                                        // { value: `${years ?? 0}+`, label: "Years Exp" },
                                        {
                                            value: (
                                                <Stack direction="row" alignItems="center" spacing={1}>
                                                    <Typography
                                                        sx={{
                                                            fontSize: { xs: "1.25rem", md: "1.75rem" },
                                                            fontWeight: 800,
                                                            color: "text.primary",
                                                        }}
                                                    >
                                                        {averageRating.toFixed(1)}
                                                    </Typography>
                                                    <Rating
                                                        value={averageRating}
                                                        precision={0.1}
                                                        readOnly
                                                        size="small"
                                                        sx={{ color: "#afe34a" }}
                                                    />
                                                </Stack>
                                            ),
                                            label: `${totalRatings} Ratings`,
                                        },
                                        { value: companiesDisplay.length, label: "Companies" },
                                    ].map(({ value, label }) => (
                                        <Box key={label} sx={{ display: "flex", flexDirection: "column" }}>
                                            {typeof value === "string" || typeof value === "number" ? (
                                                <Typography
                                                    sx={{
                                                        fontSize: { xs: "1.25rem", md: "1.75rem" },
                                                        fontWeight: 800,
                                                        color: "text.primary",
                                                    }}
                                                >
                                                    {value}
                                                </Typography>
                                            ) : (
                                                value
                                            )}
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
                                                {label}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        </Box>

                        {/* Bio */}
                        {profile && (
                            <Box sx={{ mt: 3 }}>
                                <Typography
                                    sx={{
                                        fontSize: "0.75rem",
                                        fontWeight: 800,
                                        textTransform: "uppercase",
                                        letterSpacing: "0.12em",
                                        color: "#afe34a",
                                        mb: 1,
                                    }}
                                >
                                    About
                                </Typography>
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
                                    <Box sx={{ mt: 1 }}>
                                        <Typography
                                            sx={{
                                                whiteSpace: "pre-wrap",
                                                fontSize: { xs: "1rem", md: "1.15rem" },
                                                lineHeight: 1.65,
                                                color: "text.secondary",
                                                maxWidth: 800,
                                            }}
                                        >
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
                                    </Box>
                                )}
                            </Box>
                        )}
                    </CardContent>
                </BaseCard>

                {/* Tabs */}
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
                            <Box className="ep-main-grid" sx={{ mb: 3 }}>
                                {/* Left content */}
                                <Box className="ep-content-left">
                                    <Box component="section" className="ep-expertise" sx={{ mb: 5 }}>
                                        <Typography className="ep-sub-title">Core Skills</Typography>
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
                                                        sx={{
                                                            mb: 3,
                                                            "& .MuiOutlinedInput-root": { bgcolor: "background.paper" },
                                                        }}
                                                    />
                                                )}
                                            />
                                        ) : (
                                            <Box className="ep-skills-wrap">
                                                {skillsDisplay.length === 0 ? (
                                                    <Typography color="text.secondary">No skills listed.</Typography>
                                                ) : (
                                                    skillsDisplay.map((name, i) => (
                                                        <Box
                                                            key={`skill-layout-${i}`}
                                                            className="ep-skill-tag"
                                                            sx={{
                                                                animation: "none",
                                                                transform: "none",
                                                                cursor: "default",
                                                            }}
                                                        >
                                                            <CompanyLogo name={String(name)} size={18} />
                                                            {name}
                                                        </Box>
                                                    ))
                                                )}
                                            </Box>
                                        )}

                                        <Typography className="ep-sub-title">Working Experience</Typography>
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
                                                        sx={{
                                                            mb: 2,
                                                            "& .MuiOutlinedInput-root": { bgcolor: "background.paper" },
                                                        }}
                                                    />
                                                )}
                                            />
                                        ) : (
                                            <Box className="ep-track-grid">
                                                {companiesDisplay.length === 0 ? (
                                                    <Typography color="text.secondary">No companies listed.</Typography>
                                                ) : (
                                                    companiesDisplay.map((name, i) => (
                                                        <Box
                                                            key={`company-layout-${i}`}
                                                            className="ep-track-card"
                                                            sx={{ animation: "none", transform: "none" }}
                                                        >
                                                            <Box className="ep-track-card-head">
                                                                <CompanyLogo name={String(name)} size={24} />
                                                                <h4>{name}</h4>
                                                            </Box>
                                                            {/* <p>{headlineTitle}</p> */}
                                                        </Box>
                                                    ))
                                                )}
                                            </Box>
                                        )}
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
                                                    sx={{ "& .MuiOutlinedInput-root": { bgcolor: "background.paper" } }}
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
                                                <Typography color="text.disabled" fontStyle="italic" fontSize="0.85rem">
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
                                                    width: `${(profile?.skills?.length ? 33 : 0) + (profile?.companies?.length ? 33 : 0) + (profile?.portfolioUrl ? 34 : 0)}%`,
                                                }}
                                            />
                                        </Box>
                                        <Typography sx={{ fontSize: "0.9rem", color: "text.secondary", mb: 2 }}>
                                            Complete the essentials so your profile feels finished.
                                        </Typography>
                                        <Box component="ul" className="ep-benefit-list" sx={{ mb: 0 }}>
                                            {["Skills added", "Companies added", "Portfolio linked"].map((item, i) => (
                                                <Box key={item} component="li" className="ep-benefit-item">
                                                    <Box className="ep-benefit-check">{i + 1}</Box>
                                                    {item}
                                                </Box>
                                            ))}
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>
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

                {/* Action Buttons */}
                <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end", gap: 2 }}>
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
                    <Paper
                        elevation={0}
                        sx={{ p: 4, textAlign: "center", border: "1px solid", borderColor: "divider" }}
                    >
                        <Typography color="text.secondary">No profile found.</Typography>
                    </Paper>
                )}
            </Box>
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
