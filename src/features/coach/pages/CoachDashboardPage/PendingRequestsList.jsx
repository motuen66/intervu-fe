import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import Divider from "@mui/material/Divider";
import { Groups, CalendarToday, Check, Cancel } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import BaseCard from "../../../../common/components/cards/BaseCard";
import DangerButton from "../../../../common/components/buttons/DangerButton";
import SuccessButton from "../../../../common/components/buttons/SuccessButton";
import TextButton from "../../../../common/components/buttons/TextButton";
import { respondToBookingRequest } from "../../services/coachDashboardApi";
import { COACH_BOOKING_REQUESTS_ROUTE, DASHBOARD_LAYOUT } from "./dashboardTokens";

function RequestItem({ request, onResponded }) {
    const [loading, setLoading] = useState(null);

    const handleRespond = async (isApproved) => {
        setLoading(isApproved ? "approve" : "reject");
        try {
            await respondToBookingRequest(request.bookingRequestId, isApproved);
            onResponded?.(request.bookingRequestId);
        } finally {
            setLoading(null);
        }
    };

    return (
        <Box sx={{ py: DASHBOARD_LAYOUT.listItemPaddingY }}>
            <Box sx={{ display: "flex", gap: 2 }}>
                <Avatar
                    src={request.candidateProfilePicture}
                    alt={request.candidateName}
                    sx={{ width: 44, height: 44 }}
                />

                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={600}>
                        {request.candidateName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {[request.candidateJobTitle, request.candidateExperienceYears && `${request.candidateExperienceYears} years exp`]
                            .filter(Boolean)
                            .join(" • ")}
                    </Typography>

                    {request.message && (
                        <Box
                            sx={{
                                mt: 1.5,
                                p: 1.5,
                                borderRadius: 2,
                                bgcolor: "background.default",
                                borderLeft: 3,
                                borderColor: "divider",
                            }}
                        >
                            <Typography variant="body2" color="text.secondary" fontStyle="italic">
                                "{request.message}"
                            </Typography>
                        </Box>
                    )}

                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 1 }}>
                        <CalendarToday sx={{ fontSize: 14, color: "text.secondary" }} />
                        <Typography variant="caption" color="text.secondary">
                            Requested: {new Date(request.requestedAt).toLocaleString()}
                        </Typography>
                    </Box>
                </Box>

                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 1,
                        alignItems: "stretch",
                        justifyContent: "center",
                        minWidth: 116,
                    }}
                >
                    <Box sx={{ minWidth: 110 }}>
                        <SuccessButton
                            size="sm"
                            fullWidth
                            startIcon={<Check fontSize="small" />}
                            loading={loading === "approve"}
                            disabled={loading !== null}
                            onClick={() => handleRespond(true)}
                        >
                            Approve
                        </SuccessButton>
                    </Box>
                    <Box sx={{ minWidth: 110 }}>
                        <DangerButton
                            size="sm"
                            fullWidth
                            startIcon={<Cancel fontSize="small" />}
                            loading={loading === "reject"}
                            disabled={loading !== null}
                            onClick={() => handleRespond(false)}
                        >
                            Reject
                        </DangerButton>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}

export default function PendingRequestsList({ requests, onResponded }) {
    const navigate = useNavigate();

    const displayRequests = [...(requests || [])]
        .sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt))
        .slice(0, DASHBOARD_LAYOUT.panelItemLimit);

    return (
        <BaseCard sx={{ p: DASHBOARD_LAYOUT.cardPadding }}>
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    rowGap: 0.75,
                    mb: DASHBOARD_LAYOUT.cardHeaderMarginBottom,
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Groups sx={{ color: "primary.main", fontSize: 20 }} />
                    <Typography variant="h6" fontWeight={700}>
                        Pending Requests
                    </Typography>
                </Box>

                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: { xs: 1.5, sm: 3 },
                        flexShrink: 0,
                        flexWrap: "nowrap",
                        ml: "auto",
                    }}
                >
                    {requests?.length > 0 && (
                        <Typography variant="body2" fontWeight={700} color="info.main">
                            {requests.length} New
                        </Typography>
                    )}
                    <TextButton size="sm" onClick={() => navigate(COACH_BOOKING_REQUESTS_ROUTE)}>
                        View all
                    </TextButton>
                </Box>
            </Box>

            {!displayRequests.length ? (
                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ py: DASHBOARD_LAYOUT.emptyStatePaddingY, textAlign: "center" }}
                >
                    No pending requests
                </Typography>
            ) : (
                displayRequests.map((req, idx) => (
                    <Box key={req.bookingRequestId}>
                        {idx > 0 && <Divider />}
                        <RequestItem request={req} onResponded={onResponded} />
                    </Box>
                ))
            )}
        </BaseCard>
    );
}
