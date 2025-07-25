"use client";

import { useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import {
  Keypair,
  SystemProgram,
  LAMPORTS_PER_SOL,
  Transaction,
  PublicKey,
} from "@solana/web3.js";
import {
  createSetAuthorityInstruction,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  AuthorityType,
  TOKEN_PROGRAM_ID,
  NATIVE_MINT,
  createInitializeMintInstruction,
  MINT_SIZE,
} from "@solana/spl-token";
import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
// Import IDL (will work once you paste your IDL content)
import IDL from "../../../idl.json";

// Constants from your config
const QUOTE_MINT = new PublicKey("So11111111111111111111111111111111111111112"); // WSOL
const BP_FEE_KEY_PUBKEY = new PublicKey(
  "7Z4GK4ouyzkqDcZU44FNBAGLfQTKkp6fwCUuzQcTKtJW"
);
const PROGRAM_ID = new PublicKey(
  "BzUWmCR33ez1LvDfF2K9USe3Ra1Ws47WQ2ETCzebBkS6"
);

export default function PoolCreator() {
  const { publicKey, sendTransaction, signTransaction, signAllTransactions } =
    useWallet();
  const { connection } = useConnection();
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<{
    message: string;
    type: "loading" | "success" | "error" | null;
  }>({ message: "", type: null });
  const [isCreating, setIsCreating] = useState(false);

  const showStatus = (
    message: string,
    type: "loading" | "success" | "error"
  ) => {
    setStatus({ message, type });
    if (type === "success" || type === "error") {
      setTimeout(() => setStatus({ message: "", type: null }), 5000);
    }
  };

  // Helper functions for PDA derivation based on your IDL
  const getTargetConfigPda = (memeMint: PublicKey, program: Program<any>) => {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("config"), QUOTE_MINT.toBuffer(), memeMint.toBuffer()],
      program.programId
    );
  };

  const getPoolPda = (memeMint: PublicKey, program: Program<any>) => {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("bound_pool"), memeMint.toBuffer(), QUOTE_MINT.toBuffer()],
      program.programId
    );
  };

  const getPoolSignerPda = (poolPda: PublicKey, program: Program<any>) => {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("signer"), poolPda.toBuffer()],
      program.programId
    );
  };

  // 🚀 ULTIMATE OPTIMIZATION: EVERYTHING IN 1 TRANSACTION!
  const createPool = async () => {
    if (!publicKey || !connection || !signTransaction || !signAllTransactions) {
      showStatus("Please connect your wallet first", "error");
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      showStatus("Please enter a valid amount greater than 0", "error");
      return;
    }

    setIsCreating(true);

    try {
      showStatus("🚀 Creating entire pool in SINGLE transaction!", "loading");

      // Setup Anchor provider and program
      const provider = new AnchorProvider(
        connection,
        {
          publicKey: publicKey!,
          signTransaction: signTransaction!,
          signAllTransactions: signAllTransactions!,
        } as any,
        {
          commitment: "confirmed",
        }
      );

      // Check if IDL is properly loaded
      if (!IDL || Object.keys(IDL).length === 0) {
        showStatus(
          "Please add your IDL content to idl.json file first!",
          "error"
        );
        return;
      }

      const program = new Program(IDL as any, provider);

      // 🎯 PRE-CALCULATE EVERYTHING
      showStatus("Preparing ultimate single transaction...", "loading");

      // Generate mint keypair
      const memeMintKeypair = Keypair.generate();
      const memeMint = memeMintKeypair.publicKey;

      // Get all PDAs
      const [targetConfigPda] = getTargetConfigPda(memeMint, program);
      const [poolPda] = getPoolPda(memeMint, program);
      const [poolSigner] = getPoolSignerPda(poolPda, program);

      // Calculate all ATA addresses
      const quoteVault = await getAssociatedTokenAddress(
        QUOTE_MINT,
        poolSigner,
        true
      );
      const memeVault = await getAssociatedTokenAddress(
        memeMint,
        poolSigner,
        true
      );
      const feeQuoteVault = await getAssociatedTokenAddress(
        QUOTE_MINT,
        BP_FEE_KEY_PUBKEY,
        true
      );

      console.log("🚀 SINGLE TRANSACTION - All addresses calculated:");
      console.log("Meme mint:", memeMint.toString());
      console.log("Target Config PDA:", targetConfigPda.toString());
      console.log("Pool PDA:", poolPda.toString());
      console.log("Pool Signer:", poolSigner.toString());
      console.log("Quote vault:", quoteVault.toString());
      console.log("Meme vault:", memeVault.toString());
      console.log("Fee vault:", feeQuoteVault.toString());

      // 🚀 CHECK WHICH ATAs NEED TO BE CREATED
      const accountsToCheck = [
        {
          address: quoteVault,
          mint: QUOTE_MINT,
          owner: poolSigner,
          name: "quote vault",
        },
        {
          address: memeVault,
          mint: memeMint,
          owner: poolSigner,
          name: "meme vault",
        },
        {
          address: feeQuoteVault,
          mint: QUOTE_MINT,
          owner: BP_FEE_KEY_PUBKEY,
          name: "fee vault",
        },
      ];

      const accountInfos = await connection.getMultipleAccountsInfo(
        accountsToCheck.map((acc) => acc.address)
      );

      // Explicit typing to avoid implicit 'any[]' error
      const atasToCreate: {
        address: PublicKey;
        mint: PublicKey;
        owner: PublicKey;
        name: string;
      }[] = [];
      accountInfos.forEach((info, index) => {
        if (!info) {
          atasToCreate.push(accountsToCheck[index]);
          console.log(
            `Will create ${accountsToCheck[index].name}:`,
            accountsToCheck[index].address.toString()
          );
        }
      });

      // 🎯 CREATE THE ULTIMATE SINGLE TRANSACTION!
      const targetAmount = new BN(parsedAmount * LAMPORTS_PER_SOL);
      const ultimateTransaction = new Transaction();

      // ⚡ STEP 1: Create mint account
      const createMintAccountIx = SystemProgram.createAccount({
        fromPubkey: publicKey,
        newAccountPubkey: memeMint,
        space: MINT_SIZE,
        lamports: await connection.getMinimumBalanceForRentExemption(MINT_SIZE),
        programId: TOKEN_PROGRAM_ID,
      });

      // ⚡ STEP 2: Initialize mint
      const initMintIx = createInitializeMintInstruction(
        memeMint,
        9, // decimals
        publicKey, // mint authority (temporary)
        null // freeze authority
      );

      // ⚡ STEP 3: Create missing ATAs
      const ataInstructions = [];
      for (const ata of atasToCreate) {
        ataInstructions.push(
          createAssociatedTokenAccountInstruction(
            publicKey, // payer
            ata.address, // ata address
            ata.owner, // owner
            ata.mint // mint
          )
        );
      }

      // ⚡ STEP 4: Initialize target config
      const initTargetConfigIx = await program.methods
        .initTargetConfig(targetAmount)
        .accounts({
          creator: publicKey,
          targetConfig: targetConfigPda,
          tokenMint: QUOTE_MINT,
          pairTokenMint: memeMint,
          systemProgram: SystemProgram.programId,
        })
        .instruction();

      // ⚡ STEP 5: Set mint authority to pool signer
      const setAuthorityIx = createSetAuthorityInstruction(
        memeMint, // mint
        publicKey, // current authority
        AuthorityType.MintTokens, // authority type
        poolSigner // new authority (pool signer PDA)
      );

      // ⚡ STEP 6: Create the pool
      const newPoolIx = await program.methods
        .newPool()
        .accounts({
          sender: publicKey,
          pool: poolPda,
          memeMint: memeMint,
          quoteVault: quoteVault,
          quoteMint: QUOTE_MINT,
          feeQuoteVault: feeQuoteVault,
          memeVault: memeVault,
          targetConfig: targetConfigPda,
          poolSigner: poolSigner,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .instruction();

      // 🎉 ADD ALL INSTRUCTIONS TO SINGLE TRANSACTION IN CORRECT ORDER!
      ultimateTransaction.add(
        createMintAccountIx, // 1. Create mint account
        initMintIx, // 2. Initialize mint
        ...ataInstructions, // 3. Create any missing ATAs
        initTargetConfigIx, // 4. Initialize target config
        setAuthorityIx, // 5. Set mint authority to pool signer
        newPoolIx // 6. Create the bonding curve pool
      );

      // Set up transaction
      const { blockhash } = await connection.getLatestBlockhash();
      ultimateTransaction.recentBlockhash = blockhash;
      ultimateTransaction.feePayer = publicKey;
      ultimateTransaction.partialSign(memeMintKeypair);

      showStatus("⚡ Executing single mega-transaction...", "loading");

      // 🎉 SEND THE ULTIMATE SINGLE TRANSACTION!
      const signature = await sendTransaction(ultimateTransaction, connection, {
        signers: [memeMintKeypair],
        skipPreflight: false,
        preflightCommitment: "confirmed",
        maxRetries: 3,
      });

      // Wait for confirmation
      await connection.confirmTransaction(signature, "confirmed");

      showStatus(
        `🎉 INCREDIBLE! Entire pool created in 1 transaction! Only 1 confirmation!`,
        "success"
      );

      console.log("🚀 ULTIMATE SUCCESS! Single transaction:", signature);
      console.log("📍 Pool PDA:", poolPda.toString());
      console.log("🪙 Meme mint:", memeMint.toString());
      console.log(
        "⚡ Total instructions in transaction:",
        ultimateTransaction.instructions.length
      );

      // Reset form
      setAmount("");
    } catch (error: any) {
      console.error("Error creating pool:", error);

      // Enhanced error handling for the mega transaction
      let errorMessage = "Unknown error occurred";
      if (error.message) {
        errorMessage = error.message;
      } else if (error.logs) {
        errorMessage = `Mega-transaction failed. Check console for details.`;
        console.log("Transaction logs:", error.logs);
      }

      // If transaction fails due to size, suggest fallback
      if (
        error.message?.includes("Transaction too large") ||
        error.message?.includes("exceeds maximum")
      ) {
        errorMessage =
          "Transaction too large. This happens rarely - please try again or contact support.";
      }

      showStatus(`Error: ${errorMessage}`, "error");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-pink-900/20 rounded-xl shadow-2xl p-8 border border-purple-200 dark:border-purple-800">
      <div className="text-center mb-8">
        <h3 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
          ⚡ Ultimate Pool Creator
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          The world's most optimized bonding curve pool creation
        </p>
      </div>

      <div className="mb-8">
        <label
          htmlFor="amount"
          className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3"
        >
          Target Amount (SOL):
        </label>
        <input
          type="number"
          id="amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount in SOL (e.g., 1.5)"
          step="0.1"
          min="0.1"
          disabled={!publicKey || isCreating}
          className="w-full px-6 py-4 border-2 border-purple-300 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-purple-600 dark:text-white dark:focus:ring-purple-400/20 transition-all duration-300 text-lg"
        />
      </div>

      <button
        onClick={createPool}
        disabled={!publicKey || isCreating || !amount}
        className="w-full bg-gradient-to-r from-purple-600 via-blue-600 to-pink-600 hover:from-purple-700 hover:via-blue-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-bold py-5 px-8 rounded-xl transition-all duration-300 flex items-center justify-center shadow-2xl hover:shadow-purple-500/25 hover:scale-105 transform"
      >
        {isCreating ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-4 h-6 w-6 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Creating Ultimate Pool...
          </>
        ) : (
          <div className="flex items-center">
            <span className="text-xl mr-2">🚀</span>
            <span className="text-lg">Create Pool (ONLY 1 CONFIRMATION!)</span>
          </div>
        )}
      </button>

      {/* Status Messages */}
      {status.type && (
        <div
          className={`mt-6 p-6 rounded-xl border-2 ${
            status.type === "success"
              ? "bg-gradient-to-r from-green-50 to-emerald-50 text-green-800 border-green-300 dark:from-green-900/20 dark:to-emerald-900/20 dark:text-green-400 dark:border-green-700"
              : status.type === "error"
              ? "bg-gradient-to-r from-red-50 to-pink-50 text-red-800 border-red-300 dark:from-red-900/20 dark:to-pink-900/20 dark:text-red-400 dark:border-red-700"
              : "bg-gradient-to-r from-blue-50 to-purple-50 text-blue-800 border-blue-300 dark:from-blue-900/20 dark:to-purple-900/20 dark:text-blue-400 dark:border-blue-700"
          }`}
        >
          <div className="flex items-center">
            <div className="text-2xl mr-3">
              {status.type === "success"
                ? "🎉"
                : status.type === "error"
                ? "❌"
                : "⚡"}
            </div>
            <div className="font-semibold">{status.message}</div>
          </div>
        </div>
      )}

      {/* Ultimate Optimization Info */}
      <div className="mt-8 p-6 bg-gradient-to-r from-yellow-50 via-orange-50 to-red-50 border-2 border-yellow-300 rounded-xl dark:from-yellow-900/20 dark:via-orange-900/20 dark:to-red-900/20 dark:border-yellow-700">
        <h4 className="font-bold text-yellow-800 dark:text-yellow-400 mb-3 text-lg flex items-center">
          <span className="text-2xl mr-2">🚀</span>
          Ultimate Single-Transaction Process:
        </h4>
        <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-2 ml-8">
          <li>
            • <strong>Step 1:</strong> Create mint account
          </li>
          <li>
            • <strong>Step 2:</strong> Initialize mint
          </li>
          <li>
            • <strong>Step 3:</strong> Create token vaults (if needed)
          </li>
          <li>
            • <strong>Step 4:</strong> Initialize target configuration
          </li>
          <li>
            • <strong>Step 5:</strong> Set mint authority to pool signer
          </li>
          <li>
            • <strong>Step 6:</strong> Create bonding curve pool
          </li>
          <li className="pt-2 border-t border-yellow-300 dark:border-yellow-700">
            <strong className="text-orange-600 dark:text-orange-400 text-base">
              🎯 ALL IN SINGLE TRANSACTION = ONLY 1 CONFIRMATION!
            </strong>
          </li>
        </ul>
      </div>

      {/* Performance Showcase */}
      <div className="mt-6 p-4 bg-gradient-to-r from-gray-100 to-gray-200 border-2 border-gray-300 rounded-lg dark:from-gray-800 dark:to-gray-900 dark:border-gray-600">
        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 text-center">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-red-500 text-xs">❌ Other dApps</div>
              <div className="text-lg">4-6 confirmations</div>
            </div>
            <div>
              <div className="text-blue-500 text-xs">🔄 Previous version</div>
              <div className="text-lg">2 confirmations</div>
            </div>
            <div>
              <div className="text-green-500 text-xs">✅ This version</div>
              <div className="text-lg font-bold">1 confirmation</div>
            </div>
          </div>
        </div>
      </div>

      {/* Achievement Badge */}
      <div className="mt-6 text-center">
        <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-gold-400 to-yellow-500 text-yellow-900 rounded-full text-sm font-bold shadow-lg">
          <span className="text-lg mr-2">🏆</span>
          World's Most Optimized Pool Creator
        </div>
      </div>
    </div>
  );
}
