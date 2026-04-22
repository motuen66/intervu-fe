import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import {
    DangerButton,
    FormSelect,
    FormTextField,
    GhostButton,
    PrimaryButton,
    SecondaryButton,
    SectionHeading,
    StatusChip,
    SuccessButton,
    Tag,
    TextButton,
} from "../../../common/components";

export default function UIKitPage() {
    const [value, setValue] = useState("");

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" sx={{ mb: 2 }}>UI Kit Playground</Typography>

            <SectionHeading title="Buttons" />
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 3 }}>
                <PrimaryButton size="sm">Primary sm</PrimaryButton>
                <PrimaryButton>Primary md</PrimaryButton>
                <SecondaryButton>Secondary</SecondaryButton>
                <DangerButton>Danger</DangerButton>
                <SuccessButton>Success</SuccessButton>
                <GhostButton>Ghost</GhostButton>
                <TextButton>Text</TextButton>
                <PrimaryButton loading>Loading</PrimaryButton>
            </Stack>

            <SectionHeading title="Inputs" />
            <Stack spacing={1.5} sx={{ maxWidth: 360, mb: 3 }}>
                <FormTextField label="Email" placeholder="you@example.com" />
                <FormTextField label="Username" required sizeVariant="sm" />
                <FormTextField label="Error input" error helperText="This field is required" />
                <FormSelect value={value} onChange={(e) => setValue(e.target.value)} displayEmpty>
                    <MenuItem value="">Select one</MenuItem>
                    <MenuItem value="a">Option A</MenuItem>
                    <MenuItem value="b">Option B</MenuItem>
                </FormSelect>
            </Stack>

            <SectionHeading title="Status / Tags" />
            <Stack direction="row" spacing={1} flexWrap="wrap">
                <StatusChip label="Pending" color="warning" />
                <StatusChip label="Done" color="success" variant="filled" size="sm" />
                <Tag label="React" />
                <Tag label="Senior" variant="outlined" />
            </Stack>
        </Box>
    );
}
