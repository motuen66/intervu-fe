import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useUser from "../../../../common/hooks/useUser";
import { callApi } from "../../../../common/utils/apiConnector";
import { METHOD } from "../../../../common/constants/api";
import { candidateProfileEndPoints } from "../service/candidateProfileApi.js";
import { interactionEndPoints } from "../../../interviewQuestions/service/interactionApi.js";
import { homeEndPoints } from "../../../home/services/homeApi.js";
import { interviewerProfileEndPoints } from "../../coach/service/coachProfileApi.js";
import {
    Avatar,
    Box,
    CardContent,
    CircularProgress,
    Grid,
    Stack,
    Typography,
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
    Trash2 as DeleteIcon,
    X as CloseIcon,
    Plus as PlusIcon,
    Save as SaveIcon,
    Mail as EmailIcon,
    Link as LinkIcon,
    Camera as CameraIcon,
    Star as StarIcon,
    User as PersonIcon,
    Briefcase as BriefcaseIcon,
    Award as AwardIcon,
    Globe as GlobeIcon,
    ExternalLink as ExternalLinkIcon,
    BrainCircuit,
} from "lucide-react";
import { uploadImage } from "../../../../firebase/service/storage";
import { useDispatch } from "react-redux";
import { setUserData } from "../../../../common/store/authSlice";
import ConfirmModal from "../../../../common/components/ConfirmModal";
import UploadCv from "../../components/UploadCv.jsx";
import AiCvEvaluationModal from "../components/AiCvEvaluationModal.jsx";
import WorkExperienceModal from "../../components/WorkExperienceModal.jsx";
import CertificateDialog from "../../components/CertificateDialog.jsx";
import { CompanyLogo } from "../../../../common/utils/logoImageGenerator";
import { ROLES } from "../../../../common/constants/common";
import QuestionCard from "../../../interviewQuestions/page/InterviewQuestionsPage/QuestionCard";
import "../../coach/page/PublicInterviewerProfilePage/EliteCoachProfile.css";
import BankSelection from "../../coach/page/BankSelection";
import { formatMonthYear } from "../../../../common/utils/dateFormatter.js";

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
        item?.candidateWorkExperienceId ||
        item?.CandidateWorkExperienceId ||
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

