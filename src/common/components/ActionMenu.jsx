import { Popover, MenuList } from "@mui/material";

export default function ActionMenu({ anchorEl, open, onClose, children }) {
    return (
        <Popover
            anchorEl={anchorEl}
            open={open}
            onClose={onClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            disableScrollLock
            slotProps={{
                paper: {
                    sx: {
                        minWidth: 180,
                        borderRadius: "12px",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                        mt: 0.5,
                    },
                },
            }}
        >
            <MenuList dense>
                {children}
            </MenuList>
        </Popover>
    );
}
