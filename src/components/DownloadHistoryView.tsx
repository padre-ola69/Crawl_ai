import React from 'react';
import { DownloadHistoryItem } from '../types';
import { History, Trash2, Clock, CheckCircle2, Music, Video, Globe2 } from 'lucide-react';

interface Props {
  history: DownloadHistoryItem[];
  onClearHistory: () => void;
}

export const DownloadHistoryView: React.FC<Props> = ({ history, onClearHistory }) => {
  return (
    <div className="space-y-6">
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6 shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <History className="w-5 h-5 text-slate-400" />
            <h1 className="text-xl font-bold tracking-tight text-white">
              Historique des Téléchargements & Conversions
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Retrouvez tous vos fichiers MP3, MP4 et archives Reddit générés au cours de vos sessions.
          </p>
        </div>

        {history.length > 0 && (
          <button
            onClick={onClearHistory}
            className="px-3 py-2 bg-slate-800 hover:bg-red-950/40 hover:text-red-300 text-slate-400 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Vider l'historique</span>
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 border border-slate-800 rounded-xl">
          <History className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-300">Aucun téléchargement récent</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Les conversions de vidéos YouTube, les playlists et les packs Reddit téléchargés apparaîtront automatiquement ici.
          </p>
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4 w-12">Type</th>
                  <th className="py-3 px-4">Titre / Média</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4">Format</th>
                  <th className="py-3 px-4">Taille est.</th>
                  <th className="py-3 px-4 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {history.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      {item.source === 'reddit' ? (
                        <div className="w-7 h-7 rounded bg-orange-950/40 border border-orange-800/50 flex items-center justify-center text-orange-400">
                          <Globe2 className="w-3.5 h-3.5" />
                        </div>
                      ) : item.mediaType.includes('MP3') || item.mediaType.includes('Audio') ? (
                        <div className="w-7 h-7 rounded bg-red-950/40 border border-red-800/50 flex items-center justify-center text-red-400">
                          <Music className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded bg-blue-950/40 border border-blue-800/50 flex items-center justify-center text-blue-400">
                          <Video className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {item.thumbnail && (
                          <img
                            src={item.thumbnail}
                            alt=""
                            referrerPolicy="no-referrer"
                            className="w-10 h-7 object-cover rounded bg-slate-950 border border-slate-800"
                          />
                        )}
                        <span className="font-medium text-slate-200 line-clamp-1">{item.title}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-400 capitalize">{item.source}</td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-300">{item.format}</td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-400">{item.sizeFormatted || '—'}</td>
                    <td className="py-3 px-4 text-right text-slate-500 font-mono tabular-nums">
                      {new Date(item.timestamp).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
