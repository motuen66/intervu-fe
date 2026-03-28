import { useForm } from "react-hook-form";
import { useEffect } from "react";
import useLoading from "../../../../common/hooks/useLoading";
import { callApi } from "../../../../common/utils/apiConnector";
import { METHOD } from "../../../../common/constants/api";
import { authEndPoints } from "../../services/authApi";
import { useDispatch } from "react-redux";
import { setToken, setUserData } from "../../../../common/store/authSlice";
import { useNavigate } from "react-router-dom";
import DarkVeil from './DarkVeil';
import SplitText from "./SplitText";
import { TextField, Typography } from '@mui/material';
import { PrimaryButton } from "../../../../common/components/buttons";
import { ROLES } from "../../../../common/constants/common";

const getCandidateFirstLoginAssessmentKey = (userId) => `candidate-assessment-seen:${userId}`;
function LoginPage() {
    const isLoading = useLoading();
    const dispatch = useDispatch();

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
    const navigate = useNavigate();
    const handleAnimationComplete = () => {
        // optional callback when split text animation completes
    };

    const onSubmit = async (data) => {
        const { success, data: responseData, message } = await callApi({
            method: METHOD.POST,
            endpoint: authEndPoints.LOGIN_API,
            arg: {
                email: data.email,
                password: data.password,
            },
            alertErrorMessage: true,
        });

        if (success) {
            localStorage.setItem("user", JSON.stringify(responseData.user));
            localStorage.setItem("token", JSON.stringify(responseData.token));
            dispatch(setUserData(responseData.user));
            dispatch(setToken(responseData.token));

            if (responseData.user.role === ROLES.INTERVIEWER) {
                navigate("/schedule");
            } else if (responseData.user.role === ROLES.ADMIN) {
                navigate("/admin/dashboard");
            } else {
                const assessmentSeenKey = getCandidateFirstLoginAssessmentKey(responseData.user.id);
                const hasSeenAssessment = localStorage.getItem(assessmentSeenKey) === "true";
                if (!hasSeenAssessment) {
                    localStorage.setItem(assessmentSeenKey, "true");
                }
                navigate(hasSeenAssessment ? "/home" : "/assessment");
            }
        }
        resetForm();
    };

    return (
        <div style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', overflow: 'hidden', background: '#ffffff' }}>
            {/* LightVeil effect with pastel blue colors */}
            <DarkVeil
                lightMode={true}
                hueShift={200}
                speed={0.3}
                warpAmount={0.5}
            />

            {/* overlay container centers the login card */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, padding: '24px' }}>
                {/* main two-column card */}
                <div style={{ width: '960px', maxWidth: 'calc(100% - 48px)', display: 'flex', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.08)', border: 'none', minHeight: '560px', alignItems: 'stretch', background: '#fff' }}>

                    {/* left: login column */}
                    <div style={{ flex: 1, padding: '40px 36px', background: '#ffffff', color: '#111827', display: 'flex', flexDirection: 'column', gap: '20px', justifyContent: 'center', borderRight: '1px solid #E5E7EB', position: 'relative' }}>

                        {/* decorative corner accent - top left */}
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '60px', height: '60px', background: 'linear-gradient(135deg, rgba(79,70,229,0.08) 0%, transparent 100%)', borderTopLeftRadius: '16px' }}></div>

                        {/* decorative corner accent - bottom right */}
                        <div style={{ position: 'absolute', bottom: 0, right: 0, width: '80px', height: '80px', background: 'linear-gradient(315deg, rgba(79,70,229,0.05) 0%, transparent 100%)' }}></div>

                        <div style={{ textAlign: 'center', marginBottom: '12px', position: 'relative', zIndex: 1 }}>
                            <Typography variant="h4" style={{ fontSize: '32px', fontWeight: 700, color: '#111827', letterSpacing: '-0.5px' }}>
                                Welcome back
                            </Typography>
                            <div style={{ width: '60px', height: '3px', background: 'linear-gradient(90deg, transparent, #4F46E5, transparent)', margin: '12px auto 0', borderRadius: '2px' }}></div>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ position: 'relative', zIndex: 1 }}>
                            <div style={{ marginBottom: '16px' }}>
                                <TextField
                                    label="Email"
                                    type="email"
                                    variant="outlined"
                                    fullWidth
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: '8px',
                                            '& fieldset': { borderColor: 'rgba(0,0,0,0.15)' },
                                            '&:hover fieldset': { borderColor: '#4F46E5' },
                                            '&.Mui-focused fieldset': { borderColor: '#4F46E5' }
                                        },
                                        '& .MuiInputLabel-root': { color: 'rgba(0,0,0,0.6)' },
                                        '& .MuiInputLabel-root.Mui-focused': { color: '#4F46E5' }
                                    }}
                                    {...register('email', { required: 'Email is required' })}
                                    error={!!errors.email}
                                    helperText={errors.email?.message}
                                />
                            </div>

                            <div style={{ marginBottom: '24px' }}>
                                <TextField
                                    label="Password"
                                    type="password"
                                    variant="outlined"
                                    fullWidth
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: '8px',
                                            '& fieldset': { borderColor: 'rgba(0,0,0,0.15)' },
                                            '&:hover fieldset': { borderColor: '#4F46E5' },
                                            '&.Mui-focused fieldset': { borderColor: '#4F46E5' }
                                        },
                                        '& .MuiInputLabel-root': { color: 'rgba(0,0,0,0.6)' },
                                        '& .MuiInputLabel-root.Mui-focused': { color: '#4F46E5' }
                                    }}
                                    {...register('password', { required: 'Password is required' })}
                                    error={!!errors.password}
                                    helperText={errors.password?.message}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                {isLoading ? (
                                    <Typography color="#666">...Loading</Typography>
                                ) : (
                                    <PrimaryButton
                                        type="submit"
                                        loading={isLoading}
                                        fullWidth
                                        sx={{
                                            padding: '14px 28px',
                                            borderRadius: '8px',
                                            fontSize: '17px',
                                        }}
                                    >
                                        Sign in
                                    </PrimaryButton>
                                )}
                            </div>
                            <div style={{ textAlign: 'right', marginTop: '8px', marginBottom: '8px' }}>
                                <Typography
                                    onClick={() => navigate('/forgot-password')}
                                    style={{ fontSize: '14px', color: '#4F46E5', cursor: 'pointer', fontWeight: 500, textDecoration: 'none' }}
                                    sx={{
                                        '&:hover': {
                                            textDecoration: 'underline'
                                        }
                                    }}
                                >
                                    Forgot password?
                                </Typography>
                            </div>
                            <div style={{ textAlign: 'center', marginTop: '16px' }}>
                                <Typography style={{ fontSize: '14px', color: 'rgba(0,0,0,0.6)' }}>
                                    Don't have an account?{' '}
                                    <span
                                        onClick={() => navigate('/signup')}
                                        style={{ color: '#4F46E5', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}
                                    >
                                        Sign up
                                    </span>
                                </Typography>
                            </div>
                        </form>
                    </div>

                    {/* right: info / promo column */}
                    <div style={{ flex: 1, minHeight: '100%', padding: '40px 36px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f8f9fc 0%, #e8eef5 30%, #dfe7f5 60%, #f5f7fa 100%)', position: 'relative', overflow: 'hidden' }}>

                        {/* decorative floating circles */}
                        <div style={{ position: 'absolute', top: '10%', right: '15%', width: '120px', height: '120px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,70,229,0.12) 0%, transparent 70%)', filter: 'blur(20px)' }}></div>
                        <div style={{ position: 'absolute', bottom: '15%', left: '10%', width: '150px', height: '150px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,70,229,0.08) 0%, transparent 70%)', filter: 'blur(25px)' }}></div>

                        {/* decorative grid pattern overlay */}
                        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(79,70,229,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(79,70,229,0.06) 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.3 }}></div>

                        <div style={{ textAlign: 'center', pointerEvents: 'none', position: 'relative', zIndex: 1 }}>
                            <div style={{ marginBottom: '16px' }}>
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

                            <div style={{ width: '80px', height: '2px', background: 'linear-gradient(90deg, transparent, rgba(79,70,229,0.8), transparent)', margin: '16px auto', borderRadius: '2px' }}></div>

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
                            <div style={{ marginTop: '24px', fontSize: '13px', color: 'rgba(0,0,0,0.4)', letterSpacing: '0.5px', lineHeight: '1.6' }}>
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
