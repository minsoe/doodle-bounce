'use client';

import React, { useRef, useEffect } from 'react';
import { CharacterSkinId, ControlsLayout, Player } from '@/lib/game/types';
import { GameRenderer } from '@/lib/game/renderer';
import { sounds } from '@/lib/audio';
import { Volume2, VolumeX, HelpCircle, Trophy, ArrowRight, Sparkles } from 'lucide-react';

interface StartScreenProps {
  currentSkin: CharacterSkinId;
  highScore: number;
  soundEnabled: boolean;
  controlsLayout: ControlsLayout;
  onPlay: () => void;
  onOpenLeaderboard: () => void;
  onOpenSkins: () => void;
  onOpenHelp: () => void;
  onToggleSound: () => void;
  onToggleControls: () => void;
}

export default function StartScreen({
  currentSkin,
  highScore,
  soundEnabled,
  controlsLayout,
  onPlay,
  onOpenLeaderboard,
  onOpenSkins,
  onOpenHelp,
  onToggleSound,
  onToggleControls,
}: StartScreenProps) {
  const doodleCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Live animated bouncing character on top of the SKIN platform
  useEffect(() => {
    const canvas = doodleCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let tick = 0;

    const mockPlayer: Player = {
      x: -22,
      y: -24,
      width: 44,
      height: 48,
      vx: 0,
      vy: 0,
      facing: 'right',
      isGrounded: true,
      canDoubleJump: true,
      doubleJumpUsed: false,
      squashX: 1,
      squashY: 1,
      tiltAngle: 0,
      rocketTimer: 0,
      hasShield: false,
    };

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();

      // Gentle joyful hop cycle
      const cycle = (tick % 60) / 60; // 0 to 1
      const hopY = -Math.abs(Math.sin(cycle * Math.PI)) * 28;
      const squash = cycle < 0.15 || cycle > 0.85 ? 1.15 : 0.95;
      const stretch = cycle < 0.15 || cycle > 0.85 ? 0.88 : 1.05;

      mockPlayer.squashX = squash;
      mockPlayer.squashY = stretch;

      // Center in canvas
      ctx.translate(canvas.width / 2, canvas.height / 2 + 10 + hopY);
      ctx.scale(1.2, 1.2);

      GameRenderer.drawPlayer(ctx, mockPlayer, 0, currentSkin, tick);
      ctx.restore();

      tick++;
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [currentSkin]);

  return (
    <div
      id="start-screen-container"
      className="w-full max-w-[480px] bg-[#fbf9f1] text-slate-900 rounded-3xl shadow-2xl p-4 sm:p-5 relative select-none overflow-hidden border-4 border-[#2b4c7e] transition-all"
      style={{ minHeight: '680px' }}
    >
      {/* Authentic Graph Paper Grid Pattern */}
      <div
        className="absolute inset-0 opacity-25 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, #3b82f6 1px, transparent 1px),
            linear-gradient(to bottom, #3b82f6 1px, transparent 1px)
          `,
          backgroundSize: '22px 22px',
        }}
      />

      {/* Hand-drawn blue outer margin rectangle from home-screen1.jpg */}
      <svg
        className="absolute inset-2 w-[calc(100%-16px)] h-[calc(100%-16px)] pointer-events-none opacity-90 z-0"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="3"
          y="3"
          width="calc(100% - 6px)"
          height="calc(100% - 6px)"
          rx="18"
          ry="18"
          fill="none"
          stroke="#254d8c"
          strokeWidth="3.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          strokeDasharray="1800"
          className="drop-shadow-sm"
        />
      </svg>

      {/* Top Header Toolbar */}
      <div className="relative z-10 flex items-center justify-between px-2 pt-1 pb-2">
        {/* High Score Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/90 border-2 border-amber-400 text-amber-900 font-bold text-xs shadow-sm">
          <Trophy className="w-3.5 h-3.5 text-amber-600" />
          <span className="font-mono">BEST: {highScore.toLocaleString()}</span>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-2">
          <button
            id="start-controls-btn"
            onClick={onToggleControls}
            title={`Controls: ${controlsLayout === 'user' ? 'Custom (D/Left, A/Right)' : 'Standard (A/Left, D/Right)'}`}
            className="px-2.5 py-1 rounded-xl bg-white/90 hover:bg-white text-slate-700 hover:text-slate-950 border-2 border-slate-300 shadow-sm text-[11px] font-bold font-mono active:scale-95 transition-all"
          >
            {controlsLayout === 'user' ? 'D/A/W' : 'A/D/W'}
          </button>

          <button
            id="start-sound-btn"
            onClick={onToggleSound}
            title={soundEnabled ? 'Mute' : 'Unmute'}
            className="p-1.5 rounded-xl bg-white/90 hover:bg-white text-slate-700 hover:text-slate-950 border-2 border-slate-300 shadow-sm active:scale-95 transition-all"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>

          <button
            id="start-help-btn"
            onClick={onOpenHelp}
            title="How to Play"
            className="p-1.5 rounded-xl bg-white/90 hover:bg-white text-slate-700 hover:text-slate-950 border-2 border-slate-300 shadow-sm active:scale-95 transition-all"
          >
            <HelpCircle className="w-4 h-4 text-blue-600" />
          </button>
        </div>
      </div>

      {/* Main Drawing Layout matching home-screen1.jpg */}
      <div className="relative z-10 flex flex-col justify-between pt-2 pb-4 px-2" style={{ minHeight: '590px' }}>
        
        {/* Title Section: Hand-Drawn DOODLE (Yellow) & BOUNCE (Purple) */}
        <div className="flex flex-col items-start pl-1 sm:pl-2 select-none">
          {/* "DOODLE" in Yellow Crayon Bubble Letters */}
          <div className="relative mb-2 sm:mb-3">
            <svg
              viewBox="0 0 420 100"
              className="w-full max-w-[390px] h-auto overflow-visible filter drop-shadow-[2px_3px_0px_rgba(0,0,0,0.15)]"
            >
              <defs>
                {/* Crayon / Colored Pencil Hatching pattern */}
                <pattern id="yellowCrayon" width="6" height="6" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                  <line x1="0" y1="0" x2="0" y2="6" stroke="#facc15" strokeWidth="4.5" />
                  <line x1="0" y1="0" x2="6" y2="0" stroke="#fef08a" strokeWidth="2" />
                </pattern>
                <filter id="sketchFilter">
                  <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" result="noise" />
                  <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" />
                </filter>
              </defs>

              {/* D */}
              <path
                d="M 15 20 C 15 15, 25 12, 42 12 C 68 12, 85 28, 85 52 C 85 76, 66 88, 42 88 C 22 88, 15 85, 15 80 Z M 36 32 L 36 68 C 48 68, 62 64, 62 50 C 62 36, 48 32, 36 32 Z"
                fill="url(#yellowCrayon)"
                stroke="#203a43"
                strokeWidth="4"
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {/* First O */}
              <path
                d="M 125 15 C 148 15, 165 30, 165 52 C 165 74, 148 89, 125 89 C 102 89, 85 74, 85 52 C 85 30, 102 15, 125 15 Z M 125 32 C 114 32, 107 41, 107 52 C 107 63, 114 72, 125 72 C 136 72, 143 63, 143 52 C 143 41, 136 32, 125 32 Z"
                fill="url(#yellowCrayon)"
                stroke="#203a43"
                strokeWidth="4"
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {/* Second O */}
              <path
                d="M 205 15 C 228 15, 245 30, 245 52 C 245 74, 228 89, 205 89 C 182 89, 165 74, 165 52 C 165 30, 182 15, 205 15 Z M 205 32 C 194 32, 187 41, 187 52 C 187 63, 194 72, 205 72 C 216 72, 223 63, 223 52 C 223 41, 216 32, 205 32 Z"
                fill="url(#yellowCrayon)"
                stroke="#203a43"
                strokeWidth="4"
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {/* Second D */}
              <path
                d="M 255 18 C 255 14, 265 12, 280 12 C 304 12, 320 28, 320 52 C 320 76, 302 88, 280 88 C 263 88, 255 86, 255 82 Z M 274 32 L 274 68 C 285 68, 298 64, 298 50 C 298 36, 285 32, 274 32 Z"
                fill="url(#yellowCrayon)"
                stroke="#203a43"
                strokeWidth="4"
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {/* L */}
              <path
                d="M 330 18 L 350 18 L 350 68 L 382 68 L 382 88 L 330 88 Z"
                fill="url(#yellowCrayon)"
                stroke="#203a43"
                strokeWidth="4"
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {/* E */}
              <path
                d="M 390 18 L 420 18 L 420 34 L 408 34 L 408 45 L 418 45 L 418 60 L 408 60 L 408 72 L 422 72 L 422 88 L 390 88 Z"
                fill="url(#yellowCrayon)"
                stroke="#203a43"
                strokeWidth="4"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* "BOUNCE" in Purple Crayon Bubble Letters */}
          <div className="relative mb-4">
            <svg
              viewBox="0 0 380 90"
              className="w-full max-w-[340px] h-auto overflow-visible filter drop-shadow-[2px_3px_0px_rgba(0,0,0,0.15)]"
            >
              <defs>
                <pattern id="purpleCrayon" width="6" height="6" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                  <line x1="0" y1="0" x2="0" y2="6" stroke="#9333ea" strokeWidth="4.5" />
                  <line x1="0" y1="0" x2="6" y2="0" stroke="#c084fc" strokeWidth="2" />
                </pattern>
              </defs>

              {/* B */}
              <path
                d="M 12 15 C 12 12, 22 10, 38 10 C 54 10, 64 18, 64 28 C 64 36, 56 42, 46 44 C 60 46, 70 54, 70 66 C 70 78, 56 86, 38 86 L 12 86 Z M 32 26 L 32 40 C 40 40, 46 37, 46 33 C 46 29, 40 26, 32 26 Z M 32 54 L 32 70 C 42 70, 50 67, 50 62 C 50 57, 42 54, 32 54 Z"
                fill="url(#purpleCrayon)"
                stroke="#1e1b4b"
                strokeWidth="4"
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {/* O */}
              <path
                d="M 104 15 C 124 15, 140 30, 140 50 C 140 70, 124 85, 104 85 C 84 85, 68 70, 68 50 C 68 30, 84 15, 104 15 Z M 104 31 C 94 31, 87 39, 87 50 C 87 61, 94 69, 104 69 C 114 69, 121 61, 121 50 C 121 39, 114 31, 104 31 Z"
                fill="url(#purpleCrayon)"
                stroke="#1e1b4b"
                strokeWidth="4"
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {/* U */}
              <path
                d="M 150 16 L 168 16 L 168 56 C 168 66, 175 72, 185 72 C 195 72, 202 66, 202 56 L 202 16 L 220 16 L 220 56 C 220 76, 204 87, 185 87 C 166 87, 150 76, 150 56 Z"
                fill="url(#purpleCrayon)"
                stroke="#1e1b4b"
                strokeWidth="4"
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {/* N */}
              <path
                d="M 230 16 L 248 16 L 270 56 L 270 16 L 288 16 L 288 86 L 270 86 L 248 46 L 248 86 L 230 86 Z"
                fill="url(#purpleCrayon)"
                stroke="#1e1b4b"
                strokeWidth="4"
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {/* C */}
              <path
                d="M 340 28 L 326 36 C 322 28, 314 26, 306 26 C 294 26, 286 36, 286 50 C 286 64, 294 74, 306 74 C 314 74, 322 71, 326 64 L 340 72 C 334 82, 322 88, 306 88 C 282 88, 268 72, 268 50 C 268 28, 282 12, 306 12 C 322 12, 334 18, 340 28 Z"
                fill="url(#purpleCrayon)"
                stroke="#1e1b4b"
                strokeWidth="4"
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {/* E */}
              <path
                d="M 348 16 L 378 16 L 378 30 L 366 30 L 366 42 L 376 42 L 376 56 L 366 56 L 366 72 L 380 72 L 380 86 L 348 86 Z"
                fill="url(#purpleCrayon)"
                stroke="#1e1b4b"
                strokeWidth="4"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Right Section: Bouncing Doodle Character on Rainbow "SKIN" Platform */}
        <div className="relative flex justify-end pr-2 sm:pr-4 -mt-6 sm:-mt-10 mb-2">
          <div
            id="skin-select-trigger-area"
            onClick={() => {
              sounds.playJump();
              onOpenSkins();
            }}
            className="group flex flex-col items-center cursor-pointer transition-transform active:scale-95"
            title="Click to Choose Skin"
          >
            {/* Live Bouncing Character */}
            <div className="relative w-28 h-28 flex items-center justify-center">
              <canvas
                ref={doodleCanvasRef}
                width={110}
                height={110}
                className="w-28 h-28 drop-shadow-md pointer-events-none"
              />
            </div>

            {/* Rainbow "SKIN" Platform Button matching home-screen1.jpg */}
            <div className="relative w-32 h-14 rounded-xl border-3 border-[#1e293b] shadow-md overflow-hidden flex items-center justify-center bg-white group-hover:scale-105 transition-all">
              {/* Rainbow Vertical Crayon Stripes (Tan, Yellow, Lime, Blue, Purple, Red) */}
              <div className="absolute inset-0 flex w-full h-full">
                <div className="flex-1 bg-[#d4a373] border-r border-[#1e293b]/30" />
                <div className="flex-1 bg-[#facc15] border-r border-[#1e293b]/30" />
                <div className="flex-1 bg-[#84cc16] border-r border-[#1e293b]/30" />
                <div className="flex-1 bg-[#38bdf8] border-r border-[#1e293b]/30" />
                <div className="flex-1 bg-[#a855f7] border-r border-[#1e293b]/30" />
                <div className="flex-1 bg-[#ef4444]" />
              </div>

              {/* Hand-drawn hollow outline letters "SKIN" */}
              <div className="relative z-10 flex items-center justify-center font-black tracking-wider text-xl sm:text-2xl text-white font-mono drop-shadow-[0_2px_3px_rgba(0,0,0,0.8)] px-2">
                <span className="text-white drop-shadow-[0_1.5px_1px_rgba(0,0,0,1)]">S</span>
                <span className="text-white drop-shadow-[0_1.5px_1px_rgba(0,0,0,1)]">K</span>
                <span className="text-white drop-shadow-[0_1.5px_1px_rgba(0,0,0,1)]">I</span>
                <span className="text-white drop-shadow-[0_1.5px_1px_rgba(0,0,0,1)]">N</span>
              </div>

              {/* Sparkle badge */}
              <div className="absolute top-1 right-1">
                <Sparkles className="w-3 h-3 text-yellow-200 fill-yellow-200 animate-pulse" />
              </div>
            </div>

            <span className="text-[10px] font-bold text-[#1e3a8a] mt-1 font-mono tracking-tight bg-white/70 px-2 py-0.5 rounded-full border border-blue-200">
              TAP TO CHANGE
            </span>
          </div>
        </div>

        {/* Bottom-Left Buttons Section matching home-screen1.jpg */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3 pt-4 pl-1 sm:pl-2">
          <div className="flex flex-col gap-3 w-full sm:w-auto">
            
            {/* "PLAY" Button (Green & Blue Crayon Oval Capsule) */}
            <button
              id="start-play-btn"
              onClick={() => {
                sounds.playJump();
                onPlay();
              }}
              className="group relative w-full sm:w-48 h-16 rounded-full border-4 border-[#1e293b] shadow-lg overflow-hidden active:scale-95 transition-all text-left flex items-center justify-center px-4"
              style={{
                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 55%, #2563eb 100%)',
              }}
            >
              {/* Crayon Hatch Texture Overlay */}
              <div
                className="absolute inset-0 opacity-25 pointer-events-none"
                style={{
                  backgroundImage: `radial-gradient(#ffffff 2px, transparent 2px)`,
                  backgroundSize: '6px 6px',
                }}
              />

              {/* Hand-Drawn "PLAY" Outline Letters */}
              <div className="relative z-10 flex items-center justify-center gap-2">
                <span className="font-black text-3xl sm:text-4xl text-white font-mono tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                  PLAY
                </span>
                <ArrowRight className="w-6 h-6 text-white stroke-[3] group-hover:translate-x-1 transition-transform drop-shadow-md" />
              </div>
            </button>

            {/* "LEADER BOARD" Button (Two-tone: Top Blue "LEADER", Bottom Green "BOARD") */}
            <button
              id="start-leaderboard-btn"
              onClick={() => {
                sounds.playClick();
                onOpenLeaderboard();
              }}
              className="group relative w-full sm:w-56 h-18 rounded-2xl border-4 border-[#1e293b] shadow-lg overflow-hidden active:scale-95 transition-all flex flex-col"
            >
              {/* Top Tier: Blue Crayon with "LEADER" */}
              <div className="w-full h-1/2 bg-[#1d4ed8] border-b-2 border-[#1e293b] flex items-center justify-center px-3">
                <span className="font-black text-base sm:text-lg text-white font-mono tracking-widest drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.6)]">
                  LEADER
                </span>
              </div>

              {/* Bottom Tier: Light Green Crayon with "BOARD" */}
              <div className="w-full h-1/2 bg-[#84cc16] flex items-center justify-center px-3">
                <span className="font-black text-base sm:text-lg text-white font-mono tracking-widest drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.6)]">
                  BOARD
                </span>
              </div>
            </button>

          </div>

          {/* Quick controls sticker on paper */}
          <div className="text-[11px] font-mono text-slate-600 bg-white/80 border-2 border-dashed border-slate-400/70 rounded-xl p-2.5 shadow-sm max-w-[180px] self-end hidden sm:block">
            <div className="font-bold text-[#1e3a8a] uppercase text-[10px] mb-1">🎮 Quick Controls</div>
            <div>• <strong className="text-emerald-700">W / Space:</strong> Jump</div>
            <div>• <strong className="text-amber-700">A / D:</strong> Move Left/Right</div>
          </div>
        </div>

      </div>

      {/* Hand-Drawn Pencil Footer */}
      <div className="relative z-10 pt-2 text-center text-[11px] font-mono text-slate-500 border-t border-dashed border-[#2b4c7e]/20">
        Hand-Drawn Doodle Bounce • Sketchpad Edition
      </div>
    </div>
  );
}
