import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import { buttonStyles } from "../../constants/uiStyles";

export default function SecondaryButton({ loading = false, disabled, children, sx, ...props }) {
    return (
        <Button
            variant="outlined"
            color="primary"
            disabled={disabled || loading}
            sx={(theme) => ({
                ...buttonStyles.secondaryCta(theme),
                ...(typeof sx === "function" ? sx(theme) : sx),
            })}
            {...props}
        >
            {loading ? <CircularProgress size={18} color="inherit" /> : children}
        </Button>
    );
}

