import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import { buttonStyles } from "../../constants/uiStyles";

export default function GhostButton({
    loading = false,
    disabled,
    children,
    size = "md",
    iconOnly = false,
    sx,
    ...props
}) {
    return (
        <Button
            variant="text"
            disabled={disabled || loading}
            sx={(theme) => ({
                ...buttonStyles.ghostCta(theme, size),
                ...(iconOnly ? buttonStyles.iconOnly(size) : {}),
                ...(typeof sx === "function" ? sx(theme) : sx),
            })}
            {...props}
        >
            {loading ? <CircularProgress size={buttonStyles.getSpinnerSize(size)} color="inherit" /> : children}
        </Button>
    );
}
