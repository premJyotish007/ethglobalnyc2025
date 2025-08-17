import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { AUCTION_CONTRACT_ADDRESS, AUCTION_CONTRACT_ABI, CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/contract'

// Function to load dummy tickets from JSON file
const loadDummyTickets = async (): Promise<any[]> => {
  try {
    const response = await fetch('/data/tickets.json')
    if (!response.ok) {
      throw new Error('Failed to fetch dummy tickets')
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error loading dummy tickets:', error)
    return []
  }
}

export interface ActiveAuction {
  auctionId: string
  ticketId: string
  ticketCount: number
  startPrice: bigint
  buyNowPrice: bigint
  minIncrement: bigint
  expiryTime: bigint
  seller: string
  highestBidder: string
  highestBid: bigint
  isActive: boolean
  isSettled: boolean
  ticketInfo?: {
    eventName: string
    section: string
    row: string
    seat: string
    eventDate: string
    price: string
    isActive: boolean
  }
}

export function useActiveAuctions() {
  const [auctions, setAuctions] = useState<ActiveAuction[]>([])
  const [dummyTickets, setDummyTickets] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchActiveAuctions = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Load dummy tickets first
      const dummyData = await loadDummyTickets()
      setDummyTickets(dummyData)

      // If wallet is connected, also fetch blockchain auctions
      if (window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum)
          
          // Create auction contract instance
          const auctionContract = new ethers.Contract(AUCTION_CONTRACT_ADDRESS!, AUCTION_CONTRACT_ABI, provider)
          
          // Create ticket contract instance to get ticket info
          const ticketContract = new ethers.Contract(CONTRACT_ADDRESS!, CONTRACT_ABI, provider)
          
          const activeAuctions: ActiveAuction[] = []
          
          // Check first 10 auction IDs for active auctions
          for (let i = 1; i <= 10; i++) {
            try {
              const auction = await auctionContract.getAuction(i)
              
              // Check if auction exists and is active
              if (auction && auction.auctionId.toString() !== "0" && auction.isActive && !auction.isSettled) {
                // Get ticket info for this auction
                let ticketInfo
                try {
                  const [ticketData, isUsed] = await ticketContract.getTicketInfo(auction.ticketId)
                  ticketInfo = {
                    eventName: ticketData.eventName,
                    section: ticketData.section,
                    row: ticketData.row,
                    seat: ticketData.seat,
                    eventDate: new Date(Number(ticketData.eventDate) * 1000).toLocaleDateString(),
                    price: ethers.formatUnits(ticketData.price, 6),
                    isActive: ticketData.isActive
                  }
                } catch (error) {
                  console.log(`Could not get ticket info for token ID ${auction.ticketId}:`, error)
                }

                activeAuctions.push({
                  auctionId: auction.auctionId.toString(),
                  ticketId: auction.ticketId.toString(),
                  ticketCount: Number(auction.ticketCount),
                  startPrice: auction.startPrice,
                  buyNowPrice: auction.buyNowPrice,
                  minIncrement: auction.minIncrement,
                  expiryTime: auction.expiryTime,
                  seller: auction.seller,
                  highestBidder: auction.highestBidder,
                  highestBid: auction.highestBid,
                  isActive: auction.isActive,
                  isSettled: auction.isSettled,
                  ticketInfo
                })
              }
            } catch (error) {
              // Auction doesn't exist or error occurred, continue to next
              continue
            }
          }
          
          setAuctions(activeAuctions)
          
        } catch (error: any) {
          console.error('Error fetching blockchain auctions:', error)
          // Don't set error for blockchain issues, just continue with dummy data
        }
      }
      
    } catch (error: any) {
      console.error('Error fetching data:', error)
      setError(error.message || 'Failed to fetch data')
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch auctions on mount
  useEffect(() => {
    fetchActiveAuctions()
  }, [])

  return {
    auctions,
    dummyTickets,
    isLoading,
    error,
    refreshAuctions: fetchActiveAuctions
  }
}
