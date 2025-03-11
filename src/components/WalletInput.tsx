import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Label } from "./ui/label";
import { useLoggerStore } from "@/services/basescan";
import { isEnsName, resolveEnsName } from "@/utils/ens";

interface WalletInputProps {
  onSubmit: (address: string) => void;
  isLoading: boolean;
}

export function WalletInput({ onSubmit, isLoading }: WalletInputProps) {
  const [address, setAddress] = useState("");
  const [isResolvingEns, setIsResolvingEns] = useState(false);
  const [ensError, setEnsError] = useState<string | null>(null);
  const addLog = useLoggerStore((state) => state.addLog);
  const clearLogs = useLoggerStore((state) => state.clearLogs);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;

    // Reset error state
    setEnsError(null);

    // Check if input is an ENS name
    if (isEnsName(address)) {
      setIsResolvingEns(true);
      addLog(`Resolving ENS name: ${address}`);

      try {
        const resolvedAddress = await resolveEnsName(address);

        if (!resolvedAddress) {
          setEnsError(`Could not resolve ENS name: ${address}`);
          addLog(`Failed to resolve ENS name: ${address}`);
          setIsResolvingEns(false);
          return;
        }

        addLog(`Resolved ${address} to ${resolvedAddress}`);
        clearLogs();
        onSubmit(resolvedAddress);
      } catch (error) {
        console.error("ENS resolution error:", error);
        setEnsError(`Error resolving ENS name: ${address}`);
        addLog(`Error resolving ENS name: ${address}`);
      } finally {
        setIsResolvingEns(false);
      }
      return;
    }

    // For regular Ethereum addresses, validate format
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      addLog("Invalid Ethereum address format");
      setEnsError(
        "Invalid Ethereum address format. Use a valid address or ENS name."
      );
      return;
    }

    clearLogs();
    onSubmit(address);
  };

  const buttonDisabled = isLoading || isResolvingEns;
  const buttonText = isResolvingEns
    ? "Resolving ENS..."
    : isLoading
    ? "Loading..."
    : "Visualize Interactions";

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md mx-auto">
      <div className="space-y-2">
        <Label htmlFor="wallet-address">Wallet Address or ENS Name</Label>
        <Input
          id="wallet-address"
          placeholder="0x... or name.eth"
          value={address}
          onChange={(e) => {
            setAddress(e.target.value);
            setEnsError(null); // Clear error when input changes
          }}
          className="font-mono"
        />
        {ensError && <p className="text-sm text-red-500 mt-1">{ensError}</p>}
        <p className="text-xs text-slate-500">
          Enter an Ethereum address (0x...) or ENS name (example.eth)
        </p>
      </div>
      <Button type="submit" disabled={buttonDisabled} className="w-full">
        {buttonText}
      </Button>
    </form>
  );
}
