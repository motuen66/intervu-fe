import EmptyLayout from "./EmptyLayout";
import { ClaudeThemeProvider } from "../../common/design-system";

function AuthDesignSystemLayout() {
    return (
        <ClaudeThemeProvider>
            <EmptyLayout />
        </ClaudeThemeProvider>
    );
}

export default AuthDesignSystemLayout;
