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
}

export interface Bid {
  id: string
  ticketId: string
  bidder: string
  amount: bigint
  timestamp: number
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
