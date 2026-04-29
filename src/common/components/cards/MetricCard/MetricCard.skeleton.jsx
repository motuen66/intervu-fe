import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import { alpha } from "@mui/material/styles";
import { metricCardTokens } from "./tokens";

export default function MetricCardSkeleton({ size = "md" }) {
    const { radius, shadow, spacing } = metricCardTokens;

    return (
        <Box
            aria-busy="true"
            sx={(theme) => ({
                position: "relative",
                bgcolor: "background.paper",
                borderRadius: radius.card,
                border: "1px solid",
                borderColor: alpha(theme.palette.divider, 0.8),
                boxShadow: shadow.rest,
                p: spacing.padding[size],
                minHeight: 168,
                display: "flex",
                flexDirection: "column",
                gap: 2.5,
            })}
        >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Skeleton
                    variant="rounded"
                    width={spacing.iconBoxPx}
                    height={spacing.iconBoxPx}
                    sx={{ borderRadius: radius.icon }}
                />
                <Skeleton variant="rounded" width={72} height={28} sx={{ borderRadius: radius.badge }} />
            </Box>
            <Box>
                <Skeleton variant="text" width={120} height={14} sx={{ mb: 1.5 }} />
                <Skeleton variant="text" width={140} height={40} />
            </Box>
        </Box>
    );
}
