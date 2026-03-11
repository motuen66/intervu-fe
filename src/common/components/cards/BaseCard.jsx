import Card from "@mui/material/Card";

export default function BaseCard({ onClick, sx, children, ...props }) {
    return (
        <Card
            variant="outlined"
            onClick={onClick}
            sx={(theme) => ({
                borderColor: theme.palette.divider,
                borderRadius: 2,
                bgcolor: "background.paper",
                transition: "all 0.2s ease-in-out",
                cursor: onClick ? "pointer" : "default",
                "&:hover": onClick
                    ? {
                        borderColor: "primary.main",
                        boxShadow: 1,
                    }
                    : {},
                ...(typeof sx === "function" ? sx(theme) : sx),
            })}
            {...props}
        >
            {children}
        </Card>
    );
}

