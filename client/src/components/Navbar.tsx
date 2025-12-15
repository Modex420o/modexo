import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, X, Copy, Check } from "lucide-react";
import { useState } from "react";
import logo from "@assets/mdexo_logo2_1765804066973.png";

const CONTRACT_ADDRESS = "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyContract = () => {
    navigator.clipboard.writeText(CONTRACT_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-black/60 backdrop-blur-xl">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <img src={logo} alt="MODEXO" className="h-8 w-8 object-contain" />
          <span className="text-lg font-heading font-bold text-white tracking-wider">MODEXO</span>
        </Link>

        <div className="hidden md:flex items-center gap-3">
          <span className="text-xs text-gray-500 uppercase tracking-wider">Contract:</span>
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5">
            <code className="text-xs text-gray-300 font-mono">
              {CONTRACT_ADDRESS.slice(0, 6)}...{CONTRACT_ADDRESS.slice(-4)}
            </code>
            <button
              onClick={copyContract}
              className="text-gray-400 hover:text-primary transition-colors"
              data-testid="button-copy-contract"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        <div className="hidden md:flex items-center">
          <Link href="/app">
            <Button className="bg-primary hover:bg-primary/90 text-white font-medium text-sm px-5" data-testid="button-launch-app">
              Launch App
            </Button>
          </Link>
        </div>

        <button className="md:hidden text-white" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {isOpen && (
        <div className="md:hidden bg-black/95 border-b border-white/5 p-4 flex flex-col gap-4 absolute w-full">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 uppercase tracking-wider">Contract:</span>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 flex-1">
              <code className="text-xs text-gray-300 font-mono truncate">
                {CONTRACT_ADDRESS.slice(0, 8)}...{CONTRACT_ADDRESS.slice(-6)}
              </code>
              <button
                onClick={copyContract}
                className="text-gray-400 hover:text-primary transition-colors ml-auto"
                data-testid="button-copy-contract-mobile"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
          <Link href="/app" onClick={() => setIsOpen(false)}>
            <Button className="w-full bg-primary text-white font-medium" data-testid="button-launch-app-mobile">
              Launch App
            </Button>
          </Link>
        </div>
      )}
    </nav>
  );
}
