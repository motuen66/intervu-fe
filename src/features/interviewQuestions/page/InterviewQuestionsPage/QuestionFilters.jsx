import { Box, FormControl, InputAdornment, MenuItem, OutlinedInput, Select } from "@mui/material";
import WhatshotIcon from "@mui/icons-material/Whatshot";
import { CATEGORIES, LEVELS, ROLES, SORT_OPTIONS } from "../../../../common/constants/types";

const pillSx = { borderRadius: 999 };

export default function QuestionFilters({ filters, onChange }) {
    return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 3, flexWrap: "wrap" }}>
            <FormControl size="small">
                <Select
                    displayEmpty
                    value={filters.role}
                    onChange={(e) => onChange("role", e.target.value)}
                    input={<OutlinedInput />}
                    renderValue={(v) => v || "Role"}
                    sx={{ ...pillSx, minWidth: 110 }}
                >
                    {ROLES.map((r) => (
                        <MenuItem key={r.value} value={r.value}>
                            {r.label}
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
                    renderValue={(v) => v || "Category"}
                    sx={{ ...pillSx, minWidth: 130 }}
                >
                    {CATEGORIES.map((c) => (
                        <MenuItem key={c.value} value={c.value}>
                            {c.label}
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
                    renderValue={(v) => (v !== "" ? LEVELS.find((l) => l.value === v)?.label : "Level")}
                    sx={{ ...pillSx, minWidth: 110 }}
                >
                    {LEVELS.map((l) => (
                        <MenuItem key={String(l.value)} value={l.value}>
                            {l.label}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <FormControl size="small" sx={{ ml: "auto" }}>
                <Select
                    value={filters.sort}
                    onChange={(e) => onChange("sort", e.target.value)}
                    input={<OutlinedInput />}
                    startAdornment={
                        <InputAdornment position="start">
                            <WhatshotIcon sx={{ fontSize: 16, color: "error.light" }} />
                        </InputAdornment>
                    }
                    sx={{ ...pillSx, minWidth: 100 }}
                >
                    {SORT_OPTIONS.map((s) => (
                        <MenuItem key={s.value} value={s.value}>
                            {s.label}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        </Box>
    );
}
