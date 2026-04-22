import { MenuItem } from '@mui/material';
import FormSelect from '../form/FormSelect';

export default function FilterDropdown({ options = [], value, onChange, placeholder = "All" }) {
    return (
        <FormSelect
            value={value}
            onChange={(e) => onChange(e.target.value)}
            displayEmpty
            sizeVariant="sm"
            sx={{
                width: 140,
                borderRadius: '6px',
                fontSize: '13px',
                '.MuiOutlinedInput-root': { minHeight: 34 },
                '.MuiSelect-select': { display: 'flex', alignItems: 'center' },
                '.MuiSelect-icon': { fontSize: '16px', color: '#94A3B8', right: '4px' }
            }}
        >
            <MenuItem value="all" sx={{ fontSize: '13px', color: '#94A3B8' }}>{placeholder}</MenuItem>
            {options.map(opt => (
                <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: '13px' }}>
                    {opt.label}
                </MenuItem>
            ))}
        </FormSelect>
    );
}
