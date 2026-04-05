"use client";

import React, { useRef, useEffect, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";

interface GraphProps {
  data: { nodes: any[]; edges: any[] };
  onNodeClick: (node: any) => void;
  onNodeDoubleClick: (node: any) => void;
}

const Graph: React.FC<GraphProps> = ({ data, onNodeClick, onNodeDoubleClick }) => {
  const fgRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [graphData, setGraphData] = useState<{ nodes: any[]; links: any[] }>({ nodes: [], links: [] });
  const [hoverNode, setHoverNode] = useState<any>(null);
  const [highlightNodes, setHighlightNodes] = useState(new Set());
  const [highlightLinks, setHighlightLinks] = useState(new Set());

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ width, height });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (!data || !data.nodes) return;
    
    const nodes = data.nodes.map(node => ({
        ...node,
        // Directory nodes are heavier to act as "anchors"
        val: node.type === "directory" ? 20 : 8 
    }));

    const links = data.edges.map(edge => ({
      source: edge.source,
      target: edge.target,
      type: edge.type || "dependency"
    }));
    
    const nodeIds = new Set(nodes.map(n => n.id));
    const validLinks = links.filter(l => nodeIds.has(l.source) && nodeIds.has(l.target));
    
    setGraphData({ nodes, links: validLinks });
  }, [data]);

  const handleNodeHover = (node: any) => {
    highlightNodes.clear();
    highlightLinks.clear();
    if (node) {
      highlightNodes.add(node.id);
      graphData.links.forEach(link => {
        if (link.source.id === node.id || link.target.id === node.id) {
          highlightLinks.add(link);
          highlightNodes.add(link.source.id);
          highlightNodes.add(link.target.id);
        }
      });
    }
    setHoverNode(node || null);
    // Force refresh
    setHighlightNodes(new Set(highlightNodes));
    setHighlightLinks(new Set(highlightLinks));
  };

  useEffect(() => {
    if (fgRef.current && graphData.nodes.length > 0) {
      // FIXING THE "EXPLOSION": 
      // 1. Stronger gravity (centering) to keep folders from flying away
      // 2. Adjust many-body force so they don't repel TOO much
      fgRef.current.d3Force('charge').strength(-150).distanceMax(500); 
      fgRef.current.d3Force('center').strength(0.15); // Stronger pull to middle
      
      // Keep folders closer to their children
      fgRef.current.d3Force('link').distance((link: any) => {
          return link.type === "structural" ? 30 : 100; 
      }).iterations(2);
      
      fgRef.current.d3ReheatSimulation();
      
      setTimeout(() => {
          if (fgRef.current) fgRef.current.zoomToFit(600, 80);
      }, 800);
    }
  }, [graphData]);

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center bg-transparent rounded-3xl relative">
      
      {/* Legend & Focus Indicator */}
      <div className="absolute top-6 left-6 z-20 pointer-events-none space-y-4">
        {hoverNode && (
            <div className="bg-[#00f5d4]/10 backdrop-blur-xl px-5 py-3 rounded-2xl border border-[#00f5d4]/30 animate-in fade-in zoom-in-95">
                <p className="text-[#00f5d4] text-[10px] font-mono font-bold tracking-widest uppercase mb-1">Active Probe</p>
                <p className="text-white text-sm font-semibold">{hoverNode.id.split('/').pop()}</p>
            </div>
        )}
      </div>

      <ForceGraph2D
        ref={fgRef}
        graphData={graphData}
        width={dimensions.width}
        height={dimensions.height}
        nodeLabel="id"
        // STRAIGHT LINES FIX: linkCurvature set to 0
        linkCurvature={0} 
        
        // PARTICLES ONLY ON HIGHLIGHT:
        linkDirectionalParticles={(link: any) => highlightLinks.has(link) ? 4 : 0}
        linkDirectionalParticleSpeed={0.006}
        linkDirectionalParticleWidth={3}
        
        nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
            const isHighlighted = highlightNodes.size === 0 || highlightNodes.has(node.id);
            const alpha = isHighlighted ? 1 : 0.08;
            const nodeColor = node.type === "directory" ? "#fbbf24" : "#00f5d4";

            // Draw Node Glow
            if (isHighlighted && !node.star) {
                ctx.shadowBlur = 15 / globalScale;
                ctx.shadowColor = nodeColor;
            }

            ctx.beginPath();
            ctx.arc(node.x, node.y, node.type === "directory" ? 6 : 4, 0, 2 * Math.PI, false);
            ctx.fillStyle = nodeColor;
            ctx.globalAlpha = alpha;
            ctx.fill();
            ctx.shadowBlur = 0; // Reset glow for text

            // Label rendering - only when zoomed in or highlighted
            if (globalScale > 1.5 || isHighlighted) {
                const label = node.id.split('/').pop();
                const fontSize = 11 / globalScale;
                ctx.font = `${fontSize}px 'JetBrains Mono', monospace`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                ctx.fillText(label, node.x, node.y + (node.type === "directory" ? 8 : 6));
            }
            ctx.globalAlpha = 1;
        }}
        
        linkColor={(link: any) => {
            const isHighlighted = highlightLinks.size === 0 || highlightLinks.has(link);
            return isHighlighted ? "rgba(0, 245, 212, 0.4)" : "rgba(255, 255, 255, 0.03)";
        }}
        
        linkWidth={(link: any) => highlightLinks.has(link) ? 2 : 1}
        onNodeClick={onNodeClick}
        onNodeHover={handleNodeHover}
        onNodeRightClick={onNodeDoubleClick}
        backgroundColor="transparent"
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
      />
    </div>
  );
};

export default Graph;