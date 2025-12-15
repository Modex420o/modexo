import { motion } from "framer-motion";
import { useState, useEffect } from "react";

const partners = [
  "OpenAI", "Anthropic", "Solana", "Helius", "Jupiter", "x402", 
  "Phantom", "Jito", "Metaplex", "Dialect", "Tensor", "Crossmint"
];

export default function Partners() {
  const [highlightedIndices, setHighlightedIndices] = useState<Set<number>>(new Set());

  useEffect(() => {
    const interval = setInterval(() => {
      const totalItems = partners.length * 3;
      const numHighlights = 3;
      const newHighlights = new Set<number>();
      
      while (newHighlights.size < numHighlights) {
        newHighlights.add(Math.floor(Math.random() * totalItems));
      }
      
      setHighlightedIndices(newHighlights);
    }, 800);

    return () => clearInterval(interval);
  }, []);

  const allPartners = [...partners, ...partners, ...partners];

  return (
    <section className="py-8 border-y border-white/5 bg-[#050505]/70 backdrop-blur-[2px] overflow-hidden relative z-10">
      <div className="flex w-full">
        <motion.div 
          className="flex gap-10 md:gap-20 whitespace-nowrap min-w-full items-center"
          animate={{ x: ["0%", "-33.33%"] }}
          transition={{ 
            repeat: Infinity, 
            ease: "linear", 
            duration: 25 
          }}
        >
          {allPartners.map((partner, index) => {
            const isHighlighted = highlightedIndices.has(index);
            return (
              <span 
                key={index} 
                className={`text-xl md:text-2xl font-heading font-bold uppercase tracking-widest cursor-default transition-all duration-500 ${
                  isHighlighted 
                    ? "text-primary drop-shadow-[0_0_15px_rgba(94,92,230,0.8)]" 
                    : "text-white/15"
                }`}
              >
                {partner}
              </span>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
