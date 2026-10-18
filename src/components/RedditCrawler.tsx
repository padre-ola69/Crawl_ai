import React, { useState, useEffect } from 'react';
import { RedditMediaItem, DownloadHistoryItem } from '../types';
import {
  Globe2,
  Search,
  Download,
  FileArchive,
  Copy,
  Check,
  CheckSquare,
  Square,
  Maximize2,
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  Film,
  Layers,
  Image as ImageIcon,
  Flame,
  Clock,
  Sparkles,
  Volume2,
} from 'lucide-react';
import {
  bundleRedditMediaZip,
  fetchProxiedMediaBlob,
  triggerFileDownload,
  sanitizeFilename,
} from '../utils/mediaHelper';

interface Props {
  onAddToHistory: (item: DownloadHistoryItem) => void;
}

const PRESET_SUBREDDITS = [
  { name: 'wallpapers', label: 'Wallpapers 4K', desc: 'Fonds d’écran haute résolution' },
  { name: 'EarthPorn', label: 'EarthPorn', desc: 'Photographie paysages naturels' },
  { name: 'art', label: 'Art & Design', desc: 'Peintures et illustrations' },
  { name: 'space', label: 'Espace & Astro', desc: 'Images spatiales et galaxies' },
  { name: 'cyberpunk', label: 'Cyberpunk', desc: 'Esthétique urbaine futuriste' },
  { name: 'memes', label: 'Memes', desc: 'Humour et contenus viraux' },
  { name: 'videos', label: 'Vidéos', desc: 'Clips et courts métrages' },
];

