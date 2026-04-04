import { useState, useEffect, useMemo } from "react";
import {
    Alert,
    Modal,
    Box,
    Typography,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Rating,
    TextField,
    Button,
    Stack,
    CircularProgress,
    Chip,
    Divider,
    IconButton,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import RateReviewOutlinedIcon from "@mui/icons-material/RateReviewOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import PendingActionsOutlinedIcon from "@mui/icons-material/PendingActionsOutlined";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { callApi } from "../../../../common/utils/apiConnector.js";
import { METHOD } from "../../../../common/constants/api.js";
import { interviewEndPoints } from "../../services/interviewRoomApi";
import { buttonStyles, fieldStyles, dialogStyles } from "../../../../common/constants/uiStyles";

const formatFeedbackTimeRange = (scheduledTime, durationMinutes) => {
    const startTime = scheduledTime ? new Date(scheduledTime) : null;
    const endTime = startTime && durationMinutes
        ? new Date(startTime.getTime() + durationMinutes * 60000)
        : null;

    const startLabel = startTime
        ? startTime.toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
        })
        : "";

    const endLabel = endTime
        ? endTime.toLocaleTimeString(undefined, {
            timeStyle: "short",
        })
        : "";

    return startLabel && endLabel ? `${startLabel} - ${endLabel}` : "";
};

