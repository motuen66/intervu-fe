// Shared UI pattern styles (sx objects) built on top of the MUI theme.
// Use these instead of writing ad-hoc sx blocks.

// ─── Buttons ──────────────────────────────────────────────────────────────────
const buttonSizeStyles = {
    sm: { minHeight: 30, px: 1.5, py: 0.5, fontSize: "0.8125rem", borderRadius: "8px" },
    md: { minHeight: 36, px: 2, py: 0.75, fontSize: "0.875rem", borderRadius: "8px" },
    lg: { minHeight: 42, px: 2.5, py: 1, fontSize: "0.9375rem", borderRadius: "10px" },
};

const getButtonSize = (size) => buttonSizeStyles[size] || buttonSizeStyles.md;

export const buttonStyles = {
    getSpinnerSize: (size) => {
        if (size === "sm") return 14;
        if (size === "lg") return 18;
        return 16;
    },
    iconOnly: (size) => {
        if (size === "sm") return { minWidth: 30, width: 30, height: 30, p: 0 };
        if (size === "lg") return { minWidth: 42, width: 42, height: 42, p: 0 };
        return { minWidth: 36, width: 36, height: 36, p: 0 };
    },
    // Navy solid — main CTA ("Book now", "Get the app", page actions)
    primaryCta: (theme, size = "md") => ({
        ...getButtonSize(size),
        textTransform: "none",
        fontWeight: 600,
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
    accentCta: (theme, size = "md") => ({
        ...getButtonSize(size),
        textTransform: "none",
        fontWeight: 600,
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
    secondaryCta: (theme, size = "md") => ({
        ...getButtonSize(size),
        textTransform: "none",
        fontWeight: 600,
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
    dangerCta: (theme, size = "md") => ({
        ...getButtonSize(size),
        textTransform: "none",
        fontWeight: 600,
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
    ghostCta: (theme, size = "md") => ({
        ...getButtonSize(size),
        textTransform: "none",
        fontWeight: 600,
        backgroundColor: "transparent",
        color: theme.palette.text.secondary,
        border: "1px solid transparent",
        "&:hover": {
            backgroundColor: theme.palette.action.hover,
            color: theme.palette.text.primary,
        },
    }),
};

// ─── Form Fields ───────────────────────────────────────────────────────────────
export const fieldStyles = {
    outlinedFocus: (theme, sizeVariant = "md") => ({
        "& .MuiFormLabel-asterisk": { color: theme.palette.error.main },
        "& .MuiInputLabel-root": {
            fontSize: "0.8125rem",
        },
        "& .MuiFormHelperText-root": {
            minHeight: "1.25rem",
            marginLeft: 0,
            marginRight: 0,
            marginTop: 0.5,
            fontSize: "0.75rem",
            lineHeight: 1.35,
        },
        "& .MuiOutlinedInput-root": {
            minHeight: sizeVariant === "sm" ? 34 : 38,
            fontSize: sizeVariant === "sm" ? "0.8125rem" : "0.875rem",
            "& input[type='password']::-ms-reveal": {
                display: "none",
            },
            "& input[type='password']::-ms-clear": {
                display: "none",
            },
            "& .MuiInputBase-input:-webkit-autofill": {
                WebkitTextFillColor: theme.palette.text.primary,
                caretColor: theme.palette.text.primary,
                boxShadow: `0 0 0 1000px ${theme.palette.background.paper} inset`,
                WebkitBoxShadow: `0 0 0 1000px ${theme.palette.background.paper} inset`,
                transition: "background-color 9999s ease-out, color 9999s ease-out",
                borderRadius: "inherit",
            },
            "& .MuiInputBase-input:-webkit-autofill:hover": {
                WebkitTextFillColor: theme.palette.text.primary,
                boxShadow: `0 0 0 1000px ${theme.palette.background.paper} inset`,
                WebkitBoxShadow: `0 0 0 1000px ${theme.palette.background.paper} inset`,
            },
            "& .MuiInputBase-input:-webkit-autofill:focus": {
                WebkitTextFillColor: theme.palette.text.primary,
                boxShadow: `0 0 0 1000px ${theme.palette.background.paper} inset`,
                WebkitBoxShadow: `0 0 0 1000px ${theme.palette.background.paper} inset`,
            },
            "& fieldset": { borderColor: theme.palette.divider },
            "&:hover fieldset": { borderColor: theme.palette.text.secondary },
            "&.Mui-focused": {
                boxShadow: `0 0 0 3px rgba(15, 23, 42, 0.08)`,
            },
            "&.Mui-focused fieldset": {
                borderColor: theme.palette.primary.main,
                borderWidth: "2px",
            },
            "&.Mui-error fieldset": {
                borderColor: theme.palette.error.main,
                borderWidth: "1.5px",
            },
            "&.Mui-error.Mui-focused": {
                boxShadow: `0 0 0 3px rgba(239, 68, 68, 0.12)`,
            },
        },
        "& .MuiInputLabel-root.Mui-focused": { color: theme.palette.primary.main },
        "& .MuiInputLabel-root.Mui-error": { color: theme.palette.error.main },
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
