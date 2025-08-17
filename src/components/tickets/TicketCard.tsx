import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Ticket, Auction } from '@/types'
import { formatAddress, formatUSDC } from '@/lib/utils'
import { Calendar, Copy, MapPin, Ticket as TicketIcon, DollarSign, Clock } from 'lucide-react'

interface Bid {
  id: string
  bidder: string
  amount: string
  tokenId: string
  tokenContractAddress: string
  timestamp: number
  status: string
}

interface TicketCardProps {
  ticket: Ticket
  onBid?: (ticketId: string, auctionId?: number) => void
  onBuy?: (ticketId: string, auctionId?: number) => void
  isOwner?: boolean
  currentUserBid?: Bid
  auction?: Auction
}

export function TicketCard({ ticket, onBid, onBuy, isOwner, currentUserBid, auction }: TicketCardProps) {
  // Check if bidding has expired
  const isBiddingExpired = ticket.bidExpiryTime ? Date.now() / 1000 > ticket.bidExpiryTime : false
  
  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState<string>('')
  
  // Update countdown timer
  useEffect(() => {
    if (!ticket.bidExpiryTime) return
    
    const updateTimer = () => {
      const now = Date.now() / 1000
      const timeRemaining = ticket.bidExpiryTime! - now
      
      if (timeRemaining <= 0) {
        setTimeLeft('Expired')
        return
      }
      
      const minutes = Math.floor(timeRemaining / 60)
      const seconds = Math.floor(timeRemaining % 60)
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`)
    }
    
    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    
    return () => clearInterval(interval)
  }, [ticket.bidExpiryTime])
  
  return (
    <Card className="w-full max-w-sm hover:shadow-lg transition-shadow overflow-hidden">
      {/* Ticket Image */}
      {ticket.imageUrl && (
        <div className="w-full h-48 bg-muted overflow-hidden">
          <img
            src={ticket.imageUrl}
            alt={ticket.eventName}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to a default concert image if the main image fails
              e.currentTarget.src = "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400"
            }}
          />
        </div>
      )}
      
      <CardHeader>
        <div className="flex justify-between items-start gap-3">
          <CardTitle className="text-lg flex-1 min-w-0 break-words">{ticket.eventName}</CardTitle>
          <div className="flex gap-1">
            {(ticket as any).isBlockchainAuction ? (
              <Badge variant="default" className="flex-shrink-0 bg-green-600">
                🚀 Live Auction
              </Badge>
            ) : (
              <Badge variant={ticket.isListed ? "default" : "secondary"} className="flex-shrink-0">
                {ticket.isListed ? "Listed" : "Not Listed"}
              </Badge>
            )}
            {isBiddingExpired && (
              <Badge variant="destructive" className="flex-shrink-0">
                Bidding Expired
              </Badge>
            )}
          </div>
        </div>
        <CardDescription className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          {new Date(ticket.eventDate).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4" />
          <span>{ticket.venue || `${ticket.section}, Row ${ticket.row}, Seat ${ticket.seat}`}</span>
        </div>
        
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div>
            <span className="font-medium">Section:</span>
            <p>{ticket.section}</p>
          </div>
          <div>
            <span className="font-medium">Row:</span>
            <p>{ticket.row}</p>
          </div>
          <div>
            <span className="font-medium">Seat:</span>
            <p>{ticket.seat}</p>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TicketIcon className="h-4 w-4" />
            <span className="text-sm">Token ID: {ticket.tokenId}</span>
          </div>
        </div>
        
        <div className="border-t pt-3">
          {/* Special display for blockchain auctions */}
          {(ticket as any).isBlockchainAuction ? (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Starting Price:</span>
                <span className="text-lg font-bold">{formatUSDC(ticket.price)} USDC</span>
              </div>
              {(ticket as any).buyNowPrice && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Buy Now Price:</span>
                  <span className="text-lg font-bold text-green-600">{formatUSDC((ticket as any).buyNowPrice)} USDC</span>
                </div>
              )}
              {(ticket as any).highestBid && (ticket as any).highestBid.toString() !== "0" && (
                <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-950/20 p-2 rounded-md">
                  <span className="text-sm text-blue-600 font-medium">Current Bid:</span>
                  <span className="text-sm font-bold text-blue-600">{formatUSDC((ticket as any).highestBid)} USDC</span>
                </div>
              )}
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>Min Increment: {formatUSDC((ticket as any).minIncrement || BigInt(0))} USDC</span>
                <span>Expires: {new Date(Number((ticket as any).expiryTime || 0) * 1000).toLocaleDateString()}</span>
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Price:</span>
              <span className="text-lg font-bold">{formatUSDC(ticket.price)} USDC</span>
            </div>
          )}
          
          {/* Show countdown timer if bidExpiryTime exists */}
          {ticket.bidExpiryTime && (
            <div className="flex justify-between items-center bg-orange-50 dark:bg-orange-950/20 p-2 rounded-md mt-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-600" />
                <span className="text-sm text-orange-600 font-medium">
                  {isBiddingExpired ? 'Bidding Ended' : 'Time Left:'}
                </span>
              </div>
              <span className={`text-sm font-bold ${isBiddingExpired ? 'text-red-600' : 'text-orange-600'}`}>
                {timeLeft}
              </span>
            </div>
          )}
          
          {/* Show current user's bid if exists */}
          {currentUserBid && (
            <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-950/20 p-2 rounded-md mt-2">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-600 font-medium">Your Bid:</span>
              </div>
              <span className="text-sm font-bold text-blue-600">
                {formatUSDC(BigInt(currentUserBid.amount))} USDC
              </span>
            </div>
          )}
          
          {/* Only show contract address if it exists */}
          {ticket.tokenContractAddress && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Ticket Token Contract:</span>
              <span className="text-sm">{formatAddress(ticket.tokenContractAddress)}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigator.clipboard.writeText(ticket.tokenContractAddress)}
                className="h-6 w-6 p-0"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex gap-2">
        {!isOwner && (
          <>
            {/* Show bid button for auction tickets */}
            {auction && auction.isActive && !auction.isSettled && (
              <Button 
                onClick={() => onBid?.(ticket.id, auction.auctionId)} 
                className="flex-1"
                variant={currentUserBid ? "default" : "outline"}
                disabled={isBiddingExpired}
              >
                {isBiddingExpired ? 'Bidding Expired' : (currentUserBid ? 'Edit Bid' : 'Place Bid')}
              </Button>
            )}
            
            {/* Show buy now button for auction tickets with buy now price */}
            {auction && auction.isActive && !auction.isSettled && auction.buyNowPrice > BigInt(0) && (
              <Button 
                onClick={() => onBuy?.(ticket.id, auction.auctionId)} 
                className="flex-1"
                variant="default"
              >
                Buy Now ({formatUSDC(auction.buyNowPrice)} USDC)
              </Button>
            )}
            
            {/* Show regular buy button for non-auction tickets */}
            {!auction && ticket.isListed && (
              <>
                <Button 
                  onClick={() => onBid?.(ticket.id)} 
                  className="flex-1"
                  variant={currentUserBid ? "default" : "outline"}
                  disabled={isBiddingExpired}
                >
                  {isBiddingExpired ? 'Bidding Expired' : (currentUserBid ? 'Edit Bid' : 'Place Bid')}
                </Button>
                <Button 
                  onClick={() => onBuy?.(ticket.id)} 
                  className="flex-1"
                >
                  Buy Now
                </Button>
              </>
            )}
          </>
        )}
      </CardFooter>
    </Card>
  )
}
