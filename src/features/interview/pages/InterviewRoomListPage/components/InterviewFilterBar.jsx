import {
    InputAdornment,
    MenuItem,
    Stack,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import FormSelect from "../../../../common/components/form/FormSelect";
import FormTextField from "../../../../common/components/form/FormTextField";
import AppText from "../../../../common/components/AppText";

function InterviewFilterBar({ 
    searchQuery, 
    onSearchChange, 
    filterValue, 
    onFilterChange,
    onExport,
    filterOptions = []
}) {
    return (
        <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.25}
            alignItems={{ xs: "stretch", sm: "center" }}
            justifyContent="space-between"
            sx={{ mb: 2 }}
        >
            {/* Search Input */}
            <FormTextField
                placeholder="Search for interviews..."
                size="small"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                sx={{
                    flex: 1,
                    maxWidth: { xs: "100%", sm: 400 },
                    "& .MuiOutlinedInput-root": {
                        borderRadius: 2.5,
                        bgcolor: "background.paper",
                        minHeight: 40,
                    },
                }}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon sx={{ color: "text.secondary" }} />
                        </InputAdornment>
                    ),
                }}
            />

            {/* Filter & Export */}
            <Stack direction="row" spacing={1}>
                <FormSelect
                    value={filterValue}
                    onChange={(e) => onFilterChange(e.target.value)}
                    size="small"
                    displayEmpty
                    sx={{
                        minWidth: 120,
                        borderRadius: 2.5,
                        bgcolor: "background.paper",
                        minHeight: 40,
                        "& .MuiSelect-select": {
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                        },
                    }}
                    startAdornment={
                        <FilterListIcon sx={{ color: "text.secondary", mr: 1 }} />
                    }
                >
                    <MenuItem value="">
                        <AppText variant="label">Filter</AppText>
                    </MenuItem>
                    {filterOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                            {option.label}
                        </MenuItem>
                    ))}
                </FormSelect>

            </Stack>
        </Stack>
    );
}

export default InterviewFilterBar;
