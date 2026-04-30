import { useTheme } from "@mui/material/styles";
import { useMemo } from "react";
import { DEFAULT_VARIANT, metricVariantMap } from "./variants";

// Walk a dot-path against the resolved theme.palette.
// e.g. "primary.main" → theme.palette.primary.main, "accents.purple" → theme.palette.accents.purple
function resolvePalettePath(palette, path) {
    if (!path) return undefined;
    return path.split(".").reduce((acc, key) => (acc == null ? acc : acc[key]), palette);
}

export default function useMetricVariant(variant = DEFAULT_VARIANT) {
    const theme = useTheme();

    return useMemo(() => {
        const def = metricVariantMap[variant] ?? metricVariantMap[DEFAULT_VARIANT];

        if (!metricVariantMap[variant] && import.meta.env?.DEV) {
            // eslint-disable-next-line no-console
            console.warn(
                `[MetricCard] Unknown variant "${variant}", falling back to "${DEFAULT_VARIANT}".`,
            );
        }

        return {
            glow: resolvePalettePath(theme.palette, def.glow),
            watermark: resolvePalettePath(theme.palette, def.watermark),
            accentFrom: resolvePalettePath(theme.palette, def.accentGradientFrom),
            accentVia: resolvePalettePath(theme.palette, def.accentGradientVia),
        };
    }, [theme, variant]);
}
