import { useState, useEffect } from "react";
import { callApi } from "../../../common/utils/apiConnector";
import { METHOD } from "../../../common/constants/api";
import { adminEndPoints } from "../services/adminApi";

export default function useAdminAnalytics() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let mounted = true;
        async function fetchAnalytics() {
            setLoading(true);
            try {
                const res = await callApi({ method: METHOD.GET, endpoint: adminEndPoints.GET_ANALYTICS });
                if (mounted && res && res.success && res.data) {
                    setData(res.data);
                } else {
                    if (mounted) setData(mockAnalytics());
                }
            } catch (err) {
                if (mounted) setData(mockAnalytics());
            } finally {
                if (mounted) setLoading(false);
            }
        }

        fetchAnalytics();

        return () => {
            mounted = false;
        };
    }, []);

    return { data, loading, error };
}

function mockAnalytics() {
    const now = Date.now();

    const revenueData = Array.from({ length: 7 }).map((_, i) => ({
        date: new Date(now - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
        }),
        revenue: Math.floor(Math.random() * 5000) + 1000,
    }));

    const userDistribution = [
        { name: "Candidates", value: 450, color: "#0EA5E9" },
        { name: "Coaches", value: 120, color: "#D9F99D" },
        { name: "Admins", value: 5, color: "#0F172A" },
    ];

    const activityData = Array.from({ length: 7 }).map((_, i) => ({
        date: new Date(now - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
        }),
        rooms: Math.floor(Math.random() * 20) + 5,
        questions: Math.floor(Math.random() * 50) + 10,
    }));

    return { revenueData, userDistribution, activityData };
}
