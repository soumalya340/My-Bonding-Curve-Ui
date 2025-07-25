"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useEffect, useState } from "react";

export default function WalletConnection() {
  const { publicKey, connected } = useWallet();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-6 text-center mb-8 transition-all ${
        connected
          ? "border-green-500 bg-green-50 dark:bg-green-900/20"
          : "border-gray-300 bg-white dark:bg-gray-800"
      }`}
    >
      <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
        Step 1: Connect Your Phantom Wallet
      </h3>

      {isClient && (
        <WalletMultiButton className="!bg-orange-500 hover:!bg-orange-600 !rounded-lg !font-medium !px-6 !py-3" />
      )}

      {connected && publicKey && (
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="text-sm font-medium text-blue-800 dark:text-blue-200">
            <strong>Connected:</strong>
          </div>
          <div className="text-xs font-mono text-blue-600 dark:text-blue-300 break-all mt-1">
            {publicKey.toString()}
          </div>
        </div>
      )}
    </div>
  );
}
