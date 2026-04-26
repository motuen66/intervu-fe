import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

export default function PageHeader({ title, subtitle, actions, backTo, breadcrumb }) {
    return (
        <Stack spacing={1.25} sx={{ mb: 3 }}>
            {breadcrumb ? <Box>{breadcrumb}</Box> : null}

            <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", sm: "center" }}
                spacing={1.5}
            >
                <Stack direction="row" spacing={1} alignItems="center">
                    {backTo ? (
                        <IconButton
                            size="small"
                            onClick={typeof backTo === "function" ? backTo : undefined}
                            href={typeof backTo === "string" ? backTo : undefined}
                            aria-label="Go back"
                        >
                            <ArrowBackRoundedIcon fontSize="small" />
                        </IconButton>
                    ) : null}
                    <Box>
                        <Typography variant="h1" sx={{ fontSize: { xs: "1.375rem", md: "1.625rem" }, fontWeight: 700 }}>
                            {title}
                        </Typography>
                        {subtitle ? (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, fontSize: "0.875rem" }}>
                                {subtitle}
                            </Typography>
                        ) : null}
                    </Box>
                </Stack>
                {actions ? <Box sx={{ width: { xs: "100%", sm: "auto" } }}>{actions}</Box> : null}
            </Stack>
        </Stack>
    );
}
