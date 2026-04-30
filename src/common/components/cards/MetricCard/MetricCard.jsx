import Box from "@mui/material/Box";
import { useId } from "react";
import { Link as RouterLink } from "react-router-dom";

import AmbientLayer from "./parts/AmbientLayer";
import BottomAccent from "./parts/BottomAccent";
import CardSurface from "./parts/CardSurface";
import IconSlot from "./parts/IconSlot";
import MetricLabel from "./parts/MetricLabel";
import MetricValue from "./parts/MetricValue";
import TrendBadge from "./parts/TrendBadge";

import MetricCardSkeleton from "./MetricCard.skeleton";
import formatMetric from "./formatMetric";
import { metricCardTokens } from "./tokens";
import useMetricVariant from "./useMetricVariant";
import { DEFAULT_VARIANT } from "./variants";

// Premium SaaS metric card. Layer model:
//   <CardSurface>            <- shell (radius, lift, shadow, dot-mesh)
//     <AmbientLayer/>        <- glow + watermark icon (decorative, aria-hidden)
//     <Content>
//       <Header> IconSlot · TrendBadge </Header>
//       <Body>   Label · Value </Body>
//       {slots.footer}
//     </Content>
//     <BottomAccent/>        <- 2px gradient line, hover-only
export default function MetricCard({
    label,
    value,
    formatter,
    icon,
    watermarkIcon,
    trend,
    variant = DEFAULT_VARIANT,
    size = "md",
    loading = false,
    accentDot = true,
    onClick,
    href,
    to,
    slots = {},
    slotProps = {},
    "data-testid": dataTestId,
    ...rest
}) {
    const labelId = useId();
    const valueId = useId();
    const tokens = useMetricVariant(variant);

    if (loading) return <MetricCardSkeleton size={size} />;

    const interactive = Boolean(onClick || href || to);
    const formattedValue = formatter ? formatter(value) : formatMetric(value);

    const ariaSummary = [
        label,
        typeof formattedValue === "string" || typeof formattedValue === "number"
            ? formattedValue
            : null,
        trend && typeof trend.value === "number"
            ? `trend ${trend.value > 0 ? "up" : trend.value < 0 ? "down" : "flat"} ${Math.abs(trend.value)} percent`
            : null,
    ]
        .filter(Boolean)
        .join(", ");

    const surfaceProps = interactive
        ? {
              component: to ? RouterLink : href ? "a" : "button",
              ...(to ? { to } : {}),
              ...(href ? { href } : {}),
              onClick,
              "aria-label": ariaSummary,
              ...(!to && !href ? { type: "button" } : {}),
          }
        : {
              component: "article",
              "aria-labelledby": labelId,
              "aria-describedby": valueId,
          };

    const surfaceSx = (theme) => ({
        p: metricCardTokens.spacing.padding[size],
        minHeight: 168,
        textAlign: "left",
        textDecoration: "none",
        color: "inherit",
        font: "inherit",
        width: "100%",
        display: "block",
        // When the surface is rendered as <button>, neutralize UA defaults.
        ...(interactive ? { background: "transparent", appearance: "none" } : {}),
        ...(typeof slotProps.root === "function" ? slotProps.root(theme) : slotProps.root),
    });

    return (
        <CardSurface
            interactive={interactive}
            sx={surfaceSx}
            data-testid={dataTestId}
            {...surfaceProps}
            {...rest}
        >
            <AmbientLayer
                glowColor={tokens.glow}
                watermarkColor={tokens.watermark}
                watermarkIcon={watermarkIcon ?? icon}
            />

            <Box
                sx={{
                    position: "relative",
                    zIndex: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: 3,
                }}
            >
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 2,
                    }}
                >
                    <IconSlot icon={icon} />
                    {slots.topRight ?? <TrendBadge trend={trend} />}
                </Box>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    <MetricLabel id={labelId}>{label}</MetricLabel>
                    <MetricValue id={valueId} size={size} showAccentDot={accentDot}>
                        {formattedValue}
                    </MetricValue>
                </Box>

                {slots.bottomLeft && (
                    <Box sx={{ position: "relative", zIndex: 1 }}>{slots.bottomLeft}</Box>
                )}
                {slots.footer && (
                    <Box sx={{ position: "relative", zIndex: 1, mt: "auto" }}>{slots.footer}</Box>
                )}
            </Box>

            <BottomAccent from={tokens.accentFrom} via={tokens.accentVia} />
        </CardSurface>
    );
}
