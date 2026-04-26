import Box from "@mui/material/Box";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import ToggleButton from "@mui/material/ToggleButton";
import { CalendarMonth } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import PrimaryButton from "../../../../common/components/buttons/PrimaryButton";
import PageHeader from "../../../../common/components/PageHeader";
import { COACH_SCHEDULE_ROUTE } from "./dashboardTokens";

export default function DashboardHeader({ period, onPeriodChange }) {
    const navigate = useNavigate();

    return (
        <PageHeader
            title="Coach Dashboard"
            subtitle="Welcome back! Here's what's happening with your sessions."
            actions={
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
                        size="md"
                        startIcon={<CalendarMonth />}
                        onClick={() => navigate(COACH_SCHEDULE_ROUTE)}
                    >
                        Manage Schedule
                    </PrimaryButton>
                </Box>
            }
        />
    );
}
