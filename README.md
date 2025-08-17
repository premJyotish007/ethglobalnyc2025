# VeriTix – Fair Onchain Ticket Resale

A modern, decentralized platform for trading tokenized event tickets using USDC on the blockchain. Built with Next.js, TypeScript, and Web3 technologies featuring **Privy Account Abstraction** for seamless smart wallet creation.

## Features

- 🔗 **Smart Wallet Creation**: Create Privy account abstraction smart wallets on the fly
- 🎫 **Tokenized Tickets**: Trade event tickets as NFTs
- 💰 **USDC Payments**: All transactions use USDC stablecoin
- 🏷️ **Bidding System**: Place bids on tickets or buy instantly
- ⏰ **Bid Expiry**: Automatic 2-minute bidding window for listed tickets
- 📱 **Responsive Design**: Modern UI that works on all devices
- ⚡ **Real-time Updates**: Live updates for bids and transactions
- 🛡️ **Enhanced Security**: Account abstraction provides better security and recovery
- ⚡ **Gasless Transactions**: Enjoy gasless transactions with smart wallets

## Smart Wallet Benefits

- **Account Abstraction**: Enhanced security with social recovery
- **Gasless Transactions**: Better user experience with sponsored transactions
- **Easy Recovery**: Recover wallets using email or social logins
- **Cross-Platform**: Works seamlessly across all devices
- **No Seed Phrases**: User-friendly onboarding without complex key management

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI components
- **Web3**: Wagmi, Viem, Ethers.js
- **Wallet Integration**: MetaMask, Privy Account Abstraction
- **State Management**: React Query, React hooks

## How It's Made

### 🏗️ Architecture & Technology Stack

This project is built with a modern, scalable architecture that leverages cutting-edge Web3 technologies:

#### **Frontend Framework**
- **Next.js 15** with App Router for server-side rendering and optimal performance
- **React 19** with modern hooks and concurrent features
- **TypeScript** for type safety and better developer experience
- **Tailwind CSS** for utility-first styling with custom design system

#### **Web3 Infrastructure**
- **Hardhat** as the development framework for smart contract development and testing
- **Wagmi** for React hooks and utilities for Ethereum
- **Viem** for low-level Ethereum interactions
- **Ethers.js 6** for smart contract interactions

#### **Smart Contract Development**
- **Solidity 0.8.20** with OpenZeppelin contracts for security
- **Hardhat Toolbox** for comprehensive development tools
- **TypeChain** for TypeScript bindings generation
- **Hardhat Ignition** for deployment automation

### 🔗 Connection to Privy

The platform integrates **Privy Account Abstraction** to provide seamless smart wallet creation and management:

#### **Privy Configuration**
```typescript
<PrivyProvider 
  appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID}
  config={{
    loginMethods: ['email', 'wallet'],
    defaultChain: baseSepolia,
    supportedChains: [mainnet, sepolia, base, baseSepolia],
    embeddedWallets: {
      createOnLogin: 'users-without-wallets',
    },
  }}
>
```

#### **Smart Wallet Features**
- **Automatic Creation**: Smart wallets are created automatically when users sign in
- **Social Recovery**: Users can recover wallets using email or social logins
- **Cross-Chain Support**: Wallets work across multiple Ethereum networks
- **Gasless Transactions**: Sponsored transactions for better UX

#### **Integration Points**
- **WalletConnect Component**: Manages smart wallet creation and linking
- **useWallet Hook**: Custom hook for wallet state management
- **Account Abstraction**: Enhanced security without seed phrases

### 🔗 Connection to Base Sepolia Testnet

The platform is deployed and tested on **Base Sepolia testnet**, Coinbase's Layer 2 solution:

#### **Network Configuration**
```javascript
"base-sepolia": {
  url: "https://sepolia.base.org",
  chainId: 84532,
  gasPrice: 1000000000, // 1 gwei
  verify: {
    etherscan: {
      apiUrl: "https://api-sepolia.basescan.org"
    }
  }
}
```

#### **Why Base Sepolia?**
- **Low Gas Fees**: Layer 2 scaling solution with minimal transaction costs
- **Ethereum Compatibility**: Full EVM compatibility for easy development
- **Real USDC**: Uses actual USDC token on testnet for realistic testing
- **Fast Finality**: Quick transaction confirmation times
- **Developer Friendly**: Excellent tooling and documentation

#### **Chain Integration**
- **Wagmi Configuration**: Base Sepolia set as default chain
- **RPC Endpoints**: Direct connection to Base Sepolia RPC
- **Block Explorer**: Integration with BaseScan for transaction verification

### 🔗 Connection to Hardhat

**Hardhat** serves as the backbone for smart contract development and deployment:

#### **Development Environment**
```javascript
module.exports = {
  solidity: "0.8.20",
  networks: {
    hardhat: { chainId: 1337 },
    "base-sepolia": { /* Base Sepolia config */ }
  },
  etherscan: { /* Verification config */ }
}
```

