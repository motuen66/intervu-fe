import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useUser from "../../../../common/hooks/useUser";
import { callApi } from "../../../../common/utils/apiConnector";
import { METHOD } from "../../../../common/constants/api";
import { interviewerProfileEndPoints } from "../service/coachProfileApi";
import {
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Divider,
    Grid,
    Stack,
    Typography,
    Paper,
    Rating,
    Container,
    Fade,
    Alert,
    IconButton,
    TextField,
    Link,
    Autocomplete,
} from "@mui/material";

import {
    Edit3 as EditIcon,
    Briefcase as WorkIcon,
    User as PersonIcon,
    Mail as EmailIcon,
    Link as LinkIcon,
    Code as CodeIcon,
    X as CloseIcon,
    Save as SaveIcon,
    Camera as CameraIcon,
} from "lucide-react";
import { uploadImage } from "../../../../firebase/service/storage";
import { useDispatch } from "react-redux";
import { setUserData } from "../../../../common/store/authSlice";
import ConfirmModal from "../../../../common/components/ConfirmModal";
import BankSelection from "./BankSelection";

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
        console.log("Pending avatar file:", pendingAvatarFile);
        if (!pendingAvatarFile) return;
        console.log("Uploading avatar for user ID:", user.id);
        try {
            const data = await uploadImage(user.id, pendingAvatarFile);
            console.log("Uploaded avatar data:", data);
            if (data?.profilePictureUrl) {
                const updatedUser = { ...user, profilePicture: data.profilePictureUrl };
                try { localStorage.setItem("user", JSON.stringify(updatedUser)); } catch (e) { console.warn(e); }
                dispatch(setUserData(updatedUser));
                setProfile((prev) => ({ ...prev, user: { ...(prev?.user || {}), profilePicture: data.profilePictureUrl }, profilePicture: data.profilePictureUrl }));
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
        // revert preview
        setProfile((prev) => ({ ...prev, user: { ...(prev?.user || {}), profilePicture: prevAvatar }, profilePicture: prevAvatar }));
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
                experienceYears: Number(profile.experienceYears) || 0,
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
                dispatch(setUserData(res.data.user));
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

    const isSelf = !routeId || String(routeId) === String(user?.id);
    const canEdit = isInterviewer && isSelf;

    return (
        <Box sx={{ minHeight: "100vh" }}>
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
                                    {editMode ? <CloseIcon size={20} strokeWidth={2} /> : <EditIcon size={20} strokeWidth={2} />}
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
                                            value={years}
                                            onChange={(e) =>
                                                setProfile((prev) => ({
                                                    ...prev,
                                                    experienceYears: Number(e.target.value),
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
                                    onChange={(e) => setProfile((prev) => ({ ...prev, bio: e.target.value }))}
                                    placeholder="Tell us about yourself..."
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
            </Card>

            {profile && (
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
                                    <EmailIcon size={24} strokeWidth={1.5} color="var(--mui-palette-primary-main)" />
                                    Contact Information
                                </Typography>
                                <Divider sx={{ mb: 2 }} />

                                <InfoRow icon={<EmailIcon size={18} strokeWidth={2} />} label="Email" content={email} />

                                <InfoRow
                                    icon={<LinkIcon size={18} strokeWidth={2} />}
                                    label="Portfolio"
                                    content={
                                        editMode ? (
                                            <TextField
                                                fullWidth
                                                size="small"
                                                placeholder="https://yourportfolio.com"
                                                value={profile.portfolioUrl || ""}
                                                onChange={(e) =>
                                                    setProfile((prev) => ({
                                                        ...prev,
                                                        portfolioUrl: e.target.value,
                                                    }))
                                                }
                                            />
                                        ) : profile.portfolioUrl ? (
                                            <Link
                                                href={profile.portfolioUrl}
                                                target="_blank"
                                                rel="noopener"
                                                sx={{ fontWeight: 500 }}
                                            >
                                                {profile.portfolioUrl}
                                            </Link>
                                        ) : (
                                            <Typography color="text.secondary">Not provided</Typography>
                                        )
                                    }
                                />

                                {/* Bank BIN */}
                                <InfoRow
                                    icon={<LinkIcon size={18} strokeWidth={2} />}
                                    label="Bank"
                                    content={
                                        editMode ? (
                                            <BankSelection
                                                valueBin={profile?.bankBinNumber || ""}
                                                onBankBinChange={(bin) =>
                                                    setProfile((prev) => ({ ...prev, bankBinNumber: bin }))
                                                }
                                            />
                                        ) : profile?.bankBinNumber ? (
                                            `BIN: ${profile.bankBinNumber}`
                                        ) : (
                                            <Typography color="text.secondary">Not provided</Typography>
                                        )
                                    }
                                />

                                {/* Bank Account Number */}
                                <InfoRow
                                    icon={<LinkIcon size={18} strokeWidth={2} />}
                                    label="Bank Account Number"
                                    content={
                                        editMode ? (
                                            <TextField
                                                fullWidth
                                                size="small"
                                                placeholder="Enter bank account number"
                                                value={profile?.bankAccountNumber || ""}
                                                onChange={(e) =>
                                                    setProfile((prev) => ({
                                                        ...prev,
                                                        bankAccountNumber: e.target.value,
                                                    }))
                                                }
                                            />
                                        ) : profile?.bankAccountNumber ? (
                                            profile.bankAccountNumber
                                        ) : (
                                            <Typography color="text.secondary">Not provided</Typography>
                                        )
                                    }
                                />
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Skills & Companies */}
                    <Grid item xs={12} sm={6}>
                        <Card elevation={0} sx={{ height: "100%", border: "1px solid", borderColor: "divider" }}>
                            <CardContent>
                                <Typography
                                    variant="h6"
                                    fontWeight={600}
                                    gutterBottom
                                    sx={{ display: "flex", alignItems: "center", gap: 1 }}
                                >
                                    <CodeIcon size={24} strokeWidth={1.5} color="var(--mui-palette-primary-main)" />
                                    Expertise
                                </Typography>
                                <Divider sx={{ mb: 2 }} />

                                <Box sx={{ mb: 3 }}>
                                    <Typography
                                        variant="subtitle2"
                                        color="text.secondary"
                                        gutterBottom
                                        fontWeight={600}
                                    >
                                        SKILLS
                                    </Typography>
                                    {editMode ? (
                                        <Autocomplete
                                            multiple
                                            options={allSkills || []}
                                            getOptionLabel={(option) => option.name}
                                            value={
                                                profile.skills?.map((s) =>
                                                    typeof s === "object" ? s : allSkills.find((sk) => sk.name === s),
                                                ) || []
                                            }
                                            onChange={(e, newValue) =>
                                                setProfile((prev) => ({ ...prev, skills: newValue }))
                                            }
                                            renderInput={(params) => (
                                                <TextField {...params} placeholder="Add skills" size="small" />
                                            )}
                                        />
                                    ) : (
                                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
                                            {skillsDisplay.length > 0 ? (
                                                skillsDisplay.map((s, i) => (
                                                    <Chip
                                                        key={`skill-${i}`}
                                                        label={s}
                                                        size="medium"
                                                        color="primary"
                                                        variant="outlined"
                                                    />
                                                ))
                                            ) : (
                                                <Typography color="text.secondary" variant="body2">
                                                    No skills added
                                                </Typography>
                                            )}
                                        </Box>
                                    )}
                                </Box>

                                <Box>
                                    <Typography
                                        variant="subtitle2"
                                        color="text.secondary"
                                        gutterBottom
                                        fontWeight={600}
                                    >
                                        COMPANIES
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
                                                <TextField {...params} placeholder="Add companies" size="small" />
                                            )}
                                        />
                                    ) : (
                                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
                                            {companiesDisplay.length > 0 ? (
                                                companiesDisplay.map((c, i) => (
                                                    <Chip
                                                        key={`company-${i}`}
                                                        label={c}
                                                        size="medium"
                                                        color="secondary"
                                                        variant="outlined"
                                                    />
                                                ))
                                            ) : (
                                                <Typography color="text.secondary" variant="body2">
                                                    No companies added
                                                </Typography>
                                            )}
                                        </Box>
                                    )}
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* Save Button */}
            {editMode && profile && (
                <>
                    <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end", gap: 2 }}>
                        <Button variant="outlined" onClick={() => setEditMode(false)} disabled={saving}>
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            size="large"
                            startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon size={18} strokeWidth={2} />}
                            onClick={() => setShowConfirmSave(true)}
                            disabled={saving}
                        >
                            {saving ? "Saving..." : "Save Changes"}
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
