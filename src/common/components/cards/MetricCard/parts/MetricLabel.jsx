import Typography from "@mui/material/Typography";
import { metricCardTokens } from "../tokens";

export default function MetricLabel({ children, id }) {
    const t = metricCardTokens.type.label;
    return (
        <Typography
            id={id}
            component="p"
            sx={{
                fontSize: t.fontSize,
                fontWeight: t.fontWeight,
                letterSpacing: t.letterSpacing,
                textTransform: t.textTransform,
                color: "text.secondary",
                lineHeight: 1.4,
                m: 0,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                position: "relative",
                zIndex: 1,
            }}
        >
            {children}
        </Typography>
    );
}
