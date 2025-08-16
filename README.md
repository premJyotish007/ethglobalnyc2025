# TicketBid - Decentralized Ticket Trading Platform

A modern, decentralized platform for trading tokenized event tickets using USDC on the blockchain. Built with Next.js, TypeScript, and Web3 technologies featuring **Privy Account Abstraction** for seamless smart wallet creation.

## Features

- 🔗 **Smart Wallet Creation**: Create Privy account abstraction smart wallets on the fly
- 🎫 **Tokenized Tickets**: Trade event tickets as NFTs
- 💰 **USDC Payments**: All transactions use USDC stablecoin
- 🏷️ **Bidding System**: Place bids on tickets or buy instantly
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

For support, email support@ticketbid.com or join our Discord community.

## Roadmap

- [ ] Smart contract deployment
- [ ] Multi-chain support
- [ ] Advanced auction features
- [ ] Mobile app
- [ ] Social features
- [ ] Analytics dashboard
- [ ] Enhanced account abstraction features
