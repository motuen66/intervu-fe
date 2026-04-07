import { Box, FormControl, InputAdornment, MenuItem, OutlinedInput, Select } from "@mui/material";
import WhatshotIcon from "@mui/icons-material/Whatshot";
import { useTranslation } from "react-i18next";
import { CATEGORIES, LEVELS, ROLES, ROUNDS, SORT_OPTIONS } from "../../../../common/constants/types";

// const pillSx = { borderRadius: 999 };

export default function QuestionFilters({ filters, onChange, companies = [] }) {
    const { t } = useTranslation();

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

    const categoryKeyMap = {
        1: "behavioral",
        2: "technical",
        3: "system_design",
        4: "case_study",
        5: "other",
        6: "coding",
        7: "database",
        8: "networking",
        9: "oop",
        10: "algorithms",
        11: "data_structures",
        12: "concurrency",
        13: "distributed_systems",
        14: "cloud",
        15: "devops",
    };

    const levelKeyMap = {
        0: "intern",
        1: "junior",
        2: "middle",
        3: "senior",
        4: "lead",
        5: "manager",
        6: "director",
        7: "expert",
    };

    const roundKeyMap = {
        1: "phone_screen",
        2: "technical_screen",
        3: "take_home",
        4: "onsite_final",
        5: "other",
        6: "hr_round",
        7: "coding_challenge",
        8: "live_coding",
        9: "system_design_round",
        10: "behavioral_round",
        11: "managerial_round",
    };

    const sortKeyMap = { 1: "hot", 2: "new", 3: "top" };

    const getRoleLabel = (item) => {
        if (item.value === "") return t("question_bank.filters.any_role");
        const key = roleKeyMap[item.value];
        return key ? t(`question_bank.roles.${key}`) : item.label;
    };

    const getCategoryLabel = (item) => {
        if (item.value === "") return t("question_bank.filters.any_category");
        const key = categoryKeyMap[item.value];
        return key ? t(`question_bank.categories.${key}`) : item.label;
    };

    const getLevelLabel = (item) => {
        if (item.value === "") return t("question_bank.filters.any_level");
        const key = levelKeyMap[item.value];
        return key ? t(`question_bank.levels.${key}`) : item.label;
    };

    const getRoundLabel = (item) => {
        const key = roundKeyMap[item.value];
        return key ? t(`question_bank.rounds.${key}`) : item.label;
    };

    const getSortLabel = (item) => {
        const key = sortKeyMap[item.value];
        return key ? t(`question_bank.sort.${key}`) : item.label;
    };

    return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 3, flexWrap: "wrap" }}>
            <FormControl size="small">
                <Select
                    displayEmpty
                    value={filters.role}
                    onChange={(e) => onChange("role", e.target.value)}
                    input={<OutlinedInput />}
                    renderValue={(v) =>
                        v !== ""
                            ? getRoleLabel(ROLES.find((r) => r.value === v) ?? { value: v, label: String(v) })
                            : t("question_bank.filters.role")
                    }
                    sx={{ minWidth: 110 }}
                >
                    {ROLES.map((r) => (
                        <MenuItem key={String(r.value)} value={r.value}>
                            {getRoleLabel(r)}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <FormControl size="small">
                <Select
                    displayEmpty
                    value={filters.category}
                    onChange={(e) => onChange("category", e.target.value)}
                    input={<OutlinedInput />}
                    renderValue={(v) =>
                        v !== ""
                            ? getCategoryLabel(CATEGORIES.find((c) => c.value === v) ?? { value: v, label: String(v) })
                            : t("question_bank.filters.category")
                    }
                    sx={{ minWidth: 130 }}
                >
                    {CATEGORIES.map((c) => (
                        <MenuItem key={String(c.value)} value={c.value}>
                            {getCategoryLabel(c)}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <FormControl size="small">
                <Select
                    displayEmpty
                    value={filters.companyId}
                    onChange={(e) => onChange("companyId", e.target.value)}
                    input={<OutlinedInput />}
                    renderValue={(v) =>
                        v
                            ? (companies.find((c) => String(c.id) === String(v))?.name ?? t("question_bank.filters.company"))
                            : t("question_bank.filters.company")
                    }
                    sx={{ minWidth: 140 }}
                >
                    <MenuItem value="">{t("question_bank.filters.company")}</MenuItem>
                    {companies.map((c) => (
                        <MenuItem key={String(c.id)} value={String(c.id)}>
                            {c.name}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <FormControl size="small">
                <Select
                    displayEmpty
                    value={filters.level}
                    onChange={(e) => onChange("level", e.target.value)}
                    input={<OutlinedInput />}
                    renderValue={(v) =>
                        v !== ""
                            ? getLevelLabel(LEVELS.find((l) => l.value === v) ?? { value: v, label: String(v) })
                            : t("question_bank.filters.level")
                    }
                    sx={{ minWidth: 110 }}
                >
                    {LEVELS.map((l) => (
                        <MenuItem key={String(l.value)} value={l.value}>
                            {getLevelLabel(l)}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <FormControl size="small">
                <Select
                    displayEmpty
                    value={filters.round}
                    onChange={(e) => onChange("round", e.target.value)}
                    input={<OutlinedInput />}
                    renderValue={(v) =>
                        v !== "" && v != null
                            ? getRoundLabel(ROUNDS.find((r) => r.value === v) ?? { value: v, label: String(v) })
                            : t("question_bank.filters.round")
                    }
                    sx={{ minWidth: 120 }}
                >
                    <MenuItem value="">{t("question_bank.filters.any_round")}</MenuItem>
                    {ROUNDS.map((r) => (
                        <MenuItem key={String(r.value)} value={r.value}>
                            {getRoundLabel(r)}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <FormControl size="small" sx={{ ml: "auto" }}>
                <Select
                    value={filters.sortBy}
                    onChange={(e) => onChange("sortBy", e.target.value)}
                    input={<OutlinedInput />}
                    startAdornment={
                        <InputAdornment position="start">
                            <WhatshotIcon sx={{ fontSize: 16, color: "error.light" }} />
                        </InputAdornment>
                    }
                    renderValue={(v) =>
                        getSortLabel(SORT_OPTIONS.find((s) => s.value === v) ?? { value: v, label: String(v) })
                    }
                    sx={{ minWidth: 100 }}
                >
                    {SORT_OPTIONS.map((s) => (
                        <MenuItem key={s.value} value={s.value}>
                            {getSortLabel(s)}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        </Box>
    );
}
