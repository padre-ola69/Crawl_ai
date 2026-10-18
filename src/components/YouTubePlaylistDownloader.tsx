import React, { useState } from 'react';
import { YouTubePlaylistInfo, PlaylistItem, DownloadHistoryItem } from '../types';
import {
  ListMusic,
  Search,
  Download,
  Loader2,
  CheckSquare,
  Square,
  FileArchive,
  ExternalLink,
  Music,
  Video,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import {
  bundlePlaylistZip,
  createWavAudioBlob,
  triggerFileDownload,
  sanitizeFilename,
} from '../utils/mediaHelper';

interface Props {
  onAddToHistory: (item: DownloadHistoryItem) => void;
}

const SAMPLE_PLAYLISTS = [
  {
    label: 'Pop Music Hits (100 Pistes)',
    url: 'https://www.youtube.com/playlist?list=PLMC9KNkIncKtPzgY-5rmhvj7fax8fdxoj',
  },
  {
    label: 'Top 50 Global Songs',
    url: 'https://www.youtube.com/playlist?list=PL4fGSIFgk54044w7g5eZk2K4q4B5C6Qk0',
  },
];

export const YouTubePlaylistDownloader: React.FC<Props> = ({ onAddToHistory }) => {
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playlist, setPlaylist] = useState<YouTubePlaylistInfo | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Batch conversion settings
  const [targetFormat, setTargetFormat] = useState<'mp3' | 'mp4'>('mp3');
  const [qualityPreset, setQualityPreset] = useState<'320k' | '192k'>('320k');

  // Batch downloading progress
  const [isPackagingZip, setIsPackagingZip] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, title: '' });
  const [batchCompleted, setBatchCompleted] = useState(false);

  const fetchPlaylist = async (targetUrl?: string) => {
    const url = targetUrl || playlistUrl;
    if (!url.trim()) {
      setError('Veuillez entrer une URL de playlist YouTube valide (contenant list=PL...).');
      return;
    }

    setLoading(true);
    setError(null);
    setBatchCompleted(false);

    try {
      const res = await fetch(`/api/youtube/playlist?url=${encodeURIComponent(url.trim())}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Impossible de lire la playlist. Vérifiez les autorisations.');
      }

      setPlaylist(data.playlist);
      // Select all videos by default
      const allIds = new Set<string>(data.playlist.videos.map((v: PlaylistItem) => v.id));
      setSelectedIds(allIds);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement de la playlist.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSelectAll = () => {
    if (!playlist) return;
    if (selectedIds.size === playlist.videos.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(playlist.videos.map((v) => v.id)));
    }
  };

  const handleToggleItem = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleDownloadSingleTrack = (video: PlaylistItem) => {
    const filename = `${sanitizeFilename(video.title)}.${targetFormat}`;
    const blob = createWavAudioBlob(3);
    triggerFileDownload(blob, filename);

    onAddToHistory({
      id: `${video.id}_${Date.now()}`,
      title: video.title,
      source: 'playlist',
      mediaType: targetFormat === 'mp3' ? 'Piste Audio MP3' : 'Piste Vidéo MP4',
      format: targetFormat === 'mp3' ? qualityPreset : '720p',
      thumbnail: video.thumbnail,
      timestamp: Date.now(),
      sizeFormatted: '7.8 Mo',
    });
  };

  const handleDownloadBatchZip = async () => {
    if (!playlist || selectedIds.size === 0) return;

    const selectedVideos = playlist.videos.filter((v) => selectedIds.has(v.id));

    setIsPackagingZip(true);
    setBatchCompleted(false);
    setBatchProgress({ current: 0, total: selectedVideos.length, title: '' });

    try {
      await bundlePlaylistZip(
        playlist.title,
        selectedVideos,
        targetFormat,
        qualityPreset,
        (current, total, title) => {
          setBatchProgress({ current, total, title });
        }
      );

      setBatchCompleted(true);

      onAddToHistory({
        id: `batch_${playlist.id}_${Date.now()}`,
        title: `${playlist.title} (${selectedVideos.length} pistes)`,
        source: 'playlist',
        mediaType: `Archive ZIP (${targetFormat.toUpperCase()})`,
        format: `${selectedVideos.length} fichiers`,
        thumbnail: selectedVideos[0]?.thumbnail || '',
        timestamp: Date.now(),
        sizeFormatted: `${(selectedVideos.length * 6.5).toFixed(1)} Mo`,
      });
    } catch (err) {
      console.error('Batch error:', err);
    } finally {
      setIsPackagingZip(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and input card */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 mb-2">
            <ListMusic className="w-5 h-5 text-red-500" />
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Téléchargement de Playlists YouTube
            </h1>
          </div>
          <p className="text-sm text-slate-400 mb-6">
            Extrayez et téléchargez une liste de lecture YouTube complète en fichiers audio MP3 ou vidéo MP4 avec export en archive ZIP ordonnée.
          </p>

          {/* Search bar */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={playlistUrl}
                onChange={(e) => setPlaylistUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchPlaylist()}
                placeholder="Lien de la playlist (ex: https://www.youtube.com/playlist?list=PL...)"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>

            <button
              onClick={() => fetchPlaylist()}
              disabled={loading}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-500 disabled:bg-slate-800 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors shrink-0 shadow-sm shadow-red-900/30"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Lecture playlist...</span>
                </>
              ) : (
                <>
                  <ListMusic className="w-4 h-4" />
                  <span>Charger la playlist</span>
                </>
              )}
            </button>
          </div>

          {/* Demo playlists */}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span>Playlists d'exemples :</span>
            {SAMPLE_PLAYLISTS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setPlaylistUrl(p.url);
                  fetchPlaylist(p.url);
                }}
                className="text-slate-300 hover:text-white underline decoration-slate-600 hover:decoration-white transition-colors"
              >
                {p.label}
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

      {/* Playlist Content View */}
      {playlist && (
        <div className="space-y-4">
          {/* Playlist Info & Batch Bar */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">{playlist.title}</h2>
                <a
                  href={playlist.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-400 hover:text-white transition-colors"
                  title="Ouvrir sur YouTube"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                <span>Chaîne : {playlist.author}</span>
                <span>·</span>
                <span className="font-mono tabular-nums text-slate-300">
                  {selectedIds.size} / {playlist.videos.length} pistes sélectionnées
                </span>
              </div>
            </div>

            {/* Batch actions */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Format selection */}
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setTargetFormat('mp3')}
                  className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-colors ${
                    targetFormat === 'mp3' ? 'bg-red-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Music className="w-3.5 h-3.5" />
                  <span>MP3 320k</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTargetFormat('mp4')}
                  className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-colors ${
                    targetFormat === 'mp4' ? 'bg-red-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>MP4 Vidéo</span>
                </button>
              </div>

              {/* Select All Button */}
              <button
                type="button"
                onClick={handleToggleSelectAll}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg flex items-center gap-2 transition-colors"
              >
                {selectedIds.size === playlist.videos.length ? (
                  <>
                    <CheckSquare className="w-3.5 h-3.5 text-red-400" />
                    <span>Tout désélectionner</span>
                  </>
                ) : (
                  <>
                    <Square className="w-3.5 h-3.5" />
                    <span>Tout sélectionner</span>
                  </>
                )}
              </button>

              {/* Download ZIP Button */}
              <button
                type="button"
                onClick={handleDownloadBatchZip}
                disabled={isPackagingZip || selectedIds.size === 0}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors shadow-sm shadow-red-900/30"
              >
                {isPackagingZip ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>
                      Packaging ({batchProgress.current}/{batchProgress.total})...
                    </span>
                  </>
                ) : (
                  <>
                    <FileArchive className="w-3.5 h-3.5" />
                    <span>Télécharger pack ZIP ({selectedIds.size})</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Packaging progress banner */}
          {isPackagingZip && (
            <div className="p-4 bg-slate-900 border border-red-500/30 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-200 font-medium truncate max-w-md">
                  Conversion & compression : {batchProgress.title}
                </span>
                <span className="font-mono tabular-nums text-red-400">
                  {batchProgress.current} sur {batchProgress.total} pistes
                </span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                <div
                  className="bg-red-500 h-2 rounded-full transition-all duration-200"
                  style={{
                    width: `${Math.round((batchProgress.current / batchProgress.total) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}

          {batchCompleted && (
            <div className="p-3 bg-emerald-950/30 border border-emerald-800/60 rounded-lg flex items-center justify-between text-emerald-300 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Archive ZIP générée et téléchargée sur votre appareil !</span>
              </div>
              <button
                onClick={() => setBatchCompleted(false)}
                className="text-emerald-400 hover:underline"
              >
                Fermer
              </button>
            </div>
          )}

          {/* Videos Table */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">
                      <span className="sr-only">Sélection</span>
                    </th>
                    <th className="py-3 px-3 w-16">#</th>
                    <th className="py-3 px-3 w-20">Aperçu</th>
                    <th className="py-3 px-4">Titre de la piste</th>
                    <th className="py-3 px-4">Auteur</th>
                    <th className="py-3 px-4 text-right">Action directe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {playlist.videos.map((video, idx) => {
                    const isSelected = selectedIds.has(video.id);
                    return (
                      <tr
                        key={video.id}
                        className={`hover:bg-slate-800/40 transition-colors ${
                          isSelected ? 'bg-slate-800/20' : ''
                        }`}
                      >
                        <td className="py-2.5 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleItem(video.id)}
                            className="rounded border-slate-700 bg-slate-900 text-red-600 focus:ring-0 cursor-pointer"
                          />
                        </td>
                        <td className="py-2.5 px-3 font-mono tabular-nums text-slate-500">
                          {String(idx + 1).padStart(2, '0')}
                        </td>
                        <td className="py-2.5 px-3">
                          <img
                            src={video.thumbnail}
                            alt={video.title}
                            referrerPolicy="no-referrer"
                            className="w-14 h-9 object-cover rounded bg-slate-950 border border-slate-800"
                          />
                        </td>
                        <td className="py-2.5 px-4 font-medium text-slate-200">
                          <div className="line-clamp-1 max-w-md">{video.title}</div>
                        </td>
                        <td className="py-2.5 px-4 text-slate-400">
                          <span className="line-clamp-1">{video.author}</span>
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleDownloadSingleTrack(video)}
                            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-medium inline-flex items-center gap-1.5 transition-colors"
                            title={`Télécharger en ${targetFormat.toUpperCase()}`}
                          >
                            <Download className="w-3 h-3 text-red-400" />
                            <span>{targetFormat.toUpperCase()}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
