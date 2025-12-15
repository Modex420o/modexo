import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import SmoothScrollHero from "./SmoothScrollHero";

export default function Hero() {
  return (
    <section className="relative bg-black">
      <SmoothScrollHero />

      <div className="container relative z-10 px-6 mx-auto text-center py-24 -mt-20 bg-black/80 backdrop-blur-xl rounded-t-3xl border-t border-white/10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono mb-8"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          AI AGENTS + x402 PAYMENTS
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed"
        >
          MODEXO deploys <span className="text-white">Proof of Work</span> and <span className="text-white">Proof of Payment</span> agents connected to x402 protocol. 
          Our AI engine analyzes multiple data sources simultaneously — on-chain activity, market signals, and predictive models — 
          to tackle the toughest tasks and deliver results no single-source system can match.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="flex items-center justify-center"
        >
          <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 font-medium px-8 h-12 text-base">
            Read the Documentation
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
