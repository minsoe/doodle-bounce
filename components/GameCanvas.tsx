'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Player, Platform, Collectible, Particle, CharacterSkinId, ControlsLayout } from '@/lib/game/types';
import { GameRenderer, FloatingText } from '@/lib/game/renderer';
import { sounds } from '@/lib/audio';

interface GameCanvasProps {
  skinId: CharacterSkinId;
  controlsLayout: ControlsLayout;
  soundEnabled: boolean;
  onGameOver: (finalScore: number, finalAltitude: number, coins: number) => void;
  onScoreUpdate: (score: number, altitude: number, coins: number, combo: number) => void;
  onToggleSound: () => void;
  onToggleControls: () => void;
  onOpenHelp: () => void;
  onOpenSkins: () => void;
  isPaused: boolean;
  setIsPaused: (val: boolean | ((prev: boolean) => boolean)) => void;
}

const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 720;
const GRAVITY = 0.42;
const JUMP_VELOCITY = -12.5;
const DOUBLE_JUMP_VELOCITY = -11.0;
const SPRING_VELOCITY = -19.5;
const ROCKET_VELOCITY = -17.0;
const MOVE_SPEED = 6.2;
const ACCELERATION = 0.85;
const FRICTION = 0.84;

export default function GameCanvas({
  skinId,
  controlsLayout,
  soundEnabled,
  onGameOver,
  onScoreUpdate,
  onToggleSound,
  onToggleControls,
  onOpenHelp,
  onOpenSkins,
  isPaused,
  setIsPaused,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Active key state refs for immediate 60fps loop response
  const keysPressed = useRef<{
    left: boolean;
    right: boolean;
    jump: boolean;
  }>({ left: false, right: false, jump: false });

  // Visual keys pressed state for UI HUD feedback
  const [activeControls, setActiveControls] = useState<{
    left: boolean;
    right: boolean;
    jump: boolean;
  }>({ left: false, right: false, jump: false });

  // Game internal state refs
  const gameStateRef = useRef<{
    isRunning: boolean;
    score: number;
    highestY: number;
    altitude: number;
    coinsCollected: number;
    combo: number;
    comboTimer: number;
    cameraY: number;
    screenShake: number;
    tick: number;
    nextPlatformY: number;
    platformIdCounter: number;
    collectibleIdCounter: number;
    particles: Particle[];
    floatingTexts: FloatingText[];
    platforms: Platform[];
    collectibles: Collectible[];
    player: Player;
  }>({
    isRunning: true,
    score: 0,
    highestY: 0,
    altitude: 0,
    coinsCollected: 0,
    combo: 0,
    comboTimer: 0,
    cameraY: 0,
    screenShake: 0,
    tick: 0,
    nextPlatformY: 0,
    platformIdCounter: 1,
    collectibleIdCounter: 1,
    particles: [],
    floatingTexts: [],
    platforms: [],
    collectibles: [],
    player: {
      x: CANVAS_WIDTH / 2 - 20,
      y: CANVAS_HEIGHT - 120,
      width: 38,
      height: 38,
      vx: 0,
      vy: JUMP_VELOCITY,
      facing: 'right',
      isGrounded: false,
      canDoubleJump: true,
      doubleJumpUsed: false,
      squashX: 1,
      squashY: 1,
      tiltAngle: 0,
      rocketTimer: 0,
      hasShield: false,
    },
  });

  // Reset/Initialize the game
  const resetGame = useCallback(() => {
    const startPlatforms: Platform[] = [
      // Base safety platform
      { id: 1, x: CANVAS_WIDTH / 2 - 60, y: CANVAS_HEIGHT - 60, width: 120, height: 16, type: 'standard', vx: 0 },
    ];

    // Generate initial platforms climbing up
    let curY = CANVAS_HEIGHT - 140;
    let pid = 2;
    const collectibles: Collectible[] = [];
    let cid = 1;

    while (curY > -1200) {
      const pWidth = Math.floor(Math.random() * 25) + 75; // 75 - 100px
      const px = Math.floor(Math.random() * (CANVAS_WIDTH - pWidth - 30)) + 15;
      
      const randType = Math.random();
      let type: Platform['type'] = 'standard';
      let vx = 0;
      let hasSpring = false;

      if (randType < 0.2) {
        type = 'moving';
        vx = (Math.random() > 0.5 ? 1 : -1) * (1.5 + Math.random() * 1.5);
      } else if (randType < 0.32) {
        type = 'crumbling';
      } else if (randType < 0.45) {
        hasSpring = true;
      }

      startPlatforms.push({
        id: pid++,
        x: px,
        y: curY,
        width: pWidth,
        height: 15,
        type,
        vx,
        hasSpring,
      });

      // Spawn coins / powerups
      if (Math.random() < 0.35) {
        const cType = Math.random() < 0.04 ? 'rocket' : Math.random() < 0.08 ? 'bubble' : Math.random() < 0.25 ? 'star' : 'coin';
        collectibles.push({
          id: cid++,
          x: px + pWidth / 2,
          y: curY - 24,
          type: cType,
          collected: false,
          floatOffset: Math.random() * Math.PI * 2,
          points: cType === 'star' ? 250 : cType === 'rocket' ? 100 : cType === 'bubble' ? 150 : 100,
        });
      }

      curY -= Math.floor(Math.random() * 35) + 65; // vertical gap 65 - 100
    }

    gameStateRef.current = {
      isRunning: true,
      score: 0,
      highestY: CANVAS_HEIGHT - 120,
      altitude: 0,
      coinsCollected: 0,
      combo: 0,
      comboTimer: 0,
      cameraY: 0,
      screenShake: 0,
      tick: 0,
      nextPlatformY: curY,
      platformIdCounter: pid,
      collectibleIdCounter: cid,
      particles: [],
      floatingTexts: [],
      platforms: startPlatforms,
      collectibles,
      player: {
        x: CANVAS_WIDTH / 2 - 19,
        y: CANVAS_HEIGHT - 120,
        width: 38,
        height: 38,
        vx: 0,
        vy: JUMP_VELOCITY,
        facing: 'right',
        isGrounded: false,
        canDoubleJump: true,
        doubleJumpUsed: false,
        squashX: 0.8,
        squashY: 1.25,
        tiltAngle: 0,
        rocketTimer: 0,
        hasShield: false,
      },
    };

    onScoreUpdate(0, 0, 0, 0);
  }, [onScoreUpdate]);

  useEffect(() => {
    resetGame();
  }, [resetGame]);

  // Particle creators
  const spawnJumpParticles = (x: number, y: number, color: string = '#ffffff') => {
    const p = gameStateRef.current.particles;
    for (let i = 0; i < 7; i++) {
      p.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 2 + 1,
        size: Math.random() * 3 + 2,
        color,
        alpha: 0.9,
        decay: 0.04,
      });
    }
  };

  const spawnSparkles = (x: number, y: number, color: string = '#facc15') => {
    const p = gameStateRef.current.particles;
    for (let i = 0; i < 10; i++) {
      p.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5,
        size: Math.random() * 4 + 2,
        color,
        alpha: 1,
        decay: 0.03,
        shape: 'star',
      });
    }
  };

  const addFloatingText = (text: string, x: number, y: number, color: string = '#facc15', scale: number = 1) => {
    gameStateRef.current.floatingTexts.push({
      id: Math.random(),
      text,
      x,
      y,
      vy: -1.8,
      color,
      alpha: 1,
      scale,
    });
  };

  // Trigger active jump (from W, Space, Up Arrow, or Mouse click)
  const triggerJumpAction = useCallback(() => {
    const state = gameStateRef.current;
    if (!state.isRunning) return;
    const player = state.player;

    // Check if player is on or very close to any platform below them
    let canBounceFromPlatform = false;
    for (const plat of state.platforms) {
      if (
        player.y + player.height >= plat.y - 12 &&
        player.y + player.height <= plat.y + 16 &&
        player.x + player.width > plat.x - 4 &&
        player.x < plat.x + plat.width + 4
      ) {
        canBounceFromPlatform = true;
        break;
      }
    }

    if (canBounceFromPlatform || player.isGrounded) {
      // High powered boost jump!
      player.vy = JUMP_VELOCITY * 1.15;
      player.squashX = 0.7;
      player.squashY = 1.35;
      player.canDoubleJump = true;
      player.doubleJumpUsed = false;
      sounds.playJump();
      spawnJumpParticles(player.x + player.width / 2, player.y + player.height, '#84cc16');
      addFloatingText('SUPER LEAP!', player.x + player.width / 2, player.y, '#4ade80', 1.1);
    } else if (player.canDoubleJump && !player.doubleJumpUsed && player.rocketTimer <= 0) {
      // Mid-air Double Jump / Air boost!
      player.vy = DOUBLE_JUMP_VELOCITY;
      player.doubleJumpUsed = true;
      player.canDoubleJump = false;
      player.squashX = 0.75;
      player.squashY = 1.3;
      sounds.playDoubleJump();
      spawnSparkles(player.x + player.width / 2, player.y + player.height, '#38bdf8');
      addFloatingText('AIR BOOST!', player.x + player.width / 2, player.y, '#38bdf8', 1.05);
    }
  }, []);

  // Keyboard controls handler with precision binding
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent browser scroll on arrow keys and space
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }

      if (e.code === 'KeyP' || e.code === 'Escape') {
        setIsPaused(p => !p);
        return;
      }

      // Jump Keys: W, Space bar, Up arrow
      if (e.code === 'KeyW' || e.code === 'Space' || e.code === 'ArrowUp') {
        keysPressed.current.jump = true;
        setActiveControls(prev => ({ ...prev, jump: true }));
        triggerJumpAction();
      }

      // Left & Right based on controlsLayout
      // User mode: Left = (D) (left arrow), Right = (A) (right arrow)
      // Standard mode: Left = (A) (left arrow), Right = (D) (right arrow)
      if (controlsLayout === 'user') {
        if (e.code === 'KeyD' || e.code === 'ArrowLeft') {
          keysPressed.current.left = true;
          setActiveControls(prev => ({ ...prev, left: true }));
        }
        if (e.code === 'KeyA' || e.code === 'ArrowRight') {
          keysPressed.current.right = true;
          setActiveControls(prev => ({ ...prev, right: true }));
        }
      } else {
        if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
          keysPressed.current.left = true;
          setActiveControls(prev => ({ ...prev, left: true }));
        }
        if (e.code === 'KeyD' || e.code === 'ArrowRight') {
          keysPressed.current.right = true;
          setActiveControls(prev => ({ ...prev, right: true }));
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'KeyW' || e.code === 'Space' || e.code === 'ArrowUp') {
        keysPressed.current.jump = false;
        setActiveControls(prev => ({ ...prev, jump: false }));
      }

      if (controlsLayout === 'user') {
        if (e.code === 'KeyD' || e.code === 'ArrowLeft') {
          keysPressed.current.left = false;
          setActiveControls(prev => ({ ...prev, left: false }));
        }
        if (e.code === 'KeyA' || e.code === 'ArrowRight') {
          keysPressed.current.right = false;
          setActiveControls(prev => ({ ...prev, right: false }));
        }
      } else {
        if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
          keysPressed.current.left = false;
          setActiveControls(prev => ({ ...prev, left: false }));
        }
        if (e.code === 'KeyD' || e.code === 'ArrowRight') {
          keysPressed.current.right = false;
          setActiveControls(prev => ({ ...prev, right: false }));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [controlsLayout, triggerJumpAction, setIsPaused]);

  // Canvas Mouse & Touch interaction
  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!gameStateRef.current.isRunning) return;

    // Jumping on click / tap anywhere!
    keysPressed.current.jump = true;
    setActiveControls(prev => ({ ...prev, jump: true }));
    triggerJumpAction();

    // Also steer towards pointer click position if clicked in left or right half
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
    const playerCenterX = gameStateRef.current.player.x + gameStateRef.current.player.width / 2;

    if (clickX < playerCenterX - 30) {
      keysPressed.current.left = true;
      setActiveControls(prev => ({ ...prev, left: true }));
    } else if (clickX > playerCenterX + 30) {
      keysPressed.current.right = true;
      setActiveControls(prev => ({ ...prev, right: true }));
    }
  };

  const handleCanvasPointerUp = () => {
    keysPressed.current.jump = false;
    keysPressed.current.left = false;
    keysPressed.current.right = false;
    setActiveControls({ jump: false, left: false, right: false });
  };

  // Main 60 FPS Game Loop
  useEffect(() => {
    let animationFrameId: number;

    const gameLoop = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const state = gameStateRef.current;

      if (!isPaused && state.isRunning) {
        state.tick++;
        const player = state.player;

        // 1. Horizontal Movement & Physics
        if (keysPressed.current.left && !keysPressed.current.right) {
          player.vx -= ACCELERATION;
          if (player.vx < -MOVE_SPEED) player.vx = -MOVE_SPEED;
          player.facing = 'left';
        } else if (keysPressed.current.right && !keysPressed.current.left) {
          player.vx += ACCELERATION;
          if (player.vx > MOVE_SPEED) player.vx = MOVE_SPEED;
          player.facing = 'right';
        } else {
          player.vx *= FRICTION;
          if (Math.abs(player.vx) < 0.1) player.vx = 0;
        }

        player.x += player.vx;

        // Screen Wrap (Seamless border looping)
        if (player.x + player.width < 0) {
          player.x = CANVAS_WIDTH;
        } else if (player.x > CANVAS_WIDTH) {
          player.x = -player.width;
        }

        // Tilt angle based on velocity
        player.tiltAngle = (player.vx / MOVE_SPEED) * 0.18;

        // 2. Vertical Movement & Gravity
        if (player.rocketTimer > 0) {
          player.rocketTimer--;
          player.vy = ROCKET_VELOCITY;
          if (state.tick % 3 === 0) {
            spawnJumpParticles(player.x + player.width / 2, player.y + player.height, '#f97316');
          }
        } else {
          player.vy += GRAVITY;
        }

        player.y += player.vy;

        // Squash and stretch decay back to 1
        player.squashX += (1 - player.squashX) * 0.15;
        player.squashY += (1 - player.squashY) * 0.15;

        // 3. Platform Collisions (Only while falling downwards)
        if (player.vy > 0 && player.rocketTimer <= 0) {
          for (const plat of state.platforms) {
            // Check if player's feet passed through platform's top edge this frame
            const prevY = player.y - player.vy;
            const feetY = player.y + player.height;
            const prevFeetY = prevY + player.height;

            if (
              feetY >= plat.y &&
              prevFeetY <= plat.y + 16 &&
              player.x + player.width * 0.8 > plat.x &&
              player.x + player.width * 0.2 < plat.x + plat.width
            ) {
              // Valid landing!
              if (plat.type === 'crumbling') {
                plat.isBroken = true;
                sounds.playBreak();
                spawnJumpParticles(plat.x + plat.width / 2, plat.y, '#94a3b8');
                state.screenShake = 3;
              }

              // Check if spring hit
              if (plat.hasSpring) {
                plat.springCompressTimer = 10;
                player.vy = SPRING_VELOCITY;
                player.squashX = 0.6;
                player.squashY = 1.45;
                sounds.playSpring();
                spawnSparkles(plat.x + plat.width / 2, plat.y - 5, '#ef4444');
                addFloatingText('SPRING BOING!', plat.x + plat.width / 2, plat.y - 15, '#f59e0b', 1.25);
                state.screenShake = 5;
              } else {
                // Regular bounce
                player.vy = JUMP_VELOCITY;
                player.squashX = 1.35;
                player.squashY = 0.7;
                sounds.playJump();
                spawnJumpParticles(player.x + player.width / 2, plat.y, '#84cc16');
              }

              // Refresh double jump
              player.canDoubleJump = true;
              player.doubleJumpUsed = false;

              // Increase combo
              state.combo++;
              state.comboTimer = 180;
              if (state.combo > 2 && state.combo % 3 === 0) {
                addFloatingText(`${state.combo}x COMBO!`, player.x + player.width / 2, player.y - 20, '#eab308', 1.2);
              }

              break;
            }
          }
        }

        // Combo timer decay
        if (state.comboTimer > 0) {
          state.comboTimer--;
          if (state.comboTimer === 0) {
            state.combo = 0;
          }
        }

        // 4. Update Platforms (Movement, Spring timers, Crumble)
        for (const plat of state.platforms) {
          if (plat.type === 'moving') {
            plat.x += plat.vx;
            if (plat.x < 10) {
              plat.x = 10;
              plat.vx = Math.abs(plat.vx);
            } else if (plat.x + plat.width > CANVAS_WIDTH - 10) {
              plat.x = CANVAS_WIDTH - 10 - plat.width;
              plat.vx = -Math.abs(plat.vx);
            }
          }
          if (plat.springCompressTimer && plat.springCompressTimer > 0) {
            plat.springCompressTimer--;
          }
          if (plat.isBroken) {
            plat.opacity = (plat.opacity ?? 1) - 0.08;
            plat.y += 2.5;
          }
        }

        // Filter out dissolved broken platforms
        state.platforms = state.platforms.filter(p => !p.isBroken || (p.opacity ?? 1) > 0.05);

        // 5. Collectibles Detection
        for (const c of state.collectibles) {
          if (!c.collected) {
            const dist = Math.hypot(
              player.x + player.width / 2 - c.x,
              player.y + player.height / 2 - c.y
            );
            if (dist < 32) {
              c.collected = true;
              if (c.type === 'rocket') {
                player.rocketTimer = 160; // ~2.5 seconds rocket flight
                sounds.playRocket();
                addFloatingText('ROCKET BOOST!', c.x, c.y, '#f97316', 1.3);
                state.score += 500;
              } else if (c.type === 'bubble') {
                player.hasShield = true;
                sounds.playCoin(3);
                addFloatingText('SAFETY BUBBLE!', c.x, c.y, '#38bdf8', 1.2);
                state.score += 300;
              } else {
                state.coinsCollected++;
                state.score += c.points;
                sounds.playCoin(state.coinsCollected % 6);
                spawnSparkles(c.x, c.y, c.type === 'star' ? '#facc15' : '#f59e0b');
                addFloatingText(`+${c.points}`, c.x, c.y, '#facc15', 1.1);
              }
            }
          }
        }

        // 6. Camera Follow (Scrolls up as player ascends)
        const targetCameraY = player.y - CANVAS_HEIGHT * 0.45;
        if (targetCameraY < state.cameraY) {
          state.cameraY += (targetCameraY - state.cameraY) * 0.2;
        }

        // Calculate altitude and altitude score
        const curAltitude = Math.max(0, Math.floor(-player.y / 10));
        if (curAltitude > state.altitude) {
          const diff = curAltitude - state.altitude;
          state.altitude = curAltitude;
          state.score += diff * 2;
        }

        // 7. Procedural Platform Generation above camera
        const topVisibleY = state.cameraY - 150;
        while (state.nextPlatformY > topVisibleY) {
          const pWidth = Math.max(65, Math.floor(Math.random() * 30) + 70 - Math.min(25, state.altitude * 0.02));
          const px = Math.floor(Math.random() * (CANVAS_WIDTH - pWidth - 30)) + 15;

          const rand = Math.random();
          let type: Platform['type'] = 'standard';
          let vx = 0;
          let hasSpring = false;

          // Higher altitude increases moving and crumbling platforms
          const movingChance = Math.min(0.4, 0.15 + state.altitude * 0.0003);
          const crumblingChance = Math.min(0.3, 0.1 + state.altitude * 0.0002);

          if (rand < movingChance) {
            type = 'moving';
            vx = (Math.random() > 0.5 ? 1 : -1) * (1.6 + Math.random() * 1.6);
          } else if (rand < movingChance + crumblingChance) {
            type = 'crumbling';
          } else if (rand < movingChance + crumblingChance + 0.18) {
            hasSpring = true;
          }

          state.platforms.push({
            id: state.platformIdCounter++,
            x: px,
            y: state.nextPlatformY,
            width: pWidth,
            height: 15,
            type,
            vx,
            hasSpring,
          });

          // Spawn collectible on top of some platforms
          if (Math.random() < 0.32) {
            const randC = Math.random();
            const cType = randC < 0.04 ? 'rocket' : randC < 0.08 ? 'bubble' : randC < 0.25 ? 'star' : 'coin';
            state.collectibles.push({
              id: state.collectibleIdCounter++,
              x: px + pWidth / 2,
              y: state.nextPlatformY - 24,
              type: cType,
              collected: false,
              floatOffset: Math.random() * Math.PI * 2,
              points: cType === 'star' ? 250 : cType === 'rocket' ? 100 : cType === 'bubble' ? 150 : 100,
            });
          }

          const gap = Math.min(115, Math.floor(Math.random() * 30) + 70 + state.altitude * 0.01);
          state.nextPlatformY -= gap;
        }

        // Cleanup offscreen platforms & collectibles below bottom of camera
        const bottomCleanupY = state.cameraY + CANVAS_HEIGHT + 100;
        state.platforms = state.platforms.filter(p => p.y < bottomCleanupY);
        state.collectibles = state.collectibles.filter(c => c.y < bottomCleanupY);

        // 8. Update Particles & Floating Text
        for (const p of state.particles) {
          p.x += p.vx;
          p.y += p.vy;
          p.alpha -= p.decay;
        }
        state.particles = state.particles.filter(p => p.alpha > 0);

        for (const t of state.floatingTexts) {
          t.y += t.vy;
          t.alpha -= 0.025;
        }
        state.floatingTexts = state.floatingTexts.filter(t => t.alpha > 0);

        // 9. Fall & Game Over Check
        if (player.y > state.cameraY + CANVAS_HEIGHT + 60) {
          if (player.hasShield) {
            // Bubble saves the player!
            player.hasShield = false;
            player.vy = JUMP_VELOCITY * 1.4;
            player.y = state.cameraY + CANVAS_HEIGHT - 100;
            sounds.playSpring();
            addFloatingText('SHIELD SAVED YOU!', player.x + player.width / 2, player.y - 20, '#38bdf8', 1.3);
            spawnSparkles(player.x + player.width / 2, player.y, '#38bdf8');
          } else {
            // Game Over
            state.isRunning = false;
            sounds.playGameOver();
            onGameOver(state.score, state.altitude, state.coinsCollected);
          }
        }

        // Screen shake decay
        if (state.screenShake > 0) {
          state.screenShake *= 0.85;
          if (state.screenShake < 0.1) state.screenShake = 0;
        }

        // Push score updates up to HUD
        onScoreUpdate(state.score, state.altitude, state.coinsCollected, state.combo);
      }

      // 10. RENDER
      ctx.save();
      if (state.screenShake > 0) {
        const shakeX = (Math.random() - 0.5) * state.screenShake * 3;
        const shakeY = (Math.random() - 0.5) * state.screenShake * 3;
        ctx.translate(shakeX, shakeY);
      }

      // Background
      GameRenderer.drawBackground(ctx, CANVAS_WIDTH, CANVAS_HEIGHT, state.cameraY);

      // Platforms
      for (const plat of state.platforms) {
        GameRenderer.drawPlatform(ctx, plat, state.cameraY);
      }

      // Collectibles
      for (const item of state.collectibles) {
        GameRenderer.drawCollectible(ctx, item, state.cameraY, state.tick);
      }

      // Particles
      GameRenderer.drawParticles(ctx, state.particles, state.cameraY);

      // Player
      GameRenderer.drawPlayer(ctx, state.player, state.cameraY, skinId, state.tick);

      // Floating Texts
      GameRenderer.drawFloatingTexts(ctx, state.floatingTexts, state.cameraY);

      ctx.restore();

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPaused, skinId, onGameOver, onScoreUpdate]);

  // Touch virtual buttons handlers
  const handleVirtualLeft = (active: boolean) => {
    keysPressed.current.left = active;
    setActiveControls(prev => ({ ...prev, left: active }));
  };

  const handleVirtualRight = (active: boolean) => {
    keysPressed.current.right = active;
    setActiveControls(prev => ({ ...prev, right: active }));
  };

  const handleVirtualJump = () => {
    keysPressed.current.jump = true;
    setActiveControls(prev => ({ ...prev, jump: true }));
    triggerJumpAction();
    setTimeout(() => {
      keysPressed.current.jump = false;
      setActiveControls(prev => ({ ...prev, jump: false }));
    }, 150);
  };

  return (
    <div id="game-container" className="relative flex flex-col items-center justify-center select-none">
      {/* Canvas Wrapper */}
      <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-slate-700 bg-slate-900">
        <canvas
          id="jumping-game-canvas"
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onPointerDown={handleCanvasPointerDown}
          onPointerUp={handleCanvasPointerUp}
          className="cursor-pointer touch-none block"
          style={{ width: '100%', maxWidth: '440px', height: 'auto', aspectRatio: `${CANVAS_WIDTH}/${CANVAS_HEIGHT}` }}
        />

        {/* Live Keypress Feedback Indicator Badge overlay in top-right */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-slate-700/60 text-xs font-mono shadow-md pointer-events-none">
          <span
            className={`px-1.5 py-0.5 rounded transition-colors ${
              activeControls.left ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'
            }`}
          >
            {controlsLayout === 'user' ? 'D' : 'A'} ←
          </span>
          <span
            className={`px-1.5 py-0.5 rounded transition-colors ${
              activeControls.jump ? 'bg-emerald-400 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'
            }`}
          >
            W / Space ↑
          </span>
          <span
            className={`px-1.5 py-0.5 rounded transition-colors ${
              activeControls.right ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'
            }`}
          >
            {controlsLayout === 'user' ? 'A' : 'D'} →
          </span>
        </div>

        {/* Pause Overlay */}
        {isPaused && (
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-white z-20">
            <h2 className="text-3xl font-bold mb-3 tracking-wide">PAUSED</h2>
            <p className="text-sm text-slate-300 mb-6 text-center max-w-xs">
              Take a breath! Press <span className="font-mono bg-slate-800 px-2 py-0.5 rounded">P</span> or click Resume to continue jumping.
            </p>
            <button
              id="resume-btn"
              onClick={() => setIsPaused(false)}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold rounded-xl shadow-lg transition-all"
            >
              Resume Game
            </button>
          </div>
        )}
      </div>

      {/* On-screen tactile arcade controls for mobile or mouse clicking */}
      <div className="w-full max-w-[440px] mt-3 flex items-center justify-between gap-3 px-2">
        <button
          id="touch-left-btn"
          onPointerDown={() => handleVirtualLeft(true)}
          onPointerUp={() => handleVirtualLeft(false)}
          onPointerLeave={() => handleVirtualLeft(false)}
          className={`flex-1 flex flex-col items-center justify-center py-3 rounded-xl border-2 transition-all active:scale-95 shadow-md ${
            activeControls.left
              ? 'bg-amber-400 border-amber-300 text-slate-950 font-bold shadow-amber-400/20'
              : 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-200'
          }`}
        >
          <span className="text-lg">◀</span>
          <span className="text-[11px] font-mono mt-0.5">
            LEFT ({controlsLayout === 'user' ? 'D' : 'A'})
          </span>
        </button>

        <button
          id="touch-jump-btn"
          onPointerDown={handleVirtualJump}
          className={`flex-[1.4] flex flex-col items-center justify-center py-3 rounded-xl border-2 transition-all active:scale-95 shadow-md ${
            activeControls.jump
              ? 'bg-emerald-400 border-emerald-300 text-slate-950 font-bold shadow-emerald-400/20'
              : 'bg-emerald-600 hover:bg-emerald-500 border-emerald-400 text-white font-semibold'
          }`}
        >
          <span className="text-lg font-bold">▲</span>
          <span className="text-[11px] font-mono mt-0.5">JUMP (W / Space / Click)</span>
        </button>

        <button
          id="touch-right-btn"
          onPointerDown={() => handleVirtualRight(true)}
          onPointerUp={() => handleVirtualRight(false)}
          onPointerLeave={() => handleVirtualRight(false)}
          className={`flex-1 flex flex-col items-center justify-center py-3 rounded-xl border-2 transition-all active:scale-95 shadow-md ${
            activeControls.right
              ? 'bg-amber-400 border-amber-300 text-slate-950 font-bold shadow-amber-400/20'
              : 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-200'
          }`}
        >
          <span className="text-lg">▶</span>
          <span className="text-[11px] font-mono mt-0.5">
            RIGHT ({controlsLayout === 'user' ? 'A' : 'D'})
          </span>
        </button>
      </div>

      {/* Quick Restart trigger ref export */}
      <button
        id="internal-reset-btn"
        className="hidden"
        onClick={resetGame}
      />
    </div>
  );
}
