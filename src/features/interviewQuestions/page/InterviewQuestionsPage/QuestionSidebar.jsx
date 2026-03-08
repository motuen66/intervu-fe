import { useNavigate } from "react-router-dom";
import { Box, Button, Chip, InputAdornment, OutlinedInput, Paper, Typography } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { POPULAR_ROLES } from "../../../../common/constants/types";

export default function QuestionSidebar({ activeRole, onRoleClick, onSearchChange, searchValue }) {
    const navigate = useNavigate();
    return (
        <Box
            component="aside"
            sx={{
                width: { xs: "100%", md: 280 },
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                gap: 2.5,
                position: { md: "sticky" },
                top: 80,
            }}
        >
            {/* Search */}
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <OutlinedInput
                    fullWidth
                    size="small"
                    placeholder="Search for questions, companies..."
                    value={searchValue}
                    onChange={(e) => onSearchChange?.(e.target.value)}
                    startAdornment={
                        <InputAdornment position="start">
                            <SearchIcon sx={{ fontSize: 18, color: "text.disabled" }} />
                        </InputAdornment>
                    }
                    sx={{ fontSize: 14 }}
                />
            </Paper>

            {/* Popular Roles */}
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="h6" mb={1.5}>
                    Popular roles
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {POPULAR_ROLES.map((role) => (
                        <Chip
                            key={role.value}
                            label={role.label}
                            size="small"
                            clickable
                            onClick={() => onRoleClick?.(role.value)}
                            variant={activeRole === role.value ? "filled" : "outlined"}
                            color={activeRole === role.value ? "primary" : "default"}
                            sx={{ fontSize: 12 }}
                        />
                    ))}
                </Box>
            </Paper>

            {/* CTA */}
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="h6" mb={1}>
                    Interviewed recently?
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={1.5} lineHeight={1.5}>
                    Help improve our question database (and earn karma) by telling us about your experience
                </Typography>
                <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => navigate("/questions/share")}
                    sx={{ textTransform: "none", fontWeight: 500, fontSize: 13 }}
                >
                    + Share interview experience
                </Button>
            </Paper>
        </Box>
    );
}
