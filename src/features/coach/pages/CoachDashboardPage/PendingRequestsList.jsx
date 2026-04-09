import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import Divider from "@mui/material/Divider";
import { Groups, CalendarToday, Check, Cancel } from "@mui/icons-material";
import BaseCard from "../../../../common/components/cards/BaseCard";
import SuccessButton from "../../../../common/components/buttons/SuccessButton";
import DangerButton from "../../../../common/components/buttons/DangerButton";
import { respondToBookingRequest } from "../../services/coachDashboardApi";
import { DASHBOARD_LAYOUT } from "./dashboardTokens";

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

                <Box sx={{ display: "flex", flexDirection: "column", gap: 1, alignItems: "flex-end" }}>
                    <SuccessButton
                        size="small"
                        startIcon={<Check />}
                        loading={loading === "approve"}
                        disabled={loading !== null}
                        onClick={() => handleRespond(true)}
                        sx={{ textTransform: "none", minWidth: 100 }}
                    >
                        Approve
                    </SuccessButton>
                    <DangerButton
                        size="small"
                        startIcon={<Cancel />}
                        loading={loading === "reject"}
                        disabled={loading !== null}
                        onClick={() => handleRespond(false)}
                        sx={{ textTransform: "none", minWidth: 100 }}
                    >
                        Reject
                    </DangerButton>
                </Box>
            </Box>
        </Box>
    );
}

export default function PendingRequestsList({ requests, onResponded }) {
    return (
        <BaseCard sx={{ p: DASHBOARD_LAYOUT.cardPadding }}>
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: DASHBOARD_LAYOUT.cardHeaderMarginBottom,
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Groups sx={{ color: "primary.main", fontSize: 20 }} />
                    <Typography variant="h6" fontWeight={700}>
                        Pending Requests
                    </Typography>
                </Box>

                {requests?.length > 0 && (
                    <Typography variant="body2" fontWeight={700} color="info.main">
                        {requests.length} New
                    </Typography>
                )}
            </Box>

            {!requests?.length ? (
                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ py: DASHBOARD_LAYOUT.emptyStatePaddingY, textAlign: "center" }}
                >
                    No pending requests
                </Typography>
            ) : (
                requests.map((req, idx) => (
                    <Box key={req.bookingRequestId}>
                        {idx > 0 && <Divider />}
                        <RequestItem request={req} onResponded={onResponded} />
                    </Box>
                ))
            )}
        </BaseCard>
    );
}
