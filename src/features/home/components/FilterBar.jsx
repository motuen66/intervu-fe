import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Search, Sparkles, X, Filter, ChevronUp } from 'lucide-react';
import {
  Box,
  FormControl,
  MenuItem,
  InputAdornment,
  Typography,
  Paper,
  InputLabel,
  Stack,
  Collapse
} from '@mui/material';
import { fetchIndustries, setFilters, clearFilters } from '../store/homeSlice';
import { PrimaryButton, SecondaryButton, DangerButton } from '../../../common/components/buttons';
import FormTextField from '../../../common/components/form/FormTextField';
import FormSelect from '../../../common/components/form/FormSelect';
import { buttonStyles, fieldStyles } from '../../../common/constants/uiStyles';
import './FilterBar.css';

function DualRangeSlider({
  min,
  max,
  step,
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
  formatValue,
}) {
  const leftPct = ((minValue - min) / (max - min)) * 100;
  const rightPct = ((maxValue - min) / (max - min)) * 100;

  return (
    <div className="dual-range-wrapper">
      <div className="slider-values">
        <span>{formatValue(minValue)}</span>
        <span>{formatValue(maxValue)}</span>
      </div>

      <div className="dual-range-track-wrap">
        <div className="dual-range-track" />
        <div
          className="dual-range-progress"
          style={{
            left: `${leftPct}%`,
            width: `${Math.max(0, rightPct - leftPct)}%`,
          }}
        />

        <input
          className="dual-range-input dual-range-input--left"
          type="range"
          min={min}
          max={max}
          step={step}
          value={minValue}
          onChange={(e) => onMinChange(Number(e.target.value))}
        />

        <input
          className="dual-range-input dual-range-input--right"
          type="range"
          min={min}
          max={max}
          step={step}
          value={maxValue}
          onChange={(e) => onMaxChange(Number(e.target.value))}
        />
      </div>
    </div>
  );
}

