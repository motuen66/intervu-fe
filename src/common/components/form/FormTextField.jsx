import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import { fieldStyles } from "../../constants/uiStyles";

export default function FormTextField({ sx, sizeVariant = "md", error, helperText, InputProps, ...props }) {
    const hasHelperContent =
        helperText !== undefined && helperText !== null && String(helperText).trim().length > 0;

    const mergedHelperText = error && hasHelperContent ? (
        <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
            <ErrorOutlineRoundedIcon sx={{ fontSize: "0.875rem" }} />
            {helperText}
        </Box>
    ) : (
        hasHelperContent ? helperText : undefined
    );

    return (
        <TextField
            {...props}
            size="small"
            error={error}
            helperText={mergedHelperText}
            InputProps={InputProps}
            sx={(theme) => ({
                ...fieldStyles.outlinedFocus(theme, sizeVariant),
                ...(typeof sx === "function" ? sx(theme) : sx),
            })}
        />
    );
}

