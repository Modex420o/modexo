import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Bot,
  Zap,
  Terminal,
  Activity,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Shield,
  AlertTriangle,
  Star,
  StarOff,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  Power,
  Cpu,
  Radio,
  X,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import logo from "@assets/mdexo_logo2_1765804066973.png";
import type { TokenSnapshot, UserWatchlist } from "@shared/schema";

function formatNumber(num: number): string {
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(1)}K`;
  return `$${num.toFixed(2)}`;
}

function formatPercent(val: number): string {
  const sign = val >= 0 ? "+" : "";
  return `${sign}${val.toFixed(2)}%`;
}

function truncateAddress(address: string): string {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function SafetyBadge({ score }: { score: number }) {
  if (score >= 71) {
    return (
      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
        <Shield className="w-3 h-3 mr-1" />
        {score}
      </Badge>
    );
  }
  if (score >= 41) {
    return (
      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
        <AlertTriangle className="w-3 h-3 mr-1" />
        {score}
      </Badge>
    );
  }
  return (
    <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
      <AlertTriangle className="w-3 h-3 mr-1" />
      {score}
    </Badge>
  );
}

function PriceChange({ value }: { value: number }) {
  if (value >= 0) {
    return (
      <span className="text-emerald-400 flex items-center gap-0.5">
        <ArrowUpRight className="w-3 h-3" />
        {formatPercent(value)}
      </span>
    );
  }
  return (
    <span className="text-red-400 flex items-center gap-0.5">
      <ArrowDownRight className="w-3 h-3" />
      {formatPercent(value)}
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button onClick={copy} className="p-1 hover:bg-white/10 rounded">
      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
    </button>
  );
}

interface Agent {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  status: 'online' | 'offline' | 'coming_soon';
  category: string;
  capabilities: string[];
}

const agents: Agent[] = [
  {
    id: 'faap-x402',
    name: 'Faap x402 Utility AI Agent',
    description: 'Finds, analyzes, and ranks the best Solana tokens 100x faster than any human. Scans thousands of tokens in seconds, filters out rugs instantly, and delivers only the top opportunities.',
    icon: Zap,
    status: 'online',
    category: 'x402 Utility',
    capabilities: ['100x Speed', 'Rug Detection', 'Alpha Discovery', 'Real-Time Ranking']
  },
  {
    id: 'x402-polymarket',
    name: 'x402 Bet Prediction Agent',
    description: 'MODEXO Analytic Engine calculates probabilities and simulates possible outcomes across prediction markets. Advanced algorithms analyze market data to identify high-conviction opportunities.',
    icon: Activity,
    status: 'online',
    category: 'x402 Predictions',
    capabilities: ['Outcome Simulation', 'Win Rate Analysis', 'Probability Engine', 'Smart Predictions']
  },
  {
    id: 'x402-sniper',
    name: 'x402 Sniper Agent',
    description: 'Autonomous agent that snipes new token launches with configurable parameters and safety checks.',
    icon: Radio,
    status: 'coming_soon',
    category: 'x402 Automation',
    capabilities: ['Auto-Buy', 'Slippage Control', 'Gas Optimization']
  },
  {
    id: 'x402-portfolio',
    name: 'x402 Portfolio Agent',
    description: 'Deep analysis of your wallet holdings with PnL tracking, risk assessment, and optimization suggestions.',
    icon: Cpu,
    status: 'coming_soon',
    category: 'x402 Analytics',
    capabilities: ['PnL Tracking', 'Risk Score', 'Diversification']
  }
];

function AgentCard({ agent, onActivate, isActive }: { agent: Agent; onActivate: () => void; isActive: boolean }) {
  const Icon = agent.icon;
  const isAvailable = agent.status === 'online';
  
  return (
    <Card 
      className={`relative overflow-hidden transition-all duration-300 ${
        isActive 
          ? 'border-primary bg-primary/5 shadow-[0_0_30px_-5px_rgba(94,92,230,0.3)]' 
          : 'border-white/10 bg-[#0a0a0a] hover:border-white/20 hover:bg-[#0f0f0f]'
      }`}
      data-testid={`card-agent-${agent.id}`}
    >
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-xl ${isActive ? 'bg-primary/20' : 'bg-white/5'} transition-colors`}>
            <Icon className={`w-6 h-6 ${isActive ? 'text-primary' : 'text-white/70'}`} />
          </div>
          <div className="flex items-center gap-2">
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
        </div>

        <div className="mb-4">
          <div className="text-xs text-primary/70 uppercase tracking-wider mb-1">{agent.category}</div>
          <h3 className="text-lg font-heading font-bold text-white mb-2">{agent.name}</h3>
          <p className="text-sm text-white/50 leading-relaxed">{agent.description}</p>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-5">
          {agent.capabilities.map((cap) => (
            <span key={cap} className="px-2 py-0.5 rounded text-[10px] bg-white/5 text-white/40 border border-white/5">
              {cap}
            </span>
          ))}
        </div>

        <Button
          onClick={onActivate}
          disabled={!isAvailable}
          className={`w-full h-10 font-medium transition-all ${
            isActive 
              ? 'bg-primary text-white hover:bg-primary/90' 
              : isAvailable 
                ? 'bg-white/5 text-white border border-white/10 hover:bg-white/10 hover:border-white/20' 
                : 'bg-white/5 text-white/30 cursor-not-allowed'
          }`}
          data-testid={`button-activate-${agent.id}`}
        >
          {isActive ? (
            <>
              <Power className="w-4 h-4 mr-2" />
              Agent Active
            </>
          ) : isAvailable ? (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Activate Agent
            </>
          ) : (
            'Coming Soon'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

function AgentTerminalOutput({ agentId, onClose }: { agentId: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: tokens = [], isLoading, refetch, isFetching } = useQuery<TokenSnapshot[]>({
    queryKey: ["/api/tokens/trending"],
    refetchInterval: 30000,
  });

  const { data: watchlist = [] } = useQuery<UserWatchlist[]>({
    queryKey: ["/api/watchlist"],
  });

  const addToWatchlist = useMutation({
    mutationFn: async (tokenAddress: string) => {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenAddress }),
      });
      if (!res.ok) throw new Error("Failed to add");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/watchlist"] });
      toast({ title: "Added to watchlist" });
    },
  });

  const removeFromWatchlist = useMutation({
    mutationFn: async (tokenAddress: string) => {
      await fetch(`/api/watchlist/${tokenAddress}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/watchlist"] });
      toast({ title: "Removed from watchlist" });
    },
  });

  const watchlistAddresses = new Set(watchlist.map(w => w.tokenAddress));

  const filteredTokens = tokens.filter(t => 
    (t.safetyScore || 0) >= 50 && 
    (t.liquidityUsd || 0) >= 5000 &&
    (t.volumeH24Usd || 0) >= 1000
  );

  return (
    <div className="bg-[#0a0a0a] border border-white/10 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#0f0f0f]">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Terminal className="w-4 h-4 text-primary" />
            <span className="text-white/70 font-mono">agent://faap-x402</span>
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
              RUNNING
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-7 px-2 text-white/50 hover:text-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-7 px-2 text-white/50 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <div className="p-4 border-b border-white/5 bg-[#080808]">
        <div className="font-mono text-xs text-white/40 mb-2">
          <span className="text-primary">$</span> Faap x402 analyzing thousands of tokens at 100x human speed...
        </div>
        <div className="font-mono text-xs text-emerald-400/70">
          ✓ Scanned & ranked {filteredTokens.length} alpha tokens
        </div>
      </div>

      <ScrollArea className="h-[500px]">
        <div className="p-2">
          {isLoading ? (
            <div className="space-y-2 p-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-16 bg-white/5 rounded animate-pulse" />
              ))}
            </div>
          ) : filteredTokens.length === 0 ? (
            <div className="text-center text-white/40 py-12 font-mono text-sm">
              No tokens matching criteria found
            </div>
          ) : (
            <div className="space-y-1">
              {filteredTokens.map((token, index) => {
                const isWatched = watchlistAddresses.has(token.tokenAddress);
                return (
                  <div 
                    key={token.tokenAddress}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors group"
                    data-testid={`row-token-${token.tokenAddress}`}
                  >
                    <div className="w-6 text-center font-mono text-xs text-white/30">
                      {String(index + 1).padStart(2, '0')}
                    </div>
                    
                    <button
                      onClick={() => isWatched 
                        ? removeFromWatchlist.mutate(token.tokenAddress)
                        : addToWatchlist.mutate(token.tokenAddress)
                      }
                      className="text-white/30 hover:text-primary transition-colors"
                    >
                      {isWatched ? (
                        <Star className="w-4 h-4 fill-primary text-primary" />
                      ) : (
                        <StarOff className="w-4 h-4" />
                      )}
                    </button>

                    <div className="flex items-center gap-3 min-w-[180px]">
                      {token.imageUrl ? (
                        <img src={token.imageUrl} alt="" className="w-8 h-8 rounded-full" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                          {token.symbol?.slice(0, 2)}
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-white flex items-center gap-2">
                          {token.symbol}
                          <a 
                            href={`https://pump.fun/${token.tokenAddress}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white/30 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        <div className="text-xs text-white/30 flex items-center gap-1 font-mono">
                          {truncateAddress(token.tokenAddress)}
                          <CopyButton text={token.tokenAddress} />
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 grid grid-cols-5 gap-4 text-right font-mono text-sm">
                      <div>
                        <div className="text-white/30 text-[10px] uppercase">MCap</div>
                        <div className="text-white/70">{formatNumber(token.marketCapUsd || 0)}</div>
                      </div>
                      <div>
                        <div className="text-white/30 text-[10px] uppercase">1h</div>
                        <PriceChange value={token.priceChange1h || 0} />
                      </div>
                      <div>
                        <div className="text-white/30 text-[10px] uppercase">24h</div>
                        <PriceChange value={token.priceChange24h || 0} />
                      </div>
                      <div>
                        <div className="text-white/30 text-[10px] uppercase">Volume</div>
                        <div className="text-white/50">{formatNumber(token.volumeH24Usd || 0)}</div>
                      </div>
                      <div>
                        <SafetyBadge score={token.safetyScore || 0} />
                      </div>
                    </div>

                    <a
                      href={`https://pump.fun/${token.tokenAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="px-4 py-3 border-t border-white/5 bg-[#080808]">
        <div className="flex items-center justify-between text-xs font-mono text-white/30">
          <span>Auto-refresh: 30s</span>
          <span>{new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
}

interface PolymarketPosition {
  wallet: string;
  market: string;
  question: string;
  outcome: string;
  size: number;
  avgPrice: number;
  currentPrice: number;
  pnlPercent: number;
  winRate: number;
}

function PolymarketTerminalOutput({ onClose }: { onClose: () => void }) {
  const { data: positions = [], isLoading, refetch, isFetching } = useQuery<PolymarketPosition[]>({
    queryKey: ["/api/polymarket/positions"],
    refetchInterval: 60000,
  });

  return (
    <div className="bg-[#0a0a0a] border border-white/10 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#0f0f0f]">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Terminal className="w-4 h-4 text-primary" />
            <span className="text-white/70 font-mono">agent://x402-polymarket</span>
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
              RUNNING
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-7 px-2 text-white/50 hover:text-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-7 px-2 text-white/50 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <div className="p-4 border-b border-white/5 bg-[#080808]">
        <div className="font-mono text-xs text-white/40 mb-2">
          <span className="text-primary">$</span> MODEXO Analytic Engine calculating probabilities and simulating outcomes...
        </div>
        <div className="font-mono text-xs text-emerald-400/70">
          ✓ Found {positions.length} high-conviction predictions from analytic engine
        </div>
      </div>

      <ScrollArea className="h-[500px]">
        <div className="p-2">
          {isLoading ? (
            <div className="space-y-2 p-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-20 bg-white/5 rounded animate-pulse" />
              ))}
            </div>
          ) : positions.length === 0 ? (
            <div className="text-center text-white/40 py-12 font-mono text-sm">
              No positions found
            </div>
          ) : (
            <div className="space-y-2">
              {positions.map((pos, index) => (
                <div 
                  key={index}
                  className="p-4 rounded-lg bg-white/5 hover:bg-white/[0.07] transition-colors border border-white/5"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white mb-1 line-clamp-2">
                        {pos.question}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`text-[10px] ${pos.outcome === 'Yes' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                          {pos.outcome}
                        </Badge>
                        <span className="text-xs text-primary/70 font-mono">MODEXO Analytic Engine</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-white/30">Win Rate</div>
                      <div className="text-lg font-bold text-emerald-400">{pos.winRate}%</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-3 text-xs">
                    <div>
                      <div className="text-white/30">Recommended Size</div>
                      <div className="font-mono text-white/70">${(Math.ceil(pos.size / 500) * 500).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-white/30">Avg Entry</div>
                      <div className="font-mono text-white/70">{(pos.avgPrice * 100).toFixed(1)}¢</div>
                    </div>
                    <div>
                      <div className="text-white/30">Current</div>
                      <div className="font-mono text-white/70">{(pos.currentPrice * 100).toFixed(1)}¢</div>
                    </div>
                    <div>
                      <div className="text-white/30">PnL</div>
                      <div className={`font-mono font-medium ${pos.pnlPercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {pos.pnlPercent >= 0 ? '+' : ''}{pos.pnlPercent.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="px-4 py-3 border-t border-white/5 bg-[#080808]">
        <div className="flex items-center justify-between text-xs font-mono text-white/30">
          <span>Auto-refresh: 60s</span>
          <span>{new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [activeAgent, setActiveAgent] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#050505]/80 backdrop-blur-xl">
        <div className="container mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src={logo} alt="MODEXO" className="h-7 w-7 object-contain" />
            <span className="text-base font-heading font-bold text-white tracking-wider">MODEXO</span>
          </Link>
          <div className="flex items-center gap-4">
            <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
              <Bot className="w-3 h-3 mr-1" />
              Agent Terminal
            </Badge>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-8">
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div>
              <div className="text-sm font-medium text-white">Beta Access - All Agents Free</div>
              <div className="text-xs text-white/50">x402 payments will be enabled soon. Enjoy unlimited agent usage during beta.</div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-heading font-bold mb-2">
            <span className="text-primary">AI</span> Utility Agents
          </h1>
          <p className="text-white/50">
            Deploy autonomous agents to scan, analyze, and execute on Solana. Select an agent to activate.
          </p>
        </div>

        {activeAgent ? (
          <div className="space-y-6">
            <Button
              variant="ghost"
              onClick={() => setActiveAgent(null)}
              className="text-white/50 hover:text-white -ml-2"
            >
              ← Back to Agents
            </Button>
            {activeAgent === 'x402-polymarket' ? (
              <PolymarketTerminalOutput onClose={() => setActiveAgent(null)} />
            ) : (
              <AgentTerminalOutput 
                agentId={activeAgent} 
                onClose={() => setActiveAgent(null)} 
              />
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {agents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                isActive={activeAgent === agent.id}
                onActivate={() => setActiveAgent(agent.id)}
              />
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-white/5 py-6 mt-12">
        <div className="container mx-auto px-6 text-center text-xs text-white/30">
          Powered by x402 Protocol on Solana
        </div>
      </footer>
    </div>
  );
}
