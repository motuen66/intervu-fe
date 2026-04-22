import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import { alpha } from "@mui/material/styles";
import { buttonStyles } from "../../constants/uiStyles";

export default function SuccessButton({
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
            variant="contained"
            color="success"
            disabled={disabled || loading}
            sx={(theme) => ({
                ...buttonStyles.accentCta(theme, size),
                ...(iconOnly ? buttonStyles.iconOnly(size) : {}),
                textTransform: "none",
                fontWeight: 600,
                backgroundColor: theme.palette.success.main,
                color: theme.palette.success.contrastText,
                transition: "all 0.2s ease",
                "&:hover": {
                    backgroundColor: theme.palette.success.dark,
                    boxShadow: `0 4px 14px ${alpha(theme.palette.success.main, 0.4)}`,
                },
                "&:active": { transform: "scale(0.97)" },
                ...(typeof sx === "function" ? sx(theme) : sx),
            })}
            {...props}
        >
            {loading ? <CircularProgress size={buttonStyles.getSpinnerSize(size)} color="inherit" /> : children}
        </Button>
    );
}
