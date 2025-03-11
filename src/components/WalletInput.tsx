import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Label } from "./ui/label";
import { useLoggerStore } from "@/services/basescan";

interface WalletInputProps {
  onSubmit: (address: string) => void;
  isLoading: boolean;
}

export function WalletInput({ onSubmit, isLoading }: WalletInputProps) {
  const [address, setAddress] = useState("");
  const addLog = useLoggerStore((state) => state.addLog);
  const clearLogs = useLoggerStore((state) => state.clearLogs);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;

    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      addLog("Invalid Ethereum address format");
      return;
    }

    clearLogs();
    onSubmit(address);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md mx-auto">
      <div className="space-y-2">
        <Label htmlFor="wallet-address">Wallet Address</Label>
        <Input
          id="wallet-address"
          placeholder="0x..."
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="font-mono"
        />
      </div>
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "Loading..." : "Visualize Interactions"}
      </Button>
    </form>
  );
}
