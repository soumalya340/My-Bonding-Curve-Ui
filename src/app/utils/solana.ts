import { PublicKey, Connection } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
/* eslint-disable @typescript-eslint/no-explicit-any */

// Constants - Update these with your actual values
export const QUOTE_MINT = new PublicKey(
  "So11111111111111111111111111111111111111112"
); // WSOL
export const BP_FEE_KEY_PUBKEY = new PublicKey(
  "7Z4GK4ouyzkqDcZU44FNBAGLfQTKkp6fwCUuzQcTKtJW"
);
export const PROGRAM_ID = new PublicKey(
  "BzUWmCR33ez1LvDfF2K9USe3Ra1Ws47WQ2ETCzebBkS6"
);

// Helper function to get target config PDA
// You'll need to implement this based on your IDL seeds
export function getTargetConfigPda(memeMint: PublicKey, programId: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("config"), QUOTE_MINT.toBuffer(), memeMint.toBuffer()],
    programId
  );
}

// Helper function to get pool PDA
// You'll need to implement this based on your IDL seeds
export function getPoolPda(memeMint: PublicKey, programId: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("bound_pool"), memeMint.toBuffer(), QUOTE_MINT.toBuffer()],
    programId
  );
}

// Helper function to get pool signer PDA
// You'll need to implement this based on your IDL seeds
export function getPoolSignerPda(poolPda: PublicKey, programId: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("signer"), poolPda.toBuffer()],
    programId
  );
}

// Helper function to create token accounts
export async function createTokenAccount(
  connection: Connection,
  payer: any,
  mint: PublicKey,
  owner: PublicKey,
  allowOwnerOffCurve = false
) {
  return await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mint,
    owner,
    allowOwnerOffCurve
  );
}

// Format balance in millions for display
export function formatBalanceInMillions(balance: number) {
  const millions = balance / 1_000_000;
  if (millions >= 1) {
    return `${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)}M`;
  } else {
    return `${millions.toFixed(1)}M`;
  }
}

// Get cluster URL based on environment
export function getClusterUrl() {
  // For now, default to devnet. You can make this configurable later
  return "https://api.devnet.solana.com";
}
