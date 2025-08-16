// TypeScript interfaces for TicketAuction contract
// Contract Address: 0x506D3f0e7C238555196C971b87Fc6C8Fdf8838bB
// Network: Base Sepolia

export interface Auction {
  auctionId: bigint;
  ticketId: bigint;
  ticketCount: bigint;
  startPrice: bigint;
  buyNowPrice: bigint;
  minIncrement: bigint;
  expiryTime: bigint;
  seller: string;
  highestBidder: string;
  highestBid: bigint;
  isActive: boolean;
  isSettled: boolean;
}

export interface AuctionCreatedEvent {
  auctionId: bigint;
  ticketId: bigint;
  ticketCount: bigint;
  startPrice: bigint;
  buyNowPrice: bigint;
  minIncrement: bigint;
  expiryTime: bigint;
  seller: string;
}

export interface BidPlacedEvent {
  auctionId: bigint;
  bidder: string;
  bidAmount: bigint;
}

export interface BuyNowExecutedEvent {
  auctionId: bigint;
  buyer: string;
  buyNowPrice: bigint;
}

export interface AuctionSettledEvent {
  auctionId: bigint;
  winner: string;
  winningBid: bigint;
}

export interface AuctionRefundedEvent {
  auctionId: bigint;
  seller: string;
}

export interface CoordinatorUpdatedEvent {
  oldCoordinator: string;
  newCoordinator: string;
}

// Function parameter types
export interface CreateAuctionParams {
  ticketId: bigint;
  ticketCount: bigint;
  startPrice: bigint;
  buyNowPrice: bigint;
  minIncrement: bigint;
  expiryTime: bigint;
}

export interface BidParams {
  auctionId: bigint;
  bidPrice: bigint;
}

export interface BuyNowParams {
  auctionId: bigint;
}

export interface SettleParams {
  auctionId: bigint;
}

export interface RefundParams {
  ticketId: bigint;
}

export interface GetAuctionParams {
  auctionId: bigint;
}

export interface GetActiveAuctionForTicketParams {
  ticketId: bigint;
}

export interface SetCoordinatorParams {
  newCoordinator: string;
}

export interface EmergencyWithdrawUSDParams {
  to: string;
}

export interface EmergencyWithdrawTicketsParams {
  ticketId: bigint;
  amount: bigint;
  to: string;
}

// Contract configuration
export const TICKET_AUCTION_CONFIG = {
  contractAddress: "0x506D3f0e7C238555196C971b87Fc6C8Fdf8838bB",
  network: "Base Sepolia",
  explorerUrl: "https://sepolia.basescan.org/address/0x506D3f0e7C238555196C971b87Fc6C8Fdf8838bB",
  usdcToken: "0x0000000000000000000000000000000000000000", // Mock USDC for testing
  ticketToken: "0xEc05b206132935F27A5e150c365eEE8D0906cE8b",
  coordinator: "0x1a624E2B6DB9dE48Ff3937E8CEAafaaCA9618AD2",
  owner: "0x1a624E2B6DB9dE48Ff3937E8CEAafaaCA9618AD2"
} as const;

// Event signatures for filtering
export const EVENT_SIGNATURES = {
  AuctionCreated: "AuctionCreated(uint256,uint256,uint256,uint256,uint256,uint256,uint256,address)",
  BidPlaced: "BidPlaced(uint256,address,uint256)",
  BuyNowExecuted: "BuyNowExecuted(uint256,address,uint256)",
  AuctionSettled: "AuctionSettled(uint256,address,uint256)",
  AuctionRefunded: "AuctionRefunded(uint256,address)",
  CoordinatorUpdated: "CoordinatorUpdated(address,address)"
} as const;

// Function signatures
export const FUNCTION_SIGNATURES = {
  createAuction: "createAuction(uint256,uint256,uint256,uint256,uint256,uint256)",
  bid: "bid(uint256,uint256)",
  buyNow: "buyNow(uint256)",
  settle: "settle(uint256)",
  refund: "refund(uint256)",
  getAuction: "getAuction(uint256)",
  getActiveAuctionForTicket: "getActiveAuctionForTicket(uint256)",
  setCoordinator: "setCoordinator(address)",
  emergencyWithdrawUSDC: "emergencyWithdrawUSDC(address)",
  emergencyWithdrawTickets: "emergencyWithdrawTickets(uint256,uint256,address)"
} as const;
