import Chip from "@mui/material/Chip";
import { alpha } from "@mui/material/styles";

const sizeConfig = {
    sm: { height: 22, fontSize: "0.6875rem", iconSize: "0.8125rem", borderRadius: 1.25 },
    md: { height: 26, fontSize: "0.75rem", iconSize: "0.9375rem", borderRadius: 1.5 },
};

export default function StatusChip({ label, color = "default", icon, variant = "default", size = "md", sx, ...props }) {
    const sizeStyle = sizeConfig[size] || sizeConfig.md;
    return (
        <Chip
            label={label}
            size={size === "sm" ? "small" : "medium"}
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
                    fontSize: sizeStyle.fontSize,
                    height: sizeStyle.height,
                    borderRadius: sizeStyle.borderRadius,
                    "& .MuiChip-icon": {
                        color: isFilled ? contrastText : main,
                        fontSize: sizeStyle.iconSize,
                    },
                    ...(typeof sx === "function" ? sx(theme) : sx),
                };
            }}
            {...props}
        />
    );
}

