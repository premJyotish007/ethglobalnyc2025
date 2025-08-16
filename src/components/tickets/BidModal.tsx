import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Ticket } from '@/types'
import { formatUSDC, parseUSDC } from '@/lib/utils'
import { DollarSign, X, Trash2 } from 'lucide-react'

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

interface BidModalProps {
  ticket: Ticket
  isOpen: boolean
  onClose: () => void
  onPlaceBid: (ticketId: string, amount: bigint, existingBidId?: string) => void
  onCancelBid?: (bidId: string) => void
  currentUserBid?: Bid
  isLoading?: boolean
}

export function BidModal({ ticket, isOpen, onClose, onPlaceBid, onCancelBid, currentUserBid, isLoading }: BidModalProps) {
  const [bidAmount, setBidAmount] = useState('')
  
  // Check if bidding has expired
  const isBiddingExpired = ticket.bidExpiryTime ? Date.now() / 1000 > ticket.bidExpiryTime : false

  // Set initial bid amount when modal opens or currentUserBid changes
  useEffect(() => {
    if (currentUserBid) {
      setBidAmount(formatUSDC(BigInt(currentUserBid.amount)))
    } else {
      setBidAmount('')
    }
  }, [currentUserBid, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (bidAmount && parseFloat(bidAmount) > 0) {
      // Pass existing bid ID if editing, otherwise undefined for new bid
      onPlaceBid(ticket.id, parseUSDC(bidAmount), currentUserBid?.id)
    }
  }

  const handleCancelBid = () => {
    if (currentUserBid && onCancelBid) {
      onCancelBid(currentUserBid.id)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>{currentUserBid ? 'Edit Bid' : 'Place Bid'}</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            {currentUserBid ? 'Edit your bid on' : 'Bid on'} {ticket.eventName} - Section {ticket.section}, Row {ticket.row}, Seat {ticket.seat}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {/* Show warning if bidding has expired */}
            {isBiddingExpired && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-red-600">⚠️ Bidding has expired for this ticket</span>
                </div>
                <p className="text-xs text-red-600 mt-1">
                  You can no longer place or edit bids on this ticket.
                </p>
              </div>
            )}
            
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Current Price:</span>
                <span className="font-semibold">{formatUSDC(ticket.price)} USDC</span>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="bidAmount" className="text-sm font-medium">
                  Your Bid Amount (USDC)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="bidAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isBiddingExpired}
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                {currentUserBid && onCancelBid && (
                  <Button 
                    type="button" 
                    variant="destructive" 
                    onClick={handleCancelBid}
                    className="flex-1"
                    disabled={isLoading}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Cancel Bid
                  </Button>
                )}
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={isLoading || !bidAmount || parseFloat(bidAmount) <= 0 || isBiddingExpired}
                >
                  {isLoading ? (currentUserBid ? 'Updating Bid...' : 'Placing Bid...') : (currentUserBid ? 'Update Bid' : 'Place Bid')}
                </Button>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
