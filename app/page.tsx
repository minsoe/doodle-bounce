'use client';

import React, { useState, useEffect, useCallback } from 'react';
import GameCanvas from '@/components/GameCanvas';
import GameHUD from '@/components/GameHUD';
import GameOverModal from '@/components/GameOverModal';
import CharacterSelectModal from '@/components/CharacterSelectModal';
import ControlsHelpModal from '@/components/ControlsHelpModal';
import StartScreen from '@/components/StartScreen';
import LeaderboardModal from '@/components/LeaderboardModal';
import { CharacterSkinId, ControlsLayout, MonsterType } from '@/lib/game/types';
import { sounds } from '@/lib/audio';
import { useSavedNumber, useSavedString, useSavedBoolean } from '@/lib/storage';

export default function JumpingGamePage() {
  // Screen state: 'start' | 'game'
  const [currentScreen, setCurrentScreen] = useState<'start' | 'game'>('start');

  // Game states
  const [score, setScore] = useState(0);
  const [altitude, setAltitude] = useState(0);
  const [coins, setCoins] = useState(0);
  const [combo, setCombo] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isNewHigh, setIsNewHigh] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [defeatedByMonster, setDefeatedByMonster] = useState<MonsterType | null>(null);

  // Persistent settings synchronized via external store (hydration-safe)
  const [highScore, setHighScore] = useSavedNumber('jumping_game_high_score', 0);
  const [bestAltitude, setBestAltitude] = useSavedNumber('jumping_game_best_altitude', 0);
  const [totalCoins, setTotalCoins] = useSavedNumber('jumping_game_total_coins', 0);
  const [skinId, setSkinId] = useSavedString<CharacterSkinId>('jumping_game_skin', 'classic_doodle');
  const [controlsLayout, setControlsLayout] = useSavedString<ControlsLayout>('jumping_game_controls', 'standard');
  const [soundEnabled, setSoundEnabled] = useSavedBoolean('jumping_game_sound', true);

  // Modals
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showSkinModal, setShowSkinModal] = useState(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);

  // Sync sound engine whenever sound preference changes
  useEffect(() => {
    sounds.setEnabled(soundEnabled);
  }, [soundEnabled]);

  // Handle Score Updates from Canvas
  const handleScoreUpdate = useCallback((newScore: number, newAltitude: number, newCoins: number, newCombo: number) => {
    setScore(newScore);
    setAltitude(newAltitude);
    setCoins(newCoins);
    setCombo(newCombo);

    setBestAltitude(prev => (newAltitude > prev ? newAltitude : prev));
  }, [setBestAltitude]);

  // Handle Game Over
  const handleGameOver = useCallback((finalScore: number, finalAltitude: number, finalCoins: number, defeatedBy?: MonsterType | null) => {
    setScore(finalScore);
    setAltitude(finalAltitude);
    setCoins(finalCoins);
    setDefeatedByMonster(defeatedBy || null);
    setIsGameOver(true);

    setTotalCoins(prev => prev + finalCoins);

    setHighScore(prev => {
      if (finalScore > prev) {
        setIsNewHigh(true);
        return finalScore;
      } else {
        setIsNewHigh(false);
        return prev;
      }
    });
  }, [setTotalCoins, setHighScore]);

  // Restart Game
  const handleRestart = () => {
    setIsGameOver(false);
    setIsNewHigh(false);
    setIsPaused(false);
    setDefeatedByMonster(null);
    // Trigger reset in GameCanvas
    const resetBtn = document.getElementById('internal-reset-btn');
    if (resetBtn) {
      resetBtn.click();
    }
  };

  // Launch Game from Start Screen
  const handlePlayFromStart = () => {
    setCurrentScreen('game');
    handleRestart();
  };

  // Return to Menu / Start Screen
  const handleReturnToMenu = () => {
    setIsGameOver(false);
    setIsPaused(false);
    setDefeatedByMonster(null);
    setCurrentScreen('start');
  };

  // Toggle Sound
  const handleToggleSound = () => {
    const newState = sounds.toggleSound();
    setSoundEnabled(newState);
  };

  // Toggle Controls Layout (Standard [A=Left, D=Right] vs Inverted [D=Left, A=Right])
  const handleToggleControls = () => {
    const nextLayout: ControlsLayout = controlsLayout === 'inverted' ? 'standard' : 'inverted';
    setControlsLayout(nextLayout);
  };

  // Select Skin
  const handleSelectSkin = (id: CharacterSkinId) => {
    setSkinId(id);
  };

  return (
    <main
      id="jumping-game-app"
      className="min-h-screen bg-gradient-to-b from-[#111827] via-[#0f172a] to-[#111827] flex flex-col items-center justify-center p-2 sm:p-4 text-slate-100 selection:bg-amber-400 selection:text-slate-950"
    >
      {/* Screen 1: Start Screen matching home-screen1.jpg */}
      {currentScreen === 'start' ? (
        <div className="w-full flex justify-center animate-in fade-in zoom-in-95 duration-200">
          <StartScreen
            currentSkin={skinId}
            highScore={highScore}
            soundEnabled={soundEnabled}
            controlsLayout={controlsLayout}
            onPlay={handlePlayFromStart}
            onOpenLeaderboard={() => setShowLeaderboardModal(true)}
            onOpenSkins={() => setShowSkinModal(true)}
            onOpenHelp={() => setShowHelpModal(true)}
            onToggleSound={handleToggleSound}
            onToggleControls={handleToggleControls}
          />
        </div>
      ) : (
        /* Screen 2: Active Game Screen */
        <div className="w-full max-w-[480px] flex flex-col items-center animate-in fade-in duration-200">
          {/* HUD */}
          <GameHUD
            score={score}
            altitude={altitude}
            coins={coins}
            combo={combo}
            highScore={highScore}
            soundEnabled={soundEnabled}
            onToggleSound={handleToggleSound}
            controlsLayout={controlsLayout}
            onToggleControls={handleToggleControls}
            isPaused={isPaused}
            onTogglePause={() => setIsPaused(p => !p)}
            onOpenHelp={() => setShowHelpModal(true)}
            onOpenSkins={() => setShowSkinModal(true)}
            currentSkin={skinId}
            onReturnHome={handleReturnToMenu}
            onOpenLeaderboard={() => setShowLeaderboardModal(true)}
          />

          {/* Canvas Game Stage */}
          <GameCanvas
            skinId={skinId}
            controlsLayout={controlsLayout}
            soundEnabled={soundEnabled}
            onGameOver={handleGameOver}
            onScoreUpdate={handleScoreUpdate}
            onToggleSound={handleToggleSound}
            onToggleControls={handleToggleControls}
            onOpenHelp={() => setShowHelpModal(true)}
            onOpenSkins={() => setShowSkinModal(true)}
            isPaused={isPaused}
            setIsPaused={setIsPaused}
          />

          {/* Quick Controls Cheat Sheet Footer */}
          <div className="mt-3 text-center text-[12px] text-slate-400 font-mono flex items-center justify-center gap-3 flex-wrap px-2">
            <span>
              <strong className="text-emerald-400">Jump:</strong> W / Space / ↑ / Click
            </span>
            <span>•</span>
            <span>
              <strong className="text-amber-400">Left:</strong> {controlsLayout === 'user' ? 'D / ←' : 'A / ←'}
            </span>
            <span>•</span>
            <span>
              <strong className="text-amber-400">Right:</strong> {controlsLayout === 'user' ? 'A / →' : 'D / →'}
            </span>
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      {isGameOver && (
        <GameOverModal
          score={score}
          altitude={altitude}
          coins={coins}
          highScore={highScore}
          isNewHigh={isNewHigh}
          onRestart={handleRestart}
          onReturnToMenu={handleReturnToMenu}
          currentSkin={skinId}
          defeatedBy={defeatedByMonster}
        />
      )}

      {/* Character Select Modal */}
      {showSkinModal && (
        <CharacterSelectModal
          currentSkin={skinId}
          onSelectSkin={handleSelectSkin}
          onClose={() => setShowSkinModal(false)}
        />
      )}

      {/* Leaderboard Modal */}
      {showLeaderboardModal && (
        <LeaderboardModal
          highScore={highScore}
          bestAltitude={bestAltitude}
          totalCoins={totalCoins}
          onClose={() => setShowLeaderboardModal(false)}
          onPlay={() => {
            setShowLeaderboardModal(false);
            handlePlayFromStart();
          }}
        />
      )}

      {/* How to Play / Help Modal */}
      {showHelpModal && (
        <ControlsHelpModal
          controlsLayout={controlsLayout}
          onClose={() => setShowHelpModal(false)}
        />
      )}
    </main>
  );
}