#### **Hardhat Toolbox Features**
- **Hardhat Ethers**: Integration with Ethers.js for contract interactions
- **Hardhat Ignition**: Deployment automation and management
- **Hardhat Verify**: Contract verification on block explorers
- **Hardhat Gas Reporter**: Gas optimization analysis
- **Solidity Coverage**: Test coverage reporting

#### **Development Workflow**
1. **Local Development**: Hardhat network for testing
2. **Contract Compilation**: Automatic Solidity compilation
3. **Testing**: Comprehensive test suite with Chai assertions
4. **Deployment**: Automated deployment scripts
5. **Verification**: Contract verification on BaseScan

### 🚀 Deployment of VeriTix Contract on Base Sepolia

The smart contracts are deployed using a comprehensive deployment pipeline:

#### **Deployment Scripts**
```javascript
// scripts/deploy-auction.cjs
async function main() {
  // Deploy TicketToken
  const TicketToken = await ethers.getContractFactory("TicketToken");
  const ticketToken = await TicketToken.deploy(
    "https://api.example.com/tickets/{id}", 
    deployer.address
  );
  
  // Deploy TicketAuction
  const TicketAuction = await ethers.getContractFactory("TicketAuction");
  const ticketAuction = await TicketAuction.deploy(
    usdcAddress,        // Real USDC on Base Sepolia
    ticketTokenAddress, // Deployed ticket token
    coordinatorAddress, // Auction coordinator
    ownerAddress        // Contract owner
  );
}
```

#### **Deployed Contracts**
```json
{
  "network": "base-sepolia",
  "contracts": {
    "usdc": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    "ticketToken": "0xD252C2A8DC02Da67d5E8F5134D10a86759092784",
    "ticketAuction": "0x6E1A041298615362580065019E6Eab566dBC66a0"
  }
}
```

#### **Deployment Process**
1. **Environment Setup**: Configure private keys and RPC endpoints
2. **Contract Compilation**: Verify Solidity compilation
3. **Network Selection**: Target Base Sepolia testnet
4. **Sequential Deployment**: Deploy dependencies first
5. **Verification**: Verify contracts on BaseScan
6. **Testing**: Mint test tickets and verify functionality

### 🏛️ Smart Contract Architecture

#### **Core Contracts**
- **TicketToken**: ERC-1155 token for event tickets
- **TicketAuction**: Auction management and bidding system
- **USDC Integration**: Real USDC token for payments

#### **Key Features**
- **Bid Expiry System**: 2-minute automatic bidding windows
- **Buy Now Option**: Instant purchase at listed prices
- **Auction Management**: Comprehensive auction lifecycle
- **Security**: Reentrancy protection and access controls

#### **Smart Contract Benefits**
- **Decentralized**: No central authority controls the platform
- **Transparent**: All transactions visible on blockchain
- **Secure**: Audited OpenZeppelin contracts
- **Efficient**: Optimized gas usage for Layer 2

### 🔧 Development Tools & Workflow

#### **Local Development**
```bash
# Start local Hardhat network
npx hardhat node

# Run tests
npx hardhat test

# Deploy to local network
npx hardhat run scripts/deploy-auction.cjs --network localhost
```

#### **Testnet Deployment**
```bash
# Deploy to Base Sepolia
npx hardhat run scripts/deploy-auction.cjs --network base-sepolia

# Verify contracts
npx hardhat verify --network base-sepolia <contract-address>
```

#### **Testing & Quality Assurance**
- **Unit Tests**: Comprehensive contract testing
- **Integration Tests**: End-to-end workflow testing
- **Gas Optimization**: Continuous gas usage monitoring
- **Security Audits**: OpenZeppelin best practices

### 🌐 Frontend Integration

#### **Web3 Provider Setup**
```typescript
const config = createConfig({
  chains: [mainnet, sepolia, base, baseSepolia],
  connectors: [injected(), metaMask()],
  transports: {
    [baseSepolia.id]: http('https://sepolia.base.org'),
  },
})
```

#### **State Management**
- **React Query**: Server state management for blockchain data
- **Custom Hooks**: Specialized hooks for wallet and ticket management
- **Context Providers**: Web3 and authentication context

#### **Real-time Updates**
- **Blockchain Events**: Live updates from smart contract events
- **WebSocket Integration**: Real-time bid updates
- **Optimistic Updates**: Immediate UI feedback for better UX

This architecture provides a robust, scalable foundation for decentralized ticket trading while maintaining excellent user experience and developer productivity.

## 🌐 Privy Integration

Privy provides the embedded wallet infrastructure that powers VeriTix. It enables fans to buy, hold, and resell tickets with USDC inside the app, without needing external wallets or seed phrases.

