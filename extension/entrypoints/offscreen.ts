// Offscreen document for speech recognition
// This runs in a separate offscreen document context

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

  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SpeechRecognition) return;

  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = lang;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event: SpeechRecognitionEvent) => {
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

  recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
    console.warn('Offscreen speech error:', event.error);
  };

  recognition.onend = () => {
    recognition = null;
  };

  recognition.start();
}

function stopSpeechRecognition() {
  recognition?.stop();
  recognition = null;
}