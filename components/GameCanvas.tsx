'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Player, Platform, Collectible, Particle, CharacterSkinId, ControlsLayout, Monster, MonsterType, Bullet } from '@/lib/game/types';
import { GameRenderer, FloatingText } from '@/lib/game/renderer';
import { sounds } from '@/lib/audio';

interface GameCanvasProps {
  skinId: CharacterSkinId;
  controlsLayout: ControlsLayout;
  soundEnabled: boolean;
  onGameOver: (finalScore: number, finalAltitude: number, coins: number, defeatedBy?: MonsterType | null) => void;
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

  // Mouse aim position tracker
  const mousePosRef = useRef<{ x: number; y: number }>({
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT * 0.25,
  });

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
    lastMonsterSpawnY: number;
    platformIdCounter: number;
    collectibleIdCounter: number;
    monsterIdCounter: number;
    bulletIdCounter: number;
    shotsRemaining: number;
    cooldownFrames: number;
    maxShots: number;
    maxCooldownFrames: number;
    particles: Particle[];
    floatingTexts: FloatingText[];
    platforms: Platform[];
    collectibles: Collectible[];
    monsters: Monster[];
    bullets: Bullet[];
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
    lastMonsterSpawnY: CANVAS_HEIGHT - 380,
    platformIdCounter: 1,
    collectibleIdCounter: 1,
    monsterIdCounter: 1,
    bulletIdCounter: 1,
    shotsRemaining: 6,
    cooldownFrames: 0,
    maxShots: 6,
    maxCooldownFrames: 120, // 2 seconds at 60fps
    particles: [],
    floatingTexts: [],
    platforms: [],
    collectibles: [],
    monsters: [],
    bullets: [],
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
      isDying: false,
      shootRecoilTimer: 0,
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
    const initialMonsters: Monster[] = [];
    let mid = 1;
    let lastMonY = CANVAS_HEIGHT - 350;

