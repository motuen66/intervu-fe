import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import Divider from "@mui/material/Divider";
import { AccessTime } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import BaseCard from "../../../../common/components/cards/BaseCard";
import StatusChip from "../../../../common/components/StatusChip";
import SecondaryButton from "../../../../common/components/buttons/SecondaryButton";
import { DASHBOARD_LAYOUT } from "./dashboardTokens";

const STATUS_COLOR_MAP = {
    Confirmed: "success",
    Upcoming: "info",
    "Pending Payment": "warning",
};

const JOIN_EARLY_MINUTES = 10;
const SESSION_DURATION_MINUTES = 60;

function getSessionUiState(scheduledTime) {
    if (!scheduledTime) {
        return {
            timerLabel: "Starts in",
            timerValue: "TBA",
            canJoin: false,
            joinButtonLabel: "Join Room",
        };
    }

    const start = new Date(scheduledTime);
    const now = new Date();
    const diffMs = start - now;
    const diffMin = Math.floor(diffMs / 60000);

    const hasStarted = diffMin <= 0;
    const isEnded = diffMin < -SESSION_DURATION_MINUTES;
    const canJoin = diffMin <= JOIN_EARLY_MINUTES && !isEnded;

    let timerValue = "Now";
    if (!hasStarted) {
        if (diffMin < 60) {
            timerValue = `${diffMin} min`;
        } else {
            const hours = Math.floor(diffMin / 60);
            const mins = diffMin % 60;
            timerValue = hours < 24 ? `${hours}h ${mins}m` : `${Math.floor(hours / 24)}d ${hours % 24}h`;
        }
    }

    return {
        timerLabel: isEnded ? "Ended" : hasStarted ? "Started" : "Starts in",
        timerValue: isEnded ? "Finished" : timerValue,
        canJoin,
        joinButtonLabel: isEnded ? "Session Ended" : "Join Room",
    };
}

function SessionItem({ session }) {
    const navigate = useNavigate();
    const [sessionState, setSessionState] = useState(() => getSessionUiState(session.scheduledTime));

    useEffect(() => {
        const id = setInterval(() => setSessionState(getSessionUiState(session.scheduledTime)), 30000);
        return () => clearInterval(id);
    }, [session.scheduledTime]);

    return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, py: DASHBOARD_LAYOUT.listItemPaddingY }}>
            <Avatar
                src={session.candidateProfilePicture}
                alt={session.candidateName}
                sx={{ width: 44, height: 44 }}
            />

            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.25 }}>
                    <Typography variant="body2" fontWeight={600} noWrap>
                        {session.candidateName}
                    </Typography>
                    <StatusChip
                        label={session.status}
                        color={STATUS_COLOR_MAP[session.status] || "default"}
                        variant="filled"
                        size="small"
                    />
                </Box>
                <Typography variant="caption" color="text.secondary">
                    Room ID: {session.roomIdDisplay}
                </Typography>
            </Box>

            <Box sx={{ textAlign: "right", mr: 1 }}>
                <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", textTransform: "uppercase" }}
                >
                    {sessionState.timerLabel}
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                    {sessionState.timerValue}
                </Typography>
            </Box>

            <SecondaryButton
                size="small"
                disabled={!sessionState.canJoin}
                onClick={() => navigate(`/interview/room/${session.interviewRoomId}`)}
                sx={{ textTransform: "none", minWidth: 110 }}
            >
                {sessionState.joinButtonLabel}
            </SecondaryButton>
        </Box>
    );
}

export default function UpcomingSessionsList({ sessions }) {
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
                <AccessTime sx={{ color: "success.main", fontSize: 20 }} />
                <Typography variant="h6" fontWeight={700}>
                    Upcoming Sessions
                </Typography>
            </Box>

            {!sessions?.length ? (
                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ py: DASHBOARD_LAYOUT.emptyStatePaddingY, textAlign: "center" }}
                >
                    No upcoming sessions
                </Typography>
            ) : (
                sessions.map((session, idx) => (
                    <Box key={session.interviewRoomId}>
                        {idx > 0 && <Divider />}
                        <SessionItem session={session} />
                    </Box>
                ))
            )}
        </BaseCard>
    );
}
