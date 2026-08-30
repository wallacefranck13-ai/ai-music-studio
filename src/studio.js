export const genres = [
  'Afrobeats',
  'Pop/Variété',
  'Hip-Hop/Trap',
  'EDM/Electro',
  'Synthwave',
  'Lo-Fi',
  'Rock/Metal',
  'Gospel',
];

export const moods = ['Épique', 'Nostalgique', 'Festif', 'Mélancolique', 'Énergique', 'Céleste'];
export const eras = ['Moderne Hi-Fi', 'Analogique 80s', 'Lo-Fi Crackle', 'Acoustique Intimiste'];
export const vocals = ['Voix féminine pop', 'Voix masculine soul', 'Duo harmonisateur', 'Auto-Tune trap'];

export function buildPrompt({ story, genre, mood, era, vocal, energy }) {
  return [
    `Concept: ${story.trim() || 'Récit émotionnel original'}`,
    `Genre: ${genre}`,
    `Mood: ${mood}`,
    `Texture: ${era}`,
    `Voix: ${vocal}`,
    `Énergie: ${energy}/100`,
    'Structure: intro, couplet, refrain, bridge, mixage dynamique, mastering pro.',
  ].join(' | ');
}

export function createTrack({ story, genre, mood, era, vocal, energy }) {
  const safeStory = (story || '').trim() || 'Une histoire inspirante à transformer en morceau mémorable.';
  const trackId = `track_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const title = `${genre} ${mood} ${trackId.slice(-4)}`;
  const bpm = 108 + Math.round((Number(energy) / 100) * 28);
  const key = mood === 'Épique' ? 'A minor' : mood === 'Festif' ? 'G major' : mood === 'Nostalgique' ? 'D major' : 'C major';
  const intensity = Number(energy) / 100;

  return {
    status: 'success',
    trackId,
    createdAt: new Date().toISOString(),
    metadata: {
      title,
      bpm,
      key,
      duration: `${2 + Math.round(intensity * 1.7)}:3${Math.round(intensity * 6)}`,
      promptUsed: buildPrompt({ story: safeStory, genre, mood, era, vocal, energy }),
      masteringSpecs: '-14 LUFS, 24-bit 44.1kHz WAV',
      vibe: `${mood} • ${genre} • ${era}`,
    },
    media: {
      previewMp3: '',
      masteredWav: '',
      stemsZip: '',
    },
    waveform: Array.from({ length: 26 }, (_, index) => {
      const wave = Math.max(18, Math.min(100, 24 + index * 3 + intensity * 38));
      return Math.round(wave * (index % 2 === 0 ? 0.9 : 1.1));
    }),
  };
}

function getKeyFrequency(mood) {
  const map = {
    Épique: 220,
    Festif: 246.94,
    Nostalgique: 196,
    Mélancolique: 174.61,
    Énergique: 261.63,
    Céleste: 293.66,
  };

  return map[mood] || 220;
}

function addKick(offlineContext, startTime, duration, gainValue = 0.8, pitchDrop = 80) {
  const osc = offlineContext.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(pitchDrop, startTime);
  osc.frequency.exponentialRampToValueAtTime(28, startTime + duration);

  const gain = offlineContext.createGain();
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(gainValue, startTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  osc.connect(gain).connect(offlineContext.destination);
  osc.start(startTime);
  osc.stop(startTime + duration);
}

function addTone(offlineContext, startTime, duration, frequency, type = 'triangle', gainValue = 0.18) {
  const osc = offlineContext.createOscillator();
  const gain = offlineContext.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, startTime);

  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(gainValue, startTime + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  osc.connect(gain).connect(offlineContext.destination);
  osc.start(startTime);
  osc.stop(startTime + duration);
}

function addNoiseHat(offlineContext, startTime, duration = 0.08) {
  const bufferLength = Math.max(1, Math.floor(offlineContext.sampleRate * duration));
  const noiseBuffer = offlineContext.createBuffer(1, bufferLength, offlineContext.sampleRate);
  const channel = noiseBuffer.getChannelData(0);

  for (let i = 0; i < channel.length; i += 1) {
    channel[i] = (Math.random() * 2 - 1) * 0.7;
  }

  const source = offlineContext.createBufferSource();
  source.buffer = noiseBuffer;

  const filter = offlineContext.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 6000;

  const gain = offlineContext.createGain();
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(0.12, startTime + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  source.connect(filter).connect(gain).connect(offlineContext.destination);
  source.start(startTime);
  source.stop(startTime + duration);
}

function getScale(baseFrequency) {
  const intervals = [0, 3, 5, 7, 10, 12];
  return intervals.map((step) => baseFrequency * Math.pow(2, step / 12));
}

function audioBufferToWavBlob(audioBuffer) {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const format = 1;
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const dataLength = audioBuffer.length * blockAlign;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);

  const writeString = (offset, string) => {
    for (let i = 0; i < string.length; i += 1) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(36, 'data');
  view.setUint32(40, dataLength, true);

  let offset = 44;
  const channelData = [];
  for (let channel = 0; channel < numChannels; channel += 1) {
    channelData.push(audioBuffer.getChannelData(channel));
  }

  for (let sample = 0; sample < audioBuffer.length; sample += 1) {
    for (let channel = 0; channel < numChannels; channel += 1) {
      const value = Math.max(-1, Math.min(1, channelData[channel][sample]));
      view.setInt16(offset, value < 0 ? value * 0x8000 : value * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

export async function generateAudioTrack({ genre, mood, era, vocal, energy, story }) {
  const sampleRate = 44100;
  const durationSeconds = 8;
  const offlineContext = new OfflineAudioContext(2, sampleRate * durationSeconds, sampleRate);
  const baseFrequency = getKeyFrequency(mood);
  const scale = getScale(baseFrequency);
  const intensity = Number(energy) / 100;

  const padGain = offlineContext.createGain();
  padGain.gain.value = 0.16 + intensity * 0.12;
  padGain.connect(offlineContext.destination);

  scale.forEach((frequency, index) => {
    const offset = index * 0.8;
    addTone(offlineContext, offset, 1.6, frequency / 2, 'sine', 0.07);
    addTone(offlineContext, offset + 0.3, 1.8, frequency, 'triangle', 0.05);
  });

  for (let beat = 0; beat < durationSeconds * 2; beat += 1) {
    const start = beat * 0.5;
    const note = scale[beat % scale.length];
    addTone(offlineContext, start, 0.28, note * (beat % 4 === 0 ? 1 : 0.75), 'sawtooth', 0.06 + intensity * 0.06);

    if (beat % 2 === 0) {
      addKick(offlineContext, start, 0.22, 0.55 + intensity * 0.25, 88 - intensity * 20);
    }

    if (beat % 2 === 1) {
      addNoiseHat(offlineContext, start + 0.02, 0.08);
    }
  }

  const rendered = await offlineContext.startRendering();
  const waveform = Array.from({ length: 26 }, (_, index) => {
    const buffer = rendered.getChannelData(0);
    const start = Math.floor((index / 26) * buffer.length);
    const end = Math.floor(((index + 1) / 26) * buffer.length);
    let peak = 0;
    for (let i = start; i < end; i += 1) {
      const value = Math.abs(buffer[i]);
      if (value > peak) peak = value;
    }
    return Math.round(Math.min(100, peak * 140));
  });

  const blob = audioBufferToWavBlob(rendered);
  const audioUrl = await blobToBase64(blob);

  return {
    waveform,
    media: {
      previewMp3: audioUrl,
      masteredWav: audioUrl,
      stemsZip: audioUrl,
    },
    metadata: {
      title: `${genre} ${mood} Generator`,
      bpm: 96 + Math.round(intensity * 40),
      key: `${mood} • ${era}`,
      duration: `${durationSeconds.toFixed(1)}s`,
      promptUsed: buildPrompt({ story: story || 'Création sonore générée en temps réel', genre, mood, era, vocal, energy }),
      masteringSpecs: 'Generated live from WebAudio • 44.1kHz PCM',
      vibe: `${story ? story.slice(0, 70) : 'Studio live'}...`,
    },
  };
}

export function buildExampleBrief() {
  return {
    story: "Une nuit à Lomé sous la pluie, pleine de souvenirs et d'espoir.",
    genre: 'Afrobeats',
    mood: 'Épique',
    era: 'Moderne Hi-Fi',
    vocal: 'Voix féminine pop',
    energy: 78,
  };
}

export function synthesizeVoice(text, voiceType) {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      resolve(null);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = voiceType.includes('féminine') ? 1.3 : 0.9;
    utterance.volume = 0.8;
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      const isFemale = voiceType.includes('féminine');
      const voice = voices.find((v) => (isFemale ? v.name.includes('Female') || v.name.includes('female') : true)) || voices[0];
      utterance.voice = voice;
    }
    utterance.onend = () => resolve(true);
    window.speechSynthesis.speak(utterance);
  });
}

export async function startVoiceRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mediaRecorder = new MediaRecorder(stream);
  const audioChunks = [];
  mediaRecorder.ondataavailable = (event) => {
    audioChunks.push(event.data);
  };
  mediaRecorder.onstop = () => {
    stream.getTracks().forEach((track) => track.stop());
  };
  mediaRecorder.start();
  return {
    mediaRecorder,
    audioChunks,
    stream,
    getBlob: () => new Blob(audioChunks, { type: 'audio/webm' }),
  };
}

async function blobToBase64(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result);
    };
    reader.readAsDataURL(blob);
  });
}
