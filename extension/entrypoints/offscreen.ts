import { defineUnlistedScript } from 'wxt/sandbox';

// Offscreen document for speech recognition
// This runs in a separate offscreen document context

// Web Speech API types (not in standard lib.dom.d.ts)
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface OffscreenMessage {
  type: 'speech-start' | 'speech-stop';
  lang?: string;
}

chrome.runtime.onMessage.addListener((message: OffscreenMessage) => {
  if (message.type === 'speech-start') {
    startSpeechRecognition(message.lang || 'ru-RU');
  } else if (message.type === 'speech-stop') {
    stopSpeechRecognition();
  }
});

let recognition: SpeechRecognition | null = null;

function startSpeechRecognition(lang: string) {
  if (recognition) return;

  const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SpeechRecognitionCtor) return;

  const rec = new SpeechRecognitionCtor();
  rec.continuous = true;
  rec.interimResults = true;
  rec.lang = lang;
  rec.maxAlternatives = 1;

  rec.onresult = (event: SpeechRecognitionEvent) => {
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      if (result.isFinal && result[0].confidence > 0.7) {
        chrome.runtime.sendMessage({
          type: 'speech-result',
          transcript: result[0].transcript,
          confidence: result[0].confidence,
        });
      }
    }
  };

  rec.onerror = (event: SpeechRecognitionErrorEvent) => {
    console.warn('Offscreen speech error:', event.error);
  };

  rec.onend = () => {
    if (recognition === rec) recognition = null;
  };

  recognition = rec;
  rec.start();
}

function stopSpeechRecognition() {
  recognition?.stop();
  recognition = null;
}

export default defineUnlistedScript(() => {
  // Offscreen document entry point
  console.log('ZINGO offscreen document loaded');
});