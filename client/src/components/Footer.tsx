import { Twitter, Send, Github } from "lucide-react";
import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="py-12 border-t border-white/10 bg-[#050505]/80 backdrop-blur-[2px] relative z-10">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-center md:text-left">
            <h3 className="text-2xl font-bold font-heading text-white mb-2">MODEXO</h3>
          </div>

          <div className="flex gap-6">
            <a href="#" className="text-gray-400 hover:text-primary transition-colors">
              <Twitter size={24} />
            </a>
            <a href="#" className="text-gray-400 hover:text-primary transition-colors">
              <Send size={24} />
            </a>
            <a href="#" className="text-gray-400 hover:text-primary transition-colors">
              <Github size={24} />
            </a>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-white/5 text-center text-gray-600 text-sm">
          © 2025 MODEXO. All rights reserved. Not financial advice.
        </div>
      </div>
    </footer>
  );
}
