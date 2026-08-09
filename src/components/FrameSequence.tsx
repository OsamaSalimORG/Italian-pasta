import { useEffect, useRef, useState } from "react";

const FRAME_COUNT = 86;

function isMobile(): boolean {
  return window.innerWidth < 768;
}

function getFrameUrls(): string[] {
  const base = import.meta.env.BASE_URL;
  return Array.from({ length: FRAME_COUNT }, (_, i) =>
    `${base}frames/frame-${String(i + 1).padStart(3, "0")}.jpg`
  );
}

/**
 * Scroll-driven canvas — progress is read from a ref (no React re-renders).
 * The canvas redraws itself via requestAnimationFrame polling.
 */
export function FrameCanvas({ progressRef, className }: { progressRef: React.RefObject<number>; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const lastDrawnRef = useRef<number>(-1);
  const mobileRef = useRef(false);

  useEffect(() => {
    mobileRef.current = isMobile();
  }, []);

  // Preload frames — mobile: every 2nd first, then fill gaps
  useEffect(() => {
    const urls = getFrameUrls();
    const imgs: HTMLImageElement[] = urls.map(() => {
      const img = new Image();
      img.decoding = "async";
      return img;
    });
    imagesRef.current = imgs;

    const mobile = isMobile();
    const step = mobile ? 2 : 1;
    let loaded = 0;
    const total = Math.ceil(urls.length / step);

    function onFirst() {
      loaded++;
      if (loaded >= total && mobile) {
        for (let i = 1; i < urls.length; i += 2) {
          if (!imgs[i].src) imgs[i].src = urls[i];
        }
      }
    }

    for (let i = 0; i < urls.length; i += step) {
      imgs[i].onload = onFirst;
      imgs[i].src = urls[i];
    }
    if (!mobile) {
      for (let i = 1; i < urls.length; i++) imgs[i].src = urls[i];
    }
  }, []);

  // Draw loop — polls progressRef via rAF, zero React involvement
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let raf = 0;

    const draw = () => {
      const progress = progressRef.current ?? 0;
      const total = FRAME_COUNT;
      const target = Math.min(total - 1, Math.max(0, Math.round(progress * (total - 1))));
      if (target !== lastDrawnRef.current) {
        const imgs = imagesRef.current;
        let idx = target;
        while (idx > 0 && !imgs[idx]?.complete) idx--;
        const img = imgs[idx];
        if (img && img.complete && img.naturalWidth) {
          const ctx = canvas.getContext("2d", { alpha: false });
          if (ctx) {
            const dpr = Math.min(mobileRef.current ? 1.5 : 2, window.devicePixelRatio || 1);
            const w = canvas.clientWidth;
            const h = canvas.clientHeight;
            if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
              canvas.width = w * dpr;
              canvas.height = h * dpr;
            }
            const iw = img.naturalWidth;
            const ih = img.naturalHeight;
            const mobile = mobileRef.current;
            const baseScale = mobile
              ? Math.min((w * dpr) / iw, (h * dpr) / ih)
              : Math.max((w * dpr) / iw, (h * dpr) / ih);
            const scale = mobile ? baseScale * 1.5 : baseScale;
            const dw = iw * scale;
            const dh = ih * scale;
            const dx = (w * dpr - dw) / 2;
            const dy = (h * dpr - dh) / 2;
            ctx.fillStyle = "#0a0806";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, dx, dy, dw, dh);
            lastDrawnRef.current = target;
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [progressRef]);

  return <canvas ref={canvasRef} className={className} />;
}

export function useFrameSequence() {
  return [];
}
