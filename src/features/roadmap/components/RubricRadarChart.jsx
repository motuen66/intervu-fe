import React, { useMemo } from "react";
import { Box, Typography, useTheme } from "@mui/material";
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from "recharts";

const MAX_SCORE = 10;

function normalizeItems(evaluation) {
    const items = evaluation?.items ?? evaluation?.Items ?? evaluation?.evaluation ?? [];
    if (!Array.isArray(items)) return [];

    return items
        .map((item, index) => {
            const score = Number(item?.score ?? item?.Score ?? 0);
            const label = item?.type ?? item?.Type ?? item?.question ?? item?.Question ?? `Criterion ${index + 1}`;
            return {
                criterion: label,
                current: Number.isFinite(score) ? Math.max(0, Math.min(MAX_SCORE, score)) : 0,
                target: MAX_SCORE * 0.7,
            };
        })
        .filter((item) => item.criterion);
}

export default function RubricRadarChart({ evaluation, title = "Rubric Readiness" }) {
    const theme = useTheme();
    const data = useMemo(() => normalizeItems(evaluation), [evaluation]);

    if (!data.length) {
        return null;
    }

    return (
        <Box
            sx={{
                border: 1,
                borderColor: "divider",
                borderRadius: 2,
                bgcolor: "background.paper",
                p: 1.5,
                mb: 2,
            }}
        >
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
                {title}
            </Typography>
            <Box sx={{ width: "100%", height: 240 }}>
                <ResponsiveContainer>
                    <RadarChart data={data}>
                        <PolarGrid stroke={theme.palette.divider} />
                        <PolarAngleAxis
                            dataKey="criterion"
                            tick={{ fill: theme.palette.text.secondary, fontSize: 11 }}
                        />
                        <PolarRadiusAxis angle={90} domain={[0, MAX_SCORE]} tick={{ fontSize: 10 }} />
                        <Radar
                            name="Target Standard"
                            dataKey="target"
                            stroke={theme.palette.text.disabled}
                            fill={theme.palette.text.disabled}
                            fillOpacity={0.18}
                        />
                        <Radar
                            name="Current Level"
                            dataKey="current"
                            stroke={theme.palette.primary.main}
                            fill={theme.palette.primary.main}
                            fillOpacity={0.28}
                        />
                        <Tooltip />
                    </RadarChart>
                </ResponsiveContainer>
            </Box>
        </Box>
    );
}
