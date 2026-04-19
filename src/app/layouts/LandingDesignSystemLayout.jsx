import { Outlet } from "react-router-dom";
import { ClaudeThemeProvider } from "../../common/design-system";

function LandingDesignSystemLayout() {
    return (
        <ClaudeThemeProvider style={{ background: "transparent" }}>
            <Outlet />
        </ClaudeThemeProvider>
    );
}

export default LandingDesignSystemLayout;
