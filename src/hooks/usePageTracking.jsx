import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPage } from "../utils/analytics";

export default function usePageTracking() {
    const location = useLocation();

    useEffect(() => {
        const path = location.pathname + (location.search || "");
        trackPage(path);
    }, [location]);
}
