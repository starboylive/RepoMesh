"use client";

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import dynamic from "next/dynamic";
import { X, Code, FileText, Activity, Layers, Terminal, Github } from "lucide-react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import AIExplanation from "@/components/AIExplanation";

// --- GALAXY BACKGROUND COMPONENT (React Port) ---
const GalaxyBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W: number, H: number;
    let frame = 0;
    let nodes: any[] = [];
    let packets: any[] = [];
    const NODE_N = 60;
    const LINK_MAX = 200;
    const COLORS = ["#00f5d4", "#7b61ff", "#ff6b6b", "#63b3ed", "#48bb78"];

    const resize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };

    const initNodes = () => {
      nodes = [];
      // Active Nodes
      for (let i = 0; i < NODE_N; i++) {
        nodes.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          r: Math.random() * 2.5 + 1,
          c: COLORS[Math.floor(Math.random() * COLORS.length)],
          ph: Math.random() * Math.PI * 2,
          spd: Math.random() * 0.02 + 0.01,
          star: false,
        });
      }
      // Background Stars
      for (let i = 0; i < 120; i++) {
        nodes.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          vx: 0, vy: 0, r: 0.5, c: "#ffffff", ph: Math.random() * Math.PI * 2,
          spd: 0.03, star: true,
        });
      }
    };

    const spawnPacket = () => {
      const a = Math.floor(Math.random() * NODE_N);
      const b = Math.floor(Math.random() * NODE_N);
      if (a === b) return;
      const dx = nodes[b].x - nodes[a].x;
      const dy = nodes[b].y - nodes[a].y;
      if (Math.hypot(dx, dy) > LINK_MAX) return;
      packets.push({ a, b, t: 0, spd: 0.004 + Math.random() * 0.006 });
    };

    const animate = () => {
      ctx.clearRect(0, 0, W, H);
      
      nodes.forEach((n) => {
        if (!n.star) {
          n.x += n.vx; n.y += n.vy;
          if (n.x < 0 || n.x > W) n.vx *= -1;
          if (n.y < 0 || n.y > H) n.vy *= -1;
        }
        n.ph += n.spd;
      });

      // Draw Edges
      ctx.lineWidth = 0.5;
      for (let i = 0; i < NODE_N; i++) {
        for (let j = i + 1; j < NODE_N; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const dist = Math.hypot(dx, dy);
          if (dist < LINK_MAX) {
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(99,179,237,${(1 - dist / LINK_MAX) * 0.15})`;
            ctx.stroke();
          }
        }
      }

      // Draw Packets
      packets.forEach((pk, i) => {
        pk.t += pk.spd;
        if (pk.t > 1) { packets.splice(i, 1); return; }
        const a = nodes[pk.a], b = nodes[pk.b];
        const px = a.x + (b.x - a.x) * pk.t;
        const py = a.y + (b.y - a.y) * pk.t;
        ctx.beginPath();
        ctx.arc(px, py, 1.8, 0, Math.PI * 2);
        ctx.fillStyle = a.c;
        ctx.fill();
      });

      // Draw Nodes
      nodes.forEach((n) => {
        ctx.globalAlpha = n.star ? 0.3 + 0.2 * Math.sin(n.ph) : 1;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = n.c;
        ctx.fill();
        if(!n.star && Math.sin(n.ph) > 0.8) { // Add glow to some nodes
            ctx.shadowBlur = 10;
            ctx.shadowColor = n.c;
        } else {
            ctx.shadowBlur = 0;
        }
      });
      ctx.globalAlpha = 1;
      frame++;
      requestAnimationFrame(animate);
    };

    resize();
    initNodes();
    animate();
    const pInterval = setInterval(spawnPacket, 350);
    window.addEventListener("resize", resize);

    return () => {
      clearInterval(pInterval);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 bg-[#060910]" />;
};

const Graph = dynamic(() => import("@/components/Graph"), { ssr: false });

export default function Home() {
  const [showAnalyzer, setShowAnalyzer] = useState(false);
  const [repoUrl, setRepoUrl] = useState("");
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [explaining, setExplaining] = useState(false);

  const handleAnalyze = async (url: string) => {
    setRepoUrl(url);
    setLoading(true);
    setExplanation(null);
    setSelectedNode(null); // Clear selection on new analysis
    try {
      const response = await axios.post("/api/analyze", { url });
      setGraphData({ nodes: response.data.nodes, edges: response.data.edges });
      setExplanation(response.data.architecture_explanation);
    } catch (error) {
      console.error(error);
      alert("Analysis failed. Backend might be offline.");
    } finally {
      setLoading(false);
    }
  };

  const handleNodeSelect = async (node: any) => {
    setSelectedNode(node);
    if (node.type === "file") {
      setExplaining(true);
      try {
        const response = await axios.post("/api/explain-code", {
          repo_url: repoUrl,
          file_path: node.id
        });
        setExplanation(response.data.explanation);
      } catch (error) {
        console.error(error);
        setExplanation("Failed to generate file explanation. Check if the backend is online.");
      } finally {
        setExplaining(false);
      }
    }
  };

  const handleNodeDoubleClick = async (node: any) => {
    if (node.type === "file") {
      try {
        const res = await axios.post("/api/file-content", {
          repo_url: repoUrl,
          file_path: node.id
        });
        setFileContent(res.data.content);
      } catch (e) {
        console.error(e);
        alert("Could not fetch file content. Check if the backend is online.");
      }
    }
  };

  return (
    <div className="relative min-h-screen bg-[#060910] text-slate-200">
      <GalaxyBackground />

      {/* --- LANDING PAGE VIEW --- */}
      {!showAnalyzer ? (
        <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">
          <nav className="fixed top-0 w-full p-8 flex justify-between items-center backdrop-blur-sm">
            <div className="flex items-center gap-3">
               <div className="p-2 bg-[#00f5d4]/10 border border-[#00f5d4]/20 rounded-xl">
                 <Terminal size={20} className="text-[#00f5d4]" />
               </div>
               <span className="font-bold text-xl font-mono tracking-tight">GIT<span className="text-[#7b61ff]">MESH</span></span>
            </div>
            <button onClick={() => setShowAnalyzer(true)} className="text-sm font-medium hover:text-[#00f5d4] transition-colors">Documentation</button>
          </nav>

          <div className="animate-in fade-in slide-in-from-bottom-12 duration-1000">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold tracking-[0.2em] text-[#00f5d4] mb-8 uppercase">
              <Activity size={12} /> Neural Code Mapping Active
            </div>
            <h1 className="text-7xl md:text-9xl font-black mb-8 tracking-tighter leading-[0.85]">
              GRAPHING<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f5d4] via-[#7b61ff] to-[#ff6b6b]">INTELLIGENCE</span>
            </h1>
            <p className="max-w-2xl text-slate-400 text-lg md:text-xl font-light mb-12 leading-relaxed">
              Transform flat GitHub repositories into multi-dimensional neural networks. 
              Understand dependencies, identify bottlenecks, and explore codebases visually.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <button 
                onClick={() => setShowAnalyzer(true)}
                className="px-10 py-5 bg-[#00f5d4] text-[#060910] font-black rounded-2xl hover:scale-105 transition-all shadow-[0_0_40px_rgba(0,245,212,0.25)]"
              >
                INITIALIZE SESSION
              </button>
              <button className="px-10 py-5 bg-white/5 border border-white/10 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition-all">
                <Github size={20} /> VIEW SOURCE
              </button>
            </div>
          </div>
        </main>
      ) : (
        /* --- ANALYZER DASHBOARD VIEW --- */
        <main className="relative z-10 flex flex-col h-screen overflow-hidden">
          <Navbar onAnalyze={handleAnalyze} loading={loading} />
          <div className="flex flex-1 overflow-hidden p-4 md:p-6 gap-6 min-h-0">
            <div className="flex-shrink-0">
              <Sidebar nodes={graphData.nodes} selectedNode={selectedNode} onNodeSelect={handleNodeSelect} />
            </div>
            
            <div className="flex-1 relative flex gap-6 min-w-0 h-full">
              <div className="flex-1 relative min-w-0 h-full">
                {loading && (
                  <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#060910]/90 backdrop-blur-xl rounded-3xl">
                    <div className="w-16 h-16 border-t-2 border-[#00f5d4] rounded-full animate-spin mb-6" />
                    <p className="font-mono text-[#00f5d4] animate-pulse tracking-[0.3em] text-sm">PARSING REPOSITORY ARCHITECTURE...</p>
                  </div>
                )}
                
                <div className="w-full h-full rounded-3xl border border-white/5 bg-[#0c111a]/40 backdrop-blur-md overflow-hidden relative group">
                  {graphData.nodes.length > 0 ? (
                    <Graph 
                      data={graphData} 
                      onNodeClick={handleNodeSelect} 
                      onNodeDoubleClick={handleNodeDoubleClick} 
                    />
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-4">
                      <Layers size={64} className="opacity-10" />
                      <p className="font-mono text-sm tracking-widest uppercase">Awaiting Repository Input</p>
                    </div>
                  )}
                </div>
              </div>

              {/* AI Documentation Panel */}
              {(explanation || explaining || loading) && (
                <div className="w-96 flex-shrink-0 h-full animate-in slide-in-from-right-10 duration-500">
                  <AIExplanation 
                    explanation={explanation} 
                    loading={explaining || (loading && !graphData.nodes.length)} 
                    selectedNode={selectedNode} 
                  />
                </div>
              )}
            </div>
          </div>

          {/* Code Viewer Drawer (Overlay) */}
          {fileContent && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-20 bg-[#060910]/80 backdrop-blur-2xl animate-in zoom-in-95 duration-300">
               <div className="w-full max-w-6xl h-full bg-[#0c111a] border border-white/10 rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden">
                  <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/2">
                    <div className="flex items-center gap-3">
                        <Code size={18} className="text-[#7b61ff]" />
                        <span className="font-mono text-xs text-slate-400 tracking-wider">{selectedNode?.id}</span>
                    </div>
                    <button onClick={() => setFileContent(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400"><X /></button>
                  </div>
                  <div className="flex-1 overflow-auto p-10 font-mono text-sm leading-relaxed text-[#c9d1d9] custom-scrollbar">
                    <pre className="whitespace-pre-wrap">{fileContent}</pre>
                  </div>
               </div>
            </div>
          )}
        </main>
      )}
    </div>
  );
}