import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import { useState } from "react";
import {
    AppText,
    DangerButton,
    FormSelect,
    FormTextField,
    GhostButton,
    PageHeader,
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
            <PageHeader
                title="UI Kit Playground"
                subtitle="Visual QA surface for common components and typography hierarchy."
            />

            <SectionHeading
                title="Typography Hierarchy"
                description="Use PageHeader for page titles, SectionHeading for content blocks, and AppText for body/meta text."
            />
            <Stack spacing={0.75} sx={{ mb: 3, maxWidth: 720 }}>
                <AppText variant="body">
                    Body text should be the default for descriptions and explanatory content.
                </AppText>
                <AppText variant="bodyStrong">
                    BodyStrong is for brief emphasis inside normal reading flow.
                </AppText>
                <AppText variant="label">Label text is for compact field or metadata labels.</AppText>
                <AppText variant="caption">Caption is for small helper information and timestamps.</AppText>
                <AppText variant="muted">Muted is secondary supporting information.</AppText>
                <AppText variant="overline">OVERLINE CATEGORY</AppText>
            </Stack>

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
