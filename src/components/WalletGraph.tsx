import React, { useCallback, useEffect, useRef, useState } from "react";
import ForceGraph2D, { ForceGraphMethods } from "react-force-graph-2d";
import { useLoggerStore } from "@/services/basescan";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";

interface Node {
  id: string;
  address: string;
  isCentral: boolean;
  interactions: number;
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

export interface GraphData {
  nodes: Node[];
  links: Link[];
}

interface WalletGraphProps {
  data: GraphData | null;
  centralAddress: string;
}

// Default empty graph data
const EMPTY_GRAPH_DATA: GraphData = { nodes: [], links: [] };

export function WalletGraph({ data, centralAddress }: WalletGraphProps) {
  const addLog = useLoggerStore((state) => state.addLog);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const graphRef = useRef<ForceGraphMethods<Node, Link> | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const [explanationOpen, setExplanationOpen] = useState(true);

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

  return (
    <div className="w-full space-y-4">
      {/* Graph Legend/Explanation Card */}
      <div className="w-full bg-white border rounded-lg shadow-sm overflow-hidden">
        <div
          className="p-4 bg-slate-50 flex items-center justify-between cursor-pointer"
          onClick={() => setExplanationOpen(!explanationOpen)}
        >
          <h3 className="font-medium text-lg text-slate-900">
            Understanding Wallet Interactions
          </h3>
          <button className="text-slate-500 hover:text-slate-700">
            {explanationOpen ? (
              <ChevronUpIcon className="h-5 w-5" />
            ) : (
              <ChevronDownIcon className="h-5 w-5" />
            )}
          </button>
        </div>

        {explanationOpen && (
          <div className="p-4 space-y-4 animate-in slide-in-from-top duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-slate-900">
                  Node Representation
                </h4>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-4 h-4 rounded-full bg-blue-600"></div>
                  <span>Central wallet (your searched address)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-4 h-4 rounded-full bg-slate-500"></div>
                  <span>
                    Other wallets that interacted with the central wallet
                  </span>
                </div>
                <p className="text-sm text-slate-600 mt-2">
                  The size of each node indicates the number of interactions.
                  Larger nodes have more transactions with the central wallet.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-slate-900">Transaction Flow</h4>
                <div className="p-3 border rounded-md bg-slate-50">
                  <p className="text-sm text-slate-700">
                    <span className="font-semibold">From Address:</span> The
                    sender of the transaction (source of funds)
                  </p>
                  <div className="my-2 flex justify-center">
                    <svg width="100" height="24" className="text-slate-400">
                      <line
                        x1="0"
                        y1="12"
                        x2="100"
                        y2="12"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <polygon points="100,12 90,8 90,16" fill="currentColor" />
                    </svg>
                  </div>
                  <p className="text-sm text-slate-700">
                    <span className="font-semibold">To Address:</span> The
                    recipient of the transaction (destination of funds)
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
              <h4 className="font-medium text-blue-800">
                Interpreting the Graph
              </h4>
              <p className="text-sm text-blue-700 mt-1">
                Each line represents transactions between two wallets. The
                movement of particles along these lines indicates the direction
                of fund transfers. Thicker lines indicate a higher volume of
                transactions between those addresses.
              </p>
            </div>

            <div className="bg-amber-50 p-3 rounded-md border border-amber-100">
              <h4 className="font-medium text-amber-800">Interactive Tips</h4>
              <ul className="text-sm text-amber-700 mt-1 list-disc pl-5">
                <li>Hover over nodes to see the full wallet address</li>
                <li>Click and drag nodes to reposition them</li>
                <li>Scroll to zoom in and out of the graph</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      <div
        className="w-full border rounded-lg overflow-hidden relative"
        ref={containerRef}
      >
        <ForceGraph2D
          ref={
            graphRef as React.MutableRefObject<ForceGraphMethods<Node, Link>>
          }
          graphData={data || EMPTY_GRAPH_DATA}
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
          onEngineStop={() => data && addLog("Graph rendering completed")}
        />

        {/* Overlay message when no data */}
        {!data && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50 bg-opacity-80">
            <p className="text-slate-500">
              Enter a wallet address to visualize interactions
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
