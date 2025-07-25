# Bonding Curve Pool Creator - Integration Guide

This Next.js application provides a modern UI for creating bonding curve pools on Solana, similar to your existing HTML/JavaScript implementation.

## Current Status

✅ **Completed:**

- Phantom wallet connection using Solana wallet adapter
- Modern React UI with Tailwind CSS
- Pool creation form with validation
- Status messages and loading states
- Proper TypeScript types
- Dark mode support

🔄 **Ready for IDL Integration:**

- Pool creation logic structure is in place
- Anchor provider setup is ready
- PDA helper functions are prepared
- Constants are defined

## Next Steps - IDL Integration

Once you upload your IDL file, follow these steps to complete the integration:

### 1. Add Your IDL File

Place your `idl.json` file in the project root:

```
bonding-curve-ui/
├── src/
├── idl.json  ← Place your IDL here
└── ...
```

### 2. Update the PoolCreator Component

In `src/app/components/PoolCreator.tsx`, uncomment and update the pool creation logic:

```typescript
// Import your IDL
import IDL from "../../../idl.json";

// In the createPool function, uncomment and update:
const program = new Program(IDL, PROGRAM_ID, provider);

const initTargetConfigTx = await program.methods
  .initTargetConfig(targetAmount)
  .accounts({
    tokenMint: QUOTE_MINT,
    pairTokenMint: memeMint,
    creator: publicKey,
  })
  .rpc();

// Add the full pool creation logic from your user.js
```

### 3. Update PDA Functions

In `src/app/utils/solana.ts`, update the PDA functions with the correct seeds from your IDL:

```typescript
// Update based on your IDL seeds
export function getTargetConfigPda(memeMint: PublicKey, programId: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("config"), // Use actual seed from IDL
      QUOTE_MINT.toBuffer(),
      memeMint.toBuffer(),
    ],
    programId
  );
}
```

### 4. Add Complete Pool Creation Flow

Reference your `user.js` `createPool` function and add:

- Target config creation
- Pool PDA derivation
- Vault creation (quote and meme)
- Authority setting
- Pool initialization

### 5. Optional: Add Additional Features

You can extend the UI with features from your `user.js`:

- Swap functionality (swapX, swapY)
- Balance checking
- Pool information display
- SOL wrapping utility

## Running the Application

```bash
# Install dependencies (already done)
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## File Structure

```
src/app/
├── components/
│   ├── WalletProvider.tsx     # Solana wallet adapter setup
│   ├── WalletConnection.tsx   # Wallet connection UI
│   └── PoolCreator.tsx        # Pool creation form
├── utils/
│   └── solana.ts             # Solana utility functions
├── layout.tsx                # App layout with wallet provider
└── page.tsx                  # Main page component
```

## Configuration

Update these constants in `src/app/utils/solana.ts` if needed:

- `QUOTE_MINT` - WSOL mint address
- `BP_FEE_KEY_PUBKEY` - Fee recipient address
- `PROGRAM_ID` - Your program ID

## Differences from HTML Version

1. **Modern React Architecture**: Uses React hooks and components
2. **TypeScript**: Full type safety
3. **Wallet Adapter**: Professional wallet connection handling
4. **Tailwind CSS**: Modern styling with dark mode
5. **Error Handling**: Better error states and user feedback
6. **Responsive Design**: Works on mobile and desktop

## Ready for Production

Once IDL is integrated, this app will be ready for deployment on Vercel, Netlify, or any static hosting platform.
