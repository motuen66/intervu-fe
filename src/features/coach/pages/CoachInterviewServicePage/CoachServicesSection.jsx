import React, { useEffect, useState } from "react";
import { Box, CardContent, CircularProgress, Stack, Typography } from "@mui/material";
import BaseCard from "../../../../common/components/cards/BaseCard";
import StatusChip from "../../../../common/components/StatusChip";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CodeIcon from "@mui/icons-material/Code";
import { getCoachInterviewServices } from "../../services/coachInterviewServiceApi";

/**
 * Displays the list of interview services a coach offers.
 * Meant to be embedded in the Public Coach Profile page.
 *
 * @param {{ coachId: string }} props
 */
export default function CoachServicesSection({ coachId }) {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!coachId) return;
        let cancelled = false;
        const load = async () => {
            setLoading(true);
            try {
                const data = await getCoachInterviewServices(coachId);
                if (!cancelled) setServices(data || []);
            } catch (err) {
                console.error("Error loading coach services:", err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        load();
        return () => {
            cancelled = true;
        };
    }, [coachId]);

    if (loading) {
        return (
            <BaseCard variant="outlined" sx={{ p: 3 }}>
                <Box display="flex" justifyContent="center" py={3}>
                    <CircularProgress size={28} />
                </Box>
            </BaseCard>
        );
    }

    if (!services.length) return null;

    return (
        <BaseCard variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Interview Services
            </Typography>
            <Stack spacing={1.5}>
                {services.map((svc) => (
                    <BaseCard
                        key={svc.id}
                        variant="outlined"
                        sx={{
                            borderRadius: 2,
                            "&:hover": {
                                borderColor: "#4F46E5",
                                boxShadow: "0 2px 8px rgba(79,70,229,0.10)",
                            },
                            transition: "border-color 0.2s, box-shadow 0.2s",
                        }}
                    >
                        <CardContent sx={{ py: 1.5, px: 2, "&:last-child": { pb: 1.5 } }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Box>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <Typography fontWeight={600} fontSize="0.95rem">
                                            {svc.interviewTypeName}
                                        </Typography>
                                        {svc.isCoding && (
                                            <StatusChip
                                                icon={<CodeIcon sx={{ fontSize: 14 }} />}
                                                label="Coding"
                                                color="success"
                                            />
                                        )}
                                    </Stack>
                                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 0.5 }}>
                                        <Stack direction="row" spacing={0.5} alignItems="center">
                                            <AccessTimeIcon sx={{ fontSize: 14, color: "#94a3b8" }} />
                                            <Typography variant="body2" color="text.secondary">
                                                {svc.durationMinutes} min
                                            </Typography>
                                        </Stack>
                                    </Stack>
                                </Box>
                                <Typography fontWeight={700} fontSize="1rem" sx={{ color: "#4F46E5" }}>
                                    {svc.price?.toLocaleString()} ₫
                                </Typography>
                            </Stack>
                        </CardContent>
                    </BaseCard>
                ))}
            </Stack>
        </BaseCard>
    );
}
