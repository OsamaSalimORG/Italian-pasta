import { useEffect, useRef } from "react";

export function Sparticles({ count = 60 }: { count?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const mobile = window.innerWidth < 768;
    const actualCount = mobile ? Math.min(count, 20) : count;

    let width = 0;
    let height = 0;
    let raf = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2);

    type P = { x: number; y: number; r: number; vy: number; vx: number; a: number; phase: number; gold: boolean };
    let particles: P[] = [];

    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const spawn = (): P => ({
      x: Math.random() * width,
      y: height + Math.random() * height,
      r: Math.random() * 2.2 + 0.4,
      vy: -(Math.random() * 0.35 + 0.15),
      vx: (Math.random() - 0.5) * 0.15,
      a: Math.random() * 0.5 + 0.25,
      phase: Math.random() * Math.PI * 2,
      gold: Math.random() < 0.2,
    });

    const init = () => {
      resize();
      particles = Array.from({ length: actualCount }, () => {
        const p = spawn();
        p.y = Math.random() * height;
        return p;
      });
    };

    const tick = (t: number) => {
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        p.phase += 0.01;
        p.y += p.vy;
        p.x += p.vx + Math.sin(p.phase) * 0.25;

        if (p.y < -10 || p.x < -10 || p.x > width + 10) {
          Object.assign(p, spawn());
        }

        if (mobile) {
          // Simplified: just dots, no radial gradient
          ctx.fillStyle = p.gold
            ? `hsla(40, 70%, 60%, ${p.a})`
            : `hsla(45, 40%, 85%, ${p.a * 0.6})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        } else {
          const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 6);
          const color = p.gold
            ? `hsla(40, 70%, 60%, ${p.a})`
            : `hsla(45, 40%, 85%, ${p.a * 0.6})`;
          glow.addColorStop(0, color);
          glow.addColorStop(1, "hsla(45, 40%, 85%, 0)");
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 6, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      raf = requestAnimationFrame(tick);
      void t;
    };

    init();
    raf = requestAnimationFrame(tick);
    const ro = new ResizeObserver(init);
    ro.observe(canvas);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [count]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 h-full w-full"
    />
  );
}
