'use client';

import React from 'react';
import { X, ArrowLeft, ArrowRight, ArrowUp, MousePointer, Sparkles, Shield, Rocket } from 'lucide-react';
import { ControlsLayout } from '@/lib/game/types';

interface ControlsHelpModalProps {
  controlsLayout: ControlsLayout;
  onClose: () => void;
}

export default function ControlsHelpModal({
  controlsLayout,
  onClose,
}: ControlsHelpModalProps) {
  return (
    <div
      id="controls-help-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div className="bg-[#faf7ee] text-slate-900 border-4 border-[#1e3a8a] rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl relative max-h-[85vh] overflow-y-auto font-sans">
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
        <div className="flex items-center justify-between pb-3 border-b-2 border-dashed border-[#1e3a8a]/30 relative z-10 mb-4">
          <div>
            <h2 className="text-xl font-black tracking-tight text-[#1e3a8a] uppercase font-mono">How to Play</h2>
            <p className="text-xs text-slate-600 font-medium">Controls & sketchpad mechanics</p>
          </div>
          <button
            id="close-help-modal-btn"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-200/80 hover:bg-slate-300 text-slate-700 transition-all border border-slate-300"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Primary Controls Section */}
        <div className="space-y-2.5 mb-5 relative z-10">
          <div className="text-xs font-black uppercase tracking-wider text-[#1e3a8a] font-mono">
            Keyboard & Mouse Controls
          </div>

          {/* Shoot */}
          <div className="bg-white/85 p-3 rounded-2xl border-2 border-slate-300 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 border border-emerald-400 text-emerald-700 flex items-center justify-center font-bold text-base">
                🎯
              </div>
              <div>
                <span className="font-black text-sm text-slate-900">SHOOT</span>
                <p className="text-[11px] text-slate-600">Shoots black circle from mouth towards mouse pointer</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-slate-100 border border-slate-300 rounded-lg text-xs font-mono font-black text-emerald-800 shadow-sm">W</kbd>
              <kbd className="px-2 py-1 bg-slate-100 border border-slate-300 rounded-lg text-xs font-mono font-black text-emerald-800 shadow-sm">Space</kbd>
              <kbd className="px-2 py-1 bg-slate-100 border border-slate-300 rounded-lg text-xs font-mono font-black text-emerald-800 shadow-sm">↑</kbd>
              <span className="text-slate-500 text-xs mx-0.5 font-medium">or</span>
              <kbd className="p-1.5 bg-slate-100 border border-slate-300 rounded-lg text-xs font-mono text-emerald-800 flex items-center shadow-sm">
                <MousePointer className="w-3.5 h-3.5" />
              </kbd>
            </div>
          </div>

          {/* Ammo & Cooldown Note */}
          <div className="bg-slate-100/90 px-3 py-2 rounded-xl border border-slate-300 text-[11px] text-slate-700 flex items-center justify-between">
            <span><strong>Ammo:</strong> 6 shots capacity</span>
            <span><strong>Cooldown:</strong> 2 seconds after 6 shots</span>
            <span className="text-emerald-700 font-bold">Defeats monsters!</span>
          </div>

          {/* Left */}
          <div className="bg-white/85 p-3 rounded-2xl border-2 border-slate-300 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-400 text-amber-700 flex items-center justify-center font-bold">
                <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <span className="font-black text-sm text-slate-900">MOVE LEFT</span>
                <p className="text-[11px] text-slate-600">Glide left across platforms</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <kbd className="px-2.5 py-1 bg-slate-100 border border-slate-300 rounded-lg text-xs font-mono font-black text-amber-800 shadow-sm">
                {controlsLayout === 'inverted' ? 'D' : 'A'}
              </kbd>
              <span className="text-slate-500 text-xs font-medium">or</span>
              <kbd className="px-2.5 py-1 bg-slate-100 border border-slate-300 rounded-lg text-xs font-mono font-black text-amber-800 shadow-sm">←</kbd>
            </div>
          </div>

          {/* Right */}
          <div className="bg-white/85 p-3 rounded-2xl border-2 border-slate-300 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-400 text-amber-700 flex items-center justify-center font-bold">
                <ArrowRight className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <span className="font-black text-sm text-slate-900">MOVE RIGHT</span>
                <p className="text-[11px] text-slate-600">Glide right across platforms</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <kbd className="px-2.5 py-1 bg-slate-100 border border-slate-300 rounded-lg text-xs font-mono font-black text-amber-800 shadow-sm">
                {controlsLayout === 'inverted' ? 'A' : 'D'}
              </kbd>
              <span className="text-slate-500 text-xs font-medium">or</span>
              <kbd className="px-2.5 py-1 bg-slate-100 border border-slate-300 rounded-lg text-xs font-mono font-black text-amber-800 shadow-sm">→</kbd>
            </div>
          </div>
        </div>

        {/* Game Tips & Platform Guide */}
        <div className="space-y-2 border-t-2 border-dashed border-[#1e3a8a]/20 pt-4 relative z-10">
          <div className="text-xs font-black uppercase tracking-wider text-[#1e3a8a] font-mono mb-2">
            Platform Types & Items
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-white/85 border-2 border-slate-300 shadow-sm">
              <span className="font-bold text-emerald-700">🌿 Standard</span>
              <p className="text-[11px] text-slate-600 mt-0.5">Reliable sturdy green footing.</p>
            </div>
            <div className="p-2.5 rounded-xl bg-white/85 border-2 border-slate-300 shadow-sm">
              <span className="font-bold text-sky-700">↔ Moving</span>
              <p className="text-[11px] text-slate-600 mt-0.5">Glides left and right smoothly.</p>
            </div>
            <div className="p-2.5 rounded-xl bg-white/85 border-2 border-slate-300 shadow-sm">
              <span className="font-bold text-amber-700">🔴 Spring Pad</span>
              <p className="text-[11px] text-slate-600 mt-0.5">Launches 2.5x super high!</p>
            </div>
            <div className="p-2.5 rounded-xl bg-white/85 border-2 border-slate-300 shadow-sm">
              <span className="font-bold text-rose-700">☁ Crumble</span>
              <p className="text-[11px] text-slate-600 mt-0.5">Breaks after just 1 bounce.</p>
            </div>
          </div>

          {/* Special power-ups */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-orange-50 border border-orange-200 text-xs shadow-sm">
            <Rocket className="w-4 h-4 text-orange-600 flex-shrink-0" />
            <span className="text-slate-800 font-medium">
              <strong className="text-orange-800 font-bold">Rocket:</strong> Blasts upward through the sky for 3 seconds!
            </span>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-sky-50 border border-sky-200 text-xs shadow-sm">
            <Shield className="w-4 h-4 text-sky-600 flex-shrink-0" />
            <span className="text-slate-800 font-medium">
              <strong className="text-sky-800 font-bold">Shield Bubble:</strong> Rescues you from one fatal fall!
            </span>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs shadow-sm">
            <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span className="text-slate-800 font-medium">
              <strong className="text-amber-800 font-bold">Screen Wrap:</strong> Stepping off one side wraps to the other!
            </span>
          </div>
        </div>

        {/* Monsters & Hazards Section */}
        <div className="space-y-2 border-t-2 border-dashed border-[#1e3a8a]/20 pt-4 relative z-10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-[#1e3a8a] font-mono">
              Beware of Monsters!
            </span>
            <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-bold border border-rose-300">
              Fatal Touch
            </span>
          </div>

          <p className="text-[11px] text-slate-600 leading-tight">
            None of the monsters will follow you, but if any touches you, you will fall and die. <strong>Shoot them with your black pellets to make them disappear!</strong>
          </p>

          <div className="grid grid-cols-1 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-emerald-50/90 border-2 border-emerald-400 flex items-center gap-2.5 shadow-sm">
              <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-bold text-sm">
                👾
              </div>
              <div>
                <span className="font-black text-emerald-900">Green Monster</span>
                <p className="text-[11px] text-emerald-800">Moves back and forth steadily across the screen.</p>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-rose-50/90 border-2 border-rose-400 flex items-center gap-2.5 shadow-sm">
              <div className="w-7 h-7 rounded-lg bg-rose-500 text-white flex items-center justify-center font-bold text-sm">
                👹
              </div>
              <div>
                <span className="font-black text-rose-900">Red Monster</span>
                <p className="text-[11px] text-rose-800">Patrols back and forth between two still platforms.</p>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-sky-50/90 border-2 border-sky-400 flex items-center gap-2.5 shadow-sm">
              <div className="w-7 h-7 rounded-lg bg-sky-500 text-white flex items-center justify-center font-bold text-sm">
                🦇
              </div>
              <div>
                <span className="font-black text-sky-900">Blue Monster</span>
                <p className="text-[11px] text-sky-800">Flies around in looping aerial paths above platforms.</p>
              </div>
            </div>
          </div>
        </div>

        <button
          id="got-it-help-btn"
          onClick={onClose}
          className="mt-5 w-full py-3 bg-[#16a34a] hover:bg-[#15803d] active:scale-95 text-white font-black rounded-2xl shadow-md transition-all border-4 border-[#14532d] uppercase tracking-wide text-base"
        >
          Got It, Let&apos;s Jump!
        </button>
      </div>
    </div>
  );
}
