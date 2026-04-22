import { useNavigate } from "react-router-dom";
import { Box, InputAdornment, Paper, Typography } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { POPULAR_ROLES } from "../../../../common/constants/types";
import { FormTextField, Tag } from "../../../../common/components";
import { SecondaryButton } from "../../../../common/components/buttons";

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
                <FormTextField
                    fullWidth
                    placeholder="Search for questions, companies..."
                    value={searchValue}
                    onChange={(e) => onSearchChange?.(e.target.value)}
                    sizeVariant="sm"
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ fontSize: 18, color: "text.disabled" }} />
                            </InputAdornment>
                        ),
                    }}
                    sx={{ "& .MuiInputBase-input": { fontSize: 14 } }}
                />
            </Paper>

            {/* Popular Roles */}
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="h6" mb={1.5}>
                    Popular roles
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {POPULAR_ROLES.map((role) => (
                        <Tag
                            key={role.value}
                            label={role.label}
                            size="sm"
                            clickable
                            onClick={() => onRoleClick?.(role.value)}
                            variant={activeRole === role.value ? "solid" : "outlined"}
                            color={activeRole === role.value ? "primary" : "default"}
                            sx={{ fontSize: 12, cursor: "pointer" }}
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
                <SecondaryButton
                    fullWidth
                    onClick={() => navigate("/questions/share")}
                    size="sm"
                    sx={{ fontWeight: 500, fontSize: 13 }}
                >
                    + Share interview experience
                </SecondaryButton>
            </Paper>
        </Box>
    );
}
