import { useState } from "react";
import { TransactionData } from "../services/basescan";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import {
  ArrowRightIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

interface TransactionListProps {
  transactions: TransactionData[];
  centralAddress: string;
}

interface WalletTransactions {
  address: string;
  transactions: TransactionData[];
}

export function TransactionList({
  transactions,
  centralAddress,
}: TransactionListProps) {
  const [expandedWallets, setExpandedWallets] = useState<
    Record<string, boolean>
  >({});
  const [explanationOpen, setExplanationOpen] = useState(true);

  // If no transactions, show a placeholder
  if (!transactions.length) {
    return (
      <div className="border rounded-lg p-6 bg-white">
        <h2 className="text-xl font-semibold mb-4">Transaction List</h2>
        <p className="text-slate-500">
          No transactions to display. Enter a wallet address to view
          transactions.
        </p>
      </div>
    );
  }

  // Group transactions by wallet address (excluding the central address)
  const walletTransactions: WalletTransactions[] = transactions.reduce(
    (acc: WalletTransactions[], tx: TransactionData) => {
      const counterpartyAddress = tx.from === centralAddress ? tx.to : tx.from;

      // Skip if counterparty is the central address (self-transactions)
      if (counterpartyAddress === centralAddress) return acc;

      const existingWallet = acc.find(
        (wallet) => wallet.address === counterpartyAddress
      );

      if (existingWallet) {
        existingWallet.transactions.push(tx);
      } else {
        acc.push({
          address: counterpartyAddress,
          transactions: [tx],
        });
      }

      return acc;
    },
    []
  );

  // Sort wallets by transaction count (descending)
  walletTransactions.sort(
    (a, b) => b.transactions.length - a.transactions.length
  );

  const toggleWallet = (address: string) => {
    setExpandedWallets((prev) => ({
      ...prev,
      [address]: !prev[address],
    }));
  };

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(
      address.length - 4
    )}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <div className="border rounded-lg p-6 bg-white">
      <h2 className="text-xl font-semibold mb-4">Transaction List</h2>

      {/* Explanation Card */}
      <div className="mb-6 border rounded-lg shadow-sm overflow-hidden">
        <div
          className="p-4 bg-slate-50 flex items-center justify-between cursor-pointer"
          onClick={() => setExplanationOpen(!explanationOpen)}
        >
          <div className="flex items-center gap-2">
            <InformationCircleIcon className="h-5 w-5 text-blue-600" />
            <h3 className="font-medium text-slate-900">
              Understanding Transaction Relationships
            </h3>
          </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium text-slate-900">
                  Transaction Directions
                </h4>

                {/* Sent Transaction Explanation */}
                <div className="p-3 border rounded-md bg-blue-50 border-blue-100">
                  <div className="flex items-center gap-2 text-blue-900 font-medium mb-2">
                    <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                    <span>Sent Transactions</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center my-3">
                    <div className="px-2 py-1 bg-blue-100 rounded text-xs">
                      {formatAddress(centralAddress)} (You)
                    </div>
                    <ArrowRightIcon className="h-4 w-4 text-blue-600" />
                    <div className="px-2 py-1 bg-slate-100 rounded text-xs">
                      Other Wallet
                    </div>
                  </div>
                  <p className="text-xs text-blue-700">
                    When you see "Sent" in the transaction list, it means your
                    wallet was the source of funds. The central address (your
                    searched address) transferred assets to another wallet.
                  </p>
                </div>

                {/* Received Transaction Explanation */}
                <div className="p-3 border rounded-md bg-green-50 border-green-100">
                  <div className="flex items-center gap-2 text-green-900 font-medium mb-2">
                    <div className="w-2 h-2 rounded-full bg-green-600"></div>
                    <span>Received Transactions</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center my-3">
                    <div className="px-2 py-1 bg-slate-100 rounded text-xs">
                      Other Wallet
                    </div>
                    <ArrowRightIcon className="h-4 w-4 text-green-600" />
                    <div className="px-2 py-1 bg-green-100 rounded text-xs">
                      {formatAddress(centralAddress)} (You)
                    </div>
                  </div>
                  <p className="text-xs text-green-700">
                    When you see "Received" in the transaction list, it means
                    your wallet was the destination of funds. Another wallet
                    transferred assets to the central address (your searched
                    address).
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-slate-900">
                  How to Read Transactions
                </h4>

                <div className="p-3 border rounded-md bg-slate-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Key Components:</span>
                  </div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="font-medium text-slate-700 min-w-[80px]">
                        Date/Time:
                      </span>
                      <span className="text-slate-600">
                        When the transaction was confirmed on the blockchain
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-medium text-slate-700 min-w-[80px]">
                        Direction:
                      </span>
                      <span className="text-slate-600">
                        Whether funds were sent or received
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-medium text-slate-700 min-w-[80px]">
                        Amount:
                      </span>
                      <span className="text-slate-600">
                        ETH value transferred
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-medium text-slate-700 min-w-[80px]">
                        Transaction:
                      </span>
                      <span className="text-slate-600">
                        Link to view full details on BaseScan
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="p-3 border rounded-md bg-amber-50 border-amber-100">
                  <h5 className="text-sm font-medium text-amber-800 mb-2">
                    Understanding Relationships
                  </h5>
                  <p className="text-xs text-amber-700">
                    Transactions are grouped by wallet address to show your
                    relationship patterns. Addresses you interact with
                    frequently appear at the top. This helps identify your most
                    important financial connections.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <p className="text-sm text-slate-500 mb-4">
        Showing transactions for {formatAddress(centralAddress)}
      </p>

      <div className="space-y-2">
        {walletTransactions.map((wallet) => (
          <div
            key={wallet.address}
            className="border rounded-lg overflow-hidden"
          >
            <div
              className="flex justify-between items-center p-4 bg-slate-50 cursor-pointer"
              onClick={() => toggleWallet(wallet.address)}
            >
              <div>
                <span className="font-medium">
                  {formatAddress(wallet.address)}
                </span>
                <span className="ml-2 text-sm text-slate-500">
                  {wallet.transactions.length} transaction
                  {wallet.transactions.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div>
                {expandedWallets[wallet.address] ? (
                  <ChevronUpIcon className="h-5 w-5" />
                ) : (
                  <ChevronDownIcon className="h-5 w-5" />
                )}
              </div>
            </div>

            {expandedWallets[wallet.address] && (
              <div className="p-2">
                {wallet.transactions.map((tx) => (
                  <div
                    key={tx.hash}
                    className="p-2 hover:bg-slate-50 border-b last:border-b-0"
                  >
                    <div className="flex justify-between items-center">
                      <div className="text-sm">
                        <p className="text-slate-600">
                          {formatDate(parseInt(tx.timeStamp))}
                        </p>
                        <p className="mt-1">
                          <span
                            className={
                              tx.from === centralAddress
                                ? "text-blue-600"
                                : "text-green-600"
                            }
                          >
                            {tx.from === centralAddress ? "Sent" : "Received"}
                          </span>{" "}
                          {tx.value || "0"} ETH
                        </p>
                      </div>
                      <a
                        href={`https://basescan.org/tx/${tx.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        View on BaseScan
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
