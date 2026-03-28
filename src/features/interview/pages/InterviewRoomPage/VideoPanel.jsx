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
    Badge
} from "@mui/material";
import { DangerButton, PrimaryButton, SecondaryButton } from "../../../../common/components/buttons";
import { Videocam, VideocamOff, Mic, MicOff, ExpandMore, PresentToAll } from "@mui/icons-material";
import CallEndIcon from "@mui/icons-material/CallEnd";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import StopScreenShareIcon from "@mui/icons-material/StopScreenShare";
import CreateIcon from "@mui/icons-material/Create";
import { ROLES } from "../../../../common/constants/common.js";

function VideoPanel({
    myId,
    peers,
    onCall,
    localVideoRef,
    remoteVideoRef,
    isCameraOn,
    isMicOn,
    onToggleCamera,
    onToggleMic,
    onLeaveRoom,
    user,
    roomInfo,
    endMeeting,
}) {
    const isCandidate = user?.role === ROLES.CANDIDATE;
    const remotePeerName = roomInfo ? (isCandidate ? roomInfo.coachName || "Interviewer" : roomInfo.candidateName || "Candidate") : "Peer";
    const remotePeerRole = isCandidate ? "Interviewer" : "Candidate";
    const localPeerName = user?.name || user?.firstName || "You";
    const localPeerRole = "You";
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
                <Box sx={{ position: "relative", width: "100%", borderRadius: 3, overflow: "hidden", aspectRatio: "16/9", bgcolor: "#E5E7EB", border: "2px solid transparent" }}>
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
                    <Box sx={{ position: "absolute", bottom: 8, left: 8, bgcolor: "#FFFFFF", px: 1.5, py: 0.5, borderRadius: 1.5, display: 'flex', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: "#111827" }}>{`${remotePeerName} (${remotePeerRole})`}</Typography>
                    </Box>
                    <Box sx={{ position: "absolute", top: 12, right: 12, width: 10, height: 10, bgcolor: "#EF4444", borderRadius: "50%" }} />
                </Box>

                <Box sx={{ position: "relative", width: "100%", borderRadius: 3, overflow: "hidden", aspectRatio: "16/9", bgcolor: "#E5E7EB", border: "4px solid #A3E635" }}>
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
                    <Box sx={{ position: "absolute", bottom: 8, left: 8, bgcolor: "#A3E635", px: 1.5, py: 0.5, borderRadius: 1.5, display: 'flex', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: "#166534" }}>{`${localPeerName} (${localPeerRole})`}</Typography>
                    </Box>
                    <Mic sx={{ position: "absolute", top: 10, right: 10, color: "#10B981", fontSize: 20 }} />
                </Box>
            </Stack>

            {/* Controls */}
            <Stack direction="row" display={"flex"} justifyContent={"center"} spacing={3} sx={{ mb: 4 }}>
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
                        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
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
