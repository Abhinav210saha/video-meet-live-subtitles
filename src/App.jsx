import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:5000");

function App() {
  const videoRef = useRef(null);
  const recognitionRef = useRef(null);

  const [subtitle, setSubtitle] = useState("Waiting for speech...");
  const [listening, setListening] = useState(false);

  const roomId = "demo-room";

  // 🎥 CAMERA
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        videoRef.current.srcObject = stream;
      });

    socket.emit("join-room", roomId);
  }, []);

  // 🎤 START SPEECH (USER CLICK REQUIRED)
  const startSpeech = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech Recognition not supported");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let transcript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }

      socket.emit("speech-text", {
        roomId,
        text: transcript,
      });
    };

    recognition.start();
    recognitionRef.current = recognition;
    setListening(true);
  };

  // 📩 RECEIVE SUBTITLES
  useEffect(() => {
    socket.on("subtitle", (text) => {
      setSubtitle(text);
    });

    return () => socket.off("subtitle");
  }, []);

  return (
    <div style={{ textAlign: "center" }}>
      <h2>Zoom-like Video Call</h2>

      <video
        ref={videoRef}
        autoPlay
        muted
        style={{ width: "400px", borderRadius: "10px" }}
      />

      <br /><br />

      {!listening && (
        <button
          onClick={startSpeech}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          🎤 Start Live Subtitles
        </button>
      )}

      <div
        style={{
          background: "black",
          color: "lime",
          padding: "15px",
          marginTop: "15px",
          fontSize: "18px",
        }}
      >
        🗣️ {subtitle}
      </div>
    </div>
  );
}

export default App;
