import { useEffect, useMemo, useState } from 'react';
import {
  buildExampleBrief,
  buildPrompt,
  createTrack,
  eras,
  generateAudioTrack,
  genres,
  moods,
  startVoiceRecording,
  synthesizeVoice,
  vocals,
} from './studio';

const STORAGE_KEY = 'ai-music-studio-projects';

function readStoredProjects() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const example = buildExampleBrief();
      return [
        {
          id: 'starter-project',
          title: 'Projet starter',
          story: example.story,
          genre: example.genre,
          mood: example.mood,
          era: example.era,
          vocal: example.vocal,
          energy: example.energy,
          savedAt: new Date().toISOString(),
        },
      ];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Unable to read saved projects', error);
    return [];
  }
}

export default function App() {
  const example = buildExampleBrief();
  const [story, setStory] = useState(example.story);
  const [genre, setGenre] = useState(example.genre);
  const [mood, setMood] = useState(example.mood);
  const [era, setEra] = useState(example.era);
  const [vocal, setVocal] = useState(example.vocal);
  const [energy, setEnergy] = useState(example.energy);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [projects, setProjects] = useState(() => readStoredProjects());
  const [activeProjectId, setActiveProjectId] = useState('starter-project');
  const [isRecording, setIsRecording] = useState(false);
  const [recorder, setRecorder] = useState(null);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }, [projects]);

  const quickStats = useMemo(
    () => [
      { label: 'Styles', value: '14+' },
      { label: 'Mastering', value: '-14 LUFS' },
      { label: 'Temps', value: '< 2 min' },
    ],
    [],
  );

  const applyExample = () => {
    const template = buildExampleBrief();
    setStory(template.story);
    setGenre(template.genre);
    setMood(template.mood);
    setEra(template.era);
    setVocal(template.vocal);
    setEnergy(template.energy);
    setError('');
  };

  const saveCurrentProject = () => {
    const trimmedStory = story.trim();
    const title = trimmedStory
      ? trimmedStory.split(/\s+/).slice(0, 4).join(' ') || 'Nouveau projet'
      : 'Nouveau projet';

    const entry = {
      id: activeProjectId || `project-${Date.now()}`,
      title: title.length > 30 ? `${title.slice(0, 27)}...` : title,
      story: trimmedStory || example.story,
      genre,
      mood,
      era,
      vocal,
      energy,
      savedAt: new Date().toISOString(),
    };

    setProjects((current) => {
      const exists = current.some((project) => project.id === entry.id);
      if (exists) {
        return current.map((project) => (project.id === entry.id ? entry : project));
      }
      return [entry, ...current];
    });

    setActiveProjectId(entry.id);
  };

  const loadProject = (project) => {
    setStory(project.story);
    setGenre(project.genre);
    setMood(project.mood);
    setEra(project.era);
    setVocal(project.vocal);
    setEnergy(project.energy);
    setActiveProjectId(project.id);
    setResult(null);
    setError('');
  };

  const deleteProject = (projectId) => {
    setProjects((current) => current.filter((project) => project.id !== projectId));
    if (activeProjectId === projectId) {
      setActiveProjectId(null);
    }
  };

  const startRecording = async () => {
    try {
      const rec = await startVoiceRecording();
      setRecorder(rec);
      setIsRecording(true);
    } catch (err) {
      setError('Impossible d\'accéder au micro.');
      console.error(err);
    }
  };

  const stopRecording = () => {
    if (recorder) {
      recorder.mediaRecorder.stop();
      setIsRecording(false);
      setTimeout(() => {
        const blob = recorder.getBlob();
        if (blob) {
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audio.onloadedmetadata = () => {
            setStory(`[Enregistrement vocal] ${new Date().toLocaleTimeString()}`);
          };
          audio.play();
        }
      }, 300);
    }
  };

  const downloadAudio = () => {
    if (!result?.media?.previewMp3) return;
    const anchor = document.createElement('a');
    anchor.href = result.media.previewMp3;
    anchor.download = `${(result.metadata.title || 'ai-music-track').toLowerCase().replace(/\s+/g, '-')}.wav`;
    anchor.click();
  };

  const downloadProjectJson = () => {
    const payload = {
      title: result?.metadata?.title || 'ai-music-studio-project',
      createdAt: new Date().toISOString(),
      story,
      genre,
      mood,
      era,
      vocal,
      energy,
      prompt: buildPrompt({ story, genre, mood, era, vocal, energy }),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${payload.title.toLowerCase().replace(/\s+/g, '-')}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleGenerate = async () => {
    const trimmedStory = story.trim();
    if (!trimmedStory) {
      setError('Racontez un peu plus votre histoire pour générer une piste.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const generatedAudio = await generateAudioTrack({
        story: trimmedStory,
        genre,
        mood,
        era,
        vocal,
        energy,
      });

      const data = createTrack({ story: trimmedStory, genre, mood, era, vocal, energy });
      const finalData = {
        ...data,
        media: generatedAudio.media,
        metadata: {
          ...data.metadata,
          ...generatedAudio.metadata,
        },
        waveform: generatedAudio.waveform,
      };

      setResult(finalData);
    } catch (errorMessage) {
      setError('La génération audio a échoué. Réessayez avec un autre brief.');
      console.error(errorMessage);
    } finally {
      setLoading(false);
    }
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
              <button type="button" className="ghost-button" onClick={applyExample}>
                Exemple
              </button>
            </div>

            <div className="field-stack">
              <div className="field">
                <span>1. Votre histoire</span>
                <div className="voice-input-group">
                  <textarea
                    value={story}
                    onChange={(e) => setStory(e.target.value)}
                    rows={5}
                    placeholder="Ex : Une soirée inoubliable sous les étoiles à Lomé..."
                  />
                  <button
                    type="button"
                    className={isRecording ? 'voice-button recording' : 'voice-button'}
                    onClick={isRecording ? stopRecording : startRecording}
                  >
                    {isRecording ? '⏹ Arrêter' : '🎤 Enregistrer'}
                  </button>
                </div>
              </div>

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

              {error ? <div className="error-box">{error}</div> : null}

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
              {result?.status === 'success' ? <span className="status-badge">Ready</span> : null}
            </div>

<div className="project-manager">
              <div className="section-heading compact-heading">
                <div>
                  <p className="eyebrow">Projets</p>
                  <h3>Mes briefs</h3>
                </div>
                <button type="button" className="ghost-button" onClick={saveCurrentProject}>
                  Enregistrer
                </button>
              </div>

              <div className="project-list">
                {projects.length === 0 ? (
                  <div className="empty-projects">Aucun projet enregistré.</div>
                ) : (
                  projects.map((project) => (
                    <div key={project.id} className={project.id === activeProjectId ? 'project-row active' : 'project-row'}>
                      <button type="button" className="project-load" onClick={() => loadProject(project)}>
                        <strong>{project.title}</strong>
                        <span>{project.genre} • {project.mood}</span>
                      </button>
                      <button type="button" className="project-delete" onClick={() => deleteProject(project.id)} aria-label="Supprimer le projet">
                        ×
                      </button>
                    </div>
                  ))
                )}
              </div>
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

                  <audio controls src={result.media.previewMp3} className="audio-player" />

                  <div className="wave-visual" aria-label="Visualisation du signal audio">
                    {result.waveform.map((height, index) => (
                      <span key={`${height}-${index}`} style={{ height: `${height}%` }} />
                    ))}
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
                    <span>Durée</span>
                    <strong>{result.metadata.duration}</strong>
                  </div>
                  <div>
                    <span>Prompt</span>
                    <strong className="prompt-box">{buildPrompt({ story, genre, mood, era, vocal, energy })}</strong>
                  </div>
                </div>

                <div className="actions-grid">
                  <button type="button" onClick={downloadAudio}>Télécharger WAV</button>
                  <button type="button" onClick={downloadProjectJson}>Exporter JSON</button>
                  <a href={result.media.previewMp3} target="_blank" rel="noreferrer">
                    Preview MP3
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
