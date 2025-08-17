'use client'

import React, { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Ticket } from '@/types'
import { formatUSDC } from '@/lib/utils'
import { Calendar, MapPin, Ticket as TicketIcon, DollarSign, Gavel, Clock, CheckCircle } from 'lucide-react'
import { AUCTION_CONTRACT_ADDRESS, AUCTION_CONTRACT_ABI } from '@/lib/contract'

interface AuctionInfo {
  auctionId: string
  startPrice: string
  buyNowPrice: string
  highestBid: string
  highestBidder: string
  expiryTime: string
  isActive: boolean
  isSettled: boolean
}

interface MyTicketsProps {
  tickets: Ticket[]
  onRemoveTicket?: (ticketId: string) => void
  isLoading?: boolean
  userAddress?: string
}

export function MyTickets({ tickets, onRemoveTicket, isLoading, userAddress }: MyTicketsProps) {
  const [auctionInfo, setAuctionInfo] = useState<Record<string, AuctionInfo>>({})
  const [isLoadingAuctions, setIsLoadingAuctions] = useState(false)

  // Load auction information for tickets
  const loadAuctionInfo = async () => {
    if (!userAddress || !window.ethereum) return

    setIsLoadingAuctions(true)
    try {
      const provider = new ethers.JsonRpcProvider('https://sepolia.base.org');
      const auctionContract = new ethers.Contract(AUCTION_CONTRACT_ADDRESS!, AUCTION_CONTRACT_ABI, provider)
      
      const auctionPromises = tickets.map(async (ticket) => {
        try {
          const activeAuctionId = await auctionContract.getActiveAuctionForTicket(ticket.tokenId)
          if (activeAuctionId > 0) {
            const auction = await auctionContract.getAuction(activeAuctionId)
            return {
              tokenId: ticket.tokenId,
              auctionInfo: {
                auctionId: auction.auctionId.toString(),
                startPrice: formatUSDC(auction.startPrice),
                buyNowPrice: formatUSDC(auction.buyNowPrice),
                highestBid: auction.highestBid > 0 ? formatUSDC(auction.highestBid) : '0',
                highestBidder: auction.highestBidder,
                expiryTime: new Date(Number(auction.expiryTime) * 1000).toLocaleDateString(),
                isActive: auction.isActive,
                isSettled: auction.isSettled
              }
            }
          }
          return null
        } catch (error) {
          console.error(`Error loading auction for ticket ${ticket.tokenId}:`, error)
          return null
        }
      })

      const results = await Promise.all(auctionPromises)
      const auctionMap: Record<string, AuctionInfo> = {}
      
      results.forEach(result => {
        if (result) {
          auctionMap[result.tokenId] = result.auctionInfo
        }
      })

      setAuctionInfo(auctionMap)
    } catch (error) {
      console.error('Error loading auction info:', error)
    } finally {
      setIsLoadingAuctions(false)
    }
  }

  useEffect(() => {
    if (tickets.length > 0 && userAddress) {
      loadAuctionInfo()
    }
  }, [tickets, userAddress])

  const getAuctionStatusBadge = (auction: AuctionInfo) => {
    if (auction.isSettled) {
      return <Badge variant="secondary" className="flex items-center gap-1"><CheckCircle className="h-3 w-3" />Settled</Badge>
    }
    if (auction.isActive) {
      return <Badge variant="default" className="flex items-center gap-1"><Gavel className="h-3 w-3" />Active</Badge>
    }
    return <Badge variant="outline" className="flex items-center gap-1"><Clock className="h-3 w-3" />Pending</Badge>
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-4 bg-muted rounded animate-pulse" />
        <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
      </div>
    )
  }

  if (tickets.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <TicketIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Tickets Listed</h3>
          <p className="text-muted-foreground">
            You haven't listed any tickets for sale yet.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {tickets.map((ticket) => {
        const auction = auctionInfo[ticket.tokenId]
        
        return (
          <Card key={ticket.id} className="overflow-hidden">
            <div className="flex">
              {ticket.imageUrl && (
                <div className="w-24 h-24 bg-muted flex-shrink-0">
                  <img
                    src={ticket.imageUrl}
                    alt={ticket.eventName}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{ticket.eventName}</h3>
                      {auction && getAuctionStatusBadge(auction)}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(ticket.eventDate).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {ticket.venue}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm mb-2">
                      <span>Section {ticket.section}, Row {ticket.row}, Seat {ticket.seat}</span>
                      <div className="flex items-center gap-1 font-semibold text-green-600">
                        <DollarSign className="h-4 w-4" />
                        {formatUSDC(ticket.price)} USDC
                      </div>
                    </div>

                    {/* Auction Information */}
                    {auction && (
                      <div className="bg-muted/50 p-3 rounded-lg space-y-2">
                        <div className="text-sm font-medium text-muted-foreground">Auction Details</div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Start Price: </span>
                            <span className="font-medium">{auction.startPrice} USDC</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Buy Now: </span>
                            <span className="font-medium">{auction.buyNowPrice} USDC</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Highest Bid: </span>
                            <span className="font-medium">{auction.highestBid} USDC</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Expires: </span>
                            <span className="font-medium">{auction.expiryTime}</span>
                          </div>
                        </div>
                        {auction.highestBidder !== '0x0000000000000000000000000000000000000000' && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Current Leader: </span>
                            <span className="font-mono text-xs">{auction.highestBidder.slice(0, 6)}...{auction.highestBidder.slice(-4)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {onRemoveTicket && auction?.isActive && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRemoveTicket(ticket.id)}
                      >
                        Cancel Auction
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
