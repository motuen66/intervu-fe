import { Box, Paper } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { AppText } from "../../../../common/components";

const FEATURED_TOPICS = [
    { label: "Latest Amazon Solution Architect questions", icon: "☁️", palette: "warning" },
    { label: "Popular machine learning questions", icon: "💡", palette: "secondary" },
    { label: "Data engineering interviews", icon: "🗄️", palette: "error" },
    { label: "System design deep-dives", icon: "🏗️", palette: "primary" },
    { label: "Behavioral & leadership questions", icon: "🌿", palette: "success" },
];

export default function FeaturedTopics({ onTopicClick }) {
    return (
        <Box
            sx={{
                display: "flex",
                gap: 1.5,
                overflowX: "auto",
                pb: 1,
                mb: 3.5,
                scrollbarWidth: "none",
                "&::-webkit-scrollbar": { display: "none" },
            }}
        >
            {FEATURED_TOPICS.map((t) => (
                <Paper
                    key={t.label}
                    variant="outlined"
                    onClick={() => onTopicClick?.(t)}
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        borderRadius: 2,
                        px: 2.25,
                        py: 1.75,
                        minWidth: 220,
                        flexShrink: 0,
                        cursor: "pointer",
                        transition: "box-shadow 0.15s",
                        "&:hover": { boxShadow: 3 },
                    }}
                >
                    <Box
                        sx={(theme) => ({
                            width: 40,
                            height: 40,
                            borderRadius: 1.5,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 20,
                            flexShrink: 0,
                            bgcolor: alpha(theme.palette[t.palette].main, 0.12),
                        })}
                    >
                        {t.icon}
                    </Box>
                    <AppText variant="bodyStrong">
                        {t.label}
                    </AppText>
                </Paper>
            ))}
        </Box>
    );
}
