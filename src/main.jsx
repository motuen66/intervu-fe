import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import toast, { ToastBar, Toaster } from "react-hot-toast"; // Thư viện bạn đang dùng
import "./index.css";
import "./i18n";
import { routes } from "./app/routes/index.jsx";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { rootReducer } from "./common/store/index.js";
import { ThemeProvider } from "@mui/material/styles";
import GlobalStyles from "@mui/material/GlobalStyles";
import { createAppTheme } from "./common/constants/theme.jsx";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import i18n from "./i18n";

const router = createBrowserRouter(routes);
export const store = configureStore({ reducer: rootReducer });

// Wrapper component to handle dynamic theme changes based on language
function AppWithTheme() {
  const { i18n: i18nInstance } = useTranslation();
  const [currentTheme, setCurrentTheme] = useState(() => createAppTheme(i18nInstance.language));

  useEffect(() => {
    const handleLanguageChange = (lng) => {
      setCurrentTheme(createAppTheme(lng));
      
      // Set CSS variables for fonts based on language
      const isVietnamese = lng === 'vi';
      const headingFont = isVietnamese 
        ? '"Helvetica", "Arial", sans-serif'
        : '"Outfit", "Plus Jakarta Sans", "Inter", sans-serif';
      const bodyFont = isVietnamese
        ? '"Helvetica", "Arial", sans-serif'
        : '"Inter", "Roboto", "Helvetica", "Arial", sans-serif';
      
      document.documentElement.style.setProperty('--heading-font', headingFont);
      document.documentElement.style.setProperty('--body-font', bodyFont);
    };

    i18n.on('languageChanged', handleLanguageChange);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, []);

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

  return (
    <ThemeProvider theme={currentTheme}>
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
    </ThemeProvider>
  );
}

createRoot(document.getElementById("root")).render(
    <Provider store={store}>
      <AppWithTheme />
    </Provider>,
);
