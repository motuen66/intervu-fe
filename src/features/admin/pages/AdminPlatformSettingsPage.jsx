import { useCallback, useEffect, useState } from "react";
import { Box, Card, CardContent, CircularProgress, Stack, Typography } from "@mui/material";
import toast from "react-hot-toast";
import { callApi } from "../../../common/utils/apiConnector";
import { formatCurrency } from "../../../common/utils/dateFormatter";
import { METHOD } from "../../../common/constants/api";
import { adminEndPoints } from "../services/adminApi";
import PrimaryButton from "../../../common/components/buttons/PrimaryButton";
import SecondaryButton from "../../../common/components/buttons/SecondaryButton";
import FormTextField from "../../../common/components/form/FormTextField";
import PageHeader from "../../../common/components/PageHeader";
import SectionHeading from "../../../common/components/SectionHeading";

function getApiErrorMessage(err, fallback) {
    return err?.response?.data?.message || err?.message || fallback;
}

export default function AdminPlatformSettingsPage() {
    const [ratePercent, setRatePercent] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [payoutLoading, setPayoutLoading] = useState(true);
    const [payoutData, setPayoutData] = useState(null);
    const [payoutError, setPayoutError] = useState(null);

    const loadPayoutBalance = useCallback(async () => {
        setPayoutLoading(true);
        setPayoutError(null);
        try {
            const res = await callApi({
                method: METHOD.GET,
                endpoint: adminEndPoints.GET_PAYOUT_ACCOUNT_BALANCE,
            });
            if (res?.success && res.data) {
                setPayoutData(res.data);
            } else {
                setPayoutError("Unexpected response");
            }
        } catch (err) {
            const msg = getApiErrorMessage(err, "Failed to load PayOS payout balance");
            setPayoutError(msg);
            setPayoutData(null);
            toast.error(msg);
        } finally {
            setPayoutLoading(false);
        }
    }, []);

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

    useEffect(() => {
        loadPayoutBalance();
    }, [loadPayoutBalance]);

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
        <Box sx={{ p: 3 }}>
            <PageHeader title="Platform Settings" />
            <Stack spacing={3} sx={{ maxWidth: 560 }}>
                <Card sx={{ bgcolor: "background.paper" }}>
                    <CardContent>
                        <SectionHeading
                            title="Coach payout commission"
                            description="The platform retains this percentage of every completed booking. The coach receives the remainder."
                            size="sm"
                        />
                        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
                            <FormTextField
                                label="Rate (%)"
                                value={ratePercent}
                                onChange={(e) => setRatePercent(e.target.value)}
                                disabled={loading || saving}
                                type="number"
                                inputProps={{ min: 0, max: 99.99, step: 0.01 }}
                                sx={{ width: 160 }}
                            />
                            <PrimaryButton onClick={handleSave} disabled={loading || saving}>
                                {saving ? "Saving..." : "Save"}
                            </PrimaryButton>
                        </Stack>
                    </CardContent>
                </Card>

                <Card sx={{ bgcolor: "background.paper" }}>
                    <CardContent>
                        <SectionHeading
                            title="PayOS payout account"
                            description="Spend account balance used for coach payouts (PayOS channel)."
                            size="sm"
                            disableGutters
                            action={
                                <SecondaryButton onClick={loadPayoutBalance} disabled={payoutLoading}>
                                    Refresh
                                </SecondaryButton>
                            }
                        />

                        {payoutLoading && (
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 2 }}>
                                <CircularProgress size={20} color="primary" />
                                <Typography variant="body2" color="text.secondary">
                                    Loading balance…
                                </Typography>
                            </Stack>
                        )}

                        {!payoutLoading && payoutError && (
                            <Typography variant="body2" color="error.main" sx={{ mt: 2 }}>
                                {payoutError}
                            </Typography>
                        )}

                        {!payoutLoading && !payoutError && payoutData && (() => {
                            const trimmed = String(payoutData.balance ?? "").trim();
                            const n = Number(trimmed.replace(/,/g, ""));
                            const balanceText =
                                !trimmed
                                    ? "—"
                                    : Number.isFinite(n)
                                      ? formatCurrency(n)
                                      : payoutData.currency
                                        ? `${trimmed} ${payoutData.currency}`.trim()
                                        : trimmed;
                            return (
                                <Stack spacing={1} sx={{ mt: 2 }}>
                                    <Typography variant="h5" component="p" color="text.primary">
                                        {balanceText}
                                    </Typography>
                                    {(payoutData.accountName || payoutData.accountNumber) && (
                                        <Typography variant="body2" color="text.secondary">
                                            {[payoutData.accountName, payoutData.accountNumber].filter(Boolean).join(" · ")}
                                        </Typography>
                                    )}
                                </Stack>
                            );
                        })()}
                    </CardContent>
                </Card>
            </Stack>
        </Box>
    );
}
