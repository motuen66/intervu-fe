import { 
  Box, 
  Stack, 
  TextField, 
  MenuItem, 
  InputAdornment, 
  Button 
} from '@mui/material';
import { Search as SearchIcon } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { setFilters, clearFilters } from '../store/homeSlice';
import { fieldStyles } from '../../../common/constants/uiStyles';
import './FilterBar.css';

function FilterBar() {
  const dispatch = useDispatch();
  const { filters, companies, skills } = useSelector((state) => state.home);

  const handleFilterChange = (filterType, value) => {
    dispatch(setFilters({ [filterType]: value }));
  };

  const handleSearch = (value) => {
    dispatch(setFilters({ searchTerm: value }));
  };

  const handleClearFilters = () => {
    dispatch(clearFilters());
  };

  // Ensure arrays exist
  const companiesList = Array.isArray(companies) ? companies : [];
  const skillsList = Array.isArray(skills) ? skills : [];

  return (
    <Box className="filter-bar-container">
      <Stack 
        direction={{ xs: 'column', md: 'row' }} 
        spacing={2} 
        alignItems="center"
        className="filter-bar"
      >
        {/* Search Input - Left or Right depending on preference, here kept aligned with middle/right flow */}
        <TextField
          placeholder="Search coaches, skills, or roles..."
          variant="outlined"
          size="small"
          value={filters.searchTerm || ''}
          onChange={(e) => handleSearch(e.target.value)}
          className="search-input-mui"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon size={18} color="#64748b" />
                </InputAdornment>
              ),
            }
          }}
          sx={(theme) => ({
            flex: 2,
            minWidth: { md: '300px' },
            ...fieldStyles.outlinedFocus(theme)
          })}
        />

        {/* Company Filter */}
        <TextField
          select
          label="Company"
          size="small"
          value={filters.company || ''}
          onChange={(e) => handleFilterChange('company', e.target.value || null)}
          sx={(theme) => ({
            flex: 1,
            minWidth: '160px',
            ...fieldStyles.outlinedFocus(theme)
          })}
        >
          <MenuItem value=""><em>Any Company</em></MenuItem>
          {companiesList.map(company => (
            <MenuItem key={company.id} value={company.id}>
              {company.name}
            </MenuItem>
          ))}
        </TextField>

        {/* Skill Filter */}
        <TextField
          select
          label="Skill"
          size="small"
          value={filters.skill || ''}
          onChange={(e) => handleFilterChange('skill', e.target.value || null)}
          sx={(theme) => ({
            flex: 1,
            minWidth: '160px',
            ...fieldStyles.outlinedFocus(theme)
          })}
        >
          <MenuItem value=""><em>Any Skill</em></MenuItem>
          {skillsList.map(skill => (
            <MenuItem key={skill.id} value={skill.id}>
              {skill.name}
            </MenuItem>
          ))}
        </TextField>

        {/* Clear Filters Button */}
        {(filters.company || filters.skill || filters.searchTerm) && (
          <Button 
            onClick={handleClearFilters}
            className="clear-filters-btn"
            sx={(theme) => ({
              textTransform: 'none',
              fontWeight: 700,
              color: theme.palette.error.main,
              '&:hover': {
                backgroundColor: 'rgba(239, 68, 68, 0.05)'
              }
            })}
          >
            Clear ✕
          </Button>
        )}
      </Stack>
    </Box>
  );
}

export default FilterBar;