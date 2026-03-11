// Shared UI pattern styles (sx objects) built on top of the MUI theme.
// Use these instead of writing ad-hoc sx blocks.

// ─── Buttons ──────────────────────────────────────────────────────────────────
export const buttonStyles = {
    // Navy solid — main CTA ("Book now", "Get the app", page actions)
    primaryCta: (theme) => ({
        textTransform: "none",
        fontWeight: 700,
        px: 3,
        py: 1.25,
        borderRadius: "8px",
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
        transition: "all 0.2s ease",
        "&:hover": {
            backgroundColor: theme.palette.primary.light,
            boxShadow: "0 4px 14px rgba(15, 23, 42, 0.25)",
        },
        "&:active": { transform: "scale(0.97)" },
    }),

    // Lime solid — AI features, "Join Room", featured actions
    accentCta: (theme) => ({
        textTransform: "none",
        fontWeight: 700,
        px: 3,
        py: 1.25,
        borderRadius: "8px",
        backgroundColor: theme.palette.secondary.main,
        color: theme.palette.secondary.contrastText,
        transition: "all 0.2s ease",
        "&:hover": {
            backgroundColor: theme.palette.secondary.dark,
            boxShadow: "0 4px 14px rgba(217, 249, 157, 0.5)",
        },
        "&:active": { transform: "scale(0.97)" },
    }),

    // Ghost — outlined secondary actions
    secondaryCta: (theme) => ({
        textTransform: "none",
        fontWeight: 600,
        px: 3,
        py: 1.125,
        borderRadius: "8px",
        backgroundColor: "transparent",
        color: theme.palette.text.primary,
        border: `1px solid ${theme.palette.divider}`,
        transition: "all 0.2s ease",
        "&:hover": {
            backgroundColor: theme.palette.action.hover,
            borderColor: theme.palette.text.secondary,
        },
    }),

    // Danger — destructive actions (Cancel, Delete)
    dangerCta: (theme) => ({
        textTransform: "none",
        fontWeight: 600,
        px: 3,
        py: 1.125,
        borderRadius: "8px",
        backgroundColor: "transparent",
        color: theme.palette.error.main,
        border: `1px solid`,
        borderColor: theme.palette.error.main,
        transition: "all 0.2s ease",
        "&:hover": {
            backgroundColor: "rgba(239, 68, 68, 0.06)",
            boxShadow: "0 4px 12px rgba(239, 68, 68, 0.15)",
        },
    }),
};

// ─── Form Fields ───────────────────────────────────────────────────────────────
export const fieldStyles = {
    outlinedFocus: (theme) => ({
        "& .MuiOutlinedInput-root": {
            "& fieldset": { borderColor: theme.palette.divider },
            "&:hover fieldset": { borderColor: theme.palette.text.secondary },
            "&.Mui-focused": {
                boxShadow: `0 0 0 3px rgba(15, 23, 42, 0.08)`,
            },
            "&.Mui-focused fieldset": {
                borderColor: theme.palette.primary.main,
                borderWidth: "2px",
            },
        },
        "& .MuiInputLabel-root.Mui-focused": { color: theme.palette.primary.main },
    }),
};

// ─── Modals / Dialogs ──────────────────────────────────────────────────────────
export const dialogStyles = {
    paper: (theme) => ({
        borderRadius: "16px",
        backgroundColor: theme.palette.background.paper,
        border: "1px solid",
        borderColor: theme.palette.divider,
        boxShadow: "0 20px 40px -10px rgba(15, 23, 42, 0.15)",
        backgroundImage: "none",
    }),
};

// ─── Dark surface (Stats cards, icon containers in mockup) ─────────────────────
export const darkSurface = {
    base: {
        backgroundColor: "#1E293B",
        borderRadius: "12px",
        color: "#FFFFFF",
    },
};
