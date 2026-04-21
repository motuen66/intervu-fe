import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import toast, { ToastBar, Toaster } from "react-hot-toast";
import "./index.css";
import { routes } from "./app/routes/index.jsx";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { rootReducer } from "./common/store/index.js";
import { ThemeProvider } from "@mui/material/styles";
import GlobalStyles from "@mui/material/GlobalStyles";
import { theme } from "./common/constants/theme.jsx";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { initGA, trackAppOpen } from "./utils/analytics";
import GlobalLoadingOverlay from "./common/components/loaders/GlobalLoadingOverlay";
import ChunkErrorBoundary from "./common/components/ChunkErrorBoundary";

const router = createBrowserRouter(routes);
export const store = configureStore({ reducer: rootReducer });

const appBackground = {
    backgroundColor: "#F8FAFC",
    backgroundImage: [
        "radial-gradient(at 0% 0%, rgba(217, 249, 157, 0.07) 0px, transparent 50%)",
        "radial-gradient(at 100% 0%, rgba(99, 102, 241, 0.11) 0px, transparent 50%)",
        "radial-gradient(at 80% 100%, rgba(165, 180, 252, 0.09) 0px, transparent 40%)",
    ].join(","),
    minHeight: "100vh",
};

initGA();
try {
    trackAppOpen();
} catch (err) {
    console.warn("trackAppOpen failed", err);
}

createRoot(document.getElementById("root")).render(
    <ChunkErrorBoundary>
        <ThemeProvider theme={theme}>
            <GlobalStyles styles={{ html: { scrollBehavior: "smooth" }, body: appBackground }} />
            <Provider store={store}>
                <RouterProvider router={router} />
                <GlobalLoadingOverlay />
                <Toaster
                    position="top-right"
                    toastOptions={{
                        duration: 4000,
                        error: {
                            duration: 4000,
                        },
                    }}
                >
                    {(t) => (
                        <ToastBar toast={t}>
                            {({ icon, message }) => (
                                <>
                                    {icon}
                                    {message}
                                    {t.type !== "loading" && (
                                        <button
                                            onClick={() => toast.dismiss(t.id)}
                                            style={{
                                                background: "transparent",
                                                border: "none",
                                                cursor: "pointer",
                                                marginLeft: "8px",
                                                fontSize: "16px",
                                                padding: "0 4px",
                                            }}
                                        >
                                            x
                                        </button>
                                    )}
                                </>
                            )}
                        </ToastBar>
                    )}
                </Toaster>
                <Analytics />
                <SpeedInsights />
            </Provider>
        </ThemeProvider>
    </ChunkErrorBoundary>,
);
