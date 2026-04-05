import { useEffect, useState, useMemo, useCallback } from "react";
import { Box } from "@mui/material";
import { callApi } from "../../../../../common/utils/apiConnector";
import { METHOD } from "../../../../../common/constants/api";
import { interviewerProfileEndPoints } from "../../service/coachProfileApi";
import { getCoachInterviewServices } from "../../../../coach/services/coachInterviewServiceApi";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { Check, ArrowRight, Briefcase, FileText, Rocket, Clock, Tag, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";
import { PAYOS_TRANSACTION_STATUS, TRANSACTION_STATUS } from "../../../../../common/constants/status";
import BookingSlotDialog from "./BookingSlotDialog";
import JDBookingDialog from "./JDBookingDialog";
import CommonLoader from "../../../../../common/components/loaders/CommonLoader";
import "./EliteCoachProfile.css";
import { useSelector } from "react-redux";
import { ROLES } from "../../../../../common/constants/common";
import { CompanyLogo } from "../../../../../common/utils/logoImageGenerator";

const PublicInterviewerProfilePage = () => {
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
            setError("Failed to load coach profile.");
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

                // Filter slots that are in the future
                res.data.forEach((slot) => {
                    const d = new Date(slot.startTime);
                    if (d >= now) {
                        let dateStr = d.toLocaleDateString("en-US", { weekday: "long" });

                        const today = new Date();
                        const tomorrow = new Date();
                        tomorrow.setDate(today.getDate() + 1);

                        if (d.toDateString() === today.toDateString()) {
                            dateStr = "Today";
                        } else if (d.toDateString() === tomorrow.toDateString()) {
                            dateStr = "Tomorrow";
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
            toast.success("Interview booked successfully!");
            navigate("/booking-requests", { replace: true });
        }
    };

    const handleServiceSelect = (svc) => {
        setSelectedService(svc);
        setBookingDialogOpen(true);
    };

    const handleBooking = async ({ slot, service, startTime }) => {
        const returnUrl = window.location.origin + "/booking-requests";
        // try {
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
            toast.success("Interview booked successfully!");
            navigate("/booking-requests");
        }
        // } catch (err) {
        //     // toast.error("Booking failed. Please try again.");
        // }
    };

    const avatarUrl = useMemo(() => {
        if (!profile) return "";
        const user = profile.user || {};
        return user.profilePicture || profile.profilePicture || "";
    }, [profile]);

    const [expandedBio, setExpandedBio] = useState(false);
    const bioLimit = 400;

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
                <CommonLoader text="Loading Profile" subtext="Preparing the coach's details for you..." />
            </Box>
        );
    }

    if (error || !profile) {
        return (
            <div className="elite-profile-container">
                <div className="ep-shell" style={{ padding: "4rem 0", textAlign: "center" }}>
                    <h2>{error || "Coach not found."}</h2>
                    <button className="ep-btn-book" onClick={() => navigate("/")} style={{ marginTop: "1rem" }}>
                        Back to Home
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
                                <span className="ep-stat-label">Years Exp</span>
                            </div>
                            <div className="ep-stat-item">
                                <span className="ep-stat-value">
                                    {(profile.rating || 0).toFixed(1)}{" "}
                                    <span style={{ color: "#fbbf24", fontSize: "1.2rem" }}>★</span>
                                </span>
                                <span className="ep-stat-label">Candidate Rating</span>
                            </div>
                            <div className="ep-stat-item">
                                <span className="ep-stat-value">{profile.sessionsCount || 0}</span>
                                <span className="ep-stat-label">Mock Interviews</span>
                            </div>
                        </div>

                        <div className="ep-about">
                            <h3 className="ep-about-title">About</h3>
                            <p className="ep-about-text">
                                {profile.bio
                                    ? expandedBio
                                        ? profile.bio
                                        : `${profile.bio.slice(0, bioLimit)}${profile.bio.length > bioLimit ? "..." : ""}`
                                    : "No bio provided yet."}
                                {profile.bio && profile.bio.length > bioLimit && (
                                    <button onClick={() => setExpandedBio(!expandedBio)} className="ep-view-more-btn">
                                        {expandedBio ? "View Less" : "View More"}
                                    </button>
                                )}
                            </p>
                        </div>
                    </div>
                </section>

                <div className="ep-main-grid">
                    <div className="ep-content-left">
                        {/* Expertise & Experience */}
                        <section className="ep-expertise">
                            <h2 className="ep-section-title">Expertise & Experience</h2>

                            <h4 className="ep-sub-title">Core Skills</h4>
                            <div className="ep-skills-wrap">
                                {profile.skills?.map((skill) => (
                                    <div key={skill.id} className="ep-skill-tag">
                                        <CompanyLogo name={skill.name} size={18} />
                                        {skill.name}
                                    </div>
                                ))}
                                {(!profile.skills || profile.skills.length === 0) && (
                                    <p className="ep-text-muted">No skills listed.</p>
                                )}
                            </div>

                            <h4 className="ep-sub-title">Working Experience</h4>
                            <div className="ep-track-grid">
                                {profile.companies?.map((c) => (
                                    <div key={c.id} className="ep-track-card">
                                        <div className="ep-track-card-head">
                                            <CompanyLogo name={c.name} size={24} />
                                            <h4>{c.name}</h4>
                                        </div>
                                        <p>
                                            {c.role || "Software Engineer"} | {c.years || "2021 - Present"}
                                        </p>
                                    </div>
                                ))}
                                {(!profile.companies || profile.companies.length === 0) && (
                                    <p className="ep-text-muted">No companies listed.</p>
                                )}
                            </div>
                        </section>

                        {/* Services */}
                        <section className="ep-services">
                            <h2 className="ep-section-title">Interview Services Provided</h2>
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
                                                <Clock size={12} /> {svc.durationMinutes} min
                                            </span>
                                            <span>
                                                <Tag size={12} /> One-on-one
                                            </span>
                                        </div>
                                        {/* Simplified interaction: Whole card is clickable */}
                                        <div className="ep-service-hint">
                                            Select Service <ArrowRight size={14} />
                                        </div>
                                    </div>
                                ))}
                                {services.length === 0 && <p className="ep-text-muted">No services offered yet.</p>}
                            </div>
                        </section>
                    </div>

                    {/* Sidebar */}
                    <aside className="ep-sidebar">
                        {/* Availability Card */}
                        <div className="ep-side-card">
                            <span className="ep-slot-tag">
                                {availableDates.length > 0 ? "Limited Slots" : "Check Schedule"}
                            </span>
                            <h5>Availability</h5>
                            <h2 className="ep-side-status">
                                {availableDates.length > 0 ? "Open for Bookings" : "View Free Time"}
                            </h2>

                            <p className="ep-about-title" style={{ fontSize: "0.65rem" }}>
                                Next Available Dates
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
                                        Click below to see schedule.
                                    </p>
                                )}
                            </div>

                            <ul className="ep-benefit-list">
                                <li className="ep-benefit-item">
                                    <div className="ep-benefit-check">
                                        <Check size={12} strokeWidth={3} />
                                    </div>
                                    1:1 Live Mock Session
                                </li>
                                <li className="ep-benefit-item">
                                    <div className="ep-benefit-check">
                                        <Check size={12} strokeWidth={3} />
                                    </div>
                                    Personalized Feedback Report
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
                                        Book Available Slot <ArrowRight size={18} />
                                    </button>

                                    <button
                                        className="ep-btn-secondary"
                                        onClick={() => setJdBookingOpen(true)}
                                        style={{ marginTop: "0.75rem" }}
                                    >
                                        <FileText size={18} /> JD Multi-Round Booking
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
                                Fully refundable if cancelled 24h prior
                            </p>
                        </div>

                        {/* Match Card (Derived logic) */}
                        <div className="ep-side-card ep-match-card">
                            <h5>Coach Match Index</h5>
                            <div className="ep-progress-bg">
                                <div className="ep-progress-bar" style={{ width: "85%" }}></div>
                            </div>
                            <p style={{ fontSize: "0.75rem", color: "#64748b" }}>Based on your background analysis.</p>
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
