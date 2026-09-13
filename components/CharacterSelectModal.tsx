'use client';

import React, { useRef, useEffect } from 'react';
import { X, Check, Sparkles } from 'lucide-react';
import { CharacterSkinId, Player } from '@/lib/game/types';
import { GameRenderer } from '@/lib/game/renderer';

interface CharacterSelectModalProps {
  currentSkin: CharacterSkinId;
  onSelectSkin: (id: CharacterSkinId) => void;
  onClose: () => void;
}

interface SkinOption {
  id: CharacterSkinId;
  name: string;
  badge: string;
  gridPos: string;
  desc: string;
  bgGradient: string;
  borderColor: string;
}

const SKINS: SkinOption[] = [
  {
    id: 'classic_doodle',
    name: 'Classic Doodle',
    badge: 'Original Hopper',
    gridPos: 'Center',
    desc: 'The iconic sunny yellow jumper with blue horizontal stripes & trumpet snout.',
    bgGradient: 'from-amber-500/20 to-yellow-500/10',
    borderColor: 'border-amber-400/40',
  },
  {
    id: 'propeller_kid',
    name: 'Nerd Doodle',
    badge: 'Nerd Genius',
    gridPos: 'Bottom-Center',
    desc: 'Spinning propeller cap, big round nerd glasses & blue school vest.',
    bgGradient: 'from-blue-500/20 to-indigo-500/10',
    borderColor: 'border-blue-400/40',
  },
  {
    id: 'secret_agent',
    name: 'CEO Doodle',
    badge: 'Executive',
    gridPos: 'Bottom-Right',
    desc: 'Sleek black sunglasses, white collar, black necktie & tailored suit.',
    bgGradient: 'from-slate-600/20 to-slate-800/20',
    borderColor: 'border-slate-400/40',
  },
  {
    id: 'cowboy_11',
    name: 'Cowboy Doodle',
    badge: 'Wild West',
    gridPos: 'Bottom-Left',
    desc: 'Wide-brimmed cowboy hat, golden #11 athletic jersey & purple shorts.',
    bgGradient: 'from-amber-600/20 to-yellow-600/10',
    borderColor: 'border-amber-500/40',
  },
  {
    id: 'flame_crown',
    name: 'Among Us Doodle',
    badge: 'Suspicious',
    gridPos: 'Top-Left',
    desc: 'Red doodle with golden 3-point flame crown, red backpack & goggles.',
    bgGradient: 'from-rose-500/20 to-red-500/10',
    borderColor: 'border-rose-400/40',
  },
  {
    id: 'hammer_cap',
    name: 'Minecrafter Doodle',
    badge: 'Heavy Builder',
    gridPos: 'Top-Center',
    desc: 'Tan jumper sporting a purple anvil cap, striped sweater & backpack.',
    bgGradient: 'from-purple-500/20 to-violet-500/10',
    borderColor: 'border-purple-400/40',
  },
  {
    id: 'athlete_37',
    name: 'Football Doodle',
    badge: 'Field Star',
    gridPos: 'Top-Right',
    desc: 'Blue athletic headband, red #37 team jersey & running shorts.',
    bgGradient: 'from-red-500/20 to-orange-500/10',
    borderColor: 'border-red-400/40',
  },
  {
    id: 'bat_wolf',
    name: 'Wolf Doodle',
    badge: 'Night Howler',
    gridPos: 'Middle-Left',
    desc: 'Charcoal coat with tall pointed ears, violet lining & striped jumper.',
    bgGradient: 'from-indigo-600/20 to-slate-700/20',
    borderColor: 'border-indigo-400/40',
  },
  {
    id: 'bunny_ears',
    name: 'Doodle Bunny',
    badge: 'Bouncy Rabbit',
    gridPos: 'Middle-Right',
    desc: 'White sketch doodle with tall floppy pink rabbit ears & pink shorts.',
    bgGradient: 'from-pink-500/20 to-rose-500/10',
    borderColor: 'border-pink-400/40',
  },
];

function SkinCanvasPreview({ skinId }: { skinId: CharacterSkinId }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let tick = 0;

    const mockPlayer: Player = {
      x: -21,
      y: -23,
      width: 42,
      height: 46,
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
      // Center in 56x56 viewport
      ctx.translate(canvas.width / 2, canvas.height / 2 + 1);
      ctx.scale(0.82, 0.82);

      GameRenderer.drawPlayer(ctx, mockPlayer, 0, skinId, tick);
      ctx.restore();

      tick++;
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [skinId]);

  return (
    <canvas
      ref={canvasRef}
      width={56}
      height={56}
      className="w-14 h-14 flex-shrink-0 drop-shadow-sm"
    />
  );
}

export default function CharacterSelectModal({
  currentSkin,
  onSelectSkin,
  onClose,
}: CharacterSelectModalProps) {
  return (
    <div
      id="character-select-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div className="bg-[#faf7ee] text-slate-900 border-4 border-[#1e3a8a] rounded-3xl p-5 max-w-lg w-full shadow-2xl relative max-h-[85vh] flex flex-col font-sans overflow-hidden">
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

        {/* Hand-drawn red notebook margin guideline */}
        <div className="absolute top-0 bottom-0 left-6 w-[2px] bg-rose-400/40 pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-dashed border-[#1e3a8a]/30 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black tracking-tight text-[#1e3a8a] uppercase font-mono">Hand-Drawn Skins</h2>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-400 flex items-center gap-1 font-mono">
                <Sparkles className="w-3 h-3 text-amber-600" /> 9 Characters
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5 font-medium">
              Characters created directly from your hand-drawn sketch sheet
            </p>
          </div>
          <button
            id="close-skin-modal-btn"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-200/80 hover:bg-slate-300 text-slate-700 transition-all border border-slate-300"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Skin List */}
        <div className="space-y-2.5 overflow-y-auto py-3 pr-1 flex-1 relative z-10">
          {SKINS.map(skin => {
            const isSelected = currentSkin === skin.id;
            return (
              <button
                key={skin.id}
                id={`skin-opt-${skin.id}`}
                onClick={() => {
                  onSelectSkin(skin.id);
                  onClose();
                }}
                className={`w-full p-3 rounded-2xl border-2 text-left flex items-center justify-between gap-3 transition-all active:scale-[0.98] ${
                  isSelected
                    ? 'bg-emerald-50 border-[#16a34a] shadow-md ring-2 ring-emerald-500/40'
                    : 'bg-white/85 hover:bg-white border-slate-300/90 shadow-sm'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Canvas Preview */}
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 bg-white ${isSelected ? 'border-emerald-500' : 'border-slate-300'} p-1 shadow-inner`}
                  >
                    <SkinCanvasPreview skinId={skin.id} />
                  </div>

                  {/* Info */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-sm text-[#1e3a8a]">{skin.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold border border-slate-300">
                        {skin.badge}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-mono font-bold border border-amber-300">
                        Sheet: {skin.gridPos}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 leading-snug line-clamp-2">
                      {skin.desc}
                    </p>
                  </div>
                </div>

                {/* Selected Checkmark */}
                {isSelected ? (
                  <div className="w-7 h-7 rounded-full bg-[#16a34a] flex items-center justify-center text-white flex-shrink-0 shadow-sm border border-emerald-700">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-slate-300 flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
