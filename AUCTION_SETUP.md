# Ticket Auction System Setup Guide - Base Sepolia

This guide will help you set up and use the complete ticket auction system for ETHGlobal NYC 2025 on Base Sepolia testnet.

## 🏗️ System Architecture

The system consists of two main smart contracts:

1. **TicketToken** (ERC1155) - Manages ticket creation, minting, and transfer
2. **TicketAuction** - Handles auction creation, bidding, and settlement

## 🚀 Quick Start

### 1. Deploy Contracts

```bash
# Deploy all contracts (MockUSDC, TicketToken, TicketAuction) to Base Sepolia
npx hardhat run scripts/deploy-auction.ts --network base-sepolia

# Or deploy individually
npx hardhat run scripts/deploy-auction.cjs --network base-sepolia
```

### 2. Update Environment Variables

Create a `.env.local` file in your project root:

```env
NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS=0x... # TicketToken address
NEXT_PUBLIC_AUCTION_CONTRACT_ADDRESS=0x... # TicketAuction address
NEXT_PUBLIC_USDC_CONTRACT_ADDRESS=0x... # MockUSDC address
PRIVATE_KEY=your_private_key_here # For contract deployment
BASESCAN_API_KEY=your_basescan_api_key # For contract verification
```

### 3. Start the Frontend

```bash
npm run dev
```

## 📋 Complete Workflow

### Step 1: Mint Tickets

First, you need to mint tickets using the TicketToken contract:

```bash
# Using the script on Base Sepolia
npx hardhat run scripts/mint-tickets.js --network base-sepolia

# Or using Hardhat console
npx hardhat console --network base-sepolia
```

**Script Parameters:**
- `eventName`: "ETHGlobal NYC 2025"
- `section`: "VIP"
- `row`: "A"
- `seat`: "1-5"
- `eventDate`: 30 days from now
- `price`: 100 USDC (6 decimals)
- `amount`: 5 tickets

### Step 2: Create Auction

Once you have tickets, create an auction:

```bash
# Using the script on Base Sepolia
npx hardhat run scripts/create-auction.js --network base-sepolia

# Or using Hardhat console
npx hardhat console --network base-sepolia
```

**Auction Parameters:**
- `ticketId`: The token ID of your ticket
- `ticketCount`: Number of tickets to auction
- `startPrice`: Starting bid price (e.g., 50 USDC)
- `buyNowPrice`: Buy now price (e.g., 200 USDC)
- `minIncrement`: Minimum bid increment (e.g., 5 USDC)
- `expiryTime`: Auction duration (e.g., 7 days)

### Step 3: Frontend Integration

The frontend automatically:
1. Loads your tickets from the blockchain
2. Shows auction status and details
3. Allows creating new auctions
4. Displays current bids and auction progress

## 🔧 Smart Contract Functions

### TicketToken Contract

```solidity
// Mint new tickets (owner only)
function createTickets(
    address to,
    uint256 amount,
    string memory eventName,
    string memory section,
    string memory row,
    string memory seat,
    uint256 eventDate,
    uint256 price
) public onlyOwner

// Check ticket balance
function balanceOf(address account, uint256 id) view returns (uint256)

// Get ticket information
function getTicketInfo(uint256 tokenId) view returns (TicketInfo memory, bool)
```

### TicketAuction Contract

```solidity
// Create a new auction
function createAuction(
    uint256 ticketId,
    uint256 ticketCount,
    uint256 startPrice,
    uint256 buyNowPrice,
    uint256 minIncrement,
    uint256 expiryTime
) external returns (uint256 auctionId)

// Place a bid
function bid(uint256 auctionId, uint256 bidPrice) external

// Buy now
function buyNow(uint256 auctionId) external

// Settle expired auction (coordinator only)
function settle(uint256 auctionId) external onlyCoordinator

// Refund tickets (seller only)
function refund(uint256 ticketId) external
```

## 💰 USDC Integration

The system uses USDC for all payments:

1. **MockUSDC** for testing (automatically minted to deployer)
2. **Real USDC** for production (Base Sepolia testnet)

### Getting Testnet Assets

- **Base Sepolia ETH**: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
- **Circle Faucet**: https://faucet.circle.com/
- **Base Sepolia RPC**: https://sepolia.base.org

## 🎯 Frontend Features

### Ticket Management
- View all your tickets
- See ticket details (event, section, row, seat, price)
- Check ticket status (active, used, inactive)

### Auction Creation
- Select tickets to auction
- Set starting price, buy now price, and bid increment
- Choose auction duration
- Automatic approval and transfer to auction contract

### Auction Monitoring
- Real-time auction status
- Current highest bid
- Time remaining
- Bidder information

### Bidding Interface
- Place bids with USDC
- Automatic USDC approval
- Bid validation and feedback

## 🚨 Important Notes

### Gas Fees
- All transactions require gas fees (ETH on Base Sepolia)
- USDC transfers are separate from gas fees
- Batch operations can save gas
- Base Sepolia gas fees are typically lower than Ethereum mainnet

### Approvals
- First-time users need to approve ticket transfers
- USDC spending requires separate approval
- Approvals are one-time per contract

### Security
- Only ticket owners can create auctions
- Bidders cannot bid on their own auctions
- Sellers can refund tickets if no bids exist

## 🔍 Troubleshooting

### Common Issues

1. **"Insufficient ticket balance"**
   - Make sure you own the tickets you're trying to auction
   - Check token ID and balance

2. **"USDC transfer failed"**
   - Ensure you have enough USDC
   - Check USDC approval for auction contract

3. **"Auction not active"**
   - Auction may have expired
   - Check auction status and expiry time

4. **"Only coordinator can call this function"**
   - Auction settlement requires coordinator role
   - Contact contract owner to set coordinator

### Debug Commands

```bash
# Check contract state on Base Sepolia
npx hardhat console --network base-sepolia

# View auction details
const auction = await TicketAuction.attach("0x...").getAuction(1)
console.log(auction)

# Check ticket balance
const balance = await TicketToken.attach("0x...").balanceOf("0x...", 1)
console.log(balance.toString())
```

## 📚 Additional Resources

- **Base Sepolia Explorer**: https://sepolia.basescan.org/
- **Base Sepolia RPC**: https://sepolia.base.org
- **Hardhat Documentation**: https://hardhat.org/docs
- **OpenZeppelin Contracts**: https://docs.openzeppelin.com/contracts/
- **Ethers.js**: https://docs.ethers.org/

## 🎉 Next Steps

1. Deploy contracts to Base Sepolia testnet
2. Mint test tickets
3. Create your first auction
4. Test bidding functionality
5. Deploy to Base mainnet when ready

## 🌐 Network Information

- **Network Name**: Base Sepolia
- **Chain ID**: 84532
- **RPC URL**: https://sepolia.base.org
- **Explorer**: https://sepolia.basescan.org/
- **Currency**: ETH (for gas fees)
- **Testnet**: Yes

Happy auctioning on Base Sepolia! 🎫✨
