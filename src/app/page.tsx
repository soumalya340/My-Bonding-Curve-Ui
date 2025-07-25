import WalletConnection from './components/WalletConnection';
import PoolCreator from './components/PoolCreator';

export default function Home() {
  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            🚀 Bonding Curve Pool Creator
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create your own bonding curve pools on Solana with just a few clicks
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Wallet Connection */}
          <WalletConnection />

          {/* Pool Creator */}
          <PoolCreator />
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Built with Next.js, Solana Web3.js, and Anchor</p>
        </footer>
      </div>
    </div>
  );
}
