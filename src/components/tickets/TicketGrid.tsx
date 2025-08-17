import React, { useState, useEffect } from 'react'
import { TicketCard } from './TicketCard'
import { Ticket, Auction } from '@/types'
import { useAuctions } from '@/hooks/useAuctions'
import { BidModal } from './BidModal'

interface Bid {
  id: string
  bidder: string
  amount: string
  tokenId: string
  tokenContractAddress: string
  recipient: string
  timestamp: number
  status: string
}

interface TicketGridProps {
  tickets: Ticket[]
  onBid?: (ticketId: string) => void
  onBuy?: (ticketId: string) => void
  currentUserAddress?: string
  isLoading?: boolean
}

export function TicketGrid({ tickets, onBid, onBuy, currentUserAddress, isLoading }: TicketGridProps) {
  const [userBids, setUserBids] = useState<Bid[]>([])
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [isBidModalOpen, setIsBidModalOpen] = useState(false)
  
  const { 
    auctions, 
    placeBid, 
    buyNow, 
    getUserBid, 
    canBid, 
    canBuyNow 
  } = useAuctions()

  // Fetch user's bids when component mounts or currentUserAddress changes
  useEffect(() => {
    const fetchUserBids = async () => {
      if (!currentUserAddress) {
        setUserBids([])
        return
      }

      try {
        const response = await fetch('/api/bids')
        if (response.ok) {
          const data = await response.json()
          // Filter bids for current user
          const userBids = data.bids.filter((bid: Bid) => bid.bidder === currentUserAddress)
          setUserBids(userBids)
        }
      } catch (error) {
        console.error('Error fetching user bids:', error)
      }
    }

    fetchUserBids()
  }, [currentUserAddress])

  // Helper function to get user's bid for a specific ticket
  const getUserBidForTicket = (ticket: Ticket) => {
    return userBids.find(bid => bid.tokenId === ticket.tokenId)
  }

  // Helper function to get auction for a ticket
  const getAuctionForTicket = (ticket: Ticket): Auction | undefined => {
    return auctions.find(auction => 
      auction.ticketId.toString() === ticket.tokenId && auction.isActive
    )
  }

  // Handle bid button click
  const handleBidClick = (ticketId: string, auctionId?: number) => {
    const ticket = tickets.find(t => t.id === ticketId)
    if (ticket) {
      setSelectedTicket(ticket)
      setIsBidModalOpen(true)
    }
  }

  // Handle buy button click
  const handleBuyClick = async (ticketId: string, auctionId?: number) => {
    if (auctionId) {
      // Handle auction buy now
      try {
        await buyNow(auctionId)
        // Refresh auctions after successful purchase
        // This would typically trigger a refresh of the data
      } catch (error) {
        console.error('Failed to execute buy now:', error)
      }
    } else {
      // Handle regular ticket purchase
      onBuy?.(ticketId)
    }
  }

  // Handle bid placement
  const handleBidPlaced = async (bidAmount: bigint) => {
    if (!selectedTicket) return
    
    const auction = getAuctionForTicket(selectedTicket)
    if (auction) {
      await placeBid(auction.auctionId, bidAmount)
    }
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-muted rounded-lg h-80"></div>
          </div>
        ))}
      </div>
    )
  }

  if (tickets.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground text-lg">
          No tickets available at the moment
        </div>
        <div className="text-sm text-muted-foreground mt-2">
          Check back later for new listings
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {tickets.map((ticket) => {
          const auction = getAuctionForTicket(ticket)
          const userBid = auction ? getUserBid(auction.auctionId) : getUserBidForTicket(ticket)
          
          // Debug logging
          if (ticket.isBlockchainAuction) {
            console.log('Blockchain ticket:', ticket.id, 'auction:', auction)
          }
          
          return (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              onBid={handleBidClick}
              onBuy={handleBuyClick}
              isOwner={currentUserAddress === ticket.seller}
              currentUserBid={userBid}
              auction={auction}
            />
          )
        })}
      </div>

      {/* Bid Modal */}
      {selectedTicket && (
        <BidModal
          ticket={selectedTicket}
          isOpen={isBidModalOpen}
          onClose={() => {
            setIsBidModalOpen(false)
            setSelectedTicket(null)
          }}
          onBidPlaced={handleBidPlaced}
          currentHighestBid={getAuctionForTicket(selectedTicket)?.highestBid}
        />
      )}
    </>
  )
}
