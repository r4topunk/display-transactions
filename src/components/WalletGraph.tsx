import React, { useCallback, useEffect, useRef, useState } from "react";
import ForceGraph2D, { ForceGraphMethods } from "react-force-graph-2d";
import { useLoggerStore } from "@/services/basescan";

interface Node {
  id: string;
  address: string;
  isCentral: boolean;
  interactions: number;
  // Add position properties that ForceGraph automatically adds
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number;
  fy?: number;
}

interface Link {
  source: string;
  target: string;
  value: number;
}

interface GraphData {
  nodes: Node[];
  links: Link[];
}

interface WalletGraphProps {
  data: GraphData | null;
  centralAddress: string;
}

export function WalletGraph({ data, centralAddress }: WalletGraphProps) {
  const addLog = useLoggerStore((state) => state.addLog);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const graphRef = useRef<ForceGraphMethods<Node, Link> | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: 600, // Fixed height
        });
      }
    };

    // Call initially with a small delay to ensure DOM is rendered
    setTimeout(updateDimensions, 5000);

    // Use ResizeObserver for more reliable size detection
    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Also keep window resize listener as a fallback
    window.addEventListener("resize", updateDimensions);

    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateDimensions);
    };
  }, []);

  useEffect(() => {
    if (data && graphRef.current) {
      addLog("Rendering graph visualization");
      graphRef.current.d3Force("charge")?.strength(-300);

      // Center on the main node
      const centralNode = data.nodes.find(
        (node) => node.address === centralAddress
      );
      if (centralNode) {
        setTimeout(() => {
          graphRef.current?.centerAt(0, 0, 1000);
          graphRef.current?.zoom(2.5, 1000);
        }, 500);
      }
    }
  }, [data, centralAddress, addLog]);

  const nodeCanvasObject = useCallback(
    (node: Node, ctx: CanvasRenderingContext2D) => {
      // Calculate node size based on interactions
      const MAX_SIZE = 15;
      const MIN_SIZE = 4;
      const maxInteractions = Math.max(
        ...(data?.nodes.map((n) => n.interactions) || [1])
      );
      const size = node.isCentral
        ? MAX_SIZE
        : MIN_SIZE +
          (MAX_SIZE - MIN_SIZE) * (node.interactions / maxInteractions);

      // Node color based on central or not
      const color = node.isCentral ? "#2563eb" : "#64748b";

      // Draw circle
      ctx.beginPath();
      ctx.arc(node.x || 0, node.y || 0, size, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();

      // Draw address label
      ctx.fillStyle = "#1e293b";
      ctx.font = "4px Arial";
      ctx.textAlign = "center";
      const shortAddress = `${node.address.substring(
        0,
        6
      )}...${node.address.substring(node.address.length - 4)}`;
      ctx.fillText(shortAddress, node.x || 0, (node.y || 0) + size + 4);
    },
    [data]
  );

  if (!data) {
    return (
      <div className="w-full h-[600px] flex items-center justify-center border rounded-lg bg-slate-50">
        <p className="text-slate-500">
          Enter a wallet address to visualize interactions
        </p>
      </div>
    );
  }

  return (
    <div
      className="w-full border rounded-lg overflow-hidden"
      ref={containerRef}
    >
      <ForceGraph2D
        // Fix the casting to use the proper generic types
        ref={graphRef as React.MutableRefObject<ForceGraphMethods<Node, Link>>}
        graphData={data}
        width={dimensions.width}
        height={dimensions.height}
        nodeCanvasObject={nodeCanvasObject}
        linkWidth={(link) => Math.sqrt((link as Link).value) * 0.5}
        linkDirectionalParticles={2}
        linkDirectionalParticleWidth={(link) =>
          Math.sqrt((link as Link).value) * 0.5
        }
        nodeLabel={(node) =>
          `${(node as Node).address}\nInteractions: ${
            (node as Node).interactions
          }`
        }
        cooldownTicks={100}
        onEngineStop={() => addLog("Graph rendering completed")}
      />
    </div>
  );
}
