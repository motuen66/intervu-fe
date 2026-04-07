import {
    Box,
    Typography,
    Stack,
    TextField,
    Fab,
    Avatar,
} from "@mui/material";
import { Videocam, VideocamOff, Mic, MicOff } from "@mui/icons-material";
import CallEndIcon from "@mui/icons-material/CallEnd";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import CreateIcon from "@mui/icons-material/Create";
import FlagIcon from "@mui/icons-material/Flag";
import ReportRoomModal from "./ReportRoomModal";
import toast from "react-hot-toast";
import { ROLES } from "../../../../common/constants/common.js";

import { useEffect, useState } from "react";
import { callApi } from "../../../../common/utils/apiConnector.js";
import { METHOD } from "../../../../common/constants/api.js";

function VideoPanel({
    myId,
    peers,
    onCall,
    localVideoRef,
    remoteVideoRef,
    isCameraOn,
    isMicOn,
    isLocalSpeaking,
    isRemoteSpeaking,
    remoteCameraOn,
    remoteMicOn,
    onToggleCamera,
    onToggleMic,
    onLeaveRoom,
    user,
    roomInfo,
    roomId,
}) {

    const isCandidate = user?.role === ROLES.CANDIDATE;
    const remotePeerName = roomInfo ? (isCandidate ? roomInfo.coachName || "Coach" : roomInfo.candidateName || "Candidate") : "Peer";
    const remotePeerRole = isCandidate ? "Coach" : "Candidate";

    const [fetchedRemoteAvatar, setFetchedRemoteAvatar] = useState(null);
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [isReporting, setIsReporting] = useState(false);


    useEffect(() => {
        const participantId = roomInfo ? (isCandidate ? roomInfo.coachId : roomInfo.candidateId) : null;
        if (!participantId) return;
        callApi({ method: METHOD.GET, endpoint: `/userprofile/${participantId}` })
            .then((res) => {
                const profile = res?.data;
                const url = profile?.profilePicture || profile?.avatarUrl || profile?.imageUrl || profile?.avatar || null;
                if (url) setFetchedRemoteAvatar(url);
            })
            .catch(() => { /* ignore */ });
    }, [roomInfo, isCandidate]);

    const handleReportSubmit = async ({ reason, details }) => {
        setIsReporting(true);
        try {
            await callApi({
                method: METHOD.POST,
                endpoint: "/interviewroom/report",
                arg: {
                    interviewRoomId: roomInfo?.id || roomId,
                    reason,
                    details
                },
                displaySuccessMessage: true
            });
            return true;
        } catch (err) {
            console.error(err);
            toast.error(err.message || "Failed to submit report");
            return false;
        } finally {
            setIsReporting(false);
        }
    };


    const remoteAvatar = fetchedRemoteAvatar || (roomInfo ? (isCandidate
        ? (roomInfo.coachAvatar || roomInfo.coachProfilePicture || roomInfo.coach?.profilePicture || roomInfo.coach?.avatarUrl || roomInfo.coach?.avatar || roomInfo.interviewer?.profilePicture || roomInfo.interviewer?.avatar || roomInfo.interviewer?.avatarUrl || roomInfo.interviewerAvatar)
        : (roomInfo.candidateAvatar || roomInfo.candidateProfilePicture || roomInfo.candidate?.profilePicture || roomInfo.candidate?.avatarUrl || roomInfo.candidate?.avatar)
    ) : null);

    const localRoleNameInRoom = isCandidate ? roomInfo?.candidateName : roomInfo?.coachName;
    const localPeerName = user?.name || user?.firstName || user?.userName || user?.displayName || localRoleNameInRoom || "You";
    const localAvatar = user?.profilePicture || user?.avatarUrl || user?.imagePath || user?.avatar;

    return (
        <Box
            sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                p: 2,
                overflow: "hidden",
                bgcolor: "#FFFFFF"
            }}
        >
            {/* Videos Container */}
            <Stack
                spacing={2}
                sx={{
                    mb: 3,
                    flexShrink: 0,
                }}
            >
                <Box sx={{
                    position: "relative",
                    width: "100%",
                    borderRadius: 3,
                    overflow: "hidden",
                    aspectRatio: "16/9",
                    bgcolor: "#E5E7EB",
                    border: isRemoteSpeaking ? "4px solid #A3E635" : "2px solid #E5E7EB",
                    transition: "all 0.2s ease",
                }}>
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: remoteCameraOn ? "block" : "none",
                        }}
                    />
                    {/* Camera-off placeholder */}
                    {!remoteCameraOn && (
                        <Box sx={{
                            position: "absolute", inset: 0,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            bgcolor: "grey.200",
                        }}>
                            <Avatar src={remoteAvatar} sx={{ width: 64, height: 64, fontSize: 28 }}>
                                {remotePeerName?.[0] || "?"}
                            </Avatar>
                        </Box>
                    )}
                    {/* Remote mic indicator */}
                    <Box sx={{ position: "absolute", top: 8, right: 8 }}>
                        {remoteMicOn ? (
                            <Mic sx={{ color: "#10B981", fontSize: 20 }} />
                        ) : (
                            <MicOff sx={{ color: "#EF4444", fontSize: 20 }} />
                        )}
                    </Box>
                    <Box sx={{ position: "absolute", bottom: 8, left: 8, bgcolor: "#FFFFFF", px: 1, py: 0.5, borderRadius: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar src={remoteAvatar} sx={{ width: 20, height: 20 }} />
                        <Typography variant="caption" sx={{ fontWeight: 700, color: "#111827" }}>{`${remotePeerName} (${remotePeerRole})`}</Typography>
                    </Box>
                </Box>

                <Box sx={{
                    position: "relative",
                    width: "100%",
                    borderRadius: 3,
                    overflow: "hidden",
                    aspectRatio: "16/9",
                    bgcolor: "#E5E7EB",
                    border: isLocalSpeaking ? "4px solid #3B82F6" : "2px solid #E5E7EB",
                }}>
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: isCameraOn ? "block" : "none",
                        }}
                    />
                    {/* Local camera-off placeholder */}
                    {!isCameraOn && (
                        <Box sx={{
                            position: "absolute", inset: 0,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            bgcolor: "grey.300",
                        }}>
                            <Avatar src={localAvatar} sx={{ width: 56, height: 56, fontSize: 24 }}>
                                {localPeerName?.[0] || "?"}
                            </Avatar>
                        </Box>
                    )}
                    <Box sx={{ position: "absolute", bottom: 8, left: 8, bgcolor: "#A3E635", px: 1, py: 0.5, borderRadius: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar src={localAvatar} sx={{ width: 20, height: 20 }} />
                        <Typography variant="caption" sx={{ fontWeight: 700, color: "#166534" }}>
                            {localPeerName !== "You" ? `You (${localPeerName})` : "You"}
                        </Typography>
                    </Box>
                </Box>
            </Stack>

            {/* Controls */}
            <Stack
                direction="row"
                justifyContent="center"
                alignItems="center"
                spacing={2}
                sx={{
                    mb: 4,
                    width: "100%",
                    flexWrap: "nowrap",
                    "& > *": { flexShrink: 0 }
                }}
            >
                <Fab
                    size="medium"
                    onClick={onToggleMic}
                    sx={{
                        bgcolor: isMicOn ? "#FFFFFF" : "#EF4444",
                        color: isMicOn ? "#4B5563" : "#FFFFFF",
                        border: isMicOn ? "1px solid #E5E7EB" : "none",
                        "&:hover": { bgcolor: isMicOn ? "#F3F4F6" : "#DC2626" }
                    }}
                >
                    {isMicOn ? <Mic /> : <MicOff />}
                </Fab>
                <Fab
                    size="medium"
                    onClick={onToggleCamera}
                    sx={{
                        bgcolor: isCameraOn ? "#FFFFFF" : "#EF4444",
                        color: isCameraOn ? "#4B5563" : "#FFFFFF",
                        border: isCameraOn ? "1px solid #E5E7EB" : "none",
                        "&:hover": { bgcolor: isCameraOn ? "#F3F4F6" : "#DC2626" }
                    }}
                >
                    {isCameraOn ? <Videocam /> : <VideocamOff />}
                </Fab>
                <Fab
                    size="medium"
                    sx={{
                        bgcolor: "#FFFFFF",
                        color: "#4B5563",
                        border: "1px solid #E5E7EB",
                        "&:hover": { bgcolor: "#F3F4F6" }
                    }}
                >
                    <ScreenShareIcon />
                </Fab>
                <Fab
                    size="medium"
                    onClick={() => setReportModalOpen(true)}
                    sx={{
                        bgcolor: "#FFFFFF",
                        color: "#EF4444",
                        border: "1px solid #E5E7EB",
                        "&:hover": { bgcolor: "#F3F4F6" }
                    }}
                >
                    <FlagIcon />
                </Fab>
                <Fab
                    size="medium"
                    onClick={onLeaveRoom}

                    sx={{
                        bgcolor: "#EF4444",
                        color: "#FFFFFF",
                        "&:hover": { bgcolor: "#DC2626" }
                    }}
                >
                    <CallEndIcon />
                </Fab>
            </Stack>

            {/* Internal Notes */}
            <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1, flexShrink: 0 }}>
                    <Typography variant="overline" sx={{ fontWeight: 800, color: "#6B7280", letterSpacing: 1 }}>INTERNAL NOTES</Typography>
                    <CreateIcon sx={{ color: "#9CA3AF", fontSize: 18 }} />
                </Stack>
                <TextField
                    multiline
                    fullWidth
                    placeholder="Add your private notes here..."
                    variant="outlined"
                    sx={{
                        flex: 1,
                        '& .MuiOutlinedInput-root': {
                            height: '100%',
                            alignItems: 'flex-start',
                            bgcolor: "#F9FAFB",
                            borderRadius: 2,
                            display: 'flex',
                            flexDirection: 'column'
                        },
                        '& .MuiInputBase-input': {
                            color: '#1F2937',
                            fontSize: 14,
                            lineHeight: 1.5,
                            height: '100% !important',
                            overflowY: 'auto !important'
                        }
                    }}
                />
            </Box>

            <ReportRoomModal
                open={reportModalOpen}
                onClose={() => setReportModalOpen(false)}
                onSubmit={handleReportSubmit}
                isSubmitting={isReporting}
            />
        </Box>

    );
}

export default VideoPanel;

