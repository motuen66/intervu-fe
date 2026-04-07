import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, IconButton, Menu, MenuItem, ListItemIcon, ListItemText, Avatar } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import 'flag-icons/css/flag-icons.min.css';

const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    handleClose();
  };

  const currentLanguage = i18n.language || 'en';

  const FlagIcon = ({ countryCode, size = 'md' }) => (
    <span className={`fi fi-${countryCode}`} style={{ fontSize: size === 'sm' ? '18px' : '24px', lineHeight: 1 }} />
  );

  return (
    <Box>
      <IconButton
        onClick={handleClick}
        size="small"
        sx={{
          ml: 2,
          p: 0.5,
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          bgcolor: 'rgba(79, 70, 229, 0.1)',
          '&:hover': { bgcolor: 'rgba(79, 70, 229, 0.2)' }
        }}
      >
        <Avatar
          sx={{
            width: 28,
            height: 28,
            bgcolor: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px'
          }}
        >
          <FlagIcon countryCode={currentLanguage.startsWith('vi') ? 'vn' : 'us'} size="sm" />
        </Avatar>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            mt: 1,
            borderRadius: '12px',
            minWidth: '200px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            border: '1px solid rgba(0,0,0,0.05)'
          }
        }}
      >
        <MenuItem 
          onClick={() => changeLanguage('en')}
          selected={currentLanguage.startsWith('en')}
          sx={{ py: 1.5, px: 2 }}
        >
          <ListItemIcon sx={{ minWidth: 0, mr: 1.5 }}>
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px'
              }}
            >
              <FlagIcon countryCode="us" size="md" />
            </Avatar>
          </ListItemIcon>
          <ListItemText primary="English (US)" primaryTypographyProps={{ fontSize: '14px', fontWeight: 600 }} />
          <Box sx={{ ml: 'auto' }}>
            {currentLanguage.startsWith('en') && <CheckIcon fontSize="small" color="primary" />}
          </Box>
        </MenuItem>
        <MenuItem 
          onClick={() => changeLanguage('vi')}
          selected={currentLanguage.startsWith('vi')}
          sx={{ py: 1.5, px: 2 }}
        >
          <ListItemIcon sx={{ minWidth: 0, mr: 1.5 }}>
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px'
              }}
            >
              <FlagIcon countryCode="vn" size="md" />
            </Avatar>
          </ListItemIcon>
          <ListItemText primary="Tiếng Việt (VN)" primaryTypographyProps={{ fontSize: '14px', fontWeight: 600 }} />
          <Box sx={{ ml: 'auto' }}>
            {currentLanguage.startsWith('vi') && <CheckIcon fontSize="small" color="primary" />}
          </Box>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default LanguageSwitcher;
