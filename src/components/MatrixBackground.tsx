import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  char: string;
  size: number;
  opacity: number;
  life: number;
}

export default function MatrixBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // BBS-style characters
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*()_+-=[]{}|;:,.<>?/~`' +
      '░▒▓█▀▄│─┌┐└┘├┤┬┴┼';

    let particles: Particle[] = [];
    const particleCount = 80;
    let animationId: number;

    const createParticle = (): Particle => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      char: characters[Math.floor(Math.random() * characters.length)],
      size: 12 + Math.random() * 8,
      opacity: 0.3 + Math.random() * 0.4,
      life: Math.random() * 100,
    });

    const updateParticle = (particle: Particle) => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life++;

      // Change character occasionally
      if (Math.random() < 0.02) {
        particle.char = characters[Math.floor(Math.random() * characters.length)];
      }

      // Wrap around screen
      if (particle.x < 0) particle.x = canvas.width;
      if (particle.x > canvas.width) particle.x = 0;
      if (particle.y < 0) particle.y = canvas.height;
      if (particle.y > canvas.height) particle.y = 0;

      // Occasionally change direction slightly
      if (Math.random() < 0.01) {
        particle.vx += (Math.random() - 0.5) * 0.1;
        particle.vy += (Math.random() - 0.5) * 0.1;

        // Limit velocity
        particle.vx = Math.max(-1, Math.min(1, particle.vx));
        particle.vy = Math.max(-1, Math.min(1, particle.vy));
      }
    };

    const drawParticle = (particle: Particle) => {
      ctx.font = `${particle.size}px "Courier New", monospace`;
      ctx.fillStyle = `rgba(0, 255, 0, ${particle.opacity})`;
      ctx.fillText(particle.char, particle.x, particle.y);
    };

    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push(createParticle());
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle) => {
        updateParticle(particle);
        drawParticle(particle);
      });

      animationId = requestAnimationFrame(animate);
    };

    init();
    animate();

    const handleResize = () => init();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return <canvas ref={canvasRef} id="matrix-bg" />;
}
