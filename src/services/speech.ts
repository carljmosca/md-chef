// Speech Synthesis service for hands-free step read-aloud
// Retain reference on module level to prevent mobile WebKit / Chromium garbage collection bug
let activeUtterance: SpeechSynthesisUtterance | null = null;

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

export function stopSpeaking(): void {
  if (isSpeechSupported()) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore cancel errors
    }
  }
  activeUtterance = null;
}

export function speakText(text: string, rate: number = 1.0, onEnd?: () => void): void {
  if (!isSpeechSupported()) return;

  stopSpeaking();

  // Strip markdown, bracket checklists, and HTML artifacts
  const clean = text
    .replace(/^(\d+\.|\-|\*)\s*(\[[ xX]\])?\s*/g, '')
    .replace(/[*_#`~]/g, '')
    .trim();

  if (!clean) return;

  try {
    const utterance = new SpeechSynthesisUtterance(clean);
    activeUtterance = utterance;

    utterance.rate = Math.max(0.7, Math.min(1.5, rate));
    utterance.pitch = 1.0;
    utterance.lang = navigator.language || 'en-US';

    const handleFinished = () => {
      if (activeUtterance === utterance) {
        activeUtterance = null;
      }
      if (onEnd) onEnd();
    };

    utterance.onend = handleFinished;
    utterance.onerror = handleFinished;

    // Mobile Safari / Chrome sometimes suspend speechSynthesis in the background
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Speech synthesis failed:', err);
    activeUtterance = null;
    if (onEnd) onEnd();
  }
}

