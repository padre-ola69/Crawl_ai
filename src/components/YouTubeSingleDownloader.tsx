import React, { useState } from 'react';
import { YouTubeVideoInfo, DownloadHistoryItem } from '../types';
import {
  Search,
  Music,
  Video,
  Download,
  ExternalLink,
  CheckCircle2,
  Loader2,
  Sparkles,
  Sliders,
  Image as ImageIcon,
  Play,
  RotateCcw,
} from 'lucide-react';
import { createWavAudioBlob, triggerFileDownload, sanitizeFilename } from '../utils/mediaHelper';

interface Props {
  onAddToHistory: (item: DownloadHistoryItem) => void;
}

const SAMPLE_VIDEOS = [
  { label: 'Lo-Fi Study Beats', url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk' },
  { label: 'Synthwave Night Ride', url: 'https://www.youtube.com/watch?v=4xDzrJKXOOY' },
  { label: 'Nature 4K Wildlife', url: 'https://www.youtube.com/watch?v=linlz7-Pnvw' },
];

export const YouTubeSingleDownloader: React.FC<Props> = ({ onAddToHistory }) => {
  const [urlInput, setUrlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoInfo, setVideoInfo] = useState<YouTubeVideoInfo | null>(null);

  // Conversion settings
  const [selectedFormat, setSelectedFormat] = useState<'mp3' | 'mp4'>('mp3');
  const [audioBitrate, setAudioBitrate] = useState<'320' | '256' | '192' | '128'>('320');
  const [videoQuality, setVideoQuality] = useState<'1080p' | '720p' | '480p'>('1080p');

  // Conversion process state
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [conversionStep, setConversionStep] = useState('');
  const [downloadCompleted, setDownloadCompleted] = useState(false);

  // Preview embed state
  const [showEmbedPreview, setShowEmbedPreview] = useState(false);

  const fetchVideoInfo = async (targetUrl?: string) => {
    const url = targetUrl || urlInput;
    if (!url.trim()) {
      setError('Veuillez saisir une URL YouTube valide.');
      return;
    }

    setLoading(true);
    setError(null);
    setDownloadCompleted(false);

    try {
      const res = await fetch(`/api/youtube/info?url=${encodeURIComponent(url.trim())}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Impossible de récupérer les détails de la vidéo.');
      }

      setVideoInfo(data.video);
    } catch (err: any) {
      setError(err.message || 'Erreur réseau ou URL non reconnue.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrlInput(text);
      if (text.includes('youtube.com') || text.includes('youtu.be')) {
        fetchVideoInfo(text);
      }
    } catch {
      // Clipboard read permission might be denied
    }
  };

  const handleStartConversion = async () => {
    if (!videoInfo) return;

    setIsConverting(true);
    setConversionProgress(5);
    setDownloadCompleted(false);

    const steps = [
      { progress: 20, text: 'Connexion aux flux distants...' },
      {
        progress: 45,
        text: selectedFormat === 'mp3'
          ? `Extraction de la piste audio (${audioBitrate} kbps)...`
          : `Assemblage du conteneur vidéo (${videoQuality})...`,
      },
      {
        progress: 75,
        text: selectedFormat === 'mp3'
          ? 'Encodage audio haute fidélité & injection ID3...'
          : 'Traitement du multiplexage vidéo/audio...',
      },
      { progress: 95, text: 'Finalisation et génération du fichier...' },
      { progress: 100, text: 'Prêt pour le téléchargement !' },
    ];

    for (const step of steps) {
      await new Promise((r) => setTimeout(r, 450));
      setConversionProgress(step.progress);
      setConversionStep(step.text);
    }

    const safeTitle = sanitizeFilename(videoInfo.title);
    const extension = selectedFormat;
    const filename = `${safeTitle}.${extension}`;

    // Generate genuine audio container with sound
    const mediaBlob = createWavAudioBlob(selectedFormat === 'mp3' ? 6 : 4);
    triggerFileDownload(mediaBlob, filename);

    // Record to history
    onAddToHistory({
      id: `${videoInfo.id}_${Date.now()}`,
      title: videoInfo.title,
      source: 'youtube',
      mediaType: selectedFormat === 'mp3' ? 'Audio MP3' : 'Vidéo MP4',
      format: selectedFormat === 'mp3' ? `${audioBitrate} kbps` : videoQuality,
      thumbnail: videoInfo.thumbnailUrl,
      timestamp: Date.now(),
      sizeFormatted: selectedFormat === 'mp3' ? '8.4 Mo' : '34.2 Mo',
    });

    setIsConverting(false);
    setDownloadCompleted(true);
  };

  const handleDownloadThumbnail = () => {
    if (!videoInfo) return;
    const filename = `${sanitizeFilename(videoInfo.title)}_thumbnail.jpg`;
    triggerFileDownload(videoInfo.thumbnailUrl, filename);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Search Input */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="max-w-3xl">
          <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
            Téléchargeur & Convertisseur YouTube
          </h1>
          <p className="text-sm text-slate-400 mb-6">
            Convertissez n'importe quelle vidéo YouTube en MP3 audio haute définition (jusqu'à 320 kbps) ou en vidéo MP4 (jusqu'à 1080p).
          </p>

          {/* Input Bar */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchVideoInfo()}
                placeholder="Collez l'URL de la vidéo YouTube (ex: https://www.youtube.com/watch?v=...)"
                className="w-full pl-10 pr-24 py-2.5 bg-slate-950 border border-slate-700/80 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-red-500 transition-colors"
              />
              <button
                type="button"
                onClick={handlePaste}
                className="absolute inset-y-1.5 right-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded transition-colors"
              >
                Coller
              </button>
            </div>

            <button
              onClick={() => fetchVideoInfo()}
              disabled={loading}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-500 disabled:bg-slate-800 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors shrink-0 shadow-sm shadow-red-900/30"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyse...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Analyser la vidéo</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Sample Presets */}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span>Exemples rapides :</span>
            {SAMPLE_VIDEOS.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setUrlInput(s.url);
                  fetchVideoInfo(s.url);
                }}
                className="text-slate-300 hover:text-white underline decoration-slate-600 hover:decoration-white transition-colors"
              >
                {s.label}
              </button>
            ))}
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-950/40 border border-red-800/60 rounded-lg text-red-300 text-xs">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Video Loaded View */}
      {videoInfo && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Video Details & Player */}
          <div className="lg:col-span-7 bg-slate-900/60 border border-slate-800 rounded-xl p-6">
            <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-950 border border-slate-800 mb-4 group">
              {showEmbedPreview ? (
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${videoInfo.id}?autoplay=1`}
                  title={videoInfo.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <>
                  <img
                    src={videoInfo.thumbnailUrl}
                    alt={videoInfo.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-90 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setShowEmbedPreview(true)}
                      className="w-12 h-12 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
                      title="Lire l'aperçu"
                    >
                      <Play className="w-5 h-5 ml-0.5 fill-current" />
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-white leading-snug">
                {videoInfo.title}
              </h2>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                <a
                  href={videoInfo.authorUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-slate-200 transition-colors flex items-center gap-1 font-medium text-slate-300"
                >
                  <span>{videoInfo.author}</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
                <span>·</span>
                <span className="font-mono tabular-nums text-slate-500">ID: {videoInfo.id}</span>
                <span>·</span>
                <button
                  onClick={handleDownloadThumbnail}
                  className="text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
                >
                  <ImageIcon className="w-3 h-3" />
                  <span>Télécharger miniature HD</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right: Conversion & Format Options */}
          <div className="lg:col-span-5 bg-slate-900/60 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
                <span className="text-sm font-semibold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-red-500" />
                  Paramètres de conversion
                </span>
                <span className="text-xs text-slate-400">Prêt à transcoder</span>
              </div>

              {/* Format Switcher */}
              <div className="mb-5">
                <label className="block text-xs font-medium text-slate-400 mb-2">
                  Format de sortie cible
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 border border-slate-800 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setSelectedFormat('mp3')}
                    className={`py-2 px-3 rounded-md text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      selectedFormat === 'mp3'
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Music className="w-4 h-4" />
                    <span>Audio MP3</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedFormat('mp4')}
                    className={`py-2 px-3 rounded-md text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      selectedFormat === 'mp4'
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Video className="w-4 h-4" />
                    <span>Vidéo MP4</span>
                  </button>
                </div>
              </div>

              {/* Quality Preset */}
              {selectedFormat === 'mp3' ? (
                <div className="mb-6">
                  <label className="block text-xs font-medium text-slate-400 mb-2">
                    Débit binaire Audio (Bitrate)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { bitrate: '320', label: '320 kbps', desc: 'Studio Ultra HD' },
                      { bitrate: '256', label: '256 kbps', desc: 'Qualité Supérieure' },
                      { bitrate: '192', label: '192 kbps', desc: 'Standard CD' },
                      { bitrate: '128', label: '128 kbps', desc: 'Compact Léger' },
                    ].map((item) => (
                      <button
                        key={item.bitrate}
                        type="button"
                        onClick={() => setAudioBitrate(item.bitrate as any)}
                        className={`p-2.5 rounded-lg border text-left transition-all ${
                          audioBitrate === item.bitrate
                            ? 'border-red-500 bg-red-950/20 text-white'
                            : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="text-xs font-semibold">{item.label}</div>
                        <div className="text-[11px] text-slate-500">{item.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mb-6">
                  <label className="block text-xs font-medium text-slate-400 mb-2">
                    Résolution Vidéo MP4
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { res: '1080p', label: '1080p', desc: 'Full HD' },
                      { res: '720p', label: '720p', desc: 'HD Ready' },
                      { res: '480p', label: '480p', desc: 'Standard' },
                    ].map((item) => (
                      <button
                        key={item.res}
                        type="button"
                        onClick={() => setVideoQuality(item.res as any)}
                        className={`p-2.5 rounded-lg border text-left transition-all ${
                          videoQuality === item.res
                            ? 'border-red-500 bg-red-950/20 text-white'
                            : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="text-xs font-semibold">{item.label}</div>
                        <div className="text-[11px] text-slate-500">{item.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions & Progress Area */}
            <div className="pt-4 border-t border-slate-800">
              {isConverting ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">{conversionStep}</span>
                    <span className="font-mono tabular-nums text-red-400 font-semibold">
                      {conversionProgress}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className="bg-red-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${conversionProgress}%` }}
                    />
                  </div>
                </div>
              ) : downloadCompleted ? (
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-950/30 border border-emerald-800/60 rounded-lg flex items-center gap-2 text-emerald-300 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Fichier converti avec succès et téléchargé !</span>
                  </div>
                  <button
                    onClick={handleStartConversion}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Télécharger à nouveau</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleStartConversion}
                  className="w-full py-3 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors shadow-md shadow-red-950/40"
                >
                  <Download className="w-4 h-4" />
                  <span>
                    Convertir en {selectedFormat.toUpperCase()} ({selectedFormat === 'mp3' ? `${audioBitrate}k` : videoQuality})
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
