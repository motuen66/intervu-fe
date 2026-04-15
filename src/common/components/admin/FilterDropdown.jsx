import { Select, MenuItem } from '@mui/material';

export default function FilterDropdown({ options = [], value, onChange, placeholder = "All" }) {
    return (
        <Select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            displayEmpty
            size="small"
            sx={{
                width: 140, height: 32, backgroundColor: '#F8FAFC',
                borderRadius: '6px', fontSize: '13px',
                '.MuiSelect-select': { padding: '4px 12px', display: 'flex', alignItems: 'center' },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E2E8F0' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#CBD5E1' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#6366F1', borderWidth: '1px' },
                '.MuiSelect-icon': { fontSize: '16px', color: '#94A3B8', right: '4px' }
            }}
        >
            <MenuItem value="all" sx={{ fontSize: '13px', color: '#94A3B8' }}>{placeholder}</MenuItem>
            {options.map(opt => (
                <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: '13px' }}>
                    {opt.label}
                </MenuItem>
            ))}
        </Select>
    );
}
