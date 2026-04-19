import { useForm } from "react-hook-form";
import { callApi } from "../../../common/utils/apiConnector";
import { METHOD } from "../../../common/constants/api";
import { authEndPoints } from "../services/authApi";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import SplitText from "./LoginPage/SplitText";
import { Typography } from "@mui/material";
import { Button, InputField } from "../../../common/design-system";
import toast from "react-hot-toast";
import { trackRegister } from "../../../utils/analytics";

function SignUpPage() {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const {
        register,
        handleSubmit,
        reset: resetForm,
        formState: { errors },
    } = useForm();

    const handleAnimationComplete = () => {
        // optional callback when split text animation completes
    };

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        try {
            const {
                success,
                data: responseData,
                message,
            } = await callApi({
                method: METHOD.POST,
                endpoint: authEndPoints.SIGN_UP_API,
                arg: {
                    fullName: data.fullName,
                    email: data.email,
                    password: data.password,
                },
                // don't auto-show backend success toast here to avoid duplication;
                // we'll show the message and control navigation explicitly
                displaySuccessMessage: false,
                alertErrorMessage: true,
            });

            if (success) {
                toast.success(message || "Account created successfully! Please log in.");
                try {
                    // Emit register event (frontend) — include user id if available
                    trackRegister(responseData?.id ?? responseData?.userId ?? null, "email");
                } catch (e) {
                    /* ignore analytics errors */
                }
                await new Promise((resolve) => setTimeout(resolve, 3000));
                navigate("/login");
            }
        } finally {
            setIsSubmitting(false);
            resetForm();
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
            {/* overlay container centers the signup card */}
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
                    {/* left: info / promo column */}
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
                            borderRight: "1px solid var(--claude-color-border-cream)",
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
                                background: "radial-gradient(circle, rgba(123,97,255,0.12) 0%, transparent 70%)",
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
                                background: "radial-gradient(circle, rgba(123,97,255,0.08) 0%, transparent 70%)",
                                filter: "blur(25px)",
                            }}
                        ></div>

                        {/* decorative grid pattern overlay */}
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                backgroundImage:
                                    "linear-gradient(rgba(123,97,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(123,97,255,0.06) 1px, transparent 1px)",
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
                                    background:
                                        "linear-gradient(90deg, transparent, rgba(123,97,255,0.8), transparent)",
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
                                Join us to streamline your hiring process
                            </div>
                        </div>
                    </div>

                    {/* right: signup column */}
                    <div
                        style={{
                            flex: 1,
                            padding: "40px 36px",
                            background: "var(--claude-color-surface-ivory)",
                            color: "var(--claude-color-text-near-black)",
                            display: "flex",
                            flexDirection: "column",
                            gap: "16px",
                            justifyContent: "center",
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
                                background: "linear-gradient(135deg, rgba(123,97,255,0.08) 0%, transparent 100%)",
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
                                background: "linear-gradient(315deg, rgba(123,97,255,0.05) 0%, transparent 100%)",
                                borderBottomRightRadius: "16px",
                            }}
                        ></div>

                        <div style={{ textAlign: "center", marginBottom: "8px", position: "relative", zIndex: 1 }}>
                            <Typography
                                variant="h4"
                                style={{ fontSize: "32px", fontWeight: 700, color: "var(--claude-color-text-near-black)", letterSpacing: "-0.5px" }}
                            >
                                Create Account
                            </Typography>
                            <div
                                style={{
                                    width: "60px",
                                    height: "3px",
                                    background: "linear-gradient(90deg, transparent, var(--claude-color-semantic-focus-blue), transparent)",
                                    margin: "12px auto 0",
                                    borderRadius: "2px",
                                }}
                            ></div>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ position: "relative", zIndex: 1 }}>
                            <div style={{ marginBottom: "14px" }}>
                                <InputField
                                    label="Full Name"
                                    type="text"
                                    placeholder="Enter your full name"
                                    {...register("fullName", {
                                        required: "Full name is required",
                                        minLength: { value: 2, message: "Name is too short" },
                                    })}
                                    error={errors.fullName?.message}
                                />
                            </div>

                            <div style={{ marginBottom: "14px" }}>
                                <InputField
                                    label="Email"
                                    type="email"
                                    placeholder="Enter your email"
                                    {...register("email", {
                                        required: "Email is required",
                                        pattern: {
                                            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                            message: "Invalid email format",
                                        },
                                    })}
                                    error={errors.email?.message}
                                />
                            </div>

                            <div style={{ marginBottom: "20px" }}>
                                <InputField
                                    label="Password"
                                    type="password"
                                    placeholder="Create a password"
                                    {...register("password", {
                                        required: "Password is required",
                                        minLength: { value: 8, message: "Password must be at least 8 characters" },
                                    })}
                                    error={errors.password?.message}
                                />
                            </div>

                            <div style={{ display: "flex", justifyContent: "center" }}>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    size="lg"
                                    disabled={isSubmitting}
                                    style={{ width: "100%" }}
                                >
                                    Sign up
                                </Button>
                            </div>

                            <div style={{ textAlign: "center", marginTop: "16px" }}>
                                <Typography style={{ fontSize: "14px", color: "rgba(0,0,0,0.6)" }}>
                                    Already have an account?{" "}
                                    <Link
                                        to="/login"
                                        style={{
                                            color: "var(--claude-color-semantic-focus-blue)",
                                            cursor: "pointer",
                                            fontWeight: 600,
                                            textDecoration: "underline",
                                            position: "relative",
                                            zIndex: 2,
                                        }}
                                    >
                                        Sign in
                                    </Link>
                                </Typography>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SignUpPage;

