import Chip from "@mui/material/Chip";
import { alpha } from "@mui/material/styles";

export default function StatusChip({ label, color = "default", icon, variant = "default", sx, ...props }) {
    return (
        <Chip
            label={label}
            size="small"
            icon={icon}
            sx={(theme) => {
                const main =
                    color === "default"
                        ? theme.palette.text.secondary
                        : theme.palette[color]?.main || theme.palette.text.secondary;

                const contrastText =
                    color === "default"
                        ? theme.palette.text.primary
                        : theme.palette[color]?.contrastText || theme.palette.text.primary;

                const isFilled = variant === "filled";

                return {
                    bgcolor: isFilled ? main : alpha(main, 0.12),
                    color: isFilled ? contrastText : main,
                    fontWeight: 600,
                    fontSize: "0.7rem",
                    height: 24,
                    borderRadius: 1.5,
                    "& .MuiChip-icon": {
                        color: isFilled ? contrastText : main,
                        fontSize: "0.875rem",
                    },
                    ...(typeof sx === "function" ? sx(theme) : sx),
                };
            }}
            {...props}
        />
    );
}