function FilterBar({ onOpenSmartMatch }) {
  const COMPACT_BAR_HEIGHT = 72;
  const FILTER_TOGGLE_WIDTH = 142;
  const dispatch = useDispatch();
  const { filters, companies, skills, industries } = useSelector((state) => state.home);
  
  // Local state for all filters to prevent immediate API calls
  const [localFilters, setLocalFilters] = useState({
    searchTerm: filters.searchTerm || '',
    company: filters.company || '',
    industry: filters.industry || '',
    skillIds: filters.skillIds || [],
    minExperienceYears: filters.minExperienceYears || '',
    maxExperienceYears: filters.maxExperienceYears || '',
    minPrice: filters.minPrice || '',
    maxPrice: filters.maxPrice || '',
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const EXP_MIN = 0;
  const EXP_MAX = 30;
  const PRICE_MIN = 0;
  const PRICE_MAX = 2000000;
  const PRICE_STEP = 10000;

  const formatVnd = (value) => new Intl.NumberFormat('vi-VN').format(value);

  const applySearch = () => {
    // Sync local filters to Redux
    dispatch(setFilters(localFilters));
  };

  const handleLocalFilterChange = (field, value) => {
    setLocalFilters(prev => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    // Sync local keyword if Redux searchTerm changes externally (e.g. from Clear Filters)
    setLocalFilters(prev => ({ ...prev, searchTerm: filters.searchTerm || '' }));
  }, [filters.searchTerm]);

  useEffect(() => {
    dispatch(fetchIndustries());
  }, [dispatch]);

  const handleClearFilters = () => {
    const cleared = {
      searchTerm: '',
      company: '',
      industry: '',
      skillIds: [],
      minExperienceYears: '',
      maxExperienceYears: '',
      minPrice: '',
      maxPrice: '',
    };
    setLocalFilters(cleared);
    dispatch(clearFilters());
  };

  const companiesList = Array.isArray(companies) ? companies : [];
  const skillsList = Array.isArray(skills) ? skills : [];
  const industriesList = Array.isArray(industries) ? industries : [];
  const selectedSkillIds = Array.isArray(localFilters.skillIds) ? localFilters.skillIds : [];

  const availableSkills = useMemo(
    () => skillsList.filter((s) => !selectedSkillIds.includes(s.id)),
    [skillsList, selectedSkillIds]
  );

  const hasActiveFilters = Boolean(
    localFilters.company ||
    localFilters.industry ||
    (localFilters.skillIds && localFilters.skillIds.length) ||
    localFilters.minExperienceYears ||
    localFilters.maxExperienceYears ||
    localFilters.minPrice ||
    localFilters.maxPrice ||
    localFilters.searchTerm
  );

  const addSkillId = (id) => {
    if (!id) return;
    if (selectedSkillIds.includes(id)) return;
    handleLocalFilterChange('skillIds', [...selectedSkillIds, id]);
  };

  const removeSkillId = (id) => {
    handleLocalFilterChange('skillIds', selectedSkillIds.filter((x) => x !== id));
  };

  const selectedSkillObjects = selectedSkillIds
    .map((id) => skillsList.find((s) => s.id === id))
    .filter(Boolean);

  // Calculate display values for sliders from local state
  const displayExpMin = localFilters.minExperienceYears === '' ? EXP_MIN : Number(localFilters.minExperienceYears);
  const displayExpMax = localFilters.maxExperienceYears === '' ? EXP_MAX : Number(localFilters.maxExperienceYears);
  const displayPriceMin = localFilters.minPrice === '' ? PRICE_MIN : Number(localFilters.minPrice);
  const displayPriceMax = localFilters.maxPrice === '' ? PRICE_MAX : Number(localFilters.maxPrice);

  return (
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 4, alignItems: 'flex-start' }}>
      <Paper
        elevation={0}
        variant="outlined"
        sx={{
          flex: 1,
          minHeight: COMPACT_BAR_HEIGHT,
          borderRadius: '12px',
          p: 2,
          backgroundColor: 'background.paper'
        }}
      >
        <Stack spacing={2}>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap={{ xs: 'wrap', md: 'nowrap' }}>
            <FormControl size="small" sx={{ width: 190, minWidth: 190, ...fieldStyles.outlinedFocus }}>
              <InputLabel>Company</InputLabel>
              <FormSelect
                value={localFilters.company || ''}
                label="Company"
                onChange={(e) => handleLocalFilterChange('company', e.target.value || null)}
                sx={{
                  "& .MuiSelect-select": {
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  },
                }}
              >
                <MenuItem value=""><em>None</em></MenuItem>
                {companiesList.map(company => (
                  <MenuItem key={company.id} value={company.id}>{company.name}</MenuItem>
                ))}
              </FormSelect>
            </FormControl>

            <FormControl size="small" sx={{ width: 190, minWidth: 190, ...fieldStyles.outlinedFocus }}>
              <InputLabel>Domain/Industry</InputLabel>
              <FormSelect
                value={localFilters.industry || ''}
                label="Domain/Industry"
                onChange={(e) => handleLocalFilterChange('industry', e.target.value || null)}
                sx={{
                  "& .MuiSelect-select": {
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  },
                }}
              >
                <MenuItem value=""><em>None</em></MenuItem>
                {industriesList.map(ind => (
                  <MenuItem key={ind.id} value={ind.id}>{ind.name}</MenuItem>
                ))}
              </FormSelect>
            </FormControl>

            <SecondaryButton
              size="small"
              onClick={() => setShowAdvanced((prev) => !prev)}
              sx={{
                height: 40,
                width: FILTER_TOGGLE_WIDTH,
                minWidth: FILTER_TOGGLE_WIDTH,
                maxWidth: FILTER_TOGGLE_WIDTH,
                gap: 1,
                whiteSpace: 'nowrap',
                flexShrink: 0,
                justifyContent: 'center'
              }}
            >
              {showAdvanced ? <ChevronUp size={16} /> : <Filter size={16} />}
              {showAdvanced ? 'Hide Filters' : 'More Filters'}
            </SecondaryButton>

            <Box sx={{ flexGrow: 1 }} />

            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexShrink: 0 }}>
              <FormTextField
                placeholder="Search..."
                size="small"
                value={localFilters.searchTerm}
                onChange={(e) => handleLocalFilterChange('searchTerm', e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applySearch()}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={18} />
                    </InputAdornment>
                  ),
                }}
                sx={{ width: 280 }}
              />

              <PrimaryButton size="small" onClick={applySearch} sx={{ height: 40 }}>
                Search
              </PrimaryButton>

              <DangerButton
                size="small"
                onClick={handleClearFilters}
                disabled={!hasActiveFilters}
                sx={{
                  width: 40,
                  minWidth: 40,
                  height: 40,
                  p: 0,
                  ...( !hasActiveFilters && {
                    borderColor: 'divider',
                    color: 'text.disabled',
                    '&:hover': { backgroundColor: 'transparent', boxShadow: 'none' }
                  })
                }}
              >
                <X size={18} />
              </DangerButton>
            </Stack>
          </Stack>

          <Collapse in={showAdvanced}>
            <Box sx={{ pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={4}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mb: 1.5, display: 'block' }}>
                    EXPERIENCE (YEARS)
                  </Typography>
                  <DualRangeSlider
                    min={EXP_MIN}
                    max={EXP_MAX}
                    step={1}
                    minValue={displayExpMin}
                    maxValue={displayExpMax}
                    onMinChange={(next) => handleLocalFilterChange('minExperienceYears', Math.min(next, displayExpMax))}
                    onMaxChange={(next) => handleLocalFilterChange('maxExperienceYears', Math.max(next, displayExpMin))}
                    formatValue={(v) => `${v}y`}
                  />
                </Box>

                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mb: 1.5, display: 'block' }}>
                    PRICE / HOUR (VND)
                  </Typography>
                  <DualRangeSlider
                    min={PRICE_MIN}
                    max={PRICE_MAX}
                    step={PRICE_STEP}
                    minValue={displayPriceMin}
                    maxValue={displayPriceMax}
                    onMinChange={(next) => handleLocalFilterChange('minPrice', Math.min(next, displayPriceMax))}
                    onMaxChange={(next) => handleLocalFilterChange('maxPrice', Math.max(next, displayPriceMin))}
                    formatValue={(v) => `${formatVnd(v)} đ`}
                  />
                </Box>

                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mb: 1.5, display: 'block' }}>
                    ADD SKILLS
                  </Typography>
                  <FormControl size="small" fullWidth sx={{ ...fieldStyles.outlinedFocus, maxWidth: 200 }}>
                    <FormSelect
                      value=""
                      onChange={(e) => addSkillId(e.target.value)}
                      displayEmpty
                      sx={{
                        "& .MuiSelect-select": {
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        },
                      }}
                    >
                      <MenuItem value="">Select a skill</MenuItem>
                      {availableSkills.map((skill) => (
                        <MenuItem key={skill.id} value={skill.id}>{skill.name}</MenuItem>
                      ))}
                    </FormSelect>
                  </FormControl>
                </Box>
              </Stack>

              <Collapse in={selectedSkillObjects.length > 0}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2.5 }}>
                  {selectedSkillObjects.map((skill) => (
                    <Box
                      key={skill.id}
                      component="button"
                      onClick={() => removeSkillId(skill.id)}
                      className="selected-chip-simple"
                    >
                      {skill.name} <X size={12} />
                    </Box>
                  ))}
                </Box>
              </Collapse>
            </Box>
          </Collapse>

          <Collapse in={hasActiveFilters}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.disabled' }}>ACTIVE:</Typography>
              {localFilters.company && <div className="summary-pill-simple">Company</div>}
              {localFilters.industry && <div className="summary-pill-simple">Industry</div>}
              {(localFilters.skillIds || []).length > 0 && <div className="summary-pill-simple">{(localFilters.skillIds || []).length} skills</div>}
              {(localFilters.minExperienceYears || localFilters.maxExperienceYears) && <div className="summary-pill-simple">Experience</div>}
              {(localFilters.minPrice || localFilters.maxPrice) && <div className="summary-pill-simple">Price</div>}
            </Stack>
          </Collapse>
        </Stack>
      </Paper>

      <Box className="ai-glow-container">
        <PrimaryButton
          onClick={onOpenSmartMatch}
          onMouseMove={handleMouseMove}
          className="ai-glow-button"
          sx={(theme) => ({
            height: 70, 
            width: 256,
            minWidth: 256,
            borderRadius: '12px',
            gap: 1.5,
            fontSize: '1rem',
            '--mouse-x': `${mousePos.x}px`,
            '--mouse-y': `${mousePos.y}px`,
          })}
        >
          <Sparkles size={22} className="ai-sparkle-icon" />
          <span>Smart Match</span>
        </PrimaryButton>
      </Box>
    </Stack>
  );
}

export default FilterBar;