const normalizeCandidateProfile = (data) => {
    const normalizeToString = (s) => {
        if (!s) return null;
        if (typeof s === "string") return s;
        return s.name || s.title || s.skillName || String(s);
    };
    return {
        ...data,
        skills: (data?.skills || []).map(normalizeToString).filter(Boolean),
        industryIds: data?.industryIds || (data?.industries || []).map((i) => i?.id || i).filter(Boolean),
        industries: data?.industries || [],
        certificationLinks: (data?.certificationLinks || data?.certificates || []).map((item, idx) =>
            normalizeCertificate(item, idx),
        ),
        workExperiences: (data?.workExperiences || []).map(normalizeWorkExperience),
        cvUrl: data?.cvUrl || "",
        portfolioUrl: data?.portfolioUrl || "",
        bio: data?.bio || "",
        currentAmount: data?.currentAmount ?? null,
    };
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

function CandidateProfilePage() {
    const { id: routeId, slugProfileUrl, profileUrl } = useParams();
    const user = useUser();
    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);
    const [hasLoaded, setHasLoaded] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [expandedWorkExp, setExpandedWorkExp] = useState({});
    // editMode chỉ dành cho: fullName, bio, portfolioUrl, skills, industryIds, cvUrl
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
    const [allIndustries, setAllIndustries] = useState([]);
    const [allCompanies, setAllCompanies] = useState([]);

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

    const [openAiEval, setOpenAiEval] = useState(false);

    const dispatch = useDispatch();
    const callApiLocal = (options) => callApi({ ...options, useGlobalLoading: false });

    const endpoint = useMemo(() => {
        const slug = slugProfileUrl || profileUrl;
        if (slug) return candidateProfileEndPoints.VIEW_PROFILE_BY_SLUG.replace("{slugProfileUrl}", slug);
        if (routeId) return candidateProfileEndPoints.VIEW_OWN_CANDIDATE_PROFILE.replace("{id}", routeId);
        if (!user?.id) return null;
        return candidateProfileEndPoints.VIEW_OWN_CANDIDATE_PROFILE.replace("{id}", user.id);
    }, [routeId, slugProfileUrl, profileUrl, user?.id]);

    const fetchProfile = async (silent = false) => {
        if (!endpoint) return;
        if (!silent) {
            setHasLoaded(false);
        }
        setError(null);
        try {
            const res = await callApiLocal({ method: METHOD.GET, endpoint });
            const slug = slugProfileUrl || profileUrl;
            if (slug && (!res || !res.success || !res.data)) {
                navigate(`/profile/${slug}`);
                return;
            }
            if (res.success) {
                setProfile(normalizeCandidateProfile(res.data));
                try {
                    const idToUse = res.data.id || routeId || user?.id;
                    if (idToUse) {
                        const ep = candidateProfileEndPoints.GET_CANDIDATE_RATING.replace("{id}", idToUse);
                        const r = await callApiLocal({ method: METHOD.GET, endpoint: ep });
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
            if (!silent) {
                setHasLoaded(true);
            }
        }
    };

    useEffect(() => {
        fetchProfile();
    }, [endpoint]);

    const handleRefresh = () => {
        fetchProfile(true);
    };

    useEffect(() => {
        const fetchDropdownData = async () => {
            try {
                const skillsRes = await callApiLocal({
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
                const industriesRes = await callApiLocal({
                    method: METHOD.GET,
                    endpoint: candidateProfileEndPoints.GET_ALL_INDUSTRIES.replace("{page}", "1").replace(
                        "{pageSize}",
                        "100",
                    ),
                });
                if (industriesRes.success) {
                    const industries = industriesRes.data?.items || industriesRes.data || [];
                    setAllIndustries(Array.isArray(industries) ? industries : []);
                }
            } catch (err) {
                console.error("Error loading dropdown data:", err);
            }
        };
        fetchDropdownData();
    }, []);

    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                const isCandidateUser =
                    user?.role === ROLES.CANDIDATE || String(user?.role).toLowerCase() === "candidate";
                let res;
                if (isCandidateUser) {
                    res = await callApiLocal({
                        method: METHOD.GET,
                        endpoint: homeEndPoints.GET_ALL_COMPANIES,
                        arg: { page: 1, pageSize: 50 },
                    });
                } else {
                    const ep = interviewerProfileEndPoints.GET_ALL_COMPANIES.replace("{page}", "1").replace(
                        "{pageSize}",
                        "50",
                    );
                    res = await callApiLocal({ method: METHOD.GET, endpoint: ep });
                }
                if (res?.success) {
                    const items = res.data?.items ?? res.data?.data ?? res.data ?? [];
                    const names = (items || []).map((c) => c && (c.name || c.companyName || c)).filter(Boolean);
                    setAllCompanies(names);
                }
            } catch (e) {
                console.warn("Failed to load companies", e);
            }
        };
        fetchCompanies();
    }, [user?.role]);

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
        callApiLocal({ method: METHOD.GET, endpoint: interactionEndPoints.GET_SAVED_QUESTIONS })
            .then(({ data }) => {
                const items = data?.items ?? data?.data ?? (Array.isArray(data) ? data : []);
                setSavedQuestions(items);
            })
            .catch(console.error)
            .finally(() => setLoadingSaved(false));
    }, [tabValue, isSelf, isCandidate]);

    const refreshProfile = async () => {
        if (!profile?.id) return;
        const ep = candidateProfileEndPoints.VIEW_OWN_CANDIDATE_PROFILE.replace("{id}", profile.id);
        const res = await callApiLocal({ method: METHOD.GET, endpoint: ep });
        if (res?.success) {
            setProfile(normalizeCandidateProfile(res.data));
        }
    };

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
                industryIds: profile.industryIds || [],
                bankBinNumber: profile.bankBinNumber || "",
                bankAccountNumber: String(profile.bankAccountNumber || "").trim(),
            };

            const res = await callApiLocal({ method: METHOD.PUT, endpoint: ep, arg: payload, displaySuccessMessage: true });
            if (!res?.success) throw new Error(res?.message || "Failed to save profile.");

            setEditMode(false);
            setSaveSuccess(true);
            await refreshProfile();
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

    // ─── Work Experience CRUD (độc lập với editMode) ─────────────────────────
    const handleSaveWorkExperience = async (exp) => {
        if (!profile) return;
        if (!canEdit) return setError("You don't have permission to edit this profile.");
        setSaving(true);
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
                const endpoint = candidateProfileEndPoints.UPDATE_CANDIDATE_WORK_EXPERIENCE.replace(
                    "{profileId}",
                    profile.id,
                ).replace("{workExperienceId}", exp.id);
                const res = await callApiLocal({ method: METHOD.PUT, endpoint, arg: payload, displaySuccessMessage: true });
                if (!res?.success) throw new Error(res?.message || "Failed to update work experience.");
            } else {
                const endpoint = candidateProfileEndPoints.CREATE_CANDIDATE_WORK_EXPERIENCE.replace(
                    "{profileId}",
                    profile.id,
                );
                const res = await callApiLocal({ method: METHOD.POST, endpoint, arg: payload, displaySuccessMessage: true });
                if (!res?.success) throw new Error(res?.message || "Failed to create work experience.");
            }

            setWorkExperienceModalOpen(false);
            setEditingWorkExperience(null);
            await refreshProfile();
        } catch (err) {
            setError(err.message || "Failed to save work experience.");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteWorkExperience = async (id) => {
        if (!profile?.id || !id) return;
        try {
            const endpoint = candidateProfileEndPoints.DELETE_CANDIDATE_WORK_EXPERIENCE.replace(
                "{profileId}",
                profile.id,
            ).replace("{workExperienceId}", id);
            const res = await callApiLocal({ method: METHOD.DELETE, endpoint, displaySuccessMessage: true });
            if (!res?.success) throw new Error(res?.message || "Failed to delete work experience.");
            await refreshProfile();
        } catch (err) {
            setError(err.message || "Failed to delete work experience.");
        }
    };

    const handleSaveCertificate = async (form, certificateId) => {
        if (!profile) return;
        try {
            const payload = {
                Name: form.name || "",
                Issuer: form.issuer || "",
                IssuedAt: form.issuedAt ? new Date(form.issuedAt).toISOString() : null,
                ExpiryAt: form.expiryAt ? new Date(form.expiryAt).toISOString() : null,
                Link: form.link || "",
            };

            if (certificateId) {
                const endpoint = candidateProfileEndPoints.UPDATE_CANDIDATE_CERTIFICATE.replace(
                    "{profileId}",
                    profile.id,
                ).replace("{certificateId}", certificateId);
                const res = await callApiLocal({ method: METHOD.PUT, endpoint, arg: payload, displaySuccessMessage: true });
                if (!res?.success) throw new Error(res?.message || "Failed to update certificate.");
            } else {
                const endpoint = candidateProfileEndPoints.CREATE_CANDIDATE_CERTIFICATE.replace(
                    "{profileId}",
                    profile.id,
                );
                const res = await callApiLocal({ method: METHOD.POST, endpoint, arg: payload, displaySuccessMessage: true });
                if (!res?.success) throw new Error(res?.message || "Failed to add certificate.");
            }

            setCertificateDialogOpen(false);
            setEditingCertificate(null);
            await refreshProfile();
        } catch (err) {
            setError(err.message || "Failed to add certification.");
        }
    };

    const handleDeleteCertificate = async (certificate) => {
        if (!profile) return;
        if (!certificate?.id) return setError("Cannot delete certificate without id.");
        try {
            const endpoint = candidateProfileEndPoints.DELETE_CANDIDATE_CERTIFICATE.replace(
                "{profileId}",
                profile.id,
            ).replace("{certificateId}", certificate.id);
            const res = await callApiLocal({ method: METHOD.DELETE, endpoint, displaySuccessMessage: true });
            if (!res?.success) throw new Error(res?.message || "Failed to delete certificate.");
            setCertificateDialogOpen(false);
            setEditingCertificate(null);
            await refreshProfile();
        } catch (err) {
            setError(err.message || "Failed to delete certification.");
        }
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

    if (!hasLoaded && endpoint) {
        return null;
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
        <Box className="elite-profile-container" sx={{ minHeight: "90vh" }}>
            <Box className="ep-shell" sx={{ pb: 0 }}>
                {/* ── Hero card ── */}
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
                        {/* Nút edit/close CHỈ cho profile fields (bio, name, skills, portfolio...) */}
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
                                        {/* Core Skills - chỉ editable khi editMode */}
                                        <Box component="section" className="ep-expertise" sx={{ mb: 5 }}>
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
                                                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.85, mb: 3 }}>
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
                                        </Box>

                                        <Box component="section" className="ep-services">
                                            <Box sx={{ display: "grid", gridTemplateColumns: "1fr", gap: 3 }}>
                                                {/* ── Work Experience Section ──
                                                    Luôn hiển thị nút Add/Edit/Delete khi canEdit,
                                                    KHÔNG phụ thuộc vào editMode.
                                                    Khi editMode=true thì ẩn các nút này để tránh nhầm lẫn.
                                                */}
                                                <Box component="section" sx={{ mb: 2 }}>
                                                    <Box
                                                        sx={{
                                                            display: "flex",
                                                            justifyContent: "space-between",
                                                            alignItems: "center",
                                                            mb: 2,
                                                        }}
                                                    >
                                                        <Typography
                                                            variant="h6"
                                                            fontWeight={700}
                                                            sx={{
                                                                display: "flex",
                                                                alignItems: "center",
                                                                gap: 1,
                                                                color: "var(--ep-accent-dark)",
                                                            }}
                                                        >
                                                            <BriefcaseIcon size={20} /> Work Experience
                                                        </Typography>
                                                        {/* Ẩn khi editMode đang bật (đang edit profile fields) */}
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
                                                    <Stack spacing={2}>
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
                                                                            <Box
                                                                                sx={{
                                                                                    flex: 1,
                                                                                    pr: canEdit && !editMode ? 8 : 0,
                                                                                }}
                                                                            >
                                                                                <Typography
                                                                                    variant="h6"
                                                                                    sx={{
                                                                                        fontSize: "1.1rem",
                                                                                        fontWeight: 700,
                                                                                    }}
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
                                                                                        name={
                                                                                            exp.companyName ||
                                                                                            exp.company ||
                                                                                            ""
                                                                                        }
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
                                                                                        {[
                                                                                            exp.location,
                                                                                            exp.locationType,
                                                                                        ]
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
                                                                                            setEditingWorkExperience(
                                                                                                exp,
                                                                                            );
                                                                                            setWorkExperienceModalOpen(
                                                                                                true,
                                                                                            );
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
                                                                                            setPendingDeleteWorkExperience(
                                                                                                exp.id,
                                                                                            );
                                                                                            setShowConfirmWorkDelete(
                                                                                                true,
                                                                                            );
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
                                                                                            setExpandedWorkExp(
                                                                                                (prev) => ({
                                                                                                    ...prev,
                                                                                                    [expId]:
                                                                                                        !prev[expId],
                                                                                                }),
                                                                                            );
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
                                                                                        {isExpanded
                                                                                            ? "View Less"
                                                                                            : "View More"}
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
                                                            <Typography
                                                                variant="body2"
                                                                color="text.secondary"
                                                                fontStyle="italic"
                                                            >
                                                                No work experience added.
                                                            </Typography>
                                                        )}
                                                    </Stack>
                                                </Box>

                                                {/* ── Industries Section - chỉ editable khi editMode ── */}
                                                <Box component="section" sx={{ mb: 2, mt: 2 }}>
                                                    <Typography
                                                        variant="h6"
                                                        fontWeight={700}
                                                        sx={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: 1,
                                                            mb: 2,
                                                            color: "var(--ep-accent-dark)",
                                                        }}
                                                    >
                                                        <GlobeIcon size={20} /> Domain (Industries)
                                                    </Typography>
                                                    {editMode ? (
                                                        <Autocomplete
                                                            multiple
                                                            options={allIndustries}
                                                            getOptionLabel={(option) => option.name || ""}
                                                            value={allIndustries.filter((i) =>
                                                                (profile.industryIds || []).includes(i.id),
                                                            )}
                                                            onChange={(_, newValue) =>
                                                                setProfile({
                                                                    ...profile,
                                                                    industryIds: newValue.map((i) => i.id),
                                                                })
                                                            }
                                                            renderInput={(params) => (
                                                                <TextField
                                                                    {...params}
                                                                    placeholder="Select industries"
                                                                />
                                                            )}
                                                        />
                                                    ) : (
                                                        <Stack direction="row" flexWrap="wrap" gap={1}>
                                                            {(profile.industries || []).length > 0 ? (
                                                                (profile.industries || []).map((ind) => (
                                                                    <Box
                                                                        key={ind.id}
                                                                        sx={{
                                                                            border: "1px solid #eee",
                                                                            px: 2,
                                                                            py: 0.5,
                                                                            borderRadius: 2,
                                                                            fontWeight: 600,
                                                                            fontSize: "0.85rem",
                                                                            display: "inline-flex",
                                                                            alignItems: "center",
                                                                            gap: 1,
                                                                        }}
                                                                    >
                                                                        <GlobeIcon size={16} />
                                                                        {ind.name}
                                                                    </Box>
                                                                ))
                                                            ) : (
                                                                <Typography variant="body2" color="text.secondary">
                                                                    No industries selected.
                                                                </Typography>
                                                            )}
                                                        </Stack>
                                                    )}
                                                </Box>

                                                <Box component="section" sx={{ mb: 4, mt: 2 }}>
                                                    <Box
                                                        sx={{
                                                            display: "flex",
                                                            justifyContent: "space-between",
                                                            alignItems: "center",
                                                            mb: 2,
                                                        }}
                                                    >
                                                        <Typography
                                                            variant="h6"
                                                            fontWeight={700}
                                                            sx={{
                                                                display: "flex",
                                                                alignItems: "center",
                                                                gap: 1,
                                                                color: "var(--ep-accent-dark)",
                                                            }}
                                                        >
                                                            <AwardIcon size={20} /> Certifications
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

                                                    <Stack spacing={2}>
                                                        {(profile.certificationLinks || []).length > 0 ? (
                                                            (profile.certificationLinks || []).map((item, idx) => {
                                                                const href =
                                                                    typeof item === "string" ? item : item?.link || "";
                                                                const label =
                                                                    typeof item === "string"
                                                                        ? `Certificate ${idx + 1}`
                                                                        : item?.name || `Certificate ${idx + 1}`;
                                                                const issuer =
                                                                    typeof item === "object" ? item?.issuer || "" : "";
                                                                const issuedAt =
                                                                    typeof item === "object" && item.issuedAt
                                                                        ? formatMonthYear(item.issuedAt)
                                                                        : "";
                                                                const expiryAt =
                                                                    typeof item === "object" && item.expiryAt
                                                                        ? formatMonthYear(item.expiryAt)
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
                                                                        key={
                                                                            typeof item === "object"
                                                                                ? item?.id || `${label}-${idx}`
                                                                                : `${label}-${idx}`
                                                                        }
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
                                                                            boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                                                                        }}
                                                                    >
                                                                        <Box
                                                                            sx={{ display: "flex", gap: 1.5, flex: 1 }}
                                                                        >
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
                                                                                                textDecoration:
                                                                                                    "underline",
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
                                                                                        setPendingDeleteCertificate(
                                                                                            item,
                                                                                        );
                                                                                        setShowConfirmCertificateDelete(
                                                                                            true,
                                                                                        );
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
                                                            <Typography variant="body2" color="text.secondary">
                                                                No certificates added.
                                                            </Typography>
                                                        )}
                                                    </Stack>
                                                </Box>

                                                <Box sx={{ cursor: "default" }}>
                                                    {canEdit && profile && (
                                                        <UploadCv profile={profile} canEdit={canEdit} />
                                                    )}
                                                </Box>
                                            </Box>
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

                                        {canEdit && profile && (
                                            <>
                                                <PrimaryButton
                                                    onClick={() => setOpenAiEval(true)}
                                                    startIcon={<BrainCircuit size={18} />}
                                                    fullWidth
                                                    sx={{ 
                                                        mt: -2,
                                                        mb: 3,
                                                        borderRadius: "12px",
                                                        py: 1.5,
                                                        background: "var(--ep-accent-dark)",
                                                        boxShadow: "0 8px 20px -6px rgba(106, 170, 0, 0.4)",
                                                        "&:hover": {
                                                            background: "var(--ep-accent-dark)",
                                                            transform: "translateY(-2px)",
                                                            boxShadow: "0 10px 24px -6px rgba(106, 170, 0, 0.5)",
                                                        }
                                                    }}
                                                >
                                                    View AI CV evaluation
                                                </PrimaryButton>
                                                <AiCvEvaluationModal
                                                    open={openAiEval}
                                                    onClose={() => setOpenAiEval(false)}
                                                    profile={profile}
                                                    onRefresh={handleRefresh}
                                                />
                                            </>
                                        )}

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

                                {/* ── Save bar: chỉ save profile fields, KHÔNG liên quan WE/Cert ── */}
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
                                            message="Save changes to your profile?"
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
                                        {/* <CircularProgress /> */}
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

export default CandidateProfilePage;
