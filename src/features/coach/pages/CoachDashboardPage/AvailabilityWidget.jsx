import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import { CalendarMonth } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import BaseCard from "../../../../common/components/cards/BaseCard";
import { COACH_SCHEDULE_ROUTE, DASHBOARD_LAYOUT } from "./dashboardTokens";

export default function AvailabilityWidget({ availability }) {
    const navigate = useNavigate();

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
                    <CalendarMonth sx={{ color: "info.main", fontSize: 20 }} />
                    <Typography variant="h6" fontWeight={700}>
                        Availability
                    </Typography>
                </Box>
                <Button
                    size="small"
                    onClick={() => navigate(COACH_SCHEDULE_ROUTE)}
                    sx={{
                        textTransform: "none",
                        minWidth: "auto",
                        px: "10%",
                        py: 0.35,
                        borderRadius: 1.5,
                        bgcolor: "action.hover",
                        "&:hover": { bgcolor: "action.selected" },
                        fontWeight: 600,
                        fontSize: "0.8125rem",
                        flexShrink: 0,
                    }}
                >
                    Manage
                </Button>
            </Box>

            {!availability?.length ? (
                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ py: DASHBOARD_LAYOUT.emptyStatePaddingY, textAlign: "center" }}
                >
                    No availability set
                </Typography>
            ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                    {availability.slice(0, 7).map((day, idx) => {
                        const totalSlots = day.timeSlots?.length || 0;
                        const previewSlots = (day.timeSlots || []).slice(0, 2);
                        const moreCount = Math.max(totalSlots - previewSlots.length, 0);

                        return (
                            <Box key={day.dayOfWeek}>
                                {idx > 0 && <Divider sx={{ mb: 1.25 }} />}

                                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    <Typography variant="body2" fontWeight={600} sx={{ minWidth: 40 }}>
                                        {day.dayOfWeek}
                                    </Typography>

                                    {totalSlots > 0 ? (
                                        <Box sx={{ textAlign: "right", minWidth: 160 }}>
                                            <Typography variant="body2" fontWeight={700} color="info.main">
                                                {totalSlots} slots
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {previewSlots.join(" • ")}
                                                {moreCount > 0 ? `  +${moreCount} more` : ""}
                                            </Typography>
                                        </Box>
                                    ) : (
                                        <Typography variant="caption" color="text.disabled" fontStyle="italic">
                                            No slots
                                        </Typography>
                                    )}
                                </Box>
                            </Box>
                        );
                    })}
                </Box>
            )}
        </BaseCard>
    );
}
