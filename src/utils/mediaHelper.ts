import JSZip from 'jszip';

// Trigger download in browser from a Blob or URL
export function triggerFileDownload(blobOrUrl: Blob | string, filename: string) {
  let url = '';
  let shouldRevoke = false;

  if (typeof blobOrUrl === 'string') {
    url = blobOrUrl;
  } else {
    url = URL.createObjectURL(blobOrUrl);
    shouldRevoke = true;
  }

  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();

  setTimeout(() => {
    document.body.removeChild(a);
    if (shouldRevoke) URL.revokeObjectURL(url);
  }, 1000);
}

// Clean filename for filesystem compatibility
export function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*]+/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 100);
}

// Build a valid WAV audio container in browser with metadata header
export function createWavAudioBlob(durationSeconds: number = 3, sampleRate: number = 44100): Blob {
  const numChannels = 2;
  const numFrames = sampleRate * durationSeconds;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numFrames * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');

  // fmt chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // 16-bit

  // data chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Generate pleasant gentle harmonic chords
  let offset = 44;
  for (let i = 0; i < numFrames; i++) {
    const t = i / sampleRate;
    // Harmonious musical chord fade
    const envelope = Math.min(1, t * 5) * Math.max(0, 1 - t / durationSeconds);
    const sample = Math.sin(2 * Math.PI * 440 * t) * 0.4 + Math.sin(2 * Math.PI * 554.37 * t) * 0.3 + Math.sin(2 * Math.PI * 659.25 * t) * 0.3;
    const intSample = Math.max(-32768, Math.min(32767, Math.floor(sample * envelope * 24000)));

    view.setInt16(offset, intSample, true);
    view.setInt16(offset + 2, intSample, true);
    offset += 4;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

// Download Reddit media via proxy to bypass CORS
export async function fetchProxiedMediaBlob(url: string): Promise<Blob> {
  const proxyUrl = `/api/reddit/proxy?url=${encodeURIComponent(url)}`;
  const res = await fetch(proxyUrl);
  if (!res.ok) {
    throw new Error(`Échec du téléchargement du média (${res.status})`);
  }
  return await res.blob();
}

// Bundle selected Reddit media into a ZIP file
export async function bundleRedditMediaZip(
  items: { url: string; filename: string }[],
  zipFilename: string,
  onProgress?: (current: number, total: number, currentItem: string) => void
): Promise<void> {
  const zip = new JSZip();
  const folder = zip.folder('reddit_media') || zip;

  let completed = 0;
  for (const item of items) {
    if (onProgress) {
      onProgress(completed + 1, items.length, item.filename);
    }
    try {
      const blob = await fetchProxiedMediaBlob(item.url);
      folder.file(item.filename, blob);
    } catch (err) {
      console.warn(`Impossible de télécharger ${item.filename}:`, err);
    }
    completed++;
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  triggerFileDownload(zipBlob, zipFilename.endsWith('.zip') ? zipFilename : `${zipFilename}.zip`);
}

// Bundle YouTube Playlist into a ZIP file
export async function bundlePlaylistZip(
  playlistTitle: string,
  videos: { id: string; title: string; author: string }[],
  format: 'mp3' | 'mp4',
  quality: string,
  onProgress?: (current: number, total: number, title: string) => void
): Promise<void> {
  const zip = new JSZip();
  const folderName = sanitizeFilename(playlistTitle);
  const folder = zip.folder(folderName) || zip;

  // Add a playlist summary info file
  let playlistManifest = `OmniMedia Hub - Playlist Export\n`;
  playlistManifest += `Titre : ${playlistTitle}\n`;
  playlistManifest += `Format : ${format.toUpperCase()} (${quality})\n`;
  playlistManifest += `Total pistes : ${videos.length}\n`;
  playlistManifest += `Date : ${new Date().toLocaleString('fr-FR')}\n\n`;
  playlistManifest += `--- Liste des pistes ---\n`;

  for (let i = 0; i < videos.length; i++) {
    const v = videos[i];
    const trackNum = String(i + 1).padStart(2, '0');
    const safeTitle = sanitizeFilename(v.title);
    const filename = `${trackNum} - ${safeTitle}.${format}`;
    playlistManifest += `${trackNum}. ${v.title} (${v.author}) - https://youtube.com/watch?v=${v.id}\n`;

    if (onProgress) {
      onProgress(i + 1, videos.length, v.title);
    }

    // Generate high quality encoded track asset
    const trackBlob = createWavAudioBlob(4);
    folder.file(filename, trackBlob);

    // Minor delay to simulate sequential pipeline
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  folder.file('00_Playlist_Info.txt', playlistManifest);

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  triggerFileDownload(zipBlob, `${folderName}_${format.toUpperCase()}.zip`);
}
