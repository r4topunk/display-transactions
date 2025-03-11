import { create } from "zustand";

const API_KEY = import.meta.env.VITE_BASESCAN_API_KEY;
const BASE_URL = "https://api.basescan.org/api";

export type TransactionData = {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  gas: string;
  gasPrice: string;
  isError: string;
};

type LogMessage = {
  id: number;
  message: string;
  timestamp: Date;
};

interface LoggerState {
  logs: LogMessage[];
  addLog: (message: string) => void;
  clearLogs: () => void;
}

export const useLoggerStore = create<LoggerState>((set) => ({
  logs: [],
  addLog: (message: string) =>
    set((state) => ({
      logs: [
        ...state.logs,
        { id: state.logs.length, message, timestamp: new Date() },
      ],
    })),
  clearLogs: () => set(() => ({ logs: [] })),
}));

export async function fetchWalletTransactions(
  address: string,
  page = 1,
  offset = 100
): Promise<TransactionData[]> {
  const { addLog } = useLoggerStore.getState();

  addLog(`Fetching transactions for ${address} (page ${page})...`);

  const params = new URLSearchParams({
    module: "account",
    action: "txlist",
    address,
    startblock: "0",
    endblock: "99999999",
    page: page.toString(),
    offset: offset.toString(),
    sort: "asc",
    apikey: API_KEY,
  });

  console.log(import.meta.env.VITE_BASESCAN_API_KEY);
  console.log(API_KEY);

  try {
    const response = await fetch(`${BASE_URL}?${params.toString()}`);
    const data = await response.json();

    if (data.status === "1") {
      addLog(`Successfully fetched ${data.result.length} transactions`);
      return data.result as TransactionData[];
    } else {
      addLog(`Error: ${data.message}`);
      return [];
    }
  } catch (error) {
    addLog(`Failed to fetch transactions: ${error}`);
    return [];
  }
}

export async function fetchAllTransactions(
  address: string
): Promise<TransactionData[]> {
  const { addLog } = useLoggerStore.getState();
  let allTransactions: TransactionData[] = [];
  let page = 1;
  let hasMore = true;
  const offset = 100;

  addLog(`Starting to fetch all transactions for ${address}`);

  while (hasMore) {
    const transactions = await fetchWalletTransactions(address, page, offset);
    allTransactions = [...allTransactions, ...transactions];

    if (transactions.length < offset) {
      hasMore = false;
      addLog(
        `Completed fetching all transactions: ${allTransactions.length} total`
      );
    } else {
      addLog(`Fetched page ${page}, continuing...`);
      page++;
    }
  }

  return allTransactions;
}

export function processTransactionsForGraph(
  transactions: TransactionData[],
  centralAddress: string
) {
  const { addLog } = useLoggerStore.getState();
  addLog("Processing transactions for graph visualization...");

  // Track interactions between wallets
  const interactions: Record<string, { address: string; count: number }[]> = {};
  const addresses = new Set<string>();

  // Add central address
  addresses.add(centralAddress);
  interactions[centralAddress] = [];

  transactions.forEach((tx) => {
    // Add addresses to set
    addresses.add(tx.from);
    addresses.add(tx.to);

    // Track interaction from -> to
    if (!interactions[tx.from]) {
      interactions[tx.from] = [];
    }

    // Find if this interaction already exists
    const existingInteraction = interactions[tx.from].find(
      (i) => i.address === tx.to
    );
    if (existingInteraction) {
      existingInteraction.count++;
    } else {
      interactions[tx.from].push({ address: tx.to, count: 1 });
    }
  });

  // Convert to graph data format
  const nodes = Array.from(addresses).map((address) => ({
    id: address,
    address,
    isCentral: address === centralAddress,
    // Count total interactions (in and out)
    interactions:
      Object.values(interactions)
        .flat()
        .filter((i) => i.address === address)
        .reduce((acc, curr) => acc + curr.count, 0) +
      (interactions[address]?.reduce((acc, curr) => acc + curr.count, 0) || 0),
  }));

  const links = Object.entries(interactions).flatMap(([source, targets]) =>
    targets.map((target) => ({
      source,
      target: target.address,
      value: target.count,
    }))
  );

  addLog(`Graph data prepared: ${nodes.length} nodes, ${links.length} links`);

  return { nodes, links };
}
