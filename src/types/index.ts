export interface Ticket {
  tokenContractAddress: string
  id: string
  eventName: string
  eventDate: string
  venue: string
  section: string
  row: string
  seat: string
  price: bigint
  seller: string
  tokenId: string
  isListed: boolean
  imageUrl?: string
  bidExpiryTime?: number // Unix timestamp when bidding expires
  auctionId?: number // ID of the auction this ticket is part of
  // Auction-specific fields
  isBlockchainAuction?: boolean
  startPrice?: bigint
  buyNowPrice?: bigint
  minIncrement?: bigint
  expiryTime?: bigint
  highestBid?: bigint
  highestBidder?: string
}

export interface Bid {
  id: string
  ticketId: string
  bidder: string
  amount: bigint
  timestamp: number
}

export interface Auction {
  auctionId: number
  ticketId: bigint
  ticketCount: bigint
  startPrice: bigint
  buyNowPrice: bigint
  minIncrement: bigint
  expiryTime: bigint
  seller: string
  highestBidder: string
  highestBid: bigint
  isActive: boolean
  isSettled: boolean
}

export interface User {
  address: string
  balance: bigint
  tickets: Ticket[]
  bids: Bid[]
}

export interface WalletConnection {
  isConnected: boolean
  address?: string
  provider?: any
}
