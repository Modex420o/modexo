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
  Sparkles,
  Megaphone,
  Users,
  Building2,
  ShieldCheck,
  TrendingUp,
  Globe,
  Wallet,
  PieChart,
  Target,
  TrendingDown,
  Droplets
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
    category: 'AI Utility',
    capabilities: ['100x Speed', 'Rug Detection', 'Alpha Discovery', 'Real-Time Ranking']
  },
  {
    id: 'x402-ModexoBet',
    name: 'x402-ModexoBet Agent',
    description: 'MODEXO Analytic Engine calculates probabilities and simulates possible outcomes across prediction markets. Advanced algorithms analyze market data to identify high-conviction opportunities.',
    icon: Activity,
    status: 'online',
    category: 'AI Utility',
    capabilities: ['Outcome Simulation', 'Win Rate Analysis', 'Probability Engine', 'Smart Predictions']
  },
  {
    id: 'x402-entry',
    name: 'x402 Smart Entry Agent',
    description: 'AI-powered entry point advisor that analyzes price action, volume patterns, and market momentum to identify optimal buy zones.',
    icon: Target,
    status: 'online',
    category: 'AI Utility',
    capabilities: ['Entry Zones', 'Volume Analysis', 'Support Levels', 'Momentum Score']
  },
  {
    id: 'x402-liquidity',
    name: 'x402 Liquidity Scanner',
    description: 'Deep liquidity analysis that evaluates pool depth, concentration risk, slippage estimates, and DEX distribution.',
    icon: Droplets,
    status: 'online',
    category: 'AI Utility',
    capabilities: ['Pool Depth', 'Slippage Estimates', 'Concentration Risk', 'Health Score']
  },
  {
    id: 'x402-portfolio',
    name: 'x402 Portfolio Agent',
    description: 'Deep analysis of your wallet holdings with PnL tracking, risk assessment, and optimization suggestions. Let AI manage your portfolio strategy.',
    icon: Wallet,
    status: 'online',
    category: 'AI Utility',
    capabilities: ['PnL Tracking', 'Risk Score', 'Diversification', 'Allocation Charts']
  },
  {
    id: 'x402-social-amp',
    name: 'x402 Social Amplifier',
    description: 'AI-powered social media amplification that automatically boosts your project visibility across X, Telegram, and Discord.',
    icon: Megaphone,
    status: 'coming_soon',
    category: 'Marketing x402',
    capabilities: ['Auto-Posts', 'Engagement Boost', 'Trend Detection', 'Viral Campaigns']
  },
  {
    id: 'x402-influencer',
    name: 'x402 Influencer Outreach',
    description: 'Connect with verified crypto influencers and automate outreach campaigns with smart targeting.',
    icon: Users,
    status: 'coming_soon',
    category: 'Marketing x402',
    capabilities: ['KOL Database', 'Auto-Outreach', 'Campaign Tracking', 'ROI Analytics']
  },
  {
    id: 'x402-enterprise',
    name: 'x402 Enterprise API',
    description: 'White-label API access for institutions and enterprises to integrate MODEXO AI capabilities.',
    icon: Building2,
    status: 'coming_soon',
    category: 'B2B x402',
    capabilities: ['API Access', 'Custom Models', 'SLA Support', 'Dedicated Infra']
  },
  {
    id: 'x402-institutional',
    name: 'x402 Institutional Analytics',
    description: 'Enterprise-grade analytics dashboard for funds and institutions with advanced reporting.',
    icon: TrendingUp,
    status: 'coming_soon',
    category: 'B2B x402',
    capabilities: ['Fund Analytics', 'Risk Reports', 'Compliance Tools', 'Multi-Wallet']
  },
  {
    id: 'x402-audit',
    name: 'x402 Contract Auditor',
    description: 'Scan any Solana token contract for security risks. Detects pump.fun tokens, mint authority, freeze authority, and more.',
    icon: ShieldCheck,
    status: 'online',
    category: 'Verification',
    capabilities: ['Token Scan', 'Risk Score', 'Pump.fun Detection', 'Authority Check']
  },
  {
    id: 'x402-kyc',
    name: 'x402 KYC/AML Agent',
    description: 'Automated compliance checks for projects and wallets. On-chain reputation scoring and verification.',
    icon: Globe,
    status: 'online',
    category: 'Verification',
    capabilities: ['KYC Checks', 'AML Screening', 'Trust Score', 'Compliance API']
  },
  {
    id: 'x402-connection-checker',
    name: 'x402 Connection Checker',
    description: 'Verify x402 protocol integration in any GitHub repository. Instantly scan codebases to detect x402 payment connections and implementations.',
    icon: ShieldCheck,
    status: 'online',
    category: 'Verification',
    capabilities: ['GitHub Scan', 'x402 Detection', 'Integration Check', 'Instant Results']
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

                    <div className="flex items-center gap-2 sm:gap-3 min-w-[100px] sm:min-w-[180px] flex-1 sm:flex-none">
                      {token.imageUrl ? (
                        <img src={token.imageUrl} alt="" className="w-7 h-7 sm:w-8 sm:h-8 rounded-full" />
                      ) : (
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-[10px] sm:text-xs">
                          {token.symbol?.slice(0, 2)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-medium text-white flex items-center gap-2 text-sm">
                          {token.symbol}
                          <a 
                            href={`https://pump.fun/${token.tokenAddress}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white/30 hover:text-primary hidden sm:block"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        <div className="text-[10px] sm:text-xs text-white/30 flex items-center gap-1 font-mono">
                          {truncateAddress(token.tokenAddress)}
                          <span className="hidden sm:inline"><CopyButton text={token.tokenAddress} /></span>
                        </div>
                      </div>
                    </div>

                    <div className="hidden sm:grid flex-1 grid-cols-5 gap-4 text-right font-mono text-sm">
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

                    <div className="sm:hidden flex items-center gap-3 text-right font-mono text-xs">
                      <div>
                        <div className="text-white/30 text-[9px] uppercase">MCap</div>
                        <div className="text-white/70 text-[11px]">{formatNumber(token.marketCapUsd || 0)}</div>
                      </div>
                      <div>
                        <div className="text-white/30 text-[9px] uppercase">24h</div>
                        <PriceChange value={token.priceChange24h || 0} />
                      </div>
                      <SafetyBadge score={token.safetyScore || 0} />
                    </div>

                    <a
                      href={`https://pump.fun/${token.tokenAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 sm:p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    >
                      <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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

interface PredictionMode {
  mode: "safe" | "risky";
  entryType: string;
  avgEntry: string;
  maxPosition: number;
  targetPnL: number;
  stopLoss: number;
  description: string;
}

interface PredictionEntry {
  id: string;
  market: string;
  question: string;
  outcome: string;
  entryPrice: number;
  currentPrice: number;
  confidence: number;
  potentialReturn: number;
  mode: "safe" | "risky";
  entryType: string;
  walletAddress?: string;
  winRate?: number;
}

function PolymarketTerminalOutput({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  
  const { data: modeConfig } = useQuery<PredictionMode>({
    queryKey: ["/api/prediction/mode"],
  });

  const { data: entries = [], isLoading, refetch, isFetching } = useQuery<PredictionEntry[]>({
    queryKey: ["/api/prediction/entries"],
    refetchInterval: 60000,
  });

  const toggleMode = async () => {
    const newMode = modeConfig?.mode === "safe" ? "risky" : "safe";
    await fetch("/api/prediction/mode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: newMode }),
    });
    queryClient.invalidateQueries({ queryKey: ["/api/prediction/mode"] });
    queryClient.invalidateQueries({ queryKey: ["/api/prediction/entries"] });
  };

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
            <span className="text-white/70 font-mono">agent://x402-ModexoBet</span>
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
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-mono text-xs text-white/40 mb-1">
              <span className="text-primary">$</span> x402-ModexoPredictionSystem v1.3.0
            </div>
            <div className="font-mono text-xs text-emerald-400/70">
              ✓ Found {entries.length} high-conviction predictions
            </div>
          </div>
          <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
            <Button
              onClick={() => {
                if (modeConfig?.mode !== "safe") {
                  toggleMode();
                }
              }}
              size="sm"
              className={`h-8 px-4 text-xs font-mono transition-all ${
                modeConfig?.mode === "safe" 
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                  : "bg-transparent text-white/40 border border-transparent hover:text-white/60"
              }`}
              data-testid="button-safe-mode"
            >
              <Shield className="w-3.5 h-3.5 mr-1.5" />
              SAFE
            </Button>
            <Button
              onClick={() => {
                if (modeConfig?.mode !== "risky") {
                  toggleMode();
                }
              }}
              size="sm"
              className={`h-8 px-4 text-xs font-mono transition-all ${
                modeConfig?.mode === "risky" 
                  ? "bg-red-500/20 text-red-400 border border-red-500/30" 
                  : "bg-transparent text-white/40 border border-transparent hover:text-white/60"
              }`}
              data-testid="button-risky-mode"
            >
              <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
              RISKY
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3 text-xs bg-white/5 rounded-lg p-3">
          <div>
            <div className="text-white/30">Entry Type</div>
            <div className="font-mono text-white/70">{modeConfig?.entryType || "Conservative Entry"}</div>
          </div>
          <div>
            <div className="text-white/30">Avg Entry</div>
            <div className="font-mono text-white/70">{modeConfig?.avgEntry || "~50c"}</div>
          </div>
          <div>
            <div className="text-white/30">Target PnL</div>
            <div className="font-mono text-emerald-400">+{modeConfig?.targetPnL || 15}%</div>
          </div>
          <div>
            <div className="text-white/30">Stop Loss</div>
            <div className="font-mono text-red-400">-{modeConfig?.stopLoss || 10}%</div>
          </div>
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
          ) : entries.length === 0 ? (
            <div className="text-center text-white/40 py-12 font-mono text-sm">
              No predictions found
            </div>
          ) : (
            <div className="space-y-2">
              {entries.map((entry, index) => (
                <div 
                  key={entry.id}
                  className="p-4 rounded-lg bg-white/5 hover:bg-white/[0.07] transition-colors border border-white/5"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white mb-1 line-clamp-2">
                        {entry.question}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`text-[10px] ${entry.outcome === 'Yes' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                          {entry.outcome}
                        </Badge>
                        <Badge className={`text-[10px] ${entry.mode === 'risky' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' : 'bg-blue-500/20 text-blue-400 border-blue-500/30'}`}>
                          {entry.entryType}
                        </Badge>
                        {entry.walletAddress && (
                          <span className="text-xs text-primary/70 font-mono">{entry.walletAddress}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-white/30">Confidence</div>
                      <div className="text-lg font-bold text-emerald-400">{(entry.confidence * 100).toFixed(0)}%</div>
                      {entry.winRate && (
                        <div className="text-xs text-white/50">Win Rate: {entry.winRate}%</div>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-3 text-xs">
                    <div>
                      <div className="text-white/30">Max Position</div>
                      <div className="font-mono text-white/70">${modeConfig?.maxPosition || 100}</div>
                    </div>
                    <div>
                      <div className="text-white/30">Entry Price</div>
                      <div className="font-mono text-white/70">{(entry.entryPrice * 100).toFixed(1)}¢</div>
                    </div>
                    <div>
                      <div className="text-white/30">Current</div>
                      <div className="font-mono text-white/70">{(entry.currentPrice * 100).toFixed(1)}¢</div>
                    </div>
                    <div>
                      <div className="text-white/30">Potential Return</div>
                      <div className="font-mono font-medium text-emerald-400">
                        +{entry.potentialReturn.toFixed(0)}%
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

interface GitHubCheckResult {
  found: boolean;
  message: string;
  details: {
    repository: string;
    filesFound?: string[];
    matchCount?: number;
    confidence?: string;
  };
}

function GitHubCheckerTerminalOutput({ onClose }: { onClose: () => void }) {
  const [githubUrl, setGithubUrl] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<GitHubCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkRepository = async () => {
    if (!githubUrl.trim()) return;
    
    setIsChecking(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/github/check-x402", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: githubUrl }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to check repository");
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsChecking(false);
    }
  };

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
            <span className="text-white/70 font-mono">agent://x402-connection-checker</span>
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
              READY
            </Badge>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-7 px-2 text-white/50 hover:text-white"
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="p-4 border-b border-white/5 bg-[#080808]">
        <div className="font-mono text-xs text-white/40 mb-3">
          <span className="text-primary">$</span> x402-ConnectionChecker v1.0.0
        </div>
        <div className="font-mono text-xs text-white/50 mb-4">
          Verify x402 protocol integration in any GitHub repository
        </div>
        
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Paste GitHub repository URL..."
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && checkRepository()}
            className="flex-1 h-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 font-mono text-sm"
            data-testid="input-github-url"
          />
          <Button
            onClick={checkRepository}
            disabled={isChecking || !githubUrl.trim()}
            className="h-10 px-4 bg-primary hover:bg-primary/90 text-white font-medium"
            data-testid="button-check-x402"
          >
            {isChecking ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 mr-2" />
                Check x402
              </>
            )}
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[300px]">
        <div className="p-4 font-mono text-sm">
          {!result && !error && !isChecking && (
            <div className="text-white/30 text-center py-8">
              Enter a GitHub repository URL to check for x402 integration
            </div>
          )}

          {isChecking && (
            <div className="flex items-center gap-3 text-white/50">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Scanning repository for x402 connections...</span>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div className="flex items-center gap-2 text-red-400">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium">Error</span>
              </div>
              <div className="text-red-400/70 mt-1 text-xs">{error}</div>
            </div>
          )}

          {result && (
            <div className={`p-4 rounded-lg ${
              result.found 
                ? 'bg-emerald-500/10 border border-emerald-500/20' 
                : 'bg-yellow-500/10 border border-yellow-500/20'
            }`}>
              <div className={`flex items-center gap-2 ${result.found ? 'text-emerald-400' : 'text-yellow-400'}`}>
                {result.found ? (
                  <ShieldCheck className="w-5 h-5" />
                ) : (
                  <AlertTriangle className="w-5 h-5" />
                )}
                <span className="font-medium">{result.message}</span>
              </div>
              
              <div className="mt-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-white/40">Repository:</span>
                  <span className="text-white/70">{result.details.repository}</span>
                </div>
                {result.details.confidence && (
                  <div className="flex justify-between">
                    <span className="text-white/40">Confidence:</span>
                    <span className={`capitalize ${result.details.confidence === 'high' ? 'text-emerald-400' : 'text-yellow-400'}`}>
                      {result.details.confidence}
                    </span>
                  </div>
                )}
                {result.details.matchCount && (
                  <div className="flex justify-between">
                    <span className="text-white/40">Matches Found:</span>
                    <span className="text-white/70">{result.details.matchCount}</span>
                  </div>
                )}
                {result.details.filesFound && result.details.filesFound.length > 0 && (
                  <div>
                    <div className="text-white/40 mb-1">Files with x402 references:</div>
                    <div className="space-y-1 ml-2">
                      {result.details.filesFound.map((file, i) => (
                        <div key={i} className="text-primary/80">
                          → {file}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="px-4 py-3 border-t border-white/5 bg-[#080808]">
        <div className="text-xs font-mono text-white/30">
          Powered by MODEXO x402 Verification Engine
        </div>
      </div>
    </div>
  );
}

interface KYCAMLResult {
  address: string;
  trustScore: number;
  riskLevel: string;
  verificationStatus: string;
  walletAge: number;
  firstTransaction: string | null;
  lastTransaction: string | null;
  totalTransactions: number;
  incomingTransactions: number;
  outgoingTransactions: number;
  uniqueInteractions: number;
  solBalance: number;
  totalVolumeIn: number;
  totalVolumeOut: number;
  suspiciousPatterns: string[];
  scoreBreakdown: {
    ageScore: number;
    activityScore: number;
    diversityScore: number;
    balanceScore: number;
    patternScore: number;
  };
}

function KYCAMLTerminalOutput({ onClose }: { onClose: () => void }) {
  const [walletAddress, setWalletAddress] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<KYCAMLResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkWallet = async () => {
    if (!walletAddress.trim()) return;
    
    setIsChecking(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/wallet/kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: walletAddress }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to check wallet");
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsChecking(false);
    }
  };

  const getTrustColor = (score: number) => {
    if (score >= 70) return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30';
    if (score >= 40) return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
    return 'text-red-400 bg-red-500/20 border-red-500/30';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'trusted': return 'text-emerald-400';
      case 'moderate': return 'text-yellow-400';
      default: return 'text-red-400';
    }
  };

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
            <span className="text-white/70 font-mono">agent://x402-kyc-aml</span>
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
              READY
            </Badge>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-7 px-2 text-white/50 hover:text-white"
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="p-4 border-b border-white/5 bg-[#080808]">
        <div className="font-mono text-xs text-white/40 mb-3">
          <span className="text-primary">$</span> x402-KYC-AML v1.0.0
        </div>
        <div className="font-mono text-xs text-white/50 mb-4">
          On-chain reputation scoring and compliance verification for Solana wallets
        </div>
        
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Paste Solana wallet address..."
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && checkWallet()}
            className="flex-1 h-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 font-mono text-sm"
            data-testid="input-kyc-wallet-address"
          />
          <Button
            onClick={checkWallet}
            disabled={isChecking || !walletAddress.trim()}
            className="h-10 px-4 bg-primary hover:bg-primary/90 text-white font-medium"
            data-testid="button-check-kyc"
          >
            {isChecking ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <Globe className="w-4 h-4 mr-2" />
                Verify
              </>
            )}
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[450px]">
        <div className="p-4 font-mono text-sm">
          {!result && !error && !isChecking && (
            <div className="text-white/30 text-center py-8">
              Enter a Solana wallet address to verify on-chain reputation
            </div>
          )}

          {isChecking && (
            <div className="flex items-center gap-3 text-white/50">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Analyzing wallet activity on Solana blockchain...</span>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div className="flex items-center gap-2 text-red-400">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium">Error</span>
              </div>
              <div className="text-red-400/70 mt-1 text-xs">{error}</div>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-xs text-white/40 mb-1">Trust Score</div>
                    <div className={`text-3xl font-bold ${result.trustScore >= 70 ? 'text-emerald-400' : result.trustScore >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {result.trustScore}/100
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={`text-xs px-3 py-1 ${getTrustColor(result.trustScore)}`}>
                      {result.riskLevel.toUpperCase()} RISK
                    </Badge>
                    <div className={`text-xs mt-2 ${getStatusColor(result.verificationStatus)}`}>
                      Status: {result.verificationStatus.toUpperCase()}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-white/40">Wallet Age</div>
                    <div className="text-white/80">{result.walletAge} days</div>
                  </div>
                  <div>
                    <div className="text-white/40">SOL Balance</div>
                    <div className="text-white/80">{result.solBalance} SOL</div>
                  </div>
                  <div>
                    <div className="text-white/40">Total Transactions</div>
                    <div className="text-white/80">{result.totalTransactions}</div>
                  </div>
                  <div>
                    <div className="text-white/40">Unique Interactions</div>
                    <div className="text-white/80">{result.uniqueInteractions}</div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="text-xs text-white/40 font-medium mb-3">Transaction Summary</div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-white/40">Incoming TXs</div>
                    <div className="text-emerald-400">{result.incomingTransactions}</div>
                  </div>
                  <div>
                    <div className="text-white/40">Outgoing TXs</div>
                    <div className="text-red-400">{result.outgoingTransactions}</div>
                  </div>
                  <div>
                    <div className="text-white/40">Volume In</div>
                    <div className="text-emerald-400">{result.totalVolumeIn.toFixed(2)} SOL</div>
                  </div>
                  <div>
                    <div className="text-white/40">Volume Out</div>
                    <div className="text-red-400">{result.totalVolumeOut.toFixed(2)} SOL</div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="text-xs text-white/40 font-medium mb-3">Score Breakdown</div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/50">Age Score</span>
                    <span className="text-white/80">{result.scoreBreakdown.ageScore}/30</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1.5">
                    <div className="bg-primary h-1.5 rounded-full" style={{ width: `${(result.scoreBreakdown.ageScore / 30) * 100}%` }} />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/50">Activity Score</span>
                    <span className="text-white/80">{result.scoreBreakdown.activityScore}/25</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1.5">
                    <div className="bg-primary h-1.5 rounded-full" style={{ width: `${(result.scoreBreakdown.activityScore / 25) * 100}%` }} />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/50">Diversity Score</span>
                    <span className="text-white/80">{result.scoreBreakdown.diversityScore}/20</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1.5">
                    <div className="bg-primary h-1.5 rounded-full" style={{ width: `${(result.scoreBreakdown.diversityScore / 20) * 100}%` }} />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/50">Balance Score</span>
                    <span className="text-white/80">{result.scoreBreakdown.balanceScore}/15</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1.5">
                    <div className="bg-primary h-1.5 rounded-full" style={{ width: `${(result.scoreBreakdown.balanceScore / 15) * 100}%` }} />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/50">Pattern Score</span>
                    <span className="text-white/80">{result.scoreBreakdown.patternScore}/10</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1.5">
                    <div className="bg-primary h-1.5 rounded-full" style={{ width: `${(result.scoreBreakdown.patternScore / 10) * 100}%` }} />
                  </div>
                </div>
              </div>

              {result.suspiciousPatterns.length > 0 && (
                <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/20">
                  <div className="text-xs text-red-400 font-medium mb-2">Suspicious Patterns Detected</div>
                  <div className="space-y-1">
                    {result.suspiciousPatterns.map((pattern, i) => (
                      <div key={i} className="text-xs text-red-400/80 flex items-start gap-2">
                        <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span>{pattern}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.firstTransaction && (
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <div className="text-xs text-white/40 font-medium mb-2">Activity Timeline</div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-white/50">First Transaction</span>
                      <span className="text-white/70">{new Date(result.firstTransaction).toLocaleDateString()}</span>
                    </div>
                    {result.lastTransaction && (
                      <div className="flex justify-between">
                        <span className="text-white/50">Last Transaction</span>
                        <span className="text-white/70">{new Date(result.lastTransaction).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="px-4 py-3 border-t border-white/5 bg-[#080808]">
        <div className="text-xs font-mono text-white/30">
          Powered by MODEXO x402 KYC/AML Engine • Data via Helius
        </div>
      </div>
    </div>
  );
}

interface ContractAuditResult {
  address: string;
  name: string;
  symbol: string;
  contractType: string;
  isPumpFun: boolean;
  riskScore: number;
  riskLevel: string;
  hasMintAuthority: boolean;
  hasFreezeAuthority: boolean;
  totalSupply: number;
  decimals: number;
  risks: string[];
  topHolders: { address: string; percentage: number }[];
  markets: { name: string; liquidity: number }[];
}

function ContractAuditorTerminalOutput({ onClose }: { onClose: () => void }) {
  const [contractAddress, setContractAddress] = useState("");
  const [isAuditing, setIsAuditing] = useState(false);
  const [result, setResult] = useState<ContractAuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const auditContract = async () => {
    if (!contractAddress.trim()) return;
    
    setIsAuditing(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/contract/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: contractAddress }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to audit contract");
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsAuditing(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'low': return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30';
      default: return 'text-white/50 bg-white/5 border-white/10';
    }
  };

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
            <span className="text-white/70 font-mono">agent://x402-contract-auditor</span>
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
              READY
            </Badge>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-7 px-2 text-white/50 hover:text-white"
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="p-4 border-b border-white/5 bg-[#080808]">
        <div className="font-mono text-xs text-white/40 mb-3">
          <span className="text-primary">$</span> x402-ContractAuditor v1.0.0
        </div>
        <div className="font-mono text-xs text-white/50 mb-4">
          Scan Solana token contracts for security risks and pump.fun detection
        </div>
        
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Paste Solana token contract address..."
            value={contractAddress}
            onChange={(e) => setContractAddress(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && auditContract()}
            className="flex-1 h-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 font-mono text-sm"
            data-testid="input-contract-address"
          />
          <Button
            onClick={auditContract}
            disabled={isAuditing || !contractAddress.trim()}
            className="h-10 px-4 bg-primary hover:bg-primary/90 text-white font-medium"
            data-testid="button-audit-contract"
          >
            {isAuditing ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 mr-2" />
                Audit
              </>
            )}
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[400px]">
        <div className="p-4 font-mono text-sm">
          {!result && !error && !isAuditing && (
            <div className="text-white/30 text-center py-8">
              Enter a Solana token contract address to scan for security risks
            </div>
          )}

          {isAuditing && (
            <div className="flex items-center gap-3 text-white/50">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Auditing contract on Solana blockchain...</span>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div className="flex items-center gap-2 text-red-400">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium">Error</span>
              </div>
              <div className="text-red-400/70 mt-1 text-xs">{error}</div>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-lg font-bold text-white">{result.name}</div>
                    <div className="text-sm text-white/50">${result.symbol}</div>
                  </div>
                  <Badge className={`text-xs px-3 py-1 ${getRiskColor(result.riskLevel)}`}>
                    {result.riskLevel.toUpperCase()} RISK
                  </Badge>
                </div>
                
                {result.isPumpFun && (
                  <div className="mb-3 p-2 rounded bg-purple-500/10 border border-purple-500/20">
                    <div className="flex items-center gap-2 text-purple-400 text-xs">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span className="font-medium">Pump.fun Token Detected</span>
                    </div>
                    <div className="text-purple-400/70 text-xs mt-1">
                      This is a classic pump.fun contract with standard bonding curve mechanics
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-white/40">Contract Type</div>
                    <div className="text-white/80">{result.contractType}</div>
                  </div>
                  <div>
                    <div className="text-white/40">Risk Score</div>
                    <div className={`font-bold ${result.riskLevel === 'high' ? 'text-red-400' : result.riskLevel === 'medium' ? 'text-yellow-400' : 'text-emerald-400'}`}>
                      {result.riskScore}/1000
                    </div>
                  </div>
                  <div>
                    <div className="text-white/40">Mint Authority</div>
                    <div className={result.hasMintAuthority ? 'text-red-400' : 'text-emerald-400'}>
                      {result.hasMintAuthority ? 'Active (Risk)' : 'Revoked'}
                    </div>
                  </div>
                  <div>
                    <div className="text-white/40">Freeze Authority</div>
                    <div className={result.hasFreezeAuthority ? 'text-red-400' : 'text-emerald-400'}>
                      {result.hasFreezeAuthority ? 'Active (Risk)' : 'Revoked'}
                    </div>
                  </div>
                </div>
              </div>

              {result.risks.length > 0 && (
                <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/20">
                  <div className="text-xs text-red-400 font-medium mb-2">Security Risks Detected</div>
                  <div className="space-y-1">
                    {result.risks.map((risk, i) => (
                      <div key={i} className="text-xs text-red-400/80 flex items-start gap-2">
                        <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span>{risk}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.topHolders.length > 0 && (
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <div className="text-xs text-white/40 font-medium mb-2">Top Holders</div>
                  <div className="space-y-1">
                    {result.topHolders.map((holder, i) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span className="text-white/50 font-mono">
                          {holder.address.slice(0, 6)}...{holder.address.slice(-4)}
                        </span>
                        <span className="text-white/70">{holder.percentage.toFixed(2)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.markets.length > 0 && (
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <div className="text-xs text-white/40 font-medium mb-2">Markets</div>
                  <div className="space-y-1">
                    {result.markets.map((market, i) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span className="text-white/50">{market.name}</span>
                        <span className="text-white/70">${market.liquidity.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="px-4 py-3 border-t border-white/5 bg-[#080808]">
        <div className="text-xs font-mono text-white/30">
          Powered by MODEXO x402 Contract Auditor • Data via RugCheck
        </div>
      </div>
    </div>
  );
}

interface PortfolioHolding {
  tokenAddress: string;
  symbol: string;
  name: string;
  imageUrl?: string;
  balance: number;
  decimals: number;
  priceUsd: number;
  valueUsd: number;
  priceChange24h: number;
  allocation: number;
}

interface PortfolioResult {
  walletAddress: string;
  totalValueUsd: number;
  totalPnlUsd: number;
  totalPnlPercent: number;
  solBalance: number;
  tokenCount: number;
  riskScore: number;
  diversificationScore: number;
  holdings: PortfolioHolding[];
  allocationByCategory: { category: string; value: number; percent: number }[];
  performanceHistory: { timestamp: number; valueUsd: number }[];
}

interface PortfolioTransaction {
  signature: string;
  type: 'buy' | 'sell';
  tokenAddress: string;
  tokenSymbol: string;
  amount: number;
  valueUsd: number;
  priceUsd: number;
  timestamp: number;
}

function PortfolioTerminalOutput({ onClose }: { onClose: () => void }) {
  const [walletAddress, setWalletAddress] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<PortfolioResult | null>(null);
  const [transactions, setTransactions] = useState<PortfolioTransaction[]>([]);
  const [isLoadingTxns, setIsLoadingTxns] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzePortfolio = async () => {
    if (!walletAddress.trim()) return;
    
    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    setTransactions([]);

    try {
      const response = await fetch("/api/portfolio/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: walletAddress }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to analyze portfolio");
      }

      const data = await response.json();
      setResult(data);

      setIsLoadingTxns(true);
      try {
        const txnResponse = await fetch(`/api/portfolio/${walletAddress.trim()}/transactions`);
        if (txnResponse.ok) {
          const txnData = await txnResponse.json();
          setTransactions(txnData);
        }
      } catch {
      } finally {
        setIsLoadingTxns(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getRiskColor = (score: number) => {
    if (score <= 40) return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30';
    if (score <= 70) return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
    return 'text-red-400 bg-red-500/20 border-red-500/30';
  };

  const getDiversificationColor = (score: number) => {
    if (score >= 70) return 'text-emerald-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

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
            <span className="text-white/70 font-mono">agent://x402-portfolio</span>
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
              READY
            </Badge>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-7 px-2 text-white/50 hover:text-white"
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="p-4 border-b border-white/5 bg-[#080808]">
        <div className="font-mono text-xs text-white/40 mb-3">
          <span className="text-primary">$</span> x402-Portfolio v1.0.0
        </div>
        <div className="font-mono text-xs text-white/50 mb-4">
          Deep portfolio analysis with PnL tracking, risk assessment, and allocation breakdown
        </div>
        
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Paste Solana wallet address..."
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && analyzePortfolio()}
            className="flex-1 h-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 font-mono text-sm"
            data-testid="input-portfolio-wallet-address"
          />
          <Button
            onClick={analyzePortfolio}
            disabled={isAnalyzing || !walletAddress.trim()}
            className="h-10 px-4 bg-primary hover:bg-primary/90 text-white font-medium"
            data-testid="button-analyze-portfolio"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Wallet className="w-4 h-4 mr-2" />
                Analyze
              </>
            )}
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[500px]">
        <div className="p-4 font-mono text-sm">
          {!result && !error && !isAnalyzing && (
            <div className="text-white/30 text-center py-8">
              Enter a Solana wallet address to analyze portfolio holdings
            </div>
          )}

          {isAnalyzing && (
            <div className="flex items-center gap-3 text-white/50">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Fetching wallet holdings and calculating portfolio metrics...</span>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div className="flex items-center gap-2 text-red-400">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium">Error</span>
              </div>
              <div className="text-red-400/70 mt-1 text-xs">{error}</div>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-xs text-white/40 mb-1">Total Portfolio Value</div>
                    <div className="text-3xl font-bold text-white">
                      ${result.totalValueUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-white/40 mb-1">{result.tokenCount} Assets</div>
                    <div className="text-lg text-white/70">{result.solBalance.toFixed(4)} SOL</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-white/5">
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="w-3.5 h-3.5 text-white/40" />
                      <span className="text-xs text-white/40">Risk Score</span>
                    </div>
                    <div className={`text-lg font-bold ${result.riskScore <= 40 ? 'text-emerald-400' : result.riskScore <= 70 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {result.riskScore}/100
                    </div>
                    <div className="text-[10px] text-white/30">
                      {result.riskScore <= 40 ? 'Low Risk' : result.riskScore <= 70 ? 'Medium Risk' : 'High Risk'}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5">
                    <div className="flex items-center gap-2 mb-1">
                      <PieChart className="w-3.5 h-3.5 text-white/40" />
                      <span className="text-xs text-white/40">Diversification</span>
                    </div>
                    <div className={`text-lg font-bold ${getDiversificationColor(result.diversificationScore)}`}>
                      {result.diversificationScore}/100
                    </div>
                    <div className="text-[10px] text-white/30">
                      {result.diversificationScore >= 70 ? 'Well Diversified' : result.diversificationScore >= 40 ? 'Moderate' : 'Concentrated'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="text-xs text-white/40 font-medium mb-3 flex items-center gap-2">
                  <PieChart className="w-3.5 h-3.5" />
                  Allocation Breakdown
                </div>
                <div className="space-y-2">
                  {result.allocationByCategory.map((cat, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-white/70">{cat.category}</span>
                        <span className="text-white/50">${cat.value.toLocaleString(undefined, { maximumFractionDigits: 2 })} ({cat.percent.toFixed(1)}%)</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all" 
                          style={{ width: `${Math.min(cat.percent, 100)}%` }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="text-xs text-white/40 font-medium mb-3 flex items-center gap-2">
                  <Wallet className="w-3.5 h-3.5" />
                  Holdings ({result.holdings.length})
                </div>
                <div className="space-y-2">
                  {result.holdings.slice(0, 10).map((holding, i) => (
                    <div 
                      key={holding.tokenAddress}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      <div className="w-5 text-center text-[10px] text-white/30">{i + 1}</div>
                      {holding.imageUrl ? (
                        <img src={holding.imageUrl} alt="" className="w-7 h-7 rounded-full" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-[10px]">
                          {holding.symbol?.slice(0, 2)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white text-sm">{holding.symbol}</span>
                          <span className="text-[10px] text-white/30 truncate">{holding.name}</span>
                        </div>
                        <div className="text-[10px] text-white/40">
                          {holding.balance.toLocaleString(undefined, { maximumFractionDigits: 4 })} tokens
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-white">
                          ${holding.valueUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-[10px] text-white/40">
                          {holding.allocation.toFixed(1)}% of portfolio
                        </div>
                      </div>
                      {holding.priceChange24h !== 0 && (
                        <div className={`flex items-center gap-0.5 text-xs ${holding.priceChange24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {holding.priceChange24h >= 0 ? (
                            <ArrowUpRight className="w-3 h-3" />
                          ) : (
                            <ArrowDownRight className="w-3 h-3" />
                          )}
                          {Math.abs(holding.priceChange24h).toFixed(2)}%
                        </div>
                      )}
                    </div>
                  ))}
                  {result.holdings.length > 10 && (
                    <div className="text-center text-xs text-white/30 py-2">
                      + {result.holdings.length - 10} more assets
                    </div>
                  )}
                </div>
              </div>

              {result.performanceHistory.length > 0 && (
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <div className="text-xs text-white/40 font-medium mb-3 flex items-center gap-2">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Historical Snapshots ({result.performanceHistory.length})
                  </div>
                  <div className="space-y-1">
                    {result.performanceHistory.slice(-5).map((point, i) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span className="text-white/50">{new Date(point.timestamp).toLocaleDateString()}</span>
                        <span className="text-white/70">${point.valueUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="text-xs text-white/40 font-medium mb-3 flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5" />
                  Recent Transactions
                  {isLoadingTxns && <RefreshCw className="w-3 h-3 animate-spin" />}
                </div>
                {transactions.length > 0 ? (
                  <div className="space-y-2">
                    {transactions.slice(0, 15).map((txn, i) => (
                      <div 
                        key={txn.signature}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
                        data-testid={`transaction-${i}`}
                      >
                        <div className={`p-1.5 rounded ${txn.type === 'buy' ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                          {txn.type === 'buy' ? (
                            <ArrowUpRight className={`w-3.5 h-3.5 text-emerald-400`} />
                          ) : (
                            <ArrowDownRight className={`w-3.5 h-3.5 text-red-400`} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`font-medium text-sm ${txn.type === 'buy' ? 'text-emerald-400' : 'text-red-400'}`}>
                              {txn.type.toUpperCase()}
                            </span>
                            <span className="text-white/70 text-sm truncate">{txn.tokenSymbol || 'Token'}</span>
                          </div>
                          <div className="text-[10px] text-white/30 truncate">
                            {new Date(txn.timestamp).toLocaleString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-white">
                            ${txn.valueUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          <div className="text-[10px] text-white/40">
                            {txn.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} tokens
                          </div>
                        </div>
                        <a
                          href={`https://solscan.io/tx/${txn.signature}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white/30 hover:text-primary transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    ))}
                    {transactions.length > 15 && (
                      <div className="text-center text-xs text-white/30 py-2">
                        + {transactions.length - 15} more transactions
                      </div>
                    )}
                  </div>
                ) : isLoadingTxns ? (
                  <div className="text-center text-xs text-white/40 py-4">
                    Loading transaction history...
                  </div>
                ) : (
                  <div className="text-center text-xs text-white/40 py-4">
                    No recent swaps found (requires $10+ trades)
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="px-4 py-3 border-t border-white/5 bg-[#080808]">
        <div className="text-xs font-mono text-white/30">
          Powered by MODEXO x402 Portfolio Agent • Data via Helius DAS
        </div>
      </div>
    </div>
  );
}

interface SmartEntryResult {
  tokenAddress: string;
  symbol: string;
  name: string;
  currentPrice: number;
  imageUrl: string | null;
  entryZones: {
    optimal: number;
    aggressive: number;
    conservative: number;
  };
  signals: {
    type: 'bullish' | 'bearish' | 'neutral';
    strength: number;
    reasons: string[];
  };
  volumeAnalysis: {
    h1Volume: number;
    h24Volume: number;
    volumeTrend: 'increasing' | 'decreasing' | 'stable';
    buyPressure: number;
  };
  momentum: {
    score: number;
    trend: 'up' | 'down' | 'sideways';
    strength: 'strong' | 'moderate' | 'weak';
  };
  support: {
    level1: number;
    level2: number;
  };
  recommendation: 'strong_buy' | 'buy' | 'wait' | 'avoid';
  confidence: number;
  liquidityUsd: number;
  marketCap: number;
}

function SmartEntryTerminalOutput({ onClose }: { onClose: () => void }) {
  const [tokenAddress, setTokenAddress] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<SmartEntryResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeEntry = async () => {
    if (!tokenAddress.trim()) return;
    
    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/smart-entry/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenAddress: tokenAddress.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to analyze entry points");
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'strong_buy': return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30';
      case 'buy': return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'wait': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'avoid': return 'text-red-400 bg-red-500/20 border-red-500/30';
      default: return 'text-white/60 bg-white/10 border-white/20';
    }
  };

  const getSignalColor = (type: string) => {
    switch (type) {
      case 'bullish': return 'text-emerald-400';
      case 'bearish': return 'text-red-400';
      default: return 'text-yellow-400';
    }
  };

  const getMomentumColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-emerald-400';
      case 'down': return 'text-red-400';
      default: return 'text-yellow-400';
    }
  };

  const formatPrice = (price: number) => {
    if (price < 0.0000001) return price.toExponential(2);
    if (price < 0.00001) return price.toExponential(3);
    if (price < 0.001) return price.toFixed(6);
    if (price < 1) return price.toFixed(4);
    return price.toFixed(2);
  };

  const formatVolume = (vol: number) => {
    if (vol >= 1e6) return `$${(vol / 1e6).toFixed(2)}M`;
    if (vol >= 1e3) return `$${(vol / 1e3).toFixed(1)}K`;
    return `$${vol.toFixed(0)}`;
  };

  return (
    <div className="bg-[#0a0a0a] border border-white/10 rounded-xl overflow-hidden" data-testid="smart-entry-terminal">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#0f0f0f]">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Terminal className="w-4 h-4 text-primary" />
            <span className="text-white/70 font-mono">agent://x402-smart-entry</span>
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
              READY
            </Badge>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-7 w-7 p-0 hover:bg-white/10"
          data-testid="button-close-smart-entry"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="h-[600px]">
        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <div className="text-xs text-white/40 font-mono">
              <span className="text-primary">$</span> x402-SmartEntryAdvisor v1.0.0
            </div>
            <div className="text-xs text-white/60">
              Enter a Solana token address to analyze optimal entry points, momentum, and buy signals.
            </div>
          </div>

          <div className="flex gap-3">
            <Input
              placeholder="Token address (e.g., EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v)"
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
              className="flex-1 bg-white/5 border-white/10 text-white font-mono text-sm"
              data-testid="input-token-address"
              onKeyDown={(e) => e.key === 'Enter' && analyzeEntry()}
            />
            <Button
              onClick={analyzeEntry}
              disabled={isAnalyzing || !tokenAddress.trim()}
              className="bg-primary hover:bg-primary/90"
              data-testid="button-analyze-entry"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Target className="w-4 h-4 mr-2" />
                  Analyze Entry
                </>
              )}
            </Button>
          </div>

          {error && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {result && (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center gap-3">
                  {result.imageUrl && (
                    <img src={result.imageUrl} alt={result.symbol} className="w-10 h-10 rounded-full" />
                  )}
                  <div>
                    <div className="font-bold text-white text-lg">{result.symbol}</div>
                    <div className="text-xs text-white/50">{result.name}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-white/40 mb-1">Current Price</div>
                  <div className="text-xl font-bold text-white font-mono">${formatPrice(result.currentPrice)}</div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-4 p-4 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                <div className="text-center">
                  <div className="text-xs text-white/40 mb-1">Recommendation</div>
                  <Badge className={`text-sm px-3 py-1 ${getRecommendationColor(result.recommendation)}`}>
                    {result.recommendation.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
                <div className="h-8 w-px bg-white/10" />
                <div className="text-center">
                  <div className="text-xs text-white/40 mb-1">Confidence</div>
                  <div className="text-lg font-bold text-primary">{result.confidence.toFixed(0)}%</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
                <div className="p-3 sm:p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex sm:flex-col items-center sm:items-stretch justify-between sm:justify-start sm:text-center">
                  <div className="text-xs text-white/40 sm:mb-2">Aggressive <span className="text-white/30">(-1%)</span></div>
                  <div className="text-base sm:text-lg font-bold text-emerald-400 font-mono truncate">${formatPrice(result.entryZones.aggressive)}</div>
                </div>
                <div className="p-3 sm:p-4 rounded-lg bg-primary/10 border border-primary/20 flex sm:flex-col items-center sm:items-stretch justify-between sm:justify-start sm:text-center">
                  <div className="text-xs text-white/40 sm:mb-2">Optimal <span className="text-white/30">(-3%)</span></div>
                  <div className="text-base sm:text-lg font-bold text-primary font-mono truncate">${formatPrice(result.entryZones.optimal)}</div>
                </div>
                <div className="p-3 sm:p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 flex sm:flex-col items-center sm:items-stretch justify-between sm:justify-start sm:text-center">
                  <div className="text-xs text-white/40 sm:mb-2">Conservative <span className="text-white/30">(-7%)</span></div>
                  <div className="text-base sm:text-lg font-bold text-blue-400 font-mono truncate">${formatPrice(result.entryZones.conservative)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className="w-4 h-4 text-primary" />
                    <span className="text-sm text-white/70">Signal Analysis</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs text-white/40">Type</span>
                      <span className={`text-xs font-bold ${getSignalColor(result.signals.type)}`}>
                        {result.signals.type.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-white/40">Strength</span>
                      <span className="text-xs font-mono text-white">{result.signals.strength}%</span>
                    </div>
                    <div className="mt-3 space-y-1">
                      {result.signals.reasons.slice(0, 3).map((reason, i) => (
                        <div key={i} className="text-xs text-white/50 flex items-start gap-1">
                          <span className="text-primary">•</span>
                          <span>{reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <span className="text-sm text-white/70">Momentum</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs text-white/40">Score</span>
                      <span className="text-xs font-mono text-white">{result.momentum.score}/100</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-white/40">Trend</span>
                      <span className={`text-xs font-bold ${getMomentumColor(result.momentum.trend)}`}>
                        {result.momentum.trend.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-white/40">Strength</span>
                      <span className="text-xs text-white">{result.momentum.strength}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 mb-3">
                    <PieChart className="w-4 h-4 text-primary" />
                    <span className="text-sm text-white/70">Volume Analysis</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs text-white/40">1H Volume</span>
                      <span className="text-xs font-mono text-white">{formatVolume(result.volumeAnalysis.h1Volume)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-white/40">24H Volume</span>
                      <span className="text-xs font-mono text-white">{formatVolume(result.volumeAnalysis.h24Volume)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-white/40">Trend</span>
                      <span className={`text-xs ${result.volumeAnalysis.volumeTrend === 'increasing' ? 'text-emerald-400' : result.volumeAnalysis.volumeTrend === 'decreasing' ? 'text-red-400' : 'text-yellow-400'}`}>
                        {result.volumeAnalysis.volumeTrend}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-white/40">Buy Pressure</span>
                      <span className={`text-xs ${result.volumeAnalysis.buyPressure > 55 ? 'text-emerald-400' : result.volumeAnalysis.buyPressure < 45 ? 'text-red-400' : 'text-yellow-400'}`}>
                        {result.volumeAnalysis.buyPressure.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-4 h-4 text-primary" />
                    <span className="text-sm text-white/70">Support Levels</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs text-white/40">Support 1</span>
                      <span className="text-xs font-mono text-emerald-400">${formatPrice(result.support.level1)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-white/40">Support 2</span>
                      <span className="text-xs font-mono text-blue-400">${formatPrice(result.support.level2)}</span>
                    </div>
                    <div className="flex justify-between mt-2">
                      <span className="text-xs text-white/40">Liquidity</span>
                      <span className="text-xs font-mono text-white">{formatVolume(result.liquidityUsd)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-white/40">Market Cap</span>
                      <span className="text-xs font-mono text-white">{formatVolume(result.marketCap)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-xs text-yellow-400/80">
                ⚠️ This is AI-generated analysis for educational purposes only. Not financial advice. Always DYOR.
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="px-4 py-3 border-t border-white/5 bg-[#080808]">
        <div className="text-xs font-mono text-white/30">
          Powered by MODEXO x402 Smart Entry Agent • Data via DexScreener
        </div>
      </div>
    </div>
  );
}

interface LiquidityResult {
  tokenAddress: string;
  symbol: string;
  name: string;
  imageUrl: string | null;
  currentPrice: number;
  liquidity: {
    totalUsd: number;
    baseAmount: number;
    quoteAmount: number;
    depth: 'deep' | 'moderate' | 'shallow' | 'critical';
  };
  concentration: {
    riskLevel: 'low' | 'medium' | 'high' | 'extreme';
    topPoolShare: number;
    poolCount: number;
  };
  slippage: {
    estimated1k: number;
    estimated10k: number;
    estimated50k: number;
  };
  metrics: {
    liquidityToMcap: number;
    volumeToLiquidity: number;
    healthScore: number;
  };
  dexDistribution: Array<{
    name: string;
    liquidity: number;
    share: number;
  }>;
  warnings: string[];
  recommendation: 'safe' | 'moderate' | 'caution' | 'avoid';
}

function LiquidityTerminalOutput({ onClose }: { onClose: () => void }) {
  const [tokenAddress, setTokenAddress] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<LiquidityResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeLiquidity = async () => {
    if (!tokenAddress.trim()) return;
    
    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/liquidity/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenAddress: tokenAddress.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to analyze liquidity");
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'safe': return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30';
      case 'moderate': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'caution': return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
      case 'avoid': return 'text-red-400 bg-red-500/20 border-red-500/30';
      default: return 'text-white/60 bg-white/10 border-white/20';
    }
  };

  const getDepthColor = (depth: string) => {
    switch (depth) {
      case 'deep': return 'text-emerald-400';
      case 'moderate': return 'text-yellow-400';
      case 'shallow': return 'text-orange-400';
      case 'critical': return 'text-red-400';
      default: return 'text-white/60';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-emerald-400';
      case 'medium': return 'text-yellow-400';
      case 'high': return 'text-orange-400';
      case 'extreme': return 'text-red-400';
      default: return 'text-white/60';
    }
  };

  const formatUsd = (val: number) => {
    if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
    if (val >= 1e3) return `$${(val / 1e3).toFixed(1)}K`;
    return `$${val.toFixed(0)}`;
  };

  return (
    <div className="bg-[#0a0a0a] border border-white/10 rounded-xl overflow-hidden" data-testid="liquidity-terminal">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#0f0f0f]">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Terminal className="w-4 h-4 text-primary" />
            <span className="text-white/70 font-mono">agent://x402-liquidity</span>
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
              READY
            </Badge>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-7 w-7 p-0 hover:bg-white/10"
          data-testid="button-close-liquidity"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="h-[600px]">
        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <div className="text-xs text-white/40 font-mono">
              <span className="text-primary">$</span> x402-LiquidityScanner v1.0.0
            </div>
            <div className="text-xs text-white/60">
              Enter a Solana token address to analyze liquidity depth, concentration risk, and slippage estimates.
            </div>
          </div>

          <div className="flex gap-3">
            <Input
              placeholder="Token address (e.g., EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v)"
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
              className="flex-1 bg-white/5 border-white/10 text-white font-mono text-sm"
              data-testid="input-liquidity-address"
              onKeyDown={(e) => e.key === 'Enter' && analyzeLiquidity()}
            />
            <Button
              onClick={analyzeLiquidity}
              disabled={isAnalyzing || !tokenAddress.trim()}
              className="bg-primary hover:bg-primary/90"
              data-testid="button-analyze-liquidity"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Droplets className="w-4 h-4 mr-2" />
                  Scan Liquidity
                </>
              )}
            </Button>
          </div>

          {error && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {result && (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center gap-3">
                  {result.imageUrl && (
                    <img src={result.imageUrl} alt={result.symbol} className="w-10 h-10 rounded-full" />
                  )}
                  <div>
                    <div className="font-bold text-white text-lg">{result.symbol}</div>
                    <div className="text-xs text-white/50">{result.name}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-white/40 mb-1">Total Liquidity</div>
                  <div className="text-xl font-bold text-white font-mono">{formatUsd(result.liquidity.totalUsd)}</div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-4 p-4 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                <div className="text-center">
                  <div className="text-xs text-white/40 mb-1">Safety Rating</div>
                  <Badge className={`text-sm px-3 py-1 ${getRecommendationColor(result.recommendation)}`}>
                    {result.recommendation.toUpperCase()}
                  </Badge>
                </div>
                <div className="h-8 w-px bg-white/10" />
                <div className="text-center">
                  <div className="text-xs text-white/40 mb-1">Health Score</div>
                  <div className="text-lg font-bold text-primary">{result.metrics.healthScore}/100</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
                <div className="p-3 sm:p-4 rounded-lg bg-white/5 border border-white/10 flex sm:flex-col items-center sm:items-stretch justify-between sm:justify-start sm:text-center">
                  <div className="text-xs text-white/40 sm:mb-2">Depth</div>
                  <div className={`text-base sm:text-lg font-bold ${getDepthColor(result.liquidity.depth)}`}>
                    {result.liquidity.depth.toUpperCase()}
                  </div>
                </div>
                <div className="p-3 sm:p-4 rounded-lg bg-white/5 border border-white/10 flex sm:flex-col items-center sm:items-stretch justify-between sm:justify-start sm:text-center">
                  <div className="text-xs text-white/40 sm:mb-2">Concentration Risk</div>
                  <div className={`text-base sm:text-lg font-bold ${getRiskColor(result.concentration.riskLevel)}`}>
                    {result.concentration.riskLevel.toUpperCase()}
                  </div>
                </div>
                <div className="p-3 sm:p-4 rounded-lg bg-white/5 border border-white/10 flex sm:flex-col items-center sm:items-stretch justify-between sm:justify-start sm:text-center">
                  <div className="text-xs text-white/40 sm:mb-2">Pool Count</div>
                  <div className="text-base sm:text-lg font-bold text-white">{result.concentration.poolCount}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className="w-4 h-4 text-primary" />
                    <span className="text-sm text-white/70">Slippage Estimates</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs text-white/40">$1K Trade</span>
                      <span className={`text-xs font-mono ${result.slippage.estimated1k < 1 ? 'text-emerald-400' : result.slippage.estimated1k < 3 ? 'text-yellow-400' : 'text-red-400'}`}>
                        ~{result.slippage.estimated1k.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-white/40">$10K Trade</span>
                      <span className={`text-xs font-mono ${result.slippage.estimated10k < 2 ? 'text-emerald-400' : result.slippage.estimated10k < 5 ? 'text-yellow-400' : 'text-red-400'}`}>
                        ~{result.slippage.estimated10k.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-white/40">$50K Trade</span>
                      <span className={`text-xs font-mono ${result.slippage.estimated50k < 5 ? 'text-emerald-400' : result.slippage.estimated50k < 10 ? 'text-yellow-400' : 'text-red-400'}`}>
                        ~{result.slippage.estimated50k.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 mb-3">
                    <PieChart className="w-4 h-4 text-primary" />
                    <span className="text-sm text-white/70">Metrics</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs text-white/40">Liq/MCap Ratio</span>
                      <span className="text-xs font-mono text-white">{result.metrics.liquidityToMcap.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-white/40">Vol/Liq Ratio</span>
                      <span className="text-xs font-mono text-white">{result.metrics.volumeToLiquidity.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-white/40">Top Pool Share</span>
                      <span className="text-xs font-mono text-white">{result.concentration.topPoolShare.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {result.dexDistribution.length > 0 && (
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 mb-3">
                    <Globe className="w-4 h-4 text-primary" />
                    <span className="text-sm text-white/70">DEX Distribution</span>
                  </div>
                  <div className="space-y-2">
                    {result.dexDistribution.map((dex, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-xs text-white/60">{dex.name}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full" 
                              style={{ width: `${Math.min(dex.share, 100)}%` }} 
                            />
                          </div>
                          <span className="text-xs font-mono text-white/60 w-16 text-right">{formatUsd(dex.liquidity)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.warnings.length > 0 && (
                <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-orange-400" />
                    <span className="text-sm text-orange-400">Warnings</span>
                  </div>
                  <div className="space-y-1">
                    {result.warnings.map((warning, i) => (
                      <div key={i} className="text-xs text-orange-400/80 flex items-start gap-1">
                        <span className="text-orange-400">•</span>
                        <span>{warning}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-xs text-yellow-400/80">
                ⚠️ This is AI-generated analysis for educational purposes only. Not financial advice. Always DYOR.
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="px-4 py-3 border-t border-white/5 bg-[#080808]">
        <div className="text-xs font-mono text-white/30">
          Powered by MODEXO x402 Liquidity Scanner • Data via DexScreener
        </div>
      </div>
    </div>
  );
}

const AGENT_CATEGORIES = ["AI Utility", "Marketing x402", "B2B x402", "Verification"] as const;

export default function Dashboard() {
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("AI Utility");

  const filteredAgents = agents.filter(agent => agent.category === activeCategory);

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

        {activeAgent ? (
          <div className="space-y-6">
            <Button
              variant="ghost"
              onClick={() => setActiveAgent(null)}
              className="text-white/50 hover:text-white -ml-2"
            >
              ← Back to Agents
            </Button>
            {activeAgent === 'x402-ModexoBet' ? (
              <PolymarketTerminalOutput onClose={() => setActiveAgent(null)} />
            ) : activeAgent === 'x402-connection-checker' ? (
              <GitHubCheckerTerminalOutput onClose={() => setActiveAgent(null)} />
            ) : activeAgent === 'x402-audit' ? (
              <ContractAuditorTerminalOutput onClose={() => setActiveAgent(null)} />
            ) : activeAgent === 'x402-kyc' ? (
              <KYCAMLTerminalOutput onClose={() => setActiveAgent(null)} />
            ) : activeAgent === 'x402-portfolio' ? (
              <PortfolioTerminalOutput onClose={() => setActiveAgent(null)} />
            ) : activeAgent === 'x402-entry' ? (
              <SmartEntryTerminalOutput onClose={() => setActiveAgent(null)} />
            ) : activeAgent === 'x402-liquidity' ? (
              <LiquidityTerminalOutput onClose={() => setActiveAgent(null)} />
            ) : (
              <AgentTerminalOutput 
                agentId={activeAgent} 
                onClose={() => setActiveAgent(null)} 
              />
            )}
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl font-heading font-bold mb-2">
                <span className="text-primary">x402</span> Agent Categories
              </h1>
              <p className="text-white/50">
                Deploy autonomous agents to scan, analyze, and execute on Solana. Select a category and activate an agent.
              </p>
            </div>

            <Tabs value={activeCategory} onValueChange={setActiveCategory} className="mb-8">
              <TabsList className="bg-white/5 border border-white/10 p-1 h-auto flex-wrap">
                {AGENT_CATEGORIES.map((category) => (
                  <TabsTrigger
                    key={category}
                    value={category}
                    className="data-[state=active]:bg-primary data-[state=active]:text-white text-white/60 px-4 py-2 text-sm"
                    data-testid={`tab-${category.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {filteredAgents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  isActive={activeAgent === agent.id}
                  onActivate={() => setActiveAgent(agent.id)}
                />
              ))}
            </div>
          </>
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
