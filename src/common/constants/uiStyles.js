// Shared UI pattern styles (sx objects) built on top of the MUI theme.
// Keep these styles semantic and reusable across features to avoid copy/paste sx blocks.

export const buttonStyles = {
    primaryCta: (theme) => ({
        textTransform: "none",
        fontWeight: 600,
        px: 3,
        py: 1,
        borderRadius: "999px",
        bgcolor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
        boxShadow: `0 10px 24px rgba(79, 70, 229, 0.32)`,
        "&:hover": {
            bgcolor: theme.palette.primary.dark,
        },
    }),
    secondaryCta: (theme) => ({
        textTransform: "none",
        fontWeight: 600,
        px: 3,
        py: 1,
        borderRadius: "999px",
    }),
    dangerCta: (theme) => ({
        textTransform: "none",
        fontWeight: 600,
        px: 3,
        py: 1,
        borderRadius: "999px",
        bgcolor: theme.palette.error.main,
        color: theme.palette.error.contrastText,
        boxShadow: `0 10px 24px rgba(239, 68, 68, 0.20)`,
        "&:hover": {
            bgcolor: theme.palette.error.dark,
        },
    }),
};

export const fieldStyles = {
    outlinedFocus: (theme) => ({
        "& .MuiOutlinedInput-root": {
            "&:hover fieldset": { borderColor: theme.palette.primary.main },
            "&.Mui-focused fieldset": { borderColor: theme.palette.primary.main },
        },
        "& .MuiInputLabel-root.Mui-focused": { color: theme.palette.primary.main },
    }),
};

export const dialogStyles = {
    paper: (theme) => ({
        borderRadius: 12,
        bgcolor: theme.palette.background.paper,
        border: "1px solid",
        borderColor: theme.palette.divider,
        backgroundImage: "none",
    }),
};

