import { useRef, useState, useCallback, useEffect } from "react";

// ---------------------------------------------------------------------------
// ICE configuration
// STUN for direct connections + TURN (openrelay.metered.ca) as relay fallback
// for peers behind symmetric NAT / corporate firewalls.
// ---------------------------------------------------------------------------
const ICE_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443?transport=tcp",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ],
};

// ---------------------------------------------------------------------------
// Audio level detection — uses AudioContext + AnalyserNode to determine if a
// MediaStream contains audible speech.  Returns a cleanup function.
// ---------------------------------------------------------------------------
function monitorAudioLevel(stream, onSpeakingChange) {
  if (!stream || stream.getAudioTracks().length === 0) return () => {};

  let audioCtx;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  } catch {
    return () => {};
  }

  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 512;
  analyser.smoothingTimeConstant = 0.4;

  const source = audioCtx.createMediaStreamSource(stream);
  source.connect(analyser);

  const data = new Uint8Array(analyser.frequencyBinCount);
  let speaking = false;
  let rafId = null;

  const THRESHOLD = 25; // amplitude threshold (0-255)

  const check = () => {
    analyser.getByteFrequencyData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) sum += data[i];
    const avg = sum / data.length;

    const nowSpeaking = avg > THRESHOLD;
    if (nowSpeaking !== speaking) {
      speaking = nowSpeaking;
      onSpeakingChange(speaking);
    }
    rafId = requestAnimationFrame(check);
  };

  check();

  return () => {
    if (rafId != null) cancelAnimationFrame(rafId);
    source.disconnect();
    audioCtx.close().catch(() => {});
  };
}

