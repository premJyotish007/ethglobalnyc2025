# ETHGlobal NYC 2025 Ticket Auction Setup

This document outlines the setup process for the ticket auction system deployed on Base Sepolia testnet.

## Prerequisites

- Node.js 18+ installed
- MetaMask or similar wallet with Base Sepolia network configured
- Some ETH on Base Sepolia for gas fees
- Some USDC on Base Sepolia for bidding (get from faucet)

## Network Configuration

### Base Sepolia Testnet
- **Network Name**: Base Sepolia
- **RPC URL**: `https://sepolia.base.org`
- **Chain ID**: `84532`
- **Currency Symbol**: ETH
- **Block Explorer**: `https://sepolia.basescan.org`

### USDC Token
- **Contract Address**: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- **Decimals**: 6
- **Faucet**: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet

## Setup Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory:
```env
PRIVATE_KEY=your_private_key_here
BASESCAN_API_KEY=your_basescan_api_key_here
NEXT_PUBLIC_AUCTION_CONTRACT_ADDRESS=0x... # TicketAuction address
NEXT_PUBLIC_TICKET_CONTRACT_ADDRESS=0x... # TicketToken address
NEXT_PUBLIC_USDC_CONTRACT_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e # Real USDC address
```

### 3. Deploy Contracts
Deploy all contracts (TicketToken, TicketAuction) to Base Sepolia:
```bash
npx hardhat run scripts/deploy-auction.cjs --network base-sepolia
```

This will:
- Deploy TicketToken contract
- Deploy TicketAuction contract with real USDC address
- Mint some test tickets
- Save deployment addresses to `deployment-info.json`

### 4. Update Environment Variables
After deployment, update your `.env` file with the new contract addresses from `deployment-info.json`.

### 5. Verify Contracts (Optional)
Verify your contracts on Base Sepolia:
```bash
npx hardhat run scripts/verify-contracts.cjs --network base-sepolia
```

### 6. Get Test USDC
Visit the Base Sepolia faucet to get test USDC:
- **Coinbase Faucet**: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet
- **Alternative**: https://faucet.circle.com/

### 7. Approve USDC Spending
Before bidding, approve the auction contract to spend your USDC:
```bash
npx hardhat run scripts/approve-usdc.cjs --network base-sepolia
```

**Note**: Update the auction contract address in the script first.

### 8. Start the Frontend
```bash
npm run dev
```

## Contract Addresses

After deployment, your contracts will be deployed at:
- **TicketToken**: `0x...` (ERC1155 ticket contract)
- **TicketAuction**: `0x...` (Auction contract)
- **USDC**: `0x036CbD53842c5426634e7929541eC2318f3dCF7e` (Real USDC)

## Testing the System

### 1. Check Balances
```bash
npx hardhat run scripts/check-usdc-balance.cjs --network base-sepolia
npx hardhat run scripts/check-tickets.cjs --network base-sepolia
```

### 2. Create an Auction
```bash
npx hardhat run scripts/create-auction.cjs --network base-sepolia
```

### 3. Place Bids
Use the frontend to place bids on auctions.

### 4. Check Auction Status
```bash
npx hardhat run scripts/check-auctions.cjs --network base-sepolia
```

## Important Notes

1. **Real USDC**: The system now uses the real Base Sepolia USDC contract, not a mock token
2. **No Minting**: You cannot mint USDC - you must get it from faucets
3. **Gas Fees**: Ensure you have sufficient ETH for gas fees on Base Sepolia
4. **Network**: Always ensure you're connected to Base Sepolia testnet

## Troubleshooting

### Common Issues

1. **Insufficient USDC**: Get test USDC from the faucet
2. **Insufficient ETH**: Get test ETH from the faucet for gas fees
3. **Wrong Network**: Ensure MetaMask is connected to Base Sepolia
4. **Contract Not Found**: Verify contracts are deployed and addresses are correct

### Getting Help

- Check the Base Sepolia explorer for transaction status
- Verify contract addresses in `deployment-info.json`
- Ensure all environment variables are set correctly

## Security Notes

- Never share your private key
- Use testnet for development only
- Real USDC on mainnet has real value
- Test thoroughly before mainnet deployment
