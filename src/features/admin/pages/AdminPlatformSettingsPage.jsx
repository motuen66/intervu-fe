import { useEffect, useState } from "react";
import { Box, Card, CardContent, Stack, Typography } from "@mui/material";
import toast from "react-hot-toast";
import { callApi } from "../../../common/utils/apiConnector";
import { METHOD } from "../../../common/constants/api";
import { adminEndPoints } from "../services/adminApi";
import { Button, InputField } from "../../../common/design-system";
import AdminDesignSystemPageShell from "../components/AdminDesignSystemPageShell";

export default function AdminPlatformSettingsPage() {
    const [ratePercent, setRatePercent] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const res = await callApi({ method: METHOD.GET, endpoint: adminEndPoints.GET_COMMISSION_RATE });
                if (mounted && res?.success) {
                    setRatePercent((Number(res.data.commissionRate) * 100).toFixed(2));
                }
            } catch {
                toast.error("Failed to load commission rate");
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    const handleSave = async () => {
        const num = Number(ratePercent);
        if (Number.isNaN(num) || num < 0 || num >= 100) {
            toast.error("Rate must be a number in [0, 100).");
            return;
        }
        setSaving(true);
        try {
            const res = await callApi({
                method: METHOD.PUT,
                endpoint: adminEndPoints.UPDATE_COMMISSION_RATE,
                arg: { commissionRate: num / 100 },
            });
            if (res?.success) {
                toast.success("Commission rate updated");
                setRatePercent((Number(res.data.commissionRate) * 100).toFixed(2));
            } else {
                toast.error(res?.message || "Failed to update");
            }
        } catch (e) {
            toast.error(e?.message || "Failed to update");
        } finally {
            setSaving(false);
        }
    };

    return (
        <AdminDesignSystemPageShell>
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ mb: 2, color: "text.primary" }}>
                Platform Settings
            </Typography>
            <Card sx={{ maxWidth: 560, bgcolor: "background.paper" }}>
                <CardContent>
                    <Typography variant="subtitle1" sx={{ mb: 1, color: "text.primary" }}>
                        Coach payout commission
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
                        The platform retains this percentage of every completed booking. The coach receives the remainder.
                    </Typography>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <InputField
                            label="Rate (%)"
                            value={ratePercent}
                            onChange={(e) => setRatePercent(e.target.value)}
                            disabled={loading || saving}
                            type="number"
                            min={0}
                            max={99.99}
                            step={0.01}
                            style={{ width: 160 }}
                        />
                        <Button onClick={handleSave} disabled={loading || saving}>
                            {saving ? "Saving..." : "Save"}
                        </Button>
                    </Stack>
                </CardContent>
            </Card>
        </Box>
        </AdminDesignSystemPageShell>
    );
}