// ---------------------------------------------------------------------------
// useWebRTC — Perfect Negotiation Pattern
//
// Key design rules (fixes for the renegotiation storm):
//
//  1. onnegotiationneeded MUST guard with:
//       if (makingOffer || pc.signalingState !== "stable") return
//     Without this, every setLocalDescription(answer) re-fires the event,
//     creating an infinite offer/answer loop that kills ICE.
//
//  2. createPeerConnection adds NO transceivers and NO tracks.
//     "recvonly" transceivers cause a direction deadlock when both peers do
//     this simultaneously (A says recvonly, B says recvonly → nobody sends →
//     browser keeps re-negotiating → storm).
//     Instead, tracks are added lazily by toggleCam/toggleMic, which is the
//     ONLY correct trigger for onnegotiationneeded.
//
//  3. initiatePeerConnection stores the targetId but only creates the PC
//     immediately if we already have active local tracks.  Otherwise the PC
//     is created on first toggleCam/toggleMic.  This prevents both peers from
//     sending offers with empty media sections.
//
//  4. Polite peer (selfId < targetId) uses implicit rollback via
//     setRemoteDescription(offer) — Chrome handles the rollback automatically.
//
// Inputs
//   signalingSender  – async (method: string, ...args) => void
//   selfId           – own SignalR connectionId (string | null)
//
// Outputs
//   localStream, remoteStream
//   isCameraOn, isMicOn
//   isLocalSpeaking, isRemoteSpeaking
//   toggleCam(), toggleMic()
//   initiatePeerConnection(targetId)
//   closePeerConnection()
//   handleOffer(fromId, sdp)
//   handleAnswer(fromId, sdp)
//   handleIceCandidate(fromId, str)
// ---------------------------------------------------------------------------
export function useWebRTC({ signalingSender, selfId }) {
  // ── Media streams ──────────────────────────────────────────────────────────
  const localStreamRef = useRef(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  // ── Peer connection ────────────────────────────────────────────────────────
  const pcRef = useRef(null);
  const targetPeerIdRef = useRef(null);

  // ── Perfect Negotiation flags ─────────────────────────────────────────────
  const makingOffer = useRef(false);
  const ignoreOffer = useRef(false);
  const isSettingRemoteAnswerPending = useRef(false);
  const isPolite = useRef(false);

  // ── ICE candidate buffer ───────────────────────────────────────────────────
  const iceCandidatesQueue = useRef([]);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);

  // ── Speaking detection state ───────────────────────────────────────────────
  const [isLocalSpeaking, setIsLocalSpeaking] = useState(false);
  const [isRemoteSpeaking, setIsRemoteSpeaking] = useState(false);
  const localSpeakingCleanup = useRef(null);
  const remoteSpeakingCleanup = useRef(null);

  // ── Stable refs for async handlers ────────────────────────────────────────
  const signalingSenderRef = useRef(signalingSender);
  useEffect(() => { signalingSenderRef.current = signalingSender; }, [signalingSender]);

  const selfIdRef = useRef(selfId);
  useEffect(() => { selfIdRef.current = selfId; }, [selfId]);

  // ── Speaking detection for local stream ───────────────────────────────────
  useEffect(() => {
    localSpeakingCleanup.current?.();
    localSpeakingCleanup.current = null;
    if (localStream) {
      localSpeakingCleanup.current = monitorAudioLevel(localStream, setIsLocalSpeaking);
    } else {
      setIsLocalSpeaking(false);
    }
    return () => {
      localSpeakingCleanup.current?.();
      localSpeakingCleanup.current = null;
    };
  }, [localStream]);

  // ── Speaking detection for remote stream ──────────────────────────────────
  useEffect(() => {
    remoteSpeakingCleanup.current?.();
    remoteSpeakingCleanup.current = null;
    if (remoteStream) {
      remoteSpeakingCleanup.current = monitorAudioLevel(remoteStream, setIsRemoteSpeaking);
    } else {
      setIsRemoteSpeaking(false);
    }
    return () => {
      remoteSpeakingCleanup.current?.();
      remoteSpeakingCleanup.current = null;
    };
  }, [remoteStream]);

  // ── ICE queue flush ────────────────────────────────────────────────────────
  const flushIceCandidateQueue = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc || !pc.remoteDescription) return;
    while (iceCandidatesQueue.current.length > 0) {
      const candidate = iceCandidatesQueue.current.shift();
      try {
        await pc.addIceCandidate(candidate);
      } catch (err) {
        if (!ignoreOffer.current) console.error("[WebRTC] addIceCandidate (queued):", err);
      }
    }
  }, []);

  // ── Peer Connection factory ────────────────────────────────────────────────
  // IMPORTANT: Does NOT add any transceivers or tracks.
  // Tracks are added by toggleCam/toggleMic which correctly trigger
  // onnegotiationneeded exactly once.
  const createPeerConnection = useCallback((targetId) => {
    if (pcRef.current) {
      console.warn("[WebRTC] PeerConnection already exists.");
      return pcRef.current;
    }

    console.log("[WebRTC] Creating RTCPeerConnection → target:", targetId);
    const pc = new RTCPeerConnection(ICE_CONFIG);
    pcRef.current = pc;
    targetPeerIdRef.current = targetId;

    // ── ICE ──────────────────────────────────────────────────────────────────
    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        signalingSenderRef.current?.(
          "SendIceCandidate",
          targetPeerIdRef.current,
          JSON.stringify(candidate)
        );
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log("[WebRTC] ICE state:", pc.iceConnectionState);
      if (pc.iceConnectionState === "failed") {
        console.warn("[WebRTC] ICE failed – restarting ICE");
        pc.restartIce();
      }
    };

    pc.onconnectionstatechange = () => {
      console.log("[WebRTC] Connection state:", pc.connectionState);
      if (pc.connectionState === "failed") {
        console.warn("[WebRTC] Connection failed – restarting ICE");
        pc.restartIce();
      }
    };

    // ── Remote tracks ─────────────────────────────────────────────────────────
    pc.ontrack = ({ track, streams }) => {
      console.log("[WebRTC] Remote track received:", track.kind);
      if (streams[0]) {
        setRemoteStream(streams[0]);
      }
    };

    // ── Perfect Negotiation: the ONE place offers are created ─────────────────
    // CRITICAL GUARD: skip if already making an offer OR if not in stable state.
    // Without this guard, every setLocalDescription(answer) re-fires this event,
    // creating an infinite offer/answer renegotiation storm that kills ICE.
    pc.onnegotiationneeded = async () => {
      if (makingOffer.current || pc.signalingState !== "stable") {
        console.log(
          "[WebRTC] onnegotiationneeded skipped — state:",
          pc.signalingState,
          "| makingOffer:",
          makingOffer.current
        );
        return;
      }
      try {
        console.log("[WebRTC] onnegotiationneeded — creating offer");
        makingOffer.current = true;
        await pc.setLocalDescription(); // auto-creates offer in Unified Plan
        signalingSenderRef.current?.(
          "SendOffer",
          targetPeerIdRef.current,
          pc.localDescription.sdp
        );
        console.log("[WebRTC] Offer sent →", targetPeerIdRef.current);
      } catch (err) {
        console.error("[WebRTC] onnegotiationneeded error:", err);
      } finally {
        makingOffer.current = false;
      }
    };

    return pc;
  }, []); // stable — reads from refs only

  // ── Public: record that a peer is available; create PC if we have tracks ───
  const initiatePeerConnection = useCallback((targetId) => {
    if (pcRef.current) return;

    isPolite.current = (selfIdRef.current ?? "") < targetId;
    targetPeerIdRef.current = targetId;
    console.log(
      "[WebRTC] Peer available →", targetId,
      "| polite:", isPolite.current
    );

    // If we already have active local tracks (e.g., user turned camera on
    // before the peer joined), create the PC now and add them.
    // This fires onnegotiationneeded → offer sent.
    const activeTracks = localStreamRef.current
      ?.getTracks()
      .filter((t) => t.enabled) ?? [];

    if (activeTracks.length > 0) {
      const pc = createPeerConnection(targetId);
      for (const track of activeTracks) {
        pc.addTrack(track, localStreamRef.current);
      }
    }
    // Otherwise: PC is created lazily on first toggleCam/toggleMic call.
  }, [createPeerConnection]);

  // ── Public: close connection ───────────────────────────────────────────────
  const closePeerConnection = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    // Reset ALL peer-related state so a reconnecting peer can re-initiate
    targetPeerIdRef.current = null;
    iceCandidatesQueue.current = [];
    makingOffer.current = false;
    ignoreOffer.current = false;
    isSettingRemoteAnswerPending.current = false;
    isPolite.current = false;
    setRemoteStream(null);
    console.log("[WebRTC] PeerConnection closed.");
  }, []);

  // ── Helper: add local tracks to PC if not already present ──────────────────
  const addLocalTracksToPc = useCallback((pc) => {
    if (!pc || !localStreamRef.current) return;
    const localTracks = localStreamRef.current.getTracks().filter((t) => t.enabled);
    const existingKinds = new Set(
      pc.getSenders().map((s) => s.track?.kind).filter(Boolean)
    );
    for (const track of localTracks) {
      if (!existingKinds.has(track.kind)) {
        pc.addTrack(track, localStreamRef.current);
      }
    }
  }, []);

  // ── Signaling: incoming offer ─────────────────────────────────────────────
  const handleOffer = useCallback(async (fromId, sdp) => {
    // Answerer path: create PC if it doesn't exist yet.
    if (!pcRef.current) {
      isPolite.current = (selfIdRef.current ?? "") < fromId;
      targetPeerIdRef.current = fromId;
      createPeerConnection(fromId);
    }

    const pc = pcRef.current;

    // Glare detection
    const offerCollision = makingOffer.current || pc.signalingState !== "stable";
    ignoreOffer.current = !isPolite.current && offerCollision;

    if (ignoreOffer.current) {
      console.warn("[WebRTC] Impolite peer ignoring colliding offer.");
      return;
    }

    // Polite peer: implicit rollback via setRemoteDescription, then answer.
    // Also reset makingOffer here since we're abandoning any pending offer.
    makingOffer.current = false;

    // FIX (B1): Set remote description FIRST, then add local tracks BEFORE
    // creating the answer. This ensures our tracks are included in the answer
    // SDP (recvonly transceivers from the offer become sendrecv).
    await pc.setRemoteDescription({ type: "offer", sdp });

    // Add local tracks BEFORE creating the answer so they are in the SDP.
    addLocalTracksToPc(pc);

    await pc.setLocalDescription(); // auto-creates answer with our tracks included

    signalingSenderRef.current?.("SendAnswer", fromId, pc.localDescription.sdp);
    console.log("[WebRTC] Answer sent →", fromId);

    await flushIceCandidateQueue();
  }, [createPeerConnection, flushIceCandidateQueue, addLocalTracksToPc]);

  // ── Signaling: incoming answer ────────────────────────────────────────────
  const handleAnswer = useCallback(async (fromId, sdp) => {
    const pc = pcRef.current;
    if (!pc) return;
    isSettingRemoteAnswerPending.current = true;
    try {
      await pc.setRemoteDescription({ type: "answer", sdp });
      console.log("[WebRTC] Remote answer set ←", fromId);
    } catch (err) {
      if (!ignoreOffer.current)
        console.error("[WebRTC] setRemoteDescription(answer) error:", err);
    } finally {
      isSettingRemoteAnswerPending.current = false;
    }
    await flushIceCandidateQueue();
  }, [flushIceCandidateQueue]);

  // ── Signaling: incoming ICE candidate ─────────────────────────────────────
  const handleIceCandidate = useCallback(async (_fromId, candidateStr) => {
    const pc = pcRef.current;
    if (!pc || !candidateStr) return;
    try {
      const candidate = JSON.parse(candidateStr);
      if (!pc.remoteDescription || isSettingRemoteAnswerPending.current) {
        iceCandidatesQueue.current.push(candidate);
        console.log("[WebRTC] ICE candidate buffered");
      } else {
        await pc.addIceCandidate(candidate);
      }
    } catch (err) {
      if (!ignoreOffer.current) console.error("[WebRTC] addIceCandidate:", err);
    }
  }, []);

  // ── Media toggles ──────────────────────────────────────────────────────────
  // Mute/unmute: track.enabled — zero renegotiation.
  // First acquisition: getUserMedia → addTrack (triggers onnegotiationneeded once).
  // Camera off: track.enabled = false, track kept alive in the sender.
  //   (removeTrack would fire onnegotiationneeded, which we want to avoid.)

  const toggleMic = useCallback(async () => {
    try {
      const existingAudio = localStreamRef.current?.getAudioTracks()[0];

      if (isMicOn) {
        if (existingAudio) existingAudio.enabled = false;
        setIsMicOn(false);
        return;
      }

      if (existingAudio) {
        // Already acquired, just re-enable
        existingAudio.enabled = true;
      } else {
        // First time — acquire audio
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioTrack = audioStream.getAudioTracks()[0];

        if (!localStreamRef.current) localStreamRef.current = new MediaStream();
        localStreamRef.current.addTrack(audioTrack);
        setLocalStream(new MediaStream(localStreamRef.current.getTracks()));

        // Ensure PC exists (lazy creation)
        if (!pcRef.current && targetPeerIdRef.current) {
          createPeerConnection(targetPeerIdRef.current);
        }

        const pc = pcRef.current;
        if (pc) {
          const sender = pc.getSenders().find((s) => s.track?.kind === "audio");
          if (sender) {
            await sender.replaceTrack(audioTrack); // no renegotiation needed
          } else {
            pc.addTrack(audioTrack, localStreamRef.current); // fires onnegotiationneeded
          }
        }
      }
      setIsMicOn(true);
    } catch (err) {
      console.error("[WebRTC] toggleMic error:", err);
    }
  }, [isMicOn, createPeerConnection]);

  const toggleCam = useCallback(async () => {
    try {
      const existingVideo = localStreamRef.current?.getVideoTracks()[0];

      if (isCameraOn) {
        if (existingVideo) existingVideo.enabled = false;
        setIsCameraOn(false);
        return;
      }

      if (existingVideo) {
        existingVideo.enabled = true;
      } else {
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const videoTrack = videoStream.getVideoTracks()[0];

        if (!localStreamRef.current) localStreamRef.current = new MediaStream();
        localStreamRef.current.addTrack(videoTrack);
        setLocalStream(new MediaStream(localStreamRef.current.getTracks()));

        // Ensure PC exists (lazy creation)
        if (!pcRef.current && targetPeerIdRef.current) {
          createPeerConnection(targetPeerIdRef.current);
        }

        const pc = pcRef.current;
        if (pc) {
          const sender = pc.getSenders().find((s) => s.track?.kind === "video");
          if (sender) {
            await sender.replaceTrack(videoTrack); // no renegotiation
          } else {
            pc.addTrack(videoTrack, localStreamRef.current); // fires onnegotiationneeded
          }
        }
      }
      setIsCameraOn(true);
    } catch (err) {
      console.error("[WebRTC] toggleCam error:", err);
    }
  }, [isCameraOn, createPeerConnection]);

  // ── Cleanup ────────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      pcRef.current?.close();
      pcRef.current = null;
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return {
    localStream,
    remoteStream,
    isCameraOn,
    isMicOn,
    isLocalSpeaking,
    isRemoteSpeaking,
    toggleCam,
    toggleMic,
    initiatePeerConnection,
    closePeerConnection,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
  };
}
