import React from 'react';
import Select from '@mui/material/Select';
import { fieldStyles } from '../../constants/uiStyles';

export const commonMenuProps = {
  disableScrollLock: false,
  anchorOrigin: { vertical: 'bottom', horizontal: 'left' },
  transformOrigin: { vertical: 'top', horizontal: 'left' },
  slotProps: {
    backdrop: {
      sx: { backdropFilter: 'none !important', backgroundColor: 'transparent' }
    },
    paper: {
      sx: {
        maxHeight: 300,
        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.12)',
        border: '1px solid',
        borderColor: 'divider',
        overflowY: 'auto',
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': { display: 'none' },
        msOverflowStyle: 'none'
      }
    }
  }
};

export default function FormSelect({ sx, MenuProps, ...props }) {
  return (
    <Select
      {...props}
      MenuProps={{ ...commonMenuProps, ...MenuProps }}
      sx={(theme) => ({
        ...fieldStyles.outlinedFocus(theme),
        maxWidth: '100%',
        '& .MuiSelect-select': {
          textOverflow: 'ellipsis',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
        },
        ...(typeof sx === "function" ? sx(theme) : sx),
      })}
    />
  );
}
