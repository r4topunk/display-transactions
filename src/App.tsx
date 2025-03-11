import { useState } from "react";
import { Button } from "@/components/ui/button";
import { WalletInput } from "./components/WalletInput";
import { TransactionLogger } from "./components/TransactionLogger";
import { WalletGraph } from "./components/WalletGraph";
import {
  fetchAllTransactions,
  processTransactionsForGraph,
} from "./services/basescan";

function App() {
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState<string>("");
  const [graphData, setGraphData] = useState(null);

  const handleWalletSubmit = async (walletAddress: string) => {
    setLoading(true);
    setAddress(walletAddress);
    try {
      const transactions = await fetchAllTransactions(walletAddress);
      const graphData = processTransactionsForGraph(
        transactions,
        walletAddress
      );
      setGraphData(graphData);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center p-6 max-w-6xl mx-auto">
      <div className="w-full mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Base Blockchain Wallet Interactions
        </h1>
        <p className="text-slate-500">
          Enter a wallet address to visualize its interactions with other
          wallets on the Base blockchain.
        </p>
      </div>

      <div className="w-full grid gap-6">
        <WalletInput onSubmit={handleWalletSubmit} isLoading={loading} />
        <TransactionLogger />
        <WalletGraph data={graphData} centralAddress={address} />
      </div>
    </div>
  );
}

export default App;
