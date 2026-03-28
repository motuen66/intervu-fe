import { Box, Stack, Typography } from "@mui/material";
import { CalendarCheck2, CheckCircle2, Clock3, Star } from "lucide-react";

const StatCard = ({ icon, label, value, iconBgColor }) => (
    <Box
        sx={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            p: { xs: 1.5, sm: 1.75 },
            bgcolor: "background.paper",
            borderRadius: 2.5,
            border: "1px solid",
            borderColor: "divider",
            minHeight: 92,
            position: "relative",
            overflow: "hidden",
            isolation: "isolate",
            transition: "transform 240ms ease, box-shadow 240ms ease, border-color 240ms ease",
            "&::after": {
                content: '""',
                position: "absolute",
                right: -40,
                top: -36,
                width: 92,
                height: 92,
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(217,249,157,0.34) 0%, rgba(217,249,157,0) 68%)",
                opacity: 0,
                transform: "scale(0.7)",
                transition: "opacity 260ms ease, transform 260ms ease",
                zIndex: -1,
            },
            "&:hover": {
                transform: "translateY(-3px)",
                boxShadow: "0 10px 24px rgba(15, 23, 42, 0.08)",
                borderColor: "rgba(15, 23, 42, 0.16)",
            },
            "&:hover::after": {
                opacity: 1,
                transform: "scale(1)",
            },
        }}
    >
        <Box
            sx={{
                width: 42,
                height: 42,
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
            <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                    mb: 0.2,
                    textTransform: "uppercase",
                    letterSpacing: 0.75,
                    fontWeight: 700,
                    fontSize: "0.66rem",
                    lineHeight: 1.2,
                }}
            >
                {label}
            </Typography>
            <Typography variant="h5" fontWeight={700} sx={{ fontSize: { xs: "1.5rem", sm: "1.8rem" }, lineHeight: 1.1 }}>
                {value}
            </Typography>
        </Box>
    </Box>
);

function InterviewStats({ totalCount, upcomingCount, completedCount, avgScore, nextSessionIn }) {
    return (
        <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            sx={{ mb: 2.5, flexWrap: { sm: "wrap", lg: "nowrap" } }}
        >
            <StatCard
                icon={<CheckCircle2 size={20} strokeWidth={1.8} color="var(--mui-palette-primary-main)" />}
                label="Total Conducted"
                value={totalCount}
                iconBgColor="primary.lighter"
            />
            <StatCard
                icon={<CalendarCheck2 size={20} strokeWidth={1.8} color="var(--mui-palette-secondary-main)" />}
                label="Upcoming Sessions"
                value={upcomingCount}
                iconBgColor="secondary.lighter"
            />
            <StatCard
                icon={<Star size={20} strokeWidth={1.8} color="var(--mui-palette-warning-main)" />}
                label="Average Score"
                value={avgScore ? `${avgScore}/10` : completedCount > 0 ? "0.0/10" : "—"}
                iconBgColor="warning.lighter"
            />
            <StatCard
                icon={<Clock3 size={20} strokeWidth={1.8} color="var(--mui-palette-info-main)" />}
                label="Next Session In"
                value={nextSessionIn}
                iconBgColor="info.lighter"
            />
        </Stack>
    );
}

export default InterviewStats;
