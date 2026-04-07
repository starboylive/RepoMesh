"use client";

import React from "react";
import { Folder, File, Layers } from "lucide-react";

interface SidebarProps {
  nodes: any[];
  selectedNode: any;
  onNodeSelect: (node: any) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ nodes, selectedNode, onNodeSelect }) => {
  return (
    <div className="w-80 h-full bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 overflow-y-auto custom-scrollbar">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
            <Layers size={18} className="text-[#00f5d4]" />
            <h2 className="text-white font-black text-xs uppercase tracking-[0.2em]">Repository Map</h2>
        </div>
        <span className="text-[10px] font-mono text-[#00f5d4] bg-[#00f5d4]/10 border border-[#00f5d4]/20 px-2 py-0.5 rounded-full">{nodes.length}</span>
      </div>
      <div className="space-y-2">
        {nodes.map((node) => (
          <div
            key={node.id}
            className={`flex items-center space-x-3 px-4 py-3 rounded-2xl cursor-pointer transition-all border group ${
              selectedNode?.id === node.id 
                ? "bg-[#00f5d4]/10 border-[#00f5d4]/30 text-[#00f5d4] shadow-[0_0_20px_rgba(0,245,212,0.1)]" 
                : "bg-white/2 border-white/5 text-slate-400 hover:bg-white/5 hover:border-white/10 hover:text-white"
            }`}
            onClick={() => onNodeSelect(node)}
          >
            {node.type === "directory" ? (
              <Folder size={16} className="text-amber-400 group-hover:scale-110 transition-transform" />
            ) : (
              <File size={16} className="text-[#7b61ff] group-hover:scale-110 transition-transform" />
            )}
            <span className="text-xs font-medium truncate tracking-wide">{node.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
