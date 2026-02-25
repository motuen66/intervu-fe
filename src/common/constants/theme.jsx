import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
    cssVariables: true,
    palette: {
        mode: "light",
        primary: {
            light: "#818CF8",   // Indigo 400
            main: "#4F46E5",    // Indigo 600 
            dark: "#3730A3",    // Indigo 800
            contrastText: "#ffffff",
        },
        secondary: {
            light: "#67E8F9",   // Cyan 300
            main: "#06B6D4",    // Cyan 500
            dark: "#0891B2",    // Cyan 600
            contrastText: "#ffffff",
        },
        success: {
            light: "#6EE7B7",
            main: "#10B981",    // Emerald 500
            dark: "#059669",
        },
        warning: {
            light: "#FCD34D",
            main: "#F59E0B",    // Amber 500
            dark: "#D97706",
        },
        error: {
            light: "#FCA5A5",
            main: "#EF4444",    // Red 500
            dark: "#DC2626",
        },
        background: {
            default: "#FDFDFD",
            paper: "#FFFFFF",
        },
        divider: "#E5E7EB",   // Gray 200
        text: {
            primary: "#111827",   // Gray 900
            secondary: "#6B7280", // Gray 500
            disabled: "#9CA3AF",  // Gray 400
        },
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: { fontWeight: 700, fontSize: "2.5rem", lineHeight: 1.2 },      // 40px — hero titles
        h2: { fontWeight: 700, fontSize: "2rem", lineHeight: 1.3 },        // 32px — section titles
        h3: { fontWeight: 600, fontSize: "1.5rem", lineHeight: 1.4 },      // 24px — card titles
        h4: { fontWeight: 600, fontSize: "1.25rem", lineHeight: 1.4 },     // 20px — subsection
        h5: { fontWeight: 600, fontSize: "1rem", lineHeight: 1.5 },        // 16px — labels
        h6: { fontWeight: 600, fontSize: "0.875rem", lineHeight: 1.5 },    // 14px — small headers
        body1: { fontSize: "1rem", lineHeight: 1.6 },                      // 16px — body text
        body2: { fontSize: "0.875rem", lineHeight: 1.6 },                  // 14px — secondary text
        caption: { fontSize: "0.75rem", lineHeight: 1.5 },                 // 12px — captions
        button: { textTransform: "none", fontWeight: 600, fontSize: "0.875rem" },
    },
    shape: {
        borderRadius: 8,   // Default cho tất cả MUI components
    },
    components: {
        MuiButton: {
            defaultProps: { disableElevation: true },
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    fontWeight: 600,
                    fontSize: "0.875rem",
                },
                sizeSmall: { padding: "6px 16px", fontSize: "0.8125rem" },
                sizeMedium: { padding: "8px 20px" },
                sizeLarge: { padding: "10px 24px", fontSize: "1rem" },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                rounded: { borderRadius: 12 },
            },
        },
        MuiTextField: {
            defaultProps: { size: "small" },
            styleOverrides: {
                root: {
                    "& .MuiOutlinedInput-root": { borderRadius: 8 },
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: { borderRadius: 6, fontWeight: 500 },
            },
        },
        MuiTab: {
            styleOverrides: {
                root: {
                    textTransform: "none",
                    fontWeight: 600,
                    fontSize: "0.875rem",
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    backgroundColor: "#FFFFFF",
                    color: "#111827",
                },
            },
        },
    },
});
