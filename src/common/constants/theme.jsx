import { createTheme } from "@mui/material/styles";

const headingFont = '"Outfit", "Plus Jakarta Sans", "Inter", sans-serif';
const bodyFont = '"Inter", "Roboto", "Helvetica", "Arial", sans-serif';

export const theme = createTheme({
    cssVariables: true,
    palette: {
        mode: "light",
        primary: {
            light: "#334155",       // Slate 700 — hover state
            main: "#0F172A",        // Deep Navy
            dark: "#020617",        // Near-black
            contrastText: "#FFFFFF",
        },
        secondary: {
            light: "#ECFCCB",       // Lime 100
            main: "#D9F99D",        // Electric Lime — AI features, badges, accents
            dark: "#BEF264",        // Lime 300
            contrastText: "#0F172A",
        },
        success: {
            light: "#BBF7D0",
            main: "#22C55E",
            dark: "#16A34A",
            contrastText: "#FFFFFF",
        },
        warning: {
            light: "#FEF08A",
            main: "#EAB308",
            dark: "#CA8A04",
            contrastText: "#0F172A",
        },
        error: {
            light: "#FCA5A5",
            main: "#EF4444",
            dark: "#DC2626",
            contrastText: "#FFFFFF",
        },
        info: {
            light: "#BAE6FD",
            main: "#0EA5E9",
            dark: "#0284C7",
            contrastText: "#FFFFFF",
        },
        background: {
            default: "#F8FAFC",     // Soft Blue-Gray (Slate 50)
            paper: "#FFFFFF",       // Pure White
        },
        divider: "#E2E8F0",         // Slate 200
        text: {
            primary: "#0F172A",     // Sharp Navy
            secondary: "#64748B",   // Muted Slate
            disabled: "#94A3B8",    // Slate 400
        },
        action: {
            hover: "rgba(15, 23, 42, 0.04)",
            selected: "rgba(217, 249, 157, 0.2)",
            disabledBackground: "#F1F5F9",
        },
    },
    typography: {
        fontFamily: bodyFont,
        h1: { fontFamily: headingFont, fontWeight: 800, fontSize: "2.75rem", lineHeight: 1.15, letterSpacing: "-0.03em" },
        h2: { fontFamily: headingFont, fontWeight: 700, fontSize: "2rem", lineHeight: 1.25, letterSpacing: "-0.02em" },
        h3: { fontFamily: headingFont, fontWeight: 700, fontSize: "1.5rem", lineHeight: 1.35, letterSpacing: "-0.01em" },
        h4: { fontFamily: headingFont, fontWeight: 600, fontSize: "1.25rem", lineHeight: 1.4 },
        h5: { fontFamily: headingFont, fontWeight: 600, fontSize: "1rem", lineHeight: 1.5 },
        h6: { fontFamily: headingFont, fontWeight: 600, fontSize: "0.875rem", lineHeight: 1.5 },
        body1: { fontSize: "1rem", lineHeight: 1.6 },
        body2: { fontSize: "0.875rem", lineHeight: 1.6 },
        caption: { fontSize: "0.75rem", lineHeight: 1.5, letterSpacing: "0.04em" },
        overline: { fontFamily: headingFont, fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" },
        button: { fontFamily: headingFont, textTransform: "none", fontWeight: 700, fontSize: "0.9375rem", letterSpacing: "0" },
    },
    shape: {
        borderRadius: 10,  // Rounded-rect base — NOT pill, matching mockup
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                // Background is managed by GlobalStyles in main.jsx
                // to keep all global style config in pure JS/MUI
                html: { scrollBehavior: "smooth" },
                "*, *::before, *::after": { boxSizing: "border-box" },
            },
        },
        MuiButton: {
            defaultProps: { disableElevation: true },
            styleOverrides: {
                root: {
                    borderRadius: 8,    // Rounded-rect as seen in mockup
                    fontWeight: 700,
                    transition: "all 0.2s ease-in-out",
                    "&:active": { transform: "scale(0.98)" },
                },
                sizeSmall: { padding: "5px 14px", fontSize: "0.8125rem" },
                sizeMedium: { padding: "9px 20px" },
                sizeLarge: { padding: "12px 28px", fontSize: "1rem" },
                containedPrimary: {
                    backgroundColor: "#0F172A",
                    color: "#FFFFFF",
                    "&:hover": {
                        backgroundColor: "#1E293B",
                        boxShadow: "0 4px 14px rgba(15, 23, 42, 0.25)",
                    },
                },
                containedSecondary: {
                    backgroundColor: "#D9F99D",
                    color: "#0F172A",
                    "&:hover": {
                        backgroundColor: "#BEF264",
                        boxShadow: "0 4px 14px rgba(217, 249, 157, 0.5)",
                    },
                },
                outlinedPrimary: {
                    borderColor: "#CBD5E1",
                    color: "#0F172A",
                    "&:hover": {
                        backgroundColor: "rgba(15, 23, 42, 0.04)",
                        borderColor: "#64748B",
                    },
                },
                text: {
                    color: "#0F172A",
                    "&:hover": { backgroundColor: "rgba(15, 23, 42, 0.04)" },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 16,
                    // Long, soft, Navy-tinted shadow — "floating" feel as in prototype
                    boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 16px rgba(15, 23, 42, 0.06)",
                    border: "1px solid rgba(226, 232, 240, 0.8)",
                    backgroundColor: "#FFFFFF",
                    transition: "box-shadow 0.3s ease, transform 0.3s ease",
                    "&:hover": {
                        boxShadow: "0 4px 8px rgba(15, 23, 42, 0.06), 0 12px 32px rgba(15, 23, 42, 0.10)",
                    },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                rounded: { borderRadius: 12 },
                // Navy-tinted shadows for all Paper elevations
                elevation1: { boxShadow: "0 1px 2px rgba(15,23,42,0.04), 0 4px 12px rgba(15,23,42,0.05)" },
                elevation2: { boxShadow: "0 2px 4px rgba(15,23,42,0.05), 0 8px 20px rgba(15,23,42,0.07)" },
                elevation3: { boxShadow: "0 4px 8px rgba(15,23,42,0.06), 0 16px 32px rgba(15,23,42,0.09)" },
            },
        },
        MuiAvatar: {
            styleOverrides: {
                root: {
                    // Highlight rule: Lime background, Navy text for text avatars
                    backgroundColor: "#D9F99D",
                    color: "#0F172A",
                    fontWeight: 700,
                },
            },
        },
        MuiRating: {
            styleOverrides: {
                iconFilled: {
                    // Highlight rule: Lime for rating stars
                    color: "#D9F99D",
                },
            },
        },
        MuiTextField: {
            defaultProps: { size: "medium" },
            styleOverrides: {
                root: {
                    "& .MuiOutlinedInput-root": {
                        borderRadius: 8,
                        backgroundColor: "#FFFFFF",
                        "& fieldset": { borderColor: "#E2E8F0" },
                        "&:hover fieldset": { borderColor: "#94A3B8" },
                        "&.Mui-focused fieldset": {
                            borderColor: "#0F172A",
                            borderWidth: "2px",
                        },
                        "&.Mui-focused": {
                            boxShadow: "0 0 0 3px rgba(15, 23, 42, 0.08)",
                        },
                    },
                    "& .MuiInputLabel-root.Mui-focused": { color: "#0F172A" },
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    borderRadius: 6,
                    fontWeight: 600,
                    fontSize: "0.75rem",
                    border: "1px solid #E2E8F0",
                    backgroundColor: "#F8FAFC",
                    color: "#0F172A",
                },
                colorSecondary: {
                    backgroundColor: "#D9F99D",
                    color: "#0F172A",
                    border: "none",
                },
                colorPrimary: {
                    backgroundColor: "#0F172A",
                    color: "#FFFFFF",
                    border: "none",
                },
            },
        },
        MuiTabs: {
            styleOverrides: {
                indicator: {
                    backgroundColor: "#0F172A",
                    height: 3,
                    borderRadius: "3px 3px 0 0",
                },
            },
        },
        MuiTab: {
            styleOverrides: {
                root: {
                    fontFamily: headingFont,
                    textTransform: "none",
                    fontWeight: 600,
                    fontSize: "0.9375rem",
                    color: "#64748B",
                    "&.Mui-selected": { color: "#0F172A" },
                },
            },
        },
        MuiAppBar: {
            defaultProps: { elevation: 0 },
            styleOverrides: {
                root: {
                    backgroundColor: "#FFFFFF", // Solid white, no glassmorphism — matching mockup
                    color: "#0F172A",
                    borderBottom: "1px solid #E2E8F0",
                },
            },
        },
        MuiDivider: {
            styleOverrides: {
                root: { borderColor: "#E2E8F0" },
            },
        },
        MuiTooltip: {
            styleOverrides: {
                tooltip: {
                    backgroundColor: "#0F172A",
                    fontSize: "0.75rem",
                    borderRadius: 6,
                    padding: "6px 10px",
                },
            },
        },
        MuiSwitch: {
            styleOverrides: {
                switchBase: {
                    "&.Mui-checked": {
                        color: "#0F172A",
                        "& + .MuiSwitch-track": { backgroundColor: "#D9F99D" },
                    },
                },
            },
        },
        MuiSelect: {
            styleOverrides: {
                outlined: { borderRadius: 8 },
            },
        },
        MuiBadge: {
            styleOverrides: {
                badge: { fontWeight: 700, fontSize: "0.6875rem" },
            },
        },
    },
});
