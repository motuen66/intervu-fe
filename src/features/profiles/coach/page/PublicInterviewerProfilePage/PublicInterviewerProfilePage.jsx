import { useEffect, useState, useMemo, useCallback } from "react";
import { Box, Paper, Typography, Stack } from "@mui/material";
import { callApi } from "../../../../../common/utils/apiConnector";
import { METHOD } from "../../../../../common/constants/api";
import { interviewerProfileEndPoints } from "../../service/coachProfileApi";
import { getCoachInterviewServices } from "../../../../coach/services/coachInterviewServiceApi";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { Check, ArrowRight, Briefcase, FileText, Clock, Tag, ExternalLink, Globe } from "lucide-react";
import toast from "react-hot-toast";
import { PAYOS_TRANSACTION_STATUS, TRANSACTION_STATUS } from "../../../../../common/constants/status";
import BookingSlotDialog from "./BookingSlotDialog";
import JDBookingDialog from "./JDBookingDialog";
import CommonLoader from "../../../../../common/components/loaders/CommonLoader";
import "./EliteCoachProfile.css";
import { useSelector } from "react-redux";
import { ROLES } from "../../../../../common/constants/common";
import { CompanyLogo } from "../../../../../common/utils/logoImageGenerator";
import { useTranslation } from "react-i18next";

