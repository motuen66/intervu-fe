import Typography from "@mui/material/Typography";

const variantMap = {
    body: { variant: "body1", sx: { fontSize: "0.875rem", lineHeight: 1.6, color: "text.primary" } },
    bodyStrong: { variant: "body1", sx: { fontSize: "0.875rem", lineHeight: 1.6, color: "text.primary", fontWeight: 600 } },
    caption: { variant: "caption", sx: { fontSize: "0.75rem", lineHeight: 1.5, color: "text.secondary" } },
    label: { variant: "body2", sx: { fontSize: "0.8125rem", lineHeight: 1.5, fontWeight: 500, color: "text.secondary" } },
    overline: {
        variant: "overline",
        sx: { fontSize: "0.6875rem", lineHeight: 1.4, fontWeight: 600, letterSpacing: "0.08em", color: "text.secondary" },
    },
    muted: { variant: "body2", sx: { fontSize: "0.875rem", lineHeight: 1.5, color: "text.secondary" } },
};

export default function AppText({ variant = "body", sx, ...props }) {
    const mapped = variantMap[variant] || variantMap.body;
    return <Typography {...props} variant={mapped.variant} sx={{ ...mapped.sx, ...sx }} />;
}
