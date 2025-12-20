import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Typography, IconButton, Stack, Paper, Tooltip } from "@mui/material";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import CallEndIcon from "@mui/icons-material/CallEnd";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import StopScreenShareIcon from "@mui/icons-material/StopScreenShare";
import { getSocket } from "../../services/socket";
import { useNotifications } from "../../context/NotificationContext";
import { toast } from "react-toastify";

const STUN_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];

export default function MeetingRoom() {
  const { id: roomId } = useParams();
  const localVideoRef = useRef(null);
  const [peers, setPeers] = useState({}); // socketId -> { pc, stream, remoteReady, userName }
  const peersRef = useRef({}); // socketId -> { pc, stream, remoteReady, userName }
  const candidateQueueRef = useRef({}); // socketId -> RTCIceCandidate[]
  const [localStream, setLocalStream] = useState(null);
  const localStreamRef = useRef(null); // Ref to track current stream for socket handlers
  const [localUserName, setLocalUserName] = useState("");
  const socketRef = useRef(null);
  const navigate = useNavigate();
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const isScreenSharingRef = useRef(false);
  const screenStreamRef = useRef(null);
  const remoteVideoRefs = useRef({});
  const { removeMeetingNotification } = useNotifications();

  const ensureQueue = (socketId) => {
    if (!candidateQueueRef.current[socketId]) candidateQueueRef.current[socketId] = [];
    return candidateQueueRef.current[socketId];
  };

  const markRemoteReady = (socketId) => {
    if (peersRef.current[socketId]) {
      peersRef.current[socketId].remoteReady = true;
    }
    setPeers((prev) => ({
      ...prev,
      [socketId]: { ...(prev[socketId] || {}), remoteReady: true },
    }));
    const queue = ensureQueue(socketId);
    const pc = peersRef.current[socketId]?.pc;
    if (!pc) return;
    queue.forEach(async (cand) => {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(cand));
      } catch {
        console.error("Error adding queued ICE candidate");
      }
    });
    candidateQueueRef.current[socketId] = [];
  };

  const addTracksToPeerConnection = async (pc, stream, needsRenegotiation = false) => {
    if (!pc || !stream) return false;
    
    const senders = pc.getSenders();
    const videoTracks = stream.getVideoTracks();
    const audioTracks = stream.getAudioTracks();
    const videoSenders = senders.filter((s) => s.track && s.track.kind === "video");
    const audioSenders = senders.filter((s) => s.track && s.track.kind === "audio");
    
    let trackAdded = false;
    
    // If no senders exist, just add all tracks
    if (senders.length === 0) {
      stream.getTracks().forEach((track) => {
        try {
          pc.addTrack(track, stream);
          trackAdded = true;
        } catch (err) {
          console.error("Error adding track:", err);
        }
      });
      return trackAdded;
    }
    
    // Handle audio tracks first (critical for microphone)
    if (audioTracks.length > 0) {
      const newAudioTrack = audioTracks[0];
      if (audioSenders.length === 0) {
        // No audio sender, add one
        try {
          pc.addTrack(newAudioTrack, stream);
          trackAdded = true;
          console.log("Added audio track to peer connection");
        } catch (err) {
          console.error("Error adding audio track:", err);
        }
      } else if (audioSenders[0] && audioSenders[0].track !== newAudioTrack) {
        // Replace existing audio track - ensure it completes
        try {
          await audioSenders[0].replaceTrack(newAudioTrack);
          trackAdded = true;
          console.log("Replaced audio track in peer connection");
        } catch (err) {
          console.error("Error replacing audio track:", err);
          // Fallback: remove and add
          try {
            pc.removeTrack(audioSenders[0]);
            pc.addTrack(newAudioTrack, stream);
            trackAdded = true;
            console.log("Added audio track via fallback");
          } catch (e) {
            console.error("Error in audio track fallback:", e);
          }
        }
      } else if (audioSenders[0] && audioSenders[0].track === newAudioTrack) {
        // Track is already there, ensure it's enabled
        if (!newAudioTrack.enabled) {
          newAudioTrack.enabled = true;
        }
      }
    } else if (audioSenders.length > 0) {
      // Stream has no audio but we have audio senders - keep them (don't remove)
      // This handles cases where screen share might not have audio
    }
    
    // Handle video tracks
    if (videoTracks.length > 0) {
      const newVideoTrack = videoTracks[0];
      if (videoSenders.length === 0) {
        // No video sender, add one
        try {
          pc.addTrack(newVideoTrack, stream);
          trackAdded = true;
          console.log("Added video track to peer connection");
        } catch (err) {
          console.error("Error adding video track:", err);
        }
      } else if (videoSenders[0] && videoSenders[0].track !== newVideoTrack) {
        // Replace existing video track - ensure it completes
        try {
          await videoSenders[0].replaceTrack(newVideoTrack);
          trackAdded = true;
          console.log("Replaced video track in peer connection");
        } catch (err) {
          console.error("Error replacing video track:", err);
          // Fallback: remove and add
          try {
            pc.removeTrack(videoSenders[0]);
            pc.addTrack(newVideoTrack, stream);
            trackAdded = true;
            console.log("Added video track via fallback");
          } catch (e) {
            console.error("Error in video track fallback:", e);
          }
        }
      } else if (videoSenders[0] && videoSenders[0].track === newVideoTrack) {
        // Track is already there, ensure it's enabled
        if (!newVideoTrack.enabled) {
          newVideoTrack.enabled = true;
        }
      }
    }
    
    // Remove extra video senders if any (but keep at least one if we have video tracks)
    if (videoSenders.length > Math.max(1, videoTracks.length)) {
      for (let i = videoTracks.length; i < videoSenders.length; i++) {
        try {
          pc.removeTrack(videoSenders[i]);
          trackAdded = true;
        } catch (e) {
          console.error("Error removing video sender:", e);
        }
      }
    }
    
    return trackAdded;
  };

  const createPeerConnection = (targetSocketId) => {
    const pc = new RTCPeerConnection({ iceServers: STUN_SERVERS });
    
    // Don't add tracks here - they will be added explicitly by callers before creating offers
    // This avoids race conditions where offers are created before tracks are added
    
    // Handle remote tracks - this can fire multiple times for different tracks
    pc.ontrack = (event) => {
      console.log("Received track event:", event.track.kind, "from", targetSocketId, event.track);
      
      const track = event.track;
      if (!track) return;
      
      // Get or create a dedicated stream for this peer
      let peerStream = peersRef.current[targetSocketId]?.stream;
      
      if (!peerStream) {
        // Create a new MediaStream for this peer
        peerStream = new MediaStream();
        peersRef.current[targetSocketId] = {
          ...peersRef.current[targetSocketId],
          stream: peerStream,
        };
      }
      
      // Check if this exact track is already in the stream
      const existingTrackWithSameId = peerStream.getTracks().find(t => t.id === track.id);
      if (existingTrackWithSameId) {
        // Track already exists, skip
        console.log(`Track ${track.kind} with id ${track.id} already in stream for ${targetSocketId}`);
        return;
      }
      
      // When a new track of the same kind arrives (e.g., camera after screen share),
      // remove the old track of that kind first to avoid showing both
      const existingTracksOfSameKind = peerStream.getTracks().filter(t => t.kind === track.kind && t.id !== track.id);
      if (existingTracksOfSameKind.length > 0) {
        console.log(`Replacing ${existingTracksOfSameKind.length} existing ${track.kind} track(s) with new one for ${targetSocketId}`);
        existingTracksOfSameKind.forEach(oldTrack => {
          peerStream.removeTrack(oldTrack);
          // Stop the old track if it's still active
          if (oldTrack.readyState !== 'ended') {
            oldTrack.stop();
          }
        });
      }
      
      // Add the new track to our peer stream
      peerStream.addTrack(track);
      console.log(`Added ${track.kind} track to peer stream for ${targetSocketId}`);
      
      // Update state with the stream
      setPeers((prev) => {
        const currentPeer = prev[targetSocketId] || {};
        return {
          ...prev,
          [targetSocketId]: { 
            ...currentPeer, 
            stream: peerStream, 
            pc 
          },
        };
      });
      
      // Immediately update video element when track arrives
      const videoEl = remoteVideoRefs.current[targetSocketId];
      if (videoEl && peerStream) {
        // Force update the srcObject to ensure the new track is displayed
        videoEl.srcObject = peerStream;
        console.log(`Set video element srcObject for ${targetSocketId} with ${peerStream.getTracks().length} tracks`);
        // Force play
        videoEl.play().catch((err) => {
          console.error("Error playing video after track added:", err);
        });
      }
      
      // Also handle track ended event
      track.onended = () => {
        console.log(`Track ${track.kind} ended for ${targetSocketId}`);
        peerStream.removeTrack(track);
        // Update state when track ends
        setPeers((prev) => {
          const currentPeer = prev[targetSocketId] || {};
          return {
            ...prev,
            [targetSocketId]: { 
              ...currentPeer, 
              stream: peerStream
            },
          };
        });
      };
    };
    
    // ICE candidate handling
    pc.onicecandidate = (e) => {
      if (e.candidate && socketRef.current) {
        socketRef.current.emit("rtc-ice-candidate", {
          targetSocketId,
          candidate: e.candidate,
          roomId,
        });
      }
    };
    
    // Connection state monitoring
    pc.onconnectionstatechange = () => {
      console.log(`Connection state for ${targetSocketId}:`, pc.connectionState);
      if (pc.connectionState === "failed") {
        // Try to restart ICE
        pc.restartIce();
      }
    };
    
    // ICE connection state monitoring
    pc.oniceconnectionstatechange = () => {
      console.log(`ICE connection state for ${targetSocketId}:`, pc.iceConnectionState);
      if (pc.iceConnectionState === "failed") {
        // Try to restart ICE
        pc.restartIce();
      }
    };
    
    // Initialize peer data if not exists
    if (!peersRef.current[targetSocketId]) {
      peersRef.current[targetSocketId] = {
        pc,
        stream: null, // Will be created in ontrack
        remoteReady: false,
        userName: "",
      };
    } else {
      // Update existing peer with new PC
      peersRef.current[targetSocketId].pc = pc;
    }
    return pc;
  };

  useEffect(() => {
    if (!roomId) return;
    let mounted = true;

    const init = async () => {
      let computedLocalName = "User";
      try {
        const userData = localStorage.getItem("user");
        if (userData) {
          const user = JSON.parse(userData);
          computedLocalName = user.name || "User";
          setLocalUserName(computedLocalName);
        } else {
          setLocalUserName(computedLocalName);
        }
      } catch {
        setLocalUserName(computedLocalName);
      }

      let stream = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      } catch (err) {
        console.warn("getUserMedia error:", err?.name, err?.message);
        if (err?.name === "NotReadableError" || err?.name === "TrackStartError") {
          toast.error("Camera is in use by another application or tab. Joining audio-only.");
          try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            toast.info("Joined as audio-only because camera is busy.");
          } catch (err2) {
            console.error("Audio-only fallback failed:", err2);
            toast.error("Unable to access camera or microphone. Please close other apps/tabs and try again.");
          }
        } else {
          console.error("getUserMedia unexpected error:", err);
          toast.error("Unable to access camera or microphone. Please check permissions.");
        }
      }

      if (!mounted) return;
      if (!stream) {
        toast.error("Failed to get media stream. Please check permissions.");
        return;
      }
      
      // Set local stream first (both state and ref)
      setLocalStream(stream);
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Connect socket
      // cookie-based socket, no token
      const s = getSocket();
      socketRef.current = s;

      // Receive list of current peers
      s.on("rtc-room-users", async ({ peers }) => {
        // Ensure we have localStream before creating peer connections
        // Use ref to get the most up-to-date stream
        const currentStream = isScreenSharingRef.current && screenStreamRef.current 
          ? screenStreamRef.current 
          : localStreamRef.current;
        
        if (!currentStream) {
          console.error("No local stream available when receiving room users");
          return;
        }
        
        for (const targetSocketId of peers) {
          let pc = peersRef.current[targetSocketId]?.pc;
          if (!pc) {
            pc = createPeerConnection(targetSocketId);
            peersRef.current[targetSocketId].pc = pc;
          }
          
          // Always ensure tracks are added before creating offer
          await addTracksToPeerConnection(pc, currentStream);
          
          // Wait for stable state if needed
          if (pc.signalingState !== "stable") {
            await new Promise((resolve) => {
              if (pc.signalingState === "stable") {
                resolve();
              } else {
                const handler = () => {
                  if (pc.signalingState === "stable") {
                    pc.removeEventListener("signalingstatechange", handler);
                    resolve();
                  }
                };
                pc.addEventListener("signalingstatechange", handler);
              }
            });
          }
          
          // Create offer with tracks
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            s.emit("rtc-offer", { targetSocketId, description: offer, roomId });
          } catch (err) {
            console.error("Error creating offer:", err);
          }
        }
      });

      // A new user joined: wait for them to send an offer to avoid glare
      s.on("rtc-user-joined", async ({ socketId: targetSocketId }) => {
        // Optionally pre-create the connection to be ready for incoming offer
        if (!peersRef.current[targetSocketId]) {
          const pc = createPeerConnection(targetSocketId);
          peersRef.current[targetSocketId].pc = pc;
          
          // Ensure tracks are added if stream is available
          const currentStream = isScreenSharingRef.current && screenStreamRef.current 
            ? screenStreamRef.current 
            : localStreamRef.current; // Use ref to get current stream
          if (currentStream) {
            await addTracksToPeerConnection(pc, currentStream);
          }
        }
        // Send our user info so the newcomer gets our display name
        try {
          s.emit("rtc-user-info", { roomId, userName: computedLocalName });
        } catch (e) {
          // ignore
        }
      });

      // Incoming offer
      s.on("rtc-offer", async ({ fromSocketId, description }) => {
        let pc = peersRef.current[fromSocketId]?.pc;
        if (!pc) {
          pc = createPeerConnection(fromSocketId);
          peersRef.current[fromSocketId].pc = pc;
        }
        
        // Ensure our tracks are added before answering
        const currentStream = isScreenSharingRef.current && screenStreamRef.current 
          ? screenStreamRef.current 
          : localStreamRef.current; // Use ref to get current stream
        
        if (!currentStream) {
          console.error("No local stream available when handling offer");
          return;
        }
        
        // Always add tracks before answering
        await addTracksToPeerConnection(pc, currentStream);
        
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(description));
          // Remote description set: now ready to accept ICE
          markRemoteReady(fromSocketId);
          
          // Create answer with our tracks
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          s.emit("rtc-answer", { targetSocketId: fromSocketId, description: answer, roomId });
        } catch (err) {
          console.error("Error handling offer:", err);
        }
      });

      // Incoming answer
      s.on("rtc-answer", async ({ fromSocketId, description }) => {
        const pc = peersRef.current[fromSocketId]?.pc;
        if (!pc) return;
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(description));
          // Remote description set: now ready to accept ICE
          markRemoteReady(fromSocketId);
        } catch (err) {
          console.error("Error handling answer:", err);
        }
      });

      // Incoming ICE
      s.on("rtc-ice-candidate", async ({ fromSocketId, candidate }) => {
        const pc = peersRef.current[fromSocketId]?.pc;
        if (!pc || !candidate) return;
        const peerState = peersRef.current[fromSocketId];
        const isReady = peerState?.remoteReady;
        if (isReady) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch {
            // ignore
          }
        } else {
          ensureQueue(fromSocketId).push(candidate);
        }
      });

      // Peer info (name) forwarded by server
      s.on("rtc-peer-info", ({ socketId: otherSocketId, userName }) => {
        if (!otherSocketId) return;
        // Update ref and state for UI
        if (!peersRef.current[otherSocketId]) {
          peersRef.current[otherSocketId] = { pc: null, stream: null, remoteReady: false, userName: userName || "User" };
        } else {
          peersRef.current[otherSocketId].userName = userName || "User";
        }
        setPeers((prev) => ({
          ...prev,
          [otherSocketId]: { ...(prev[otherSocketId] || {}), userName: userName || "User" },
        }));
      });

      // Peer left
      s.on("rtc-user-left", ({ socketId }) => {
        const pc = peersRef.current[socketId]?.pc;
        if (pc) {
          try { pc.close(); } catch {}
          delete peersRef.current[socketId];
        }
        setPeers((prev) => {
          const copy = { ...prev };
          delete copy[socketId];
          return copy;
        });
      });

      // Join room only after stream is ready
      // This ensures we have tracks available when peer connections are created
      s.emit("rtc-join-room", { roomId });

      // Share local user info (name) with peers via server
      try {
        s.emit("rtc-user-info", { roomId, userName: computedLocalName });
      } catch (e) {
        // ignore
      }
    };

    init();
    return () => {
      mounted = false;
      // Cleanup
      try {
        socketRef.current?.off("rtc-room-users");
        socketRef.current?.off("rtc-user-joined");
        socketRef.current?.off("rtc-offer");
        socketRef.current?.off("rtc-answer");
        socketRef.current?.off("rtc-ice-candidate");
        socketRef.current?.off("rtc-user-left");
      } catch {}
      Object.values(peersRef.current).forEach((peerData) => {
        try { 
          if (peerData?.pc) {
            peerData.pc.close(); 
          }
        } catch {}
      });
      peersRef.current = {};
      if (localStream) {
        localStream.getTracks().forEach((t) => t.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  // Update peer connections when localStream becomes available
  // This handles cases where localStream is set after peer connections are created
  useEffect(() => {
    if (!localStream || isScreenSharingRef.current) return;
    
    // Add tracks to all existing peer connections and renegotiate if needed
    Promise.all(
      Object.keys(peersRef.current).map(async (socketId) => {
        const pc = peersRef.current[socketId]?.pc;
        if (!pc) return;
        
        const senders = pc.getSenders();
        const hasAudio = senders.some((sender) => sender.track && sender.track.kind === "audio");
        const hasVideo = senders.some((sender) => sender.track && sender.track.kind === "video");
        const needsAudio = localStream.getAudioTracks().length > 0;
        const needsVideo = localStream.getVideoTracks().length > 0;
        
        // Check if we need to add tracks
        if ((needsAudio && !hasAudio) || (needsVideo && !hasVideo)) {
          const trackAdded = await addTracksToPeerConnection(pc, localStream);
          
          // If tracks were added and connection is established, renegotiate
          if (trackAdded && pc.signalingState === "stable" && pc.remoteDescription) {
            try {
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              if (socketRef.current) {
                socketRef.current.emit("rtc-offer", {
                  targetSocketId: socketId,
                  description: offer,
                  roomId,
                });
              }
            } catch (err) {
              console.error("Error renegotiating after track addition:", err);
            }
          }
        }
      })
    ).catch(err => {
      console.error("Error updating peer connections with localStream:", err);
    });
  }, [localStream, isScreenSharing, roomId]);
  
  // Sync refs with state
  useEffect(() => {
    isScreenSharingRef.current = isScreenSharing;
  }, [isScreenSharing]);
  
  // Sync localStreamRef with localStream state
  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  // Update remote video elements when peer streams change
  useEffect(() => {
    Object.entries(peers).forEach(([socketId, peer]) => {
      const videoEl = remoteVideoRefs.current[socketId];
      if (videoEl && peer.stream) {
        const tracks = peer.stream.getTracks();
        const videoTracks = tracks.filter(t => t.kind === 'video');
        
        // Always force update the srcObject to ensure latest tracks are displayed
        // This is important when tracks are replaced (e.g., screen share -> camera)
        videoEl.srcObject = peer.stream;
        console.log(`Updated video element srcObject for ${socketId} in useEffect with ${tracks.length} tracks (${videoTracks.length} video)`);
        
        // Ensure video is playing
        if (videoEl.paused || videoEl.readyState < 2) {
          videoEl.play().catch((err) => {
            console.error(`Error playing remote video for ${socketId}:`, err);
          });
        }
        
        // Log stream info for debugging
        console.log(`Peer ${socketId} stream has ${tracks.length} tracks:`, 
          tracks.map(t => `${t.kind} (${t.enabled ? 'enabled' : 'disabled'}, id: ${t.id.substring(0, 8)}...)`));
      } else if (videoEl && !peer.stream) {
        // Clear video if no stream
        videoEl.srcObject = null;
      }
    });
  }, [peers]);

  const toggleMic = () => {
    const currentStream = isScreenSharingRef.current && screenStreamRef.current 
      ? screenStreamRef.current 
      : localStream;
    if (!currentStream) return;
    const audioTracks = currentStream.getAudioTracks();
    if (audioTracks.length) {
      const next = !micOn;
      audioTracks.forEach((t) => { t.enabled = next; });
      setMicOn(next);
    }
  };

  const toggleCam = () => {
    if (isScreenSharing) {
      toast.info("Cannot toggle camera while screen sharing");
      return;
    }
    if (!localStream) return;
    const videoTracks = localStream.getVideoTracks();
    if (videoTracks.length) {
      const next = !camOn;
      videoTracks.forEach((t) => { t.enabled = next; });
      setCamOn(next);
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Stop screen sharing
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
        screenStreamRef.current = null;
      }
      setIsScreenSharing(false);
      isScreenSharingRef.current = false;
      
      // Switch back to camera stream
      if (localStream) {
        // Ensure camera stream tracks are enabled
        const videoTracks = localStream.getVideoTracks();
        const audioTracks = localStream.getAudioTracks();
        videoTracks.forEach(track => {
          if (!track.enabled) track.enabled = true;
        });
        audioTracks.forEach(track => {
          if (!track.enabled) track.enabled = true;
        });
        
        // Update all peer connections with camera stream
        await Promise.all(
          Object.keys(peersRef.current).map(async (socketId) => {
            const pc = peersRef.current[socketId]?.pc;
            if (!pc) return;
            
            // Wait for stable state before renegotiating
            const waitForStable = () => {
              return new Promise((resolve) => {
                if (pc.signalingState === "stable") {
                  resolve();
                } else {
                  const handler = () => {
                    if (pc.signalingState === "stable") {
                      pc.removeEventListener("signalingstatechange", handler);
                      resolve();
                    }
                  };
                  pc.addEventListener("signalingstatechange", handler);
                }
              });
            };
            
            await waitForStable();
            
            // Replace tracks - wait for completion to ensure audio/video are properly restored
            const trackAdded = await addTracksToPeerConnection(pc, localStream);
            console.log(`Replaced tracks for ${socketId} after stopping screen share, trackAdded: ${trackAdded}`);
            
            // Re-negotiate connection
            try {
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              if (socketRef.current) {
                socketRef.current.emit("rtc-offer", {
                  targetSocketId: socketId,
                  description: offer,
                  roomId,
                });
                console.log(`Sent renegotiation offer to ${socketId} after stopping screen share`);
              }
            } catch (err) {
              console.error("Error renegotiating after stopping screen share:", err);
            }
          })
        );
        
        // Update local video
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }
      }
    } else {
      // Start screen sharing
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
        
        screenStreamRef.current = screenStream;
        setIsScreenSharing(true);
        isScreenSharingRef.current = true;
        
        // Create a combined stream: screen video + camera audio (if screen doesn't have audio)
        let streamToUse = screenStream;
        const screenHasAudio = screenStream.getAudioTracks().length > 0;
        
        // If screen share doesn't have audio and we have a camera stream with audio, combine them
        if (!screenHasAudio && localStream) {
          const cameraAudioTracks = localStream.getAudioTracks();
          if (cameraAudioTracks.length > 0) {
            // Create a new MediaStream with screen video and camera audio
            streamToUse = new MediaStream();
            screenStream.getVideoTracks().forEach(track => streamToUse.addTrack(track));
            cameraAudioTracks.forEach(track => streamToUse.addTrack(track));
          }
        }
        
        // Update all peer connections with screen stream
        await Promise.all(
          Object.keys(peersRef.current).map(async (socketId) => {
            const pc = peersRef.current[socketId]?.pc;
            if (!pc) return;
            
            // Wait for stable state before renegotiating
            const waitForStable = () => {
              return new Promise((resolve) => {
                if (pc.signalingState === "stable") {
                  resolve();
                } else {
                  const handler = () => {
                    if (pc.signalingState === "stable") {
                      pc.removeEventListener("signalingstatechange", handler);
                      resolve();
                    }
                  };
                  pc.addEventListener("signalingstatechange", handler);
                }
              });
            };
            
            await waitForStable();
            
            // Replace tracks - wait for completion
            await addTracksToPeerConnection(pc, streamToUse);
            
            // Re-negotiate connection
            try {
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              if (socketRef.current) {
                socketRef.current.emit("rtc-offer", {
                  targetSocketId: socketId,
                  description: offer,
                  roomId,
                });
              }
            } catch (err) {
              console.error("Error renegotiating after starting screen share:", err);
            }
          })
        );
        
        // Update local video
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        
        // Handle screen share end (user clicks stop in browser)
        screenStream.getVideoTracks()[0].onended = () => {
          toggleScreenShare();
        };
      } catch (err) {
        console.error("Error starting screen share:", err);
        toast.error("Failed to start screen sharing. Please check permissions.");
      }
    }
  };

  const leaveMeeting = () => {
    try {
      socketRef.current?.emit("rtc-leave-room", { roomId });
    } catch {}
    // Close peers
    Object.values(peersRef.current).forEach((peerData) => {
      try { 
        if (peerData?.pc) {
          peerData.pc.close();
        }
      } catch {}
    });
    peersRef.current = {};
    setPeers({});
    // Stop local media
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }
    try {
      removeMeetingNotification(roomId);
    } catch (e) {
      // ignore
    }
    navigate("/connections");
  };

  if (!roomId) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">Invalid meeting ID</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: "calc(100vh - 80px)", display: "flex", flexDirection: "column" }}>
      <Box sx={{ flex: 1, display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 1, p: 1 }}>
        {/* Local Video */}
        <Box sx={{ position: "relative", background: "#000", borderRadius: 2, overflow: "hidden" }}>
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <Box
            sx={{
              position: "absolute",
              bottom: 10,
              left: 10,
              backgroundColor: "rgba(0, 0, 0, 0.6)",
              color: "white",
              px: 1.5,
              py: 0.5,
              borderRadius: 1,
              fontSize: "0.9rem",
              fontWeight: 500,
            }}
          >
            {localUserName} (You)
          </Box>
        </Box>

        {/* Remote Videos */}
        {Object.entries(peers).map(([sid, p]) => (
          <Box
            key={sid}
            sx={{ position: "relative", background: "#000", borderRadius: 2, overflow: "hidden" }}
          >
            <video
              autoPlay
              playsInline
              muted={false}
              ref={(el) => {
                if (el) {
                  remoteVideoRefs.current[sid] = el;
                  if (p.stream) {
                    if (el.srcObject !== p.stream) {
                      el.srcObject = p.stream;
                      console.log(`Set video srcObject in ref callback for ${sid}`);
                    }
                    // Ensure it plays
                    el.play().catch((err) => {
                      console.error(`Error playing video in ref callback for ${sid}:`, err);
                    });
                  } else {
                    el.srcObject = null;
                  }
                } else {
                  // Cleanup
                  delete remoteVideoRefs.current[sid];
                }
              }}
              onLoadedMetadata={(e) => {
                console.log(`Video metadata loaded for ${sid}`);
                e.target.play().catch(err => {
                  console.error(`Error playing after metadata load for ${sid}:`, err);
                });
              }}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            <Box
              sx={{
                position: "absolute",
                bottom: 10,
                left: 10,
                backgroundColor: "rgba(0, 0, 0, 0.6)",
                color: "white",
                px: 1.5,
                py: 0.5,
                borderRadius: 1,
                fontSize: "0.9rem",
                fontWeight: 500,
              }}
            >
              {p.userName || "User"}
            </Box>
          </Box>
        ))}
      </Box>
      <Paper
        elevation={3}
        sx={{
          p: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          borderRadius: 0,
        }}
      >
        <Tooltip title={micOn ? "Mute" : "Unmute"}>
          <IconButton
            onClick={toggleMic}
            sx={{
              backgroundColor: micOn ? "success.main" : "error.main",
              color: "#fff",
              "&:hover": { opacity: 0.9 },
            }}
          >
            {micOn ? <MicIcon /> : <MicOffIcon />}
          </IconButton>
        </Tooltip>
        <Tooltip title={camOn ? "Turn off camera" : "Turn on camera"}>
          <IconButton
            onClick={toggleCam}
            disabled={isScreenSharing}
            sx={{
              backgroundColor: camOn ? "primary.main" : "warning.main",
              color: "#fff",
              "&:hover": { opacity: 0.9 },
              "&:disabled": { opacity: 0.5 },
            }}
          >
            {camOn ? <VideocamIcon /> : <VideocamOffIcon />}
          </IconButton>
        </Tooltip>
        <Tooltip title={isScreenSharing ? "Stop sharing screen" : "Share screen"}>
          <IconButton
            onClick={toggleScreenShare}
            sx={{
              backgroundColor: isScreenSharing ? "warning.main" : "info.main",
              color: "#fff",
              "&:hover": { opacity: 0.9 },
            }}
          >
            {isScreenSharing ? <StopScreenShareIcon /> : <ScreenShareIcon />}
          </IconButton>
        </Tooltip>
        <Tooltip title="Leave meeting">
          <IconButton
            onClick={leaveMeeting}
            sx={{
              backgroundColor: "error.main",
              color: "#fff",
              "&:hover": { opacity: 0.9 },
              ml: 2,
            }}
          >
            <CallEndIcon />
          </IconButton>
        </Tooltip>
      </Paper>
    </Box>
  );
}


