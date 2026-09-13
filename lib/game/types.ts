export type PlatformType = 'standard' | 'moving' | 'spring' | 'crumbling' | 'cloud';

export interface Platform {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: PlatformType;
  vx: number; // for moving platforms
  hasSpring?: boolean;
  springActive?: boolean;
  springCompressTimer?: number;
  isBroken?: boolean;
  opacity?: number;
}

export type CollectibleType = 'coin' | 'star' | 'rocket' | 'bubble';

export interface Collectible {
  id: number;
  x: number;
  y: number;
  type: CollectibleType;
  collected: boolean;
  floatOffset: number;
  points: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  shape?: 'circle' | 'square' | 'star';
}

export type CharacterSkinId =
  | 'classic_doodle' // Center: Classic Yellow Doodle with blue striped shirt
  | 'propeller_kid'  // Bottom-Center: Nerd Doodle (propeller beanie & glasses)
  | 'secret_agent'   // Bottom-Right: CEO Doodle (executive suit & sunglasses)
  | 'cowboy_11'      // Bottom-Left: Cowboy Doodle (dark hat & #11 jersey)
  | 'flame_crown'    // Top-Left: Among Us Doodle (flame crown & backpack)
  | 'bunny_ears'     // Middle-Right: White Doodle with pink rabbit ears
  | 'bat_wolf'       // Middle-Left: Wolf Doodle (charcoal coat & pointed ears)
  | 'athlete_37'     // Top-Right: Football Doodle (headband & #37 jersey)
  | 'hammer_cap';    // Top-Middle: Minecrafter Doodle (purple anvil cap)

export interface CharacterSkin {
  id: CharacterSkinId;
  name: string;
  badge: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  drawingPosition: string;
}

export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  facing: 'left' | 'right';
  isGrounded: boolean;
  canDoubleJump: boolean;
  doubleJumpUsed: boolean;
  squashX: number;
  squashY: number;
  tiltAngle: number;
  rocketTimer: number; // >0 if rocket boost active
  hasShield: boolean;
}

export type ControlsLayout = 'user' | 'standard'; 
// 'user': Left = D / ArrowLeft, Right = A / ArrowRight, Jump = W / Space / ArrowUp / Click
// 'standard': Left = A / ArrowLeft, Right = D / ArrowRight, Jump = W / Space / ArrowUp / Click

export interface KeyState {
  jump: boolean;
  left: boolean;
  right: boolean;
}
