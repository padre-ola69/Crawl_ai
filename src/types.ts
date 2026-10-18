export type MediaTab = 'youtube' | 'playlist' | 'reddit' | 'history';

export interface YouTubeFormatOption {
  format: 'mp3' | 'mp4' | 'wav';
  quality: string;
  label: string;
  ext: string;
  bitrate?: number;
  res?: string;
}

export interface YouTubeVideoInfo {
  id: string;
  url: string;
  title: string;
  author: string;
  authorUrl: string;
  thumbnailUrl: string;
  thumbnails: {
    maxres: string;
    hq: string;
    mq: string;
  };
  durationFormatted: string;
  formats: {
    audio: YouTubeFormatOption[];
    video: YouTubeFormatOption[];
  };
}

export interface PlaylistItem {
  id: string;
  title: string;
  author: string;
  url: string;
  thumbnail: string;
  publishedAt?: string;
  selected?: boolean;
}

export interface YouTubePlaylistInfo {
  id: string;
  title: string;
  author: string;
  url: string;
  totalCount: number;
  videos: PlaylistItem[];
}

export interface RedditGalleryItem {
  mediaId: string;
  url: string;
  width?: number;
  height?: number;
  caption?: string;
}

export interface RedditMediaItem {
  id: string;
  title: string;
  author: string;
  subreddit: string;
  score: number;
  numComments: number;
  permalink: string;
  createdUtc: number;
  over18: boolean;
  mediaType: 'image' | 'gallery' | 'video' | 'gif';
  url: string;
  audioUrl?: string | null;
  thumbnail: string;
  width?: number;
  height?: number;
  duration?: number;
  galleryItems?: RedditGalleryItem[];
  count?: number;
}

export interface DownloadHistoryItem {
  id: string;
  title: string;
  source: 'youtube' | 'playlist' | 'reddit';
  mediaType: string;
  format: string;
  thumbnail: string;
  timestamp: number;
  sizeFormatted?: string;
  downloadUrl?: string;
}