### ✨ Features

- **Embedded Wallets** – Every user automatically gets a secure Privy wallet.
- **USDC Payments** – Fund the wallet with USDC and purchase tickets instantly.
- **Seamless UX** – Users interact with tickets like a regular app, while Privy handles the crypto behind the scenes.
- **Secure Auth** – Privy manages authentication and wallet recovery for safety.

### 🔧 Flow in VeriTix

1. **User signs up** → Privy auto-creates their wallet.
2. **User adds USDC** to wallet.
3. **User bids or buys tickets** directly in-app.
4. **Tickets are stored** in the Privy wallet.
5. **Resale is transparent, capped, and fair** — with proceeds flowing back to artists/organizers.

**Privy Documentation**: [https://docs.privy.io](https://docs.privy.io)

## 🌐 Flow Integration

We deploy ticketing logic as smart contracts on the **Flow Testnet**, making all resale actions trustless, transparent, and composable.

### Network Details
- **Network**: Flow Testnet
- **Contract Address**: `0x6DD6c968b1c28259B8075Fd569301a62714872aA`
- **Contract Name**: VeriTix

### ✨ Features

- **Bid on Tickets** – Place trustless, onchain bids.
- **Finalize Auction** – Highest valid bid wins, enforced by contract rules.
- **Transfer Ownership** – Tickets can be securely transferred onchain.
- **Composable Actions** – Every function is wrapped as a Flow Action with:
  - Metadata for discovery.
  - Built-in safety checks.
  - Atomic execution and verifiable outcomes.

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- MetaMask browser extension (optional)

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd ethglobal
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env.local
```

Add your configuration:

```env
NEXT_PUBLIC_PRIVY_APP_ID=your-privy-app-id
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your-wallet-connect-project-id
```

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout with providers
│   ├── page.tsx           # Main application page
│   ├── providers.tsx      # Web3 providers setup
│   └── globals.css        # Global styles
├── components/
│   ├── ui/                # Reusable UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── badge.tsx
│   └── tickets/           # Ticket-specific components
│       ├── TicketCard.tsx
│       ├── TicketGrid.tsx
│       ├── BidModal.tsx
│       ├── WalletConnect.tsx
│       └── SmartWalletFeatures.tsx
├── hooks/                 # Custom React hooks
│   ├── useWallet.ts       # Wallet connection logic
│   └── useTickets.ts      # Ticket data management
├── lib/                   # Utility functions
│   └── utils.ts
├── types/                 # TypeScript type definitions
│   └── index.ts
└── contracts/             # Smart contract interfaces
    └── interfaces.ts
```

## Bid Expiry System

The platform implements an automatic bid expiry system to create urgency and fair competition:

### How It Works

- **2-Minute Window**: When a seller lists a ticket, a 2-minute bidding window automatically starts
- **Real-time Countdown**: Each ticket card displays a live countdown timer showing remaining time
- **Automatic Expiry**: After 2 minutes, bidding is automatically disabled
- **Visual Indicators**: Expired tickets show "Bidding Expired" badges and disabled bid buttons

### User Experience

- **Countdown Timer**: Orange timer shows minutes:seconds remaining for bidding
- **Expired State**: Red "Bidding Ended" indicator when time expires
- **Disabled Actions**: Bid buttons and forms are automatically disabled after expiry
- **Buy Now Still Available**: Users can still purchase tickets at the listed price even after bidding expires

### Technical Implementation

- **Unix Timestamp**: `bidExpiryTime` field stores expiry as Unix timestamp
- **Client-side Validation**: Real-time checks prevent expired bidding
- **Server-side Persistence**: Expiry times are stored in the ticket database
- **Automatic Updates**: Countdown timers update every second

## Usage

### Smart Wallet Creation

1. **Create Smart Wallet**: Click "Create Smart Wallet" to generate a new account abstraction wallet
2. **Sign in with Privy**: Use email or social login to create a smart wallet
3. **Link External Wallets**: Connect existing MetaMask or other wallets to your smart wallet
4. **Manage Accounts**: View and manage all linked accounts from one interface

### Trading Tickets

1. **Browse**: View available tickets on the main page
2. **Bid**: Click "Place Bid" to enter a bid amount in USDC
3. **Buy**: Click "Buy Now" to purchase instantly at listed prices
4. **Manage**: View your tickets and bids in your profile

## Smart Contract Integration

The platform is designed to integrate with smart contracts for:

- Ticket NFT minting and transfer
- USDC payment processing
- Bid management and auction logic
- Royalty distribution
- Account abstraction wallet management

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@veritix.com or join our Discord community.

## Roadmap

- [ ] Smart contract deployment
- [ ] Multi-chain support
- [ ] Advanced auction features
- [ ] Mobile app
- [ ] Social features
- [ ] Analytics dashboard
- [ ] Enhanced account abstraction features
