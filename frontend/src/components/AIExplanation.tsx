"use client";

import React, { useState } from "react";
import { Sparkles, Loader2, BookOpen, Layers, Info, User, Code, ArrowRight } from "lucide-react";

interface AIExplanationProps {
  explanation: string | null;
  loading: boolean;
  selectedNode: any;
}

const AIExplanation: React.FC<AIExplanationProps> = ({ explanation, loading, selectedNode }) => {
  const [view, setView] = useState<'beginner' | 'developer'>('beginner');

  // Attempt to parse structured JSON from AI
  let structuredData: any = null;
  if (explanation && !selectedNode) {
    try {
      // Find the first '{' and last '}' to extract the JSON object
      const startIdx = explanation.indexOf('{');
      const endIdx = explanation.lastIndexOf('}');
      
      if (startIdx !== -1 && endIdx !== -1) {
        let jsonStr = explanation.substring(startIdx, endIdx + 1);
        
        // Robust cleanup: remove potential control characters and ensure proper escaping
        // This helps if AI outputs slightly malformed JSON
        jsonStr = jsonStr.replace(/[\u0000-\u001F\u007F-\u009F]/g, ""); 
        
        structuredData = JSON.parse(jsonStr);
      }
    } catch (e) {
      console.warn("Could not parse AI response as JSON", e);
    }
  }

  return (
    <div className="w-96 h-full bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 flex flex-col overflow-y-auto custom-scrollbar">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-2">
            <div className="p-2 bg-[#7b61ff]/10 border border-[#7b61ff]/20 rounded-xl">
                <Sparkles size={18} className="text-[#7b61ff]" />
            </div>
            <h2 className="text-white font-black text-xs uppercase tracking-[0.2em]">Smart Docs</h2>
        </div>
        
        {structuredData && (
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
            <button 
              onClick={() => setView('beginner')}
              className={`p-2 rounded-lg transition-all ${view === 'beginner' ? 'bg-[#00f5d4] text-[#060910]' : 'text-slate-400'}`}
            >
              <User size={14} />
            </button>
            <button 
              onClick={() => setView('developer')}
              className={`p-2 rounded-lg transition-all ${view === 'developer' ? 'bg-[#7b61ff] text-white' : 'text-slate-400'}`}
            >
              <Code size={14} />
            </button>
          </div>
        )}
      </div>

      {!selectedNode && !explanation && !loading && (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-center px-4">
          <div className="p-4 bg-white/2 rounded-3xl border border-white/5 mb-6">
            <BookOpen size={32} className="opacity-20" />
          </div>
          <p className="text-sm font-medium text-slate-400">Ready to Document</p>
          <p className="text-xs text-slate-600 mt-2">Initialize a repository to see AI-powered architecture and dependency flow.</p>
        </div>
      )}

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="relative">
            <div className="w-16 h-16 border-2 border-[#7b61ff]/20 border-t-[#7b61ff] rounded-full animate-spin" />
            <Sparkles size={20} className="text-[#7b61ff] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <p className="text-slate-400 text-xs font-mono mt-6 tracking-[0.2em] uppercase animate-pulse">Analyzing Neural Mesh...</p>
        </div>
      ) : (
        explanation && (
          <div className="flex-1 space-y-6 animate-in fade-in duration-500">
             {selectedNode && (
                <div className="p-4 bg-[#7b61ff]/10 rounded-2xl border border-[#7b61ff]/20 flex items-center gap-3">
                    <div className="p-2 bg-[#7b61ff]/20 rounded-lg">
                        <Info size={14} className="text-[#7b61ff]" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[#7b61ff] text-[10px] font-black uppercase tracking-wider">File Insights</p>
                        <p className="text-white text-xs font-mono truncate">{selectedNode.id}</p>
                    </div>
                </div>
             )}

             {structuredData ? (
               <div className="space-y-8">
                  {/* Perspective Toggle Description */}
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    {view === 'beginner' ? <User size={10} /> : <Code size={10} />}
                    Perspective: {view === 'beginner' ? 'Normal Person' : 'Technical Architect'}
                  </div>

                  <div className="space-y-6">
                    <section>
                      <h3 className="text-[#00f5d4] font-black text-[10px] uppercase tracking-widest mb-3">Project Overview</h3>
                      <p className="text-slate-300 text-sm leading-relaxed font-medium">
                        {structuredData.project_overview}
                      </p>
                    </section>

                    <section>
                      <h3 className="text-[#7b61ff] font-black text-[10px] uppercase tracking-widest mb-3">
                        {view === 'beginner' ? 'The Big Picture' : 'Technical Breakdown'}
                      </h3>
                      <p className="text-slate-300 text-sm leading-relaxed font-medium">
                        {view === 'beginner' ? structuredData.beginner_story : structuredData.developer_breakdown}
                      </p>
                    </section>

                    {structuredData.execution_path && Array.isArray(structuredData.execution_path) && (
                      <section>
                        <h3 className="text-white font-black text-[10px] uppercase tracking-widest mb-4">Execution Flow</h3>
                        <div className="space-y-4">
                          {structuredData.execution_path.map((step: any, idx: number) => (
                            <div key={idx} className="relative pl-6 border-l border-white/10 pb-4 last:pb-0">
                              <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full bg-[#00f5d4] shadow-[0_0_100px_rgba(0,245,212,0.5)]" />
                              <div className="bg-white/2 border border-white/5 rounded-xl p-3">
                                <p className="text-[#00f5d4] text-[9px] font-mono mb-1">STEP {step.step}</p>
                                <p className="text-white text-xs font-bold mb-1">{step.action}</p>
                                <p className="text-slate-500 text-[10px] font-mono mb-2 truncate">{step.file}</p>
                                <p className="text-slate-400 text-[11px] leading-relaxed">{step.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    <section>
                      <h3 className="text-[#ff6b6b] font-black text-[10px] uppercase tracking-widest mb-3">Interconnections</h3>
                      <p className="text-slate-400 text-xs leading-relaxed font-medium italic">
                        {structuredData.interconnections}
                      </p>
                    </section>
                  </div>
               </div>
             ) : (
               <div className="space-y-4">
                  {explanation.includes("quota") && (
                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl mb-6">
                      <p className="text-amber-500 text-[10px] font-black uppercase tracking-widest mb-1">API Quota Reached</p>
                      <p className="text-amber-200/70 text-xs leading-relaxed">The AI is currently resting. Please wait about 60 seconds and try analyzing again.</p>
                    </div>
                  )}
                  {explanation.split('\n').map((line, i) => {
                      if (line.startsWith('**') || line.startsWith('#')) {
                          return <h3 key={i} className="text-[#00f5d4] font-black text-xs uppercase tracking-widest mt-8 mb-4">{line.replace(/\*|#/g, '')}</h3>
                      }
                      if (line.trim() === '') return <div key={i} className="h-4" />
                      return <p key={i} className="text-[13px] leading-[1.6] text-slate-300 font-medium">{line}</p>
                  })}
               </div>
             )}
          </div>
        )
      )}
    </div>
  );
};

export default AIExplanation;
