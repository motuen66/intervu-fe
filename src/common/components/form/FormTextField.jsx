import TextField from "@mui/material/TextField";
import { fieldStyles } from "../../constants/uiStyles";

export default function FormTextField({ sx, ...props }) {
    return (
        <TextField
            {...props}
            sx={(theme) => ({
                ...fieldStyles.outlinedFocus(theme),
                ...(typeof sx === "function" ? sx(theme) : sx),
            })}
        />
    );
}

