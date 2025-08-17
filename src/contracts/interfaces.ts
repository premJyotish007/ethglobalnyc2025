export interface TicketContract {
  // Ticket management
  mintTicket(
    eventName: string,
    eventDate: string,
    venue: string,
    section: string,
    row: string,
    seat: string,
    price: bigint
  ): Promise<string>
  
  listTicket(tokenId: string, price: bigint): Promise<void>
  
  unlistTicket(tokenId: string): Promise<void>
  
  transferTicket(tokenId: string, to: string): Promise<void>
  
  // Bidding system
  placeBid(tokenId: string, amount: bigint): Promise<void>
  
  acceptBid(tokenId: string, bidId: string): Promise<void>
  
  withdrawBid(bidId: string): Promise<void>
  
  // Query functions
  getTicket(tokenId: string): Promise<TicketData>
  
  getBids(tokenId: string): Promise<BidData[]>
  
  getUserTickets(user: string): Promise<string[]>
  
  getUserBids(user: string): Promise<BidData[]>
}

export interface TicketData {
  tokenId: string
  eventName: string
  eventDate: string
  venue: string
  section: string
  row: string
  seat: string
  owner: string
  price: bigint
  isListed: boolean
  metadata: string
}

export interface BidData {
  id: string
  tokenId: string
  bidder: string
  amount: bigint
  timestamp: bigint
  isActive: boolean
}

export interface USDCContract {
  balanceOf(account: string): Promise<bigint>
  
  transfer(to: string, amount: bigint): Promise<boolean>
  
  transferFrom(from: string, to: string, amount: bigint): Promise<boolean>
  
  approve(spender: string, amount: bigint): Promise<boolean>
  
  allowance(owner: string, spender: string): Promise<bigint>
}

export interface TicketAuctionContract {
  // Auction management
  createAuction(
    ticketId: bigint,
    ticketCount: bigint,
    startPrice: bigint,
    buyNowPrice: bigint,
    minIncrement: bigint,
    expiryTime: bigint
  ): Promise<bigint>
  
  // Bidding
  bid(auctionId: bigint, bidPrice: bigint): Promise<void>
  
  // Buy now
  buyNow(auctionId: bigint): Promise<void>
  
  // Query functions
  getAuction(auctionId: bigint): Promise<AuctionData>
  
  getActiveAuctionForTicket(ticketId: bigint): Promise<bigint>
  
  // Admin functions
  settle(auctionId: bigint): Promise<void>
  
  refund(ticketId: bigint): Promise<void>
}

export interface AuctionData {
  auctionId: bigint
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
