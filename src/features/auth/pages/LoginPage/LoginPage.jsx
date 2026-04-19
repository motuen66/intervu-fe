import { useForm } from "react-hook-form";
import { useCallback, useEffect, useRef, useState } from "react";
import { callApi } from "../../../../common/utils/apiConnector";
import { METHOD } from "../../../../common/constants/api";
import { authEndPoints } from "../../services/authApi";
import { useDispatch } from "react-redux";
import { setToken, setUserData } from "../../../../common/store/authSlice";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import toast from "react-hot-toast";
import SplitText from "./SplitText";
import { Typography } from "@mui/material";
import { Button, InputField } from "../../../../common/design-system";
import { ROLES } from "../../../../common/constants/common";
import {
    ASSESSMENT_DATA_STATE,
    getAssessmentState,
} from "../../../profiles/candidate/candidate-assessment/services/assessmentApi";
import { trackLogin } from "../../../../utils/analytics";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_APP_GOOGLE_CLIENT_ID;

function LoginPage() {
    const navigate = useNavigate();
    const theme = useTheme();
    const dispatch = useDispatch();
    const googleButtonRef = useRef(null);
    const [googleReady, setGoogleReady] = useState(false);
    const [googleSubmitting, setGoogleSubmitting] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAuthSuccess = useCallback(
        async (responseData) => {
            const user = responseData.user;
            localStorage.setItem("user", JSON.stringify(user));
            localStorage.setItem("token", JSON.stringify(responseData.token));
            dispatch(setUserData(user));
            dispatch(setToken(responseData.token));

            if (user.role === ROLES.INTERVIEWER) {
                navigate("/schedule");
                return;
            }

            if (user.role === ROLES.ADMIN) {
                navigate("/admin/dashboard");
                return;
            }

            try {
                const assessmentState = await getAssessmentState(user.id);
                if (assessmentState.status === ASSESSMENT_DATA_STATE.NO_RECORD) {
                    navigate("/assessment");
                } else {
                    navigate("/home");
                }
            } catch (error) {
                navigate("/assessment");
            }
        },
        [dispatch, navigate],
    );

    useEffect(() => {
        localStorage.clear();
        dispatch(setUserData(null));
        dispatch(setToken(null));
    }, [dispatch]);

    const {
        register,
        handleSubmit,
        reset: resetForm,
        formState: { errors },
    } = useForm();

    const handleGoogleCredential = useCallback(
        async (googleResponse) => {
            const idToken = googleResponse?.credential;

            if (!idToken) {
                toast.error("Google sign-in failed. Missing token.");
                return;
            }

            setGoogleSubmitting(true);

            try {
                const response = await callApi({
                    method: METHOD.POST,
                    endpoint: authEndPoints.GOOGLE_LOGIN_API,
                    arg: { idToken },
                    alertErrorMessage: true,
                });

                if (!response) return;

                const { success, data: responseData } = response;
                if (success) {
                    try {
                        trackLogin(responseData?.user?.id ?? null, "google");
                    } catch (e) { }
                    await handleAuthSuccess(responseData);
                }
            } finally {
                setGoogleSubmitting(false);
            }
        },
        [handleAuthSuccess],
    );

    useEffect(() => {
        if (!GOOGLE_CLIENT_ID) return;

        const renderGoogleButton = () => {
            if (!window.google?.accounts?.id || !googleButtonRef.current) return;

            window.google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: handleGoogleCredential,
            });

            googleButtonRef.current.innerHTML = "";
            window.google.accounts.id.renderButton(googleButtonRef.current, {
                theme: "outline",
                size: "large",
                text: "continue_with",
                shape: "pill",
                width: 320,
            });

            setGoogleReady(true);
        };

        if (window.google?.accounts?.id) {
            renderGoogleButton();
            return;
        }

        const scriptId = "google-identity-services";
        const existingScript = document.getElementById(scriptId);

        if (existingScript) {
            existingScript.addEventListener("load", renderGoogleButton);
            return () => existingScript.removeEventListener("load", renderGoogleButton);
        }

        const script = document.createElement("script");
        script.id = scriptId;
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.onload = renderGoogleButton;
        document.body.appendChild(script);
    }, [handleGoogleCredential]);

    const handleAnimationComplete = () => {
        // optional callback when split text animation completes
    };

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        try {
            const response = await callApi({
                method: METHOD.POST,
                endpoint: authEndPoints.LOGIN_API,
                arg: {
                    email: data.email,
                    password: data.password,
                },
                alertErrorMessage: true,
            });

            if (!response) return;
            const { success, data: responseData } = response;

            if (success && responseData) {
                try {
                    trackLogin(responseData?.user?.id ?? null, "email");
                } catch (e) { }
                await handleAuthSuccess(responseData);
            }

            resetForm();
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background: "var(--claude-color-surface-parchment)",
            }}
        >
            {/* overlay container centers the login card */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 2,
                    padding: "24px",
                }}
            >
                {/* main two-column card */}
                <div
                    style={{
                        width: "960px",
                        maxWidth: "calc(100% - 48px)",
                        display: "flex",
                        borderRadius: "16px",
                        overflow: "hidden",
                        boxShadow: "0 20px 60px rgba(0,0,0,0.08)",
                        border: "none",
                        minHeight: "560px",
                        alignItems: "stretch",
                        background: "var(--claude-color-surface-ivory)",
                    }}
                >
                    {/* left: login column */}
                    <div
                        style={{
                            flex: 1,
                            padding: "40px 36px",
                            background: "var(--claude-color-surface-ivory)",
                            color: theme.palette.text.primary,
                            fontFamily: theme.typography.fontFamily,
                            display: "flex",
                            flexDirection: "column",
                            gap: "20px",
                            justifyContent: "center",
                            borderRight: "1px solid var(--claude-color-border-cream)",
                            position: "relative",
                        }}
                    >
                        {/* decorative corner accent - top left */}
                        <div
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "60px",
                                height: "60px",
                                background: "linear-gradient(135deg, rgba(15,23,42,0.08) 0%, transparent 100%)",
                                borderTopLeftRadius: "16px",
                            }}
                        ></div>

                        {/* decorative corner accent - bottom right */}
                        <div
                            style={{
                                position: "absolute",
                                bottom: 0,
                                right: 0,
                                width: "80px",
                                height: "80px",
                                background: "linear-gradient(315deg, rgba(15,23,42,0.05) 0%, transparent 100%)",
                            }}
                        ></div>

                        <div style={{ textAlign: "center", marginBottom: "12px", position: "relative", zIndex: 1 }}>
                            <Typography
                                variant="h4"
                                style={{
                                    fontSize: "32px",
                                    fontWeight: 700,
                                    color: theme.palette.text.primary,
                                    letterSpacing: "-0.5px",
                                    fontFamily: theme.typography.fontFamily,
                                }}
                            >
                                Welcome back
                            </Typography>
                            <div
                                style={{
                                    width: "60px",
                                    height: "3px",
                                    background: "linear-gradient(90deg, transparent, var(--claude-color-brand-terracotta), transparent)",
                                    margin: "12px auto 0",
                                    borderRadius: "2px",
                                }}
                            ></div>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ position: "relative", zIndex: 1 }}>
                            <div style={{ marginBottom: "16px" }}>
                                <InputField
                                    label="Email"
                                    type="email"
                                    placeholder="Enter your email"
                                    {...register("email", { required: "Email is required" })}
                                    error={errors.email?.message}
                                />
                            </div>

                            <div style={{ marginBottom: "8px" }}>
                                <InputField
                                    label="Password"
                                    type="password"
                                    placeholder="Enter your password"
                                    {...register("password", { required: "Password is required" })}
                                    error={errors.password?.message}
                                />
                            </div>

                            <div style={{ maxWidth: "360px", width: "100%", margin: "0 auto" }}>
                                <div style={{ textAlign: "right", marginTop: "0px", marginBottom: "12px" }}>
                                    <Link
                                        to="/forgot-password"
                                        style={{
                                            fontSize: "14px",
                                            color: theme.palette.primary.main,
                                            cursor: "pointer",
                                            fontWeight: 500,
                                            textDecoration: "none",
                                            position: "relative",
                                            zIndex: 2,
                                        }}
                                    >
                                        Forgot password?
                                    </Link>
                                </div>

                                <div style={{ display: "flex", justifyContent: "center" }}>
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        size="lg"
                                        disabled={isSubmitting || googleSubmitting}
                                        style={{ width: "100%" }}
                                    >
                                        Login
                                    </Button>
                                </div>

                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        margin: "16px 0 12px",
                                        gap: "10px",
                                    }}
                                >
                                    <div style={{ flex: 1, height: "1px", background: theme.palette.divider }}></div>
                                    <Typography
                                        style={{
                                            fontSize: "12px",
                                            color: theme.palette.text.secondary,
                                            letterSpacing: "0.8px",
                                        }}
                                    >
                                        OR
                                    </Typography>
                                    <div style={{ flex: 1, height: "1px", background: theme.palette.divider }}></div>
                                </div>

                                {!GOOGLE_CLIENT_ID ? (
                                    <Typography style={{ fontSize: "12px", color: "var(--claude-color-semantic-error)", textAlign: "center" }}>
                                        Google sign-in is not configured (missing VITE_APP_GOOGLE_CLIENT_ID).
                                    </Typography>
                                ) : (
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "center",
                                            alignItems: "center",
                                            minHeight: "44px",
                                            width: "100%",
                                            opacity: googleSubmitting ? 0.7 : 1,
                                        }}
                                    >
                                        <div ref={googleButtonRef} />
                                    </div>
                                )}

                                {!!GOOGLE_CLIENT_ID && !googleReady && !googleSubmitting && (
                                    <Typography
                                        style={{
                                            fontSize: "12px",
                                            color: theme.palette.text.secondary,
                                            textAlign: "center",
                                            marginTop: "6px",
                                        }}
                                    >
                                        Loading Google sign-in...
                                    </Typography>
                                )}

                                <div style={{ textAlign: "center", marginTop: "14px" }}>
                                    <Typography style={{ fontSize: "14px", color: theme.palette.text.secondary }}>
                                        Don't have an account?{" "}
                                        <Link
                                            to="/signup"
                                            style={{
                                                color: theme.palette.primary.main,
                                                cursor: "pointer",
                                                fontWeight: 600,
                                                textDecoration: "underline",
                                                position: "relative",
                                                zIndex: 2,
                                            }}
                                        >
                                            Sign up
                                        </Link>
                                    </Typography>
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* right: info / promo column */}
                    <div
                        style={{
                            flex: 1,
                            minHeight: "100%",
                            padding: "40px 36px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "linear-gradient(135deg, var(--claude-color-surface-ivory) 0%, var(--claude-color-border-warm) 30%, var(--claude-color-surface-warm-sand) 60%, var(--claude-color-surface-ivory) 100%)",
                            position: "relative",
                            overflow: "hidden",
                        }}
                    >
                        {/* decorative floating circles */}
                        <div
                            style={{
                                position: "absolute",
                                top: "10%",
                                right: "15%",
                                width: "120px",
                                height: "120px",
                                borderRadius: "50%",
                                background: "radial-gradient(circle, rgba(79,70,229,0.12) 0%, transparent 70%)",
                                filter: "blur(20px)",
                            }}
                        ></div>
                        <div
                            style={{
                                position: "absolute",
                                bottom: "15%",
                                left: "10%",
                                width: "150px",
                                height: "150px",
                                borderRadius: "50%",
                                background: "radial-gradient(circle, rgba(79,70,229,0.08) 0%, transparent 70%)",
                                filter: "blur(25px)",
                            }}
                        ></div>

                        {/* decorative grid pattern overlay */}
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                backgroundImage:
                                    "linear-gradient(rgba(79,70,229,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(79,70,229,0.06) 1px, transparent 1px)",
                                backgroundSize: "40px 40px",
                                opacity: 0.3,
                            }}
                        ></div>

                        <div style={{ textAlign: "center", pointerEvents: "none", position: "relative", zIndex: 1 }}>
                            <div style={{ marginBottom: "16px" }}>
                                <SplitText
                                    text="Intervu"
                                    tag="h1"
                                    className="text-3xl font-bold"
                                    delay={35}
                                    duration={0.9}
                                    ease="power3.out"
                                    splitType="chars"
                                    from={{ opacity: 0, y: 20 }}
                                    to={{ opacity: 1, y: 0 }}
                                    threshold={0.1}
                                    rootMargin="-100px"
                                    textAlign="center"
                                    onLetterAnimationComplete={handleAnimationComplete}
                                    playOnMount={true}
                                    loop={true}
                                    loopDelay={1.2}
                                    color="var(--claude-color-text-near-black)"
                                />
                            </div>

                            <div
                                style={{
                                    width: "80px",
                                    height: "2px",
                                    background: "linear-gradient(90deg, transparent, rgba(79,70,229,0.8), transparent)",
                                    margin: "16px auto",
                                    borderRadius: "2px",
                                }}
                            ></div>

                            <div>
                                <SplitText
                                    text="Online Interview Support System"
                                    tag="h2"
                                    className="text-xl"
                                    delay={45}
                                    duration={0.9}
                                    ease="power3.out"
                                    splitType="chars"
                                    from={{ opacity: 0, y: 20 }}
                                    to={{ opacity: 1, y: 0 }}
                                    threshold={0.1}
                                    rootMargin="-100px"
                                    textAlign="center"
                                    onLetterAnimationComplete={handleAnimationComplete}
                                    playOnMount={true}
                                    loop={true}
                                    loopDelay={1.2}
                                    color="var(--claude-color-text-olive-gray)"
                                />
                            </div>

                            {/* decorative subtitle */}
                            <div
                                style={{
                                    marginTop: "24px",
                                    fontSize: "13px",
                                    color: "rgba(0,0,0,0.4)",
                                    letterSpacing: "0.5px",
                                    lineHeight: "1.6",
                                }}
                            >
                                Created and operated by TheSuperTeam
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;

