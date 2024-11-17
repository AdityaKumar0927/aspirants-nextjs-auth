'use client';

import { useState, useEffect } from "react";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";

const VoiceToTextContent = () => {
  const [isClient, setIsClient] = useState(false);
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleStartListening = () => {
    resetTranscript();
    SpeechRecognition.startListening({ continuous: true });
  };

  const handleStopListening = () => {
    SpeechRecognition.stopListening();
  };

  if (!isClient) {
    return <div>Loading speech recognition...</div>;
  }

  if (!browserSupportsSpeechRecognition) {
    return <div>Your browser does not support speech recognition.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-center space-x-2">
        <Button onClick={handleStartListening} disabled={listening}>
          <Mic className="mr-2 h-4 w-4" />
          Start Recording
        </Button>
        <Button onClick={handleStopListening} disabled={!listening} variant="secondary">
          <MicOff className="mr-2 h-4 w-4" />
          Stop Recording
        </Button>
      </div>
      <div className="p-4 border rounded-md min-h-[100px]">
        {transcript || "Your note will appear here..."}
      </div>
    </div>
  );
};

export default VoiceToTextContent;
