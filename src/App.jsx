import { useMemo, useState } from 'react';

const genres = [
  'Afrobeats',
  'Pop/Variété',
  'Hip-Hop/Trap',
  'EDM/Electro',
  'Synthwave',
  'Lo-Fi',
  'Rock/Metal',
  'Gospel',
];

const moods = ['Épique', 'Nostalgique', 'Festif', 'Mélancolique', 'Énergique', 'Céleste'];
const eras = ['Moderne Hi-Fi', 'Analogique 80s', 'Lo-Fi Crackle', 'Acoustique Intimiste'];
const vocals = ['Voix féminine pop', 'Voix masculine soul', 'Duo harmonisateur', 'Auto-Tune trap'];

function buildPrompt({ story, genre, mood, era, vocal, energy }) {
  return [
    `Concept: ${story}`,
    `Genre: ${genre}`,
    `Mood: ${mood}`,
    `Texture: ${era}`,
    `Voix: ${vocal}`,
    `Énergie: ${energy}/100`,
    'Structure: couplet, refrain, bridge, mixage dynamique, mastering pro.',
  ].join(' | ');
}

function createTrack({ story, genre, mood, era, vocal, energy }) {
  const trackId = `track_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const title = `${genre} ${mood} ${trackId.slice(-4)}`;

  return {
    status: 'success',
    trackId,
    metadata: {
      title,
      bpm: 118 + Math.round((energy / 100) * 18),
      key: mood === 'Épique' ? 'A minor' : 'C major',
      promptUsed: buildPrompt({ story, genre, mood, era, vocal, energy }),
      masteringSpecs: '-14 LUFS, 24-bit 44.1kHz WAV',
    },
    media: {
      previewMp3: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      masteredWav: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      stemsZip: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    },
  };
}

export default function App() {
  const [story, setStory] = useState('Une nuit à Lomé sous la pluie, pleine de souvenirs et d\'espoir.');
  const [genre, setGenre] = useState('Afrobeats');
  const [mood, setMood] = useState('Épique');
  const [era, setEra] = useState('Moderne Hi-Fi');
  const [vocal, setVocal] = useState('Voix féminine pop');
  const [energy, setEnergy] = useState(78);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const quickStats = useMemo(
    () => [
      { label: 'Styles', value: '14+' },
      { label: 'Mastering', value: '-14 LUFS' },
      { label: 'Temps', value: '< 2 min' },
    ],
    [],
  );

  const handleGenerate = () => {
    if (!story.trim()) return;
    setLoading(true);
    setTimeout(() => {
      const data = createTrack({ story, genre, mood, era, vocal, energy });
      setResult(data);
      setLoading(false);
    }, 900);
  };

  return (
    <div className="app-shell">
      <div className="page-wrap">
        <header className="hero-card">
          <div className="hero-copy">
            <div className="chip">AI Sound Engineer Studio</div>
            <h1>Créez une chanson qui ressemble à un hit pro.</h1>
            <p>
              Racontez votre histoire, choisissez le style et laissez l’IA composer, mixer et
              masteriser en quelques minutes.
            </p>
          </div>

          <div className="stats-grid">
            {quickStats.map((stat) => (
              <div key={stat.label} className="stat-box">
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </header>

        <main className="studio-grid">
          <section className="panel form-panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Briefing</p>
                <h2>Studio de création</h2>
              </div>
              <button
                type="button"
                className="ghost-button"
                onClick={() =>
                  setStory("Une nuit à Lomé sous la pluie, pleine de souvenirs et d'espoir.")
                }
              >
                Exemple
              </button>
            </div>

            <div className="field-stack">
              <label className="field">
                <span>1. Votre histoire</span>
                <textarea
                  value={story}
                  onChange={(e) => setStory(e.target.value)}
                  rows={5}
                  placeholder="Ex : Une soirée inoubliable sous les étoiles à Lomé..."
                />
              </label>

              <div className="field">
                <span>2. Style musical</span>
                <div className="chip-grid">
                  {genres.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={item === genre ? 'chip active' : 'chip'}
                      onClick={() => setGenre(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="split-grid">
                <label className="field">
                  <span>3. Émotion</span>
                  <select value={mood} onChange={(e) => setMood(e.target.value)}>
                    {moods.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field">
                  <span>4. Signature sonore</span>
                  <select value={era} onChange={(e) => setEra(e.target.value)}>
                    {eras.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="split-grid">
                <label className="field">
                  <span>5. Voix</span>
                  <select value={vocal} onChange={(e) => setVocal(e.target.value)}>
                    {vocals.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field">
                  <span>6. Énergie</span>
                  <div className="range-box">
                    <div className="range-header">
                      <span>Calme</span>
                      <strong>{energy}/100</strong>
                      <span>Forte</span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="100"
                      value={energy}
                      onChange={(e) => setEnergy(Number(e.target.value))}
                    />
                  </div>
                </label>
              </div>

              <button
                type="button"
                className="primary-button"
                disabled={loading || !story.trim()}
                onClick={handleGenerate}
              >
                {loading ? 'Génération en cours...' : 'Créer la piste'}
              </button>
            </div>
          </section>

          <aside className="panel output-panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Sortie</p>
                <h2>Piste générée</h2>
              </div>
              {result?.status === 'success' ? (
                <span className="status-badge">Ready</span>
              ) : null}
            </div>

            {result ? (
              <div className="output-stack">
                <div className="wave-card">
                  <div className="wave-head">
                    <span>Mastered</span>
                    <span>{result.metadata.bpm} BPM</span>
                  </div>
                  <div className="wave-main">
                    <div className="play-icon">▶</div>
                    <div>
                      <div className="track-title">{result.metadata.title}</div>
                      <div className="track-sub">{result.metadata.key}</div>
                    </div>
                  </div>
                  <div className="progress-bar">
                    <span />
                  </div>
                  <div className="wave-labels">
                    <span>Intro</span>
                    <span>Refrain</span>
                    <span>Bridge</span>
                  </div>
                </div>

                <div className="meta-list">
                  <div>
                    <span>Mastering</span>
                    <strong>{result.metadata.masteringSpecs}</strong>
                  </div>
                  <div>
                    <span>Voix</span>
                    <strong>{vocal}</strong>
                  </div>
                  <div>
                    <span>Identifiant</span>
                    <strong>{result.trackId}</strong>
                  </div>
                </div>

                <div className="actions-grid">
                  <a href={result.media.previewMp3} target="_blank" rel="noreferrer">
                    Preview MP3
                  </a>
                  <a href={result.media.masteredWav} target="_blank" rel="noreferrer">
                    WAV Master
                  </a>
                  <a href={result.media.stemsZip} target="_blank" rel="noreferrer">
                    Stems ZIP
                  </a>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                Votre piste apparaîtra ici avec une pré-écoute, le mastering et les exports prêts à
                partager.
              </div>
            )}
          </aside>
        </main>
      </div>
    </div>
  );
}
