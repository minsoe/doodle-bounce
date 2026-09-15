import { Player, Platform, Collectible, Particle, CharacterSkinId, Monster, Bullet } from './types';

export interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  vy: number;
  color: string;
  alpha: number;
  scale: number;
}

export class GameRenderer {
  // Background gradient and hand-drawn notebook graph paper based on camera altitude
  static drawBackground(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    cameraY: number
  ) {
    const altitude = Math.max(0, -cameraY);
    // 0 - 3500: Authentic cream sketchpad paper with faint blue math grid
    // 3500 - 8000: Twilight sketch paper (warm amber/lavender graph paper)
    // 8000+: Cosmic blueprint graph paper (dark indigo with chalk stars & doodles)
    let topColor: string;
    let bottomColor: string;
    let gridStrokeColor: string;

    if (altitude < 3500) {
      const t = altitude / 3500;
      topColor = `rgb(${Math.round(251 - t * 25)}, ${Math.round(248 - t * 20)}, ${Math.round(240 - t * 10)})`;
      bottomColor = `rgb(${Math.round(247 - t * 20)}, ${Math.round(243 - t * 25)}, ${Math.round(230 - t * 15)})`;
      gridStrokeColor = 'rgba(37, 99, 235, 0.13)';
    } else if (altitude < 8000) {
      const t = (altitude - 3500) / 4500;
      topColor = `rgb(${Math.round(226 - t * 140)}, ${Math.round(228 - t * 155)}, ${Math.round(230 - t * 140)})`;
      bottomColor = `rgb(${Math.round(227 - t * 130)}, ${Math.round(218 - t * 140)}, ${Math.round(215 - t * 125)})`;
      gridStrokeColor = 'rgba(147, 51, 234, 0.15)';
    } else {
      const t = Math.min(1, (altitude - 8000) / 10000);
      topColor = `rgb(${Math.round(20 - t * 10)}, ${Math.round(24 - t * 10)}, ${Math.round(45 - t * 20)})`;
      bottomColor = `rgb(${Math.round(30 - t * 15)}, ${Math.round(36 - t * 15)}, ${Math.round(65 - t * 25)})`;
      gridStrokeColor = 'rgba(255, 255, 255, 0.08)';
    }

    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, topColor);
    grad.addColorStop(1, bottomColor);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Hand-drawn Graph Paper Grid
    ctx.save();
    const gridSize = 24;
    const gridOffsetY = (Math.round(-cameraY) % gridSize + gridSize) % gridSize;
    ctx.strokeStyle = gridStrokeColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= width; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = gridOffsetY; y <= height; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();

