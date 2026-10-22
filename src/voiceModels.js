// Offline voice input (Vosk). It stays OFF for a language until you add its model here.
// 1. Find a SMALL model for the language at alphacephei.com/vosk/models (not every language has one).
// 2. Pack it as a .tar.gz the way the vosk-browser README explains, and put the file in public/voice/
// 3. Add one line below: language code -> exact file name.
export const voiceModels = {
  // hi: 'vosk-model-small-hi-0.22.tar.gz',
  // te: 'vosk-model-small-te-0.42.tar.gz',
  // en: 'vosk-model-small-en-in-0.4.tar.gz'
};
