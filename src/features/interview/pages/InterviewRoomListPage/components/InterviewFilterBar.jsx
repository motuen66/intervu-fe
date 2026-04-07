import { useTranslation } from "react-i18next";
import {
    TextField,
    Typography,
    InputAdornment,
    Select,
    MenuItem,
    Stack,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";

function InterviewFilterBar({ 
    searchQuery, 
    onSearchChange, 
    filterValue, 
    onFilterChange,
    onExport,
    filterOptions = []
}) {
    const { t } = useTranslation();
    return (
        <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.25}
            alignItems={{ xs: "stretch", sm: "center" }}
            justifyContent="space-between"
            sx={{ mb: 2 }}
        >
            {/* Search Input */}
            <TextField
                placeholder={t("interview.list.search_placeholder")}
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
                <Select
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
                        <Typography variant="body2">{t("interview.list.filter_label")}</Typography>
                    </MenuItem>
                    {filterOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                            {option.label}
                        </MenuItem>
                    ))}
                </Select>

                {/* <Button
                    variant="outlined"
                    startIcon={<FileDownloadOutlinedIcon />}
                    onClick={onExport}
                    sx={{
                        borderRadius: 2,
                        borderColor: "divider",
                        color: "text.secondary",
                        "&:hover": {
                            borderColor: "text.secondary",
                            bgcolor: "action.hover",
                        },
                    }}
                >
                    Export
                </Button> */}
            </Stack>
        </Stack>
    );
}

export default InterviewFilterBar;
