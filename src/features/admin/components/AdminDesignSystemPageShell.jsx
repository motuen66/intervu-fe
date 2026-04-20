import { Box } from "@mui/material";
import { ClaudeThemeProvider } from "../../../common/design-system";

export default function AdminDesignSystemPageShell({ children }) {
    return (
        <ClaudeThemeProvider>
            <Box
                sx={{
                    minHeight: "100vh",
                    backgroundColor: "background.default",
                    "--claude-color-surface-parchment": "#F8FAFC",
                    "--claude-color-surface-ivory": "#FFFFFF",
                }}
            >
                {children}
            </Box>
        </ClaudeThemeProvider>
    );
}
