import { useNavigate } from "react-router-dom";
import { Box, Container, Typography, Button, Stack, useTheme } from "@mui/material";
import { AlertCircle, Home, ArrowLeft } from "lucide-react";

const ErrorPage = ({ statusCode = 404, title, description }) => {
    const navigate = useNavigate();
    const theme = useTheme();

    const errorConfig = {
        404: {
            title: "Page Not Found",
            description: "Sorry, the page you're looking for doesn't exist or has been moved.",
            iconBgColor: theme.palette.primary.main,
            bgColor: theme.palette.background.default,
        },
        403: {
            title: "Access Denied",
            description: "You don't have permission to access this page. Please contact the administrator if you believe this is a mistake.",
            iconBgColor: theme.palette.error.main,
            bgColor: theme.palette.background.default,
        },
    };

    // Unified button colors
    const buttonColor = theme.palette.primary.main;
    const buttonDarkColor = theme.palette.primary.dark;

    const config = errorConfig[statusCode] || errorConfig[404];
    const displayTitle = title || config.title;
    const displayDescription = description || config.description;

    return (
        <Box
            sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "100vh",
                backgroundColor: config.bgColor,
                py: 4,
            }}
        >
            <Container maxWidth="sm">
                <Stack spacing={3} alignItems="center" textAlign="center">
                    {/* Error Icon */}
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 100,
                            height: 100,
                            borderRadius: "50%",
                            backgroundColor: config.iconBgColor,
                            color: "white",
                        }}
                    >
                        <AlertCircle size={56} />
                    </Box>

                    {/* Error Code */}
                    <Typography
                        variant="h1"
                        sx={{
                            fontSize: { xs: "3rem", md: "4rem" },
                            fontWeight: 700,
                            color: config.iconBgColor,
                            margin: 0,
                        }}
                    >
                        {statusCode}
                    </Typography>

                    {/* Title */}
                    <Typography
                        variant="h4"
                        sx={{
                            fontWeight: 600,
                            color: theme.palette.text.primary,
                        }}
                    >
                        {displayTitle}
                    </Typography>

                    {/* Description */}
                    <Typography
                        variant="body1"
                        sx={{
                            color: theme.palette.text.secondary,
                            lineHeight: 1.6,
                            maxWidth: "400px",
                        }}
                    >
                        {displayDescription}
                    </Typography>

                    {/* Action Buttons */}
                    <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={2}
                        sx={{ mt: 2 }}
                    >
                        <Button
                            variant="outlined"
                            size="large"
                            startIcon={<ArrowLeft size={20} />}
                            onClick={() => navigate(-1)}
                            sx={{
                                borderColor: theme.palette.divider,
                                color: theme.palette.text.secondary,
                                "&:hover": {
                                    borderColor: theme.palette.text.secondary,
                                    backgroundColor: theme.palette.action.hover,
                                },
                            }}
                        >
                            Go Back
                        </Button>
                        <Button
                            variant="contained"
                            size="large"
                            startIcon={<Home size={20} />}
                            onClick={() => navigate("/")}
                            sx={{
                                backgroundColor: buttonColor,
                                "&:hover": {
                                    backgroundColor: buttonDarkColor,
                                },
                            }}
                        >
                            Home
                        </Button>
                    </Stack>
                </Stack>
            </Container>
        </Box>
    );
};

export default ErrorPage;
