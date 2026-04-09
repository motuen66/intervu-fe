import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import ToggleButton from "@mui/material/ToggleButton";
import { CalendarMonth } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import PrimaryButton from "../../../../common/components/buttons/PrimaryButton";
import { COACH_SCHEDULE_ROUTE } from "./dashboardTokens";

export default function DashboardHeader({ period, onPeriodChange }) {
    const navigate = useNavigate();

    return (
        <Box
            sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: { xs: "flex-start", md: "center" },
                flexDirection: { xs: "column", md: "row" },
                gap: 2,
            }}
        >
            <Box>
                <Typography variant="h5" fontWeight={700}>
                    Coach Dashboard
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Welcome back! Here's what's happening with your sessions.
                </Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
                <ToggleButtonGroup
                    value={period}
                    exclusive
                    onChange={(_, val) => val && onPeriodChange(val)}
                    size="small"
                    sx={{
                        "& .MuiToggleButton-root": {
                            textTransform: "none",
                            px: 2,
                            py: 0.5,
                            fontSize: "0.8125rem",
                            fontWeight: 600,
                            borderColor: "divider",
                            "&.Mui-selected": {
                                bgcolor: "primary.main",
                                color: "primary.contrastText",
                                "&:hover": { bgcolor: "primary.dark" },
                            },
                        },
                    }}
                >
                    <ToggleButton value="7days">7 Days</ToggleButton>
                    <ToggleButton value="month">This Month</ToggleButton>
                    <ToggleButton value="year">This Year</ToggleButton>
                </ToggleButtonGroup>

                <PrimaryButton
                    startIcon={<CalendarMonth />}
                    onClick={() => navigate(COACH_SCHEDULE_ROUTE)}
                    sx={{ textTransform: "none" }}
                >
                    Manage Schedule
                </PrimaryButton>
            </Box>
        </Box>
    );
}
