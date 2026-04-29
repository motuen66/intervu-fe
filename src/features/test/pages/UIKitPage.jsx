import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import { useState } from "react";
import { Activity, BarChart3, Cpu, Shield, Timer, Zap } from "lucide-react";
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
import { MetricCard } from "../../../common/components/cards/MetricCard";

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
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 4 }}>
                <StatusChip label="Pending" color="warning" />
                <StatusChip label="Done" color="success" variant="filled" size="sm" />
                <Tag label="React" />
                <Tag label="Senior" variant="outlined" />
            </Stack>

            <SectionHeading
                title="MetricCard — Premium SaaS KPI"
                description="Hover any card to see the lift, ambient glow, watermark rotation, badge swap, and bottom accent line. Variants tint glow + watermark + accent gradient."
            />
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(5, 1fr)" },
                    gap: 2.5,
                    mb: 4,
                }}
            >
                <MetricCard
                    variant="navy"
                    label="Total Requests"
                    value={1284}
                    icon={<BarChart3 />}
                    trend={{ value: 12.5 }}
                />
                <MetricCard
                    variant="purple"
                    label="Total Tokens"
                    value={842100}
                    icon={<Cpu />}
                    trend={{ value: 8.2 }}
                />
                <MetricCard
                    variant="amber"
                    label="Prompt Tokens"
                    value={310500}
                    icon={<Zap />}
                    trend={{ value: 5.1 }}
                />
                <MetricCard
                    variant="emerald"
                    label="Avg Latency"
                    value="1.24s"
                    icon={<Timer />}
                    trend={{ value: -15.4 }}
                />
                <MetricCard
                    variant="rose"
                    label="Success Rate"
                    value="99.98%"
                    icon={<Shield />}
                    trend={{ value: 0.02 }}
                />
            </Box>

            <SectionHeading
                title="MetricCard — States"
                description="Sizes, interactive (clickable), loading skeleton, blue variant."
            />
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
                    gap: 2.5,
                    mb: 6,
                }}
            >
                <MetricCard
                    variant="blue"
                    size="sm"
                    label="Size SM"
                    value={428}
                    icon={<Activity />}
                    trend={{ value: 3.1 }}
                />
                <MetricCard
                    variant="blue"
                    size="lg"
                    label="Size LG"
                    value={428000}
                    icon={<Activity />}
                    trend={{ value: 24 }}
                />
                <MetricCard
                    variant="navy"
                    label="Clickable card"
                    value={9876}
                    icon={<BarChart3 />}
                    trend={{ value: 7.4 }}
                    onClick={() => alert("MetricCard clicked")}
                />
                <MetricCard variant="navy" label="Loading" value={0} icon={<BarChart3 />} loading />
            </Box>
        </Box>
    );
}
