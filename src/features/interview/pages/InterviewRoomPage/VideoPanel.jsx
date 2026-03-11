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
} from "@mui/material";
import { DangerButton, PrimaryButton, SecondaryButton } from "../../../../common/components/buttons";
import { Videocam, VideocamOff, Mic, MicOff, ExpandMore } from "@mui/icons-material";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";

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
    endMeeting,
}) {
    return (
        <Box
            sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                p: 2,
                overflow: "auto",
            }}
        >
            <Box mb={2} display="flex" justifyContent="flex-end">
                <DangerButton onClick={onLeaveRoom} endIcon={<ExitToAppIcon />}>
                    Leave
                </DangerButton>
            </Box>
            {/* Peers List */}
            <Accordion elevation={0} sx={{ mb: 2, border: "1px solid", borderColor: "divider" }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="h6">Peers ({peers.length})</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 2 }}>
                    {peers.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                            No peers connected
                        </Typography>
                    ) : (
                        <List dense disablePadding>
                            {peers.map((p) => (
                                <ListItem
                                    key={p}
                                    sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        px: 0,
                                    }}
                                >
                                    <code style={{ fontSize: "0.875rem", wordBreak: "break-all" }}>{p}</code>
                                </ListItem>
                            ))}
                        </List>
                    )}
                </AccordionDetails>
            </Accordion>

            {/* Video Controls */}
            <Paper elevation={0} sx={{ p: 2, mb: 2, border: "1px solid", borderColor: "divider" }}>
                <Box sx={{ position: "relative", mb: 2 }}>
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        style={{
                            width: "100%",
                            // height: 250,
                            borderRadius: 8,
                            background: "#000",
                            aspectRatio: "16/9",
                        }}
                    />
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        style={{
                            position: "absolute",
                            bottom: 10,
                            right: 10,
                            width: "35%",
                            height: 95,
                            borderRadius: 8,
                            background: "#000",
                            aspectRatio: "16/9",
                            border: "2px solid white",
                        }}
                    />
                </Box>
                <Stack direction="row" display={"flex"} justifyContent={"center"} spacing={4}>
                    <SecondaryButton
                        onClick={onToggleCamera}
                        sx={{
                            bgcolor: isCameraOn ? "primary.main" : "error.main",
                            color: "white",
                            "&:hover": {
                                bgcolor: isCameraOn ? "primary.dark" : "error.dark",
                            }
                        }}
                    >
                        {isCameraOn ? <Videocam /> : <VideocamOff />}
                    </SecondaryButton>
                    <SecondaryButton
                        onClick={onToggleMic}
                        sx={{
                            bgcolor: isMicOn ? "primary.main" : "error.main",
                            color: "white",
                            "&:hover": {
                                bgcolor: isMicOn ? "primary.dark" : "error.dark",
                            }
                        }}
                    >
                        {isMicOn ? <Mic /> : <MicOff />}
                    </SecondaryButton>
                </Stack>
            </Paper>
        </Box>
    );
}

export default VideoPanel;
