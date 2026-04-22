import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

const sizeMap = {
    sm: { titleSize: "1rem", descSize: "0.8125rem" },
    md: { titleSize: "1.125rem", descSize: "0.875rem" },
};

export default function SectionHeading({ title, description, action, size = "md", as = "h2" }) {
    const config = sizeMap[size] || sizeMap.md;

    return (
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5, gap: 1 }}>
            <Box>
                <Typography component={as} sx={{ fontSize: config.titleSize, fontWeight: 600, lineHeight: 1.4 }}>
                    {title}
                </Typography>
                {description ? (
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: config.descSize, mt: 0.25 }}>
                        {description}
                    </Typography>
                ) : null}
            </Box>
            {action ? <Box>{action}</Box> : null}
        </Stack>
    );
}