const PublicInterviewerProfilePage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { slugProfileUrl } = useParams();
    const [searchParams] = useSearchParams();
    const { userData } = useSelector((state) => state.auth || {});

    // State
    const [profile, setProfile] = useState(null);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [availableDates, setAvailableDates] = useState([]);

    // UI State
    const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
    const [jdBookingOpen, setJdBookingOpen] = useState(false);
    const [selectedService, setSelectedService] = useState(null);

    const orderCode = searchParams.get("orderCode");
    const paymentStatus = searchParams.get("status");

    useEffect(() => {
        if (slugProfileUrl) {
            loadData();
        }
        if (orderCode && paymentStatus === PAYOS_TRANSACTION_STATUS.PAID) {
            checkTransactionStatus();
        }
    }, [slugProfileUrl, orderCode, paymentStatus]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Fetch Profile
            const profileRes = await callApi({
                method: METHOD.GET,
                endpoint: interviewerProfileEndPoints.VIEW_PROFILE_BY_CANDIDATE.replace(
                    "{slugProfileUrl}",
                    slugProfileUrl,
                ),
            });
            const profileData = profileRes.data;
            setProfile(profileData);

            if (profileData?.user?.id) {
                // Fetch Services
                const svcData = await getCoachInterviewServices(profileData.user.id);
                setServices(svcData || []);

                // Fetch Availability for the current month
                fetchCoachAvailability(profileData.user.id);
            }
        } catch (e) {
            setError(t("profile.public.not_found"));
        } finally {
            setLoading(false);
        }
    };

    const fetchCoachAvailability = async (coachId) => {
        try {
            const now = new Date();
            const month = now.getMonth() + 1;
            const year = now.getFullYear();

            const res = await callApi({
                method: METHOD.GET,
                endpoint: `/availabilities/${coachId}/free-slots?month=${month}&year=${year}`,
            });

            if (res.success && res.data) {
                const uniqueDates = [];
                const dateSet = new Set();
                const locale = t("common.date_locale");

                // Filter slots that are in the future
                res.data.forEach((slot) => {
                    const d = new Date(slot.startTime);
                    if (d >= now) {
                        let dateStr = d.toLocaleDateString(locale, { weekday: "long" });

                        const today = new Date();
                        const tomorrow = new Date();
                        tomorrow.setDate(today.getDate() + 1);

                        if (d.toDateString() === today.toDateString()) {
                            dateStr = t("common.days.today") || "Today";
                        } else if (d.toDateString() === tomorrow.toDateString()) {
                            dateStr = t("common.days.tomorrow") || "Tomorrow";
                        }

                        if (!dateSet.has(dateStr)) {
                            dateSet.add(dateStr);
                            uniqueDates.push(dateStr);
                        }
                    }
                });

                setAvailableDates(uniqueDates.slice(0, 4));
            }
        } catch (err) {
            console.error("Error fetching availability:", err);
        }
    };

    const checkTransactionStatus = async () => {
        const { data } = await callApi({
            method: METHOD.GET,
            endpoint: interviewerProfileEndPoints.GET_BOOKING_TRANSACTION.replace("{orderCode}", orderCode),
        });
        if (data && data.status === TRANSACTION_STATUS.PAID) {
            toast.success(t("booking.detail.toast.payment_completed"));
            navigate("/booking-requests", { replace: true });
        }
    };

    const handleServiceSelect = (svc) => {
        setSelectedService(svc);
        setBookingDialogOpen(true);
    };

    const handleBooking = async ({ slot, service, startTime }) => {
        const returnUrl = window.location.origin + "/booking-requests";
        const { data } = await callApi({
            method: METHOD.POST,
            endpoint: interviewerProfileEndPoints.BOOK_INTERVIEW,
            arg: {
                coachId: slot.coachId,
                coachAvailabilityId: slot.id,
                coachInterviewServiceId: service.id,
                startTime: startTime.toISOString(),
                returnUrl: returnUrl,
            },
        });

        if (data?.checkOutUrl) {
            window.location.href = data.checkOutUrl;
        } else {
            toast.success(t("booking.detail.toast.payment_completed"));
            navigate("/booking-requests");
        }
    };

    const avatarUrl = useMemo(() => {
        if (!profile) return "";
        const user = profile.user || {};
        return user.profilePicture || profile.profilePicture || "";
    }, [profile]);

    const [expandedBio, setExpandedBio] = useState(false);
    const [expandedWorkExp, setExpandedWorkExp] = useState({});
    const bioLimit = 400;

    const toggleWorkExp = (id) => {
        setExpandedWorkExp((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    const formatMonthYear = (value) => {
        if (!value) return "Present";
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) return "Present";
        return parsed.toLocaleDateString("en-US", { month: "numeric", year: "numeric" });
    };

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
                <CommonLoader text={t("profile.public.loading")} subtext={t("profile.public.loading_sub")} />
            </Box>
        );
    }

    if (error || !profile) {
        return (
            <div className="elite-profile-container">
                <div className="ep-shell" style={{ padding: "4rem 0", textAlign: "center" }}>
                    <h2>{error || t("profile.public.not_found")}</h2>
                    <button className="ep-btn-book" onClick={() => navigate("/")} style={{ marginTop: "1rem" }}>
                        {t("profile.public.back_home")}
                    </button>
                </div>
            </div>
        );
    }

    const currentTitle = profile.jobTitle || "Senior Interviewer";
    const currentCompany = profile.companyName || (profile.companies?.length > 0 ? profile.companies[0].name : "");
    const displayName = profile?.user?.fullName || profile?.fullName || "Interviewer";

    return (
        <div className="elite-profile-container" style={{ paddingTop: "2rem" }}>
            <main className="ep-shell">
                {/* Hero Profile Section */}
                <section className="ep-hero">
                    <div className="ep-hero-avatar-wrap">
                        <img
                            src={avatarUrl || "https://ui-avatars.com/api/?name=" + encodeURIComponent(displayName)}
                            alt={displayName}
                            className="ep-hero-avatar"
                        />
                    </div>
                    <div className="ep-hero-content">
                        <h1 className="ep-hero-name">{displayName}</h1>
                        <p className="ep-hero-title">
                            {currentTitle}{" "}
                            {currentCompany && (
                                <>
                                    @{" "}
                                    <strong>
                                        <span className="ep-inline-logo">
                                            <CompanyLogo name={currentCompany} size={22} />
                                            {currentCompany}
                                        </span>
                                    </strong>
                                </>
                            )}
                        </p>

                        <div className="ep-stats-grid">
                            <div className="ep-stat-item">
                                <span className="ep-stat-value">{profile.experienceYears}+</span>
                                <span className="ep-stat-label">{t("profile.public.years_exp")}</span>
                            </div>
                            <div className="ep-stat-item">
                                <span className="ep-stat-value">
                                    {(profile.rating || 0).toFixed(1)}{" "}
                                    <span style={{ color: "#fbbf24", fontSize: "1.2rem" }}>★</span>
                                </span>
                                <span className="ep-stat-label">{t("profile.public.rating")}</span>
                            </div>
                            <div className="ep-stat-item">
                                <span className="ep-stat-value">{profile.sessionsCount || 0}</span>
                                <span className="ep-stat-label">{t("profile.public.mock_interviews")}</span>
                            </div>
                        </div>

                        <div className="ep-about">
                            <h3 className="ep-about-title">{t("profile.public.about")}</h3>
                            <div className="ep-about-text">
                                {profile.bio
                                    ? expandedBio
                                        ? profile.bio
                                        : `${profile.bio.slice(0, bioLimit)}${profile.bio.length > bioLimit ? "..." : ""}`
                                    : t("profile.public.no_bio")}
                                {profile.bio && profile.bio.length > bioLimit && (
                                    <button onClick={() => setExpandedBio(!expandedBio)} className="ep-view-more-btn">
                                        {expandedBio ? t("profile.public.view_less") : t("profile.public.view_more")}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                <div className="ep-main-grid">
                    <div className="ep-content-left">
                        {/* Expertise & Experience */}
                        <section className="ep-expertise">
                            <h2 className="ep-section-title">{t("profile.public.expertise")}</h2>

                            <h4 className="ep-sub-title">{t("profile.public.core_skills")}</h4>
                            <div className="ep-skills-wrap">
                                {profile.skills?.map((skill) => (
                                    <div key={skill.id} className="ep-skill-tag">
                                        <CompanyLogo name={skill.name} size={18} />
                                        {skill.name}
                                    </div>
                                ))}
                                {(!profile.skills || profile.skills.length === 0) && (
                                    <p className="ep-text-muted">{t("profile.public.no_skills")}</p>
                                )}
                            </div>

                            <h4 className="ep-sub-title">{t("profile.public.work_exp")}</h4>
                            <Stack spacing={2} sx={{ mb: 4 }}>
                                {(profile.workExperiences || profile.companies)?.length > 0 ? (
                                    (profile.workExperiences || profile.companies).map((exp, idx) => {
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
                                                    <Box sx={{ flex: 1 }}>
                                                        <Typography
                                                            variant="h6"
                                                            sx={{ fontSize: "1.1rem", fontWeight: 700 }}
                                                        >
                                                            {exp.positionTitle || exp.jobTitle || "Role not specified"}
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
                                                                name={exp.companyName || exp.name || ""}
                                                                size={24}
                                                            />
                                                            <Typography
                                                                variant="subtitle1"
                                                                sx={{ fontWeight: 600, color: "text.primary" }}
                                                            >
                                                                {exp.companyName || exp.name || "Company not specified"}
                                                                {exp.jobType ? ` · ${exp.jobType}` : ""}
                                                            </Typography>
                                                        </Box>
                                                        <Typography
                                                            variant="body2"
                                                            color="text.secondary"
                                                            sx={{ mt: 0.5, color: "#94a3b8" }}
                                                        >
                                                            {formatMonthYear(exp.startDate || exp.startDay)} -{" "}
                                                            {exp.isCurrentWorking
                                                                ? "Present"
                                                                : exp.endDate || exp.endDay
                                                                  ? formatMonthYear(exp.endDate || exp.endDay)
                                                                  : "Present"}
                                                        </Typography>
                                                        {(exp.location || exp.locationType) && (
                                                            <Typography
                                                                variant="body2"
                                                                color="text.secondary"
                                                                sx={{ color: "#94a3b8" }}
                                                            >
                                                                {[exp.location, exp.locationType]
                                                                    .filter(Boolean)
                                                                    .join(" · ")}
                                                            </Typography>
                                                        )}
                                                    </Box>
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
                                                                onClick={() => toggleWorkExp(expId)}
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
                                                    <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 2 }}>
                                                        {exp.skillIds.map((sid) => {
                                                            const skill = profile.skills?.find((s) => s.id === sid);
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
                                    <p className="ep-text-muted">{t("profile.public.no_companies")}</p>
                                )}
                            </Stack>

                            <h4 className="ep-sub-title">{t("profile.public.domain")}</h4>
                            <div className="ep-skills-wrap">
                                {profile.industries?.map((ind) => (
                                    <div
                                        key={ind.id}
                                        className="ep-skill-tag"
                                        style={{ background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0" }}
                                    >
                                        <Globe size={16} />
                                        {ind.name}
                                    </div>
                                ))}
                                {(!profile.industries || profile.industries.length === 0) && (
                                    <p className="ep-text-muted">{t("profile.public.no_industries")}</p>
                                )}
                            </div>

                            <h4
                                className="ep-sub-title"
                                style={{ color: "var(--ep-accent-dark)", marginTop: "0.75rem" }}
                            >
                                {t("profile.public.certs")}
                            </h4>
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "1rem",
                                    marginBottom: "3.5rem",
                                }}
                            >
                                {(profile.certificationLinks || profile.certificates || profile.certifications)?.map(
                                    (link, idx) => {
                                        const href = typeof link === "string" ? link : link?.link || link?.Link || "";
                                        const name =
                                            typeof link === "string"
                                                ? `Certificate ${idx + 1}`
                                                : link?.name || link?.Name || `Certificate ${idx + 1}`;
                                        const issuer =
                                            typeof link === "object" ? link?.issuer || link?.Issuer || "" : "";
                                        const issuedAt =
                                            typeof link === "object" && (link.issuedAt || link.IssuedAt)
                                                ? link.issuedAt || link.IssuedAt
                                                : "";
                                        const expiryAt =
                                            typeof link === "object" && (link.expiryAt || link.ExpiryAt)
                                                ? link.expiryAt || link.ExpiryAt
                                                : "";

                                        let host = "";
                                        try {
                                            if (href) {
                                                const u = new URL(href);
                                                host = u.hostname.replace("www.", "");
                                            }
                                        } catch (e) {}

                                        return (
                                            <div
                                                key={idx}
                                                style={{
                                                    display: "flex",
                                                    gap: "1rem",
                                                    alignItems: "flex-start",
                                                    padding: "1rem",
                                                    background: "white",
                                                    borderRadius: "8px",
                                                    border: "1px solid rgba(0,0,0,0.05)",
                                                }}
                                            >
                                                <div style={{ flexShrink: 0, marginTop: "0.25rem" }}>
                                                    <CompanyLogo name={issuer || host || name} size={40} />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    {href ? (
                                                        <a
                                                            href={href}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            style={{
                                                                display: "flex",
                                                                alignItems: "center",
                                                                gap: "0.5rem",
                                                                color: "#347d00",
                                                                textDecoration: "none",
                                                                fontWeight: 700,
                                                                fontSize: "1rem",
                                                            }}
                                                        >
                                                            {name}
                                                            <ExternalLink size={14} />
                                                        </a>
                                                    ) : (
                                                        <div style={{ fontWeight: 700, fontSize: "1rem" }}>{name}</div>
                                                    )}
                                                    {issuer && (
                                                        <div
                                                            style={{
                                                                fontWeight: 600,
                                                                fontSize: "0.9rem",
                                                                color: "#333",
                                                                marginTop: "2px",
                                                            }}
                                                        >
                                                            {issuer}
                                                        </div>
                                                    )}
                                                    {(issuedAt || expiryAt) && (
                                                        <div
                                                            style={{
                                                                fontSize: "0.8rem",
                                                                color: "#666",
                                                                marginTop: "2px",
                                                            }}
                                                        >
                                                            Issued {formatMonthYear(issuedAt)}{" "}
                                                            {expiryAt
                                                                ? `· Expires ${formatMonthYear(expiryAt)}`
                                                                : "· No expiration"}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    },
                                )}
                                {(!profile.certificationLinks || profile.certificationLinks.length === 0) &&
                                    (!profile.certificates || profile.certificates.length === 0) &&
                                    (!profile.certifications || profile.certifications.length === 0) && (
                                        <p className="ep-text-muted">No certifications listed.</p>
                                    )}
                            </div>
                        </section>

                        {/* Services */}
                        <section className="ep-services">
                            <h2 className="ep-section-title">{t("profile.public.services")}</h2>
                            <div className="ep-services-grid">
                                {services.map((svc) => (
                                    <div
                                        key={svc.id}
                                        className="ep-service-card"
                                        onClick={() => handleServiceSelect(svc)}
                                    >
                                        <div className="ep-service-top">
                                            <div className="ep-service-icon">
                                                {svc.isCoding ? <FileText size={20} /> : <Briefcase size={20} />}
                                            </div>
                                            <div className="ep-service-price">
                                                <span>{svc.price?.toLocaleString()} ₫</span>
                                            </div>
                                        </div>
                                        <h4>{svc.interviewTypeName}</h4>
                                        <div className="ep-service-meta">
                                            <span>
                                                <Clock size={12} /> {svc.durationMinutes} {t("profile.public.min")}
                                            </span>
                                            <span>
                                                <Tag size={12} /> {t("profile.public.one_on_one")}
                                            </span>
                                        </div>
                                        <div className="ep-service-hint">
                                            {t("profile.public.select_service")} <ArrowRight size={14} />
                                        </div>
                                    </div>
                                ))}
                                {services.length === 0 && <p className="ep-text-muted">{t("profile.public.no_services")}</p>}
                            </div>
                        </section>
                    </div>

                    {/* Sidebar */}
                    <aside className="ep-sidebar">
                        <div className="ep-side-card">
                            <span className="ep-slot-tag">
                                {availableDates.length > 0 ? t("profile.public.limited_slots") : t("profile.public.check_schedule")}
                            </span>
                            <h5>{t("profile.public.availability")}</h5>
                            <h2 className="ep-side-status">
                                {availableDates.length > 0 ? t("profile.public.open_for_bookings") : t("profile.public.view_free_time")}
                            </h2>

                            <p className="ep-about-title" style={{ fontSize: "0.65rem" }}>
                                {t("profile.public.next_available")}
                            </p>
                            <div className="ep-date-grid">
                                {availableDates.length > 0 ? (
                                    availableDates.map((date) => (
                                        <div key={date} className="ep-date-btn">
                                            {date}
                                        </div>
                                    ))
                                ) : (
                                    <p style={{ fontSize: "0.75rem", color: "#94a3b8", gridColumn: "span 2" }}>
                                        {t("profile.public.click_to_see")}
                                    </p>
                                )}
                            </div>

                            <ul className="ep-benefit-list">
                                <li className="ep-benefit-item">
                                    <div className="ep-benefit-check">
                                        <Check size={12} strokeWidth={3} />
                                    </div>
                                    {t("profile.public.benefit_1")}
                                </li>
                                <li className="ep-benefit-item">
                                    <div className="ep-benefit-check">
                                        <Check size={12} strokeWidth={3} />
                                    </div>
                                    {t("profile.public.benefit_2")}
                                </li>
                            </ul>

                            {userData?.role === ROLES.CANDIDATE && (
                                <>
                                    <button
                                        className="ep-btn-inquire"
                                        onClick={() => {
                                            setSelectedService(null);
                                            setBookingDialogOpen(true);
                                        }}
                                    >
                                        {t("profile.public.book_slot")} <ArrowRight size={18} />
                                    </button>

                                    <button
                                        className="ep-btn-secondary"
                                        onClick={() => setJdBookingOpen(true)}
                                        style={{ marginTop: "0.75rem" }}
                                    >
                                        <FileText size={18} /> {t("profile.public.jd_booking")}
                                    </button>
                                </>
                            )}

                            <p
                                style={{
                                    textAlign: "center",
                                    fontSize: "0.65rem",
                                    color: "#94a3b8",
                                    marginTop: "1rem",
                                    textTransform: "uppercase",
                                    fontWeight: 700,
                                }}
                            >
                                {t("profile.public.refundable_hint")}
                            </p>
                        </div>

                        {/* Match Card (Derived logic) */}
                        <div className="ep-side-card ep-match-card">
                            <h5>{t("profile.public.match_index")}</h5>
                            <div className="ep-progress-bg">
                                <div className="ep-progress-bar" style={{ width: "85%" }}></div>
                            </div>
                            <p style={{ fontSize: "0.75rem", color: "#64748b" }}>{t("profile.public.match_hint")}</p>
                        </div>
                    </aside>
                </div>
            </main>
            {/* Existing Dialogs */}
            <BookingSlotDialog
                open={bookingDialogOpen}
                onClose={() => {
                    setBookingDialogOpen(false);
                    setSelectedService(null);
                }}
                interviewerId={profile?.user?.id}
                onSlotSelected={handleBooking}
                initialService={selectedService}
            />
            <JDBookingDialog open={jdBookingOpen} onClose={() => setJdBookingOpen(false)} coachId={profile?.user?.id} />
        </div>
    );
};

export default PublicInterviewerProfilePage;
