import React from 'react';
import { MediaTab } from '../types';
import { DownloadCloud, PlaySquare, ListMusic, Globe2, History } from 'lucide-react';

interface NavbarProps {
  activeTab: MediaTab;
  onTabChange: (tab: MediaTab) => void;
  historyCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  historyCount,
}) => {
  return (
    <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white shadow-sm shadow-red-900/40">
              <DownloadCloud className="w-4 h-4" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white whitespace-nowrap">
              OmniMedia Hub
            </span>
          </div>

          {/* Zone 2: 4 single-line clean navigation links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
            <button
              onClick={() => onTabChange('youtube')}
              className={`flex items-center gap-2 py-1 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'youtube'
                  ? 'text-white border-b-2 border-red-500 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <PlaySquare className="w-4 h-4" />
              <span>YouTube MP3 / MP4</span>
            </button>

            <button
              onClick={() => onTabChange('playlist')}
              className={`flex items-center gap-2 py-1 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'playlist'
                  ? 'text-white border-b-2 border-red-500 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ListMusic className="w-4 h-4" />
              <span>Playlists Complètes</span>
            </button>

            <button
              onClick={() => onTabChange('reddit')}
              className={`flex items-center gap-2 py-1 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'reddit'
                  ? 'text-orange-400 border-b-2 border-orange-500 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Globe2 className="w-4 h-4 text-orange-400" />
              <span>Crawler Reddit Exclusif</span>
            </button>

            <button
              onClick={() => onTabChange('history')}
              className={`flex items-center gap-2 py-1 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'history'
                  ? 'text-white border-b-2 border-slate-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Historique</span>
              {historyCount > 0 && (
                <span className="text-xs text-slate-400 tabular-nums">({historyCount})</span>
              )}
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onTabChange('reddit')}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 transition-colors rounded-md shadow-sm whitespace-nowrap shrink-0"
            >
              Explorer Reddit
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav bar */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-800/60 bg-slate-950 px-2 py-2 text-xs">
        <button
          onClick={() => onTabChange('youtube')}
          className={`flex flex-col items-center gap-1 py-1 px-2 ${
            activeTab === 'youtube' ? 'text-red-400 font-medium' : 'text-slate-400'
          }`}
        >
          <PlaySquare className="w-4 h-4" />
          <span>YouTube</span>
        </button>
        <button
          onClick={() => onTabChange('playlist')}
          className={`flex flex-col items-center gap-1 py-1 px-2 ${
            activeTab === 'playlist' ? 'text-red-400 font-medium' : 'text-slate-400'
          }`}
        >
          <ListMusic className="w-4 h-4" />
          <span>Playlists</span>
        </button>
        <button
          onClick={() => onTabChange('reddit')}
          className={`flex flex-col items-center gap-1 py-1 px-2 ${
            activeTab === 'reddit' ? 'text-orange-400 font-medium' : 'text-slate-400'
          }`}
        >
          <Globe2 className="w-4 h-4" />
          <span>Reddit</span>
        </button>
        <button
          onClick={() => onTabChange('history')}
          className={`flex flex-col items-center gap-1 py-1 px-2 ${
            activeTab === 'history' ? 'text-white font-medium' : 'text-slate-400'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Historique</span>
        </button>
      </div>
    </header>
  );
};
