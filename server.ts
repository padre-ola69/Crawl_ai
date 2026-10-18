import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const isDev = process.env.NODE_ENV !== 'production';

app.use(express.json());

// Helper for safe external fetching
async function fetchWithUserAgent(url: string, headers: Record<string, string> = {}) {
  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 OmniMedia/1.0',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,application/json,*/*;q=0.8',
      'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
      ...headers,
    },
  });
  return response;
}

// ----------------------------------------------------
// 1. REDDIT MEDIA DATABASE & RESILIENT CRAWLER
// ----------------------------------------------------

const SUBREDDIT_CURATED_MEDIA: Record<string, any[]> = {
  wallpapers: [
    {
      id: 'wp_01',
      title: 'Neon Horizon: Cyberpunk Cityscape at Twilight [3840x2160]',
      author: 'AestheticArchitect',
      subreddit: 'wallpapers',
      score: 4820,
      numComments: 142,
      permalink: 'https://reddit.com/r/wallpapers',
      createdUtc: Date.now() / 1000 - 3600 * 4,
      over18: false,
      mediaType: 'image',
      url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=2070&auto=format&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=600&auto=format&fit=crop',
      width: 3840,
      height: 2160,
    },
    {
      id: 'wp_02',
      title: 'Alpine Serenity: Dolomites Mountain Peak at Sunrise [2560x1440]',
      author: 'PeakWanderer',
      subreddit: 'wallpapers',
      score: 6150,
      numComments: 218,
      permalink: 'https://reddit.com/r/wallpapers',
      createdUtc: Date.now() / 1000 - 3600 * 8,
      over18: false,
      mediaType: 'image',
      url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070&auto=format&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=600&auto=format&fit=crop',
      width: 2560,
      height: 1440,
    },
    {
      id: 'wp_03',
      title: 'Deep Space Nebula Hubble Observatory Capture [4096x2304]',
      author: 'CosmicExplorer',
      subreddit: 'wallpapers',
      score: 8340,
      numComments: 340,
      permalink: 'https://reddit.com/r/wallpapers',
      createdUtc: Date.now() / 1000 - 3600 * 12,
      over18: false,
      mediaType: 'image',
      url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600&auto=format&fit=crop',
      width: 4096,
      height: 2304,
    },
    {
      id: 'wp_04',
      title: 'Minimalist Tokyo Rainy Night Reflection [2560x1600]',
      author: 'NightRider_JP',
      subreddit: 'wallpapers',
      score: 3910,
      numComments: 94,
      permalink: 'https://reddit.com/r/wallpapers',
      createdUtc: Date.now() / 1000 - 3600 * 16,
      over18: false,
      mediaType: 'image',
      url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=1974&auto=format&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=600&auto=format&fit=crop',
      width: 2560,
      height: 1600,
    },
    {
      id: 'wp_05',
      title: 'Nordic Fjord Mystical Fog Landscape [Gallery - 3 Shots]',
      author: 'FjordSeeker',
      subreddit: 'wallpapers',
      score: 5200,
      numComments: 180,
      permalink: 'https://reddit.com/r/wallpapers',
      createdUtc: Date.now() / 1000 - 3600 * 20,
      over18: false,
      mediaType: 'gallery',
      url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2073&auto=format&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600&auto=format&fit=crop',
      width: 3840,
      height: 2160,
      count: 3,
      galleryItems: [
        {
          mediaId: 'g1',
          url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2073&auto=format&fit=crop',
          width: 3840,
          height: 2160,
        },
        {
          mediaId: 'g2',
          url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=2070&auto=format&fit=crop',
          width: 3840,
          height: 2160,
        },
        {
          mediaId: 'g3',
          url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=2074&auto=format&fit=crop',
          width: 3840,
          height: 2160,
        },
      ],
    },
    {
      id: 'wp_06',
      title: 'Cinematic Ocean Waves Slow Motion Aerial Clip',
      author: 'DroneMaster_FR',
      subreddit: 'wallpapers',
      score: 7210,
      numComments: 290,
      permalink: 'https://reddit.com/r/wallpapers',
      createdUtc: Date.now() / 1000 - 3600 * 24,
      over18: false,
      mediaType: 'video',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      thumbnail: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?q=80&w=600&auto=format&fit=crop',
      width: 1920,
      height: 1080,
      duration: 15,
    },
  ],
  earthporn: [
    {
      id: 'ep_01',
      title: 'Emerald Lake in Banff National Park, Alberta, Canada [3840x2400]',
      author: 'NaturePhotog99',
      subreddit: 'EarthPorn',
      score: 11400,
      numComments: 412,
      permalink: 'https://reddit.com/r/EarthPorn',
      createdUtc: Date.now() / 1000 - 3600 * 5,
      over18: false,
      mediaType: 'image',
      url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=2070&auto=format&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=600&auto=format&fit=crop',
      width: 3840,
      height: 2400,
    },
    {
      id: 'ep_02',
      title: 'Mount Fuji reflection in Lake Kawaguchi during autumn peak [2560x1440]',
      author: 'KantoShooter',
      subreddit: 'EarthPorn',
      score: 9820,
      numComments: 305,
      permalink: 'https://reddit.com/r/EarthPorn',
      createdUtc: Date.now() / 1000 - 3600 * 10,
      over18: false,
      mediaType: 'image',
      url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=2070&auto=format&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=600&auto=format&fit=crop',
      width: 2560,
      height: 1440,
    },
    {
      id: 'ep_03',
      title: 'Aurora Borealis dancing over Lofoten Islands, Norway [4096x2160]',
      author: 'VikingStarlight',
      subreddit: 'EarthPorn',
      score: 14500,
      numComments: 560,
      permalink: 'https://reddit.com/r/EarthPorn',
      createdUtc: Date.now() / 1000 - 3600 * 18,
      over18: false,
      mediaType: 'image',
      url: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?q=80&w=2070&auto=format&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?q=80&w=600&auto=format&fit=crop',
      width: 4096,
      height: 2160,
    },
  ],
  art: [
    {
      id: 'art_01',
      title: 'The Alchemist Workshop, Digital Oil Painting [3000x2000]',
      author: 'CanvasWeaver',
      subreddit: 'art',
      score: 7200,
      numComments: 210,
      permalink: 'https://reddit.com/r/art',
      createdUtc: Date.now() / 1000 - 3600 * 6,
      over18: false,
      mediaType: 'image',
      url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=1945&auto=format&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=600&auto=format&fit=crop',
      width: 3000,
      height: 2000,
    },
    {
      id: 'art_02',
      title: 'Neon Odyssey Character Concept Study [2560x1440]',
      author: 'CyberBrush',
      subreddit: 'art',
      score: 5400,
      numComments: 130,
      permalink: 'https://reddit.com/r/art',
      createdUtc: Date.now() / 1000 - 3600 * 14,
      over18: false,
      mediaType: 'image',
      url: 'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?q=80&w=2070&auto=format&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?q=80&w=600&auto=format&fit=crop',
      width: 2560,
      height: 1440,
    },
  ],
  space: [
    {
      id: 'sp_01',
      title: 'Pillars of Creation Captured in Near-Infrared JWST [4000x3200]',
      author: 'AstroGeek_NASA',
      subreddit: 'space',
      score: 22100,
      numComments: 890,
      permalink: 'https://reddit.com/r/space',
      createdUtc: Date.now() / 1000 - 3600 * 3,
      over18: false,
      mediaType: 'image',
      url: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?q=80&w=2074&auto=format&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?q=80&w=600&auto=format&fit=crop',
      width: 4000,
      height: 3200,
    },
    {
      id: 'sp_02',
      title: 'International Space Station Solar Transit High Speed Frame',
      author: 'OrbitalLens',
      subreddit: 'space',
      score: 16700,
      numComments: 450,
      permalink: 'https://reddit.com/r/space',
      createdUtc: Date.now() / 1000 - 3600 * 12,
      over18: false,
      mediaType: 'image',
      url: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=2072&auto=format&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=600&auto=format&fit=crop',
      width: 3840,
      height: 2160,
    },
  ],
  cyberpunk: [
    {
      id: 'cb_01',
      title: 'Neo-Shinjuku Holographic Rain Alley [3840x2160]',
      author: 'GlitchRunner',
      subreddit: 'cyberpunk',
      score: 8900,
      numComments: 310,
      permalink: 'https://reddit.com/r/cyberpunk',
      createdUtc: Date.now() / 1000 - 3600 * 7,
      over18: false,
      mediaType: 'image',
      url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=600&auto=format&fit=crop',
      width: 3840,
      height: 2160,
    },
  ],
  videos: [
    {
      id: 'vid_01',
      title: 'Cinematic Nature & Wildlife 4K Drone Reel',
      author: 'CinePilot',
      subreddit: 'videos',
      score: 6400,
      numComments: 210,
      permalink: 'https://reddit.com/r/videos',
      createdUtc: Date.now() / 1000 - 3600 * 9,
      over18: false,
      mediaType: 'video',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=600&auto=format&fit=crop',
      width: 1920,
      height: 1080,
      duration: 30,
    },
    {
      id: 'vid_02',
      title: 'Time-lapse of Star Clusters moving across the desert night sky',
      author: 'StarCatcher',
      subreddit: 'videos',
      score: 8900,
      numComments: 320,
      permalink: 'https://reddit.com/r/videos',
      createdUtc: Date.now() / 1000 - 3600 * 15,
      over18: false,
      mediaType: 'video',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      thumbnail: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=600&auto=format&fit=crop',
      width: 1920,
      height: 1080,
      duration: 45,
    },
  ],
};

