import { useEffect, useState, useMemo } from "react";
import { callApi } from "../../../../../common/utils/apiConnector";
import { METHOD } from "../../../../../common/constants/api";
import { interviewerProfileEndPoints } from "../../service/coachProfileApi";
import { useParams, useSearchParams, useLocation } from "react-router-dom";
import CoachServicesSection from "../../../../coach/pages/CoachInterviewServicePage/CoachServicesSection";
import {
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Container,
    Stack,
    Typography,
    Link,
    Paper,
    Skeleton,
} from "@mui/material";
import BookingSlotDialog from "./BookingSlotDialog";
import ExternalBookingDialog from "./ExternalBookingDialog";
import JDBookingDialog from "./JDBookingDialog";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import SendIcon from "@mui/icons-material/Send";
import DescriptionIcon from "@mui/icons-material/Description";
import LaunchIcon from "@mui/icons-material/Launch";
import StarIcon from "@mui/icons-material/Star";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import BusinessIcon from "@mui/icons-material/Business";
import CodeIcon from "@mui/icons-material/Code";
import toast from "react-hot-toast";
import { PAYOS_TRANSACTION_STATUS, TRANSACTION_STATUS } from "../../../../../common/constants/status";

function PublicInterviewerProfilePage() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
    const [externalBookingOpen, setExternalBookingOpen] = useState(false);
    const [jdBookingOpen, setJdBookingOpen] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const { slugProfileUrl } = useParams();

    // Handle payos callback params
    const [searchParams] = useSearchParams();
    const orderCode = searchParams.get("orderCode");
    const paymentStatus = searchParams.get("status");

    useEffect(() => {
        if (slugProfileUrl) fetchProfile();

        if (orderCode && paymentStatus === PAYOS_TRANSACTION_STATUS.PAID) checkTransactionStatus();
    }, [slugProfileUrl, orderCode, paymentStatus]);

    const checkTransactionStatus = async () => {
        const { data } = await callApi({
            method: METHOD.GET,
            endpoint: interviewerProfileEndPoints.GET_BOOKING_TRANSACTION.replace("{orderCode}", orderCode),
        });
        if (data && data.status === TRANSACTION_STATUS.PAID) {
            toast.success("Interview booked successfully!");
        } else {
            toast.error("Failed to confirm booking. Please contact support.");
        }
    };

    const fetchProfile = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await callApi({
                method: METHOD.GET,
                endpoint: interviewerProfileEndPoints.VIEW_PROFILE_BY_CANDIDATE.replace(
                    "{slugProfileUrl}",
                    slugProfileUrl,
                ),
            });
            setProfile(res.data);
        } catch (e) {
            setError("Failed to load profile.");
        } finally {
            setLoading(true);
            setTimeout(() => setLoading(false), 200);
        }
    };

    const handleSlotSelected = async ({ slot, service, startTime }) => {
        setSelectedSlot(slot);

        console.log("Selected booking:", { slot, service, startTime });
        const returnUrl = window.location.origin + window.location.pathname;
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

        if (data && data.checkOutUrl) {
            window.location.href = data.checkOutUrl;
        }
        console.log("checkOutUrl:", data?.checkOutUrl);
    };

    const avatarLetter = useMemo(() => profile?.user?.fullName?.trim()?.charAt(0)?.toUpperCase() || "?", [profile]);

    // Avatar logic matching home page
    const avatarUrl = useMemo(() => {
        if (!profile) return "";

        // Extract profile data like in InterviewerCard
        const interviewerProfile = profile.interviewerProfile || profile;
        const user = profile.user || {};

        // Get avatar with same logic as home page
        const profilePicture = user?.profilePicture || interviewerProfile?.profilePicture;

        // Use fallback image if no profile picture (same as home page)
        return profilePicture || "https://fr.web.img6.acsta.net/r_1920_1080/pictures/22/12/06/08/39/0036027.jpg";
    }, [profile]);

    return (
        <Container maxWidth="1400px" sx={{ py: 4 }}>
            {loading && (
                <Box display="flex" justifyContent="center" py={6}>
                    <CircularProgress />
                </Box>
            )}

            {!loading && error && (
                <Paper sx={{ p: 3, bgcolor: "error.light" }}>
                    <Typography color="error.contrastText">{error}</Typography>
                </Paper>
            )}

            {!loading && profile && (
                <Box
                    sx={{
                        display: "flex",
                        gap: 4,
                        alignItems: "flex-start",
                        flexDirection: { xs: "column", md: "row" },
                    }}
                >
                    {/* Left column - Profile Content */}
                    <Box
                        sx={{
                            flex: 1,
                            maxWidth: { md: "calc(100% - 410px)" },
                        }}
                    >
                        <Stack spacing={3}>
                            {/* Profile Header */}
                            <Card variant="outlined" sx={{ p: 3 }}>
                                <Box display="flex" alignItems="center">
                                    <Avatar
                                        src={avatarUrl}
                                        alt={profile.user.fullName}
                                        sx={{ width: 120, height: 120, fontSize: 48, mr: 4 }}
                                    >
                                        {!avatarUrl.includes("http") ? avatarLetter : null}
                                    </Avatar>
                                    <Box flex={1}>
                                        <Typography variant="h3" fontWeight={700} sx={{ mb: 0.5 }}>
                                            {profile.user.fullName}
                                        </Typography>
                                        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                                            Senior Interviewer • {profile.experienceYears}+ years of experience
                                        </Typography>
                                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                                            {[...Array(5)].map((_, i) => (
                                                <StarIcon
                                                    key={i}
                                                    sx={{
                                                        color:
                                                            i < Math.floor(profile.rating || 0) ? "#FFD700" : "#E0E0E0",
                                                        fontSize: 20,
                                                    }}
                                                />
                                            ))}
                                            <Typography variant="body2" sx={{ ml: 1 }}>
                                                {profile.rating
                                                    ? `${profile.rating.toFixed(1)} (${profile.sessionsCount || 0} reviews)`
                                                    : "No reviews yet"}
                                            </Typography>
                                        </Stack>
                                        <Typography
                                            variant="body1"
                                            color="text.secondary"
                                            sx={{ whiteSpace: "pre-wrap" }}
                                        >
                                            {profile.bio}
                                        </Typography>
                                        {profile.portfolioUrl && (
                                            <Box mt={2}>
                                                <Link
                                                    href={profile.portfolioUrl}
                                                    target="_blank"
                                                    rel="noopener"
                                                    underline="hover"
                                                    display="inline-flex"
                                                    alignItems="center"
                                                    gap={0.5}
                                                >
                                                    Portfolio <LaunchIcon fontSize="small" />
                                                </Link>
                                            </Box>
                                        )}
                                    </Box>
                                </Box>
                            </Card>

                            {/* Skills Section */}
                            <Card variant="outlined" sx={{ p: 3 }}>
                                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                                    Skills
                                </Typography>
                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                    {profile.skills?.map((skill) => (
                                        <Chip key={skill.id} label={skill.name} variant="outlined" />
                                    ))}
                                </Stack>
                            </Card>

                            {/* Companies Section */}
                            <Card variant="outlined" sx={{ p: 3 }}>
                                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                                    Companies Worked At
                                </Typography>
                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                    {profile.companies?.map((c) => (
                                        <Chip
                                            key={c.id}
                                            icon={<BusinessIcon />}
                                            label={c.name}
                                            variant="outlined"
                                            onClick={() => window.open(c.website, "_blank")}
                                            clickable
                                        />
                                    ))}
                                </Stack>
                            </Card>

                            {/* Reviews Section */}
                            {profile.rating && profile.sessionsCount > 0 && (
                                <Card variant="outlined" sx={{ p: 3 }}>
                                    <Stack
                                        direction="row"
                                        justifyContent="space-between"
                                        alignItems="center"
                                        sx={{ mb: 3 }}
                                    >
                                        <Typography variant="h6" fontWeight={600}>
                                            Reviews of {profile.user.fullName}'s coaching
                                        </Typography>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            {[...Array(5)].map((_, i) => (
                                                <StarIcon
                                                    key={i}
                                                    sx={{
                                                        color: i < Math.floor(profile.rating) ? "#FFD700" : "#E0E0E0",
                                                        fontSize: 20,
                                                    }}
                                                />
                                            ))}
                                        </Stack>
                                    </Stack>

                                    {profile.reviews && profile.reviews.length > 0 ? (
                                        <Stack spacing={3}>
                                            {profile.reviews.slice(0, 2).map((review, index) => (
                                                <Box key={index}>
                                                    <Stack
                                                        direction="row"
                                                        spacing={1}
                                                        alignItems="center"
                                                        sx={{ mb: 1 }}
                                                    >
                                                        {[...Array(5)].map((_, i) => (
                                                            <StarIcon
                                                                key={i}
                                                                sx={{
                                                                    color:
                                                                        i < Math.floor(review.rating || 0)
                                                                            ? "#FFD700"
                                                                            : "#E0E0E0",
                                                                    fontSize: 16,
                                                                }}
                                                            />
                                                        ))}
                                                    </Stack>
                                                    <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                                                        {review.comment || review.feedback || "Great experience!"}
                                                    </Typography>
                                                </Box>
                                            ))}

                                            {profile.reviews.length > 2 && (
                                                <Button
                                                    variant="text"
                                                    color="primary"
                                                    sx={{ alignSelf: "flex-start", textTransform: "none" }}
                                                >
                                                    See all {profile.reviews.length} reviews
                                                </Button>
                                            )}
                                        </Stack>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
                                            No detailed reviews available yet.
                                        </Typography>
                                    )}
                                </Card>
                            )}

                            {/* Interview Services Section */}
                            <CoachServicesSection coachId={profile?.user?.id} />
                        </Stack>
                    </Box>

                    {/* Right column - Booking Panel */}
                    <Box
                        sx={{
                            width: { xs: "100%", md: "400px" },
                            flexShrink: 0,
                        }}
                    >
                        <Box
                            sx={{
                                position: "sticky",
                                top: 24,
                            }}
                        >
                            <Card
                                elevation={3}
                                sx={{
                                    borderRadius: "12px",
                                    border: "1px solid #E5E7EB",
                                    width: "100%",
                                }}
                            >
                                <CardContent sx={{ p: 3 }}>
                                    <Typography variant="h5" fontWeight={700} sx={{ mb: 3, color: "#4F46E5" }}>
                                        Book time with {profile.user.fullName} now
                                    </Typography>

                                    <Stack spacing={2} sx={{ mb: 3 }}>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <Box
                                                sx={{
                                                    width: 20,
                                                    height: 20,
                                                    backgroundColor: "#4F46E5",
                                                    borderRadius: "4px",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                }}
                                            >
                                                <CalendarMonthIcon sx={{ fontSize: 14, color: "white" }} />
                                            </Box>
                                            <Typography variant="body2">1-hour phone or video chat</Typography>
                                        </Stack>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <Box
                                                sx={{
                                                    width: 20,
                                                    height: 20,
                                                    backgroundColor: "#4F46E5",
                                                    borderRadius: "4px",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                }}
                                            >
                                                <StarIcon sx={{ fontSize: 14, color: "white" }} />
                                            </Box>
                                            <Typography variant="body2">Detailed written feedback</Typography>
                                        </Stack>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <Box
                                                sx={{
                                                    width: 20,
                                                    height: 20,
                                                    backgroundColor: "#4F46E5",
                                                    borderRadius: "4px",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                }}
                                            >
                                                <WorkOutlineIcon sx={{ fontSize: 14, color: "white" }} />
                                            </Box>
                                            <Typography variant="body2">Convenient scheduling</Typography>
                                        </Stack>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <Box
                                                sx={{
                                                    width: 20,
                                                    height: 20,
                                                    backgroundColor: "#4F46E5",
                                                    borderRadius: "4px",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                }}
                                            >
                                                <CodeIcon sx={{ fontSize: 14, color: "white" }} />
                                            </Box>
                                            <Typography variant="body2">Switch coaches at any time</Typography>
                                        </Stack>
                                    </Stack>

                                    <Button
                                        fullWidth
                                        variant="contained"
                                        size="large"
                                        onClick={() => setBookingDialogOpen(true)}
                                        sx={{
                                            backgroundColor: "#4F46E5",
                                            "&:hover": { backgroundColor: "#3730A3" },
                                            borderRadius: "8px",
                                            py: 1.5,
                                            fontSize: "1rem",
                                            fontWeight: 600,
                                            textTransform: "none",
                                            mb: 1,
                                        }}
                                    >
                                        Book Available Slot
                                    </Button>

                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        size="large"
                                        startIcon={<SendIcon />}
                                        onClick={() => setExternalBookingOpen(true)}
                                        sx={{
                                            borderColor: "#4F46E5",
                                            color: "#4F46E5",
                                            "&:hover": {
                                                borderColor: "#3730A3",
                                                backgroundColor: "rgba(79,70,229,0.04)",
                                            },
                                            borderRadius: "8px",
                                            py: 1.5,
                                            fontSize: "0.9rem",
                                            fontWeight: 600,
                                            textTransform: "none",
                                            mb: 1,
                                        }}
                                    >
                                        Request External Booking
                                    </Button>

                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        size="large"
                                        startIcon={<DescriptionIcon />}
                                        onClick={() => setJdBookingOpen(true)}
                                        sx={{
                                            borderColor: "#4F46E5",
                                            color: "#4F46E5",
                                            "&:hover": {
                                                borderColor: "#3730A3",
                                                backgroundColor: "rgba(79,70,229,0.04)",
                                            },
                                            borderRadius: "8px",
                                            py: 1.5,
                                            fontSize: "0.9rem",
                                            fontWeight: 600,
                                            textTransform: "none",
                                            mb: 2,
                                        }}
                                    >
                                        JD Multi-Round Booking
                                    </Button>
                                </CardContent>
                            </Card>
                        </Box>
                    </Box>
                </Box>
            )}

            {!loading && !error && !profile && (
                <Box py={6} textAlign="center">
                    <Skeleton variant="rectangular" height={120} />
                    <Typography variant="body2" mt={2}>
                        No data found.
                    </Typography>
                </Box>
            )}

            {/* Booking Dialog (Flow A — available slots) */}
            <BookingSlotDialog
                open={bookingDialogOpen}
                onClose={() => setBookingDialogOpen(false)}
                interviewerId={profile?.user?.id}
                onSlotSelected={handleSlotSelected}
            />

            {/* External Booking Dialog (Flow B) */}
            <ExternalBookingDialog
                open={externalBookingOpen}
                onClose={() => setExternalBookingOpen(false)}
                coachId={profile?.user?.id}
            />

            {/* JD Multi-Round Booking Dialog (Flow C) */}
            <JDBookingDialog open={jdBookingOpen} onClose={() => setJdBookingOpen(false)} coachId={profile?.user?.id} />
        </Container>
    );
}

export default PublicInterviewerProfilePage;
