import {
    Box,
    TextField,
    InputAdornment,
    Select,
    MenuItem,
    Button,
    Stack,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";

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
            spacing={2}
            alignItems={{ xs: "stretch", sm: "center" }}
            justifyContent="space-between"
            sx={{ mb: 3 }}
        >
            {/* Search Input */}
            <TextField
                placeholder="Search for interviews..."
                size="small"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                sx={{
                    flex: 1,
                    maxWidth: { xs: "100%", sm: 400 },
                    "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        bgcolor: "background.paper",
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
            <Stack direction="row" spacing={1.5}>
                <Select
                    value={filterValue}
                    onChange={(e) => onFilterChange(e.target.value)}
                    size="small"
                    displayEmpty
                    sx={{
                        minWidth: 120,
                        borderRadius: 2,
                        bgcolor: "background.paper",
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
                        <Typography variant="body2">Filter</Typography>
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

// Add missing Typography import
import { Typography } from "@mui/material";

export default InterviewFilterBar;
