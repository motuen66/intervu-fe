import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import { CalendarMonth, Add } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import BaseCard from "../../../../common/components/cards/BaseCard";
import { DASHBOARD_LAYOUT } from "./dashboardTokens";

export default function AvailabilityWidget({ availability }) {
    const navigate = useNavigate();

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
                    <CalendarMonth sx={{ color: "info.main", fontSize: 20 }} />
                    <Typography variant="h6" fontWeight={700}>
                        Availability
                    </Typography>
                </Box>
                <IconButton size="small" onClick={() => navigate("/coach/schedule")}>
                    <Add fontSize="small" />
                </IconButton>
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
                    {availability.map((day) => (
                        <Box
                            key={day.dayOfWeek}
                            sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
                        >
                            <Typography variant="body2" fontWeight={500} sx={{ minWidth: 36 }}>
                                {day.dayOfWeek}
                            </Typography>
                            <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", justifyContent: "flex-end" }}>
                                {day.timeSlots?.length > 0 ? (
                                    day.timeSlots.map((slot) => (
                                        <Chip
                                            key={slot}
                                            label={slot}
                                            size="small"
                                            sx={{
                                                fontWeight: 600,
                                                fontSize: "0.75rem",
                                                bgcolor: "info.main",
                                                color: "info.contrastText",
                                            }}
                                        />
                                    ))
                                ) : (
                                    <Typography variant="caption" color="text.disabled" fontStyle="italic">
                                        No slots
                                    </Typography>
                                )}
                            </Box>
                        </Box>
                    ))}
                </Box>
            )}
        </BaseCard>
    );
}
