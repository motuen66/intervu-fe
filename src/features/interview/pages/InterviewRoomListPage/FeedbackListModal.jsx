import { useState, useEffect } from "react";
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
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import RateReviewOutlinedIcon from "@mui/icons-material/RateReviewOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import PendingActionsOutlinedIcon from "@mui/icons-material/PendingActionsOutlined";
import { callApi } from "../../../../common/utils/apiConnector.js";
import { METHOD } from "../../../../common/constants/api.js";
import { interviewEndPoints } from "../../services/interviewRoomApi";
import { buttonStyles, fieldStyles, dialogStyles } from "../../../../common/constants/uiStyles";

function FeedbackListModal({ open, onClose, onFeedbackSubmitted, mode = 'pending' }) {
    const theme = useTheme();
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
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
                        // Filter for feedbacks that are not yet completed
                        const pending = feedbackData.filter(fb => !fb.comments || fb.comments.trim() === '');
                        setFeedbacks(pending);
                        if (pending.length === 1) { // Automatically select if only one pending
                            const only = pending[0];
                            const startTime = only.scheduledTime ? new Date(only.scheduledTime) : null;
                            const endTime = startTime && only.durationMinutes
                                ? new Date(startTime.getTime() + only.durationMinutes * 60000)
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

                            const timeRangeLabel =
                                startLabel && endLabel ? `${startLabel} - ${endLabel}` : "";

                            handleFeedbackSelect(only, timeRangeLabel);
                        }
                    } else {
                        // Show all feedbacks
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
    }, [open, mode]); // handleFeedbackSelect is stable

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
        if (!selectedFeedback) return;

        try {
            setError(''); // Reset error before new submission
            await callApi({
                method: METHOD.PUT,
                endpoint: interviewEndPoints.UPDATE_FEEDBACK(selectedFeedback.feedbackId),
                arg: { rating: rating, comments: comments },
            });
            
            // Notify parent component to re-fetch data and check pending status
            if (onFeedbackSubmitted) {
                onFeedbackSubmitted();
            }

            const updatedFeedbacks = feedbacks.filter((fb) => fb.feedbackId !== selectedFeedback.feedbackId).map(fb => fb.feedbackId === selectedFeedback.feedbackId ? {...fb, comments, rating} : fb);
            setFeedbacks(updatedFeedbacks);

            // Reset form state
            setSelectedFeedback(null);
            setRating(0);
            setComments('');

            // If in pending mode and this was the last one, close the modal
            if (mode === 'pending' && updatedFeedbacks.length === 0) {
                onClose();
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Failed to update feedback. Please try again.";
            setError(errorMessage);
            console.error("Failed to update feedback:", error.response?.data || error);
        }
    };

    const handleClose = (event, reason) => {
        const hasPending = mode === 'pending' && feedbacks.length > 0;
        if (hasPending && (reason === 'backdropClick' || reason === 'escapeKeyDown')) {
            // Prevent closing the modal if there are pending feedbacks
            return;
        }
        onClose();

        // Clear selection and local form state after close
        setSelectedFeedback(null);
        setRating(0);
        setComments('');
        setFeedbackTimeRange('');
    };

    const hasPendingFeedbacks = mode === 'pending' && feedbacks.length > 0;

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
                    width: 480,
                    maxWidth: "90vw",
                    p: 3,
                })}
            >
                <Typography id="feedback-list-modal" variant="h5" component="h2" sx={{ mb: 1 }}>
                    {mode === 'pending' ? 'Pending Feedbacks' : 'All Feedbacks'}
                </Typography>
                {loading ? (
                    <Typography color="text.secondary">Loading feedbacks...</Typography>
                ) : (
                    <>
                        {feedbacks.length === 0 ? (
                            <Typography color="text.secondary" sx={{ mt: 2 }}>{mode === 'pending' ? 'No pending feedbacks.' : 'No feedbacks found.'}</Typography>
                        ) : (
                            <List>
                                {feedbacks.map((feedback) => {
                                    const startTime = feedback.scheduledTime ? new Date(feedback.scheduledTime) : null;
                                    const endTime = startTime && feedback.durationMinutes
                                        ? new Date(startTime.getTime() + feedback.durationMinutes * 60000)
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

                                    const timeRangeLabel =
                                        startLabel && endLabel ? `${startLabel} - ${endLabel}` : "";

                                    return (
                                    <ListItem
                                        disablePadding
                                        key={feedback.id}
                                    >
                                        <ListItemButton
                                            onClick={() => handleFeedbackSelect(feedback, timeRangeLabel)}
                                            selected={selectedFeedback?.id === feedback.id}
                                            sx={{
                                                ...(selectedFeedback?.id === feedback.id && {
                                                    bgcolor: 'action.selected',
                                                })
                                            }}
                                        >
                                            <ListItemIcon>
                                                <RateReviewOutlinedIcon />
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
                                                                {feedback.coachName}
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
                                                        spacing={0.5}
                                                        sx={{
                                                            color: feedback.comments ? 'success.main' : 'warning.main',
                                                            display: 'inline-flex',
                                                        }}
                                                    >
                                                        {feedback.comments ? <CheckCircleOutlineIcon sx={{ fontSize: '1rem' }} /> : <PendingActionsOutlinedIcon sx={{ fontSize: '1rem' }} />}
                                                        <Typography variant="body2" component="span">
                                                            {feedback.comments ? `Completed - Rating: ${feedback.rating}/5` : 'Pending'}
                                                        </Typography>
                                                    </Stack>
                                                }
                                            />
                                        </ListItemButton>
                                    </ListItem>
                                    );
                                })}
                            </List>
                        )}
                    </>
                )}

                {selectedFeedback && (
                    <Box component="form" mt={2.5} noValidate autoComplete="off">
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
                                sx={{
                                    "& .MuiRating-iconFilled": {
                                        color: "#EAB308", // Yellow
                                    },
                                    "& .MuiRating-iconEmpty": {
                                        color: "rgba(148, 163, 184, 0.4)", // Muted slate
                                    },
                                }}
                            />
                            {selectedFeedback.comments ? (
                                <Typography
                                    variant="body1"
                                    sx={{
                                        mt: 0.5,
                                        whiteSpace: "pre-wrap",
                                        color: "text.primary",
                                    }}
                                >
                                    {selectedFeedback.comments}
                                </Typography>
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
                                />
                            )}
                            {!selectedFeedback.comments && (
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleSubmit}
                                    sx={(theme) => ({
                                        ...buttonStyles.primaryCta(theme),
                                        alignSelf: "flex-end",
                                    })}
                                >
                                    Submit Feedback
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
            </Box>
        </Modal>
    );
}

export default FeedbackListModal;
