import { useState, useEffect } from 'react';
import { MediaTab, DownloadHistoryItem } from './types';
import { Navbar } from './components/Navbar';
import { YouTubeSingleDownloader } from './components/YouTubeSingleDownloader';
import { YouTubePlaylistDownloader } from './components/YouTubePlaylistDownloader';
import { RedditCrawler } from './components/RedditCrawler';
import { DownloadHistoryView } from './components/DownloadHistoryView';

export default function App() {
  const [activeTab, setActiveTab] = useState<MediaTab>('youtube');
  const [history, setHistory] = useState<DownloadHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('omnimedia_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('omnimedia_history', JSON.stringify(history));
    } catch (e) {
      console.warn('Storage error:', e);
    }
  }, [history]);

  const handleAddToHistory = (item: DownloadHistoryItem) => {
    setHistory((prev) => [item, ...prev.slice(0, 49)]);
  };

  const handleClearHistory = () => {
    setHistory([]);
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col selection:bg-red-500/30 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        historyCount={history.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'youtube' && (
          <YouTubeSingleDownloader onAddToHistory={handleAddToHistory} />
        )}

        {activeTab === 'playlist' && (
          <YouTubePlaylistDownloader onAddToHistory={handleAddToHistory} />
        )}

        {activeTab === 'reddit' && (
          <RedditCrawler onAddToHistory={handleAddToHistory} />
        )}

        {activeTab === 'history' && (
          <DownloadHistoryView
            history={history}
            onClearHistory={handleClearHistory}
          />
        )}
      </main>

      {/* Clean Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/60 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">OmniMedia Hub</span>
            <span>—</span>
            <span>Suite d'extraction et de conversion multimédia pour créateurs</span>
          </div>
          <div className="flex items-center gap-4 text-slate-500">
            <span>Usage personnel & contenus libres de droit</span>
            <span>·</span>
            <span>Support MP3/MP4 320k & 1080p</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
