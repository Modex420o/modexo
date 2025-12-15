import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

export default function SmoothScrollHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const textGroupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    if (!textGroupRef.current) return;

    const elements = textGroupRef.current.querySelectorAll('[data-speed]');
    
    Array.from(elements).forEach((el) => {
      const speed = parseFloat(el.getAttribute("data-speed") || "1");
      
      gsap.to(el, {
        y: (i, target) => {
          return (1 - speed) * ScrollTrigger.maxScroll(window); 
        },
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 0,
          invalidateOnRefresh: true,
        },
      });
    });

    return () => {
      lenis.destroy();
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-[150vh] bg-black overflow-hidden flex justify-center">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] opacity-20"></div>
      
      <div 
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[300px] md:h-[400px] pointer-events-none z-0"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% 50%, rgba(94,92,230,0.2) 0%, rgba(94,92,230,0.08) 30%, rgba(94,92,230,0.02) 60%, transparent 100%)',
        }}
      />
      
      <div 
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[200px] md:h-[280px] pointer-events-none z-0 animate-pulse"
        style={{
          background: 'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(94,92,230,0.25) 0%, rgba(94,92,230,0.1) 40%, transparent 80%)',
          animationDuration: '4s',
        }}
      />
      
      <div 
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] md:w-[900px] h-[120px] md:h-[180px] pointer-events-none z-0 blur-2xl"
        style={{
          background: 'radial-gradient(ellipse 100% 100% at 50% 50%, rgba(94,92,230,0.4) 0%, rgba(94,92,230,0.15) 50%, transparent 100%)',
        }}
      />

      <div className="fixed top-0 left-0 w-full h-full pointer-events-none bg-gradient-to-b from-black/90 via-transparent to-black/90 z-[1]"></div>

      <div 
        ref={textGroupRef}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[2] w-full px-4 flex flex-col items-center gap-2 md:gap-4"
      >
        <div className="flex items-center justify-center gap-2 md:gap-8">
          <div data-speed="1.2" className="text-6xl md:text-9xl font-bold font-heading text-primary text-glow opacity-90">
            M
          </div>
          <div data-speed="0.8" className="text-6xl md:text-9xl font-bold font-heading text-[#EDEDED] opacity-60">
            O
          </div>
          <div data-speed="1.5" className="text-6xl md:text-9xl font-bold font-heading text-primary text-glow opacity-95">
            D
          </div>
          <div data-speed="0.6" className="text-6xl md:text-9xl font-bold font-heading text-[#A7A7A7] opacity-50">
            E
          </div>
          <div data-speed="1.1" className="text-6xl md:text-9xl font-bold font-heading text-primary text-glow opacity-90">
            X
          </div>
          <div data-speed="0.9" className="text-6xl md:text-9xl font-bold font-heading text-[#EDEDED] opacity-70">
            O
          </div>
        </div>

        <div className="flex items-center justify-center gap-1 md:gap-3 flex-wrap">
          <span data-speed="1.3" className="text-lg md:text-3xl font-bold font-heading text-primary text-glow opacity-90">
            x402
          </span>
          <span data-speed="0.7" className="text-lg md:text-3xl font-bold font-heading text-[#EDEDED] opacity-60">
            Proof
          </span>
          <span data-speed="1.4" className="text-lg md:text-3xl font-bold font-heading text-[#A7A7A7] opacity-50">
            of
          </span>
          <span data-speed="0.85" className="text-lg md:text-3xl font-bold font-heading text-primary text-glow opacity-95">
            Utility
          </span>
          <span data-speed="1.15" className="text-lg md:text-3xl font-bold font-heading text-[#EDEDED] opacity-70">
            Agents
          </span>
        </div>
      </div>
      
    </div>
  );
}
