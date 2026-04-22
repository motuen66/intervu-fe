import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Rating from "@mui/material/Rating";
import Divider from "@mui/material/Divider";
import { ChatBubbleOutline } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import BaseCard from "../../../../common/components/cards/BaseCard";
import TextButton from "../../../../common/components/buttons/TextButton";
import { COACH_INTERVIEWS_ROUTE, DASHBOARD_LAYOUT } from "./dashboardTokens";

function getTimeAgo(dateStr) {
    const timestamp = new Date(dateStr).getTime();
    if (Number.isNaN(timestamp)) return "Just now";

    const diff = Date.now() - timestamp;
    if (diff < 0) return "Just now";

    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} days ago`;
    const weeks = Math.floor(days / 7);
    return `${weeks} weeks ago`;
}

function FeedbackItem({ feedback }) {
    return (
        <Box sx={{ py: DASHBOARD_LAYOUT.listItemPaddingY }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                <Rating
                    value={feedback.rating}
                    readOnly
                    size="small"
                    sx={{
                        "& .MuiRating-iconFilled": {
                            color: "#F59E0B",
                        },
                    }}
                />
                <Typography variant="caption" color="text.secondary">
                    {getTimeAgo(feedback.createdAt)}
                </Typography>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                "{feedback.comments}"
            </Typography>

            <Typography variant="caption" fontWeight={700} color="text.primary">
                — {feedback.candidateName}
            </Typography>
        </Box>
    );
}

export default function FeedbackWall({ feedbacks }) {
    const navigate = useNavigate();

    const displayFeedbacks = [...(feedbacks || [])]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, DASHBOARD_LAYOUT.panelItemLimit);

    return (
        <BaseCard sx={{ p: DASHBOARD_LAYOUT.cardPadding }}>
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mb: DASHBOARD_LAYOUT.cardHeaderMarginBottom,
                }}
            >
                <ChatBubbleOutline sx={{ color: "warning.main", fontSize: 20 }} />
                <Typography variant="h6" fontWeight={700}>
                    Feedback Wall
                </Typography>
            </Box>

            {!displayFeedbacks.length ? (
                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ py: DASHBOARD_LAYOUT.emptyStatePaddingY, textAlign: "center" }}
                >
                    No feedback yet
                </Typography>
            ) : (
                <>
                    {displayFeedbacks.map((fb, idx) => (
                        <Box key={idx}>
                            {idx > 0 && <Divider />}
                            <FeedbackItem feedback={fb} />
                        </Box>
                    ))}

                    <Divider sx={{ mt: 1 }} />
                    <Box sx={{ mt: 1 }}>
                        <TextButton fullWidth size="sm" onClick={() => navigate(COACH_INTERVIEWS_ROUTE)}>
                            VIEW ALL FEEDBACK
                        </TextButton>
                    </Box>
                </>
            )}
        </BaseCard>
    );
}