export const RedditCrawler: React.FC<Props> = ({ onAddToHistory }) => {
  const [subreddit, setSubreddit] = useState('wallpapers');
  const [customSubInput, setCustomSubInput] = useState('');
  const [sort, setSort] = useState<'hot' | 'top' | 'new'>('hot');
  const [timeFilter, setTimeFilter] = useState<'all' | 'month' | 'week' | 'day'>('month');
  const [mediaTypeFilter, setMediaTypeFilter] = useState<'all' | 'image' | 'gallery' | 'video' | 'gif'>('all');

  const [posts, setPosts] = useState<RedditMediaItem[]>([]);
  const [afterToken, setAfterToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ZIP progress
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState({ current: 0, total: 0, item: '' });
  const [copiedLinks, setCopiedLinks] = useState(false);

  // Lightbox state
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const fetchRedditMedia = async (isNewSearch: boolean = true) => {
    const targetSub = customSubInput.trim() || subreddit;
    if (!targetSub) return;

    if (isNewSearch) {
      setLoading(true);
      setError(null);
      setSelectedIds(new Set());
    } else {
      setLoadingMore(true);
    }

    try {
      const currentAfter = isNewSearch ? '' : afterToken || '';
      const url = `/api/reddit/crawl?subreddit=${encodeURIComponent(
        targetSub
      )}&sort=${sort}&t=${timeFilter}&limit=40&after=${encodeURIComponent(currentAfter)}`;

      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Impossible de crawler ce subreddit.');
      }

      if (isNewSearch) {
        setPosts(data.posts);
      } else {
        setPosts((prev) => [...prev, ...data.posts]);
      }

      setAfterToken(data.after);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la récupération des médias Reddit.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchRedditMedia(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subreddit, sort, timeFilter]);

  const handleSubredditSelect = (sub: string) => {
    setSubreddit(sub);
    setCustomSubInput('');
  };

  const handleCustomSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customSubInput.trim()) {
      setSubreddit(customSubInput.trim());
      fetchRedditMedia(true);
    }
  };

  // Filtered posts based on active media filter
  const filteredPosts = posts.filter((p) => {
    if (mediaTypeFilter === 'all') return true;
    return p.mediaType === mediaTypeFilter;
  });

  // Toggle selection
  const handleToggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredPosts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredPosts.map((p) => p.id)));
    }
  };

  // Single download
  const handleDownloadSingle = async (post: RedditMediaItem) => {
    try {
      const ext = post.mediaType === 'video' ? 'mp4' : post.mediaType === 'gif' ? 'gif' : 'jpg';
      const filename = `r_${post.subreddit}_${post.id}_${sanitizeFilename(post.title)}.${ext}`;
      const blob = await fetchProxiedMediaBlob(post.url);
      triggerFileDownload(blob, filename);

      onAddToHistory({
        id: `reddit_${post.id}_${Date.now()}`,
        title: post.title,
        source: 'reddit',
        mediaType: `Reddit ${post.mediaType.toUpperCase()}`,
        format: ext.toUpperCase(),
        thumbnail: post.thumbnail,
        timestamp: Date.now(),
        sizeFormatted: 'Téléchargé',
      });
    } catch (err: any) {
      alert(`Erreur de téléchargement : ${err.message}`);
    }
  };

  // Download selection as ZIP
  const handleDownloadSelectionZip = async () => {
    const selectedItems = filteredPosts.filter((p) => selectedIds.has(p.id));
    if (selectedItems.length === 0) return;

    setIsZipping(true);
    setZipProgress({ current: 0, total: selectedItems.length, item: '' });

    const zipItems: { url: string; filename: string }[] = [];

    for (const post of selectedItems) {
      if (post.mediaType === 'gallery' && post.galleryItems && post.galleryItems.length > 0) {
        post.galleryItems.forEach((g, idx) => {
          zipItems.push({
            url: g.url,
            filename: `r_${post.subreddit}_${post.id}_slide_${idx + 1}.jpg`,
          });
        });
      } else {
        const ext = post.mediaType === 'video' ? 'mp4' : post.mediaType === 'gif' ? 'gif' : 'jpg';
        zipItems.push({
          url: post.url,
          filename: `r_${post.subreddit}_${post.id}_${sanitizeFilename(post.title)}.${ext}`,
        });
      }
    }

    try {
      await bundleRedditMediaZip(
        zipItems,
        `reddit_${subreddit}_selection_${Date.now()}`,
        (current, total, item) => {
          setZipProgress({ current, total, item });
        }
      );

      onAddToHistory({
        id: `reddit_pack_${Date.now()}`,
        title: `Archive Reddit r/${subreddit} (${selectedItems.length} posts)`,
        source: 'reddit',
        mediaType: 'Archive ZIP Média',
        format: `${zipItems.length} fichiers`,
        thumbnail: selectedItems[0]?.thumbnail || '',
        timestamp: Date.now(),
        sizeFormatted: `${(zipItems.length * 2.2).toFixed(1)} Mo`,
      });
    } catch (err) {
      console.error('ZIP packaging failed:', err);
    } finally {
      setIsZipping(false);
    }
  };

  // Copy direct URLs
  const handleCopyLinks = () => {
    const selectedItems = filteredPosts.filter((p) => selectedIds.has(p.id));
    const links = selectedItems.map((p) => p.url).join('\n');
    navigator.clipboard.writeText(links);
    setCopiedLinks(true);
    setTimeout(() => setCopiedLinks(false), 2000);
  };

  const activeLightboxPost = lightboxIndex !== null ? filteredPosts[lightboxIndex] : null;

  return (
    <div className="space-y-6">
      {/* Search & Subreddit Explorer */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="max-w-4xl">
          <div className="flex items-center gap-2 mb-2">
            <Globe2 className="w-5 h-5 text-orange-500" />
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Crawler Média Reddit Exclusif
            </h1>
          </div>
          <p className="text-sm text-slate-400 mb-6">
            Scannez et extrayez instantanément toutes les images HD, galeries multi-photos, vidéos et GIFs depuis n'importe quel subreddit avec téléchargement groupé en ZIP.
          </p>

          {/* Subreddit Presets */}
          <div className="flex flex-wrap gap-2 mb-4">
            {PRESET_SUBREDDITS.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => handleSubredditSelect(p.name)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  subreddit.toLowerCase() === p.name.toLowerCase() && !customSubInput
                    ? 'bg-orange-500 text-white shadow-sm shadow-orange-950/50'
                    : 'bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                }`}
              >
                <span>r/{p.name}</span>
              </button>
            ))}
          </div>

          {/* Custom Search Input */}
          <form onSubmit={handleCustomSearchSubmit} className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={customSubInput}
                onChange={(e) => setCustomSubInput(e.target.value)}
                placeholder="Entrez un autre subreddit (ex: nature, astrophotography, gaming, art...)"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 disabled:bg-slate-800 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors shrink-0 shadow-sm shadow-orange-900/30"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Crawl en cours...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Lancer le Crawl</span>
                </>
              )}
            </button>
          </form>

          {/* Filters Bar: Sort & Media Type */}
          <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs">
            {/* Sort controls */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Trier par :</span>
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setSort('hot')}
                  className={`px-2.5 py-1 rounded font-medium flex items-center gap-1 ${
                    sort === 'hot' ? 'bg-orange-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>Tendance (Hot)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSort('top')}
                  className={`px-2.5 py-1 rounded font-medium ${
                    sort === 'top' ? 'bg-orange-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>Top ({timeFilter})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSort('new')}
                  className={`px-2.5 py-1 rounded font-medium flex items-center gap-1 ${
                    sort === 'new' ? 'bg-orange-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Nouveaux</span>
                </button>
              </div>

              {sort === 'top' && (
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-orange-500"
                >
                  <option value="day">Aujourd'hui</option>
                  <option value="week">Cette semaine</option>
                  <option value="month">Ce mois</option>
                  <option value="all">De tous les temps</option>
                </select>
              )}
            </div>

            {/* Media Type filters */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Filtre média :</span>
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-1">
                {[
                  { type: 'all', label: 'Tous' },
                  { type: 'image', label: 'Images' },
                  { type: 'gallery', label: 'Galeries' },
                  { type: 'video', label: 'Vidéos' },
                  { type: 'gif', label: 'GIFs' },
                ].map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setMediaTypeFilter(item.type as any)}
                    className={`px-2.5 py-1 rounded font-medium ${
                      mediaTypeFilter === item.type
                        ? 'bg-slate-800 text-white font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-950/40 border border-red-800/60 rounded-lg text-red-300 text-xs">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Floating / Sticky Selection Bar */}
      {filteredPosts.length > 0 && (
        <div className="sticky top-18 z-30 bg-slate-900/95 border border-slate-800/90 backdrop-blur-md rounded-xl p-4 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-2 text-xs font-semibold text-slate-200 hover:text-white"
            >
              {selectedIds.size === filteredPosts.length ? (
                <CheckSquare className="w-4 h-4 text-orange-400" />
              ) : (
                <Square className="w-4 h-4 text-slate-500" />
              )}
              <span>
                {selectedIds.size === filteredPosts.length ? 'Tout désélectionner' : 'Tout sélectionner'}
              </span>
            </button>
            <span className="text-xs text-slate-500">·</span>
            <span className="text-xs font-mono tabular-nums text-orange-400 font-semibold">
              {selectedIds.size} sélectionné(s) sur {filteredPosts.length} médias trouvés
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCopyLinks}
              disabled={selectedIds.size === 0}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors"
            >
              {copiedLinks ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLinks ? 'Liens copiés !' : 'Copier les liens'}</span>
            </button>

            <button
              onClick={handleDownloadSelectionZip}
              disabled={selectedIds.size === 0 || isZipping}
              className="px-4 py-1.5 bg-orange-600 hover:bg-orange-500 disabled:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm shadow-orange-950/40"
            >
              {isZipping ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>
                    Compression ({zipProgress.current}/{zipProgress.total})...
                  </span>
                </>
              ) : (
                <>
                  <FileArchive className="w-3.5 h-3.5" />
                  <span>Télécharger la sélection (ZIP)</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ZIP packaging indicator */}
      {isZipping && (
        <div className="p-4 bg-slate-900 border border-orange-500/40 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-200 font-medium truncate max-w-md">
              Téléchargement & archivage : {zipProgress.item}
            </span>
            <span className="font-mono tabular-nums text-orange-400">
              {zipProgress.current} sur {zipProgress.total} médias
            </span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
            <div
              className="bg-orange-500 h-2 rounded-full transition-all duration-150"
              style={{
                width: `${Math.round((zipProgress.current / zipProgress.total) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Media Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square bg-slate-900/60 border border-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 border border-slate-800 rounded-xl">
          <ImageIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-300">Aucun média trouvé</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Aucun média ne correspond à ce filtre ou le subreddit ne contient pas de fichiers médias directs.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredPosts.map((post, idx) => {
            const isSelected = selectedIds.has(post.id);
            return (
              <div
                key={post.id}
                className={`group relative rounded-xl overflow-hidden bg-slate-950 border transition-all duration-200 flex flex-col ${
                  isSelected
                    ? 'border-orange-500 ring-2 ring-orange-500/30 shadow-md shadow-orange-950/20'
                    : 'border-slate-800/90 hover:border-slate-700'
                }`}
              >
                {/* Media Image / Thumbnail */}
                <div className="relative aspect-4/3 overflow-hidden bg-slate-950">
                  <img
                    src={post.thumbnail || post.url}
                    alt={post.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />

                  {/* Top-left Checkbox */}
                  <div className="absolute top-2 left-2 z-10">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleSelect(post.id);
                      }}
                      className="w-6 h-6 rounded bg-black/60 backdrop-blur-sm flex items-center justify-center text-white border border-white/20 hover:border-white transition-colors"
                    >
                      {isSelected ? (
                        <Check className="w-4 h-4 text-orange-400 stroke-3" />
                      ) : (
                        <span className="w-3 h-3 rounded-sm border border-white/50" />
                      )}
                    </button>
                  </div>

                  {/* Top-right Media Type badge */}
                  <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
                    {post.mediaType === 'video' && (
                      <span className="px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[10px] font-semibold text-white flex items-center gap-1 border border-white/10">
                        <Film className="w-3 h-3 text-red-400" />
                        <span>Vidéo</span>
                      </span>
                    )}
                    {post.mediaType === 'gallery' && (
                      <span className="px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[10px] font-semibold text-white flex items-center gap-1 border border-white/10">
                        <Layers className="w-3 h-3 text-blue-400" />
                        <span>{post.count || 2} photos</span>
                      </span>
                    )}
                    {post.mediaType === 'gif' && (
                      <span className="px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[10px] font-semibold text-white border border-white/10">
                        GIF
                      </span>
                    )}
                  </div>

                  {/* Hover Overlay Controls */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setLightboxIndex(idx)}
                      className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm transition-colors"
                      title="Agrandir / Aperçu"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadSingle(post)}
                      className="p-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white shadow-md transition-colors"
                      title="Télécharger ce fichier"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Bottom resolution / score pill */}
                  {post.width && post.height && (
                    <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[10px] font-mono tabular-nums text-slate-300 border border-white/10">
                      {post.width}×{post.height}
                    </div>
                  )}
                </div>

                {/* Card Metadata info */}
                <div className="p-3 flex-1 flex flex-col justify-between bg-slate-900/50">
                  <h4 className="text-xs font-medium text-slate-200 line-clamp-2 leading-tight mb-2">
                    {post.title}
                  </h4>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
                    <span className="font-mono tabular-nums text-orange-400 font-medium">
                      ▲ {post.score > 999 ? `${(post.score / 1000).toFixed(1)}k` : post.score}
                    </span>
                    <a
                      href={post.permalink}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-slate-200 transition-colors flex items-center gap-1 truncate max-w-[100px]"
                    >
                      <span>u/{post.author}</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Load More Pagination */}
      {afterToken && !loading && (
        <div className="text-center pt-4">
          <button
            onClick={() => fetchRedditMedia(false)}
            disabled={loadingMore}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-200 text-xs font-semibold rounded-lg inline-flex items-center gap-2 transition-colors"
          >
            {loadingMore ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Chargement de la suite...</span>
              </>
            ) : (
              <span>Charger 40 médias supplémentaires</span>
            )}
          </button>
        </div>
      )}

      {/* Lightbox Modal */}
      {activeLightboxPost && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-5xl w-full max-h-[90vh] flex flex-col bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            {/* Lightbox Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-white truncate">
                  {activeLightboxPost.title}
                </h3>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                  <span>r/{activeLightboxPost.subreddit}</span>
                  <span>·</span>
                  <span>Posté par u/{activeLightboxPost.author}</span>
                  {activeLightboxPost.width && (
                    <>
                      <span>·</span>
                      <span className="font-mono tabular-nums">
                        {activeLightboxPost.width}×{activeLightboxPost.height}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleDownloadSingle(activeLightboxPost)}
                  className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Télécharger</span>
                </button>
                <button
                  onClick={() => setLightboxIndex(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Lightbox Media Body */}
            <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-black/40 min-h-[300px]">
              {activeLightboxPost.mediaType === 'video' ? (
                <div className="w-full max-w-3xl flex flex-col items-center">
                  <video
                    src={activeLightboxPost.url}
                    controls
                    autoPlay
                    playsInline
                    className="max-h-[60vh] rounded-lg shadow-lg"
                  />
                  {activeLightboxPost.audioUrl && (
                    <div className="mt-2 text-xs text-slate-400 flex items-center gap-1">
                      <Volume2 className="w-3.5 h-3.5 text-slate-500" />
                      <span>Audio direct synchronisé</span>
                    </div>
                  )}
                </div>
              ) : activeLightboxPost.mediaType === 'gallery' && activeLightboxPost.galleryItems ? (
                <div className="flex flex-col items-center gap-4 w-full">
                  <div className="flex flex-wrap justify-center gap-3 max-h-[60vh] overflow-y-auto p-2">
                    {activeLightboxPost.galleryItems.map((item, idx) => (
                      <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-800">
                        <img
                          src={item.url}
                          alt={`Slide ${idx + 1}`}
                          className="max-h-80 object-contain rounded"
                        />
                        <button
                          onClick={() => {
                            const filename = `r_${activeLightboxPost.subreddit}_${activeLightboxPost.id}_slide_${idx + 1}.jpg`;
                            fetchProxiedMediaBlob(item.url).then((b) => triggerFileDownload(b, filename));
                          }}
                          className="absolute bottom-2 right-2 p-1.5 bg-orange-600 text-white rounded text-xs opacity-90 hover:opacity-100"
                          title="Télécharger cette slide"
                        >
                          <Download className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    Galerie de {activeLightboxPost.galleryItems.length} photos haute résolution
                  </span>
                </div>
              ) : (
                <img
                  src={activeLightboxPost.url}
                  alt={activeLightboxPost.title}
                  className="max-h-[65vh] max-w-full object-contain rounded-lg"
                />
              )}
            </div>

            {/* Lightbox Navigation Footer */}
            <div className="p-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <button
                disabled={lightboxIndex === 0}
                onClick={() => setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : prev))}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-300 rounded-lg flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Précédent</span>
              </button>

              <span className="font-mono tabular-nums">
                {lightboxIndex !== null ? lightboxIndex + 1 : 1} / {filteredPosts.length}
              </span>

              <button
                disabled={lightboxIndex === filteredPosts.length - 1}
                onClick={() =>
                  setLightboxIndex((prev) => (prev !== null && prev < filteredPosts.length - 1 ? prev + 1 : prev))
                }
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-300 rounded-lg flex items-center gap-1"
              >
                <span>Suivant</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
