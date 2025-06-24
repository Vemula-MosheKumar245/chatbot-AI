import React, { useState, useRef } from "react";
import { useForm } from "react-hook-form";

export default function ChatBot() {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const recognitionRef = useRef(null);
  const speechRef = useRef(null);

  const onSubmit = async (data) => {
    await sendToBackend(data.message);
  };

  const sendToBackend = async (message) => {
    setLoading(true);
    setAnswer("");
    try {
      const response = await fetch("http://192.168.101.41:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      const result = await response.json();
      setAnswer(result.answer);
      speak(result.answer);
      reset();
    } catch (error) {
      console.error("Error sending message:", error);
      setAnswer("Something went wrong.");
      speak("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    speechRef.current = utterance;
  };

  const stopAll = () => {
    window.speechSynthesis.cancel();
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    setRecording(false);
  };

  const startListening = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      alert("Speech Recognition not supported in this browser.");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setRecording(true);
    recognition.onresult = (event) => {
      const spokenText = event.results[0][0].transcript;
      sendToBackend(spokenText);
    };
    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setAnswer("Speech recognition error");
    };
    recognition.onend = () => setRecording(false);

    recognition.start();
    recognitionRef.current = recognition;
  };

  return (
  <div className="chatbot-container">
    <h1 style={{ fontSize: "2rem", fontWeight: "bold", textAlign: "center", marginBottom: "20px", color: "#333" }}>
      🎙️ Voice-Enabled AI ChatBot
    </h1>

    <form onSubmit={handleSubmit(onSubmit)} className="form">
      <textarea
        {...register("message", { required: "Message is required" })}
        placeholder="Type your question or use mic..."
        rows={4}
      ></textarea>
      {errors.message && (
        <p style={{ color: "red", fontSize: "0.9rem", marginTop: "4px" }}>{errors.message.message}</p>
      )}

      <div className="centered-buttons" style={{ marginTop: "20px" }}>
        <button type="submit" disabled={loading} className="ask-btn">
          {loading ? "Thinking..." : "Ask Gemini"}
        </button>

        <button
          type="button"
          onClick={startListening}
          disabled={recording || loading}
          className="mic-btn"
        >
          🎤 {recording ? "Listening..." : "Speak"}
        </button>

        <button type="button" onClick={stopAll} className="stop-btn">
          ⏹ Stop
        </button>
      </div>
    </form>

    {answer && (
      <div className="response">
        <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "10px", color: "#444" }}>ChatBot Answer:</h2>
        <p>{answer}</p>
      </div>
    )}
  </div>
);

  
}