    // Notebook Margin Line (red pencil line on left)
    if (altitude < 7000) {
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.22)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(26, 0);
      ctx.lineTo(26, height);
      ctx.stroke();
    }

    // Hand-drawn blue outer frame matching home-screen1.jpg
    ctx.strokeStyle = altitude > 7000 ? 'rgba(147, 197, 253, 0.4)' : 'rgba(30, 58, 138, 0.35)';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(6, 6, width - 12, height - 12);
    ctx.restore();

    // Parallax background elements
    // In space: draw twinkling hand-drawn chalk stars
    if (altitude > 2500) {
      const starAlpha = Math.min(1, (altitude - 2500) / 3000);
      ctx.save();
      ctx.fillStyle = `rgba(255, 255, 255, ${starAlpha * 0.9})`;
      for (let i = 0; i < 40; i++) {
        const seed = (i * 9301 + 49297) % 233280;
        const sx = (seed % width);
        const sy = ((seed * 7 + cameraY * 0.15) % height + height) % height;
        const r = (i % 4 === 0) ? 2.5 : 1.2;
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Parallax sketch clouds
    ctx.save();
    for (let i = 0; i < 5; i++) {
      const cy = (((i * 220 + cameraY * 0.2) % (height + 200)) - 100);
      const cx = ((i * 180 + Math.sin(i + cameraY * 0.001) * 30) % (width + 100)) - 50;
      const cloudAlpha = altitude > 7000 ? Math.max(0, 1 - (altitude - 7000) / 3000) : 0.4;
      if (cloudAlpha > 0.02) {
        ctx.fillStyle = `rgba(255, 255, 255, ${cloudAlpha})`;
        this.drawCloud(ctx, cx, cy, 70 + (i % 3) * 20);
      }
    }
    ctx.restore();
  }

  private static drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
    ctx.beginPath();
    ctx.arc(x, y, size * 0.4, 0, Math.PI * 2);
    ctx.arc(x + size * 0.35, y - size * 0.15, size * 0.35, 0, Math.PI * 2);
    ctx.arc(x + size * 0.7, y, size * 0.35, 0, Math.PI * 2);
    ctx.arc(x + size * 0.35, y + size * 0.15, size * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.2)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  // Draw platform with hand-drawn marker and crayon aesthetic
  static drawPlatform(ctx: CanvasRenderingContext2D, p: Platform, cameraY: number) {
    const screenY = p.y - cameraY;
    const { x, width, height, type } = p;

    ctx.save();
    if (p.opacity !== undefined) {
      ctx.globalAlpha = p.opacity;
    }

    const radius = 6;

    switch (type) {
      case 'standard': {
        // Vibrant hand-drawn green crayon grass platform with black marker outline
        ctx.fillStyle = '#65a30d'; // grass green
        this.roundRect(ctx, x, screenY, width, height, radius);
        ctx.fill();

        // Highlight top crayon strip
        ctx.fillStyle = '#84cc16';
        this.roundRect(ctx, x, screenY, width, 5, { tl: radius, tr: radius, bl: 0, br: 0 });
        ctx.fill();

        // Hand-drawn grass blades along the top edge
        ctx.strokeStyle = '#365314';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let gx = x + 6; gx < x + width - 6; gx += 8) {
          ctx.moveTo(gx, screenY);
          ctx.lineTo(gx - 2, screenY - 3);
          ctx.moveTo(gx + 2, screenY);
          ctx.lineTo(gx + 3, screenY - 2.5);
        }
        ctx.stroke();

        // Hand-drawn marker outline
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 2;
        this.roundRect(ctx, x, screenY, width, height, radius);
        ctx.stroke();
        break;
      }

      case 'moving': {
        // Hand-drawn blue crayon glide platform with chevrons
        ctx.fillStyle = '#0284c7';
        this.roundRect(ctx, x, screenY, width, height, radius);
        ctx.fill();

        // Lighter crayon highlight
        ctx.fillStyle = '#38bdf8';
        this.roundRect(ctx, x + 3, screenY + 2, width - 6, 3, 2);
        ctx.fill();

        // Chevrons indicating movement
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        const midX = x + width / 2;
        const midY = screenY + height / 2 + 0.5;
        ctx.moveTo(midX - 10, midY);
        ctx.lineTo(midX - 6, midY - 3);
        ctx.lineTo(midX - 6, midY + 3);
        ctx.moveTo(midX + 10, midY);
        ctx.lineTo(midX + 6, midY - 3);
        ctx.lineTo(midX + 6, midY + 3);
        ctx.fill();

        // Marker outline
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;
        this.roundRect(ctx, x, screenY, width, height, radius);
        ctx.stroke();
        break;
      }

      case 'crumbling': {
        // Fragile sketch paper / cloud that fractures
        ctx.fillStyle = '#cbd5e1';
        this.roundRect(ctx, x, screenY, width, height, radius);
        ctx.fill();

        // Crack lines
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(x + width * 0.3, screenY);
        ctx.lineTo(x + width * 0.35, screenY + height * 0.5);
        ctx.lineTo(x + width * 0.45, screenY + height);
        ctx.moveTo(x + width * 0.65, screenY);
        ctx.lineTo(x + width * 0.7, screenY + height * 0.6);
        ctx.stroke();

        // Marker outline
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 2;
        this.roundRect(ctx, x, screenY, width, height, radius);
        ctx.stroke();
        break;
      }

      case 'cloud': {
        // Soft hand-drawn puffy cloud
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        this.roundRect(ctx, x, screenY, width, height, radius);
        ctx.fill();
        ctx.fillStyle = 'rgba(224, 242, 254, 0.7)';
        this.roundRect(ctx, x + 2, screenY + height - 4, width - 4, 3, 2);
        ctx.fill();

        // Marker outline
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.8;
        this.roundRect(ctx, x, screenY, width, height, radius);
        ctx.stroke();
        break;
      }

      case 'spring': {
        // Sturdy golden platform with outline
        ctx.fillStyle = '#d97706';
        this.roundRect(ctx, x, screenY, width, height, radius);
        ctx.fill();
        ctx.fillStyle = '#f59e0b';
        this.roundRect(ctx, x, screenY, width, 5, { tl: radius, tr: radius, bl: 0, br: 0 });
        ctx.fill();

        // Marker outline
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 2;
        this.roundRect(ctx, x, screenY, width, height, radius);
        ctx.stroke();
        break;
      }
    }

    // If platform has a spring on it
    if (p.hasSpring) {
      const springX = x + width / 2;
      const springBaseY = screenY;
      const isCompressed = (p.springCompressTimer ?? 0) > 0;
      const springH = isCompressed ? 6 : 14;

      // Spring coil
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(springX - 6, springBaseY);
      ctx.lineTo(springX + 6, springBaseY - springH * 0.3);
      ctx.lineTo(springX - 6, springBaseY - springH * 0.7);
      ctx.lineTo(springX + 6, springBaseY - springH);
      ctx.stroke();

      // Spring top cap
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(springX - 8, springBaseY - springH - 3, 16, 4);
    }

    ctx.restore();
  }

  // Draw collectible
  static drawCollectible(
    ctx: CanvasRenderingContext2D,
    c: Collectible,
    cameraY: number,
    tick: number
  ) {
    if (c.collected) return;
    const screenY = c.y - cameraY + Math.sin(tick * 0.08 + c.floatOffset) * 4;
    const { x, type } = c;

    ctx.save();
    ctx.translate(x, screenY);

    if (type === 'coin') {
      // Spinning gold coin
      const scaleX = Math.cos(tick * 0.08 + c.id);
      ctx.scale(scaleX, 1);
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();

      // Inner ring
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.stroke();

      // Star shine
      ctx.fillStyle = '#fffbeb';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('★', 0, 0);
    } else if (type === 'star') {
      // Golden glowing star
      ctx.fillStyle = '#eab308';
      this.drawStar(ctx, 0, 0, 5, 12, 6);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      this.drawStar(ctx, 0, 0, 5, 7, 3);
      ctx.fill();
    } else if (type === 'rocket') {
      // Rocket power-up
      ctx.fillStyle = '#ef4444';
      this.roundRect(ctx, -6, -10, 12, 16, 4);
      ctx.fill();
      // Rocket cone
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(-6, -10);
      ctx.lineTo(0, -18);
      ctx.lineTo(6, -10);
      ctx.fill();
      // Thruster flame
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(-4, 6);
      ctx.lineTo(0, 12 + Math.sin(tick * 0.3) * 3);
      ctx.lineTo(4, 6);
      ctx.fill();
    } else if (type === 'bubble') {
      // Bubble / shield
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
      ctx.fillStyle = 'rgba(186, 230, 253, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Gleam
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.beginPath();
      ctx.arc(-4, -4, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // Draw Player with chosen skin, animation, squash & stretch
  static drawPlayer(
    ctx: CanvasRenderingContext2D,
    player: Player,
    cameraY: number,
    skinId: CharacterSkinId,
    tick: number
  ) {
    const screenY = player.y - cameraY;
    const centerX = player.x + player.width / 2;
    const centerY = screenY + player.height / 2;

    ctx.save();
    ctx.translate(centerX, centerY);

    // Apply squash and stretch & horizontal flip
    const flipX = player.facing === 'left' ? -1 : 1;
    ctx.scale(flipX * player.squashX, player.squashY);
    ctx.rotate(player.tiltAngle);

    // Jetpack rocket fire trail if active
    if (player.rocketTimer > 0) {
      ctx.save();
      const fireH = 15 + Math.sin(tick * 0.4) * 8;
      const grad = ctx.createLinearGradient(0, player.height / 2, 0, player.height / 2 + fireH);
      grad.addColorStop(0, '#f97316');
      grad.addColorStop(0.5, '#eab308');
      grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(-10, player.height / 2 - 2);
      ctx.lineTo(0, player.height / 2 + fireH);
      ctx.lineTo(10, player.height / 2 - 2);
      ctx.fill();
      ctx.restore();
    }

    // Bubble shield around player
    if (player.hasShield) {
      ctx.save();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
      ctx.fillStyle = 'rgba(186, 230, 253, 0.25)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, player.width * 0.75, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // Skin-specific rendering from the hand-drawn characters
    switch (skinId) {
      case 'classic_doodle':
        this.drawClassicDoodle(ctx, player, tick);
        break;
      case 'propeller_kid':
        this.drawPropellerKid(ctx, player, tick);
        break;
      case 'secret_agent':
        this.drawSecretAgent(ctx, player, tick);
        break;
      case 'cowboy_11':
        this.drawCowboy11(ctx, player, tick);
        break;
      case 'flame_crown':
        this.drawFlameCrown(ctx, player, tick);
        break;
      case 'bunny_ears':
        this.drawBunnyEars(ctx, player, tick);
        break;
      case 'bat_wolf':
        this.drawBatWolf(ctx, player, tick);
        break;
      case 'athlete_37':
        this.drawAthlete37(ctx, player, tick);
        break;
      case 'hammer_cap':
        this.drawHammerCap(ctx, player, tick);
        break;
      default:
        this.drawClassicDoodle(ctx, player, tick);
        break;
    }

    // Knocked out / dying by monster effect
    if (player.isDying) {
      ctx.save();
      // Orbiting comic stars
      const starCount = 3;
      for (let s = 0; s < starCount; s++) {
        const starAngle = (tick * 0.15) + (s * (Math.PI * 2 / starCount));
        const sx = Math.cos(starAngle) * 22;
        const sy = -player.height * 0.52 + Math.sin(starAngle) * 5;
        ctx.fillStyle = '#facc15';
        ctx.strokeStyle = '#854d0e';
        ctx.lineWidth = 1;
        this.drawStar(ctx, sx, sy, 5, 5, 2.5);
        ctx.fill();
        ctx.stroke();
      }
      // Red comical X_X over face
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      // Left eye X
      ctx.moveTo(-10, -9); ctx.lineTo(-4, -3);
      ctx.moveTo(-4, -9); ctx.lineTo(-10, -3);
      // Right eye X
      ctx.moveTo(4, -9); ctx.lineTo(10, -3);
      ctx.moveTo(10, -9); ctx.lineTo(4, -3);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }

  // Common: 4 stick legs with circular feet matching hand-drawn doodle style
  private static drawDoodleLegs(
    ctx: CanvasRenderingContext2D,
    player: Player,
    tick: number,
    legColor = '#1d4ed8'
  ) {
    const h = player.height;
    const isMoving = Math.abs(player.vx) > 0.4;
    const isJumping = player.vy < -1;

    ctx.strokeStyle = legColor;
    ctx.fillStyle = legColor;
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';

    const legXOffsets = [-11, -4, 4, 11];
    const legBaseY = h * 0.32;
    const legLength = 10;

    for (let i = 0; i < 4; i++) {
      const baseX = legXOffsets[i];
      // Leg swing when running or kicking when jumping
      let legSwing = 0;
      let curLength = legLength;

      if (isJumping) {
        legSwing = Math.sin(tick * 0.3 + i * 0.9) * 2 - 1.5;
        curLength = legLength * 0.85;
      } else if (isMoving) {
        legSwing = Math.sin(tick * 0.28 + i * 1.1) * 3.5;
      } else {
        legSwing = Math.sin(tick * 0.1 + i * 0.5) * 1;
      }

      const footX = baseX + legSwing;
      const footY = legBaseY + curLength;

      ctx.beginPath();
      ctx.moveTo(baseX, legBaseY);
      ctx.lineTo(footX, footY);
      ctx.stroke();

      // Circular foot-dot
      ctx.beginPath();
      ctx.arc(footX, footY + 1.2, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Common: Iconic Doodle dome body
  private static drawDoodleBody(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    fillColor: string,
    outlineColor = '#1d4ed8',
    outlineWidth = 2.4
  ) {
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = outlineWidth;
    ctx.lineJoin = 'round';

    ctx.beginPath();
    // Rounded dome head tapering down to a gently curved base
    ctx.moveTo(-w * 0.34, h * 0.32);
    ctx.lineTo(-w * 0.34, -h * 0.08);
    ctx.quadraticCurveTo(-w * 0.34, -h * 0.46, 0, -h * 0.46);
    ctx.quadraticCurveTo(w * 0.34, -h * 0.46, w * 0.34, -h * 0.08);
    ctx.lineTo(w * 0.34, h * 0.32);
    ctx.quadraticCurveTo(0, h * 0.37, -w * 0.34, h * 0.32);
    ctx.fill();
    ctx.stroke();
  }

  // Common: Signature trumpet snout (horn nose)
  private static drawDoodleSnout(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    fillColor: string,
    outlineColor = '#1d4ed8',
    rimColor = '#0f172a',
    recoilTimer = 0
  ) {
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 2.2;
    ctx.lineJoin = 'round';

    const startX = w * 0.3;
    const startY = -h * 0.04;
    const isRecoiling = recoilTimer > 0;
    const snoutLength = isRecoiling ? 18 : 15;
    const tipX = startX + snoutLength;
    const flareH = isRecoiling ? 8.5 : 6.5;

    // Tube with flared trumpet horn at the end
    ctx.beginPath();
    ctx.moveTo(startX, startY - 4.5);
    ctx.quadraticCurveTo(startX + 8, startY - 4, tipX, startY - flareH);
    ctx.lineTo(tipX, startY + flareH);
    ctx.quadraticCurveTo(startX + 8, startY + 4, startX, startY + 4.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Dark flared mouth opening at tip
    ctx.fillStyle = rimColor;
    ctx.beginPath();
    ctx.ellipse(tipX, startY, isRecoiling ? 3.6 : 2.4, flareH - 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Comic smoke puff ring from mouth when firing
    if (isRecoiling) {
      ctx.save();
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.65)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(tipX + 6, startY, 4 + (8 - recoilTimer) * 1.2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  // Common: Signature Doodle vertical slit eyes
  private static drawDoodleEyes(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    eyeColor = '#0f172a'
  ) {
    ctx.fillStyle = eyeColor;
    // Left slit eye
    ctx.beginPath();
    this.roundRect(ctx, 4, -h * 0.32, 2.4, 7, 1.2);
    ctx.fill();

    // Right slit eye
    ctx.beginPath();
    this.roundRect(ctx, 11, -h * 0.32, 2.4, 7, 1.2);
    ctx.fill();
  }

  // 1. Classic Doodle (Center Drawing: Yellow body, blue horizontal stripes, snout, slit eyes)
  private static drawClassicDoodle(
    ctx: CanvasRenderingContext2D,
    player: Player,
    tick: number
  ) {
    const w = player.width;
    const h = player.height;

    // Legs
    this.drawDoodleLegs(ctx, player, tick, '#1d4ed8');

    // Yellow Body
    this.drawDoodleBody(ctx, w, h, '#facc15', '#1d4ed8');

    // Horizontal blue marker stripes across waist
    ctx.fillStyle = '#2563eb';
    const stripeHeights = [0, 5, 10];
    for (const offY of stripeHeights) {
      ctx.beginPath();
      this.roundRect(ctx, -w * 0.32, offY, w * 0.64, 2.8, 1);
      ctx.fill();
    }

    // Snout
    this.drawDoodleSnout(ctx, w, h, '#facc15', '#1d4ed8', '#0f172a', player.shootRecoilTimer ?? 0);

    // Slit Eyes
    this.drawDoodleEyes(ctx, w, h, '#0f172a');
  }

  // 2. Propeller Kid (Bottom-Center Drawing: Red baseball cap, spinning propeller, nerd glasses, blue vest)
  private static drawPropellerKid(
    ctx: CanvasRenderingContext2D,
    player: Player,
    tick: number
  ) {
    const w = player.width;
    const h = player.height;

    // Legs
    this.drawDoodleLegs(ctx, player, tick, '#1d4ed8');

    // Yellow Body
    this.drawDoodleBody(ctx, w, h, '#facc15', '#1d4ed8');

    // Blue school vest & shorts
    ctx.fillStyle = '#2563eb';
    ctx.beginPath();
    // Vest with V-neck
    ctx.moveTo(-w * 0.32, 2);
    ctx.lineTo(-w * 0.32, h * 0.32);
    ctx.quadraticCurveTo(0, h * 0.36, w * 0.32, h * 0.32);
    ctx.lineTo(w * 0.32, 2);
    ctx.lineTo(8, 2);
    ctx.lineTo(0, 9); // V-neck center
    ctx.lineTo(-8, 2);
    ctx.closePath();
    ctx.fill();

    // Vest pocket badge (V)
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(3, 8);
    ctx.lineTo(6, 12);
    ctx.lineTo(9, 8);
    ctx.stroke();

    // Snout
    this.drawDoodleSnout(ctx, w, h, '#facc15', '#1d4ed8', '#0f172a', player.shootRecoilTimer ?? 0);

    // Backwards Baseball Cap (Red & Yellow)
    ctx.fillStyle = '#dc2626';
    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    // Cap dome
    ctx.ellipse(0, -h * 0.38, w * 0.35, 7, 0, Math.PI, 0);
    ctx.fill();
    ctx.stroke();

    // Cap visor turned backward (left side)
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(-w * 0.32, -h * 0.38);
    ctx.quadraticCurveTo(-w * 0.52, -h * 0.34, -w * 0.48, -h * 0.42);
    ctx.lineTo(-w * 0.2, -h * 0.42);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Spinning Propeller on top!
    const propY = -h * 0.46;
    // Propeller pin
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, propY + 3);
    ctx.lineTo(0, propY - 4);
    ctx.stroke();

    // Rotating blades
    ctx.save();
    ctx.translate(0, propY - 4);
    const spin = tick * 0.5;
    ctx.scale(Math.cos(spin), 1);
    // Blade 1
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.ellipse(-10, 0, 9, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Blade 2
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.ellipse(10, 0, 9, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Center cap
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Big Round Nerd Glasses (Blue ink frames with glare)
    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = 2.2;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';

    // Left lens
    ctx.beginPath();
    ctx.arc(4, -h * 0.24, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Right lens
    ctx.beginPath();
    ctx.arc(13, -h * 0.24, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Glasses bridge
    ctx.beginPath();
    ctx.moveTo(9, -h * 0.24);
    ctx.lineTo(10, -h * 0.24);
    ctx.stroke();

    // Pupil dots inside lenses
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(5, -h * 0.24, 1.8, 0, Math.PI * 2);
    ctx.arc(14, -h * 0.24, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. Secret Agent (Bottom-Right Drawing: Cool sunglasses, white collar, black tie, suit jacket)
  private static drawSecretAgent(
    ctx: CanvasRenderingContext2D,
    player: Player,
    tick: number
  ) {
    const w = player.width;
    const h = player.height;

    // Legs
    this.drawDoodleLegs(ctx, player, tick, '#1e293b');

    // Yellow Body
    this.drawDoodleBody(ctx, w, h, '#facc15', '#1e293b');

    // Dark charcoal Suit Jacket
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(-w * 0.34, 0);
    ctx.lineTo(-w * 0.34, h * 0.32);
    ctx.quadraticCurveTo(0, h * 0.37, w * 0.34, h * 0.32);
    ctx.lineTo(w * 0.34, 0);
    ctx.lineTo(7, 0);
    ctx.lineTo(0, 12); // V collar opening
    ctx.lineTo(-7, 0);
    ctx.closePath();
    ctx.fill();

    // White shirt collar inside V
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.lineTo(0, 11);
    ctx.lineTo(6, 0);
    ctx.closePath();
    ctx.fill();

    // Black Skinny Necktie
    ctx.fillStyle = '#0f172a';
    // Tie knot
    ctx.beginPath();
    ctx.moveTo(-2.5, 0);
    ctx.lineTo(2.5, 0);
    ctx.lineTo(2, 3.5);
    ctx.lineTo(-2, 3.5);
    ctx.closePath();
    ctx.fill();
    // Tie body
    ctx.beginPath();
    ctx.moveTo(-2, 3.5);
    ctx.lineTo(2, 3.5);
    ctx.lineTo(3.2, 13);
    ctx.lineTo(0, 16);
    ctx.lineTo(-3.2, 13);
    ctx.closePath();
    ctx.fill();

    // Snout
    this.drawDoodleSnout(ctx, w, h, '#facc15', '#1e293b', '#0f172a', player.shootRecoilTimer ?? 0);

    // Cool Black Sunglasses (Shades)
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#020617';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    // Sleek angular glasses
    ctx.moveTo(-1, -h * 0.28);
    ctx.lineTo(18, -h * 0.26);
    ctx.lineTo(16, -h * 0.16);
    ctx.lineTo(0, -h * 0.17);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Sunglasses white glare lines
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(3, -h * 0.26);
    ctx.lineTo(6, -h * 0.18);
    ctx.moveTo(11, -h * 0.25);
    ctx.lineTo(14, -h * 0.18);
    ctx.stroke();
  }

  // 4. Cowboy #11 (Bottom-Left Drawing: Dark cowboy hat, yellow #11 jersey, purple shorts)
  private static drawCowboy11(
    ctx: CanvasRenderingContext2D,
    player: Player,
    tick: number
  ) {
    const w = player.width;
    const h = player.height;

    // Legs with little cowboy boots
    this.drawDoodleLegs(ctx, player, tick, '#1d4ed8');

    // Body
    this.drawDoodleBody(ctx, w, h, '#fef08a', '#1e3a8a');

    // Purple / Indigo shorts at bottom
    ctx.fillStyle = '#4338ca';
    ctx.beginPath();
    ctx.moveTo(-w * 0.32, 9);
    ctx.lineTo(-w * 0.32, h * 0.32);
    ctx.quadraticCurveTo(0, h * 0.37, w * 0.32, h * 0.32);
    ctx.lineTo(w * 0.32, 9);
    ctx.closePath();
    ctx.fill();

    // Yellow Football / Sports Jersey with bold "11"
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    this.roundRect(ctx, -w * 0.32, -3, w * 0.64, 12, 2);
    ctx.fill();

    // Number "11" cleanly stamped
    ctx.fillStyle = '#1e1b4b';
    ctx.font = '900 11px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('11', 1, 3);

    // Snout
    this.drawDoodleSnout(ctx, w, h, '#fef08a', '#1e3a8a', '#0f172a', player.shootRecoilTimer ?? 0);

    // Vertical Slit Eyes
    this.drawDoodleEyes(ctx, w, h, '#0f172a');

    // Dark Cowboy Hat / Fedora perched on top
    ctx.save();
    ctx.translate(0, -h * 0.42);
    ctx.rotate(-0.08); // stylish tilt

    // Wide curved brim
    ctx.fillStyle = '#18181b';
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.ellipse(0, 0, w * 0.55, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Hat Crown with pinched top
    ctx.beginPath();
    ctx.moveTo(-w * 0.26, 0);
    ctx.lineTo(-w * 0.22, -13);
    ctx.quadraticCurveTo(0, -10, w * 0.22, -13);
    ctx.lineTo(w * 0.26, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Hat band
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-w * 0.25, -3.5, w * 0.5, 3);
    ctx.restore();
  }

  // 5. Fire Crown (Top-Left Drawing: Red body, golden flame crown, red backpack)
  private static drawFlameCrown(
    ctx: CanvasRenderingContext2D,
    player: Player,
    tick: number
  ) {
    const w = player.width;
    const h = player.height;

    // Red adventurer backpack on the back
    ctx.fillStyle = '#b91c1c';
    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(-w * 0.35, 0, 7, 14, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Legs
    this.drawDoodleLegs(ctx, player, tick, '#1d4ed8');

    // Red Body
    this.drawDoodleBody(ctx, w, h, '#ef4444', '#1e3a8a');

    // Snout (Red with dark opening)
    this.drawDoodleSnout(ctx, w, h, '#ef4444', '#1e3a8a', '#0f172a', player.shootRecoilTimer ?? 0);

    // Goggle strap / headband with eyes
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(-w * 0.34, -h * 0.32, w * 0.68, 4);

    // Eyes over strap
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(4, -h * 0.3, 3.5, 0, Math.PI * 2);
    ctx.arc(12, -h * 0.3, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(5, -h * 0.3, 1.8, 0, Math.PI * 2);
    ctx.arc(13, -h * 0.3, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Golden 3-pointed Flame / Crown hat perched on head
    ctx.fillStyle = '#facc15';
    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-10, -h * 0.44);
    ctx.lineTo(-12, -h * 0.68); // Left tip
    ctx.lineTo(-4, -h * 0.52);
    ctx.lineTo(0, -h * 0.74);   // Center tall tip
    ctx.lineTo(4, -h * 0.52);
    ctx.lineTo(12, -h * 0.68);  // Right tip
    ctx.lineTo(10, -h * 0.44);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Center jewel / emblem
    ctx.fillStyle = '#2563eb';
    ctx.beginPath();
    ctx.arc(0, -h * 0.54, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // 6. Hammer Head (Top-Middle Drawing: Tan body, purple flat anvil cap, striped sweater, purple pack)
  private static drawHammerCap(
    ctx: CanvasRenderingContext2D,
    player: Player,
    tick: number
  ) {
    const w = player.width;
    const h = player.height;

    // Purple backpack behind
    ctx.fillStyle = '#9333ea';
    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(-w * 0.34, 4, 7, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Legs
    this.drawDoodleLegs(ctx, player, tick, '#1d4ed8');

    // Tan / beige body
    this.drawDoodleBody(ctx, w, h, '#d97706', '#1e3a8a');

    // Heavy knit striped sweater (blue & charcoal stripes)
    const stripes = [
      { y: 0, color: '#1e40af' },
      { y: 4, color: '#475569' },
      { y: 8, color: '#1e40af' },
      { y: 12, color: '#475569' },
    ];
    for (const s of stripes) {
      ctx.fillStyle = s.color;
      ctx.beginPath();
      this.roundRect(ctx, -w * 0.32, s.y, w * 0.64, 3.2, 1);
      ctx.fill();
    }

    // Snout
    this.drawDoodleSnout(ctx, w, h, '#d97706', '#1e3a8a', '#0f172a', player.shootRecoilTimer ?? 0);

    // Vertical Slit Eyes
    this.drawDoodleEyes(ctx, w, h, '#0f172a');

    // Wide Purple Hammer Head / Anvil Cap
    ctx.fillStyle = '#9333ea';
    ctx.strokeStyle = '#581c87';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    // T-shaped anvil hammer head
    const topY = -h * 0.62;
    const baseY = -h * 0.44;
    ctx.moveTo(-w * 0.46, topY);
    ctx.lineTo(w * 0.46, topY);
    ctx.lineTo(w * 0.46, topY + 8);
    ctx.lineTo(w * 0.22, topY + 8);
    ctx.lineTo(w * 0.2, baseY);
    ctx.lineTo(-w * 0.2, baseY);
    ctx.lineTo(-w * 0.22, topY + 8);
    ctx.lineTo(-w * 0.46, topY + 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Cap groove
    ctx.strokeStyle = '#d8b4fe';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-w * 0.42, topY + 4);
    ctx.lineTo(w * 0.42, topY + 4);
    ctx.stroke();
  }

  // 7. Track Star #37 (Top-Right Drawing: Yellow body, blue headband, red #37 athletic jersey)
  private static drawAthlete37(
    ctx: CanvasRenderingContext2D,
    player: Player,
    tick: number
  ) {
    const w = player.width;
    const h = player.height;

    // Legs
    this.drawDoodleLegs(ctx, player, tick, '#1d4ed8');

    // Yellow Body
    this.drawDoodleBody(ctx, w, h, '#facc15', '#1d4ed8');

    // Blue shorts at bottom
    ctx.fillStyle = '#1d4ed8';
    ctx.beginPath();
    ctx.moveTo(-w * 0.32, 10);
    ctx.lineTo(-w * 0.32, h * 0.32);
    ctx.quadraticCurveTo(0, h * 0.37, w * 0.32, h * 0.32);
    ctx.lineTo(w * 0.32, 10);
    ctx.closePath();
    ctx.fill();

    // Red Athletic Jersey with bold "37"
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    this.roundRect(ctx, -w * 0.32, -3, w * 0.64, 13, 2);
    ctx.fill();

    // Number "37" emblazoned in white/blue
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 11px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('37', 0, 3.5);

    // Snout
    this.drawDoodleSnout(ctx, w, h, '#facc15', '#1d4ed8', '#0f172a', player.shootRecoilTimer ?? 0);

    // Blue Athletic Sweatband with white racing stripe
    ctx.fillStyle = '#2563eb';
    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    this.roundRect(ctx, -w * 0.34, -h * 0.40, w * 0.68, 6, 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-w * 0.32, -h * 0.37);
    ctx.lineTo(w * 0.32, -h * 0.37);
    ctx.stroke();

    // Slit Eyes
    this.drawDoodleEyes(ctx, w, h, '#0f172a');
  }

  // 8. Shadow Wolf (Middle-Left Drawing: Dark slate body, pointed bat ears, striped sweater)
  private static drawBatWolf(
    ctx: CanvasRenderingContext2D,
    player: Player,
    tick: number
  ) {
    const w = player.width;
    const h = player.height;

    // Tall pointed bat / wolf ears
    const earWiggle = Math.sin(tick * 0.15) * 1.5;
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;

    // Left pointed ear
    ctx.beginPath();
    ctx.moveTo(-12, -h * 0.35);
    ctx.lineTo(-15 + earWiggle, -h * 0.68);
    ctx.lineTo(-4, -h * 0.42);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Inner ear purple
    ctx.fillStyle = '#a855f7';
    ctx.beginPath();
    ctx.moveTo(-11, -h * 0.38);
    ctx.lineTo(-13 + earWiggle, -h * 0.62);
    ctx.lineTo(-6, -h * 0.42);
    ctx.closePath();
    ctx.fill();

    // Right pointed ear
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(4, -h * 0.42);
    ctx.lineTo(15 - earWiggle, -h * 0.68);
    ctx.lineTo(12, -h * 0.35);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Inner ear purple
    ctx.fillStyle = '#a855f7';
    ctx.beginPath();
    ctx.moveTo(6, -h * 0.42);
    ctx.lineTo(13 - earWiggle, -h * 0.62);
    ctx.lineTo(11, -h * 0.38);
    ctx.closePath();
    ctx.fill();

    // Legs
    this.drawDoodleLegs(ctx, player, tick, '#1e293b');

    // Charcoal Body
    this.drawDoodleBody(ctx, w, h, '#334155', '#0f172a');

    // Horizontal dark stripes
    ctx.fillStyle = '#0f172a';
    const stripes = [0, 5, 10];
    for (const offY of stripes) {
      ctx.beginPath();
      this.roundRect(ctx, -w * 0.32, offY, w * 0.64, 2.8, 1);
      ctx.fill();
    }

    // Snout
    this.drawDoodleSnout(ctx, w, h, '#334155', '#0f172a', '#020617', player.shootRecoilTimer ?? 0);

    // Sharp glowing eyes with amber center
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.ellipse(5, -h * 0.28, 3.2, 4.5, 0.2, 0, Math.PI * 2);
    ctx.ellipse(13, -h * 0.28, 3.2, 4.5, 0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    this.roundRect(ctx, 4.2, -h * 0.32, 1.6, 6, 0.8);
    this.roundRect(ctx, 12.2, -h * 0.32, 1.6, 6, 0.8);
    ctx.fill();
  }

  // 9. Doodle Bunny (Middle-Right Drawing: White body, tall pink rabbit ears, pink striped shorts)
  private static drawBunnyEars(
    ctx: CanvasRenderingContext2D,
    player: Player,
    tick: number
  ) {
    const w = player.width;
    const h = player.height;

    // Tall floppy bunny rabbit ears
    const earWiggle = Math.sin(tick * 0.16) * 2;
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2.2;

    // Left Ear
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(-7, -h * 0.58 + earWiggle, 5.5, 14, -0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Pink interior
    ctx.fillStyle = '#f472b6';
    ctx.beginPath();
    ctx.ellipse(-7, -h * 0.58 + earWiggle, 2.8, 10, -0.15, 0, Math.PI * 2);
    ctx.fill();

    // Right Ear
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(7, -h * 0.58 - earWiggle, 5.5, 14, 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Pink interior
    ctx.fillStyle = '#f472b6';
    ctx.beginPath();
    ctx.ellipse(7, -h * 0.58 - earWiggle, 2.8, 10, 0.15, 0, Math.PI * 2);
    ctx.fill();

    // Legs
    this.drawDoodleLegs(ctx, player, tick, '#2563eb');

    // White Body with blue pen ink outline
    this.drawDoodleBody(ctx, w, h, '#ffffff', '#2563eb');

    // Pink striped waistband / shorts
    ctx.fillStyle = '#f472b6';
    const pinkStripes = [2, 7, 12];
    for (const offY of pinkStripes) {
      ctx.beginPath();
      this.roundRect(ctx, -w * 0.32, offY, w * 0.64, 2.8, 1);
      ctx.fill();
    }

    // Snout (White with blue rim)
    this.drawDoodleSnout(ctx, w, h, '#ffffff', '#2563eb', '#0f172a', player.shootRecoilTimer ?? 0);

    // Vertical Slit Eyes
    this.drawDoodleEyes(ctx, w, h, '#0f172a');
  }

  // Draw particle system
  static drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[], cameraY: number) {
    ctx.save();
    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      const screenY = p.y - cameraY;

      if (p.shape === 'star') {
        this.drawStar(ctx, p.x, screenY, 4, p.size, p.size / 2);
        ctx.fill();
      } else if (p.shape === 'square') {
        ctx.fillRect(p.x - p.size / 2, screenY - p.size / 2, p.size, p.size);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, screenY, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  // Draw floating text
  static drawFloatingTexts(ctx: CanvasRenderingContext2D, texts: FloatingText[], cameraY: number) {
    ctx.save();
    for (const t of texts) {
      ctx.globalAlpha = Math.max(0, t.alpha);
      ctx.fillStyle = t.color;
      ctx.font = `bold ${Math.round(14 * t.scale)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 4;
      ctx.fillText(t.text, t.x, t.y - cameraY);
    }
    ctx.restore();
  }

  // Draw Bullets: "The bullet is a black circle."
  static drawBullets(ctx: CanvasRenderingContext2D, bullets: Bullet[], cameraY: number) {
    if (!bullets || bullets.length === 0) return;
    ctx.save();

    for (const b of bullets) {
      if (!b.active) continue;
      const screenY = b.y - cameraY;

      // Cull bullets outside viewport
      if (screenY < -50 || screenY > 850 || b.x < -50 || b.x > 500) continue;

      // Motion streak puffs behind the bullet
      const speed = Math.hypot(b.vx, b.vy);
      if (speed > 1) {
        const nx = b.vx / speed;
        const ny = b.vy / speed;

        // Faint trailing ink smudge
        ctx.fillStyle = 'rgba(15, 23, 42, 0.25)';
        ctx.beginPath();
        ctx.arc(b.x - nx * 7, screenY - ny * 7, b.radius * 0.7, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(15, 23, 42, 0.12)';
        ctx.beginPath();
        ctx.arc(b.x - nx * 13, screenY - ny * 13, b.radius * 0.45, 0, Math.PI * 2);
        ctx.fill();
      }

      // The projectile: Solid Black Circle as required
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(b.x, screenY, b.radius, 0, Math.PI * 2);
      ctx.fill();

      // Sharp sketch ring
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Hand-drawn white glossy dot
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(b.x - b.radius * 0.35, screenY - b.radius * 0.35, b.radius * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // Draw HUD Ammo Indicator (6 shots limit + 2s cooldown timer)
  static drawAmmoHUD(
    ctx: CanvasRenderingContext2D,
    shotsLeft: number,
    maxShots: number = 6,
    cooldownFrames: number,
    maxCooldownFrames: number = 120
  ) {
    ctx.save();
    const x = 16;
    const y = 62;
    const w = 126;
    const h = 26;
    const isReloading = cooldownFrames > 0;

    // Doodle sketch frame
    ctx.fillStyle = isReloading ? 'rgba(254, 242, 242, 0.94)' : 'rgba(255, 255, 255, 0.92)';
    ctx.strokeStyle = isReloading ? '#ef4444' : '#1e293b';
    ctx.lineWidth = 1.8;
    this.roundRect(ctx, x, y, w, h, 6);
    ctx.fill();
    ctx.stroke();

    if (isReloading) {
      // Cooldown progress bar (2 seconds countdown)
      const progress = 1 - (cooldownFrames / maxCooldownFrames);
      const secondsLeft = (cooldownFrames / 60).toFixed(1);

      ctx.fillStyle = '#fecaca';
      this.roundRect(ctx, x + 3, y + 3, Math.max(4, (w - 6) * progress), h - 6, 4);
      ctx.fill();

      ctx.fillStyle = '#b91c1c';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`RELOAD: ${secondsLeft}s`, x + w / 2, y + h / 2 + 0.5);
    } else {
      // 6 black pellet bullets
      const spacing = 16;
      const startPelletX = x + 23;
      const pelletY = y + h / 2;

      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('AMMO', x + 5, pelletY - 7);

      for (let i = 0; i < maxShots; i++) {
        const px = startPelletX + i * spacing;
        if (i < shotsLeft) {
          // Available black circle bullet
          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.arc(px, pelletY + 1, 4.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 1;
          ctx.stroke();

          // Shiny gleam
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(px - 1.2, pelletY - 0.2, 1.2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Empty spent bullet outline
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(px, pelletY + 1, 4.5, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }

    ctx.restore();
  }

  // Draw subtle hand-drawn crosshair at mouse pointer
  static drawAimCrosshair(ctx: CanvasRenderingContext2D, aimX: number, aimY: number) {
    if (aimX < 0 || aimX > 440 || aimY < 0 || aimY > 720) return;
    ctx.save();
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.45)';
    ctx.lineWidth = 1.3;
    ctx.setLineDash([3, 3]);

    // Outer reticle circle
    ctx.beginPath();
    ctx.arc(aimX, aimY, 11, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Crosshair tick marks
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.65)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(aimX - 6, aimY);
    ctx.lineTo(aimX + 6, aimY);
    ctx.moveTo(aimX, aimY - 6);
    ctx.lineTo(aimX, aimY + 6);
    ctx.stroke();

    // Center dot
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(aimX, aimY, 1.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Helper for rounded rectangle
  private static roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    radius: number | number[] | { tl?: number; tr?: number; bl?: number; br?: number }
  ) {
    let tl = 0, tr = 0, bl = 0, br = 0;
    if (typeof radius === 'number') {
      tl = tr = bl = br = radius;
    } else if (Array.isArray(radius)) {
      tl = radius[0] ?? 0;
      tr = radius[1] ?? radius[0] ?? 0;
      br = radius[2] ?? radius[0] ?? 0;
      bl = radius[3] ?? radius[1] ?? radius[0] ?? 0;
    } else {
      tl = radius.tl || 0;
      tr = radius.tr || 0;
      bl = radius.bl || 0;
      br = radius.br || 0;
    }

    ctx.beginPath();
    ctx.moveTo(x + tl, y);
    ctx.lineTo(x + w - tr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + tr);
    ctx.lineTo(x + w, y + h - br);
    ctx.quadraticCurveTo(x + w, y + h, x + w - br, y + h);
    ctx.lineTo(x + bl, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - bl);
    ctx.lineTo(x, y + tl);
    ctx.quadraticCurveTo(x, y, x + tl, y);
    ctx.closePath();
  }

  // Helper for drawing stars
  private static drawStar(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    spikes: number,
    outerRadius: number,
    innerRadius: number
  ) {
    let rot = (Math.PI / 2) * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
  }

  // Render all active monsters
  static drawMonsters(
    ctx: CanvasRenderingContext2D,
    monsters: Monster[],
    cameraY: number,
    tick: number
  ) {
    for (const m of monsters) {
      const screenY = m.y - cameraY;
      // Cull offscreen monsters
      if (screenY < -120 || screenY > 840) continue;

      ctx.save();
      const centerX = m.x + m.width / 2;
      const centerY = screenY + m.height / 2;
      ctx.translate(centerX, centerY);

      // Gentle floating/breathing animation
      const breath = Math.sin(tick * 0.08 + m.id) * 1.5;
      ctx.translate(0, breath);

      switch (m.type) {
        case 'green':
          this.drawGreenMonster(ctx, m, tick);
          break;
        case 'blue':
          this.drawBlueMonster(ctx, m, tick);
          break;
        case 'red':
          this.drawRedMonster(ctx, m, tick);
          break;
      }

      ctx.restore();
    }
  }

  // 1. Green Monster (from monster.jpg: skull/cat ears, inverted "V" brow, fangs, cheek whiskers)
  private static drawGreenMonster(
    ctx: CanvasRenderingContext2D,
    m: Monster,
    tick: number
  ) {
    ctx.save();
    const flip = m.facing === 'left' ? -1 : 1;
    ctx.scale(flip, 1);

    const w = m.width;
    const h = m.height;
    const halfW = w / 2;
    const halfH = h / 2;

    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // Head contour with two pointed horns/ears on top and skull/cat cheeks
    ctx.beginPath();
    ctx.moveTo(-halfW * 0.8, -halfH * 1.15); // Left ear tip
    ctx.quadraticCurveTo(0, -halfH * 0.7, halfW * 0.8, -halfH * 1.15); // Crown & right ear tip
    ctx.quadraticCurveTo(halfW * 1.05, -halfH * 0.5, halfW * 0.95, -halfH * 0.1);
    ctx.quadraticCurveTo(halfW * 0.75, halfH * 0.25, halfW * 0.7, halfH * 0.8);
    ctx.quadraticCurveTo(0, halfH * 1.05, -halfW * 0.7, halfH * 0.8); // Chin
    ctx.quadraticCurveTo(-halfW * 0.75, halfH * 0.25, -halfW * 0.95, -halfH * 0.1);
    ctx.quadraticCurveTo(-halfW * 1.05, -halfH * 0.5, -halfW * 0.8, -halfH * 1.15);
    ctx.closePath();

    // Crayon green gradient fill
    const grad = ctx.createLinearGradient(0, -halfH, 0, halfH);
    grad.addColorStop(0, '#86efac');
    grad.addColorStop(0.3, '#4ade80');
    grad.addColorStop(1, '#22c55e');
    ctx.fillStyle = grad;
    ctx.fill();

    // Dark green felt marker outline
    ctx.strokeStyle = '#14532d';
    ctx.lineWidth = 2.4;
    ctx.stroke();

    // Ear inner sketch texture
    ctx.strokeStyle = '#15803d';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-halfW * 0.7, -halfH * 0.95);
    ctx.lineTo(-halfW * 0.5, -halfH * 0.65);
    ctx.moveTo(halfW * 0.7, -halfH * 0.95);
    ctx.lineTo(halfW * 0.5, -halfH * 0.65);
    ctx.stroke();

    // Forehead "V" mark from drawing
    ctx.strokeStyle = '#14532d';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-4.5, -halfH * 0.42);
    ctx.lineTo(0, -halfH * 0.18);
    ctx.lineTo(4.5, -halfH * 0.42);
    ctx.stroke();

    // Eyes - Two large white ovals
    const eyeOffsetX = halfW * 0.42;
    const eyeOffsetY = -halfH * 0.12;
    const eyeRadiusX = halfW * 0.28;
    const eyeRadiusY = halfH * 0.34;

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#14532d';
    ctx.lineWidth = 2;
    // Left eye
    ctx.beginPath();
    ctx.ellipse(-eyeOffsetX, eyeOffsetY, eyeRadiusX, eyeRadiusY, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Right eye
    ctx.beginPath();
    ctx.ellipse(eyeOffsetX, eyeOffsetY, eyeRadiusX, eyeRadiusY, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Inverted triangle pupils from drawing
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(-eyeOffsetX - 3.8, eyeOffsetY - 4);
    ctx.lineTo(-eyeOffsetX + 3.8, eyeOffsetY - 4);
    ctx.lineTo(-eyeOffsetX, eyeOffsetY + 4.5);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(eyeOffsetX - 3.8, eyeOffsetY - 4);
    ctx.lineTo(eyeOffsetX + 3.8, eyeOffsetY - 4);
    ctx.lineTo(eyeOffsetX, eyeOffsetY + 4.5);
    ctx.closePath();
    ctx.fill();

    // White shine dot
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-eyeOffsetX - 1.5, eyeOffsetY - 2, 1.2, 0, Math.PI * 2);
    ctx.arc(eyeOffsetX - 1.5, eyeOffsetY - 2, 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Mouth line
    const mouthY = halfH * 0.42;
    ctx.strokeStyle = '#14532d';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-halfW * 0.52, mouthY);
    ctx.lineTo(halfW * 0.52, mouthY);
    ctx.stroke();

    // Two downward-pointing sharp white fangs
    const fangW = 3.5;
    const fangH = 7.5;
    const fang1X = -halfW * 0.22;
    const fang2X = halfW * 0.22;

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#14532d';
    ctx.lineWidth = 1.8;

    ctx.beginPath();
    ctx.moveTo(fang1X - fangW, mouthY);
    ctx.lineTo(fang1X + fangW, mouthY);
    ctx.lineTo(fang1X, mouthY + fangH);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(fang2X - fangW, mouthY);
    ctx.lineTo(fang2X + fangW, mouthY);
    ctx.lineTo(fang2X, mouthY + fangH);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 3 horizontal whiskers on left and 3 on right
    const whiskerTwitch = Math.sin(tick * 0.25) * 1.5;
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    // Left whiskers
    ctx.moveTo(-halfW * 0.8, halfH * 0.25);
    ctx.lineTo(-halfW * 1.5, halfH * 0.2 + whiskerTwitch);
    ctx.moveTo(-halfW * 0.75, halfH * 0.45);
    ctx.lineTo(-halfW * 1.55, halfH * 0.45);
    ctx.moveTo(-halfW * 0.7, halfH * 0.65);
    ctx.lineTo(-halfW * 1.45, halfH * 0.7 - whiskerTwitch);

    // Right whiskers
    ctx.moveTo(halfW * 0.8, halfH * 0.25);
    ctx.lineTo(halfW * 1.5, halfH * 0.2 - whiskerTwitch);
    ctx.moveTo(halfW * 0.75, halfH * 0.45);
    ctx.lineTo(halfW * 1.55, halfH * 0.45);
    ctx.moveTo(halfW * 0.7, halfH * 0.65);
    ctx.lineTo(halfW * 1.45, halfH * 0.7 + whiskerTwitch);
    ctx.stroke();

    ctx.restore();
  }

  // 2. Blue Monster (from monster.jpg: capsule body, horns, yellow cyclops eye, toothy grin, stick legs + flying wings)
  private static drawBlueMonster(
    ctx: CanvasRenderingContext2D,
    m: Monster,
    tick: number
  ) {
    ctx.save();
    const flip = m.facing === 'left' ? -1 : 1;
    ctx.scale(flip, 1);

    const w = m.width;
    const h = m.height;
    const halfW = w / 2;
    const halfH = h / 2;

    const wingFlap = Math.sin(tick * 0.35) * 0.35;

    // Fluttering sketch wings on sides
    ctx.save();
    ctx.fillStyle = 'rgba(191, 219, 254, 0.8)';
    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = 1.8;
    ctx.lineJoin = 'round';

    // Left wing
    ctx.save();
    ctx.translate(-halfW * 0.7, -halfH * 0.1);
    ctx.rotate(-0.2 + wingFlap);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-15, -14, -20, -5);
    ctx.quadraticCurveTo(-14, 4, -8, 2);
    ctx.quadraticCurveTo(-10, 10, 0, 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Right wing
    ctx.save();
    ctx.translate(halfW * 0.7, -halfH * 0.1);
    ctx.rotate(0.2 - wingFlap);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(15, -14, 20, -5);
    ctx.quadraticCurveTo(14, 4, 8, 2);
    ctx.quadraticCurveTo(10, 10, 0, 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.restore();

    // Top horns
    ctx.fillStyle = '#1e1b4b';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    // Left horn
    ctx.beginPath();
    ctx.moveTo(-halfW * 0.65, -halfH * 0.7);
    ctx.quadraticCurveTo(-halfW * 0.95, -halfH * 1.05, -halfW * 0.85, -halfH * 1.3);
    ctx.quadraticCurveTo(-halfW * 0.45, -halfH * 1.05, -halfW * 0.3, -halfH * 0.75);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Right horn
    ctx.beginPath();
    ctx.moveTo(halfW * 0.3, -halfH * 0.75);
    ctx.quadraticCurveTo(halfW * 0.45, -halfH * 1.05, halfW * 0.85, -halfH * 1.3);
    ctx.quadraticCurveTo(halfW * 0.95, -halfH * 1.05, halfW * 0.65, -halfH * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Capsule body in blue crayon gradient
    ctx.beginPath();
    this.roundRect(ctx, -halfW, -halfH * 0.85, w, h * 0.85, [18, 18, 14, 14]);
    const bodyGrad = ctx.createLinearGradient(0, -halfH, 0, halfH);
    bodyGrad.addColorStop(0, '#60a5fa');
    bodyGrad.addColorStop(0.4, '#3b82f6');
    bodyGrad.addColorStop(1, '#1d4ed8');
    ctx.fillStyle = bodyGrad;
    ctx.fill();

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.4;
    this.roundRect(ctx, -halfW, -halfH * 0.85, w, h * 0.85, [18, 18, 14, 14]);
    ctx.stroke();

    // Crayon shading texture strokes
    ctx.strokeStyle = '#1e40af';
    ctx.lineWidth = 1.1;
    for (let sy = -halfH * 0.5; sy < halfH * 0.5; sy += 7) {
      ctx.beginPath();
      ctx.moveTo(-halfW * 0.6, sy);
      ctx.lineTo(-halfW * 0.25, sy + 3);
      ctx.stroke();
    }

    // Center Cyclops Eye (Yellow Iris from monster.jpg)
    const eyeY = -halfH * 0.22;
    const eyeRadius = halfW * 0.44;

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, eyeY, eyeRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#facc15';
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, eyeY, eyeRadius * 0.72, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Dark pupil
    const pupilX = Math.cos(tick * 0.05) * 1.5;
    const pupilY = Math.sin(tick * 0.04) * 1.5;
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(pupilX, eyeY + pupilY, eyeRadius * 0.36, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(pupilX - 1.8, eyeY + pupilY - 1.8, 1.4, 0, Math.PI * 2);
    ctx.fill();

    // Wide toothy jagged grin
    const mouthY = halfH * 0.28;
    const mouthW = halfW * 0.8;
    const mouthH = halfH * 0.26;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-mouthW, mouthY);
    ctx.quadraticCurveTo(0, mouthY + mouthH * 1.6, mouthW, mouthY);
    ctx.quadraticCurveTo(0, mouthY + mouthH * 0.4, -mouthW, mouthY);
    ctx.closePath();
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Sawtooth white teeth
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    const toothCount = 5;
    const toothStep = (mouthW * 2) / toothCount;
    for (let t = 0; t < toothCount; t++) {
      const tx1 = -mouthW + t * toothStep;
      const tx2 = tx1 + toothStep / 2;
      const tx3 = tx1 + toothStep;
      ctx.moveTo(tx1, mouthY + 1);
      ctx.lineTo(tx2, mouthY + 5.5);
      ctx.lineTo(tx3, mouthY + 1);
    }
    for (let t = 0; t < toothCount - 1; t++) {
      const tx1 = -mouthW + (t + 0.5) * toothStep;
      const tx2 = tx1 + toothStep / 2;
      const tx3 = tx1 + toothStep;
      ctx.moveTo(tx1, mouthY + mouthH * 1.1);
      ctx.lineTo(tx2, mouthY + mouthH * 0.6);
      ctx.lineTo(tx3, mouthY + mouthH * 1.1);
    }
    ctx.fill();
    ctx.restore();

    // Two stick legs with round feet dangling
    const legSwing = Math.sin(tick * 0.2) * 2.5;
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.8;
    ctx.lineCap = 'round';

    // Left leg & foot
    ctx.beginPath();
    ctx.moveTo(-halfW * 0.35, halfH * 0.7);
    ctx.lineTo(-halfW * 0.4 + legSwing, halfH * 1.15);
    ctx.stroke();
    ctx.fillStyle = '#1e1b4b';
    ctx.beginPath();
    ctx.arc(-halfW * 0.4 + legSwing, halfH * 1.2, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Right leg & foot
    ctx.beginPath();
    ctx.moveTo(halfW * 0.35, halfH * 0.7);
    ctx.lineTo(halfW * 0.4 - legSwing, halfH * 1.15);
    ctx.stroke();
    ctx.fillStyle = '#1e1b4b';
    ctx.beginPath();
    ctx.arc(halfW * 0.4 - legSwing, halfH * 1.2, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  // 3. Red Monster (from monster.jpg: spiky red ball, sharp green cone on top, green side spikes, center eye, mouth)
  private static drawRedMonster(
    ctx: CanvasRenderingContext2D,
    m: Monster,
    tick: number
  ) {
    ctx.save();
    const flip = m.facing === 'left' ? -1 : 1;
    ctx.scale(flip, 1);

    const w = m.width;
    const h = m.height;
    const radius = Math.min(w, h) * 0.44;

    // Green spikes radiating from left and right sides
    ctx.fillStyle = '#22c55e';
    ctx.strokeStyle = '#14532d';
    ctx.lineWidth = 1.8;
    ctx.lineJoin = 'round';

    const spikeAngles = [-0.7, -0.25, 0.25, 0.7];
    for (const ang of spikeAngles) {
      // Left side spikes
      ctx.save();
      const lx = -Math.cos(ang) * (radius - 2);
      const ly = Math.sin(ang) * (radius - 2);
      ctx.translate(lx, ly);
      ctx.rotate(Math.PI - ang);
      ctx.beginPath();
      ctx.moveTo(0, -4.5);
      ctx.lineTo(10, 0);
      ctx.lineTo(0, 4.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Right side spikes
      ctx.save();
      const rx = Math.cos(ang) * (radius - 2);
      const ry = Math.sin(ang) * (radius - 2);
      ctx.translate(rx, ry);
      ctx.rotate(ang);
      ctx.beginPath();
      ctx.moveTo(0, -4.5);
      ctx.lineTo(10, 0);
      ctx.lineTo(0, 4.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // Top green horn / cone
    ctx.beginPath();
    ctx.moveTo(-6.5, -radius * 0.85);
    ctx.lineTo(0, -radius * 1.7);
    ctx.lineTo(6.5, -radius * 0.85);
    ctx.closePath();
    ctx.fillStyle = '#22c55e';
    ctx.fill();
    ctx.strokeStyle = '#14532d';
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // Cone segment lines
    ctx.strokeStyle = '#16a34a';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-3, -radius * 1.2);
    ctx.lineTo(3, -radius * 1.2);
    ctx.moveTo(-4.8, -radius * 0.98);
    ctx.lineTo(4.8, -radius * 0.98);
    ctx.stroke();

    // Round red ball body
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    const redGrad = ctx.createRadialGradient(-radius * 0.3, -radius * 0.3, 2, 0, 0, radius);
    redGrad.addColorStop(0, '#f87171');
    redGrad.addColorStop(0.4, '#ef4444');
    redGrad.addColorStop(1, '#b91c1c');
    ctx.fillStyle = redGrad;
    ctx.fill();

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Red crayon texture strokes
    ctx.strokeStyle = '#991b1b';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 6; i++) {
      const a = (i * 0.9) + 0.3;
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.75, a, a + 0.38);
      ctx.stroke();
    }

    // Center Cyclops Eye (Green Iris from drawing)
    const eyeRadius = radius * 0.42;
    const eyeY = -radius * 0.12;

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, eyeY, eyeRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Green iris
    ctx.fillStyle = '#4ade80';
    ctx.strokeStyle = '#16a34a';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.arc(0, eyeY, eyeRadius * 0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Dark pupil
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, eyeY, eyeRadius * 0.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-1.5, eyeY - 1.5, 1.3, 0, Math.PI * 2);
    ctx.fill();

    // Mouth below eye with sharp teeth
    const mouthY = radius * 0.45;
    const mouthW = radius * 0.55;
    const mouthH = radius * 0.28;

    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    this.roundRect(ctx, -mouthW, mouthY - mouthH / 2, mouthW * 2, mouthH, 4);
    ctx.fill();
    ctx.stroke();

    // Sharp white teeth
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    for (let t = -1; t <= 1; t++) {
      const tx = t * (mouthW * 0.5);
      ctx.moveTo(tx - 2.5, mouthY - mouthH / 2);
      ctx.lineTo(tx + 2.5, mouthY - mouthH / 2);
      ctx.lineTo(tx, mouthY + 1);
    }
    for (let t = -0.5; t <= 0.5; t += 1) {
      const tx = t * (mouthW * 0.6);
      ctx.moveTo(tx - 2, mouthY + mouthH / 2);
      ctx.lineTo(tx + 2, mouthY + mouthH / 2);
      ctx.lineTo(tx, mouthY + mouthH / 2 - 4);
    }
    ctx.fill();

    ctx.restore();
  }
}