    while (curY > -1200) {
      // Check if we should spawn a monster at this tier (starts appearing after player climbs a bit)
      const shouldSpawnMonster = curY < CANVAS_HEIGHT - 360 && curY < lastMonY - 170 && Math.random() < 0.35;

      if (shouldSpawnMonster) {
        lastMonY = curY;
        const monsterPool: MonsterType[] = ['green', 'red', 'blue'];
        const monsterType = monsterPool[(mid - 1) % monsterPool.length];

        if (monsterType === 'red') {
          // RED MONSTER: Moves between two still platforms!
          // Spawn Platform 1 (still, on left)
          startPlatforms.push({
            id: pid++,
            x: 20,
            y: curY,
            width: 75,
            height: 15,
            type: 'standard',
            vx: 0,
          });

          // Spawn Platform 2 (still, on right)
          startPlatforms.push({
            id: pid++,
            x: CANVAS_WIDTH - 95,
            y: curY,
            width: 75,
            height: 15,
            type: 'standard',
            vx: 0,
          });

          // Red monster patrolling between these two still platforms
          const leftBound = 95;
          const rightBound = CANVAS_WIDTH - 95 - 42;
          initialMonsters.push({
            id: mid++,
            type: 'red',
            x: (leftBound + rightBound) / 2,
            y: curY - 24,
            width: 42,
            height: 42,
            vx: 2.3,
            vy: 0,
            patrolLeftX: leftBound,
            patrolRightX: rightBound,
            facing: 'right',
            animationTimer: 0,
          });
        } else if (monsterType === 'green') {
          // GREEN MONSTER: Moving back and forth
          const pWidth = Math.floor(Math.random() * 25) + 75;
          const px = Math.floor(Math.random() * (CANVAS_WIDTH - pWidth - 30)) + 15;
          startPlatforms.push({
            id: pid++,
            x: px,
            y: curY,
            width: pWidth,
            height: 15,
            type: 'standard',
            vx: 0,
          });

          const mWidth = 44;
          initialMonsters.push({
            id: mid++,
            type: 'green',
            x: Math.floor(Math.random() * (CANVAS_WIDTH - mWidth - 80)) + 40,
            y: curY - 38,
            width: mWidth,
            height: 44,
            vx: (Math.random() > 0.5 ? 1 : -1) * 2.1,
            vy: 0,
            minX: 25,
            maxX: CANVAS_WIDTH - mWidth - 25,
            facing: 'right',
            animationTimer: 0,
          });
        } else {
          // BLUE MONSTER: Flying around
          const pWidth = Math.floor(Math.random() * 25) + 75;
          const px = Math.floor(Math.random() * (CANVAS_WIDTH - pWidth - 30)) + 15;
          startPlatforms.push({
            id: pid++,
            x: px,
            y: curY,
            width: pWidth,
            height: 15,
            type: 'standard',
            vx: 0,
          });

          initialMonsters.push({
            id: mid++,
            type: 'blue',
            x: CANVAS_WIDTH / 2 - 19,
            y: curY - 45,
            width: 38,
            height: 44,
            vx: 0,
            vy: 0,
            flyCenterX: Math.floor(Math.random() * (CANVAS_WIDTH - 180)) + 90,
            flyCenterY: curY - 45,
            flyRadiusX: 60 + Math.random() * 30,
            flyRadiusY: 24 + Math.random() * 18,
            flyAngle: Math.random() * Math.PI * 2,
            flySpeed: 0.034,
            facing: 'right',
            animationTimer: 0,
          });
        }
      } else {
        // Normal platform generation
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
      lastMonsterSpawnY: lastMonY,
      platformIdCounter: pid,
      collectibleIdCounter: cid,
      monsterIdCounter: mid,
      bulletIdCounter: 1,
      shotsRemaining: 6,
      cooldownFrames: 0,
      maxShots: 6,
      maxCooldownFrames: 120,
      particles: [],
      floatingTexts: [],
      platforms: startPlatforms,
      collectibles,
      monsters: initialMonsters,
      bullets: [],
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
        isDying: false,
        hitByMonster: null,
        shootRecoilTimer: 0,
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

  // Shoot = (W) (space bar) (up arrow) (mouse clicking)
  // The bullet is a black circle, comes out from the mouth, travels towards mouse pointer
  // After shooting 6 times, 2-second cooldown then can shoot again
  const triggerShootAction = useCallback((targetOverride?: { x: number; y: number }) => {
    const state = gameStateRef.current;
    if (!state.isRunning || state.player.isDying) return;

    // Check if in 2-second cooldown
    if (state.cooldownFrames > 0) {
      const secs = (state.cooldownFrames / 60).toFixed(1);
      addFloatingText(`RELOADING (${secs}s)`, state.player.x + state.player.width / 2, state.player.y - 15, '#ef4444', 0.95);
      return;
    }

    if (state.shotsRemaining <= 0) {
      state.cooldownFrames = state.maxCooldownFrames;
      return;
    }

    const player = state.player;
    // Character will shoot where the mouse pointer is
    const targetScreen = targetOverride || mousePosRef.current;
    const targetWorldX = targetScreen.x;
    const targetWorldY = targetScreen.y + state.cameraY;

    // Orient character facing toward target
    const pCenterX = player.x + player.width / 2;
    const pCenterY = player.y + player.height / 2;
    if (targetWorldX < pCenterX - 5) {
      player.facing = 'left';
    } else if (targetWorldX > pCenterX + 5) {
      player.facing = 'right';
    }

    // The bullet will come out from the mouth
    const snoutDistX = player.width * 0.3 + 15;
    const mouthX = pCenterX + (player.facing === 'left' ? -snoutDistX : snoutDistX);
    const mouthY = pCenterY - player.height * 0.04;

    // Calculate trajectory towards pointer
    let dx = targetWorldX - mouthX;
    let dy = targetWorldY - mouthY;
    let dist = Math.hypot(dx, dy);
    if (dist < 0.001) {
      dx = 0;
      dy = -1;
      dist = 1;
    }

    const bulletSpeed = 15;
    const vx = (dx / dist) * bulletSpeed;
    const vy = (dy / dist) * bulletSpeed;

    // The bullet is a black circle
    state.bullets.push({
      id: state.bulletIdCounter++,
      x: mouthX,
      y: mouthY,
      vx,
      vy,
      radius: 5.5,
      active: true,
      distanceTraveled: 0,
      maxDistance: 1300,
    });

    // Sound effect
    sounds.playShoot();

    // Trigger visual snout recoil puff on player
    player.shootRecoilTimer = 8;
    state.screenShake = Math.max(state.screenShake, 2);

    // After shooting 6 times, cooldown for 2 seconds
    state.shotsRemaining -= 1;
    if (state.shotsRemaining <= 0) {
      state.cooldownFrames = state.maxCooldownFrames; // 120 frames = 2.0s
      addFloatingText('RELOADING (2s)...', player.x + player.width / 2, player.y - 15, '#ef4444', 1.05);
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

      // Shoot Keys: (W) (space bar) (up arrow)
      if (e.code === 'KeyW' || e.code === 'Space' || e.code === 'ArrowUp') {
        keysPressed.current.jump = true;
        setActiveControls(prev => ({ ...prev, jump: true }));
        triggerShootAction();
      }

      // Left & Right:
      // Default / Standard: Left = (A) (left arrow), Right = (D) (right arrow)
      // Inverted mode: Left = (D) (left arrow), Right = (A) (right arrow)
      if (controlsLayout === 'inverted') {
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

      if (controlsLayout === 'inverted') {
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
  }, [controlsLayout, triggerShootAction, setIsPaused]);

  // Canvas Mouse & Touch interaction: Mouse pointer is strictly for aiming and shooting
  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!gameStateRef.current.isRunning || gameStateRef.current.player.isDying) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
    const clickY = ((e.clientY - rect.top) / rect.height) * CANVAS_HEIGHT;
    mousePosRef.current = { x: clickX, y: clickY };

    // Shoot = mouse clicking! Mouse pointer is to aim to shoot.
    // Movement is controlled purely by keys (A/D or Arrow keys)
    keysPressed.current.jump = true;
    setActiveControls(prev => ({ ...prev, jump: true }));
    triggerShootAction({ x: clickX, y: clickY });
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
    const y = ((e.clientY - rect.top) / rect.height) * CANVAS_HEIGHT;
    mousePosRef.current = { x, y };
  };

  const handleCanvasPointerUp = () => {
    keysPressed.current.jump = false;
    setActiveControls(prev => ({ ...prev, jump: false }));
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
        if (player.isDying) {
          // Controls disabled when dying; keep falling momentum and spin
          player.vx *= 0.98;
          player.tiltAngle += (player.vx < 0 ? -0.22 : 0.22);
        } else if (keysPressed.current.left && !keysPressed.current.right) {
          player.vx -= ACCELERATION;
          if (player.vx < -MOVE_SPEED) player.vx = -MOVE_SPEED;
          player.facing = 'left';
          player.tiltAngle = (player.vx / MOVE_SPEED) * 0.18;
        } else if (keysPressed.current.right && !keysPressed.current.left) {
          player.vx += ACCELERATION;
          if (player.vx > MOVE_SPEED) player.vx = MOVE_SPEED;
          player.facing = 'right';
          player.tiltAngle = (player.vx / MOVE_SPEED) * 0.18;
        } else {
          player.vx *= FRICTION;
          if (Math.abs(player.vx) < 0.1) player.vx = 0;
          player.tiltAngle = (player.vx / MOVE_SPEED) * 0.18;
        }

        player.x += player.vx;

        // Screen Wrap (Seamless border looping - only while alive)
        if (!player.isDying) {
          if (player.x + player.width < 0) {
            player.x = CANVAS_WIDTH;
          } else if (player.x > CANVAS_WIDTH) {
            player.x = -player.width;
          }
        }

        // 2. Vertical Movement & Gravity
        if (player.isDying) {
          // Accelerate downwards straight through all platforms
          player.vy = Math.min(22, player.vy + GRAVITY * 1.35);
        } else if (player.rocketTimer > 0) {
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

        // 3. Platform Collisions (Only while falling downwards and NOT dying)
        if (!player.isDying && player.vy > 0 && player.rocketTimer <= 0) {
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

        // 5. Update Monsters (Autonomous movements; None follow the character!)
        for (const m of state.monsters) {
          m.animationTimer++;
          if (m.type === 'green') {
            // Green monster: moves back and forth horizontally
            m.x += m.vx;
            const minX = m.minX ?? 25;
            const maxX = m.maxX ?? (CANVAS_WIDTH - m.width - 25);
            if (m.x <= minX) {
              m.x = minX;
              m.vx = Math.abs(m.vx);
              m.facing = 'right';
            } else if (m.x >= maxX) {
              m.x = maxX;
              m.vx = -Math.abs(m.vx);
              m.facing = 'left';
            }
          } else if (m.type === 'red') {
            // Red monster: moves between two still platforms
            m.x += m.vx;
            const leftBound = m.patrolLeftX ?? 95;
            const rightBound = m.patrolRightX ?? (CANVAS_WIDTH - 95 - m.width);
            if (m.x <= leftBound) {
              m.x = leftBound;
              m.vx = Math.abs(m.vx);
              m.facing = 'right';
            } else if (m.x >= rightBound) {
              m.x = rightBound;
              m.vx = -Math.abs(m.vx);
              m.facing = 'left';
            }
          } else if (m.type === 'blue') {
            // Blue monster: flying around
            m.flyAngle = (m.flyAngle ?? 0) + (m.flySpeed ?? 0.035);
            const cx = m.flyCenterX ?? (CANVAS_WIDTH / 2);
            const cy = m.flyCenterY ?? m.y;
            const rx = m.flyRadiusX ?? 65;
            const ry = m.flyRadiusY ?? 28;
            m.x = cx + Math.cos(m.flyAngle) * rx;
            m.y = cy + Math.sin(m.flyAngle * 1.6) * ry;
            m.facing = Math.cos(m.flyAngle) >= 0 ? 'right' : 'left';
          }
        }

        // 5.5 Bullets Update & Monster Hit Collision
        // Cooldown timer update
        if (state.cooldownFrames > 0) {
          state.cooldownFrames--;
          if (state.cooldownFrames === 0) {
            state.shotsRemaining = state.maxShots;
            sounds.playReload();
            addFloatingText('6 SHOTS READY!', player.x + player.width / 2, player.y - 18, '#22c55e', 1.15);
          }
        }

        // Decay snout recoil puff
        if (player.shootRecoilTimer && player.shootRecoilTimer > 0) {
          player.shootRecoilTimer--;
        }

        // Move bullets
        for (const b of state.bullets) {
          if (!b.active) continue;
          b.x += b.vx;
          b.y += b.vy;
          b.distanceTraveled += Math.hypot(b.vx, b.vy);

          if (
            b.distanceTraveled > b.maxDistance ||
            b.y < state.cameraY - 200 ||
            b.y > state.cameraY + CANVAS_HEIGHT + 150 ||
            b.x < -80 ||
            b.x > CANVAS_WIDTH + 80
          ) {
            b.active = false;
          }
        }

        // Collision: "If the bullet hit any monster, the monster will disappear."
        for (const b of state.bullets) {
          if (!b.active) continue;
          for (let mi = state.monsters.length - 1; mi >= 0; mi--) {
            const m = state.monsters[mi];
            const mcx = m.x + m.width / 2;
            const mcy = m.y + m.height / 2;
            const dx = b.x - mcx;
            const dy = b.y - mcy;
            const dist = Math.hypot(dx, dy);
            const hitDistance = b.radius + Math.min(m.width, m.height) * 0.48;

            if (dist < hitDistance) {
              // Direct hit! The bullet hits the monster
              b.active = false;
              // The monster will disappear
              state.monsters.splice(mi, 1);

              sounds.playMonsterDefeated();
              state.score += 300;

              const mColor = m.type === 'green' ? '#22c55e' : m.type === 'blue' ? '#3b82f6' : '#ef4444';
              spawnSparkles(mcx, mcy, mColor);
              spawnJumpParticles(mcx, mcy, '#0f172a');
              addFloatingText('+300 SPLAT!', mcx, mcy - 12, '#22c55e', 1.25);
              state.screenShake = Math.max(state.screenShake, 6);
              break;
            }
          }
        }
        state.bullets = state.bullets.filter(b => b.active);

        // 6. Monster Collisions with Character
        // If any monster hits character, the character falls down and dies!
        if (!player.isDying) {
          const pCenterX = player.x + player.width / 2;
          const pCenterY = player.y + player.height / 2;

          for (const m of state.monsters) {
            const mCenterX = m.x + m.width / 2;
            const mCenterY = m.y + m.height / 2;
            const dx = pCenterX - mCenterX;
            const dy = pCenterY - mCenterY;
            const distSq = dx * dx + dy * dy;
            const hitRadius = (player.width * 0.38) + (m.width * 0.38);

            if (distSq < hitRadius * hitRadius) {
              // FATAL HIT! Character knocked down to fall and die
              player.isDying = true;
              player.hitByMonster = m.type;
              player.hasShield = false;
              player.rocketTimer = 0;
              player.vy = 4.5; // Immediately plummet downward
              player.vx = player.x < m.x ? -3.5 : 3.5;

              state.screenShake = 16;
              sounds.playMonsterHit();

              const mColor = m.type === 'green' ? '#22c55e' : m.type === 'blue' ? '#3b82f6' : '#ef4444';
              const mName = m.type === 'green' ? 'GREEN MONSTER' : m.type === 'blue' ? 'BLUE MONSTER' : 'RED MONSTER';

              spawnSparkles(pCenterX, pCenterY, mColor);
              spawnJumpParticles(pCenterX, pCenterY, '#ef4444');
              addFloatingText(`OUCH! ${mName}!`, pCenterX, pCenterY - 25, '#ef4444', 1.35);
              break;
            }
          }
        }

        // 7. Collectibles Detection (Only while alive)
        if (!player.isDying) {
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
        }

        // 8. Camera Follow (Scrolls up as player ascends)
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

        // 9. Procedural Platform & Monster Generation above camera
        const topVisibleY = state.cameraY - 150;
        while (state.nextPlatformY > topVisibleY) {
          const shouldSpawnMonster = state.nextPlatformY < state.lastMonsterSpawnY - 160 && Math.random() < 0.35;

          if (shouldSpawnMonster) {
            state.lastMonsterSpawnY = state.nextPlatformY;
            const monsterPool: MonsterType[] = ['green', 'red', 'blue'];
            const monsterType = monsterPool[(state.monsterIdCounter - 1) % monsterPool.length];

            if (monsterType === 'red') {
              // RED MONSTER: Moving between two still platforms!
              // Platform 1 (still)
              state.platforms.push({
                id: state.platformIdCounter++,
                x: 20,
                y: state.nextPlatformY,
                width: 75,
                height: 15,
                type: 'standard',
                vx: 0,
              });

              // Platform 2 (still)
              state.platforms.push({
                id: state.platformIdCounter++,
                x: CANVAS_WIDTH - 95,
                y: state.nextPlatformY,
                width: 75,
                height: 15,
                type: 'standard',
                vx: 0,
              });

              // Red monster patrolling between the two still platforms
              const leftBound = 95;
              const rightBound = CANVAS_WIDTH - 95 - 42;
              state.monsters.push({
                id: state.monsterIdCounter++,
                type: 'red',
                x: (leftBound + rightBound) / 2,
                y: state.nextPlatformY - 24,
                width: 42,
                height: 42,
                vx: 2.3,
                vy: 0,
                patrolLeftX: leftBound,
                patrolRightX: rightBound,
                facing: 'right',
                animationTimer: 0,
              });
            } else if (monsterType === 'green') {
              // GREEN MONSTER: Moving back and forth
              const pWidth = Math.max(65, Math.floor(Math.random() * 30) + 70 - Math.min(25, state.altitude * 0.02));
              const px = Math.floor(Math.random() * (CANVAS_WIDTH - pWidth - 30)) + 15;
              state.platforms.push({
                id: state.platformIdCounter++,
                x: px,
                y: state.nextPlatformY,
                width: pWidth,
                height: 15,
                type: 'standard',
                vx: 0,
              });

              const mWidth = 44;
              state.monsters.push({
                id: state.monsterIdCounter++,
                type: 'green',
                x: Math.floor(Math.random() * (CANVAS_WIDTH - mWidth - 80)) + 40,
                y: state.nextPlatformY - 38,
                width: mWidth,
                height: 44,
                vx: (Math.random() > 0.5 ? 1 : -1) * 2.1,
                vy: 0,
                minX: 25,
                maxX: CANVAS_WIDTH - mWidth - 25,
                facing: 'right',
                animationTimer: 0,
              });
            } else {
              // BLUE MONSTER: Flying around
              const pWidth = Math.max(65, Math.floor(Math.random() * 30) + 70 - Math.min(25, state.altitude * 0.02));
              const px = Math.floor(Math.random() * (CANVAS_WIDTH - pWidth - 30)) + 15;
              state.platforms.push({
                id: state.platformIdCounter++,
                x: px,
                y: state.nextPlatformY,
                width: pWidth,
                height: 15,
                type: 'standard',
                vx: 0,
              });

              state.monsters.push({
                id: state.monsterIdCounter++,
                type: 'blue',
                x: CANVAS_WIDTH / 2 - 19,
                y: state.nextPlatformY - 45,
                width: 38,
                height: 44,
                vx: 0,
                vy: 0,
                flyCenterX: Math.floor(Math.random() * (CANVAS_WIDTH - 180)) + 90,
                flyCenterY: state.nextPlatformY - 45,
                flyRadiusX: 60 + Math.random() * 30,
                flyRadiusY: 24 + Math.random() * 18,
                flyAngle: Math.random() * Math.PI * 2,
                flySpeed: 0.034,
                facing: 'right',
                animationTimer: 0,
              });
            }
          } else {
            // Regular platform generation
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
          }

          const gap = Math.min(115, Math.floor(Math.random() * 30) + 70 + state.altitude * 0.01);
          state.nextPlatformY -= gap;
        }

        // Cleanup offscreen platforms, collectibles & monsters below bottom of camera
        const bottomCleanupY = state.cameraY + CANVAS_HEIGHT + 100;
        state.platforms = state.platforms.filter(p => p.y < bottomCleanupY);
        state.collectibles = state.collectibles.filter(c => c.y < bottomCleanupY);
        state.monsters = state.monsters.filter(m => m.y < bottomCleanupY);

        // 10. Update Particles & Floating Text
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

        // 11. Fall & Game Over Check
        if (player.y > state.cameraY + CANVAS_HEIGHT + 60) {
          if (!player.isDying && player.hasShield) {
            // Bubble saves the player!
            player.hasShield = false;
            player.vy = JUMP_VELOCITY * 1.4;
            player.y = state.cameraY + CANVAS_HEIGHT - 100;
            sounds.playSpring();
            addFloatingText('SHIELD SAVED YOU!', player.x + player.width / 2, player.y - 20, '#38bdf8', 1.3);
            spawnSparkles(player.x + player.width / 2, player.y, '#38bdf8');
          } else {
            // Game Over: player fell into the abyss or was defeated by a monster
            state.isRunning = false;
            sounds.playGameOver();
            onGameOver(state.score, state.altitude, state.coinsCollected, player.hitByMonster || null);
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

      // 12. RENDER
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

      // Monsters
      GameRenderer.drawMonsters(ctx, state.monsters, state.cameraY, state.tick);

      // Bullets (World coordinates)
      GameRenderer.drawBullets(ctx, state.bullets, state.cameraY);

      // Particles
      GameRenderer.drawParticles(ctx, state.particles, state.cameraY);

      // Player
      GameRenderer.drawPlayer(ctx, state.player, state.cameraY, skinId, state.tick);

      // Floating Texts
      GameRenderer.drawFloatingTexts(ctx, state.floatingTexts, state.cameraY);

      // Aim Crosshair (Screen coordinates)
      GameRenderer.drawAimCrosshair(ctx, mousePosRef.current.x, mousePosRef.current.y);

      // Ammo HUD (Screen coordinates - 6 shots limit with 2s cooldown timer)
      GameRenderer.drawAmmoHUD(ctx, state.shotsRemaining, state.maxShots, state.cooldownFrames, state.maxCooldownFrames);

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
    triggerShootAction();
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
          onPointerMove={handleCanvasPointerMove}
          onPointerUp={handleCanvasPointerUp}
          className="cursor-crosshair touch-none block"
          style={{ width: '100%', maxWidth: '440px', height: 'auto', aspectRatio: `${CANVAS_WIDTH}/${CANVAS_HEIGHT}` }}
        />

        {/* Live Keypress Feedback Indicator Badge overlay in top-right */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-slate-700/60 text-xs font-mono shadow-md pointer-events-none">
          <span
            className={`px-1.5 py-0.5 rounded transition-colors ${
              activeControls.left ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'
            }`}
          >
            {controlsLayout === 'inverted' ? 'D' : 'A'} ←
          </span>
          <span
            className={`px-1.5 py-0.5 rounded transition-colors ${
              activeControls.jump ? 'bg-emerald-400 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'
            }`}
          >
            SHOOT (W / Space / Click)
          </span>
          <span
            className={`px-1.5 py-0.5 rounded transition-colors ${
              activeControls.right ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'
            }`}
          >
            {controlsLayout === 'inverted' ? 'A' : 'D'} →
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
            LEFT ({controlsLayout === 'inverted' ? 'D' : 'A'})
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
          <span className="text-lg font-bold">🎯</span>
          <span className="text-[11px] font-mono mt-0.5">SHOOT (W / Space / Click)</span>
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
            RIGHT ({controlsLayout === 'inverted' ? 'A' : 'D'})
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
