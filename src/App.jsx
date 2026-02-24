import { io } from "socket.io-client";
import { useEffect, useRef, useState } from "react";

const socket = io("https://video-meet-backend-o7dy.onrender.com", {
  transports: ["websocket"],
});

function App() {
  const [subtitle, setSubtitle] = useState("Waiting for speech...");
  const recognitionRef = useRef(null);

  useEffect(() => {
    socket.emit("join-room", "demo-room");

    socket.on("subtitle", (text) => {
      setSubtitle(text);
    });

    return () => socket.off("subtitle");
  }, []);

  const startSubtitles = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech Recognition not supported on this device");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const text =
        event.results[event.results.length - 1][0].transcript;

      console.log("🎤 Recognized:", text);

      socket.emit("audio-chunk", {
        roomId: "demo-room",
        text,
      });
    };

    recognition.onerror = (e) => {
      console.error("Speech error:", e);
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  return (
    <div>
      <h1>Zoom-like Video Call</h1>

      <button onClick={startSubtitles}>
        🎤 Start Live Subtitles
      </button>

      <div style={{
        background: "black",
        color: "lime",
        padding: "10px",
        marginTop: "20px"
      }}>
        🗣️ {subtitle}
      </div>
    </div>
  );
}

export default App;