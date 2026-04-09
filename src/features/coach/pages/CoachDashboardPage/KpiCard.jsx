import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import BaseCard from "../../../../common/components/cards/BaseCard";

export default function KpiCard({ icon, iconColor = "primary", label, value, growthPercent }) {
    const isPositive = growthPercent > 0;
    const growthColor = isPositive ? "success" : growthPercent < 0 ? "error" : "text.disabled";

    return (
        <BaseCard sx={{ p: 2.5 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                <Box
                    sx={(theme) => ({
                        width: 44,
                        height: 44,
                        borderRadius: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: alpha(theme.palette[iconColor]?.main || theme.palette.primary.main, 0.1),
                        color: `${iconColor}.main`,
                    })}
                >
                    {icon}
                </Box>

                {growthPercent !== undefined && growthPercent !== 0 && (
                    <Box
                        sx={(theme) => ({
                            px: 1,
                            py: 0.25,
                            borderRadius: 1.5,
                            bgcolor: alpha(
                                isPositive ? theme.palette.success.main : theme.palette.error.main,
                                0.1,
                            ),
                            color: growthColor,
                        })}
                    >
                        <Typography variant="caption" fontWeight={700}>
                            {isPositive ? "+" : ""}
                            {growthPercent}%
                        </Typography>
                    </Box>
                )}
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                {label}
            </Typography>
            <Typography variant="h4" fontWeight={700}>
                {value}
            </Typography>
        </BaseCard>
    );
}
