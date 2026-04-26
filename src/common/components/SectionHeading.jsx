import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

const sizeMap = {
    sm: { titleSize: "1rem", descSize: "0.8125rem" },
    md: { titleSize: "1.125rem", descSize: "0.875rem" },
};

export default function SectionHeading({
    title,
    description,
    action,
    icon,
    size = "md",
    as = "h2",
    disableGutters = false,
}) {
    const config = sizeMap[size] || sizeMap.md;

    return (
        <Stack
            direction="row"
            justifyContent="space-between"
            alignItems={description ? "flex-start" : "center"}
            sx={{ mb: disableGutters ? 0 : 1.5, gap: 1 }}
        >
            <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
                {icon ? (
                    <Box sx={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                        {icon}
                    </Box>
                ) : null}
                <Box sx={{ minWidth: 0 }}>
                    <Typography component={as} sx={{ fontSize: config.titleSize, fontWeight: 600, lineHeight: 1.4 }}>
                        {title}
                    </Typography>
                    {description ? (
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: config.descSize, mt: 0.25 }}>
                            {description}
                        </Typography>
                    ) : null}
                </Box>
            </Stack>
            {action ? <Box sx={{ flexShrink: 0 }}>{action}</Box> : null}
        </Stack>
    );
}
