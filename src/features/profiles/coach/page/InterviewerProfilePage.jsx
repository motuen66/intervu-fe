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
    Avatar,
    IconButton,
    TextField,
    Paper,
    Link,
    Divider,
    CardContent,
    Rating,
} from "@mui/material";
import { Tabs, Tab } from "@mui/material";
import {
    Camera as CameraIcon,
    Edit3 as EditIcon,
    Trash2 as DeleteIcon,
    X as CloseIcon,
    Plus as PlusIcon,
    Link as LinkIcon,
    Save as SaveIcon,
    ExternalLink as ExternalLinkIcon,
    Globe as GlobeIcon,
    Award as AwardIcon,
    Briefcase as BriefcaseIcon,
} from "lucide-react";
import { Autocomplete } from "@mui/material";
import BaseCard from "../../../../common/components/cards/BaseCard";
import { PrimaryButton, SecondaryButton } from "../../../../common/components/buttons";
import QuestionCard from "../../../interviewQuestions/page/InterviewQuestionsPage/QuestionCard";
import WorkExperienceModal from "../../components/WorkExperienceModal.jsx";
import CertificateDialog from "../../components/CertificateDialog.jsx";
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

const toDateInput = (value) => {
    if (!value) return "";
    if (typeof value === "string") return value.split("T")[0];
    return "";
};

const normalizeWorkExperience = (item) => ({
    id:
        item?.id ||
        item?.Id ||
        item?.workExperienceId ||
        item?.WorkExperienceId ||
        item?.coachWorkExperienceId ||
        item?.CoachWorkExperienceId ||
        null,
    companyName: item?.companyName || item?.CompanyName || item?.company || "",
    positionTitle: item?.positionTitle || item?.PositionTitle || item?.jobTitle || "",
    jobTitle: item?.jobTitle || item?.positionTitle || item?.PositionTitle || "",
    employmentType: item?.employmentType || item?.jobType || item?.JobType || "",
    location: item?.location || item?.Location || "",
    locationType: item?.locationType || item?.LocationType || "",
    startDate: item?.startDate || item?.StartDate || "",
    endDate: item?.endDate || item?.EndDate || "",
    isCurrentWorking: !!(item?.isCurrentWorking ?? item?.IsCurrentWorking),
    isEnded: !!(item?.isEnded ?? item?.IsEnded),
    description: item?.description || item?.Description || "",
    skillIds: item?.skillIds || item?.SkillIds || [],
});

const normalizeCertificate = (item, index) => {
    if (typeof item === "string") {
        return { id: null, name: `Certificate ${index + 1}`, issuer: "", issuedAt: "", expiryAt: "", link: item };
    }
    return {
        id: item?.id || item?.Id || item?.certificateId || item?.CertificateId || null,
        name: item?.name || item?.Name || `Certificate ${index + 1}`,
        issuer: item?.issuer || item?.Issuer || "",
        issuedAt: toDateInput(item?.issuedAt || item?.IssuedAt),
        expiryAt: toDateInput(item?.expiryAt || item?.ExpiryAt),
        link: item?.link || item?.Link || "",
    };
};

const normalizeCoachProfile = (data) => ({
    ...data,
    skills: (data?.skills || []).map((s) => (typeof s === "object" ? s?.name : s)).filter(Boolean),
    companies: (data?.companies || []).map((c) => (typeof c === "object" ? c?.name : c)).filter(Boolean),
    industryIds: data?.industryIds || (data?.industries || []).map((i) => i?.id || i).filter(Boolean),
    industries: data?.industries || [],
    certificationLinks: (data?.certificates || data?.certificationLinks || data?.certifications || []).map(
        (item, idx) => normalizeCertificate(item, idx),
    ),
    workExperiences: (data?.workExperiences || []).map(normalizeWorkExperience),
    bankBinNumber: data?.bankBinNumber || "",
    bankAccountNumber: data?.bankAccountNumber || "",
});

