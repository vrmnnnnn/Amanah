import { useState } from "react";

interface VoiceButtonProps {
  onToggle?: (recording: boolean) => void;
  size?: "sm" | "md" | "lg";
}

export default function VoiceButton({ onToggle, size = "lg" }: VoiceButtonProps) {
  const [recording, setRecording] = useState(false);

  const sizeMap = {
    sm: "w-10 h-10",
    md: "w-14 h-14",
    lg: "w-[56px] h-[56px]",
  };

  const toggle = () => {
    const next = !recording;
    setRecording(next);
    onToggle?.(next);
  };

  return (
    <button
      onClick={toggle}
      className={`${sizeMap[size]} rounded-full bg-gradient-to-br from-secondary to-primary shadow-[0_10px_20px_rgba(120,85,94,0.3)] flex items-center justify-center text-white flex-shrink-0 hover:scale-105 transition-transform relative ${
        recording ? "animate-pulse-ring" : ""
      }`}
    >
      <span className="material-symbols-outlined icon-filled">
        {recording ? "stop" : "mic"}
      </span>
      {recording && (
        <span className="absolute inset-0 rounded-full bg-primary animate-pulse-ring -z-10" />
      )}
    </button>
  );
}
