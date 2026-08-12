import { useEffect, useRef } from 'react';

interface Mote {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  size: number;
  life: number;
  phase: number;
}

function seeded(index: number, salt: number): number {
  const value = Math.sin(index * 91.731 + salt * 17.193) * 43758.5453;
  return value - Math.floor(value);
}

function createMotes(count: number, blue: boolean): Mote[] {
  return Array.from({ length: count }, (_, index) => ({
    x: seeded(index, blue ? 1 : 11),
    y: seeded(index, blue ? 2 : 12),
    velocityX: (seeded(index, blue ? 3 : 13) - 0.5) * (blue ? 0.055 : 0.025),
    velocityY: (seeded(index, blue ? 4 : 14) - 0.5) * (blue ? 0.055 : 0.018) - (blue ? 0.014 : 0.006),
    size: blue ? 3 + seeded(index, 5) * 7 : 0.8 + seeded(index, 15) * 1.8,
    life: blue ? 3 + seeded(index, 6) * 2 : 6 + seeded(index, 16) * 5,
    phase: seeded(index, blue ? 7 : 17) * (blue ? 5 : 11),
  }));
}

function wrap(value: number): number {
  return ((value % 1) + 1) % 1;
}

/** Recreates the source Wallpaper Engine scene's two shafts, dust and blue motes. */
export default function VelvetRoomAmbience() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    const blueMotes = createMotes(42, true);
    const dustMotes = createMotes(28, false);
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let width = 1;
    let height = 1;
    let frame = 0;
    let startedAt = performance.now();

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, Math.round(bounds.width));
      height = Math.max(1, Math.round(bounds.height));
      canvas.width = Math.max(1, Math.round(width * ratio));
      canvas.height = Math.max(1, Math.round(height * ratio));
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const drawShaft = (originX: number, spread: number, opacity: number) => {
      const gradient = context.createLinearGradient(originX, 0, originX, height);
      gradient.addColorStop(0, 'rgba(155, 211, 255, 0)');
      gradient.addColorStop(0.3, `rgba(126, 190, 255, ${opacity})`);
      gradient.addColorStop(1, 'rgba(83, 159, 255, 0)');
      context.fillStyle = gradient;
      context.beginPath();
      context.moveTo(originX - width * 0.035, 0);
      context.lineTo(originX + width * 0.035, 0);
      context.lineTo(originX + spread, height);
      context.lineTo(originX - spread * 0.45, height);
      context.closePath();
      context.fill();
    };

    const draw = (now: number) => {
      const elapsed = (now - startedAt) / 1000;
      context.clearRect(0, 0, width, height);
      context.save();
      context.globalCompositeOperation = 'screen';

      const pulse = motion.matches ? 0 : Math.sin(elapsed * 0.55) * 0.018;
      drawShaft(width * 0.32, width * 0.18, 0.085 + pulse);
      drawShaft(width * 0.75, width * 0.12, 0.055 - pulse * 0.7);

      for (const mote of blueMotes) {
        const age = (elapsed + mote.phase) % mote.life;
        const progress = age / mote.life;
        const x = wrap(mote.x + mote.velocityX * age) * width;
        const y = wrap(mote.y + mote.velocityY * age) * height;
        const alpha = Math.sin(progress * Math.PI) ** 2 * 0.72;
        const radius = mote.size * (0.72 + progress * 0.45);
        const glow = context.createRadialGradient(x, y, 0, x, y, radius * 3.1);
        glow.addColorStop(0, `rgba(207, 241, 255, ${alpha})`);
        glow.addColorStop(0.18, `rgba(98, 191, 255, ${alpha * 0.9})`);
        glow.addColorStop(1, 'rgba(70, 154, 246, 0)');
        context.fillStyle = glow;
        context.beginPath();
        context.arc(x, y, radius * 3.1, 0, Math.PI * 2);
        context.fill();
      }

      context.globalCompositeOperation = 'source-over';
      for (const mote of dustMotes) {
        const age = (elapsed + mote.phase) % mote.life;
        const progress = age / mote.life;
        const x = wrap(mote.x + mote.velocityX * age) * width;
        const y = wrap(mote.y + mote.velocityY * age) * height;
        const alpha = Math.sin(progress * Math.PI) ** 2 * 0.44;
        context.fillStyle = `rgba(239, 231, 199, ${alpha})`;
        context.fillRect(x, y, mote.size, mote.size * 0.55);
      }
      context.restore();

      if (!motion.matches) frame = requestAnimationFrame(draw);
    };

    const restart = () => {
      cancelAnimationFrame(frame);
      startedAt = performance.now();
      frame = requestAnimationFrame(draw);
    };

    const observer = new ResizeObserver(() => {
      resize();
      if (motion.matches) draw(startedAt);
    });
    observer.observe(canvas);
    resize();
    restart();
    motion.addEventListener('change', restart);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      motion.removeEventListener('change', restart);
    };
  }, []);

  return <canvas ref={canvasRef} className="velvet-room__ambience" aria-hidden="true" />;
}
