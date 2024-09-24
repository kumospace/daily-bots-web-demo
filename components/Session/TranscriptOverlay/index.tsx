import React, { useCallback, useEffect, useRef, useState } from "react";
import { Transcript, VoiceEvent } from "realtime-ai";
import { useVoiceClientEvent } from "realtime-ai-react";

import styles from "./styles.module.css";

export function TranscriptText() {
  const [transcripts, setTranscripts] = useState<Record<string, {type: 'bot' | 'user', text: string, timestamp: string}>>({});

  useVoiceClientEvent(
    VoiceEvent.BotTranscript,
    useCallback((text: string) => {
      setTranscripts((transcripts) => {
        const timestamp = new Date().toISOString();
        return {...transcripts, [timestamp]: {type: 'bot', text, timestamp}};
      });
    }, [])
  );

  useVoiceClientEvent(
    VoiceEvent.UserTranscript,
    useCallback((transcript: Transcript) => {
      if (!transcript.final) {
        return;
      }

      setTranscripts((transcripts) => {
        return {...transcripts, [transcript.timestamp]: {type: 'user', ...transcript}};
      });
    }, [])
  );

  return <>{Object.values(transcripts).toSorted((a, b) => a.timestamp.localeCompare(b.timestamp)).map((sentence) => (
    <div key={sentence.timestamp}>{sentence.type}: {sentence.text.trim()}</div>
  ))}</>
}

const TranscriptOverlay: React.FC = () => {
  const [sentences, setSentences] = useState<string[]>([]);
  const [sentencesBuffer, setSentencesBuffer] = useState<string[]>([]);
  const displayIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (sentencesBuffer.length > 0) {
      const interval = 1000 * sentences.length;
      displayIntervalRef.current = setTimeout(() => {
        setSentences((s) => [...s, sentencesBuffer[0]]);
        setSentencesBuffer((s) => s.slice(1));
      }, interval);
    }
    return () => {
      if (displayIntervalRef.current) {
        clearInterval(displayIntervalRef.current);
      }
    };
  }, [sentencesBuffer, sentences]);

  return (
    <div className={styles.container}>
      {sentences.map((sentence, index) => (
        <abbr
          key={index}
          className={`${styles.transcript} ${styles.sentence}`}
          onAnimationEnd={() => setSentences((s) => s.slice(1))}
        >
          <span>{sentence}</span>
        </abbr>
      ))}
    </div>
  );
};

export default TranscriptOverlay;
