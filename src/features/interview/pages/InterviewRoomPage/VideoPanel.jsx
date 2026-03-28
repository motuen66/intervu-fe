import {
    Box,
    Typography,
    List,
    ListItem,
    Paper,
    Stack,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    IconButton,
    TextField,
    Fab,
    Badge,
    Avatar
} from "@mui/material";
import { DangerButton, PrimaryButton, SecondaryButton } from "../../../../common/components/buttons";
import { Videocam, VideocamOff, Mic, MicOff, ExpandMore, PresentToAll } from "@mui/icons-material";
import CallEndIcon from "@mui/icons-material/CallEnd";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import StopScreenShareIcon from "@mui/icons-material/StopScreenShare";
import CreateIcon from "@mui/icons-material/Create";
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
    onToggleCamera,
    onToggleMic,
    onLeaveRoom,
    user,
    roomInfo,
    endMeeting,
}) {
    const isCandidate = user?.role === ROLES.CANDIDATE;
    const remotePeerName = roomInfo ? (isCandidate ? roomInfo.coachName || "Coach" : roomInfo.candidateName || "Candidate") : "Peer";
    const remotePeerRole = isCandidate ? "Coach" : "Candidate";
    
    const [fetchedRemoteAvatar, setFetchedRemoteAvatar] = useState(null);
    const participantId = roomInfo ? (isCandidate ? roomInfo.coachId : roomInfo.candidateId) : null;

    useEffect(() => {
        if (!participantId) return;
        callApi({ method: METHOD.GET, endpoint: `/userprofile/${participantId}` })
            .then((res) => {
                const profile = res?.data;
                const url = profile?.profilePicture || profile?.avatarUrl || profile?.imageUrl || profile?.avatar || null;
                if (url) setFetchedRemoteAvatar(url);
            })
            .catch(() => { /* ignore */ });
    }, [participantId]);

    // Robust check for remote avatar
    const remoteAvatar = fetchedRemoteAvatar || (roomInfo ? (isCandidate 
        ? (roomInfo.coachAvatar || roomInfo.coachProfilePicture || roomInfo.coach?.profilePicture || roomInfo.coach?.avatarUrl || roomInfo.coach?.avatar || roomInfo.interviewer?.profilePicture || roomInfo.interviewer?.avatar || roomInfo.interviewer?.avatarUrl || roomInfo.interviewerAvatar)
        : (roomInfo.candidateAvatar || roomInfo.candidateProfilePicture || roomInfo.candidate?.profilePicture || roomInfo.candidate?.avatarUrl || roomInfo.candidate?.avatar)
    ) : null);

    const localRoleNameInRoom = isCandidate ? roomInfo?.candidateName : roomInfo?.coachName;
    const localPeerName = user?.name || user?.firstName || user?.userName || user?.displayName || localRoleNameInRoom || "You";
    const localPeerRole = "You";
    
    // Robust check for local avatar
    const localAvatar = user?.profilePicture || user?.avatarUrl || user?.imageUrl || user?.imagePath || user?.avatar;
    return (
        <Box
            sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                p: 2,
                overflow: "auto",
                bgcolor: "#FFFFFF"
            }}
        >
            {/* Videos Container */}
            <Stack spacing={2} sx={{ mb: 3 }}>
                <Box sx={{ 
                    position: "relative", 
                    width: "100%", 
                    borderRadius: 3, 
                    overflow: "hidden", 
                    aspectRatio: "16/9", 
                    bgcolor: "#E5E7EB", 
                    border: isRemoteSpeaking ? "4px solid #A3E635" : "2px solid #E5E7EB",
                    boxShadow: isRemoteSpeaking ? "0 0 15px rgba(163, 230, 53, 0.6)" : "none",
                    transition: "all 0.2s ease"
                }}>
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                        }}
                    />
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
                    boxShadow: isLocalSpeaking ? "0 0 15px rgba(59, 130, 246, 0.6)" : "none",
                    transition: "all 0.2s ease"
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
                        }}
                    />
                    <Box sx={{ position: "absolute", bottom: 8, left: 8, bgcolor: "#A3E635", px: 1, py: 0.5, borderRadius: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar src={localAvatar} sx={{ width: 20, height: 20 }} />
                        <Typography variant="caption" sx={{ fontWeight: 700, color: "#166534" }}>
                            {localPeerName !== "You" 
                                ? `You (${localPeerName})`
                                : "You"}
                        </Typography>
                    </Box>
                </Box>
            </Stack>

            {/* Controls */}
            <Stack 
                direction="row" 
                justifyContent="center" 
                alignItems="center"
                spacing={{ xs: 1, sm: 1.5, md: 2 }} 
                sx={{ 
                    mb: 4, 
                    width: "100%",
                    flexWrap: "nowrap",
                    overflow: "hidden", // Prevent breaking layout
                    "& > *": { flexShrink: 0 } // Prevent buttons from shrinking
                }}
            >
                <Fab
                    size="medium"
                    onClick={onToggleMic}
                    sx={{
                        bgcolor: isMicOn ? "#FFFFFF" : "#EF4444",
                        color: isMicOn ? "#4B5563" : "#FFFFFF",
                        border: isMicOn ? "1px solid #E5E7EB" : "none",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
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
                        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
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
                        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                        "&:hover": { bgcolor: "#F3F4F6" }
                    }}
                >
                    <ScreenShareIcon />
                </Fab>
                <Fab
                    size="medium"
                    onClick={onLeaveRoom}
                    sx={{ 
                        bgcolor: "#EF4444", 
                        color: "#FFFFFF",
                        minWidth: 48,
                        height: 48,
                        boxShadow: "0 4px 6px -1px rgba(239, 68, 68, 0.2)",
                        "&:hover": { bgcolor: "#DC2626" }
                    }}
                >
                    <CallEndIcon />
                </Fab>
            </Stack>

            {/* Internal Notes */}
            <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography variant="overline" sx={{ fontWeight: 800, color: "#6B7280", letterSpacing: 1 }}>INTERNAL NOTES</Typography>
                    <CreateIcon sx={{ color: "#9CA3AF", fontSize: 18 }} />
                </Stack>
                <TextField
                    multiline
                    fullWidth
                    minRows={4}
                    placeholder="No notes added yet..."
                    variant="outlined"
                    sx={{
                        flex: 1,
                        '& .MuiOutlinedInput-root': {
                            height: '100%',
                            alignItems: 'flex-start',
                            bgcolor: "#F9FAFB",
                            borderRadius: 2,
                            '& fieldset': { borderColor: '#E5E7EB' },
                            '&:hover fieldset': { borderColor: '#D1D5DB' },
                            '&.Mui-focused fieldset': { borderColor: '#3B82F6' },
                        },
                        '& .MuiInputBase-input': {
                            color: '#6B7280',
                            fontSize: 14,
                            fontStyle: 'italic'
                        }
                    }}
                />
            </Box>
        </Box>
    );
}

export default VideoPanel;
