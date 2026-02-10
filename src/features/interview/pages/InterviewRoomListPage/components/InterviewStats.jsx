import { Box, Stack, Typography } from "@mui/material";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import StarOutlineIcon from "@mui/icons-material/StarOutline";

const StatCard = ({ icon, label, value, iconBgColor, iconColor }) => (
    <Box
        sx={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: 2,
            p: 2.5,
            bgcolor: "background.paper",
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
        }}
    >
        <Box
            sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: iconBgColor,
            }}
        >
            {icon}
        </Box>
        <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                {label}
            </Typography>
            <Typography variant="h5" fontWeight={700}>
                {value}
            </Typography>
        </Box>
    </Box>
);

function InterviewStats({ upcomingCount, completedCount, avgScore }) {
    return (
        <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            sx={{ mb: 4 }}
        >
            <StatCard
                icon={<CalendarTodayIcon sx={{ color: "primary.main", fontSize: 24 }} />}
                label="Upcoming"
                value={upcomingCount}
                iconBgColor="primary.lighter"
                iconColor="primary.main"
            />
            <StatCard
                icon={<CheckCircleOutlineIcon sx={{ color: "secondary.main", fontSize: 24 }} />}
                label="Completed"
                value={completedCount}
                iconBgColor="secondary.lighter"
                iconColor="secondary.main"
            />
            <StatCard
                icon={<StarOutlineIcon sx={{ color: "warning.main", fontSize: 24 }} />}
                label="Avg. Score"
                value={avgScore ? `${avgScore}/10` : "—"}
                iconBgColor="warning.lighter"
                iconColor="warning.main"
            />
        </Stack>
    );
}

export default InterviewStats;
