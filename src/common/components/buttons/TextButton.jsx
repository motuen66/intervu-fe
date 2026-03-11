import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";

export default function TextButton({ loading = false, disabled, children, ...props }) {
    return (
        <Button variant="text" disabled={disabled || loading} {...props}>
            {loading ? <CircularProgress size={18} color="inherit" /> : children}
        </Button>
    );
}

