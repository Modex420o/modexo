import { useEffect, useRef } from "react";
import gsap from "gsap";
import SplitType from "split-type";

interface ScrambleRevealProps {
  text: string;
  className?: string;
  delay?: number;
}

export default function ScrambleReveal({ text, className, delay = 0 }: ScrambleRevealProps) {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!elementRef.current) return;

    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
    const duration = 1.5;
    const revealDelay = delay;

    // Set initial text to random characters of same length
    let iterations = 0;
    const maxIterations = 20; // How many times to scramble before settling

    const split = new SplitType(elementRef.current, { types: "chars" });
    const charElements = split.chars;

    if (!charElements) return;

    // Initial hidden state
    gsap.set(charElements, { opacity: 0 });

    const tl = gsap.timeline({ delay: revealDelay });

    // 1. Fade in
    tl.to(charElements, {
      opacity: 1,
      duration: 0.5,
      stagger: { amount: 0.5, from: "random" },
      ease: "power2.out"
    });

    // 2. Scramble effect during fade in
    charElements.forEach((char, index) => {
      const originalChar = text[index] || "";
      
      // We animate a dummy object to drive the scramble
      const scrambleObj = { val: 0 };
      
      tl.to(scrambleObj, {
        val: 1,
        duration: 1 + Math.random() * 0.5, // Random duration for each char
        ease: "none",
        onUpdate: () => {
          // While animating, show random char
          if (scrambleObj.val < 1) {
            char.textContent = chars[Math.floor(Math.random() * chars.length)];
            char.style.color = Math.random() > 0.8 ? "#00f0ff" : "inherit"; // Occasional cyan glitch
          } else {
            // Final state
            char.textContent = originalChar;
            char.style.color = "inherit";
          }
        },
        onComplete: () => {
          char.textContent = originalChar;
          char.style.color = "inherit";
        }
      }, 0); // Start all at same time relative to timeline start
    });

    return () => {
      split.revert();
    };
  }, [text, delay]);

  return (
    <div ref={elementRef} className={className}>
      {text}
    </div>
  );
}