const formatMonthYear = (value) => {
    if (!value) return "Present";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "Present";
    return parsed.toLocaleDateString("en-US", { month: "numeric", year: "numeric" });
};

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
    const [hasLoaded, setHasLoaded] = useState(false);
    const [error, setError] = useState(null);
    const [expandedBio, setExpandedBio] = useState(false);
    const [expandedWorkExp, setExpandedWorkExp] = useState({});
    // editMode chỉ dành cho: fullName, bio, portfolioUrl, skills, companies, industries, experienceYears
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
    const [allIndustries, setAllIndustries] = useState([]);

    // Work Experience modal state (independent of editMode)
    const [workExperienceModalOpen, setWorkExperienceModalOpen] = useState(false);
    const [editingWorkExperience, setEditingWorkExperience] = useState(null);
    const [pendingWorkExperience, setPendingWorkExperience] = useState(null);
    const [pendingDeleteWorkExperience, setPendingDeleteWorkExperience] = useState(null);
    const [showConfirmWorkSave, setShowConfirmWorkSave] = useState(false);
    const [showConfirmWorkDelete, setShowConfirmWorkDelete] = useState(false);

    // Certificate modal state (independent of editMode)
    const [certificateDialogOpen, setCertificateDialogOpen] = useState(false);
    const [editingCertificate, setEditingCertificate] = useState(null);
    const [pendingCertificatePayload, setPendingCertificatePayload] = useState(null);
    const [pendingDeleteCertificate, setPendingDeleteCertificate] = useState(null);
    const [showConfirmCertificateSave, setShowConfirmCertificateSave] = useState(false);
    const [showConfirmCertificateDelete, setShowConfirmCertificateDelete] = useState(false);

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
        if (routeId) return interviewerProfileEndPoints.VIEW_OWN_INTERVIEWER_PROFILE.replace("{id}", routeId);
        if (!user?.id) return null;
        return isInterviewer
            ? interviewerProfileEndPoints.VIEW_OWN_INTERVIEWER_PROFILE.replace("{id}", user.id)
            : interviewerProfileEndPoints.VIEW_PROFILE_BY_CANDIDATE.replace("{id}", user.id);
    }, [routeId, user?.id, user?.role]);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!endpoint) return;
            setHasLoaded(false);
            setError(null);
            try {
                const res = await callApi({ method: METHOD.GET, endpoint });
                if (res.success) {
                    setProfile(normalizeCoachProfile(res.data));
                } else {
                    setError(res.message || "Failed to load profile");
                }
            } catch (err) {
                setError(err.message || "An error occurred while fetching the profile.");
            } finally {
                setHasLoaded(true);
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
                const industriesRes = await callApi({
                    method: METHOD.GET,
                    endpoint: interviewerProfileEndPoints.GET_ALL_INDUSTRIES.replace("{page}", "1").replace(
                        "{pageSize}",
                        "100",
                    ),
                });
                if (industriesRes.success) {
                    setAllIndustries(industriesRes.data?.items || industriesRes.data || []);
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
                const payload = res?.data?.data || res?.data || {};
                setCoachRating(Number(payload?.rating ?? 0));
                setCoachRatingCount(Number(payload?.totalRatings ?? 0));
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

    const refreshProfile = async () => {
        if (!profile?.id) return;
        const ep = interviewerProfileEndPoints.VIEW_OWN_INTERVIEWER_PROFILE.replace("{id}", profile.id);
        const res = await callApi({ method: METHOD.GET, endpoint: ep });
        if (res?.success) setProfile(normalizeCoachProfile(res.data));
    };

    // ─── handleSave: CHỈ save profile fields cơ bản ──────────────────────────
    // KHÔNG bao gồm workExperiences và certificationLinks
    const handleSave = async () => {
        if (!profile) return;
        const ep = interviewerProfileEndPoints.UPDATE_INTERVIEWER_PROFILE.replace("{id}", profile.id);
        setSaving(true);
        setError(null);
        try {
            const skillIds = (profile.skills || [])
                .map((s) => (typeof s === "object" ? s.id : allSkills.find((sk) => sk.name === s)?.id))
                .filter(Boolean);
            const companyIds = (profile.companies || [])
                .map((c) => (typeof c === "object" ? c.id : allCompanies.find((co) => co.name === c)?.id))
                .filter(Boolean);

            // Chỉ gửi các field thuộc profile chính, KHÔNG gửi workExperiences / certificationLinks
            const payload = {
                id: profile.id,
                fullName: profile.user?.fullName || profile.fullName || "",
                email: profile.user?.email || profile.email || "",
                profilePicture: profile?.profilePicture || profile?.user?.profilePicture || "",
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
                industryIds: profile.industryIds || [],
            };

            const res = await callApi({ method: METHOD.PUT, endpoint: ep, arg: payload, displaySuccessMessage: true });
            if (res.success) {
                setEditMode(false);
                setSaveSuccess(true);
                await refreshProfile();
            } else {
                setError(res.message || "Failed to save profile.");
            }
        } catch (err) {
            setError(err.message || "An error occurred while saving.");
        } finally {
            setSaving(false);
        }
    };

    // ─── Work Experience CRUD (độc lập với editMode) ─────────────────────────
    const handleSaveWorkExperience = async (exp) => {
        if (!profile) return;
        if (!canEdit) return setError("You don't have permission to edit this profile.");
        try {
            if (editingWorkExperience && !exp?.id) {
                throw new Error(
                    "Cannot update this work experience because no id was returned by the API. Please delete and recreate it.",
                );
            }

            const payload = {
                CompanyName: exp.companyName || exp.company || "",
                PositionTitle: exp.jobTitle || exp.positionTitle || "",
                JobType: exp.employmentType || exp.jobType || null,
                Location: exp.location || null,
                LocationType: exp.locationType || null,
                StartDate: exp.startDate ? new Date(exp.startDate).toISOString() : null,
                EndDate: exp.endDate ? new Date(exp.endDate).toISOString() : null,
                IsCurrentWorking: !!exp.isCurrentWorking,
                IsEnded: !!exp.isEnded,
                Description: exp.description || null,
                SkillIds: Array.isArray(exp.skillIds) ? exp.skillIds : [],
            };

            if (exp.id) {
                const endpoint = interviewerProfileEndPoints.UPDATE_WORK_EXPERIENCE.replace(
                    "{profileId}",
                    profile.id,
                ).replace("{workExperienceId}", exp.id);
                const res = await callApi({ method: METHOD.PUT, endpoint, arg: payload, displaySuccessMessage: true });
                if (!res?.success) throw new Error(res?.message || "Failed to update work experience.");
            } else {
                const endpoint = interviewerProfileEndPoints.ADD_WORK_EXPERIENCE.replace("{profileId}", profile.id);
                const res = await callApi({ method: METHOD.POST, endpoint, arg: payload, displaySuccessMessage: true });
                if (!res?.success) throw new Error(res?.message || "Failed to add work experience.");
            }

            setWorkExperienceModalOpen(false);
            setEditingWorkExperience(null);
            await refreshProfile();
        } catch (err) {
            setError(err.message || "Failed to save work experience.");
        }
    };

    const handleDeleteWorkExperience = async (id) => {
        if (!profile?.id || !id) return;
        try {
            const endpoint = interviewerProfileEndPoints.DELETE_WORK_EXPERIENCE.replace(
                "{profileId}",
                profile.id,
            ).replace("{workExperienceId}", id);
            const res = await callApi({ method: METHOD.DELETE, endpoint, displaySuccessMessage: true });
            if (!res?.success) throw new Error(res?.message || "Failed to delete work experience.");
            await refreshProfile();
        } catch (err) {
            setError(err.message || "Failed to delete work experience.");
        }
    };

    // ─── Certificate CRUD (độc lập với editMode) ─────────────────────────────
    const handleSaveCertificate = async (form, certificateId) => {
        if (!profile?.id) return;
        try {
            const payload = {
                Name: form.name || "",
                Issuer: form.issuer || "",
                IssuedAt: form.issuedAt ? new Date(form.issuedAt).toISOString() : null,
                ExpiryAt: form.expiryAt ? new Date(form.expiryAt).toISOString() : null,
                Link: form.link || "",
            };

            if (certificateId) {
                const endpoint = interviewerProfileEndPoints.UPDATE_CERTIFICATE.replace(
                    "{profileId}",
                    profile.id,
                ).replace("{certificateId}", certificateId);
                const res = await callApi({ method: METHOD.PUT, endpoint, arg: payload, displaySuccessMessage: true });
                if (!res?.success) throw new Error(res?.message || "Failed to update certificate.");
            } else {
                const endpoint = interviewerProfileEndPoints.ADD_CERTIFICATE.replace("{profileId}", profile.id);
                const res = await callApi({ method: METHOD.POST, endpoint, arg: payload, displaySuccessMessage: true });
                if (!res?.success) throw new Error(res?.message || "Failed to add certificate.");
            }

            setCertificateDialogOpen(false);
            setEditingCertificate(null);
            await refreshProfile();
        } catch (err) {
            setError(err.message || "Failed to save certificate.");
        }
    };

    const handleDeleteCertificate = async (certificate) => {
        if (!profile?.id || !certificate?.id) return;
        try {
            const endpoint = interviewerProfileEndPoints.DELETE_CERTIFICATE.replace("{profileId}", profile.id).replace(
                "{certificateId}",
                certificate.id,
            );
            const res = await callApi({ method: METHOD.DELETE, endpoint, displaySuccessMessage: true });
            if (!res?.success) throw new Error(res?.message || "Failed to delete certificate.");
            setCertificateDialogOpen(false);
            setEditingCertificate(null);
            await refreshProfile();
        } catch (err) {
            setError(err.message || "Failed to delete certificate.");
        }
    };

    const avatarUrl = profile?.profilePicture || profile?.user?.profilePicture || "";
    const fullName = profile?.user?.fullName || profile?.fullName || user?.fullName || "Unnamed";
    const email = profile?.user?.email || user?.email || "-";
    const years = profile?.experienceYears ?? profile?.yearsOfExperience;
    const bio = profile?.bio || profile?.description || "";
    const bioLimit = 400;

    if (!hasLoaded && endpoint) {
        return null;
    }

    return (
        <Box className="elite-profile-container" sx={{ minHeight: "90vh" }}>
            <Box className="ep-shell" sx={{ pb: 0 }}>
                <BaseCard
                    elevation={0}
                    sx={{ mb: 4, overflow: "hidden", background: "#fdfdf5", boxShadow: "var(--ep-shadow)" }}
                >
                    <Box
                        sx={{
                            height: 72,
                            background:
                                "linear-gradient(135deg, rgba(198,245,111,0.28) 0%, rgba(255,255,255,0.45) 100%)",
                            position: "relative",
                        }}
                    >
                        {/* Nút edit/close CHỈ cho profile fields */}
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
                                            }}
                                        >
                                            {years}+ years experience
                                        </Typography>
                                    </>
                                )}

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
                                            {totalRatings} Ratings
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
                                            {companiesDisplay.length}
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
                                            Companies
                                        </Typography>
                                    </Box>
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
                                            className="ep-about-text"
                                            sx={{
                                                whiteSpace: "pre-wrap",
                                                fontSize: { xs: "1rem", md: "1.15rem" },
                                                lineHeight: 1.65,
                                                color: "text.secondary",
                                                maxWidth: 800,
                                            }}
                                        >
                                            {bio
                                                ? expandedBio
                                                    ? bio
                                                    : `${bio.slice(0, bioLimit)}${bio.length > bioLimit ? "..." : ""}`
                                                : "No bio provided yet."}
                                            {bio && bio.length > bioLimit && (
                                                <button
                                                    onClick={() => setExpandedBio(!expandedBio)}
                                                    className="ep-view-more-btn"
                                                >
                                                    {expandedBio ? "View Less" : "View More"}
                                                </button>
                                            )}
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        )}
                    </CardContent>
                </BaseCard>

                {isSelf && isInterviewer && (
                    <Box sx={{ mt: 2, mb: 2 }}>
                        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
                            <Tab label="Profile" />
                            <Tab label="Saved Questions" />
                        </Tabs>
                    </Box>
                )}

                {profile && (
                    <>
                        {tabValue === 0 && (
                            <Box className="ep-main-grid" sx={{ mb: 3 }}>
                                <Box className="ep-content-left">
                                    <Box component="section" className="ep-expertise" sx={{ mb: 5 }}>
                                        {/* Core Skills - chỉ editable khi editMode */}
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

                                        {/* ── Work Experience Section ──
                                            Luôn hiển thị nút Add/Edit/Delete khi canEdit,
                                            KHÔNG phụ thuộc vào editMode.
                                            Khi editMode=true thì ẩn các nút này.
                                        */}
                                        <Box
                                            sx={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                mb: 1.5,
                                                mt: 3,
                                            }}
                                        >
                                            <Typography className="ep-sub-title" sx={{ mb: 0 }}>
                                                Work Experience
                                            </Typography>
                                            {/* Ẩn khi editMode đang bật */}
                                            {canEdit && !editMode && (
                                                <Stack direction="row" spacing={0.75}>
                                                    <IconButton
                                                        onClick={() => {
                                                            setEditingWorkExperience(null);
                                                            setWorkExperienceModalOpen(true);
                                                        }}
                                                        sx={{
                                                            width: 40,
                                                            height: 40,
                                                            border: "1px solid",
                                                            borderColor: "divider",
                                                            borderRadius: 2,
                                                        }}
                                                    >
                                                        <PlusIcon size={20} />
                                                    </IconButton>
                                                </Stack>
                                            )}
                                        </Box>
                                        <Stack spacing={2} sx={{ mb: 4 }}>
                                            {(profile?.workExperiences || []).length > 0 ? (
                                                (profile.workExperiences || []).map((exp, idx) => {
                                                    const expId = exp.id || idx;
                                                    const isExpanded = expandedWorkExp[expId];
                                                    const description = exp.description || "";
                                                    const descLimit = 200;
                                                    const shouldShowMore = description.length > descLimit;
                                                    const displayDescription =
                                                        isExpanded || !shouldShowMore
                                                            ? description
                                                            : `${description.slice(0, descLimit)}...`;

                                                    return (
                                                        <Paper
                                                            key={expId}
                                                            variant="outlined"
                                                            sx={{
                                                                p: 2.5,
                                                                position: "relative",
                                                                bgcolor: "#fff",
                                                                borderRadius: 2,
                                                            }}
                                                        >
                                                            <Box
                                                                sx={{
                                                                    display: "flex",
                                                                    justifyContent: "space-between",
                                                                    alignItems: "flex-start",
                                                                }}
                                                            >
                                                                <Box sx={{ flex: 1, pr: canEdit && !editMode ? 8 : 0 }}>
                                                                    <Typography
                                                                        variant="h6"
                                                                        sx={{ fontSize: "1.1rem", fontWeight: 700 }}
                                                                    >
                                                                        {exp.positionTitle ||
                                                                            exp.jobTitle ||
                                                                            "Role not specified"}
                                                                    </Typography>
                                                                    <Box
                                                                        sx={{
                                                                            display: "flex",
                                                                            alignItems: "center",
                                                                            gap: 1,
                                                                            mt: 0.5,
                                                                        }}
                                                                    >
                                                                        <CompanyLogo
                                                                            name={exp.companyName || exp.company || ""}
                                                                            size={24}
                                                                        />
                                                                        <Typography
                                                                            variant="subtitle1"
                                                                            sx={{
                                                                                fontWeight: 600,
                                                                                color: "text.primary",
                                                                            }}
                                                                        >
                                                                            {exp.companyName ||
                                                                                exp.company ||
                                                                                "Company not specified"}
                                                                            {exp.employmentType
                                                                                ? ` · ${exp.employmentType}`
                                                                                : ""}
                                                                        </Typography>
                                                                    </Box>
                                                                    <Typography
                                                                        variant="body2"
                                                                        color="text.secondary"
                                                                        sx={{ mt: 0.5 }}
                                                                    >
                                                                        {formatMonthYear(exp.startDate)} -{" "}
                                                                        {exp.isCurrentWorking
                                                                            ? "Present"
                                                                            : exp.endDate
                                                                              ? formatMonthYear(exp.endDate)
                                                                              : "Present"}
                                                                    </Typography>
                                                                    {(exp.location || exp.locationType) && (
                                                                        <Typography
                                                                            variant="body2"
                                                                            color="text.secondary"
                                                                        >
                                                                            {[exp.location, exp.locationType]
                                                                                .filter(Boolean)
                                                                                .join(" · ")}
                                                                        </Typography>
                                                                    )}
                                                                </Box>
                                                                {/* Nút edit/delete trên item: ẩn khi editMode */}
                                                                {canEdit && !editMode && (
                                                                    <Stack
                                                                        direction="row"
                                                                        spacing={0.5}
                                                                        sx={{
                                                                            position: "absolute",
                                                                            top: 12,
                                                                            right: 12,
                                                                        }}
                                                                    >
                                                                        <IconButton
                                                                            size="small"
                                                                            onClick={() => {
                                                                                setEditingWorkExperience(exp);
                                                                                setWorkExperienceModalOpen(true);
                                                                            }}
                                                                        >
                                                                            <EditIcon size={18} />
                                                                        </IconButton>
                                                                        <IconButton
                                                                            size="small"
                                                                            color="error"
                                                                            onClick={() => {
                                                                                if (!exp?.id) {
                                                                                    setError(
                                                                                        "This work experience cannot be deleted because no id was returned by the API.",
                                                                                    );
                                                                                    return;
                                                                                }
                                                                                setPendingDeleteWorkExperience(exp.id);
                                                                                setShowConfirmWorkDelete(true);
                                                                            }}
                                                                        >
                                                                            <DeleteIcon size={18} />
                                                                        </IconButton>
                                                                    </Stack>
                                                                )}
                                                            </Box>
                                                            {description && (
                                                                <Box sx={{ mt: 1.5 }}>
                                                                    <Typography
                                                                        variant="body2"
                                                                        sx={{
                                                                            whiteSpace: "pre-wrap",
                                                                            color: "text.secondary",
                                                                        }}
                                                                    >
                                                                        {displayDescription}
                                                                    </Typography>
                                                                    {shouldShowMore && (
                                                                        <Typography
                                                                            variant="caption"
                                                                            onClick={() => {
                                                                                setExpandedWorkExp((prev) => ({
                                                                                    ...prev,
                                                                                    [expId]: !prev[expId],
                                                                                }));
                                                                            }}
                                                                            sx={{
                                                                                display: "flex",
                                                                                justifyContent: "end",
                                                                                background: "none",
                                                                                border: "none",
                                                                                color: "var(--ep-accent-dark)",
                                                                                cursor: "pointer",
                                                                                padding: 0,
                                                                                marginTop: "10px",
                                                                                marginLeft: "auto",
                                                                                fontSize: "0.85rem",
                                                                                fontWeight: 600,
                                                                            }}
                                                                        >
                                                                            {isExpanded ? "View Less" : "View More"}
                                                                        </Typography>
                                                                    )}
                                                                </Box>
                                                            )}
                                                            {exp.skillIds?.length > 0 && (
                                                                <Stack
                                                                    direction="row"
                                                                    flexWrap="wrap"
                                                                    gap={1}
                                                                    sx={{ mt: 2 }}
                                                                >
                                                                    {exp.skillIds.map((sid) => {
                                                                        const skill = allSkills.find(
                                                                            (s) => s.id === sid,
                                                                        );
                                                                        return skill ? (
                                                                            <Box
                                                                                key={sid}
                                                                                sx={{
                                                                                    bgcolor: "#f0f2f5",
                                                                                    px: 1.5,
                                                                                    py: 0.5,
                                                                                    borderRadius: 4,
                                                                                    fontSize: "0.75rem",
                                                                                    fontWeight: 600,
                                                                                    color: "text.primary",
                                                                                }}
                                                                            >
                                                                                {skill.name}
                                                                            </Box>
                                                                        ) : null;
                                                                    })}
                                                                </Stack>
                                                            )}
                                                        </Paper>
                                                    );
                                                })
                                            ) : (
                                                <Typography color="text.secondary" fontStyle="italic">
                                                    No work experience added.
                                                </Typography>
                                            )}
                                        </Stack>

                                        {/* Domain (Industries) - chỉ editable khi editMode */}
                                        <Typography className="ep-sub-title">Domain (Industries)</Typography>
                                        {editMode ? (
                                            <Autocomplete
                                                multiple
                                                options={allIndustries}
                                                getOptionLabel={(option) => option.name || ""}
                                                value={allIndustries.filter((i) =>
                                                    (profile.industryIds || []).includes(i.id),
                                                )}
                                                onChange={(_, newValue) =>
                                                    setProfile({ ...profile, industryIds: newValue.map((i) => i.id) })
                                                }
                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        placeholder="Select industries"
                                                        size="small"
                                                        sx={{ mb: 4, bgcolor: "background.paper" }}
                                                    />
                                                )}
                                            />
                                        ) : (
                                            <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 4 }}>
                                                {(profile.industries || []).length > 0 ? (
                                                    (profile.industries || []).map((ind) => (
                                                        <Box
                                                            key={ind.id}
                                                            sx={{
                                                                border: "1px solid rgba(175, 227, 74, 0.3)",
                                                                px: 2,
                                                                py: 0.7,
                                                                borderRadius: 99,
                                                                fontWeight: 700,
                                                                fontSize: "0.85rem",
                                                                bgcolor: "white",
                                                            }}
                                                        >
                                                            {ind.name}
                                                        </Box>
                                                    ))
                                                ) : (
                                                    <Typography color="text.secondary">
                                                        No industries selected.
                                                    </Typography>
                                                )}
                                            </Stack>
                                        )}

                                        {/* ── Certifications Section ──
                                            Luôn hiển thị nút Add/Edit/Delete khi canEdit,
                                            KHÔNG phụ thuộc vào editMode.
                                            Khi editMode=true thì ẩn các nút này.
                                        */}
                                        <Box
                                            sx={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                mb: 1.5,
                                            }}
                                        >
                                            <Typography className="ep-sub-title" sx={{ mb: 0 }}>
                                                Certifications
                                            </Typography>
                                            {/* Ẩn khi editMode đang bật */}
                                            {canEdit && !editMode && (
                                                <Stack direction="row" spacing={0.75}>
                                                    <IconButton
                                                        onClick={() => {
                                                            setEditingCertificate(null);
                                                            setCertificateDialogOpen(true);
                                                        }}
                                                        sx={{
                                                            width: 40,
                                                            height: 40,
                                                            border: "1px solid",
                                                            borderColor: "divider",
                                                            borderRadius: 2,
                                                        }}
                                                    >
                                                        <PlusIcon size={20} />
                                                    </IconButton>
                                                </Stack>
                                            )}
                                        </Box>

                                        <Stack spacing={2} sx={{ mb: 4 }}>
                                            {(
                                                profile.certificationLinks ||
                                                profile.certificates ||
                                                profile.certifications ||
                                                []
                                            ).length > 0 ? (
                                                (
                                                    profile.certificationLinks ||
                                                    profile.certificates ||
                                                    profile.certifications ||
                                                    []
                                                ).map((item, idx) => {
                                                    const href = item?.link || item?.Link || "";
                                                    const label = item?.name || item?.Name || `Certificate ${idx + 1}`;
                                                    const issuer = item?.issuer || item?.Issuer || "";
                                                    const issuedAt =
                                                        item?.issuedAt || item?.IssuedAt
                                                            ? formatMonthYear(item.issuedAt || item.IssuedAt)
                                                            : "";
                                                    const expiryAt =
                                                        item?.expiryAt || item?.ExpiryAt
                                                            ? formatMonthYear(item.expiryAt || item.ExpiryAt)
                                                            : "";
                                                    let host = label;
                                                    try {
                                                        if (href) {
                                                            const u = new URL(href);
                                                            host = u.hostname.replace("www.", "");
                                                        }
                                                    } catch (e) {}
                                                    return (
                                                        <Box
                                                            key={item?.id || `${label}-${idx}`}
                                                            sx={{
                                                                display: "flex",
                                                                alignItems: "flex-start",
                                                                justifyContent: "space-between",
                                                                gap: 2,
                                                                p: 2,
                                                                bgcolor: "white",
                                                                borderRadius: 2,
                                                                border: "1px solid",
                                                                borderColor: "rgba(0,0,0,0.06)",
                                                            }}
                                                        >
                                                            <Box sx={{ display: "flex", gap: 1.5, flex: 1 }}>
                                                                <Box sx={{ flexShrink: 0, mt: 0.5 }}>
                                                                    <CompanyLogo
                                                                        name={issuer || host || label}
                                                                        size={40}
                                                                    />
                                                                </Box>
                                                                <Box>
                                                                    {href ? (
                                                                        <Link
                                                                            href={href}
                                                                            target="_blank"
                                                                            sx={{
                                                                                display: "flex",
                                                                                alignItems: "center",
                                                                                gap: 0.5,
                                                                                fontSize: "1rem",
                                                                                fontWeight: 700,
                                                                                color: "#347d00",
                                                                                mb: 0.25,
                                                                                textDecoration: "none",
                                                                                "&:hover": {
                                                                                    textDecoration: "underline",
                                                                                },
                                                                            }}
                                                                        >
                                                                            {label}
                                                                            <ExternalLinkIcon
                                                                                size={14}
                                                                                strokeWidth={2}
                                                                                style={{ flexShrink: 0 }}
                                                                            />
                                                                        </Link>
                                                                    ) : (
                                                                        <Typography
                                                                            sx={{
                                                                                fontSize: "1rem",
                                                                                fontWeight: 700,
                                                                                mb: 0.25,
                                                                            }}
                                                                        >
                                                                            {label}
                                                                        </Typography>
                                                                    )}
                                                                    {issuer && (
                                                                        <Typography
                                                                            variant="body2"
                                                                            sx={{
                                                                                fontWeight: 600,
                                                                                color: "text.primary",
                                                                                mb: 0.25,
                                                                            }}
                                                                        >
                                                                            {issuer}
                                                                        </Typography>
                                                                    )}
                                                                    {(issuedAt || expiryAt) && (
                                                                        <Typography
                                                                            variant="caption"
                                                                            color="text.secondary"
                                                                            sx={{ display: "block" }}
                                                                        >
                                                                            Issued {issuedAt}{" "}
                                                                            {expiryAt
                                                                                ? `· Expires ${expiryAt}`
                                                                                : "· No expiration"}
                                                                        </Typography>
                                                                    )}
                                                                </Box>
                                                            </Box>
                                                            {/* Nút edit/delete trên item: ẩn khi editMode */}
                                                            {canEdit && !editMode && (
                                                                <Stack
                                                                    direction="row"
                                                                    spacing={0.5}
                                                                    sx={{ mt: -0.5, mr: -0.5 }}
                                                                >
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={() => {
                                                                            setEditingCertificate(item);
                                                                            setCertificateDialogOpen(true);
                                                                        }}
                                                                    >
                                                                        <EditIcon size={18} />
                                                                    </IconButton>
                                                                    <IconButton
                                                                        size="small"
                                                                        color="error"
                                                                        onClick={() => {
                                                                            if (!item?.id) {
                                                                                setError(
                                                                                    "This certificate cannot be deleted because no id was returned by the API.",
                                                                                );
                                                                                return;
                                                                            }
                                                                            setPendingDeleteCertificate(item);
                                                                            setShowConfirmCertificateDelete(true);
                                                                        }}
                                                                    >
                                                                        <DeleteIcon size={18} />
                                                                    </IconButton>
                                                                </Stack>
                                                            )}
                                                        </Box>
                                                    );
                                                })
                                            ) : (
                                                <Typography color="text.secondary">No certificates added.</Typography>
                                            )}
                                        </Stack>
                                    </Box>
                                </Box>

                                {/* ── Sidebar ── */}
                                <Box component="aside" className="ep-sidebar">
                                    <SidebarCard
                                        icon={<LinkIcon />}
                                        title="Portfolio & Contact"
                                        badge={profile?.portfolioUrl ? "Available" : "Missing"}
                                        badgeActive={!!profile?.portfolioUrl}
                                        sx={{ mb: 3 }}
                                    >
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
                                        {/* <CircularProgress /> */}
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

                {/* ── Save bar: chỉ save profile fields, KHÔNG liên quan WE/Cert ── */}
                <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end", gap: 2 }}>
                    {editMode && profile && (
                        <>
                            <SecondaryButton onClick={() => setEditMode(false)} disabled={saving}>
                                Cancel
                            </SecondaryButton>
                            <PrimaryButton
                                size="lg"
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
                        message="Save changes to your profile?"
                        onConfirm={async () => {
                            setShowConfirmSave(false);
                            await handleSave();
                        }}
                        onCancel={() => setShowConfirmSave(false)}
                        confirmText="Save"
                        cancelText="Cancel"
                    />
                )}

                {hasLoaded && !profile && !error && (
                    <Paper
                        elevation={0}
                        sx={{ p: 4, textAlign: "center", border: "1px solid", borderColor: "divider" }}
                    >
                        <Typography color="text.secondary">No profile found.</Typography>
                    </Paper>
                )}
            </Box>

            {/* ── Modals (WE và Cert hoàn toàn độc lập với editMode) ── */}
            <WorkExperienceModal
                open={workExperienceModalOpen}
                onClose={() => {
                    setWorkExperienceModalOpen(false);
                    setEditingWorkExperience(null);
                }}
                onSave={(exp) => {
                    const target = editingWorkExperience?.id ? { ...exp, id: editingWorkExperience.id } : exp;
                    setPendingWorkExperience(target);
                    setShowConfirmWorkSave(true);
                }}
                onDelete={(exp) => {
                    setPendingDeleteWorkExperience(exp?.id || null);
                    setShowConfirmWorkDelete(true);
                }}
                experience={editingWorkExperience}
                allSkills={allSkills}
                allCompanies={allCompanies}
                onCreateCompany={async (name) => {
                    setAllCompanies((prev) => [...(prev || []), name]);
                    return name;
                }}
            />

            <CertificateDialog
                open={certificateDialogOpen}
                onClose={() => {
                    setCertificateDialogOpen(false);
                    setEditingCertificate(null);
                }}
                certificate={editingCertificate}
                onSave={(form) => {
                    setPendingCertificatePayload({ form, certificateId: editingCertificate?.id || null });
                    setShowConfirmCertificateSave(true);
                }}
                onDelete={(cert) => {
                    setPendingDeleteCertificate(cert);
                    setShowConfirmCertificateDelete(true);
                }}
            />

            {/* Confirm modals cho Work Experience */}
            <ConfirmModal
                show={showConfirmWorkSave}
                title="Confirm save"
                message="Save this work experience?"
                onConfirm={async () => {
                    setShowConfirmWorkSave(false);
                    const payload = pendingWorkExperience;
                    setPendingWorkExperience(null);
                    if (payload) await handleSaveWorkExperience(payload);
                }}
                onCancel={() => {
                    setShowConfirmWorkSave(false);
                    setPendingWorkExperience(null);
                }}
                confirmText="Save"
                cancelText="Cancel"
            />
            <ConfirmModal
                show={showConfirmWorkDelete}
                title="Confirm delete"
                message="Delete this work experience?"
                onConfirm={async () => {
                    setShowConfirmWorkDelete(false);
                    const id = pendingDeleteWorkExperience;
                    setPendingDeleteWorkExperience(null);
                    if (id) await handleDeleteWorkExperience(id);
                }}
                onCancel={() => {
                    setShowConfirmWorkDelete(false);
                    setPendingDeleteWorkExperience(null);
                }}
                confirmText="Delete"
                cancelText="Cancel"
            />

            {/* Confirm modals cho Certificate */}
            <ConfirmModal
                show={showConfirmCertificateSave}
                title="Confirm save"
                message="Save this certificate?"
                onConfirm={async () => {
                    setShowConfirmCertificateSave(false);
                    const payload = pendingCertificatePayload;
                    setPendingCertificatePayload(null);
                    if (payload) await handleSaveCertificate(payload.form, payload.certificateId);
                }}
                onCancel={() => {
                    setShowConfirmCertificateSave(false);
                    setPendingCertificatePayload(null);
                }}
                confirmText="Save"
                cancelText="Cancel"
            />
            <ConfirmModal
                show={showConfirmCertificateDelete}
                title="Confirm delete"
                message="Delete this certificate?"
                onConfirm={async () => {
                    setShowConfirmCertificateDelete(false);
                    const cert = pendingDeleteCertificate;
                    setPendingDeleteCertificate(null);
                    if (cert) await handleDeleteCertificate(cert);
                }}
                onCancel={() => {
                    setShowConfirmCertificateDelete(false);
                    setPendingDeleteCertificate(null);
                }}
                confirmText="Delete"
                cancelText="Cancel"
            />
        </Box>
    );
}

export default InterviewerProfilePage;
