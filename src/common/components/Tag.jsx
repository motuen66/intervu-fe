import Chip from "@mui/material/Chip";
import { alpha } from "@mui/material/styles";

const sizeConfig = {
    sm: { height: 22, fontSize: "0.6875rem", px: 0.5 },
    md: { height: 26, fontSize: "0.75rem", px: 0.75 },
};

export default function Tag({ label, color = "default", variant = "soft", size = "md", sx, ...props }) {
    const config = sizeConfig[size] || sizeConfig.md;

    return (
        <Chip
            label={label}
            size={size === "sm" ? "small" : "medium"}
            sx={(theme) => {
                const main = color === "default" ? theme.palette.text.secondary : theme.palette[color]?.main || theme.palette.text.secondary;
                const contrast = color === "default" ? theme.palette.text.primary : theme.palette[color]?.contrastText || theme.palette.text.primary;
                const isSolid = variant === "solid";
                const isOutlined = variant === "outlined";

                return {
                    height: config.height,
                    fontSize: config.fontSize,
                    px: config.px,
                    borderRadius: 1.5,
                    fontWeight: 500,
                    color: isSolid ? contrast : main,
                    bgcolor: isSolid ? main : variant === "soft" ? alpha(main, 0.12) : "transparent",
                    border: isOutlined ? `1px solid ${main}` : "1px solid transparent",
                    ...(typeof sx === "function" ? sx(theme) : sx),
                };
            }}
            {...props}
        />
    );
}
