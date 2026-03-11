import { Box, FormControl, InputAdornment, MenuItem, OutlinedInput, Select } from "@mui/material";
import WhatshotIcon from "@mui/icons-material/Whatshot";
import { CATEGORIES, LEVELS, ROLES, ROUNDS, SORT_OPTIONS } from "../../../../common/constants/types";

// const pillSx = { borderRadius: 999 };

export default function QuestionFilters({ filters, onChange, companies = [] }) {
    return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 3, flexWrap: "wrap" }}>
            <FormControl size="small">
                <Select
                    displayEmpty
                    value={filters.role}
                    onChange={(e) => onChange("role", e.target.value)}
                    input={<OutlinedInput />}
                    renderValue={(v) => (v !== "" ? (ROLES.find((r) => r.value === v)?.label ?? String(v)) : "Role")}
                    sx={{ minWidth: 110 }}
                >
                    {ROLES.map((r) => (
                        <MenuItem key={String(r.value)} value={r.value}>
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
                    renderValue={(v) =>
                        v !== "" ? (CATEGORIES.find((c) => c.value === v)?.label ?? String(v)) : "Category"
                    }
                    sx={{ minWidth: 130 }}
                >
                    {CATEGORIES.map((c) => (
                        <MenuItem key={String(c.value)} value={c.value}>
                            {c.label}
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
                        v ? (companies.find((c) => String(c.id) === String(v))?.name ?? "Company") : "Company"
                    }
                    sx={{ minWidth: 140 }}
                >
                    <MenuItem value="">Company</MenuItem>
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
                    renderValue={(v) => (v !== "" ? (LEVELS.find((l) => l.value === v)?.label ?? String(v)) : "Level")}
                    sx={{ minWidth: 110 }}
                >
                    {LEVELS.map((l) => (
                        <MenuItem key={String(l.value)} value={l.value}>
                            {l.label}
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
                        v !== "" && v != null ? (ROUNDS.find((r) => r.value === v)?.label ?? String(v)) : "Round"
                    }
                    sx={{ minWidth: 120 }}
                >
                    <MenuItem value="">Any Round</MenuItem>
                    {ROUNDS.map((r) => (
                        <MenuItem key={String(r.value)} value={r.value}>
                            {r.label}
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
                    renderValue={(v) => SORT_OPTIONS.find((s) => s.value === v)?.label ?? "Sort"}
                    sx={{ minWidth: 100 }}
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
