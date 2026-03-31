import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import toast, { ToastBar, Toaster } from "react-hot-toast"; // Thư viện bạn đang dùng
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

const router = createBrowserRouter(routes);
export const store = configureStore({ reducer: rootReducer });

// Premium multi-layer background — config here, not in any CSS file
const appBackground = {
    backgroundColor: "#F8FAFC",
    backgroundImage: [
        // Lime atmospheric glow — top-left
        "radial-gradient(at 0% 0%, rgba(217, 249, 157, 0.07) 0px, transparent 50%)",
        // Indigo glow — top-right (soft light source)
        "radial-gradient(at 100% 0%, rgba(99, 102, 241, 0.11) 0px, transparent 50%)",
        // Secondary Indigo blob — bottom-right (depth layer)
        "radial-gradient(at 80% 100%, rgba(165, 180, 252, 0.09) 0px, transparent 40%)",
    ].join(","),
    minHeight: "100vh",
};

createRoot(document.getElementById("root")).render(
    <ThemeProvider theme={theme}>
        <GlobalStyles styles={{ html: { scrollBehavior: "smooth" }, body: appBackground }} />
        <Provider store={store}>
            <RouterProvider router={router} />
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
                                        ✕
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
    </ThemeProvider>,
);
