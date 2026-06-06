import { useState } from "react";

// TODO (frontend owner): wire react-native-audio-recorder-player +
// RECORD_AUDIO permission. start() begins recording; stop() returns the file
// uri to POST to /api/search/voice (endpoint pending on the backend).

export function useAudioRecorder() {
  const [recording, setRecording] = useState(false);

  const start = async () => {
    setRecording(true);
    // await recorder.startRecorder()
  };

  const stop = async (): Promise<string | null> => {
    setRecording(false);
    // const uri = await recorder.stopRecorder()
    return null;
  };

  return { recording, start, stop };
}
