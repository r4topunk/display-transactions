import { useLoggerStore } from "@/services/basescan";
import { useEffect, useRef } from "react";
import { ScrollArea } from "./ui/scroll-area";

export function TransactionLogger() {
  const logs = useLoggerStore((state) => state.logs);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom when logs change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="w-full border rounded-lg p-2 bg-slate-50">
      <h3 className="text-sm font-medium mb-2">Transaction Logs</h3>
      <ScrollArea className="h-[200px] w-full rounded">
        <div ref={scrollRef} className="space-y-1">
          {logs.map((log) => (
            <div
              key={log.id}
              className="text-xs border-l-2 border-slate-300 pl-2"
            >
              <span className="text-slate-500 mr-2">
                {log.timestamp.toLocaleTimeString()}
              </span>
              <span>{log.message}</span>
            </div>
          ))}
          {logs.length === 0 && (
            <p className="text-xs text-slate-500 italic">No logs yet</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
