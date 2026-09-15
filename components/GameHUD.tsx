'use client';

import React from 'react';
import { Volume2, VolumeX, Pause, Play, HelpCircle, Palette, ArrowUpDown, Home, Trophy } from 'lucide-react';
import { ControlsLayout, CharacterSkinId } from '@/lib/game/types';

interface GameHUDProps {
  score: number;
  altitude: number;
  coins: number;
  combo: number;
  highScore: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  controlsLayout: ControlsLayout;
  onToggleControls: () => void;
  isPaused: boolean;
  onTogglePause: () => void;
  onOpenHelp: () => void;
  onOpenSkins: () => void;
  currentSkin: CharacterSkinId;
  onReturnHome?: () => void;
  onOpenLeaderboard?: () => void;
}

export default function GameHUD({
  score,
  altitude,
  coins,
  combo,
  highScore,
  soundEnabled,
  onToggleSound,
  controlsLayout,
  onToggleControls,
  isPaused,
  onTogglePause,
  onOpenHelp,
  onOpenSkins,
  currentSkin,
  onReturnHome,
  onOpenLeaderboard,
}: GameHUDProps) {
  return (
    <div id="game-hud" className="w-full max-w-[480px] px-2 mb-3">
      {/* Top Bar with score, altitude, coins, high score */}
      <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl p-3 border border-slate-700/80 shadow-xl flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-2">
          {/* Altitude & Score */}
          <div className="flex items-center gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Score</div>
              <div className="text-2xl font-black text-emerald-400 font-mono tracking-tight leading-none">
                {score.toLocaleString()}
              </div>
            </div>

            <div className="h-7 w-[1px] bg-slate-700 mx-1" />

            <div>
              <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Altitude</div>
              <div className="text-xl font-bold text-sky-300 font-mono tracking-tight leading-none flex items-baseline gap-0.5">
                {altitude} <span className="text-xs font-normal text-sky-400">m</span>
              </div>
            </div>
          </div>

          {/* Quick controls icons */}
          <div className="flex items-center gap-1.5">
            <button
              id="hud-sound-btn"
              onClick={onToggleSound}
              title={soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white transition-all border border-slate-700"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
            </button>

            <button
              id="hud-pause-btn"
              onClick={onTogglePause}
              title={isPaused ? 'Resume' : 'Pause'}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white transition-all border border-slate-700"
            >
              {isPaused ? <Play className="w-4 h-4 text-amber-400" /> : <Pause className="w-4 h-4" />}
            </button>

            <button
              id="hud-skins-btn"
              onClick={onOpenSkins}
              title={`Change Character Skin (Current: ${
                currentSkin === 'classic_doodle' ? 'Classic Doodle' :
                currentSkin === 'propeller_kid' ? 'Nerd Doodle' :
                currentSkin === 'secret_agent' ? 'CEO Doodle' :
                currentSkin === 'cowboy_11' ? 'Cowboy Doodle' :
                currentSkin === 'flame_crown' ? 'Among Us Doodle' :
                currentSkin === 'hammer_cap' ? 'Minecrafter Doodle' :
                currentSkin === 'athlete_37' ? 'Football Doodle' :
                currentSkin === 'bat_wolf' ? 'Wolf Doodle' : 'Doodle Bunny'
              })`}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white transition-all border border-slate-700 text-xs font-medium"
            >
              <Palette className="w-4 h-4 text-purple-400 flex-shrink-0" />
              <span className="text-[11px] font-semibold text-purple-300 max-w-[80px] truncate">
                {currentSkin === 'classic_doodle' ? 'Classic' :
                 currentSkin === 'propeller_kid' ? 'Nerd' :
                 currentSkin === 'secret_agent' ? 'CEO' :
                 currentSkin === 'cowboy_11' ? 'Cowboy' :
                 currentSkin === 'flame_crown' ? 'Among Us' :
                 currentSkin === 'hammer_cap' ? 'Craft' :
                 currentSkin === 'athlete_37' ? 'Football' :
                 currentSkin === 'bat_wolf' ? 'Wolf' : 'Bunny'}
              </span>
            </button>

            {onReturnHome && (
              <button
                id="hud-home-btn"
                onClick={onReturnHome}
                title="Return to Start Screen"
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white transition-all border border-slate-700"
              >
                <Home className="w-4 h-4 text-amber-400" />
              </button>
            )}

            {onOpenLeaderboard && (
              <button
                id="hud-leaderboard-btn"
                onClick={onOpenLeaderboard}
                title="View Leaderboard"
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white transition-all border border-slate-700"
              >
                <Trophy className="w-4 h-4 text-yellow-400" />
              </button>
            )}

            <button
              id="hud-help-btn"
              onClick={onOpenHelp}
              title="Controls & How to Play"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white transition-all border border-slate-700"
            >
              <HelpCircle className="w-4 h-4 text-cyan-400" />
            </button>
          </div>
        </div>

        {/* Sub-bar: High score, Coins, Combo, and Key Bindings Banner */}
        <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-800/80">
          <div className="flex items-center gap-3">
            <span className="text-slate-400 flex items-center gap-1">
              <span className="text-amber-400">★</span> Best: <strong className="text-slate-200 font-mono">{highScore.toLocaleString()}</strong>
            </span>

            <span className="text-slate-400 flex items-center gap-1">
              <span className="text-amber-400">●</span> Coins: <strong className="text-amber-300 font-mono">{coins}</strong>
            </span>

            {combo > 1 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold font-mono text-[11px] animate-pulse">
                {combo}x Combo
              </span>
            )}
          </div>

          {/* Quick Key Bindings Switcher */}
          <button
            id="toggle-controls-layout-btn"
            onClick={onToggleControls}
            title="Toggle between Standard [A=Left, D=Right] and Inverted [D=Left, A=Right]"
            className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            <ArrowUpDown className="w-3 h-3 text-cyan-400" />
            <span>
              {controlsLayout === 'inverted' ? 'Left: D | Right: A' : 'Left: A | Right: D'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
