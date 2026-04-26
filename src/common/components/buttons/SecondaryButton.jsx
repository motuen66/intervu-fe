import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import { buttonStyles } from "../../constants/uiStyles";

export default function SecondaryButton({
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
            variant="outlined"
            color="primary"
            disabled={disabled || loading}
            sx={(theme) => ({
                ...buttonStyles.secondaryCta(theme, size),
                ...(iconOnly ? buttonStyles.iconOnly(size) : {}),
                ...(typeof sx === "function" ? sx(theme) : sx),
            })}
            {...props}
        >
            {loading ? <CircularProgress size={buttonStyles.getSpinnerSize(size)} color="inherit" /> : children}
        </Button>
    );
}

