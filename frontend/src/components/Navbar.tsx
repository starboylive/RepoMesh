"use client";

import React, { useState } from "react";
import { Search, Github, Terminal } from "lucide-react";

interface NavbarProps {
  onAnalyze: (url: string) => void;
  loading: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ onAnalyze, loading }) => {
  const [repoUrl, setRepoUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (repoUrl.trim()) {
      onAnalyze(repoUrl.trim());
    }
  };

  return (
    <nav className="h-20 bg-white/5 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-8 z-50">
      <div className="flex items-center space-x-4">
        <div className="p-2 bg-[#00f5d4]/10 border border-[#00f5d4]/20 rounded-xl">
            <Terminal size={20} className="text-[#00f5d4]" />
        </div>
        <h1 className="text-white font-black text-xl tracking-tighter uppercase font-mono">Git<span className="text-[#7b61ff]">Mesh</span></h1>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 max-w-xl mx-16">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-[#00f5d4] transition-colors">
            <Github size={18} />
          </div>
          <input
            type="text"
            className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-2xl focus:ring-2 focus:ring-[#00f5d4]/50 focus:border-[#00f5d4]/50 block pl-12 pr-28 py-3 transition-all outline-none placeholder:text-slate-600"
            placeholder="Paste repository URL..."
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading}
            className="absolute top-1.5 right-1.5 bg-[#00f5d4] text-[#060910] text-xs font-black px-6 py-2 rounded-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            {loading ? "MAPPING..." : "INITIALIZE"}
          </button>
        </div>
      </form>

      <div className="flex items-center space-x-4">
        <a 
            href="https://github.com" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-slate-400 hover:text-slate-100 transition-colors"
        >
          <Github size={24} />
        </a>
      </div>
    </nav>
  );
};

export default Navbar;
