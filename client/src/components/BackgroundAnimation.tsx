import { useEffect, useRef } from "react";

export default function BackgroundAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let frameId: number;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    // Configuration for the "Fluid Light" effect
    const blobs = [
      { x: 0, y: 0, vx: 1, vy: 1, radius: 400, color: "rgba(0, 255, 255, 0.15)" }, // Cyan
      { x: width, y: 0, vx: -1, vy: 1, radius: 500, color: "rgba(157, 0, 255, 0.15)" }, // Purple
      { x: 0, y: height, vx: 1, vy: -1, radius: 450, color: "rgba(0, 100, 255, 0.15)" }, // Blue
      { x: width, y: height, vx: -1, vy: -1, radius: 600, color: "rgba(50, 0, 100, 0.2)" }, // Deep Purple
    ];

    let time = 0;

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      time += 0.005;

      // Draw Fluid Blobs
      // We use "lighter" composite mode to make colors blend and glow
      ctx.globalCompositeOperation = "screen";

      blobs.forEach((blob, i) => {
        // Organic movement using Sine waves
        const moveX = Math.sin(time + i) * 100;
        const moveY = Math.cos(time + i * 0.5) * 100;

        const x = blob.x + moveX;
        const y = blob.y + moveY;

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, blob.radius);
        gradient.addColorStop(0, blob.color);
        gradient.addColorStop(1, "rgba(0,0,0,0)");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, blob.radius * 1.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Reset composite operation for the grid
      ctx.globalCompositeOperation = "source-over";

      // Draw subtle tech grid overlay
      ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
      ctx.lineWidth = 1;
      const gridSize = 40;
      
      // Perspective Grid Effect
      // We'll draw a grid that moves slightly to create depth
      const offsetX = (time * 20) % gridSize;
      const offsetY = (time * 20) % gridSize;

      for (let x = -gridSize + offsetX; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      for (let y = -gridSize + offsetY; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      frameId = requestAnimationFrame(animate);
    };

    window.addEventListener("resize", resize);
    resize();
    animate();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0 w-full h-full opacity-100 pointer-events-none"
      style={{ filter: "blur(40px)" }} // Extra blur for that dreamy, high-end look
    />
  );
}
