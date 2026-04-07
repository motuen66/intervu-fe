import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Box, Button, Chip, InputAdornment, OutlinedInput, Paper, Typography } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { POPULAR_ROLES } from "../../../../common/constants/types";

export default function QuestionSidebar({ activeRole, onRoleClick, onSearchChange, searchValue }) {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const getRoleLabel = (role) => {
        const roleKeyMap = {
            1: "product_manager",
            2: "software_engineer",
            3: "data_engineer",
            4: "data_scientist",
            5: "technical_program_manager",
            6: "backend_engineer",
            7: "frontend_engineer",
            8: "fullstack_engineer",
            9: "mobile_engineer",
            10: "devops_engineer",
            11: "qa_engineer",
            12: "ml_engineer",
            13: "security_engineer",
            14: "cloud_engineer",
            15: "uiux_designer",
            16: "business_analyst",
            17: "solution_architect",
        };
        const key = roleKeyMap[role.value];
        return key ? t(`question_bank.roles.${key}`) : role.label;
    };

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
                    placeholder={t("question_bank.sidebar.search_placeholder")}
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
                    {t("question_bank.sidebar.popular_roles")}
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {POPULAR_ROLES.map((role) => (
                        <Chip
                            key={role.value}
                            label={getRoleLabel(role)}
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
                    {t("question_bank.sidebar.recent_interview_title")}
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={1.5} lineHeight={1.5}>
                    {t("question_bank.sidebar.recent_interview_desc")}
                </Typography>
                <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => navigate("/questions/share")}
                    sx={{ textTransform: "none", fontWeight: 500, fontSize: 13 }}
                >
                    {t("question_bank.sidebar.share_experience")}
                </Button>
            </Paper>
        </Box>
    );
}
