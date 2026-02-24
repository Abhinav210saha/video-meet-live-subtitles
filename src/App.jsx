import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const socket = io("https://video-meet-backend-o7dy.onrender.com", {
  transports: ["websocket"],
});

const ICE_SERVERS = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

function App() {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const recognitionRef = useRef(null);

  const [subtitle, setSubtitle] = useState("Waiting for speech...");

  useEffect(() => {
    socket.emit("join-room", "demo-room");

    socket.on("subtitle", setSubtitle);

    socket.on("user-joined", async () => {
      await createOffer();
    });

    socket.on("offer", async (offer) => {
      await createAnswer(offer);
    });

    socket.on("answer", async (answer) => {
      await peerRef.current.setRemoteDescription(answer);
    });

    socket.on("ice-candidate", (candidate) => {
      peerRef.current.addIceCandidate(candidate);
    });

    startCamera();

    return () => {
      socket.disconnect();
    };
  }, []);

  // 🎥 Camera
  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    localVideoRef.current.srcObject = stream;
    localStreamRef.current = stream;
  };

  // 🔁 Create Peer
  const createPeer = () => {
    const peer = new RTCPeerConnection(ICE_SERVERS);

    localStreamRef.current.getTracks().forEach((track) =>
      peer.addTrack(track, localStreamRef.current)
    );

    peer.ontrack = (event) => {
      remoteVideoRef.current.srcObject = event.streams[0];
    };

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", event.candidate);
      }
    };

    peerRef.current = peer;
  };

  // 📞 Offer
  const createOffer = async () => {
    createPeer();
    const offer = await peerRef.current.createOffer();
    await peerRef.current.setLocalDescription(offer);
    socket.emit("offer", offer);
  };

  // 📞 Answer
  const createAnswer = async (offer) => {
    createPeer();
    await peerRef.current.setRemoteDescription(offer);
    const answer = await peerRef.current.createAnswer();
    await peerRef.current.setLocalDescription(answer);
    socket.emit("answer", answer);
  };

  // 🎤 Subtitles
  const startSubtitles = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.continuous = true;

    recognition.onresult = (event) => {
      const text =
        event.results[event.results.length - 1][0].transcript;

      socket.emit("audio-chunk", {
        roomId: "demo-room",
        text,
      });
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>🎥 Real-Time Video Meet + Live Subtitles</h2>

      <div style={{ display: "flex", gap: 20 }}>
        <video ref={localVideoRef} autoPlay muted width="300" />
        <video ref={remoteVideoRef} autoPlay width="300" />
      </div>

      <button onClick={startSubtitles} style={{ marginTop: 10 }}>
        🎤 Start Live Subtitles
      </button>

      <div
        style={{
          background: "black",
          color: "lime",
          padding: 10,
          marginTop: 15,
        }}
      >
        🗣️ {subtitle}
      </div>
    </div>
  );
}

export default App;