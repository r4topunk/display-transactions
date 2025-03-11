import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";

// Create a public client connected to Ethereum mainnet
// ENS resolution only works on mainnet regardless of which chain
// the actual transactions will be on
const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(),
});

/**
 * Resolves an ENS name to an Ethereum address
 * @param name - The ENS name to resolve (e.g. "vitalik.eth")
 * @returns The resolved Ethereum address or null if resolution fails
 */
export async function resolveEnsName(name: string): Promise<string | null> {
  try {
    const address = await publicClient.getEnsAddress({
      name,
    });

    return address;
  } catch (error) {
    console.error("Error resolving ENS name:", error);
    return null;
  }
}

/**
 * Checks if a given string is likely an ENS name
 * @param input - String to check
 * @returns Boolean indicating if the string looks like an ENS name
 */
export function isEnsName(input: string): boolean {
  // Basic check: ends with .eth and has valid characters
  return /^[a-zA-Z0-9-]+\.eth$/.test(input);
}