function FeedbackListModal({ open, onClose, onFeedbackSubmitted, mode = 'pending' }) {
    const theme = useTheme();
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [selectedFeedback, setSelectedFeedback] = useState(null);
    const [rating, setRating] = useState(0);
    const [comments, setComments] = useState('');
    const [error, setError] = useState('');
    const [feedbackTimeRange, setFeedbackTimeRange] = useState('');

    useEffect(() => {
        const fetchFeedbacks = async () => {
            setLoading(true);
            try {
                const res = await callApi({
                    method: METHOD.GET,
                    endpoint: interviewEndPoints.GET_FEEDBACKS,
                });
                const feedbackData = res?.data?.items;
                if (feedbackData) {
                    if (mode === 'pending') {
                        const pending = feedbackData.filter(fb => !fb.comments || fb.comments.trim() === '');
                        setFeedbacks(pending);
                        if (pending.length === 1) {
                            const only = pending[0];
                            const timeRangeLabel = formatFeedbackTimeRange(only.scheduledTime, only.durationMinutes);
                            handleFeedbackSelect(only, timeRangeLabel);
                        }
                    } else {
                        setFeedbacks(feedbackData);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch feedbacks:", error);
            } finally {
                setLoading(false);
            }
        };

        if (open) {
            fetchFeedbacks();
        }
    }, [open, mode]);

    const handleFeedbackSelect = (feedback, timerange) => {
        setSelectedFeedback(feedback);
        setFeedbackTimeRange(timerange);
        setRating(feedback.rating || 0);
        setComments(feedback.comments || '');
        setError(''); // Clear previous errors when selecting a new item
    };

    const handleRatingChange = (event, newRating) => {
        setRating(newRating);
    };

    const handleCommentsChange = (event) => {
        setComments(event.target.value);
    };

    const handleSubmit = async () => {
        if (!selectedFeedback || submitting) return;

        const normalizedComments = comments.trim();
        if (!rating || !normalizedComments) {
            setError("Please provide both a rating and comments before submitting.");
            return;
        }

        try {
            setError('');
            setSubmitting(true);
            await callApi({
                method: METHOD.PUT,
                endpoint: interviewEndPoints.UPDATE_FEEDBACK(selectedFeedback.feedbackId),
                arg: { rating, comments: normalizedComments },
            });

            if (onFeedbackSubmitted) {
                onFeedbackSubmitted();
            }

            const isLastPending = mode === "pending" && feedbacks.length === 1;
            const updatedFeedbacks = mode === "pending"
                ? feedbacks.filter((fb) => fb.feedbackId !== selectedFeedback.feedbackId)
                : feedbacks.map((fb) =>
                    fb.feedbackId === selectedFeedback.feedbackId
                        ? { ...fb, comments: normalizedComments, rating }
                        : fb
                );

            setFeedbacks(updatedFeedbacks);

            setSelectedFeedback(null);
            setRating(0);
            setComments('');
            setFeedbackTimeRange('');

            if (isLastPending) {
                onClose();
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Failed to update feedback. Please try again.";
            setError(errorMessage);
            console.error("Failed to update feedback:", error.response?.data || error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = (event, reason) => {
        const hasPending = mode === 'pending' && feedbacks.length > 0;
        if (hasPending && (reason === 'backdropClick' || reason === 'escapeKeyDown')) {
            return;
        }
        onClose();

        setSelectedFeedback(null);
        setRating(0);
        setComments('');
        setFeedbackTimeRange('');
        setError('');
    };

    const hasPendingFeedbacks = mode === 'pending' && feedbacks.length > 0;
    const submitDisabled = useMemo(
        () => submitting || !rating || comments.trim().length === 0,
        [submitting, rating, comments]
    );

    return (
        <Modal
            open={open}
            onClose={handleClose}
            aria-labelledby="feedback-list-modal"
            aria-describedby="feedback-submission-form"
        >
            <Box
                sx={(theme) => ({
                    ...dialogStyles.paper(theme),
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: 560,
                    maxWidth: "90vw",
                    maxHeight: "88vh",
                    p: 3,
                    display: "flex",
                    flexDirection: "column",
                })}
            >
                <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1.5} sx={{ mb: 2 }}>
                    <Box>
                        <Typography id="feedback-list-modal" variant="h4" component="h2">
                            {mode === 'pending' ? 'Pending Feedbacks' : 'All Feedbacks'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {feedbacks.length} {feedbacks.length === 1 ? "interview" : "interviews"}
                        </Typography>
                    </Box>
                    {!hasPendingFeedbacks && (
                        <IconButton
                            size="small"
                            onClick={() => handleClose()}
                            aria-label="Close feedback modal"
                            sx={{ color: "text.secondary" }}
                        >
                            <CloseRoundedIcon fontSize="small" />
                        </IconButton>
                    )}
                </Stack>

                {loading ? (
                    <Stack direction="row" spacing={1.25} alignItems="center" justifyContent="center" sx={{ py: 6 }}>
                        <CircularProgress size={20} />
                        <Typography color="text.secondary">Loading feedbacks...</Typography>
                    </Stack>
                ) : (
                    <>
                        {feedbacks.length === 0 ? (
                            <Box
                                sx={(theme) => ({
                                    border: `1px dashed ${theme.palette.divider}`,
                                    borderRadius: 2,
                                    py: 4,
                                    px: 2,
                                    textAlign: "center",
                                    bgcolor: "background.default",
                                })}
                            >
                                <Typography color="text.secondary">
                                    {mode === 'pending' ? 'No pending feedbacks.' : 'No feedbacks found.'}
                                </Typography>
                            </Box>
                        ) : (
                            <Box
                                sx={(theme) => ({
                                    border: `1px solid ${theme.palette.divider}`,
                                    borderRadius: 2,
                                    bgcolor: "background.default",
                                    overflowY: "auto",
                                    maxHeight: 260,
                                })}
                            >
                            <List sx={{ py: 1 }}>
                                {feedbacks.map((feedback) => {
                                    const timeRangeLabel = formatFeedbackTimeRange(
                                        feedback.scheduledTime,
                                        feedback.durationMinutes
                                    );
                                    const isSelected = selectedFeedback?.feedbackId === feedback.feedbackId;

                                    return (
                                    <ListItem
                                        disablePadding
                                        key={feedback.feedbackId}
                                    >
                                        <ListItemButton
                                            onClick={() => handleFeedbackSelect(feedback, timeRangeLabel)}
                                            selected={isSelected}
                                            sx={(theme) => ({
                                                mx: 1,
                                                borderRadius: 1.5,
                                                mb: 0.75,
                                                alignItems: "flex-start",
                                                border: "1px solid transparent",
                                                ...(isSelected && {
                                                    bgcolor: 'action.selected',
                                                    borderColor: theme.palette.secondary.main,
                                                }),
                                                "&:hover": {
                                                    bgcolor: isSelected ? "action.selected" : "action.hover",
                                                },
                                            })}
                                        >
                                            <ListItemIcon sx={{ minWidth: 36, mt: 0.25 }}>
                                                <RateReviewOutlinedIcon color={isSelected ? "primary" : "action"} />
                                            </ListItemIcon>
                                            <ListItemText
                                                disableTypography
                                                primary={
                                                    <>
                                                        <Typography component="span" display="block">
                                                            {"Interview with: "}
                                                            <Typography
                                                                component="span"
                                                                sx={{ fontWeight: 600 }}
                                                            >
                                                                {feedback.coachName || "Unknown coach"}
                                                            </Typography>
                                                        </Typography>
                                                        {timeRangeLabel && (
                                                            <Typography
                                                                component="span"
                                                                variant="body2"
                                                                color="text.secondary"
                                                                display="block"
                                                            >
                                                                {timeRangeLabel}
                                                            </Typography>
                                                        )}
                                                    </>
                                                }
                                                secondary={
                                                    <Stack
                                                        component="span"
                                                        direction="row"
                                                        alignItems="center"
                                                        spacing={0.75}
                                                        sx={{
                                                            display: 'inline-flex',
                                                        }}
                                                    >
                                                        {feedback.comments ? (
                                                            <CheckCircleOutlineIcon sx={{ fontSize: '1rem', color: "success.main" }} />
                                                        ) : (
                                                            <PendingActionsOutlinedIcon sx={{ fontSize: '1rem', color: "warning.main" }} />
                                                        )}
                                                        <Chip
                                                            label={feedback.comments ? "Completed" : "Pending"}
                                                            size="small"
                                                            color={feedback.comments ? "success" : "warning"}
                                                            sx={{ height: 22 }}
                                                        />
                                                        {feedback.comments && (
                                                            <Typography variant="body2" component="span" color="text.secondary">
                                                                {feedback.rating || 0}/5
                                                            </Typography>
                                                        )}
                                                    </Stack>
                                                }
                                            />
                                        </ListItemButton>
                                    </ListItem>
                                    );
                                })}
                            </List>
                            </Box>
                        )}
                    </>
                )}

                {selectedFeedback && (
                    <Box component="form" mt={2.5} noValidate autoComplete="off">
                        <Divider sx={{ mb: 2 }} />
                        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                        <Typography variant="subtitle1">
                            {selectedFeedback.comments
                                ? "View feedback for interview with: "
                                : "Submit feedback for interview with: "}
                            <Typography
                                component="span"
                                sx={{ fontWeight: 600 }}
                            >
                                {selectedFeedback.coachName}
                            </Typography>
                        </Typography>
                        {feedbackTimeRange && (
                            <Typography
                                component="span"
                                variant="body2"
                                color="text.secondary"
                                display="block"
                            >
                                {feedbackTimeRange}
                            </Typography>
                        )}
                        <Stack spacing={2} sx={{ mt: 2 }}>
                            <Rating
                                name="feedback-rating"
                                value={rating}
                                onChange={handleRatingChange}
                                readOnly={!!selectedFeedback.comments}
                                size="large"
                                sx={{
                                    "& .MuiRating-iconFilled": {
                                        color: theme.palette.warning.main,
                                    },
                                    "& .MuiRating-iconEmpty": {
                                        color: "rgba(148, 163, 184, 0.35)",
                                    },
                                }}
                            />
                            {selectedFeedback.comments ? (
                                <Box
                                    sx={(theme) => ({
                                        mt: 0.5,
                                        borderRadius: 1.5,
                                        p: 1.5,
                                        bgcolor: "background.default",
                                        border: `1px solid ${theme.palette.divider}`,
                                    })}
                                >
                                    <Typography
                                        variant="body1"
                                        sx={{
                                            whiteSpace: "pre-wrap",
                                            color: "text.primary",
                                        }}
                                    >
                                        {selectedFeedback.comments}
                                    </Typography>
                                </Box>
                            ) : (
                                <TextField
                                    label="Comments"
                                    multiline
                                    fullWidth
                                    value={comments}
                                    onChange={handleCommentsChange}
                                    margin="normal"
                                    sx={(theme) => fieldStyles.outlinedFocus(theme)}
                                    rows={4}
                                    minRows={4}
                                    maxRows={6}
                                    helperText="Share specific strengths and one key improvement area."
                                />
                            )}
                            {!selectedFeedback.comments && (
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleSubmit}
                                    disabled={submitDisabled}
                                    sx={(theme) => ({
                                        ...buttonStyles.primaryCta(theme),
                                        alignSelf: "flex-end",
                                        minWidth: 160,
                                    })}
                                >
                                    {submitting ? "Submitting..." : "Submit Feedback"}
                                </Button>
                            )}
                        </Stack>
                    </Box>
                )}
                {!hasPendingFeedbacks && (
                    <Button
                        onClick={() => handleClose()}
                        sx={(theme) => ({
                            mt: 2.5,
                            ...buttonStyles.secondaryCta(theme),
                            width: "100%",
                        })}
                    >
                        Close
                    </Button>
                )}
                {hasPendingFeedbacks && !selectedFeedback && !loading && (
                    <Alert severity="info" sx={{ mt: 2.5 }}>
                        Select an interview and submit feedback to continue.
                    </Alert>
                )}
            </Box>
        </Modal>
    );
}

export default FeedbackListModal;
