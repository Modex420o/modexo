import { useEffect, useRef } from "react";
import gsap from "gsap";
import SplitType from "split-type";

interface TextRevealProps {
  children: string;
  className?: string;
  delay?: number;
}

export default function TextReveal({ children, className, delay = 0 }: TextRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!textRef.current || !containerRef.current) return;

    // Fix FOUC (Flash of Unstyled Content) by initially hiding
    gsap.set(containerRef.current, { visibility: "visible" });

    // Split text into chars
    const text = new SplitType(textRef.current, { types: "chars" });
    const chars = text.chars;

    if (!chars) return;

    // Initial state matching the CodePen style:
    // Translate Y down (100%), opacity 0, maybe slight rotation or skew if we want extra flair
    // But purely based on "slide up" it's usually y: 100% -> y: 0%
    
    gsap.set(chars, {
      y: 100,
      opacity: 0,
    });

    // Animate
    gsap.to(chars, {
      y: 0,
      opacity: 1,
      stagger: 0.05,
      duration: 1, // CodePen typically uses ~1s
      ease: "power4.out", // Smooth deceleration
      delay: delay,
    });

    return () => {
      text.revert();
    };
  }, [children, delay]);

  return (
    <div ref={containerRef} className={`${className} invisible`}>
      <h1 ref={textRef} className="leading-tight clip-text-reveal">
        {children}
      </h1>
    </div>
  );
}
