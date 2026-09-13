'use client';

import React, { useEffect, useRef } from 'react';
import { RotateCcw, Trophy, Award, Coins, Mountain, Home, Sparkles } from 'lucide-react';
import { CharacterSkinId, Player } from '@/lib/game/types';
import { GameRenderer } from '@/lib/game/renderer';
import { sounds } from '@/lib/audio';

interface GameOverModalProps {
  score: number;
  altitude: number;
  coins: number;
  highScore: number;
  isNewHigh: boolean;
  onRestart: () => void;
  onReturnToMenu?: () => void;
  currentSkin?: CharacterSkinId;
}

export default function GameOverModal({
  score,
  altitude,
  coins,
  highScore,
  isNewHigh,
  onRestart,
  onReturnToMenu,
  currentSkin = 'classic_doodle',
}: GameOverModalProps) {
  const doodleCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Allow restarting by pressing Space, W, or Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['Space', 'KeyW', 'Enter'].includes(e.code)) {
        e.preventDefault();
        sounds.playClick();
        onRestart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onRestart]);

  // Mini bouncing doodle character preview
  useEffect(() => {
    const canvas = doodleCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let tick = 0;

    const mockPlayer: Player = {
      x: -20,
      y: -22,
      width: 40,
      height: 44,
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

      // Hand-drawn little green grass platform under character
      const platW = 54;
      const platH = 10;
      const platX = (canvas.width - platW) / 2;
      const platY = canvas.height - 14;

      ctx.fillStyle = '#65a30d';
      ctx.beginPath();
      ctx.roundRect(platX, platY, platW, platH, 4);
      ctx.fill();

      ctx.fillStyle = '#84cc16';
      ctx.beginPath();
      ctx.roundRect(platX, platY, platW, 3, [4, 4, 0, 0]);
      ctx.fill();

      // Grass tufts
      ctx.strokeStyle = '#365314';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let gx = platX + 5; gx < platX + platW - 5; gx += 7) {
        ctx.moveTo(gx, platY);
        ctx.lineTo(gx - 2, platY - 3);
        ctx.moveTo(gx + 2, platY);
        ctx.lineTo(gx + 3, platY - 2.5);
      }
      ctx.stroke();

      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(platX, platY, platW, platH);

      // Cute gentle hop
      const cycle = (tick % 45) / 45;
      const hopY = -Math.abs(Math.sin(cycle * Math.PI)) * 14;
      mockPlayer.squashX = cycle < 0.15 || cycle > 0.85 ? 1.12 : 0.96;
      mockPlayer.squashY = cycle < 0.15 || cycle > 0.85 ? 0.90 : 1.04;

      ctx.translate(canvas.width / 2, canvas.height - 24 + hopY);
      ctx.scale(0.9, 0.9);

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
      id="game-over-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div className="bg-[#faf7ee] text-slate-900 border-4 border-[#1e3a8a] rounded-3xl p-5 sm:p-7 max-w-sm w-full shadow-2xl text-center relative overflow-hidden font-sans">
        {/* Graph paper grid background matching StartScreen & Leaderboard */}
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

        {/* Hand-drawn red notebook margin guideline */}
        <div className="absolute top-0 bottom-0 left-6 w-[2px] bg-rose-400/40 pointer-events-none" />

        {/* Character canvas preview */}
        <div className="relative z-10 flex justify-center -mt-1 mb-1">
          <canvas
            ref={doodleCanvasRef}
            width={90}
            height={68}
            className="w-[90px] h-[68px] drop-shadow-sm"
          />
        </div>

        {/* Header banner */}
        <div className="relative z-10 mb-3">
          {isNewHigh ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-200 border-2 border-amber-500 text-amber-950 text-xs font-black uppercase tracking-wider mb-2 animate-bounce shadow-sm">
              <Trophy className="w-3.5 h-3.5 text-amber-600" />
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              New High Score!
            </div>
          ) : null}

          <h2 className="text-3xl sm:text-4xl font-black text-[#1e3a8a] tracking-tight uppercase font-mono">
            {isNewHigh ? 'INCREDIBLE!' : 'GAME OVER'}
          </h2>

          {/* Hand-drawn crayon underline accent */}
          <div className="w-20 h-1 bg-amber-400 mx-auto rounded-full my-1.5 shadow-sm" />

          <p className="text-xs text-slate-600 font-medium">
            {isNewHigh ? 'You reached a brand new personal record!' : 'You made an awesome leap into the notebook clouds!'}
          </p>
        </div>

        {/* Stats Grid with hand-drawn crayon cards */}
        <div className="grid grid-cols-2 gap-2.5 mb-5 relative z-10">
          <div className="bg-emerald-50/90 border-2 border-emerald-500/80 p-3 rounded-2xl flex flex-col items-center shadow-sm">
            <Award className="w-5 h-5 text-emerald-600 mb-0.5" />
            <span className="text-[10px] text-emerald-900 uppercase font-bold tracking-wide">Final Score</span>
            <span className="text-2xl font-black text-emerald-800 font-mono">{score.toLocaleString()}</span>
          </div>

          <div className="bg-sky-50/90 border-2 border-sky-500/80 p-3 rounded-2xl flex flex-col items-center shadow-sm">
            <Mountain className="w-5 h-5 text-sky-600 mb-0.5" />
            <span className="text-[10px] text-sky-900 uppercase font-bold tracking-wide">Altitude</span>
            <span className="text-2xl font-black text-sky-800 font-mono">
              {altitude} <span className="text-xs font-normal">m</span>
            </span>
          </div>

          <div className="bg-amber-50/90 border-2 border-amber-400/80 p-2.5 rounded-2xl flex flex-col items-center shadow-sm">
            <Coins className="w-4 h-4 text-amber-600 mb-0.5" />
            <span className="text-[10px] text-amber-900 uppercase font-bold tracking-wide">Coins</span>
            <span className="text-lg font-black text-amber-800 font-mono">{coins}</span>
          </div>

          <div className="bg-indigo-50/90 border-2 border-indigo-400/80 p-2.5 rounded-2xl flex flex-col items-center shadow-sm">
            <Trophy className="w-4 h-4 text-indigo-600 mb-0.5" />
            <span className="text-[10px] text-indigo-900 uppercase font-bold tracking-wide">Best Record</span>
            <span className="text-lg font-black text-indigo-900 font-mono">{highScore.toLocaleString()}</span>
          </div>
        </div>

        {/* Action Buttons with authentic sketch button styling */}
        <div className="flex flex-col gap-2.5 relative z-10">
          <button
            id="play-again-btn"
            onClick={() => {
              sounds.playClick();
              onRestart();
            }}
            className="w-full py-3.5 px-6 rounded-2xl bg-[#16a34a] hover:bg-[#15803d] active:scale-95 text-white font-black text-lg flex items-center justify-center gap-2 border-4 border-[#14532d] shadow-md transition-all uppercase tracking-wide"
          >
            <RotateCcw className="w-5 h-5 stroke-[2.8]" />
            Play Again!
          </button>

          {onReturnToMenu && (
            <button
              id="gameover-menu-btn"
              onClick={() => {
                sounds.playClick();
                onReturnToMenu();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 active:scale-95 text-slate-800 font-bold text-sm flex items-center justify-center gap-2 border-2 border-[#1e3a8a] transition-all shadow-sm"
            >
              <Home className="w-4 h-4 text-amber-600" />
              Main Menu
            </button>
          )}
        </div>

        <p className="text-xs text-slate-500 mt-3 font-mono relative z-10">
          Press <strong className="text-slate-800 font-bold">Space</strong> or <strong className="text-slate-800 font-bold">W</strong> to restart
        </p>
      </div>
    </div>
  );
}

