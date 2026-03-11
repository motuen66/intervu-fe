import { Box, Stack, Typography } from "@mui/material";
import { Calendar, CheckCircle, Star } from "lucide-react";

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
                icon={<Calendar size={24} strokeWidth={1.5} color="var(--mui-palette-primary-main)" />}
                label="Upcoming"
                value={upcomingCount}
                iconBgColor="primary.lighter"
                iconColor="primary.main"
            />
            <StatCard
                icon={<CheckCircle size={24} strokeWidth={1.5} color="var(--mui-palette-secondary-main)" />}
                label="Completed"
                value={completedCount}
                iconBgColor="secondary.lighter"
                iconColor="secondary.main"
            />
            <StatCard
                icon={<Star size={24} strokeWidth={1.5} color="var(--mui-palette-warning-main)" />}
                label="Avg. Score"
                value={avgScore ? `${avgScore}/10` : "—"}
                iconBgColor="warning.lighter"
                iconColor="warning.main"
            />
        </Stack>
    );
}

export default InterviewStats;
