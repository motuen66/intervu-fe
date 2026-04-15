import React from "react";
import { useParams } from "react-router-dom";
import RoadmapDashboard from "./RoadmapDashboard";

// B4 / B5: read-only roadmap for public sharing, coach prep, and admin review.
// The same backend endpoint is reused; gating is the caller's responsibility
// (public route is unguarded, coach/admin routes live behind ProtectedRoute).
export default function PublicRoadmapPage() {
    const { userId } = useParams();
    return <RoadmapDashboard userId={userId} readOnly />;
}
