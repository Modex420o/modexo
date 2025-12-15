import { motion } from "framer-motion";
import { Zap, Activity, Radio, Cpu } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

const agents = [
  {
    id: 'faap-x402',
    name: "Faap x402 Utility AI Agent",
    description: "Finds, analyzes, and ranks the best Solana tokens 100x faster than any human. Scans thousands of tokens in seconds, filters out rugs instantly, and delivers only the top opportunities.",
    icon: Zap,
    status: 'online',
    capabilities: ['100x Speed', 'Rug Detection', 'Alpha Discovery', 'Real-Time Ranking']
  },
  {
    id: 'x402-polymarket',
    name: "x402 Bet Prediction Agent",
    description: "MODEXO Analytic Engine calculates probabilities and simulates possible outcomes across prediction markets. Advanced algorithms analyze market data to identify high-conviction opportunities.",
    icon: Activity,
    status: 'online',
    capabilities: ['Outcome Simulation', 'Win Rate Analysis', 'Probability Engine', 'Smart Predictions']
  },
  {
    id: 'x402-sniper',
    name: "x402 Sniper Agent",
    description: "Autonomous agent that snipes new token launches with configurable parameters and safety checks. Get in early on promising launches automatically.",
    icon: Radio,
    status: 'coming_soon',
    capabilities: ['Auto-Buy', 'Slippage Control', 'Gas Optimization']
  },
  {
    id: 'x402-portfolio',
    name: "x402 Portfolio Agent",
    description: "Deep analysis of your wallet holdings with PnL tracking, risk assessment, and optimization suggestions. Let AI manage your portfolio strategy.",
    icon: Cpu,
    status: 'coming_soon',
    capabilities: ['PnL Tracking', 'Risk Score', 'Diversification']
  }
];

export default function Features() {
  return (
    <section id="features" className="py-24 relative overflow-hidden z-10 bg-[#050505]/60 backdrop-blur-[2px]">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-white/40 text-sm uppercase tracking-widest mb-4"
          >
            Scroll to Explore
          </motion.p>
          <h2 className="text-3xl md:text-5xl font-bold font-heading mb-4">
            AI Agents That Deliver Results
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Harness the power of autonomous AI with instant x402 payments. Built for speed, scale, and seamless execution.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {agents.map((agent, index) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="glass-card border-white/5 hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_30px_-5px_rgba(94,92,230,0.2)] group h-full">
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-lg bg-white/5 w-fit group-hover:scale-110 transition-transform duration-300 text-primary">
                      <agent.icon size={24} />
                    </div>
                    {agent.status === 'online' ? (
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                        Online
                      </Badge>
                    ) : (
                      <Badge className="bg-white/5 text-white/40 border-white/10 text-[10px] uppercase tracking-wider">
                        Coming Soon
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl font-heading text-white group-hover:text-primary transition-colors">
                    {agent.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-400 mb-4">
                    {agent.description}
                  </CardDescription>
                  <div className="flex flex-wrap gap-1.5">
                    {agent.capabilities.map((cap) => (
                      <span key={cap} className="px-2 py-0.5 rounded text-[10px] bg-white/5 text-white/40 border border-white/5">
                        {cap}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link href="/app">
            <button className="px-8 py-3 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-all duration-300 hover:shadow-[0_0_30px_-5px_rgba(94,92,230,0.5)]">
              Launch App
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}
