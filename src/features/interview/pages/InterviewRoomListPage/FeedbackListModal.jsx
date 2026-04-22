import { useState, useEffect, useMemo } from "react";
import {
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Typography,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Rating,
    Stack,
    CircularProgress,
    IconButton,
    Tooltip,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import PendingActionsRoundedIcon from "@mui/icons-material/PendingActionsRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import StarBorderRoundedIcon from "@mui/icons-material/StarBorderRounded";
import InboxRoundedIcon from "@mui/icons-material/InboxRounded";
import { callApi } from "../../../../common/utils/apiConnector.js";
import { METHOD } from "../../../../common/constants/api.js";
import { interviewEndPoints } from "../../services/interviewRoomApi";
import { dialogStyles } from "../../../../common/constants/uiStyles";
import { PrimaryButton, SecondaryButton } from "../../../../common/components/buttons";
import StatusChip from "../../../../common/components/StatusChip";
import FormTextField from "../../../../common/components/form/FormTextField";

const MAX_COMMENT_LENGTH = 1000;

const RATING_LABELS = {
    1: "Poor",
    2: "Fair",
    3: "Good",
    4: "Very good",
    5: "Excellent",
};

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
    const [rating, setRating] = useState(5);
    const [hoverRating, setHoverRating] = useState(-1);
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
        setError('');
    };

    const handleBackToList = () => {
        setSelectedFeedback(null);
        setRating(0);
        setComments('');
        setFeedbackTimeRange('');
        setError('');
    };

    const handleRatingChange = (event, newRating) => {
        setRating(newRating);
    };

    const handleCommentsChange = (event) => {
        const next = event.target.value;
        if (next.length <= MAX_COMMENT_LENGTH) {
            setComments(next);
        }
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
    const isReadOnly = !!selectedFeedback?.comments;
    const isSinglePendingFlow = mode === 'pending' && feedbacks.length === 1 && !!selectedFeedback;

    const submitDisabled = useMemo(
        () => submitting || !rating || comments.trim().length === 0,
        [submitting, rating, comments]
    );

    const displayedRating = hoverRating !== -1 ? hoverRating : rating;
    const ratingLabel = displayedRating ? RATING_LABELS[displayedRating] : null;

    const title = mode === 'pending' ? 'Pending Feedbacks' : 'All Feedbacks';
    const subtitle =
        feedbacks.length === 0
            ? 'No interviews to review'
            : `${feedbacks.length} ${feedbacks.length === 1 ? 'interview' : 'interviews'}`;

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            fullWidth
            maxWidth="sm"
            aria-labelledby="feedback-list-modal-title"
            aria-describedby="feedback-list-modal-description"
            PaperProps={{
                sx: (theme) => ({
                    ...dialogStyles.paper(theme),
                    overflow: "hidden",
                }),
            }}
        >
            <DialogTitle
                id="feedback-list-modal-title"
                component="div"
                sx={{ p: 3, pb: 2 }}
            >
                <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1.5}>
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
                        {selectedFeedback && !isSinglePendingFlow && (
                            <Tooltip title="Back to list">
                                <IconButton
                                    size="small"
                                    onClick={handleBackToList}
                                    aria-label="Back to feedback list"
                                    sx={{ color: "text.secondary" }}
                                >
                                    <ArrowBackRoundedIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        )}
                        <Box sx={{ minWidth: 0 }}>
                            <Typography variant="h5" component="h2" fontWeight={700} sx={{ letterSpacing: "-0.01em" }}>
                                {selectedFeedback
                                    ? (isReadOnly ? 'Feedback Details' : 'Submit Feedback')
                                    : title}
                            </Typography>
                            <Typography
                                id="feedback-list-modal-description"
                                variant="body2"
                                color="text.secondary"
                            >
                                {selectedFeedback
                                    ? (isReadOnly
                                        ? 'Review your submitted feedback.'
                                        : 'Share a rating and comments to help your coach improve.')
                                    : subtitle}
                            </Typography>
                        </Box>
                    </Stack>

                    {!hasPendingFeedbacks && (
                        <Tooltip title="Close">
                            <IconButton
                                size="small"
                                onClick={() => handleClose()}
                                aria-label="Close feedback modal"
                                sx={{ color: "text.secondary" }}
                            >
                                <CloseRoundedIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                </Stack>
            </DialogTitle>

            <DialogContent dividers sx={{ p: 3, borderColor: "divider" }}>
                {loading ? (
                    <Stack direction="row" spacing={1.25} alignItems="center" justifyContent="center" sx={{ py: 6 }}>
                        <CircularProgress size={22} />
                        <Typography color="text.secondary">Loading feedbacks...</Typography>
                    </Stack>
                ) : feedbacks.length === 0 ? (
                    <Stack
                        alignItems="center"
                        justifyContent="center"
                        spacing={1.25}
                        sx={(theme) => ({
                            py: 6,
                            px: 2,
                            textAlign: "center",
                            borderRadius: 2,
                            border: `1px dashed ${theme.palette.divider}`,
                            bgcolor: alpha(theme.palette.text.primary, 0.02),
                        })}
                    >
                        <InboxRoundedIcon sx={{ fontSize: 40, color: "text.disabled" }} />
                        <Typography variant="subtitle1" fontWeight={600}>
                            {mode === 'pending' ? 'You are all caught up!' : 'No feedbacks yet'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {mode === 'pending'
                                ? 'There are no pending feedbacks to submit right now.'
                                : 'Once you complete interviews, your feedbacks will appear here.'}
                        </Typography>
                    </Stack>
                ) : (
                    <Stack spacing={2.5}>
                        {!isSinglePendingFlow && !selectedFeedback && (
                            <Box
                                sx={(theme) => ({
                                    border: `1px solid ${theme.palette.divider}`,
                                    borderRadius: 2,
                                    bgcolor: "background.default",
                                    overflowY: "auto",
                                    maxHeight: 320,
                                })}
                            >
                                <List sx={{ py: 0.5 }} disablePadding>
                                    {feedbacks.map((feedback, index) => {
                                        const timeRangeLabel = formatFeedbackTimeRange(
                                            feedback.scheduledTime,
                                            feedback.durationMinutes
                                        );
                                        const isSelected = selectedFeedback?.feedbackId === feedback.feedbackId;
                                        const isCompleted = !!feedback.comments;
                                        const isLast = index === feedbacks.length - 1;

                                        return (
                                            <ListItem
                                                disablePadding
                                                key={feedback.feedbackId}
                                                sx={{
                                                    borderBottom: isLast ? "none" : `1px solid ${theme.palette.divider}`,
                                                }}
                                            >
                                                <ListItemButton
                                                    onClick={() => handleFeedbackSelect(feedback, timeRangeLabel)}
                                                    selected={isSelected}
                                                    sx={(theme) => ({
                                                        alignItems: "flex-start",
                                                        py: 1.5,
                                                        px: 2,
                                                        gap: 1,
                                                        transition: "background-color 0.15s ease",
                                                        ...(isSelected && {
                                                            bgcolor: alpha(theme.palette.primary.main, 0.06),
                                                            "&:hover": {
                                                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                                            },
                                                        }),
                                                    })}
                                                >
                                                    <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                                                        <Box
                                                            sx={(theme) => ({
                                                                width: 32,
                                                                height: 32,
                                                                borderRadius: "50%",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                bgcolor: isCompleted
                                                                    ? alpha(theme.palette.success.main, 0.12)
                                                                    : alpha(theme.palette.warning.main, 0.12),
                                                                color: isCompleted
                                                                    ? theme.palette.success.main
                                                                    : theme.palette.warning.main,
                                                            })}
                                                        >
                                                            {isCompleted ? (
                                                                <CheckCircleRoundedIcon fontSize="small" />
                                                            ) : (
                                                                <PendingActionsRoundedIcon fontSize="small" />
                                                            )}
                                                        </Box>
                                                    </ListItemIcon>

                                                    <ListItemText
                                                        disableTypography
                                                        primary={
                                                            <Stack
                                                                direction="row"
                                                                alignItems="center"
                                                                spacing={0.75}
                                                                sx={{ minWidth: 0 }}
                                                            >
                                                                <PersonRoundedIcon
                                                                    sx={{ fontSize: "1rem", color: "text.secondary", flexShrink: 0 }}
                                                                />
                                                                <Typography
                                                                    variant="body1"
                                                                    fontWeight={600}
                                                                    noWrap
                                                                    sx={{ color: "text.primary" }}
                                                                >
                                                                    {feedback.coachName || "Unknown coach"}
                                                                </Typography>
                                                            </Stack>
                                                        }
                                                        secondary={
                                                            <Stack spacing={0.75} sx={{ mt: 0.75 }}>
                                                                {timeRangeLabel && (
                                                                    <Stack direction="row" alignItems="center" spacing={0.5}>
                                                                        <AccessTimeRoundedIcon
                                                                            sx={{ fontSize: "0.9rem", color: "text.secondary" }}
                                                                        />
                                                                        <Typography variant="body2" color="text.secondary">
                                                                            {timeRangeLabel}
                                                                        </Typography>
                                                                    </Stack>
                                                                )}
                                                                <Stack direction="row" alignItems="center" spacing={1}>
                                                                    <StatusChip
                                                                        label={isCompleted ? "Completed" : "Pending"}
                                                                        color={isCompleted ? "success" : "warning"}
                                                                    />
                                                                    {isCompleted && (
                                                                        <Stack direction="row" alignItems="center" spacing={0.25}>
                                                                            <StarRoundedIcon
                                                                                sx={{ fontSize: "1rem", color: "warning.main" }}
                                                                            />
                                                                            <Typography variant="body2" color="text.secondary">
                                                                                {feedback.rating || 0}/5
                                                                            </Typography>
                                                                        </Stack>
                                                                    )}
                                                                </Stack>
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

                        {selectedFeedback && (
                            <Stack spacing={2} component="form" noValidate autoComplete="off">
                                {error && (
                                    <Alert severity="error" onClose={() => setError('')}>
                                        {error}
                                    </Alert>
                                )}

                                <Box
                                    sx={(theme) => ({
                                        p: 2,
                                        borderRadius: 2,
                                        border: `1px solid ${theme.palette.divider}`,
                                        bgcolor: alpha(theme.palette.primary.main, 0.04),
                                    })}
                                >
                                    <Stack
                                        direction="row"
                                        alignItems="center"
                                        spacing={0.75}
                                        sx={{ minWidth: 0 }}
                                    >
                                        <PersonRoundedIcon sx={{ fontSize: "1.1rem", color: "primary.main" }} />
                                        <Typography variant="subtitle1" fontWeight={600} noWrap>
                                            {selectedFeedback.coachName || "Unknown coach"}
                                        </Typography>
                                    </Stack>
                                    {feedbackTimeRange && (
                                        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.5 }}>
                                            <AccessTimeRoundedIcon
                                                sx={{ fontSize: "0.9rem", color: "text.secondary" }}
                                            />
                                            <Typography variant="body2" color="text.secondary">
                                                {feedbackTimeRange}
                                            </Typography>
                                        </Stack>
                                    )}
                                </Box>

                                <Box>
                                    <Typography
                                        variant="subtitle2"
                                        color="text.secondary"
                                        sx={{ mb: 0.75 }}
                                    >
                                        Overall rating
                                    </Typography>
                                    <Stack direction="row" alignItems="center" spacing={1.25}>
                                        <Rating
                                            name="feedback-rating"
                                            value={rating}
                                            onChange={handleRatingChange}
                                            onChangeActive={(_, newHover) => setHoverRating(newHover)}
                                            readOnly={isReadOnly}
                                            size="large"
                                            icon={<StarRoundedIcon fontSize="inherit" />}
                                            emptyIcon={<StarBorderRoundedIcon fontSize="inherit" />}
                                            sx={{
                                                "& .MuiRating-iconFilled": {
                                                    color: theme.palette.warning.main,
                                                },
                                                "& .MuiRating-iconHover": {
                                                    color: theme.palette.warning.light,
                                                },
                                                "& .MuiRating-iconEmpty": {
                                                    color: alpha(theme.palette.text.secondary, 0.3),
                                                },
                                            }}
                                        />
                                        {ratingLabel && (
                                            <Typography variant="body2" color="text.secondary">
                                                {ratingLabel}
                                            </Typography>
                                        )}
                                    </Stack>
                                </Box>

                                <Box>
                                    <Typography
                                        variant="subtitle2"
                                        color="text.secondary"
                                        sx={{ mb: 0.75 }}
                                    >
                                        Comments
                                    </Typography>
                                    {isReadOnly ? (
                                        <Box
                                            sx={(theme) => ({
                                                borderRadius: 1.5,
                                                p: 2,
                                                bgcolor: "background.default",
                                                border: `1px solid ${theme.palette.divider}`,
                                            })}
                                        >
                                            <Typography
                                                variant="body1"
                                                sx={{
                                                    whiteSpace: "pre-wrap",
                                                    color: "text.primary",
                                                    lineHeight: 1.7,
                                                }}
                                            >
                                                {selectedFeedback.comments}
                                            </Typography>
                                        </Box>
                                    ) : (
                                        <FormTextField
                                            placeholder="Share specific strengths and one key improvement area..."
                                            multiline
                                            fullWidth
                                            value={comments}
                                            onChange={handleCommentsChange}
                                            rows={5}
                                            inputProps={{ maxLength: MAX_COMMENT_LENGTH }}
                                            helperText={
                                                <Box
                                                    component="span"
                                                    sx={{
                                                        display: "flex",
                                                        justifyContent: "space-between",
                                                        width: "100%",
                                                    }}
                                                >
                                                    <span>Share specific strengths and one key improvement area.</span>
                                                    <span>{comments.length}/{MAX_COMMENT_LENGTH}</span>
                                                </Box>
                                            }
                                            FormHelperTextProps={{ component: "div" }}
                                        />
                                    )}
                                </Box>
                            </Stack>
                        )}

                        {hasPendingFeedbacks && !selectedFeedback && (
                            <Alert severity="info" variant="outlined" icon={<PendingActionsRoundedIcon fontSize="small" />}>
                                Select an interview and submit feedback to continue.
                            </Alert>
                        )}
                    </Stack>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
                {selectedFeedback && !isReadOnly ? (
                    <>
                        {!isSinglePendingFlow && (
                            <SecondaryButton onClick={handleBackToList} disabled={submitting}>
                                Back
                            </SecondaryButton>
                        )}
                        <Box sx={{ minWidth: 160 }}>
                            <PrimaryButton
                                fullWidth
                                onClick={handleSubmit}
                                disabled={submitDisabled}
                                loading={submitting}
                            >
                                Submit Feedback
                            </PrimaryButton>
                        </Box>
                    </>
                ) : (
                    !hasPendingFeedbacks && (
                        <Box sx={{ minWidth: 120 }}>
                            <SecondaryButton fullWidth onClick={() => handleClose()}>
                                Close
                            </SecondaryButton>
                        </Box>
                    )
                )}
            </DialogActions>
        </Dialog>
    );
}

export default FeedbackListModal;