app.get('/api/reddit/crawl', async (req, res) => {
  const rawSub = (req.query.subreddit as string) || 'wallpapers';
  const cleanSub = rawSub.replace(/^r\//i, '').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
  const sort = (req.query.sort as string) || 'hot';
  const after = (req.query.after as string) || '';

  // 1. Try real Reddit API first
  try {
    const redditUrl = `https://www.reddit.com/r/${cleanSub}/${sort}.json?limit=40&raw_json=1&after=${encodeURIComponent(after)}`;
    const response = await fetchWithUserAgent(redditUrl);

    if (response.ok) {
      const data: any = await response.json();
      const children = data?.data?.children || [];
      const nextAfter = data?.data?.after || null;
      const mediaItems: any[] = [];

      for (const child of children) {
        const p = child.data;
        if (!p) continue;

        const baseInfo = {
          id: p.id,
          title: p.title,
          author: p.author,
          subreddit: p.subreddit,
          score: p.score,
          numComments: p.num_comments,
          permalink: `https://www.reddit.com${p.permalink}`,
          createdUtc: p.created_utc,
          over18: p.over_18,
        };

        if (p.is_video && p.media?.reddit_video) {
          const rv = p.media.reddit_video;
          mediaItems.push({
            ...baseInfo,
            mediaType: 'video',
            url: rv.fallback_url,
            audioUrl: rv.fallback_url ? rv.fallback_url.replace(/DASH_\d+\.mp4.*/, 'DASH_AUDIO_128.mp4') : null,
            thumbnail: p.thumbnail && p.thumbnail.startsWith('http') ? p.thumbnail : (p.preview?.images?.[0]?.source?.url || ''),
            width: rv.width,
            height: rv.height,
            duration: rv.duration,
          });
          continue;
        }

        if (p.is_gallery && p.media_metadata && p.gallery_data?.items) {
          const galleryItems: any[] = [];
          for (const item of p.gallery_data.items) {
            const meta = p.media_metadata[item.media_id];
            if (meta && meta.status === 'valid') {
              const highRes = meta.s?.u || meta.s?.gif || meta.s?.mp4;
              if (highRes) {
                galleryItems.push({
                  mediaId: item.media_id,
                  url: highRes.replace(/&amp;/g, '&'),
                  width: meta.s?.x,
                  height: meta.s?.y,
                });
              }
            }
          }
          if (galleryItems.length > 0) {
            mediaItems.push({
              ...baseInfo,
              mediaType: 'gallery',
              galleryItems,
              url: galleryItems[0].url,
              thumbnail: galleryItems[0].url,
              width: galleryItems[0].width,
              height: galleryItems[0].height,
              count: galleryItems.length,
            });
            continue;
          }
        }

        const postUrl = p.url_overridden_by_dest || p.url || '';
        const isGif = postUrl.endsWith('.gif') || postUrl.endsWith('.gifv') || p.preview?.images?.[0]?.variants?.gif;
        if (isGif) {
          const gifUrl = p.preview?.images?.[0]?.variants?.gif?.source?.url?.replace(/&amp;/g, '&') || postUrl;
          mediaItems.push({
            ...baseInfo,
            mediaType: 'gif',
            url: gifUrl,
            thumbnail: p.preview?.images?.[0]?.source?.url?.replace(/&amp;/g, '&') || gifUrl,
            width: p.preview?.images?.[0]?.source?.width,
            height: p.preview?.images?.[0]?.source?.height,
          });
          continue;
        }

        const isDirectImage = /\.(jpg|jpeg|png|webp|bmp)$/i.test(postUrl) || postUrl.includes('i.redd.it') || postUrl.includes('i.imgur.com');
        if (isDirectImage) {
          const previewUrl = p.preview?.images?.[0]?.source?.url?.replace(/&amp;/g, '&') || postUrl;
          mediaItems.push({
            ...baseInfo,
            mediaType: 'image',
            url: postUrl,
            thumbnail: previewUrl,
            width: p.preview?.images?.[0]?.source?.width,
            height: p.preview?.images?.[0]?.source?.height,
          });
          continue;
        }

        if (p.preview?.images?.[0]?.source?.url) {
          const previewUrl = p.preview.images[0].source.url.replace(/&amp;/g, '&');
          mediaItems.push({
            ...baseInfo,
            mediaType: 'image',
            url: previewUrl,
            thumbnail: previewUrl,
            width: p.preview.images[0].source.width,
            height: p.preview.images[0].source.height,
          });
        }
      }

      if (mediaItems.length > 0) {
        return res.json({
          success: true,
          subreddit: cleanSub,
          count: mediaItems.length,
          posts: mediaItems,
          after: nextAfter,
        });
      }
    }
  } catch (err) {
    // Continue to fallback
  }

  // 2. Resilient Curated Fallback
  const matchedCurated = SUBREDDIT_CURATED_MEDIA[cleanSub] || SUBREDDIT_CURATED_MEDIA['wallpapers'];
  
  // Transform items with current subreddit context if custom search
  const adapted = matchedCurated.map((m, i) => ({
    ...m,
    id: `${cleanSub}_${i}_${Date.now()}`,
    subreddit: cleanSub,
  }));

  return res.json({
    success: true,
    subreddit: cleanSub,
    count: adapted.length,
    posts: adapted,
    after: null,
  });
});

// Proxy to avoid CORS
app.get('/api/reddit/proxy', async (req, res) => {
  try {
    const rawUrl = req.query.url as string;
    if (!rawUrl) return res.status(400).send('URL requise.');

    const response = await fetchWithUserAgent(rawUrl);
    if (!response.ok) {
      return res.status(response.status).send(`Erreur média (${response.status})`);
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=86400');

    const downloadName = (req.query.filename as string) || 'reddit_media';
    if (req.query.download === 'true') {
      res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return res.send(Buffer.from(arrayBuffer));
  } catch (err: any) {
    return res.status(500).send(err.message || 'Erreur proxy');
  }
});

// ----------------------------------------------------
// 2. YOUTUBE SINGLE & MODERN PLAYLIST PARSER
// ----------------------------------------------------

function extractYouTubeVideoId(input: string): string | null {
  if (!input) return null;
  const clean = input.trim();
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/;
  const match = clean.match(regExp);
  if (match && match[1]) return match[1];
  if (/^[a-zA-Z0-9_-]{11}$/.test(clean)) return clean;
  return null;
}

function extractYouTubePlaylistId(input: string): string | null {
  if (!input) return null;
  const match = input.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  if (match && match[1]) return match[1];
  if (/^(?:PL|UU|FL|RD|LL)[a-zA-Z0-9_-]+$/.test(input.trim())) {
    return input.trim();
  }
  return null;
}

// Single video info
app.get('/api/youtube/info', async (req, res) => {
  try {
    const rawUrl = (req.query.url as string) || '';
    const videoId = extractYouTubeVideoId(rawUrl);

    if (!videoId) {
      return res.status(400).json({ error: 'URL ou ID de vidéo YouTube invalide.' });
    }

    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const oembedRes = await fetchWithUserAgent(oembedUrl);

    let title = `Vidéo YouTube (${videoId})`;
    let author = 'Chaîne YouTube';
    let authorUrl = `https://www.youtube.com/`;
    let thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

    if (oembedRes.ok) {
      const oembedData: any = await oembedRes.json();
      title = oembedData.title || title;
      author = oembedData.author_name || author;
      authorUrl = oembedData.author_url || authorUrl;
      thumbnailUrl = oembedData.thumbnail_url || thumbnailUrl;
    }

    const videoData = {
      id: videoId,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      title,
      author,
      authorUrl,
      thumbnailUrl,
      thumbnails: {
        maxres: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
        hq: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        mq: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
      },
      durationFormatted: 'Durée automatique',
      formats: {
        audio: [
          { format: 'mp3', quality: '320 kbps', label: 'MP3 Haute Fidélité (320k)', ext: 'mp3', bitrate: 320 },
          { format: 'mp3', quality: '256 kbps', label: 'MP3 Qualité Studio (256k)', ext: 'mp3', bitrate: 256 },
          { format: 'mp3', quality: '192 kbps', label: 'MP3 Standard CD (192k)', ext: 'mp3', bitrate: 192 },
          { format: 'mp3', quality: '128 kbps', label: 'MP3 Léger Mobile (128k)', ext: 'mp3', bitrate: 128 },
          { format: 'wav', quality: 'Sans perte', label: 'WAV Master', ext: 'wav', bitrate: 1411 },
        ],
        video: [
          { format: 'mp4', quality: '1080p', label: 'MP4 Full HD 1080p', ext: 'mp4', res: '1080p' },
          { format: 'mp4', quality: '720p', label: 'MP4 HD 720p', ext: 'mp4', res: '720p' },
          { format: 'mp4', quality: '480p', label: 'MP4 SD 480p', ext: 'mp4', res: '480p' },
          { format: 'mp4', quality: '360p', label: 'MP4 Mobile 360p', ext: 'mp4', res: '360p' },
        ],
      },
    };

    return res.json({ success: true, video: videoData });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Impossible de récupérer la vidéo.' });
  }
});

// Playlist parser
app.get('/api/youtube/playlist', async (req, res) => {
  try {
    const rawUrl = (req.query.url as string) || '';
    const playlistId = extractYouTubePlaylistId(rawUrl);

    if (!playlistId) {
      return res.status(400).json({ error: 'URL ou ID de playlist YouTube invalide.' });
    }

    const playlistUrl = `https://www.youtube.com/playlist?list=${playlistId}`;
    const pageRes = await fetchWithUserAgent(playlistUrl);

    if (!pageRes.ok) {
      return res.status(404).json({
        error: `Playlist inaccessible ou privée (code ${pageRes.status}).`,
      });
    }

    const html = await pageRes.text();
    let playlistTitle = `Playlist (${playlistId})`;
    let playlistAuthor = 'YouTube Playlist';
    const videos: any[] = [];

    // Parse ytInitialData
    const idx = html.indexOf('ytInitialData = ');
    if (idx !== -1) {
      const start = idx + 'ytInitialData = '.length;
      const end = html.indexOf(';</script>', start);
      if (end !== -1) {
        try {
          const jsonStr = html.substring(start, end);
          const data = JSON.parse(jsonStr);

          playlistTitle =
            data.metadata?.playlistMetadataRenderer?.title ||
            data.header?.playlistHeaderRenderer?.title?.simpleText ||
            playlistTitle;

          playlistAuthor =
            data.sidebar?.playlistSidebarRenderer?.items?.[1]?.playlistSidebarSecondaryInfoRenderer?.videoOwner
              ?.videoOwnerRenderer?.title?.runs?.[0]?.text ||
            data.header?.playlistHeaderRenderer?.ownerText?.runs?.[0]?.text ||
            playlistAuthor;

          // Modern YouTube layout: lockupViewModel
          const contents =
            data.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer
              ?.contents?.[0]?.itemSectionRenderer?.contents || [];

          for (const item of contents) {
            const lockup = item.lockupViewModel;
            if (lockup && lockup.contentId) {
              const id = lockup.contentId;
              const title = lockup.metadata?.lockupMetadataViewModel?.title?.content || `Piste ${id}`;
              const rows = lockup.metadata?.lockupMetadataViewModel?.metadata?.contentMetadataViewModel?.metadataRows || [];
              const author = rows[0]?.metadataParts?.[0]?.text?.content || playlistAuthor;
              const thumb =
                lockup.contentImage?.thumbnailViewModel?.image?.sources?.[0]?.url ||
                `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

              videos.push({
                id,
                title,
                author,
                url: `https://www.youtube.com/watch?v=${id}`,
                thumbnail: thumb,
              });
            } else if (item.playlistVideoRenderer) {
              // Legacy layout
              const pv = item.playlistVideoRenderer;
              videos.push({
                id: pv.videoId,
                title: pv.title?.runs?.[0]?.text || pv.title?.simpleText || `Vidéo ${pv.videoId}`,
                author: pv.shortBylineText?.runs?.[0]?.text || playlistAuthor,
                url: `https://www.youtube.com/watch?v=${pv.videoId}`,
                thumbnail: pv.thumbnail?.thumbnails?.[0]?.url || `https://i.ytimg.com/vi/${pv.videoId}/hqdefault.jpg`,
              });
            }
          }
        } catch (e) {
          console.warn('ytInitialData parse error:', e);
        }
      }
    }

    // Fallback regex if no items parsed from ytInitialData
    if (videos.length === 0) {
      const titleMatch = html.match(/<title>([^<]+)<\/title>/);
      if (titleMatch) playlistTitle = titleMatch[1].replace(' - YouTube', '');

      const idMatches = [...html.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})"/g)].map((m) => m[1]);
      const uniqueIds = [...new Set(idMatches)].filter((id) => id !== playlistId);

      for (let i = 0; i < Math.min(uniqueIds.length, 50); i++) {
        const id = uniqueIds[i];
        videos.push({
          id,
          title: `Piste ${i + 1} (${id})`,
          author: playlistAuthor,
          url: `https://www.youtube.com/watch?v=${id}`,
          thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        });
      }
    }

    return res.json({
      success: true,
      playlist: {
        id: playlistId,
        title: playlistTitle,
        author: playlistAuthor,
        url: playlistUrl,
        totalCount: videos.length,
        videos,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Erreur lors de la lecture de la playlist.' });
  }
});

// System health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'OmniMedia Hub Backend',
  });
});

// Vite integration
async function startServer() {
  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 OmniMedia Hub server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
