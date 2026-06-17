// =====================================================================
//  Champ de particules d'arrière-plan, configurable par thème.
//  Performances : nombre plafonné, requestAnimationFrame, nettoyage au
//  démontage / changement de thème. Respecte prefers-reduced-motion.
// =====================================================================

import { useEffect, useRef } from "react";
import type { ParticleKind } from "@/data/themes";

interface Props {
  kind: ParticleKind;
  disabled?: boolean;
}

interface P {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  rot: number;
  char?: string;
}

const MAX_PARTICLES = 110;
const GLYPHS = "アカサタナハマヤラワ01<>/{}[]#$%&".split("");

function accentColor(): string {
  return (
    getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#a78bfa"
  );
}
function accent2Color(): string {
  return (
    getComputedStyle(document.documentElement).getPropertyValue("--accent2").trim() || "#22d3ee"
  );
}

export default function ParticleField({ kind, disabled }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const partsRef = useRef<P[]>([]);

  useEffect(() => {
    const prefersReduced =
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const onResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);

    const spawn = (): P => makeParticle(kind, w, h);

    // Population initiale.
    partsRef.current = [];
    if (kind !== "none" && !disabled && !prefersReduced) {
      const count = densityFor(kind);
      for (let i = 0; i < count; i++) {
        const p = spawn();
        p.y = Math.random() * h; // dispersion initiale
        partsRef.current.push(p);
      }
    }

    // Si désactivé : on dessine une frame figée puis on s'arrête.
    if (disabled || prefersReduced || kind === "none") {
      ctx.clearRect(0, 0, w, h);
      drawAll(ctx, partsRef.current, kind);
      return () => {
        window.removeEventListener("resize", onResize);
      };
    }

    const target = densityFor(kind);
    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      const parts = partsRef.current;

      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 1;
        if (kind === "rain") p.vy += 0.05;
        if (kind === "sparks" || kind === "embers") p.vy -= 0.005;

        const off = p.y > h + 20 || p.y < -20 || p.x < -20 || p.x > w + 20 || p.life <= 0;
        if (off) {
          parts.splice(i, 1);
        }
      }
      while (parts.length < target) parts.push(spawn());

      drawAll(ctx, parts, kind);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("resize", onResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      partsRef.current = [];
    };
  }, [kind, disabled]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
      style={{ opacity: 0.55 }}
    />
  );
}

function densityFor(kind: ParticleKind): number {
  switch (kind) {
    case "rain":
      return MAX_PARTICLES;
    case "stars":
    case "glyphs":
      return 90;
    case "grid":
      return 40;
    default:
      return 70;
  }
}

function makeParticle(kind: ParticleKind, w: number, h: number): P {
  const base: P = {
    x: Math.random() * w,
    y: -10,
    vx: 0,
    vy: 1,
    size: 2,
    life: 600,
    maxLife: 600,
    rot: 0,
  };
  switch (kind) {
    case "glyphs":
      return { ...base, vy: 1.2 + Math.random() * 2, size: 12 + Math.random() * 6, char: GLYPHS[(Math.random() * GLYPHS.length) | 0], life: 400 };
    case "embers":
      return { ...base, x: Math.random() * w, y: h + 10, vy: -(0.4 + Math.random() * 1.2), vx: (Math.random() - 0.5) * 0.6, size: 1.5 + Math.random() * 2.5, life: 300 };
    case "dust":
      return { ...base, y: Math.random() * h, vx: 0.3 + Math.random() * 0.8, vy: (Math.random() - 0.5) * 0.3, size: 1 + Math.random() * 2, life: 800 };
    case "stars":
      return { ...base, y: Math.random() * h, vx: 0, vy: 0.05, size: 0.6 + Math.random() * 1.8, life: 500, maxLife: 500 };
    case "rain":
      return { ...base, vy: 6 + Math.random() * 4, vx: -1, size: 8 + Math.random() * 10, life: 200 };
    case "sparks":
      return { ...base, x: Math.random() * w, y: h + 10, vy: -(1 + Math.random() * 2), vx: (Math.random() - 0.5) * 1.5, size: 1 + Math.random() * 2, life: 220 };
    case "petals":
      return { ...base, vy: 0.8 + Math.random() * 1.2, vx: Math.sin(Math.random() * 6) * 0.8, size: 5 + Math.random() * 5, life: 500, rot: Math.random() * Math.PI };
    case "grid":
      return { ...base, y: Math.random() * h, vx: 0, vy: 0.6 + Math.random(), size: 2, life: 600 };
    case "wisps":
      return { ...base, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.5, vy: -(0.2 + Math.random() * 0.5), size: 3 + Math.random() * 4, life: 400 };
    default:
      return base;
  }
}

function drawAll(ctx: CanvasRenderingContext2D, parts: P[], kind: ParticleKind): void {
  const acc = accentColor();
  const acc2 = accent2Color();
  ctx.save();
  for (const p of parts) {
    const alpha = Math.min(1, p.life / p.maxLife) * (kind === "stars" ? flicker(p) : 0.9);
    ctx.globalAlpha = Math.max(0, alpha);
    if (kind === "glyphs") {
      ctx.fillStyle = Math.random() > 0.5 ? acc : acc2;
      ctx.font = `${p.size}px 'JetBrains Mono', monospace`;
      ctx.fillText(p.char ?? "0", p.x, p.y);
    } else if (kind === "petals") {
      ctx.fillStyle = acc2;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, p.size, p.size * 0.5, p.rot + p.y * 0.01, 0, Math.PI * 2);
      ctx.fill();
    } else if (kind === "rain") {
      ctx.strokeStyle = acc;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - 1, p.y + p.size);
      ctx.stroke();
    } else if (kind === "grid") {
      ctx.fillStyle = acc;
      ctx.fillRect(p.x, p.y, 1.5, 6);
    } else {
      // embers, dust, stars, sparks, wisps → points lumineux
      ctx.fillStyle = kind === "embers" || kind === "sparks" ? acc : acc2;
      ctx.shadowBlur = 8;
      ctx.shadowColor = ctx.fillStyle as string;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }
  ctx.restore();
}

function flicker(p: P): number {
  return 0.4 + 0.6 * Math.abs(Math.sin((Date.now() + p.x * 30) * 0.002));
}
