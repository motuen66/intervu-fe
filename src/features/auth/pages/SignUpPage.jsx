import { useForm } from "react-hook-form";
import { callApi } from "../../../common/utils/apiConnector";
import { METHOD } from "../../../common/constants/api";
import { authEndPoints } from "../services/authApi";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import SplitText from "./LoginPage/SplitText";
import { TextField, Typography, InputAdornment, IconButton } from "@mui/material";
import { PrimaryButton } from "../../../common/components/buttons";
import toast from "react-hot-toast";
import { trackRegister } from "../../../utils/analytics";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";

function SignUpPage() {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const handleClickShowPassword = () => setShowPassword((s) => !s);
    const handleMouseDownPassword = (e) => e.preventDefault();
    const handleMouseUpPassword = (e) => e.preventDefault();
    const [passwordFocused, setPasswordFocused] = useState(false);
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
                background: "#ffffff",
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
                        background: "#fff",
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
                            background: "linear-gradient(135deg, #f8f9fc 0%, #e8eef5 30%, #dfe7f5 60%, #f5f7fa 100%)",
                            position: "relative",
                            overflow: "hidden",
                            borderRight: "1px solid #f0f0f5",
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
                                    color="#2a2a3e"
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
                                    color="#5a5a7a"
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
                            background: "#ffffff",
                            color: "#1a1a2e",
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
                                style={{ fontSize: "32px", fontWeight: 700, color: "#1a1a2e", letterSpacing: "-0.5px" }}
                            >
                                Create Account
                            </Typography>
                            <div
                                style={{
                                    width: "60px",
                                    height: "3px",
                                    background: "linear-gradient(90deg, transparent, #4F46E5, transparent)",
                                    margin: "12px auto 0",
                                    borderRadius: "2px",
                                }}
                            ></div>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ position: "relative", zIndex: 1 }}>
                            <div style={{ marginBottom: "14px" }}>
                                <TextField
                                    label="Full Name"
                                    type="text"
                                    variant="outlined"
                                    fullWidth
                                    sx={{
                                        "& .MuiOutlinedInput-root": {
                                            borderRadius: "8px",
                                            "& fieldset": { borderColor: "rgba(0,0,0,0.15)" },
                                            "&:hover fieldset": { borderColor: "#4F46E5" },
                                            "&.Mui-focused fieldset": { borderColor: "#4F46E5" },
                                        },
                                        "& .MuiInputAdornment-root": { opacity: 1, visibility: "visible" },
                                        "& .MuiInputLabel-root": { color: "rgba(0,0,0,0.6)" },
                                        "& .MuiInputLabel-root.Mui-focused": { color: "#4F46E5" },
                                    }}
                                    {...register("fullName", {
                                        required: "Full name is required",
                                        minLength: { value: 2, message: "Name is too short" },
                                    })}
                                    error={!!errors.fullName}
                                    helperText={errors.fullName?.message}
                                />
                            </div>

                            <div style={{ marginBottom: "14px" }}>
                                <TextField
                                    label="Email"
                                    type="email"
                                    variant="outlined"
                                    fullWidth
                                    sx={{
                                        "& .MuiOutlinedInput-root": {
                                            borderRadius: "8px",
                                            "& fieldset": { borderColor: "rgba(0,0,0,0.15)" },
                                            "&:hover fieldset": { borderColor: "#4F46E5" },
                                            "&.Mui-focused fieldset": { borderColor: "#4F46E5" },
                                        },
                                        "& .MuiInputLabel-root": { color: "rgba(0,0,0,0.6)" },
                                        "& .MuiInputLabel-root.Mui-focused": { color: "#4F46E5" },
                                    }}
                                    {...register("email", {
                                        required: "Email is required",
                                        pattern: {
                                            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                            message: "Invalid email format",
                                        },
                                    })}
                                    error={!!errors.email}
                                    helperText={errors.email?.message}
                                />
                            </div>

                            <div style={{ marginBottom: "20px" }}>
                                <TextField
                                    label="Password"
                                    type={showPassword ? "text" : "password"}
                                    variant="outlined"
                                    fullWidth
                                    sx={{
                                        "& .MuiOutlinedInput-root": {
                                            borderRadius: "8px",
                                            "& fieldset": { borderColor: "rgba(0,0,0,0.15)" },
                                            "&:hover fieldset": { borderColor: "#4F46E5" },
                                            "&.Mui-focused fieldset": { borderColor: "#4F46E5" },
                                        },
                                        "& .MuiInputLabel-root": { color: "rgba(0,0,0,0.6)" },
                                        "& .MuiInputLabel-root.Mui-focused": { color: "#4F46E5" },
                                    }}
                                    {...register("password", {
                                        required: "Password is required",
                                        minLength: { value: 8, message: "Password must be at least 8 characters" },
                                    })}
                                    error={!!errors.password}
                                    helperText={errors.password?.message}
                                    onFocus={() => setPasswordFocused(true)}
                                    onBlur={() => setPasswordFocused(false)}
                                    InputProps={{
                                        endAdornment: passwordFocused ? (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={handleClickShowPassword}
                                                    onMouseDown={handleMouseDownPassword}
                                                    onMouseUp={handleMouseUpPassword}
                                                    edge="end"
                                                >
                                                    {showPassword ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                                                </IconButton>
                                            </InputAdornment>
                                        ) : null,
                                    }}
                                />
                            </div>

                            <div style={{ display: "flex", justifyContent: "center" }}>
                                <PrimaryButton
                                    type="submit"
                                    loading={false}
                                    disabled={isSubmitting}
                                    fullWidth
                                    sx={{
                                        padding: "14px 28px",
                                        borderRadius: "10px",
                                        fontSize: "17px",
                                    }}
                                >
                                    Sign up
                                </PrimaryButton>
                            </div>

                            <div style={{ textAlign: "center", marginTop: "16px" }}>
                                <Typography style={{ fontSize: "14px", color: "rgba(0,0,0,0.6)" }}>
                                    Already have an account?{" "}
                                    <span
                                        onClick={() => navigate("/login")}
                                        style={{
                                            color: "#4F46E5",
                                            cursor: "pointer",
                                            fontWeight: 600,
                                            textDecoration: "underline",
                                        }}
                                    >
                                        Sign in
                                    </span>
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

