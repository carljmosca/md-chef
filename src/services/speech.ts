// Speech Synthesis service for hands-free step read-aloud

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function stopSpeaking(): void {
  if (isSpeechSupported()) {
    window.speechSynthesis.cancel();
  }
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

  const utterance = new SpeechSynthesisUtterance(clean);
  utterance.rate = Math.max(0.7, Math.min(1.5, rate));
  utterance.pitch = 1.0;

  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
  }

  window.speechSynthesis.speak(utterance);
}

