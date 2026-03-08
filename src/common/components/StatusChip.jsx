import Chip from "@mui/material/Chip";
import { alpha } from "@mui/material/styles";

export default function StatusChip({ label, color = "default", sx, ...props }) {
    return (
        <Chip
            label={label}
            size="small"
            sx={(theme) => {
                const main =
                    color === "default"
                        ? theme.palette.text.secondary
                        : theme.palette[color]?.main || theme.palette.text.secondary;

                return {
                    bgcolor: alpha(main, 0.12),
                    color: main,
                    fontWeight: 600,
                    fontSize: "0.7rem",
                    height: 24,
                    borderRadius: 1.5,
                    ...(typeof sx === "function" ? sx(theme) : sx),
                };
            }}
            {...props}
        />
    );
}

