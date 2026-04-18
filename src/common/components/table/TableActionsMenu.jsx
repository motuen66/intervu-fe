import { useState } from 'react';
import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { commonMenuProps } from '../form/FormSelect';

export default function TableActionsMenu({ actions = [] }) {
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    if (actions.length === 0) return null;

    const visibleActions = actions.filter(act => act.show !== false);

    if (visibleActions.length === 0) return null;

    return (
        <>
            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} size="small" sx={{ color: '#94A3B8' }}>
                <MoreVertIcon fontSize="18px" />
            </IconButton>
            <Menu
                anchorEl={anchorEl} open={open} onClose={() => setAnchorEl(null)}
                {...commonMenuProps}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                slotProps={{
                    ...commonMenuProps.slotProps,
                    paper: {
                        sx: { 
                            minWidth: 120, 
                            borderRadius: '6px', 
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', 
                            border: '1px solid #E2E8F0', 
                            padding: 0 
                        }
                    }
                }}
            >
                {visibleActions.map((act, idx) => (
                    <MenuItem 
                        key={idx} 
                        onClick={() => { setAnchorEl(null); act.onClick(); }}
                        sx={{ fontSize: '13px', py: '6px' }}
                    >
                        {act.icon && (
                            <ListItemIcon sx={{ minWidth: '24px' }}>
                                {act.icon}
                            </ListItemIcon>
                        )}
                        <ListItemText primaryTypographyProps={{ fontSize: '13px', color: act.color || 'inherit' }}>
                            {act.label}
                        </ListItemText>
                    </MenuItem>
                ))}
            </Menu>
        </>
    );
}
