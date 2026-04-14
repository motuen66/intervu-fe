import { useEffect, useState } from "react";
import { Backdrop, Box } from "@mui/material";
import { useSelector } from "react-redux";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import "./GlobalLoadingOverlay.css";
import trailLoading from "../../../assets/illustrations/Trail loading.lottie";

const SHOW_DELAY_MS = 0;
const MIN_VISIBLE_MS = 500;

function GlobalLoadingOverlay() {
    const isLoading = useSelector((state) => Boolean(state.auth?.loading));
    const [isVisible, setIsVisible] = useState(false);
    const [visibleAt, setVisibleAt] = useState(0);

    useEffect(() => {
        let showTimer;
        let hideTimer;

        if (isLoading) {
            showTimer = setTimeout(() => {
                setIsVisible(true);
                setVisibleAt(Date.now());
            }, SHOW_DELAY_MS);
            return () => clearTimeout(showTimer);
        }

        if (!isVisible) return undefined;

        const elapsed = Date.now() - visibleAt;
        const wait = Math.max(0, MIN_VISIBLE_MS - elapsed);
        hideTimer = setTimeout(() => setIsVisible(false), wait);

        return () => clearTimeout(hideTimer);
    }, [isLoading, isVisible, visibleAt]);

    return (
        <Backdrop
            className="global-loader-backdrop"
            open={isVisible}
            sx={{ zIndex: (theme) => theme.zIndex.modal + 100 }}
        >
            <Box className="global-loader-content">
                <DotLottieReact
                    src={trailLoading}
                    loop
                    autoplay
                    className="global-loader-lottie"
                />
                {/* <Box className="global-loader-title">Loading...</Box> */}
            </Box>
        </Backdrop>
    );
}

export default GlobalLoadingOverlay;
