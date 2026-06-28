import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  color: string;
  speedX: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
}

interface ConfettiProps {
  active: boolean;
  onClose: () => void;
}

export default function Confetti({ active, onClose }: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Deep yellow, amber, emerald, indigo, pink, and vibrant purple palette matching Rescue.AI's luxury tech vibe
    const colors = [
      '#ffde1a', // Rescue.AI Prime Yellow
      '#ffd31a', // Highlight Amber-Yellow
      '#f59e0b', // Amber
      '#10b981', // Emerald / Success green
      '#6366f1', // Indigo
      '#ec4899', // Pink
      '#a855f7'  // Purple
    ];

    const particles: Particle[] = [];
    const particleCount = 120; // Increased particle count for a richer effect

    // Create particles raining from the top and sides
    for (let i = 0; i < particleCount; i++) {
      const side = Math.random() > 0.5;
      particles.push({
        // Spread across the top or top corners
        x: side 
          ? Math.random() * (width * 0.3) // Left top region
          : width - Math.random() * (width * 0.3), // Right top region
        y: -20 - Math.random() * 100, // Staggered start above viewport
        size: Math.random() * 8 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedX: side ? Math.random() * 8 + 2 : -Math.random() * 8 - 2, // Drift towards center
        speedY: Math.random() * 10 + 6, // Rain downwards with gravity
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
        opacity: 1,
      });
    }

    // Add some burst particles from the center too
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: width / 2,
        y: height * 0.4, // Burst from upper middle area
        size: Math.random() * 8 + 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedX: (Math.random() - 0.5) * 16,
        speedY: (Math.random() - 0.5) * 16 - 4,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.3,
        opacity: 1,
      });
    }

    let startTime = Date.now();
    const duration = 4000; // 4 seconds duration

    const animate = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed >= duration) {
        onClose();
        return;
      }

      ctx.clearRect(0, 0, width, height);

      // Gracefully fade out particles over the final 1.5 seconds of the animation
      const fadeProgress = elapsed > duration - 1500 ? (duration - elapsed) / 1500 : 1;

      particles.forEach((p) => {
        // Update physics
        p.speedY += 0.24; // Lower gravity for elegant float
        p.speedX *= 0.98; // Air friction resistance
        p.x += p.speedX;
        p.y += p.speedY;
        p.rotation += p.rotationSpeed;

        // Render individual particle
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity * fadeProgress;

        // Alternate between elegant shapes
        if (p.size % 3 === 0) {
          // Rectangle ribbon
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 2);
        } else if (p.size % 3 === 1) {
          // Smooth circle dots
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Elegant star/diamond shape
          ctx.beginPath();
          ctx.moveTo(0, -p.size);
          ctx.lineTo(p.size / 2, 0);
          ctx.lineTo(0, p.size);
          ctx.lineTo(-p.size / 2, 0);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
    };
  }, [active, onClose]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 w-full h-full pointer-events-none z-[9999] transition-opacity duration-300 ${active ? 'opacity-100' : 'opacity-0'}`}
    />
  );
}

