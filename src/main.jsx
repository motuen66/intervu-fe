import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import toast, { ToastBar, Toaster } from "react-hot-toast"; // Thư viện bạn đang dùng
import "./index.css";
import { routes } from "./app/routes/index.jsx";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { rootReducer } from "./common/store/index.js";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "./common/constants/theme.jsx";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

const router = createBrowserRouter(routes);
export const store = configureStore({ reducer: rootReducer });

createRoot(document.getElementById("root")).render(
    <ThemeProvider theme={theme}>
        <Provider store={store}>
            <RouterProvider router={router} />
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 3000,
                    error: {
                        duration: Infinity, // Never close error toasts automatically
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
