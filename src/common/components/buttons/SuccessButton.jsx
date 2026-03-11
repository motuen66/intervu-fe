import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import { alpha } from "@mui/material/styles";

export default function SuccessButton({ loading = false, disabled, children, sx, ...props }) {
    return (
        <Button
            variant="contained"
            color="success"
            disabled={disabled || loading}
            sx={(theme) => ({
                textTransform: "none",
                fontWeight: 700,
                px: 3,
                py: 1.125,
                borderRadius: "8px",
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
            {loading ? <CircularProgress size={18} color="inherit" /> : children}
        </Button>
    );
}
