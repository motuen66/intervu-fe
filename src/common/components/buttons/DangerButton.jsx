import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import { buttonStyles } from "../../constants/uiStyles";

export default function DangerButton({ loading = false, disabled, children, sx, ...props }) {
    return (
        <Button
            variant="contained"
            color="error"
            disabled={disabled || loading}
            sx={(theme) => ({
                ...buttonStyles.dangerCta(theme),
                ...(typeof sx === "function" ? sx(theme) : sx),
            })}
            {...props}
        >
            {loading ? <CircularProgress size={18} color="inherit" /> : children}
        </Button>
    );
}

