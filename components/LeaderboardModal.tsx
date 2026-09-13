'use client';

import React from 'react';
import { X, Trophy, Mountain, Coins, Sparkles, Star } from 'lucide-react';

interface LeaderboardModalProps {
  highScore: number;
  bestAltitude: number;
  totalCoins: number;
  onClose: () => void;
  onPlay: () => void;
}

export default function LeaderboardModal({
  highScore,
  bestAltitude,
  totalCoins,
  onClose,
  onPlay,
}: LeaderboardModalProps) {
  // Generate a fun doodle hall-of-fame list integrating user's high score
  const mockDoodleScores = [
    { rank: 1, name: 'Doodle Master', score: Math.max(12500, highScore + 2200), skin: 'classic_doodle', icon: '🎺' },
    { rank: 2, name: highScore > 9000 ? 'You (Player)' : 'Nerd Doodle', score: Math.max(8900, highScore > 9000 ? highScore : 8900), skin: 'propeller_kid', icon: '🤓' },
    { rank: 3, name: highScore > 7000 && highScore <= 9000 ? 'You (Player)' : 'CEO Doodle', score: Math.max(6800, highScore > 7000 ? highScore : 6800), skin: 'secret_agent', icon: '💼' },
    { rank: 4, name: highScore > 4500 && highScore <= 7000 ? 'You (Player)' : 'Football Doodle', score: Math.max(4500, highScore > 4500 ? highScore : 4500), skin: 'athlete_37', icon: '🏈' },
    { rank: 5, name: highScore > 2500 && highScore <= 4500 ? 'You (Player)' : 'Among Us Doodle', score: Math.max(2800, highScore > 2500 ? highScore : 2800), skin: 'flame_crown', icon: '📮' },
    { rank: 6, name: highScore <= 2500 ? 'You (Player)' : 'Doodle Bunny', score: highScore > 0 ? highScore : 1200, skin: 'bunny_ears', icon: '🐰' },
  ].sort((a, b) => b.score - a.score).map((item, idx) => ({ ...item, rank: idx + 1 }));

  return (
    <div
      id="leaderboard-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div className="bg-[#faf7ee] text-slate-900 border-4 border-[#1e3a8a] rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl relative overflow-hidden font-sans">
        {/* Graph paper grid background */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(to right, #1d4ed8 1px, transparent 1px),
              linear-gradient(to bottom, #1d4ed8 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px',
          }}
        />

        {/* Hand-drawn blue margin line */}
        <div className="absolute top-0 bottom-0 left-6 w-[2px] bg-rose-400/40 pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-dashed border-[#1e3a8a]/30 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏆</span>
              <h2 className="text-2xl font-black tracking-tight text-[#1e3a8a] uppercase font-mono">
                LEADER BOARD
              </h2>
            </div>
            <p className="text-xs text-slate-600 font-medium">
              Hand-Drawn Hall of Fame & Best Records
            </p>
          </div>

          <button
            id="close-leaderboard-btn"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-200/80 hover:bg-slate-300 active:scale-95 text-slate-700 transition-all border border-slate-300"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Player Personal Best Highlights */}
        <div className="grid grid-cols-3 gap-2 my-4 relative z-10">
          <div className="bg-amber-100/80 border-2 border-amber-400/80 rounded-2xl p-2.5 text-center shadow-sm">
            <Trophy className="w-4 h-4 text-amber-600 mx-auto mb-0.5" />
            <div className="text-[10px] font-bold text-amber-800 uppercase">High Score</div>
            <div className="text-base font-black text-amber-900 font-mono">{highScore.toLocaleString()}</div>
          </div>

          <div className="bg-sky-100/80 border-2 border-sky-400/80 rounded-2xl p-2.5 text-center shadow-sm">
            <Mountain className="w-4 h-4 text-sky-600 mx-auto mb-0.5" />
            <div className="text-[10px] font-bold text-sky-800 uppercase">Altitude</div>
            <div className="text-base font-black text-sky-900 font-mono">{bestAltitude}m</div>
          </div>

          <div className="bg-emerald-100/80 border-2 border-emerald-400/80 rounded-2xl p-2.5 text-center shadow-sm">
            <Coins className="w-4 h-4 text-emerald-600 mx-auto mb-0.5" />
            <div className="text-[10px] font-bold text-emerald-800 uppercase">Coins</div>
            <div className="text-base font-black text-emerald-900 font-mono">{totalCoins}</div>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="space-y-1.5 max-h-[36vh] overflow-y-auto pr-1 relative z-10">
          {mockDoodleScores.map(entry => {
            const isUser = entry.name.includes('You');
            return (
              <div
                key={entry.rank}
                className={`p-2.5 rounded-xl border flex items-center justify-between text-sm transition-all ${
                  isUser
                    ? 'bg-amber-100 border-amber-500 font-bold shadow-sm ring-1 ring-amber-400/50'
                    : 'bg-white/80 border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black font-mono ${
                      entry.rank === 1
                        ? 'bg-yellow-400 text-yellow-950 border border-yellow-500'
                        : entry.rank === 2
                        ? 'bg-slate-300 text-slate-900 border border-slate-400'
                        : entry.rank === 3
                        ? 'bg-amber-600 text-amber-50 border border-amber-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {entry.rank}
                  </span>
                  <span className="text-base">{entry.icon}</span>
                  <span className="text-xs sm:text-sm text-slate-800 font-semibold">{entry.name}</span>
                </div>

                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                  <span className="font-mono font-black text-xs sm:text-sm text-[#1e3a8a]">
                    {entry.score.toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Button */}
        <div className="mt-4 pt-3 border-t-2 border-dashed border-[#1e3a8a]/20 flex gap-2 relative z-10">
          <button
            onClick={() => {
              onClose();
              onPlay();
            }}
            className="w-full py-3 rounded-2xl bg-[#16a34a] hover:bg-[#15803d] active:scale-95 text-white font-black text-base flex items-center justify-center gap-2 shadow-md transition-all border-2 border-[#166534]"
          >
            <Sparkles className="w-4 h-4" />
            PLAY NOW!
          </button>
        </div>
      </div>
    </div>
  );
}
